create type public.app_role as enum ('owner','staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, name) values (new.id, v_name);
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'owner');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'staff');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  total_quantity integer not null default 0 check (total_quantity >= 0),
  pack_size integer not null default 1 check (pack_size >= 1),
  rent_per_day numeric(10,2) not null default 0 check (rent_per_day >= 0),
  replacement_cost numeric(10,2) not null default 0 check (replacement_cost >= 0),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

create type public.booking_status as enum ('quotation','confirmed','dispatched','returned','closed','cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  event_type text not null default '',
  event_date date,
  delivery_date date not null,
  expected_return_date date not null,
  actual_return_date date,
  transport_charge numeric(10,2) not null default 0 check (transport_charge >= 0),
  advance_paid numeric(10,2) not null default 0 check (advance_paid >= 0),
  status public.booking_status not null default 'quotation',
  dispatched_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (expected_return_date >= delivery_date)
);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity integer not null default 0 check (quantity >= 0),
  dispatched_quantity integer not null default 0 check (dispatched_quantity >= 0),
  returned_good integer not null default 0 check (returned_good >= 0),
  returned_broken integer not null default 0 check (returned_broken >= 0),
  unique (booking_id, item_id)
);

create table public.stock_ledger (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id),
  booking_id uuid references public.bookings(id) on delete set null,
  change_type text not null check (change_type in ('dispatch','return_good','return_broken','missing','purchase','adjustment')),
  owned_change integer not null default 0,
  rented_change integer not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  invoice_number bigint not null default nextval('public.invoice_number_seq'),
  delivery_date date not null,
  return_date date not null,
  rent_days integer not null,
  rent_amount numeric(12,2) not null default 0,
  transport_charge numeric(12,2) not null default 0,
  damage_amount numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0 check (discount >= 0),
  advance_paid numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  issued_at timestamptz not null default now(),
  issued_by uuid
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash','upi','bank_transfer')),
  paid_at timestamptz not null default now(),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index idx_booking_items_booking on public.booking_items(booking_id);
create index idx_booking_items_item on public.booking_items(item_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_delivery on public.bookings(delivery_date);
create index idx_bookings_return on public.bookings(expected_return_date);
create index idx_ledger_item on public.stock_ledger(item_id);
create index idx_payments_booking on public.payments(booking_id);

create or replace function public.available_quantities(_delivery date, _return date, _exclude uuid default null)
returns table(item_id uuid, available integer, owned integer, on_rent integer)
language sql
stable
security definer
set search_path = public
as $$
  select i.id,
    i.total_quantity
      - coalesce((
        select sum(greatest(bi.quantity, bi.dispatched_quantity))
        from public.booking_items bi
        join public.bookings b on b.id = bi.booking_id
        where bi.item_id = i.id
          and b.status in ('confirmed','dispatched')
          and (_exclude is null or b.id <> _exclude)
          and b.delivery_date <= _return
          and b.expected_return_date >= _delivery
      ), 0) as available,
    i.total_quantity as owned,
    coalesce((
      select sum(bi.dispatched_quantity)
      from public.booking_items bi
      join public.bookings b on b.id = bi.booking_id
      where bi.item_id = i.id and b.status = 'dispatched'
    ), 0) as on_rent
  from public.items i;
$$;

create or replace function public.dispatch_booking(_booking_id uuid, _lines jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  line jsonb;
  v_item uuid;
  v_qty integer;
  v_booked integer;
  v_available integer;
begin
  select * into b from public.bookings where id = _booking_id;
  if not found then raise exception 'Booking not found'; end if;
  if b.status <> 'confirmed' then raise exception 'Only confirmed bookings can be dispatched'; end if;

  for line in select * from jsonb_array_elements(_lines) loop
    v_item := (line->>'item_id')::uuid;
    v_qty := coalesce((line->>'quantity')::int, 0);
    if v_qty < 0 then raise exception 'Quantity cannot be negative'; end if;
    select quantity into v_booked from public.booking_items
      where booking_id = _booking_id and item_id = v_item;
    if v_qty > v_booked then raise exception 'Counted quantity exceeds booked quantity'; end if;
    select available into v_available from public.available_quantities(
      b.delivery_date, b.expected_return_date, _booking_id) where item_id = v_item;
    if v_qty > v_available then
      raise exception 'Only % pieces available for one item on these dates', v_available;
    end if;
  end loop;

  for line in select * from jsonb_array_elements(_lines) loop
    v_item := (line->>'item_id')::uuid;
    v_qty := coalesce((line->>'quantity')::int, 0);
    update public.booking_items
      set dispatched_quantity = v_qty
      where booking_id = _booking_id and item_id = v_item;
    if v_qty > 0 then
      insert into public.stock_ledger (item_id, booking_id, change_type, owned_change, rented_change, note)
      values (v_item, _booking_id, 'dispatch', 0, v_qty, 'Dispatched on booking');
    end if;
  end loop;

  update public.bookings set status = 'dispatched', dispatched_at = now() where id = _booking_id;
end;
$$;

create or replace function public.return_booking(_booking_id uuid, _lines jsonb, _return_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  line jsonb;
  v_item uuid;
  v_good integer;
  v_broken integer;
  v_dispatched integer;
  v_missing integer;
begin
  select * into b from public.bookings where id = _booking_id;
  if not found then raise exception 'Booking not found'; end if;
  if b.status <> 'dispatched' then raise exception 'Only dispatched bookings can be returned'; end if;
  if _return_date < b.delivery_date then raise exception 'Return date cannot be before delivery date'; end if;

  for line in select * from jsonb_array_elements(_lines) loop
    v_item := (line->>'item_id')::uuid;
    v_good := coalesce((line->>'good')::int, 0);
    v_broken := coalesce((line->>'broken')::int, 0);
    if v_good < 0 or v_broken < 0 then raise exception 'Counts cannot be negative'; end if;
    select dispatched_quantity into v_dispatched from public.booking_items
      where booking_id = _booking_id and item_id = v_item;
    if v_good + v_broken > v_dispatched then
      raise exception 'Good plus broken cannot exceed dispatched quantity'; end if;
  end loop;

  for line in select * from jsonb_array_elements(_lines) loop
    v_item := (line->>'item_id')::uuid;
    v_good := coalesce((line->>'good')::int, 0);
    v_broken := coalesce((line->>'broken')::int, 0);
    select dispatched_quantity into v_dispatched from public.booking_items
      where booking_id = _booking_id and item_id = v_item;
    v_missing := v_dispatched - v_good - v_broken;

    update public.booking_items
      set returned_good = v_good, returned_broken = v_broken
      where booking_id = _booking_id and item_id = v_item;

    if v_good > 0 then
      insert into public.stock_ledger (item_id, booking_id, change_type, owned_change, rented_change, note)
      values (v_item, _booking_id, 'return_good', 0, -v_good, 'Returned in good condition');
    end if;
    if v_broken > 0 then
      insert into public.stock_ledger (item_id, booking_id, change_type, owned_change, rented_change, note)
      values (v_item, _booking_id, 'return_broken', -v_broken, -v_broken, 'Returned broken');
    end if;
    if v_missing > 0 then
      insert into public.stock_ledger (item_id, booking_id, change_type, owned_change, rented_change, note)
      values (v_item, _booking_id, 'missing', -v_missing, -v_missing, 'Not returned (missing)');
    end if;
    if v_broken + v_missing > 0 then
      update public.items
        set total_quantity = total_quantity - (v_broken + v_missing)
        where id = v_item;
    end if;
  end loop;

  update public.bookings
    set status = 'returned', actual_return_date = _return_date
    where id = _booking_id;
end;
$$;

create or replace function public.generate_invoice(_booking_id uuid, _discount numeric default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  v_days integer;
  v_rent numeric(12,2);
  v_damage numeric(12,2);
  v_total numeric(12,2);
  v_inv uuid;
begin
  select * into b from public.bookings where id = _booking_id;
  if not found then raise exception 'Booking not found'; end if;
  if b.status not in ('returned','closed') then raise exception 'Record the return before generating an invoice'; end if;
  if exists (select 1 from public.invoices where booking_id = _booking_id) then
    raise exception 'Invoice already generated for this booking';
  end if;
  if _discount < 0 then raise exception 'Discount cannot be negative'; end if;

  v_days := greatest(coalesce(b.actual_return_date, b.expected_return_date) - b.delivery_date, 0) + 1;

  select coalesce(sum(bi.dispatched_quantity * i.rent_per_day), 0) * v_days
    into v_rent
  from public.booking_items bi
  join public.items i on i.id = bi.item_id
  where bi.booking_id = _booking_id;

  select coalesce(sum((bi.returned_broken + greatest(bi.dispatched_quantity - bi.returned_good - bi.returned_broken, 0)) * i.replacement_cost), 0)
    into v_damage
  from public.booking_items bi
  join public.items i on i.id = bi.item_id
  where bi.booking_id = _booking_id;

  v_total := greatest(v_rent + b.transport_charge + v_damage - _discount, 0);

  insert into public.invoices (
    booking_id, delivery_date, return_date, rent_days, rent_amount,
    transport_charge, damage_amount, discount, advance_paid, total_amount, balance_due, issued_by
  ) values (
    _booking_id, b.delivery_date, coalesce(b.actual_return_date, b.expected_return_date), v_days,
    v_rent, b.transport_charge, v_damage, _discount, b.advance_paid, v_total,
    v_total - b.advance_paid, auth.uid()
  ) returning id into v_inv;

  return v_inv;
end;
$$;

create or replace function public.stock_purchase(_item_id uuid, _qty integer, _note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'owner') then raise exception 'Only the owner can record purchases'; end if;
  if _qty is null or _qty <= 0 then raise exception 'Quantity must be positive'; end if;
  update public.items set total_quantity = total_quantity + _qty where id = _item_id;
  if not found then raise exception 'Item not found'; end if;
  insert into public.stock_ledger (item_id, change_type, owned_change, rented_change, note)
  values (_item_id, 'purchase', _qty, 0, _note);
end;
$$;

create or replace function public.stock_adjust(_item_id uuid, _delta integer, _note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'owner') then raise exception 'Only the owner can make adjustments'; end if;
  if _delta is null or _delta = 0 then raise exception 'Adjustment cannot be zero'; end if;
  update public.items set total_quantity = total_quantity + _delta where id = _item_id;
  if not found then raise exception 'Item not found'; end if;
  if (select total_quantity from public.items where id = _item_id) < 0 then
    raise exception 'Adjustment would make owned quantity negative';
  end if;
  insert into public.stock_ledger (item_id, change_type, owned_change, rented_change, note)
  values (_item_id, 'adjustment', _delta, 0, _note);
end;
$$;

grant usage on sequence public.invoice_number_seq to authenticated;
grant execute on function public.available_quantities(date, date, uuid) to authenticated;
grant execute on function public.dispatch_booking(uuid, jsonb) to authenticated;
grant execute on function public.return_booking(uuid, jsonb, date) to authenticated;
grant execute on function public.generate_invoice(uuid, numeric) to authenticated;
grant execute on function public.stock_purchase(uuid, integer, text) to authenticated;
grant execute on function public.stock_adjust(uuid, integer, text) to authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select on public.items to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert, update, delete on public.booking_items to authenticated;
grant select, insert on public.stock_ledger to authenticated;
grant select on public.invoices to authenticated;
grant select, insert on public.payments to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.items to service_role;
grant all on public.customers to service_role;
grant all on public.bookings to service_role;
grant all on public.booking_items to service_role;
grant all on public.stock_ledger to service_role;
grant all on public.invoices to service_role;
grant all on public.payments to service_role;
grant all on sequence public.invoice_number_seq to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.items enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.stock_ledger enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'owner'));
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid());

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'owner'));

create policy "Anyone signed in reads items" on public.items for select to authenticated using (true);
create policy "Owner inserts items" on public.items for insert to authenticated with check (public.has_role(auth.uid(), 'owner'));
create policy "Owner updates items" on public.items for update to authenticated using (public.has_role(auth.uid(), 'owner'));
create policy "Owner deletes items" on public.items for delete to authenticated using (public.has_role(auth.uid(), 'owner'));

create policy "Signed in manage customers" on public.customers for all to authenticated using (true) with check (true);
create policy "Signed in manage bookings" on public.bookings for all to authenticated using (true) with check (true);
create policy "Signed in manage booking items" on public.booking_items for all to authenticated using (true) with check (true);
create policy "Signed in read ledger" on public.stock_ledger for select to authenticated using (true);
create policy "Signed in read invoices" on public.invoices for select to authenticated using (true);
create policy "Signed in manage payments" on public.payments for all to authenticated using (true) with check (true);

insert into public.items (name, category, total_quantity, pack_size, rent_per_day, replacement_cost) values
  ('Dinner Plate', 'Plates', 500, 10, 5.00, 150.00),
  ('Quarter Plate', 'Plates', 400, 10, 3.00, 90.00),
  ('Curry Bowl', 'Bowls', 600, 12, 2.00, 60.00),
  ('Water Glass', 'Glasses', 800, 6, 2.00, 45.00),
  ('Tea Cup with Saucer', 'Cups', 300, 6, 3.00, 120.00),
  ('Spoon', 'Cutlery', 1000, 12, 1.00, 15.00);
