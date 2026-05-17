<?php
require_once 'config.php';

function isOwnerLoggedIn() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return isset($_SESSION['owner_logged_in']) && $_SESSION['owner_logged_in'] === true;
}

function ownerLogin($email, $password) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM owners WHERE email = ?");
        $stmt->execute([$email]);
        $owner = $stmt->fetch();
        
        if ($owner && password_verify($password, $owner['password_hash'])) {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['owner_logged_in'] = true;
            $_SESSION['owner_id'] = $owner['id'];
            $_SESSION['owner_name'] = $owner['name'];
            $_SESSION['owner_email'] = $owner['email'];
            return true;
        }
    } catch (Exception $e) {
        error_log("Owner login error: " . $e->getMessage());
    }
    
    return false;
}

function ownerLogout() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}

function getOwnerRestaurants($ownerId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT *, 
        COALESCE(image_paths, '[]') as image_paths
        FROM restaurants 
        WHERE owner_id = ?
        ORDER BY name ASC
    ");
    $stmt->execute([$ownerId]);
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($restaurants as &$restaurant) {
        $restaurant['image_paths'] = json_decode($restaurant['image_paths'] ?? '[]', true) ?: [];
        if (empty($restaurant['image_path']) && !empty($restaurant['image_paths'][0])) {
            $restaurant['image_path'] = $restaurant['image_paths'][0];
        }
    }
    
    return $restaurants;
}

function submitRestaurantChange($restaurantId, $ownerId, $changesJson) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO restaurant_changes (restaurant_id, owner_id, changes_json, status)
            VALUES (?, ?, ?, 'pending')
        ");
        return $stmt->execute([$restaurantId, $ownerId, $changesJson]);
    } catch (PDOException $e) {
        error_log("Error submitting change: " . $e->getMessage());
        return false;
    }
}

function getOwnerNotifications($ownerId, $unreadOnly = false) {
    $pdo = getDB();
    
    try {
        $sql = "SELECT * FROM owner_notifications WHERE owner_id = ?";
        if ($unreadOnly) {
            $sql .= " AND is_read = 0";
        }
        $sql .= " ORDER BY created_at DESC LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$ownerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error getting notifications: " . $e->getMessage());
        return [];
    }
}

function getUnreadNotificationCount($ownerId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM owner_notifications WHERE owner_id = ? AND is_read = 0");
        $stmt->execute([$ownerId]);
        $result = $stmt->fetch();
        return $result['count'] ?? 0;
    } catch (PDOException $e) {
        return 0;
    }
}

function markNotificationRead($notifId, $ownerId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("UPDATE owner_notifications SET is_read = 1 WHERE id = ? AND owner_id = ?");
        return $stmt->execute([$notifId, $ownerId]);
    } catch (PDOException $e) {
        return false;
    }
}

function markAllNotificationsRead($ownerId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("UPDATE owner_notifications SET is_read = 1 WHERE owner_id = ? AND is_read = 0");
        return $stmt->execute([$ownerId]);
    } catch (PDOException $e) {
        return false;
    }
}

function getPendingChangesForRestaurant($restaurantId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM restaurant_changes 
            WHERE restaurant_id = ? AND status = 'pending'
            ORDER BY created_at DESC
        ");
        $stmt->execute([$restaurantId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

function getOwnerChangeHistory($ownerId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT rc.*, r.name as restaurant_name 
            FROM restaurant_changes rc
            JOIN restaurants r ON rc.restaurant_id = r.id
            WHERE rc.owner_id = ?
            ORDER BY rc.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$ownerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}
?>
