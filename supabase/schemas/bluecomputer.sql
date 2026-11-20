-- Declarative schema source. Generate reviewed migrations with `supabase db diff` after linking a project.
create schema if not exists private;
create type public.app_role as enum ('buyer', 'employee', 'owner');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('draft', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'expired', 'payment_failed');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (user_id uuid primary key references auth.users on delete cascade, role public.app_role not null default 'buyer', created_at timestamptz not null default now());
create table public.addresses (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, recipient_name text not null, phone text not null, address_line text not null, city text not null, postal_code text not null, is_default boolean not null default false, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, sort_order integer not null default 0, is_active boolean not null default true);
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references public.categories on delete set null, name text not null, slug text not null unique, brand text not null, description text not null default '', specifications jsonb not null default '{}'::jsonb, price integer not null check (price >= 0), stock_quantity integer not null default 0 check (stock_quantity >= 0), thumbnail_url text, status public.product_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_images (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products on delete cascade, storage_path text not null, sort_order integer not null default 0, alt_text text not null default '');
create table public.carts (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.cart_items (cart_id uuid not null references public.carts on delete cascade, product_id uuid not null references public.products on delete cascade, quantity integer not null check (quantity > 0), unit_price_snapshot integer not null check (unit_price_snapshot >= 0), primary key (cart_id, product_id));
create table public.orders (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users, order_number text not null unique, status public.order_status not null default 'draft', payment_status text not null default 'pending', subtotal integer not null check (subtotal >= 0), shipping_cost integer not null default 0 check (shipping_cost >= 0), total integer not null check (total >= 0), shipping_snapshot jsonb not null default '{}'::jsonb, midtrans_order_id text unique, midtrans_snap_token text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade, product_id uuid references public.products on delete set null, product_name_snapshot text not null, unit_price integer not null check (unit_price >= 0), quantity integer not null check (quantity > 0), subtotal integer not null check (subtotal >= 0));
create table public.payment_events (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade, provider text not null default 'midtrans', provider_event_id text not null unique, transaction_status text not null, raw_status jsonb not null default '{}'::jsonb, received_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

-- New users always start as buyers. Owner assignment is a controlled database-admin action.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', '')) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'buyer') on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_user();

alter table public.profiles enable row level security; alter table public.user_roles enable row level security; alter table public.addresses enable row level security; alter table public.categories enable row level security; alter table public.products enable row level security; alter table public.product_images enable row level security; alter table public.carts enable row level security; alter table public.cart_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.payment_events enable row level security; alter table public.audit_logs enable row level security;

-- Role checks run as the function owner so policy evaluation never depends on
-- the caller's visibility into public.user_roles.
create function public.has_staff_role() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role in ('employee', 'owner')) $$;
create function public.is_owner() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'owner') $$;
grant execute on function public.has_staff_role() to anon, authenticated;
grant execute on function public.is_owner() to authenticated;

-- Called only by the Midtrans webhook through the service-role client. The
-- function is intentionally not executable by anon or authenticated.
create function public.decrement_order_stock(p_order_id uuid) returns void language sql security definer set search_path = public as $$
  update public.products as product
  set stock_quantity = greatest(product.stock_quantity - item.quantity, 0),
      updated_at = now()
  from public.order_items as item
  where item.order_id = p_order_id
    and item.product_id = product.id;
$$;
revoke all on function public.decrement_order_stock(uuid) from public;
revoke all on function public.decrement_order_stock(uuid) from anon, authenticated;
grant execute on function public.decrement_order_stock(uuid) to service_role;

create policy "public active catalog" on public.categories for select using (is_active or public.has_staff_role());
create policy "staff manage categories" on public.categories for all to authenticated using (public.has_staff_role()) with check (public.has_staff_role());
create policy "public active products" on public.products for select using (status = 'active' or public.has_staff_role());
create policy "staff manage products" on public.products for all to authenticated using (public.has_staff_role()) with check (public.has_staff_role());
create policy "public product images" on public.product_images for select using (exists (select 1 from public.products where products.id = product_id and (products.status = 'active' or public.has_staff_role())));
create policy "staff manage images" on public.product_images for all to authenticated using (public.has_staff_role()) with check (public.has_staff_role());
create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id); create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id); create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id); create policy "staff read profiles" on public.profiles for select to authenticated using (public.has_staff_role());
create policy "own addresses" on public.addresses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own cart" on public.carts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own cart items" on public.cart_items for all to authenticated using (exists (select 1 from public.carts where carts.id = cart_id and carts.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts where carts.id = cart_id and carts.user_id = (select auth.uid())));
create policy "own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id); create policy "staff view orders" on public.orders for select to authenticated using (public.has_staff_role()); create policy "staff update orders" on public.orders for update to authenticated using (public.has_staff_role()) with check (public.has_staff_role());
create policy "own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_id and orders.user_id = (select auth.uid()))); create policy "staff order items" on public.order_items for select to authenticated using (public.has_staff_role());
create policy "owner read roles" on public.user_roles for select to authenticated using ((select auth.uid()) = user_id or public.is_owner()); create policy "owner manage roles" on public.user_roles for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "staff audit read" on public.audit_logs for select to authenticated using (public.has_staff_role());

create index if not exists addresses_user_idx on public.addresses (user_id, is_default desc, created_at desc);
create unique index if not exists addresses_one_default_idx on public.addresses (user_id) where is_default;
create index if not exists user_roles_role_idx on public.user_roles (role);
create index if not exists products_status_idx on public.products (status, name);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists payment_events_order_idx on public.payment_events (order_id, received_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.addresses, public.carts, public.cart_items, public.orders, public.order_items, public.user_roles to authenticated;
grant select on public.audit_logs to authenticated;
grant all privileges on all tables in schema public to service_role;
