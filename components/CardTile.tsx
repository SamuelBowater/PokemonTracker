"use client";

import {
  TcgdexCard,
  VariantKey,
  VARIANT_LABELS,
  cardImageUrl,
  formatGBP,
  variantsOf,
} from "@/lib/tcgdex";

export default function CardTile({
  card,
  ownedVariants,
  onToggleVariant,
}: {
  card: TcgdexCard;
  ownedVariants: Set<VariantKey>;
  onToggleVariant: (variant: VariantKey) => void;
}) {
  const imageUrl = cardImageUrl(card, "low");
  const variants = variantsOf(card);
  const ownedCount = variants.filter((v) => ownedVariants.has(v)).length;
  const fullyOwned = ownedCount === variants.length;
  const noneOwned = ownedCount === 0;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={card.name}
          className={`w-full aspect-[3/4] object-cover transition-opacity ${
            fullyOwned ? "opacity-100" : noneOwned ? "opacity-40 grayscale" : "opacity-70"
          }`}
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[3/4] flex items-center justify-center text-xs text-slate-500">
          {card.name}
        </div>
      )}

      <div className="px-1.5 py-1 text-xs truncate text-slate-300">{card.name}</div>

      <div className="flex flex-wrap gap-1 px-1.5 pb-1.5">
        {variants.map((variant) => {
          const isOwned = ownedVariants.has(variant);
          const price = card.prices[variant];
          return (
            <button
              key={variant}
              onClick={() => onToggleVariant(variant)}
              className={`flex flex-col items-center leading-none px-1.5 py-1 rounded-full border ${
                isOwned
                  ? "bg-emerald-500 border-emerald-500 text-slate-950"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              <span className="text-[10px]">{VARIANT_LABELS[variant]}</span>
              {price != null && (
                <span className="text-[9px] opacity-75">{formatGBP(price)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
