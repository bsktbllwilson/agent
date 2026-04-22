-- 0011_listings_search.sql
-- Generated tsvector column + GIN index for full-text search.
-- Weights: A = name; B = cuisine/subtype/neighborhood; C = long-form copy.

alter table public.listings
  add column if not exists search_tsv tsvector
    generated always as (
      setweight(
        to_tsvector('english', coalesce(name, '')),
        'A'
      ) ||
      setweight(
        to_tsvector(
          'english',
          concat_ws(
            ' ',
            coalesce(cuisine, ''),
            coalesce(subtype, ''),
            coalesce(neighborhood, ''),
            coalesce(serves, '')
          )
        ),
        'B'
      ) ||
      setweight(
        to_tsvector(
          'english',
          concat_ws(
            ' ',
            coalesce(reason, ''),
            coalesce(secret_sauce, ''),
            coalesce(owner_story, ''),
            coalesce(handoff_notes, '')
          )
        ),
        'C'
      )
    ) stored;

create index if not exists listings_search_tsv_idx
  on public.listings using gin (search_tsv);

comment on column public.listings.search_tsv is
  'Auto-generated tsvector over name (A), cuisine/subtype/neighborhood/serves (B), and long-form text (C). Index via listings_search_tsv_idx.';
