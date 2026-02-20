<?php
require_once 'config.php';

// Destroy session
session_destroy();

// Redirect to index (clean URL)
header('Location: ' . url('index'));
exit;
