<?php
// Prevent direct access and caching
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Only allow requests from same origin (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get Mapbox token from environment variable or config
    $mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');
    
    // If not in environment, get from config file
    if (!$mapboxToken) {
        require_once __DIR__ . '/../includes/config.php';
        // You should add MAPBOX_ACCESS_TOKEN to your config.php
        if (defined('MAPBOX_ACCESS_TOKEN')) {
            $mapboxToken = MAPBOX_ACCESS_TOKEN;
        }
    }
    
    // If no token available, return error
    if (!$mapboxToken) {
        http_response_code(503);
        echo json_encode([
            'token' => null,
            'success' => false,
            'error' => 'MAPBOX_ACCESS_TOKEN not configured. Please set it in environment variables or .env file.'
        ]);
        exit;
    }
    
    echo json_encode([
        'token' => $mapboxToken,
        'success' => true
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
        'success' => false
    ]);
}
?>
