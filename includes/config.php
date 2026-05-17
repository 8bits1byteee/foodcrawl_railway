<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) continue;
        
        // Parse KEY=VALUE format
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if ((strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)) {
                $value = substr($value, 1, -1);
            }
            
            putenv("$key=$value");
        }
    }
}

$appTimezone = getenv('APP_TIMEZONE') ?: getenv('TIMEZONE') ?: 'Asia/Manila';
if (!date_default_timezone_set($appTimezone)) {
    date_default_timezone_set('Asia/Manila');
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'food_crawl');
define('DB_USER', 'root');
define('DB_PASS', '');

// Mapbox configuration - load from environment variable
define('MAPBOX_ACCESS_TOKEN', getenv('MAPBOX_ACCESS_TOKEN') ?: '');

// Global error tracking
$GLOBALS['db_error'] = null;

// Create database connection
function getDB() {
    static $pdo;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $GLOBALS['db_error'] = '';
        } catch (PDOException $e) {
            $GLOBALS['db_error'] = $e->getMessage();
            $pdo = false;
        }
    }
    
    return $pdo;
}

// Check connection status
function isDBConnected() {
    $db = getDB();
    return $db !== false && $db !== null;
}

// Get connection error
function getDBError() {
    return $GLOBALS['db_error'] ?? 'Unknown database error';
}
?>