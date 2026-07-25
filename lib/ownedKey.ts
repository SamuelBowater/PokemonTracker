import { VariantKey } from "./tcgdex";

export function ownedKey(cardId: string, variant: VariantKey) {
  return `${cardId}:${variant}`;
}
