import { sql } from "./db";

export async function getOwnedCardIds(setId: string): Promise<Set<string>> {
  try {
    const rows = await sql`select card_id from owned_cards where set_id = ${setId}`;
    return new Set(rows.map((row: any) => row.card_id as string));
  } catch (err) {
    console.error("Failed to load owned cards", err);
    return new Set();
  }
}
