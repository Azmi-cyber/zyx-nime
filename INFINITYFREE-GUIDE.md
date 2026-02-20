# Cara Setup Zyx-nime di InfinityFree

## Langkah 1: Login ke InfinityFree

1. Buka https://infinityfree.com
2. Login ke akun Anda
3. Klik "Log in to Control Panel"

## Langkah 2: Buat Database MySQL

1. Di panel kiri, cari **"MySQL Databases"**
2. Scroll ke bawah, bagian **"Create a new MySQL database"**
3. Isi:
   - Database Name: `zyxnime` (nama sesuai keinginan)
   - Password: Buat password kuat, catat!
4. Klik **"Create Database"**
5. Nanti akan muncul info:
   - Database Host: `sqlXXX.infinityfree.com` (XXX = angka)
   - Database Name: `iXXX_zyxnime`
   - Username: `iXXX_zyxnime`
   - Password: (yang lu buat tadi)

**CATAT** semua info ini!

## Langkah 3: Import Database Schema

1. Klik **"phpMyAdmin"** di panel (atau cari tombolnya)
2. Login ke phpMyAdmin dengan username & password database
3. Klik database yang lu buat (iXXX_zyxnime)
4. Klik tab **"Import"**
5. Klik **"Choose File"**
6. Pilih file `database/schema.sql` dari project Zyx-nime
7. Scroll bawah, klik **"Import"**

## Langkah 4: Upload File Website

1. Di panel InfinityFree, klik **"Files"**
2. Buka folder `htdocs`
3. Upload semua file Zyx-nime ke folder `htdocs`:
   - config.php
   - index.php
   - login.php
   - upload.php
   - watch.php
   - download.php
   - dll...
4. Buat folder `uploads`, `uploads/videos`, `uploads/thumbnails`

## Langkah 5: Edit config.php

Buka/Edit file `config.php` dan ganti:

```php
<?php
// Database Configuration for InfinityFree
define('DB_HOST', 'sqlXXX.infinityfree.com'); // GANTI dengan host dari step 2
define('DB_NAME', 'iXXX_zyxnime'); // GANTI dengan nama database
define('DB_USER', 'iXXX_zyxnime'); // GANTI dengan username
define('DB_PASS', 'password_lu_bikin'); // GANTI dengan password

// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', '458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'https://nama-domain-lu.epizy.com/google-callback');

// Owner Credentials
define('OWNER_EMAIL', '200714@gmail.com');
define('OWNER_PASSWORD', '200714');
define('OWNER_NAME', 'azmi');
define('OWNER_AGE', '11');

// Site Configuration
define('SITE_NAME', 'Zyx-nime');
define('SITE_URL', 'https://nama-domain-lu.epizy.com');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('VIDEO_DIR', __DIR__ . '/uploads/videos/');
define('THUMBNAIL_DIR', __DIR__ . '/uploads/thumbnails/');

// Session Configuration
session_start();

// Database Connection
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            )
        );
        return $pdo;
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage());
    }
}

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Check if user is owner
function isOwner() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'owner';
}

// Get current user
function getCurrentUser() {
    if (isLoggedIn()) {
        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['email'],
            'name' => $_SESSION['name'],
            'picture' => $_SESSION['picture'] ?? null,
            'role' => $_SESSION['role']
        ];
    }
    return null;
}

// Create upload directories if not exist
function createUploadDirs() {
    $dirs = [UPLOAD_DIR, VIDEO_DIR, THUMBNAIL_DIR];
    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }
    }
}

// Initialize upload directories
createUploadDirs();

// Helper function for clean URLs
function url($path = '') {
    return SITE_URL . '/' . $path;
}
```

**GANTI**:
- `sqlXXX.infinityfree.com` → sesuai host MySQL lu
- `iXXX_zyxnime` → nama database
- `iXXX_zyxnime` → username
- `password_lu_bikin` → password database
- `nama-domain-lu.epizy.com` → domain InfinityFree lu

## Langkah 6: Update Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Credentials → OAuth 2.0
3. Edit "Authorized redirect URIs"
4. Tambah:
   `https://nama-domain-lu.epizy.com/google-callback`
5. Save

## Langkah 7: Buka Website

Akses: `https://nama-domain-lu.epizy.com`

---

## Kalau Still Error

### Error "Database connection failed":
- Cek lagi DB_HOST, DB_NAME, DB_USER, DB_PASS
- Pastikan sudah import database schema.sql

### Error Google Login:
- Pastikan GOOGLE_REDIRECT_URI sama dengan di Google Cloud Console

### Error Upload:
- Pastikan folder `uploads`, `uploads/videos`, `uploads/thumbnails` sudah dibuat
- Chmod folder jadi 777
