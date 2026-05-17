<?php
/**
 * API endpoint to update report status (Admin only)
 */

session_start();
header('Content-Type: application/json');
require_once '../includes/config.php';

// Check if user is admin
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $report_id = isset($input['report_id']) ? intval($input['report_id']) : 0;
    $status = isset($input['status']) ? $input['status'] : '';
    $action = isset($input['action']) ? $input['action'] : ''; // 'delete_review' or just 'update_status'
    
    if ($report_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid report ID']);
        exit();
    }
    
    // Validate status
    $valid_statuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!in_array($status, $valid_statuses)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid status']);
        exit();
    }
    
    // Get report details
    $stmt = $conn->prepare("SELECT review_id FROM review_reports WHERE id = ?");
    $stmt->execute([$report_id]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$report) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Report not found']);
        exit();
    }
    
    // If action is to delete the review
    if ($action === 'delete_review' && $status === 'resolved') {
        // Delete the review
        $deleteStmt = $conn->prepare("DELETE FROM restaurant_ratings WHERE id = ?");
        $deleteStmt->execute([$report['review_id']]);
        
        // Update all reports for this review to resolved
        $updateAllStmt = $conn->prepare("UPDATE review_reports SET status = 'resolved' WHERE review_id = ?");
        $updateAllStmt->execute([$report['review_id']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Review deleted and all related reports marked as resolved'
        ]);
        exit();
    }
    
    // Otherwise just update the report status
    $stmt = $conn->prepare("UPDATE review_reports SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $report_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Report status updated successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
