"use server";

import { sql } from "@/lib/db";

export async function setCardOwned(cardId: string, setId: string, owned: boolean) {
  if (owned) {
    await sql`
      insert into owned_cards (card_id, set_id)
      values (${cardId}, ${setId})
      on conflict (card_id) do nothing
    `;
  } else {
    await sql`delete from owned_cards where card_id = ${cardId}`;
  }
}
