import { sql } from "./db";
import { VariantKey } from "./tcgdex";
import { ownedKey } from "./ownedKey";

export { ownedKey } from "./ownedKey";

export async function getOwnedVariantKeys(setId: string): Promise<Set<string>> {
  try {
    const rows = await sql`select card_id, variant from owned_cards where set_id = ${setId}`;
    return new Set(
      rows.map((row: any) => ownedKey(row.card_id as string, row.variant as VariantKey))
    );
  } catch (err) {
    console.error("Failed to load owned cards", err);
    return new Set();
  }
}
