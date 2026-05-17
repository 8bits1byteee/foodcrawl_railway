<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/owner_auth.php';
require_once 'includes/functions.php';

if (!isOwnerLoggedIn()) {
    header('Location: owner_login.php');
    exit;
}

if (isset($_GET['logout'])) {
    ownerLogout();
    header('Location: owner_login.php');
    exit;
}

$ownerId = $_SESSION['owner_id'];
$ownerName = $_SESSION['owner_name'];
$ownerLoginCredential = $_SESSION['owner_email'] ?? '';
$ownerDisplayName = preg_replace('/\s+owner\s*$/i', '', (string)$ownerName);
$ownerDisplayName = trim((string)$ownerDisplayName);
if ($ownerDisplayName === '') {
    $ownerDisplayName = $ownerName;
}
$restaurants = getOwnerRestaurants($ownerId);
$notifications = getOwnerNotifications($ownerId);
$unreadCount = getUnreadNotificationCount($ownerId);
$changeHistory = getOwnerChangeHistory($ownerId);

$totalRestaurantsCount = count($restaurants);
$pendingChangesCount = 0;
$approvedChangesCount = 0;
$rejectedChangesCount = 0;

foreach ($changeHistory as $historyEntry) {
    $status = $historyEntry['status'] ?? '';
    if ($status === 'pending') {
        $pendingChangesCount++;
    } elseif ($status === 'approved') {
        $approvedChangesCount++;
    } elseif ($status === 'rejected') {
        $rejectedChangesCount++;
    }
}

$recentNotifications = array_slice($notifications, 0, 5);
$recentHistory = array_slice($changeHistory, 0, 5);

$categoryIcons = [
    'Fast Food'              => 'fa-burger',
    'Casual Dining'          => 'fa-utensils',
    'Fine Dining'            => 'fa-wine-glass',
    'Café / Coffee Shop'     => 'fa-mug-hot',
    'Buffet'                 => 'fa-concierge-bell',
    'Food Truck / Street Food' => 'fa-truck',
    'Bistro / Brasserie'     => 'fa-store',
    'Fast Casual'            => 'fa-pizza-slice',
    'Family Style'           => 'fa-users',
    'Pub / Bar & Grill'      => 'fa-beer-mug-empty',
];
$firstCategory = !empty($restaurants[0]['category']) ? $restaurants[0]['category'] : '';
$sidebarIconClass = $categoryIcons[$firstCategory] ?? 'fa-store';
$sidebarLogo = !empty($restaurants[0]['logo']) ? $restaurants[0]['logo'] : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Owner Dashboard - Estancia Food Crawl</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/admin_style.css">
    <link rel="stylesheet" href="css/owner_style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" />
</head>
<body class="owner-page">
<script>
try {
    const _sbMode = localStorage.getItem('ownerSidebarMode') || 'hover';
    if (_sbMode === 'collapsed' || _sbMode === 'hover') {
        document.body.classList.add('admin-sidebar-collapsed');
    }
    if (_sbMode === 'hover') {
        document.body.classList.add('admin-sidebar-hover-mode');
    }
} catch (e) {}
</script>

<!-- Owner Header -->
<nav class="admin-header owner-header" role="banner" aria-label="Owner header">
    <button type="button" class="owner-mobile-menu" id="ownerMobileMenuBtn" aria-label="Open navigation" aria-expanded="false">
        <i class="fas fa-bars" aria-hidden="true" style="font-size: 1.25rem;"></i>
    </button>
    <div class="admin-welcome">Welcome, <strong>Owner</strong></div>
    <div class="admin-title"><i class="fas fa-store" aria-hidden="true"></i> <span>Owner Dashboard</span></div>
    <div class="admin-actions" role="navigation" aria-label="Owner actions">
        <a class="admin-btn" href="index.php" target="_blank" rel="noopener" aria-label="View site"><i class="fas fa-home" aria-hidden="true"></i> <span>View Site</span></a>
        <a class="admin-btn" href="#" onclick="openOwnerLogoutModal(event)" aria-label="Logout"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> <span>Logout</span></a>
    </div>
</nav>

<!-- Logout Confirmation Modal -->
<div id="logoutConfirmModal" class="logout-modal" style="display: none;">
    <div class="logout-modal-content">
        <div class="logout-modal-header">
            <h2><i class="fas fa-sign-out-alt"></i> Confirm Logout</h2>
        </div>
        <div class="logout-modal-body">
            <p>Are you sure you want to logout?</p>
        </div>
        <div class="logout-modal-actions">
            <button class="btn-modal-cancel" onclick="closeLogoutModal()">
                <i class="fas fa-times"></i> Cancel
            </button>
            <button class="btn-modal-confirm" onclick="confirmLogout()">
                <i class="fas fa-check"></i> Yes, Logout
            </button>
        </div>
    </div>
</div>

<!-- Account Update Decision Modal -->
<div id="ownerAccountUpdateModal" class="logout-modal account-update-modal" style="display: none;">
    <div class="logout-modal-content account-update-content">
        <div class="logout-modal-header account-update-header">
            <h2><i class="fas fa-user-check"></i> Account Updated</h2>
        </div>
        <div class="logout-modal-body">
            <p id="ownerAccountUpdateModalMessage">Your account changes were applied successfully. Do you want to stay logged in or re-login now?</p>
        </div>
        <div class="logout-modal-actions">
            <button class="btn-modal-cancel" type="button" onclick="closeOwnerAccountUpdateModal()">
                <i class="fas fa-user-clock"></i> Keep Me Logged In
            </button>
            <button class="btn-modal-confirm" type="button" onclick="reloginOwnerAfterAccountUpdate()">
                <i class="fas fa-right-from-bracket"></i> Re-login Now
            </button>
        </div>
    </div>
</div>

<!-- Sidebar Control Modal -->
<div id="ownerSidebarCtrlModal" role="dialog" aria-modal="true" aria-labelledby="ownerSidebarCtrlTitle"
     style="display:none;position:fixed;bottom:52px;left:4px;z-index:14500;">
    <div class="sidebar-ctrl-inner">
        <div class="sidebar-ctrl-head">
            <span id="ownerSidebarCtrlTitle">Sidebar Control</span>
        </div>
        <hr class="sidebar-ctrl-hr">
        <div class="sidebar-ctrl-opts">
            <button class="sidebar-ctrl-opt" data-mode="expanded">
                <span>Expanded</span>
            </button>
            <button class="sidebar-ctrl-opt" data-mode="collapsed">
                <span>Collapsed</span>
            </button>
            <button class="sidebar-ctrl-opt" data-mode="hover">
                <span>Expand on Hover</span>
            </button>
        </div>
    </div>
</div>

<div class="container">
    <div class="admin-content">
        <div class="admin-sidebar">
            <div class="sidebar-user">
                <?php if (!empty($sidebarLogo)): ?>
                    <img src="<?= htmlspecialchars($sidebarLogo) ?>" alt="Restaurant logo" class="sidebar-user-logo">
                <?php else: ?>
                    <i class="fas <?= htmlspecialchars($sidebarIconClass) ?>"></i>
                <?php endif; ?>
                <span class="menu-label"><strong><?= htmlspecialchars($ownerDisplayName) ?></strong></span>
            </div>
            <ul class="admin-menu">
                <li><a href="#" class="menu-item active" data-tab="dashboard"><i class="fas fa-chart-pie"></i><span class="menu-label">Dashboard</span></a></li>
                <li><a href="#" class="menu-item" data-tab="my-restaurants"><i class="fas fa-utensils"></i><span class="menu-label">My Restaurants</span></a></li>
                <li>
                    <a href="#" class="menu-item" data-tab="notifications">
                        <i class="fas fa-bell"></i><span class="menu-label">Notifications</span>
                        <span class="nav-badge" id="ownerNotificationsBadge" style="<?php echo $unreadCount > 0 ? '' : 'display:none;'; ?>"><?php echo (int)$unreadCount; ?></span>
                    </a>
                </li>
                <li><a href="#" class="menu-item" data-tab="change-history"><i class="fas fa-history"></i><span class="menu-label">Change History</span></a></li>
                <li><a href="#" class="menu-item" data-tab="account-settings"><i class="fas fa-user-cog"></i><span class="menu-label">Account Settings</span></a></li>
                <li class="sidebar-ctrl-li">
                    <button type="button" class="sidebar-ctrl-btn" id="ownerSidebarCtrlBtn" title="Sidebar Control">
                        <img src="icons/layout-sidebar.svg" alt="Sidebar" aria-hidden="true" width="18" height="18" style="display:block;filter:brightness(0) invert(1);">
                    </button>
                </li>
            </ul>
        </div>
        <div class="owner-sidebar-overlay" id="ownerSidebarOverlay" aria-hidden="true"></div>

        <div class="admin-main">
            <!-- Dashboard Tab -->
            <div class="tab-content active" id="tab-dashboard">
                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                <p class="tab-subtitle">Quick overview of your restaurants and recent owner activity.</p>

                <div class="owner-dashboard-grid">
                    <div class="owner-stat-card" data-owner-go-tab="my-restaurants" role="button" tabindex="0" aria-label="Open My Restaurants tab">
                        <div class="owner-stat-icon"><i class="fas fa-store"></i></div>
                        <div class="owner-stat-content">
                            <p class="owner-stat-label">My Restaurants</p>
                            <h3 id="ownerTotalRestaurantsCount"><?php echo (int)$totalRestaurantsCount; ?></h3>
                        </div>
                    </div>
                    <div class="owner-stat-card" data-owner-go-tab="change-history" role="button" tabindex="0" aria-label="Open Change History tab">
                        <div class="owner-stat-icon pending"><i class="fas fa-clock"></i></div>
                        <div class="owner-stat-content">
                            <p class="owner-stat-label">Pending Changes</p>
                            <h3 id="ownerPendingChangesCount"><?php echo (int)$pendingChangesCount; ?></h3>
                        </div>
                    </div>
                    <div class="owner-stat-card" data-owner-go-tab="notifications" role="button" tabindex="0" aria-label="Open Notifications tab">
                        <div class="owner-stat-icon bell"><i class="fas fa-bell"></i></div>
                        <div class="owner-stat-content">
                            <p class="owner-stat-label">Unread Notifications</p>
                            <h3 id="ownerUnreadNotificationsCount"><?php echo (int)$unreadCount; ?></h3>
                        </div>
                    </div>
                    <div class="owner-stat-card" data-owner-go-tab="change-history" role="button" tabindex="0" aria-label="Open Change History tab">
                        <div class="owner-stat-icon approved"><i class="fas fa-check-circle"></i></div>
                        <div class="owner-stat-content">
                            <p class="owner-stat-label">Approved Changes</p>
                            <h3 id="ownerApprovedChangesCount"><?php echo (int)$approvedChangesCount; ?></h3>
                        </div>
                    </div>
                </div>

                <div class="owner-dashboard-panels">
                    <div class="owner-dashboard-panel">
                        <div class="owner-dashboard-panel-head">
                            <h3><i class="fas fa-bell"></i> Recent Notifications</h3>
                            <button type="button" class="owner-panel-link" data-owner-go-tab="notifications">View All</button>
                        </div>

                        <?php if (empty($recentNotifications)): ?>
                            <p class="owner-dashboard-empty">No notifications yet.</p>
                        <?php else: ?>
                            <ul class="owner-dashboard-list">
                                <?php foreach ($recentNotifications as $notif): ?>
                                    <li>
                                        <p><?php echo htmlspecialchars($notif['message']); ?></p>
                                        <span><?php echo date('M j, Y g:i A', strtotime($notif['created_at'])); ?></span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>

                    <div class="owner-dashboard-panel">
                        <div class="owner-dashboard-panel-head">
                            <h3><i class="fas fa-history"></i> Recent Change History</h3>
                            <button type="button" class="owner-panel-link" data-owner-go-tab="change-history">View All</button>
                        </div>

                        <?php if (empty($recentHistory)): ?>
                            <p class="owner-dashboard-empty">No change history yet.</p>
                        <?php else: ?>
                            <ul class="owner-dashboard-list">
                                <?php foreach ($recentHistory as $change): ?>
                                    <li>
                                        <p>
                                            <?php echo htmlspecialchars($change['restaurant_name'] ?? 'Restaurant'); ?>
                                            <span class="owner-dashboard-status <?php echo htmlspecialchars($change['status'] ?? 'pending'); ?>">
                                                <?php echo htmlspecialchars(ucfirst($change['status'] ?? 'pending')); ?>
                                            </span>
                                        </p>
                                        <span><?php echo date('M j, Y g:i A', strtotime($change['created_at'])); ?></span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="owner-dashboard-map-card">
                    <div class="owner-dashboard-panel-head owner-dashboard-map-head">
                        <h3><i class="fas fa-map-marked-alt"></i> Restaurant Map</h3>
                    </div>
                    <div class="owner-dashboard-map-wrap">
                        <button type="button" class="owner-map-home-btn" onclick="returnOwnerDashboardHome()" aria-label="Return map home view">
                            <i class="fas fa-house"></i> Return Home
                        </button>
                        <div id="ownerDashboardMap" aria-label="Owner restaurant locations map"></div>
                    </div>
                </div>
            </div>

            <!-- My Restaurants Tab -->
            <div class="tab-content" id="tab-my-restaurants" style="display:none;">
                <h2><i class="fas fa-utensils"></i> My Restaurants</h2>
                <p class="tab-subtitle">Click on a restaurant to edit its information. Changes will be sent to admin for approval.</p>
                
                <?php if (empty($restaurants)): ?>
                    <div class="empty-state">
                        <i class="fas fa-store-slash"></i>
                        <h3>No restaurants assigned</h3>
                        <p>Contact the admin to assign restaurants to your account.</p>
                    </div>
                <?php else: ?>
                    <div class="owner-restaurant-list">
                        <?php foreach ($restaurants as $r): ?>
                            <?php
                                $pendingChanges = getPendingChangesForRestaurant($r['id']);
                                $hours = null;
                                $categoryName = $r['category'] ?? 'Uncategorized';
                                $categoryColorMap = [
                                    'Fast Food' => '#E53935',
                                    'Casual Dining' => '#FB8C00',
                                    'Fine Dining' => '#6A1B9A',
                                    'Café / Coffee Shop' => '#8D6E63',
                                    'Buffet' => '#FBC02D',
                                    'Food Truck / Street Food' => '#00897B',
                                    'Bistro / Brasserie' => '#3949AB',
                                    'Fast Casual' => '#43A047',
                                    'Family Style' => '#FDD835',
                                    'Pub / Bar & Grill' => '#5D4037'
                                ];
                                $categoryColor = $categoryColorMap[$categoryName] ?? ($r['category_color'] ?? '#E85634');
                                $cardThumb = !empty($r['logo']) ? $r['logo'] : (!empty($r['image_path']) ? $r['image_path'] : '');
                                if (!empty($r['hours'])) {
                                    $hours = is_string($r['hours']) ? json_decode($r['hours'], true) : $r['hours'];
                                }
                            ?>
                            <div class="orc-detail-card" data-id="<?php echo $r['id']; ?>">
                                <div class="orc-detail-header">
                                    <div class="orc-detail-image">
                                        <?php if (!empty($cardThumb)): ?>
                                            <img src="<?php echo htmlspecialchars($cardThumb); ?>" alt="<?php echo htmlspecialchars($r['name']); ?>">
                                        <?php else: ?>
                                            <div class="orc-no-image"><i class="fas fa-burger" style="color: <?php echo htmlspecialchars($categoryColor); ?>;"></i></div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="orc-detail-title">
                                        <h3><?php echo htmlspecialchars($r['name']); ?></h3>
                                        <span class="orc-detail-category" style="background: <?php echo htmlspecialchars($categoryColor); ?>;">
                                            <?php echo htmlspecialchars($categoryName); ?>
                                        </span>
                                        <?php if (!empty($pendingChanges)): ?>
                                            <span class="orc-pending-badge"><i class="fas fa-clock"></i> Pending Changes</span>
                                        <?php endif; ?>
                                    </div>
                                    <button class="orc-edit-btn" onclick="openEditModal(<?php echo $r['id']; ?>)">
                                        <i class="fas fa-edit"></i> Edit Information
                                    </button>
                                </div>

                                <div class="orc-detail-body">
                                    <!-- Description -->
                                    <?php if (!empty($r['description'])): ?>
                                    <div class="orc-detail-description">
                                        <p><?php echo htmlspecialchars($r['description']); ?></p>
                                    </div>
                                    <?php endif; ?>

                                    <div class="orc-detail-sections">
                                        <!-- Location & Contact -->
                                        <div class="orc-detail-section">
                                            <h4><i class="fas fa-map-marker-alt"></i> Location & Contact</h4>
                                            <div class="orc-detail-grid">
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Address</span>
                                                    <span class="orc-detail-value"><?php echo htmlspecialchars($r['address'] ?? '—'); ?></span>
                                                </div>
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Phone</span>
                                                    <span class="orc-detail-value"><?php echo !empty($r['phone']) ? htmlspecialchars($r['phone']) : '<span class="orc-empty">Not set</span>'; ?></span>
                                                </div>
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Email</span>
                                                    <span class="orc-detail-value"><?php echo !empty($r['email']) ? htmlspecialchars($r['email']) : '<span class="orc-empty">Not set</span>'; ?></span>
                                                </div>
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Facebook</span>
                                                    <span class="orc-detail-value">
                                                        <?php if (!empty($r['facebook_page'])): ?>
                                                            <a href="<?php echo htmlspecialchars($r['facebook_page']); ?>" target="_blank" rel="noopener"><?php echo htmlspecialchars($r['facebook_name'] ?: $r['facebook_page']); ?></a>
                                                        <?php elseif (!empty($r['facebook_name'])): ?>
                                                            <?php echo htmlspecialchars($r['facebook_name']); ?>
                                                        <?php else: ?>
                                                            <span class="orc-empty">Not set</span>
                                                        <?php endif; ?>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Business Hours -->
                                        <div class="orc-detail-section">
                                            <h4><i class="fas fa-clock"></i> Business Hours</h4>
                                            <?php if (!empty($hours) && is_array($hours)): ?>
                                                <div class="orc-hours-table">
                                                    <?php
                                                    $days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                                                    foreach ($days as $day):
                                                        $dayData = $hours[$day] ?? null;
                                                        $isClosed = !empty($dayData['closed']);
                                                        $isToday = (date('l') === $day);
                                                    ?>
                                                    <div class="orc-hours-row <?php echo $isToday ? 'today' : ''; ?> <?php echo $isClosed ? 'closed' : ''; ?>">
                                                        <span class="orc-hours-day"><?php echo $day; ?><?php if ($isToday): ?> <span class="orc-today-badge">Today</span><?php endif; ?></span>
                                                        <span class="orc-hours-time">
                                                            <?php if ($isClosed): ?>
                                                                <span class="orc-closed-text">Closed</span>
                                                            <?php elseif (!empty($dayData['open']) && !empty($dayData['close'])): ?>
                                                                <?php echo htmlspecialchars($dayData['open']); ?> — <?php echo htmlspecialchars($dayData['close']); ?>
                                                            <?php else: ?>
                                                                <span class="orc-empty">Not set</span>
                                                            <?php endif; ?>
                                                        </span>
                                                    </div>
                                                    <?php endforeach; ?>
                                                </div>
                                            <?php else: ?>
                                                <p class="orc-empty-block">No business hours set</p>
                                            <?php endif; ?>
                                        </div>

                                        <!-- Menu & Pricing -->
                                        <div class="orc-detail-section">
                                            <h4><i class="fas fa-utensils"></i> Menu & Pricing</h4>
                                            <div class="orc-detail-grid">
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Popular Items</span>
                                                    <span class="orc-detail-value">
                                                        <?php if (!empty($r['menu_items'])): ?>
                                                            <div class="orc-tag-list">
                                                                <?php foreach (explode(',', $r['menu_items']) as $item): ?>
                                                                    <span class="orc-tag"><?php echo htmlspecialchars(trim($item)); ?></span>
                                                                <?php endforeach; ?>
                                                            </div>
                                                        <?php else: ?>
                                                            <span class="orc-empty">Not set</span>
                                                        <?php endif; ?>
                                                    </span>
                                                </div>
                                                <div class="orc-detail-item">
                                                    <span class="orc-detail-label">Price Range</span>
                                                    <span class="orc-detail-value"><?php echo !empty($r['price_range']) ? htmlspecialchars($r['price_range']) : '<span class="orc-empty">Not set</span>'; ?></span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Facilities & Services -->
                                        <div class="orc-detail-section">
                                            <h4><i class="fas fa-concierge-bell"></i> Facilities & Services</h4>
                                            <div class="orc-facilities-grid">
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-chair"></i>
                                                    <span class="orc-facility-label">Seating</span>
                                                    <span class="orc-facility-value"><?php echo !empty($r['seating_capacity']) ? htmlspecialchars($r['seating_capacity']) : '—'; ?></span>
                                                </div>
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-calendar-check"></i>
                                                    <span class="orc-facility-label">Reservation</span>
                                                    <span class="orc-facility-value <?php echo ($r['reservation_needed'] ?? '') === 'Yes' ? 'yes' : ''; ?>"><?php echo !empty($r['reservation_needed']) ? htmlspecialchars($r['reservation_needed']) : '—'; ?></span>
                                                </div>
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-parking"></i>
                                                    <span class="orc-facility-label">Parking</span>
                                                    <span class="orc-facility-value"><?php echo !empty($r['parking_availability']) ? htmlspecialchars($r['parking_availability']) : '—'; ?></span>
                                                </div>
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-wifi"></i>
                                                    <span class="orc-facility-label">Wi-Fi</span>
                                                    <span class="orc-facility-value <?php echo ($r['wifi_availability'] ?? '') === 'Yes' ? 'yes' : ''; ?>"><?php echo !empty($r['wifi_availability']) ? htmlspecialchars($r['wifi_availability']) : '—'; ?></span>
                                                </div>
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-truck"></i>
                                                    <span class="orc-facility-label">Delivery</span>
                                                    <span class="orc-facility-value"><?php
                                                        if (!empty($r['delivery_options'])) {
                                                            $dOpts = json_decode($r['delivery_options'], true);
                                                            echo htmlspecialchars(is_array($dOpts) ? implode(', ', $dOpts) : $r['delivery_options']);
                                                        } else echo '—';
                                                    ?></span>
                                                </div>
                                                <div class="orc-facility-item">
                                                    <i class="fas fa-credit-card"></i>
                                                    <span class="orc-facility-label">Payment</span>
                                                    <span class="orc-facility-value"><?php
                                                        if (!empty($r['payment_methods'])) {
                                                            $pMethods = json_decode($r['payment_methods'], true);
                                                            echo htmlspecialchars(is_array($pMethods) ? implode(', ', $pMethods) : $r['payment_methods']);
                                                        } else echo '—';
                                                    ?></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Notifications Tab -->
            <div class="tab-content" id="tab-notifications" style="display:none;">
                <div class="tab-header-row">
                    <h2><i class="fas fa-bell"></i> Notifications</h2>
                    <?php if (!empty($notifications)): ?>
                        <button type="button" class="owner-delete-all-btn" id="ownerDeleteAllNotificationsBtn" onclick="deleteAllOwnerNotifications(this)">
                            <i class="fas fa-trash"></i> Delete All
                        </button>
                    <?php endif; ?>
                </div>
                <p class="tab-subtitle">Status updates on your submitted changes.</p>

                <div id="ownerNotificationsContent">
                    <?php if (empty($notifications)): ?>
                        <div class="empty-state">
                            <i class="fas fa-bell-slash"></i>
                            <h3>No notifications</h3>
                            <p>You'll receive notifications when admin reviews your changes.</p>
                        </div>
                    <?php else: ?>
                        <div class="notif-full-list" id="ownerNotificationsList">
                            <?php foreach ($notifications as $notif): ?>
                                <div class="notif-full-item <?php echo $notif['is_read'] ? 'read' : 'unread'; ?> <?php echo $notif['type']; ?>" data-notification-id="<?php echo (int)$notif['id']; ?>">
                                    <div class="notif-full-icon <?php echo $notif['type']; ?>">
                                        <?php if ($notif['type'] === 'approved'): ?>
                                            <i class="fas fa-check-circle"></i>
                                        <?php elseif ($notif['type'] === 'rejected'): ?>
                                            <i class="fas fa-times-circle"></i>
                                        <?php else: ?>
                                            <i class="fas fa-info-circle"></i>
                                        <?php endif; ?>
                                    </div>
                                    <div class="notif-full-content">
                                        <p class="notif-full-message"><?php echo htmlspecialchars($notif['message']); ?></p>
                                        <span class="notif-full-time"><i class="fas fa-clock"></i> <?php echo date('M j, Y g:i A', strtotime($notif['created_at'])); ?></span>
                                    </div>
                                    <button type="button" class="owner-item-delete" onclick="deleteOwnerNotification(<?php echo (int)$notif['id']; ?>, this)" aria-label="Delete notification" title="Delete notification">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Change History Tab -->
            <div class="tab-content" id="tab-change-history" style="display:none;">
                <div class="tab-header-row">
                    <h2><i class="fas fa-history"></i> Change History</h2>
                    <?php if (!empty($changeHistory)): ?>
                        <button type="button" class="owner-delete-all-btn" id="ownerDeleteAllHistoryBtn" onclick="deleteAllOwnerHistory(this)">
                            <i class="fas fa-trash"></i> Delete All
                        </button>
                    <?php endif; ?>
                </div>
                <p class="tab-subtitle">History of all your submitted changes.</p>

                <div id="ownerChangeHistoryContent">
                    <?php if (empty($changeHistory)): ?>
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No changes submitted yet</h3>
                            <p>Edit your restaurant information to see change history here.</p>
                        </div>
                    <?php else: ?>
                        <div class="change-history-list" id="ownerChangeHistoryList">
                            <?php foreach ($changeHistory as $change): ?>
                                <div class="change-history-item status-<?php echo $change['status']; ?>" data-change-id="<?php echo (int)$change['id']; ?>">
                                    <div class="ch-status">
                                        <?php if ($change['status'] === 'pending'): ?>
                                            <span class="ch-badge pending"><i class="fas fa-clock"></i> Pending</span>
                                        <?php elseif ($change['status'] === 'approved'): ?>
                                            <span class="ch-badge approved"><i class="fas fa-check"></i> Approved</span>
                                        <?php else: ?>
                                            <span class="ch-badge rejected"><i class="fas fa-times"></i> Rejected</span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="ch-details">
                                        <div class="ch-headline">
                                            <h4><?php echo htmlspecialchars($change['restaurant_name']); ?></h4>
                                            <button type="button" class="owner-item-delete" onclick="deleteOwnerHistory(<?php echo (int)$change['id']; ?>, this)" aria-label="Delete history item" title="Delete history item">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <span class="ch-date"><i class="fas fa-calendar"></i> <?php echo date('M j, Y g:i A', strtotime($change['created_at'])); ?></span>
                                        <?php
                                            $fields = json_decode($change['changes_json'], true);
                                            if ($fields):
                                        ?>
                                            <div class="ch-fields">
                                                <strong>Fields changed:</strong>
                                                <?php echo htmlspecialchars(implode(', ', array_keys($fields))); ?>
                                            </div>
                                        <?php endif; ?>
                                        <?php if (!empty($change['admin_notes'])): ?>
                                            <div class="ch-notes">
                                                <strong>Admin notes:</strong> <?php echo htmlspecialchars($change['admin_notes']); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Account Settings Tab -->
            <div class="tab-content" id="tab-account-settings" style="display:none;">
                <h2><i class="fas fa-user-cog"></i> Account Settings</h2>
                <p class="tab-subtitle">Update your login credential and password. Enter your current password to confirm changes.</p>

                <form id="ownerAccountForm" class="admin-form" autocomplete="off" style="max-width: 620px;">
                    <div class="form-group">
                        <label for="ownerCurrentPassword">Current Password <span class="required-asterisk" aria-hidden="true">*</span></label>
                        <input type="password" id="ownerCurrentPassword" name="current_password" required minlength="1" autocomplete="current-password">
                    </div>

                    <div class="form-group">
                        <label for="ownerNewUsername">New Username <span class="required-asterisk" aria-hidden="true">*</span></label>
                        <input type="text" id="ownerNewUsername" name="new_username" required minlength="3" maxlength="150" value="<?php echo htmlspecialchars($ownerLoginCredential); ?>" autocomplete="username">
                    </div>

                    <div class="inline-pair">
                        <div class="form-group" style="flex:1;">
                            <label for="ownerNewPassword">New Password</label>
                            <input type="password" id="ownerNewPassword" name="new_password" minlength="6" placeholder="Leave blank to keep current password" autocomplete="new-password">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label for="ownerConfirmPassword">Confirm New Password</label>
                            <input type="password" id="ownerConfirmPassword" name="confirm_password" minlength="6" placeholder="Re-enter new password" autocomplete="new-password">
                        </div>
                    </div>

                    <div class="add-step-actions" style="justify-content:flex-start;">
                        <button type="submit" class="btn-primary" id="ownerAccountSaveBtn"><i class="fas fa-save"></i> Save Account Changes</button>
                    </div>
                </form>
            </div>

        </div>
    </div>
</div>

<!-- Edit Restaurant Modal (same layout as admin) -->
<div id="ownerEditModal" class="modal" style="display:none;">
    <div class="modal-content restaurant-edit-modal">
        <button class="modal-close" id="closeOwnerEditModal" aria-label="Close">
            <i class="fas fa-xmark"></i>
        </button>

        <div class="modal-header restaurant-edit-header">
            <h2 class="modal-title">
                <i class="fas fa-utensils"></i>
                Edit Restaurant
            </h2>
            
        </div>

        <div class="modal-body restaurant-edit-body">
            <form id="ownerEditForm" class="admin-form" enctype="multipart/form-data">
                <input type="hidden" id="ownerEditId" name="restaurant_id">

                <!-- Restaurant Name + Category (inline) -->
                <div class="inline-pair" style="align-items:flex-start;">
                    <div class="form-group" style="flex:2;">
                        <label for="ownerEditName">Restaurant Name: <span class="required-asterisk" aria-hidden="true">*</span></label>
                        <input type="text" id="ownerEditName" name="name" required>
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label for="ownerEditCategory">Category: <span class="required-asterisk" aria-hidden="true">*</span></label>
                        <select id="ownerEditCategory" name="category" required>
                            <option value="">-- Select category --</option>
                            <option>Fast Food</option>
                            <option>Casual Dining</option>
                            <option>Fine Dining</option>
                            <option>Café / Coffee Shop</option>
                            <option>Buffet</option>
                            <option>Food Truck / Street Food</option>
                            <option>Bistro / Brasserie</option>
                            <option>Fast Casual</option>
                            <option>Family Style</option>
                            <option>Pub / Bar &amp; Grill</option>
                        </select>
                    </div>
                </div>

                <!-- Description -->
                <div class="form-group">
                    <label for="ownerEditDescription">Description:</label>
                    <textarea id="ownerEditDescription" name="description" rows="4"></textarea>
                </div>

                <!-- Contact Fields -->
                <div class="vertical-fields">
                    <div class="form-group">
                        <label for="ownerEditPhone">Phone:</label>
                        <input type="text" id="ownerEditPhone" name="phone" maxlength="11" inputmode="numeric" pattern="\d{11}" placeholder="09XXXXXXXXX">
                    </div>
                    <div class="form-group">
                        <label for="ownerEditEmail">Email:</label>
                        <input type="email" id="ownerEditEmail" name="email" placeholder="contact@example.com">
                    </div>
                    <div class="inline-pair">
                        <div class="form-group half">
                            <label for="ownerEditFacebookName">Facebook Page Name:</label>
                            <input type="text" id="ownerEditFacebookName" name="facebook_name" placeholder="My Restaurant Page">
                        </div>
                        <div class="form-group half">
                            <label for="ownerEditFacebook">Facebook Page (URL):</label>
                            <input type="text" id="ownerEditFacebook" name="facebook_page" placeholder="https://facebook.com/yourpage">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Business Hours:</label>
                        <div class="hours-input-container">
                            <button type="button" class="hours-apply-btn" id="ownerApplyAllHours">Apply to all</button>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Monday:</label>
                                <input type="time" id="ownerMondayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerMondayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerMondayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Tuesday:</label>
                                <input type="time" id="ownerTuesdayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerTuesdayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerTuesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Wednesday:</label>
                                <input type="time" id="ownerWednesdayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerWednesdayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerWednesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Thursday:</label>
                                <input type="time" id="ownerThursdayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerThursdayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerThursdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Friday:</label>
                                <input type="time" id="ownerFridayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerFridayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerFridayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Saturday:</label>
                                <input type="time" id="ownerSaturdayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerSaturdayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerSaturdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                            <div class="hours-day-row">
                                <label class="hours-day-label">Sunday:</label>
                                <input type="time" id="ownerSundayOpen" class="hours-time-input" placeholder="Open">
                                <span class="hours-separator">to</span>
                                <input type="time" id="ownerSundayClose" class="hours-time-input" placeholder="Close">
                                <label class="hours-closed-label"><input type="checkbox" id="ownerSundayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Popular Items -->
                <div class="form-group">
                    <label for="ownerEditMenuItems">Popular Items (comma separated):</label>
                    <input type="text" id="ownerEditMenuItems" name="menu_items" placeholder="e.g., Adobo, Sinigang, Lechon">
                </div>

                <!-- Full Menu Items -->
                <div class="form-group">
                    <label>Full Menu Items with Pricing:</label>
                    <div id="ownerFullMenuContainer" class="full-menu-builder">
                        <div class="full-menu-items-list" id="ownerFullMenuItemsList"></div>
                        <div class="full-menu-add-row">
                            <select id="ownerNewMenuItemCategory" class="menu-item-category-select">
                                <option value="">Category</option>
                                <option value="Appetizers">Appetizers</option>
                                <option value="Main Course">Main Course</option>
                                <option value="Soups">Soups</option>
                                <option value="Salads">Salads</option>
                                <option value="Rice Meals">Rice Meals</option>
                                <option value="Noodles">Noodles</option>
                                <option value="Seafood">Seafood</option>
                                <option value="Grilled">Grilled</option>
                                <option value="Sides">Sides</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Other">Other</option>
                            </select>
                            <input type="text" id="ownerNewMenuItemName" placeholder="Item name" class="menu-item-name-input">
                            <input type="number" id="ownerNewMenuItemPrice" placeholder="₱ Price" class="menu-item-price-input" min="0" step="any">
                            <button type="button" class="btn btn-sm btn-secondary" onclick="addFullMenuItem('ownerFullMenuItemsList', 'ownerNewMenuItemCategory', 'ownerNewMenuItemName', 'ownerNewMenuItemPrice')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    <input type="hidden" id="ownerFullMenuData" name="full_menu">
                </div>

                <!-- Pricing and Payment Section -->
                <div class="form-group">
                    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                        <i class="fas fa-money-bill-wave"></i> Pricing and Payment
                    </h3>

                    <div class="form-group">
                        <label for="ownerEditPriceRange">Price Range (per meal):</label>
                        <input type="text" id="ownerEditPriceRange" name="price_range" placeholder="e.g., ₱150–₱500">
                    </div>

                    <div class="form-group">
                        <label>Accepted In-Store Payment Methods:</label>
                        <div class="payment-options">
                            <label><input type="checkbox" name="owner_payment_methods[]" value="Cash"> Cash</label>
                            <label><input type="checkbox" name="owner_payment_methods[]" value="Credit/Debit Card"> Credit/Debit Card</label>
                            <label><input type="checkbox" name="owner_payment_methods[]" value="GCash"> GCash</label>
                            <label><input type="checkbox" name="owner_payment_methods[]" value="Maya"> Maya</label>
                            <label><input type="checkbox" name="owner_payment_methods[]" value="Bank Transfer"> Bank Transfer</label>
                        </div>
                    </div>
                </div>

                <!-- Facilities and Services Section -->
                <div class="form-group">
                    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                        <i class="fas fa-concierge-bell"></i> Facilities and Services
                    </h3>

                    <div class="vertical-fields">
                        <div class="form-group">
                            <label for="ownerEditSeating">Seating Capacity:</label>
                            <input type="text" id="ownerEditSeating" name="seating_capacity" placeholder="e.g., 50-100 people">
                        </div>

                        <div class="form-group">
                            <label>Reservation Needed:</label>
                            <div class="option-group">
                                <label><input type="radio" name="owner_reservation_needed" value="Yes"><span>Yes</span></label>
                                <label><input type="radio" name="owner_reservation_needed" value="No"><span>No</span></label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Parking Availability:</label>
                            <div class="option-group">
                                <label><input type="radio" name="owner_parking_availability" value="Yes"><span>Yes</span></label>
                                <label><input type="radio" name="owner_parking_availability" value="Limited"><span>Limited</span></label>
                                <label><input type="radio" name="owner_parking_availability" value="None"><span>None</span></label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Delivery Options:</label>
                            <div class="option-group">
                                <label><input type="checkbox" name="owner_delivery_options[]" value="Dine-in"><span>Dine-in</span></label>
                                <label><input type="checkbox" name="owner_delivery_options[]" value="Take-out"><span>Take-out</span></label>
                                <label><input type="checkbox" name="owner_delivery_options[]" value="Delivery"><span>Delivery</span></label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Wi-Fi Availability:</label>
                            <div class="option-group">
                                <label><input type="radio" name="owner_wifi_availability" value="Yes"><span>Yes</span></label>
                                <label><input type="radio" name="owner_wifi_availability" value="No"><span>No</span></label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Accessibility:</label>
                            <div class="checkbox-grid">
                                <label><input type="checkbox" name="owner_accessibility[]" value="Wheelchair accessible entrance"><span>Wheelchair accessible entrance</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Wheelchair accessible seating"><span>Wheelchair accessible seating</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Wheelchair accessible restroom"><span>Wheelchair accessible restroom</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Ramp available"><span>Ramp available</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Parking for persons with disabilities"><span>PWD parking</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Braille menu or signage"><span>Braille menu or signage</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Staff assistance available"><span>Staff assistance available</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="High chair or child seat available"><span>High chair / child seat</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Near public transport"><span>Near public transport</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Drop-off area near entrance"><span>Drop-off area near entrance</span></label>
                                <label><input type="checkbox" name="owner_accessibility[]" value="Non-slip flooring"><span>Non-slip flooring</span></label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Media (same layout as admin) -->
                <div class="form-group">
                    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                        <i class="fas fa-images"></i> Media
                    </h3>

                    <!-- Menu Images -->
                    <div class="form-group">
                        <label for="ownerMenuImages">Menu Images <span id="ownerMenuImageCounter" class="image-counter">0/10 selected</span>:</label>
                        <input type="file" id="ownerMenuImages" name="menu_images[]" accept="image/*" multiple style="display: none;">
                        <small class="hint">Upload up to 10 menu images with prices (PNG/JPG up to 2.5MB each)</small>

                        <div id="ownerMenuImagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                            <div class="image-add" id="ownerMenuImageAddTile">
                                <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('ownerMenuImages').click()" aria-label="Add menu images">
                                    <i class="fas fa-plus" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Restaurant Logo -->
                    <div class="form-group">
                        <label for="ownerLogoInput">Restaurant Logo (optional):</label>
                        <input type="file" id="ownerLogoInput" name="logo" accept="image/*" style="display:none;">
                        <small class="hint">Square PNG/JPG recommended. Max 1.5MB.</small>
                        <div class="logo-row">
                            <div id="ownerLogoPreviewContainer" class="logo-preview-box" aria-live="polite"></div>
                            <div class="image-add logo-add" id="ownerLogoAddTile">
                                <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('ownerLogoInput').click()" aria-label="Select logo">
                                    <i class="fas fa-image" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Restaurant Pictures -->
                    <div class="form-group">
                        <label for="ownerImageUpload">Restaurant Pictures <span id="ownerImageCounter" class="image-counter">0/5 selected</span>:</label>
                        <input type="file" id="ownerImageUpload" name="images[]" accept="image/*" multiple style="display: none;">
                        <small class="hint">Select up to 5 images (PNG, JPG up to 3MB each)</small>

                        <div id="ownerImagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                            <div class="image-add" id="ownerImageAddTile">
                                <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('ownerImageUpload').click()" aria-label="Add images">
                                    <i class="fas fa-plus" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Location on Map -->
                <div class="form-group">
                    <label>Location on Map:</label>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label for="ownerMapAddressBar">Address (Auto or Manual)</label>
                        <input type="text" id="ownerMapAddressBar" class="map-address-bar" placeholder="Click the map to auto-fill or type address manually">
                        <input type="hidden" id="ownerEditAddress" name="address">
                    </div>
                    <div class="inline-pair" style="margin-bottom:8px;">
                        <div class="form-group">
                            <label for="ownerEditLatitude">Latitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                            <input type="text" id="ownerEditLatitude" name="latitude" placeholder="e.g., 11.4550">
                        </div>
                        <div class="form-group">
                            <label for="ownerEditLongitude">Longitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                            <input type="text" id="ownerEditLongitude" name="longitude" placeholder="e.g., 123.1525">
                        </div>
                    </div>
                    <div id="ownerEditMap" style="height: 300px; border: 2px solid #ddd; border-radius: 5px;"></div>
                    <p class="map-note"><small>Click on the map to set the restaurant location</small></p>
                </div>

                <!-- Supporting Document Attachment (shown when name/address/coordinates/category changed) -->
                <div id="ownerAttachmentSection" style="display:none; margin-top:1.75rem;">
                    <div style="border:2px solid #e74c3c; border-radius:10px; overflow:hidden;">
                        <div style="background:linear-gradient(135deg,#e74c3c,#c0392b); padding:0.75rem 1.1rem; display:flex; align-items:center; gap:0.6rem;">
                            <i class="fas fa-paperclip" style="color:#fff; font-size:1rem;"></i>
                            <span style="color:#fff; font-weight:600; font-size:0.97rem; letter-spacing:0.01em;">Supporting Document</span>
                            <span style="margin-left:auto; background:rgba(255,255,255,0.22); color:#fff; font-size:0.72rem; padding:2px 8px; border-radius:20px; font-weight:500;">Required</span>
                        </div>
                        <div style="background:#fff8f8; padding:1rem 1.1rem 1.1rem;">
                            <p style="margin:0 0 0.9rem; color:#555; font-size:0.875rem; line-height:1.5;">
                                <i class="fas fa-circle-info" style="color:#e74c3c; margin-right:5px;"></i>
                                You are updating a sensitive field (<strong>name</strong>, <strong>address/coordinates</strong>, or <strong>category</strong>). Attaching a document such as a DTI permit, business certificate, or photo proof helps the admin verify your request faster.
                            </p>
                            <label for="ownerAttachmentFile" style="display:block; font-size:0.85rem; font-weight:600; color:#2c3e50; margin-bottom:0.5rem;">Attach Files <span style="font-weight:400; color:#999; font-size:0.8rem;">(up to 6)</span></label>
                            <label for="ownerAttachmentFile" id="ownerAttachmentDropZone" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem; border:2px dashed #f0a0a0; border-radius:8px; padding:1.1rem 1rem; cursor:pointer; background:#fff; transition:border-color 0.2s, background 0.2s;">
                                <i class="fas fa-cloud-arrow-up" style="font-size:1.6rem; color:#e74c3c; opacity:0.8;"></i>
                                <span style="font-size:0.85rem; color:#666;">Click to browse or drag &amp; drop files (up to 6)</span>
                                <input type="file" id="ownerAttachmentFile" name="attachments[]" multiple style="display:none;">
                            </label>
                            <div id="ownerAttachmentPreview" style="margin-top:10px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Sticky footer actions -->
                <div class="sticky-actions">
                    <button type="button" class="btn btn-light" id="cancelOwnerEdit"><i class="fas fa-xmark"></i> Cancel</button>
                    <button type="submit" class="btn-primary"><i class="fas fa-paper-plane"></i> Submit Changes for Approval</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Success/Error Toast -->
<div class="owner-toast" id="ownerToast" style="display:none;">
    <div class="toast-content">
        <i class="fas fa-check-circle toast-icon"></i>
        <span class="toast-message" id="toastMessage"></span>
    </div>
</div>

<script src="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js"></script>
<script>
// Mapbox config - loaded dynamically from api/get_token.php
let OWNER_MAPBOX_TOKEN = null;
const OWNER_MAPBOX_STYLE = 'mapbox://styles/kentts/cmkpgwobm002x01r8gmwofm40';
const OWNER_DEFAULT_CENTER = [11.456453464374693, 123.15114185203521];
let ownerEditMap = null;
let ownerEditMarker = null;
let ownerDashboardMap = null;
let ownerDashboardMapInitialized = false;
let ownerDashboardInitialBounds = null;

// Load Mapbox token from backend
fetch('api/get_token.php')
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            OWNER_MAPBOX_TOKEN = data.token;
            mapboxgl.accessToken = OWNER_MAPBOX_TOKEN;
        }
    })
    .catch(error => console.warn('Could not load Mapbox token:', error));

// Estancia boundary polygon
const ESTANCIA_BOUNDARY = [[123.1042526,11.4309855],[123.1074160,11.4467843],[123.1081655,11.4474309],[123.1084462,11.4491410],[123.1094295,11.4517752],[123.1109281,11.4546401],[123.1106465,11.4562119],[123.1120516,11.4583373],[123.1115827,11.4594932],[123.1135635,11.4619250],[123.1134931,11.4623554],[123.1134294,11.4626074],[123.1135478,11.4628439],[123.1137230,11.4628751],[123.1141804,11.4630847],[123.1142214,11.4632743],[123.1139688,11.4638297],[123.1140780,11.4639100],[123.1143397,11.4636491],[123.1145582,11.4635442],[123.1147221,11.4635799],[123.1150020,11.4638520],[123.1152296,11.4640818],[123.1157531,11.4641375],[123.1160398,11.4643717],[123.1160831,11.4646684],[123.1159413,11.4652128],[123.1157257,11.4654557],[123.1155358,11.4657017],[123.1156677,11.4659635],[123.1160178,11.4661127],[123.1162022,11.4663822],[123.1165530,11.4670698],[123.1168813,11.4677953],[123.1169457,11.4680476],[123.1167687,11.4682779],[123.1164243,11.4685050],[123.1161443,11.4686596],[123.1162602,11.4690791],[123.1164275,11.4694135],[123.1166479,11.4694525],[123.1169348,11.4693287],[123.1170954,11.4692812],[123.1171413,11.4693094],[123.1173515,11.4697071],[123.1173029,11.4699452],[123.1171686,11.4702352],[123.1171659,11.4702904],[123.1171972,11.4703510],[123.1174288,11.4704109],[123.1176695,11.4704393],[123.1178330,11.4707177],[123.1179628,11.4711862],[123.1182024,11.4714780],[123.1184262,11.4720883],[123.1186392,11.4722392],[123.1189684,11.4722366],[123.1197391,11.4720980],[123.1200097,11.4719216],[123.1206503,11.4710865],[123.1208672,11.4710380],[123.1213278,11.4713718],[123.1217678,11.4715564],[123.1218793,11.4717765],[123.1219052,11.4720529],[123.1218160,11.4722480],[123.1214466,11.4726381],[123.1210719,11.4728863],[123.1209560,11.4730724],[123.1211073,11.4735992],[123.1217092,11.4744193],[123.1221083,11.4746306],[123.1225911,11.4747164],[123.1239720,11.4748099],[123.1246769,11.4756111],[123.1256446,11.4758203],[123.1270699,11.4760165],[123.1283399,11.4763287],[123.1297882,11.4766847],[123.1319969,11.4761390],[123.1331863,11.4765583],[123.1335967,11.4773793],[123.1348096,11.4798056],[123.1357388,11.4814079],[123.1370252,11.4820247],[123.1386035,11.4821472],[123.1408559,11.4819246],[123.1419388,11.4825389],[123.1475590,11.4906707],[123.1475582,11.4929820],[123.1487757,11.4952924],[123.1504154,11.4911305],[123.1564713,11.4895831],[123.1718928,11.4780858],[123.1898970,11.4537157],[123.2051710,11.4423615],[123.2150585,11.4330320],[123.2166081,11.4205921],[123.2136566,11.3954213],[123.2077851,11.3949343],[123.1945870,11.3966560],[123.1650257,11.4106524],[123.1592760,11.4200750],[123.1326497,11.4210971],[123.1146958,11.4277925],[123.1042526,11.4309855]];

function ownerIsWithinEstancia(lat, lng) {
    const ring = ESTANCIA_BOUNDARY;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][1], yi = ring[i][0];
        const xj = ring[j][1], yj = ring[j][0];
        if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function ownerReverseGeocode(lat, lng) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${OWNER_MAPBOX_TOKEN}&types=address,poi,place`;
    return fetch(url).then(r => r.json()).then(data => {
        if (!data || !Array.isArray(data.features) || data.features.length === 0) return null;
        const f = data.features[0];
        const ctx = Array.isArray(f.context) ? f.context : [];
        const pick = (prefixes) => ctx.find(c => prefixes.some(p => c.id && c.id.startsWith(p)))?.text;
        const parts = [];
        [pick(['neighborhood.']),pick(['locality.']),pick(['place.']),pick(['district.']),pick(['region.']),pick(['country.'])].forEach(p => { if (p && !parts.includes(p)) parts.push(p); });
        if (parts.length > 0) return parts.join(', ');
        const pn = f.place_name || '';
        if (!pn) return null;
        const segs = pn.split(',').map(s => s.trim()).filter(Boolean);
        return segs.length <= 1 ? pn : segs.slice(1).join(', ');
    }).catch(() => null);
}

function getOwnerCategoryColor(category) {
    const categoryColors = {
        'Fast Food': '#E53935',
        'Casual Dining': '#FB8C00',
        'Fine Dining': '#8E24AA',
        'Café / Coffee Shop': '#6D4C41',
        'Buffet': '#FDD835',
        'Food Truck / Street Food': '#26A69A',
        'Bistro / Brasserie': '#3949AB',
        'Fast Casual': '#43A047',
        'Family Style': '#FBC02D',
        'Pub / Bar & Grill': '#6D4C41'
    };
    return categoryColors[category] || '#E85634';
}

function getOwnerCategoryIconClass(category) {
    const categoryIcons = {
        'Fast Food': 'fa-burger',
        'Casual Dining': 'fa-utensils',
        'Fine Dining': 'fa-wine-glass',
        'Café / Coffee Shop': 'fa-mug-hot',
        'Buffet': 'fa-concierge-bell',
        'Food Truck / Street Food': 'fa-truck',
        'Bistro / Brasserie': 'fa-store',
        'Fast Casual': 'fa-pizza-slice',
        'Family Style': 'fa-users',
        'Pub / Bar & Grill': 'fa-beer-mug-empty'
    };
    return categoryIcons[category] || 'fa-utensils';
}

function ownerHexToRgba(hex, alpha) {
    if (!hex) return `rgba(232, 86, 52, ${alpha})`;
    let normalized = String(hex).trim().replace('#', '');
    if (normalized.length === 3) {
        normalized = normalized.split('').map(ch => ch + ch).join('');
    }
    const int = parseInt(normalized, 16);
    if (!Number.isFinite(int)) return `rgba(232, 86, 52, ${alpha})`;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ensureOwnerDashboardMapInitialized() {
    const mapEl = document.getElementById('ownerDashboardMap');
    if (!mapEl || ownerDashboardMapInitialized) return;
    if (typeof mapboxgl === 'undefined') return;

    ownerDashboardMapInitialized = true;

    try {
        mapboxgl.accessToken = OWNER_MAPBOX_TOKEN;
        ownerDashboardMap = new mapboxgl.Map({
            container: 'ownerDashboardMap',
            style: OWNER_MAPBOX_STYLE,
            center: [OWNER_DEFAULT_CENTER[1], OWNER_DEFAULT_CENTER[0]],
            zoom: 13,
            attributionControl: false
        });

        ownerDashboardMap.dragRotate.disable();
        ownerDashboardMap.touchZoomRotate.disableRotation();

        const addBoundary = () => {
            if (!ownerDashboardMap || ownerDashboardMap.getSource('owner-dash-bnd')) return;
            ownerDashboardMap.addSource('owner-dash-bnd', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'Polygon', coordinates: [ESTANCIA_BOUNDARY] }
                }
            });
            ownerDashboardMap.addLayer({
                id: 'owner-dash-fill',
                type: 'fill',
                source: 'owner-dash-bnd',
                paint: { 'fill-color': '#4285f4', 'fill-opacity': 0.06 }
            });
            ownerDashboardMap.addLayer({
                id: 'owner-dash-line',
                type: 'line',
                source: 'owner-dash-bnd',
                paint: { 'line-color': '#e53935', 'line-width': 2, 'line-opacity': 0.7 }
            });
        };

        ownerDashboardMap.on('style.load', addBoundary);
        if (ownerDashboardMap.isStyleLoaded && ownerDashboardMap.isStyleLoaded()) addBoundary();

        const bounds = new mapboxgl.LngLatBounds();
        let hasMarkers = false;

        ownerRestaurants.forEach((restaurant) => {
            const lat = parseFloat(restaurant.latitude);
            const lng = parseFloat(restaurant.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const pinColor = getOwnerCategoryColor(restaurant.category);
            const rimShadow = ownerHexToRgba(pinColor, 0.12);
            const categoryIconClass = getOwnerCategoryIconClass(restaurant.category);
            const logoUrl = (restaurant.logo && String(restaurant.logo).trim() !== '') ? restaurant.logo : null;
            const markerContent = logoUrl
                ? `<img src="${logoUrl}" alt="${escapeOwnerHtml(restaurant.name || 'Restaurant')} logo" class="marker-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                   <i class="fas ${categoryIconClass}" aria-hidden="true" style="display:none;color:${pinColor};"></i>`
                : `<i class="fas ${categoryIconClass}" aria-hidden="true" style="color:${pinColor};"></i>`;

            const markerEl = document.createElement('div');
            markerEl.className = 'fc-restaurant-marker';
            markerEl.innerHTML = `
                <div class="restaurant-pin">
                    <div class="marker-pin marker-icon-lg" style="background: ${pinColor} !important; box-shadow: none !important; border: 0.5px solid rgba(255,255,255,0.3) !important;">
                        <div class="marker-plate">
                            <span class="plate-rim" style="box-shadow: inset 0 0 0 0.1px ${rimShadow};"></span>
                            <span class="plate-inner"></span>
                            <span class="cutlery">${markerContent}</span>
                        </div>
                    </div>
                </div>
            `;

            const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
                `<strong>${escapeOwnerHtml(restaurant.name || 'Restaurant')}</strong><br><span style="font-size:12px;color:#6b7280;">${escapeOwnerHtml(restaurant.category || '')}</span>`
            );

            new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(ownerDashboardMap);

            bounds.extend([lng, lat]);
            hasMarkers = true;
        });

        if (hasMarkers) {
            ownerDashboardInitialBounds = bounds.toArray();
            ownerDashboardMap.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
        } else {
            ownerDashboardInitialBounds = null;
        }
    } catch (error) {
        ownerDashboardMapInitialized = false;
        ownerDashboardMap = null;
    }
}

function returnOwnerDashboardHome() {
    ensureOwnerDashboardMapInitialized();
    if (!ownerDashboardMap) return;

    if (ownerDashboardInitialBounds && Array.isArray(ownerDashboardInitialBounds)) {
        ownerDashboardMap.fitBounds(ownerDashboardInitialBounds, {
            padding: 60,
            maxZoom: 15,
            duration: 700
        });
        return;
    }

    ownerDashboardMap.easeTo({
        center: [OWNER_DEFAULT_CENTER[1], OWNER_DEFAULT_CENTER[0]],
        zoom: 13,
        duration: 700
    });
}

function ensureOwnerEditMapInitialized() {
    const mapEl = document.getElementById('ownerEditMap');
    if (!mapEl || ownerEditMap) return;
    try {
        mapboxgl.accessToken = OWNER_MAPBOX_TOKEN;
        ownerEditMap = new mapboxgl.Map({
            container: 'ownerEditMap',
            style: OWNER_MAPBOX_STYLE,
            center: [OWNER_DEFAULT_CENTER[1], OWNER_DEFAULT_CENTER[0]],
            zoom: 14,
            attributionControl: false
        });
        ownerEditMap.dragRotate.disable();
        ownerEditMap.touchZoomRotate.disableRotation();
        // Compat shim
        ownerEditMap.setView = function(c, z, o) {
            ownerEditMap.easeTo({ center: [c[1], c[0]], zoom: typeof z === 'number' ? z : ownerEditMap.getZoom(), duration: (o && o.animate === false) ? 0 : 500 });
        };

        // Add Estancia boundary
        const addBoundary = () => {
            if (ownerEditMap.getSource('est-bnd')) return;
            ownerEditMap.addSource('est-bnd', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ESTANCIA_BOUNDARY] } } });
            ownerEditMap.addLayer({ id: 'est-fill', type: 'fill', source: 'est-bnd', paint: { 'fill-color': '#4285f4', 'fill-opacity': 0.06 } });
            ownerEditMap.addLayer({ id: 'est-line', type: 'line', source: 'est-bnd', paint: { 'line-color': '#e53935', 'line-width': 2, 'line-opacity': 0.7 } });
        };
        ownerEditMap.on('style.load', addBoundary);
        if (ownerEditMap.isStyleLoaded && ownerEditMap.isStyleLoaded()) addBoundary();

        // Click handler
        ownerEditMap.on('click', function(e) {
            if (!ownerIsWithinEstancia(e.lngLat.lat, e.lngLat.lng)) {
                showToast('The pin must be placed within Estancia, Iloilo only.', 'error');
                return;
            }
            setOwnerEditMarker(e.lngLat.lat, e.lngLat.lng);
            document.getElementById('ownerEditLatitude').value = e.lngLat.lat;
            document.getElementById('ownerEditLongitude').value = e.lngLat.lng;
            checkOwnerAttachmentVisibility();
            ownerReverseGeocode(e.lngLat.lat, e.lngLat.lng).then(addr => {
                if (addr) {
                    document.getElementById('ownerMapAddressBar').value = addr;
                    document.getElementById('ownerEditAddress').value = addr;
                    checkOwnerAttachmentVisibility();
                }
            });
        });

        // Lat/lng input listeners
        const latI = document.getElementById('ownerEditLatitude');
        const lngI = document.getElementById('ownerEditLongitude');
        const tryParse = () => {
            const la = parseFloat(latI?.value), lo = parseFloat(lngI?.value);
            if (Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) {
                if (!ownerIsWithinEstancia(la, lo)) { showToast('Coordinates must be within Estancia, Iloilo', 'error'); return; }
                setOwnerEditMarker(la, lo);
                ownerEditMap.setView([la, lo], 14);
            }
        };
        if (latI && lngI) {
            latI.addEventListener('input', tryParse);
            lngI.addEventListener('input', tryParse);
            latI.addEventListener('paste', () => setTimeout(tryParse, 50));
            lngI.addEventListener('paste', () => setTimeout(tryParse, 50));
        }

        setTimeout(() => { try { ownerEditMap.resize(); } catch(e){} }, 100);
    } catch(e) {
        console.error('Failed to init owner edit map:', e);
    }
}

// Sync address bar to hidden address field
document.getElementById('ownerMapAddressBar')?.addEventListener('input', function() {
    document.getElementById('ownerEditAddress').value = this.value;
});

function setOwnerEditMarker(lat, lng) {
    if (!ownerEditMap) return;
    if (ownerEditMarker) { try { ownerEditMarker.remove(); } catch(e){} }
    const categoryColors = { 'Fast Food':'#E53935','Casual Dining':'#FB8C00','Fine Dining':'#6A1B9A','Café / Coffee Shop':'#8D6E63','Buffet':'#FBC02D','Food Truck / Street Food':'#00897B','Bistro / Brasserie':'#3949AB','Fast Casual':'#43A047','Family Style':'#FDD835','Pub / Bar & Grill':'#5D4037' };
    const sel = document.getElementById('ownerEditCategory');
    const cat = sel ? sel.value : null;
    const color = categoryColors[cat] || '#E85634';
    const catIcons = { 'Pub / Bar & Grill':'fa-beer-mug-empty','Fast Casual':'fa-pizza-slice','Bistro / Brasserie':'fa-store','Food Truck / Street Food':'fa-truck','Café / Coffee Shop':'fa-mug-hot','Fine Dining':'fa-wine-glass','Fast Food':'fa-burger','Casual Dining':'fa-utensils','Buffet':'fa-concierge-bell','Family Style':'fa-users' };
    const icon = catIcons[cat] || 'fa-utensils';
    const el = document.createElement('div');
    el.innerHTML = `<div class="restaurant-pin"><div class="marker-pin marker-icon-lg" style="background:${color};box-shadow:0 4px 12px rgba(0,0,0,0.15);border:1px solid #fff;"><div class="marker-plate"><span class="plate-rim"></span><span class="plate-inner"></span><span class="cutlery"><i class="fas ${icon}" style="color:${color};"></i></span></div></div></div>`;
    ownerEditMarker = new mapboxgl.Marker({ element: el.firstElementChild, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(ownerEditMap);
    document.getElementById('ownerEditLatitude').value = lat;
    document.getElementById('ownerEditLongitude').value = lng;
    checkOwnerAttachmentVisibility();
    try { ownerEditMap.setView([lat, lng], Math.max(ownerEditMap.getZoom() || 14, 14)); } catch(e){}
}

const ownerEditState = {
    originalImages: [],
    removedImages: [],
    newImageFiles: [],
    originalMenuImages: [],
    removedMenuImages: [],
    newMenuFiles: [],
    originalLogo: '',
    categoryColor: '#ff6b5a',
    removeLogo: false,
    newLogoFile: null
};

let ownerAttachmentFiles = [];
const OWNER_MAX_ATTACHMENTS = 6;

function normalizePath(path) {
    if (!path) return '';
    return String(path).replace(/^\.\//, '');
}

function getOwnerCategoryColor(category, storedColor) {
    const categoryColorMap = {
        'Fast Food': '#E53935',
        'Casual Dining': '#FB8C00',
        'Fine Dining': '#6A1B9A',
        'Café / Coffee Shop': '#8D6E63',
        'Buffet': '#FBC02D',
        'Food Truck / Street Food': '#00897B',
        'Bistro / Brasserie': '#3949AB',
        'Fast Casual': '#43A047',
        'Family Style': '#FDD835',
        'Pub / Bar & Grill': '#5D4037'
    };
    return categoryColorMap[category] || storedColor || '#E85634';
}

function initOwnerImageState(restaurant) {
    ownerEditState.categoryColor = getOwnerCategoryColor(restaurant.category, restaurant.category_color);

    ownerEditState.originalImages = Array.isArray(restaurant.image_paths) ? restaurant.image_paths.slice() : [];
    if (typeof restaurant.image_paths === 'string') {
        try { ownerEditState.originalImages = JSON.parse(restaurant.image_paths) || []; } catch(e) { ownerEditState.originalImages = []; }
    }
    ownerEditState.originalImages = ownerEditState.originalImages.filter(p => p && p.trim()).map(normalizePath);
    if (ownerEditState.originalImages.length === 0 && restaurant.image_path) {
        ownerEditState.originalImages = [normalizePath(restaurant.image_path)];
    }
    ownerEditState.removedImages = [];
    ownerEditState.newImageFiles = [];

    ownerEditState.originalMenuImages = [];
    if (restaurant.menu_image) {
        try {
            const parsed = typeof restaurant.menu_image === 'string' ? JSON.parse(restaurant.menu_image) : restaurant.menu_image;
            ownerEditState.originalMenuImages = Array.isArray(parsed) ? parsed.slice() : [parsed];
        } catch(e) {
            ownerEditState.originalMenuImages = [restaurant.menu_image];
        }
    }
    ownerEditState.originalMenuImages = ownerEditState.originalMenuImages.filter(p => p && p.trim()).map(normalizePath);
    ownerEditState.removedMenuImages = [];
    ownerEditState.newMenuFiles = [];

    ownerEditState.originalLogo = normalizePath(restaurant.logo || '');
    if (!ownerEditState.originalLogo && restaurant.image_path) {
        ownerEditState.originalLogo = normalizePath(restaurant.image_path);
    }
    ownerEditState.removeLogo = false;
    ownerEditState.newLogoFile = null;

    const logoInput = document.getElementById('ownerLogoInput');
    const imgInput = document.getElementById('ownerImageUpload');
    const menuInput = document.getElementById('ownerMenuImages');
    if (logoInput) logoInput.value = '';
    if (imgInput) imgInput.value = '';
    if (menuInput) menuInput.value = '';

    renderOwnerLogoPreview();
    renderOwnerMenuPreview();
    renderOwnerPicturesPreview();
}

function renderOwnerLogoPreview() {
    const container = document.getElementById('ownerLogoPreviewContainer');
    if (!container) return;
    container.innerHTML = '';
    const iconColor = ownerEditState.categoryColor || '#ff6b5a';

    let logoUrl = ownerEditState.originalLogo;
    if (ownerEditState.removeLogo) logoUrl = '';
    if (ownerEditState.newLogoFile) {
        logoUrl = URL.createObjectURL(ownerEditState.newLogoFile);
    }

    if (!logoUrl) {
        container.innerHTML = `<div class="owner-logo-fallback" aria-label="No logo uploaded"><i class="fas fa-burger" aria-hidden="true" style="color:${iconColor};"></i></div>`;
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'image-preview';
    wrapper.innerHTML = `
        <img src="${logoUrl}" alt="Logo">
        <button type="button" class="remove-image" aria-label="Remove logo">&times;</button>
    `;
    wrapper.querySelector('.remove-image').addEventListener('click', function() {
        ownerEditState.newLogoFile = null;
        ownerEditState.removeLogo = true;
        renderOwnerLogoPreview();
    });
    container.appendChild(wrapper);
}

function renderOwnerMenuPreview() {
    const container = document.getElementById('ownerMenuImagePreviewContainer');
    const counter = document.getElementById('ownerMenuImageCounter');
    if (!container) return;
    container.innerHTML = '';

    const keptExisting = ownerEditState.originalMenuImages.filter(p => !ownerEditState.removedMenuImages.includes(p));
    keptExisting.forEach((p) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview';
        wrapper.innerHTML = `
            <img src="${p}" alt="Menu image">
            <button type="button" class="remove-image" aria-label="Remove menu image">&times;</button>
        `;
        wrapper.querySelector('.remove-image').addEventListener('click', function() {
            ownerEditState.removedMenuImages.push(p);
            renderOwnerMenuPreview();
        });
        container.appendChild(wrapper);
    });

    ownerEditState.newMenuFiles.forEach((file, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview';
        wrapper.innerHTML = `
            <img src="${URL.createObjectURL(file)}" alt="New menu image">
            <button type="button" class="remove-image" aria-label="Remove menu image">&times;</button>
        `;
        wrapper.querySelector('.remove-image').addEventListener('click', function() {
            ownerEditState.newMenuFiles.splice(idx, 1);
            renderOwnerMenuPreview();
        });
        container.appendChild(wrapper);
    });

    const total = keptExisting.length + ownerEditState.newMenuFiles.length;
    if (counter) counter.textContent = `${total}/10 selected`;
    if (total < 10) {
        const addTile = document.createElement('div');
        addTile.className = 'image-add';
        addTile.id = 'ownerMenuImageAddTile';
        addTile.innerHTML = `
            <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('ownerMenuImages').click()" aria-label="Add menu images">
                <i class="fas fa-plus" aria-hidden="true"></i>
            </button>
        `;
        container.appendChild(addTile);
    }
}

function renderOwnerPicturesPreview() {
    const container = document.getElementById('ownerImagePreviewContainer');
    const counter = document.getElementById('ownerImageCounter');
    if (!container) return;
    container.innerHTML = '';

    const keptExisting = ownerEditState.originalImages.filter(p => !ownerEditState.removedImages.includes(p));
    keptExisting.forEach((p) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview';
        wrapper.innerHTML = `
            <img src="${p}" alt="Restaurant image">
            <button type="button" class="remove-image" aria-label="Remove image">&times;</button>
        `;
        wrapper.querySelector('.remove-image').addEventListener('click', function() {
            ownerEditState.removedImages.push(p);
            renderOwnerPicturesPreview();
        });
        container.appendChild(wrapper);
    });

    ownerEditState.newImageFiles.forEach((file, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview';
        wrapper.innerHTML = `
            <img src="${URL.createObjectURL(file)}" alt="New restaurant image">
            <button type="button" class="remove-image" aria-label="Remove image">&times;</button>
        `;
        wrapper.querySelector('.remove-image').addEventListener('click', function() {
            ownerEditState.newImageFiles.splice(idx, 1);
            renderOwnerPicturesPreview();
        });
        container.appendChild(wrapper);
    });

    const total = keptExisting.length + ownerEditState.newImageFiles.length;
    if (counter) counter.textContent = `${total}/5 selected`;
    if (total < 5) {
        const addTile = document.createElement('div');
        addTile.className = 'image-add';
        addTile.id = 'ownerImageAddTile';
        addTile.innerHTML = `
            <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('ownerImageUpload').click()" aria-label="Add images">
                <i class="fas fa-plus" aria-hidden="true"></i>
            </button>
        `;
        container.appendChild(addTile);
    }
}

// Wire file inputs
document.getElementById('ownerImageUpload')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    ownerEditState.newImageFiles = ownerEditState.newImageFiles.concat(files).slice(0, 5);
    e.target.value = '';
    renderOwnerPicturesPreview();
});

document.getElementById('ownerMenuImages')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    ownerEditState.newMenuFiles = ownerEditState.newMenuFiles.concat(files).slice(0, 10);
    e.target.value = '';
    renderOwnerMenuPreview();
});

document.getElementById('ownerLogoInput')?.addEventListener('change', function(e) {
    const file = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
    if (!file) return;
    ownerEditState.newLogoFile = file;
    ownerEditState.removeLogo = false;
    e.target.value = '';
    renderOwnerLogoPreview();
});

function setupOwnerPhoneOptionalButtons() {
    const buttons = document.querySelectorAll('.phone-optional-btn[data-target]');
    if (!buttons.length) return;

    const setOptionalState = (input, button, optional) => {
        const asterisk = input.closest('.form-group')?.querySelector('.required-asterisk');
        if (optional) {
            input.required = false;
            input.value = '';
            input.setCustomValidity('');
            button.classList.add('is-optional');
            button.textContent = 'Phone not provided';
            button.setAttribute('aria-pressed', 'true');
            if (asterisk) asterisk.style.visibility = 'hidden';
        } else {
            input.required = true;
            button.classList.remove('is-optional');
            button.textContent = 'Not provided';
            button.setAttribute('aria-pressed', 'false');
            if (asterisk) asterisk.style.visibility = '';
        }
    };

    buttons.forEach(button => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        setOptionalState(input, button, !input.required);

        button.addEventListener('click', () => {
            const isOptional = button.classList.contains('is-optional');
            setOptionalState(input, button, !isOptional);
        });
    });
}

function registerOwnerPhoneValidation() {
    const input = document.getElementById('ownerEditPhone');
    if (!input) return;
    if (input.dataset.validationBound === '1') return;
    input.dataset.validationBound = '1';

    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('maxlength', '11');
    input.setAttribute('pattern', '\\d{11}');

    input.addEventListener('input', function () {
        const cleaned = this.value.replace(/\D+/g, '').slice(0, 11);
        if (this.value !== cleaned) this.value = cleaned;
        this.setCustomValidity('');
    });

    input.addEventListener('blur', function () {
        if (this.value.length === 0) {
            this.setCustomValidity('');
            return;
        }
        if (this.value.length !== 11) this.setCustomValidity('Phone number must be 11 digits');
        else this.setCustomValidity('');
    });

    input.addEventListener('invalid', function () {
        if (this.value.length === 0) return;
        this.setCustomValidity('Phone number must be 11 digits and contain numbers only');
    });
}

// Restaurant data from PHP
const ownerRestaurants = <?php echo json_encode($restaurants); ?>;

function escapeOwnerHtml(value) {
    const div = document.createElement('div');
    div.textContent = value === null || value === undefined ? '' : String(value);
    return div.innerHTML;
}

function formatOwnerDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function getOwnerNotifIcon(type) {
    if (type === 'approved') return 'fa-check-circle';
    if (type === 'rejected') return 'fa-times-circle';
    return 'fa-info-circle';
}

function updateOwnerNotificationsBadge(unreadCount) {
    const badge = document.getElementById('ownerNotificationsBadge');
    if (!badge) return;
    const count = Number(unreadCount || 0);
    if (count > 0) {
        badge.textContent = String(count);
        badge.style.display = '';
    } else {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

function renderOwnerNotifications(notifications) {
    const content = document.getElementById('ownerNotificationsContent');
    if (!content) return;

    const list = Array.isArray(notifications) ? notifications : [];
    const deleteAllBtn = document.getElementById('ownerDeleteAllNotificationsBtn');

    if (list.length === 0) {
        if (deleteAllBtn) deleteAllBtn.remove();
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications</h3>
                <p>You'll receive notifications when admin reviews your changes.</p>
            </div>
        `;
        return;
    }

    if (!deleteAllBtn) {
        const row = document.querySelector('#tab-notifications .tab-header-row');
        if (row) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'ownerDeleteAllNotificationsBtn';
            btn.className = 'owner-delete-all-btn';
            btn.onclick = function() { deleteAllOwnerNotifications(this); };
            btn.innerHTML = '<i class="fas fa-trash"></i> Delete All';
            row.appendChild(btn);
        }
    }

    content.innerHTML = `
        <div class="notif-full-list" id="ownerNotificationsList">
            ${list.map(notif => {
                const type = notif && notif.type ? String(notif.type) : 'info';
                const isRead = Number(notif && notif.is_read ? notif.is_read : 0) === 1;
                const message = escapeOwnerHtml(notif && notif.message ? notif.message : '');
                const createdAt = formatOwnerDate(notif && notif.created_at ? notif.created_at : '');
                const notifId = Number(notif && notif.id ? notif.id : 0);
                return `
                    <div class="notif-full-item ${isRead ? 'read' : 'unread'} ${escapeOwnerHtml(type)}" data-notification-id="${notifId}">
                        <div class="notif-full-icon ${escapeOwnerHtml(type)}">
                            <i class="fas ${getOwnerNotifIcon(type)}"></i>
                        </div>
                        <div class="notif-full-content">
                            <p class="notif-full-message">${message}</p>
                            <span class="notif-full-time"><i class="fas fa-clock"></i> ${escapeOwnerHtml(createdAt)}</span>
                        </div>
                        <button type="button" class="owner-item-delete" onclick="deleteOwnerNotification(${notifId}, this)" aria-label="Delete notification" title="Delete notification">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderOwnerChangeHistory(history) {
    const content = document.getElementById('ownerChangeHistoryContent');
    if (!content) return;

    const list = Array.isArray(history) ? history : [];
    const deleteAllBtn = document.getElementById('ownerDeleteAllHistoryBtn');

    if (list.length === 0) {
        if (deleteAllBtn) deleteAllBtn.remove();
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No changes submitted yet</h3>
                <p>Edit your restaurant information to see change history here.</p>
            </div>
        `;
        return;
    }

    if (!deleteAllBtn) {
        const row = document.querySelector('#tab-change-history .tab-header-row');
        if (row) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'ownerDeleteAllHistoryBtn';
            btn.className = 'owner-delete-all-btn';
            btn.onclick = function() { deleteAllOwnerHistory(this); };
            btn.innerHTML = '<i class="fas fa-trash"></i> Delete All';
            row.appendChild(btn);
        }
    }

    content.innerHTML = `
        <div class="change-history-list" id="ownerChangeHistoryList">
            ${list.map(change => {
                const status = change && change.status ? String(change.status) : 'pending';
                const statusLabel = status === 'approved' ? '<span class="ch-badge approved"><i class="fas fa-check"></i> Approved</span>' : (status === 'rejected' ? '<span class="ch-badge rejected"><i class="fas fa-times"></i> Rejected</span>' : '<span class="ch-badge pending"><i class="fas fa-clock"></i> Pending</span>');
                const restaurantName = escapeOwnerHtml(change && change.restaurant_name ? change.restaurant_name : 'Restaurant');
                const changeId = Number(change && change.id ? change.id : 0);
                const createdAt = formatOwnerDate(change && change.created_at ? change.created_at : '');

                let fieldsHtml = '';
                try {
                    const parsed = JSON.parse(change && change.changes_json ? change.changes_json : '{}');
                    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                        fieldsHtml = `<div class="ch-fields"><strong>Fields changed:</strong> ${escapeOwnerHtml(Object.keys(parsed).join(', '))}</div>`;
                    }
                } catch (e) {}

                const notes = change && change.admin_notes ? `<div class="ch-notes"><strong>Admin notes:</strong> ${escapeOwnerHtml(change.admin_notes)}</div>` : '';

                return `
                    <div class="change-history-item status-${escapeOwnerHtml(status)}" data-change-id="${changeId}">
                        <div class="ch-status">${statusLabel}</div>
                        <div class="ch-details">
                            <div class="ch-headline">
                                <h4>${restaurantName}</h4>
                                <button type="button" class="owner-item-delete" onclick="deleteOwnerHistory(${changeId}, this)" aria-label="Delete history item" title="Delete history item">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <span class="ch-date"><i class="fas fa-calendar"></i> ${escapeOwnerHtml(createdAt)}</span>
                            ${fieldsHtml}
                            ${notes}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function markRestaurantCardPending(restaurantId) {
    const card = document.querySelector(`.orc-detail-card[data-id="${restaurantId}"]`);
    if (!card) return;
    const title = card.querySelector('.orc-detail-title');
    if (!title) return;
    if (title.querySelector('.orc-pending-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'orc-pending-badge';
    badge.innerHTML = '<i class="fas fa-clock"></i> Pending Changes';
    title.appendChild(badge);
}

function unmarkRestaurantCardPending(restaurantId) {
    const card = document.querySelector(`.orc-detail-card[data-id="${restaurantId}"]`);
    if (!card) return;
    const title = card.querySelector('.orc-detail-title');
    if (!title) return;
    const badge = title.querySelector('.orc-pending-badge');
    if (badge) badge.remove();
}

function setOwnerDashboardCount(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const num = Number(value || 0);
    el.textContent = String(Number.isFinite(num) ? num : 0);
}

function syncOwnerPendingUIFromHistory(history) {
    const list = Array.isArray(history) ? history : [];
    const pendingRestaurantIds = new Set();
    let pendingCount = 0;
    let approvedCount = 0;

    list.forEach(entry => {
        const status = entry && entry.status ? String(entry.status) : '';
        if (status === 'pending') {
            pendingCount++;
            if (entry.restaurant_id !== null && entry.restaurant_id !== undefined) {
                pendingRestaurantIds.add(String(entry.restaurant_id));
            }
        } else if (status === 'approved') {
            approvedCount++;
        }
    });

    // Update dashboard counters
    setOwnerDashboardCount('ownerPendingChangesCount', pendingCount);
    setOwnerDashboardCount('ownerApprovedChangesCount', approvedCount);

    // Update pending badge on each restaurant card
    document.querySelectorAll('.orc-detail-card[data-id]').forEach(card => {
        const id = String(card.getAttribute('data-id') || '');
        if (!id) return;
        if (pendingRestaurantIds.has(id)) {
            markRestaurantCardPending(id);
        } else {
            unmarkRestaurantCardPending(id);
        }
    });
}

async function refreshOwnerLiveData(silent = true) {
    try {
        const [notificationsResp, historyResp] = await Promise.all([
            fetch('api/owner_restaurants.php?action=get_notifications', { cache: 'no-store' }),
            fetch('api/owner_restaurants.php?action=get_change_history', { cache: 'no-store' })
        ]);

        const notificationsData = await notificationsResp.json();
        const historyData = await historyResp.json();

        if (notificationsData && notificationsData.success) {
            renderOwnerNotifications(notificationsData.notifications || []);
            updateOwnerNotificationsBadge(notificationsData.unread_count || 0);
            setOwnerDashboardCount('ownerUnreadNotificationsCount', notificationsData.unread_count || 0);
        }

        if (historyData && historyData.success) {
            renderOwnerChangeHistory(historyData.history || []);
            syncOwnerPendingUIFromHistory(historyData.history || []);
        }
    } catch (error) {
        if (!silent) {
            showToast('Unable to refresh updates right now', 'error');
        }
    }
}

// Tab switching
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(t => {
            t.style.display = 'none';
            t.classList.remove('active');
        });
        
        const tabId = 'tab-' + this.dataset.tab;
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.style.display = 'block';
            tab.classList.add('active');
        }

        if (this.dataset.tab === 'dashboard') {
            ensureOwnerDashboardMapInitialized();
            if (ownerDashboardMap && typeof ownerDashboardMap.resize === 'function') {
                setTimeout(() => ownerDashboardMap.resize(), 80);
            }
        }

        if (this.dataset.tab === 'notifications' || this.dataset.tab === 'change-history') {
            refreshOwnerLiveData(true);
        }
    });
});

document.querySelectorAll('[data-owner-go-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabKey = this.getAttribute('data-owner-go-tab');
        if (!tabKey) return;
        const menuItem = document.querySelector(`.menu-item[data-tab="${tabKey}"]`);
        if (menuItem) menuItem.click();
    });

    btn.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        this.click();
    });
});

// Sidebar mode management
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileMenuBtn = document.getElementById('ownerMobileMenuBtn');
    const mobileOverlay = document.getElementById('ownerSidebarOverlay');

    const resizeOwnerMaps = () => {
        try {
            if (ownerEditMap) {
                if (typeof ownerEditMap.resize === 'function') ownerEditMap.resize();
                else if (typeof ownerEditMap.invalidateSize === 'function') ownerEditMap.invalidateSize();
            }
            if (ownerDashboardMap && typeof ownerDashboardMap.resize === 'function') {
                ownerDashboardMap.resize();
            }
        } catch (e) { /* ignore */ }
    };

    // --- Sidebar Mode Management ---
    let currentMode = 'hover';
    let hoverLeaveTimer = null;

    const applySidebarMode = (mode, save) => {
        if (save === undefined) save = true;
        currentMode = mode;
        document.body.classList.remove(
            'admin-sidebar-collapsed',
            'admin-sidebar-hover-mode',
            'admin-sidebar-hovering'
        );
        if (mode === 'collapsed') {
            document.body.classList.add('admin-sidebar-collapsed');
        } else if (mode === 'hover') {
            document.body.classList.add('admin-sidebar-collapsed', 'admin-sidebar-hover-mode');
        }
        if (save) {
            try { localStorage.setItem('ownerSidebarMode', mode); } catch (e) {}
        }
        document.querySelectorAll('.sidebar-ctrl-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.mode === mode);
        });
        resizeOwnerMaps();
        setTimeout(resizeOwnerMaps, 260);
    };

    try { currentMode = localStorage.getItem('ownerSidebarMode') || 'hover'; } catch (e) {}
    applySidebarMode(currentMode, false);

    if (sidebar) {
        sidebar.addEventListener('mouseenter', () => {
            if (currentMode !== 'hover') return;
            clearTimeout(hoverLeaveTimer);
            document.body.classList.add('admin-sidebar-hovering');
            resizeOwnerMaps();
            setTimeout(resizeOwnerMaps, 260);
        });
        sidebar.addEventListener('mouseleave', () => {
            if (currentMode !== 'hover') return;
            hoverLeaveTimer = setTimeout(() => {
                document.body.classList.remove('admin-sidebar-hovering');
                resizeOwnerMaps();
                setTimeout(resizeOwnerMaps, 350);
            }, 200);
        });
    }

    // Sidebar Control Modal
    const ctrlBtn = document.getElementById('ownerSidebarCtrlBtn');
    const ctrlModal = document.getElementById('ownerSidebarCtrlModal');
    if (ctrlBtn && ctrlModal) {
        ctrlBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = ctrlModal.style.display !== 'none';
            ctrlModal.style.display = isOpen ? 'none' : 'block';
        });
        ctrlModal.querySelectorAll('.sidebar-ctrl-opt').forEach(opt => {
            opt.addEventListener('click', function () {
                applySidebarMode(this.dataset.mode);
                ctrlModal.style.display = 'none';
            });
        });
        document.addEventListener('click', function (e) {
            if (ctrlModal.style.display !== 'none' &&
                !ctrlModal.contains(e.target) &&
                e.target !== ctrlBtn &&
                !ctrlBtn.contains(e.target)) {
                ctrlModal.style.display = 'none';
            }
        });
    }

    const isMobile = () => window.innerWidth <= 720;

    const closeMobileSidebar = () => {
        document.body.classList.remove('owner-sidebar-open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        if (mobileOverlay) mobileOverlay.style.display = 'none';
    };

    const openMobileSidebar = () => {
        document.body.classList.add('owner-sidebar-open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
        if (mobileOverlay) mobileOverlay.style.display = 'block';
    };

    const applyMobileState = () => {
        if (isMobile()) {
            document.body.classList.add('owner-sidebar-mobile');
            applySidebarMode('expanded', false);
            closeMobileSidebar();
        } else {
            document.body.classList.remove('owner-sidebar-mobile');
            // Restore stored mode when returning to desktop
            let stored = 'hover';
            try { stored = localStorage.getItem('ownerSidebarMode') || 'hover'; } catch (e) {}
            applySidebarMode(stored, false);
            closeMobileSidebar();
            if (mobileOverlay) mobileOverlay.style.display = 'none';
        }
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const open = document.body.classList.contains('owner-sidebar-open');
            if (open) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileSidebar);
    }

    document.querySelectorAll('.admin-menu .menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (isMobile()) closeMobileSidebar();
        });
    });

    applyMobileState();
    window.addEventListener('resize', applyMobileState);

    window.addEventListener('resize', resizeOwnerMaps);

    registerOwnerPhoneValidation();
    setupOwnerPhoneOptionalButtons();
    ensureOwnerDashboardMapInitialized();

    refreshOwnerLiveData(true);
    setInterval(() => {
        if (!document.hidden) {
            refreshOwnerLiveData(true);
        }
    }, 1000);
});

// Open edit modal
function openEditModal(restaurantId) {
    const restaurant = ownerRestaurants.find(r => r.id == restaurantId);
    if (!restaurant) return;
    
    document.getElementById('ownerEditId').value = restaurant.id;
    document.getElementById('ownerEditName').value = restaurant.name || '';
    document.getElementById('ownerEditDescription').value = restaurant.description || '';
    document.getElementById('ownerEditAddress').value = restaurant.address || '';
    document.getElementById('ownerMapAddressBar').value = restaurant.address || '';
    document.getElementById('ownerEditLatitude').value = restaurant.latitude || '';
    document.getElementById('ownerEditLongitude').value = restaurant.longitude || '';
    document.getElementById('ownerEditPhone').value = restaurant.phone || '';
    document.getElementById('ownerEditEmail').value = restaurant.email || '';
    document.getElementById('ownerEditFacebookName').value = restaurant.facebook_name || '';
    document.getElementById('ownerEditFacebook').value = restaurant.facebook_page || '';
    document.getElementById('ownerEditMenuItems').value = restaurant.menu_items || '';
    populateFullMenuItems('ownerFullMenuItemsList', restaurant.full_menu);
    document.getElementById('ownerEditPriceRange').value = restaurant.price_range || '';
    document.getElementById('ownerEditSeating').value = restaurant.seating_capacity || '';
    
    // Set select value for category
    setSelectValue('ownerEditCategory', restaurant.category || '');
    
    // Set radio buttons
    setRadioValue('owner_reservation_needed', restaurant.reservation_needed || '');
    setRadioValue('owner_parking_availability', restaurant.parking_availability || '');
    setRadioValue('owner_wifi_availability', restaurant.wifi_availability || '');
    
    // Set checkbox groups
    setCheckboxGroup('owner_payment_methods[]', restaurant.payment_methods || '');
    setCheckboxGroup('owner_delivery_options[]', restaurant.delivery_options || '');
    setCheckboxGroup('owner_accessibility[]', restaurant.accessibility || '');

    // Initialize media previews
    initOwnerImageState(restaurant);
    
    // Set business hours
    const allDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    if (restaurant.hours) {
        try {
            const hours = typeof restaurant.hours === 'string' ? JSON.parse(restaurant.hours) : restaurant.hours;
            allDays.forEach(day => {
                const dayData = hours[day];
                if (dayData) {
                    const openInput = document.getElementById('owner' + day + 'Open');
                    const closeInput = document.getElementById('owner' + day + 'Close');
                    const closedCheck = document.getElementById('owner' + day + 'Closed');
                    if (openInput) openInput.value = dayData.open || '';
                    if (closeInput) closeInput.value = dayData.close || '';
                    if (closedCheck) closedCheck.checked = dayData.closed || false;
                }
            });
        } catch(e) {}
    } else {
        // Clear all hours fields
        allDays.forEach(day => {
            const openInput = document.getElementById('owner' + day + 'Open');
            const closeInput = document.getElementById('owner' + day + 'Close');
            const closedCheck = document.getElementById('owner' + day + 'Closed');
            if (openInput) openInput.value = '';
            if (closeInput) closeInput.value = '';
            if (closedCheck) closedCheck.checked = false;
        });
    }
    
    const modal = document.getElementById('ownerEditModal');
    modal.style.display = 'flex';

    // Reset attachment section
    const attachSection = document.getElementById('ownerAttachmentSection');
    if (attachSection) attachSection.style.display = 'none';
    clearOwnerAttachment();

    // Wire change listeners (remove old, add new)
    const attachTriggers = [
        { id: 'ownerEditName', evt: 'input' },
        { id: 'ownerEditCategory', evt: 'change' },
        { id: 'ownerEditLatitude', evt: 'input' },
        { id: 'ownerEditLongitude', evt: 'input' },
        { id: 'ownerMapAddressBar', evt: 'input' }
    ];
    attachTriggers.forEach(({ id, evt }) => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener(evt, checkOwnerAttachmentVisibility);
            el.addEventListener(evt, checkOwnerAttachmentVisibility);
        }
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });

    // Initialize map and set marker
    setTimeout(() => {
        ensureOwnerEditMapInitialized();
        if (ownerEditMap) {
            setTimeout(() => { try { ownerEditMap.resize(); } catch(e){} }, 200);
            const lat = parseFloat(restaurant.latitude);
            const lng = parseFloat(restaurant.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setOwnerEditMarker(lat, lng);
            } else {
                // Clear old marker
                if (ownerEditMarker) { try { ownerEditMarker.remove(); } catch(e){} ownerEditMarker = null; }
                ownerEditMap.setView(OWNER_DEFAULT_CENTER, 14, { animate: false });
            }
        }
    }, 100);
}

function setSelectValue(id, value) {
    const select = document.getElementById(id);
    if (!select) return;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value || select.options[i].text === value) {
            select.selectedIndex = i;
            return;
        }
    }
}

function setRadioValue(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.checked = (r.value === value);
    });
}

function setCheckboxGroup(name, value) {
    // value can be a JSON array string like '["Cash","GCash"]' or comma-separated
    let values = [];
    if (value) {
        try {
            values = JSON.parse(value);
            if (!Array.isArray(values)) values = [value];
        } catch(e) {
            values = value.split(',').map(v => v.trim());
        }
    }
    document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
        cb.checked = values.includes(cb.value);
    });
}

function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function getCheckboxGroupValue(name) {
    const checked = [];
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(cb => {
        checked.push(cb.value);
    });
    return checked.length > 0 ? JSON.stringify(checked) : '';
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('ownerEditModal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 350);
}

// Show/hide attachment section when name, address, coordinates, or category change
function checkOwnerAttachmentVisibility() {
    const section = document.getElementById('ownerAttachmentSection');
    if (!section) return;
    const restaurantId = document.getElementById('ownerEditId').value;
    const restaurant = ownerRestaurants.find(r => r.id == restaurantId);
    if (!restaurant) { section.style.display = 'none'; return; }

    const nameChanged = document.getElementById('ownerEditName').value.trim() !== String(restaurant.name || '').trim();
    const categoryChanged = document.getElementById('ownerEditCategory').value !== String(restaurant.category || '');
    const latChanged = parseFloat(document.getElementById('ownerEditLatitude').value || '') !== parseFloat(restaurant.latitude || 0);
    const lngChanged = parseFloat(document.getElementById('ownerEditLongitude').value || '') !== parseFloat(restaurant.longitude || 0);
    const addressChanged = (document.getElementById('ownerEditAddress').value || '').trim() !== String(restaurant.address || '').trim();

    if (nameChanged || categoryChanged || latChanged || lngChanged || addressChanged) {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
        // Clear attachment when section hides so it isn't sent
        clearOwnerAttachment();
    }
}

// ---- Multi-file attachment (up to 6) ----
function renderOwnerAttachmentPreviews() {
    const preview = document.getElementById('ownerAttachmentPreview');
    const dropZone = document.getElementById('ownerAttachmentDropZone');
    if (!preview) return;

    if (ownerAttachmentFiles.length === 0) {
        preview.innerHTML = '';
        if (dropZone) {
            dropZone.style.borderColor = '#f0a0a0';
            dropZone.style.background = '#fff';
            const span = dropZone.querySelector('span');
            if (span) span.textContent = 'Click to browse or drag & drop files (up to 6)';
            const icon = dropZone.querySelector('i');
            if (icon) { icon.className = 'fas fa-cloud-arrow-up'; icon.style.color = '#e74c3c'; icon.style.opacity = '0.8'; }
        }
        return;
    }

    if (dropZone) {
        const remaining = OWNER_MAX_ATTACHMENTS - ownerAttachmentFiles.length;
        const span = dropZone.querySelector('span');
        if (span) span.textContent = ownerAttachmentFiles.length + '/' + OWNER_MAX_ATTACHMENTS + ' file(s) selected' + (remaining > 0 ? ' — click to add more' : ' — limit reached');
        dropZone.style.borderColor = '#27ae60';
        dropZone.style.background = '#f0fff4';
        const icon = dropZone.querySelector('i');
        if (icon) { icon.className = 'fas fa-circle-check'; icon.style.color = '#27ae60'; icon.style.opacity = '1'; }
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    ownerAttachmentFiles.forEach(function(file, idx) {
        const isImage = file.type && file.type.startsWith('image/');
        const extIcon = /\.pdf$/i.test(file.name) ? 'fa-file-pdf' :
                        /\.(doc|docx)$/i.test(file.name) ? 'fa-file-lines' :
                        /\.(xls|xlsx)$/i.test(file.name) ? 'fa-file-csv' :
                        /\.(ppt|pptx)$/i.test(file.name) ? 'fa-file-lines' :
                        /\.(zip|rar|7z)$/i.test(file.name) ? 'fa-file-zipper' :
                        isImage ? 'fa-file-image' : 'fa-file';
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const thumb = isImage
            ? `<img src="${URL.createObjectURL(file)}" alt="${escapeHtmlOwner(file.name)}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #ddd;flex-shrink:0;">`
            : `<span style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#fef3f3;border-radius:8px;flex-shrink:0;"><i class="fas ${extIcon}" style="font-size:1.3rem;color:#e74c3c;"></i></span>`;
        html += `<div style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:9px 12px;">
            ${thumb}
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.83rem;font-weight:600;color:#2c3e50;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtmlOwner(file.name)}</div>
                <div style="font-size:0.75rem;color:#888;margin-top:2px;">${sizeMB} MB</div>
            </div>
            <button type="button" onclick="removeOwnerAttachment(${idx})" style="background:none;border:none;cursor:pointer;color:#aaa;font-size:1.05rem;padding:4px;" title="Remove"><i class="fas fa-xmark"></i></button>
        </div>`;
    });
    html += '</div>';
    preview.innerHTML = html;
}

function addOwnerAttachmentFiles(newFiles) {
    const remaining = OWNER_MAX_ATTACHMENTS - ownerAttachmentFiles.length;
    if (remaining <= 0) { showToast('Maximum 6 files allowed', 'info'); return; }
    const toAdd = Array.from(newFiles).slice(0, remaining);
    if (Array.from(newFiles).length > remaining) {
        showToast('Only ' + remaining + ' more file(s) can be added (limit: 6)', 'info');
    }
    ownerAttachmentFiles = ownerAttachmentFiles.concat(toAdd);
    renderOwnerAttachmentPreviews();
}

function removeOwnerAttachment(idx) {
    ownerAttachmentFiles.splice(idx, 1);
    renderOwnerAttachmentPreviews();
}

function clearOwnerAttachment() {
    ownerAttachmentFiles = [];
    const attachInput = document.getElementById('ownerAttachmentFile');
    const preview = document.getElementById('ownerAttachmentPreview');
    const dropZone = document.getElementById('ownerAttachmentDropZone');
    if (attachInput) attachInput.value = '';
    if (preview) preview.innerHTML = '';
    if (dropZone) {
        dropZone.style.borderColor = '#f0a0a0';
        dropZone.style.background = '#fff';
        const span = dropZone.querySelector('span');
        if (span) span.textContent = 'Click to browse or drag & drop files (up to 6)';
        const icon = dropZone.querySelector('i');
        if (icon) { icon.className = 'fas fa-cloud-arrow-up'; icon.style.color = '#e74c3c'; icon.style.opacity = '0.8'; }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const attachInput = document.getElementById('ownerAttachmentFile');
    const dropZone = document.getElementById('ownerAttachmentDropZone');

    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (ownerAttachmentFiles.length < OWNER_MAX_ATTACHMENTS) {
                dropZone.style.borderColor = '#e74c3c';
                dropZone.style.background = '#fff0f0';
            }
        });
        dropZone.addEventListener('dragleave', function() {
            if (ownerAttachmentFiles.length === 0) {
                dropZone.style.borderColor = '#f0a0a0';
                dropZone.style.background = '#fff';
            } else {
                dropZone.style.borderColor = '#27ae60';
                dropZone.style.background = '#f0fff4';
            }
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                addOwnerAttachmentFiles(e.dataTransfer.files);
                if (attachInput) attachInput.value = '';
            }
        });
    }

    if (attachInput) {
        attachInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                addOwnerAttachmentFiles(this.files);
                this.value = '';
            }
        });
    }
});

function escapeHtmlOwner(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.getElementById('closeOwnerEditModal').addEventListener('click', closeEditModal);
document.getElementById('cancelOwnerEdit').addEventListener('click', closeEditModal);

// Submit changes
document.getElementById('ownerEditForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const restaurantId = document.getElementById('ownerEditId').value;
    const restaurant = ownerRestaurants.find(r => r.id == restaurantId);
    if (!restaurant) return;
    
    // Collect business hours
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const hours = {};
    days.forEach(day => {
        hours[day] = {
            open: document.getElementById('owner' + day + 'Open')?.value || '',
            close: document.getElementById('owner' + day + 'Close')?.value || '',
            closed: document.getElementById('owner' + day + 'Closed')?.checked || false
        };
    });
    
    // Build changes object - only include fields that changed
    const changes = {};
    
    // Text/select fields
    const textFields = {
        'name': 'ownerEditName',
        'description': 'ownerEditDescription',
        'address': 'ownerEditAddress',
        'phone': 'ownerEditPhone',
        'email': 'ownerEditEmail',
        'facebook_name': 'ownerEditFacebookName',
        'facebook_page': 'ownerEditFacebook',
        'menu_items': 'ownerEditMenuItems',
        'price_range': 'ownerEditPriceRange',
        'seating_capacity': 'ownerEditSeating',
        'category': 'ownerEditCategory',
        'latitude': 'ownerEditLatitude',
        'longitude': 'ownerEditLongitude'
    };

    function normalizeComparableValue(field, value) {
        const stringValue = value === null || value === undefined ? '' : String(value).trim();
        if ((field === 'latitude' || field === 'longitude') && stringValue !== '') {
            const numericValue = parseFloat(stringValue);
            if (Number.isFinite(numericValue)) {
                return numericValue.toFixed(6);
            }
        }
        return stringValue;
    }
    
    for (const [field, elemId] of Object.entries(textFields)) {
        const newVal = document.getElementById(elemId)?.value || '';
        const oldVal = restaurant[field] || '';
        const newComparable = normalizeComparableValue(field, newVal);
        const oldComparable = normalizeComparableValue(field, oldVal);
        if (newComparable !== oldComparable) {
            changes[field] = String(newVal).trim();
        }
    }
    
    // Radio button fields
    const radioFields = {
        'reservation_needed': 'owner_reservation_needed',
        'parking_availability': 'owner_parking_availability',
        'wifi_availability': 'owner_wifi_availability'
    };
    
    for (const [field, name] of Object.entries(radioFields)) {
        const newVal = getRadioValue(name);
        const oldVal = restaurant[field] || '';
        if (newVal !== oldVal) {
            changes[field] = newVal;
        }
    }
    
    // Checkbox group fields (stored as JSON arrays)
    const checkboxFields = {
        'payment_methods': 'owner_payment_methods[]',
        'delivery_options': 'owner_delivery_options[]',
        'accessibility': 'owner_accessibility[]'
    };
    
    for (const [field, name] of Object.entries(checkboxFields)) {
        const newVal = getCheckboxGroupValue(name);
        const oldVal = restaurant[field] || '';
        // Normalize for comparison
        let oldNorm = oldVal;
        if (oldNorm) {
            try {
                const parsed = JSON.parse(oldNorm);
                if (Array.isArray(parsed)) oldNorm = JSON.stringify(parsed);
            } catch(e) {}
        }
        if (newVal !== oldNorm) {
            changes[field] = newVal;
        }
    }
    
    // Check hours changes
    const newHoursJson = JSON.stringify(hours);
    const oldHours = typeof restaurant.hours === 'string' ? restaurant.hours : JSON.stringify(restaurant.hours || {});
    if (newHoursJson !== oldHours) {
        changes['hours'] = newHoursJson;
    }

    // Check full_menu changes
    const newFullMenu = collectFullMenuData('ownerFullMenuItemsList');
    const oldFullMenu = restaurant.full_menu || '';
    if (newFullMenu !== oldFullMenu) {
        changes['full_menu'] = newFullMenu;
    }
    
    const keptImages = ownerEditState.originalImages.filter(p => !ownerEditState.removedImages.includes(p));
    const keptMenuImages = ownerEditState.originalMenuImages.filter(p => !ownerEditState.removedMenuImages.includes(p));
    const hasImageChanges =
        ownerEditState.newImageFiles.length > 0 ||
        ownerEditState.newMenuFiles.length > 0 ||
        !!ownerEditState.newLogoFile ||
        ownerEditState.removeLogo ||
        ownerEditState.removedImages.length > 0 ||
        ownerEditState.removedMenuImages.length > 0;

    if (Object.keys(changes).length === 0 && !hasImageChanges) {
        showToast('No changes detected', 'info');
        return;
    }

    // Require at least one attachment when the supporting document section is visible
    const attachSection = document.getElementById('ownerAttachmentSection');
    if (attachSection && attachSection.style.display !== 'none' && ownerAttachmentFiles.length === 0) {
        const dropZone = document.getElementById('ownerAttachmentDropZone');
        if (dropZone) {
            dropZone.style.borderColor = '#e74c3c';
            dropZone.style.background = '#fff5f5';
            dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                if (ownerAttachmentFiles.length === 0) {
                    dropZone.style.borderColor = '#f0a0a0';
                    dropZone.style.background = '#fff';
                }
            }, 2000);
        }
        showToast('Please attach at least one supporting document before submitting.', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('restaurant_id', restaurantId);
        formData.append('changes', JSON.stringify(changes));
        formData.append('keep_image_paths', JSON.stringify(keptImages));
        formData.append('remove_image_paths', JSON.stringify(ownerEditState.removedImages));
        formData.append('keep_menu_images', JSON.stringify(keptMenuImages));
        formData.append('remove_menu_images', JSON.stringify(ownerEditState.removedMenuImages));
        formData.append('remove_logo', ownerEditState.removeLogo ? '1' : '0');

        ownerEditState.newImageFiles.forEach(file => formData.append('images[]', file));
        ownerEditState.newMenuFiles.forEach(file => formData.append('menu_images[]', file));
        if (ownerEditState.newLogoFile) formData.append('logo', ownerEditState.newLogoFile);

        // Include supporting document attachments (up to 6)
        ownerAttachmentFiles.forEach(function(file) { formData.append('attachments[]', file); });

        const response = await fetch('api/owner_restaurants.php?action=submit_changes_upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Changes submitted for admin approval!', 'success');
            closeEditModal();
            markRestaurantCardPending(restaurantId);
            refreshOwnerLiveData(true);
        } else {
            showToast(result.error || 'Failed to submit changes', 'error');
        }
    } catch(err) {
        showToast('Error submitting changes', 'error');
    }
});

// Apply all hours
document.getElementById('ownerApplyAllHours')?.addEventListener('click', function() {
    const mondayOpen = document.getElementById('ownerMondayOpen').value;
    const mondayClose = document.getElementById('ownerMondayClose').value;
    const mondayClosed = document.getElementById('ownerMondayClosed').checked;
    
    const days = ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    days.forEach(day => {
        document.getElementById('owner' + day + 'Open').value = mondayOpen;
        document.getElementById('owner' + day + 'Close').value = mondayClose;
        document.getElementById('owner' + day + 'Closed').checked = mondayClosed;
    });
});

// ===== Full Menu Item Builder Functions =====
function addFullMenuItem(listId, categoryInputId, nameInputId, priceInputId) {
    const categoryInput = document.getElementById(categoryInputId);
    const nameInput = document.getElementById(nameInputId);
    const priceInput = document.getElementById(priceInputId);
    const category = categoryInput.value.trim();
    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    if (!name) { showToast('Please enter an item name', 'error'); return; }
    if (!category) { showToast('Please select a category', 'error'); return; }
    const list = document.getElementById(listId);
    const row = document.createElement('div');
    row.className = 'full-menu-item-row';
    row.innerHTML = `${category ? '<span class="menu-item-category-badge">' + escapeHtml(category) + '</span>' : ''}<span class="menu-item-name">${escapeHtml(name)}</span><span class="menu-item-price">${price ? '₱' + escapeHtml(price) : ''}</span><button type="button" class="btn-remove-menu-item" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    row.dataset.category = category;
    row.dataset.name = name;
    row.dataset.price = price;
    list.appendChild(row);
    nameInput.value = '';
    priceInput.value = '';
    nameInput.focus();
}

function collectFullMenuData(listId) {
    const list = document.getElementById(listId);
    if (!list) return '';
    const rows = list.querySelectorAll('.full-menu-item-row');
    if (rows.length === 0) return '';
    const items = [];
    rows.forEach(row => { items.push({ category: row.dataset.category || '', name: row.dataset.name, price: row.dataset.price }); });
    return JSON.stringify(items);
}

function populateFullMenuItems(listId, fullMenuJson) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    if (!fullMenuJson) return;
    try {
        const items = typeof fullMenuJson === 'string' ? JSON.parse(fullMenuJson) : fullMenuJson;
        if (!Array.isArray(items)) return;
        items.forEach(item => {
            const cat = item.category || '';
            const row = document.createElement('div');
            row.className = 'full-menu-item-row';
            row.innerHTML = `${cat ? '<span class="menu-item-category-badge">' + escapeHtml(cat) + '</span>' : ''}<span class="menu-item-name">${escapeHtml(item.name || '')}</span><span class="menu-item-price">${item.price ? '₱' + escapeHtml(item.price) : ''}</span><button type="button" class="btn-remove-menu-item" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
            row.dataset.category = cat;
            row.dataset.name = item.name || '';
            row.dataset.price = item.price || '';
            list.appendChild(row);
        });
    } catch(e) { console.error('Error parsing full_menu:', e); }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('ownerToast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = toast.querySelector('.toast-icon');
    
    msgEl.textContent = message;
    toast.className = 'owner-toast ' + type;
    
    if (type === 'success') {
        iconEl.className = 'fas fa-check-circle toast-icon';
    } else if (type === 'error') {
        iconEl.className = 'fas fa-exclamation-circle toast-icon';
    } else {
        iconEl.className = 'fas fa-info-circle toast-icon';
    }
    
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

function openOwnerLogoutModal(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('logoutConfirmModal');
    if (!modal) return;
    modal.style.display = 'flex';
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutConfirmModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function confirmLogout() {
    window.location.href = 'owner.php?logout=1';
}

function openOwnerAccountUpdateModal(passwordChanged = false) {
    const modal = document.getElementById('ownerAccountUpdateModal');
    if (!modal) return;

    const messageEl = document.getElementById('ownerAccountUpdateModalMessage');
    if (messageEl) {
        messageEl.textContent = passwordChanged
            ? 'Your username/password changes were applied. For security, you can re-login now, or keep this current session active.'
            : 'Your account changes were applied successfully. Do you want to stay logged in or re-login now?';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeOwnerAccountUpdateModal() {
    const modal = document.getElementById('ownerAccountUpdateModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function reloginOwnerAfterAccountUpdate() {
    window.location.href = 'owner.php?logout=1';
}

async function handleOwnerAccountSettingsSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const saveBtn = document.getElementById('ownerAccountSaveBtn');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';

    const currentPassword = String(form.querySelector('#ownerCurrentPassword')?.value || '');
    const newUsername = String(form.querySelector('#ownerNewUsername')?.value || '').trim();
    const newPassword = String(form.querySelector('#ownerNewPassword')?.value || '');
    const confirmPassword = String(form.querySelector('#ownerConfirmPassword')?.value || '');

    if (!currentPassword || !newUsername) {
        showToast('Current password and new username are required.', 'error');
        return;
    }

    if (newUsername.length < 3) {
        showToast('Username must be at least 3 characters.', 'error');
        return;
    }

    if (newPassword || confirmPassword) {
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('New password and confirmation do not match.', 'error');
            return;
        }
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const response = await fetch('api/owner_restaurants.php?action=change_owner_credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: currentPassword,
                new_username: newUsername,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message || 'Account settings updated successfully.', 'success');
            const newUsernameInput = form.querySelector('#ownerNewUsername');
            const currentPasswordInput = form.querySelector('#ownerCurrentPassword');
            const newPasswordInput = form.querySelector('#ownerNewPassword');
            const confirmPasswordInput = form.querySelector('#ownerConfirmPassword');
            if (newUsernameInput) newUsernameInput.value = result.username || newUsername;
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';

            openOwnerAccountUpdateModal(Boolean(newPassword));
        } else {
            showToast(result.error || 'Failed to update account settings.', 'error');
        }
    } catch (error) {
        showToast('Error updating account settings.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
        }
    }
}

async function deleteOwnerNotification(notificationId, buttonEl) {
    if (!notificationId || !buttonEl) return;
    if (!confirm('Delete this notification?')) return;

    buttonEl.disabled = true;
    try {
        const response = await fetch('api/owner_restaurants.php?action=delete_notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
        });
        const result = await response.json();

        if (result.success) {
            await refreshOwnerLiveData(true);
            showToast('Notification deleted', 'success');
        } else {
            showToast(result.error || 'Failed to delete notification', 'error');
            buttonEl.disabled = false;
        }
    } catch (error) {
        showToast('Error deleting notification', 'error');
        buttonEl.disabled = false;
    }
}

async function deleteOwnerHistory(changeId, buttonEl) {
    if (!changeId || !buttonEl) return;
    if (!confirm('Delete this change history item?')) return;

    buttonEl.disabled = true;
    try {
        const response = await fetch('api/owner_restaurants.php?action=delete_change_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ change_id: changeId })
        });
        const result = await response.json();

        if (result.success) {
            await refreshOwnerLiveData(true);
            showToast('History item deleted', 'success');
        } else {
            showToast(result.error || 'Failed to delete history item', 'error');
            buttonEl.disabled = false;
        }
    } catch (error) {
        showToast('Error deleting history item', 'error');
        buttonEl.disabled = false;
    }
}

async function deleteAllOwnerNotifications(buttonEl) {
    if (!buttonEl) return;
    if (!confirm('Delete all notifications?')) return;

    buttonEl.disabled = true;
    try {
        const response = await fetch('api/owner_restaurants.php?action=delete_all_notifications', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            await refreshOwnerLiveData(true);
            showToast('All notifications deleted', 'success');
        } else {
            showToast(result.error || 'Failed to delete notifications', 'error');
            buttonEl.disabled = false;
        }
    } catch (error) {
        showToast('Error deleting notifications', 'error');
        buttonEl.disabled = false;
    }
}

async function deleteAllOwnerHistory(buttonEl) {
    if (!buttonEl) return;
    if (!confirm('Delete all change history?')) return;

    buttonEl.disabled = true;
    try {
        const response = await fetch('api/owner_restaurants.php?action=delete_all_change_history', {
            method: 'POST'
        });
        const result = await response.json();

        if (result.success) {
            await refreshOwnerLiveData(true);
            showToast('All change history deleted', 'success');
        } else {
            showToast(result.error || 'Failed to delete change history', 'error');
            buttonEl.disabled = false;
        }
    } catch (error) {
        showToast('Error deleting change history', 'error');
        buttonEl.disabled = false;
    }
}

// Close modal on outside click  
document.getElementById('ownerEditModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

document.getElementById('logoutConfirmModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeLogoutModal();
    }
});

document.getElementById('ownerAccountUpdateModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeOwnerAccountUpdateModal();
    }
});

document.getElementById('ownerAccountForm')?.addEventListener('submit', handleOwnerAccountSettingsSubmit);
</script>
</body>
</html>
