"use server";

import { sql } from "@/lib/db";
import { VariantKey } from "@/lib/tcgdex";

export async function setVariantOwned(
  cardId: string,
  setId: string,
  variant: VariantKey,
  owned: boolean
) {
  if (owned) {
    await sql`
      insert into owned_cards (card_id, variant, set_id)
      values (${cardId}, ${variant}, ${setId})
      on conflict (card_id, variant) do nothing
    `;
  } else {
    await sql`delete from owned_cards where card_id = ${cardId} and variant = ${variant}`;
  }
}
