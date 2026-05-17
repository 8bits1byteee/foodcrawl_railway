<?php
/**
 * Railway Database Migration Script
 * 
 * Run this after deploying to Railway to initialize the database
 * Usage: php railway_migrate.php
 */

// Colors for CLI output
class Colors {
    const RED = "\033[91m";
    const GREEN = "\033[92m";
    const YELLOW = "\033[93m";
    const BLUE = "\033[94m";
    const RESET = "\033[0m";
}

function log_info($msg) {
    echo Colors::BLUE . "[INFO] " . Colors::RESET . $msg . PHP_EOL;
}

function log_success($msg) {
    echo Colors::GREEN . "[✓] " . Colors::RESET . $msg . PHP_EOL;
}

function log_warning($msg) {
    echo Colors::YELLOW . "[!] " . Colors::RESET . $msg . PHP_EOL;
}

function log_error($msg) {
    echo Colors::RED . "[✗] " . Colors::RESET . $msg . PHP_EOL;
}

// Display header
echo Colors::BLUE;
echo str_repeat("=", 60) . PHP_EOL;
echo "Railway Database Migration Tool" . PHP_EOL;
echo str_repeat("=", 60) . PHP_EOL;
echo Colors::RESET;

// Load configuration
log_info("Loading configuration...");
require_once 'includes/config.php';

// Check database connection
log_info("Testing database connection...");
$db = getDB();

if (!$db) {
    log_error("Failed to connect to database!");
    log_error("Environment variables:");
    echo "  DB_HOST: " . getenv('DB_HOST') . PHP_EOL;
    echo "  DB_USER: " . getenv('DB_USER') . PHP_EOL;
    echo "  DB_NAME: " . getenv('DB_NAME') . PHP_EOL;
    exit(1);
}

log_success("Database connection successful!");

// List of SQL migration files
$sqlFiles = [
    'food_crawl.sql',
    'create_ratings_table.sql',
    'create_reports_table.sql',
    'create_review_reports_table.sql',
];

log_info("Available migration files:");
foreach ($sqlFiles as $file) {
    $filePath = __DIR__ . '/' . $file;
    if (file_exists($filePath)) {
        echo "  ✓ $file" . PHP_EOL;
    } else {
        echo "  ✗ $file (not found)" . PHP_EOL;
    }
}

echo PHP_EOL;

// Ask user which files to migrate
log_info("Checking which migrations need to be applied...");

// Check if tables exist
$existingTables = [];
try {
    $result = $db->query("SELECT GROUP_CONCAT(TABLE_NAME) as tables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?", [getenv('DB_NAME')]);
    if ($result) {
        $row = $result->fetch(PDO::FETCH_ASSOC);
        $existingTables = array_filter(explode(',', $row['tables'] ?? ''));
    }
} catch (Exception $e) {
    log_warning("Could not check existing tables: " . $e->getMessage());
}

if (!empty($existingTables)) {
    log_warning("Database already contains tables: " . implode(', ', $existingTables));
    echo "Proceed with migration? (This may drop existing tables) [y/N]: ";
    $input = trim(fgets(STDIN));
    if (strtolower($input) !== 'y') {
        log_error("Migration cancelled.");
        exit(0);
    }
}

// Execute migrations
log_info("Starting migrations...");
$migratedCount = 0;
$failedCount = 0;

foreach ($sqlFiles as $file) {
    $filePath = __DIR__ . '/' . $file;
    
    if (!file_exists($filePath)) {
        log_warning("Skipping $file (not found)");
        continue;
    }
    
    log_info("Migrating: $file");
    
    try {
        $sql = file_get_contents($filePath);
        
        // Split by semicolon and execute each statement
        $statements = array_filter(array_map('trim', preg_split('/;[\r\n]+/', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $db->exec($statement);
            }
        }
        
        log_success("Migrated: $file");
        $migratedCount++;
        
    } catch (Exception $e) {
        log_error("Failed to migrate $file: " . $e->getMessage());
        $failedCount++;
    }
}

echo PHP_EOL;

// Summary
echo Colors::BLUE;
echo str_repeat("=", 60) . PHP_EOL;
echo "Migration Summary" . PHP_EOL;
echo str_repeat("=", 60) . PHP_EOL;
echo Colors::RESET;

log_success("Successful migrations: $migratedCount");
if ($failedCount > 0) {
    log_error("Failed migrations: $failedCount");
}

// Show final database status
log_info("Final database tables:");
try {
    $result = $db->query("SHOW TABLES");
    $tables = $result->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "  ✓ $table" . PHP_EOL;
    }
    log_success("Total tables: " . count($tables));
} catch (Exception $e) {
    log_error("Could not retrieve table list: " . $e->getMessage());
}

echo PHP_EOL;

if ($failedCount === 0) {
    log_success("All migrations completed successfully!");
    exit(0);
} else {
    log_error("Some migrations failed. Please check the errors above.");
    exit(1);
}
?>
