import { supabase } from "./supabase";

export async function getOwnedCardIds(setId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("owned_cards")
    .select("card_id")
    .eq("set_id", setId);

  if (error) {
    console.error("Failed to load owned cards", error);
    return new Set();
  }

  return new Set(data.map((row) => row.card_id));
}

export async function setOwned(cardId: string, setId: string, owned: boolean) {
  if (owned) {
    const { error } = await supabase
      .from("owned_cards")
      .upsert({ card_id: cardId, set_id: setId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("owned_cards")
      .delete()
      .eq("card_id", cardId);
    if (error) throw error;
  }
}
