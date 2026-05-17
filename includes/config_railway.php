<?php
/**
 * Railway Configuration Override
 * This file handles environment-based database configuration for Railway deployment
 */

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

// Timezone configuration
$appTimezone = getenv('APP_TIMEZONE') ?: getenv('TIMEZONE') ?: 'Asia/Manila';
if (!date_default_timezone_set($appTimezone)) {
    date_default_timezone_set('Asia/Manila');
}

// Database configuration with Railway support
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'food_crawl';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

// Handle Railway's connection format if provided
if (getenv('DATABASE_URL')) {
    // Parse DATABASE_URL format: mysql://user:password@host:port/dbname
    $dbUrl = parse_url(getenv('DATABASE_URL'));
    $dbHost = $dbUrl['host'] ?? $dbHost;
    $dbPort = $dbUrl['port'] ?? $dbPort;
    $dbUser = $dbUrl['user'] ?? $dbUser;
    $dbPass = $dbUrl['pass'] ?? $dbPass;
    $dbName = ltrim($dbUrl['path'] ?? '/' . $dbName, '/');
}

define('DB_HOST', $dbHost);
define('DB_PORT', $dbPort);
define('DB_NAME', $dbName);
define('DB_USER', $dbUser);
define('DB_PASS', $dbPass);

// Mapbox configuration
define('MAPBOX_ACCESS_TOKEN', getenv('MAPBOX_ACCESS_TOKEN') ?: '');

// Global error tracking
$GLOBALS['db_error'] = null;

// Create database connection
function getDB() {
    static $pdo;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, false);
        } catch (PDOException $e) {
            $GLOBALS['db_error'] = $e->getMessage();
            error_log('Database connection error: ' . $e->getMessage());
            // Return null on connection failure
            return null;
        }
    }
    
    return $pdo;
}

/**
 * Check if database connection is available
 */
function isDBConnected() {
    return getDB() !== null && $GLOBALS['db_error'] === null;
}
?>
