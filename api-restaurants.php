<?php
require_once __DIR__ . '/includes/config.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use GET.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function parseJsonValue($value, $fallback)
{
    if ($value === null || $value === '') {
        return $fallback;
    }

    if (is_array($value)) {
        return $value;
    }

    if (!is_string($value)) {
        return $fallback;
    }

    $decoded = json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : $fallback;
}

function parseCsvList($value): array
{
    if ($value === null || trim((string)$value) === '') {
        return [];
    }

    $parts = array_map('trim', explode(',', (string)$value));
    return array_values(array_filter($parts, static fn($item) => $item !== ''));
}

function getChatbotRestaurantStatus($hoursValue): array
{
    if ($hoursValue === null || $hoursValue === '') {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    $hours = parseJsonValue($hoursValue, []);
    if (!is_array($hours) || $hours === []) {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    $dayName = date('l');
    $today = $hours[$dayName] ?? null;
    if (!is_array($today)) {
        return ['is_open' => false, 'message' => 'Closed today'];
    }

    if (!empty($today['closed'])) {
        return ['is_open' => false, 'message' => 'Closed today'];
    }

    $open = isset($today['open']) ? trim((string)$today['open']) : '';
    $close = isset($today['close']) ? trim((string)$today['close']) : '';
    if ($open === '' || $close === '') {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    [$openHour, $openMinute] = array_map('intval', array_pad(explode(':', $open), 2, 0));
    [$closeHour, $closeMinute] = array_map('intval', array_pad(explode(':', $close), 2, 0));

    $currentMinutes = ((int)date('G') * 60) + (int)date('i');
    $openMinutes = ($openHour * 60) + $openMinute;
    $closeMinutes = ($closeHour * 60) + $closeMinute;

    if ($closeMinutes < $openMinutes) {
        $isOpen = $currentMinutes >= $openMinutes || $currentMinutes < $closeMinutes;
    } else {
        $isOpen = $currentMinutes >= $openMinutes && $currentMinutes < $closeMinutes;
    }

    return [
        'is_open' => $isOpen,
        'message' => $isOpen ? 'Open' : 'Closed'
    ];
}

function normalizeRestaurantRow(array $row): array
{
    $hours = parseJsonValue($row['hours'] ?? null, []);
    $galleryImages = parseJsonValue($row['image_paths'] ?? '[]', []);
    $menuImages = parseJsonValue($row['menu_image'] ?? '[]', []);
    $deliveryOptions = parseJsonValue($row['delivery_options'] ?? null, []);
    $accessibility = parseJsonValue($row['accessibility'] ?? null, []);
    $paymentMethods = parseJsonValue($row['payment_methods'] ?? null, []);
    $fullMenu = parseJsonValue($row['full_menu'] ?? null, []);
    $status = getChatbotRestaurantStatus($row['hours'] ?? null);
    $ratingCount = (int)($row['rating_count'] ?? 0);
    $averageRating = $ratingCount > 0 ? (float)$row['average_rating'] : null;

    if (!is_array($galleryImages)) {
        $galleryImages = [];
    }
    if (!is_array($menuImages)) {
        $menuImages = [];
    }
    if (!is_array($deliveryOptions)) {
        $deliveryOptions = [];
    }
    if (!is_array($accessibility)) {
        $accessibility = [];
    }
    if (!is_array($paymentMethods)) {
        $paymentMethods = [];
    }
    if (!is_array($fullMenu)) {
        $fullMenu = [];
    }
    if (!is_array($hours)) {
        $hours = [];
    }

    return [
        'id' => (int)$row['id'],
        'name' => (string)($row['name'] ?? ''),
        'description' => (string)($row['description'] ?? ''),
        'category' => (string)($row['category'] ?? ''),
        'address' => (string)($row['address'] ?? ''),
        'coordinates' => [
            'latitude' => isset($row['latitude']) ? (float)$row['latitude'] : null,
            'longitude' => isset($row['longitude']) ? (float)$row['longitude'] : null,
        ],
        'contact' => [
            'phone' => (string)($row['phone'] ?? ''),
            'email' => (string)($row['email'] ?? ''),
            'facebook_name' => (string)($row['facebook_name'] ?? ''),
            'facebook_page' => (string)($row['facebook_page'] ?? ''),
        ],
        'hours' => $hours,
        'status' => $status,
        'menu' => [
            'best_sellers' => parseCsvList($row['menu_items'] ?? ''),
            'full_menu' => $fullMenu,
            'menu_images' => $menuImages,
        ],
        'ratings' => [
            'average' => $averageRating,
            'count' => $ratingCount,
        ],
        'facilities' => [
            'seating_capacity' => $row['seating_capacity'] ?? null,
            'reservation_needed' => $row['reservation_needed'] ?? null,
            'parking_availability' => $row['parking_availability'] ?? null,
            'wifi_availability' => $row['wifi_availability'] ?? null,
            'delivery_options' => $deliveryOptions,
            'accessibility' => $accessibility,
            'payment_methods' => $paymentMethods,
            'price_range' => $row['price_range'] ?? null,
        ],
        'media' => [
            'logo' => $row['logo'] ?? null,
            'primary_image' => $row['image_path'] ?? null,
            'gallery_images' => $galleryImages,
        ],
        'visit_count' => (int)($row['visit_count'] ?? 0),
        'created_at' => $row['created_at'] ?? null,
    ];
}

try {
    $pdo = getDB();
    $search = trim((string)($_GET['q'] ?? ''));
    $restaurantId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    if ($limit < 1) {
        $limit = 1;
    }
    if ($limit > 500) {
        $limit = 500;
    }

    $sql = "SELECT r.*, ROUND(AVG(rr.rating), 2) AS average_rating, COUNT(rr.id) AS rating_count
            FROM restaurants r
            LEFT JOIN restaurant_ratings rr ON rr.restaurant_id = r.id";

    $conditions = [];
    $params = [];

    if ($restaurantId > 0) {
        $conditions[] = 'r.id = ?';
        $params[] = $restaurantId;
    }

    if ($search !== '') {
        $conditions[] = '(r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ? OR r.category LIKE ? OR r.menu_items LIKE ?)';
        $searchTerm = '%' . $search . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if ($conditions !== []) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }

    $sql .= ' GROUP BY r.id ORDER BY r.name ASC LIMIT ' . $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $restaurants = array_map('normalizeRestaurantRow', $rows);

    echo json_encode([
        'success' => true,
        'endpoint' => 'api-restaurants.php',
        'generated_at' => date(DATE_ATOM),
        'timezone' => date_default_timezone_get(),
        'filters' => [
            'id' => $restaurantId > 0 ? $restaurantId : null,
            'q' => $search !== '' ? $search : null,
            'limit' => $limit,
        ],
        'count' => count($restaurants),
        'restaurants' => $restaurants,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('api-restaurants.php error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Server error occurred'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
?>