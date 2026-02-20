<?php
require_once 'config.php';

// Check if user is logged in and is owner
if (!isLoggedIn() || !isOwner()) {
    header('Location: login.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $category = trim($_POST['category'] ?? '');
    
    if (empty($title)) {
        $error = 'Judul anime harus diisi!';
    } else {
        // Check if video file exists
        if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
            $error = 'Pilih file video!';
        } else {
            $videoFile = $_FILES['video'];
            $thumbnailFile = $_FILES['thumbnail'] ?? null;
            
            // Validate video file
            $videoExt = strtolower(pathinfo($videoFile['name'], PATHINFO_EXTENSION));
            $allowedVideoExt = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
            
            if (!in_array($videoExt, $allowedVideoExt)) {
                $error = 'Format video tidak didukung!';
            } else {
                // Generate unique filename
                $videoFilename = time() . '_' . bin2hex(random_bytes(4)) . '.' . $videoExt;
                $videoPath = VIDEO_DIR . $videoFilename;
                
                // Upload video
                if (move_uploaded_file($videoFile['tmp_name'], $videoPath)) {
                    $thumbnailPath = null;
                    
                    // Handle thumbnail upload
                    if ($thumbnailFile && $thumbnailFile['error'] === UPLOAD_ERR_OK) {
                        $thumbExt = strtolower(pathinfo($thumbnailFile['name'], PATHINFO_EXTENSION));
                        $allowedThumbExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                        
                        if (in_array($thumbExt, $allowedThumbExt)) {
                            $thumbFilename = time() . '_thumb_' . bin2hex(random_bytes(4)) . '.' . $thumbExt;
                            $thumbPath = THUMBNAIL_DIR . $thumbFilename;
                            
                            if (move_uploaded_file($thumbnailFile['tmp_name'], $thumbPath)) {
                                $thumbnailPath = 'uploads/thumbnails/' . $thumbFilename;
                            }
                        }
                    }
                    
                    // Save to database
                    try {
                        $pdo = getDBConnection();
                        $stmt = $pdo->prepare("INSERT INTO videos (title, description, video_path, thumbnail_path, category, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmt->execute([
                            $title,
                            $description,
                            'uploads/videos/' . $videoFilename,
                            $thumbnailPath,
                            $category,
                            $_SESSION['user_id']
                        ]);
                        
                        $success = 'Anime berhasil diupload!';
                    } catch (Exception $e) {
                        $error = 'Gagal menyimpan ke database: ' . $e->getMessage();
                    }
                } else {
                    $error = 'Gagal upload video!';
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Anime - <?= SITE_NAME ?></title>
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            padding: 20px;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #fff;
            font-size: 24px;
        }
        .header a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .header a:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .upload-form {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .form-group {
            margin-bottom: 25px;
        }
        .form-group label {
            display: block;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 10px;
            font-weight: 500;
        }
        .form-group input[type="text"],
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            transition: all 0.3s ease;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.1);
        }
        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }
        .form-group select {
            cursor: pointer;
        }
        .file-drop-zone {
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .file-drop-zone:hover {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.1);
        }
        .file-drop-zone input {
            display: none;
        }
        .file-drop-zone .icon {
            font-size: 40px;
            margin-bottom: 10px;
        }
        .file-drop-zone .file-info {
            margin-top: 10px;
            font-size: 13px;
        }
        .submit-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .error {
            background: rgba(255, 59, 48, 0.1);
            border: 1px solid rgba(255, 59, 48, 0.3);
            color: #ff3b30;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .success {
            background: rgba(52, 199, 89, 0.1);
            border: 1px solid rgba(52, 199, 89, 0.3);
            color: #34c759;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📤 Upload Anime</h1>
            <a href="index.php">← Kembali</a>
        </div>
        
        <div class="upload-form">
            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="success"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            
            <form method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="title">Judul Anime *</label>
                    <input type="text" id="title" name="title" placeholder="Masukkan judul anime" required>
                </div>
                
                <div class="form-group">
                    <label for="description">Deskripsi</label>
                    <textarea id="description" name="description" placeholder="Masukkan deskripsi anime"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="category">Kategori</label>
                    <select id="category" name="category">
                        <option value="">Pilih Kategori</option>
                        <option value="action">Action</option>
                        <option value="adventure">Adventure</option>
                        <option value="comedy">Comedy</option>
                        <option value="drama">Drama</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="horror">Horror</option>
                        <option value="mystery">Mystery</option>
                        <option value="romance">Romance</option>
                        <option value="sci-fi">Sci-Fi</option>
                        <option value="slice-of-life">Slice of Life</option>
                        <option value="sports">Sports</option>
                        <option value="supernatural">Supernatural</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>File Video *</label>
                    <label class="file-drop-zone">
                        <input type="file" name="video" accept="video/*" required>
                        <div class="icon">🎬</div>
                        <div>Klik untuk pilih video atau drag & drop</div>
                        <div class="file-info">Format: MP4, WebM, MKV, AVI, MOV</div>
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Thumbnail (Opsional)</label>
                    <label class="file-drop-zone">
                        <input type="file" name="thumbnail" accept="image/*">
                        <div class="icon">🖼️</div>
                        <div>Klik untuk pilih thumbnail</div>
                        <div class="file-info">Format: JPG, PNG, GIF, WebP</div>
                    </label>
                </div>
                
                <button type="submit" class="submit-btn">Upload Anime</button>
            </form>
        </div>
    </div>
    
    <script>
        // Show filename when file selected
        document.querySelectorAll('.file-drop-zone input').forEach(input => {
            input.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const zone = this.closest('.file-drop-zone');
                    const info = zone.querySelector('.file-info');
                    info.textContent = 'File dipilih: ' + this.files[0].name;
                    info.style.color = '#34c759';
                }
            });
        });
    </script>
</body>
</html>
