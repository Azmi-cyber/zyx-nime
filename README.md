# Zyx-nime - Platform Streaming Anime

Website streaming anime fullstack dengan fitur login Google OAuth dan email/password untuk owner.

## Fitur

- ✅ Login dengan Google OAuth
- ✅ Login dengan email/password (khusus owner)
- ✅ Owner bisa upload video anime dan thumbnail
- ✅ User biasa bisa streaming dan download anime
- ✅ Sistem komentar (owner bisa komentar, user biasa bisa lihat)
- ✅ Logo dan favicon custom
- ✅ Responsive design
- ✅ Database MySQL (XAMPP compatible)

## Spesifikasi Owner

- **Email**: 200714@gmail.com
- **Password**: 200714
- **Nama**: azmi
- **Umur**: 11 tahun

## Installasi di XAMPP

### 1. Setup Database

1. Buka XAMPP Control Panel
2. Start Apache dan MySQL
3. Buka phpMyAdmin (http://localhost/phpmyadmin)
4. Buat database baru bernama `zyxnime`
5. Klik tab "Import"
6. Pilih file `database/schema.sql`
7. Klik "Go"

### 2. Setup Project

1. Copy semua file ke folder `htdocs/zyx-nime`
2. Pastikan folder `uploads/`, `uploads/videos/`, dan `uploads/thumbnails/` ada
3. Jika tidak ada, buat folder tersebut secara manual

### 3. Konfigurasi

Buka `config.php` dan sesuaikan jika perlu:
- `DB_HOST`: localhost
- `DB_NAME`: zyxnime
- `DB_USER`: root
- `DB_PASS`: (kosongkan untuk XAMPP default)

Google OAuth sudah dikonfigurasi dengan credentials yang diberikan.

### 4. Buka Website

Buka browser dan akses: http://localhost/zyx-nime

## Struktur File

```
zyx-nime/
├── config.php           # Konfigurasi database dan OAuth
├── index.php           # Halaman utama (list video)
├── login.php           # Halaman login
├── google-callback.php # Callback Google OAuth
├── logout.php          # Logout
├── upload.php          # Upload video (owner only)
├── watch.php           # Watch video + comments
├── download.php        # Download video
├── check-session.php   # API check session
├── database/
│   └── schema.sql      # Database schema
├── uploads/
│   ├── videos/         # Folder video
│   └── thumbnails/     # Folder thumbnail
├── logo.png            # Logo website
└── favicon.ico         # Favicon
```

## Cara Penggunaan

### Login sebagai Owner

1. Buka halaman login
2. Masukkan email: `200714@gmail.com`
3. Masukkan password: `200714`
4. Klik "Login sebagai Owner"
5. Anda akan menjadi owner dan bisa upload anime

### Login dengan Google

1. Klik "Masuk dengan Google"
2. Login dengan akun Google
3. Anda akan menjadi user biasa

### Upload Anime (Owner)

1. Login sebagai owner
2. Klik "+ Upload Anime" di navbar
3. Isi judul, deskripsi, kategori
4. Pilih file video (MP4, WebM, MKV, dll)
5. Opsional: pilih thumbnail
6. Klik Upload

### Nonton Anime

1. Klik anime yang ingin ditonton
2. Video akan diputar
3. Klik "Download Anime" untuk download

### Komentar

- **Owner**: Bisa komentar dan lihat semua komentar
- **User biasa**: Hanya bisa lihat komentar (harus login)

## Catatan

- Video dan thumbnail diupload dari PC owner
- Semua user bisa streaming dan download anime
- Google OAuth menggunakan client ID yang sudah dikonfigurasi
- Untuk hosting di server production, sesuaikan `SITE_URL` dan `GOOGLE_REDIRECT_URI`

## Lisensi

Copyright © 2024 Zyx-nime. All rights reserved.
