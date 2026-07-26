import Link from "next/link";
import { notFound } from "next/navigation";
import { SERIES, SeriesId, setsInSeries } from "@/lib/sets";
import { formatGBP } from "@/lib/tcgdex";
import { getSetSummaries, sumStats } from "@/lib/collectionStats";

export const revalidate = 0;

export default async function SeriesPage({
  params,
}: {
  params: { seriesId: string };
}) {
  const series = SERIES.find((s) => s.id === params.seriesId);
  if (!series) notFound();

  const sets = setsInSeries(series.id as SeriesId);
  const summaries = await getSetSummaries(sets);
  const total = sumStats(summaries);

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <Link href="/" className="text-slate-400 text-sm mb-2 inline-block">
        &larr; All series
      </Link>
      <h1 className="text-2xl font-bold mb-1">{series.name}</h1>
      <p className="text-emerald-400 font-medium">
        Total collection value: {formatGBP(total.value)}
      </p>
      <p className="text-amber-400 font-medium">
        Remaining to finish: {formatGBP(total.remaining)}
      </p>
      <p className="text-sky-400 font-medium mb-6">
        Duplicates (tradeable): {formatGBP(total.duplicateValue)}
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
              <div className="text-sm text-sky-400 mt-0.5">
                Duplicates: {formatGBP(set.duplicateValue)}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
