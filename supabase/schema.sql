create table if not exists owned_cards (
  card_id text primary key,
  set_id text not null,
  owned_at timestamptz not null default now()
);

alter table owned_cards enable row level security;

create policy "public read/write" on owned_cards
  for all
  using (true)
  with check (true);
