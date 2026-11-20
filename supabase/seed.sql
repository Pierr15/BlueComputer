-- Seed data for local development and the storefront fixture catalog.
-- Product IDs intentionally match src/lib/products.ts so the browser cart and
-- the database-backed checkout resolve to the same rows.

insert into public.categories (id, name, slug, description, sort_order, is_active) values
  ('c0000000-0000-4000-8000-000000000001', 'Hardware', 'hardware', 'Komponen inti untuk merakit dan meningkatkan performa PC.', 1, true),
  ('c0000000-0000-4000-8000-000000000002', 'Accessories', 'accessories', 'Aksesori pendukung untuk meja kerja dan setup harian.', 2, true),
  ('c0000000-0000-4000-8000-000000000003', 'Peripherals', 'peripherals', 'Monitor, keyboard, dan periferal untuk pengalaman kerja yang lebih baik.', 3, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (
  id,
  category_id,
  name,
  slug,
  brand,
  description,
  specifications,
  price,
  stock_quantity,
  thumbnail_url,
  status
) values
  (
    '8f14e45f-ceea-467f-a8a1-0f1c9a1b2c01',
    'c0000000-0000-4000-8000-000000000001',
    'Orbit RX 7800 XT',
    'orbit-rx-7800-xt',
    'Sapphire',
    'Ruang untuk frame rate tinggi, dirancang untuk setup 1440p yang bersih dan senyap.',
    '{"specs": ["16GB GDDR6", "Dual fan", "PCIe 4.0"]}'::jsonb,
    8299000,
    7,
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85',
    'active'
  ),
  (
    '8f14e45f-ceea-467f-a8a1-0f1c9a1b2c02',
    'c0000000-0000-4000-8000-000000000003',
    'Nova 27 QHD',
    'nova-27-qhd',
    'ViewSonic',
    'Panel QHD yang tajam dengan tampilan jernih untuk bermain, bekerja, dan berkarya.',
    '{"specs": ["27 inch IPS", "165Hz", "QHD 2560×1440"]}'::jsonb,
    3499000,
    12,
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
    'active'
  ),
  (
    '8f14e45f-ceea-467f-a8a1-0f1c9a1b2c03',
    'c0000000-0000-4000-8000-000000000001',
    'Core X 7700',
    'core-x-7700',
    'AMD',
    'Prosesor efisien untuk workstation kreatif dan rig gaming yang responsif.',
    '{"specs": ["8 Core", "5.3GHz Boost", "AM5"]}'::jsonb,
    4899000,
    5,
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85',
    'active'
  ),
  (
    '8f14e45f-ceea-467f-a8a1-0f1c9a1b2c04',
    'c0000000-0000-4000-8000-000000000002',
    'Arc 75 Mechanical',
    'arc-75-mechanical',
    'Keychron',
    'Keyboard mekanikal ringkas dengan rasa tekan yang mantap dan profil profesional.',
    '{"specs": ["75% layout", "Hot-swappable", "Wireless"]}'::jsonb,
    1499000,
    18,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
    'active'
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  slug = excluded.slug,
  brand = excluded.brand,
  description = excluded.description,
  specifications = excluded.specifications,
  price = excluded.price,
  stock_quantity = excluded.stock_quantity,
  thumbnail_url = excluded.thumbnail_url,
  status = excluded.status,
  updated_at = now();
