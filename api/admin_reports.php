<?php
header('Content-Type: application/json');
require_once '../includes/auth.php';

// Check if admin is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../includes/config.php';

// Get database connection
$conn = getDB();

$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        case 'list':
            // Get all reports with review and restaurant details
            $status = $_GET['status'] ?? 'all';
            
            $sql = "
                SELECT 
                    rr.id,
                    rr.review_id,
                    rr.restaurant_id,
                    rr.reason,
                    rr.reporter_name,
                    rr.reporter_email,
                    rr.reporter_ip,
                    rr.description,
                    rr.status,
                    rr.created_at,
                    rr.updated_at,
                    rt.reviewer_name,
                    rt.rating,
                    rt.comment,
                    rt.created_at as review_date,
                    r.name as restaurant_name
                FROM review_reports rr
                LEFT JOIN restaurant_ratings rt ON rr.review_id = rt.id
                LEFT JOIN restaurants r ON rr.restaurant_id = r.id
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
            
            // Get counts by status
            $countsStmt = $conn->query("
                SELECT status, COUNT(*) as count 
                FROM review_reports 
                GROUP BY status
            ");
            $counts = [];
            while ($row = $countsStmt->fetch(PDO::FETCH_ASSOC)) {
                $counts[$row['status']] = $row['count'];
            }
            
            echo json_encode([
                'success' => true,
                'reports' => $reports,
                'counts' => $counts
            ]);
            break;
            
        case 'update_status':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method not allowed');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $report_id = intval($data['report_id'] ?? 0);
            $new_status = $data['status'] ?? '';
            
            // Map 'removed' to 'resolved' since ENUM only has: pending, reviewed, resolved, dismissed
            $actualStatus = ($new_status === 'removed') ? 'resolved' : $new_status;
            
            if (!in_array($actualStatus, ['pending', 'reviewed', 'resolved', 'dismissed'])) {
                throw new Exception('Invalid status');
            }
            
            $stmt = $conn->prepare("
                UPDATE review_reports 
                SET status = ?
                WHERE id = ?
            ");
            $stmt->execute([$actualStatus, $report_id]);
            
            // If status is 'removed', also delete the review
            if ($new_status === 'removed' && $report_id > 0) {
                $getReviewStmt = $conn->prepare("SELECT review_id FROM review_reports WHERE id = ?");
                $getReviewStmt->execute([$report_id]);
                $report = $getReviewStmt->fetch();
                
                if ($report) {
                    $deleteStmt = $conn->prepare("DELETE FROM restaurant_ratings WHERE id = ?");
                    $deleteStmt->execute([$report['review_id']]);
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Report status updated successfully'
            ]);
            break;
            
        case 'delete':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Method not allowed');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $report_id = intval($data['report_id'] ?? 0);
            
            $stmt = $conn->prepare("DELETE FROM review_reports WHERE id = ?");
            $stmt->execute([$report_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Report deleted successfully'
            ]);
            break;

        case 'top_reviews':
            // Return the highest rated individual reviews (useful for admin overview)
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
            if ($limit <= 0 || $limit > 100) $limit = 5;

            $stmt = $conn->prepare(
                "SELECT rr.id, rr.restaurant_id, rr.reviewer_name, rr.rating, rr.comment, rr.created_at as review_date, r.name as restaurant_name
                 FROM restaurant_ratings rr
                 LEFT JOIN restaurants r ON rr.restaurant_id = r.id
                 ORDER BY rr.rating DESC, rr.created_at DESC
                 LIMIT :limit"
            );
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $topReviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'count' => count($topReviews),
                'reviews' => $topReviews
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
