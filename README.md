# Panduan Deploy ke Vercel (JADWALKU App)

Aplikasi ini dibuat menggunakan **React + TypeScript + Vite + Tailwind CSS**. Untuk meng-host aplikasi ini secara gratis di Vercel, ikuti langkah-langkah mudah di bawah ini.

## Konfigurasi yang Tersedia
Kami telah membuat file konfigurasi khusus `vercel.json` di root folder. Konfigurasi ini memastikan fitur routing satu halaman (SPA) berjalan dengan lancar saat halaman di-refresh di web browser.

---

## Langkah 1: Hubungkan ke GitHub / GitLab / Bitbucket
1. Unggah (push) seluruh isi repository/kodingan ke akun Git pribadi Anda (seperti **GitHub**).
   - Pastikan file `package.json`, `vite.config.ts`, dan file baru `vercel.json` sudah terunggah ke repository tersebut.

---

## Langkah 2: Deploy di Vercel Dashboard
1. Buka [Vercel.com](https://vercel.com/) dan buat akun menggunakan akun GitHub Anda.
2. Klik tombol **"Add New"** -> **"Project"**.
3. Cari dan pilih repository aplikasi ini yang baru saja Anda unggah, lalu klik **"Import"**.
4. Di panel konfigurasi proyek (**Configure Project**):
   - **Framework Preset**: Pilih **Vite** (biasanya Vercel akan mendeteksinya secara otomatis).
   - **Root Directory**: `./` (biarkan default).
   - **Build Command**: `npm run build` atau `vite build` (biarkan default).
   - **Output Directory**: `dist` (biarkan default).
5. Klik **"Deploy"**.

Tunggu sekitar 1-2 menit hingga proses pengumpulan kode selesai. Setelah selesai, Vercel akan otomatis memberikan URL hosting gratis bagi aplikasi Anda!

---

## Cara Alternatif: Deploy Menggunakan Vercel CLI
Jika Anda ingin men-deploy langsung lewat terminal laptop Anda:
1. Pasang Vercel CLI secara global di komputer Anda:
   ```bash
   npm install -g vercel
   ```
2. Hubungkan ke akun Vercel Anda:
   ```bash
   vercel login
   ```
3. Masuk ke folder proyek ini dan jalankan perintah:
   ```bash
   vercel
   ```
4. Ikuti instruksi di layar, dan setelah selesai, jalankan perintah ini untuk mengirim ke tahap produksi:
   ```bash
   vercel --prod
   ```
