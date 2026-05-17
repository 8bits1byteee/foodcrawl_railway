<?php
session_start();
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'edit':
            $data = $_POST;
            $id = $data['id'] ?? 0;
            
            if ($id > 0) {
                // Handle multiple image uploads
                $imagePaths = [];
                
                // Get existing images
                if (isset($data['existing_images']) && is_array($data['existing_images'])) {
                    $imagePaths = array_filter($data['existing_images']);
                }
                
                // Handle new image uploads
                if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
                    $uploadDir = '../images/restaurants/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    
                    // Process each uploaded file
                    $fileCount = count($_FILES['images']['name']);
                    for ($i = 0; $i < $fileCount; $i++) {
                        if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                            // Generate unique filename
                            $filename = uniqid() . '_' . basename($_FILES['images']['name'][$i]);
                            $targetPath = $uploadDir . $filename;
                            
                            if (move_uploaded_file($_FILES['images']['tmp_name'][$i], $targetPath)) {
                                $imagePaths[] = 'images/restaurants/' . $filename;
                            }
                        }
                    }
                }

                // Before handling logo upload, fetch existing restaurant so we can remove old logo file
                $existingRestaurant = getRestaurantById($id);
                $existingLogo = $existingRestaurant['logo'] ?? '';
                $existingMenuImage = $existingRestaurant['menu_image'] ?? '';

                // Handle single logo upload (optional)
                if (isset($_FILES['logo']) && isset($_FILES['logo']['tmp_name']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                    $logoFile = $_FILES['logo'];
                    // Validate MIME type
                    if (str_starts_with($logoFile['type'], 'image/')) {
                        // Validate size (1.5MB)
                        if ($logoFile['size'] <= 1.5 * 1024 * 1024) {
                            $uploadDir = '../images/restaurants/';
                            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                            $ext = pathinfo($logoFile['name'], PATHINFO_EXTENSION);
                            $filename = uniqid() . '_logo.' . $ext;
                            $targetPath = $uploadDir . $filename;
                            if (move_uploaded_file($logoFile['tmp_name'], $targetPath)) {
                                // Store logo path separately (do NOT add it to gallery images)
                                $data['logo'] = 'images/restaurants/' . $filename;

                                // Remove previous logo file from disk to avoid orphaned files
                                if (!empty($existingLogo)) {
                                    $oldFullPath = __DIR__ . '/../' . ltrim($existingLogo, './');
                                    if (file_exists($oldFullPath) && is_file($oldFullPath)) {
                                        @unlink($oldFullPath);
                                    }
                                }
                            }
                        }
                    }
                }

                // Handle multiple menu image uploads (optional) - processed independently of logo upload
                // Debug logging
                error_log('Menu images debug - FILES: ' . print_r($_FILES['menu_images'] ?? 'not set', true));
                error_log('Menu images debug - POST existing: ' . print_r($data['existing_menu_images'] ?? 'not set', true));
                
                // Check if we have new menu images uploaded (must have actual files)
                $hasNewMenuImages = isset($_FILES['menu_images']) && 
                                   is_array($_FILES['menu_images']['name']) && 
                                   !empty($_FILES['menu_images']['name'][0]); // Check first element is not empty
                
                if ($hasNewMenuImages || isset($data['existing_menu_images'])) {
                    $menuImagePaths = [];
                    $uploadDir = '../images/restaurants/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                    
                    // Get existing menu images to keep (from form submission)
                    $keepExistingMenuImages = [];
                    if (isset($data['existing_menu_images']) && is_array($data['existing_menu_images'])) {
                        $keepExistingMenuImages = array_filter($data['existing_menu_images']);
                    }
                    
                    // Parse all existing menu images from DB
                    $allExistingMenuImages = [];
                    if (!empty($existingMenuImage)) {
                        $decoded = json_decode($existingMenuImage, true);
                        if (is_array($decoded)) {
                            $allExistingMenuImages = $decoded;
                        } else {
                            // Legacy single image string
                            $allExistingMenuImages = [$existingMenuImage];
                        }
                    }
                    
                    // Start with existing images that should be kept
                    $menuImagePaths = $keepExistingMenuImages;
                    
                    // Process new uploads if any (up to 10 total including kept images)
                    if ($hasNewMenuImages) {
                        $fileCount = count($_FILES['menu_images']['name']);
                        for ($i = 0; $i < $fileCount && count($menuImagePaths) < 10; $i++) {
                            if ($_FILES['menu_images']['error'][$i] === UPLOAD_ERR_OK) {
                                $menuFile = $_FILES['menu_images'];
                                if (str_starts_with(mime_content_type($menuFile['tmp_name'][$i]), 'image/') && $menuFile['size'][$i] <= 2.5 * 1024 * 1024) {
                                    $ext = pathinfo($menuFile['name'][$i], PATHINFO_EXTENSION);
                                    $filename = uniqid() . '_menu.' . $ext;
                                    $targetPath = $uploadDir . $filename;
                                    if (move_uploaded_file($menuFile['tmp_name'][$i], $targetPath)) {
                                        $menuImagePaths[] = 'images/restaurants/' . $filename;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Update menu_image with new JSON
                    $data['menu_image'] = json_encode($menuImagePaths);
                    
                    // Remove old menu image files that are no longer referenced
                    foreach ($allExistingMenuImages as $oldImage) {
                        if (!in_array($oldImage, $menuImagePaths)) {
                            $oldFullPath = __DIR__ . '/../' . ltrim($oldImage, './');
                            if (file_exists($oldFullPath) && is_file($oldFullPath)) {
                                @unlink($oldFullPath);
                            }
                        }
                    }
                }
                
                // Limit to 5 images
                $imagePaths = array_slice($imagePaths, 0, 5);
                $data['image_paths'] = json_encode($imagePaths);
                
                // If a logo was uploaded, also set image_path to the first image (logo) for compatibility
                if (!empty($imagePaths)) {
                    $data['image_path'] = $imagePaths[0];
                }
                
                // Handle facilities and services data
                // These come from $_POST and need to be in $data array for updateRestaurant
                $data['seating_capacity'] = $_POST['seating_capacity'] ?? null;
                $data['reservation_needed'] = $_POST['reservation_needed'] ?? null;
                $data['parking_availability'] = $_POST['parking_availability'] ?? null;
                $data['wifi_availability'] = $_POST['wifi_availability'] ?? null;
                
                // Handle array fields (checkboxes)
                if (isset($_POST['delivery_options']) && is_array($_POST['delivery_options'])) {
                    $data['delivery_options'] = $_POST['delivery_options'];
                }
                if (isset($_POST['accessibility']) && is_array($_POST['accessibility'])) {
                    $data['accessibility'] = $_POST['accessibility'];
                }
                
                // Handle pricing and payment data
                if (array_key_exists('price_range', $_POST)) {
                    $rawPriceRange = trim((string)$_POST['price_range']);
                    $data['price_range'] = $rawPriceRange === '' ? null : $rawPriceRange;
                }
                error_log("Edit Restaurant - price_range from POST: " . var_export($_POST['price_range'] ?? 'NOT SET', true));
                error_log("Edit Restaurant - price_range normalized: " . var_export($data['price_range'], true));
                
                if (isset($_POST['payment_methods']) && is_array($_POST['payment_methods'])) {
                    $data['payment_methods'] = $_POST['payment_methods'];
                    error_log("Edit Restaurant - payment_methods received: " . json_encode($data['payment_methods']));
                } else {
                    error_log("Edit Restaurant - payment_methods NOT in POST or not an array");
                }
                
                error_log("Edit Restaurant - About to call updateRestaurant with ID: " . $id);
                
                $success = updateRestaurant($id, $data);
                
                error_log("Edit Restaurant - updateRestaurant returned: " . ($success ? 'TRUE' : 'FALSE'));
                
                if ($success) {
                    echo json_encode(['success' => true, 'image_paths' => $imagePaths]);
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to update restaurant']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid ID']);
            }
            break;
            
        case 'getAll':
            $restaurants = getAllRestaurants();
            echo json_encode($restaurants);
            break;
            
        case 'add':
            $data = $_POST;
            $imagePaths = [];
            
            // Handle multiple image uploads for new restaurant
            if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
                $uploadDir = '../images/restaurants/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Process each uploaded file
                $fileCount = count($_FILES['images']['name']);
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                        $filename = uniqid() . '_' . basename($_FILES['images']['name'][$i]);
                        $targetPath = $uploadDir . $filename;
                        
                        if (move_uploaded_file($_FILES['images']['tmp_name'][$i], $targetPath)) {
                            $imagePaths[] = 'images/restaurants/' . $filename;
                        }
                    }
                }
            }

            // Handle single logo upload for add (store separately; do not add to gallery images)
            if (isset($_FILES['logo']) && isset($_FILES['logo']['tmp_name']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $logoFile = $_FILES['logo'];
                if (str_starts_with($logoFile['type'], 'image/') && $logoFile['size'] <= 1.5 * 1024 * 1024) {
                    $uploadDir = '../images/restaurants/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                    $ext = pathinfo($logoFile['name'], PATHINFO_EXTENSION);
                    $filename = uniqid() . '_logo.' . $ext;
                    $targetPath = $uploadDir . $filename;
                    if (move_uploaded_file($logoFile['tmp_name'], $targetPath)) {
                        $data['logo'] = 'images/restaurants/' . $filename;
                    }
                }
            }
            // Handle single menu image upload for add
            $menuImagePaths = [];
            if (isset($_FILES['menu_images']) && is_array($_FILES['menu_images']['name'])) {
                $uploadDir = '../images/restaurants/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                
                $fileCount = count($_FILES['menu_images']['name']);
                for ($i = 0; $i < $fileCount && $i < 10; $i++) {
                    if ($_FILES['menu_images']['error'][$i] === UPLOAD_ERR_OK) {
                        $menuFile = $_FILES['menu_images'];
                        if (str_starts_with(mime_content_type($menuFile['tmp_name'][$i]), 'image/') && $menuFile['size'][$i] <= 2.5 * 1024 * 1024) {
                            $ext = pathinfo($menuFile['name'][$i], PATHINFO_EXTENSION);
                            $filename = uniqid() . '_menu.' . $ext;
                            $targetPath = $uploadDir . $filename;
                            if (move_uploaded_file($menuFile['tmp_name'][$i], $targetPath)) {
                                $menuImagePaths[] = 'images/restaurants/' . $filename;
                            }
                        }
                    }
                }
                if (!empty($menuImagePaths)) {
                    $data['menu_image'] = json_encode($menuImagePaths);
                }
            }
            
                // Limit to 5 images
            $imagePaths = array_slice($imagePaths, 0, 5);
            $data['image_paths'] = json_encode($imagePaths);
            
            // Handle facilities and services data for new restaurant
            $data['seating_capacity'] = $_POST['seating_capacity'] ?? null;
            $data['reservation_needed'] = $_POST['reservation_needed'] ?? null;
            $data['parking_availability'] = $_POST['parking_availability'] ?? null;
            $data['wifi_availability'] = $_POST['wifi_availability'] ?? null;
            
            // Handle array fields (checkboxes)
            if (isset($_POST['delivery_options']) && is_array($_POST['delivery_options'])) {
                $data['delivery_options'] = $_POST['delivery_options'];
            }
            if (isset($_POST['accessibility']) && is_array($_POST['accessibility'])) {
                $data['accessibility'] = $_POST['accessibility'];
            }
            
            // Handle pricing and payment data
            if (array_key_exists('price_range', $_POST)) {
                $rawPriceRange = trim((string)$_POST['price_range']);
                $data['price_range'] = $rawPriceRange === '' ? null : $rawPriceRange;
            }
            if (isset($_POST['payment_methods']) && is_array($_POST['payment_methods'])) {
                $data['payment_methods'] = $_POST['payment_methods'];
            }
            
            // Validate required fields
            if (empty($data['name']) || empty($data['address']) || empty($data['latitude']) || empty($data['longitude'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                break;
            }

            $ownerLogin = trim((string)($data['owner_login'] ?? ''));
            $ownerPassword = (string)($data['owner_password'] ?? '');
            $ownerPasswordConfirm = (string)($data['owner_password_confirm'] ?? '');

            if ($ownerLogin === '' || $ownerPassword === '' || $ownerPasswordConfirm === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Owner account requires email/phone, password, and confirm password']);
                break;
            }

            if ($ownerPassword !== $ownerPasswordConfirm) {
                http_response_code(400);
                echo json_encode(['error' => 'Password and confirm password do not match']);
                break;
            }

            $isEmail = filter_var($ownerLogin, FILTER_VALIDATE_EMAIL) !== false;
            $isPhone = preg_match('/^(09\d{9}|\+?\d{10,15})$/', $ownerLogin) === 1;
            if (!$isEmail && !$isPhone) {
                http_response_code(400);
                echo json_encode(['error' => 'Owner login must be a valid email or phone number']);
                break;
            }

            if (strlen($ownerPassword) < 6) {
                http_response_code(400);
                echo json_encode(['error' => 'Owner password must be at least 6 characters']);
                break;
            }

            $pdo = getDB();
            
            try {
                $pdo->beginTransaction();

                $dupStmt = $pdo->prepare("SELECT id FROM owners WHERE email = ? LIMIT 1");
                $dupStmt->execute([$ownerLogin]);
                if ($dupStmt->fetch()) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(['error' => 'Owner account already exists for this email/phone']);
                    break;
                }

                $ownerName = trim((string)($data['owner_name'] ?? ''));
                if ($ownerName === '') {
                    $ownerName = trim((string)$data['name']);
                }

                $ownerInsert = $pdo->prepare("INSERT INTO owners (name, email, password_hash) VALUES (?, ?, ?)");
                $ownerInsert->execute([$ownerName, $ownerLogin, password_hash($ownerPassword, PASSWORD_DEFAULT)]);
                $data['owner_id'] = (int)$pdo->lastInsertId();

                $success = addRestaurant($data);
                if (!$success) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to add restaurant']);
                    break;
                }

                $pdo->commit();
                echo json_encode(['success' => true, 'image_paths' => $imagePaths]);
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                error_log('Admin add restaurant error: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create owner account and restaurant']);
            }
            break;
            
        case 'delete':
            $id = $_GET['id'] ?? 0;
            if ($id > 0) {
                $success = deleteRestaurant($id);
                echo json_encode(['success' => $success]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid ID']);
            }
            break;
            
        case 'statistics':
            $pdo = getDB();
            
            // Total restaurants
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM restaurants");
            $totalRestaurants = $stmt->fetch()['total'];
            
            // Most popular restaurant (by visits)
            $stmt = $pdo->query("SELECT name FROM restaurants ORDER BY visit_count DESC LIMIT 1");
            $mostPopular = $stmt->fetch();
            $mostPopularName = $mostPopular ? $mostPopular['name'] : 'No data';

            // Highest rated restaurant (average rating)
            $stmt = $pdo->query(
                "SELECT r.name, AVG(rr.rating) as avg_rating, COUNT(rr.id) as review_count
                 FROM restaurants r
                 LEFT JOIN restaurant_ratings rr ON rr.restaurant_id = r.id
                 GROUP BY r.id
                 HAVING review_count > 0
                 ORDER BY avg_rating DESC, review_count DESC
                 LIMIT 1"
            );
            $highest = $stmt->fetch(PDO::FETCH_ASSOC);
            $highestName = $highest ? $highest['name'] . ' (' . number_format($highest['avg_rating'], 2) . '⭐' . ')' : 'No data';

            // Detailed restaurant statistics for table and chart
            $stmt = $pdo->query(
                "SELECT 
                    r.id,
                    r.name,
                    r.category,
                    r.visit_count,
                    COALESCE(AVG(rr.rating), 0) as avg_rating,
                    COUNT(rr.id) as review_count
                 FROM restaurants r
                 LEFT JOIN restaurant_ratings rr ON rr.restaurant_id = r.id
                 GROUP BY r.id, r.name, r.category, r.visit_count
                 ORDER BY r.name ASC"
            );
            $detailedStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all unique categories for filter
            $stmt = $pdo->query("SELECT DISTINCT category FROM restaurants WHERE category IS NOT NULL AND category != '' ORDER BY category");
            $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

            echo json_encode([
                'total_restaurants' => $totalRestaurants,
                'most_popular' => $mostPopularName,
                'highest_rated' => $highestName,
                'detailed_stats' => $detailedStats,
                'categories' => $categories
            ]);
            break;

        case 'top_reviews':
            // Return the highest rated individual reviews
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
            if ($limit <= 0 || $limit > 100) $limit = 5;

            $stmt = $pdo->prepare(
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
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Admin API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred: ' . $e->getMessage()]);
}
?>