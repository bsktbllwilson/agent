-- 0011_listings_search.sql
-- Trigger-populated tsvector + GIN index for full-text search.
--
-- Postgres requires generation expressions to be IMMUTABLE, but to_tsvector
-- is STABLE (search configs can change at runtime). A BEFORE INSERT/UPDATE
-- trigger is the idiomatic workaround.
--
-- Weights: A = name; B = cuisine/subtype/neighborhood/serves; C = long-form.

alter table public.listings drop column if exists search_tsv;
alter table public.listings add column if not exists search_tsv tsvector;

create or replace function public.listings_refresh_search_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english',
      concat_ws(' ',
        coalesce(new.cuisine, ''),
        coalesce(new.subtype, ''),
        coalesce(new.neighborhood, ''),
        coalesce(new.serves, '')
      )
    ), 'B') ||
    setweight(to_tsvector('english',
      concat_ws(' ',
        coalesce(new.reason, ''),
        coalesce(new.secret_sauce, ''),
        coalesce(new.owner_story, ''),
        coalesce(new.handoff_notes, '')
      )
    ), 'C');
  return new;
end;
$$;

drop trigger if exists listings_search_tsv_trigger on public.listings;
create trigger listings_search_tsv_trigger
  before insert or update
  on public.listings
  for each row
  execute function public.listings_refresh_search_tsv();

-- Backfill: force the trigger to fire on every existing row.
update public.listings set updated_at = updated_at;

create index if not exists listings_search_tsv_idx
  on public.listings using gin (search_tsv);
