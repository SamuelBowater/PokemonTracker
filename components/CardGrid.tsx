"use client";

import { useMemo, useState } from "react";
import { TcgdexCard, VariantKey, formatGBP, variantsOf } from "@/lib/tcgdex";
import { ownedKey } from "@/lib/ownedKey";
import { setVariantOwned } from "@/app/actions";
import CardTile from "./CardTile";

type Filter = "all" | "owned" | "needed";

export default function CardGrid({
  setId,
  cards,
  initialOwnedKeys,
}: {
  setId: string;
  cards: TcgdexCard[];
  initialOwnedKeys: string[];
}) {
  const [ownedKeys, setOwnedKeys] = useState(new Set(initialOwnedKeys));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const totalVariants = useMemo(
    () => cards.reduce((sum, card) => sum + variantsOf(card).length, 0),
    [cards]
  );

  const ownedValue = useMemo(() => {
    let total = 0;
    for (const card of cards) {
      for (const variant of variantsOf(card)) {
        if (ownedKeys.has(ownedKey(card.id, variant))) {
          total += card.prices[variant] ?? 0;
        }
      }
    }
    return total;
  }, [cards, ownedKeys]);

  function isCardComplete(card: TcgdexCard) {
    return variantsOf(card).every((v) => ownedKeys.has(ownedKey(card.id, v)));
  }

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filter === "owned" && !isCardComplete(card)) return false;
      if (filter === "needed" && isCardComplete(card)) return false;
      if (query && !card.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, ownedKeys, filter, query]);

  async function toggleVariant(card: TcgdexCard, variant: VariantKey) {
    const key = ownedKey(card.id, variant);
    const isOwned = ownedKeys.has(key);
    const next = new Set(ownedKeys);
    if (isOwned) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setOwnedKeys(next);

    try {
      await setVariantOwned(card.id, setId, variant, !isOwned);
    } catch (err) {
      console.error("Failed to save owned status", err);
      setOwnedKeys(ownedKeys);
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
        {ownedKeys.size} / {totalVariants} variants owned &middot;{" "}
        {cards.filter(isCardComplete).length} / {cards.length} cards complete
        <div className="text-emerald-400 font-medium mt-0.5">
          Collection value: {formatGBP(ownedValue)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filteredCards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            ownedVariants={
              new Set(
                variantsOf(card).filter((v) => ownedKeys.has(ownedKey(card.id, v)))
              )
            }
            onToggleVariant={(variant) => toggleVariant(card, variant)}
          />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <p className="text-center text-slate-500 mt-8">No cards match.</p>
      )}
    </div>
  );
}
