<?php
require_once '../includes/config.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'getAll':
            $restaurants = getAllRestaurants();
            echo json_encode($restaurants);
            break;
            
        case 'search':
            $term = $_GET['term'] ?? '';
            if (empty($term)) {
                $restaurants = getAllRestaurants();
            } else {
                $restaurants = searchRestaurants($term);
                saveSearchTerm($term);
            }
            echo json_encode($restaurants);
            break;
            
        case 'getRecommendations':
            $restaurants = getRecommendations();
            echo json_encode($restaurants);
            break;
            
        case 'incrementVisit':
            $id = $_GET['id'] ?? 0;
            if ($id > 0) {
                $success = incrementVisitCount($id);
                echo json_encode(['success' => $success]);
            } else {
                echo json_encode(['error' => 'Invalid ID']);
            }
            break;
            
        case 'saveSearch':
            $input = json_decode(file_get_contents('php://input'), true);
            $term = $input['search_term'] ?? '';
            if (!empty($term)) {
                $success = saveSearchTerm($term);
                echo json_encode(['success' => $success]);
            } else {
                echo json_encode(['error' => 'No search term provided']);
            }
            break;
            
        case 'addRating':
            $input = json_decode(file_get_contents('php://input'), true);
            $restaurantId = $input['restaurant_id'] ?? 0;
            $rating = $input['rating'] ?? 0;
            $reviewerName = $input['reviewer_name'] ?? '';
            $comment = $input['comment'] ?? '';
            $profilePicture = $input['profile_picture'] ?? null;
            
            if ($restaurantId > 0 && $rating >= 1 && $rating <= 5 && !empty($reviewerName) && !empty($comment)) {
                $success = addRestaurantRating($restaurantId, $rating, $reviewerName, $comment, $profilePicture);
                if ($success) {
                    echo json_encode(['success' => true, 'message' => 'Rating added successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to add rating']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid input data']);
            }
            break;
            
        case 'getRatings':
            $restaurantId = $_GET['restaurant_id'] ?? 0;
            if ($restaurantId > 0) {
                $ratings = getRestaurantRatings($restaurantId);
                echo json_encode($ratings);
            } else {
                echo json_encode([]);
            }
            break;

        case 'getById':
            $id = $_GET['id'] ?? 0;
            if ($id > 0) {
                $restaurants = getAllRestaurants();
                $found = null;
                foreach ($restaurants as $r) {
                    if ((int)$r['id'] === (int)$id) {
                        $found = $r;
                        break;
                    }
                }
                if ($found) {
                    echo json_encode($found);
                } else {
                    echo json_encode(['error' => 'Restaurant not found']);
                }
            } else {
                echo json_encode(['error' => 'Invalid ID']);
            }
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    echo json_encode(['error' => 'Server error occurred']);
}
?>