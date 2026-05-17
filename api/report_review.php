<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../includes/config.php';

// Get database connection
$conn = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$review_id = isset($data['review_id']) ? intval($data['review_id']) : 0;
$reason = isset($data['reason']) ? trim($data['reason']) : '';
$reporter_name = isset($data['reporter_name']) ? trim($data['reporter_name']) : 'Anonymous';

if ($review_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid review ID']);
    exit;
}

if (empty($reason)) {
    $reason = 'No reason provided';
}

try {
    // Check if review exists
    $stmt = $conn->prepare("SELECT id, restaurant_id, reviewer_name, comment FROM restaurant_ratings WHERE id = ?");
    $stmt->execute([$review_id]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$review) {
        echo json_encode(['success' => false, 'message' => 'Review not found']);
        exit;
    }
    
    // Check if this review has already been reported by this user (optional: based on IP or session)
    $reporter_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $reporter_email = isset($data['reporter_email']) ? trim($data['reporter_email']) : null;
    
    $checkStmt = $conn->prepare("
        SELECT id FROM review_reports 
        WHERE review_id = ? AND reporter_ip = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $checkStmt->execute([$review_id, $reporter_ip]);
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already reported this review recently']);
        exit;
    }
    
    // Insert report
    $insertStmt = $conn->prepare("
        INSERT INTO review_reports 
        (review_id, restaurant_id, reason, reporter_name, reporter_email, reporter_ip, status) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    $insertStmt->execute([
        $review_id,
        $review['restaurant_id'],
        $reason,
        $reporter_name,
        $reporter_email,
        $reporter_ip
    ]);
    
    echo json_encode([
        'success' => true, 
        'message' => 'Report submitted successfully. Our team will review it shortly.'
    ]);
    
} catch (PDOException $e) {
    error_log("Report review error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
}
