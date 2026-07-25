"use client";

import { useMemo, useState } from "react";
import { TcgdexCard } from "@/lib/tcgdex";
import { setCardOwned } from "@/app/actions";
import CardTile from "./CardTile";

type Filter = "all" | "owned" | "needed";

export default function CardGrid({
  setId,
  cards,
  initialOwnedIds,
}: {
  setId: string;
  cards: TcgdexCard[];
  initialOwnedIds: string[];
}) {
  const [ownedIds, setOwnedIds] = useState(new Set(initialOwnedIds));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const isOwned = ownedIds.has(card.id);
      if (filter === "owned" && !isOwned) return false;
      if (filter === "needed" && isOwned) return false;
      if (query && !card.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [cards, ownedIds, filter, query]);

  async function toggleCard(card: TcgdexCard) {
    const isOwned = ownedIds.has(card.id);
    const next = new Set(ownedIds);
    if (isOwned) {
      next.delete(card.id);
    } else {
      next.add(card.id);
    }
    setOwnedIds(next);

    try {
      await setCardOwned(card.id, setId, !isOwned);
    } catch (err) {
      console.error("Failed to save owned status", err);
      setOwnedIds(ownedIds);
    }
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cards..."
        className="w-full mb-3 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />

      <div className="flex gap-2 mb-4">
        {(["all", "owned", "needed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm capitalize border ${
              filter === f
                ? "bg-emerald-500 border-emerald-500 text-slate-950"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-400 mb-3">
        {ownedIds.size} / {cards.length} owned
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filteredCards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            owned={ownedIds.has(card.id)}
            onToggle={() => toggleCard(card)}
          />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <p className="text-center text-slate-500 mt-8">No cards match.</p>
      )}
    </div>
  );
}
