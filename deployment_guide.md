# Deployment Guide: EcoGreen SO Tracking System

Ikuti panduan langkah-demi-langkah ini untuk mempublikasikan aplikasi Anda ke GitHub, menyiapkan database Supabase, dan mendeploy ke Vercel secara gratis.

---

## 1. 📂 Persiapan & GitHub Push

Buka terminal di folder proyek Anda (`/Users/alzi/EcoGreen - Tracking System/`) dan jalankan perintah berikut:

```bash
# Inisialisasi Git
git init

# Tambahkan semua file (pastikan .gitignore sudah ada agar node_modules tidak ikut)
git add .

# Buat commit pertama
git commit -m "Initial High-Aesthetics Cloud-Native Version"

# Hubungkan ke repository Anda
git remote add origin https://github.com/alzithetrivialmind/customized-tracking-system.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

---

## 2. ⚡ Konfigurasi Supabase (Backend)

1. **Buat Project**: Login ke [Supabase.com](https://supabase.com) dan buat project baru.
2. **Setup Tabel & RLS**:
   - Buka menu **SQL Editor** di dashboard Supabase.
   - Klik **New Query**, lalu copy-paste seluruh isi file [**`supabase_setup.sql`**](./supabase_setup.sql) ke dalamnya.
   - Klik **Run**. Ini akan membuat tabel, sistem keamanan RLS, dan bucket storage.
3. **Buat Akun Admin Pertama**:
   - Buka menu **Authentication** -> **Users** -> **Add User** -> **Create New User**.
   - Masukkan Email: `admin@ecogreen.com` dan Password: `admin123` (atau sesuai keinginan).
   - Setelah user terbuat, **Copy User ID (UUID)** milik user tersebut.
4. **Assign Role Admin**:
   - Buka kembali **SQL Editor**, masukkan kode berikut (ganti `UUID_ANDA` dengan ID yang tadi di-copy):
   ```sql
   INSERT INTO public.profiles (id, full_name, role, force_password_change) 
   VALUES ('UUID_ANDA', 'System Administrator', 'admin', TRUE);
   ```
   - Klik **Run**.

---

## 3. 🚀 Deploy ke Vercel (Frontend & Serverless)

1. **Hubungkan GitHub**: Login ke [Vercel.com](https://vercel.com) dan klik **Add New** -> **Project**.
2. **Impor Repo**: Pilih repository `customized-tracking-system`.
3. **Konfigurasi Environment Variables**:
   Di bagian **Environment Variables**, masukkan 3 kunci berikut (ambil dari Dashboard Supabase -> Project Settings -> API):
   - `VITE_SUPABASE_URL`: (URL Project Anda)
   - `VITE_SUPABASE_ANON_KEY`: (Anon Public Key)
   - `SUPABASE_SERVICE_ROLE_KEY`: (**Secret Key** — Pastikan ini dimasukkan untuk fungsi `/api`)
4. **Deploy**: Klik **Deploy**.

---

## 4. 🏁 Final Touch
Setelah Vercel selesai mendeploy, buka URL yang diberikan. 
- Login menggunakan akun `admin@ecogreen.com`.
- Sistem akan meminta Anda **mengganti password** segera.
- Buka menu **Settings** dan upload 4 file Master Excel Anda agar fitur ekspor berfungsi.

---
> [!IMPORTANT]
> **Keamanan**: Jangan pernah membagikan `SUPABASE_SERVICE_ROLE_KEY` kepada siapapun atau memasukkannya ke dalam kode frontend. Pastikan kunci ini hanya ada di dashboard Vercel.

> [!TIP]
> Jika Anda menemui kendala "Master Template Not Found", pastikan nama file yang Anda upload di menu Settings sudah sesuai dengan kategori (contoh: `CON_DG.xlsx`).
