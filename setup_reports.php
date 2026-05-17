<?php
/**
 * Setup script for Review Reports functionality
 * Run this once to create the review_reports table
 */

require_once 'includes/config.php';

// Get database connection
$conn = getDB();

$sql = "CREATE TABLE IF NOT EXISTS review_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    reporter_name VARCHAR(255) DEFAULT NULL,
    reporter_email VARCHAR(255) DEFAULT NULL,
    reason ENUM('spam', 'inappropriate', 'fake', 'offensive', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES restaurant_ratings(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_review_id (review_id),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

try {
    $conn->exec($sql);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Setup Complete - Review Reports</title>
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
            h1 {
                color: #2ecc71;
                margin-bottom: 10px;
            }
            .icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            .success-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .info-box {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            ul {
                line-height: 1.8;
            }
            code {
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                transition: background 0.3s;
            }
            .btn:hover {
                background: #764ba2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✅</div>
            <h1>Setup Complete!</h1>
            <p>The <strong>review_reports</strong> table has been created successfully in your database.</p>
            
            <div class="success-box">
                <strong>✓ Database table created</strong><br>
                The review reports functionality is now ready to use!
            </div>
            
            <div class="info-box">
                <h3>📋 What's Now Available:</h3>
                <ul>
                    <li><strong>Frontend:</strong> Users can report inappropriate reviews using the Report button (🚩)</li>
                    <li><strong>Admin Panel:</strong> View and manage all reports in the Reports tab</li>
                    <li><strong>Actions:</strong> Mark reports as reviewed, dismissed, or remove offending reviews</li>
                </ul>
            </div>
            
            <div class="warning-box">
                <h3>🔒 Security Note:</h3>
                <p>You can safely <strong>delete this file</strong> (<code>setup_reports.php</code>) now that the table has been created.</p>
                <p>Keeping setup scripts on a production server is a security risk.</p>
            </div>
            
            <h3>🚀 Next Steps:</h3>
            <ol>
                <li>Delete this file: <code>setup_reports.php</code></li>
                <li>Go to the <a href="admin_login.php">Admin Panel</a> and click the "Reports" tab</li>
                <li>Test the report feature on the frontend by clicking the flag icon on any review</li>
            </ol>
            
            <a href="admin_login.php" class="btn">Go to Admin Panel</a>
            <a href="index.php" class="btn">Go to Homepage</a>
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
        <title>Setup Error - Review Reports</title>
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
            h1 {
                color: #e74c3c;
                margin-bottom: 10px;
            }
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
                font-family: 'Courier New', monospace;
                display: block;
                margin: 10px 0;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>❌ Setup Error</h1>
            <p>There was an error creating the database table.</p>
            
            <div class="error-box">
                <strong>Error Details:</strong>
                <code><?php echo htmlspecialchars($e->getMessage()); ?></code>
            </div>
            
            <h3>💡 Possible Solutions:</h3>
            <ul>
                <li>Check your database connection in <code>includes/config.php</code></li>
                <li>Make sure your database user has CREATE TABLE permissions</li>
                <li>Verify that the <code>restaurant_ratings</code> table exists (required for foreign key)</li>
                <li>Check if the table already exists (if so, you're all set!)</li>
            </ul>
            
            <p><a href="setup_reports.php">Try Again</a></p>
        </div>
    </body>
    </html>
    <?php
}
?>
