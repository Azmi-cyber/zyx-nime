<?php
/**
 * Zyx-nime Configuration File
 * Database and Google OAuth Settings
 */

// Database Configuration for XAMPP
define('DB_HOST', 'localhost');
define('DB_NAME', 'zyxnime');
define('DB_USER', 'root');
define('DB_PASS', '');

// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', '458496826439-2kbdbgtm695ho8l7nbtr3ll4uleuo9f3.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'http://localhost/zyx-nime/google-callback.php');

// Owner Credentials
define('OWNER_EMAIL', '200714@gmail.com');
define('OWNER_PASSWORD', '200714');
define('OWNER_NAME', 'azmi');
define('OWNER_AGE', '11');

// Site Configuration
define('SITE_NAME', 'Zyx-nime');
define('SITE_URL', 'http://localhost/zyx-nime');
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
