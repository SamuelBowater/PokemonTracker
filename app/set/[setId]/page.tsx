import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACKED_SETS } from "@/lib/sets";
import { getSet } from "@/lib/tcgdex";
import { getOwnedCardIds } from "@/lib/owned";
import CardGrid from "@/components/CardGrid";

export const revalidate = 0;

export default async function SetPage({
  params,
}: {
  params: { setId: string };
}) {
  const meta = TRACKED_SETS.find((s) => s.id === params.setId);
  if (!meta) notFound();

  const [set, ownedIds] = await Promise.all([
    getSet(params.setId),
    getOwnedCardIds(params.setId),
  ]);

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <Link href="/" className="text-slate-400 text-sm mb-2 inline-block">
        &larr; All sets
      </Link>
      <h1 className="text-xl font-bold mb-4">{meta.name}</h1>
      <CardGrid
        setId={params.setId}
        cards={set.cards}
        initialOwnedIds={Array.from(ownedIds)}
      />
    </main>
  );
}
