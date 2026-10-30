# Tring! Procurement Monitor

Executive Procurement & Datamart Dashboard untuk TBO, Divisi Digital. Data diambil live dari Google Sheet dan ditampilkan di 7 bagian: Overview, Payment Deadlines, Quota Tracker, Procurement Ledger, Anggaran, Request Datamart, dan Data Audit Promo.

Tanpa build step dan tanpa framework. Cukup push ke GitHub, lalu import ke Vercel.

## Deploy

### 1. Push ke GitHub

```bash
cd dashboard-tbo
git init
git add .
git commit -m "Dashboard monitoring TBO"
git branch -M main
git remote add origin https://github.com/<akun>/<nama-repo>.git
git push -u origin main
```

Pakai repo **private**. Folder `dev/` berisi salinan data sheet untuk uji lokal, jadi jangan di-publish.

### 2. Import ke Vercel

1. Vercel, **Add New > Project**, pilih repo tadi.
2. Framework Preset: **Other**. Kosongkan Build Command dan Output Directory.
3. Buka **Environment Variables**, tambahkan:

| Nama | Isi | Wajib |
|---|---|---|
| `SHEET_ID` | ID Google Sheet, bagian antara `/d/` dan `/edit` di URL sheet | Ya |
| `TAB_PROCUREMENT` | Nama tab pengadaan. Bawaan `DATA_PENGADAAN` | Tidak |
| `TAB_ANGGARAN` | Bawaan `Anggaran` | Tidak |
| `TAB_DATAMART` | Bawaan `Request Datamart` | Tidak |
| `TAB_AUDIT` | Bawaan `Data Audit Promo` | Tidak |

4. Klik **Deploy**. Setiap `git push` ke `main` otomatis deploy ulang.

### 3. Bagikan Google Sheet

Di Google Sheet: **Share > General access > Anyone with the link > Viewer**. Tanpa ini Google mengirim halaman login dan dashboard menampilkan "Data tidak bisa dimuat".

## Cara kerja data

```
Browser  ->  /api/sheet (fungsi Vercel)  ->  Google Sheet (CSV)
```

- Sheet ID hanya ada di server, tidak pernah dikirim ke browser.
- Hasil di-cache di CDN Vercel 60 detik, jadi banyak pengguna tidak membebani Google.
- Halaman memuat ulang data otomatis tiap 5 menit. Tombol refresh melewati cache.
- Kolom dicari berdasarkan **nama header**, bukan posisi. Urutan kolom boleh berubah, nama header jangan.

## Isi sheet supaya dashboard lengkap

| Yang ingin tampil | Kolom yang diisi |
|---|---|
| Pantauan jatuh tempo dan garis waktu | `Start Kontrak` dan `End Kontrak` (kontrak tanpa End Kontrak tidak bisa dipantau) |
| Quota Tracker | `Kuota` dan `Total Pemakaian` di tab pengadaan |
| Penyerapan budgeting promo | `Budgeting` dan `Penyerapan Budgeting` di tab Data Audit Promo |
| Alokasi per vendor | `Vendor` dan `Cost` |

Tombol **AI Insights** merangkum hal yang masih kosong atau tidak konsisten. Isinya dihitung dengan aturan dari data sheet, bukan model AI.

## Jalankan di komputer sendiri

Butuh Node 20 atau lebih baru.

```bash
npm run dev                       # data contoh dari dev/fixture.js
SHEET_ID=<id> npm run dev         # pakai Google Sheet asli
npm test                          # tes parser dan normalisasi
```

Buka http://localhost:3000.

## Struktur

```
index.html            halaman dan semua dialog
assets/css/styles.css tema gelap dan terang
assets/js/            main (state), views (render), charts, utils, icons
assets/vendor/        Chart.js (disimpan lokal, tanpa CDN)
assets/fonts/         Bricolage Grotesque, Plus Jakarta Sans, dan JetBrains Mono
api/sheet.js          endpoint /api/sheet
api/_lib/sheet.js     parser CSV, normalisasi, pengambilan dari Google
dev/                  server lokal dan data contoh (hanya untuk komputer sendiri)
tests/                tes otomatis
```

## Catatan keamanan

Siapa pun yang memegang URL Vercel bisa melihat nilai kontrak dan anggaran. Kalau perlu dibatasi, aktifkan **Vercel Authentication** atau **Password Protection** di Settings project (tersedia di plan tertentu), atau pasang dashboard di balik SSO perusahaan. Dashboard sudah mengirim `noindex`, jadi tidak muncul di Google, tetapi itu bukan pengaman.
