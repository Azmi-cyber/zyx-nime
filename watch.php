<?php
require_once 'config.php';

$video = null;
$comments = [];
$error = '';

// Get video ID
$videoId = $_GET['id'] ?? 0;

if (!$videoId) {
    $error = 'Video tidak ditemukan!';
} else {
    try {
        $pdo = getDBConnection();
        
        // Get video
        $stmt = $pdo->prepare("SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.id = ? AND v.status = 'active'");
        $stmt->execute([$videoId]);
        $video = $stmt->fetch();
        
        if ($video) {
            // Update views
            $stmt = $pdo->prepare("UPDATE videos SET views = views + 1 WHERE id = ?");
            $stmt->execute([$videoId]);
            
            // Get comments
            $stmt = $pdo->prepare("SELECT c.*, u.name, u.picture, u.role FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.created_at DESC");
            $stmt->execute([$videoId]);
            $comments = $stmt->fetchAll();
        } else {
            $error = 'Video tidak ditemukan!';
        }
    } catch (Exception $e) {
        $error = 'Gagal memuat video: ' . $e->getMessage();
    }
}

// Handle new comment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment'])) {
    if (!isLoggedIn()) {
        $error = 'Silakan login terlebih dahulu untuk berkomentar!';
    } else {
        $commentText = trim($_POST['comment_text'] ?? '');
        
        if (empty($commentText)) {
            $error = 'Komentar tidak boleh kosong!';
        } else {
            try {
                $pdo = getDBConnection();
                $stmt = $pdo->prepare("INSERT INTO comments (video_id, user_id, comment_text) VALUES (?, ?, ?)");
                $stmt->execute([$videoId, $_SESSION['user_id'], $commentText]);
                
                // Refresh page
                header("Location: watch.php?id=$videoId");
                exit;
            } catch (Exception $e) {
                $error = 'Gagal mengirim komentar: ' . $e->getMessage();
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
    <title><?= $video ? htmlspecialchars($video['title']) : 'Video' ?> - <?= SITE_NAME ?></title>
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
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .header a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .header a:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .video-container {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        video {
            width: 100%;
            max-height: 70vh;
            display: block;
        }
        .video-info {
            padding: 20px;
        }
        .video-title {
            color: #fff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .video-meta {
            display: flex;
            gap: 20px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-bottom: 15px;
        }
        .video-description {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .video-actions {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 15px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-download {
            background: rgba(52, 199, 89, 0.2);
            color: #34c759;
            border: 1px solid rgba(52, 199, 89, 0.3);
        }
        .btn-download:hover {
            background: rgba(52, 199, 89, 0.3);
        }
        .comments-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        .comments-title {
            color: #fff;
            font-size: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .comment-form {
            margin-bottom: 30px;
        }
        .comment-form textarea {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            min-height: 100px;
            resize: vertical;
            margin-bottom: 15px;
        }
        .comment-form textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .comment-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .comment {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
            padding: 15px;
        }
        .comment-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        .comment-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .comment-author {
            color: #fff;
            font-weight: 500;
        }
        .comment-role {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(102, 126, 234, 0.3);
            color: #667eea;
        }
        .comment-role.owner {
            background: rgba(255, 193, 7, 0.3);
            color: #ffc107;
        }
        .comment-time {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
        }
        .comment-text {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
        }
        .no-comments {
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
            padding: 30px;
        }
        .login-prompt {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            color: #ffc107;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .login-prompt a {
            color: #ffc107;
            font-weight: 600;
        }
        .error {
            background: rgba(255, 59, 48, 0.1);
            border: 1px solid rgba(255, 59, 48, 0.3);
            color: #ff3b30;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="index.php">← Kembali ke Beranda</a>
        </div>
        
        <?php if ($error && !$video): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
            <a href="index.php" class="btn btn-primary">Kembali</a>
        <?php elseif ($video): ?>
            <div class="video-container">
                <video controls playsinline>
                    <source src="<?= htmlspecialchars($video['video_path']) ?>" type="video/mp4">
                    Browser Anda tidak mendukung pemutaran video.
                </video>
            </div>
            
            <div class="video-info">
                <h1 class="video-title"><?= htmlspecialchars($video['title']) ?></h1>
 class="video-meta                
                <div">
                    <span>👁️ <?= number_format($video['views']) ?> views</span>
                    <span>📅 <?= date('d M Y', strtotime($video['created_at'])) ?></span>
                    <?php if ($video['category']): ?>
                        <span>🏷️ <?= htmlspecialchars(ucfirst($video['category'])) ?></span>
                    <?php endif; ?>
                    <?php if ($video['uploader_name']): ?>
                        <span>👤 <?= htmlspecialchars($video['uploader_name']) ?></span>
                    <?php endif; ?>
                </div>
                
                <?php if ($video['description']): ?>
                    <p class="video-description"><?= nl2br(htmlspecialchars($video['description'])) ?></p>
                <?php endif; ?>
                
                <div class="video-actions">
                    <a href="download.php?id=<?= $video['id'] ?>" class="btn btn-download">⬇️ Download Anime</a>
                </div>
            </div>
            
            <div class="comments-section">
                <h2 class="comments-title">💬 Komentar (<?= count($comments) ?>)</h2>
                
                <?php if ($error): ?>
                    <div class="error"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>
                
                <?php if (isLoggedIn()): ?>
                    <form method="POST" class="comment-form">
                        <textarea name="comment_text" placeholder="Tulis komentar..." required></textarea>
                        <button type="submit" name="comment" class="btn btn-primary">Kirim Komentar</button>
                    </form>
                <?php else: ?>
                    <div class="login-prompt">
                        🔐 <a href="login.php">Login</a> untuk berkomentar
                    </div>
                <?php endif; ?>
                
                <?php if (count($comments) > 0): ?>
                    <div class="comment-list">
                        <?php foreach ($comments as $comment): ?>
                            <div class="comment">
                                <div class="comment-header">
                                    <?php if ($comment['picture']): ?>
                                        <img src="<?= htmlspecialchars($comment['picture']) ?>" alt="Avatar" class="comment-avatar">
                                    <?php else: ?>
                                        <div class="comment-avatar"><?= strtoupper(substr($comment['name'], 0, 1)) ?></div>
                                    <?php endif; ?>
                                    <div>
                                        <span class="comment-author"><?= htmlspecialchars($comment['name']) ?></span>
                                        <?php if ($comment['role'] === 'owner'): ?>
                                            <span class="comment-role owner">Owner</span>
                                        <?php endif; ?>
                                    </div>
                                    <span class="comment-time"><?= date('d M Y, H:i', strtotime($comment['created_at'])) ?></span>
                                </div>
                                <p class="comment-text"><?= nl2br(htmlspecialchars($comment['comment_text'])) ?></p>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <div class="no-comments">
                        Belum ada komentar. Jadilah yang pertama berkomentar!
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
