<?php
session_start();

// Simple debug API that always returns JSON
header('Content-Type: application/json');

echo json_encode([
    'debug' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => PHP_VERSION,
    'session_active' => isset($_SESSION),
    'post_data' => $_POST,
    'get_data' => $_GET,
    'files_data' => !empty($_FILES) ? 'Files present' : 'No files'
]);
?>