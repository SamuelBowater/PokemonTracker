import Link from "next/link";
import { SERIES, TRACKED_SETS, setsInSeries } from "@/lib/sets";
import { formatGBP } from "@/lib/tcgdex";
import { getSetSummaries, sumStats } from "@/lib/collectionStats";

export const revalidate = 0;

export default async function HomePage() {
  const allSummaries = await getSetSummaries(TRACKED_SETS);
  const grandTotal = sumStats(allSummaries);

  const seriesStats = SERIES.map((series) => {
    const setIds = new Set<string>(setsInSeries(series.id).map((s) => s.id));
    const summaries = allSummaries.filter((s) => setIds.has(s.id));
    return { ...series, ...sumStats(summaries), setCount: summaries.length };
  });

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">My Card Collection</h1>
      <p className="text-slate-400 mb-1">Pok&eacute;mon TCG</p>
      <p className="text-emerald-400 font-medium">
        Total collection value: {formatGBP(grandTotal.value)}
      </p>
      <p className="text-amber-400 font-medium">
        Remaining to finish all sets: {formatGBP(grandTotal.remaining)}
      </p>
      <p className="text-sky-400 font-medium mb-6">
        Duplicates (tradeable): {formatGBP(grandTotal.duplicateValue)}
      </p>

      <div className="flex flex-col gap-4">
        {seriesStats.map((series) => {
          const pct = series.total ? Math.round((series.owned / series.total) * 100) : 0;
          return (
            <Link
              key={series.id}
              href={`/series/${series.id}`}
              className="block rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors p-4 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">{series.name}</span>
                <span className="text-xs text-slate-500">
                  {series.setCount} set{series.setCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {series.owned} / {series.total} variants owned ({pct}%)
              </div>
              <div className="text-sm text-emerald-400 mt-0.5">
                Value: {formatGBP(series.value)}
              </div>
              <div className="text-sm text-amber-400 mt-0.5">
                Remaining: {formatGBP(series.remaining)}
              </div>
              <div className="text-sm text-sky-400 mt-0.5">
                Duplicates: {formatGBP(series.duplicateValue)}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
