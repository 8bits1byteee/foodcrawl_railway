<?php
require_once 'config.php';

function getAllRestaurants() {
    $pdo = getDB();
    if (!$pdo) {
        return [];
    }
    
    try {
        $stmt = $pdo->query("
            SELECT *, 
            COALESCE(image_paths, '[]') as image_paths,
            COALESCE(JSON_LENGTH(image_paths), 0) as image_count
            FROM restaurants 
            ORDER BY visit_count DESC, name ASC
        ");
        $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields for each restaurant
        foreach ($restaurants as &$restaurant) {
            $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
            // Maintain backward compatibility with single image_path
            if (empty($restaurant['image_path']) && !empty($restaurant['image_paths'][0])) {
                $restaurant['image_path'] = $restaurant['image_paths'][0];
            }
        }
        
        return $restaurants;
    } catch (Exception $e) {
        error_log("getAllRestaurants error: " . $e->getMessage());
        return [];
    }
}

function searchRestaurants($searchTerm) {
    $pdo = getDB();
    if (!$pdo) {
        return [];
    }
    
    try {
        $stmt = $pdo->prepare("SELECT *, COALESCE(image_paths, '[]') as image_paths FROM restaurants WHERE name LIKE ? OR description LIKE ? OR menu_items LIKE ? ORDER BY visit_count DESC");
        $likeTerm = "%$searchTerm%";
        $stmt->execute([$likeTerm, $likeTerm, $likeTerm]);
        $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON image paths
        foreach ($restaurants as &$restaurant) {
            $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
            // Maintain backward compatibility with single image_path
            if (empty($restaurant['image_path']) && !empty($restaurant['image_paths'][0])) {
                $restaurant['image_path'] = $restaurant['image_paths'][0];
            }
        }

        return $restaurants;
    } catch (Exception $e) {
        error_log("searchRestaurants error: " . $e->getMessage());
        return [];
    }
}

function getRestaurantById($id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT *, COALESCE(image_paths, '[]') as image_paths FROM restaurants WHERE id = ?");
    $stmt->execute([$id]);
    $restaurant = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($restaurant) {
        // Decode JSON image paths
        $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
        // Maintain backward compatibility
        if (empty($restaurant['image_path']) && !empty($restaurant['image_paths'][0])) {
            $restaurant['image_path'] = $restaurant['image_paths'][0];
        }
    }

    return $restaurant;
}

function incrementVisitCount($id) {
    $pdo = getDB();
    $stmt = $pdo->prepare("UPDATE restaurants SET visit_count = visit_count + 1 WHERE id = ?");
    return $stmt->execute([$id]);
}

function addRestaurant($data) {
    $pdo = getDB();

    // Handle image paths - encode as JSON array
    $imagePaths = [];
    if (isset($data['image_paths'])) {
        if (is_string($data['image_paths'])) {
            $imagePaths = json_decode($data['image_paths'], true) ?: [];
        } elseif (is_array($data['image_paths'])) {
            $imagePaths = $data['image_paths'];
        }
    }

    // Limit to 5 images
    $imagePaths = array_slice($imagePaths, 0, 5);
    $imagePathsJson = json_encode($imagePaths);

    // Updated INSERT statement - removed purok, barangay, town, province columns
    $stmt = $pdo->prepare("INSERT INTO restaurants (owner_id, name, description, address, latitude, longitude, phone, hours, menu_items, full_menu, image_path, logo, image_paths, menu_image, email, facebook_name, facebook_page, category, seating_capacity, reservation_needed, parking_availability, delivery_options, wifi_availability, accessibility, price_range, payment_methods) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    // Use first image as the main image_path for backward compatibility
    $mainImage = !empty($imagePaths) ? $imagePaths[0] : ($data['image_path'] ?? '');

    // Logo should be explicitly provided; do NOT default to main image to keep logo independent
    $logoPath = $data['logo'] ?? '';
    $email = $data['email'] ?? '';
    $facebook_name = $data['facebook_name'] ?? '';
    $facebook = $data['facebook_page'] ?? '';
    $menu_image = $data['menu_image'] ?? '';
    $category = $data['category'] ?? '';
    
    // Handle facilities and services fields

    $seatingCapacity = $data['seating_capacity'] ?? null;
    $reservationNeeded = $data['reservation_needed'] ?? null;
    $parkingAvailability = $data['parking_availability'] ?? null;
    $wifiAvailability = $data['wifi_availability'] ?? null;
    
    // Handle JSON arrays for delivery_options and accessibility
    $deliveryOptions = null;
    if (isset($data['delivery_options']) && is_array($data['delivery_options'])) {
        $deliveryOptions = json_encode(array_values($data['delivery_options']));
    }
    
    $accessibility = null;
    if (isset($data['accessibility']) && is_array($data['accessibility'])) {
        $accessibility = json_encode(array_values($data['accessibility']));
    }
    
    // Handle pricing and payment fields
    $priceRange = $data['price_range'] ?? null;
    
    $paymentMethods = null;
    if (isset($data['payment_methods']) && is_array($data['payment_methods'])) {
        $paymentMethods = json_encode(array_values($data['payment_methods']));
    }

    // Handle full_menu JSON
    $fullMenu = null;
    if (isset($data['full_menu']) && $data['full_menu'] !== '') {
        $fullMenu = $data['full_menu'];
    }

    try {
        $ok = $stmt->execute([
            $data['owner_id'] ?? null,
            $data['name'] ?? '',
            $data['description'] ?? '',
            $data['address'] ?? '',
            $data['latitude'] ?? 0,
            $data['longitude'] ?? 0,
            $data['phone'] ?? '',
            $data['hours'] ?? '',
            $data['menu_items'] ?? '',
            $fullMenu,
            $mainImage,
            $logoPath,
            $imagePathsJson,
            $menu_image,
            $email,
            $facebook_name,
            $facebook,
            $category,
            $seatingCapacity,
            $reservationNeeded,
            $parkingAvailability,
            $deliveryOptions,
            $wifiAvailability,
            $accessibility,
            $priceRange,
            $paymentMethods
        ]);
        if (!$ok) {
            $err = $stmt->errorInfo();
            error_log("addRestaurant failed: " . json_encode($err));
        }
        return $ok;
    } catch (PDOException $e) {
        error_log("addRestaurant exception: " . $e->getMessage());
        return false;
    }
}

function updateRestaurant($id, $data) {
    $pdo = getDB();

    // Fetch existing restaurant FIRST before using any references to it
    $existingRestaurant = getRestaurantById($id);
    if (!$existingRestaurant) {
        error_log("updateRestaurant: Restaurant with id {$id} not found");
        return false;
    }

    // Handle image paths - encode as JSON array
    $imagePaths = [];
    if (isset($data['image_paths'])) {
        if (is_string($data['image_paths'])) {
            $imagePaths = json_decode($data['image_paths'], true) ?: [];
        } elseif (is_array($data['image_paths'])) {
            $imagePaths = $data['image_paths'];
        }
    }

    // Limit to 5 images
    $imagePaths = array_slice($imagePaths, 0, 5);
    $imagePathsJson = json_encode($imagePaths);

    // Updated UPDATE statement - removed purok, barangay, town, province columns
    $stmt = $pdo->prepare("UPDATE restaurants SET name = ?, description = ?, address = ?, latitude = ?, longitude = ?, phone = ?, hours = ?, menu_items = ?, full_menu = ?, image_path = ?, logo = ?, image_paths = ?, menu_image = ?, email = ?, facebook_name = ?, facebook_page = ?, category = ?, seating_capacity = ?, reservation_needed = ?, parking_availability = ?, delivery_options = ?, wifi_availability = ?, accessibility = ?, price_range = ?, payment_methods = ? WHERE id = ?");

    // Use first image as the main image_path for backward compatibility
    $mainImage = !empty($imagePaths) ? $imagePaths[0] : ($data['image_path'] ?? '');

    // Preserve existing logo if not explicitly provided in $data.
    $existingLogo = $existingRestaurant['logo'] ?? '';
    $logoPath = isset($data['logo']) ? $data['logo'] : $existingLogo;
    $email = isset($data['email']) ? $data['email'] : ($existingRestaurant['email'] ?? '');
    $facebook_name = isset($data['facebook_name']) ? $data['facebook_name'] : ($existingRestaurant['facebook_name'] ?? '');
    $facebook = isset($data['facebook_page']) ? $data['facebook_page'] : ($existingRestaurant['facebook_page'] ?? '');
    $menu_image = isset($data['menu_image']) ? $data['menu_image'] : ($existingRestaurant['menu_image'] ?? '');
    $category = isset($data['category']) ? $data['category'] : ($existingRestaurant['category'] ?? '');
    
    // Handle facilities and services fields
    $seatingCapacity = isset($data['seating_capacity']) ? $data['seating_capacity'] : ($existingRestaurant['seating_capacity'] ?? null);
    $reservationNeeded = isset($data['reservation_needed']) ? $data['reservation_needed'] : ($existingRestaurant['reservation_needed'] ?? null);
    $parkingAvailability = isset($data['parking_availability']) ? $data['parking_availability'] : ($existingRestaurant['parking_availability'] ?? null);
    $wifiAvailability = isset($data['wifi_availability']) ? $data['wifi_availability'] : ($existingRestaurant['wifi_availability'] ?? null);
    
    // Handle JSON arrays for delivery_options and accessibility
    $deliveryOptions = null;
    if (isset($data['delivery_options']) && is_array($data['delivery_options'])) {
        $deliveryOptions = json_encode(array_values($data['delivery_options']));
    } elseif (isset($existingRestaurant['delivery_options'])) {
        $deliveryOptions = $existingRestaurant['delivery_options'];
    }
    
    $accessibility = null;
    if (isset($data['accessibility']) && is_array($data['accessibility'])) {
        $accessibility = json_encode(array_values($data['accessibility']));
    } elseif (isset($existingRestaurant['accessibility'])) {
        $accessibility = $existingRestaurant['accessibility'];
    }
    
    // Handle pricing and payment fields
    // Explicitly check for empty string and convert to null, OR use provided value, OR preserve existing
    if (array_key_exists('price_range', $data)) {
        // If explicitly provided (even if empty string), use it (convert empty to null)
        $priceRange = ($data['price_range'] === '' || $data['price_range'] === null) ? null : $data['price_range'];
    } else {
        // Not provided at all, preserve existing
        $priceRange = $existingRestaurant['price_range'] ?? null;
    }
    error_log("updateRestaurant - priceRange to save: " . ($priceRange ?? 'NULL'));
    
    $paymentMethods = null;
    if (isset($data['payment_methods']) && is_array($data['payment_methods'])) {
        // If array is empty, set to null; otherwise encode
        $paymentMethods = empty($data['payment_methods']) ? null : json_encode(array_values($data['payment_methods']));
        error_log("updateRestaurant - paymentMethods to save (JSON): " . ($paymentMethods ?? 'NULL'));
    } elseif (isset($existingRestaurant['payment_methods'])) {
        $paymentMethods = $existingRestaurant['payment_methods'];
        error_log("updateRestaurant - paymentMethods preserved from existing: " . ($paymentMethods ?? 'NULL'));
    }

    // Handle full_menu JSON
    $fullMenu = null;
    if (array_key_exists('full_menu', $data)) {
        $fullMenu = ($data['full_menu'] === '' || $data['full_menu'] === null) ? null : $data['full_menu'];
    } elseif (isset($existingRestaurant['full_menu'])) {
        $fullMenu = $existingRestaurant['full_menu'];
    }

    try {
        error_log("updateRestaurant - About to execute with priceRange: " . var_export($priceRange, true) . " and paymentMethods: " . var_export($paymentMethods, true));
        $ok = $stmt->execute([
            $data['name'] ?? '',
            $data['description'] ?? '',
            $data['address'] ?? '',
            $data['latitude'] ?? 0,
            $data['longitude'] ?? 0,
            $data['phone'] ?? '',
            $data['hours'] ?? '',
            $data['menu_items'] ?? '',
            $fullMenu,
            $mainImage,
            $logoPath,
            $imagePathsJson,
            $menu_image,
            $email,
            $facebook_name,
            $facebook,
            $category,
            $seatingCapacity,
            $reservationNeeded,
            $parkingAvailability,
            $deliveryOptions,
            $wifiAvailability,
            $accessibility,
            $priceRange,
            $paymentMethods,
            $id
        ]);
        if (!$ok) {
            $err = $stmt->errorInfo();
            error_log("updateRestaurant failed: " . json_encode($err));
        }
        return $ok;
    } catch (PDOException $e) {
        error_log("updateRestaurant exception: " . $e->getMessage());
        return false;
    }
}

function deleteRestaurant($id) {
    $pdo = getDB();
    $appRoot = dirname(__DIR__); // project root (one level up from includes/)

    // Get restaurant data to delete image files
    $restaurant = getRestaurantById($id);
    if ($restaurant) {
        // Collect all file paths to delete: gallery images, logo, menu image
        $filesToDelete = $restaurant['image_paths'] ?? [];
        if (!empty($restaurant['logo']))       $filesToDelete[] = $restaurant['logo'];
        if (!empty($restaurant['menu_image'])) $filesToDelete[] = $restaurant['menu_image'];

        foreach ($filesToDelete as $imagePath) {
            if (empty($imagePath)) continue;
            // Resolve relative paths (e.g. "images/restaurants/...") to absolute
            $absPath = (strpos($imagePath, DIRECTORY_SEPARATOR) === 0 || (strlen($imagePath) > 1 && $imagePath[1] === ':'))
                ? $imagePath
                : $appRoot . DIRECTORY_SEPARATOR . ltrim($imagePath, '/\\');
            if (is_file($absPath)) {
                unlink($absPath);
            }
        }
    }
    
    $stmt = $pdo->prepare("DELETE FROM restaurants WHERE id = ?");
    return $stmt->execute([$id]);
}

function saveSearchTerm($term) {
    $pdo = getDB();
    
    if (empty($term)) return false;
    
    // Check if search term exists
    $stmt = $pdo->prepare("SELECT id, search_count FROM searches WHERE search_term = ?");
    $stmt->execute([$term]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update count
        $stmt = $pdo->prepare("UPDATE searches SET search_count = search_count + 1 WHERE id = ?");
        return $stmt->execute([$existing['id']]);
    } else {
        // Insert new
        $stmt = $pdo->prepare("INSERT INTO searches (search_term) VALUES (?)");
        return $stmt->execute([$term]);
    }
}

function getRecommendations($limit = 5) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT *, 
        COALESCE(image_paths, '[]') as image_paths
        FROM restaurants 
        ORDER BY visit_count DESC 
        LIMIT ?
    ");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode JSON image paths
    foreach ($restaurants as &$restaurant) {
        $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
    }
    
    return $restaurants;
}

// Add restaurant rating
function addRestaurantRating($restaurantId, $rating, $reviewerName, $comment, $profilePicture = null) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO restaurant_ratings (restaurant_id, rating, reviewer_name, comment, profile_picture, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([$restaurantId, $rating, $reviewerName, $comment, $profilePicture]);
    } catch (PDOException $e) {
        error_log("Error adding rating: " . $e->getMessage());
        return false;
    }
}

// Get restaurant ratings
function getRestaurantRatings($restaurantId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, restaurant_id, rating, reviewer_name, comment, profile_picture, created_at
            FROM restaurant_ratings
            WHERE restaurant_id = ?
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$restaurantId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error getting ratings: " . $e->getMessage());
        return [];
    }
}
?>