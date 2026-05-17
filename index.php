<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/functions.php';

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$scriptDir = rtrim($scriptDir, '/');
$appBasePath = ($scriptDir === '' || $scriptDir === '.') ? '' : $scriptDir;
$chatbotWelcomeImageSrc = $appBasePath . '/ChatGPT%20Image%20Mar%209%2C%202026%2C%2008_48_11%20PM1.webp';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#ffb36b">
    <meta name="referrer" content="no-referrer-when-downgrade">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title>Estancia Food Crawl - Discover the Local Restaurants in Estancia, Iloilo</title>
    <link rel="icon" type="image/png" href="android-chrome-512x512.png">
    <link rel="apple-touch-icon" href="android-chrome-192x192.png">
    <link rel="manifest" href="manifest.json">
    <link rel="preconnect" href="https://api.mapbox.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="preconnect" href="https://accounts.google.com" crossorigin>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css" /></noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></noscript>
    
    <!-- Google Sign-In -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <meta name="google-signin-client_id" content="6275535065-cboqtf739hoiq2k621v4f7edsvmf10io.apps.googleusercontent.com">
</head>
<body>
    <!-- Loading Page Animation -->
    <div class="page-loading" id="pageLoading">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading...</p>
        </div>
    </div>

<?php include 'includes/header.php'; ?>
    <div class="container">
        <!-- Sidebar toggle (moved out of header) -->
        <button id="sidebarToggle" class="sidebar-toggle" aria-label="Toggle search sidebar" aria-expanded="false"><i class="fas fa-bars" aria-hidden="true"></i></button>

        <div class="sidebar-overlay" id="sidebarOverlay" role="presentation"></div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="search-container">
                    <div class="search-input-wrap">
                        <input type="text" id="searchInput" placeholder="Search restaurants or dishes...">
                        <button id="clearSearchBtn" type="button" aria-label="Clear search">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <button id="searchBtn" type="button" aria-label="Search"><i class="fas fa-search" aria-hidden="true"></i></button>
                </div>

                <!-- sidebar-body becomes the scrollable area containing lists -->
                <div class="sidebar-body">
                    <div class="recommendations" id="recommendationsContainer">
                        <div class="recommendation-filters" id="recommendationFilters" role="tablist" aria-label="Recommendations filter">
                            <button class="recommendation-filter active" type="button" data-filter="all">
                                <span>All</span>
                            </button>
                            <button class="recommendation-filter" type="button" data-filter="popular">
                                <i class="fas fa-fire"></i>
                                <span>Popular</span>
                            </button>
                            <button class="recommendation-filter" type="button" data-filter="nearest">
                                <span>Nearest</span>
                                <i class="fas fa-location-arrow"></i>
                            </button>
                        </div>
                        <div class="location-permission-request">
                            <button type="button" class="location-close-btn" id="closeLocationPrompt" aria-label="Dismiss">&times;</button>
                            <div class="location-permission-icon">
                                <i class="fas fa-location-dot"></i>
                            </div>
                            <h3>Enable Location</h3>
                            <p>Allow access to your location to see nearby restaurants and get directions</p>
                            <button id="enableLocationBtn" class="btn-enable-location">
                                <span class="btn-content">
                                    <i class="fas fa-map-marker-alt"></i> Enable Location
                                </span>
                                <span class="btn-loader" style="display: none;">
                                    <i class="fas fa-spinner fa-spin"></i> Getting Location...
                                </span>
                            </button>
                        </div>
                        <div id="recommendationsList"></div>
                    </div>

                    <div class="search-results">
                        <div class="recommendation-filters search-result-filters" id="searchResultFilters" role="tablist" aria-label="Search results filter">
                            <button class="recommendation-filter active" type="button" data-filter="all">
                                <span>All</span>
                            </button>
                            <button class="recommendation-filter" type="button" data-filter="popular">
                                <i class="fas fa-fire"></i>
                                <span>Popular</span>
                            </button>
                            <button class="recommendation-filter" type="button" data-filter="nearest">
                                <span>Nearest</span>
                                <i class="fas fa-location-arrow"></i>
                            </button>
                        </div>
                        <h3>Search Results</h3>
                        <div id="resultsList"></div>
                    </div>
                </div>
                <!-- Slim footer at the bottom of sidebar (empty, visual anchor) -->
                <div class="sidebar-footer"></div>
            </div>

            <!-- Map Container -->
            <div class="map-container">
                <div id="map"></div>
                <!-- Layer Control UI for base maps -->
                <div class="layers-panel" style="display:none;">
                    <div class="layers-section-title">Base Map</div>
                    <label class="layer-option">
                        <input type="radio" name="baseLayer" value="Standard" checked>
                        <span class="layer-icon"><i class="fas fa-map"></i></span>
                        <span>Standard</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="baseLayer" value="Streets">
                        <span class="layer-icon"><i class="fas fa-road"></i></span>
                        <span>Streets</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="baseLayer" value="Satellite">
                        <span class="layer-icon"><i class="fas fa-satellite"></i></span>
                        <span>Satellite</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="baseLayer" value="Outdoors">
                        <span class="layer-icon"><i class="fas fa-mountain"></i></span>
                        <span>Outdoors</span>
                    </label>
                </div>
                <!-- Category Chips (Google Maps Style) -->
                <div class="category-chips-container" id="categoryChipsContainer">
                    <div class="category-chips-scroll">
                        <button class="category-chip" data-category="all">
                            <i class="fas fa-utensils"></i>
                            <span>All</span>
                        </button>
                        <button class="category-chip" data-category="Fast Food" style="--chip-color: #E53935;">
                            <i class="fas fa-burger"></i>
                            <span>Fast Food</span>
                        </button>
                        <button class="category-chip" data-category="Casual Dining" style="--chip-color: #FB8C00;">
                            <i class="fas fa-utensils"></i>
                            <span>Casual Dining</span>
                        </button>
                        <button class="category-chip" data-category="Fine Dining" style="--chip-color: #6A1B9A;">
                            <i class="fas fa-wine-glass"></i>
                            <span>Fine Dining</span>
                        </button>
                        <button class="category-chip" data-category="Café / Coffee Shop" style="--chip-color: #8D6E63;">
                            <i class="fas fa-mug-hot"></i>
                            <span>Café</span>
                        </button>
                        <button class="category-chip" data-category="Buffet" style="--chip-color: #FBC02D;">
                            <i class="fas fa-concierge-bell"></i>
                            <span>Buffet</span>
                        </button>
                        <button class="category-chip" data-category="Food Truck / Street Food" style="--chip-color: #00897B;">
                            <i class="fas fa-truck"></i>
                            <span>Street Food</span>
                        </button>
                        <button class="category-chip" data-category="Bistro / Brasserie" style="--chip-color: #3949AB;">
                            <i class="fas fa-store"></i>
                            <span>Bistro</span>
                        </button>
                        <button class="category-chip" data-category="Fast Casual" style="--chip-color: #43A047;">
                            <i class="fas fa-pizza-slice"></i>
                            <span>Fast Casual</span>
                        </button>
                        <button class="category-chip" data-category="Family Style" style="--chip-color: #FDD835;">
                            <i class="fas fa-users"></i>
                            <span>Family Style</span>
                        </button>
                        <button class="category-chip" data-category="Pub / Bar & Grill" style="--chip-color: #5D4037;">
                            <i class="fas fa-beer-mug-empty"></i>
                            <span>Pub & Grill</span>
                        </button>
                    </div>
                </div>
                <!-- Directions Open Button -->
                <button class="directions-open-btn" id="directionsOpenBtn" onclick="showDirectionsPanel();" aria-label="Show directions">
                    <i class="fas fa-route"></i>
                </button>            </div>
        </div>
    </div>

    <!-- Directions Panel (outside map container so position:fixed is always viewport-relative) -->
    <div class="directions-sidebar-backdrop" id="directionsOverlay" onclick="hideDirectionsPanel()" role="presentation"></div>
    <div class="directions-sidebar" id="directionsPanel">
        <div class="sheet-grab-handle" role="button" tabindex="0" aria-label="Close panel" onclick="hideDirectionsPanel()" onkeydown="if(event.key==='Enter'||event.key===' ')hideDirectionsPanel()"></div>
        <div class="directions-sidebar-header">
            <span class="directions-header-title"><i class="fas fa-route"></i> Directions</span>
            <button class="directions-close-btn directions-close-desktop" type="button" aria-label="Close directions" onclick="hideDirectionsPanel();">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </div>
        <div class="directions-sidebar-content">
            <div id="directionsContent" class="route-placeholder">
                <i class="fas fa-route"></i>
                <p>Choose a restaurant and tap Get Directions to see turn-by-turn steps.</p>
            </div>
        </div>
    </div>

    <!-- App Bottom Navigation Footer -->
    <nav class="app-footer" role="navigation" aria-label="Main navigation">
        <button class="nav-btn" id="footerLayersBtn" onclick="footerToggleLayers()" aria-label="Map Layers">
            <i class="fas fa-layer-group"></i>
            <span>Layers</span>
        </button>
        <button class="nav-btn" id="footerDirectionsBtn" onclick="showDirectionsPanel()" aria-label="Directions">
            <i class="fas fa-route"></i>
            <span>Directions</span>
        </button>
        <button class="nav-btn nav-btn--home" id="footerHomeBtn" onclick="footerGoHome()" aria-label="Home">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </button>
        <button class="nav-btn" id="footerLegendBtn" onclick="footerToggleLegend()" aria-label="Map Legend">
            <i class="fas fa-list"></i>
            <span>Legend</span>
        </button>
        <button class="nav-btn" id="footerSavedBtn" onclick="showSavedRestaurantsPanel()" aria-label="Saved Restaurants">
            <i class="fas fa-bookmark"></i>
            <span>Saved</span>
        </button>
    </nav>

    <!-- Saved Restaurants Panel -->
    <div class="saved-panel-backdrop" id="savedPanelBackdrop" onclick="closeSavedPanel()"></div>
    <div class="saved-panel" id="savedPanel" role="dialog" aria-modal="true" aria-label="Saved Restaurants">
        <div class="sheet-grab-handle" role="button" tabindex="0" aria-label="Close panel" onclick="closeSavedPanel()" onkeydown="if(event.key==='Enter'||event.key===' ')closeSavedPanel()"></div>
        <div class="saved-panel-header">
            <h3><i class="fas fa-bookmark"></i> Saved Restaurants</h3>
            <button class="saved-panel-close" type="button" aria-label="Close saved restaurants" onclick="closeSavedPanel()">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </div>
        <div class="saved-panel-body" id="savedPanelBody"></div>
    </div>

    <!-- Map Layers Bottom Sheet -->
    <div class="saved-panel-backdrop" id="layersSheetBackdrop" onclick="closeLayersSheet()"></div>
    <div class="saved-panel" id="layersSheet" role="dialog" aria-modal="true" aria-label="Map Layers">
        <div class="sheet-grab-handle" role="button" tabindex="0" aria-label="Close panel" onclick="closeLayersSheet()" onkeydown="if(event.key==='Enter'||event.key===' ')closeLayersSheet()"></div>
        <div class="saved-panel-header">
            <h3><i class="fas fa-layer-group"></i> Map Layers</h3>
        </div>
        <div class="saved-panel-body">
            <div class="layers-sheet-inner">
                <div class="layers-section">
                    <div class="layers-section-title">Base Map</div>
                    <label class="layer-option">
                        <input type="radio" name="sheetBaseLayer" value="Standard" checked>
                        <span class="layer-icon"><i class="fas fa-map"></i></span>
                        <span>Standard</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="sheetBaseLayer" value="Streets">
                        <span class="layer-icon"><i class="fas fa-road"></i></span>
                        <span>Streets</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="sheetBaseLayer" value="Satellite">
                        <span class="layer-icon"><i class="fas fa-satellite"></i></span>
                        <span>Satellite</span>
                    </label>
                    <label class="layer-option">
                        <input type="radio" name="sheetBaseLayer" value="Outdoors">
                        <span class="layer-icon"><i class="fas fa-mountain"></i></span>
                        <span>Outdoors</span>
                    </label>
                </div>
                <div class="layers-section">
                    <div class="layers-section-title">Overlays</div>
                    <label class="layer-option">
                        <input type="checkbox" id="sheet_coverageLayerToggle">
                        <span class="toggle-switch"></span>
                        <span>Coverage Area</span>
                    </label>
                    <label class="layer-option">
                        <input type="checkbox" id="sheet_restaurantsLayerToggle" checked>
                        <span class="toggle-switch"></span>
                        <span>Restaurants</span>
                    </label>
                    <label class="layer-option">
                        <input type="checkbox" id="sheet_statusDotsToggle" checked>
                        <span class="toggle-switch"></span>
                        <span>Status Dots</span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- Legend Bottom Sheet -->
    <div class="saved-panel-backdrop" id="legendSheetBackdrop" onclick="closeLegendSheet()"></div>
    <div class="saved-panel" id="legendSheet" role="dialog" aria-modal="true" aria-label="Map Legend">
        <div class="sheet-grab-handle" role="button" tabindex="0" aria-label="Close panel" onclick="closeLegendSheet()" onkeydown="if(event.key==='Enter'||event.key===' ')closeLegendSheet()"></div>
        <div class="saved-panel-header">
            <h3><i class="fas fa-list"></i> Legend</h3>
        </div>
        <div class="saved-panel-body" id="legendSheetBody"></div>
    </div>

    <!-- Loading Modal -->
    <div class="loading-modal" id="loadingModal">
        <div class="loading-modal-content">
            <div class="loading-modal-spinner"></div>
            <p class="loading-modal-text">Getting directions...</p>
        </div>
    </div>

    <div class="marker-loading-modal" id="markerLoadingModal" aria-hidden="true">
        <div class="marker-loading-modal-content" role="status" aria-live="polite">
            <div class="marker-loading-spinner"></div>
            <p class="marker-loading-text">Loading pins...</p>
        </div>
    </div>

    <!-- Chatbot Widget -->
    <div class="chatbot-widget">
        <div class="chatbot-icon" id="chatbotIcon">
            <i class="fas fa-robot"></i>
        </div>
        <div class="chatbot-hint" id="chatbotHint" aria-hidden="true">Need help? Ask me!</div>
        <div class="chatbot-modal" id="chatbotModal">
            <div class="chatbot-header">
                <button class="close-chatbot" id="closeChatbot" aria-label="Back"><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
                <h3>Food Crawl Assistant</h3>
                <div class="chatbot-menu-wrapper" id="chatbotMenuWrapper">
                    <button class="chatbot-menu-btn" id="chatbotMenuBtn" type="button" aria-label="Menu" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
                    </button>
                    <div class="chatbot-menu-dropdown" id="chatbotMenuDropdown">
                        <button class="chatbot-menu-item" id="chatbotExpandToggle" type="button">
                            <i class="fas fa-expand-alt"></i> Expand
                        </button>
                        <button class="chatbot-menu-item" id="chatbotMenuToggleSuggestions" type="button">
                            <i class="fas fa-lightbulb"></i> Remove prompt suggestions
                        </button>
                        <button class="chatbot-menu-item chatbot-menu-item--danger" id="chatbotMenuClear" type="button">
                            <i class="fas fa-trash"></i> Delete conversation
                        </button>
                    </div>
                </div>
            </div>
            <div class="chatbot-messages" id="chatbotMessages" data-empty-image-src="<?php echo htmlspecialchars($chatbotWelcomeImageSrc, ENT_QUOTES, 'UTF-8'); ?>">
                <div class="chatbot-empty-state" id="chatbotEmptyState" aria-hidden="true">
                    <img src="<?php echo htmlspecialchars($chatbotWelcomeImageSrc, ENT_QUOTES, 'UTF-8'); ?>" alt="Assistant welcome" class="chatbot-empty-image" loading="lazy" decoding="async">
                    <p class="chatbot-empty-text">How can I help you?</p>
                </div>
            </div>
            <div class="chatbot-suggestions-wrapper" id="chatbotSuggestionsWrapper">
                <button class="chatbot-suggestions-close" id="closeSuggestions" aria-label="Hide suggestions"><i class="fas fa-times"></i></button>
                <div class="chatbot-suggestions" id="chatbotSuggestions" aria-label="Suggested prompts">
                    <div class="chatbot-suggestions-track" id="chatbotSuggestionsTrack"></div>
                </div>
            </div>
            <div class="chatbot-footer">
                <div class="chatbot-input">
                    <textarea id="chatbotInput" placeholder="Ask about restaurants..." rows="1"></textarea>
                    <button id="sendMessage" aria-label="Send message"><i class="fas fa-arrow-up"></i></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Floating Navigation Controls (shown when route is active) -->
    <!-- Floating Navigation Controls removed per user request -->

    <!-- Restaurant Details Modal -->
    <div class="modal" id="restaurantModal">
        <div class="modal-content">
            
            <div id="restaurantDetails"></div>
        </div>
    </div>

    <div id="lightbox" class="lightbox" aria-modal="true" role="dialog">
  <button id="lightboxClose" class="lightbox-close" aria-label="Close"><i class="fas fa-times"></i></button>
  <img id="lightboxImg" alt="">
</div>


    <!-- Reviews Display Modal -->
    <div id="reviewsDisplayModal" class="modal" style="display: none;">
        <div class="modal-content modal-content-large">
            <div id="reviewsModalHeader" class="modal-header"></div>
            <div id="reviewsModalContent" class="reviews-modal-list"></div>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="modal" style="display: none;">
        <div class="modal-content modal-login">
            <span class="modal-close" onclick="closeLoginModal()">&times;</span>
            <div class="login-container">
                <div class="login-header">
                    <img src="Your%20paragraph%20text%20(1)2.webp" alt="FoodCrawl" class="login-logo" loading="lazy" decoding="async">
                    <p>Sign in to leave reviews</p>
                </div>
                
                <form id="loginForm">
                    <!-- Manual email/password removed — users sign in with Google or create an account -->

                    <div class="login-divider">
                        <span>Sign in with Google</span>
                    </div>

                    <div id="g_id_onload"
                        data-client_id="6275535065-cboqtf739hoiq2k621v4f7edsvmf10io.apps.googleusercontent.com"
                        data-callback="handleGoogleCredentialResponse"
                        data-auto_prompt="false">
                    </div>

                    <!-- Dedicated container for the Google renderButton -->
                    <div id="googleButtonContainer" class="google-button-container"></div>
                </form>
            </div>
        </div>
    </div>

    <!-- Welcome / Location Modal (shows once; clicking Continue hides permanently) -->
    <div class="location-modal hidden" id="locationModal" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="location-modal-content">
            <div class="location-icon">
                <img src="Your paragraph text (1)2.webp" alt="Estancia Food Crawl" class="location-logo" loading="lazy" decoding="async">
            </div>
            <h2>Welcome to Estancia Food Crawl</h2>
            <p>Discover the best local restaurants nearby and explore a variety of delicious dishes waiting for you.</p>
            <div class="location-modal-buttons">
                <button class="btn-continue" id="continueBtn" style="background:#ffb36b;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-weight:600;">
                    Continue
                </button>
            </div>
        </div>
    </div>


    <script>
        window.APP_BASE_PATH = <?php echo json_encode($appBasePath, JSON_UNESCAPED_SLASHES); ?>;
    </script>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js" defer></script>
    <script src="js/script.js" defer></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
      }
    </script>
</body>
</html>