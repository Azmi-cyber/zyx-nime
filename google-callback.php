<?php
require_once 'config.php';

$error = '';

// Check for authorization code
if (!isset($_GET['code'])) {
    $error = 'Tidak ada kode otorisasi!';
} else {
    $code = $_GET['code'];
    
    // Exchange code for access token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'code' => $code,
        'client_id' => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri' => GOOGLE_REDIRECT_URI,
        'grant_type' => 'authorization_code'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $tokenData = json_decode($response, true);
    
    if (!isset($tokenData['access_token'])) {
        $error = 'Gagal mendapatkan akses token!';
    } else {
        // Get user info
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://www.googleapis.com/oauth2/v2/userinfo');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $tokenData['access_token']]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $userInfo = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        if (!isset($userInfo['email'])) {
            $error = 'Gagal mendapatkan informasi pengguna!';
        } else {
            // Check if user is owner (by email)
            $email = $userInfo['email'];
            $name = $userInfo['name'];
            $picture = $userInfo['picture'];
            $googleId = $userInfo['id'];
            
            try {
                $pdo = getDBConnection();
                
                // Check if user exists
                $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR google_id = ?");
                $stmt->execute([$email, $googleId]);
                $user = $stmt->fetch();
                
                $isOwner = ($email === OWNER_EMAIL);
                
                if ($user) {
                    // Update existing user
                    $stmt = $pdo->prepare("UPDATE users SET google_id = ?, name = ?, picture = ?, role = ?, is_verified = 1 WHERE id = ?");
                    $stmt->execute([$googleId, $name, $picture, $isOwner ? 'owner' : 'user', $user['id']]);
                    $userId = $user['id'];
                } else {
                    // Create new user
                    $stmt = $pdo->prepare("INSERT INTO users (google_id, email, name, picture, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)");
                    $stmt->execute([$googleId, $email, $name, $picture, $isOwner ? 'owner' : 'user']);
                    $userId = $pdo->lastInsertId();
                }
                
                // Set session
                $_SESSION['user_id'] = $userId;
                $_SESSION['email'] = $email;
                $_SESSION['name'] = $name;
                $_SESSION['picture'] = $picture;
                $_SESSION['role'] = $isOwner ? 'owner' : 'user';
                
                // Redirect to index
                header('Location: index.php');
                exit;
                
            } catch (Exception $e) {
                $error = 'Gagal menyimpan data pengguna: ' . $e->getMessage();
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
    <title>Error - <?= SITE_NAME ?></title>
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
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .error-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .error-icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        h1 {
            color: #fff;
            margin-bottom: 15px;
        }
        p {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 25px;
        }
        a {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            transition: transform 0.3s ease;
        }
        a:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>Login Gagal</h1>
        <p><?= htmlspecialchars($error) ?></p>
        <a href="login.php">Coba Lagi</a>
    </div>
</body>
</html>
