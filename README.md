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

## Panduan langkah demi langkah untuk membuat **Google OAuth 2.0 Client ID** dan memasukkannya ke **Cloudflare Pages**:

---

## Langkah 1: Buka & Konfigurasi Google Cloud Console

1. Buka browser dan masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Jika belum memiliki proyek, klik menu dropdown proyek di bagian kiri atas (sebelah logo Google Cloud) lalu klik **New Project**. Beri nama proyek Anda (misal: `Parenting Portal`) dan klik **Create**.
3. Di bilah pencarian atas, ketik **OAuth consent screen** (Layar persetujuan OAuth) dan pilih menu tersebut:
* Pilih **External** sebagai *User Type*, lalu klik **Create**.
* Isi nama aplikasi (misal: `Parenting Portal`) dan email dukungan Anda.
* Pada bagian *Authorized domains*, masukkan domain utama Anda: `domain.com`.
* Simpan dan selesaikan hingga tahap *Dashboard* OAuth consent screen. *(Pastikan status diubah/di-publish ke **In Production** jika sudah siap untuk publik).*



---

## Langkah 2: Buat OAuth 2.0 Client ID (Web Application)

1. Di menu navigasi sebelah kiri Google Cloud Console, klik **Credentials** (Kredensial).
2. Klik tombol **+ Create Credentials** di bagian atas, lalu pilih **OAuth client ID**.
3. Pada dropdown **Application type**, pilih **Web application**.
4. Beri nama credential ini (misal: `Parenting Portal Web Client`).
5. Gulir ke bawah ke bagian **Authorized JavaScript origins**:
* Klik **+ Add URI**.
* Masukkan URL domain Anda: `[https://domain.com](https://domain.com)`
* *(Opsional)* Jika Anda memiliki URL staging/preview Cloudflare Pages (misal: `[https://xxx.pages.dev](https://xxx.pages.dev)`), Anda juga bisa menambahkan URI tersebut di sini.


6. *(Opsional)* Pada bagian **Authorized redirect URIs**, tambahkan `[https://domain.com](https://domain.com)` jika aplikasi Anda membutuhkan callback redirect.
7. Klik **Create**.
8. Pop-up akan muncul menampilkan **Client ID** Anda (berbentuk string panjang seperti `xxxxxxxxx-xxxxxxxx.apps.googleusercontent.com`). **Salin Client ID ini.**

---

## Langkah 3: Tambahkan Variabel di Cloudflare Pages

1. Masuk ke [Dashboard Cloudflare](https://dash.cloudflare.com/).
2. Navigasi ke **Workers & Pages** di sidebar kiri, lalu pilih proyek Pages Anda.
3. Klik tab **Settings** di bagian atas, lalu pilih menu **Environment variables** di sidebar kiri.
4. Di seksi **Environment variables**, klik **Add variable** (atau *Edit variables* jika sudah ada):
* **Variable name:** `VITE_GOOGLE_CLIENT_ID`
* **Value:** *(Tempelkan Client ID yang Anda salin dari Google Cloud Console)*
* **Environment:** Pilih *Production* (dan *Preview* jika diperlukan).


5. Klik **Save**.
6. **Penting:** Agar variabel lingkungan bersawalan `VITE_` ini dibaca saat proses kompilasi frontend (Vite Build), Anda perlu **melakukan Retry Deployment / Trigger Build ulang** pada Cloudflare Pages Anda.

7. 
---
Berikut adalah penulisan ulang agar tampil lebih rapi, terstruktur, dan mudah dipahami:

---

### 🏆 Rekomendasi Utama: Gunakan `wrangler.toml` (*Infrastructure as Code*)

Sangat disarankan **100% menggunakan file `wrangler.toml**` sebagai satu-satunya acuan konfigurasi (*Single Source of Truth*), alih-alih mengatur *binding* secara manual melalui Dashboard Cloudflare Pages.

#### 💡 Keunggulan Menggunakan `wrangler.toml`:

* **Mencegah *Human Error* & *Mismatch* ID:** Seluruh ID database aktif (contoh: `25ef0e79-4cfe-4cee-a71b-2e9009886a5b`) tercatat transparan di dalam repositori. Anda tidak perlu menebak konfigurasi yang pernah dibuat di dashboard.
* **Sinkronisasi Otomatis saat Deploy:** Setiap kali Anda melakukan `git push` atau *redeploy*, Cloudflare Pages akan otomatis membaca `wrangler.toml`. Tidak perlu mengeklik tombol *"Add Binding"* secara manual lagi.
* **Mendukung Fitur Modern Cloudflare:** Cloudflare Pages versi terbaru secara otomatis memprioritaskan konfigurasi dari `wrangler.toml` dan mengunci (*lock*) perubahan manual di dashboard untuk mencegah konflik data.

---

### 🛡️ Panduan Lokasi Konfigurasi (Best Practices)

| Komponen | Lokasi Konfigurasi Terbaik | Keterangan & Catatan |
| --- | --- | --- |
| **D1 Database Binding** (`DB`) | `wrangler.toml` (`[[d1_databases]]`) | Database ID bersifat aman untuk dicatat di file repositori Git. |
| **KV Namespace** (`CONFIG_KV`) | `wrangler.toml` (`[[kv_namespaces]]`) | Pasang jika membutuhkan *edge caching* ekstra cepat, atau hapus jika cukup memakai D1 saja. |
| **Variabel Umum** (`SITE_URL`, `GITHUB_REPO`) | `wrangler.toml` (`[vars]`) | Memudahkan perubahan konfigurasi jika ada pergantian domain di masa depan. |
| **Kredensial Rahasia** (`GITHUB_TOKEN`, `ADMIN_PASSWORD`) | **Dashboard Cloudflare**<br>

<br>*(Settings → Environment Variables)* | **Wajib di Dashboard** agar token rahasia tidak bocor ke publik melalui repositori Git. |

---

### 🔍 Tips Pengecekan Real-Time

Jika Anda membuat database baru atau ingin memverifikasi koneksi database di lingkungan *production*, buka *endpoint* berikut melalui browser:

👉 **`[https://domain.com/api/debug-d1](https://domain.com/api/debug-d1)`**

*Endpoint* ini akan langsung menampilkan status koneksi `env.DB`, daftar tabel yang terdeteksi, serta total jumlah komentar secara *real-time*.




---

### 🗺️ Diagram Alur  dan urutan kerja file, Singkat :

```text
1. Browser Request (/post/slug)
       ↓
2. functions/api/[[path]].ts        ──► (Edge SSR: Ambil Data & Inject Meta Tags)
       ↓
3. index.html & src/main.tsx        ──► (HTML Skeleton & Inisialisasi React)
       ↓
4. src/App.tsx                      ──► (Routing & Manajemen State Artikel)
       ↓
5. src/components/ArticleReader.tsx ──► (Parser Markdown, Iklan, Autolink & TOC)
       ↓
6. DOM Output                       ──► (<div class="article-body">...</div>)

```

---

### 📂 Urutan Kerja File Secara Rinci

**1. `functions/api/[[path]].ts` (Cloudflare Pages Function / Edge SSR)**

* **Kapan Bekerja:** Saat URL artikel (misal: `[https://domain.com/post/judul-artikel](https://domain.com/post/judul-artikel)`) pertama kali diakses oleh pengguna atau bot crawler (Googlebot, Facebook, Twitter).
* **Tugas Utama:**
* **Ekstraksi URL:** Mengambil *slug* dari URL (`path.split('/')[2]`).
* **Fetch Data:** Mengambil data artikel (judul, ringkasan, gambar sampul, penulis) dari Database D1 (`SELECT ... FROM posts WHERE slug = ?`) dengan fallback ke GitHub Markdown.
* **Inject Meta Tags (SEO/OG):** Memodifikasi `index.html` secara langsung dengan menyuntikkan:
* Tag `<title>` dinamis sesuai judul artikel.
* OpenGraph Meta (`og:title`, `og:image`, `og:description`).
* Twitter Card.
* Schema.org NewsArticle (JSON-LD) untuk Google Search.


* **Response:** Mengirimkan dokumen HTML yang sudah siap ke browser.



---

**2. `index.html` & `src/main.tsx` (Entry Point & Mount)**

* **Kapan Bekerja:** Ketika file HTML tiba di browser pengguna.
* **Tugas Utama:**
* `index.html`: Menyediakan struktur dasar HTML, wadah `<div id="root"></div>`, font, serta konfigurasi CSS Tailwind.
* `src/main.tsx`: Menjalankan React dan me-render komponen utama `<App/>` ke dalam elemen `#root`.



---

**3. `src/App.tsx` (Router & State Coordinator)**

* **Kapan Bekerja:** Saat aplikasi React sudah aktif di browser.
* **Tugas Utama:**
* **Routing:** Membaca `window.location.pathname` untuk mendeteksi rute artikel (`/post/:slug` atau `/artikel/:slug`).
* **Matching Data:** Mencocokkan *slug* dengan data artikel yang ada di database atau state.
* **Rendering:** Menampilkan komponen `<ArticleReader article="{selectedArticle}"/>`.



---

**4. `src/components/ArticleReader.tsx` (Engine Pemrosesan HTML Artikel)**

* **Kapan Bekerja:** Bertanggung jawab memproses dan mengonversi isi artikel dari Markdown menjadi tampilan HTML.
* **Tahapan Konversi:**
1. **TOC & Heading Generator:** Mengubah header Markdown (`#`, `##`, `###`) menjadi tag `<h2 id="...">` dan `<h3 id="...">` serta menyusun Daftar Isi (Table of Contents) otomatis.
2. **Typography Parser:** Mengubah sintaks Markdown (bold, italic, blockquote, list) menjadi elemen HTML semantik berorientasi Tailwind (`<strong>`, `<blockquote>`, `<li>`).
3. **Ad Injection:** Menghitung jumlah paragraf, lalu menyisipkan blok iklan responsif secara otomatis setelah paragraf ke-2.
4. **Autolinks Injector:** Mengambil data kata kunci dari `/api/autolinks` (D1 Database) dan otomatis mengubah teks yang cocok menjadi hyperlink (`<a href="...">`).
5. **DOM Output:** Menyajikan kode HTML akhir ke layar via React:
```tsx
<div 
  className="article-body prose prose-stone max-w-none prose-headings:font-serif prose-a:text-amber-600 prose-img:rounded-2xl"
  dangerouslySetInnerHTML={{ __html: renderedHtml }}
/>

```





---

**5. `src/components/CommentsSection.tsx` (Komponen Komentar)**

* **Kapan Bekerja:** Saat pengguna menggeser (*scroll*) layar ke bagian bawah artikel.
* **Tugas Utama:** Terhubung ke endpoint `/api/comments?postSlug=...` di Cloudflare D1 untuk memuat daftar komentar serta menangani pengiriman komentar baru dari pembaca.

---
## ✨ FITUR UNGGULAN ENGINE
1. **Auto-Linking Engine SEO On-Page:**
   - Semua kata kunci terdaftar (seperti *"pola asuh"*, *"balita"*, *"stunting"*, *"sensory play"*) secara otomatis diubah menjadi internal link menuju artikel terkait.
2. **Auto-Save Draft:**
   - Draf tulisan tersimpan otomatis ke Cloudflare D1 setiap 5 detik agar tidak hilang saat mati lampu atau koneksi terputus.
3. **Optimasi Gambar WebP:**
   - Gambar yang diunggah dikompresi ke format WebP via Cloudflare Edge untuk kecepatan memuat halaman maksimal.
4. **Zero Bloat & Dynamic Sitemap/RSS:**
   - Generasi otomatis `/sitemap.xml` dan `/feed.xml` langsung dari Cloudflare D1 untuk kemudahan indeks Google Search Console.
