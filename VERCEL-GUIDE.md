# Cara Deploy Zyx-nime ke Vercel

## Prerequisites

1. Akun Vercel (gratis)
2. Akun GitHub/GitLab
3. Database MySQL terpisah (karena Vercel tidak support MySQL langsung)

## Opsi Database untuk Vercel

### Opsi 1: Tetap Pakai InfinityFree Database
- Database tetap di InfinityFree
- Connect dari Vercel ke InfinityFree

### Opsi 2: PlanetScale (MySQL Gratis)
- https://planetscale.com
- Free tier: Unlimited databases
- Compatible dengan MySQL

### Opsi 3: Supabase (PostgreSQL)
- https://supabase.com
- Free tier: 500MB

---

## Langkah Deploy ke Vercel

### 1. Push ke GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create new repository di GitHub
# Then:
git remote add origin https://github.com/username/zyx-nime.git
git push -u origin main
```

### 2. Import ke Vercel

1. Buka https://vercel.com
2. Klik "Add New..." → "Project"
3. Import GitHub repository
4. Configure:
   - Framework Preset: Other
   - Build Command: (kosongkan)
   - Output Directory: (kosongkan)

### 3. Setup Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables:

```
DB_HOST=sql105.infinityfree.com
DB_USER=if0_41201347
DB_PASS=azmigantenng
DB_NAME=if0_41201347_zyxnime
GOOGLE_CLIENT_ID=458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://your-vercel-project.vercel.app/google-callback
SITE_URL=https://your-vercel-project.vercel.app
SESSION_SECRET=random-secret-key
```

### 4. Deploy

Klik "Deploy" dan tunggu selesai!

---

## Catatan Penting

### Kelebihan Vercel:
- Gratis
- SSL otomatis
- CDN global
- Deploy otomatis dari Git

### Kekurangan:
- Tidak support native PHP
- Tidak support native MySQL  
- Tidak support file upload besar (max 4.5MB untuk free tier)
- Function timeout 10 detik (bisa upgrade)

### Untuk Video:
Di Vercel free tier, **tidak bisa upload video besar** karena:
- Max file size: 4.5MB (bisa tambah dengan config)
- Function timeout: 10 detik

**Solusi video:**
1. Embed dari YouTube/Vimeo
2. Gunakan Cloudinary (free 25GB)
3. Gunakan AWS S3 + CloudFront
4. Upgrade ke Vercel Pro ($20/bulan)

---

## Alternatif: Vercel + YouTube Embed

Kalau mau streaming video tanpa ribet, bisa modifikasi untuk embed YouTube:

1. Ubah upload.php untuk accept YouTube URL
2. Simpan YouTube video ID di database
3. Tampilkan dengan iframe embed

Ini lebih stabil dan gratis!
