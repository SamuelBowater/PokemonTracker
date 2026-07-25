-- Run this once against your existing Neon database to add masterset
-- (holo / reverse holo) variant tracking to an owned_cards table created
-- from the original db/schema.sql.
alter table owned_cards add column if not exists variant text not null default 'normal';
alter table owned_cards drop constraint if exists owned_cards_pkey;
alter table owned_cards add primary key (card_id, variant);
