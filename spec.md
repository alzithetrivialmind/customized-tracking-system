1. Rekomendasi Tech Stack (Web-based Ringan)
Untuk sistem yang ringan, cepat di-deploy, dan mudah di-maintain ke depannya:

Backend: Node.js dengan Express.js. Sangat standar, AI sangat pintar membuat ini.

Database: SQLite (menggunakan ORM Prisma atau Drizzle). Karena ini aplikasi internal yang ringan, SQLite berupa satu file .db sudah sangat cukup, super cepat, dan tidak perlu setup database server terpisah. Prisma/Drizzle akan sangat membantu untuk relasi data log yang ketat.

Frontend: React (dengan Vite) + Tailwind CSS. Ringan, responsif untuk dashboard, dan banyak komponen UI siap pakai untuk tabel dan form log.

Excel Processor: exceljs. Library ini yang paling tangguh untuk membaca template .xlsx yang sudah ada, menyisipkan baris di atas (untuk header tanggal, nama cust, ETD) tanpa merusak styling atau format bawaan Excel tersebut.

File Handling: multer. Untuk menangani upload file/attachment (maksimal 2MB) pada saat user melakukan update log.

Task Scheduler: node-cron. Untuk menjalankan pengecekan otomatis setiap jam 00:00 guna memperbarui status prioritas (Normal -> Medium -> High) berdasarkan sisa hari ke ETD.

2. Struktur Database (Logika Relasi)
Ini adalah bagian paling krusial untuk Antigravity. Minta AI untuk membuatkan 3 tabel utama:

Master_Customer

id, name, created_at

Shipment_Tracker (Tabel Utama)

id, po_number (String, Unique)

customer_id (Relasi ke Master_Customer)

equipment_type (String/Enum: Container, Isotank, atau custom)

dangerous_type (String/Enum: DG, NON-DG, atau custom)

etd_date (Date)

created_date (Date, default now())

priority_status (String: Normal, Medium, High)

status (String: On Going, Done)

generated_excel_path (String - lokasi file yang sudah di-generate)

Shipment_Logs (Tabel Audit - Wajib Ada)

id, shipment_id (Relasi ke Tracker)

action_type (String: Auto-Update, Manual-Update, Create, Done)

old_data (JSON - menyimpan nilai sebelum diubah, misal ETD lama)

new_data (JSON - menyimpan nilai setelah diubah)

reason_comment (Text - wajib diisi jika manual)

attachment_path (String - opsional, maksimal 2MB)

created_at (Timestamp log)

3. Logika Sistem (System Logic Flow)
Berikan instruksi ini ke Antigravity untuk membangun controller dan service-nya:

Logika Pembuatan (Creation Flow):

Saat user submit form, sistem menyimpan data ke tabel Shipment_Tracker.

Sistem memanggil exceljs untuk membuka template (berdasarkan kombinasi equipment dan DG type).

exceljs melakukan insert row di baris paling atas (baris 1-3) dan menuliskan: Tanggal Dokumen, Nama Customer, dan ETD.

Simpan file baru di folder /public/exports/ dengan nama unik (misal: PO-123_CUST_CON-DG.xlsx).

Hitung priority_status awal berdasarkan etd_date dikurangi tanggal hari ini.

Catat di Shipment_Logs dengan action "Create".

Logika Prioritas Otomatis (Cron Job):

Buat cron job yang berjalan setiap tengah malam.

Ambil semua data dengan status On Going.

Hitung selisih hari (ETD - Today).

Jika <= 10 hari -> update ke "High". Jika 11 - 14 hari -> update ke "Medium". Jika > 14 hari -> "Normal".

PENTING: Jika ada perubahan status karena sistem otomatis ini, buat baris baru di Shipment_Logs dengan action "Auto-Update" (agar ketahuan ini berubah oleh sistem, bukan oleh manusia).

Logika Perubahan Manual (Manual Override):

Jika user mengedit ETD atau Flag Prioritas, paksa (force) user mengisi text area "Alasan Perubahan".

Sediakan tombol upload file (dibatasi multer 2MB, filter format gambar/PDF).

Simpan perubahan di tabel utama, dan catat riwayatnya di Shipment_Logs.

4. Struktur Folder Project
Agar Antigravity menyusunnya dengan rapi:

Plaintext
/project-root
│
├── /server (Node.js Backend)
│   ├── /prisma (Schema database sqlite)
│   ├── /templates (Tempat menaruh 4 master file Excel bawaan)
│   ├── /uploads (Tempat file attachment log 2MB dari user)
│   ├── /exports (Tempat file Excel yang sudah disisipkan header)
│   ├── /src
│   │   ├── /controllers (Logika Tracker, Customer, Logs)
│   │   ├── /services (Logika ExcelJS & Cron scheduler)
│   │   ├── /middlewares (Multer file upload logic)
│   │   └── /routes (API endpoints)
│   └── index.js
│
└── /client (React Frontend)
    ├── /src
    │   ├── /components (Form, Table, Log Modal)
    │   ├── /pages (Dashboard OnGoing, Dashboard Done)
    │   └── /services (Axios API calls)
5. Detail Penting untuk Masa Depan (Future-Proofing)
Ada beberapa hal krusial yang perlu kamu siapkan dari sekarang untuk menghindari sakit kepala di kemudian hari:

Isu Zona Waktu (Timezone): Karena ETD sangat krusial untuk menentukan hari (Normal/Medium/High), pastikan Antigravity mengunci perhitungan tanggal menggunakan timezone lokal (WIB/UTC+7) di sisi backend, bukan mengikuti jam server hosting. Gunakan library date-fns atau dayjs untuk kalkulasi hari agar akurat.

Fitur Edit Master Excel: Suatu saat, form Ecogreen mungkin berubah. Jangan biarkan path template di-hardcode mati di dalam script. Buat sistem membaca dari folder /templates/ yang isinya persis 4 file tersebut. Jika suatu saat form berubah, kamu cukup me-replace file Excel di folder tersebut dengan nama file yang sama.

Soft Delete (Pencegahan Kecelakaan): Di dunia tracking logistics, jangan pernah menghapus data secara fisik dari database. Mintalah AI menambahkan kolom deleted_at atau is_active boolean. Jika ada karyawan salah input, data hanya disembunyikan (soft delete), bukan di-drop dari database.

Konteks User pada Log: Untuk sekarang mungkin penggunanya hanya 1 atau dipakai bersama. Tapi tambahkan kolom updated_by (teks sederhana nama user/admin) di tabel Log. Nanti kalau aplikasinya dikembangkan dan butuh sistem Login sungguhan, struktur log-nya sudah siap menampung data "Siapa yang mengubah".