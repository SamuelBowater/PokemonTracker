const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

export type VariantKey = "normal" | "reverse" | "holo" | "firstEdition";

export const VARIANT_LABELS: Record<VariantKey, string> = {
  normal: "Normal",
  reverse: "Reverse",
  holo: "Holo",
  firstEdition: "1st Ed",
};

export interface CardVariants {
  normal: boolean;
  reverse: boolean;
  holo: boolean;
  firstEdition: boolean;
}

export interface TcgdexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  variants: CardVariants;
  /** GBP market price per owned variant, when a price could be determined. */
  prices: Partial<Record<VariantKey, number>>;
}

export interface TcgdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount: {
    total: number;
    official: number;
  };
  cards: TcgdexCard[];
}

interface BriefCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface BriefSet extends Omit<TcgdexSet, "cards"> {
  cards: BriefCard[];
}

export function cardImageUrl(card: TcgdexCard, quality: "low" | "high" = "high") {
  if (!card.image) return null;
  return `${card.image}/${quality}.png`;
}

export function variantsOf(card: TcgdexCard): VariantKey[] {
  return (Object.keys(VARIANT_LABELS) as VariantKey[]).filter(
    (key) => card.variants[key]
  );
}

/** Runs async tasks with a bounded number in flight, to avoid hammering the API. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface TcgPlayerVariantPricing {
  marketPrice?: number | null;
  midPrice?: number | null;
  lowPrice?: number | null;
}

interface RawPricing {
  tcgplayer?: {
    unit: "USD";
    normal?: TcgPlayerVariantPricing;
    holofoil?: TcgPlayerVariantPricing;
    "reverse-holofoil"?: TcgPlayerVariantPricing;
    "1st-edition"?: TcgPlayerVariantPricing;
    "1st-edition-holofoil"?: TcgPlayerVariantPricing;
  };
  cardmarket?: {
    unit: "EUR";
    avg?: number | null;
    "avg-holo"?: number | null;
  };
}

type TcgPlayerKey = Exclude<keyof NonNullable<RawPricing["tcgplayer"]>, "unit">;

const TCGPLAYER_VARIANT_KEY: Record<VariantKey, TcgPlayerKey> = {
  normal: "normal",
  reverse: "reverse-holofoil",
  holo: "holofoil",
  firstEdition: "1st-edition",
};

interface FxRates {
  usdToGbp: number;
  eurToGbp: number;
}

async function getFxRates(): Promise<FxRates> {
  const [usd, eur] = await Promise.all([
    fetch("https://api.frankfurter.dev/v1/latest?from=USD&to=GBP", {
      next: { revalidate: 60 * 60 * 12 },
    }),
    fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=GBP", {
      next: { revalidate: 60 * 60 * 12 },
    }),
  ]);

  if (!usd.ok || !eur.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const [usdData, eurData] = await Promise.all([usd.json(), eur.json()]);
  return {
    usdToGbp: usdData.rates.GBP,
    eurToGbp: eurData.rates.GBP,
  };
}

function pricesInGbp(
  pricing: RawPricing | undefined,
  variants: VariantKey[],
  fx: FxRates
): Partial<Record<VariantKey, number>> {
  const prices: Partial<Record<VariantKey, number>> = {};
  if (!pricing) return prices;

  for (const variant of variants) {
    const tp = pricing.tcgplayer?.[TCGPLAYER_VARIANT_KEY[variant]];
    const usdPrice = tp?.marketPrice ?? tp?.midPrice ?? tp?.lowPrice;
    if (usdPrice != null) {
      prices[variant] = usdPrice * fx.usdToGbp;
      continue;
    }

    const isFoilish = variant === "holo" || variant === "reverse" || variant === "firstEdition";
    const eurPrice = isFoilish
      ? pricing.cardmarket?.["avg-holo"] ?? pricing.cardmarket?.avg
      : pricing.cardmarket?.avg;
    if (eurPrice != null) {
      prices[variant] = eurPrice * fx.eurToGbp;
    }
  }

  return prices;
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

async function getCardDetail(
  cardId: string
): Promise<{ variants: CardVariants; pricing?: RawPricing }> {
  const res = await fetch(`${TCGDEX_BASE}/cards/${cardId}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch card ${cardId}: ${res.status}`);
  }
  const data = await res.json();
  return {
    variants: normalizeVariants(data.variants, data.rarity),
    pricing: data.pricing,
  };
}

/** Rarities where a card only ever gets a single holo-exclusive print (ex, secret rares, etc). */
const HOLO_EXCLUSIVE_RARITIES = new Set(["Common", "Uncommon", "Rare"]);

/**
 * TCGdex's crowdsourced variant data is inconsistent for these newer sets:
 *  - Plain commons/uncommons are sometimes missing `reverse: true`, even
 *    though every normal print in this TCG era also gets a reverse holo
 *    print (e.g. Chaos Rising's Weedle).
 *  - Plain "Rare" cards are sometimes wrongly flagged `normal: true`
 *    alongside `holo: true` - in reality a Rare (non-ex) card in this era is
 *    always holo, with no separate non-holo print (e.g. Perfect Order's
 *    Dewgong/Aurorus only really exist as Holo + Reverse, not Normal too).
 * ex / Double rare / Special illustration rare / etc are genuinely
 * single-print holo-exclusive cards, so their flags are trusted as-is.
 */
function normalizeVariants(variants: CardVariants, rarity: string): CardVariants {
  if (!HOLO_EXCLUSIVE_RARITIES.has(rarity)) {
    return variants;
  }
  return {
    ...variants,
    normal: variants.holo ? false : variants.normal,
    reverse: true,
  };
}

export async function getSet(setId: string): Promise<TcgdexSet> {
  const res = await fetch(`${TCGDEX_BASE}/sets/${setId}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch set ${setId}: ${res.status}`);
  }
  const briefSet: BriefSet = await res.json();
  const fx = await getFxRates().catch((err) => {
    console.error("Failed to fetch exchange rates", err);
    return null;
  });

  const cards = await mapWithConcurrency(briefSet.cards, 20, async (card) => {
    const { variants, pricing } = await getCardDetail(card.id);
    const owned = variantsOf({ ...card, variants } as TcgdexCard);
    return {
      ...card,
      variants,
      prices: fx ? pricesInGbp(pricing, owned, fx) : {},
    };
  });

  return { ...briefSet, cards };
}
