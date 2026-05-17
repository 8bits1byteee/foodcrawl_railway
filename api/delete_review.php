<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$review_id = isset($input['review_id']) ? intval($input['review_id']) : 0;
$requester_name = isset($input['requester_name']) ? trim($input['requester_name']) : null;

if ($review_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid review id']);
    exit;
}

try {
    $pdo = getDB();
    // Fetch the review
    $stmt = $pdo->prepare("SELECT id, reviewer_name, restaurant_id FROM restaurant_ratings WHERE id = ?");
    $stmt->execute([$review_id]);
    $review = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$review) {
        echo json_encode(['success' => false, 'message' => 'Review not found']);
        exit;
    }

    // Basic ownership check: only allow deletion if requester_name matches reviewer_name
    if ($requester_name === null || $requester_name === '') {
        echo json_encode(['success' => false, 'message' => 'Not authorized to delete this review']);
        exit;
    }

    // Compare trimmed, case-insensitive to avoid minor mismatches
    $normalizedRequester = mb_strtolower(trim($requester_name));
    $normalizedReviewer = mb_strtolower(trim($review['reviewer_name'] ?? ''));
    if ($normalizedRequester !== $normalizedReviewer) {
        echo json_encode(['success' => false, 'message' => 'You are not authorized to delete this review']);
        exit;
    }

    // Proceed to delete
    $del = $pdo->prepare("DELETE FROM restaurant_ratings WHERE id = ?");
    $ok = $del->execute([$review_id]);
    if ($ok) {
        // Optionally decrement counts or do other cleanup here
        echo json_encode(['success' => true, 'message' => 'Review deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete review']);
    }
} catch (PDOException $e) {
    error_log('Delete review error: '.$e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
