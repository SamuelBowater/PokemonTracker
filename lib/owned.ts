import { sql } from "./db";
import { VariantKey } from "./tcgdex";
import { ownedKey } from "./ownedKey";

export { ownedKey } from "./ownedKey";

/** Maps `card_id:variant` -> quantity owned (>= 1). Absent keys mean 0 owned. */
export async function getOwnedVariantQuantities(setId: string): Promise<Map<string, number>> {
  try {
    const rows = await sql`select card_id, variant, quantity from owned_cards where set_id = ${setId}`;
    return new Map(
      rows.map((row: any) => [
        ownedKey(row.card_id as string, row.variant as VariantKey),
        row.quantity as number,
      ])
    );
  } catch (err) {
    console.error("Failed to load owned cards", err);
    return new Map();
  }
}
