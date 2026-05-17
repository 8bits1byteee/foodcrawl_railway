<?php
session_start();
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_once '../includes/owner_auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if owner is logged in
if (!isOwnerLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

$ownerId = $_SESSION['owner_id'];
$action = $_GET['action'] ?? '';

function saveOwnerUpload($file, $subdir = 'restaurants', $prefix = 'owner_') {
    if (!isset($file) || !is_array($file)) return null;
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;

    $ext = pathinfo($file['name'] ?? '', PATHINFO_EXTENSION);
    $ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $fileName = $prefix . uniqid('', true) . ($ext ? ('.' . $ext) : '');
    $uploadDir = realpath(__DIR__ . '/../images') . DIRECTORY_SEPARATOR . $subdir;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        return null;
    }

    return 'images/' . $subdir . '/' . $fileName;
}

try {
    $pdo = getDB();
    
    switch ($action) {
        case 'get_restaurants':
            $restaurants = getOwnerRestaurants($ownerId);
            echo json_encode(['success' => true, 'restaurants' => $restaurants]);
            break;

        case 'get_restaurant':
            $id = $_GET['id'] ?? 0;
            // Verify ownership
            $stmt = $pdo->prepare("SELECT * FROM restaurants WHERE id = ? AND owner_id = ?");
            $stmt->execute([$id, $ownerId]);
            $restaurant = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($restaurant) {
                $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
                echo json_encode(['success' => true, 'restaurant' => $restaurant]);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Restaurant not found or access denied']);
            }
            break;

        case 'submit_changes':
            $input = json_decode(file_get_contents('php://input'), true);
            $restaurantId = $input['restaurant_id'] ?? 0;
            $changes = $input['changes'] ?? [];
            
            if (empty($restaurantId) || empty($changes)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing restaurant ID or changes']);
                break;
            }
            
            // Verify the owner owns this restaurant
            $stmt = $pdo->prepare("SELECT id, name FROM restaurants WHERE id = ? AND owner_id = ?");
            $stmt->execute([$restaurantId, $ownerId]);
            $restaurant = $stmt->fetch();
            
            if (!$restaurant) {
                http_response_code(403);
                echo json_encode(['error' => 'You do not own this restaurant']);
                break;
            }
            
            // Check if there's already a pending change for this restaurant
            $stmt = $pdo->prepare("SELECT id FROM restaurant_changes WHERE restaurant_id = ? AND owner_id = ? AND status = 'pending'");
            $stmt->execute([$restaurantId, $ownerId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'You already have a pending change request for this restaurant. Please wait for admin review.']);
                break;
            }
            
            $changesJson = json_encode($changes);
            $success = submitRestaurantChange($restaurantId, $ownerId, $changesJson);
            
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Changes submitted for approval']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to submit changes']);
            }
            break;

        case 'submit_changes_upload':
            $restaurantId = $_POST['restaurant_id'] ?? 0;
            $changes = json_decode($_POST['changes'] ?? '{}', true) ?: [];

            if (empty($restaurantId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing restaurant ID']);
                break;
            }

            // Verify ownership
            $stmt = $pdo->prepare("SELECT id, name FROM restaurants WHERE id = ? AND owner_id = ?");
            $stmt->execute([$restaurantId, $ownerId]);
            $restaurant = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$restaurant) {
                http_response_code(403);
                echo json_encode(['error' => 'You do not own this restaurant']);
                break;
            }

            // Check for pending change
            $stmt = $pdo->prepare("SELECT id FROM restaurant_changes WHERE restaurant_id = ? AND owner_id = ? AND status = 'pending'");
            $stmt->execute([$restaurantId, $ownerId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'You already have a pending change request for this restaurant. Please wait for admin review.']);
                break;
            }

            $current = getRestaurantById($restaurantId);
            if (!$current) {
                http_response_code(404);
                echo json_encode(['error' => 'Restaurant not found']);
                break;
            }

            $keepImagePaths = json_decode($_POST['keep_image_paths'] ?? 'null', true);
            $removeImagePaths = json_decode($_POST['remove_image_paths'] ?? '[]', true);
            $keepMenuImages = json_decode($_POST['keep_menu_images'] ?? 'null', true);
            $removeMenuImages = json_decode($_POST['remove_menu_images'] ?? '[]', true);
            $removeLogo = ($_POST['remove_logo'] ?? '') === '1';

            $currentImagesRaw = $current['image_paths'] ?? [];
            if (is_string($currentImagesRaw)) {
                $currentImages = json_decode($currentImagesRaw, true) ?: [];
            } elseif (is_array($currentImagesRaw)) {
                $currentImages = $currentImagesRaw;
            } else {
                $currentImages = [];
            }

            $currentMenuImagesRaw = $current['menu_image'] ?? [];
            if (is_string($currentMenuImagesRaw)) {
                $currentMenuImages = json_decode($currentMenuImagesRaw, true) ?: [];
            } elseif (is_array($currentMenuImagesRaw)) {
                $currentMenuImages = $currentMenuImagesRaw;
            } else {
                $currentMenuImages = [];
            }

            $keepImagePaths = is_array($keepImagePaths) ? $keepImagePaths : $currentImages;
            $keepMenuImages = is_array($keepMenuImages) ? $keepMenuImages : $currentMenuImages;
            $removeImagePaths = is_array($removeImagePaths) ? $removeImagePaths : [];
            $removeMenuImages = is_array($removeMenuImages) ? $removeMenuImages : [];

            // Upload new files
            $newImagePaths = [];
            if (!empty($_FILES['images']) && is_array($_FILES['images']['name'])) {
                for ($i = 0; $i < count($_FILES['images']['name']); $i++) {
                    $file = [
                        'name' => $_FILES['images']['name'][$i] ?? '',
                        'type' => $_FILES['images']['type'][$i] ?? '',
                        'tmp_name' => $_FILES['images']['tmp_name'][$i] ?? '',
                        'error' => $_FILES['images']['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                        'size' => $_FILES['images']['size'][$i] ?? 0
                    ];
                    $path = saveOwnerUpload($file, 'restaurants', 'owner_img_');
                    if ($path) $newImagePaths[] = $path;
                }
            }

            $newMenuImages = [];
            if (!empty($_FILES['menu_images']) && is_array($_FILES['menu_images']['name'])) {
                for ($i = 0; $i < count($_FILES['menu_images']['name']); $i++) {
                    $file = [
                        'name' => $_FILES['menu_images']['name'][$i] ?? '',
                        'type' => $_FILES['menu_images']['type'][$i] ?? '',
                        'tmp_name' => $_FILES['menu_images']['tmp_name'][$i] ?? '',
                        'error' => $_FILES['menu_images']['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                        'size' => $_FILES['menu_images']['size'][$i] ?? 0
                    ];
                    $path = saveOwnerUpload($file, 'restaurants', 'owner_menu_');
                    if ($path) $newMenuImages[] = $path;
                }
            }

            $newLogoPath = null;
            if (!empty($_FILES['logo'])) {
                $newLogoPath = saveOwnerUpload($_FILES['logo'], 'restaurants', 'owner_logo_');
            }

            // Handle supporting document attachments (any file type, up to 6)
            $newAttachmentPaths = [];
            if (!empty($_FILES['attachments']) && is_array($_FILES['attachments']['name'])) {
                $blockedExts = ['php', 'php3', 'php4', 'php5', 'phtml', 'phar', 'asp', 'aspx', 'cgi', 'sh', 'exe', 'bat', 'cmd', 'ps1', 'py', 'pl', 'rb'];
                $attDir = realpath(__DIR__ . '/../images') . DIRECTORY_SEPARATOR . 'attachments';
                if (!is_dir($attDir)) {
                    mkdir($attDir, 0755, true);
                    file_put_contents($attDir . DIRECTORY_SEPARATOR . '.htaccess', "Options -ExecCGI\nAddHandler cgi-script .php .phtml .phar .asp .aspx .cgi .sh .py\nRemoveHandler .php\nphp_flag engine off\n");
                }
                $maxAttachments = 6;
                $count = min(count($_FILES['attachments']['name']), $maxAttachments);
                for ($i = 0; $i < $count; $i++) {
                    if (($_FILES['attachments']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
                    $attExt = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', pathinfo($_FILES['attachments']['name'][$i] ?? '', PATHINFO_EXTENSION)));
                    if (in_array($attExt, $blockedExts, true)) continue;
                    $attFileName = 'owner_attach_' . uniqid('', true) . ($attExt ? ('.' . $attExt) : '');
                    $attPath = $attDir . DIRECTORY_SEPARATOR . $attFileName;
                    if (move_uploaded_file($_FILES['attachments']['tmp_name'][$i], $attPath)) {
                        $newAttachmentPaths[] = 'images/attachments/' . $attFileName;
                    }
                }
            }

            // Build final media arrays
            $finalImagePaths = array_values(array_diff($keepImagePaths, $removeImagePaths));
            $finalImagePaths = array_slice(array_merge($finalImagePaths, $newImagePaths), 0, 5);

            $finalMenuImages = array_values(array_diff($keepMenuImages, $removeMenuImages));
            $finalMenuImages = array_slice(array_merge($finalMenuImages, $newMenuImages), 0, 10);

            $finalLogoPath = $current['logo'] ?? '';
            if ($removeLogo) $finalLogoPath = '';
            if ($newLogoPath) $finalLogoPath = $newLogoPath;

            // Apply media changes into changes payload only if different
            if (json_encode($finalImagePaths) !== json_encode($currentImages)) {
                $changes['image_paths'] = $finalImagePaths;
            }
            if (json_encode($finalMenuImages) !== json_encode($currentMenuImages)) {
                $changes['menu_image'] = json_encode($finalMenuImages);
            }
            if (($current['logo'] ?? '') !== $finalLogoPath) {
                $changes['logo'] = $finalLogoPath;
            }

            // Attach meta fields for cleanup on approval/rejection
            if (!empty($newImagePaths)) $changes['__new_image_paths'] = $newImagePaths;
            if (!empty($removeImagePaths)) $changes['__removed_image_paths'] = $removeImagePaths;
            if (!empty($newMenuImages)) $changes['__new_menu_images'] = $newMenuImages;
            if (!empty($removeMenuImages)) $changes['__removed_menu_images'] = $removeMenuImages;
            if (!empty($newLogoPath)) $changes['__new_logo'] = $newLogoPath;
            if ($removeLogo && !empty($current['logo'])) $changes['__removed_logo'] = $current['logo'];
            if (!empty($newAttachmentPaths)) $changes['attachments'] = json_encode($newAttachmentPaths);

            if (empty($changes)) {
                http_response_code(400);
                echo json_encode(['error' => 'No changes detected']);
                break;
            }

            $changesJson = json_encode($changes);
            $success = submitRestaurantChange($restaurantId, $ownerId, $changesJson);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Changes submitted for approval']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to submit changes']);
            }
            break;

        case 'get_notifications':
            $notifications = getOwnerNotifications($ownerId);
            $unreadCount = getUnreadNotificationCount($ownerId);
            echo json_encode([
                'success' => true, 
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
            break;

        case 'mark_read':
            $input = json_decode(file_get_contents('php://input'), true);
            $notifId = $input['notification_id'] ?? 0;
            $success = markNotificationRead($notifId, $ownerId);
            echo json_encode(['success' => $success]);
            break;

        case 'mark_all_read':
            $success = markAllNotificationsRead($ownerId);
            echo json_encode(['success' => $success]);
            break;

        case 'delete_notification':
            $input = json_decode(file_get_contents('php://input'), true);
            $notifId = (int)($input['notification_id'] ?? 0);

            if ($notifId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid notification ID']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM owner_notifications WHERE id = ? AND owner_id = ?");
            $stmt->execute([$notifId, $ownerId]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Notification not found']);
            }
            break;

        case 'delete_all_notifications':
            $stmt = $pdo->prepare("DELETE FROM owner_notifications WHERE owner_id = ?");
            $stmt->execute([$ownerId]);
            echo json_encode(['success' => true, 'deleted_count' => $stmt->rowCount()]);
            break;

        case 'delete_change_history':
            $input = json_decode(file_get_contents('php://input'), true);
            $changeId = (int)($input['change_id'] ?? 0);

            if ($changeId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid change ID']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM restaurant_changes WHERE id = ? AND owner_id = ?");
            $stmt->execute([$changeId, $ownerId]);

            if ($stmt->rowCount() > 0) {
                $cleanupStmt = $pdo->prepare("DELETE FROM owner_notifications WHERE change_id = ? AND owner_id = ?");
                $cleanupStmt->execute([$changeId, $ownerId]);
                echo json_encode(['success' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Change history item not found']);
            }
            break;

        case 'delete_all_change_history':
            try {
                $pdo->beginTransaction();

                $cleanupStmt = $pdo->prepare("DELETE FROM owner_notifications WHERE owner_id = ? AND change_id IS NOT NULL");
                $cleanupStmt->execute([$ownerId]);

                $stmt = $pdo->prepare("DELETE FROM restaurant_changes WHERE owner_id = ?");
                $stmt->execute([$ownerId]);

                $deletedCount = $stmt->rowCount();
                $pdo->commit();

                echo json_encode(['success' => true, 'deleted_count' => $deletedCount]);
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete change history']);
            }
            break;

        case 'get_change_history':
            $history = getOwnerChangeHistory($ownerId);
            echo json_encode(['success' => true, 'history' => $history]);
            break;

        case 'change_owner_credentials':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $currentPassword = (string)($input['current_password'] ?? '');
            $newUsername = trim((string)($input['new_username'] ?? ''));
            $newPassword = (string)($input['new_password'] ?? '');
            $confirmPassword = (string)($input['confirm_password'] ?? '');

            if ($currentPassword === '' || $newUsername === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Current password and new username are required.']);
                break;
            }

            if (strlen($newUsername) < 3) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Username must be at least 3 characters.']);
                break;
            }

            if ($newPassword !== '') {
                if (strlen($newPassword) < 6) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'New password must be at least 6 characters.']);
                    break;
                }
                if ($newPassword !== $confirmPassword) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'New password and confirmation do not match.']);
                    break;
                }
            }

            $ownerStmt = $pdo->prepare('SELECT id, email, password_hash FROM owners WHERE id = ?');
            $ownerStmt->execute([$ownerId]);
            $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);

            if (!$owner) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Owner account not found.']);
                break;
            }

            if (!password_verify($currentPassword, $owner['password_hash'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Current password is incorrect.']);
                break;
            }

            $dupStmt = $pdo->prepare('SELECT id FROM owners WHERE email = ? AND id <> ? LIMIT 1');
            $dupStmt->execute([$newUsername, $ownerId]);
            if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Username is already taken.']);
                break;
            }

            if ($newPassword !== '') {
                $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $updateStmt = $pdo->prepare('UPDATE owners SET email = ?, password_hash = ? WHERE id = ?');
                $updateStmt->execute([$newUsername, $newHash, $ownerId]);
            } else {
                $updateStmt = $pdo->prepare('UPDATE owners SET email = ? WHERE id = ?');
                $updateStmt->execute([$newUsername, $ownerId]);
            }

            $_SESSION['owner_email'] = $newUsername;

            echo json_encode([
                'success' => true,
                'message' => $newPassword !== '' ? 'Username and password updated successfully.' : 'Username updated successfully.',
                'username' => $newUsername
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Owner API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>
