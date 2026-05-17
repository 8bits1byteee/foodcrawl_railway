<?php
// ============================================================================
// admin.php - COMPLETE FIXED VERSION WITH MULTIPLE IMAGE UPLOADS
// ============================================================================

// CRITICAL: Start session FIRST - before any output or header() calls
session_start();

// Include required files
require_once 'includes/config.php';
require_once 'includes/auth.php';
require_once 'includes/functions.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('Location: admin_login.php');
    exit;
}

// Handle logout
if (isset($_GET['logout'])) {
    logout();
    header('Location: admin_login.php');
    exit;
}

// Handle restaurant add form POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['name'])) {
    $imagePaths = [];
    
    // Handle multiple image uploads
    if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
        $uploadDir = 'images/restaurants/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Process each uploaded file
        $fileCount = count($_FILES['images']['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                // Validate file type
                if (!str_starts_with($_FILES['images']['type'][$i], 'image/')) {
                    continue;
                }
                
                // Validate file size (3MB limit)
                if ($_FILES['images']['size'][$i] > 3 * 1024 * 1024) {
                    continue;
                }
                
                $filename = uniqid() . '_' . basename($_FILES['images']['name'][$i]);
                $targetPath = $uploadDir . $filename;
                
                if (move_uploaded_file($_FILES['images']['tmp_name'][$i], $targetPath)) {
                    $imagePaths[] = $targetPath;
                }
            }
        }
    }
    
    $data = [
        'name' => $_POST['name'],
        'description' => $_POST['description'] ?? '',
        'address' => $_POST['address'] ?? '',
        'latitude' => $_POST['latitude'] ?? 0,
        'longitude' => $_POST['longitude'] ?? 0,
        'phone' => $_POST['phone'] ?? '',
        'email' => $_POST['email'] ?? '',
        'facebook_page' => $_POST['facebook_page'] ?? '',
        'facebook_name' => $_POST['facebook_name'] ?? '',
        'hours' => $_POST['hours'] ?? '',
        'menu_items' => $_POST['menu_items'] ?? '',
        'full_menu' => $_POST['full_menu'] ?? '',
        'image_paths' => $imagePaths
    ];
    
    addRestaurant($data);
    header('Location: admin.php?success=1');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Estancia Food Crawl</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/admin_style.css">
    <link rel="stylesheet" href="css/owner_style.css">
    <link rel="stylesheet" href="css/delete_button_styles.css">  
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Multiple Image Upload Styles */
        .image-preview-grid {
            /* Use flex so we can push the add-tile to the right */
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
            align-items: flex-start;
        }

        .image-preview {
            position: relative;
            width: 100px;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #e0e0e0;
            background: #f5f5f5;
            flex: 0 0 100px;
        }

        .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .image-preview .remove-image {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 50%;
            background: rgba(244, 67, 54, 0.9);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .image-preview .remove-image:hover {
            background: #f44336;
            transform: scale(1.1);
        }

        .image-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px;
            font-size: 10px;
            text-align: center;
        }

        .image-counter {
            font-weight: normal;
            font-size: 0.9em;
            color: #666;
            margin-left: 5px;
        }

        /* Add-tile styling so the + button appears as a thumbnail among images */
        .image-add {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: 2px dashed #e0e0e0;
            background: #fafafa;
            cursor: pointer;
            width: 100px;
            height: 100px;
            flex: 0 0 100px;
        }
        .image-add .image-add-btn {
            background: transparent;
            border: none;
            font-size: 1.25rem;
            color: var(--brand, #2c3e50);
            width: 100%;
            height: 100%;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
        }
        .image-add .image-add-btn i {
            background: rgba(0,0,0,0.04);
            padding: 6px; /* smaller so icon lines up with preview */
            border-radius: 50%;
        }
        .image-add .image-add-btn:focus {
            outline: 2px solid rgba(76,175,80,0.4);
            outline-offset: 2px;
        }
        /* Logo preview + add-tile styles */
        .logo-row {
            display: flex;
            gap: 8px;
            align-items: flex-start; /* top-align preview and add tile */
            margin-top: 8px;
            margin-bottom: 18px; /* ensure gap below logo row before next section */
        }
        /* Logo preview: smaller, consistent square tiles and aligned with the add/change tile */
        .logo-preview-box {
            width: 140px;
            height: 140px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #e0e0e0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px; /* breathing room */
            box-sizing: border-box;
        }
        .logo-preview-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; /* show whole logo without cropping */
        }
        /* Ensure there's extra gap before the restaurant pictures section and below it */
        .pictures-section {
            margin-top: 15px !important;
            margin-bottom: 15px !important;
        }
        /* Make the add/change tile match the preview size so both tiles align */
        .logo-add {
            width: 140px;
            height: 140px;
            min-width: 140px;
            min-height: 140px;
            display: flex;
            align-items: flex-start; /* top-align the add tile content */
            justify-content: center;
            box-sizing: border-box;
            background: #fafafa;
            padding-top: 6px; /* match preview breathing room */
        }

        /* Accessibility improvements */
        .image-preview:focus-within {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }

        .remove-image:focus {
            outline: 2px solid #4CAF50;
            outline-offset: 2px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .image-preview-grid {
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 8px;
            }
        }

        /* Vertical layout helper for add-restaurant contact fields */
        .vertical-fields .form-group {
            display: block;
            width: 100%;
            margin-bottom: 0.75rem;
        }
        .vertical-fields .form-group input,
        .vertical-fields .form-group textarea {
            width: 100%;
            box-sizing: border-box;
        }
        /* Inline pair for two related fields (FB name + URL) */
        .inline-pair {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
            margin-bottom: 0.75rem;
        }
        .inline-pair .form-group {
            flex: 1 1 0;
            margin-bottom: 0;
        }
        /* small screens: stack the pair vertically */
        @media (max-width: 600px) {
            .inline-pair {
                flex-direction: column;
            }
        }
        /* Make Add / Edit tab content appear as a single uniform card */
        .admin-main .tab-content {
            background: #ffffff;
            padding: 24px 28px;
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
        }

        /* Ensure internal form groups don't draw different backgrounds */
        .admin-main .tab-content .form-group,
        .admin-main .tab-content .vertical-fields,
        .admin-main .tab-content .inline-pair {
            background: transparent;
        }

        /* Body / page background stays subtle so the tab looks like a card */
        body, .admin-content {
            background: #f0f2f5;
        }

        /* Inputs remain visible on the white card */
        .admin-main .tab-content input,
        .admin-main .tab-content textarea,
        .admin-main .tab-content select {
            background: #fff;
        }

        .pc-image-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
        }

        .pc-image-thumb {
            width: 72px;
            height: 72px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            display: block;
        }

        .pc-image-link {
            display: inline-flex;
            border-radius: 8px;
            overflow: hidden;
        }

        .add-restaurant-step {
            display: none;
        }

        .add-restaurant-step.active {
            display: block;
        }

        .add-step-actions {
            display: flex;
            gap: 0.6rem;
            justify-content: flex-end;
            margin-top: 1rem;
            flex-wrap: wrap;
        }

        .add-owner-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 1rem;
            background: #fff;
        }

        .add-owner-card h3 {
            margin: 0 0 0.3rem;
            color: #1f2937;
        }

        .add-owner-card p {
            margin: 0 0 1rem;
            color: #6b7280;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
<script>
try {
    const _sbMode = localStorage.getItem('adminSidebarMode') || 'hover';
    if (_sbMode === 'collapsed' || _sbMode === 'hover') {
        document.body.classList.add('admin-sidebar-collapsed');
    }
    if (_sbMode === 'hover') {
        document.body.classList.add('admin-sidebar-hover-mode');
    }
} catch (e) {}
</script>
<?php $isAdmin = true; include 'includes/header.php'; ?>

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
<div id="accountUpdateModal" class="logout-modal account-update-modal" style="display: none;">
    <div class="logout-modal-content account-update-content">
        <div class="logout-modal-header account-update-header">
            <h2><i class="fas fa-user-check"></i> Account Updated</h2>
        </div>
        <div class="logout-modal-body">
            <p id="accountUpdateModalMessage">Your account changes were applied successfully. Do you want to stay logged in or re-login now?</p>
        </div>
        <div class="logout-modal-actions">
            <button class="btn-modal-cancel" type="button" onclick="closeAccountUpdateModal()">
                <i class="fas fa-user-clock"></i> Keep Me Logged In
            </button>
            <button class="btn-modal-confirm" type="button" onclick="reloginAfterAccountUpdate()">
                <i class="fas fa-right-from-bracket"></i> Re-login Now
            </button>
        </div>
    </div>
</div>

<!-- Sidebar Control Modal -->
<div id="sidebarCtrlModal" role="dialog" aria-modal="true" aria-labelledby="sidebarCtrlTitle"
     style="display:none;position:fixed;bottom:52px;left:4px;z-index:14500;">
    <div class="sidebar-ctrl-inner">
        <div class="sidebar-ctrl-head">
            <span id="sidebarCtrlTitle">Sidebar Control</span>
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
                    <i class="fas fa-user-circle"></i>
                    <span class="menu-label"><strong><?= htmlspecialchars($_SESSION['admin_username'] ?? 'Admin') ?></strong></span>
                </div>
                <ul class="admin-menu">
                    <li><a href="#" class="menu-item active" data-tab="dashboard"><i class="fas fa-tachometer-alt"></i><span class="menu-label">Dashboard</span></a></li>
                    <li><a href="#" class="menu-item" data-tab="add-restaurant"><i class="fas fa-plus-circle"></i><span class="menu-label">Add Restaurant</span></a></li>
                    <li><a href="#" class="menu-item" data-tab="manage-restaurants"><i class="fas fa-list"></i><span class="menu-label">Manage Restaurants</span></a></li>
                    <li>
                        <a href="#" class="menu-item" data-tab="reports">
                            <i class="fas fa-flag"></i><span class="menu-label">Reports</span>
                            <span id="reportsNavBadge" class="nav-badge" aria-hidden="true" style="display:none">0</span>
                        </a>
                    </li>
                    <li><a href="#" class="menu-item" data-tab="statistics"><i class="fas fa-chart-bar"></i><span class="menu-label">Statistics</span></a></li>
                    <li>
                        <a href="#" class="menu-item" data-tab="pending-changes">
                            <i class="fas fa-clipboard-check"></i><span class="menu-label">Pending Changes</span>
                            <span id="pendingChangesNavBadge" class="nav-badge" aria-hidden="true" style="display:none">0</span>
                        </a>
                    </li>
                    <li><a href="#" class="menu-item" data-tab="account-settings"><i class="fas fa-user-cog"></i><span class="menu-label">Account Settings</span></a></li>
                    <li class="sidebar-ctrl-li">
                        <button type="button" class="sidebar-ctrl-btn" id="sidebarCtrlBtn" title="Sidebar Control">
                            <img src="icons/layout-sidebar.svg" alt="Sidebar" aria-hidden="true" width="18" height="18" style="display:block;filter:brightness(0) invert(1);">
                        </button>
                    </li>
                </ul>
            </div>

            <div class="admin-sidebar-overlay" id="adminSidebarOverlay" aria-hidden="true"></div>

            <div class="admin-main">
                <!-- Edit Restaurant Modal -->
                <div id="editRestaurantModal" class="modal" style="display:none;">
                    <div class="modal-content restaurant-edit-modal">
                        <button class="modal-close" id="closeEditModal" aria-label="Close">
                            <i class="fas fa-xmark"></i>
                        </button>

                        <div class="modal-header restaurant-edit-header">
                            <h2 class="modal-title">
                                <i class="fas fa-utensils"></i>
                                Edit Restaurant
                            </h2>
                        </div>

                        <div class="modal-body restaurant-edit-body">
                            <form id="editRestaurantForm" class="admin-form" enctype="multipart/form-data">
                                <input type="hidden" id="editRestaurantId" name="id">

                                <!-- Restaurant Name + Category (inline) -->
                                <div class="inline-pair" style="align-items:flex-start;">
                                    <div class="form-group" style="flex:2;">
                                        <label for="editRestaurantName">Restaurant Name: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                        <input type="text" id="editRestaurantName" name="name" required>
                                        <small class="hint" style="color:#6b7280;">ID: <span id="editIdBadge">—</span></small>
                                    </div>
                                    <div class="form-group" style="flex:1;">
                                        <label for="editRestaurantCategory">Category: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                        <select id="editRestaurantCategory" name="category" required>
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
                                    <label for="editRestaurantDescription">Description:</label>
                                    <textarea id="editRestaurantDescription" name="description" rows="4"></textarea>
                                </div>
                                <!-- Contact Fields -->
                                <div class="vertical-fields">
                                    <div class="form-group">
                                        <label for="editRestaurantPhone">Phone:</label>
                                        <input type="text" id="editRestaurantPhone" name="phone" maxlength="11" inputmode="numeric" pattern="\d{11}" placeholder="09XXXXXXXXX">
                                    </div>
                                    <div class="form-group">
                                        <label for="editRestaurantEmail">Email:</label>
                                        <input type="email" id="editRestaurantEmail" name="email" placeholder="contact@example.com">
                                    </div>
                                    <div class="inline-pair">
                                        <div class="form-group half">
                                            <label for="editRestaurantFacebookName">Facebook Page Name:</label>
                                            <input type="text" id="editRestaurantFacebookName" name="facebook_name" placeholder="My Restaurant Page">
                                        </div>
                                        <div class="form-group half">
                                            <label for="editRestaurantFacebook">Facebook Page (URL):</label>
                                            <input type="text" id="editRestaurantFacebook" name="facebook_page" placeholder="https://facebook.com/yourpage">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Business Hours:</label>
                                        <div class="hours-input-container">
                                            <button type="button" class="hours-apply-btn" data-prefix="edit">Apply to all</button>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Monday:</label>
                                                <input type="time" id="editMondayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editMondayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editMondayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Tuesday:</label>
                                                <input type="time" id="editTuesdayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editTuesdayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editTuesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Wednesday:</label>
                                                <input type="time" id="editWednesdayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editWednesdayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editWednesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Thursday:</label>
                                                <input type="time" id="editThursdayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editThursdayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editThursdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Friday:</label>
                                                <input type="time" id="editFridayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editFridayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editFridayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Saturday:</label>
                                                <input type="time" id="editSaturdayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editSaturdayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editSaturdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                            <div class="hours-day-row">
                                                <label class="hours-day-label">Sunday:</label>
                                                <input type="time" id="editSundayOpen" class="hours-time-input" placeholder="Open">
                                                <span class="hours-separator">to</span>
                                                <input type="time" id="editSundayClose" class="hours-time-input" placeholder="Close">
                                                <label class="hours-closed-label"><input type="checkbox" id="editSundayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Popular Items -->
                                <div class="form-group">
                                    <label for="editRestaurantMenu">Popular Items (comma separated):</label>
                                    <input type="text" id="editRestaurantMenu" name="menu_items" placeholder="e.g., Adobo, Sinigang, Lechon">
                                </div>

                                <!-- Full Menu Items -->
                                <div class="form-group">
                                    <label>Full Menu Items with Pricing:</label>
                                    <div id="editFullMenuContainer" class="full-menu-builder">
                                        <div class="full-menu-items-list" id="editFullMenuItemsList"></div>
                                        <div class="full-menu-add-row">
                                            <select id="editNewMenuItemCategory" class="menu-item-category-select">
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
                                            <input type="text" id="editNewMenuItemName" placeholder="Item name" class="menu-item-name-input">
                                            <input type="number" id="editNewMenuItemPrice" placeholder="₱ Price" class="menu-item-price-input" min="0" step="any">
                                            <button type="button" class="btn btn-sm btn-secondary" onclick="addFullMenuItem('editFullMenuItemsList', 'editNewMenuItemCategory', 'editNewMenuItemName', 'editNewMenuItemPrice')">
                                                <i class="fas fa-plus"></i> Add
                                            </button>
                                        </div>
                                    </div>
                                    <input type="hidden" id="editFullMenuData" name="full_menu">
                                </div>

                                <!-- Pricing and Payment Section -->
                                <div class="form-group">
                                    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                                        <i class="fas fa-money-bill-wave"></i> Pricing and Payment
                                    </h3>

                                    <div class="form-group">
                                        <label for="editPriceRange">Price Range (per meal):</label>
                                        <input type="text" id="editPriceRange" name="price_range" placeholder="e.g., ₱150–₱500">
                                    </div>

                                    <div class="form-group">
                                        <label>Accepted In-Store Payment Methods:</label>
                                        <div class="payment-options">
                                            <label>
                                                <input type="checkbox" name="payment_methods[]" value="Cash"> Cash
                                            </label>
                                            <label>
                                                <input type="checkbox" name="payment_methods[]" value="Credit/Debit Card"> Credit/Debit Card
                                            </label>
                                            <label>
                                                <input type="checkbox" name="payment_methods[]" value="GCash"> GCash
                                            </label>
                                            <label>
                                                <input type="checkbox" name="payment_methods[]" value="Maya"> Maya
                                            </label>
                                            <label>
                                                <input type="checkbox" name="payment_methods[]" value="Bank Transfer"> Bank Transfer
                                            </label>
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
                                            <label for="editSeatingCapacity">Seating Capacity:</label>
                                            <input type="text" id="editSeatingCapacity" name="seating_capacity" placeholder="e.g., 50-100 people">
                                        </div>

                                        <div class="form-group">
                                            <label>Reservation Needed:</label>
                                            <div class="option-group">
                                                <label>
                                                    <input type="radio" name="reservation_needed" value="Yes"><span>Yes</span>
                                                </label>
                                                <label>
                                                    <input type="radio" name="reservation_needed" value="No"><span>No</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label>Parking Availability:</label>
                                            <div class="option-group">
                                                <label>
                                                    <input type="radio" name="parking_availability" value="Yes"><span>Yes</span>
                                                </label>
                                                <label>
                                                    <input type="radio" name="parking_availability" value="Limited"><span>Limited</span>
                                                </label>
                                                <label>
                                                    <input type="radio" name="parking_availability" value="None"><span>None</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label>Delivery Options:</label>
                                            <div class="option-group">
                                                <label>
                                                    <input type="checkbox" name="delivery_options[]" value="Dine-in"><span>Dine-in</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="delivery_options[]" value="Take-out"><span>Take-out</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="delivery_options[]" value="Delivery"><span>Delivery</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label>Wi-Fi Availability:</label>
                                            <div class="option-group">
                                                <label>
                                                    <input type="radio" name="wifi_availability" value="Yes"><span>Yes</span>
                                                </label>
                                                <label>
                                                    <input type="radio" name="wifi_availability" value="No"><span>No</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div class="form-group">
                                            <label>Accessibility:</label>
                                            <div class="checkbox-grid">
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Wheelchair accessible entrance">
                                                    <span>Wheelchair accessible entrance</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Wheelchair accessible seating">
                                                    <span>Wheelchair accessible seating</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Wheelchair accessible restroom">
                                                    <span>Wheelchair accessible restroom</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Ramp available">
                                                    <span>Ramp available</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Parking for persons with disabilities">
                                                    <span>PWD parking</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Braille menu or signage">
                                                    <span>Braille menu or signage</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Staff assistance available">
                                                    <span>Staff assistance available</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="High chair or child seat available">
                                                    <span>High chair / child seat</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Near public transport">
                                                    <span>Near public transport</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Drop-off area near entrance">
                                                    <span>Drop-off area near entrance</span>
                                                </label>
                                                <label>
                                                    <input type="checkbox" name="accessibility[]" value="Non-slip flooring">
                                                    <span>Non-slip flooring</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Menu Images -->
                                <div class="form-group">
                                    <label for="editRestaurantMenuImages">Menu Images <span id="editMenuImageCounter" class="image-counter">0/10 selected</span>:</label>
                                    <input type="file"
                                           id="editRestaurantMenuImages"
                                           name="menu_images[]"
                                           accept="image/*"
                                           multiple
                                           style="display: none;">
                                    <small class="hint">Upload up to 10 menu images with prices (PNG/JPG up to 2.5MB each)</small>

                                    <div id="editMenuImagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                                        <div class="image-add" id="editMenuImageAddTile">
                                            <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('editRestaurantMenuImages').click()" aria-label="Add menu images">
                                                <i class="fas fa-plus" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Restaurant Logo -->
                                <div class="form-group">
                                    <label for="editRestaurantLogo">Restaurant Logo (optional):</label>
                                    <input type="file" id="editRestaurantLogo" name="logo" accept="image/*" style="display:none;">
                                    <small class="hint">Square PNG/JPG recommended. Max 1.5MB.</small>
                                    <div class="logo-row">
                                        <div id="editLogoPreviewContainer" class="logo-preview-box" aria-live="polite">
                                        </div>
                                        <div class="image-add logo-add" id="editLogoAddTile">
                                            <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('editRestaurantLogo').click()" aria-label="Select logo">
                                                <i class="fas fa-image" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Restaurant Pictures -->
                                <div class="form-group">
                                    <label for="editMultipleImageUpload">Restaurant Pictures <span id="editImageCounter" class="image-counter">0/5 selected</span>:</label>
                                    <input type="file"
                                           id="editMultipleImageUpload"
                                           name="images[]"
                                           accept="image/*"
                                           multiple
                                           style="display: none;">
                                    <small class="hint">Select up to 5 images (PNG, JPG up to 3MB each)</small>

                                    <div id="editImagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                                        <div class="image-add" id="editImageAddTile">
                                            <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('editMultipleImageUpload').click()" aria-label="Add images">
                                                <i class="fas fa-plus" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Location on Map -->
                                <div class="form-group">
                                    <label>Location on Map:</label>
                                    <div class="form-group" style="margin-bottom:8px;">
                                        <label for="editMapAddressBar">Address (Auto or Manual)</label>
                                        <input type="text" id="editMapAddressBar" class="map-address-bar" placeholder="Click the map to auto-fill or type address manually">
                                    </div>
                                    <div class="inline-pair" style="margin-bottom:8px;">
                                        <div class="form-group">
                                            <label for="editLatitude">Latitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                                            <input type="text" id="editLatitude" name="latitude" placeholder="e.g., 11.4550" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="editLongitude">Longitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                                            <input type="text" id="editLongitude" name="longitude" placeholder="e.g., 123.1525" required>
                                        </div>
                                    </div>
                                    <div id="editAdminMap" style="height: 360px; border: 2px solid #ddd; border-radius: 5px;"></div>
                                    <p style="margin-top:6px;"><small>Click on the map to set the restaurant location</small></p>
                                </div>

                                <!-- Sticky footer actions -->
                                <div class="sticky-actions">
                                    <button type="button" class="btn btn-light" id="cancelEditBtn"><i class="fas fa-xmark"></i> Cancel</button>
                                    <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Dashboard Tab -->
                <div id="dashboard" class="tab-content active">
                    <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
                    
                    <!-- Quick Stats Cards -->
                    <div class="dashboard-stats">
                        <div class="dash-card dash-card-primary" data-dashboard-action="total-restaurants" role="button" tabindex="0" aria-label="View all restaurants">
                            <div class="dash-card-icon"><i class="fas fa-utensils"></i></div>
                            <div class="dash-card-info">
                                <span class="dash-card-value" id="dashTotalRestaurants">--</span>
                                <span class="dash-card-label">Total Restaurants</span>
                            </div>
                        </div>
                        <div class="dash-card dash-card-success" data-dashboard-action="total-reviews" role="button" tabindex="0" aria-label="View statistics and reviews">
                            <div class="dash-card-icon"><i class="fas fa-star"></i></div>
                            <div class="dash-card-info">
                                <span class="dash-card-value" id="dashTotalReviews">--</span>
                                <span class="dash-card-label">Total Reviews</span>
                            </div>
                        </div>
                        <div class="dash-card dash-card-warning" data-dashboard-action="pending-reports" role="button" tabindex="0" aria-label="Review pending reports">
                            <div class="dash-card-icon"><i class="fas fa-flag"></i></div>
                            <div class="dash-card-info">
                                <span class="dash-card-value" id="dashPendingReports">--</span>
                                <span class="dash-card-label">Pending Reports</span>
                            </div>
                        </div>
                        <div class="dash-card dash-card-info" data-dashboard-action="with-images" role="button" tabindex="0" aria-label="Show restaurants with images">
                            <div class="dash-card-icon"><i class="fas fa-image"></i></div>
                            <div class="dash-card-info">
                                <span class="dash-card-value" id="dashWithImages">--</span>
                                <span class="dash-card-label">With Images</span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="dashboard-section">
                        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                        <div class="quick-actions">
                            <button class="quick-action-btn" onclick="switchToTab('add-restaurant')">
                                <i class="fas fa-plus"></i> Add Restaurant
                            </button>
                            <button class="quick-action-btn" onclick="switchToTab('manage-restaurants')">
                                <i class="fas fa-edit"></i> Manage Restaurants
                            </button>
                            <button class="quick-action-btn" onclick="switchToTab('reports')">
                                <i class="fas fa-flag"></i> View Reports
                            </button>
                            <button class="quick-action-btn" onclick="switchToTab('statistics')">
                                <i class="fas fa-chart-line"></i> View Statistics
                            </button>
                        </div>
                    </div>

                    <!-- Restaurant Map (Dashboard) -->
                    <div class="dashboard-section">
                        <h3><i class="fas fa-map-marked-alt"></i> Restaurant Map</h3>
                        <div class="dashboard-map-wrap">
                            <div class="dashboard-map-toolbar" aria-label="Filter restaurants on map">
                                <label for="dashboardMapCategory" class="sr-only">Category filter</label>
                                <select id="dashboardMapCategory" class="dashboard-map-select">
                                    <option value="">All categories</option>
                                </select>
                                <button type="button" id="dashboardMapHomeBtn" class="dashboard-map-home-btn" aria-label="Return Home">
                                    <i class="fas fa-home"></i>
                                    <span>Home</span>
                                </button>
                            </div>
                            <div id="dashboardMap" class="dashboard-map"></div>
                        </div>
                    </div>

                    <!-- Two Column Layout -->
                    <div class="dashboard-columns">
                        <!-- Recent Restaurants -->
                        <div class="dashboard-section">
                            <h3><i class="fas fa-clock"></i> Recently Added Restaurants</h3>
                            <div id="recentRestaurantsList" class="recent-list">
                                <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
                            </div>
                        </div>

                        <!-- Top Rated -->
                        <div class="dashboard-section">
                            <h3><i class="fas fa-trophy"></i> Top Rated Restaurants</h3>
                            <div id="topRatedList" class="recent-list">
                                <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Category Breakdown -->
                    <div class="dashboard-section">
                        <h3><i class="fas fa-tags"></i> Restaurants by Category</h3>
                        <div id="categoryBreakdown" class="category-breakdown">
                            <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
                        </div>
                    </div>
                </div>

                <!-- Add Restaurant Tab -->
                <div id="add-restaurant" class="tab-content">
                    <h2><i class="fas fa-plus-circle"></i> Add New Restaurant</h2>
                    <?php if (isset($_GET['success'])): ?>
                        <div class="alert alert-success">Restaurant added successfully!</div>
                    <?php endif; ?>
                    <form id="addRestaurantForm" class="admin-form" method="POST" enctype="multipart/form-data">
                        <div id="addRestaurantStep1" class="add-restaurant-step active">
                        <p class="tab-subtitle" style="margin-bottom:0.75rem;"><strong>Step 1 of 2:</strong> Restaurant Details</p>
                        <div class="inline-pair" style="align-items:center;">
                            <div class="form-group" style="flex:2;">
                                <label for="restaurantName">Restaurant Name: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                <input type="text" id="restaurantName" name="name" required>
                            </div>

                            <div class="form-group" style="flex:1;">
                                <label for="restaurantCategory">Category: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                <select id="restaurantCategory" name="category" required>
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
                                    <option>Pub / Bar & Grill</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="restaurantDescription">Description:</label>
                            <textarea id="restaurantDescription" name="description" rows="4"></textarea>
                        </div>
                        
                        <div class="vertical-fields">
                            <div class="form-group">
                                <label for="restaurantPhone">Phone:</label>
                                <input type="text" id="restaurantPhone" name="phone" maxlength="11" inputmode="numeric" pattern="\d{11}" placeholder="09XXXXXXXXX">
                            </div>
                            <div class="form-group">
                                <label for="restaurantEmail">Email:</label>
                                <input type="email" id="restaurantEmail" name="email" placeholder="contact@example.com">
                            </div>
                            <div class="inline-pair">
                                <div class="form-group half">
                                    <label for="restaurantFacebookName">Facebook Page Name:</label>
                                    <input type="text" id="restaurantFacebookName" name="facebook_name" placeholder="My Restaurant Page">
                                </div>
                                <div class="form-group half">
                                    <label for="restaurantFacebook">Facebook Page (URL):</label>
                                    <input type="text" id="restaurantFacebook" name="facebook_page" placeholder="https://facebook.com/yourpage">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Business Hours:</label>
                                <div class="hours-input-container">
                                    <button type="button" class="hours-apply-btn" data-prefix="">Apply to all</button>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Monday:</label>
                                        <input type="time" id="mondayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="mondayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="mondayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Tuesday:</label>
                                        <input type="time" id="tuesdayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="tuesdayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="tuesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Wednesday:</label>
                                        <input type="time" id="wednesdayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="wednesdayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="wednesdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Thursday:</label>
                                        <input type="time" id="thursdayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="thursdayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="thursdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Friday:</label>
                                        <input type="time" id="fridayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="fridayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="fridayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Saturday:</label>
                                        <input type="time" id="saturdayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="saturdayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="saturdayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                    <div class="hours-day-row">
                                        <label class="hours-day-label">Sunday:</label>
                                        <input type="time" id="sundayOpen" class="hours-time-input" placeholder="Open">
                                        <span class="hours-separator">to</span>
                                        <input type="time" id="sundayClose" class="hours-time-input" placeholder="Close">
                                        <label class="hours-closed-label"><input type="checkbox" id="sundayClosed" class="hours-closed-checkbox"><span class="hours-closed-text">Closed</span></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="restaurantMenu">Popular Items (comma separated):</label>
                            <input type="text" id="restaurantMenu" name="menu_items" placeholder="e.g., Adobo, Sinigang, Lechon">
                        </div>

                        <!-- Full Menu Items -->
                        <div class="form-group">
                            <label>Full Menu Items with Pricing:</label>
                            <div id="fullMenuContainer" class="full-menu-builder">
                                <div class="full-menu-items-list" id="fullMenuItemsList"></div>
                                <div class="full-menu-add-row">
                                    <select id="newMenuItemCategory" class="menu-item-category-select">
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
                                    <input type="text" id="newMenuItemName" placeholder="Item name" class="menu-item-name-input">
                                    <input type="number" id="newMenuItemPrice" placeholder="₱ Price" class="menu-item-price-input" min="0" step="any">
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="addFullMenuItem('fullMenuItemsList', 'newMenuItemCategory', 'newMenuItemName', 'newMenuItemPrice')">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                            <input type="hidden" id="fullMenuData" name="full_menu">
                        </div>

                        <!-- Pricing and Payment Section -->
                        <div class="form-group">
                            <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                                <i class="fas fa-money-bill-wave"></i> Pricing and Payment
                            </h3>

                            <!-- Price Range -->
                            <div class="form-group">
                                <label for="editPriceRange">Price Range (per meal):</label>
                                <input type="text" id="editPriceRange" name="price_range" placeholder="e.g., ₱150–₱500">
                            </div>

                            <!-- Payment Methods -->
                                <div class="form-group">
                                    <label>Accepted In-Store Payment Methods:</label>
                                    <div class="payment-options">
                                        <label>
                                            <input type="checkbox" name="payment_methods[]" value="Cash"> Cash
                                        </label>
                                        <label>
                                            <input type="checkbox" name="payment_methods[]" value="Credit/Debit Card"> Credit/Debit Card
                                        </label>
                                        <label>
                                            <input type="checkbox" name="payment_methods[]" value="GCash"> GCash
                                        </label>
                                        <label>
                                            <input type="checkbox" name="payment_methods[]" value="Maya"> Maya
                                        </label>
                                        <label>
                                            <input type="checkbox" name="payment_methods[]" value="Bank Transfer"> Bank Transfer
                                        </label>
                                    </div>
                                </div>
                        </div>

                        <!-- Facilities and Services Section -->
                        <div class="form-group">
                            <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.5rem;">
                                <i class="fas fa-concierge-bell"></i> Facilities and Services
                            </h3>
                            
                            <div class="vertical-fields">
                                <!-- Seating Capacity -->
                                <div class="form-group">
                                    <label for="seatingCapacity">Seating Capacity:</label>
                                    <input type="text" id="seatingCapacity" name="seating_capacity" placeholder="e.g., 50-100 people">
                                </div>

                                <!-- Reservation Needed -->
                                <div class="form-group">
                                    <label>Reservation Needed:</label>
                                    <div class="option-group">
                                        <label>
                                            <input type="radio" name="reservation_needed" value="Yes"><span>Yes</span>
                                        </label>
                                        <label>
                                            <input type="radio" name="reservation_needed" value="No"><span>No</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Parking Availability -->
                                <div class="form-group">
                                    <label>Parking Availability:</label>
                                    <div class="option-group">
                                        <label>
                                            <input type="radio" name="parking_availability" value="Yes"><span>Yes</span>
                                        </label>
                                        <label>
                                            <input type="radio" name="parking_availability" value="Limited"><span>Limited</span>
                                        </label>
                                        <label>
                                            <input type="radio" name="parking_availability" value="None"><span>None</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Delivery Options -->
                                <div class="form-group">
                                    <label>Delivery Options:</label>
                                    <div class="option-group">
                                        <label>
                                            <input type="checkbox" name="delivery_options[]" value="Dine-in"><span>Dine-in</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="delivery_options[]" value="Take-out"><span>Take-out</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="delivery_options[]" value="Delivery"><span>Delivery</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Wi-Fi Availability -->
                                <div class="form-group">
                                    <label>Wi-Fi Availability:</label>
                                    <div class="option-group">
                                        <label>
                                            <input type="radio" name="wifi_availability" value="Yes"><span>Yes</span>
                                        </label>
                                        <label>
                                            <input type="radio" name="wifi_availability" value="No"><span>No</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Accessibility -->
                                <div class="form-group">
                                    <label>Accessibility:</label>
                                    <div class="checkbox-grid">
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Wheelchair accessible entrance">
                                            <span>Wheelchair accessible entrance</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Wheelchair accessible seating">
                                            <span>Wheelchair accessible seating</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Wheelchair accessible restroom">
                                            <span>Wheelchair accessible restroom</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Ramp available">
                                            <span>Ramp available</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Parking for persons with disabilities">
                                            <span>PWD parking</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Braille menu or signage">
                                            <span>Braille menu or signage</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Staff assistance available">
                                            <span>Staff assistance available</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="High chair or child seat available">
                                            <span>High chair / child seat</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Near public transport">
                                            <span>Near public transport</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Drop-off area near entrance">
                                            <span>Drop-off area near entrance</span>
                                        </label>
                                        <label>
                                            <input type="checkbox" name="accessibility[]" value="Non-slip flooring">
                                            <span>Non-slip flooring</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="restaurantMenuImages">Menu Images <span id="menuImageCounter" class="image-counter">0/10 selected</span>:</label>
                            <input type="file" 
                                   id="restaurantMenuImages" 
                                   name="menu_images[]" 
                                   accept="image/*" 
                                   multiple
                                   style="display: none;">
                            <small class="hint">Upload up to 10 menu images with prices (PNG/JPG up to 2.5MB each)</small>
                            
                            <!-- Menu Image preview container with inline add tile -->
                            <div id="menuImagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                                <div class="image-add" id="addMenuImageTile">
                                    <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('restaurantMenuImages').click()" aria-label="Add menu images">
                                        <i class="fas fa-plus" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="restaurantLogo">Restaurant Logo (optional):</label>
                            <input type="file" id="restaurantLogo" name="logo" accept="image/*" style="display:none;">
                            <small class="hint">Square PNG/JPG recommended. Max 1.5MB.</small>
                            <div class="logo-row">
                                <div id="addLogoPreviewContainer" class="logo-preview-box" aria-live="polite">
                                    <!-- add logo preview injected here -->
                                </div>
                                <div class="image-add logo-add" id="addLogoTile">
                                    <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('restaurantLogo').click()" aria-label="Select logo">
                                        <i class="fas fa-image" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Multiple Image Upload Section -->
                        <div class="form-group">
                            <label for="multipleImageUpload">Restaurant Pictures <span id="imageCounter" class="image-counter">0/5 selected</span>:</label>
                            <input type="file" 
                                   id="multipleImageUpload" 
                                   name="images[]" 
                                   accept="image/*" 
                                   multiple
                                   style="display: none;">
                            <small class="hint">Select up to 5 images (PNG, JPG up to 3MB each)</small>
                            
                            <!-- Image preview container with inline add tile -->
                            <div id="imagePreviewContainer" class="image-preview-grid" style="margin-top: 10px;">
                                <div class="image-add" id="addImageTile">
                                    <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('multipleImageUpload').click()" aria-label="Add images">
                                        <i class="fas fa-plus" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Address search removed: manual map pinning and latitude/longitude inputs remain -->
                        
                        <div class="form-group">
                            <label>Location on Map:</label>
                            <div class="form-group" style="margin-bottom:8px;">
                                <label for="mapAddressBar">Address (Auto or Manual)</label>
                                <input type="text" id="mapAddressBar" class="map-address-bar" placeholder="Click the map to auto-fill or type address manually">
                            </div>
                            <div class="inline-pair" style="margin-bottom:8px;">
                                <div class="form-group">
                                    <label for="latitude">Latitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                                    <input type="text" id="latitude" name="latitude" placeholder="e.g., 11.4550" required>
                                </div>
                                <div class="form-group">
                                    <label for="longitude">Longitude <span class="required-asterisk" aria-hidden="true">*</span></label>
                                    <input type="text" id="longitude" name="longitude" placeholder="e.g., 123.1525" required>
                                </div>
                            </div>
                            <div id="adminMap" style="height: 300px; border: 2px solid #ddd; border-radius: 5px;"></div>
                            <p style="margin-top:6px;"><small>Click on the map to set the restaurant location</small></p>
                        </div>

                            <div class="add-step-actions">
                                <button type="button" class="btn-primary" id="goToOwnerAccountStepBtn">
                                    Next Page
                                </button>
                            </div>
                        </div>

                        <div id="addRestaurantStep2" class="add-restaurant-step">
                            <p class="tab-subtitle" style="margin-bottom:0.75rem;"><strong>Step 2 of 2:</strong> Owner Account</p>
                            <div class="add-owner-card">
                                <h3><i class="fas fa-user-shield"></i> Add Restaurant Owner Account</h3>
                                <p>Create login credentials for the owner using email or phone number and password.</p>

                                <div class="form-group">
                                    <label for="ownerLoginCredential">Email or Phone Number: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                    <input type="text" id="ownerLoginCredential" name="owner_login" placeholder="e.g., owner@example.com or 09XXXXXXXXX" autocomplete="username">
                                </div>

                                <div class="form-group">
                                    <label for="ownerPasswordCredential">Password: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                    <input type="password" id="ownerPasswordCredential" name="owner_password" minlength="6" placeholder="At least 6 characters" autocomplete="new-password">
                                </div>

                                <div class="form-group">
                                    <label for="ownerConfirmPasswordCredential">Confirm Password: <span class="required-asterisk" aria-hidden="true">*</span></label>
                                    <input type="password" id="ownerConfirmPasswordCredential" name="owner_password_confirm" minlength="6" placeholder="Re-enter password" autocomplete="new-password">
                                </div>
                            </div>

                            <div class="add-step-actions">
                                <button type="button" class="btn-secondary" id="backToRestaurantStepBtn" onclick="(function(){var s1=document.getElementById('addRestaurantStep1');var s2=document.getElementById('addRestaurantStep2');if(s1&&s2){s2.classList.remove('active');s1.classList.add('active');}})();">Back</button>
                                <button type="submit" class="btn-primary" id="submitRestaurantWithOwnerBtn">Add Restaurant</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Manage Restaurants Tab -->
                <div id="manage-restaurants" class="tab-content">
                    <h2><i class="fas fa-list"></i> Manage Restaurants</h2>
                    <!-- Search Bar -->
                        <div class="search-container" style="margin-bottom: 1.5rem; display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="restaurantSearch" placeholder="Search restaurants by name..." style="flex: 1; min-width: 220px; padding: 0.75rem 0.9rem; border: 1.5px solid #e6e8ec; background: #fff; border-radius: var(--radius-sm); font-size: 1rem; transition: border-color 0.2s;">
                        <select id="manageCategorySelect" class="category-select" aria-label="Filter by category">
                            <option value="">All Categories</option>
                        </select>
                        <label style="display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
                            <input type="checkbox" id="hasImagesFilter"> Has Images
                        </label>
                        <div style="display:flex; gap:0.5rem; margin-left:auto;">
                            <button id="printRestaurantsBtn" class="btn-secondary" style="padding: 0.6rem 0.9rem;">Print</button>
                            <button id="clearSearchBtn" style="padding: 0.75rem 1rem; background: var(--brand); color: #fff; border: 0; border-radius: var(--radius-sm); cursor: pointer; transition: transform 0.15s ease, background 0.2s ease;">Clear</button>
                        </div>
                        </div>
                    <div id="categoryFilterNotice" class="category-filter-notice" aria-live="polite"></div>
                    <div id="restaurantsList" class="restaurants-grid">
                        <!-- Restaurants will be loaded here via JavaScript -->
                    </div>
                </div>

                <!-- Reports Tab -->
                <div id="reports" class="tab-content">
                    <h2><i class="fas fa-flag"></i> Review Reports</h2>
                    
                    <div class="reports-filters">
                        <!-- Simplified: only show a refresh button. Reports list shows pending reports to act on. -->
                        <button onclick="loadReports()" class="btn-refresh"><i class="fas fa-sync"></i> Refresh</button>
                    </div>

                    <div id="reportsContainer" class="reports-list">
                        <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading reports...</p>
                    </div>
                </div>

                <!-- Pending Changes Tab -->
                <div id="pending-changes" class="tab-content">
                    <h2><i class="fas fa-clipboard-check"></i> Pending Changes</h2>
                    <p class="tab-subtitle" style="color:#6b7280;margin-bottom:1rem;">Review changes submitted by restaurant owners before they go live.</p>
                    
                    <div class="pending-filter-bar">
                        <select id="changesStatusFilter" onchange="loadPendingChanges()">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="">All</option>
                        </select>
                    </div>

                    <div id="pendingChangesContainer" class="pending-changes-list">
                        <p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading pending changes...</p>
                    </div>
                </div>

                <!-- Statistics Tab -->
                <div id="statistics" class="tab-content">
                    <h2><i class="fas fa-chart-bar"></i> Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total Restaurants</h3>
                            <div class="stat-number" id="totalRestaurants">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>Highest Rated</h3>
                            <div class="stat-text" id="highestRated">-</div>
                        </div>
                    </div>

                    <!-- Bar Chart Section -->
                    <div class="stats-chart-section">
                        <h3>Restaurant Performance</h3>
                        <div class="chart-controls">
                            <select id="statsRestaurantSelect" class="chart-select">
                                <option value="">Select a restaurant</option>
                            </select>
                            <button id="refreshChart" class="btn-secondary" title="Refresh Chart">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="statsChart"></canvas>
                        </div>
                    </div>

                    <!-- Filterable Table Section -->
                    <div class="stats-table-section">
                        <h3>Restaurant Details</h3>
                        <div class="table-filters">
                            <input type="text" id="tableSearch" placeholder="Search restaurants..." class="filter-input">
                            <select id="categoryFilter" class="filter-select">
                                <option value="">All Categories</option>
                            </select>
                            <select id="sortBy" class="filter-select">
                                <option value="name">Name (A-Z)</option>
                                <option value="rating">Rating (High-Low)</option>
                                <option value="reviews">Reviews (High-Low)</option>
                            </select>
                        </div>
                        <div class="table-wrapper">
                            <table id="statsTable" class="stats-table">
                                <thead>
                                    <tr>
                                        <th>Restaurant</th>
                                        <th>Category</th>
                                        <th>Avg Rating</th>
                                        <th>Reviews</th>
                                    </tr>
                                </thead>
                                <tbody id="statsTableBody">
                                    <tr>
                                        <td colspan="4" class="loading-cell">Loading data...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Account Settings Tab -->
                <div id="account-settings" class="tab-content">
                    <h2><i class="fas fa-user-cog"></i> Account Settings</h2>
                    <p class="tab-subtitle" style="color:#6b7280;margin-bottom:1rem;">Update your admin username and password. For security, enter your current password to confirm changes.</p>

                    <form id="adminAccountForm" class="admin-form" autocomplete="off" style="max-width: 620px;">
                        <div class="form-group">
                            <label for="adminCurrentPassword">Current Password <span class="required-asterisk" aria-hidden="true">*</span></label>
                            <input type="password" id="adminCurrentPassword" name="current_password" required minlength="1" autocomplete="current-password">
                        </div>

                        <div class="form-group">
                            <label for="adminNewUsername">New Username <span class="required-asterisk" aria-hidden="true">*</span></label>
                            <input type="text" id="adminNewUsername" name="new_username" required minlength="3" maxlength="100" value="<?php echo htmlspecialchars($_SESSION['admin_username'] ?? ''); ?>" autocomplete="username">
                        </div>

                        <div class="inline-pair">
                            <div class="form-group" style="flex:1;">
                                <label for="adminNewPassword">New Password</label>
                                <input type="password" id="adminNewPassword" name="new_password" minlength="6" placeholder="Leave blank to keep current password" autocomplete="new-password">
                            </div>
                            <div class="form-group" style="flex:1;">
                                <label for="adminConfirmPassword">Confirm New Password</label>
                                <input type="password" id="adminConfirmPassword" name="confirm_password" minlength="6" placeholder="Re-enter new password" autocomplete="new-password">
                            </div>
                        </div>

                        <div class="add-step-actions" style="justify-content:flex-start;">
                            <button type="submit" class="btn-primary" id="adminAccountSaveBtn"><i class="fas fa-save"></i> Save Account Changes</button>
                        </div>
                    </form>
                </div>

                <!-- Restaurant Map Tab -->
                <div id="restaurant-map" class="tab-content">
                    <h2><i class="fas fa-map-marked-alt"></i> Restaurant Locations</h2>
                    <p class="map-description">Explore all registered restaurants in Estancia, Iloilo on an interactive map. Click on any pin to view details, edit the restaurant, or visit its page.</p>
                    <div class="map-wrapper">
                        <div id="allRestaurantsMap" class="all-restaurants-map"></div>
                        
                        <!-- Action buttons - top right -->
                        <div class="map-overlay-actions">
                            <div class="filter-group">
                                <div class="filter-icon-wrapper">
                                    <i class="fas fa-filter"></i>
                                </div>
                                <select id="mapCategoryFilter" class="filter-select">
                                    <option value="">All Categories</option>
                                    <option value="Fast Food">🍔 Fast Food</option>
                                    <option value="Casual Dining">🍽️ Casual Dining</option>
                                    <option value="Fine Dining">🥂 Fine Dining</option>
                                    <option value="Café / Coffee Shop">☕ Café / Coffee Shop</option>
                                    <option value="Buffet">🍱 Buffet</option>
                                    <option value="Food Truck / Street Food">🚚 Food Truck / Street Food</option>
                                    <option value="Bistro / Brasserie">🍷 Bistro / Brasserie</option>
                                    <option value="Fast Casual">🥗 Fast Casual</option>
                                    <option value="Family Style">👨‍👩‍👧‍👦 Family Style</option>
                                    <option value="Pub / Bar & Grill">🍺 Pub / Bar & Grill</option>
                                </select>
                            </div>
                            <button id="refreshMapBtn" class="btn-map-action"><i class="fas fa-sync-alt"></i> Refresh Map</button>
                        </div>
                        
                        <!-- Restaurant count - bottom right -->
                        <div class="map-overlay-count">
                            <span id="mapRestaurantCount" class="map-count"><i class="fas fa-map-marker-alt"></i> <span class="count-number">0</span> restaurants</span>
                        </div>
                    </div>
                    <div class="map-legend">
                        <span style="font-weight: 600; color: #333; margin-right: 0.5rem;"><i class="fas fa-palette"></i> Legend:</span>
                        <div class="legend-item"><span class="legend-dot" style="background: #E53935;"></span> Fast Food</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #FB8C00;"></span> Casual Dining</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #6A1B9A;"></span> Fine Dining</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #8D6E63;"></span> Café</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #FBC02D;"></span> Buffet</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #00897B;"></span> Street Food</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #3949AB;"></span> Bistro</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #43A047;"></span> Fast Casual</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #FDD835;"></span> Family Style</div>
                        <div class="legend-item"><span class="legend-dot" style="background: #5D4037;"></span> Pub / Bar</div>
                    </div>
                </div>
            </div>
        </div>
    </div>  

    <!-- Admin read-only view removed per request -->

    <!-- Maps and app scripts --> 
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        // Multiple Image Upload Functions (handled by js/admin.js). Define a no-op here to avoid double-binding.
        function initializeMultipleImageUpload() { /* noop - real implementation lives in js/admin.js */ }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof initializeLogoInputs === 'function') initializeLogoInputs();
        });

        // ========== REPORTS FUNCTIONALITY ==========
        let reportsData = [];

        async function loadReports() {
            // Simplified: always load pending reports for review
            const status = 'pending';
            const container = document.getElementById('reportsContainer');
            container.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading reports...</p>';

            try {
                console.log('Fetching reports with status:', status);
                const response = await fetch(`api/admin_reports.php?action=list&status=${status}`);
                console.log('Response status:', response.status);
                
                const data = await response.json();
                console.log('API Response:', data);

                if (data.success) {
                    console.log('Reports found:', data.reports.length);
                    reportsData = data.reports;
                    updateReportsCounts(data.counts);
                    renderReports(reportsData);
                } else {
                    console.error('API error:', data.message);
                    container.innerHTML = `<p class="error-text">Error: ${data.message}</p>`;
                }
            } catch (error) {
                console.error('Load reports error:', error);
                container.innerHTML = `<p class="error-text">Failed to load reports: ${error.message}</p>`;
            }
        }

        function updateReportsCounts(counts) {
            // Only update nav badge if present; keep function safe when status badges removed
            const navBadge = document.getElementById('reportsNavBadge');
            if (navBadge) {
                const pending = parseInt(counts.pending || 0, 10);
                if (pending > 0) {
                    navBadge.textContent = pending;
                    navBadge.style.display = 'inline-block';
                    navBadge.setAttribute('aria-label', `${pending} new reports`);
                } else {
                    navBadge.textContent = '0';
                    navBadge.style.display = 'none';
                    navBadge.removeAttribute('aria-label');
                }
            }
        }

        function renderReports(reports) {
            const container = document.getElementById('reportsContainer');
            
            if (!reports || reports.length === 0) {
                container.innerHTML = `<p class="no-data">No reports found.</p>`;
                return;
            }

            container.innerHTML = `
                <div class="reports-list-view">
                    <div class="reports-table">
                        <div class="reports-table-header">
                            <div class="col-id">ID</div>
                            <div class="col-status">Status</div>
                            <div class="col-restaurant">Restaurant</div>
                            <div class="col-reason">Reason</div>
                            <div class="col-date">Date</div>
                            <div class="col-action"></div>
                        </div>
                        ${reports.map(report => `
                            <div class="reports-table-row" data-id="${report.id}" onclick="showReportModal(${report.id})">
                                <div class="col-id">#${report.id}</div>
                                <div class="col-status"><span class="report-status status-${report.status}">${report.status}</span></div>
                                <div class="col-restaurant">${report.restaurant_name || 'Unknown'}</div>
                                <div class="col-reason">${(report.reason || 'No reason').substring(0, 40)}${(report.reason || '').length > 40 ? '...' : ''}</div>
                                <div class="col-date">${new Date(report.created_at).toLocaleDateString()}</div>
                                <div class="col-action"><i class="fas fa-eye"></i></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Report Detail Modal -->
                <div id="reportDetailModal" class="report-modal-overlay" style="display: none;" onclick="closeReportModal(event)">
                    <div class="report-modal" onclick="event.stopPropagation()">
                        <div class="report-modal-header">
                            <h3><i class="fas fa-flag"></i> Report Details</h3>
                            <button class="report-modal-close" onclick="closeReportModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="report-modal-body" id="reportModalContent">
                            <!-- Content will be injected here -->
                        </div>
                    </div>
                </div>
            `;
        }

        function showReportModal(reportId) {
            const report = reportsData.find(r => r.id == reportId);
            if (!report) return;

            const modal = document.getElementById('reportDetailModal');
            const content = document.getElementById('reportModalContent');

            content.innerHTML = `
                <div class="report-modal-info">
                    <div class="report-modal-meta">
                        <span class="report-modal-id">#${report.id}</span>
                        <span class="report-status status-${report.status}">${report.status}</span>
                        <span class="report-modal-date"><i class="fas fa-clock"></i> ${new Date(report.created_at).toLocaleString()}</span>
                    </div>
                    
                    <div class="report-modal-section">
                        <div class="section-label"><i class="fas fa-store"></i> Restaurant</div>
                        <div class="section-content">${report.restaurant_name || 'N/A'}</div>
                    </div>
                    
                    <div class="report-modal-section">
                        <div class="section-label"><i class="fas fa-comment-alt"></i> Reported Review</div>
                        <div class="section-content review-box">
                            <div class="review-box-header">
                                <strong>${report.reviewer_name || 'Anonymous'}</strong>
                                <span class="review-box-rating">${report.rating || 0} <i class="fas fa-star"></i></span>
                            </div>
                            <div class="review-box-comment">${report.comment || 'No comment provided'}</div>
                            <div class="review-box-date">Posted: ${report.review_date ? new Date(report.review_date).toLocaleDateString() : 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="report-modal-section">
                        <div class="section-label"><i class="fas fa-exclamation-triangle"></i> Report Reason</div>
                        <div class="section-content reason-box">${report.reason || 'No reason provided'}</div>
                    </div>
                    
                    <div class="report-modal-section">
                        <div class="section-label"><i class="fas fa-user"></i> Reported By</div>
                        <div class="section-content">
                            ${report.reporter_name || 'Anonymous'}
                            ${report.reporter_email ? `<span class="reporter-email">(${report.reporter_email})</span>` : ''}
                        </div>
                    </div>
                    
                    ${report.description ? `
                    <div class="report-modal-section">
                        <div class="section-label"><i class="fas fa-info-circle"></i> Additional Details</div>
                        <div class="section-content">${report.description}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="report-modal-actions">
                    <button onclick="dismissReport(${report.id}); closeReportModal();" class="btn-modal-action btn-dismiss">
                        <i class="fas fa-ban"></i> Dismiss Report
                    </button>
                    <button onclick="deleteReport(${report.id}); closeReportModal();" class="btn-modal-action btn-delete">
                        <i class="fas fa-trash"></i> Delete Report
                    </button>
                </div>
            `;

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeReportModal(event) {
            if (event && event.target !== event.currentTarget) return;
            const modal = document.getElementById('reportDetailModal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        function hideReportDetails() {
            closeReportModal();
        }

        async function updateReportStatus(reportId) {
            const status = document.getElementById(`status-${reportId}`).value;

            if (status === 'removed' && !confirm('Are you sure you want to REMOVE this review permanently?')) {
                return;
            }

            try {
                const response = await fetch('api/admin_reports.php?action=update_status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        report_id: reportId,
                        status: status
                    })
                });

                const data = await response.json();
                console.log('Update response:', data);

                if (data.success) {
                    alert('Report updated successfully');
                    loadReports();
                } else {
                    alert('Error: ' + data.message + (data.file ? `\n${data.file}:${data.line}` : ''));
                }
            } catch (error) {
                console.error('Update report error:', error);
                alert('Failed to update report');
            }
        }

        // Dismiss a report: mark its status as 'dismissed'
        async function dismissReport(reportId) {
            if (!confirm('Dismiss this report?')) return;
            try {
                const response = await fetch('api/admin_reports.php?action=update_status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ report_id: reportId, status: 'dismissed' })
                });

                const data = await response.json();
                if (data.success) {
                    alert('Report dismissed.');
                    loadReports();
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (e) {
                console.error('Dismiss report error:', e);
                alert('Failed to dismiss report');
            }
        }

        async function deleteReport(reportId) {
            if (!confirm('Delete this report? This action cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch('api/admin_reports.php?action=delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ report_id: reportId })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Report deleted successfully');
                    loadReports();
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Delete report error:', error);
                alert('Failed to delete report');
            }
        }

        // Load reports when the reports tab is clicked
        document.addEventListener('DOMContentLoaded', function() {
            const reportsTab = document.querySelector('[data-tab="reports"]');
            if (reportsTab) {
                reportsTab.addEventListener('click', function() {
                    setTimeout(() => loadReports(), 100);
                });
            }

            const statusFilter = document.getElementById('reportsStatusFilter');
            if (statusFilter) {
                statusFilter.addEventListener('change', loadReports);
            }

            // Fetch initial report counts for nav badge and refresh periodically
            fetchReportCounts();
            setInterval(fetchReportCounts, 1000); // every 1s
        });

        async function fetchReportCounts() {
            try {
                const resp = await fetch('api/admin_reports.php?action=list&status=all');
                if (!resp.ok) return;
                const data = await resp.json();
                if (data && data.success) {
                    updateReportsCounts(data.counts || {});
                }
            } catch (e) {
                console.warn('Failed to fetch report counts', e);
            }
        }

        // ===== PENDING CHANGES MANAGEMENT =====
        window.__fcPendingChangeMaps = window.__fcPendingChangeMaps || {};

        function cleanupPendingChangeMaps(root) {
            const scope = root || document;
            const maps = window.__fcPendingChangeMaps || {};
            Object.keys(maps).forEach(key => {
                const item = maps[key];
                if (!item || !item.map) return;
                const el = document.getElementById(key);
                // If the element no longer exists (rerender), clean it up.
                if (!el || !scope.contains(el)) {
                    try { item.map.remove(); } catch (e) {}
                    delete maps[key];
                }
            });
        }

        function hydrateAdminLocationMapPreviews(root) {
            const scope = root || document;
            const mapEls = Array.from(scope.querySelectorAll('.pc-location-map[data-current-lat][data-current-lng][data-requested-lat][data-requested-lng]'));
            if (!mapEls.length) return;

            // Use the system's built-in Admin map setup (js/admin.js)
            if (typeof createAdminMapboxMap !== 'function' || typeof mapboxgl === 'undefined') {
                mapEls.forEach(el => {
                    const wrap = el.closest('.pc-location-preview-body');
                    if (wrap) {
                        wrap.innerHTML = '<div class="pc-location-map-fallback">Map library not available on this page.</div>';
                    }
                });
                return;
            }

            window.__fcPendingChangeMaps = window.__fcPendingChangeMaps || {};

            mapEls.forEach(el => {
                const id = el.id;
                if (!id) return;
                if (window.__fcPendingChangeMaps[id]) {
                    // Ensure correct sizing after layout
                    try { window.__fcPendingChangeMaps[id].map.resize(); } catch (e) {}
                    return;
                }

                const currentLat = parseFloat(el.dataset.currentLat);
                const currentLng = parseFloat(el.dataset.currentLng);
                const requestedLat = parseFloat(el.dataset.requestedLat);
                const requestedLng = parseFloat(el.dataset.requestedLng);
                const canShow =
                    Number.isFinite(currentLat) && Number.isFinite(currentLng) &&
                    Number.isFinite(requestedLat) && Number.isFinite(requestedLng);
                if (!canShow) return;

                const centerLat = (currentLat + requestedLat) / 2;
                const centerLng = (currentLng + requestedLng) / 2;
                const map = createAdminMapboxMap(id, [centerLat, centerLng], 14, { scrollZoom: false });
                if (!map) return;

                // Markers
                try {
                    new mapboxgl.Marker({ color: '#991b1b' }).setLngLat([currentLng, currentLat]).addTo(map);
                    new mapboxgl.Marker({ color: '#16a34a' }).setLngLat([requestedLng, requestedLat]).addTo(map);
                } catch (e) {}

                // Line + fit bounds once map is ready
                const lineSourceId = `pcLine_${id}`;
                const lineLayerId = `pcLineLayer_${id}`;
                map.on('load', () => {
                    try {
                        if (!map.getSource(lineSourceId)) {
                            map.addSource(lineSourceId, {
                                type: 'geojson',
                                data: {
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: [[currentLng, currentLat], [requestedLng, requestedLat]]
                                    }
                                }
                            });
                        }
                        if (!map.getLayer(lineLayerId)) {
                            map.addLayer({
                                id: lineLayerId,
                                type: 'line',
                                source: lineSourceId,
                                paint: {
                                    'line-color': '#2563eb',
                                    'line-width': 3,
                                    'line-opacity': 0.65
                                }
                            });
                        }
                    } catch (e) {}

                    try {
                        const bounds = new mapboxgl.LngLatBounds();
                        bounds.extend([currentLng, currentLat]);
                        bounds.extend([requestedLng, requestedLat]);
                        map.fitBounds(bounds, { padding: 60, duration: 0 });
                    } catch (e) {}

                    setTimeout(() => { try { map.resize(); } catch (e) {} }, 80);
                });

                window.__fcPendingChangeMaps[id] = { map };
            });
        }

        async function loadPendingChanges() {
            const container = document.getElementById('pendingChangesContainer');
            const statusFilter = document.getElementById('changesStatusFilter')?.value || 'pending';

            cleanupPendingChangeMaps(container);
            
            container.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading changes...</p>';
            
            try {
                const url = statusFilter ? 
                    `api/admin_changes.php?action=get_all&status=${statusFilter}` : 
                    'api/admin_changes.php?action=get_all';
                const resp = await fetch(url);
                const data = await resp.json();
                
                if (!data.success || !data.changes || data.changes.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state" style="text-align:center;padding:2rem;color:#6b7280;">
                            <i class="fas fa-clipboard-check" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;display:block;"></i>
                            <h3>No ${statusFilter || ''} changes found</h3>
                            <p>Changes submitted by restaurant owners will appear here.</p>
                        </div>`;
                    return;
                }
                
                let html = '';
                data.changes.forEach(change => {
                    const changes = change.changes || {};
                    const statusClass = change.status === 'approved' ? 'approved' : change.status === 'rejected' ? 'rejected' : 'pending';
                    const statusIcon = change.status === 'approved' ? 'fa-check-circle' : change.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';
                    const date = new Date(change.created_at).toLocaleString();

                    const toDisplayValue = (value) => {
                        if (value === null || value === undefined) return null;
                        if (Array.isArray(value)) return value.length ? JSON.stringify(value) : null;
                        if (typeof value === 'object') {
                            const keys = Object.keys(value);
                            return keys.length ? JSON.stringify(value) : null;
                        }
                        const text = String(value);
                        return text.trim() === '' ? null : text;
                    };

                    const normalizeImagePath = (path) => {
                        let normalized = String(path || '').trim().replace(/\\+/g, '/');
                        if (!normalized) return '';
                        if (normalized.startsWith('./')) normalized = normalized.slice(2);
                        return normalized;
                    };

                    const parseStructured = (value) => {
                        if (value === null || value === undefined) return null;
                        if (Array.isArray(value) || typeof value === 'object') return value;
                        if (typeof value !== 'string') return value;
                        const trimmed = value.trim();
                        if (!trimmed) return '';
                        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                            try {
                                return JSON.parse(trimmed);
                            } catch (e) {
                                return value;
                            }
                        }
                        return value;
                    };

                    const parseImagePaths = (field, value) => {
                        const fieldName = String(field || '').toLowerCase();
                        const imageField = fieldName.includes('image') || fieldName.includes('logo');
                        if (!imageField || value === null || value === undefined) return [];

                        const acceptImage = (candidate) => {
                            const path = normalizeImagePath(candidate);
                            if (!path) return null;
                            return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path) ? path : null;
                        };

                        if (Array.isArray(value)) {
                            return value.map(acceptImage).filter(Boolean);
                        }

                        if (typeof value === 'string') {
                            const trimmed = value.trim();
                            if (!trimmed) return [];
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed)) {
                                    return parsed.map(acceptImage).filter(Boolean);
                                }
                                if (typeof parsed === 'string') {
                                    const one = acceptImage(parsed);
                                    return one ? [one] : [];
                                }
                            } catch (e) {
                                const one = acceptImage(trimmed);
                                return one ? [one] : [];
                            }
                            return [];
                        }

                        if (typeof value === 'object') {
                            return Object.values(value).map(acceptImage).filter(Boolean);
                        }

                        const one = acceptImage(value);
                        return one ? [one] : [];
                    };

                    const renderHoursValue = (hoursObj) => {
                        if (!hoursObj || typeof hoursObj !== 'object' || Array.isArray(hoursObj)) return null;
                        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        const rows = dayOrder
                            .filter(day => Object.prototype.hasOwnProperty.call(hoursObj, day))
                            .map(day => {
                                const entry = hoursObj[day] || {};
                                const closed = !!entry.closed;
                                const open = entry.open || '';
                                const close = entry.close || '';
                                const label = closed ? 'Closed' : ((open && close) ? `${open} - ${close}` : '—');
                                return `<div class="pc-hours-row"><span class="pc-hours-day">${escapeHtml(day)}</span><span class="pc-hours-time">${escapeHtml(label)}</span></div>`;
                            });
                        return rows.length ? `<div class="pc-hours-list">${rows.join('')}</div>` : null;
                    };

                    const renderFullMenuValue = (value) => {
                        let items = value;
                        if (typeof items === 'string') {
                            const trimmed = items.trim();
                            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                                try { items = JSON.parse(trimmed); } catch (e) { /* ignore */ }
                            }
                        }

                        if (!Array.isArray(items) || items.length === 0) return null;

                        const rows = items.map((item) => {
                            if (!item) return '';
                            if (typeof item === 'string') return item.trim();
                            if (typeof item === 'object') {
                                const name = String(item.name || item.item || '').trim();
                                const price = item.price !== undefined && item.price !== '' ? String(item.price).trim() : '';
                                const category = String(item.category || '').trim();
                                let text = name;
                                if (price) text += (text ? ' - ' : '') + `PHP ${price}`;
                                if (category) text += ` (${category})`;
                                if (text) return text;
                                try { return JSON.stringify(item); } catch (e) { return ''; }
                            }
                            return String(item).trim();
                        }).filter(Boolean);

                        if (!rows.length) return null;
                        return `<div class="pc-full-menu-list">${rows.map(r => `<div class="pc-full-menu-row">${escapeHtml(r)}</div>`).join('')}</div>`;
                    };

                    const renderArrayValue = (items) => {
                        if (!Array.isArray(items) || items.length === 0) return null;
                        const chips = items
                            .map(item => {
                                if (item === null || item === undefined) return '';
                                if (typeof item === 'object') {
                                    try { return JSON.stringify(item); } catch (e) { return ''; }
                                }
                                return String(item).trim();
                            })
                            .filter(Boolean)
                            .map(item => `<span class="pc-chip">${escapeHtml(item)}</span>`)
                            .join('');
                        return chips ? `<div class="pc-chip-list">${chips}</div>` : null;
                    };

                    const renderCellValue = (field, value, emptyLabel = '<em>empty</em>') => {
                        const structuredValue = parseStructured(value);
                        const imagePaths = parseImagePaths(field, value);
                        if (imagePaths.length > 0) {
                            return `<div class="pc-image-list">${imagePaths.map((src, idx) => `
                                <a class="pc-image-link" href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" title="Open image ${idx + 1}">
                                    <img src="${escapeHtml(src)}" alt="${escapeHtml(field)} image ${idx + 1}" class="pc-image-thumb">
                                </a>
                            `).join('')}</div>`;
                        }

                        // Attachment(s) field: render as viewable/downloadable links for any file type
                        const attachFieldName = String(field || '').toLowerCase();
                        if (attachFieldName === 'attachments' || attachFieldName === 'attachment') {
                            const renderOneAttachment = (filePath) => {
                                const fp = normalizeImagePath(String(filePath || ''));
                                if (!fp) return '';
                                const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fp);
                                const isPdf   = /\.pdf$/i.test(fp);
                                const isWord  = /\.(doc|docx)$/i.test(fp);
                                const isExcel = /\.(xls|xlsx)$/i.test(fp);
                                const isPpt   = /\.(ppt|pptx)$/i.test(fp);
                                const isZip   = /\.(zip|rar|7z)$/i.test(fp);
                                const extIcon = isPdf ? 'fa-file-pdf' : isWord ? 'fa-file-lines' : isExcel ? 'fa-file-csv' : isPpt ? 'fa-file-lines' : isZip ? 'fa-file-zipper' : isImage ? 'fa-file-image' : 'fa-file';
                                const iconColor = isPdf ? '#e74c3c' : isWord ? '#2b579a' : isExcel ? '#217346' : isPpt ? '#d04423' : isZip ? '#f39c12' : isImage ? '#8e44ad' : '#607d8b';
                                const fileName = fp.split('/').pop();
                                const shortName = fileName.length > 28 ? fileName.substring(0, 25) + '...' : fileName;

                                const canPreview = isImage || isPdf;
                                const viewCall = `openAttachViewer('${escapeHtml(fp)}','${escapeHtml(fileName)}',${isImage},${isPdf},'${extIcon}','${iconColor}')`;
                                const saveBtn = `<a href="${escapeHtml(fp)}" download="${escapeHtml(fileName)}" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:4px 6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:5px;color:#16a34a;text-decoration:none;font-size:0.73rem;font-weight:500;"><i class="fas fa-download"></i> Save</a>`;

                                if (isImage) {
                                    return `<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;width:160px;flex-shrink:0;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
                                        <div onclick="${viewCall}" title="Click to preview" style="display:block;background:#f8f9fa;cursor:pointer;">
                                            <img src="${escapeHtml(fp)}" alt="${escapeHtml(fileName)}" style="width:100%;height:110px;object-fit:cover;display:block;">
                                        </div>
                                        <div style="padding:7px 9px;border-top:1px solid #f0f0f0;">
                                            <div style="font-size:0.76rem;color:#374151;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(fileName)}">${escapeHtml(shortName)}</div>
                                            <div style="display:flex;gap:6px;margin-top:6px;">
                                                <button onclick="${viewCall}" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:4px 6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;color:#2563eb;font-size:0.73rem;font-weight:500;cursor:pointer;"><i class="fas fa-eye"></i> View</button>
                                                ${saveBtn}
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (isPdf) {
                                    return `<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;width:160px;flex-shrink:0;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
                                        <div onclick="${viewCall}" title="Click to preview" style="display:flex;align-items:center;justify-content:center;height:110px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;cursor:pointer;">
                                            <i class="fas ${extIcon}" style="font-size:2.4rem;color:${iconColor};opacity:0.85;"></i>
                                        </div>
                                        <div style="padding:7px 9px;">
                                            <div style="font-size:0.76rem;color:#374151;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(fileName)}">${escapeHtml(shortName)}</div>
                                            <div style="display:flex;gap:6px;margin-top:6px;">
                                                <button onclick="${viewCall}" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:4px 6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;color:#2563eb;font-size:0.73rem;font-weight:500;cursor:pointer;"><i class="fas fa-eye"></i> View</button>
                                                ${saveBtn}
                                            </div>
                                        </div>
                                    </div>`;
                                } else {
                                    return `<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;width:160px;flex-shrink:0;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
                                        <div style="display:flex;align-items:center;justify-content:center;height:110px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;">
                                            <i class="fas ${extIcon}" style="font-size:2.4rem;color:${iconColor};opacity:0.85;"></i>
                                        </div>
                                        <div style="padding:7px 9px;">
                                            <div style="font-size:0.76rem;color:#374151;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(fileName)}">${escapeHtml(shortName)}</div>
                                            <div style="display:flex;gap:6px;margin-top:6px;">
                                                ${saveBtn}
                                            </div>
                                        </div>
                                    </div>`;
                                }
                            };
                            // Handle both array (new) and single string (legacy)
                            let paths = [];
                            if (Array.isArray(structuredValue)) {
                                paths = structuredValue;
                            } else if (typeof structuredValue === 'string' && structuredValue.trim()) {
                                paths = [structuredValue];
                            }
                            if (paths.length > 0) {
                                return `<div style="display:flex;flex-wrap:wrap;gap:10px;padding:4px 0;">${paths.map(renderOneAttachment).join('')}</div>`;
                            }
                        }

                        const normalizedField = String(field || '').toLowerCase();
                        if (normalizedField === 'full_menu') {
                            const renderedFullMenu = renderFullMenuValue(structuredValue);
                            if (renderedFullMenu) return renderedFullMenu;
                        }
                        if (normalizedField === 'hours') {
                            const renderedHours = renderHoursValue(structuredValue);
                            if (renderedHours) return renderedHours;
                        }

                        const renderedArray = renderArrayValue(structuredValue);
                        if (renderedArray) return renderedArray;

                        const display = toDisplayValue(structuredValue);
                        return display ? escapeHtml(display.substring(0, 200)) : emptyLabel;
                    };
                    
                    html += `<div class="pending-change-card status-${statusClass}" data-id="${change.id}">
                        <div class="pc-header">
                            <div class="pc-info">
                                <h3><i class="fas fa-utensils"></i> ${escapeHtml(change.restaurant_name)}</h3>
                                <span class="pc-meta">
                                    <i class="fas fa-user"></i> ${escapeHtml(change.owner_name)} 
                                    &bull; <i class="fas fa-envelope"></i> ${escapeHtml(change.owner_email)}
                                    &bull; <i class="fas fa-calendar"></i> ${date}
                                </span>
                            </div>
                            <span class="pc-status-badge ${statusClass}">
                                <i class="fas ${statusIcon}"></i> ${change.status.charAt(0).toUpperCase() + change.status.slice(1)}
                            </span>
                        </div>
                        <div class="pc-changes">
                            <table class="pc-changes-table">
                                <thead>
                                    <tr><th>What changed</th><th>Current</th><th>Requested update</th></tr>
                                </thead>
                                <tbody>`;
                    
                    const currentData = change.current_data || {};
                    let supportingDocsHtml = '';
                    for (const [field, newValue] of Object.entries(changes)) {
                        const fieldLower = String(field).toLowerCase();
                        if (fieldLower === 'attachments' || fieldLower === 'attachment') {
                            const rendered = renderCellValue(field, newValue);
                            if (rendered && rendered !== '<em>empty</em>') supportingDocsHtml = rendered;
                            continue;
                        }
                        const currentValue = Object.prototype.hasOwnProperty.call(currentData, field) ? currentData[field] : null;
                        const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        const currentCell = renderCellValue(field, currentValue);
                        const newCell = renderCellValue(field, newValue);
                        
                        html += `<tr>
                            <td><strong>${escapeHtml(fieldLabel)}</strong></td>
                            <td class="pc-old-value">${currentCell}</td>
                            <td class="pc-new-value">${newCell}</td>
                        </tr>`;
                    }
                    
                    html += `</tbody></table></div>`;

                    // Location preview (only when coordinates change)
                    const hasLat = Object.prototype.hasOwnProperty.call(changes, 'latitude');
                    const hasLng = Object.prototype.hasOwnProperty.call(changes, 'longitude');
                    if (hasLat || hasLng) {
                        const currentLat = parseFloat(currentData.latitude);
                        const currentLng = parseFloat(currentData.longitude);
                        const requestedLat = parseFloat(hasLat ? changes.latitude : currentData.latitude);
                        const requestedLng = parseFloat(hasLng ? changes.longitude : currentData.longitude);

                        const canShow =
                            Number.isFinite(currentLat) && Number.isFinite(currentLng) &&
                            Number.isFinite(requestedLat) && Number.isFinite(requestedLng);

                        if (canShow) {
                            html += `
                                <div class="pc-location-preview">
                                    <div class="pc-location-preview-header"><i class="fas fa-map-marker-alt"></i> Location Preview</div>
                                    <div class="pc-location-preview-body">
                                        <div class="pc-location-map-note">Shows <strong>current</strong> (red) and <strong>requested</strong> (green) markers.</div>
                                        <div class="pc-location-map" id="pcLocMap_${change.id}"
                                            data-current-lat="${currentLat}" data-current-lng="${currentLng}"
                                            data-requested-lat="${requestedLat}" data-requested-lng="${requestedLng}"></div>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    if (supportingDocsHtml) {
                        html += `<div class="pc-supporting-docs">
                            <div class="pc-supporting-docs-header"><i class="fas fa-paperclip"></i> Supporting Documents</div>
                            <div class="pc-supporting-docs-body">${supportingDocsHtml}</div>
                        </div>`;
                    }
                    
                    if (change.admin_notes) {
                        html += `<div class="pc-admin-notes"><strong>Admin Notes:</strong> ${escapeHtml(change.admin_notes)}</div>`;
                    }
                    
                    if (change.status === 'pending') {
                        html += `<div class="pc-actions">
                            <div class="pc-notes-input">
                                <input type="text" placeholder="Admin notes (optional)" id="adminNotes_${change.id}" class="pc-notes-field">
                            </div>
                            <div class="pc-buttons">
                                <button class="pc-btn pc-btn-approve" onclick="approveChange(${change.id})">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="pc-btn pc-btn-reject" onclick="rejectChange(${change.id})">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>`;
                    }
                    
                    html += `</div>`;
                });
                
                container.innerHTML = html;
                hydrateAdminLocationMapPreviews(container);
            } catch (err) {
                container.innerHTML = '<p style="color:red;">Error loading changes</p>';
                console.error('Load pending changes error:', err);
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        async function approveChange(changeId) {
            if (!confirm('Approve these changes? They will be applied to the restaurant immediately.')) return;
            
            const notes = document.getElementById('adminNotes_' + changeId)?.value || '';
            
            try {
                const resp = await fetch('api/admin_changes.php?action=approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ change_id: changeId, admin_notes: notes })
                });
                const data = await resp.json();
                if (data.success) {
                    alert('Changes approved and applied!');
                    loadPendingChanges();
                    fetchPendingChangesCounts();
                } else {
                    alert('Error: ' + (data.error || 'Unknown error'));
                }
            } catch(err) {
                alert('Failed to approve changes');
            }
        }

        async function rejectChange(changeId) {
            if (!confirm('Reject these changes?')) return;
            
            const notes = document.getElementById('adminNotes_' + changeId)?.value || '';
            
            try {
                const resp = await fetch('api/admin_changes.php?action=reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ change_id: changeId, admin_notes: notes })
                });
                const data = await resp.json();
                if (data.success) {
                    alert('Changes rejected. Owner has been notified.');
                    loadPendingChanges();
                    fetchPendingChangesCounts();
                } else {
                    alert('Error: ' + (data.error || 'Unknown error'));
                }
            } catch(err) {
                alert('Failed to reject changes');
            }
        }

        async function fetchPendingChangesCounts() {
            try {
                const resp = await fetch('api/admin_changes.php?action=get_pending_count');
                if (!resp.ok) return;
                const data = await resp.json();
                if (data.success) {
                    const badge = document.getElementById('pendingChangesNavBadge');
                    if (badge) {
                        if (data.count > 0) {
                            badge.textContent = data.count;
                            badge.style.display = 'inline-flex';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                }
            } catch(e) {}
        }

        // Load pending changes tab
        document.addEventListener('DOMContentLoaded', function() {
            const changesTab = document.querySelector('[data-tab="pending-changes"]');
            if (changesTab) {
                changesTab.addEventListener('click', function() {
                    setTimeout(() => loadPendingChanges(), 100);
                });
            }
            // Fetch pending changes count on load
            fetchPendingChangesCounts();
            setInterval(fetchPendingChangesCounts, 1000);
        });
    </script>
    <script src="js/admin.js?v=20260115"></script>

    <!-- Attachment Viewer Modal -->
    <div id="attachViewerModal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.82);align-items:center;justify-content:center;">
        <div style="position:relative;background:#fff;border-radius:14px;overflow:hidden;max-width:92vw;max-height:92vh;width:860px;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.55);">
            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#1e293b;color:#fff;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i id="attachViewerIcon" class="fas fa-file" style="font-size:1.15rem;"></i>
                    <span id="attachViewerTitle" style="font-size:0.92rem;font-weight:600;max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <a id="attachViewerDownload" href="#" download style="display:inline-flex;align-items:center;gap:5px;padding:5px 13px;background:#16a34a;border-radius:7px;color:#fff;text-decoration:none;font-size:0.82rem;font-weight:600;"><i class="fas fa-download"></i> Save</a>
                    <button onclick="closeAttachViewer()" style="background:rgba(255,255,255,0.12);border:none;border-radius:7px;color:#fff;width:32px;height:32px;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <!-- Body -->
            <div id="attachViewerBody" style="flex:1;overflow:auto;background:#111;display:flex;align-items:center;justify-content:center;min-height:300px;"></div>
        </div>
    </div>

    <script>
    function openAttachViewer(fp, fileName, isImage, isPdf, extIcon, iconColor) {
        const modal = document.getElementById('attachViewerModal');
        const body  = document.getElementById('attachViewerBody');
        const title = document.getElementById('attachViewerTitle');
        const icon  = document.getElementById('attachViewerIcon');
        const dl    = document.getElementById('attachViewerDownload');

        title.textContent = fileName;
        dl.href = fp;
        dl.download = fileName;

        if (isImage) {
            icon.className = 'fas fa-file-image';
            icon.style.color = '#a78bfa';
            body.style.background = '#111';
            body.innerHTML = `<img src="${fp.replace(/"/g,'&quot;')}" alt="${fileName.replace(/"/g,'&quot;')}" style="max-width:100%;max-height:80vh;object-fit:contain;display:block;margin:auto;padding:12px;">`;
        } else if (isPdf) {
            icon.className = 'fas fa-file-pdf';
            icon.style.color = '#f87171';
            body.style.background = '#fff';
            body.innerHTML = `<iframe src="${fp.replace(/"/g,'&quot;')}" style="width:100%;height:75vh;border:none;display:block;"></iframe>`;
        } else {
            // Non-previewable file: show info card with download prompt
            const fi = extIcon || 'fa-file';
            const fc = iconColor || '#607d8b';
            icon.className = 'fas ' + fi;
            icon.style.color = fc;
            body.style.background = '#f8fafc';
            body.innerHTML = `
                <div style="text-align:center;padding:40px 30px;">
                    <i class="fas ${fi}" style="font-size:5rem;color:${fc};opacity:0.75;display:block;margin-bottom:20px;"></i>
                    <div style="font-size:1.05rem;font-weight:700;color:#1e293b;margin-bottom:8px;word-break:break-all;">${fileName.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                    <div style="font-size:0.88rem;color:#64748b;margin-bottom:28px;">This file type cannot be previewed in the browser.</div>
                    <a href="${fp.replace(/"/g,'&quot;')}" download="${fileName.replace(/"/g,'&quot;')}" style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;"><i class="fas fa-download"></i> Download File</a>
                </div>`;
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function closeAttachViewer() {
        const modal = document.getElementById('attachViewerModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('attachViewerBody').innerHTML = '';
    }
    document.getElementById('attachViewerModal').addEventListener('click', function(e) {
        if (e.target === this) closeAttachViewer();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAttachViewer();
    });
    </script>
</body>
</html>