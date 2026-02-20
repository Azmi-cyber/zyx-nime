# Cara Hosting Gratis untuk Zyx-nime

## Opsi Hosting Gratis (Free Tier)

### 1. 000WebHost (Recommended)
- **Gratis**: Ya
- **Storage**: 1GB
- **Bandwidth**: Unlimited
- **PHP**: ✓
- **MySQL**: ✓
- **SSL**: ✓ (Let's Encrypt)
- **Cara Daftar**:
  1. Kunjungi https://000webhost.com
  2. Sign Up dengan email
  3. Buat website baru
  4. Upload file via File Manager atau FTP

### 2. InfinityFree
- **Gratis**: Ya
- **Storage**: Unlimited
- **Bandwidth**: Unlimited
- **PHP**: ✓
- **MySQL**: ✓
- **SSL**: ✓ (Let's Encrypt)
- **Catatan**: Tidak ada iklan

### 3. FreeHostia
- **Gratis**: Ya
- **Storage**: 250MB
- **Bandwidth**: 6GB
- **PHP**: ✓
- **MySQL**: ✓

### 4. WebHost000
- **Gratis**: Ya
- **Storage**: 1GB
- **PHP**: ✓
- **MySQL**: ✓

### 5. ByetHost (Hostinger Free)
- **Gratis**: Ya
- **Storage**: 1GB
- **PHP**: ✓
- **MySQL**: ✓

---

## Cara Upload ke Hosting Gratis

### Cara 1: Via File Manager ( paling mudah)

1. **Daftar** ke hosting gratis (rekomendasi: 000webhost)
2. **Login** ke control panel
3. **Buka** File Manager → public_html
4. **Delete** file default
5. **Upload** semua file project Zyx-nime
6. **Buat database**:
   - Klik "Manage Database" / "MySQL"
   - Buat database baru
   - Catat: hostname, database name, username, password
7. **Import database**:
   - Buka phpMyAdmin
   - Klik database Anda
   - Klik "Import"
   - Pilih file `database/schema.sql`
8. **Edit [`config.php`](config.php)**:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'nama_database_anda');
define('DB_USER', 'username_database_anda');
define('DB_PASS', 'password_database_anda');

define('GOOGLE_REDIRECT_URI', 'https://nama-website.000webhostapp.com/google-callback');
define('SITE_URL', 'https://nama-website.000webhostapp.com');
```

### Cara 2: Via FTP (FileZilla)

1. Download FileZilla (gratis)
2. Buka Hosting → FTP Details di panel hosting
3. Isi di FileZilla:
   - Host: ftp.nama-website.000webhostapp.com
   - Username: (lihat di panel)
   - Password: (lihat di panel)
   - Port: 21
4. Upload semua file ke `public_html`

---

## Update Google OAuth untuk Hosting Gratis

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Credentials → OAuth 2.0
3. Edit "Authorized redirect URIs"
4. Tambahkan URL hosting gratis:
   - Contoh: `https://zyxnime.000webhostapp.com/google-callback`
5. Save

---

## Catatan Penting Hosting Gratis

| Aspek | Keterangan |
|-------|-------------|
| **Domain** | Usually `.000webhostapp.com` atau subdomain |
| **SSL** | Sudah include, tapi perlu dinyalakan |
| **Uptime** | Tidak garantikan 100% |
| **Resource** | Terbatas, hati-hati upload video besar |
| **Video** | Streaming langsung tidak recommended di free hosting |

---

## Alternatif: Tunnel ke Internet (Gratis untuk Development)

### Ngrok (Bikin localhost bisa diakses online)

```bash
# Download ngrok
# Extract dan jalankan:
ngrok http 80

# Akan muncul URL seperti:
# https://abc123.ngrok.io
```

**Update config.php:**
```php
define('GOOGLE_REDIRECT_URI', 'https://abc123.ngrok.io/google-callback');
define('SITE_URL', 'https://abc123.ngrok.io');
```

**Update Google OAuth:**
- Redirect URI: `https://abc123.ngrok.io/google-callback`

---

## Rekomendasi untuk Video

Untuk streaming video di hosting gratis, sebaiknya:
1. Gunakan YouTube/Vimeo embed
2. Atau gunakan CDN video gratis
3. Atau upgrade ke hosting berbayar

---

##Ringkasan Hosting Gratis yang work:

1. **000webhost** - Recommended, easy setup
2. **InfinityFree** - Unlimited storage
3. **Ngrok** - Untuk testing sementara

Coba 000webhost dulu, paling mudah dan stabil untuk PHP + MySQL.
