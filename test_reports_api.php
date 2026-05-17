<?php
session_start();
// Simulate admin login for testing
$_SESSION['admin_logged_in'] = true;

require_once 'includes/config.php';

$conn = getDB();

echo "<h2>Testing Reports API</h2>";

// Test 1: Check if reports exist in database
echo "<h3>1. Reports in database:</h3>";
$stmt = $conn->query("SELECT * FROM review_reports ORDER BY created_at DESC");
$reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>";
print_r($reports);
echo "</pre>";

// Test 2: Test the actual API endpoint
echo "<h3>2. API Response (api/admin_reports.php?action=list):</h3>";
$_GET['action'] = 'list';
ob_start();
include 'api/admin_reports.php';
$output = ob_get_clean();
echo "<pre>";
echo htmlspecialchars($output);
echo "</pre>";

// Test 3: Check table structure
echo "<h3>3. Table Structure:</h3>";
$stmt = $conn->query("DESCRIBE review_reports");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "<pre>";
print_r($columns);
echo "</pre>";
?>
