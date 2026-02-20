<?php
require_once 'config.php';

// Destroy session
session_destroy();

// Redirect to index
header('Location: index.php');
exit;
