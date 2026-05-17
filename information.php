<?php
session_start();

require_once 'includes/config.php';

$pdo = getDB();
$restaurants = [];
$error = null;
$userLat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
$userLng = isset($_GET['lng']) ? (float)$_GET['lng'] : null;
$serverRendered = false;
$userLocationAddress = '';

function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadiusKm = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadiusKm * $c;
}

function reverseGeocode($lat, $lng) {
    $url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" . urlencode($lat) . "&lon=" . urlencode($lng);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);
    
    if ($response === false) {
        return 'Address unavailable';
    }
    
    $data = json_decode($response, true);
    if (!$data || !isset($data['address'])) {
        return 'Address unavailable';
    }
    
    $address = $data['address'];
    $barangay = $address['barangay'] ?? $address['suburb'] ?? $address['village'] ?? 
                $address['neighbourhood'] ?? $address['hamlet'] ?? $address['quarter'] ?? '';
    $town = $address['town'] ?? $address['city'] ?? $address['municipality'] ?? 
            $address['city_district'] ?? '';
    $province = $address['province'] ?? $address['state'] ?? $address['region'] ?? '';
    
    $parts = array_filter(array_map('trim', [$barangay, $town, $province]));
    $uniqueParts = [];
    foreach ($parts as $part) {
        $exists = false;
        foreach ($uniqueParts as $existing) {
            if (strcasecmp($existing, $part) === 0) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $uniqueParts[] = $part;
        }
    }
    
    return !empty($uniqueParts) ? implode(' ', $uniqueParts) : 'Address unavailable';
}

try {
    $stmt = $pdo->query(
        "SELECT r.*, ROUND(AVG(rr.rating), 2) AS average_rating, COUNT(rr.id) AS rating_count
         FROM restaurants r
         LEFT JOIN restaurant_ratings rr ON rr.restaurant_id = r.id
         GROUP BY r.id
            ORDER BY r.name ASC"
    );
    $restaurants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Server-side rendering if URL params provided
    if ($userLat !== null && $userLng !== null && is_numeric($userLat) && is_numeric($userLng)) {
        $serverRendered = true;
        $userLocationAddress = reverseGeocode($userLat, $userLng);
        
        foreach ($restaurants as &$restaurant) {
            $ratingCount = (int)($restaurant['rating_count'] ?? 0);
            $averageRating = (float)($restaurant['average_rating'] ?? 0);
            $restaurant['ratings'] = $ratingCount > 0
                ? sprintf('%.2f', $averageRating)
                : 'No ratings';
            $restaurant['ratings_reviews_display'] = formatRatingsReviewsDisplay($ratingCount, $averageRating);
            $restaurant['status_display'] = isRestaurantOpenPHP($restaurant['hours'] ?? null);
            
            $restLat = (float)($restaurant['latitude'] ?? 0);
            $restLng = (float)($restaurant['longitude'] ?? 0);
            
            if ($restLat && $restLng) {
                $distance = calculateDistance($userLat, $userLng, $restLat, $restLng);
                $restaurant['distance'] = number_format($distance, 2) . ' km';
                $restaurant['distance_value'] = $distance;
            } else {
                $restaurant['distance'] = '';
                $restaurant['distance_value'] = INF;
            }
            
            $restaurant['user_location'] = $userLocationAddress;
        }
        unset($restaurant);

    } else {
        foreach ($restaurants as &$restaurant) {
            $ratingCount = (int)($restaurant['rating_count'] ?? 0);
            $averageRating = (float)($restaurant['average_rating'] ?? 0);
            $restaurant['ratings'] = $ratingCount > 0
                ? sprintf('%.2f', $averageRating)
                : 'No ratings';
            $restaurant['ratings_reviews_display'] = formatRatingsReviewsDisplay($ratingCount, $averageRating);
            $restaurant['status_display'] = isRestaurantOpenPHP($restaurant['hours'] ?? null);
            $restaurant['distance'] = '';
            $restaurant['user_location'] = '';
        }
        unset($restaurant);
    }
} catch (Throwable $e) {
    $error = $e->getMessage();
}

function escapeCell($value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function isListArray(array $value): bool
{
    if ($value === []) {
        return true;
    }

    return array_keys($value) === range(0, count($value) - 1);
}

function formatDecodedArray(array $decoded): string
{
    if ($decoded === []) {
        return '<span class="muted">—</span>';
    }

    if (isListArray($decoded)) {
        $items = array_map(static function ($item) {
            if (is_array($item)) {
                return trim(str_replace(["\n", "\r"], ' ', json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''));
            }

            return (string)$item;
        }, $decoded);

        return escapeCell(implode(', ', array_filter($items, static fn($item) => $item !== '')));
    }

    $dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    $hasDayKeys = false;
    foreach ($dayOrder as $dayName) {
        if (array_key_exists($dayName, $decoded)) {
            $hasDayKeys = true;
            break;
        }
    }

    $lines = [];

    if ($hasDayKeys) {
        foreach ($dayOrder as $dayName) {
            if (!array_key_exists($dayName, $decoded)) {
                continue;
            }

            $entry = $decoded[$dayName];
            if (is_array($entry)) {
                $isClosed = !empty($entry['closed']);
                $open = isset($entry['open']) ? (string)$entry['open'] : '';
                $close = isset($entry['close']) ? (string)$entry['close'] : '';
                $value = $isClosed ? 'Closed' : (($open !== '' && $close !== '') ? ($open . ' - ' . $close) : '—');
                $lines[] = $dayName . ': ' . $value;
            } else {
                $lines[] = $dayName . ': ' . (string)$entry;
            }
        }
    } else {
        foreach ($decoded as $key => $entry) {
            if (is_array($entry)) {
                $entryText = trim(str_replace(["\n", "\r"], ' ', json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''));
            } else {
                $entryText = (string)$entry;
            }
            $lines[] = $key . ': ' . $entryText;
        }
    }

    return nl2br(escapeCell(implode("\n", $lines)));
}

function formatCellValue($value): string
{
    if ($value === null || $value === '') {
        return '<span class="muted">—</span>';
    }

    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed !== '' && ($trimmed[0] === '{' || $trimmed[0] === '[')) {
            $decoded = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                if (is_array($decoded)) {
                    return formatDecodedArray($decoded);
                }
                return escapeCell((string)$decoded);
            }
        }
    }

    return escapeCell($value);
}

function formatRatingsReviewsDisplay(int $ratingCount, float $averageRating): string
{
    if ($ratingCount <= 0) {
        return 'No ratings (0 reviews)';
    }

    $reviewLabel = $ratingCount === 1 ? 'review' : 'reviews';
    return sprintf('%.2f (%d %s)', $averageRating, $ratingCount, $reviewLabel);
}

function normalizeMenuItems($raw): array
{
    if ($raw === null || $raw === '') {
        return [];
    }

    $decoded = null;

    if (is_string($raw)) {
        $trimmed = trim($raw);
        if ($trimmed !== '' && ($trimmed[0] === '{' || $trimmed[0] === '[')) {
            $decoded = json_decode($trimmed, true);
        }

        if (!is_array($decoded)) {
            $parts = array_map('trim', explode(',', $trimmed));
            return array_values(array_filter($parts, static fn($item) => $item !== ''));
        }
    } elseif (is_array($raw)) {
        $decoded = $raw;
    }

    if (!is_array($decoded)) {
        return [];
    }

    $items = [];
    foreach ($decoded as $item) {
        $name = '';
        $price = '';

        if (is_array($item)) {
            $name = trim((string)($item['name'] ?? $item['item'] ?? ''));
            if (isset($item['price']) && $item['price'] !== '') {
                $price = number_format((float)$item['price'], 2);
            }
        } else {
            $name = trim((string)$item);
        }

        if ($name !== '') {
            $items[] = $price !== '' ? $name . ' — ' . $price : $name;
        }
    }

    return $items;
}

function buildCombinedMenu($fullMenuRaw, $bestSellerRaw): string
{
    $items = array_merge(
        normalizeMenuItems($fullMenuRaw),
        normalizeMenuItems($bestSellerRaw)
    );

    if ($items === []) {
        return '<span class="muted">—</span>';
    }

    $unique = [];
    foreach ($items as $item) {
        $key = strtolower($item);
        if (!array_key_exists($key, $unique)) {
            $unique[$key] = $item;
        }
    }

    return escapeCell(implode(', ', array_values($unique)));
}

function buildMenuOnly($fullMenuRaw): string
{
    $items = normalizeMenuItems($fullMenuRaw);

    if ($items === []) {
        return '<span class="muted">—</span>';
    }

    return escapeCell(implode(', ', $items));
}

function buildMenuWithBestSellerLabels($fullMenuRaw, $bestSellerRaw): string
{
    $menuItems = normalizeMenuItems($fullMenuRaw);
    $bestItems = normalizeMenuItems($bestSellerRaw);

    if ($menuItems === [] && $bestItems === []) {
        return '<span class="muted">—</span>';
    }

    $bestLookup = [];
    foreach ($bestItems as $item) {
        $key = strtolower($item);
        $bestLookup[$key] = true;
    }

    $combined = [];
    foreach (array_merge($menuItems, $bestItems) as $item) {
        $key = strtolower($item);
        if (array_key_exists($key, $combined)) {
            continue;
        }
        $combined[$key] = array_key_exists($key, $bestLookup)
            ? $item . ' (Best Seller)'
            : $item;
    }

    return escapeCell(implode(', ', array_values($combined)));
}

function buildBestSellerList($bestSellerRaw): string
{
    $items = normalizeMenuItems($bestSellerRaw);

    if ($items === []) {
        return '<span class="muted">—</span>';
    }

    return escapeCell(implode(', ', $items));
}

/**
 * Determine if a restaurant is currently open based on `hours` JSON.
 * Returns array: ['is_open' => true|false|null, 'message' => string]
 */
function isRestaurantOpenPHP($hoursString): array
{
    if ($hoursString === null || $hoursString === '') {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    if (is_string($hoursString)) {
        $decoded = json_decode($hoursString, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['is_open' => null, 'message' => 'Hours not available'];
        }
    } elseif (is_array($hoursString)) {
        $decoded = $hoursString;
    } else {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    if (!is_array($decoded) || empty($decoded)) {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    $dayName = date('l'); // e.g., Monday
    $now = new DateTime('now');
    $currentMinutes = (int)$now->format('G') * 60 + (int)$now->format('i');

    $today = $decoded[$dayName] ?? null;
    if (!$today) {
        return ['is_open' => false, 'message' => 'Closed today'];
    }

    if (!empty($today['closed'])) {
        return ['is_open' => false, 'message' => 'Closed today'];
    }

    $open = $today['open'] ?? null;
    $close = $today['close'] ?? null;
    if (!$open || !$close) {
        return ['is_open' => null, 'message' => 'Hours not available'];
    }

    // parse HH:MM
    [$oh, $om] = array_map('intval', array_pad(explode(':', $open), 2, 0));
    [$ch, $cm] = array_map('intval', array_pad(explode(':', $close), 2, 0));
    $openMinutes = $oh * 60 + $om;
    $closeMinutes = $ch * 60 + $cm;

    // Overnight handling
    if ($closeMinutes < $openMinutes) {
        if ($currentMinutes >= $openMinutes || $currentMinutes < $closeMinutes) {
            return ['is_open' => true, 'message' => 'Open'];
        }
    } else {
        if ($currentMinutes >= $openMinutes && $currentMinutes < $closeMinutes) {
            return ['is_open' => true, 'message' => 'Open'];
        }
    }

    return ['is_open' => false, 'message' => 'Closed'];
}

$excludedColumns = [
    'id',
    'owner_id',
    'average_rating',
    'rating_count',
    'ratings',
    'ratings_reviews_display',
    'status',
    'status_display',
    'distance',
    'distance_value',
    'user_location',
    'image_path',
    'logo',
    'category_color',
    'visit_count',
    'created_at',
    'image_paths',
    'menu_image'
];

$columns = !empty($restaurants)
    ? array_values(array_filter(
        array_keys($restaurants[0]),
        static fn($column) => !in_array($column, $excludedColumns, true) && $column !== 'full_menu' && $column !== 'menu_items'
    ))
    : [];

function getColumnDisplayName($column): string
{
    $displayNames = [
        'menu_items' => 'best_seller',
        'user_location' => 'user_location_address',
        'facebook_page' => 'facebook_url',
        'reservation_needed' => 'reservation',
        'parking_availability' => 'parking',
        'wifi_availability' => 'wifi'
    ];

    return $displayNames[$column] ?? $column;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurants Information</title>
    <style>
        :root {
            color-scheme: light;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f7f8fb;
            color: #1f2937;
        }

        .container {
            max-width: 96vw;
            margin: 18px auto;
            padding: 0 12px;
        }

        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
            gap: 10px;
            flex-wrap: wrap;
        }

        h1 {
            margin: 0;
            font-size: 22px;
        }

        .meta {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
        }

        .actions a {
            text-decoration: none;
            background: #e5e7eb;
            color: #111827;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            display: inline-block;
        }

        .actions a:hover {
            background: #d1d5db;
        }

        .table-wrap {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow-x: auto;
            overflow-y: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            max-height: calc(100vh - 120px);
        }

        table {
            border-collapse: collapse;
            min-width: 100%;
            width: max-content;
        }

        th,
        td {
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #f1f5f9;
            padding: 10px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
            line-height: 1.35;
            min-width: 120px;
            white-space: nowrap;
        }

        th {
            position: sticky;
            top: 0;
            z-index: 1;
            background: #f8fafc;
            font-weight: 700;
            text-transform: none;
            color: #111827;
        }

        tr:nth-child(even) td {
            background: #fcfdff;
        }

        .muted {
            color: #9ca3af;
        }

        .error {
            color: #b91c1c;
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 10px 12px;
            border-radius: 8px;
        }

        .loading-overlay {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            flex-direction: column;
            gap: 20px;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            color: #6b7280;
            font-size: 14px;
        }

        .table-wrap.hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="topbar">
            <div>
                <h1>All Restaurants Information</h1>
                <div class="meta">Total records: <?php echo count($restaurants); ?></div>
            </div>
            <div class="actions">
                <a href="admin.php">Back to Admin</a>
                <button id="exportCsvBtn" style="margin-left:8px;">Print CSV</button>
            </div>
        </div>

        <?php if ($error): ?>
            <div class="error">Failed to load restaurant data: <?php echo escapeCell($error); ?></div>
        <?php elseif (empty($restaurants)): ?>
            <div class="error" style="color:#1f2937;background:#f9fafb;border-color:#e5e7eb;">No restaurant records found.</div>
        <?php else: ?>
            <div class="table-wrap" id="tableWrap">
                <table id="restaurantsTable">
                    <thead>
                        <tr>
                            <?php foreach ($columns as $column): ?>
                                    <th><?php echo escapeCell(getColumnDisplayName($column)); ?></th>
                                <?php endforeach; ?>
                                <th>Menu</th>
                                <th data-export-ignore="true">Ratings &amp; Reviews</th>
                                <th data-export-ignore="true">Status</th>
                        </tr>
                    </thead>
                    <tbody id="restaurantsTableBody">
                        <?php foreach ($restaurants as $rowIndex => $row): ?>
                            <tr data-row-index="<?php echo (int)$rowIndex; ?>" data-latitude="<?php echo escapeCell($row['latitude'] ?? ''); ?>" data-longitude="<?php echo escapeCell($row['longitude'] ?? ''); ?>" data-distance-value="Infinity">
                                    <?php foreach ($columns as $column): ?>
                                        <?php
                                            $cellClass = '';
                                            if ($column === 'distance') {
                                                $cellClass = 'distance-cell';
                                            } elseif ($column === 'user_location') {
                                                $cellClass = 'user-location-cell';
                                            }
                                        ?>
                                        <td class="<?php echo $cellClass; ?>" data-column="<?php echo escapeCell($column); ?>">
                                            <?php echo formatCellValue($row[$column] ?? null); ?>
                                        </td>
                                    <?php endforeach; ?>
                                    <td data-column="menu"><?php echo buildMenuWithBestSellerLabels($row['full_menu'] ?? null, $row['menu_items'] ?? null); ?></td>
                                    <td data-export-ignore="true"><?php echo escapeCell($row['ratings_reviews_display'] ?? 'No ratings (0 reviews)'); ?></td>
                                    <td data-export-ignore="true">
                                        <?php
                                            $statusData = $row['status_display'] ?? ['is_open' => null, 'message' => 'Hours not available'];
                                            $statusMessage = $statusData['message'] ?? 'Hours not available';
                                            echo escapeCell($statusMessage);
                                        ?>
                                    </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
    <script>
        (function () {
            const serverRendered = <?php echo $serverRendered ? 'true' : 'false'; ?>;
            const STORAGE_KEY = 'information_restaurants_table_v1';
            const LOCATION_KEY = 'user_location_coords_v1';
            
            const tableBody = document.getElementById('restaurantsTableBody');
            if (!tableBody) {
                return;
            }

            // If server already rendered everything, just save and exit
            if (serverRendered) {
                saveTableToLocalStorage({ 
                    stage: 'complete', 
                    serverRendered: true,
                    userLatitude: <?php echo $userLat ?? 'null'; ?>,
                    userLongitude: <?php echo $userLng ?? 'null'; ?>,
                    userLocationAddress: <?php echo json_encode($userLocationAddress); ?>
                });
                return;
            }

            const saveTableToLocalStorage = (meta = {}) => {
                try {
                    const table = document.getElementById('restaurantsTable');
                    if (!table) return;

                    const headerCells = Array.from(table.querySelectorAll('thead th'));
                    const columns = headerCells.map((th) => (th.textContent || '').trim());

                    const rowElements = Array.from(tableBody.querySelectorAll('tr'));
                    const rowsData = rowElements.map((row) => {
                        const cells = Array.from(row.querySelectorAll('td'));
                        const values = cells.map((td) => (td.textContent || '').trim());
                        return {
                            latitude: row.dataset.latitude || '',
                            longitude: row.dataset.longitude || '',
                            distanceValue: row.dataset.distanceValue || 'Infinity',
                            values
                        };
                    });

                    const payload = {
                        savedAt: new Date().toISOString(),
                        columns,
                        rows: rowsData,
                        meta
                    };

                    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                } catch (e) {
                    // ignore quota/security errors
                }
            };

            const rows = Array.from(tableBody.querySelectorAll('tr'));
            if (rows.length === 0) {
                return;
            }

            const hasDistanceColumn = rows.some((row) => row.querySelector('td[data-column="distance"]'));
            const hasUserLocationColumn = rows.some((row) => row.querySelector('td[data-column="user_location"]'));

            // Save immediately (base server-rendered data)
            saveTableToLocalStorage({ stage: 'initial' });

            const toRadians = (degrees) => degrees * (Math.PI / 180);
            const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
                const earthRadiusKm = 6371;
                const dLat = toRadians(lat2 - lat1);
                const dLon = toRadians(lon2 - lon1);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
                    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return earthRadiusKm * c;
            };

            const setUserAddressForAllRows = (addressText) => {
                rows.forEach((row) => {
                    const userLocationCell = row.querySelector('.user-location-cell');
                    if (userLocationCell) {
                        userLocationCell.textContent = addressText;
                    }
                });

                saveTableToLocalStorage({ stage: 'user_location', userLocationAddress: addressText });
                
                // Show table now that all information is complete
                showTable();
            };

            const showTable = () => {
                const loadingOverlay = document.getElementById('loadingOverlay');
                const tableWrap = document.getElementById('tableWrap');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                if (tableWrap) {
                    tableWrap.classList.remove('hidden');
                }
            };

            if (!hasDistanceColumn && !hasUserLocationColumn) {
                showTable();
                saveTableToLocalStorage({ stage: 'complete', locationColumns: false });
                return;
            }

            const saveUserLocationToStorage = (lat, lng) => {
                try {
                    localStorage.setItem(LOCATION_KEY, JSON.stringify({
                        latitude: lat,
                        longitude: lng,
                        savedAt: new Date().toISOString()
                    }));
                } catch (e) {
                    // ignore
                }
            };

            const getSavedUserLocation = () => {
                try {
                    const saved = localStorage.getItem(LOCATION_KEY);
                    if (!saved) return null;
                    const data = JSON.parse(saved);
                    if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                        return { lat: data.latitude, lng: data.longitude };
                    }
                } catch (e) {
                    // ignore
                }
                return null;
            };

            const setDistanceForAllRows = (userLatitude, userLongitude) => {
                rows.forEach((row) => {
                    const rowLatitude = Number(row.dataset.latitude);
                    const rowLongitude = Number(row.dataset.longitude);
                    const distanceCell = row.querySelector('.distance-cell');

                    if (!Number.isFinite(rowLatitude) || !Number.isFinite(rowLongitude)) {
                        row.dataset.distanceValue = 'Infinity';
                        if (distanceCell) {
                            distanceCell.textContent = '';
                        }
                        return;
                    }

                    const distanceKm = calculateDistanceKm(userLatitude, userLongitude, rowLatitude, rowLongitude);
                    row.dataset.distanceValue = String(distanceKm);
                    if (distanceCell) {
                        distanceCell.textContent = distanceKm.toFixed(2) + ' km';
                    }
                });

                saveTableToLocalStorage({
                    stage: 'distance',
                    userLatitude,
                    userLongitude
                });
            };

            const resolveAddressFromCoordinates = async (latitude, longitude) => {
                const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
                const response = await fetch(reverseGeocodeUrl, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Reverse geocoding request failed');
                }

                const data = await response.json();
                if (data && data.address && typeof data.address === 'object') {
                    const address = data.address;

                    const barangay =
                        address.barangay
                        || address.suburb
                        || address.village
                        || address.neighbourhood
                        || address.hamlet
                        || address.quarter
                        || '';

                    const town =
                        address.town
                        || address.city
                        || address.municipality
                        || address.city_district
                        || '';

                    const province =
                        address.province
                        || address.state
                        || address.region
                        || '';

                    const parts = [barangay, town, province]
                        .map((part) => String(part || '').trim())
                        .filter((part) => part !== '');

                    const uniqueParts = [];
                    parts.forEach((part) => {
                        if (!uniqueParts.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
                            uniqueParts.push(part);
                        }
                    });

                    if (uniqueParts.length > 0) {
                        return uniqueParts.join(' ');
                    }
                }

                throw new Error('Address not found');
            };

            if (!navigator.geolocation) {
                setUserAddressForAllRows('Geolocation not supported');
                return;
            }

            // Try saved location first
            const savedLocation = getSavedUserLocation();
            if (savedLocation) {
                setDistanceForAllRows(savedLocation.lat, savedLocation.lng);
                resolveAddressFromCoordinates(savedLocation.lat, savedLocation.lng)
                    .then(address => setUserAddressForAllRows(address))
                    .catch(() => setUserAddressForAllRows('Address unavailable'));
                
                // Still try to get fresh location in background for next time
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        saveUserLocationToStorage(position.coords.latitude, position.coords.longitude);
                    },
                    () => { /* ignore errors for background update */ },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
                return;
            }

            // No saved location, request fresh geolocation
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const userLatitude = position.coords.latitude;
                    const userLongitude = position.coords.longitude;

                    // Save to localStorage for next visit
                    saveUserLocationToStorage(userLatitude, userLongitude);

                    setDistanceForAllRows(userLatitude, userLongitude);

                    try {
                        const userAddress = await resolveAddressFromCoordinates(userLatitude, userLongitude);
                        setUserAddressForAllRows(userAddress);
                    } catch (error) {
                        setUserAddressForAllRows('Address unavailable');
                    }
                },
                () => {
                    setUserAddressForAllRows('Location access denied');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000
                }
            );
        })();
    </script>
    <script>
        // Export table to CSV and trigger download
        (function() {
            function tableToCSV(table) {
                const rows = [];
                const desiredColumns = [
                    { header: 'Restaurant Name', key: 'name' },
                    { header: 'Category', key: 'category' },
                    { header: 'Description', key: 'description' },
                    { header: 'Address', key: 'address' },
                    { header: 'Phone', key: 'phone' },
                    { header: 'Email', key: 'email' },
                    { header: 'Facebook Name', key: 'facebook_name' },
                    { header: 'Facebook URL', key: 'facebook_page' },
                    { header: 'Operating Hours', key: 'hours' },
                    { header: 'Service Options', key: 'delivery_options' },
                    { header: 'Reservation', key: 'reservation_needed' },
                    { header: 'Price Range', key: 'price_range' },
                    { header: 'Menu', key: 'menu' },
                    { header: 'Seating Capacity', key: 'seating_capacity' },
                    { header: 'Parking', key: 'parking_availability' },
                    { header: 'WiFi', key: 'wifi_availability' },
                    { header: 'Payment Methods', key: 'payment_methods' },
                    { header: 'Accessibility', key: 'accessibility' },
                    { header: 'Latitude', key: 'latitude' },
                    { header: 'Longitude', key: 'longitude' }
                ];

                rows.push(desiredColumns.map(col => col.header));

                const trs = Array.from(table.querySelectorAll('tbody tr'));
                trs.forEach(tr => {
                    const vals = desiredColumns.map(col => {
                        let cell = tr.querySelector(`td[data-column="${col.key}"]`);
                        if (!cell && col.key === 'delivery_options') {
                            cell = tr.querySelector('td[data-column="service_options"]');
                        }
                        if (!cell && col.key === 'menu') {
                            cell = tr.querySelector('td[data-column="menu"]');
                        }
                        return sanitizeCell((cell && cell.textContent) || '');
                    });
                    rows.push(vals);
                });

                // Escape and join
                return rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
            }

            function sanitizeCell(raw) {
                if (raw === null || raw === undefined) return '';
                let s = String(raw || '').trim();

                // Remove placeholder em-dash or similar
                s = s.replace(/[\u2012\u2013\u2014\u2015\u2010\u2011\u2012\u2013\u2014\u2015\u2012]/g, '');
                s = s.replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F]/g, "'");

                // Remove common noise tokens
                s = s.replace(/\s*km\.?$/i, '');
                s = s.replace(/\u00A0/g, ' '); // non-breaking space
                s = s.replace(/[()]/g, '');

                // Remove currency symbols commonly used
                s = s.replace(/[\u20B1\$€£¥₹]/g, '');

                // Collapse whitespace and trim
                s = s.replace(/\s+/g, ' ').trim();

                // If only a dash or similar remains, return empty
                if (s === '-' || s === '—' || s === '–') return '';

                return s;
            }

            function downloadCSV(filename = 'restaurants.csv') {
                const table = document.getElementById('restaurantsTable');
                if (!table) return;
                const csv = tableToCSV(table);
                // Prepend UTF-8 BOM so Excel and other programs detect UTF-8 encoding correctly
                const BOM = '\uFEFF';
                const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }

            document.addEventListener('DOMContentLoaded', function() {
                const btn = document.getElementById('exportCsvBtn');
                if (!btn) return;
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    downloadCSV();
                });
            });
        })();
    </script>
</body>
</html>
