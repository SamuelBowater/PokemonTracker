import Link from "next/link";
import { TRACKED_SETS } from "@/lib/sets";
import { getSet } from "@/lib/tcgdex";
import { getOwnedCardIds } from "@/lib/owned";

export const revalidate = 0;

export default async function HomePage() {
  const summaries = await Promise.all(
    TRACKED_SETS.map(async ({ id, name }) => {
      const [set, owned] = await Promise.all([
        getSet(id),
        getOwnedCardIds(id),
      ]);
      return {
        id,
        name,
        logo: set.logo,
        total: set.cards.length,
        owned: owned.size,
      };
    })
  );

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">My Card Collection</h1>
      <p className="text-slate-400 mb-6">Mega Evolution series</p>

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
                {set.owned} / {set.total} owned ({pct}%)
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
