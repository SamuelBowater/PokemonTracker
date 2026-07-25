"use client";

import { TcgdexCard, cardImageUrl } from "@/lib/tcgdex";

export default function CardTile({
  card,
  owned,
  onToggle,
}: {
  card: TcgdexCard;
  owned: boolean;
  onToggle: () => void;
}) {
  const imageUrl = cardImageUrl(card, "low");

  return (
    <button
      onClick={onToggle}
      className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 text-left"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={card.name}
          className={`w-full aspect-[3/4] object-cover transition-opacity ${
            owned ? "opacity-100" : "opacity-40 grayscale"
          }`}
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[3/4] flex items-center justify-center text-xs text-slate-500">
          {card.name}
        </div>
      )}

      {owned && (
        <span className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow">
          ✓
        </span>
      )}

      <div className="px-1.5 py-1 text-xs truncate text-slate-300">
        {card.name}
      </div>
    </button>
  );
}
