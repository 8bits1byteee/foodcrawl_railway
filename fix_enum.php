<?php
require_once 'includes/config.php';

$conn = getDB();

echo "<h2>Fixing status ENUM column</h2>";

try {
    // Modify the status column to accept the correct ENUM values
    $sql = "ALTER TABLE review_reports 
            MODIFY COLUMN status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending'";
    
    $conn->exec($sql);
    
    echo "<div style='background: #d4edda; padding: 20px; border-radius: 8px; color: #155724; margin: 20px;'>
            <h3>✅ Success!</h3>
            <p>Status column has been updated with correct ENUM values:</p>
            <ul>
                <li>pending</li>
                <li>reviewed</li>
                <li>resolved</li>
                <li>dismissed</li>
            </ul>
            <p>You can now update report statuses in the admin panel!</p>
            <p><a href='admin.php' style='color: #155724; text-decoration: underline;'>Go to Admin Panel</a></p>
            <p><strong>Delete this file after use (fix_enum.php)</strong></p>
          </div>";
    
} catch (PDOException $e) {
    echo "<div style='background: #f8d7da; padding: 20px; border-radius: 8px; color: #721c24; margin: 20px;'>
            <h3>❌ Error</h3>
            <p>" . htmlspecialchars($e->getMessage()) . "</p>
          </div>";
}
?>
