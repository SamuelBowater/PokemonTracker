"use client";

import { useMemo, useState } from "react";
import { TcgdexCard, VariantKey, formatGBP, variantsOf } from "@/lib/tcgdex";
import { ownedKey } from "@/lib/ownedKey";
import { setVariantOwned, setVariantQuantity } from "@/app/actions";
import CardTile from "./CardTile";

type Filter = "all" | "owned" | "needed";

export default function CardGrid({
  setId,
  setName,
  cards,
  initialQuantities,
}: {
  setId: string;
  setName: string;
  cards: TcgdexCard[];
  initialQuantities: [string, number][];
}) {
  const [quantities, setQuantities] = useState(new Map(initialQuantities));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  function quantityOf(cardId: string, variant: VariantKey) {
    return quantities.get(ownedKey(cardId, variant)) ?? 0;
  }

  const totalVariants = useMemo(
    () => cards.reduce((sum, card) => sum + variantsOf(card).length, 0),
    [cards]
  );

  const ownedVariantCount = useMemo(() => {
    let count = 0;
    for (const card of cards) {
      for (const variant of variantsOf(card)) {
        if (quantityOf(card.id, variant) > 0) count++;
      }
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, quantities]);

  const { ownedValue, remainingValue, duplicateValue } = useMemo(() => {
    let owned = 0;
    let remaining = 0;
    let duplicate = 0;
    for (const card of cards) {
      for (const variant of variantsOf(card)) {
        const price = card.prices[variant] ?? 0;
        const qty = quantityOf(card.id, variant);
        if (qty > 0) {
          owned += price * qty;
          duplicate += price * (qty - 1);
        } else {
          remaining += price;
        }
      }
    }
    return { ownedValue: owned, remainingValue: remaining, duplicateValue: duplicate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, quantities]);

  function isCardComplete(card: TcgdexCard) {
    return variantsOf(card).every((v) => quantityOf(card.id, v) > 0);
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
  }, [cards, quantities, filter, query]);

  async function applyQuantity(card: TcgdexCard, variant: VariantKey, quantity: number) {
    const key = ownedKey(card.id, variant);
    const previous = quantities;
    const next = new Map(quantities);
    if (quantity > 0) {
      next.set(key, quantity);
    } else {
      next.delete(key);
    }
    setQuantities(next);

    try {
      if (quantity <= 1) {
        await setVariantOwned(card.id, setId, variant, quantity === 1);
      } else {
        await setVariantQuantity(card.id, setId, variant, quantity);
      }
    } catch (err) {
      console.error("Failed to save owned status", err);
      setQuantities(previous);
    }
  }

  function toggleVariant(card: TcgdexCard, variant: VariantKey) {
    const isOwned = quantityOf(card.id, variant) > 0;
    applyQuantity(card, variant, isOwned ? 0 : 1);
  }

  function adjustQuantity(card: TcgdexCard, variant: VariantKey, delta: number) {
    const next = Math.max(0, quantityOf(card.id, variant) + delta);
    applyQuantity(card, variant, next);
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
        {ownedVariantCount} / {totalVariants} variants owned &middot;{" "}
        {cards.filter(isCardComplete).length} / {cards.length} cards complete
        <div className="text-emerald-400 font-medium mt-0.5">
          Collection value: {formatGBP(ownedValue)}
        </div>
        <div className="text-amber-400 font-medium mt-0.5">
          Remaining to complete: {formatGBP(remainingValue)}
        </div>
        <div className="text-sky-400 font-medium mt-0.5">
          Duplicates (tradeable): {formatGBP(duplicateValue)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filteredCards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            setName={setName}
            quantities={
              new Map(variantsOf(card).map((v) => [v, quantityOf(card.id, v)]))
            }
            onToggleVariant={(variant) => toggleVariant(card, variant)}
            onAdjustQuantity={(variant, delta) => adjustQuantity(card, variant, delta)}
          />
        ))}
      </div>

      {filteredCards.length === 0 && (
        <p className="text-center text-slate-500 mt-8">No cards match.</p>
      )}
    </div>
  );
}
