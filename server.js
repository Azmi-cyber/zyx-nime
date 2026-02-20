require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session config - for production use session store
app.use(session({
  secret: process.env.SESSION_SECRET || 'zyx-nime-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Database connection - Using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql105.infinityfree.com',
  user: process.env.DB_USER || 'if0_41201347',
  password: process.env.DB_PASS || 'azmigantenng',
  database: process.env.DB_NAME || 'if0_41201347_zyxnime',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Google OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || '458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com',
  process.env.GOOGLE_CLIENT_SECRET || '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',
  process.env.GOOGLE_REDIRECT_URI || 'https://zyx-nime.infinityfree.me/google-callback'
);

// Owner credentials
const OWNER_EMAIL = '200714@gmail.com';
const OWNER_PASSWORD = '200714';
const OWNER_NAME = 'azmi';
const OWNER_AGE = '11';

// Multer config for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, 'uploads/videos');
    } else if (file.fieldname === 'thumbnail') {
      cb(null, 'uploads/thumbnails');
    } else {
      cb(null, 'uploads');
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      const allowed = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
      if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
      } else {
        cb(new Error('Invalid video format'));
      }
    } else if (file.fieldname === 'thumbnail') {
      const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image format'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Ensure upload directories exist
const dirs = ['uploads', 'uploads/videos', 'uploads/thumbnails'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== ROUTES ====================

// Home - List videos
app.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql = 'SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.status = ?';
    const params = ['active'];
    
    if (search) {
      sql += ' AND (v.title LIKE ? OR v.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (category) {
      sql += ' AND v.category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY v.created_at DESC';
    
    const [videos] = await pool.execute(sql, params);
    
    // Serve HTML
    res.send(generateHomeHTML(videos, req.session));
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Login page
app.get('/login', (req, res) => {
  const googleAuthUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
    prompt: 'consent'
  });
  res.send(generateLoginHTML(googleAuthUrl, req.session));
});

// Login handler (owner)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === OWNER_EMAIL && password === OWNER_PASSWORD) {
      // Verify owner
      const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [OWNER_EMAIL]);
      
      let user;
      if (users.length === 0) {
        // Create owner user
        const [result] = await pool.execute(
          'INSERT INTO users (email, name, role, is_verified) VALUES (?, ?, ?, ?)',
          [OWNER_EMAIL, OWNER_NAME, 'owner', true]
        );
        user = { id: result.insertId, email: OWNER_EMAIL, name: OWNER_NAME, role: 'owner' };
      } else {
        user = users[0];
        await pool.execute('UPDATE users SET role = ?, is_verified = ? WHERE id = ?', ['owner', true, user.id]);
        user.role = 'owner';
      }
      
      req.session.user = user;
      res.redirect('/');
    } else {
      res.send('<script>alert("Email atau password salah!"); window.location="/login";</script>');
    }
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// Google OAuth callback
app.get('/google-callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    const { email, name, picture, id: googleId } = userInfo;
    const isOwner = email === OWNER_EMAIL;
    
    // Check if user exists
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);
    
    let user;
    if (users.length > 0) {
      user = users[0];
      await pool.execute(
        'UPDATE users SET google_id = ?, name = ?, picture = ?, role = ?, is_verified = ? WHERE id = ?',
        [googleId, name, picture, isOwner ? 'owner' : 'user', true, user.id]
      );
      user.role = isOwner ? 'owner' : 'user';
    } else {
      const [result] = await pool.execute(
        'INSERT INTO users (google_id, email, name, picture, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [googleId, email, name, picture, isOwner ? 'owner' : 'user', true]
      );
      user = { id: result.insertId, email, name, picture, role: isOwner ? 'owner' : 'user' };
    }
    
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.send('Google login error: ' + error.message);
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Upload page (owner only)
app.get('/upload', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.redirect('/login');
  }
  res.send(generateUploadHTML(req.session.user));
});

// Upload handler
app.post('/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'owner') {
      return res.status(403).send('Unauthorized');
    }
    
    const { title, description, category } = req.body;
    
    if (!title || !req.files['video']) {
      return res.send('<script>alert("Judul dan video wajib diisi!"); window.location="/upload";</script>');
    }
    
    const videoPath = 'uploads/videos/' + req.files['video'][0].filename;
    const thumbnailPath = req.files['thumbnail'] ? 'uploads/thumbnails/' + req.files['thumbnail'][0].filename : null;
    
    await pool.execute(
      'INSERT INTO videos (title, description, video_path, thumbnail_path, category, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, videoPath, thumbnailPath, category, req.session.user.id, 'active']
    );
    
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Watch video
app.get('/watch', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.redirect('/');
    
    const [videos] = await pool.execute(
      'SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.id = ? AND v.status = ?',
      [id, 'active']
    );
    
    if (videos.length === 0) return res.redirect('/');
    
    // Update views
    await pool.execute('UPDATE videos SET views = views + 1 WHERE id = ?', [id]);
    
    // Get comments
    const [comments] = await pool.execute(
      'SELECT c.*, u.name, u.picture, u.role FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.created_at DESC',
      [id]
    );
    
    res.send(generateWatchHTML(videos[0], comments, req.session));
  } catch (error) {
    console.error(error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Add comment
app.post('/comment', async (req, res) => {
  try {
    const { video_id, comment_text } = req.body;
    
    if (!req.session.user) {
      return res.json({ success: false, message: 'Silakan login terlebih dahulu!' });
    }
    
    if (!comment_text.trim()) {
      return res.json({ success: false, message: 'Komentar tidak boleh kosong!' });
    }
    
    await pool.execute(
      'INSERT INTO comments (video_id, user_id, comment_text) VALUES (?, ?, ?)',
      [video_id, req.session.user.id, comment_text]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Download video
app.get('/download', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send('Invalid request');
    
    const [videos] = await pool.execute('SELECT * FROM videos WHERE id = ? AND status = ?', [id, 'active']);
    
    if (videos.length === 0) return res.status(404).send('Video not found');
    
    const video = videos[0];
    const filePath = path.join(__dirname, video.video_path);
    
    res.download(filePath, path.basename(video.video_path));
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// Check session
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false });
  }
});

// ==================== HTML GENERATORS ====================

function generateHomeHTML(videos, session) {
  const user = session?.user;
  const isOwner = user?.role === 'owner';
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zyx-nime - Platform Streaming Anime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
    body { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); }
    .navbar { background: rgba(0,0,0,0.3); padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo-img { width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
    .logo-text { color: #fff; font-size: 24px; font-weight: 700; text-transform: uppercase; }
    .nav-links { display: flex; align-items: center; gap: 15px; }
    .nav-btn { color: rgba(255,255,255,0.8); text-decoration: none; padding: 10px 20px; border-radius: 10px; transition: 0.3s; }
    .nav-btn:hover { background: rgba(255,255,255,0.1); }
    .nav-btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .hero { text-align: center; padding: 60px 20px; }
    .hero h1 { color: #fff; font-size: 48px; margin-bottom: 15px; text-transform: uppercase; }
    .hero p { color: rgba(255,255,255,0.7); font-size: 18px; }
    .search-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
    .search-box { display: flex; gap: 15px; flex-wrap: wrap; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; }
    .search-input { flex: 1; min-width: 250px; padding: 14px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 15px; }
    .search-input::placeholder { color: rgba(255,255,255,0.4); }
    .category-select { padding: 14px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 15px; }
    .search-btn { padding: 14px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-size: 15px; cursor: pointer; }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .section-title { color: #fff; font-size: 24px; margin-bottom: 25px; }
    .video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
    .video-card { background: rgba(255,255,255,0.05); border-radius: 15px; overflow: hidden; transition: 0.3s; }
    .video-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }
    .video-thumbnail { position: relative; aspect-ratio: 16/9; }
    .video-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .video-thumbnail-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; font-size: 50px; }
    .video-details { padding: 15px; }
    .video-title { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 8px; text-decoration: none; display: block; }
    .video-title:hover { color: #667eea; }
    .video-meta { display: flex; justify-content: space-between; color: rgba(255,255,255,0.5); font-size: 13px; }
    .empty-state { text-align: center; padding: 60px; color: rgba(255,255,255,0.5); }
    footer { text-align: center; padding: 30px; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.1); margin-top: 50px; }
    .user-menu { display: flex; align-items: center; gap: 12px; color: white; }
    .user-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .owner-badge { font-size: 11px; background: linear-gradient(135deg, #ffc107, #ff9800); color: #000; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="/" class="logo">
      <div class="logo-img">Z</div>
      <span class="logo-text">Zyx-nime</span>
    </a>
    <div class="nav-links">
      ${user ? (isOwner ? '<a href="/upload" class="nav-btn nav-btn-primary">+ Upload Anime</a>' : '') : ''}
      ${user ? `
        <div class="user-menu">
          ${user.picture ? `<img src="${user.picture}" class="user-avatar">` : ''}
          <span>${user.name}</span>
          ${isOwner ? '<span class="owner-badge">Owner</span>' : ''}
        </div>
        <a href="/logout" class="nav-btn">Logout</a>
      ` : '<a href="/login" class="nav-btn nav-btn-primary">Mulai Nonton</a>'}
    </div>
  </nav>
  
  <section class="hero">
    <h1>Zyx-nime</h1>
    <p>Nonton anime favorit Anda dengan kualitas tinggi</p>
  </section>
  
  <div class="search-container">
    <form class="search-box">
      <input type="text" name="search" class="search-input" placeholder="Cari anime...">
      <select name="category" class="category-select">
        <option value="">Semua Kategori</option>
        <option value="action">Action</option>
        <option value="adventure">Adventure</option>
        <option value="comedy">Comedy</option>
        <option value="romance">Romance</option>
        <option value="fantasy">Fantasy</option>
        <option value="horror">Horror</option>
      </select>
      <button type="submit" class="search-btn">Cari</button>
    </form>
  </div>
  
  <div class="container">
    <h2 class="section-title">Anime Terbaru</h2>
    ${videos.length > 0 ? `
      <div class="video-grid">
        ${videos.map(v => `
          <a href="/watch?id=${v.id}" class="video-card">
            <div class="video-thumbnail">
              ${v.thumbnail_path ? `<img src="/${v.thumbnail_path}">` : '<div class="video-thumbnail-placeholder">🎬</div>'}
            </div>
            <div class="video-details">
              <span class="video-title">${v.title}</span>
              <div class="video-meta">
                <span>👁️ ${v.views}</span>
                <span>${new Date(v.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    ` : '<div class="empty-state"><h3>Belum ada anime</h3></div>'}
  </div>
  
  <footer><p>&copy; 2024 Zyx-nime</p></footer>
</body>
</html>`;
}

function generateLoginHTML(authUrl, session) {
  if (session?.user) return '<script>window.location="/"</script>';
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Zyx-nime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
    body { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); display: flex; justify-content: center; align-items: center; padding: 20px; }
    .login-container { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; border: 1px solid rgba(255,255,255,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { width: 80px; height: 80px; border-radius: 50%; }
    .logo h1 { color: #fff; font-size: 28px; margin-top: 10px; }
    .logo p { color: rgba(255,255,255,0.6); font-size: 14px; }
    .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 14px; background: #fff; color: #333; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; text-decoration: none; margin-bottom: 20px; }
    .google-btn:hover { transform: translateY(-2px); }
    .divider { display: flex; align-items: center; margin: 25px 0; color: rgba(255,255,255,0.5); }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.2); }
    .divider span { padding: 0 15px; }
    .owner-badge { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 15px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; color: rgba(255,255,255,0.8); margin-bottom: 8px; font-size: 14px; }
    .form-group input { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 15px; }
    .form-group input::placeholder { color: rgba(255,255,255,0.4); }
    .login-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-size: 16px; cursor: pointer; }
    .back-link { text-align: center; margin-top: 20px; }
    .back-link a { color: rgba(255,255,255,0.6); text-decoration: none; }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white;font-size:40px;font-weight:bold;margin:0 auto;">Z</div>
      <h1>Zyx-nime</h1>
      <p>Platform Streaming Anime</p>
    </div>
    
    <a href="${authUrl}" class="google-btn">
      <img src="https://www.google.com/favicon.ico" width="20"> Masuk dengan Google
    </a>
    
    <div class="divider"><span>atau</span></div>
    
    <div class="owner-badge">Login Owner</div>
    
    <form method="POST" action="/login">
      <div class="form-group">
        <label>Email Owner</label>
        <input type="email" name="email" placeholder="200714@gmail.com" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="login-btn">Login sebagai Owner</button>
    </form>
    
    <div class="back-link"><a href="/">← Kembali</a></div>
  </div>
</body>
</html>`;
}

function generateUploadHTML(user) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upload Anime - Zyx-nime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
    body { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header h1 { color: #fff; font-size: 24px; }
    .header a { color: rgba(255,255,255,0.7); text-decoration: none; padding: 8px 20px; background: rgba(255,255,255,0.1); border-radius: 8px; }
    .upload-form { background: rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); }
    .form-group { margin-bottom: 25px; }
    .form-group label { display: block; color: rgba(255,255,255,0.9); margin-bottom: 10px; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 15px; }
    .form-group textarea { min-height: 120px; }
    .file-drop-zone { border: 2px dashed rgba(255,255,255,0.2); border-radius: 15px; padding: 40px; text-align: center; color: rgba(255,255,255,0.6); cursor: pointer; }
    .file-drop-zone:hover { border-color: #667eea; }
    .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 12px; color: white; font-size: 16px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Upload Anime</h1>
      <a href="/">Kembali</a>
    </div>
    
    <form class="upload-form" method="POST" enctype="multipart/form-data">
      <div class="form-group">
        <label>Judul Anime *</label>
        <input type="text" name="title" placeholder="Masukkan judul anime" required>
      </div>
      
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea name="description" placeholder="Masukkan deskripsi anime"></textarea>
      </div>
      
      <div class="form-group">
        <label>Kategori</label>
        <select name="category">
          <option value="">Pilih Kategori</option>
          <option value="action">Action</option>
          <option value="adventure">Adventure</option>
          <option value="comedy">Comedy</option>
          <option value="drama">Drama</option>
          <option value="fantasy">Fantasy</option>
          <option value="horror">Horror</option>
          <option value="romance">Romance</option>
          <option value="sci-fi">Sci-Fi</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>File Video *</label>
        <input type="file" name="video" accept="video/*" required>
      </div>
      
      <div class="form-group">
        <label>Thumbnail (Opsional)</label>
        <input type="file" name="thumbnail" accept="image/*">
      </div>
      
      <button type="submit" class="submit-btn">Upload Anime</button>
    </form>
  </div>
</body>
</html>`;
}

function generateWatchHTML(video, comments, session) {
  const user = session?.user;
  const isOwner = user?.role === 'owner';
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${video.title} - Zyx-nime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
    body { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header a { color: rgba(255,255,255,0.8); text-decoration: none; padding: 10px 20px; background: rgba(255,255,255,0.1); border-radius: 8px; display: inline-block; margin-bottom: 20px; }
    .video-container { background: rgba(0,0,0,0.5); border-radius: 15px; overflow: hidden; margin-bottom: 20px; }
    video { width: 100%; max-height: 70vh; display: block; }
    .video-info { padding: 20px; }
    .video-title { color: #fff; font-size: 24px; margin-bottom: 10px; }
    .video-meta { display: flex; gap: 20px; color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 15px; }
    .video-description { color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 20px; }
    .video-actions { display: flex; gap: 15px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 500; border: none; cursor: pointer; }
    .btn-download { background: rgba(52,199,89,0.2); color: #34c759; border: 1px solid rgba(52,199,89,0.3); }
    .comments-section { background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; margin-top: 20px; }
    .comments-title { color: #fff; font-size: 20px; margin-bottom: 20px; }
    .comment-form { margin-bottom: 30px; }
    .comment-form textarea { width: 100%; padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; min-height: 100px; margin-bottom: 15px; }
    .comment-btn { padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; cursor: pointer; }
    .comment-list { display: flex; flex-direction: column; gap: 15px; }
    .comment { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 15px; }
    .comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .comment-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
    .comment-author { color: #fff; font-weight: 500; }
    .comment-role { font-size: 12px; padding: 2px 8px; border-radius: 10px; background: rgba(102,126,234,0.3); color: #667eea; }
    .comment-role.owner { background: rgba(255,193,7,0.3); color: #ffc107; }
    .comment-time { color: rgba(255,255,255,0.4); font-size: 12px; }
    .comment-text { color: rgba(255,255,255,0.8); line-height: 1.5; }
    .login-prompt { background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); color: #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
    .login-prompt a { color: #ffc107; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/">← Kembali</a>
    
    <div class="video-container">
      <video controls playsinline>
        <source src="/${video.video_path}" type="video/mp4">
        Browser tidak support video.
      </video>
    </div>
    
    <div class="video-info">
      <h1 class="video-title">${video.title}</h1>
      <div class="video-meta">
        <span>👁️ ${video.views} views</span>
        <span>📅 ${new Date(video.created_at).toLocaleDateString('id-ID')}</span>
        ${video.category ? `<span>🏷️ ${video.category}</span>` : ''}
      </div>
      ${video.description ? `<p class="video-description">${video.description}</p>` : ''}
      <div class="video-actions">
        <a href="/download?id=${video.id}" class="btn btn-download">⬇️ Download Anime</a>
      </div>
    </div>
    
    <div class="comments-section">
      <h2 class="comments-title">Komentar (${comments.length})</h2>
      
      ${user ? `
        <form class="comment-form" onsubmit="submitComment(event, ${video.id})">
          <textarea id="commentText" placeholder="Tulis komentar..." required></textarea>
          <button type="submit" class="comment-btn">Kirim Komentar</button>
        </form>
      ` : '<div class="login-prompt"><a href="/login">Login</a> untuk berkomentar</div>'}
      
      <div class="comment-list">
        ${comments.map(c => `
          <div class="comment">
            <div class="comment-header">
              <div class="comment-avatar">${c.name ? c.name[0].toUpperCase() : '?'}</div>
              <div>
                <span class="comment-author">${c.name}</span>
                ${c.role === 'owner' ? '<span class="comment-role owner">Owner</span>' : ''}
              </div>
              <span class="comment-time">${new Date(c.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <p class="comment-text">${c.comment_text}</p>
          </div>
        `).join('')}
        ${comments.length === 0 ? '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:30px">Belum ada komentar</p>' : ''}
      </div>
    </div>
  </div>
  
  <script>
    async function submitComment(e, videoId) {
      e.preventDefault();
      const commentText = document.getElementById('commentText').value;
      
      const res = await fetch('/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, comment_text: commentText })
      });
      
      const data = await res.json();
      if (data.success) {
        location.reload();
      } else {
        alert(data.message);
      }
    }
  </script>
</body>
</html>`;
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Zyx-nime server running on port ' + PORT);
});
