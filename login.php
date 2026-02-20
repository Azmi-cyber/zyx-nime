<?php
require_once 'config.php';

$error = '';
$success = '';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error = 'Email dan password harus diisi!';
    } else {
        // Check if it's owner login
        if ($email === OWNER_EMAIL && $password === OWNER_PASSWORD) {
            // Verify owner credentials
            $ownerVerify = getOwnerVerification($email);
            if ($ownerVerify && $ownerVerify['owner_name'] === OWNER_NAME && $ownerVerify['owner_age'] === OWNER_AGE) {
                // Create or get owner user
                $user = getOrCreateOwnerUser($email, OWNER_NAME);
                
                if ($user) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['name'] = $user['name'];
                    $_SESSION['picture'] = $user['picture'];
                    $_SESSION['role'] = 'owner';
                    
                    $success = 'Login berhasil! Mengalihkan...';
                    header('Refresh: 1; URL=index.php');
                } else {
                    $error = 'Gagal membuat sesi login!';
                }
            } else {
                $error = 'Verifikasi owner gagal!';
            }
        } else {
            $error = 'Email atau password owner salah!';
        }
    }
}

function getOwnerVerification($email) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM owner_verification WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch();
    } catch (Exception $e) {
        return null;
    }
}

function getOrCreateOwnerUser($email, $name) {
    try {
        $pdo = getDBConnection();
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Update to owner
            $stmt = $pdo->prepare("UPDATE users SET role = 'owner', is_verified = 1 WHERE id = ?");
            $stmt->execute([$user['id']]);
            $user['role'] = 'owner';
            $user['is_verified'] = 1;
            return $user;
        } else {
            // Create new owner user
            $stmt = $pdo->prepare("INSERT INTO users (email, name, role, is_verified) VALUES (?, ?, 'owner', 1)");
            $stmt->execute([$email, $name]);
            return [
                'id' => $pdo->lastInsertId(),
                'email' => $email,
                'name' => $name,
                'picture' => null,
                'role' => 'owner'
            ];
        }
    } catch (Exception $e) {
        return null;
    }
}

// Generate Google OAuth URL
$googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
    'client_id' => GOOGLE_CLIENT_ID,
    'redirect_uri' => GOOGLE_REDIRECT_URI,
    'response_type' => 'code',
    'scope' => 'email profile',
    'access_type' => 'offline',
    'prompt' => 'consent'
]);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?= SITE_NAME ?></title>
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
        .login-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 420px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
        }
        .logo h1 {
            color: #fff;
            font-size: 28px;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .logo p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-top: 5px;
        }
        .google-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 14px 20px;
            background: #fff;
            color: #333;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            margin-bottom: 20px;
        }
        .google-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
        }
        .google-btn img {
            width: 20px;
            height: 20px;
        }
        .divider {
            display: flex;
            align-items: center;
            margin: 25px 0;
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }
        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
        }
        .divider span {
            padding: 0 15px;
        }
        .owner-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-block;
            margin-bottom: 15px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
            font-size: 14px;
        }
        .form-group input {
            width: 100%;
            padding: 14px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 15px;
            transition: all 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.1);
        }
        .form-group input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
        .login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .error {
            background: rgba(255, 59, 48, 0.1);
            border: 1px solid rgba(255, 59, 48, 0.3);
            color: #ff3b30;
            padding: 12px 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .success {
            background: rgba(52, 199, 89, 0.1);
            border: 1px solid rgba(52, 199, 89, 0.3);
            color: #34c759;
            padding: 12px 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }
        .back-link a:hover {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <img src="logo.png" alt="Zyx-nime Logo" onerror="this.style.display='none'">
            <h1>Zyx-nime</h1>
            <p>Platform Streaming Anime</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>
        
        <a href="<?= $googleAuthUrl ?>" class="google-btn">
            <img src="https://www.google.com/favicon.ico" alt="Google">
            Masuk dengan Google
        </a>
        
        <div class="divider">
            <span>atau</span>
        </div>
        
        <div class="owner-badge">🔐 Login Owner</div>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="email">Email Owner</label>
                <input type="email" id="email" name="email" placeholder="200714@gmail.com" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required>
            </div>
            
            <button type="submit" class="login-btn">Login sebagai Owner</button>
        </form>
        
        <div class="back-link">
            <a href="index.php">← Kembali ke Beranda</a>
        </div>
    </div>
</body>
</html>
