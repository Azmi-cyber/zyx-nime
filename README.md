# Zyx-nime - Platform Streaming Anime

Website streaming anime fullstack dengan fitur login Google OAuth dan email/password untuk owner.

## Fitur

- ✅ Login dengan Google OAuth
- ✅ Login dengan email/password (khusus owner)
- ✅ Owner bisa upload video anime dan thumbnail
- ✅ User biasa bisa streaming dan download anime
- ✅ Sistem komentar (owner bisa komentar, user biasa bisa lihat)
- ✅ Logo dan favicon custom
- ✅ Clean URLs (tanpa .php)
- ✅ Responsive design
- ✅ Database MySQL (XAMPP compatible)

## Spesifikasi Owner

- **Email**: 200714@gmail.com
- **Password**: 200714
- **Nama**: azmi
- **Umur**: 11 tahun

## Installasi di XAMPP (Lokal)

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
2. Buka browser dan akses: http://localhost/zyx-nime

---

## Cara Membuat Website Publik (Online)

### Opsi 1: Menggunakan Hosting cPanel (Recommended)

1. **Beli domain dan hosting**
   - Beli domain (contoh: zyxnime.my.id)
   - Beli hosting yang support PHP + MySQL

2. **Upload file ke hosting**
   - Login ke cPanel
   - Buka File Manager → public_html
   - Upload semua file project

3. **Buat database**
   - Buka MySQL Databases di cPanel
   - Buat database baru (contoh: zyxnime_db)
   - Buat user database
   - Import `database/schema.sql` ke database

4. **Edit config.php**
   ```php
   // Ganti dengan data hosting Anda
   define('DB_HOST', 'localhost'); // atau nama server MySQL
   define('DB_NAME', 'zyxnime_db'); // nama database
   define('DB_USER', 'username_cpanel'); // username database
   define('DB_PASS', 'password_database'); // password database

   // Update Google OAuth Redirect URI
   define('GOOGLE_REDIRECT_URI', 'https://zyxnime.my.id/google-callback');

   // Update Site URL
   define('SITE_URL', 'https://zyxnime.my.id');
   ```

5. **Update Google Console**
   - Buka Google Cloud Console
   - Edit Authorized redirect URIs menjadi: `https://zyxnime.my.id/google-callback`

6. **Buka website**: https://zyxnime.my.id

### Opsi 2: Menggunakan VPS/RDP

1. **Install LAMP Stack**
   ```bash
   # Untuk Ubuntu
   sudo apt update
   sudo apt install apache2 php mysql-server php-mysql
   ```

2. **Setup MySQL**
   ```bash
   sudo mysql
   CREATE DATABASE zyxnime;
   CREATE USER 'zyxnime'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON zyxnime.* TO 'zyxnime'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Upload file**
   ```bash
   sudo cp -r /path/to/zyx-nime /var/www/html/
   sudo chown -R www-data:www-data /var/www/html/zyx-nime
   ```

4. **Import database**
   ```bash
   mysql -u zyxnime -p zyxnime < /var/www/html/zyx-nime/database/schema.sql
   ```

5. **Edit config.php** dengan credentials yang sesuai

---

## Konfigurasi untuk Hosting Online

### Google OAuth Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Credentials → OAuth 2.0 Client IDs
4. Edit redirect URIs:
   - Untuk lokal: `http://localhost/zyx-nime/google-callback`
   - Untuk online: `https://domain-anda.com/google-callback`

### Update config.php untuk Hosting

```php
// Untuk Hosting Online
define('DB_HOST', 'localhost'); // atau hostname dari hosting
define('DB_NAME', 'nama_database');
define('DB_USER', 'username_database');
define('DB_PASS', 'password_database');

// Google OAuth
define('GOOGLE_CLIENT_ID', '458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'https://domain-anda.com/google-callback');

// Site URL
define('SITE_URL', 'https://domain-anda.com');
```

---

## Clean URLs (Tanpa .php)

Website sudah dikonfigurasi untuk menggunakan clean URLs:

| Sebelum | Sesudah |
|---------|---------|
| login.php | login |
| index.php | index |
| watch.php?id=1 | watch?id=1 |
| upload | upload |

---

## Cara Penggunaan

### Login sebagai Owner

1. Buka halaman login
2. Masukkan email: `200714@gmail.com`
3. Masukkan password: `200714`
4. Klik "Login sebagai Owner"

### Login dengan Google

1. Klik "Masuk dengan Google"
2. Login dengan akun Google

### Upload Anime (Owner)

1. Login sebagai owner
2. Klik "+ Upload Anime" di navbar
3. Isi judul, deskripsi, kategori
4. Pilih file video (MP4, WebM, MKV, dll)
5. Opsional: pilih thumbnail
6. Klik Upload

---

## Struktur File

```
zyx-nime/
├── .htaccess              # Konfigurasi server & clean URLs
├── config.php            # Konfigurasi database & OAuth
├── index.php            # Halaman utama
├── login.php            # Halaman login
├── google-callback.php  # Callback Google OAuth
├── logout.php           # Logout
├── upload.php           # Upload video (owner only)
├── watch.php            # Watch video & comments
├── download.php         # Download video
├── check-session.php   # API session
├── database/
│   └── schema.sql      # Schema database
├── uploads/
│   ├── videos/         # Folder video
│   └── thumbnails/     # Folder thumbnail
├── logo.png            # Logo website
└── favicon.ico         # Favicon
```

---

## Catatan Penting

1. **Video dan Thumbnail**: Diupload dari PC owner
2. **Google OAuth**: Wajib update redirect URI di Google Cloud Console
3. **Upload Size**: Maksimal 500MB (bisa diubah di .htaccess)
4. **SSL/HTTPS**: Wajib untuk hosting production

## Lisensi

Copyright © 2024 Zyx-nime. All rights reserved.
