# BlueComputer

Premium computer-commerce storefront untuk hardware dan accessories terkurasi. BlueComputer dibangun dengan pengalaman editorial modern, mode terang/gelap yang setara, dan fondasi aman untuk Supabase serta Midtrans Snap Sandbox.

> Status: UI storefront, katalog fixture, cart lokal, autentikasi, akun buyer, workspace staff, checkout Midtrans Snap, webhook pembayaran, kontrak Supabase, dan seed katalog sudah tersedia. Validasi live menunggu proyek Supabase aktif dan kredensial Sandbox; deployment Vercel belum diaktifkan.

## Fitur

- Homepage editorial responsif dengan motion halus dan reduced-motion fallback.
- Light/dark mode yang disimpan secara lokal.
- Katalog, detail produk, kategori, cart, checkout, akun, dan halaman PC Builder “coming soon”.
- Cart browser: tambah produk, ubah kuantitas, hapus produk, serta perhitungan subtotal.
- Sign up/sign in Supabase ketika environment variable dikonfigurasi, dengan redirect kembali ke halaman tujuan.
- Role model `buyer`, `employee`, dan `owner`, dengan dasar Row Level Security (RLS).
- Akun buyer: ringkasan, profil, alamat pengiriman, riwayat pesanan, detail pesanan, dan lanjutkan pembayaran.
- Workspace staff: ringkasan operasional, antrean pesanan, pengelolaan harga/stok/status produk, serta pengelolaan role khusus owner.
- Checkout terautentikasi: alamat tersimpan atau form alamat inline, kalkulasi ulang harga/stok di server, pembuatan order, dan token Midtrans Snap.
- Webhook Midtrans: verifikasi signature SHA512, idempotensi lewat `payment_events`, pemetaan status, dan pengurangan stok setelah pembayaran diterima.

## Stack

- Next.js 16, React 19, TypeScript, App Router
- Tailwind CSS 4 dan Framer Motion
- Supabase Auth, PostgreSQL, Storage, dan RLS
- Midtrans Snap Sandbox
- Vercel-ready deployment target

## Menjalankan secara lokal

Prasyarat: Node.js 22+ dan npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

Perintah lain:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Environment variables

Salin `.env.example` menjadi `.env.local`, lalu isi nilai berikut tanpa memasukkannya ke Git.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Aturan keamanan:

- Variabel dengan prefix `NEXT_PUBLIC_` boleh berada di browser.
- `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` hanya untuk server.
- Jangan commit `.env`; file itu sudah diabaikan oleh `.gitignore`. Gunakan `.env.local` untuk nilai lokal.
- Jangan menyimpan nomor kartu, CVV, atau detail payment method pengguna. Midtrans Snap menangani input pembayaran.
- `NEXT_PUBLIC_SITE_URL` dipakai untuk callback `finish` Midtrans. Isi dengan origin publik saat deploy; jika kosong, route memakai origin request.

## Supabase

Sumber schema deklaratif berada di [supabase/schemas/bluecomputer.sql](supabase/schemas/bluecomputer.sql). Schema ini memuat:

- profile, address, dan `user_roles`;
- kategori, produk, gambar produk, cart, dan item cart;
- order, order item, payment event, dan audit log;
- trigger yang membuat profile dan role `buyer` ketika user Auth dibuat;
- RLS untuk data buyer, akses staff, serta pengelolaan owner;
- helper `public.decrement_order_stock(uuid)` yang hanya dapat dipanggil service role;
- index untuk lookup order, item, alamat, produk, dan payment event.

Data seed ada di [supabase/seed.sql](supabase/seed.sql). ID produk dan kategori di seed sengaja sama dengan fixture di `src/lib/products.ts`, sehingga cart browser dan checkout database menunjuk ke baris yang sama.

Langkah menerapkan database:

1. Inisialisasi CLI bila `supabase/config.toml` belum ada, lalu link proyek yang benar:
   ```bash
   supabase init
   supabase link --project-ref <ref>
   ```
2. Generate migration dari schema deklaratif, lalu review hasilnya:
   ```bash
   supabase db diff -f initial_schema
   ```
3. Terapkan migration pada environment target:
   ```bash
   supabase db push
   ```
4. Seed katalog. `supabase db reset` menerapkan migration yang sudah digenerate lalu menjalankan `supabase/seed.sql`. Untuk proyek remote, jalankan seed secara terkendali:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
5. Uji RLS sebagai buyer, employee, dan owner dengan user berbeda.
6. Daftarkan satu akun owner lebih dulu lewat UI, lalu naikkan role-nya dari SQL/dashboard terkendali:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'owner' from auth.users where email = 'owner@example.com'
   on conflict (user_id) do update set role = 'owner';
   ```
   User baru selalu menjadi buyer. Jangan menaikkan role lewat metadata user yang dapat diedit sendiri.

Jangan menganggap schema lokal sebagai bukti bahwa policy atau trigger sudah berjalan di proyek Supabase sampai migration diterapkan dan diuji live.

## Midtrans Snap Sandbox

Endpoint berikut tersedia:

| Route | Tujuan |
| --- | --- |
| `POST /api/checkout/snap` | Membuat Snap transaction token dari server setelah order dan item tervalidasi. |
| `POST /api/payments/midtrans` | Memvalidasi signature notifikasi Midtrans sebelum perubahan status payment/order. |

Alur checkout:

1. Buyer harus masuk. `/checkout` menampilkan gate autentikasi jika belum ada sesi.
2. Browser mengirim `{ items: [{ id, quantity }], addressId }` ke `POST /api/checkout/snap`.
3. Server memvalidasi alamat milik buyer, mengambil produk dari Supabase (fallback ke fixture), lalu menghitung ulang harga, stok, dan ongkir.
4. Server membuat order `pending_payment` beserta item, kemudian meminta token Snap dengan total yang sudah dihitung server.
5. Snap menangani input pembayaran. BlueComputer tidak menerima atau menyimpan data kartu.
6. Webhook memverifikasi signature SHA512, mencatat event unik, memperbarui status, dan mengurangi stok saat pembayaran menjadi `paid`.

Untuk integrasi Sandbox nyata:

1. Isi `MIDTRANS_SERVER_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dari akun Midtrans Sandbox.
2. Set `MIDTRANS_IS_PRODUCTION=false` untuk Sandbox.
3. Konfigurasikan URL notifikasi ke `https://<domain>/api/payments/midtrans`; URL harus dapat dijangkau publik.
4. Isi `NEXT_PUBLIC_SITE_URL` dengan origin publik agar callback `finish` mengarah ke halaman pesanan yang benar.
5. Uji status `pending`, `paid`, `expired`, `deny`, dan `cancel`, termasuk pengiriman notifikasi duplikat.

Endpoint akan mengembalikan `503` bila server key atau service-role key belum tersedia; ini adalah perilaku aman untuk development tanpa secret.

## Struktur proyek

```text
src/
  app/                 # Route App Router dan API routes
  components/          # UI reusable, theme, cart, auth
  lib/                 # Produk fixture dan Supabase clients
  types/               # Deklarasi tipe pihak ketiga
supabase/schemas/      # Source-of-truth schema deklaratif
supabase/seed.sql      # Katalog awal yang cocok dengan fixture
Plan.md                # Blueprint produk dan implementasi
```

## Route utama

| Route | Fungsi |
| --- | --- |
| `/` | Homepage dan koleksi pilihan |
| `/katalog` | Katalog produk |
| `/produk/[slug]` | Detail produk |
| `/keranjang` | Cart browser |
| `/checkout` | Checkout terautentikasi dengan Midtrans Snap |
| `/masuk`, `/daftar` | Autentikasi Supabase |
| `/akun` | Ringkasan akun buyer |
| `/akun/profil` | Nama dan nomor telepon |
| `/akun/alamat` | Alamat pengiriman tersimpan |
| `/akun/pesanan` | Riwayat pesanan |
| `/akun/pesanan/[orderNumber]` | Detail pesanan dan lanjutkan pembayaran |
| `/admin` | Dashboard owner/employee |
| `/admin/order` | Antrean pesanan dan status operasional |
| `/admin/produk` | Harga, stok, dan status produk |
| `/admin/pengguna` | Pengelolaan role khusus owner |
| `/pc-builder` | Placeholder fase lanjutan |

## Validasi terakhir

Perintah berikut telah lulus pada checkout ini:

```text
npm run lint
npm run typecheck
npm run build
```

Build memprerender 19 route dan mendaftarkan proxy Supabase untuk refresh sesi. Smoke test manual untuk storefront, katalog, produk, cart, checkout, auth, akun, admin, dan PC Builder tetap diperlukan setelah database aktif. Validasi Supabase live, Midtrans Sandbox, webhook publik, RLS dengan tiga role, serta deployment Vercel masih memerlukan kredensial dan environment target.

## Roadmap dekat

1. Aktifkan proyek Supabase, terapkan migration, dan jalankan `supabase/seed.sql`.
2. Uji alur buyer end-to-end: daftar, simpan alamat, checkout, bayar, dan lihat status.
3. Uji RLS dan workspace staff sebagai buyer, employee, dan owner; tetapkan owner pertama lewat SQL terkendali.
4. Aktifkan webhook Midtrans Sandbox dan uji `pending`, `paid`, `expired`, `deny`, `cancel`, serta notifikasi duplikat.
5. Sambungkan katalog storefront langsung ke tabel `products` agar perubahan admin langsung terlihat.
6. Tambahkan storage policy untuk foto produk, lalu deploy preview Vercel.

## Desain

UI menggunakan basis technical-blue editorial, bukan dark-neon generik: tipografi display, komposisi asimetris, media produk, motion terukur, dan panel operasional yang lebih padat. Seluruh animasi dekoratif menghormati `prefers-reduced-motion`.
