require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure required directories exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// Database setup
const db = new sqlite3.Database('./zyxnime.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'user',
    google_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    video_path TEXT NOT NULL,
    thumbnail_path TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(uploaded_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'zyxnime-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, videosDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Passport configuration
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, user) => {
    if (err) return done(err);
    if (user) return done(null, user);
    
    const newUser = {
      email: profile.emails[0].value,
      name: profile.displayName,
      google_id: profile.id,
      role: 'user'
    };
    
    db.run('INSERT INTO users (email, name, google_id, role) VALUES (?, ?, ?, ?)',
      [newUser.email, newUser.name, newUser.google_id, newUser.role],
      function(err) {
        if (err) return done(err);
        newUser.id = this.lastID;
        return done(null, newUser);
      });
  });
}));

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?error=auth_failed' }),
  (req, res) => {
    res.redirect('/index.html?login=success');
  }
);

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  // Owner login verification
  if (email === '200714@gmail.com' && password === '200714') {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      if (user) {
        req.login(user, (err) => {
          if (err) return res.status(500).json({ error: 'Login failed' });
          return res.json({ 
            success: true, 
            user: { ...user, isOwner: true },
            ownerData: { name: 'azmi', age: 11 }
          });
        });
      } else {
        // Create owner user
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          [email, hashedPassword, 'azmi', 'owner'],
          function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create user' });
            
            const newUser = { id: this.lastID, email, name: 'azmi', role: 'owner' };
            req.login(newUser, (err) => {
              if (err) return res.status(500).json({ error: 'Login failed' });
              return res.json({ 
                success: true, 
                user: newUser,
                ownerData: { name: 'azmi', age: 11 }
              });
            });
          });
      }
    });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/register', (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, name, 'user'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Registration failed' });
      res.json({ success: true, userId: this.lastID });
    });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    const isOwner = req.user.role === 'owner';
    const userData = { ...req.user };
    if (isOwner) {
      userData.ownerData = { name: 'azmi', age: 11 };
    }
    res.json({ authenticated: true, user: userData, isOwner });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login.html');
  });
});

app.post('/api/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

// Video Routes
app.get('/api/videos', (req, res) => {
  db.all('SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id ORDER BY v.created_at DESC', 
    [], (err, videos) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch videos' });
      res.json(videos);
    });
});

app.get('/api/videos/:id', (req, res) => {
  db.get('SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.id = ?',
    [req.params.id], (err, video) => {
      if (err || !video) return res.status(404).json({ error: 'Video not found' });
      res.json(video);
    });
});

app.post('/api/videos', 
  (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can upload videos' });
    }
    next();
  },
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  (req, res) => {
    const { title, description } = req.body;
    const videoPath = req.files['video'] ? '/uploads/videos/' + req.files['video'][0].filename : null;
    const thumbnailPath = req.files['thumbnail'] ? '/uploads/thumbnails/' + req.files['thumbnail'][0].filename : null;
    
    db.run('INSERT INTO videos (title, description, video_path, thumbnail_path, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [title, description, videoPath, thumbnailPath, req.user.id],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to upload video' });
        res.json({ success: true, videoId: this.lastID });
      });
  }
);

app.delete('/api/videos/:id',
  (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete videos' });
    }
    next();
  },
  (req, res) => {
    db.get('SELECT * FROM videos WHERE id = ?', [req.params.id], (err, video) => {
      if (err || !video) return res.status(404).json({ error: 'Video not found' });
      
      // Delete files
      if (video.video_path) {
        const fullPath = path.join(__dirname, 'public', video.video_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      if (video.thumbnail_path) {
        const fullPath = path.join(__dirname, 'public', video.thumbnail_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      
      db.run('DELETE FROM comments WHERE video_id = ?', [req.params.id], (err) => {
        db.run('DELETE FROM videos WHERE id = ?', [req.params.id], (err) => {
          res.json({ success: true });
        });
      });
    });
  }
);

// Comment Routes
app.get('/api/videos/:id/comments', (req, res) => {
  db.all(`SELECT c.*, u.name, u.role FROM comments c 
          LEFT JOIN users u ON c.user_id = u.id 
          WHERE c.video_id = ? 
          ORDER BY c.created_at DESC`,
    [req.params.id], (err, comments) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch comments' });
      res.json(comments);
    });
});

app.post('/api/comments',
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Please login to comment' });
    }
    next();
  },
  (req, res) => {
    const { video_id, content } = req.body;
    
    db.run('INSERT INTO comments (video_id, user_id, content) VALUES (?, ?, ?)',
      [video_id, req.user.id, content],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to add comment' });
        res.json({ 
          success: true, 
          comment: {
            id: this.lastID,
            video_id,
            user_id: req.user.id,
            content,
            name: req.user.name,
            role: req.user.role,
            created_at: new Date().toISOString()
          }
        });
      });
  }
);

app.delete('/api/comments/:id',
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Please login' });
    }
    next();
  },
  (req, res) => {
    db.get('SELECT * FROM comments WHERE id = ?', [req.params.id], (err, comment) => {
      if (err || !comment) return res.status(404).json({ error: 'Comment not found' });
      
      // Only owner or comment owner can delete
      if (req.user.role !== 'owner' && comment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      db.run('DELETE FROM comments WHERE id = ?', [req.params.id], (err) => {
        res.json({ success: true });
      });
    });
  }
);

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Handle SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zyx-nime server running on http://localhost:${PORT}`);
});
