// ============================================================================
// js/admin.js - FIXED VERSION WITH ADDRESS GEOCODING
// ============================================================================

let adminMap;
let marker;
let geocodeMarker = null;
let editMap = null;
let editMarker = null;
let allRestaurantsMap = null;
let allRestaurantsMarkers = [];
let dashboardMap = null;
let dashboardMarkers = [];
let dashboardMapRestaurants = [];
let dashboardMapCategoryFilter = '';
const DASHBOARD_HOME_CENTER = [11.456453464374693, 123.15114185203521];
const DASHBOARD_HOME_ZOOM = 13;
let activeDashboardCategory = '';
let activeDashboardRestaurantId = null;
let activeDashboardRestaurantName = '';
const addressFieldSyncHandlers = {};
let ADMIN_MAPBOX_ACCESS_TOKEN = null; // Loaded dynamically from api/get_token.php
const ADMIN_MAPBOX_STYLE = 'mapbox://styles/kentts/cmkpgwobm002x01r8gmwofm40';

// Fetch Mapbox token from backend on page load
window.addEventListener('DOMContentLoaded', function() {
    fetch('api/get_token.php')
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                ADMIN_MAPBOX_ACCESS_TOKEN = data.token;
                mapboxgl.accessToken = ADMIN_MAPBOX_ACCESS_TOKEN;
            }
        })
        .catch(error => console.warn('Could not load Mapbox token:', error));
});

function createAdminMapboxMap(containerId, center, zoom, options = {}) {
    if (typeof mapboxgl === 'undefined') {
        console.error('Mapbox GL JS not loaded');
        return null;
    }
    mapboxgl.accessToken = ADMIN_MAPBOX_ACCESS_TOKEN;
    const useCompactAttribution = options.compactAttribution === true;
    const showAttributionControl = useCompactAttribution ? false : (options.attributionControl !== false);
    const mapInstance = new mapboxgl.Map({
        container: containerId,
        style: ADMIN_MAPBOX_STYLE,
        center: [center[1], center[0]],
        zoom,
        attributionControl: showAttributionControl
    });

    if (useCompactAttribution) {
        try {
            mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }));
        } catch (e) {
            // ignore
        }
    }

    if (options.scrollZoom === false) {
        mapInstance.scrollZoom.disable();
    }
    mapInstance.dragRotate.disable();
    mapInstance.touchZoomRotate.disableRotation();

    mapInstance.setView = function(centerLatLng, zoomLevel, opts = {}) {
        const duration = opts.animate === false ? 0 : 500;
        mapInstance.easeTo({
            center: [centerLatLng[1], centerLatLng[0]],
            zoom: typeof zoomLevel === 'number' ? zoomLevel : mapInstance.getZoom(),
            duration
        });
    };
    mapInstance.invalidateSize = function() { mapInstance.resize(); };
    mapInstance.closePopup = function() {
        if (mapInstance.__activePopup) {
            try { mapInstance.__activePopup.remove(); } catch (e) {}
            mapInstance.__activePopup = null;
        }
    };

    return mapInstance;
}

function createAdminMarker(mapInstance, lat, lng, html, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const el = wrapper.firstElementChild || wrapper;
    return new mapboxgl.Marker({ element: el, anchor: options.anchor || 'bottom' })
        .setLngLat([lng, lat])
        .addTo(mapInstance);
}

// Estancia municipality boundary GeoJSON from OpenStreetMap (relation 3477885)
function getEstanciaBoundaryGeoJSON() {
    return {
        type: 'Feature',
        properties: { name: 'Estancia, Iloilo', admin_level: 6 },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [123.1042526, 11.4309855],
                [123.1074160, 11.4467843],
                [123.1081655, 11.4474309],
                [123.1084462, 11.4491410],
                [123.1094295, 11.4517752],
                [123.1109281, 11.4546401],
                [123.1106465, 11.4562119],
                [123.1120516, 11.4583373],
                [123.1115827, 11.4594932],
                [123.1135635, 11.4619250],
                [123.1134931, 11.4623554],
                [123.1134294, 11.4626074],
                [123.1135478, 11.4628439],
                [123.1137230, 11.4628751],
                [123.1141804, 11.4630847],
                [123.1142214, 11.4632743],
                [123.1139688, 11.4638297],
                [123.1140780, 11.4639100],
                [123.1143397, 11.4636491],
                [123.1145582, 11.4635442],
                [123.1147221, 11.4635799],
                [123.1150020, 11.4638520],
                [123.1152296, 11.4640818],
                [123.1157531, 11.4641375],
                [123.1160398, 11.4643717],
                [123.1160831, 11.4646684],
                [123.1159413, 11.4652128],
                [123.1157257, 11.4654557],
                [123.1155358, 11.4657017],
                [123.1156677, 11.4659635],
                [123.1160178, 11.4661127],
                [123.1162022, 11.4663822],
                [123.1165530, 11.4670698],
                [123.1168813, 11.4677953],
                [123.1169457, 11.4680476],
                [123.1167687, 11.4682779],
                [123.1164243, 11.4685050],
                [123.1161443, 11.4686596],
                [123.1162602, 11.4690791],
                [123.1164275, 11.4694135],
                [123.1166479, 11.4694525],
                [123.1169348, 11.4693287],
                [123.1170954, 11.4692812],
                [123.1171413, 11.4693094],
                [123.1173515, 11.4697071],
                [123.1173029, 11.4699452],
                [123.1171686, 11.4702352],
                [123.1171659, 11.4702904],
                [123.1171972, 11.4703510],
                [123.1174288, 11.4704109],
                [123.1176695, 11.4704393],
                [123.1178330, 11.4707177],
                [123.1179628, 11.4711862],
                [123.1182024, 11.4714780],
                [123.1184262, 11.4720883],
                [123.1186392, 11.4722392],
                [123.1189684, 11.4722366],
                [123.1197391, 11.4720980],
                [123.1200097, 11.4719216],
                [123.1206503, 11.4710865],
                [123.1208672, 11.4710380],
                [123.1213278, 11.4713718],
                [123.1217678, 11.4715564],
                [123.1218793, 11.4717765],
                [123.1219052, 11.4720529],
                [123.1218160, 11.4722480],
                [123.1214466, 11.4726381],
                [123.1210719, 11.4728863],
                [123.1209560, 11.4730724],
                [123.1211073, 11.4735992],
                [123.1217092, 11.4744193],
                [123.1221083, 11.4746306],
                [123.1225911, 11.4747164],
                [123.1239720, 11.4748099],
                [123.1246769, 11.4756111],
                [123.1256446, 11.4758203],
                [123.1270699, 11.4760165],
                [123.1283399, 11.4763287],
                [123.1297882, 11.4766847],
                [123.1319969, 11.4761390],
                [123.1331863, 11.4765583],
                [123.1335967, 11.4773793],
                [123.1348096, 11.4798056],
                [123.1357388, 11.4814079],
                [123.1370252, 11.4820247],
                [123.1386035, 11.4821472],
                [123.1408559, 11.4819246],
                [123.1419388, 11.4825389],
                [123.1475590, 11.4906707],
                [123.1475582, 11.4929820],
                [123.1487757, 11.4952924],
                [123.1504154, 11.4911305],
                [123.1564713, 11.4895831],
                [123.1718928, 11.4780858],
                [123.1898970, 11.4537157],
                [123.2051710, 11.4423615],
                [123.2150585, 11.4330320],
                [123.2166081, 11.4205921],
                [123.2136566, 11.3954213],
                [123.2077851, 11.3949343],
                [123.1945870, 11.3966560],
                [123.1650257, 11.4106524],
                [123.1592760, 11.4200750],
                [123.1326497, 11.4210971],
                [123.1146958, 11.4277925],
                [123.1042526, 11.4309855]
            ]]
        }
    };
}

// Add Estancia boundary outline to any Mapbox map instance
function addEstanciaBoundaryToMap(mapInstance) {
    if (!mapInstance) return;
    const srcId = 'estancia-boundary-source';
    const lineId = 'estancia-boundary-line';
    const fillId = 'estancia-boundary-fill';
    try {
        if (mapInstance.getSource(srcId)) return; // already added
        mapInstance.addSource(srcId, { type: 'geojson', data: getEstanciaBoundaryGeoJSON() });
        mapInstance.addLayer({
            id: fillId, type: 'fill', source: srcId,
            paint: { 'fill-color': '#4285f4', 'fill-opacity': 0.06 }
        });
        mapInstance.addLayer({
            id: lineId, type: 'line', source: srcId,
            paint: { 'line-color': '#e53935', 'line-width': 2, 'line-opacity': 0.7 }
        });
    } catch (e) {
        console.warn('Failed to add Estancia boundary:', e);
    }
}

// Estancia, Iloilo – precise boundary polygon check (ray-casting algorithm)
const _estanciaBoundaryRing = getEstanciaBoundaryGeoJSON().geometry.coordinates[0]; // [[lng, lat], ...]

// Check if coordinates are within Estancia municipality boundary
function isWithinEstancia(lat, lng) {
    // Ray-casting point-in-polygon test
    const ring = _estanciaBoundaryRing;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][1], yi = ring[i][0]; // lat, lng
        const xj = ring[j][1], yj = ring[j][0];
        if (((yi > lng) !== (yj > lng)) &&
            (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// Get category-specific icon class
function getCategoryIconClass(category) {
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

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminMap();
    initializeDashboardMap();
    loadRestaurantsForAdmin();
    loadStatistics();
    loadDashboard();
    setupAdminEventListeners();
    setupDashboardInteractions();
    setupAddressComposers();
    // Ensure phone inputs accept digits only and max 11 characters
    try { registerAdminPhoneValidation(); } catch (e) { /* ignore */ }
    // Allow phone to be marked as not provided in admin forms
    try { setupPhoneOptionalButtons(); } catch (e) { /* ignore */ }
    // Wire up logout confirmation modal (if present)
    try { setupLogoutConfirmation(); } catch (e) { /* ignore */ }
});

// Ensure phone inputs in admin forms accept digits only and max 11 characters
function registerAdminPhoneValidation() {
    const ids = ['restaurantPhone', 'editRestaurantPhone'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('inputmode', 'numeric');
        el.setAttribute('maxlength', '11');
        el.setAttribute('pattern', '\\d{11}');

        el.addEventListener('input', function () {
            const cleaned = this.value.replace(/\D+/g, '').slice(0, 11);
            if (this.value !== cleaned) this.value = cleaned;
            this.setCustomValidity('');
        });

        el.addEventListener('blur', function () {
            if (this.value.length === 0) { this.setCustomValidity(''); return; }
            if (this.value.length !== 11) this.setCustomValidity('Phone number must be 11 digits');
            else this.setCustomValidity('');
        });

        el.addEventListener('invalid', function () {
            if (this.value.length === 0) return;
            this.setCustomValidity('Phone number must be 11 digits and contain numbers only');
        });
    });
}

// Toggle phone field as optional to allow saving without a number
function setupPhoneOptionalButtons() {
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
        const input = targetId ? document.getElementById(targetId) : null;
        if (!input) return;

        // Initialize based on current required state
        setOptionalState(input, button, !input.required);

        button.addEventListener('click', () => {
            const makeOptional = !button.classList.contains('is-optional');
            setOptionalState(input, button, makeOptional);
            if (!makeOptional && input.value.length === 0) input.focus();
        });
    });
}

// ============================================================================
// DASHBOARD FUNCTIONALITY
// ============================================================================

async function loadDashboard() {
    console.log('loadDashboard started');
    try {
        // Load restaurants data for dashboard (use getAll, same as loadRestaurantsForAdmin)
        const response = await fetch('api/admin_restaurants.php?action=getAll');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Response text length:', responseText.length);
        let restaurants;
        
        try {
            restaurants = JSON.parse(responseText);
            console.log('Parsed restaurants:', restaurants);
        } catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        if (restaurants && restaurants.error) {
            throw new Error(restaurants.error);
        }
        
        if (!Array.isArray(restaurants)) {
            console.log('Restaurants is not an array, setting to empty');
            restaurants = [];
        }

        updateDashboardFromRestaurants(restaurants);
        
        // Load reports data
        let pendingReports = 0;
        try {
            const reportsResp = await fetch('api/admin_reports.php?action=list&status=pending');
            if (reportsResp.ok) {
                const reportsData = await reportsResp.json();
                if (reportsData.success && reportsData.reports) {
                    pendingReports = reportsData.reports.length;
                }
            }
        } catch (e) {
            console.warn('Could not load reports for dashboard', e);
        }

        // Load reviews count and rating metrics from statistics
        let totalReviews = 0;
        let statsTopRated = [];
        try {
            const statsResp = await fetch('api/admin_restaurants.php?action=statistics');
            if (statsResp.ok) {
                const statsData = await statsResp.json();
                if (statsData && Array.isArray(statsData.detailed_stats)) {
                    const detailed = statsData.detailed_stats;
                    totalReviews = detailed.reduce((sum, r) => sum + (parseInt(r.review_count) || 0), 0);

                    statsTopRated = detailed
                        .filter(r => (parseFloat(r.avg_rating) || 0) > 0 && (parseInt(r.review_count) || 0) > 0)
                        .sort((a, b) => {
                            const ratingDiff = (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0);
                            if (Math.abs(ratingDiff) > 0.0001) return ratingDiff;
                            return (parseInt(b.review_count) || 0) - (parseInt(a.review_count) || 0);
                        })
                        .slice(0, 5)
                        .map(r => ({
                            id: r.id,
                            name: r.name,
                            category: r.category,
                            avg_rating: parseFloat(r.avg_rating) || 0,
                            review_count: parseInt(r.review_count) || 0
                        }));
                }
            }
        } catch (e) {
            console.warn('Could not load reviews count', e);
        }

        // Update reviews and reports stat cards
        const reviewsEl = document.getElementById('dashTotalReviews');
        const reportsEl = document.getElementById('dashPendingReports');
        if (reviewsEl) reviewsEl.textContent = totalReviews;
        if (reportsEl) reportsEl.textContent = pendingReports;

        if (statsTopRated.length) {
            renderTopRated(statsTopRated);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Show error in the lists
        const recentContainer = document.getElementById('recentRestaurantsList');
        const topRatedContainer = document.getElementById('topRatedList');
        const categoryContainer = document.getElementById('categoryBreakdown');
        const errorMsg = '<p class="no-data-message">Error loading data</p>';
        if (recentContainer) recentContainer.innerHTML = errorMsg;
        if (topRatedContainer) topRatedContainer.innerHTML = errorMsg;
        if (categoryContainer) categoryContainer.innerHTML = errorMsg;
    }
}

function updateDashboardFromRestaurants(restaurants) {
    const safeRestaurants = Array.isArray(restaurants) ? [...restaurants] : [];

    const totalEl = document.getElementById('dashTotalRestaurants');
    if (totalEl) totalEl.textContent = safeRestaurants.length;

    const imagesEl = document.getElementById('dashWithImages');
    if (imagesEl) imagesEl.textContent = countRestaurantsWithImages(safeRestaurants);

    // Recent restaurants (last 5 added, by ID descending)
    const recentRestaurants = [...safeRestaurants]
        .sort((a, b) => (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0))
        .slice(0, 5);
    renderRecentRestaurants(recentRestaurants);

    // Top rated restaurants
    const topRated = [...safeRestaurants]
        .filter(r => r.avg_rating && parseFloat(r.avg_rating) > 0)
        .sort((a, b) => parseFloat(b.avg_rating || 0) - parseFloat(a.avg_rating || 0))
        .slice(0, 5);
    renderTopRated(topRated);

    // Category breakdown
    const categoryCount = {};
    safeRestaurants.forEach(r => {
        const cat = r.category || 'Uncategorized';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    renderCategoryBreakdown(categoryCount);
    populateManageCategorySelect(Object.keys(categoryCount));

    if (activeDashboardCategory) {
        const normalized = normalizeCategory(activeDashboardCategory);
        highlightActiveCategoryChip(normalized);
    }
}

function countRestaurantsWithImages(restaurants) {
    return restaurants.filter(r => {
        const imagePaths = Array.isArray(r.image_paths) ? r.image_paths : [];
        const gallery = Array.isArray(r.images) ? r.images : [];
        return Boolean(
            r.image ||
            r.image_path ||
            r.logo ||
            r.menu_image ||
            (imagePaths.length > 0) ||
            (gallery.length > 0)
        );
    }).length;
}

function populateManageCategorySelect(categoryNames = []) {
    const select = document.getElementById('manageCategorySelect');
    if (!select) return;

    const uniqueNames = Array.from(new Set(categoryNames.filter(Boolean)));
    uniqueNames.sort((a, b) => a.localeCompare(b));

    const fragment = document.createDocumentFragment();
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Categories';
    fragment.appendChild(defaultOption);

    uniqueNames.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        fragment.appendChild(option);
    });

    select.innerHTML = '';
    select.appendChild(fragment);
    syncManageCategorySelect(activeDashboardCategory);
}

function syncManageCategorySelect(category) {
    const select = document.getElementById('manageCategorySelect');
    if (!select) return;

    if (!category) {
        select.value = '';
        return;
    }

    const normalized = normalizeCategory(category);
    for (const option of select.options) {
        if (normalizeCategory(option.value) === normalized) {
            select.value = option.value;
            return;
        }
    }
    select.value = '';
}

function renderRecentRestaurants(restaurants) {
    const container = document.getElementById('recentRestaurantsList');
    if (!container) return;

    if (restaurants.length === 0) {
        container.innerHTML = '<p class="no-data-message">No restaurants yet</p>';
        return;
    }

    container.innerHTML = restaurants.map(r => `
        <div
            class="recent-item"
            role="button"
            tabindex="0"
            data-restaurant-id="${r.id}"
            data-restaurant-name="${escapeHtml(r.name || '')}"
        >
            <span class="recent-item-name">${escapeHtml(r.name)}</span>
            <span class="recent-item-meta">
                ${r.category ? `<span class="category-tag">${escapeHtml(r.category)}</span>` : ''}
            </span>
        </div>
    `).join('');
}

function renderTopRated(restaurants) {
    const container = document.getElementById('topRatedList');
    if (!container) return;

    if (restaurants.length === 0) {
        container.innerHTML = '<p class="no-data-message">No rated restaurants yet</p>';
        return;
    }

    container.innerHTML = restaurants.map(r => `
        <div class="recent-item">
            <span class="recent-item-name">${escapeHtml(r.name)}</span>
            <span class="recent-item-rating">
                <i class="fas fa-star"></i> ${Number(parseFloat(r.avg_rating) || 0).toFixed(1)}
            </span>
            <span class="recent-item-reviews">${parseInt(r.review_count) || 0} reviews</span>
        </div>
    `).join('');
}

function renderCategoryBreakdown(categoryCount) {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    const categories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        container.innerHTML = '<p class="no-data-message">No categories yet</p>';
        return;
    }

    container.innerHTML = categories.map(([cat, count]) => `
        <span
            class="category-chip${isCategoryActive(cat) ? ' active' : ''}"
            role="button"
            tabindex="0"
            data-category="${encodeCategoryKey(cat)}"
            aria-pressed="${isCategoryActive(cat) ? 'true' : 'false'}"
        >
            ${escapeHtml(cat)}
            <span class="category-chip-count">${count}</span>
        </span>
    `).join('');
}

// Logout confirmation modal behavior
function setupLogoutConfirmation() {
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('logoutConfirmModal');
    const confirmBtn = document.getElementById('logoutConfirm');
    const cancelBtn = document.getElementById('logoutCancel');

    if (!logoutBtn || !modal || !confirmBtn || !cancelBtn) return;

    function showModal() {
        modal.style.display = 'flex';
        // trap focus on modal
        const prevFocus = document.activeElement;
        modal.__prevFocus = prevFocus;
        confirmBtn.focus();
        function onKey(e) {
            if (e.key === 'Escape') hideModal();
        }
        modal.__onKey = onKey;
        document.addEventListener('keydown', onKey);
    }

    function hideModal() {
        modal.style.display = 'none';
        if (modal.__prevFocus) modal.__prevFocus.focus();
        if (modal.__onKey) document.removeEventListener('keydown', modal.__onKey);
    }

    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showModal();
    });

    cancelBtn.addEventListener('click', function (e) {
        e.preventDefault();
        hideModal();
    });

    // clicking backdrop closes
    modal.addEventListener('click', function (e) {
        if (e.target === modal) hideModal();
    });

    confirmBtn.addEventListener('click', function () {
        // Redirect to server logout endpoint
        window.location.href = 'admin.php?logout=1';
    });
}

function switchToTab(tabId) {
    const menuItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (menuItem) {
        menuItem.click();
    }
}

function activateTabWithoutReload(tabId) {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    menuItems.forEach(item => {
        const isTarget = item.getAttribute('data-tab') === tabId;
        item.classList.toggle('active', isTarget);
    });
    tabContents.forEach(tab => {
        tab.classList.toggle('active', tab.id === tabId);
    });
}

function setupDashboardInteractions() {
    const categoryContainer = document.getElementById('categoryBreakdown');
    if (categoryContainer && !categoryContainer.dataset.listenerAdded) {
        categoryContainer.addEventListener('click', handleDashboardCategoryInteraction);
        categoryContainer.addEventListener('keydown', handleDashboardCategoryInteraction);
        categoryContainer.dataset.listenerAdded = 'true';
    }

    const recentList = document.getElementById('recentRestaurantsList');
    if (recentList && !recentList.dataset.listenerAdded) {
        recentList.addEventListener('click', handleRecentRestaurantActivation);
        recentList.addEventListener('keydown', handleRecentRestaurantActivation);
        recentList.dataset.listenerAdded = 'true';
    }

    const dashCards = document.querySelectorAll('.dash-card[data-dashboard-action]');
    dashCards.forEach(card => {
        if (card.dataset.cardListenerAdded) return;
        card.addEventListener('click', handleDashCardAction);
        card.addEventListener('keydown', handleDashCardAction);
        if (!card.hasAttribute('tabindex')) {
            card.setAttribute('tabindex', '0');
        }
        if (!card.hasAttribute('role')) {
            card.setAttribute('role', 'button');
        }
        card.dataset.cardListenerAdded = 'true';
    });
}

function handleDashboardCategoryInteraction(event) {
    const isKeyboard = event.type === 'keydown';
    if (isKeyboard && event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const chip = event.target.closest('.category-chip');
    if (!chip) return;

    event.preventDefault();
    const categoryValue = decodeCategoryKey(chip.dataset.category || '');
    applyDashboardCategoryFilter(categoryValue, chip);
}

function applyDashboardCategoryFilter(categoryValue, chip = null, options = {}) {
    const { silent = false, skipTab = false } = options;
    clearFocusedRestaurant({ skipRefresh: true, skipNotice: true });
    const normalized = normalizeCategory(categoryValue);
    const isSameSelection = normalizeCategory(activeDashboardCategory) === normalized && normalized.length > 0;

    if (isSameSelection) {
        clearDashboardCategoryFilter({ silent });
        return;
    }

    activeDashboardCategory = categoryValue;
    highlightActiveCategoryChip(normalized, chip);
    syncManageCategorySelect(categoryValue);
    if (!skipTab) {
        activateTabWithoutReload('manage-restaurants');
    }

    const filtered = refreshManageRestaurantsView();
    updateCategoryFilterNotice(categoryValue, filtered.length);
}

function handleRecentRestaurantActivation(event) {
    const isKeyboard = event.type === 'keydown';
    if (isKeyboard && event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const item = event.target.closest('.recent-item[data-restaurant-id]');
    if (!item) return;

    event.preventDefault();
    const restaurantId = parseInt(item.dataset.restaurantId, 10);
    const restaurantName = item.dataset.restaurantName || item.querySelector('.recent-item-name')?.textContent || '';
    showRestaurantInManage(restaurantId, restaurantName);
}

function handleDashCardAction(event) {
    const isKeyboard = event.type === 'keydown';
    if (isKeyboard && event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    if (isKeyboard) {
        event.preventDefault();
    }

    const card = event.currentTarget || event.target.closest('.dash-card');
    if (!card) return;

    const action = card.dataset.dashboardAction;
    switch (action) {
        case 'total-restaurants':
            focusManageTab({ imagesOnly: false });
            break;
        case 'with-images':
            focusManageTab({ imagesOnly: true });
            break;
        case 'total-reviews':
            switchToTab('statistics');
            break;
        case 'pending-reports':
            switchToTab('reports');
            break;
        default:
            break;
    }
}

function showRestaurantInManage(restaurantId, restaurantName = '') {
    if (!restaurantId) return;

    activeDashboardRestaurantId = Number(restaurantId);
    activeDashboardRestaurantName = restaurantName;

    const searchInput = document.getElementById('restaurantSearch');
    if (searchInput) searchInput.value = '';
    const hasImagesCheckbox = document.getElementById('hasImagesFilter');
    if (hasImagesCheckbox) hasImagesCheckbox.checked = false;

    clearDashboardCategoryFilter({ silent: true, skipRefresh: true });
    syncManageCategorySelect('');

    activateTabWithoutReload('manage-restaurants');
    const results = refreshManageRestaurantsView({ focusId: activeDashboardRestaurantId, forceScroll: true });

    if (!results.length) {
        showNotification('Restaurant not found in the current list.', 'error');
        clearFocusedRestaurant({ skipRefresh: true, skipNotice: true });
        updateCategoryFilterNotice('');
    }
}

function focusManageTab(options = {}) {
    const { imagesOnly = false } = options;

    const searchInput = document.getElementById('restaurantSearch');
    if (searchInput) searchInput.value = '';

    const hasImagesCheckbox = document.getElementById('hasImagesFilter');
    if (hasImagesCheckbox) hasImagesCheckbox.checked = imagesOnly;

    clearDashboardCategoryFilter({ silent: true, skipRefresh: true });
    clearFocusedRestaurant({ skipRefresh: true, skipNotice: true });
    syncManageCategorySelect('');

    activateTabWithoutReload('manage-restaurants');
    refreshManageRestaurantsView();
}

function highlightActiveCategoryChip(normalizedCategory, chipOverride = null) {
    const chips = document.querySelectorAll('#categoryBreakdown .category-chip');
    chips.forEach(chip => {
        const chipCategory = normalizeCategory(decodeCategoryKey(chip.dataset.category || ''));
        const isActiveChip = normalizedCategory && chipCategory === normalizedCategory;
        chip.classList.toggle('active', isActiveChip);
        chip.setAttribute('aria-pressed', isActiveChip ? 'true' : 'false');
    });

    if (chipOverride && normalizedCategory) {
        chipOverride.classList.add('active');
        chipOverride.setAttribute('aria-pressed', 'true');
    }
}

function highlightFocusedRestaurantCard(restaurantId, options = {}) {
    const { scrollIntoView = false } = options;
    if (!restaurantId) return;

    requestAnimationFrame(() => {
        const card = document.querySelector(`.restaurant-card[data-id="${restaurantId}"]`);
        if (!card) return;

        card.classList.add('restaurant-card-focus');
        if (scrollIntoView) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setTimeout(() => {
            card.classList.remove('restaurant-card-focus');
        }, 2200);
    });
}

function encodeCategoryKey(value) {
    return encodeURIComponent((value || '').toString());
}

function decodeCategoryKey(value) {
    try {
        return decodeURIComponent(value || '');
    } catch (e) {
        return value || '';
    }
}

function normalizeCategory(value) {
    return (value || '').trim().toLowerCase();
}

function isCategoryActive(category) {
    if (!activeDashboardCategory) return false;
    return normalizeCategory(category) === normalizeCategory(activeDashboardCategory);
}

function filterRestaurantsByCategory(restaurants, category) {
    const list = Array.isArray(restaurants) ? [...restaurants] : [];
    const target = normalizeCategory(category);
    if (!target) return list;

    return list.filter(r => {
        const current = normalizeCategory(r?.category);
        if (target === 'uncategorized') {
            return !current;
        }
        return current === target;
    });
}

function refreshManageRestaurantsView(options = {}) {
    const { focusId: focusOverride = null, forceScroll = false } = options;
    const searchInput = document.getElementById('restaurantSearch');
    const hasImagesCheckbox = document.getElementById('hasImagesFilter');
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const hasImagesOnly = !!(hasImagesCheckbox?.checked);

    let filtered = filterRestaurantsByCategory(allRestaurants, activeDashboardCategory);

    filtered = filtered.filter(restaurant => {
        const nameValue = (restaurant?.name || '').toLowerCase();
        const addressValue = (restaurant?.address || '').toLowerCase();
        const matchesSearch = !searchTerm || nameValue.includes(searchTerm) || addressValue.includes(searchTerm);

        const imagePaths = Array.isArray(restaurant?.image_paths) ? restaurant.image_paths : [];
        const hasImages = Boolean(restaurant?.image_path || restaurant?.logo || imagePaths.length);
        const matchesImages = !hasImagesOnly || hasImages;

        return matchesSearch && matchesImages;
    });

    const focusId = focusOverride || activeDashboardRestaurantId;
    let focusCount = 0;
    if (focusId) {
        filtered = filtered.filter(r => Number(r?.id) === Number(focusId));
        focusCount = filtered.length;
    }

    displayRestaurantsForAdmin(filtered);

    if (focusId) {
        highlightFocusedRestaurantCard(focusId, { scrollIntoView: forceScroll });
    }

    if (activeDashboardCategory) {
        updateCategoryFilterNotice(activeDashboardCategory, filtered.length, { focusCount });
    } else if (focusId) {
        updateCategoryFilterNotice('', focusCount, { focusCount });
    } else {
        updateCategoryFilterNotice('');
    }

    return filtered;
}

function updateCategoryFilterNotice(category, count = 0, options = {}) {
    const notice = document.getElementById('categoryFilterNotice');
    if (!notice) return;

    const { focusCount = 0 } = options;
    const hasCategory = Boolean(category);
    const hasFocus = !hasCategory && Boolean(activeDashboardRestaurantId);

    if (!hasCategory && !hasFocus) {
        notice.style.display = 'none';
        notice.innerHTML = '';
        return;
    }

    notice.style.display = 'flex';
    let message = '';
    let mode = 'category';

    if (hasCategory) {
        const safeCategory = escapeHtml(category);
        const label = `${count} restaurant${count === 1 ? '' : 's'}`;
        message = `<span>Showing <strong>${safeCategory}</strong> · ${label}</span>`;
    } else if (hasFocus) {
        const safeName = escapeHtml(activeDashboardRestaurantName || 'Selected restaurant');
        const matches = focusCount > 0 ? focusCount : 1;
        const label = `${matches} match${matches === 1 ? '' : 'es'}`;
        message = `<span>Showing <strong>${safeName}</strong> · ${label}</span>`;
        mode = 'focus';
    }

    notice.innerHTML = `
        ${message}
        <button type="button" class="clear-category-filter" data-mode="${mode}">Clear</button>
    `;

    const clearBtn = notice.querySelector('.clear-category-filter');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (mode === 'category') {
                clearDashboardCategoryFilter();
            } else {
                clearFocusedRestaurant();
            }
        });
    }
}

function clearDashboardCategoryFilter(options = {}) {
    const { silent = false, skipRefresh = false } = options;
    activeDashboardCategory = '';
    syncManageCategorySelect('');
    const chips = document.querySelectorAll('#categoryBreakdown .category-chip');
    chips.forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
    });

    let filtered = [];
    if (skipRefresh) {
        updateCategoryFilterNotice('', 0);
    } else {
        filtered = refreshManageRestaurantsView();
    }

    if (!silent) {
        showNotification('Category filter cleared', 'success');
    }
    return filtered;
}

function clearFocusedRestaurant(options = {}) {
    const { skipRefresh = false, skipNotice = false } = options;
    const hadFocus = Boolean(activeDashboardRestaurantId);
    activeDashboardRestaurantId = null;
    activeDashboardRestaurantName = '';

    if (!skipNotice) {
        updateCategoryFilterNotice(activeDashboardCategory);
    }

    if (!skipRefresh && hadFocus) {
        refreshManageRestaurantsView();
    }

    return hadFocus;
}

// Helper function if not already defined
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================

// Custom notification system
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : '!'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .custom-notification {
                position: fixed;
                top: 18px;
                right: 18px;
                background: #4CAF50;
                color: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,0.18));
                z-index: 99999;
                max-width: 420px;
                animation: slideIn 0.25s ease-out;
                border-left: 4px solid #2E7D32;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .custom-notification.error {
                background: #f44336;
                border-left-color: #c62828;
            }
            .custom-notification.warning {
                background: #ff9800;
                border-left-color: #ef6c00;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .notification-icon {
                font-weight: bold;
                font-size: 15px;
            }
            .notification-message {
                flex: 1;
                font-size: 13px;
                line-height: 1.4;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds for success, 8 seconds for errors
    const autoRemoveTime = type === 'success' ? 5000 : 8000;
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, autoRemoveTime);
}

// Initialize admin map for pin pointing
function initializeAdminMap() {
    const mapElement = document.getElementById('adminMap');
    if (!mapElement) return;
    
    // Estancia, Iloilo coordinates
    const estanciaCoords = [11.456453464374693, 123.15114185203521];
    
    const ADMIN_INITIAL_ZOOM = 11;
    adminMap = createAdminMapboxMap('adminMap', estanciaCoords, ADMIN_INITIAL_ZOOM);
    if (!adminMap) return;

    // Show Estancia boundary
    adminMap.on('style.load', () => addEstanciaBoundaryToMap(adminMap));
    if (adminMap.isStyleLoaded && adminMap.isStyleLoaded()) addEstanciaBoundaryToMap(adminMap);
    
    // Add click event to map - always enabled for manual adjustment
    adminMap.on('click', function(e) {
        // Remove geocode marker if exists
        if (geocodeMarker) {
            try { geocodeMarker.remove(); } catch (err) {}
            geocodeMarker = null;
        }
        
        // Check if location is within Estancia
        if (!isWithinEstancia(e.lngLat.lat, e.lngLat.lng)) {
            updateAddressStatus('⚠️ The pin must be placed within Estancia, Iloilo only.', 'error');
            showNotification('Location must be within Estancia, Iloilo', 'warning');
            return; // Don't place the marker
        }
        
        setRestaurantLocation(e.lngLat.lat, e.lngLat.lng);
        autoFillAddressFromLatLng(e.lngLat.lat, e.lngLat.lng, 'add');
    });
    
    // Address search removed: rely on manual map clicks and lat/lng inputs
}

// Ensure the edit modal map is initialized
function ensureEditMapInitialized() {
    const mapEl = document.getElementById('editAdminMap');
    if (!mapEl) return;
    if (editMap) return; // already initialized

    // Default center - same as admin map
    const defaultCenter = [11.456453464374693, 123.15114185203521];
    try {
        editMap = createAdminMapboxMap('editAdminMap', defaultCenter, 10, { scrollZoom: true });
        if (!editMap) return;

        // Show Estancia boundary
        editMap.on('style.load', () => addEstanciaBoundaryToMap(editMap));
        if (editMap.isStyleLoaded && editMap.isStyleLoaded()) addEstanciaBoundaryToMap(editMap);

    // click to set marker
        editMap.on('click', function(e) {
            // Check if location is within Estancia
            if (!isWithinEstancia(e.lngLat.lat, e.lngLat.lng)) {
                showNotification('The pin must be placed within Estancia, Iloilo only.', 'warning');
                return; // Don't place the marker
            }
            
            setEditMarker(e.lngLat.lat, e.lngLat.lng);
            // update inputs
            const latInput = document.getElementById('editLatitude');
            const lngInput = document.getElementById('editLongitude');
            if (latInput) latInput.value = e.lngLat.lat;
            if (lngInput) lngInput.value = e.lngLat.lng;
            autoFillAddressFromLatLng(e.lngLat.lat, e.lngLat.lng, 'edit');
        });

        // Wire input listeners (paste/type) to update marker
        const latInput = document.getElementById('editLatitude');
        const lngInput = document.getElementById('editLongitude');
        const tryParseAndSet = () => {
            if (!latInput || !lngInput) return;
            const latVal = latInput.value.trim();
            const lngVal = lngInput.value.trim();
            if (!latVal || !lngVal) return;
            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);
            if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Check if within Estancia
                if (!isWithinEstancia(lat, lng)) {
                    showNotification('Coordinates must be within Estancia, Iloilo', 'warning');
                    return;
                }
                setEditMarker(lat, lng);
                try { editMap.setView([lat, lng], 14); } catch (e) {}
            }
        };
        if (latInput && lngInput) {
            latInput.addEventListener('input', tryParseAndSet);
            lngInput.addEventListener('input', tryParseAndSet);
            latInput.addEventListener('paste', () => setTimeout(tryParseAndSet, 50));
            lngInput.addEventListener('paste', () => setTimeout(tryParseAndSet, 50));
        }

        // Ensure Leaflet has correct size after being added to the DOM
        setTimeout(() => {
            try { editMap.resize(); } catch (e) { /* ignore */ }
        }, 100);

    } catch (e) {
        console.error('Failed to initialize edit map:', e);
    }
}

function setEditMarker(lat, lng) {
    if (!editMap) return;
    if (editMarker) {
        try { editMarker.remove(); } catch (e) {}
    }
    // color the edit marker based on selected category in the edit form
    (function() {
        const categoryColors = {
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

        function hexToRgba(hex, alpha) {
            if (!hex) return `rgba(232,86,52,${alpha})`;
            const h = hex.replace('#','');
            const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const sel = document.getElementById('editRestaurantCategory');
        const category = sel ? sel.value : null;
        const pinColor = categoryColors[category] || '#E85634';
        const pinShadow = hexToRgba(pinColor, 0.28);
        const rimShadow = hexToRgba(pinColor, 0.20);
        const iconClass = getCategoryIconClass(category);

        const iconHtml = `
            <div class="marker-pin marker-icon-lg" style="background:${pinColor}; box-shadow:0 4px 12px ${pinShadow},0 1px 3px rgba(0,0,0,0.10); border:1px solid #fff;">
                <div class="marker-plate">
                    <span class="plate-rim" style="box-shadow: inset 0 0 0 1.5px ${rimShadow};"></span>
                    <span class="plate-inner"></span>
                    <span class="cutlery"><i class="fas ${iconClass}" aria-hidden="true" style="color:${pinColor};"></i></span>
                </div>
            </div>`;

        const wrappedHtml = `<div class="restaurant-pin">${iconHtml}</div>`;
        editMarker = createAdminMarker(editMap, lat, lng, wrappedHtml, { anchor: 'bottom' });
    })();
    // keep inputs in sync
    const latInput = document.getElementById('editLatitude');
    const lngInput = document.getElementById('editLongitude');
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    // Center map on this marker (animated if supported)
    try {
        editMap.setView([lat, lng], Math.max(editMap.getZoom() || 14, 14), { animate: true });
    } catch (e) {
        try { editMap.setView([lat, lng], 14); } catch (err) {}
    }
}

// Initialize address input functionality
// Note: address search / geocoding removed. Manual map clicks and lat/lng inputs are used instead.

// Use current map pin coordinates
function useCurrentMapPin() {
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput.value && lngInput.value) {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        
        // Center map on existing pin
        adminMap.setView([lat, lng], 16);
        
        updateAddressStatus('✅ Using existing map pin', 'success');
        showNotification('Using current map pin location', 'success');
    }
}

// Update Use Map Pin button visibility
function updateUseMapPinButton() {
    const useMapPinBtn = document.getElementById('useMapPinBtn');
    const latInput = document.getElementById('latitude');
    
    if (useMapPinBtn && latInput) {
        const hasCoordinates = latInput.value.trim() !== '';
        // Show button if there are coordinates
        useMapPinBtn.style.display = hasCoordinates ? 'block' : 'none';
    }
}

function composeAddressString({ purok = '', barangay = '', town = '', province = '' }) {
    const parts = [];
    if (purok.trim()) parts.push(purok.trim());
    if (barangay.trim()) parts.push(`Barangay ${barangay.trim()}`);
    if (town.trim()) parts.push(town.trim());
    if (province.trim()) parts.push(province.trim());
    return parts.join(', ');
}

function attachAddressComposer({ hiddenId, purokId, barangayId, townId, provinceId, previewId }) {
    const hiddenInput = document.getElementById(hiddenId);
    if (!hiddenInput) return;

    const purok = purokId ? document.getElementById(purokId) : null;
    const barangay = barangayId ? document.getElementById(barangayId) : null;
    const town = townId ? document.getElementById(townId) : null;
    const province = provinceId ? document.getElementById(provinceId) : null;
    const preview = previewId ? document.getElementById(previewId) : null;

    const updateValue = () => {
        const composed = composeAddressString({
            purok: purok ? purok.value : '',
            barangay: barangay ? barangay.value : '',
            town: town ? town.value : '',
            province: province ? province.value : ''
        });
        hiddenInput.value = composed;
        if (preview) {
            preview.value = composed || '';
        }
    };

    [purok, barangay, town, province].forEach((el) => {
        if (!el) return;
        const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(eventName, updateValue);
    });

    addressFieldSyncHandlers[hiddenId] = updateValue;
    updateValue();
}

function setupAddressComposers() {
    // Address composers no longer needed - fields have been removed
    // Address is now entered directly in map address bar
}

function triggerAddressComposer(hiddenId) {
    // Address composers no longer needed - fields have been removed
}

// Update address status message
function updateAddressStatus(message, type = 'info') {
    const statusDiv = document.getElementById('addressStatus');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    
    // Color coding
    const colors = {
        info: '#666',
        success: '#4CAF50',
        warning: '#ff9800',
        error: '#f44336'
    };
    
    statusDiv.style.color = colors[type] || colors.info;
    statusDiv.style.fontWeight = (type === 'success' || type === 'error') ? '500' : 'normal';
}

// Reverse geocode to auto-fill address field
function reverseGeocodeAddress(lat, lng) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${ADMIN_MAPBOX_ACCESS_TOKEN}&types=address,poi,place`;
    return fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || !Array.isArray(data.features) || data.features.length === 0) {
                return null;
            }
            return formatAddressWithoutRoad(data.features[0]) || null;
        })
        .catch(() => null);
}

// Build an address string that excludes road/street details
function formatAddressWithoutRoad(feature) {
    if (!feature) return null;

    const context = Array.isArray(feature.context) ? feature.context : [];
    const pick = (prefixes) => context.find(c => prefixes.some(p => c.id && c.id.startsWith(p)))?.text;

    const parts = [];
    const neighborhood = pick(['neighborhood.']);
    const locality = pick(['locality.']);
    const place = pick(['place.']);
    const district = pick(['district.']);
    const region = pick(['region.']);
    const country = pick(['country.']);

    [neighborhood, locality, place, district, region, country].forEach(p => {
        if (p && !parts.includes(p)) parts.push(p);
    });

    if (parts.length > 0) return parts.join(', ');

    // Fallback: remove the first segment (usually the road) from place_name
    const placeName = feature.place_name || '';
    if (!placeName) return null;
    const segments = placeName.split(',').map(s => s.trim()).filter(Boolean);
    if (segments.length <= 1) return placeName;
    return segments.slice(1).join(', ');
}

function applyAutoAddress(address, mode = 'add') {
    if (!address) return;
    const addressInput = document.getElementById(mode === 'edit' ? 'editRestaurantAddress' : 'restaurantAddress');
    const previewInput = document.getElementById(mode === 'edit' ? 'editRestaurantAddressPreview' : 'restaurantAddressPreview');
    const mapBarInput = document.getElementById(mode === 'edit' ? 'editMapAddressBar' : 'mapAddressBar');
    if (addressInput) addressInput.value = address;
    if (previewInput) previewInput.value = address;
    if (mapBarInput) mapBarInput.value = address;
    updateUseMapPinButton();
}

function autoFillAddressFromLatLng(lat, lng, mode = 'add') {
    updateAddressStatus('Retrieving address…', 'info');
    reverseGeocodeAddress(lat, lng).then(address => {
        if (address) {
            applyAutoAddress(address, mode);
            updateAddressStatus('✅ Address retrieved from map pin', 'success');
        } else {
            updateAddressStatus('⚠️ Address not found for this location', 'warning');
        }
    });
}

// Set restaurant location on map click
function setRestaurantLocation(lat, lng) {
    if (marker) {
        try { marker.remove(); } catch (e) {}
    }
    // Create a colored divIcon based on the currently selected category in the add form
    (function() {
        const categoryColors = {
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

        function hexToRgba(hex, alpha) {
            if (!hex) return `rgba(232,86,52,${alpha})`;
            const h = hex.replace('#','');
            const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const sel = document.getElementById('restaurantCategory');
        const category = sel ? sel.value : null;
        const pinColor = categoryColors[category] || '#E85634';
        const pinShadow = hexToRgba(pinColor, 0.28);
        const rimShadow = hexToRgba(pinColor, 0.20);
        const iconClass = getCategoryIconClass(category);

        const iconHtml = `
            <div class="marker-pin marker-icon-lg" style="background:${pinColor}; box-shadow:0 4px 12px ${pinShadow},0 1px 3px rgba(0,0,0,0.10); border:1px solid #fff;">
                <div class="marker-plate">
                    <span class="plate-rim" style="box-shadow: inset 0 0 0 1.5px ${rimShadow};"></span>
                    <span class="plate-inner"></span>
                    <span class="cutlery"><i class="fas ${iconClass}" aria-hidden="true" style="color:${pinColor};"></i></span>
                </div>
            </div>`;

        const wrappedHtml = `<div class="restaurant-pin">${iconHtml}</div>`;
        marker = createAdminMarker(adminMap, lat, lng, wrappedHtml, { anchor: 'bottom' });
    })();
    
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    
    // Update Use Map Pin button
    updateUseMapPinButton();
}

// ============================================================================
// BUSINESS HOURS HELPER FUNCTIONS (Global scope)
// ============================================================================

// Collect hours data from form inputs
function collectHoursData(prefix = '') {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = {};
    
    days.forEach(day => {
        const openInput = getHoursElement(prefix, day.toLowerCase(), 'Open') || getHoursElement(prefix, day, 'Open');
        const closeInput = getHoursElement(prefix, day.toLowerCase(), 'Close') || getHoursElement(prefix, day, 'Close');
        const closedCheckbox = getHoursElement(prefix, day.toLowerCase(), 'Closed') || getHoursElement(prefix, day, 'Closed');
        
        if (closedCheckbox && closedCheckbox.checked) {
            hours[day] = { closed: true };
        } else if (openInput && closeInput && openInput.value && closeInput.value) {
            hours[day] = {
                open: openInput.value,
                close: closeInput.value,
                closed: false
            };
        } else {
            hours[day] = { closed: true };
        }
    });
    
    return JSON.stringify(hours);
}

// Populate hours inputs from JSON data
function populateHoursInputs(hoursString, prefix = 'edit') {
    if (!hoursString) return;
    
    try {
        const hours = JSON.parse(hoursString);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach(day => {
            const dayHours = hours[day];
            const openInput = getHoursElement(prefix, day.toLowerCase(), 'Open') || getHoursElement(prefix, day, 'Open');
            const closeInput = getHoursElement(prefix, day.toLowerCase(), 'Close') || getHoursElement(prefix, day, 'Close');
            const closedCheckbox = getHoursElement(prefix, day.toLowerCase(), 'Closed') || getHoursElement(prefix, day, 'Closed');
            
            if (dayHours && closedCheckbox) {
                if (dayHours.closed) {
                    closedCheckbox.checked = true;
                    if (openInput) openInput.disabled = true;
                    if (closeInput) closeInput.disabled = true;
                } else {
                    closedCheckbox.checked = false;
                    if (openInput) {
                        openInput.value = dayHours.open || '';
                        openInput.disabled = false;
                    }
                    if (closeInput) {
                        closeInput.value = dayHours.close || '';
                        closeInput.disabled = false;
                    }
                }
            }
        });
    } catch (e) {
        console.error('Error parsing hours:', e);
    }
}

// Setup checkbox listeners to disable/enable time inputs
function setupHoursCheckboxListeners(prefix) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const checkbox = getHoursElement(prefix, day, 'Closed');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const openInput = getHoursElement(prefix, day, 'Open');
                const closeInput = getHoursElement(prefix, day, 'Close');
                
                if (this.checked) {
                    if (openInput) {
                        openInput.disabled = true;
                        openInput.value = '';
                    }
                    if (closeInput) {
                        closeInput.disabled = true;
                        closeInput.value = '';
                    }
                } else {
                    if (openInput) openInput.disabled = false;
                    if (closeInput) closeInput.disabled = false;
                }
            });
        }
    });
}

function getHoursElement(prefix, day, suffix) {
    const capDay = day.charAt(0).toUpperCase() + day.slice(1);
    return (
        document.getElementById(`${prefix}${day}${suffix}`) ||
        document.getElementById(`${prefix}${capDay}${suffix}`)
    );
}

// Apply Monday's hours to all days
function applyHoursToAll(prefix = '') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sourceDay = 'monday';

    const sourceOpen = getHoursElement(prefix, sourceDay, 'Open');
    const sourceClose = getHoursElement(prefix, sourceDay, 'Close');
    const sourceClosed = getHoursElement(prefix, sourceDay, 'Closed');

    if (!sourceOpen || !sourceClose || !sourceClosed) return;

    const isClosed = sourceClosed.checked;

    if (isClosed) return;

    days.forEach(day => {
        if (day === sourceDay) return;

        const openInput = getHoursElement(prefix, day, 'Open');
        const closeInput = getHoursElement(prefix, day, 'Close');
        const closedCheckbox = getHoursElement(prefix, day, 'Closed');

        if (!openInput || !closeInput || !closedCheckbox) return;

        if (closedCheckbox.checked) return;

        openInput.disabled = false;
        closeInput.disabled = false;
        openInput.value = sourceOpen.value;
        closeInput.value = sourceClose.value;
    });
}

function setupApplyHoursButtons() {
    const buttons = document.querySelectorAll('.hours-apply-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const prefix = this.getAttribute('data-prefix') || '';
            applyHoursToAll(prefix);
        });
    });
}

// Setup admin event listeners
// In your setupAdminEventListeners function, add this:
function setupAdminEventListeners() {
    // Tab switching
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            menuItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const activeTab = document.getElementById(tabId);
            
            if (activeTab) {
                activeTab.classList.add('active');
            }
            
            // Load data based on tab
            if (tabId === 'statistics') {
                loadStatistics();
            } else if (tabId === 'manage-restaurants') {
                loadRestaurantsForAdmin();
            } else if (tabId === 'dashboard') {
                loadDashboard();
            } else if (tabId === 'restaurant-map') {
                initializeMapOnTabShow();
            }
            
            // Ensure map is properly sized when switching to add-restaurant tab
            if (tabId === 'add-restaurant' && adminMap) {
                setTimeout(() => {
                    adminMap.invalidateSize();
                }, 100);
            }
        });
    });
    
    // Center the add restaurant form
    const addFormContainer = document.getElementById('addRestaurantFormContainer');
    if (addFormContainer) {
        addFormContainer.style.display = 'flex';
        addFormContainer.style.justifyContent = 'center';
        addFormContainer.style.alignItems = 'center';
        addFormContainer.style.flexDirection = 'column';
        addFormContainer.style.minHeight = '60vh';
    }
    
    // Add restaurant form
    const addForm = document.getElementById('addRestaurantForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddRestaurant);

        const goToOwnerStepBtn = document.getElementById('goToOwnerAccountStepBtn');
        if (goToOwnerStepBtn) {
            goToOwnerStepBtn.addEventListener('click', function() {
                if (!validateAddRestaurantStep1RequiredFields()) {
                    showNotification('Please complete all required fields in Step 1 before proceeding.', 'warning');
                    return;
                }
                showAddRestaurantStep(2);
            });
        }

        const backToRestaurantStepBtn = document.getElementById('backToRestaurantStepBtn');
        if (backToRestaurantStepBtn) {
            backToRestaurantStepBtn.addEventListener('click', function() {
                showAddRestaurantStep(1);
            });
        }

        showAddRestaurantStep(1);
    }
    
    // Edit modal close button
    const closeEditModal = document.getElementById('closeEditModal');
    if (closeEditModal) {
        closeEditModal.onclick = function() {
            closeEditModalAndRefresh();
        };
    }

    // Edit modal Cancel button (bottom of modal) - ensure it closes and resets the modal
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            // Close the modal, reset state, and refresh the list
            closeEditModalAndRefresh();
        });
    }
    
    // Add event listeners for "Closed" checkboxes to disable time inputs
    setupHoursCheckboxListeners('');
    setupHoursCheckboxListeners('edit');
    setupApplyHoursButtons();
    
    // Edit restaurant form
    const editForm = document.getElementById('editRestaurantForm');
    if (editForm) {
        editForm.onsubmit = handleEditRestaurant;
    }

    const adminAccountForm = document.getElementById('adminAccountForm');
    if (adminAccountForm) {
        adminAccountForm.addEventListener('submit', handleAdminAccountSettingsSubmit);
    }
    
    // Do not close the edit modal on outside click
    
    // Add search functionality for manage restaurants
    const searchInput = document.getElementById('restaurantSearch');
    const hasImagesCheckbox = document.getElementById('hasImagesFilter');
    const clearBtn = document.getElementById('clearSearchBtn');
    const printBtn = document.getElementById('printRestaurantsBtn');
    const categorySelect = document.getElementById('manageCategorySelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterRestaurants);
    }
    if (hasImagesCheckbox) {
        hasImagesCheckbox.addEventListener('change', filterRestaurants);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (hasImagesCheckbox) hasImagesCheckbox.checked = false;
            if (categorySelect) {
                categorySelect.value = '';
                clearDashboardCategoryFilter({ silent: true, skipRefresh: true });
            }
            clearFocusedRestaurant({ skipRefresh: true, skipNotice: true });
            filterRestaurants();
        });
    }
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printRestaurants();
        });
    }
    if (categorySelect && !categorySelect.dataset.listenerAdded) {
        categorySelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue) {
                applyDashboardCategoryFilter(selectedValue, null, { silent: true, skipTab: true });
            } else {
                clearDashboardCategoryFilter({ silent: true });
            }
        });
        categorySelect.dataset.listenerAdded = 'true';
    }

    // Automatically place the map pin when latitude/longitude are pasted or typed
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');

    if (latInput && lngInput) {
        const tryParseAndSet = () => {
            const latVal = latInput.value.trim();
            const lngVal = lngInput.value.trim();

            // Only attempt when both fields have values
            if (!latVal || !lngVal) return;

            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);

            const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
            const validLng = Number.isFinite(lng) && lng >= -180 && lng <= 180;

            if (validLat && validLng) {
                // Check if within Estancia
                if (!isWithinEstancia(lat, lng)) {
                    updateAddressStatus('⚠️ Coordinates must be within Estancia, Iloilo only.', 'error');
                    showNotification('Coordinates must be within Estancia, Iloilo', 'warning');
                    return;
                }
                // Place marker and center map
                setRestaurantLocation(lat, lng);
                if (typeof adminMap !== 'undefined' && adminMap) {
                    try {
                        adminMap.setView([lat, lng], 16);
                    } catch (e) {
                        // ignore map centering errors
                        console.warn('Could not center adminMap:', e);
                    }
                }

                updateAddressStatus('✅ Location set from coordinates', 'success');
            } else {
                // If user entered something but it's invalid, show a brief error
                if (latVal !== '' || lngVal !== '') {
                    updateAddressStatus('❌ Invalid coordinates. Latitude must be -90..90, longitude -180..180', 'error');
                }
            }
        };

        // React to typing, paste and change events
        latInput.addEventListener('input', tryParseAndSet);
        lngInput.addEventListener('input', tryParseAndSet);
        latInput.addEventListener('change', tryParseAndSet);
        lngInput.addEventListener('change', tryParseAndSet);

        // On paste, wait a tick for the field to update
        latInput.addEventListener('paste', () => setTimeout(tryParseAndSet, 50));
        lngInput.addEventListener('paste', () => setTimeout(tryParseAndSet, 50));
    }
    // Initialize upload & preview helpers for the page
    try { initializeMultipleImageUpload(); } catch (e) {}
    try { initializeLogoInputs(); } catch (e) {}
    // Only initialize add form menu images on page load; edit form will be initialized when modal opens
    try { initializeMenuImageUpload('restaurantMenuImages', 'menuImagePreviewContainer', 'menuImageCounter', 'addMenuImageTile', 10); } catch (e) {}
}

// Properly close modal and refresh data
function closeEditModalAndRefresh() {
    const modal = document.getElementById('editRestaurantModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    resetEditModal();
    
    // Refresh the data after a short delay to ensure modal is fully closed
    setTimeout(() => {
        loadRestaurantsForAdmin();
        loadStatistics();
    }, 100);
}

// Filter restaurants based on search and filter
function filterRestaurants() {
    refreshManageRestaurantsView();
}

// Reset edit modal state
function resetEditModal() {
    const fileInput = document.getElementById('editImageUpload');
    if (fileInput) fileInput.value = '';
    const editMapAddressBar = document.getElementById('editMapAddressBar');
    if (editMapAddressBar) editMapAddressBar.value = '';
    
    // Clear modal state - support multiple images
    window.editModalState = {
        originalImages: [],        // array of original image paths
        removedOriginalPaths: [],  // paths of original images removed by admin
        newImageFiles: [],         // newly selected File objects
        imageRemoved: false
        ,
        storedLogo: null,         // stored logo path for the restaurant when modal opened
    };

    // Clear multi-image preview container and counter if present
    const previewContainer = document.getElementById('editImagePreviewContainer');
    const counter = document.getElementById('editImageCounter');
    if (previewContainer) previewContainer.innerHTML = '';
    if (counter) counter.textContent = '0/5';

    // Clear logo preview
    const editLogoPreviewContainer = document.getElementById('editLogoPreviewContainer');
    if (editLogoPreviewContainer) editLogoPreviewContainer.innerHTML = '';
    // Clear edit logo file input if present
    const editLogoInput = document.getElementById('editRestaurantLogo');
    if (editLogoInput) editLogoInput.value = '';
    // Ensure upload buttons are visible again
    const addLogoBtn = document.getElementById('addLogoTile');
    if (addLogoBtn) {
        addLogoBtn.style.display = '';
        const btnEl = addLogoBtn.querySelector('button');
        if (btnEl) btnEl.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i>';
    }
    const editLogoBtn = document.getElementById('editLogoAddTile');
    if (editLogoBtn) {
        editLogoBtn.style.display = '';
        const btnEl2 = editLogoBtn.querySelector('button');
        if (btnEl2) btnEl2.innerHTML = '<i class="fas fa-upload" aria-hidden="true"></i>';
    }
    
    // Clear facilities and services fields
    try {
        const editModal = document.getElementById('editRestaurantModal');
        
        // Clear text inputs
        const seatingEl = document.getElementById('editSeatingCapacity');
        if (seatingEl) seatingEl.value = '';
        
        // Clear radio buttons (scoped to edit modal)
        if (editModal) {
            editModal.querySelectorAll('input[name="reservation_needed"]').forEach(r => r.checked = false);
            editModal.querySelectorAll('input[name="parking_availability"]').forEach(r => r.checked = false);
            editModal.querySelectorAll('input[name="wifi_availability"]').forEach(r => r.checked = false);
            
            // Clear checkboxes (scoped to edit modal)
            editModal.querySelectorAll('input[name="delivery_options[]"]').forEach(c => c.checked = false);
            editModal.querySelectorAll('input[name="accessibility[]"]').forEach(c => c.checked = false);
            editModal.querySelectorAll('input[name="payment_methods[]"]').forEach(c => c.checked = false);
        }
        
        // Clear pricing fields
        const priceRangeEl = document.getElementById('editPriceRange');
        if (priceRangeEl) priceRangeEl.value = '';
    } catch (e) {
        console.warn('Failed to reset facilities fields:', e);
    }

    triggerAddressComposer('editRestaurantAddress');
}

// Top-level helper: render a single, replaceable logo preview for edit modal.
// Only the current logo is displayed. If a new image is selected it becomes the current preview.
function renderEditLogoStates(container, storedUrl, newDataUrl) {
    if (!container) return;
    // Normalize values
    const stored = storedUrl ? (storedUrl + '').replace(/^\.\/+/, '') : null;
    const newData = newDataUrl || null;
    // The active image should be the new one if provided, otherwise the stored one
    const active = newData || stored || 'images/placeholder.jpg';

    // Simple markup: a single 'Current' thumbnail that updates to show the selected file when present
    const currentSize = 220;
    const currentImgStyle = `width:${currentSize}px;height:auto;max-height:260px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#fff;padding:6px;box-sizing:border-box;`;

    const html = `
        <div class="logo-preview-single" style="display:flex;gap:12px;align-items:center;">
                <div class="logo-thumb" style="text-align:center;">
                <img src="${active}" alt="Logo" style="${currentImgStyle}">
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Ensure upload/change button is visible and shows 'Change'
    try {
        if (container.id && container.id.includes('editLogo')) {
            const btn = document.getElementById('editLogoAddTile');
            if (btn) {
                const btnEl = btn.querySelector('button');
                if (btnEl) {
                    btnEl.innerHTML = '<i class="fas fa-edit"></i> Change';
                    btnEl.setAttribute('aria-label', 'Change logo');
                    btnEl.style.display = '';
                }
            }
        }
    } catch (e) {}
}

// Load restaurants for admin management

// Load restaurants for admin management
let allRestaurants = []; // Store all restaurants for filtering

async function loadRestaurantsForAdmin() {
    try {
        const response = await fetch('api/admin_restaurants.php?action=getAll');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        let restaurants;
        
        try {
            restaurants = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid JSON response from server');
        }
        
        if (restaurants && restaurants.error) {
            throw new Error(restaurants.error);
        }
        
        allRestaurants = restaurants || []; // Store all restaurants
        updateDashboardFromRestaurants(allRestaurants); // Keep dashboard cards/lists fresh
        refreshManageRestaurantsView();
        
    } catch (error) {
        console.error('Error loading restaurants:', error);
        const container = document.getElementById('restaurantsList');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Error loading restaurants</h3>
                    <p>${error.message}</p>
                    <button onclick="loadRestaurantsForAdmin()" class="btn-retry">Retry</button>
                </div>
            `;
        }
    }
}

// Load statistics
let statsChart = null;
let statsData = null;

async function loadStatistics() {
    try {
        const response = await fetch('api/admin_restaurants.php?action=statistics');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        let stats;
        
        try {
            stats = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid JSON response from server');
        }
        
        if (stats && stats.error) {
            throw new Error(stats.error);
        }
        
        // Store data globally for filtering
        statsData = stats;
        
        // Update summary cards
        const totalRestaurantsEl = document.getElementById('totalRestaurants');
        const highestRatedEl = document.getElementById('highestRated');
        
        if (totalRestaurantsEl) totalRestaurantsEl.textContent = stats.total_restaurants || 0;
        if (highestRatedEl) highestRatedEl.textContent = stats.highest_rated || '-';
        
        // Populate category filter and restaurant selector
        populateCategoryFilter(stats.categories || []);
        populateRestaurantDropdown(stats.detailed_stats || []);
        
        // Render chart (default to selected or first restaurant)
        const selectEl = document.getElementById('statsRestaurantSelect');
        const selectedId = selectEl ? (selectEl.value || null) : null;
        renderStatsChart(stats.detailed_stats || [], selectedId);
        
        // Render table
        renderStatsTable(stats.detailed_stats || []);
        
        // Setup event listeners
        setupStatisticsEventListeners();
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        const statsContainer = document.querySelector('#statistics .stats-grid');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error loading statistics</h3>
                    <p>${error.message}</p>
                    <button onclick="loadStatistics()" class="btn-retry">Retry</button>
                </div>
            `;
        }
    }
}

function populateCategoryFilter(categories) {
    const filterSelect = document.getElementById('categoryFilter');
    if (!filterSelect) return;
    
    // Keep "All Categories" option and add categories
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterSelect.appendChild(option);
    });
}

function populateRestaurantDropdown(restaurants) {
    const select = document.getElementById('statsRestaurantSelect');
    if (!select) return;

    const options = Array.isArray(restaurants) ? restaurants : [];
    select.innerHTML = '<option value="">Select a restaurant</option>';

    options.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name || `Restaurant ${r.id}`;
        select.appendChild(opt);
    });

    if (options.length) {
        select.value = options[0].id;
    }
}

function renderStatsChart(data, selectedId = null) {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (statsChart) {
        statsChart.destroy();
    }
    
    const restaurants = Array.isArray(data) ? data : [];
    if (!restaurants.length) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const target = selectedId
        ? restaurants.find(r => String(r.id) === String(selectedId)) || restaurants[0]
        : restaurants[0];

    const avg = Number.parseFloat(target.avg_rating) || 0;
    const reviews = Number.parseInt(target.review_count) || 0;
    const hasData = avg > 0 || reviews > 0;
    const labels = hasData ? ['Average Rating', 'Review Count'] : ['No data'];
    const values = hasData ? [Number(avg.toFixed(2)), reviews] : [1];
    const colors = hasData
        ? ['rgba(255, 179, 107, 0.8)', 'rgba(34, 197, 94, 0.8)']
        : ['rgba(229, 231, 235, 0.9)'];
    
    const ctx = canvas.getContext('2d');
    statsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (!hasData) return 'No data';
                            const total = context.dataset.data.reduce((sum, v) => sum + Number(v || 0), 0) || 1;
                            const value = Number(context.parsed || 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderStatsTable(data) {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody) return;
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(r => `
        <tr>
            <td class="name-cell">${escapeHtml(r.name)}</td>
            <td>${escapeHtml(r.category || 'N/A')}</td>
            <td class="rating-cell">${parseFloat(r.avg_rating).toFixed(2)} ⭐</td>
            <td class="number-cell">${parseInt(r.review_count) || 0}</td>
        </tr>
    `).join('');
}

function filterAndSortTable() {
    if (!statsData || !statsData.detailed_stats) return;
    
    const searchTerm = document.getElementById('tableSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    
    // Filter
    let filtered = statsData.detailed_stats.filter(r => {
        const matchesSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || r.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Sort
    filtered.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'rating') {
            return parseFloat(b.avg_rating) - parseFloat(a.avg_rating);
        } else if (sortBy === 'reviews') {
            return parseInt(b.review_count) - parseInt(a.review_count);
        }
        return 0;
    });
    
    renderStatsTable(filtered);
}

function setupStatisticsEventListeners() {
    // Restaurant selector for chart
    const restaurantSelect = document.getElementById('statsRestaurantSelect');
    if (restaurantSelect && !restaurantSelect.dataset.listenerAdded) {
        restaurantSelect.addEventListener('change', (e) => {
            if (statsData && statsData.detailed_stats) {
                renderStatsChart(statsData.detailed_stats, e.target.value || null);
            }
        });
        restaurantSelect.dataset.listenerAdded = 'true';
    }
    
    // Chart refresh button
    const refreshBtn = document.getElementById('refreshChart');
    if (refreshBtn && !refreshBtn.dataset.listenerAdded) {
        refreshBtn.addEventListener('click', () => {
            loadStatistics();
        });
        refreshBtn.dataset.listenerAdded = 'true';
    }
    
    // Table filters
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch && !tableSearch.dataset.listenerAdded) {
        tableSearch.addEventListener('input', filterAndSortTable);
        tableSearch.dataset.listenerAdded = 'true';
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && !categoryFilter.dataset.listenerAdded) {
        categoryFilter.addEventListener('change', filterAndSortTable);
        categoryFilter.dataset.listenerAdded = 'true';
    }
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy && !sortBy.dataset.listenerAdded) {
        sortBy.addEventListener('change', filterAndSortTable);
        sortBy.dataset.listenerAdded = 'true';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isAllDaysClosed(hoursString) {
    if (!hoursString || typeof hoursString !== 'string') return false;
    try {
        const hours = JSON.parse(hoursString);
        if (!hours || typeof hours !== 'object') return false;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.every(day => hours[day] && hours[day].closed === true);
    } catch (e) {
        return false;
    }
}

// Display restaurants in admin panel
function displayRestaurantsForAdmin(restaurants) {
    const container = document.getElementById('restaurantsList');
    
    if (!container) return;
    
    if (!restaurants || restaurants.length === 0) {
        container.innerHTML = '<p>No restaurants found matching your search.</p>';
        return;
    }
    
    if (!Array.isArray(restaurants)) {
        container.innerHTML = '<p>Invalid data format received.</p>';
        return;
    }
    
    container.innerHTML = restaurants.map(restaurant => {
        const thumb = restaurant.logo || restaurant.image_path || (restaurant.image_paths && restaurant.image_paths.length ? restaurant.image_paths[0] : '');
        const displayAddress = restaurant.address && restaurant.address.trim() ? restaurant.address.trim() : 'Not set';
        const safeName = escapeHtml(restaurant.name || 'Unnamed Restaurant');
        const category = restaurant.category || '';
        const safeCategory = escapeHtml(category || 'Uncategorized');
        const categoryColor = mapCategoryColors[category] || '#6b7280';
        const fallbackIconClass = getCategoryIconClass(category);
        return `
        <div class="restaurant-card" data-id="${restaurant.id}" data-category="${escapeHtml(category)}">
            <div class="restaurant-card-media${thumb ? '' : ' is-placeholder'}" style="--category-color: ${categoryColor};">
                ${thumb
                    ? `<img src="${thumb}" alt="${safeName}">`
                    : `<i class="fas ${fallbackIconClass}" aria-hidden="true"></i><span class="sr-only">${safeCategory}</span>`}
            </div>
            <div class="restaurant-card-body">
                <h3 class="restaurant-name" style="border: 2px solid ${categoryColor}; border-radius: 8px; padding: 0.5rem 0.75rem; display: inline-block;">${safeName}</h3>
                <p><strong>Category:</strong> <span style="color: ${categoryColor}; font-weight: 600;">${safeCategory}</span></p>
                <p><strong>Address:</strong> ${escapeHtml(displayAddress)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(restaurant.phone || 'N/A')}</p>
                <div class="restaurant-actions">
                    <button class="btn-edit" onclick="openEditRestaurantModal(${restaurant.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="confirmDeleteRestaurant(${restaurant.id}, '${escapeHtml(restaurant.name || 'this restaurant')}')">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Print currently displayed restaurants (respects active search/filter)
function printRestaurants() {
    // Build the list from data so we include full details and respect filters
    const searchTerm = (document.getElementById('restaurantSearch')?.value || '').toLowerCase();
    const hasImagesOnly = !!document.getElementById('hasImagesFilter') && document.getElementById('hasImagesFilter').checked;

    let listToPrint = [];
    if (Array.isArray(allRestaurants) && allRestaurants.length > 0) {
        listToPrint = allRestaurants.filter(r => {
            const matchesSearch = !searchTerm || (r.name && r.name.toLowerCase().includes(searchTerm)) || (r.address && r.address.toLowerCase().includes(searchTerm)) || (r.description && r.description.toLowerCase().includes(searchTerm));
            const hasImages = r.logo || r.image_path || (r.image_paths && r.image_paths.length);
            const matchesImages = !hasImagesOnly || hasImages;
            return matchesSearch && matchesImages;
        });
    }

    if (!listToPrint || listToPrint.length === 0) return alert('No restaurants to print.');

    const styles = `
        <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 18px; }
            .print-header { margin-bottom: 12px; }
            .restaurant-row { border-bottom: 1px solid #e6e6e6; padding: 12px 0; display: flex; gap: 12px; }
            .restaurant-thumb { width: 110px; height: 80px; overflow: hidden; border-radius:6px; flex-shrink:0; }
            .restaurant-thumb img { width:100%; height:100%; object-fit:cover; }
            .restaurant-info { flex: 1; }
            .restaurant-info h3 { margin: 0 0 6px 0; font-size: 18px; }
            .small { font-size: 13px; color: #444; margin: 4px 0; }
            .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-top:6px; }
            .meta-item { font-size: 13px; color: #333; }
            .label { font-weight:600; color:#222; }
            @media print { button{ display:none } }
        </style>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Unable to open print window. Please allow popups and try again.');

    const titleText = (document.getElementById('restaurantSearch')?.value || '').trim() || 'All Restaurants';
    printWindow.document.write(`<html><head><title>Restaurants - ${escapeHtml(titleText)}</title>${styles}</head><body>`);
    printWindow.document.write(`<div class="print-header"><h2>Restaurants - ${escapeHtml(titleText || 'All')}</h2><p class="small">Printed: ${new Date().toLocaleString()}</p></div>`);

    const container = printWindow.document.createElement('div');
    container.className = 'print-list';

    listToPrint.forEach(r => {
        const row = printWindow.document.createElement('div');
        row.className = 'restaurant-row';

        const thumbWrap = printWindow.document.createElement('div');
        thumbWrap.className = 'restaurant-thumb';
        const thumbImg = printWindow.document.createElement('img');
        thumbImg.alt = r.name || 'Restaurant';
        thumbImg.src = r.logo || r.image_path || (r.image_paths && r.image_paths.length ? r.image_paths[0] : 'images/placeholder.jpg');
        thumbWrap.appendChild(thumbImg);

        const info = printWindow.document.createElement('div');
        info.className = 'restaurant-info';
        const h3 = printWindow.document.createElement('h3');
        h3.textContent = r.name || 'Unnamed';
        info.appendChild(h3);

        // Description
        if (r.description) {
            const desc = printWindow.document.createElement('div');
            desc.className = 'small';
            desc.textContent = r.description;
            info.appendChild(desc);
        }

        // Meta grid
        const grid = printWindow.document.createElement('div');
        grid.className = 'meta-grid';

        const composedAddress = r.address && r.address.trim()
            ? r.address.trim()
            : composeAddressString({
                purok: r.purok || '',
                barangay: r.barangay || '',
                town: r.town || 'Estancia',
                province: r.province || 'Iloilo'
            });
        const displayAddress = composedAddress || 'Not set';
        const displayPurok = r.purok || 'Not set';
        const displayBarangay = r.barangay || 'Not set';
        const displayTown = r.town || 'Estancia';
        const displayProvince = r.province || 'Iloilo';

        const makeMeta = (label, value) => {
            const d = printWindow.document.createElement('div');
            d.className = 'meta-item';
            d.innerHTML = `<span class="label">${escapeHtml(label)}:</span> ${escapeHtml(value || 'N/A')}`;
            return d;
        };

        grid.appendChild(makeMeta('Full Address', displayAddress));
        grid.appendChild(makeMeta('Purok', displayPurok));
        grid.appendChild(makeMeta('Barangay', displayBarangay));
        grid.appendChild(makeMeta('Town / Province', `${displayTown}, ${displayProvince}`));
        grid.appendChild(makeMeta('Phone', r.phone || 'N/A'));
        grid.appendChild(makeMeta('Hours', r.hours || 'N/A'));
        grid.appendChild(makeMeta('Category', r.category || 'N/A'));
        grid.appendChild(makeMeta('Price Range', r.price_range || 'N/A'));
        // Payment methods (may be JSON string)
        let payments = '';
        try {
            payments = Array.isArray(r.payment_methods) ? r.payment_methods.join(', ') : (r.payment_methods ? (typeof r.payment_methods === 'string' ? JSON.parse(r.payment_methods).join(', ') : '') : 'N/A');
        } catch (e) { payments = (r.payment_methods && typeof r.payment_methods === 'string') ? r.payment_methods : 'N/A'; }
        grid.appendChild(makeMeta('Payments', payments || 'N/A'));

        grid.appendChild(makeMeta('Visits', r.visit_count || 0));
        grid.appendChild(makeMeta('Email', r.email || 'N/A'));
        grid.appendChild(makeMeta('Facebook', r.facebook_page || r.facebook_name || 'N/A'));

        // Facilities / flags
        const facilities = [];
        if (r.reservation_needed) facilities.push(`Reservation: ${r.reservation_needed}`);
        if (r.parking_availability) facilities.push(`Parking: ${r.parking_availability}`);
        if (r.wifi_availability) facilities.push(`Wi-Fi: ${r.wifi_availability}`);
        // Delivery options and accessibility (may be arrays/JSON)
        try {
            const del = Array.isArray(r.delivery_options) ? r.delivery_options : (r.delivery_options ? JSON.parse(r.delivery_options) : []);
            if (Array.isArray(del) && del.length) facilities.push(`Delivery: ${del.join(', ')}`);
        } catch (e) {}
        try {
            const acc = Array.isArray(r.accessibility) ? r.accessibility : (r.accessibility ? JSON.parse(r.accessibility) : []);
            if (Array.isArray(acc) && acc.length) facilities.push(`Accessibility: ${acc.join(', ')}`);
        } catch (e) {}

        grid.appendChild(makeMeta('Facilities', facilities.length ? facilities.join(' · ') : 'N/A'));

        info.appendChild(grid);

        // Menu items (short)
        if (r.menu_items) {
            const mi = printWindow.document.createElement('div');
            mi.className = 'small';
            mi.innerHTML = `<span class="label">Menu:</span> ${escapeHtml((typeof r.menu_items === 'string') ? r.menu_items : JSON.stringify(r.menu_items))}`;
            info.appendChild(mi);
        }

        row.appendChild(thumbWrap);
        row.appendChild(info);
        container.appendChild(row);
    });

    printWindow.document.body.appendChild(container);
    printWindow.document.write('</body></html>');

    // Wait briefly for images to start loading then print
    setTimeout(() => {
        try { printWindow.focus(); printWindow.print(); } catch (e) { console.warn('Print failed:', e); }
    }, 600);
}

// Open edit modal
window.openEditRestaurantModal = function(id) {
    resetEditModal();
    
    // editModalState initialized in resetEditModal; ensure structure for multiple images
    window.editModalState = window.editModalState || {
        originalImages: [],
        removedOriginalPaths: [],
        newImageFiles: [],
        imageRemoved: false
    };
    
    fetch(`api/admin_restaurants.php?action=getAll`)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(restaurants => {
            if (restaurants && restaurants.error) {
                throw new Error(restaurants.error);
            }
            
            const restaurant = Array.isArray(restaurants) ? restaurants.find(r => r.id == id) : null;
            if (!restaurant) { 
                showNotification('Restaurant not found', 'error');
                return; 
            }

            // Populate fields
            document.getElementById('editRestaurantId').value = restaurant.id;
            document.getElementById('editRestaurantName').value = restaurant.name;
            document.getElementById('editRestaurantDescription').value = restaurant.description || '';
            const editMapAddressBar = document.getElementById('editMapAddressBar');
            if (editMapAddressBar) editMapAddressBar.value = restaurant.address || '';
            document.getElementById('editRestaurantPhone').value = restaurant.phone || '';
            // Populate structured hours inputs
            populateHoursInputs(restaurant.hours || '', 'edit');
            document.getElementById('editRestaurantMenu').value = restaurant.menu_items || '';
            populateFullMenuItems('editFullMenuItemsList', restaurant.full_menu);
            try {
                document.getElementById('editRestaurantFacebookName').value = restaurant.facebook_name || '';
            } catch (e) {}
            try {
                document.getElementById('editRestaurantFacebook').value = restaurant.facebook_page || '';
            } catch (e) {}
            try {
                document.getElementById('editRestaurantEmail').value = restaurant.email || '';
            } catch (e) {}
            // Set category if present
            try {
                const catEl = document.getElementById('editRestaurantCategory');
                if (catEl) catEl.value = restaurant.category || '';
            } catch (e) {}
            
            // Set facilities and services fields
            try {
                // Get the edit modal to scope all selectors
                const editModal = document.getElementById('editRestaurantModal');
                
                // Seating capacity
                const seatingEl = document.getElementById('editSeatingCapacity');
                if (seatingEl) seatingEl.value = restaurant.seating_capacity || '';
                
                // Clear all radio buttons first
                editModal.querySelectorAll('input[name="reservation_needed"]').forEach(r => r.checked = false);
                editModal.querySelectorAll('input[name="parking_availability"]').forEach(r => r.checked = false);
                editModal.querySelectorAll('input[name="wifi_availability"]').forEach(r => r.checked = false);
                
                // Reservation needed
                if (restaurant.reservation_needed) {
                    const reservationRadio = editModal.querySelector(`input[name="reservation_needed"][value="${restaurant.reservation_needed}"]`);
                    if (reservationRadio) reservationRadio.checked = true;
                }
                
                // Parking availability
                if (restaurant.parking_availability) {
                    const parkingRadio = editModal.querySelector(`input[name="parking_availability"][value="${restaurant.parking_availability}"]`);
                    if (parkingRadio) parkingRadio.checked = true;
                }
                
                // Wi-Fi availability
                if (restaurant.wifi_availability) {
                    const wifiRadio = editModal.querySelector(`input[name="wifi_availability"][value="${restaurant.wifi_availability}"]`);
                    if (wifiRadio) wifiRadio.checked = true;
                }
                
                // Clear all checkboxes first
                editModal.querySelectorAll('input[name="delivery_options[]"]').forEach(cb => cb.checked = false);
                editModal.querySelectorAll('input[name="accessibility[]"]').forEach(cb => cb.checked = false);
                
                // Delivery options (parse JSON array)
                if (restaurant.delivery_options) {
                    let deliveryOpts = [];
                    try {
                        deliveryOpts = typeof restaurant.delivery_options === 'string' ? JSON.parse(restaurant.delivery_options) : restaurant.delivery_options;
                    } catch (e) {}
                    if (Array.isArray(deliveryOpts)) {
                        deliveryOpts.forEach(opt => {
                            const checkbox = editModal.querySelector(`input[name="delivery_options[]"][value="${opt}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }
                
                // Accessibility (parse JSON array)
                if (restaurant.accessibility) {
                    let accessibilityOpts = [];
                    try {
                        accessibilityOpts = typeof restaurant.accessibility === 'string' ? JSON.parse(restaurant.accessibility) : restaurant.accessibility;
                    } catch (e) {}
                    if (Array.isArray(accessibilityOpts)) {
                        accessibilityOpts.forEach(opt => {
                            const checkbox = editModal.querySelector(`input[name="accessibility[]"][value="${opt}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to populate facilities fields:', e);
            }
            
            // Set pricing and payment fields
            try {
                const editModal = document.getElementById('editRestaurantModal');
                
                console.log('Setting pricing data:', {
                    price_range: restaurant.price_range,
                    payment_methods: restaurant.payment_methods
                });
                
                // Price range
                const priceRangeEl = document.getElementById('editPriceRange');
                if (priceRangeEl) {
                    priceRangeEl.value = restaurant.price_range || '';
                    console.log('Price range element found, value set to:', priceRangeEl.value);
                } else {
                    console.warn('editPriceRange element not found!');
                }
                
                // Clear payment method checkboxes first
                if (editModal) {
                    editModal.querySelectorAll('input[name="payment_methods[]"]').forEach(cb => cb.checked = false);
                
                    // Payment methods (parse JSON array)
                    if (restaurant.payment_methods) {
                        let paymentOpts = [];
                        try {
                            paymentOpts = typeof restaurant.payment_methods === 'string' ? JSON.parse(restaurant.payment_methods) : restaurant.payment_methods;
                            console.log('Payment options parsed:', paymentOpts);
                        } catch (e) {
                            console.error('Failed to parse payment_methods:', e);
                        }
                        if (Array.isArray(paymentOpts)) {
                            paymentOpts.forEach(opt => {
                                const checkbox = editModal.querySelector(`input[name="payment_methods[]"][value="${opt}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                    console.log('Checked payment method:', opt);
                                } else {
                                    console.warn('Payment checkbox not found for:', opt);
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to populate pricing fields:', e);
            }
            
            // Set contact fields
            try {
                document.getElementById('editRestaurantEmail').value = restaurant.email || '';
            } catch (e) {}
            try {
                document.getElementById('editRestaurantFacebook').value = restaurant.facebook_page || '';
            } catch (e) {}
            document.getElementById('editLatitude').value = restaurant.latitude;
            document.getElementById('editLongitude').value = restaurant.longitude;
            const editMapBar = document.getElementById('editMapAddressBar');
            if (editMapBar) editMapBar.value = restaurant.address || '';

            // edit modal map initialization will run after the modal is shown

            // Optional badge (show only the numeric ID — label is in the HTML)
            const idBadge = document.getElementById('editIdBadge');
            if (idBadge) idBadge.textContent = String(restaurant.id ?? '—');

            // After populating modal fields, render fractional stars where present
            try { renderFractionalStars(); } catch (e) {}

            // Handle image path
            // Prepare images (support image_paths array or legacy image_path)
            let images = [];
            try {
                if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length) {
                    images = restaurant.image_paths.slice();
                } else if (restaurant.image_paths && typeof restaurant.image_paths === 'string') {
                    // attempt to parse JSON
                    try { images = JSON.parse(restaurant.image_paths) || []; } catch(e) { images = []; }
                } else if (restaurant.image_path) {
                    images = [restaurant.image_path];
                }
            } catch (e) {
                images = restaurant.image_path ? [restaurant.image_path] : [];
            }

            // Normalize paths (remove leading ./)
            images = images.map(p => (p || '').toString().replace(/^\.\/+/, ''));

            // Render fractional star ratings by replacing existing star markup with layered stars
            function renderFractionalStars(root=document){
                const els = (root || document).querySelectorAll('.star-rating-display');
                els.forEach(el => {
                    // avoid double-rendering
                    if (el.dataset.fractional === '1') return;
                    // find numeric rating: data-rating or child .rating-value text or first number in textContent
                    let rating = parseFloat(el.getAttribute('data-rating'));
                    if (isNaN(rating)){
                        const rv = el.querySelector('.rating-value');
                            if (rv) rating = parseFloat(rv.textContent.replace(/[^0-9.]/g, ''));
                    }
                    if (isNaN(rating)){
                        // try to find first number in element
                        const m = (el.textContent || '').match(/\d+(\.\d+)?/);
                        rating = m ? parseFloat(m[0]) : 0;
                    }

                    rating = Math.max(0, Math.min(5, Number(rating) || 0));

                    // build outer and inner star sets
                    const outer = document.createElement('span');
                    outer.className = 'stars-outer';
                    const inner = document.createElement('span');
                    inner.className = 'stars-inner';

                    for (let i=0;i<5;i++){
                        const e = document.createElement('i'); e.className = 'far fa-star'; outer.appendChild(e);
                    }
                    for (let i=0;i<5;i++){
                        const e = document.createElement('i'); e.className = 'fas fa-star'; inner.appendChild(e);
                    }
                    // clear existing content except keep numeric rating span if present
                    const valueSpan = el.querySelector('.rating-value');
                    el.innerHTML = '';
                    outer.appendChild(inner);
                    el.appendChild(outer);
                    if (valueSpan) el.appendChild(valueSpan);

                    // set inner width by percentage
                    const pct = (rating / 5) * 100;
                    inner.style.width = pct + '%';
                    el.dataset.fractional = '1';
                });
            }

            // run on initial load
            document.addEventListener('DOMContentLoaded', () => renderFractionalStars());

            // If a logo exists for this restaurant, ensure it is not shown in the gallery previews
            // (logo is managed separately). Filter out any image path that equals the logo path.
            try {
                const logoPath = restaurant.logo || '';
                if (logoPath) {
                    images = images.filter(p => p && p !== logoPath);
                }
            } catch (e) {
                // ignore
            }

            // Store original images in modal state
            window.editModalState.originalImages = images.slice();
            window.editModalState.removedOriginalPaths = [];
            window.editModalState.newImageFiles = [];

            // Parse and store menu images (stored as JSON array in DB)
            let menuImages = [];
            try {
                if (restaurant.menu_image) {
                    if (Array.isArray(restaurant.menu_image)) {
                        menuImages = restaurant.menu_image;
                    } else if (typeof restaurant.menu_image === 'string') {
                        try {
                            menuImages = JSON.parse(restaurant.menu_image) || [];
                        } catch (e) {
                            // If not JSON, treat as single image path
                            menuImages = [restaurant.menu_image];
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to parse menu images:', e);
                menuImages = [];
            }
            // Normalize menu image paths (remove leading ./)
            menuImages = menuImages.map(p => (p || '').toString().replace(/^\.\/+/, ''));
            
            // Store menu images in modal state
            window.editModalState.existingMenuImages = menuImages.slice();
            window.editModalState.newMenuImageFiles = [];
            
            console.log('Menu images loaded from DB:', menuImages);
            console.log('Modal state after loading:', window.editModalState);

            // Set hero image (first image or placeholder)
            const heroImg = document.getElementById('editHeroImgTag');
            if (heroImg) {
                heroImg.src = images[0] || 'images/placeholder.jpg';
                heroImg.style.display = 'block';
            }

            // Set initial logo preview in the edit modal (if a logo exists)
            try {
                const editLogoContainer = document.getElementById('editLogoPreviewContainer');
                const editLogoInput = document.getElementById('editRestaurantLogo');
                // Determine the current logo to display: prefer explicit logo, fall back to image_path or first image
                let logoUrl = '';
                if (restaurant.logo) logoUrl = restaurant.logo;
                else if (restaurant.image_path) logoUrl = restaurant.image_path;
                else if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length) logoUrl = restaurant.image_paths[0];
                // Normalize logo path (remove leading ./) so the src is consistent with images
                if (logoUrl && typeof logoUrl === 'string') {
                    logoUrl = logoUrl.replace(/^\.\/+/, '');
                }
                // Clear previous preview only (we will render immediately after)
                if (editLogoContainer) editLogoContainer.innerHTML = '';
                // Store the persisted logo in modal state so we can show old/current/new states
                if (!window.editModalState) window.editModalState = {};
                window.editModalState.storedLogo = logoUrl || null;
                // Store persisted menu image path for edit modal
                window.editModalState.storedMenuImage = restaurant.menu_image ? (restaurant.menu_image + '').replace(/^\.\/+/, '') : null;
                // Render logo states: stored (old) and current; new (selected) will appear when user picks a file
                if (editLogoContainer) {
                    renderEditLogoStates(editLogoContainer, window.editModalState.storedLogo, null);
                }
                // Render menu image preview if present
                try {
                    const editMenuPreview = document.getElementById('editMenuImagePreviewContainer');
                    if (editMenuPreview) {
                        renderEditMenuImageStates(editMenuPreview, window.editModalState.storedMenuImage, null);
                    }
                    const editMenuInput = document.getElementById('editRestaurantMenuImage');
                    if (editMenuInput) editMenuInput.value = '';
                } catch (e) {}
                // Clear the file input value (don't remove preview)
                if (editLogoInput) editLogoInput.value = '';
            } catch (e) {
                console.warn('Failed to set edit logo preview', e);
            }

            // Render multi-image previews into the grid
            const previewContainer = document.getElementById('editImagePreviewContainer');
            const counterEl = document.getElementById('editImageCounter');
            if (previewContainer) {
                previewContainer.innerHTML = '';
                images.forEach((p, idx) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'image-preview';
                    wrapper.setAttribute('data-original-index', idx);
                    wrapper.innerHTML = `
                        <img src="${p}" alt="image-${idx}">
                        <button type="button" class="remove-image" aria-label="Remove image">&times;</button>
                    `;
                    // Remove handler (store path instead of index to avoid index-shift bugs)
                    wrapper.querySelector('.remove-image').addEventListener('click', function() {
                        const path = (window.editModalState.originalImages && window.editModalState.originalImages[idx]) || p;
                        if (path) window.editModalState.removedOriginalPaths.push(path);
                        wrapper.remove();
                        updateEditImageCounter();
                        // update hero if needed
                        const remaining = previewContainer.querySelectorAll('.image-preview img');
                        if (heroImg) heroImg.src = remaining[0] ? remaining[0].src : (window.editModalState.originalImages[0] || 'images/placeholder.jpg');
                    });
                    previewContainer.appendChild(wrapper);
                });
                // Append add-tile so the + button appears inline with thumbnails, only if under max (5)
                if (images.length < 5) {
                    const addTile = document.createElement('div');
                    addTile.className = 'image-add';
                    addTile.innerHTML = `
                        <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('editMultipleImageUpload').click()" aria-label="Add images">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                        </button>
                    `;
                    previewContainer.appendChild(addTile);
                }
            }
            if (counterEl) counterEl.textContent = `${images.length}/5`;

            // Initialize multi-image upload input handling
            initializeEditMultipleImageUpload();
            // Initialize logo input handling and previews
            initializeLogoInputs();
            // Initialize menu images upload for edit form
            initializeMenuImageInputs();

            // Show modal with immediate display
            const editModal = document.getElementById('editRestaurantModal');
            editModal.style.display = 'block';
            document.body.classList.add('modal-open');
            
            // Force reflow then add active class for any CSS animations
            editModal.offsetHeight;
            editModal.classList.add('active');

            // Initialize edit map after modal is visible so Leaflet can correctly calculate sizes
            try {
                // Delay slightly to allow CSS transitions/layout to settle
                setTimeout(() => {
                    ensureEditMapInitialized();
                    const rlat = parseFloat(restaurant.latitude);
                    const rlng = parseFloat(restaurant.longitude);
                    if (Number.isFinite(rlat) && Number.isFinite(rlng)) {
                        setEditMarker(rlat, rlng);
                        if (editMap) {
                            try { editMap.invalidateSize(); editMap.setView([rlat, rlng], 14); } catch (e) { console.warn(e); }
                        }
                    } else {
                        // if no coords, just invalidate to render map
                        if (editMap) try { editMap.invalidateSize(); } catch (e) {}
                    }
                }, 120);
            } catch (e) {
                console.warn('Failed to initialize edit map after show:', e);
            }
        })
        .catch(err => { 
            console.error('openEditRestaurantModal error:', err); 
            showNotification('Error loading restaurant data: ' + err.message, 'error');
        });
};

// Open a read-only details modal for admin
// (View modal removed) admin detail view handled elsewhere or omitted per UX decision.

// Utility: escape HTML for simple insertion
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Get a friendly display name for a Facebook page URL (show only page name)
function getFacebookDisplayName(url) {
    if (!url) return '';
    try {
        const u = new URL(url, window.location.origin);
        let path = (u.pathname || '').replace(/\/+$/, '');
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return u.hostname;

        const pagesIdx = parts.indexOf('pages');
        let name = '';
        if (pagesIdx !== -1 && parts.length > pagesIdx + 1) {
            name = parts[pagesIdx + 1];
        } else {
            name = parts[parts.length - 1];
        }

        if (/^\d+$/.test(name) && parts.length > 1) {
            name = parts[parts.length - 2];
        }

        name = decodeURIComponent(name).replace(/[-_]+/g, ' ');
        return name || u.hostname;
    } catch (e) {
        return url;
    }
}

// Update image preview
function updateImagePreview(imagePath) {
    const previewBox = document.getElementById('currentImagePreview');
    if (!previewBox) return;

    if (imagePath && !window.editModalState.imageRemoved) {
        previewBox.classList.remove('empty');
        previewBox.innerHTML = `<img src="${imagePath}" alt="Current image" style="max-width:100%;max-height:200px;">`;
    } else {
        previewBox.classList.add('empty');
        previewBox.innerHTML = '<span class="placeholder">No image</span>';
    }
}

// Initialize image controls
function initializeImageControls() {
    const fileInput = document.getElementById('editImageUpload');
    const removeBtn = document.getElementById('removeImageBtn');
    const resetBtn = document.getElementById('resetImageBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const heroImg = document.getElementById('editHeroImgTag');

    if (!fileInput || !removeBtn || !resetBtn) return;

    // File input change
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'warning');
            fileInput.value = '';
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            showNotification('Image is larger than 3 MB', 'warning');
            fileInput.value = '';
            return;
        }

        // Store new file in modal state
        window.editModalState.newImageFile = file;
        window.editModalState.imageRemoved = false;

        // Update preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (heroImg) {
                heroImg.src = e.target.result;
            }
            updateImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    });

    // Remove image
    removeBtn.addEventListener('click', function() {
        window.editModalState.imageRemoved = true;
        window.editModalState.newImageFile = null;
        fileInput.value = '';

        if (heroImg) {
            heroImg.src = 'images/placeholder.jpg';
        }

        updateImagePreview(null);
    });

    // Reset image
    resetBtn.addEventListener('click', function() {
        window.editModalState.imageRemoved = false;
        window.editModalState.newImageFile = null;
        fileInput.value = '';

        if (heroImg) {
            const firstOriginal = (window.editModalState.originalImages && window.editModalState.originalImages[0]) || 'images/placeholder.jpg';
            heroImg.src = firstOriginal;
        }

        updateImagePreview((window.editModalState.originalImages && window.editModalState.originalImages[0]) || null);
    });

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeEditModalAndRefresh();
        });
    }
}

// Initialize multiple image upload input for edit modal
function initializeEditMultipleImageUpload() {
    const multiInput = document.getElementById('editMultipleImageUpload');
    const previewContainer = document.getElementById('editImagePreviewContainer');
    const counterEl = document.getElementById('editImageCounter');

    if (!multiInput || !previewContainer || !counterEl) return;

    // change handler for newly selected files
    multiInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

    // Ensure we don't exceed 5 images total (originals not removed + new files)
    const existingCount = previewContainer.querySelectorAll('.image-preview').length;
    const allowed = Math.max(0, 5 - existingCount);
        const toAdd = files.slice(0, allowed);

        toAdd.forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            if (file.size > 3 * 1024 * 1024) return;

            // store file in modal state
            window.editModalState.newImageFiles.push(file);

            const reader = new FileReader();
            reader.onload = function(evt) {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview';
                wrapper.innerHTML = `
                    <img src="${evt.target.result}" alt="new-image">
                    <button type="button" class="remove-image" aria-label="Remove image">&times;</button>
                `;
                // remove handler for new file previews
                wrapper.querySelector('.remove-image').addEventListener('click', function() {
                    // find index in newImageFiles by matching data URL is not practical; simply remove the last matching
                    const idx = window.editModalState.newImageFiles.indexOf(file);
                    if (idx !== -1) window.editModalState.newImageFiles.splice(idx, 1);
                    wrapper.remove();
                    updateEditImageCounter();
                });
                // Keep add-tile at the end: insert before it if present
                const addTile = previewContainer.querySelector('.image-add');
                if (addTile) previewContainer.insertBefore(wrapper, addTile);
                else previewContainer.appendChild(wrapper);
                updateEditImageCounter();
            };
            reader.readAsDataURL(file);
        });

        // Reset input so same file can be selected again if needed
        multiInput.value = '';
    });
}

function updateEditImageCounter() {
    const previewContainer = document.getElementById('editImagePreviewContainer');
    const counterEl = document.getElementById('editImageCounter');
    if (!counterEl) return;
    const visible = previewContainer ? previewContainer.querySelectorAll('.image-preview').length : 0;
    counterEl.textContent = `${visible}/5`;
    // Show or hide the add-tile depending on whether we hit the max
    if (previewContainer) {
        const addTile = previewContainer.querySelector('.image-add');
    if (visible < 5) {
            if (!addTile) {
                const tile = document.createElement('div');
                tile.className = 'image-add';
                tile.innerHTML = `
                    <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('editMultipleImageUpload').click()" aria-label="Add images">
                        <i class="fas fa-plus" aria-hidden="true"></i>
                    </button>
                `;
                previewContainer.appendChild(tile);
            }
        } else {
            if (addTile) addTile.remove();
        }
    }
}

// Delete restaurant
async function deleteRestaurant(id) {
    if (!confirm('Are you sure you want to delete this restaurant?')) {
        return;
    }
    
    try {
        const response = await fetch(`api/admin_restaurants.php?action=delete&id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            showNotification('Restaurant deleted successfully!', 'success');
            loadRestaurantsForAdmin();
            loadStatistics();
        } else {
            showNotification('Error deleting restaurant: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error deleting restaurant: ' + error.message, 'error');
    }
}

// Force refresh page data
window.refreshAdminPage = function() {
    console.log('Refreshing admin page data...');
    loadRestaurantsForAdmin();
    loadStatistics();
    
    // If map exists, invalidate size to ensure proper rendering
    if (adminMap) {
        setTimeout(() => {
            adminMap.invalidateSize();
        }, 300);
    }
};

// Add keyboard shortcut for refresh (Ctrl + R)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault(); // Prevent browser refresh
        refreshAdminPage();
    }
});

// Multiple Image Upload Functions
function initializeMultipleImageUpload() {
    const imageInput = document.getElementById('multipleImageUpload');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const counterElement = document.getElementById('imageCounter');
    
    if (!imageInput || !previewContainer) return;

    let selectedFiles = [];
    let existingImages = [];

    // Initialize from modal state if in edit mode
    if (window.editModalState) {
        existingImages = window.editModalState.existingImages || [];
        selectedFiles = window.editModalState.newImageFiles || [];
        updateImagePreviews();
    }   

    // File input change handler
    imageInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const invalidFiles = [];

        // Validate each file
        files.forEach(file => {
            if (selectedFiles.length + existingImages.length >= 5) {
                showNotification('Maximum 5 images allowed', 'warning');
                return;
            }

            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name);
                return;
            }

            if (file.size > 3 * 1024 * 1024) {
                showNotification(`"${file.name}" exceeds 3MB limit`, 'warning');
                return;
            }

            validFiles.push(file);
        });

        // Show error for non-image files
        if (invalidFiles.length > 0) {
            showNotification(`Skipped non-image files: ${invalidFiles.join(', ')}`, 'error');
        }

    // Add valid files (respect 5-image max)
    selectedFiles = [...selectedFiles, ...validFiles].slice(0, 5 - existingImages.length);
        updateImagePreviews();
        
        // Reset input to allow selecting same files again
        imageInput.value = '';
    });

    // Update previews
    function updateImagePreviews() {
        const totalCount = existingImages.length + selectedFiles.length;
        
        // Update counter
        if (counterElement) {
            counterElement.textContent = `${totalCount}/5 selected`;
        }

        // Clear preview container
        previewContainer.innerHTML = '';

        // Show existing images first
        existingImages.forEach((imagePath, index) => {
            const previewElement = createPreviewElement(imagePath, index, true);
            previewContainer.appendChild(previewElement);
        });

        // Show new file previews
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewElement = createPreviewElement(e.target.result, index + existingImages.length, false);
                // Insert before add-tile if present so the add button stays at the end
                const addTile = previewContainer.querySelector('.image-add');
                if (addTile) previewContainer.insertBefore(previewElement, addTile);
                else previewContainer.appendChild(previewElement);
            };
            reader.readAsDataURL(file);
        });

        // Update modal state
        if (window.editModalState) {
            window.editModalState.existingImages = [...existingImages];
            window.editModalState.newImageFiles = [...selectedFiles];
        }
        // Ensure an add-tile exists only when below max
        const currentTotal = existingImages.length + selectedFiles.length;
        const addTiles = Array.from(previewContainer.querySelectorAll('.image-add'));
        if (currentTotal < 5 && addTiles.length === 0) {
            const tile = document.createElement('div');
            tile.className = 'image-add';
            tile.innerHTML = `
                <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('multipleImageUpload').click()" aria-label="Add images">
                    <i class="fas fa-plus" aria-hidden="true"></i>
                </button>
            `;
            previewContainer.appendChild(tile);
        } else if (currentTotal >= 5 && addTiles.length) {
            addTiles.forEach(tile => tile.remove());
        }
    }

    // Create preview element
    function createPreviewElement(src, index, isExisting) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${src}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image" 
                    onclick="removeImage(${index}, ${isExisting})"
                    aria-label="Remove image">
                <i class="fas fa-times"></i>
            </button>
            <div class="image-overlay">
                <span>${isExisting ? 'Existing' : 'New'}</span>
            </div>
        `;
        return preview;
    }

    // Remove image function (needs to be global)
    window.removeImage = function(index, isExisting) {
        if (isExisting) {
            existingImages.splice(index, 1);
        } else {
            selectedFiles.splice(index - existingImages.length, 1);
        }
        updateImagePreviews();
    };

    // Get form data function
    window.getImageFormData = function(formData) {
        // Add existing images
        existingImages.forEach((imagePath, index) => {
            formData.append('existing_images[]', imagePath);
        });

        // Add new files
        selectedFiles.forEach((file, index) => {
            formData.append('images[]', file);
        });

        return formData;
    };

    // Initialize previews
    updateImagePreviews();
}

// Logo input handling for add/edit forms
function initializeLogoInputs() {
    // Add form (single logo)
    const logoInput = document.getElementById('restaurantLogo');
    const addLogoPreview = document.getElementById('addLogoPreviewContainer');

    function renderLogoPreview(container, src) {
        if (!container) return;
        if (!src) {
            container.innerHTML = '';
            // show upload button when preview cleared
            try {
                if (container.id && container.id.includes('addLogo')) {
                    const btn = document.getElementById('addLogoTile');
                    if (btn) btn.style.display = '';
                } else if (container.id && container.id.includes('editLogo')) {
                    const btn = document.getElementById('editLogoAddTile');
                    if (btn) btn.style.display = '';
                }
            } catch (e) {}
            return;
        }

    // Render a simple single logo preview for add-form usage
    container.innerHTML = `<img src="${src}" alt="Logo preview" style="width:100%;max-width:220px;height:auto;object-fit:cover;border-radius:6px;border:1px solid #ddd;">`;

        // hide upload button when preview is present but change it to 'Change'
        try {
            if (container.id && container.id.includes('addLogo')) {
                const btn = document.getElementById('addLogoTile');
                if (btn) {
                    const btnEl = btn.querySelector('button');
                    if (btnEl) {
                        btnEl.innerHTML = '<i class="fas fa-edit"></i> Change';
                        btnEl.setAttribute('aria-label', 'Change logo');
                        btnEl.style.display = '';
                    }
                }
            } else if (container.id && container.id.includes('editLogo')) {
                const btn = document.getElementById('editLogoAddTile');
                if (btn) {
                    const btnEl = btn.querySelector('button');
                    if (btnEl) {
                        btnEl.innerHTML = '<i class="fas fa-edit"></i> Change';
                        btnEl.setAttribute('aria-label', 'Change logo');
                        btnEl.style.display = '';
                    }
                }
            }
        } catch (e) {}
    }

    if (logoInput && addLogoPreview) {
        logoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) { renderLogoPreview(addLogoPreview, ''); return; }
            if (!file.type.startsWith('image/')) {
                showNotification('Logo must be an image', 'warning');
                logoInput.value = '';
                return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
                showNotification('Logo must be smaller than 1.5MB', 'warning');
                logoInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(ev) {
                renderLogoPreview(addLogoPreview, ev.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Edit form logo input
    const editLogoInput = document.getElementById('editRestaurantLogo');
    const editLogoPreviewContainer = document.getElementById('editLogoPreviewContainer');
    if (editLogoInput && editLogoPreviewContainer) {
        editLogoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            // if no file selected, show stored/current only
            if (!file) {
                renderEditLogoStates(editLogoPreviewContainer, (window.editModalState && window.editModalState.storedLogo) || null, null);
                return;
            }
            if (!file.type.startsWith('image/')) {
                showNotification('Logo must be an image', 'warning');
                editLogoInput.value = '';
                return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
                showNotification('Logo must be smaller than 1.5MB', 'warning');
                editLogoInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(ev) {
                // show stored/current/new states
                renderEditLogoStates(editLogoPreviewContainer, (window.editModalState && window.editModalState.storedLogo) || null, ev.target.result);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Render menu image states for edit modal (stored vs newly selected)
function renderEditMenuImageStates(container, storedUrl, newDataUrl) {
    if (!container) return;
    const stored = storedUrl ? (storedUrl + '').replace(/^\.\/+/, '') : null;
    const newData = newDataUrl || null;
    const active = newData || stored || '';

    if (!active) {
        container.innerHTML = '';
        try {
            const btn = document.getElementById('editMenuImageAddTile');
            if (btn) {
                const btnEl = btn.querySelector('button');
                if (btnEl) {
                    btnEl.innerHTML = '<i class="fas fa-upload" aria-hidden="true"></i>';
                    btnEl.setAttribute('aria-label', 'Select menu image');
                    btnEl.style.display = '';
                }
            }
        } catch (e) {}
        return;
    }

    const imgStyle = 'width:100%;height:auto;max-height:260px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#fff;padding:6px;box-sizing:border-box;';
    container.innerHTML = `<img src="${active}" alt="Menu image" style="${imgStyle}">`;

    try {
        const btn = document.getElementById('editMenuImageAddTile');
        if (btn) {
            const btnEl = btn.querySelector('button');
            if (btnEl) {
                btnEl.innerHTML = '<i class="fas fa-edit"></i> Change';
                btnEl.setAttribute('aria-label', 'Change menu image');
                btnEl.style.display = '';
            }
        }
    } catch (e) {}
}

// Initialize menu image inputs for add and edit forms (multiple upload with 10-image limit)
function initializeMenuImageInputs() {
    // Only initialize edit form (add form is initialized on page load)
    initializeMenuImageUpload('editRestaurantMenuImages', 'editMenuImagePreviewContainer', 'editMenuImageCounter', 'editMenuImageAddTile', 10);
}

function initializeMenuImageUpload(inputId, containerId, counterId, tileId, maxImages) {
    const imageInput = document.getElementById(inputId);
    const previewContainer = document.getElementById(containerId);
    const counterElement = document.getElementById(counterId);
    
    if (!imageInput || !previewContainer) return;

    // Remove existing event listeners by cloning the element
    const newImageInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newImageInput, imageInput);
    const cleanInput = document.getElementById(inputId); // Get the new element

    // For edit mode, use modal state directly; for add mode, use local arrays
    let selectedFiles, existingImages;
    
    if (inputId.startsWith('edit') && window.editModalState) {
        // Edit mode - use modal state directly (no copying)
        if (!window.editModalState.existingMenuImages) window.editModalState.existingMenuImages = [];
        if (!window.editModalState.newMenuImageFiles) window.editModalState.newMenuImageFiles = [];
        selectedFiles = window.editModalState.newMenuImageFiles;
        existingImages = window.editModalState.existingMenuImages;
        console.log('Initializing menu images for', inputId, '- existing:', existingImages.length, 'new:', selectedFiles.length);
        updateMenuImagePreviews();
    } else {
        // Add mode - use local arrays
        selectedFiles = [];
        existingImages = [];
    }

    // File input change handler
    cleanInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const invalidFiles = [];

        // Validate each file
        files.forEach(file => {
            if (selectedFiles.length + existingImages.length >= maxImages) {
                showNotification(`Maximum ${maxImages} menu images allowed`, 'warning');
                return;
            }

            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name);
                return;
            }

            if (file.size > 2.5 * 1024 * 1024) {
                showNotification(`"${file.name}" exceeds 2.5MB limit`, 'warning');
                return;
            }

            validFiles.push(file);
        });

        // Show error for non-image files
        if (invalidFiles.length > 0) {
            showNotification(`Skipped non-image files: ${invalidFiles.join(', ')}`, 'error');
        }

        // Add valid files (respect max limit)
        selectedFiles.push(...validFiles);
        if (selectedFiles.length + existingImages.length > maxImages) {
            selectedFiles = selectedFiles.slice(0, maxImages - existingImages.length);
        }
        
        console.log('Files added to selectedFiles array, now has:', selectedFiles.length, 'files');
        
        updateMenuImagePreviews();
        
        // Reset input to allow selecting same files again
        cleanInput.value = '';
    });

    // Update previews
    function updateMenuImagePreviews() {
        const totalCount = existingImages.length + selectedFiles.length;
        
        // Update counter
        if (counterElement) {
            counterElement.textContent = `${totalCount}/${maxImages} selected`;
        }

        // Clear preview container
        previewContainer.innerHTML = '';

        let previewsLoaded = 0;
        const totalPreviews = existingImages.length + selectedFiles.length;

        // Show existing images first
        existingImages.forEach((imagePath, index) => {
            const previewElement = createMenuPreviewElement(imagePath, index, true);
            // Insert before add-tile if present so add-tile stays at the end
            const addTile = previewContainer.querySelector('.image-add');
            if (addTile) previewContainer.insertBefore(previewElement, addTile);
            else previewContainer.appendChild(previewElement);
            previewsLoaded++;
            if (previewsLoaded === totalPreviews) {
                updateMenuAddTileVisibility();
            }
        });

        // Show new file previews
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewElement = createMenuPreviewElement(e.target.result, index + existingImages.length, false);
                const addTile = previewContainer.querySelector('.image-add');
                if (addTile) previewContainer.insertBefore(previewElement, addTile);
                else previewContainer.appendChild(previewElement);
                previewsLoaded++;
                if (previewsLoaded === totalPreviews) {
                    updateMenuAddTileVisibility();
                }
            };
            reader.readAsDataURL(file);
        });

        // If no images, show add-tile immediately
        if (totalPreviews === 0) {
            updateMenuAddTileVisibility();
        }
    }

    function updateMenuAddTileVisibility() {
        const currentTotal = existingImages.length + selectedFiles.length;
        const addTiles = Array.from(previewContainer.querySelectorAll('.image-add'));
        
        if (currentTotal < maxImages && addTiles.length === 0) {
            const tile = document.createElement('div');
            tile.className = 'image-add';
            tile.innerHTML = `
                <button type="button" class="image-add-btn btn-secondary" onclick="document.getElementById('${inputId}').click()" aria-label="Add menu images">
                    <i class="fas fa-plus" aria-hidden="true"></i>
                </button>
            `;
            previewContainer.appendChild(tile);
        } else if (currentTotal >= maxImages && addTiles.length) {
            addTiles.forEach(tile => tile.remove());
        }
    }

    // Create preview element
    function createMenuPreviewElement(src, index, isExisting) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.setAttribute('data-menu-index', index);
        preview.innerHTML = `
            <img src="${src}" alt="Menu ${index + 1}">
            <button type="button" class="remove-image" aria-label="Remove menu image">&times;</button>
        `;
        // attach remove handler that delegates to the global remover so behavior matches gallery previews
        const btn = preview.querySelector('.remove-image');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof window[`removeMenuImage_${inputId}`] === 'function') {
                    window[`removeMenuImage_${inputId}`](index, isExisting);
                }
            });
        }
        return preview;
    }

    // Remove menu image function (needs to be global)
    window[`removeMenuImage_${inputId}`] = function(index, isExisting) {
        if (isExisting) {
            existingImages.splice(index, 1);
        } else {
            selectedFiles.splice(index - existingImages.length, 1);
        }
        console.log('After remove - existing:', existingImages.length, 'new:', selectedFiles.length);
        updateMenuImagePreviews();
    };

    // Get form data function
    window[`getMenuImageFormData_${inputId}`] = function(formData) {
        // Add new files
        selectedFiles.forEach((file, index) => {
            formData.append('menu_images[]', file);
        });
        return formData;
    };

    // Initialize previews
    updateMenuImagePreviews();
}

// Append logo file to FormData if present
function appendLogoToFormData(formData, prefix = '') {
    const logoEl = document.getElementById(prefix + 'RestaurantLogo') || document.getElementById(prefix + 'restaurantLogo');
    if (logoEl && logoEl.files && logoEl.files[0]) {
        formData.append('logo', logoEl.files[0]);
    }
    return formData;
}

function showAddRestaurantStep(stepNumber) {
    const step1 = document.getElementById('addRestaurantStep1');
    const step2 = document.getElementById('addRestaurantStep2');
    if (!step1 || !step2) return;

    if (stepNumber === 2) {
        step1.classList.remove('active');
        step2.classList.add('active');
    } else {
        step2.classList.remove('active');
        step1.classList.add('active');
    }
}

function validateAddRestaurantStep1RequiredFields() {
    const step1 = document.getElementById('addRestaurantStep1');
    if (!step1) return false;

    const requiredFields = step1.querySelectorAll('input[required], select[required], textarea[required]');
    for (const field of requiredFields) {
        if (field.disabled) continue;
        if (!field.checkValidity()) {
            field.reportValidity();
            try {
                field.focus({ preventScroll: false });
            } catch (e) {
                field.focus();
            }
            return false;
        }
    }

    return true;
}

function isValidOwnerLoginCredential(value) {
    const input = String(value || '').trim();
    if (!input) return false;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isPhone = /^(09\d{9}|\+?\d{10,15})$/.test(input);
    return isEmail || isPhone;
}

async function handleAdminAccountSettingsSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const saveBtn = document.getElementById('adminAccountSaveBtn');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';

    const currentPassword = String(form.querySelector('#adminCurrentPassword')?.value || '');
    const newUsername = String(form.querySelector('#adminNewUsername')?.value || '').trim();
    const newPassword = String(form.querySelector('#adminNewPassword')?.value || '');
    const confirmPassword = String(form.querySelector('#adminConfirmPassword')?.value || '');

    if (!currentPassword || !newUsername) {
        showNotification('Current password and new username are required.', 'warning');
        return;
    }

    if (newUsername.length < 3) {
        showNotification('Username must be at least 3 characters.', 'warning');
        return;
    }

    if (newPassword || confirmPassword) {
        if (newPassword.length < 6) {
            showNotification('New password must be at least 6 characters.', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('New password and confirmation do not match.', 'warning');
            return;
        }
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const response = await fetch('api/auth.php?action=change_admin_credentials', {
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
            showNotification(result.message || 'Account settings updated successfully.', 'success');
            const welcomeName = document.querySelector('.admin-welcome strong');
            if (welcomeName) {
                welcomeName.textContent = result.username || newUsername;
            }

            if (typeof openAccountUpdateModal === 'function') {
                openAccountUpdateModal(Boolean(newPassword));
            }

            const currentPasswordInput = form.querySelector('#adminCurrentPassword');
            const newPasswordInput = form.querySelector('#adminNewPassword');
            const confirmPasswordInput = form.querySelector('#adminConfirmPassword');
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        } else {
            showNotification(result.error || 'Failed to update account settings.', 'error');
        }
    } catch (error) {
        showNotification('Error updating account settings.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
        }
    }
}

// Update the handleAddRestaurant function
async function handleAddRestaurant(e) {
    e.preventDefault();
    
    // Serialize full menu data into hidden input before creating FormData
    const fullMenuHidden = document.getElementById('fullMenuData');
    if (fullMenuHidden) fullMenuHidden.value = collectFullMenuData('fullMenuItemsList');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    let formData = new FormData(e.target);

    const ownerLogin = String(formData.get('owner_login') || '').trim();
    const ownerPassword = String(formData.get('owner_password') || '');
    const ownerPasswordConfirm = String(formData.get('owner_password_confirm') || '');

    if (!ownerLogin || !ownerPassword || !ownerPasswordConfirm) {
        showAddRestaurantStep(2);
        showNotification('Please complete owner account (email/phone, password, and confirm password).', 'warning');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    if (ownerPassword !== ownerPasswordConfirm) {
        showAddRestaurantStep(2);
        showNotification('Password and confirm password do not match.', 'warning');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    if (!isValidOwnerLoginCredential(ownerLogin)) {
        showAddRestaurantStep(2);
        showNotification('Owner login must be a valid email or phone number.', 'warning');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    if (ownerPassword.length < 6) {
        showAddRestaurantStep(2);
        showNotification('Owner password must be at least 6 characters.', 'warning');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    formData.set('owner_login', ownerLogin);

    // Add address from map address bar
    const mapAddressBar = document.getElementById('mapAddressBar');
    if (mapAddressBar) {
        formData.set('address', mapAddressBar.value);
    }
    
    // Collect and set structured hours data
    formData.set('hours', collectHoursData(''));

    // Add restaurant images to form data
    if (window.getImageFormData) {
        formData = window.getImageFormData(formData);
    }
    // Add menu images to form data
    if (window.getMenuImageFormData_restaurantMenuImages) {
        formData = window.getMenuImageFormData_restaurantMenuImages(formData);
    }
    // Append logo if provided
    formData = appendLogoToFormData(formData, '');
    
    // Explicitly add facilities data to ensure it's captured
    // (FormData should auto-capture but we ensure it here)
    const seatingCapacity = document.getElementById('seatingCapacity');
    if (seatingCapacity && seatingCapacity.value) {
        formData.set('seating_capacity', seatingCapacity.value);
    }
    
    // Add radio button values
    const reservationRadio = document.querySelector('input[name="reservation_needed"]:checked');
    if (reservationRadio) formData.set('reservation_needed', reservationRadio.value);
    
    const parkingRadio = document.querySelector('input[name="parking_availability"]:checked');
    if (parkingRadio) formData.set('parking_availability', parkingRadio.value);
    
    const wifiRadio = document.querySelector('input[name="wifi_availability"]:checked');
    if (wifiRadio) formData.set('wifi_availability', wifiRadio.value);
    
    // Add pricing fields
        const priceRange = document.getElementById('editPriceRange');
        if (priceRange) {
            const normalizedPriceRange = priceRange.value ? priceRange.value.trim() : '';
            if (normalizedPriceRange) {
                formData.set('price_range', normalizedPriceRange);
            } else {
                formData.set('price_range', '');
            }
        }
    
    // Collect full menu data
    formData.set('full_menu', collectFullMenuData('fullMenuItemsList'));

    // Validate location
    if (!formData.get('latitude') || !formData.get('longitude')) {
        showNotification('Please set the restaurant location first', 'warning');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        const response = await fetch('api/admin_restaurants.php?action=add', {
            method: 'POST',
            body: formData
        });

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            showNotification('Error adding restaurant: Invalid response from server', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        if (result && result.success) {
            showNotification('Restaurant added successfully!', 'success');
            e.target.reset();
            
            // Clear images
            if (window.editModalState) {
                window.editModalState.existingImages = [];
                window.editModalState.newImageFiles = [];
            }
            const previewContainer = document.getElementById('imagePreviewContainer');
            if (previewContainer) previewContainer.innerHTML = '';
            
            if (marker) {
                adminMap.removeLayer(marker);
                marker = null;
            }
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            
            // Clear location inputs
            const mapAddressBar = document.getElementById('mapAddressBar');
            if (mapAddressBar) mapAddressBar.value = '';
            updateAddressStatus('Click on the map to set the restaurant location.', 'info');
            updateUseMapPinButton();
            
            // Refresh data
            loadRestaurantsForAdmin();
            loadStatistics();
        } else {
            const errorMsg = (result && result.error) ? String(result.error) : 'Unknown error';
            showNotification('Error adding restaurant: ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMsg = (error && error.message) ? String(error.message) : 'Unknown error';
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Update the handleEditRestaurant function
async function handleEditRestaurant(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
    const formData = new FormData();
        const restaurantId = document.getElementById('editRestaurantId').value;
        
        // Get the current modal state
        const modalState = window.editModalState || {};
        
        // Add all form fields to FormData
        formData.append('id', restaurantId);
        formData.append('name', document.getElementById('editRestaurantName').value);
        formData.append('description', document.getElementById('editRestaurantDescription').value);
        formData.append('address', document.getElementById('editMapAddressBar').value);
        formData.append('phone', document.getElementById('editRestaurantPhone').value);
    formData.append('email', document.getElementById('editRestaurantEmail') ? document.getElementById('editRestaurantEmail').value : '');
    formData.append('facebook_name', document.getElementById('editRestaurantFacebookName') ? document.getElementById('editRestaurantFacebookName').value : '');
    formData.append('facebook_page', document.getElementById('editRestaurantFacebook') ? document.getElementById('editRestaurantFacebook').value : '');
        formData.append('hours', collectHoursData('edit'));
        formData.append('menu_items', document.getElementById('editRestaurantMenu').value);
        formData.append('full_menu', collectFullMenuData('editFullMenuItemsList'));
        formData.append('latitude', document.getElementById('editLatitude').value);
        formData.append('longitude', document.getElementById('editLongitude').value);
    // Include category in edit submission
    formData.append('category', document.getElementById('editRestaurantCategory') ? document.getElementById('editRestaurantCategory').value : '');
        
        // Add facilities and services fields
        formData.append('seating_capacity', document.getElementById('editSeatingCapacity') ? document.getElementById('editSeatingCapacity').value : '');
        
        // Get the edit modal to scope selectors properly
        const editModal = document.getElementById('editRestaurantModal');
        
        // Reservation needed (scoped to edit modal)
        const reservationRadio = editModal.querySelector('input[name="reservation_needed"]:checked');
        if (reservationRadio) formData.append('reservation_needed', reservationRadio.value);
        
        // Parking availability (scoped to edit modal)
        const parkingRadio = editModal.querySelector('input[name="parking_availability"]:checked');
        if (parkingRadio) formData.append('parking_availability', parkingRadio.value);
        
        // Wi-Fi availability (scoped to edit modal)
        const wifiRadio = editModal.querySelector('input[name="wifi_availability"]:checked');
        if (wifiRadio) formData.append('wifi_availability', wifiRadio.value);
        
        // Delivery options (checkboxes, scoped to edit modal)
        const deliveryCheckboxes = editModal.querySelectorAll('input[name="delivery_options[]"]:checked');
        deliveryCheckboxes.forEach(checkbox => {
            formData.append('delivery_options[]', checkbox.value);
        });
        
        // Accessibility (checkboxes, scoped to edit modal)
        const accessibilityCheckboxes = editModal.querySelectorAll('input[name="accessibility[]"]:checked');
        accessibilityCheckboxes.forEach(checkbox => {
            formData.append('accessibility[]', checkbox.value);
        });
        
        // Add pricing and payment fields - MUST use editModal scope to avoid getting add form field!
        const priceRangeInput = editModal.querySelector('#editPriceRange');
        console.log('editPriceRange element (scoped):', priceRangeInput);
        console.log('editPriceRange value RAW:', priceRangeInput ? priceRangeInput.value : 'ELEMENT NOT FOUND');
        
        const priceRangeValue = priceRangeInput && priceRangeInput.value ? priceRangeInput.value.trim() : '';
        formData.set('price_range', priceRangeValue);
        console.log('Final price_range being sent:', priceRangeValue);
        
        // Payment methods (checkboxes, scoped to edit modal)
        const paymentCheckboxes = editModal.querySelectorAll('input[name="payment_methods[]"]:checked');
        const paymentMethods = [];
        paymentCheckboxes.forEach(checkbox => {
            formData.append('payment_methods[]', checkbox.value);
            paymentMethods.push(checkbox.value);
        });
        console.log('Adding payment_methods to FormData:', paymentMethods);
        
        // Add images to form data based on modal state so existing images are preserved
        const originalImages = modalState.originalImages || [];
        const removedPaths = modalState.removedOriginalPaths || [];
        const remainingOriginals = originalImages.filter(p => !removedPaths.includes(p));
        if (Array.isArray(remainingOriginals) && remainingOriginals.length > 0) {
            remainingOriginals.forEach(p => formData.append('existing_images[]', p));
        }
        const newFiles = modalState.newImageFiles || [];
        if (Array.isArray(newFiles) && newFiles.length > 0) {
            newFiles.forEach(f => formData.append('images[]', f));
        }

        // Append logo if provided (edit form)
        appendLogoToFormData(formData, 'edit');

        // Append menu image if provided in edit form (legacy single image - kept for backward compatibility)
        const editMenuEl = document.getElementById('editRestaurantMenuImage');
        if (editMenuEl && editMenuEl.files && editMenuEl.files[0]) {
            formData.append('menu_image', editMenuEl.files[0]);
        }

        // Append menu images (new multi-image support)
        // Add existing menu images that weren't removed
        if (modalState.existingMenuImages && Array.isArray(modalState.existingMenuImages)) {
            console.log('Appending existing menu images:', modalState.existingMenuImages);
            modalState.existingMenuImages.forEach(p => formData.append('existing_menu_images[]', p));
        }
        // Add new menu image files
        if (modalState.newMenuImageFiles && Array.isArray(modalState.newMenuImageFiles)) {
            console.log('Appending new menu image files:', modalState.newMenuImageFiles.length, 'files');
            modalState.newMenuImageFiles.forEach(f => {
                console.log('Appending file:', f.name, f.size);
                formData.append('menu_images[]', f);
            });
        }

        // Debug: show what will be sent for images/logo
        try {
            console.log('Edit submit payload:', {
                remainingOriginals: remainingOriginals,
                newFilesCount: Array.isArray(newFiles) ? newFiles.length : 0,
                existingMenuImages: modalState.existingMenuImages || [],
                newMenuImageFiles: modalState.newMenuImageFiles ? modalState.newMenuImageFiles.length : 0,
                modalStateFullDump: modalState,
                logoSelected: (document.getElementById('editRestaurantLogo') && document.getElementById('editRestaurantLogo').files && document.getElementById('editRestaurantLogo').files.length > 0) || false
            });
        } catch (e) {
            // swallow console errors in older browsers
        }
        
        const response = await fetch('api/admin_restaurants.php?action=edit', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Restaurant updated successfully!', 'success');
            closeEditModalAndRefresh();
        } else {
            showNotification('Error updating restaurant: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating restaurant: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Duplicate openEditRestaurantModal removed - function is defined earlier in the file.

// ============================================================================
// ALL RESTAURANTS MAP FUNCTIONALITY
// ============================================================================

// Category colors for map pins
const mapCategoryColors = {
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

function normalizeMediaPath(path) {
    if (!path) return '';
    const str = String(path).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '';
    if (/^(https?:)?\/\//i.test(str) || str.startsWith('data:') || str.startsWith('blob:')) return str;
    // Keep relative paths relative to current page (important when app runs in a subfolder)
    if (str.startsWith('/')) return str; // already root-relative
    // Strip leading ../ or ./ so we stay within the app folder
    let cleaned = str.replace(/^\.\/?/, '');
    while (cleaned.startsWith('../')) {
        cleaned = cleaned.slice(3);
    }
    return cleaned;
}

function pickRestaurantThumb(restaurant) {
    const candidates = [restaurant.logo, restaurant.image_path];
    if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length) {
        candidates.push(restaurant.image_paths[0]);
    }
    for (const candidate of candidates) {
        const normalized = normalizeMediaPath(candidate);
        if (normalized) return normalized;
    }
    return '';
}

function renderCutleryMarkup(pinColor, category) {
    const iconClass = getCategoryIconClass(category);
    return `<span class="cutlery"><i class="fas ${iconClass}" aria-hidden="true" style="color:${pinColor};"></i></span>`;
}

function swapMarkerLogoWithCutlery(imgEl, pinColor, category) {
    if (!imgEl || !imgEl.parentElement) return;
    const fallbackWrapper = document.createElement('span');
    fallbackWrapper.innerHTML = renderCutleryMarkup(pinColor, category);
    const fallbackEl = fallbackWrapper.firstChild;
    imgEl.replaceWith(fallbackEl);
}

// Global hook so inline onerror can call it immediately (avoids race if listener adds late)
window.__fcSwapMarkerLogo = function(imgEl) {
    if (!imgEl) return;
    const color = imgEl.dataset.pinColor || '#E85634';
    const category = imgEl.dataset.category || '';
    swapMarkerLogoWithCutlery(imgEl, color, category);
};

// Initialize the all-restaurants map
function initializeAllRestaurantsMap() {
    const mapEl = document.getElementById('allRestaurantsMap');
    if (!mapEl || allRestaurantsMap) return; // Already initialized or element not found
    
    const estanciaCenter = [11.456453464374693, 123.15114185203521];
    
    allRestaurantsMap = createAdminMapboxMap('allRestaurantsMap', estanciaCenter, 14);
    if (!allRestaurantsMap) return;

    // Show Estancia boundary
    allRestaurantsMap.on('style.load', () => addEstanciaBoundaryToMap(allRestaurantsMap));
    if (allRestaurantsMap.isStyleLoaded && allRestaurantsMap.isStyleLoaded()) addEstanciaBoundaryToMap(allRestaurantsMap);
    
    // Load restaurants
    loadAllRestaurantsOnMap();
    
    // Setup filter and refresh controls
    setupAllRestaurantsMapControls();
}

// Dashboard map (compact) under Quick Actions
function initializeDashboardMap() {
    const mapEl = document.getElementById('dashboardMap');
    if (!mapEl || dashboardMap) return;

    dashboardMap = createAdminMapboxMap('dashboardMap', DASHBOARD_HOME_CENTER, DASHBOARD_HOME_ZOOM);
    if (!dashboardMap) return;

    // Add Estancia municipality boundary on map load
    dashboardMap.on('style.load', function() {
        addEstanciaBoundaryToMap(dashboardMap);
    });
    // Also try immediately if style is already loaded
    if (dashboardMap.isStyleLoaded && dashboardMap.isStyleLoaded()) {
        addEstanciaBoundaryToMap(dashboardMap);
    }

    setupDashboardMapFilterControl();
    loadDashboardMapRestaurants();
}

async function loadDashboardMapRestaurants(forceReload = false) {
    try {
        if (!forceReload && dashboardMapRestaurants.length) {
            renderDashboardMapMarkers();
            return;
        }

        const response = await fetch('api/admin_restaurants.php?action=getAll');
        if (!response.ok) throw new Error('Failed to fetch restaurants');

        let restaurants = await response.json();
        if (!Array.isArray(restaurants)) restaurants = [];

        dashboardMapRestaurants = restaurants;
        populateDashboardMapCategories(restaurants);
        renderDashboardMapMarkers();
    } catch (error) {
        console.error('Error loading dashboard map restaurants:', error);
    }
}

function renderDashboardMapMarkers() {
    clearDashboardMarkers();
    if (!dashboardMap) return;

    const normalizedFilter = normalizeCategory(dashboardMapCategoryFilter);
    const filtered = dashboardMapRestaurants.filter(r => {
        if (!normalizedFilter) return true;
        return normalizeCategory(r.category) === normalizedFilter;
    });

    filtered.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
            addDashboardRestaurantMarker(restaurant);
        }
    });

    if (dashboardMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        dashboardMarkers.forEach(m => {
            const ll = m.getLngLat ? m.getLngLat() : null;
            if (ll) bounds.extend(ll);
        });
        if (!bounds.isEmpty()) {
            dashboardMap.fitBounds(bounds, { padding: 30, maxZoom: 15 });
            const enforceZoomFloor = () => {
                try {
                    if (dashboardMap.getZoom && dashboardMap.getZoom() < 12) {
                        dashboardMap.setZoom(12);
                    }
                } catch (e) { /* ignore */ }
            };
            if (dashboardMap.once) {
                dashboardMap.once('moveend', enforceZoomFloor);
            } else {
                setTimeout(enforceZoomFloor, 200);
            }
        }
    }
}

function populateDashboardMapCategories(restaurants = []) {
    const select = document.getElementById('dashboardMapCategory');
    if (!select) return;

    const currentValue = select.value;
    const uniqueCategories = Array.from(new Set(
        restaurants
            .map(r => r.category || '')
            .filter(cat => (cat || '').trim().length > 0)
    )).sort((a, b) => a.localeCompare(b));

    const fragment = document.createDocumentFragment();
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All categories';
    fragment.appendChild(allOption);

    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        fragment.appendChild(opt);
    });

    select.innerHTML = '';
    select.appendChild(fragment);

    // Restore selection if still valid
    const normalizedCurrent = normalizeCategory(currentValue);
    if (normalizedCurrent && uniqueCategories.some(cat => normalizeCategory(cat) === normalizedCurrent)) {
        select.value = currentValue;
        dashboardMapCategoryFilter = currentValue;
    } else {
        select.value = '';
        dashboardMapCategoryFilter = '';
    }
}

function setupDashboardMapFilterControl() {
    const select = document.getElementById('dashboardMapCategory');
    const homeBtn = document.getElementById('dashboardMapHomeBtn');
    if (select && !select.dataset.listenerAdded) {
        select.addEventListener('change', () => {
            dashboardMapCategoryFilter = select.value;
            renderDashboardMapMarkers();
        });
        select.dataset.listenerAdded = 'true';
    }

    if (homeBtn && !homeBtn.dataset.listenerAdded) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!dashboardMap) return;
            try { dashboardMap.closePopup(); } catch (err) { /* ignore */ }
            if (dashboardMarkers && dashboardMarkers.length === 0) {
                // ensure markers are loaded before fitting
                loadDashboardMapRestaurants(true);
            }
            if (dashboardMap.flyTo) {
                dashboardMap.flyTo({
                    center: [DASHBOARD_HOME_CENTER[1], DASHBOARD_HOME_CENTER[0]],
                    zoom: DASHBOARD_HOME_ZOOM,
                    duration: 2000,
                    pitch: 0,
                    bearing: 0,
                    essential: true
                });
            } else if (dashboardMap.easeTo) {
                dashboardMap.easeTo({ center: [DASHBOARD_HOME_CENTER[1], DASHBOARD_HOME_CENTER[0]], zoom: DASHBOARD_HOME_ZOOM, duration: 2000, pitch: 0, bearing: 0 });
            } else {
                dashboardMap.setView([DASHBOARD_HOME_CENTER[0], DASHBOARD_HOME_CENTER[1]], DASHBOARD_HOME_ZOOM);
            }
        });
        homeBtn.dataset.listenerAdded = 'true';
    }
}

function addDashboardRestaurantMarker(restaurant) {
    if (!dashboardMap) return;

    const lat = parseFloat(restaurant.latitude);
    const lng = parseFloat(restaurant.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!isWithinEstancia(lat, lng)) return;

    const category = restaurant.category || '';
    const pinColor = mapCategoryColors[category] || '#E85634';
    const thumb = pickRestaurantThumb(restaurant);
    const innerMarkup = thumb
        ? `<img src="${thumb}" alt="${restaurant.name || 'Restaurant'}" class="marker-logo" data-pin-color="${pinColor}" data-category="${category}" loading="lazy" onerror="window.__fcSwapMarkerLogo && window.__fcSwapMarkerLogo(this)">`
        : renderCutleryMarkup(pinColor, category);

    const iconHtml = `
        <div class="marker-pin marker-icon-sm" style="background:${pinColor}; box-shadow:0 3px 12px rgba(0,0,0,0.25); border:2px solid #fff;">
            <div class="marker-plate">
                <span class="plate-rim"></span>
                <span class="plate-inner"></span>
                ${innerMarkup}
            </div>
        </div>`;

    const wrappedHtml = `<div class="restaurant-pin">${iconHtml}</div>`;
    const marker = createAdminMarker(dashboardMap, lat, lng, wrappedHtml, { anchor: 'bottom' });
    marker.restaurantId = restaurant.id;

    const markerEl = marker.getElement && marker.getElement();
    if (markerEl) {
        markerEl.style.cursor = 'pointer';
        markerEl.style.pointerEvents = 'auto';
        const logoEl = markerEl.querySelector('.marker-logo');
        if (logoEl) {
            const color = logoEl.dataset.pinColor || pinColor;
            logoEl.addEventListener('error', () => swapMarkerLogoWithCutlery(logoEl, color), { once: true });
        }
    }

    const popupContent = `
        <div class="map-popup">
            <div class="popup-body">
                <div class="popup-title-row">
                    <h4>${escapeHtml(restaurant.name)}</h4>
                    ${category ? `<span class="popup-pill" style="background:${pinColor}1a; color:${pinColor};">${escapeHtml(category)}</span>` : ''}
                </div>
                <div class="popup-actions">
                    <button onclick="openEditRestaurantModal(${restaurant.id})" class="btn-primary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <a href="index.php?view=${restaurant.id}" target="_blank" class="btn-secondary">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                    <button onclick="confirmDeleteRestaurant(${restaurant.id}, '${escapeHtml(restaurant.name || 'this restaurant')}')" class="btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    const popup = new mapboxgl.Popup({ closeButton: true, offset: 40, maxWidth: '260px', anchor: 'bottom' })
        .setHTML(popupContent);
    popup.on('open', () => { dashboardMap.__activePopup = popup; });
    popup.on('close', () => {
        if (dashboardMap.__activePopup === popup) dashboardMap.__activePopup = null;
    });
    marker.setPopup(popup);

    if (markerEl) {
        markerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (marker.getPopup) marker.togglePopup();
        });
        markerEl.addEventListener('touchend', (e) => {
            e.stopPropagation();
            if (marker.getPopup) marker.togglePopup();
        });
    }

    dashboardMarkers.push(marker);
}

function clearDashboardMarkers() {
    dashboardMarkers.forEach(marker => {
        try { marker.remove(); } catch (e) {}
    });
    dashboardMarkers = [];
}

// Load all restaurants and display on map
async function loadAllRestaurantsOnMap(categoryFilter = '') {
    try {
        const response = await fetch('api/admin_restaurants.php?action=getAll');
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        
        let restaurants = await response.json();
        
        if (!Array.isArray(restaurants)) {
            restaurants = [];
        }
        
        // Filter by category if specified
        if (categoryFilter) {
            restaurants = restaurants.filter(r => r.category === categoryFilter);
        }
        
        // Clear existing markers
        clearAllRestaurantsMarkers();
        
        // Add markers for each restaurant
        restaurants.forEach(restaurant => {
            if (restaurant.latitude && restaurant.longitude) {
                addRestaurantMarkerToMap(restaurant);
            }
        });
        
        // Update count
        const countEl = document.getElementById('mapRestaurantCount');
        if (countEl) {
            const countNumberEl = countEl.querySelector('.count-number');
            if (countNumberEl) {
                countNumberEl.textContent = restaurants.length;
                // Update the text node after the count
                const textNode = countNumberEl.nextSibling;
                if (textNode) {
                    textNode.textContent = ` restaurant${restaurants.length !== 1 ? 's' : ''}`;
                }
            } else {
                // Fallback for old HTML structure
                countEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span class="count-number">${restaurants.length}</span> restaurant${restaurants.length !== 1 ? 's' : ''}`;
            }
        }
        
        // Fit bounds if there are markers
        if (allRestaurantsMarkers.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            allRestaurantsMarkers.forEach(m => {
                const ll = m.getLngLat ? m.getLngLat() : null;
                if (ll) bounds.extend(ll);
            });
            if (!bounds.isEmpty()) {
                allRestaurantsMap.fitBounds(bounds, { padding: 40, maxZoom: 16 });
            }
        }
        
    } catch (error) {
        console.error('Error loading restaurants for map:', error);
        showNotification('Error loading restaurant locations', 'error');
    }
}

// Add a single restaurant marker to the map
function addRestaurantMarkerToMap(restaurant) {
    const lat = parseFloat(restaurant.latitude);
    const lng = parseFloat(restaurant.longitude);
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    
    const category = restaurant.category || '';
    const pinColor = mapCategoryColors[category] || '#E85634';
    const thumb = pickRestaurantThumb(restaurant);
    const innerMarkup = thumb
        ? `<img src="${thumb}" alt="${restaurant.name || 'Restaurant'}" class="marker-logo" data-pin-color="${pinColor}" data-category="${category}" loading="lazy" onerror="window.__fcSwapMarkerLogo && window.__fcSwapMarkerLogo(this)">`
        : renderCutleryMarkup(pinColor, category);

    // Create custom icon with better styling and logo fallback
    const iconHtml = `
        <div class="marker-pin marker-icon-sm" style="background:${pinColor}; box-shadow:0 3px 12px rgba(0,0,0,0.25); border:2px solid #fff;">
            <div class="marker-plate">
                <span class="plate-rim"></span>
                <span class="plate-inner"></span>
                ${innerMarkup}
            </div>
        </div>`;
    
    const wrappedHtml = `<div class="restaurant-pin">${iconHtml}</div>`;
    const marker = createAdminMarker(allRestaurantsMap, lat, lng, wrappedHtml, { anchor: 'bottom' });
    marker.restaurantId = restaurant.id;

    const markerEl = marker.getElement && marker.getElement();
    if (markerEl) {
        const logoEl = markerEl.querySelector('.marker-logo');
        if (logoEl) {
            const color = logoEl.dataset.pinColor || pinColor;
            logoEl.addEventListener('error', () => swapMarkerLogoWithCutlery(logoEl, color), { once: true });
        }
    }
    
    // Create enhanced popup content
    const popupContent = `
        <div class="map-popup">
            <div class="popup-body">
                <div class="popup-title-row">
                    <h4>${escapeHtml(restaurant.name)}</h4>
                    ${category ? `<span class="popup-pill" style="background:${pinColor}1a; color:${pinColor};">${escapeHtml(category)}</span>` : ''}
                </div>
                <div class="popup-actions">
                    <button onclick="openEditRestaurantModal(${restaurant.id})" class="btn-primary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <a href="index.php?view=${restaurant.id}" target="_blank" class="btn-secondary">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                    <button onclick="confirmDeleteRestaurant(${restaurant.id}, '${escapeHtml(restaurant.name || 'this restaurant')}')" class="btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const popup = new mapboxgl.Popup({ closeButton: true, offset: 40, maxWidth: '260px', anchor: 'bottom' })
        .setHTML(popupContent);
    popup.on('open', () => { allRestaurantsMap.__activePopup = popup; });
    popup.on('close', () => {
        if (allRestaurantsMap.__activePopup === popup) allRestaurantsMap.__activePopup = null;
    });
    marker.setPopup(popup);

    const markerElement = marker.getElement && marker.getElement();
    if (markerElement) {
        markerElement.style.cursor = 'pointer';
        markerElement.style.pointerEvents = 'auto';
        markerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (marker.getPopup) {
                marker.togglePopup();
            }
        });
        markerElement.addEventListener('touchend', (e) => {
            e.stopPropagation();
            if (marker.getPopup) {
                marker.togglePopup();
            }
        });
    }
    
    allRestaurantsMarkers.push(marker);
}

// Remove a single restaurant marker from the admin map immediately after delete
function removeRestaurantMarkerFromAdminMap(restaurantId) {
    if (!allRestaurantsMap || !Array.isArray(allRestaurantsMarkers)) return;

    const idx = allRestaurantsMarkers.findIndex(m => Number(m.restaurantId) === Number(restaurantId));
    if (idx === -1) return;

    const marker = allRestaurantsMarkers[idx];
    try { marker.remove(); } catch (e) {}
    allRestaurantsMarkers.splice(idx, 1);

    // Update count badge to reflect removal without waiting for reload
    const countEl = document.getElementById('mapRestaurantCount');
    if (countEl) {
        const countNumberEl = countEl.querySelector('.count-number');
        const newCount = allRestaurantsMarkers.length;
        if (countNumberEl) {
            countNumberEl.textContent = newCount;
            const textNode = countNumberEl.nextSibling;
            if (textNode) textNode.textContent = ` restaurant${newCount !== 1 ? 's' : ''}`;
        }
    }
}

// Remove a restaurant from the dashboard map immediately after delete
function removeRestaurantFromDashboardMap(restaurantId) {
    if (!Array.isArray(dashboardMapRestaurants)) return;
    const idNum = Number(restaurantId);
    const next = dashboardMapRestaurants.filter(r => Number(r.id) !== idNum);
    if (next.length === dashboardMapRestaurants.length) return;
    dashboardMapRestaurants = next;
    populateDashboardMapCategories(dashboardMapRestaurants);
    renderDashboardMapMarkers();
}

// Note: 'Fit All' control removed from UI. Initial auto-fitting remains where appropriate.

// Clear all markers from the map
function clearAllRestaurantsMarkers() {
    allRestaurantsMarkers.forEach(marker => {
        try { marker.remove(); } catch (e) {}
    });
    allRestaurantsMarkers = [];
}

// Open the restaurant modal directly from the popup (view action)
function viewRestaurantModal(restaurantId) {
    try {
        if (allRestaurantsMap) {
            allRestaurantsMap.closePopup();
        }
    } catch (e) {}
    openEditRestaurantModal(restaurantId);
}

// ===== Full Menu Item Builder Functions =====
function addFullMenuItem(listId, categoryInputId, nameInputId, priceInputId) {
    const categoryInput = document.getElementById(categoryInputId);
    const nameInput = document.getElementById(nameInputId);
    const priceInput = document.getElementById(priceInputId);
    const category = categoryInput.value.trim();
    const name = nameInput.value.trim();
    const price = priceInput.value.trim();
    if (!name) { showNotification('Please enter an item name', 'warning'); return; }
    if (!category) { showNotification('Please select a category', 'warning'); return; }
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

// Setup map controls (filter, refresh)
function setupAllRestaurantsMapControls() {
    const categoryFilter = document.getElementById('mapCategoryFilter');
    const refreshBtn = document.getElementById('refreshMapBtn');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            loadAllRestaurantsOnMap(this.value);
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const categoryFilter = document.getElementById('mapCategoryFilter');
            const filterValue = categoryFilter ? categoryFilter.value : '';
            loadAllRestaurantsOnMap(filterValue);
            showNotification('Map refreshed', 'success');
        });
    }
    
    // 'Fit All' button removed; no event binding required.
}

// Initialize the map when the tab is shown (to ensure proper sizing)
function initializeMapOnTabShow() {
    if (allRestaurantsMap) {
        setTimeout(() => {
            allRestaurantsMap.invalidateSize();
        }, 100);
    } else {
        initializeAllRestaurantsMap();
    }
}

// Process legacy star markup that uses an icon + numeric text (e.g. "4.3 <i class='fas fa-star'>")
function processLegacyStarElements(){
    const icons = document.querySelectorAll('i.fas.fa-star, i.far.fa-star, i.fas.fa-star-half-alt');
    icons.forEach(icon => {
        let el = icon.parentElement;
        // walk up to find a suitable container that includes a numeric rating
        let container = null;
        let depth = 0;
        while (el && el !== document.body && depth < 4) {
            const txt = (el.textContent || '').trim();
            if (/\d+(\.\d+)?/.test(txt)) { container = el; break; }
            el = el.parentElement; depth++;
        }
        if (!container) return;
        if (container.dataset && container.dataset.fractional === '1') return;

        // try to extract numeric rating
        let match = (container.textContent || '').match(/\d+(\.\d+)?/);
        if (!match) return;
        const rating = Math.max(0, Math.min(5, parseFloat(match[0])));

        // build star display
        const display = document.createElement('span');
        display.className = 'star-rating-display';

        const outer = document.createElement('span'); outer.className = 'stars-outer';
        const inner = document.createElement('span'); inner.className = 'stars-inner';
        for (let i=0;i<5;i++){ const o = document.createElement('i'); o.className = 'far fa-star'; outer.appendChild(o); }
        for (let i=0;i<5;i++){ const o = document.createElement('i'); o.className = 'fas fa-star'; inner.appendChild(o); }
        outer.appendChild(inner);

        const val = document.createElement('span'); val.className = 'rating-value'; val.textContent = rating.toFixed(1);

        display.appendChild(outer);
        display.appendChild(val);

        // replace container content
        container.innerHTML = '';
        container.appendChild(display);
        inner.style.width = ((rating/5)*100) + '%';
        container.dataset.fractional = '1';
    });
}

// Run on initial load for legacy markup
document.addEventListener('DOMContentLoaded', () => {
    try { processLegacyStarElements(); } catch (e) { console.warn('legacy star processing failed', e); }
});

// ============================================================================
// DELETE RESTAURANT FUNCTIONALITY
// ============================================================================

function confirmDeleteRestaurant(restaurantId, restaurantName) {
    // Create modal for confirmation
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
        <div class="delete-confirmation-content">
            <div class="delete-confirmation-header">
                <i class="fas fa-exclamation-triangle" style="color: #f44336; font-size: 2em; margin-right: 12px;"></i>
                <h2>Delete Restaurant</h2>
            </div>
            <div class="delete-confirmation-body">
                <p>Are you sure you want to delete <strong>${restaurantName}</strong>?</p>
                <p style="color: #999; font-size: 0.9em; margin-top: 12px;">This action cannot be undone. All associated data will be permanently removed.</p>
            </div>
            <div class="delete-confirmation-actions">
                <button class="btn-cancel" onclick="closeDeleteConfirmation()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-delete-confirm" onclick="performDeleteRestaurant(${restaurantId})">
                    <i class="fas fa-trash-alt"></i> Yes, Delete
                </button>
            </div>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('delete-confirmation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'delete-confirmation-styles';
        styles.textContent = `
            .delete-confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.2s ease-out;
            }
            
            .delete-confirmation-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                max-width: 420px;
                width: 90%;
                padding: 24px;
                animation: slideUp 0.3s ease-out;
            }
            
            .delete-confirmation-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .delete-confirmation-header h2 {
                margin: 0;
                color: #333;
                font-size: 1.5em;
            }
            
            .delete-confirmation-body {
                margin: 16px 0 24px 0;
                color: #555;
                line-height: 1.6;
            }
            
            .delete-confirmation-body p {
                margin: 8px 0;
            }
            
            .delete-confirmation-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .btn-cancel {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background: #e0e0e0;
                color: #333;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-cancel:hover {
                background: #d0d0d0;
            }
            
            .btn-cancel:active {
                transform: scale(0.98);
            }
            
            .btn-delete-confirm {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background: #f44336;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-delete-confirm:hover {
                background: #d32f2f;
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
            }
            
            .btn-delete-confirm:active {
                transform: scale(0.98);
            }
            
            .btn-delete-confirm:disabled {
                background: #bdbdbd;
                cursor: not-allowed;
                opacity: 0.6;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add modal to page and handle escape key
    modal.id = 'deleteConfirmationModal';
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeDeleteConfirmation();
        }
    });
    
    document.addEventListener('keydown', handleDeleteConfirmationEscape);
}

function handleDeleteConfirmationEscape(event) {
    if (event.key === 'Escape') {
        closeDeleteConfirmation();
    }
}

function closeDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.style.animation = 'slideUp 0.2s ease-out reverse';
        setTimeout(() => {
            modal.remove();
            document.removeEventListener('keydown', handleDeleteConfirmationEscape);
        }, 200);
    }
}

async function performDeleteRestaurant(restaurantId) {
    const deleteBtn = document.querySelector('.btn-delete-confirm');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    }
    
    try {
        const response = await fetch(`api/admin_restaurants.php?action=delete&id=${restaurantId}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            closeDeleteConfirmation();
            showNotification(`Restaurant deleted successfully`, 'success');
            
            // Remove card from DOM
            const card = document.querySelector(`.restaurant-card[data-id="${restaurantId}"]`);
            if (card) {
                card.style.animation = 'slideUp 0.2s ease-out reverse';
                setTimeout(() => {
                    card.remove();
                    removeRestaurantMarkerFromAdminMap(restaurantId);
                    removeRestaurantFromDashboardMap(restaurantId);
                    // Refresh the list
                    loadRestaurantsForAdmin();
                }, 200);
            } else {
                removeRestaurantMarkerFromAdminMap(restaurantId);
                removeRestaurantFromDashboardMap(restaurantId);
                loadRestaurantsForAdmin();
            }
        } else {
            throw new Error(data.error || 'Failed to delete restaurant');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(`Error: ${error.message}`, 'error');
        
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Yes, Delete';
        }
    }
}

// Logout confirmation modal functions
function showLogoutConfirmation(e) {
    e.preventDefault();
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function confirmLogout() {
    window.location.href = 'admin.php?logout=1';
}

function openAccountUpdateModal(passwordChanged = false) {
    const modal = document.getElementById('accountUpdateModal');
    if (!modal) return;

    const messageEl = document.getElementById('accountUpdateModalMessage');
    if (messageEl) {
        messageEl.textContent = passwordChanged
            ? 'Your username/password changes were applied. For security, you can re-login now, or keep this current session active.'
            : 'Your account changes were applied successfully. Do you want to stay logged in or re-login now?';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAccountUpdateModal() {
    const modal = document.getElementById('accountUpdateModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function reloginAfterAccountUpdate() {
    window.location.href = 'admin.php?logout=1';
}

// Initialize logout button on page load
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('a[href*="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', showLogoutConfirmation);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeLogoutModal();
            }
        });
    }

    const accountModal = document.getElementById('accountUpdateModal');
    if (accountModal) {
        accountModal.addEventListener('click', function(e) {
            if (e.target === accountModal) {
                closeAccountUpdateModal();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileMenuBtn = document.getElementById('adminMobileMenuBtn');
    const mobileOverlay = document.getElementById('adminSidebarOverlay');

    const resizeAdminMaps = () => {
        const maps = [adminMap, editMap, allRestaurantsMap, dashboardMap];
        maps.forEach(m => {
            if (!m) return;
            try {
                if (typeof m.resize === 'function') m.resize();
                else if (typeof m.invalidateSize === 'function') m.invalidateSize();
            } catch (e) { /* ignore */ }
        });
        // Re-fit dashboard markers after layout shift so the map uses full width
        try {
            if (dashboardMap && dashboardMarkers && dashboardMarkers.length > 0) {
                renderDashboardMapMarkers();
            }
        } catch (e) { /* ignore */ }
    };

    // --- Sidebar Mode Management ---
    // Modes: 'expanded' | 'collapsed' | 'hover'
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
        // 'expanded' = no sidebar classes
        if (save) {
            try { localStorage.setItem('adminSidebarMode', mode); } catch (e) {}
        }
        // Sync active state on modal options
        document.querySelectorAll('.sidebar-ctrl-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.mode === mode);
        });
        resizeAdminMaps();
        setTimeout(resizeAdminMaps, 260);
    };

    // Init: read stored mode (body classes already set by inline script, but re-apply to sync JS state)
    try { currentMode = localStorage.getItem('adminSidebarMode') || 'hover'; } catch (e) {}
    applySidebarMode(currentMode, false);

    // Hover mode: expand sidebar on mouseenter, collapse on mouseleave
    if (sidebar) {
        sidebar.addEventListener('mouseenter', () => {
            if (currentMode !== 'hover') return;
            clearTimeout(hoverLeaveTimer);
            document.body.classList.add('admin-sidebar-hovering');
            resizeAdminMaps();
            setTimeout(resizeAdminMaps, 260);
        });
        sidebar.addEventListener('mouseleave', () => {
            if (currentMode !== 'hover') return;
            hoverLeaveTimer = setTimeout(() => {
                document.body.classList.remove('admin-sidebar-hovering');
                resizeAdminMaps();
                setTimeout(resizeAdminMaps, 350);
            }, 200);
        });
    }

    // Sidebar Control Modal
    const ctrlBtn = document.getElementById('sidebarCtrlBtn');
    const ctrlModal = document.getElementById('sidebarCtrlModal');
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

    // Mobile menu
    const isMobile = () => window.innerWidth <= 720;

    const closeMobileSidebar = () => {
        document.body.classList.remove('admin-sidebar-open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        if (mobileOverlay) mobileOverlay.style.display = 'none';
    };

    const openMobileSidebar = () => {
        document.body.classList.add('admin-sidebar-open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
        if (mobileOverlay) mobileOverlay.style.display = 'block';
    };

    const applyMobileState = () => {
        if (isMobile()) {
            document.body.classList.add('admin-sidebar-mobile');
            applySidebarMode('expanded', false);
            closeMobileSidebar();
        } else {
            document.body.classList.remove('admin-sidebar-mobile');
            // Restore stored mode when returning to desktop
            let stored = 'hover';
            try { stored = localStorage.getItem('adminSidebarMode') || 'hover'; } catch (e) {}
            applySidebarMode(stored, false);
            closeMobileSidebar();
            if (mobileOverlay) mobileOverlay.style.display = 'none';
        }
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            const open = document.body.classList.contains('admin-sidebar-open');
            if (open) { closeMobileSidebar(); } else { openMobileSidebar(); }
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
    window.addEventListener('resize', resizeAdminMaps);
});
