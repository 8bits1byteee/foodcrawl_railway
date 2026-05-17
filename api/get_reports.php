<?php
/**
 * API endpoint to get review reports (Admin only)
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

try {
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    
    $sql = "
        SELECT 
            rr.id,
            rr.review_id,
            rr.restaurant_id,
            rr.reason,
            rr.reporter_name,
            rr.reporter_email,
            rr.reporter_ip,
            rr.status,
            rr.created_at,
            rr.updated_at,
            rat.reviewer_name,
            rat.comment,
            rat.rating,
            rat.profile_picture,
            res.name as restaurant_name
        FROM review_reports rr
        LEFT JOIN restaurant_ratings rat ON rr.review_id = rat.id
        LEFT JOIN restaurants res ON rr.restaurant_id = res.id
    ";
    
    if ($status !== 'all') {
        $sql .= " WHERE rr.status = :status";
    }
    
    $sql .= " ORDER BY rr.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    
    if ($status !== 'all') {
        $stmt->bindParam(':status', $status);
    }
    
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'reports' => $reports,
        'count' => count($reports)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
