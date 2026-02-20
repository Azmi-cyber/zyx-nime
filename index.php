<?php
require_once 'config.php';

$videos = [];
$search = $_GET['search'] ?? '';
$category = $_GET['category'] ?? '';

try {
    $pdo = getDBConnection();
    
    // Build query
    $sql = "SELECT v.*, u.name as uploader_name FROM videos v LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.status = 'active'";
    $params = [];
    
    if ($search) {
        $sql .= " AND (v.title LIKE ? OR v.description LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    if ($category) {
        $sql .= " AND v.category = ?";
        $params[] = $category;
    }
    
    $sql .= " ORDER BY v.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $videos = $stmt->fetchAll();
    
} catch (Exception $e) {
    $error = 'Gagal memuat video: ' . $e->getMessage();
}

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= SITE_NAME ?> - Platform Streaming Anime</title>
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
        }
        /* Navbar */
        .navbar {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }
        .logo-img {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            object-fit: cover;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
        }
        .logo-text {
            color: #fff;
            font-size: 24px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .nav-links {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .nav-btn {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 10px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .nav-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .nav-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .user-menu {
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
        }
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        .user-avatar-placeholder {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .user-name {
            font-weight: 500;
        }
        .owner-badge {
            font-size: 11px;
            background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
            color: #000;
            padding: 3px 10px;
            border-radius: 10px;
            font-weight: 600;
        }
        
        /* Hero Section */
        .hero {
            text-align: center;
            padding: 60px 20px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
        }
        .hero h1 {
            color: #fff;
            font-size: 48px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .hero p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 18px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Search & Filter */
        .search-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 20px;
        }
        .search-box {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .search-input {
            flex: 1;
            min-width: 250px;
            padding: 14px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
        }
        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
        .category-select {
            padding: 14px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            cursor: pointer;
            min-width: 150px;
        }
        .category-select:focus {
            outline: none;
            border-color: #667eea;
        }
        .search-btn {
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .search-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        /* Video Grid */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .section-title {
            color: #fff;
            font-size: 24px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
        }
        .video-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .video-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
            border-color: rgba(102, 126, 234, 0.3);
        }
        .video-thumbnail {
            position: relative;
            aspect-ratio: 16/9;
            overflow: hidden;
        }
        .video-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        .video-card:hover .video-thumbnail img {
            transform: scale(1.05);
        }
        .video-thumbnail-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
        }
        .video-duration {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 10px;
            border-radius: 5px;
            font-size: 13px;
            font-weight: 500;
        }
        .video-details {
            padding: 15px;
        }
        .video-title {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-decoration: none;
        }
        .video-title:hover {
            color: #667eea;
        }
        .video-meta {
            display: flex;
            justify-content: space-between;
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: rgba(255, 255, 255, 0.5);
        }
        .empty-state .icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        
        /* Footer */
        footer {
            text-align: center;
            padding: 30px;
            color: rgba(255, 255, 255, 0.5);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 50px;
        }
        
        /* Mobile */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 32px;
            }
            .navbar {
                padding: 15px;
                flex-wrap: wrap;
            }
            .logo-text {
                font-size: 18px;
            }
            .search-box {
                flex-direction: column;
            }
            .search-input, .category-select, .search-btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar">
        <a href="index.php" class="logo">
            <div class="logo-img">Z</div>
            <span class="logo-text">Zyx-nime</span>
        </a>
        
        <div class="nav-links">
            <?php if ($user): ?>
                <?php if (isOwner()): ?>
                    <a href="upload.php" class="nav-btn nav-btn-primary">+ Upload Anime</a>
                <?php endif; ?>
                <div class="user-menu">
                    <?php if ($user['picture']): ?>
                        <img src="<?= htmlspecialchars($user['picture']) ?>" alt="Avatar" class="user-avatar">
                    <?php else: ?>
                        <div class="user-avatar-placeholder"><?= strtoupper(substr($user['name'], 0, 1)) ?></div>
                    <?php endif; ?>
                    <span class="user-name"><?= htmlspecialchars($user['name']) ?></span>
                    <?php if (isOwner()): ?>
                        <span class="owner-badge">Owner</span>
                    <?php endif; ?>
                </div>
                <a href="logout.php" class="nav-btn">Logout</a>
            <?php else: ?>
                <a href="login.php" class="nav-btn">Login</a>
                <a href="login.php" class="nav-btn nav-btn-primary">Mulai Nonton</a>
            <?php endif; ?>
        </div>
    </nav>
    
    <!-- Hero -->
    <section class="hero">
        <h1>Zyx-nime</h1>
        <p>Nonton anime favorit Anda dengan kualitas tinggi dan streaming lancar</p>
    </section>
    
    <!-- Search -->
    <div class="search-container">
        <form method="GET" class="search-box">
            <input type="text" name="search" class="search-input" placeholder="Cari anime..." value="<?= htmlspecialchars($search) ?>">
            <select name="category" class="category-select">
                <option value="">Semua Kategori</option>
                <option value="action" <?= $category === 'action' ? 'selected' : '' ?>>Action</option>
                <option value="adventure" <?= $category === 'adventure' ? 'selected' : '' ?>>Adventure</option>
                <option value="comedy" <?= $category === 'comedy' ? 'selected' : '' ?>>Comedy</option>
                <option value="drama" <?= $category === 'drama' ? 'selected' : '' ?>>Drama</option>
                <option value="fantasy" <?= $category === 'fantasy' ? 'selected' : '' ?>>Fantasy</option>
                <option value="horror" <?= $category === 'horror' ? 'selected' : '' ?>>Horror</option>
                <option value="mystery" <?= $category === 'mystery' ? 'selected' : '' ?>>Mystery</option>
                <option value="romance" <?= $category === 'romance' ? 'selected' : '' ?>>Romance</option>
                <option value="sci-fi" <?= $category === 'sci-fi' ? 'selected' : '' ?>>Sci-Fi</option>
                <option value="slice-of-life" <?= $category === 'slice-of-life' ? 'selected' : '' ?>>Slice of Life</option>
                <option value="sports" <?= $category === 'sports' ? 'selected' : '' ?>>Sports</option>
                <option value="supernatural" <?= $category === 'supernatural' ? 'selected' : '' ?>>Supernatural</option>
            </select>
            <button type="submit" class="search-btn">🔍 Cari</button>
        </form>
    </div>
    
    <!-- Videos -->
    <div class="container">
        <h2 class="section-title">🎬 <?= $search || $category ? 'Hasil Pencarian' : 'Anime Terbaru' ?></h2>
        
        <?php if (count($videos) > 0): ?>
            <div class="video-grid">
                <?php foreach ($videos as $video): ?>
                    <a href="watch.php?id=<?= $video['id'] ?>" class="video-card">
                        <div class="video-thumbnail">
                            <?php if ($video['thumbnail_path']): ?>
                                <img src="<?= htmlspecialchars($video['thumbnail_path']) ?>" alt="<?= htmlspecialchars($video['title']) ?>">
                            <?php else: ?>
                                <div class="video-thumbnail-placeholder">🎬</div>
                            <?php endif; ?>
                            <?php if ($video['duration']): ?>
                                <span class="video-duration"><?= htmlspecialchars($video['duration']) ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="video-details">
                            <h3 class="video-title"><?= htmlspecialchars($video['title']) ?></h3>
                            <div class="video-meta">
                                <span>👁️ <?= number_format($video['views']) ?></span>
                                <span>📅 <?= date('d M Y', strtotime($video['created_at'])) ?></span>
                            </div>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <div class="icon">🎬</div>
                <h3>Belum ada anime</h3>
                <p>
                    <?php if ($search || $category): ?>
                        Tidak ada hasil untuk pencarian Anda
                    <?php else: ?>
                        <?php if (isOwner()): ?>
                            Segera upload anime pertama Anda!
                        <?php else: ?>
                            Anime akan segera hadir
                        <?php endif; ?>
                    <?php endif; ?>
                </p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Footer -->
    <footer>
        <p>&copy; <?= date('Y') ?> <?= SITE_NAME ?>. All rights reserved.</p>
    </footer>
</body>
</html>
