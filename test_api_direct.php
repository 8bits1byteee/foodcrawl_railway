<?php
// Enable error display
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
$_SESSION['admin_logged_in'] = true;

echo "<h2>Testing API Endpoint</h2>";

// Test the API directly
$_GET['action'] = 'list';
$_GET['status'] = 'all';

echo "<h3>Including api/admin_reports.php...</h3>";
include 'api/admin_reports.php';
?>
