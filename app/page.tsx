import Link from "next/link";
import { TRACKED_SETS } from "@/lib/sets";
import { getSet, formatGBP, variantsOf } from "@/lib/tcgdex";
import { getOwnedVariantKeys } from "@/lib/owned";
import { ownedKey } from "@/lib/ownedKey";

export const revalidate = 0;

export default async function HomePage() {
  const summaries = await Promise.all(
    TRACKED_SETS.map(async ({ id, name }) => {
      const [set, ownedKeys] = await Promise.all([
        getSet(id),
        getOwnedVariantKeys(id),
      ]);
      const total = set.cards.reduce((sum, card) => sum + variantsOf(card).length, 0);

      let value = 0;
      let remaining = 0;
      for (const card of set.cards) {
        for (const variant of variantsOf(card)) {
          const price = card.prices[variant] ?? 0;
          if (ownedKeys.has(ownedKey(card.id, variant))) {
            value += price;
          } else {
            remaining += price;
          }
        }
      }

      return {
        id,
        name,
        logo: set.logo,
        total,
        owned: ownedKeys.size,
        value,
        remaining,
      };
    })
  );

  const grandTotalValue = summaries.reduce((sum, set) => sum + set.value, 0);
  const grandTotalRemaining = summaries.reduce((sum, set) => sum + set.remaining, 0);

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">My Card Collection</h1>
      <p className="text-slate-400 mb-1">Mega Evolution series</p>
      <p className="text-emerald-400 font-medium">
        Total collection value: {formatGBP(grandTotalValue)}
      </p>
      <p className="text-amber-400 font-medium mb-6">
        Remaining to finish all sets: {formatGBP(grandTotalRemaining)}
      </p>

      <div className="flex flex-col gap-4">
        {summaries.map((set) => {
          const pct = set.total ? Math.round((set.owned / set.total) * 100) : 0;
          return (
            <Link
              key={set.id}
              href={`/set/${set.id}`}
              className="block rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors p-4 border border-slate-800"
            >
              <div className="flex items-center gap-3 mb-3">
                {set.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${set.logo}.png`}
                    alt={set.name}
                    className="h-8 object-contain"
                  />
                )}
                <span className="font-semibold text-lg">{set.name}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {set.owned} / {set.total} variants owned ({pct}%)
              </div>
              <div className="text-sm text-emerald-400 mt-0.5">
                Value: {formatGBP(set.value)}
              </div>
              <div className="text-sm text-amber-400 mt-0.5">
                Remaining: {formatGBP(set.remaining)}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
