<?php
/**
 * Migration script to add missing columns to review_reports table
 * Run this if your table was created with missing columns
 */

require_once 'includes/config.php';

// Get database connection
$conn = getDB();

try {
    // Add reporter_name column if it doesn't exist
    $conn->exec("ALTER TABLE review_reports 
                 ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255) DEFAULT 'Anonymous' 
                 AFTER restaurant_id");
    
    // Add reporter_ip column if it doesn't exist
    $conn->exec("ALTER TABLE review_reports 
                 ADD COLUMN IF NOT EXISTS reporter_ip VARCHAR(50) DEFAULT NULL 
                 AFTER reporter_email");
    
    // Add description column if it doesn't exist
    $conn->exec("ALTER TABLE review_reports 
                 ADD COLUMN IF NOT EXISTS description TEXT 
                 AFTER reason");
    
    // Add updated_at column if it doesn't exist
    $conn->exec("ALTER TABLE review_reports 
                 ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
                 AFTER created_at");
    
    // Modify reason column to accept any text (not just enum)
    $conn->exec("ALTER TABLE review_reports 
                 MODIFY COLUMN reason VARCHAR(255) NOT NULL");
    
    // Add indexes if they don't exist
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_status ON review_reports(status)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_review_id ON review_reports(review_id)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_restaurant_id ON review_reports(restaurant_id)");
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_created_at ON review_reports(created_at)");
    
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Migration Complete</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { color: #2ecc71; }
            .success-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✅ Migration Complete!</h1>
            <div class="success-box">
                <strong>Successfully updated review_reports table with missing columns:</strong>
                <ul>
                    <li>✓ reporter_name</li>
                    <li>✓ reporter_ip</li>
                    <li>✓ description</li>
                    <li>✓ updated_at</li>
                    <li>✓ Updated reason column to VARCHAR</li>
                    <li>✓ Added indexes</li>
                </ul>
            </div>
            <p><strong>You can now:</strong></p>
            <ol>
                <li>Delete this file (fix_reports_table.php)</li>
                <li>Test reporting a review</li>
                <li>Check the Reports tab in admin panel</li>
            </ol>
            <a href="index.php" class="btn">Go to Homepage</a>
            <a href="admin_login.php" class="btn">Go to Admin</a>
        </div>
    </body>
    </html>
    <?php
    
} catch (PDOException $e) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Migration Error</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { color: #e74c3c; }
            .error-box {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            code {
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                display: block;
                margin: 10px 0;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>❌ Migration Error</h1>
            <div class="error-box">
                <strong>Error:</strong>
                <code><?php echo htmlspecialchars($e->getMessage()); ?></code>
            </div>
            <p>If the error says "Duplicate column name", it means the columns already exist and you're good to go!</p>
        </div>
    </body>
    </html>
    <?php
}
?>
