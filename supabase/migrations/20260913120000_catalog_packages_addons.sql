-- ── Catalog: packages + add-ons feed quotations and contracts ──────────────
-- Packages gain «مناسبة لـ», a price range and an approximate delivery time.
-- Add-ons get their own table. Quotations and contracts remember the package
-- they were built from; their service rows stay a snapshot inside `items`.

alter table public.packages
  add column if not exists suitable_for text,
  add column if not exists price_max numeric,
  add column if not exists delivery text;

comment on column public.packages.price is 'السعر المبدئي — الحد الأدنى للنطاق';
comment on column public.packages.price_max is 'الحد الأعلى للنطاق — فارغ = سعر واحد';

create table if not exists public.addons (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  description  text,
  -- unit    = العدد × السعر (خدمة، صورة، م²…)
  -- percent = نسبة من قيمة الباقة والإضافات
  pricing_type text not null default 'unit' check (pricing_type in ('unit', 'percent')),
  unit_label   text,
  price        numeric not null default 0,
  price_max    numeric,
  delivery     text,
  is_active    boolean not null default true,
  sort_order   integer not null default 0
);

alter table public.addons enable row level security;

drop policy if exists "addons: authenticated read" on public.addons;
create policy "addons: authenticated read" on public.addons
  for select to authenticated using (true);

drop policy if exists "addons: authenticated write" on public.addons;
create policy "addons: authenticated write" on public.addons
  for all to authenticated using (true) with check (true);

alter table public.quotations
  add column if not exists package_id uuid references public.packages(id) on delete set null;

alter table public.contracts
  add column if not exists package_id uuid references public.packages(id) on delete set null;

-- Starter add-ons (only when the table is empty)
insert into public.addons (name, pricing_type, unit_label, price, price_max, description, sort_order)
select * from (values
  ('Reel إضافي',               'unit',    null,    300::numeric,  600::numeric,  null::text, 0),
  ('فيديو سينمائي مستقل',       'unit',    null,    800,  2500, null, 1),
  ('Drone Photography',        'unit',    null,    500,  1000, null, 2),
  ('Drone Video',              'unit',    null,    700,  1500, null, 3),
  ('Virtual Tour 360°',        'unit',    null,    500,  1500, null, 4),
  ('3D / Digital Twin',        'unit',    'م²',    0,    null, 'السعر للمتر المربع — اكتب المساحة في الكمية', 5),
  ('2D Floor Plan',            'unit',    null,    250,  500,  null, 6),
  ('3D Floor Plan',            'unit',    null,    500,  1000, null, 7),
  ('Virtual Staging',          'unit',    'صورة',  150,  350,  null, 8),
  ('مقابلة Interview',          'unit',    null,    800,  2000, null, 9),
  ('تصوير Twilight',            'unit',    null,    400,  800,  null, 10),
  ('تسليم سريع',                'percent', null,    20,   30,   'نسبة من قيمة الباقة والإضافات', 11)
) as seed(name, pricing_type, unit_label, price, price_max, description, sort_order)
where not exists (select 1 from public.addons);
