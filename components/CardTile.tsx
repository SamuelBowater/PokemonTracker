"use client";

import {
  TcgdexCard,
  VariantKey,
  VARIANT_LABELS,
  cardImageUrl,
  ebayUkSearchUrl,
  formatGBP,
  variantsOf,
} from "@/lib/tcgdex";

export default function CardTile({
  card,
  setName,
  quantities,
  onToggleVariant,
  onAdjustQuantity,
}: {
  card: TcgdexCard;
  setName: string;
  quantities: Map<VariantKey, number>;
  onToggleVariant: (variant: VariantKey) => void;
  onAdjustQuantity: (variant: VariantKey, delta: number) => void;
}) {
  const imageUrl = cardImageUrl(card, "low");
  const variants = variantsOf(card);
  const ownedCount = variants.filter((v) => (quantities.get(v) ?? 0) > 0).length;
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
          const quantity = quantities.get(variant) ?? 0;
          const isOwned = quantity > 0;
          const price = card.prices[variant];
          return (
            <div key={variant} className="flex items-stretch gap-0.5">
              <button
                onClick={() => onToggleVariant(variant)}
                className={`flex flex-col items-center leading-none px-1.5 py-1 rounded-full border ${
                  isOwned
                    ? "bg-emerald-500 border-emerald-500 text-slate-950"
                    : "border-slate-700 text-slate-400"
                }`}
              >
                <span className="text-[10px]">
                  {VARIANT_LABELS[variant]}
                  {quantity > 1 && ` ×${quantity}`}
                </span>
                {price != null && (
                  <span className="text-[9px] opacity-75">{formatGBP(price)}</span>
                )}
              </button>
              {isOwned ? (
                <div className="flex flex-col justify-between">
                  <button
                    onClick={() => onAdjustQuantity(variant, 1)}
                    title="Add a duplicate copy"
                    className="flex-1 flex items-center justify-center w-4 rounded-t border border-slate-700 text-[9px] leading-none text-slate-400 hover:text-emerald-400 hover:border-emerald-400"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onAdjustQuantity(variant, -1)}
                    title="Remove a copy"
                    className="flex-1 flex items-center justify-center w-4 rounded-b border border-t-0 border-slate-700 text-[9px] leading-none text-slate-400 hover:text-red-400 hover:border-red-400"
                  >
                    &minus;
                  </button>
                </div>
              ) : (
                <a
                  href={ebayUkSearchUrl(card, variant, setName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={`Search eBay UK for ${card.name} (${VARIANT_LABELS[variant]})`}
                  className="flex items-center justify-center w-5 rounded-full border border-slate-700 text-[10px] text-slate-400 hover:text-emerald-400 hover:border-emerald-400"
                >
                  🛒
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
