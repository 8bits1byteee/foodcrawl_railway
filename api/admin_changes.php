<?php
session_start();
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function resolveMediaPath($path) {
    if (!$path) return null;
    $path = str_replace('\\', '/', $path);
    if (strpos($path, 'images/') === 0) {
        $full = realpath(__DIR__ . '/../' . $path);
        return $full ?: (__DIR__ . '/../' . $path);
    }
    return realpath($path) ?: $path;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if admin is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    $pdo = getDB();
    
    switch ($action) {
        case 'get_pending':
            $stmt = $pdo->query("
                SELECT rc.*, r.name as restaurant_name, o.name as owner_name, o.email as owner_email
                FROM restaurant_changes rc
                JOIN restaurants r ON rc.restaurant_id = r.id
                JOIN owners o ON rc.owner_id = o.id
                WHERE rc.status = 'pending'
                ORDER BY rc.created_at DESC
            ");
            $changes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // For each change, also get the current restaurant data for comparison
            foreach ($changes as &$change) {
                $restaurant = getRestaurantById($change['restaurant_id']);
                $change['current_data'] = $restaurant;
                $decoded = json_decode($change['changes_json'], true) ?: [];
                $change['changes'] = array_filter($decoded, function($k) { return strncmp($k, '__', 2) !== 0; }, ARRAY_FILTER_USE_KEY);
            }
            
            echo json_encode(['success' => true, 'changes' => $changes]);
            break;

        case 'get_all':
            $status = $_GET['status'] ?? '';
            $sql = "
                SELECT rc.*, r.name as restaurant_name, o.name as owner_name, o.email as owner_email
                FROM restaurant_changes rc
                JOIN restaurants r ON rc.restaurant_id = r.id
                JOIN owners o ON rc.owner_id = o.id
            ";
            $params = [];
            if ($status && in_array($status, ['pending','approved','rejected'])) {
                $sql .= " WHERE rc.status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY rc.created_at DESC LIMIT 100";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $changes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($changes as &$change) {
                $restaurant = getRestaurantById($change['restaurant_id']);
                $change['current_data'] = $restaurant;
                $decoded = json_decode($change['changes_json'], true) ?: [];
                $change['changes'] = array_filter($decoded, function($k) { return strncmp($k, '__', 2) !== 0; }, ARRAY_FILTER_USE_KEY);
            }
            
            echo json_encode(['success' => true, 'changes' => $changes]);
            break;

        case 'get_pending_count':
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM restaurant_changes WHERE status = 'pending'");
            $result = $stmt->fetch();
            echo json_encode(['success' => true, 'count' => $result['count']]);
            break;

        case 'approve':
            $input = json_decode(file_get_contents('php://input'), true);
            $changeId = $input['change_id'] ?? 0;
            $adminNotes = $input['admin_notes'] ?? '';
            
            if (!$changeId) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing change ID']);
                break;
            }
            
            // Get the change request
            $stmt = $pdo->prepare("SELECT * FROM restaurant_changes WHERE id = ? AND status = 'pending'");
            $stmt->execute([$changeId]);
            $change = $stmt->fetch();
            
            if (!$change) {
                http_response_code(404);
                echo json_encode(['error' => 'Change request not found or already processed']);
                break;
            }
            
            $changes = json_decode($change['changes_json'], true) ?: [];
            $meta = [];
            foreach ($changes as $k => $v) {
                if (strncmp($k, '__', 2) === 0) {
                    $meta[$k] = $v;
                    unset($changes[$k]);
                }
            }
            $restaurantId = $change['restaurant_id'];
            $ownerId = $change['owner_id'];
            
            // Get current restaurant data
            $currentRestaurant = getRestaurantById($restaurantId);
            if (!$currentRestaurant) {
                http_response_code(404);
                echo json_encode(['error' => 'Restaurant not found']);
                break;
            }
            
            // Apply the changes to the restaurant
            $updateData = $currentRestaurant;
            foreach ($changes as $field => $newValue) {
                $updateData[$field] = $newValue;
            }
            
            // Ensure image_paths stays as array for updateRestaurant
            if (isset($updateData['image_paths']) && is_array($updateData['image_paths'])) {
                // already an array, good
            }
            
            $success = updateRestaurant($restaurantId, $updateData);
            
            if ($success) {
                // Cleanup removed media files (if any)
                $finalImages = isset($updateData['image_paths']) && is_array($updateData['image_paths']) ? $updateData['image_paths'] : [];
                $finalMenuImages = [];
                if (!empty($updateData['menu_image'])) {
                    $decodedMenu = json_decode($updateData['menu_image'], true);
                    $finalMenuImages = is_array($decodedMenu) ? $decodedMenu : [];
                }
                $finalLogo = $updateData['logo'] ?? '';

                $removedImages = $meta['__removed_image_paths'] ?? [];
                $removedMenu = $meta['__removed_menu_images'] ?? [];
                $removedLogo = $meta['__removed_logo'] ?? '';

                if (!is_array($removedImages)) $removedImages = [];
                if (!is_array($removedMenu)) $removedMenu = [];

                foreach ($removedImages as $path) {
                    if ($path && !in_array($path, $finalImages, true)) {
                        $full = resolveMediaPath($path);
                        if ($full && file_exists($full) && is_file($full)) {
                            @unlink($full);
                        }
                    }
                }
                foreach ($removedMenu as $path) {
                    if ($path && !in_array($path, $finalMenuImages, true)) {
                        $full = resolveMediaPath($path);
                        if ($full && file_exists($full) && is_file($full)) {
                            @unlink($full);
                        }
                    }
                }
                if (!empty($removedLogo) && $removedLogo !== $finalLogo) {
                    $full = resolveMediaPath($removedLogo);
                    if ($full && file_exists($full) && is_file($full)) {
                        @unlink($full);
                    }
                }

                // Mark change as approved
                $stmt = $pdo->prepare("UPDATE restaurant_changes SET status = 'approved', admin_notes = ?, reviewed_at = NOW() WHERE id = ?");
                $stmt->execute([$adminNotes, $changeId]);
                
                // Get restaurant name for notification
                $restaurantName = $currentRestaurant['name'];
                $changedFields = implode(', ', array_keys($changes));
                
                // Send notification to owner
                $notifMessage = "Your changes to \"{$restaurantName}\" have been approved! Fields updated: {$changedFields}";
                if ($adminNotes) {
                    $notifMessage .= ". Admin notes: {$adminNotes}";
                }
                
                $stmt = $pdo->prepare("INSERT INTO owner_notifications (owner_id, change_id, message, type) VALUES (?, ?, ?, 'approved')");
                $stmt->execute([$ownerId, $changeId, $notifMessage]);
                
                echo json_encode(['success' => true, 'message' => 'Changes approved and applied']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to apply changes']);
            }
            break;

        case 'reject':
            $input = json_decode(file_get_contents('php://input'), true);
            $changeId = $input['change_id'] ?? 0;
            $adminNotes = $input['admin_notes'] ?? '';
            
            if (!$changeId) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing change ID']);
                break;
            }
            
            // Get the change request
            $stmt = $pdo->prepare("SELECT * FROM restaurant_changes WHERE id = ? AND status = 'pending'");
            $stmt->execute([$changeId]);
            $change = $stmt->fetch();
            
            if (!$change) {
                http_response_code(404);
                echo json_encode(['error' => 'Change request not found or already processed']);
                break;
            }
            
            $restaurantId = $change['restaurant_id'];
            $ownerId = $change['owner_id'];
            $changes = json_decode($change['changes_json'], true) ?: [];
            $meta = [];
            foreach ($changes as $k => $v) {
                if (strncmp($k, '__', 2) === 0) {
                    $meta[$k] = $v;
                    unset($changes[$k]);
                }
            }
            
            // Mark change as rejected
            $stmt = $pdo->prepare("UPDATE restaurant_changes SET status = 'rejected', admin_notes = ?, reviewed_at = NOW() WHERE id = ?");
            $stmt->execute([$adminNotes, $changeId]);

            // Cleanup new media files on rejection
            $newImages = $meta['__new_image_paths'] ?? [];
            $newMenuImages = $meta['__new_menu_images'] ?? [];
            $newLogo = $meta['__new_logo'] ?? '';

            if (!is_array($newImages)) $newImages = [];
            if (!is_array($newMenuImages)) $newMenuImages = [];

            foreach ($newImages as $path) {
                if ($path) {
                    $full = resolveMediaPath($path);
                    if ($full && file_exists($full) && is_file($full)) {
                        @unlink($full);
                    }
                }
            }
            foreach ($newMenuImages as $path) {
                if ($path) {
                    $full = resolveMediaPath($path);
                    if ($full && file_exists($full) && is_file($full)) {
                        @unlink($full);
                    }
                }
            }
            if (!empty($newLogo)) {
                $full = resolveMediaPath($newLogo);
                if ($full && file_exists($full) && is_file($full)) {
                    @unlink($full);
                }
            }
            
            // Get restaurant name
            $restaurant = getRestaurantById($restaurantId);
            $restaurantName = $restaurant ? $restaurant['name'] : 'Unknown';
            $changedFields = implode(', ', array_keys($changes));
            
            // Send notification to owner
            $notifMessage = "Your changes to \"{$restaurantName}\" have been rejected. Fields: {$changedFields}";
            if ($adminNotes) {
                $notifMessage .= ". Reason: {$adminNotes}";
            }
            
            $stmt = $pdo->prepare("INSERT INTO owner_notifications (owner_id, change_id, message, type) VALUES (?, ?, ?, 'rejected')");
            $stmt->execute([$ownerId, $changeId, $notifMessage]);
            
            echo json_encode(['success' => true, 'message' => 'Changes rejected']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Admin Changes API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred: ' . $e->getMessage()]);
}
?>
