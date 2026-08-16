# 🚀 Panduan Setup Cloud-Native Blog Engine `domain.com` (100% Browser / Tanpa Terminal / Tanpa Software Lokal)

Sistem Blog Engine modern, ultra-cepat, dan SEO-friendly ini beroperasi sepenuhnya secara **cloud-native** menggunakan **Cloudflare Pages / Workers**, **Cloudflare D1 (Serverless SQLite)**, dan **GitHub API**. 

Penulis dan Admin dapat mengelola artikel, gambar, SEO meta, serta sistem auto-linking langsung dari browser tanpa pernah menginstall Node.js, npm, Git, atau Terminal di laptop.

---

## 📋 Prasyarat (Semua Gratis)
1. Akun **GitHub** ([github.com](https://github.com))
2. Akun **Cloudflare** ([cloudflare.com](https://cloudflare.com))
3. Domain **domain.com** yang DNS-nya sudah terhubung ke Cloudflare.

---

## 🛠️ LANGKAH 1: Duplikasi Repository di GitHub (1 Menit)
1. Buka repositori kode ini di GitHub.
2. Klik tombol **Fork** di pojok kanan atas untuk menyalin repositori ke akun GitHub Anda.
3. Beri nama repositori, contoh: `parenting-my-id`.
4. Selesai! Repositori Anda sekarang siap digunakan sebagai sumber deployment otomatis.

---

## 🗄️ LANGKAH 2: Buat Database Cloudflare D1 via Browser (2 Menit)
1. Buka Dashboard Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com)).
2. Pilih menu **Workers & Pages** -> **D1 SQL Database**.
3. Klik tombol **Create Database**.
4. Isi Nama Database: `parenting-db`, lalu klik **Create**.
5. Salin **Database ID** yang muncul (contoh: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`).
6. Masuk ke tab **Console** di dalam halaman database `parenting-db` tersebut.
7. Buka file `schema.sql` di repositori GitHub Anda, **copy seluruh isi kodenya**, dan **paste** ke dalam D1 Console Cloudflare.
8. Klik **Execute SQL**. Database D1 beserta data awal (artikel, user admin, dan autolinks) kini telah aktif!

---

## 🔑 LANGKAH 3: Buat Personal Access Token GitHub untuk Unggah Gambar (1 Menit)
Penulis dapat mengunggah gambar langsung di Editor WYSIWYG, yang akan disimpan secara otomatis ke repositori GitHub `/public/uploads/`:
1. Buka [github.com/settings/tokens](https://github.com/settings/tokens).
2. Klik **Generate new token (classic)**.
3. Beri nama Note: `Cloudflare Image Uploader`.
4. Beri centang pada centang hak akses **`repo`** (Full control of private repositories).
5. Klik **Generate token** dan salin kode tokennya (contoh: `ghp_xxxxxxx`).

---

## ⚡ LANGKAH 4: Deploy ke Cloudflare Pages / Workers via Browser (3 Menit)
1. Kembali ke Dashboard Cloudflare -> **Workers & Pages**.
2. Klik **Create application** -> Tab **Pages** -> **Connect to Git**.
3. Pilih akun GitHub Anda dan pilih repositori `parenting-my-id`.
4. Klik **Begin setup**.
5. Pada bagian **Build settings**:
   - **Framework preset**: `Vite` (atau `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Buka bagian **Environment variables (advanced)** dan tambahkan variabel berikut:
   - `SITE_URL`: `https://domain.com`
   - `GITHUB_TOKEN`: *(Paste Token GitHub dari Langkah 3)*
   - `GITHUB_OWNER`: *(Username GitHub Anda)*
   - `GITHUB_REPO`: `parenting-my-id`
   - `GITHUB_BRANCH`: `main`
7. Edit dan sesuaikan isi wrangler.toml seperti isian nomor 6 tersebut. **Jangan berbeda value nya**!
8. Klik **Save and Deploy**. Cloudflare akan membangun dan mempublikasikan situs Anda secara otomatis!
---

## 🔗 LANGKAH 5: Hubungkan Binding Database D1 & Domain `domain.com`
1. Setelah deployment pertama selesai, buka proyek Pages Anda di Cloudflare -> Tab **Settings** -> **Functions**.
2. Gulir ke bawah ke bagian **D1 database bindings**.
3. Klik **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Pilih `parenting-db`
4. Simpan perubahan.
5. Lalu - Masuk ke tab **Custom domains** -> Klik **Set up a custom domain**.
6. Ketik `domain.com` dan klik **Continue**. Cloudflare akan mengurus sertifikat SSL HTTPS secara otomatis!

---

## 🔗 LANGKAH 6: Hubungkan Domain `domain.com`
1. Masuk ke tab **Custom domains** -> Klik **Set up a custom domain**.
2. Ketik `domain.com` dan klik **Continue**. Cloudflare akan mengurus sertifikat SSL HTTPS secara otomatis!

---

## 🔑 AKSES PORTAL ADMIN (`/admin`) & CARA PENGGUNAAN
Situs Anda kini aktif di **https://domain.com**!
Akses portal admin berbasis web di:
👉 **`https://domain.com/admin`**

### Kredensial Login Default:
- **Akun Admin (Akses Penuh):**
  - Email: `admin@...`
  - Password: `...`
- **Akun Penulis / Writer (Editor Artikel):**
  - Email: `penulis@`
  - Password: ``

---
DEBUG: https://domain.com/api/debug-d1


---


🏆 Rekomendasi Utama: Gunakan wrangler.toml sebagai Single Source of Truth
Sangat disarankan 100% menggunakan wrangler.toml (Infrastructure as Code) dan tidak mencampur konfigurasi manual di Dashboard Pages.
Alasan Mengapa wrangler.toml Jauh Lebih Baik:
Pencegahan Human Error & Mismatch ID:
Ketika Anda membuka repositori di masa depan, Anda langsung melihat dengan jelas database ID mana yang sedang aktif (25ef0e79-4cfe-4cee-a71b-2e9009886a5b) tanpa perlu menebak-nebak apa yang pernah diklik di dashboard.
Otomatis Sync saat Deploy:
Setiap kali ada commit/push baru atau redeploy di branch manapun, Cloudflare Pages akan otomatis membaca wrangler.toml tanpa perlu klik manual tombol "Add Binding" atau "Retry Deployment" di dashboard.
Pesan "Managed through wrangler.toml":
Cloudflare Pages generasi sekarang secara default mengunci pengaturan binding di dashboard jika mendeteksi adanya file wrangler.toml, sehingga jika mencoba mengubah via dashboard sering kali diabaikan oleh sistem.
🛡️ 4 Aturan Praktis (Best Practices) untuk Proyek Ini:
Komponen	Tempat Konfigurasi Terbaik	Keterangan
D1 Database Binding (DB)	wrangler.toml ([[d1_databases]])	ID database publik aman dicatat di file konfigurasi.
KV Namespace (CONFIG_KV)	wrangler.toml ([[kv_namespaces]])	Pasang jika ingin edge caching, atau hapus jika cukup D1 saja.
Variabel Umum (SITE_URL, GITHUB_REPO)	wrangler.toml ([vars])	Mudah diubah jika domain berganti.
Rahasia / Secrets (GITHUB_TOKEN, ADMIN_PASSWORD)	Cloudflare Dashboard (Settings → Environment Variables)	Wajib di Dashboard agar token GitHub tidak bocor ke publik di file Git.
💡 Tips Cepat Pengecekan Selanjutnya:
Jika suatu saat Anda membuat database baru atau ingin memverifikasi koneksi database di lingkungan production:
Cukup buka endpoint: https://news.biz.id/api/debug-d1
Endpoint ini akan langsung mengembalikan tabel apa saja yang terbaca, total jumlah komentar, dan status koneksi env.DB secara real-time.


## ✨ FITUR UNGGULAN ENGINE
1. **Auto-Linking Engine SEO On-Page:**
   - Semua kata kunci terdaftar (seperti *"pola asuh"*, *"balita"*, *"stunting"*, *"sensory play"*) secara otomatis diubah menjadi internal link menuju artikel terkait.
2. **Auto-Save Draft:**
   - Draf tulisan tersimpan otomatis ke Cloudflare D1 setiap 5 detik agar tidak hilang saat mati lampu atau koneksi terputus.
3. **Optimasi Gambar WebP:**
   - Gambar yang diunggah dikompresi ke format WebP via Cloudflare Edge untuk kecepatan memuat halaman maksimal.
4. **Zero Bloat & Dynamic Sitemap/RSS:**
   - Generasi otomatis `/sitemap.xml` dan `/feed.xml` langsung dari Cloudflare D1 untuk kemudahan indeks Google Search Console.
