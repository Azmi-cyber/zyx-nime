<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isLoggedIn()) {
    echo json_encode([
        'success' => true,
        'user' => getCurrentUser()
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Not logged in'
    ]);
}
