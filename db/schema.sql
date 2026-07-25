create table if not exists owned_cards (
  card_id text not null,
  variant text not null,
  set_id text not null,
  owned_at timestamptz not null default now(),
  primary key (card_id, variant)
);
