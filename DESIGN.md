# BlueComputer Design System

Dokumen ini mencatat bahasa visual dan aturan UI yang dipakai di BlueComputer. Gunakan sebagai acuan saat menambah atau mengubah halaman agar storefront dan back office tetap terasa sebagai satu produk.

## Identitas visual

BlueComputer adalah toko komputer yang terasa terkurasi, teknis, dan tenang. UI memakai komposisi editorial dengan ruang kosong, tipografi display yang tegas, garis tipis, dan aksen biru yang punya fungsi. Produk menjadi fokus utama.

Hindari dekorasi sci-fi generik, glow berlebihan, gradient ungu, panel kaca bertumpuk, penghitung aktivitas palsu, klaim stok palsu, dan interaksi yang tidak membantu orang memilih atau membeli produk.

## Warna dan tema

Warna disediakan sebagai CSS custom properties di `src/app/globals.css`. Komponen harus menggunakan token ini supaya tema terang dan gelap berubah serentak.

| Token | Light | Dark | Pemakaian |
| --- | --- | --- | --- |
| `--bg` | `#f3f5f7` | `#08121d` | Latar halaman |
| `--surface` | `#ffffff` | `#102235` | Kartu, form, panel |
| `--ink` | `#102235` | `#edf5ff` | Teks utama, tombol utama |
| `--muted` | `#5d6b78` | `#a6b5c3` | Teks sekunder dan metadata |
| `--line` | `#d6dce2` | `#23394d` | Border dan pemisah |
| `--blue` | `#1267ff` | `#70a5ff` | Aksi, tautan, penekanan |
| `--blue-soft` | `#dce9ff` | `#18355d` | Latar pendukung dan placeholder media |
| `--dark` | `#0b1927` | `#eaf3ff` | Permukaan manifesto kontras |

Gunakan biru untuk aksi atau penekanan penting, bukan untuk mewarnai semua elemen. Teks pada surface harus tetap terbaca di kedua tema. Untuk blok brand khusus seperti manifesto, pertahankan warna teks eksplisit yang sudah diuji secara visual.

Theme toggle menyimpan pilihan di `localStorage` pada key `bluecomputer-theme`; bila belum ada pilihan, tema mengikuti preferensi sistem. Script tema awal berada di `src/app/layout.tsx` untuk mencegah kilatan tema yang salah. Hormati `data-theme="dark"` sebagai sumber tema aktif.

## Tipografi

- Display: Space Grotesk melalui CSS variable `--font-display`.
- Body dan UI: Manrope melalui CSS variable `--font-body`.
- Headline besar memakai ukuran responsif `clamp()`, line-height rapat, bobot sedang, dan tracking negatif yang konsisten.
- Paragraf panjang memakai ukuran sekitar 15–16px, warna `--muted`, dan line-height sekitar 1.7.
- Metadata memakai `.eyebrow`: 11px, tebal, uppercase, dan tracking lebar.
- Harga harus mudah ditemukan dan tidak memakai ukuran yang lebih kecil dari metadata produk.

Pertahankan hierarki display/body ini. Jangan mengganti semua teks dengan font display atau memakai uppercase bertracking lebar untuk paragraf biasa.

## Spacing, bentuk, dan batas konten

- Gunakan ritme berbasis kelipatan 4px/8px: 8, 12, 16, 24, 32, 48, 64, 96, 128.
- `.shell` adalah pembungkus utama. Lebar maksimum 1360px; gutter 24px desktop dan 16px pada layar kecil.
- Radius utama tajam: `--radius: 8px`. Tombol icon/avatar yang benar-benar bundar boleh memakai `50%`; toggle memakai bentuk pill.
- Gunakan garis `1px solid var(--line)` untuk memisahkan area. Bayangan hanya sebagai aksen pada kartu tertentu, bukan default semua permukaan.
- Setiap card atau panel perlu padding cukup agar teks tidak menempel pada tepi; baseline 16px.

## Komposisi dan layout

### Storefront

- Header sticky, tipis, dan transparan dengan blur ringan; navigasi utama ringkas.
- Hero memakai grid asimetris: copy dan CTA berdampingan dengan satu gambar produk/setup besar.
- Media utama boleh memakai clip-path, crop, atau lingkaran dekoratif, tetapi jangan menimpa keterbacaan headline.
- Bagian kategori menjadi jalur navigasi singkat. Kartu produk memakai rasio media konsisten, lalu metadata, nama, harga, dan aksi.
- Editorial/journal dan manifesto memecah ritme katalog tanpa menambah dekorasi yang tidak punya tujuan.

### Back office

- Dashboard lebih padat daripada storefront, tetapi tetap menggunakan token warna, tipografi, border, dan focus state yang sama.
- Navigasi admin memiliki hierarki jelas dan indikator halaman aktif.
- KPI dan tabel harus mengutamakan label, angka, status, serta tindakan yang bisa dipahami tanpa warna saja.

### Breakpoint yang dipakai

- Di atas 960px: komposisi desktop, katalog empat kolom pada storefront dan tiga kolom di katalog.
- Sampai 960px: kurangi jumlah kolom dan rapatkan jarak.
- Sampai 700px: nav desktop diganti menu mobile; hero, detail produk, checkout dan form menjadi satu kolom; admin memakai nav yang dapat digeser horizontal.
- Jaga layout pada lebar 375px, 768px, dan 1440px. Hindari fixed width yang memaksa scroll horizontal.
- Desktop dan mobile sama-sama perlu akses ke semua fungsi; jangan menyembunyikan aksi penting di hover saja.

## Komponen dan pola UI

- `.button`: aksi utama berbentuk persegi dengan minimum tinggi 48px, jarak icon konsisten, dan focus ring yang terlihat.
- `.button--solid`: aksi utama berkontras tinggi.
- `.button--outline`: aksi sekunder.
- `.text-link`: navigasi sekunder dengan icon yang bergerak sedikit saat hover.
- `.icon-button`: tombol bundar untuk tindakan header/icon; wajib memiliki accessible name.
- `.product-card`: gambar sebagai tautan ke detail, label opsional, harga yang mudah dibaca, serta tombol tambah ke cart terpisah.
- `.eyebrow`: metadata atau pengenal section, bukan teks konten utama.
- Empty state perlu menjelaskan situasi dan memberi langkah lanjut yang relevan.
- Form memakai label yang tampak, input native, pesan error/status dekat dengan kontrol, dan tombol submit dengan state loading.

Gunakan `<a>`/Next `Link` untuk navigasi dan `<button>` untuk aksi. Jangan menjadikan `div` atau seluruh card sebagai tombol jika di dalamnya ada beberapa aksi.

## Motion dan respons interaksi

- Gerakan harus menjelaskan fokus, memberi feedback, atau menghubungkan dua state.
- Gunakan easing non-linear untuk hover/reveal, durasi pendek untuk feedback kontrol, dan stagger secukupnya pada konten yang terkait.
- Hero dapat memakai reveal dengan perpindahan/scale yang halus. Kartu produk dapat memperbesar gambar sedikit saat pointer hover.
- Tombol memberi respons posisi atau bayangan; tautan icon memberi perpindahan kecil.
- Theme toggle menggeser thumb dan mentransisikan token warna.
- Hindari animasi dekoratif yang terus bergerak, parallax berlebihan, cursor khusus pada touch, dan motion yang menunda interaksi.
- Hormati `prefers-reduced-motion: reduce`; hilangkan gerak non-esensial dan gunakan perubahan state langsung.

## Aksesibilitas

- Gunakan landmark HTML semantik, urutan heading yang masuk akal, dan label input yang terlihat.
- Semua tindakan dapat diakses dengan keyboard dan mempunyai `:focus-visible` yang kontras.
- Icon-only button harus memiliki `aria-label`; dekorasi murni diberi `aria-hidden="true"`.
- Jangan menyampaikan status hanya dengan warna. Tambahkan teks, icon, atau label status.
- Pastikan kontras body text sekurangnya WCAG AA (4.5:1) dan teks besar sekurangnya 3:1 pada setiap kombinasi tema.
- Jangan mengandalkan hover untuk mengungkap aksi utama; sediakan juga di touch dan keyboard.
- Gambar produk memakai alt text yang menjelaskan produk/adegan. Alt kosong hanya untuk dekorasi.

## Media dan konten

- Gunakan gambar produk yang konsisten dari sisi crop, kualitas, dan latar agar katalog terasa terkurasi.
- Simpan alt text yang deskriptif di data produk.
- Beri ukuran intrinsik atau aspect ratio agar layout stabil sebelum gambar selesai dimuat.
- Lazy-load media di bawah fold; media hero boleh diprioritaskan.
- Konten fixture harus jelas bersifat contoh sampai diganti katalog asli. Jangan menyajikan stok, harga, review, atau performa penjualan fiktif sebagai data live.
- Copy memakai bahasa Indonesia yang ringkas, spesifik, dan membantu keputusan. Istilah produk berbahasa Inggris boleh dipertahankan bila memang lazim di katalog komputer.

## Batas produk yang memengaruhi UI

- Checkout membutuhkan autentikasi; metode pembayaran tidak diminta saat sign up.
- Jangan meminta atau menyimpan nomor kartu/CVV di UI BlueComputer. Pembayaran dimasukkan melalui Midtrans.
- Buyer hanya melihat order sendiri. Menu admin tidak boleh dianggap sebagai kontrol keamanan; hak akses harus ditegakkan server/database.
- `PC Builder` saat ini adalah placeholder. Jangan membuat klaim kompatibilitas atau mengubahnya menjadi configurator sebelum aturan kompatibilitas dan sumber spesifikasi produk siap.
- Data kart, auth, katalog, dan dashboard yang belum tersambung ke Supabase harus diberi state kosong atau contoh yang jujur.

## Implementasi dan lokasi sumber

- Token, layout responsif, komponen global: `src/app/globals.css`.
- Font, metadata, dan penerapan tema awal: `src/app/layout.tsx`.
- Header dan navigasi: `src/components/store-header.tsx`.
- Theme control: `src/components/theme-toggle.tsx`.
- Kartu produk dan model data fixture: `src/components/product-card.tsx`, `src/lib/products.ts`.
- Motion dan komposisi homepage: `src/app/page.tsx`.

Jika desain berubah, perbarui token dan komponen reusable sebelum menambahkan override halaman yang luas. Hindari duplikasi nilai warna dan breakpoint di banyak file.
