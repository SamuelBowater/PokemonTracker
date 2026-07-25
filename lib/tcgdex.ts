const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

export interface TcgdexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
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

export function cardImageUrl(card: TcgdexCard, quality: "low" | "high" = "high") {
  if (!card.image) return null;
  return `${card.image}/${quality}.png`;
}

export async function getSet(setId: string): Promise<TcgdexSet> {
  const res = await fetch(`${TCGDEX_BASE}/sets/${setId}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch set ${setId}: ${res.status}`);
  }
  return res.json();
}
