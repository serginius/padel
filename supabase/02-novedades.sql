-- Slice Pádel · Actualización: videos, EN VIVO punto por punto, link de relator,
-- lesionados y CONFIRMADOS ("Me anoto").
-- Pegá TODO este archivo en Supabase > SQL Editor > New query y tocá "Run".
-- Se puede correr más de una vez sin problema.

-- ============ Columnas nuevas ============

-- Partidos: links de YouTube, hora en que arrancó el vivo y reglas del partido.
alter table public.matches add column if not exists video_urls text[] not null default '{}';
alter table public.matches add column if not exists started_at timestamptz;
alter table public.matches add column if not exists golden_point boolean not null default false; -- punto de oro en 40-40
alter table public.matches add column if not exists super_tb boolean not null default false;     -- 3er set = super tie-break a 10

-- Jugadores: hasta qué día no viene (vacío = está sano).
alter table public.players add column if not exists injured_until date;

-- ============ Punto por punto (EN VIVO) ============

create table if not exists public.points (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  created_at timestamptz not null default now()
);
create index if not exists points_match_idx on public.points(match_id);
alter table public.points enable row level security;
drop policy if exists "leer puntos" on public.points;
create policy "leer puntos" on public.points for select using (true);
drop policy if exists "admin escribe puntos" on public.points;
create policy "admin escribe puntos" on public.points for all
  using (public.is_admin()) with check (public.is_admin());

-- ============ CONFIRMADOS ============

create table if not exists public.signups (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, player_id)
);
alter table public.signups enable row level security;

-- ¿Este jugador es el que está logueado y el partido todavía no se jugó?
create or replace function public.can_signup(mid uuid, pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.players p where p.id = pid and lower(p.email) = public.current_email() and public.current_email() <> '')
     and exists (select 1 from public.matches m where m.id = mid and m.status <> 'jugado')
$$;

drop policy if exists "leer confirmados" on public.signups;
create policy "leer confirmados" on public.signups for select using (true);
drop policy if exists "admin escribe confirmados" on public.signups;
create policy "admin escribe confirmados" on public.signups for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "me anoto" on public.signups;
create policy "me anoto" on public.signups for insert
  with check (public.can_signup(match_id, player_id));
drop policy if exists "me bajo" on public.signups;
create policy "me bajo" on public.signups for delete
  using (public.can_signup(match_id, player_id));

-- ============ Link de relator (sin login) ============

-- Los links secretos van en una tabla aparte que solo ve el admin.
create table if not exists public.keeper_links (
  match_id uuid primary key references public.matches(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table public.keeper_links enable row level security;
drop policy if exists "admin ve links" on public.keeper_links;
create policy "admin ve links" on public.keeper_links for all
  using (public.is_admin()) with check (public.is_admin());

-- ¿Puede relatar este partido? El admin, o quien tenga el link, mientras no esté terminado.
create or replace function public.relator_ok(mid uuid, tok text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matches m where m.id = mid and m.status <> 'jugado')
     and (public.is_admin() or exists (
       select 1 from public.keeper_links k where k.match_id = mid and tok is not null and k.token = tok))
$$;

-- Desde el link: ¿de qué partido es? (nada si lo cortaron o ya se jugó)
create or replace function public.relator_match(tok text) returns uuid
language sql stable security definer set search_path = public as $$
  select k.match_id from public.keeper_links k join public.matches m on m.id = k.match_id
  where tok is not null and k.token = tok and m.status <> 'jugado'
$$;

create or replace function public.relator_start(mid uuid, tok text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  update public.matches set started_at = coalesce(started_at, now()) where id = mid;
end $$;

create or replace function public.relator_point(mid uuid, tok text, t text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  insert into public.points (match_id, team) values (mid, t);
end $$;

-- Borra el último punto anotado.
create or replace function public.relator_undo(mid uuid, tok text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  delete from public.points where id = (select max(id) from public.points where match_id = mid);
end $$;

-- Terminar: guarda los sets como quedaron y corta el link.
create or replace function public.relator_finish(mid uuid, tok text, s jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.relator_ok(mid, tok) then raise exception 'Link vencido o cortado'; end if;
  update public.matches set status = 'jugado', sets = coalesce(s, '[]'::jsonb) where id = mid;
  delete from public.keeper_links where match_id = mid;
end $$;

-- Solo admin: crear (o renovar) el link de un partido.
create or replace function public.make_relator_link(mid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare tok text := replace(gen_random_uuid()::text, '-', '');
begin
  if not public.is_admin() then raise exception 'Solo el admin'; end if;
  insert into public.keeper_links (match_id, token) values (mid, tok)
  on conflict (match_id) do update set token = excluded.token, created_at = now();
  return tok;
end $$;

-- Solo admin: borrar todo lo cargado y dejar el partido como si no se hubiera jugado.
create or replace function public.reset_match(mid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el admin'; end if;
  delete from public.points where match_id = mid;
  update public.matches set status = 'programado', started_at = null, sets = '[]'::jsonb where id = mid;
end $$;

grant execute on function public.relator_match(text) to anon, authenticated;
grant execute on function public.relator_start(uuid, text) to anon, authenticated;
grant execute on function public.relator_point(uuid, text, text) to anon, authenticated;
grant execute on function public.relator_undo(uuid, text) to anon, authenticated;
grant execute on function public.relator_finish(uuid, text, jsonb) to anon, authenticated;
