<?php
require_once 'config.php';

$videoId = $_GET['id'] ?? 0;

if (!$videoId) {
    die('Video tidak ditemukan!');
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM videos WHERE id = ? AND status = 'active'");
    $stmt->execute([$videoId]);
    $video = $stmt->fetch();
    
    if (!$video) {
        die('Video tidak ditemukan!');
    }
    
    $filePath = __DIR__ . '/' . $video['video_path'];
    
    if (!file_exists($filePath)) {
        die('File video tidak ditemukan!');
    }
    
    // Get file info
    $fileName = basename($video['video_path']);
    $filesize = filesize($filePath);
    
    // Set headers for download
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . $filesize);
    
    // Clean output buffer
    ob_clean();
    flush();
    
    // Read file and output
    readfile($filePath);
    exit;
    
} catch (Exception $e) {
    die('Gagal mendownload video: ' . $e->getMessage());
}
