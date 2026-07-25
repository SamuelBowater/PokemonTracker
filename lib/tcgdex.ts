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

async function getCardVariants(cardId: string): Promise<CardVariants> {
  const res = await fetch(`${TCGDEX_BASE}/cards/${cardId}`, {
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch card ${cardId}: ${res.status}`);
  }
  const data = await res.json();
  return data.variants;
}

export async function getSet(setId: string): Promise<TcgdexSet> {
  const res = await fetch(`${TCGDEX_BASE}/sets/${setId}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch set ${setId}: ${res.status}`);
  }
  const briefSet: BriefSet = await res.json();

  const cards = await mapWithConcurrency(briefSet.cards, 20, async (card) => ({
    ...card,
    variants: await getCardVariants(card.id),
  }));

  return { ...briefSet, cards };
}
