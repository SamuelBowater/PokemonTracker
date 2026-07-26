import { getSet, variantsOf } from "./tcgdex";
import { getOwnedVariantQuantities } from "./owned";
import { ownedKey } from "./ownedKey";

export interface SetSummary {
  id: string;
  name: string;
  logo?: string;
  total: number;
  owned: number;
  value: number;
  remaining: number;
  duplicateValue: number;
}

export async function getSetSummaries(
  sets: readonly { id: string; name: string }[]
): Promise<SetSummary[]> {
  return Promise.all(
    sets.map(async ({ id, name }) => {
      const [set, ownedQuantities] = await Promise.all([
        getSet(id),
        getOwnedVariantQuantities(id),
      ]);
      const total = set.cards.reduce((sum, card) => sum + variantsOf(card).length, 0);

      let owned = 0;
      let value = 0;
      let remaining = 0;
      let duplicateValue = 0;
      for (const card of set.cards) {
        for (const variant of variantsOf(card)) {
          const price = card.prices[variant] ?? 0;
          const qty = ownedQuantities.get(ownedKey(card.id, variant)) ?? 0;
          if (qty > 0) {
            owned += 1;
            value += price * qty;
            duplicateValue += price * (qty - 1);
          } else {
            remaining += price;
          }
        }
      }

      return { id, name, logo: set.logo, total, owned, value, remaining, duplicateValue };
    })
  );
}

export function sumStats(summaries: SetSummary[]) {
  return summaries.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      owned: acc.owned + s.owned,
      value: acc.value + s.value,
      remaining: acc.remaining + s.remaining,
      duplicateValue: acc.duplicateValue + s.duplicateValue,
    }),
    { total: 0, owned: 0, value: 0, remaining: 0, duplicateValue: 0 }
  );
}
