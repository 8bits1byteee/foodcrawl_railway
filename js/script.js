// Directions panel helpers

// iOS viewport height fix - handles the 100vh issue on iOS Safari
(function() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    function setIOSViewportHeight() {
        // Get the actual visible viewport height
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--ios-vh', `${vh * 0.01}px`);
        document.documentElement.style.setProperty('--ios-viewport-height', `${vh}px`);
    }
    
    if (isIOS) {
        // Set initial value
        setIOSViewportHeight();
        
        // Update on resize and orientation change
        window.addEventListener('resize', setIOSViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setIOSViewportHeight, 100);
        });
        
        // Use visualViewport API for more accurate updates
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setIOSViewportHeight);
            window.visualViewport.addEventListener('scroll', setIOSViewportHeight);
        }
        
        // Add iOS class to body for CSS targeting
        document.documentElement.classList.add('ios');
    }
})();

// Page transition helpers for smooth enter/exit animations
(function initPageTransitions() {
    document.documentElement.classList.add('js-enabled');

    function markReady() {
        if (!document.body) return;
        document.body.classList.add('page-ready');
        document.body.classList.remove('page-leaving');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(markReady);
        });
    } else {
        requestAnimationFrame(markReady);
    }

    window.addEventListener('pageshow', () => {
        markReady();
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || event.defaultPrevented) return;
        if (link.hasAttribute('data-no-transition')) return;
        if (link.target && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (e) {
            return;
        }

        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

        if (!document.body) return;
        event.preventDefault();
        document.body.classList.add('page-leaving');

        window.setTimeout(() => {
            window.location.href = url.href;
        }, 180);
    }, true);
})();

// Page Loading Animation - Hide after map markers are placed
let _pageLoadingHidden = false;
function hidePageLoading() {
    if (_pageLoadingHidden) return;
    _pageLoadingHidden = true;
    const pageLoading = document.getElementById('pageLoading');
    if (pageLoading) {
        pageLoading.classList.add('hidden');
    }
}

// Hard fallback: never leave the loading overlay up longer than 15 seconds
window.addEventListener('load', function() {
    setTimeout(hidePageLoading, 15000);
});

// Loading modal helpers
function showLoadingModal(message = 'Loading...') {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        const textEl = modal.querySelector('.loading-modal-text');
        if (textEl) textEl.textContent = message;
        modal.classList.add('active');
    }
}

function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

let markerLoadingTimer = null;
let markerLoadingRequests = 0;

function beginMarkerLoading(message = 'Loading pins...') {
    const modal = document.getElementById('markerLoadingModal');
    if (!modal) return;

    markerLoadingRequests += 1;
    if (markerLoadingRequests > 1) return;

    const textEl = modal.querySelector('.marker-loading-text');
    if (textEl) textEl.textContent = message;

    clearTimeout(markerLoadingTimer);
    markerLoadingTimer = setTimeout(() => {
        if (markerLoadingRequests <= 0) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }, 180);
}

function endMarkerLoading() {
    const modal = document.getElementById('markerLoadingModal');
    markerLoadingRequests = Math.max(0, markerLoadingRequests - 1);

    if (markerLoadingRequests > 0) return;

    clearTimeout(markerLoadingTimer);
    markerLoadingTimer = null;

    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Attach swipe-down-to-close behaviour to a bottom-sheet panel.
 * @param {HTMLElement} panel      - The sliding panel element
 * @param {Function}    closeFn    - Function to call when dismissed
 * @param {HTMLElement} [scrollEl] - Inner scrollable element (swipe only fires when scrolled to top)
 */
function _initSwipeToClose(panel, closeFn, scrollEl) {
    if (!panel || panel._swipeInit) return;
    panel._swipeInit = true;

    let startY = 0;
    let currentY = 0;
    let dragging = false;
    let startedOnHandle = false;

    function onTouchStart(e) {
        // Only drag from the grab handle or when the scroll container is at the top
        const handle = panel.querySelector('.sheet-grab-handle');
        startedOnHandle = handle && (handle === e.target || handle.contains(e.target));
        const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
        if (!startedOnHandle && scrollTop > 2) return;  // ignore if scrolled down

        startY = e.touches[0].clientY;
        currentY = startY;
        dragging = true;
        panel.style.setProperty('transition', 'none', 'important');
    }

    function onTouchMove(e) {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const delta = currentY - startY;
        if (delta < 0) { panel.style.removeProperty('transform'); return; } // no upward drag
        panel.style.setProperty('transform', `translateY(${delta}px)`, 'important');
        if (delta > 10) e.preventDefault(); // prevent page scroll while dragging panel
    }

    function onTouchEnd() {
        if (!dragging) return;
        dragging = false;
        const delta = currentY - startY;
        panel.style.removeProperty('transition');
        panel.style.removeProperty('transform');
        if (delta > 80) closeFn();
    }

    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', onTouchEnd, { passive: true });
}

function showDirectionsPanel() {
    const panel = document.getElementById('directionsPanel');
    const toggle = document.getElementById('directionsToggle');
    // Close search sidebar if open
    if (document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
    }
    if (panel) panel.classList.add('open');
    if (toggle) toggle.setAttribute('aria-pressed', 'true');
    document.body.classList.add('directions-open');

    // Fallback inline style to guarantee stacking order
    const sidebar = document.querySelector('.directions-sidebar');
    if (sidebar) sidebar.style.zIndex = '16000';

    _initSwipeToClose(panel, hideDirectionsPanel, panel?.querySelector('.directions-sidebar-content'));

    // Resize map so it adjusts to any layout shift
    setTimeout(() => {
        try {
            if (window.map && typeof window.map.resize === 'function') window.map.resize();
        } catch (e) { /* ignore */ }
    }, 320);
}

function hideDirectionsPanel() {
    const panel = document.getElementById('directionsPanel');
    const toggle = document.getElementById('directionsToggle');
    if (panel) panel.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-pressed', 'false');
    document.body.classList.remove('directions-open');

    // Remove inline fallback style
    const sidebar = document.querySelector('.directions-sidebar');
    if (sidebar) sidebar.style.zIndex = '';

    // Resize map back
    setTimeout(() => {
        try {
            if (window.map && typeof window.map.resize === 'function') window.map.resize();
        } catch (e) { /* ignore */ }
    }, 320);
}

function toggleDirectionsPanel() {
    const panel = document.getElementById('directionsPanel');
    if (!panel) return;
    if (panel.classList.contains('open')) {
        hideDirectionsPanel();
    } else {
        showDirectionsPanel();
    }
}

// Keep prompt dismissal temporary so reopening the sidebar can show it again.
let locationPromptDismissed = false;

// Show or hide the sidebar location permission card based on active location
function updateLocationPermissionCard(forceShow = false) {
    const permissionRequest = document.querySelector('.location-permission-request');
    if (!permissionRequest) {
        try { updateRecommendationFilterAvailability(); } catch (e) { /* ignore */ }
        return;
    }
    const hasStoredLocation = !!localStorage.getItem('userLocation');
    const hasActiveLocation = !!(window.userLocation && window.userLocation.lat && window.userLocation.lng);
    const shouldShow = forceShow ? true : !(hasStoredLocation || hasActiveLocation || locationPromptDismissed);
    permissionRequest.style.display = shouldShow ? 'block' : 'none';

    // Update recommendation filters availability based on location state
    try { updateRecommendationFilterAvailability(); } catch (e) { /* ignore */ }
    try { updateSearchResultFilterAvailability(); } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('directionsToggle');
    if (toggle && !toggle.dataset.listenerAdded) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDirectionsPanel();
        });
        toggle.dataset.listenerAdded = 'true';
    }

    // Init recommendation filter UI
    try { initRecommendationFilters(); } catch (e) { /* ignore */ }
    // Init search results filter UI
    try { initSearchResultFilters(); } catch (e) { /* ignore */ }

    const closeLocationPrompt = document.getElementById('closeLocationPrompt');
    if (closeLocationPrompt) {
        closeLocationPrompt.addEventListener('click', () => {
            locationPromptDismissed = true;
            updateLocationPermissionCard(false);
        });
    }

    // Start real-time tracking ONLY if user previously allowed location through the app
    const startRealtimeTracking = () => {
        if (!navigator.geolocation) return;
        // Only auto-track if user has explicitly allowed location before
        if (localStorage.getItem('locationPermissionAsked') !== 'allowed') return;
        locateUser({ suppressCenter: true }).catch(err => {
            console.warn('Real-time tracking start failed:', err);
        });
    };

    // Check stored consent — only auto-locate if user previously allowed
    if (localStorage.getItem('locationPermissionAsked') === 'allowed') {
        localStorage.setItem('locationTrackingEnabled', 'true');
        startRealtimeTracking();
    }

    // Check if user location already exists in localStorage - show it immediately and start real-time tracking
    const savedLocation = localStorage.getItem('userLocation');
    const trackingEnabled = localStorage.getItem('locationTrackingEnabled') === 'true';

    // If tracking is enabled but no saved location exists yet, start tracking to fetch a fresh position
    if (trackingEnabled && !savedLocation) {
        const startTracking = () => {
            locateUser({ suppressCenter: true }).then((loc) => {
                try {
                    window.userLocation = loc;
                    localStorage.setItem('userLocation', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
                    updateLocationPermissionCard(false);
                    displayUserLocationMarker(window.userLocation);
                    loadNearbyRestaurants(window.userLocation.lat, window.userLocation.lng);
                } catch (e) { /* ignore */ }
            }).catch(err => {
                console.warn('Real-time tracking failed on reload:', err);
            });
        };

        if (map && map.isStyleLoaded && map.isStyleLoaded()) {
            startTracking();
        } else if (map) {
            map.once('style.load', startTracking);
        }
    }
    if (savedLocation) {
        try {
            window.userLocation = JSON.parse(savedLocation);
            console.log('User location retrieved from storage:', window.userLocation);
            updateLocationPermissionCard(false);
            
            // Wait for map to load, then show saved marker immediately and start real-time tracking
            if (map && map.isStyleLoaded && map.isStyleLoaded()) {
                // Map already loaded, show saved location first
                displayUserLocationMarker(window.userLocation);
                loadNearbyRestaurants(window.userLocation.lat, window.userLocation.lng);
                // Start tracking in the background to update position smoothly
                locateUser({ suppressCenter: true }).catch(err => {
                    console.warn('Real-time tracking failed, using saved location:', err);
                });
            } else if (map) {
                // Map not yet loaded, wait for style to load
                map.once('style.load', () => {
                    displayUserLocationMarker(window.userLocation);
                    loadNearbyRestaurants(window.userLocation.lat, window.userLocation.lng);
                    locateUser({ suppressCenter: true }).catch(err => {
                        console.warn('Real-time tracking failed, using saved location:', err);
                    });
                });
            }
        } catch (e) {
            console.error('Error parsing saved location:', e);
        }
    } else if (window.userLocation && window.userLocation.lat && window.userLocation.lng) {
        console.log('User location already available:', window.userLocation);
        updateLocationPermissionCard(false);
        
        // Display marker and load restaurants
        if (map && map.isStyleLoaded && map.isStyleLoaded()) {
            displayUserLocationMarker(window.userLocation);
            loadNearbyRestaurants(window.userLocation.lat, window.userLocation.lng);
            // Do NOT auto-center map to user location here
        } else if (map) {
            map.once('style.load', () => {
                displayUserLocationMarker(window.userLocation);
                loadNearbyRestaurants(window.userLocation.lat, window.userLocation.lng);
                // Do NOT auto-center map to user location here
            });
        }
    } else {
        // Show the permission request card (ensure it's visible)
        updateLocationPermissionCard(true);

        // Handle location permission button
        const enableLocationBtn = document.getElementById('enableLocationBtn');
        if (enableLocationBtn) {
            enableLocationBtn.addEventListener('click', () => {
                if (!navigator.geolocation) {
                    notify.error('Geolocation is not supported by your browser');
                    return;
                }

                // Show loading state on the button
                enableLocationBtn.disabled = true;
                const btnContent = enableLocationBtn.querySelector('.btn-content');
                const btnLoader = enableLocationBtn.querySelector('.btn-loader');
                if (btnContent) btnContent.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'flex';

                // Use the centralized locateUser() so we get the same marker/popup/behavior
                locateUser().then((loc) => {
                    try {
                        window.userLocation = loc;
                        // Save location to localStorage for persistence across page reloads
                        localStorage.setItem('userLocation', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
                        // Persist tracking preference so location is restored after refresh
                        localStorage.setItem('locationTrackingEnabled', 'true');
                        // Hide the permission card after successful location
                        updateLocationPermissionCard(false);
                        // Center map on user and load nearby restaurants
                        try { goToUser(); } catch (e) { /* ignore */ }
                        if (typeof loadNearbyRestaurants === 'function') {
                            loadNearbyRestaurants(loc.lat, loc.lng);
                        } else if (typeof loadRestaurants === 'function') {
                            // fallback to the other loader if present
                            loadRestaurants();
                        }
                        try { setRecommendationFilter('nearest'); } catch (e) { /* ignore */ }
                        try { setSearchResultFilter('nearest'); } catch (e) { /* ignore */ }
                    } finally {
                        // Reset sidebar button state
                        enableLocationBtn.disabled = false;
                        if (btnContent) btnContent.style.display = 'flex';
                        if (btnLoader) btnLoader.style.display = 'none';
                    }
                }).catch((err) => {
                    console.error('locateUser failed from sidebar enable button:', err);
                    // Reset button state
                    enableLocationBtn.disabled = false;
                    if (btnContent) btnContent.style.display = 'flex';
                    if (btnLoader) btnLoader.style.display = 'none';
                    
                    // Show error notification
                    if (err.code === 1) {
                        notify.error('Location permission denied. Please enable location in your browser settings.');
                    } else if (err.code === 2) {
                        notify.error('Unable to retrieve your location. Please try again.');
                    } else {
                        notify.error('Unable to access your location. Please enable location services.');
                    }
                });
            });
        }
    }

    // Ensure the permission card reflects current state after initial checks
    updateLocationPermissionCard();

    // Ensure directions panel starts hidden
    hideDirectionsPanel();
});

// Toast System Implementation
// ==========================

// Performance tweaks: force GPU compositing and optimize tile rendering to reduce tile popping during zoom/pan
(function injectMapPerfStyles(){
    try {
        const perfCss = `
            /* Force GPU compositing for map and tiles to smooth transforms */
            #map, #map .mapboxgl-canvas, #map .mapboxgl-canvas-container {
                will-change: transform;
                transform: translateZ(0);
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
            }

            /* Prefer higher-quality image scaling to avoid visible pixelation when fractional-zoomed */
            #map canvas {
                image-rendering: optimizeQuality;
                -webkit-transform: translateZ(0);
            }

            /* Reduce marker label jitter during zoom */
            .marker-label {
                will-change: transform, opacity;
                transform: translateZ(0);
                transition: opacity 180ms ease;
                opacity: 1;
            }

            /* Smooth popup transitions */
            .mapboxgl-popup {
                will-change: transform, opacity;
            }
        `;
        const s = document.createElement('style');
        s.id = 'map-perf-styles';
        s.textContent = perfCss;
        document.head.appendChild(s);
    } catch (e) {
        console.warn('Failed to inject map perf styles', e);
    }
})();

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.queue = [];
        this.maxVisible = 2;
        this.maxQueue = 2;
        this.init();
    }

    init() {
        this.createContainer();
        this.injectStyles();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(this.container);
    }

    injectStyles() {
        const styles = `
            #toast-container {
                position: fixed;
                /* Very high z-index to ensure notifications appear above all other UI layers */
                z-index: 2147483647;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                width: calc(100% - 40px);
            }

            @media (max-width: 768px) {
                #toast-container {
                    right: 50%;
                    transform: translateX(50%);
                    bottom: 16px;
                    max-width: 90%;
                }
            }

            .toast {
                position: relative;
                background: #ffffff;
                border-radius: 16px;
                padding: 8px 12px;
                box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
                border-left: none;
                min-width: 220px; /* compact but readable */
                max-width: 100%;
                opacity: 0;
                transform: translateY(12px) scale(0.98);
                transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                overflow: hidden;
            }

            .toast.visible {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

            .toast.exiting {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
                transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
            }

            .toast:hover {
                /* Hover effects disabled on mobile via media query; desktop still has subtle lift */
                transform: translateY(-2px) scale(1);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 3px 10px rgba(0, 0, 0, 0.08);
            }

            .toast-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 0;
            }

            .toast-icon {
                flex-shrink: 0;
                display: none;
            }

            .toast-content {
                flex: 1;
                min-width: 0;
            }

            .toast-title {
                font-weight: 600;
                display: none;
            }

            .toast-message {
                font-size: 12.5px;
                line-height: 1.35;
                margin: 0;
                color: inherit;
                word-wrap: break-word;
                max-height: 2.8em; /* limit height to ~2 lines */
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                font-size: 15px;
                cursor: pointer;
                opacity: 0.9;
                padding: 4px;
                margin: 0 0 0 6px;
                border-radius: 8px;
                color: currentColor;
                transition: all 0.12s ease;
                line-height: 1;
            }

            .toast-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.22);
                color: inherit;
            }

            .toast-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .toast-action-btn {
                padding: 6px 12px;
                border: 1px solid;
                border-radius: 6px;
                background: white;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
                flex: 1;
            }

            .toast-action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px; /* slimmer progress */
                background: currentColor;
                opacity: 0.28;
                width: 100%;
                transform-origin: left;
                animation: toastProgress linear forwards;
            }

            .toast.paused .toast-progress {
                animation-play-state: paused;
            }

            @keyframes toastProgress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            /* Toast Variants */
            .toast.info {
                background: linear-gradient(135deg, #3aa0e6, #2d79c7);
                color: #ffffff;
            }

            .toast.success {
                background: linear-gradient(135deg, #35c36b, #1f9a52);
                color: #ffffff;
            }

            .toast.warning {
                background: linear-gradient(135deg, #f6b437, #e08a0f);
                color: #1f2a37;
            }

            .toast.error {
                background: linear-gradient(135deg, #e84b5a, #c73441);
                color: #ffffff;
            }

            /* Action button variants */
            .toast.info .toast-action-btn {
                border-color: #3498db;
                color: #3498db;
            }
            .toast.info .toast-action-btn:hover {
                background: #3498db;
                color: white;
            }

            .toast.success .toast-action-btn {
                border-color: #27ae60;
                color: #27ae60;
            }
            .toast.success .toast-action-btn:hover {
                background: #27ae60;
                color: white;
            }

            .toast.warning .toast-action-btn {
                border-color: #f39c12;
                color: #f39c12;
            }
            .toast.warning .toast-action-btn:hover {
                background: #f39c12;
                color: white;
            }

            .toast.error .toast-action-btn {
                border-color: #dc3545;
                color: #dc3545;
            }
            .toast.error .toast-action-btn:hover {
                background: #dc3545;
                color: white;
            }

            /* Mobile swipe gestures */
            @media (max-width: 768px) {
                /* Simplified, smaller toast appearance on mobile */
                #toast-container {
                    right: 50%;
                    transform: translateX(50%);
                    bottom: 12px;
                    gap: 8px;
                    max-width: 92%;
                    width: calc(100% - 32px);
                }

                .toast {
                    min-width: unset;
                    padding: 7px 10px;
                    border-radius: 14px;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
                    border-left: none;
                    font-size: 12px;
                    line-height: 1.2;
                    cursor: default; /* avoid hover semantics on mobile */
                }

                .toast .toast-header {
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .toast .toast-icon {
                    display: none;
                }

                .toast .toast-title { display: none; }
                .toast .toast-message { font-size: 12px; color: inherit; }

                /* Disable hover transform visual effect on mobile */
                .toast:hover { transform: none; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

                .toast.swiping { transition: none; }
                .toast.swipe-out { transform: translateX(100%); opacity: 0; }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .toast {
                    transition: opacity 0.3s ease;
                }
                
                .toast-progress {
                    animation: none;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    notify(message, options = {}) {
        const type = options.type || 'info';
        const normalizedMessage = String(message || '').trim();
        const isDuplicateVisible = this.toasts.some((toast) => toast.type === type && toast.message === normalizedMessage);
        const isDuplicateQueued = this.queue.some((toast) => toast.type === type && toast.message === normalizedMessage);
        if (isDuplicateVisible || isDuplicateQueued) {
            return null;
        }

        const toast = {
            id: Date.now() + Math.random(),
            message: normalizedMessage,
            type,
            duration: options.duration || (type === 'error' ? 7000 : 3000),
            action: options.action,
            icon: options.icon,
            sticky: options.sticky || false,
            createdAt: Date.now()
        };

        if (this.toasts.length >= this.maxVisible) {
            if (this.queue.length >= this.maxQueue) {
                this.queue.shift();
            }
            this.queue.push(toast);
            return toast.id;
        }

        this.showToast(toast);
        return toast.id;
    }

    showToast(toast) {
        const toastElement = this.createToastElement(toast);
        this.container.appendChild(toastElement);
        this.toasts.push({ ...toast, element: toastElement });

        // Trigger animation
        requestAnimationFrame(() => {
            toastElement.classList.add('visible');
        });

        // Set up auto-dismiss if not sticky
        if (!toast.sticky) {
            this.setupAutoDismiss(toast);
        }

        // Set up interactions
        this.setupInteractions(toast, toastElement);
    }

    createToastElement(toast) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${toast.type}`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', toast.type === 'warning' || toast.type === 'error' ? 'assertive' : 'polite');
        toastElement.dataset.toastId = toast.id;

        toastElement.innerHTML = `
            <div class="toast-header">
                <div class="toast-content">
                    <div class="toast-message">${toast.message}</div>
                </div>
                <button class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${toast.action ? `
                <div class="toast-actions">
                    <button class="toast-action-btn" onclick="toastManager.handleAction('${toast.id}')">
                        ${toast.action.label}
                    </button>
                </div>
            ` : ''}
        `;

        return toastElement;
    }

    getDefaultIcon(type) {
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-exclamation-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    getTypeTitle(type) {
        const titles = {
            info: 'Information',
            success: 'Success',
            warning: 'Warning',
            error: 'Error'
        };
        return titles[type] || 'Notification';
    }

    setupAutoDismiss(toast) {
        toast.timeoutId = setTimeout(() => {
            this.dismissToast(toast.id);
        }, toast.duration);
    }

    setupInteractions(toast, toastElement) {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        // Click to dismiss
        toastElement.addEventListener('click', (e) => {
            if (!e.target.closest('.toast-action-btn') && !e.target.closest('.toast-close')) {
                this.dismissToast(toast.id);
            }
        });

        // Close button
        const closeBtn = toastElement.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissToast(toast.id);
        });

        // Pause on hover/focus
        toastElement.addEventListener('mouseenter', () => {
            if (!toast.sticky && toast.timeoutId) {
                toastElement.classList.add('paused');
                clearTimeout(toast.timeoutId);
            }
        });

        toastElement.addEventListener('mouseleave', () => {
            if (!toast.sticky && !toastElement.classList.contains('swiping')) {
                this.setupAutoDismiss(toast);
                toastElement.classList.remove('paused');
            }
        });

        // Mobile swipe to dismiss
        toastElement.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
        }, { passive: true });

        toastElement.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            
            if (diff > 0) { // Swipe right
                toastElement.classList.add('swiping');
                toastElement.style.transform = `translateX(${Math.min(diff, 100)}px)`;
                
                // Pause auto-dismiss during swipe
                if (!toast.sticky && toast.timeoutId) {
                    clearTimeout(toast.timeoutId);
                }
            }
        }, { passive: true });

        toastElement.addEventListener('touchend', () => {
            if (!isSwiping) return;
            
            isSwiping = false;
            toastElement.classList.remove('swiping');
            
            const diff = currentX - startX;
            const swipeThreshold = 50;
            
            if (diff > swipeThreshold) {
                toastElement.classList.add('swipe-out');
                setTimeout(() => this.dismissToast(toast.id), 300);
            } else {
                toastElement.style.transform = '';
                // Resume auto-dismiss if not sticky
                if (!toast.sticky) {
                    this.setupAutoDismiss(toast);
                }
            }
        });

        // Keyboard support
        toastElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.dismissToast(toast.id);
            }
        });
    }

    handleAction(toastId) {
        const toast = this.toasts.find(t => t.id == toastId);
        if (toast && toast.action && toast.action.onClick) {
            toast.action.onClick();
            this.dismissToast(toastId);
        }
    }

    dismissToast(toastId) {
        const toastIndex = this.toasts.findIndex(t => t.id == toastId);
        if (toastIndex === -1) return;

        const toast = this.toasts[toastIndex];
        const toastElement = toast.element;

        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }

        toastElement.classList.remove('visible');
        toastElement.classList.add('exiting');

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
            this.toasts.splice(toastIndex, 1);
            this.processQueue();
        }, 250);
    }

    processQueue() {
        if (this.queue.length > 0 && this.toasts.length < this.maxVisible) {
            const nextToast = this.queue.shift();
            this.showToast(nextToast);
        }
    }

    // Convenience methods
    info(message, options = {}) {
        return this.notify(message, { ...options, type: 'info' });
    }

    success(message, options = {}) {
        return this.notify(message, { ...options, type: 'success' });
    }

    warning(message, options = {}) {
        return this.notify(message, { ...options, type: 'warning' });
    }

    error(message, options = {}) {
        return this.notify(message, { ...options, type: 'error' });
    }

    // Clear all toasts
    clear() {
        this.toasts.forEach(toast => {
            this.dismissToast(toast.id);
        });
        this.queue = [];
    }
}

// Close search/sidebar helper (ensure exists)
function closeSearchSidebar() {
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
        locationPromptDismissed = false;
        if (overlay) overlay.hidden = true;
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        refreshMapSize(300);
    }
}

// Show/hide the Clear Location control
function showClearLocationControl() {
    const btn = document.querySelector('.clear-location-btn');
    if (btn && btn.parentElement) {
        btn.parentElement.style.display = '';
    }
}

function hideClearLocationControl() {
    const btn = document.querySelector('.clear-location-btn');
    if (btn && btn.parentElement) {
        btn.parentElement.style.display = 'none';
    }
}

// Category color mapping and helpers (used by map markers and modal header pins)
const CATEGORY_COLORS = {
    'Fast Food': '#E53935',
    'Casual Dining': '#FB8C00',
    'Fine Dining': '#6A1B9A',
    'Café / Coffee Shop': '#8D6E63',
    'Buffet': '#C8860A',
    'Food Truck / Street Food': '#00897B',
    'Bistro / Brasserie': '#3949AB',
    'Fast Casual': '#43A047',
    'Family Style': '#B8860B',
    'Pub / Bar & Grill': '#5D4037'
};
const DEFAULT_PIN_COLOR = '#E85634';

function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_PIN_COLOR;
}

function getCategoryIconClass(category) {
    if (category === 'Pub / Bar & Grill') {
        return 'fa-beer-mug-empty';
    }
    if (category === 'Fast Casual') {
        return 'fa-pizza-slice';
    }
    if (category === 'Bistro / Brasserie') {
        return 'fa-store';
    }
    if (category === 'Food Truck / Street Food') {
        return 'fa-truck';
    }
    if (category === 'Café / Coffee Shop') {
        return 'fa-mug-hot';
    }
    if (category === 'Fine Dining') {
        return 'fa-wine-glass';
    }
    if (category === 'Fast Food') {
        return 'fa-burger';
    }
    if (category === 'Casual Dining') {
        return 'fa-utensils';
    }
    if (category === 'Buffet') {
        return 'fa-concierge-bell';
    }
    if (category === 'Family Style') {
        return 'fa-users';
    }
    return 'fa-utensils';
}

function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(232,86,52,${alpha})`;
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex, percent = 40) {
    if (!hex) return '#F5B5A3';
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    
    // Lighten by moving towards white
    r = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generate HTML for a 5-star rating display with half-star support
 * @param {number} rating - The rating value (0-5, supports decimals)
 * @param {boolean} showValue - Whether to show the numeric value after stars
 * @param {string} suffix - Text to show after the rating value (e.g., "ratings", "reviews")
 * @returns {string} HTML string with star icons
 */
function generateStarRating(rating, showValue = true, suffix = 'ratings') {
    const numRating = parseFloat(rating) || 0;
    const clampedRating = Math.min(5, Math.max(0, numRating));

    // Layered stars: grey outline underneath, gold fill clipped by width percent for precise decimals
    const percent = (clampedRating / 5) * 100;
    const emptyStars = '<i class="far fa-star star-icon"></i>'.repeat(5);
    const filledStars = '<i class="fas fa-star star-icon"></i>'.repeat(5);

    let starsHtml = `
        <span class="stars-outer">
            ${emptyStars}
            <span class="stars-inner" style="width:${percent}%">
                ${filledStars}
            </span>
        </span>
    `;

    if (showValue) {
        starsHtml += ` <span class="rating-value">${clampedRating.toFixed(1)}</span>`;
        if (suffix) {
            starsHtml += ` <span class="rating-suffix">${suffix}</span>`;
        }
    }

    return `<span class="star-rating-display">${starsHtml}</span>`;
}

// Ratings cache for list cards
const _listRatingsCache = new Map();
const _listRatingsInflight = new Map();

function fetchAverageRating(restaurantId) {
    const id = Number(restaurantId);
    if (!id) return Promise.resolve({ avg: 0, count: 0 });
    if (_listRatingsCache.has(id)) return Promise.resolve(_listRatingsCache.get(id));
    if (_listRatingsInflight.has(id)) return _listRatingsInflight.get(id);

    const req = fetch(`api/restaurants.php?action=getRatings&restaurant_id=${id}`)
        .then(resp => resp.json())
        .then(ratings => {
            let avg = 0;
            let count = 0;
            if (Array.isArray(ratings) && ratings.length > 0) {
                count = ratings.length;
                avg = ratings.reduce((s, r) => s + Number(r.rating || 0), 0) / count;
            }
            const data = { avg, count };
            _listRatingsCache.set(id, data);
            return data;
        })
        .catch(() => {
            const data = { avg: 0, count: 0 };
            _listRatingsCache.set(id, data);
            return data;
        })
        .finally(() => {
            _listRatingsInflight.delete(id);
        });

    _listRatingsInflight.set(id, req);
    return req;
}

function updateRatingsInContainer(container) {
    if (!container) return;
    const ratingEls = container.querySelectorAll('.restaurant-rating[data-restaurant-id]');
    if (!ratingEls.length) return;
    ratingEls.forEach(el => {
        const id = el.getAttribute('data-restaurant-id');
        const hoursRaw = decodeURIComponent(el.getAttribute('data-hours') || '');
        const status = isRestaurantOpen(hoursRaw);
        fetchAverageRating(id).then(({ avg, count }) => {
            if (count > 0) {
                el.innerHTML = generateStarRating(avg, true, 'ratings');
            } else {
                el.innerHTML = `${generateStarRating(0, false)} <span class="rating-suffix">No ratings</span>`;
            }
        });
    });
}

// Initialize toast manager
const toastManager = new ToastManager();

// Public API
const notify = (message, options = {}) => {
    return toastManager.notify(message, options);
};

// Convenience helpers
notify.info = (message, options = {}) => toastManager.info(message, options);
notify.success = (message, options = {}) => toastManager.success(message, options);
notify.warning = (message, options = {}) => toastManager.warning(message, options);
notify.error = (message, options = {}) => toastManager.error(message, options);
notify.clear = () => toastManager.clear();

// Backward compatibility - replace showNotification
const showNotification = (message, type = 'info') => {
    return notify(message, { type });
};

// Global variables
let map;
let restaurants = [];
let markers = [];
let restaurantLayer = null; // LayerGroup to hold restaurant markers
let currentRestaurant = null;
let userLocation = null;
let userMarker = null;
let userLocationWatchId = null; // For continuous location tracking
let userLocationBuffer = [];
let userLocationBufferSize = 3; // small buffer for near-realtime response
let userLocationAccuracy = null; // last known accuracy in meters
let userLocationLastTimestamp = 0; // timestamp of last location update
let userLocationSpeed = 0; // estimated speed in m/s
let userLocationLastRawPos = null; // last raw position for speed calculation

// Convert accuracy in meters to user-friendly level
function getAccuracyLevel(meters) {
    if (!meters) return 'Medium';
    if (meters <= 20) return 'High';
    if (meters <= 100) return 'Medium';
    return 'Low';
}

// Get color for accuracy level
function getAccuracyColor(meters) {
    if (!meters) return '#f59e0b';
    if (meters <= 20) return '#10b981';
    if (meters <= 100) return '#f59e0b';
    return '#ef4444';
}
let navigationWatchId = null;   // For turn-by-turn navigation tracking
let navigationMarker = null;    // Marker showing live user position during navigation
let lastNavigationPos = null;   // Last coordinate used to compute bearing
let lastNavigationHeading = 0;  // Last heading degrees used for marker rotation
let deviceHeading = 0;          // Current device heading in degrees
let deviceHeadingWatchId = null; // Watch ID for device heading updates
let deviceOrientationHandler = null; // Handler for device orientation events
let lastSmoothedHeading = null;
let headingUpdateRaf = null;
let lastHeadingTimestamp = 0;
let userLocationHeadingIndicator = null; // Heading indicator element on user location marker
let coverageArea = null;
let currentRoute = null;
let userMarkerAnimationFrame = null; // For smooth marker animation
let routeLine = null;
let routeStepPopup = null; // GL popup for route step markers
let _routeStepFeatures = []; // Cached GeoJSON features for route steps (for style.load re-render)
let _routeStepClickHandler = null; // Click handler ref for cleanup
let _routeStepEnterHandler = null;
let _routeStepLeaveHandler = null;
let canvasRenderer = null; // Canvas renderer for route lines (sticks to map like markers)
let allRestaurantMarkers = []; // Store all restaurant markers
let routeStepPoints = []; // Route step points for turn detection
let currentRouteStepIndex = 0;
let returnHomeControl; // Global variable for return home control
let closeRouteControl; // Global variable for close route control
let chatbotViewportCleanup = null; // cleanup for visualViewport listeners
let chatbotBaseHeight = null; // stores the modal height before keyboard opens
let chatbotWasAtBottomBeforeKeyboard = false; // used to preserve header when keyboard opens
let hideMarkersDuringRouting = false; // When true, only show the active destination marker
let labelVisibilityRaf = null; // Throttle label visibility updates for smoother zooming
let chatbotScrollLocked = true; // Auto-scroll to bottom when new messages arrive
let chatbotScrollLockListener = null; // Listener for scroll events
let lastLabelHideState = null; // Track last hide/show state to avoid unnecessary DOM work
let lastMarkerHideState = null; // Track last marker hide/show state to avoid unnecessary DOM work
let chatbotIsResponding = false;
let chatbotAbortController = null;
let chatbotStreamReader = null;
// Default initial zoom for the map (use this everywhere to keep consistency)
const INITIAL_ZOOM = 15.5;
// Hide restaurant labels at ~5000 ft scale (roughly zoom 14.6 and below)
const MARKER_LABEL_HIDE_ZOOM = 14.6;
const MARKER_HIDE_ZOOM = 12.5; // ~2 miles scale
const MARKER_HIDE_DISTANCE_KM = 1.0; // 1 km
const MARKER_HIDE_SCALE_KM = 1.0; // hide pins when scale bar is ~1 km
const MAP_STATE_KEY = 'foodcrawl.mapState';
const USE_WEBGL_RESTAURANT_MARKERS = true;
const MAPBOX_RESTAURANT_MARKER_SOURCE_ID = 'restaurant-marker-source';
const MAPBOX_RESTAURANT_MARKER_LAYER_ID = 'restaurant-marker-layer';
const MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID = 'restaurant-selected-marker-layer';
const MAPBOX_RESTAURANT_LABEL_LAYER_ID = 'restaurant-label-layer';
const MAPBOX_USER_LOCATION_SOURCE_ID = 'user-location-source';
const MAPBOX_USER_PULSE_LAYER_ID = 'user-location-pulse';
const MAPBOX_USER_DOT_LAYER_ID = 'user-location-dot';
const MAPBOX_USER_OUTLINE_LAYER_ID = 'user-location-outline';
const MAPBOX_ROUTE_STEPS_SOURCE_ID = 'route-steps-source';
const MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID = 'route-steps-circle';
const MAPBOX_ROUTE_STEPS_OUTLINE_LAYER_ID = 'route-steps-outline';
const MAPBOX_ROUTE_STEPS_NUMBER_LAYER_ID = 'route-steps-number';
// Mapbox token - will be loaded from backend API
let MAPBOX_ACCESS_TOKEN = null;
let currentMarkerRestaurants = [];
let webglRestaurantLayerVisible = true;
let webglRestaurantClickBound = false;
let webglMarkerImageIds = new Set();
let webglMarkerGeneration = 0;
const popupRatingsCache = {}; // restaurantId -> { avg, count }
let activeRestaurantMarkerId = null;
let faCanvasFontReadyPromise = null;
let userLocationPulseFrame = null;  // rAF handle for GL pulse animation
let userLocationPopup = null;       // Popup instance for GL user marker

// Load Mapbox token from backend API
async function loadMapboxToken() {
    try {
        const response = await fetch('api/get_token.php');
        const data = await response.json();
        if (data.success && data.token) {
            MAPBOX_ACCESS_TOKEN = data.token;
            console.log('Mapbox token loaded successfully');
            return true;
        } else {
            console.error('Failed to load Mapbox token from server');
            return false;
        }
    } catch (error) {
        console.error('Error loading Mapbox token:', error);
        return false;
    }
}

let activePopup = null;
const MAPBOX_ROUTE_SOURCE_ID = 'route-line-source';
const MAPBOX_ROUTE_LAYER_ID = 'route-line-layer';
const MAPBOX_COVERAGE_SOURCE_ID = 'coverage-area-source';
const MAPBOX_COVERAGE_FILL_LAYER_ID = 'coverage-area-fill';
const MAPBOX_COVERAGE_LINE_LAYER_ID = 'coverage-area-line';

function toLngLat(latlng) {
    if (Array.isArray(latlng)) {
        return [latlng[1], latlng[0]]; // [lng, lat]
    }
    if (latlng && typeof latlng === 'object' && 'lat' in latlng && 'lng' in latlng) {
        return [latlng.lng, latlng.lat];
    }
    return latlng;
}

function toLatLng(lngLat) {
    if (Array.isArray(lngLat)) {
        return { lat: lngLat[1], lng: lngLat[0] };
    }
    if (lngLat && typeof lngLat === 'object' && 'lat' in lngLat && 'lng' in lngLat) {
        return { lat: lngLat.lat, lng: lngLat.lng };
    }
    return lngLat;
}

function createMapboxPopup(html, options = {}) {
    const popup = new mapboxgl.Popup({
        closeButton: options.closeButton !== false,
        closeOnClick: true,
        closeOnMove: false,
        anchor: options.anchor || 'bottom',
        offset: options.offset || [0, -12],
        autoPan: options.autoPan !== undefined ? options.autoPan : false,
        focusAfterOpen: false,
        className: options.className || ''
    }).setHTML(html);
    return popup;
}

function syncSelectedRestaurantMarkerLayer() {
    if (!USE_WEBGL_RESTAURANT_MARKERS || !map || !map.getLayer) return;
    if (!map.getLayer(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID)) return;

    const selectedId = Number(activeRestaurantMarkerId);
    const hasSelectedRestaurant = Number.isFinite(selectedId)
        && Array.isArray(currentMarkerRestaurants)
        && currentMarkerRestaurants.some(restaurant => Number(restaurant.id) === selectedId);

    try {
        map.setLayoutProperty(
            MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID,
            'visibility',
            webglRestaurantLayerVisible ? 'visible' : 'none'
        );
        map.setFilter(
            MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID,
            hasSelectedRestaurant
                ? ['==', ['to-number', ['get', 'restaurantId']], selectedId]
                : ['==', ['to-number', ['get', 'restaurantId']], -1]
        );
    } catch (e) { /* ignore */ }
}

function setActiveRestaurantMarker(restaurantId) {
    const nextRestaurantId = Number(restaurantId);
    activeRestaurantMarkerId = Number.isFinite(nextRestaurantId) ? nextRestaurantId : null;
    syncSelectedRestaurantMarkerLayer();
}

function createMapboxMarker({ html, lat, lng, element = null, anchor = 'bottom' }) {
    const el = element || document.createElement('div');
    el.className = 'fc-marker-wrapper';
    if (!element && typeof html === 'string') {
        el.innerHTML = html;
    }
    // Ensure numeric coordinates for Mapbox GL
    const numLng = parseFloat(lng);
    const numLat = parseFloat(lat);
    
    if (isNaN(numLng) || isNaN(numLat)) {
        console.error('createMapboxMarker: Invalid coordinates', lng, lat);
    }
    
    const marker = new mapboxgl.Marker({ element: el, anchor })
        .setLngLat([numLng, numLat]);

    const wrapper = {
        __fcMarker: true,
        _marker: marker,
        _popup: null,
        _added: false,
        addTo(mapInstance) {
            marker.addTo(mapInstance);
            this._added = true;
            return this;
        },
        remove() {
            try { marker.remove(); } catch (e) {}
            if (this._popup) {
                try { this._popup.remove(); } catch (e) {}
            }
            this._added = false;
            return this;
        },
        setLatLng(latlng) {
            const ll = toLngLat(latlng);
            marker.setLngLat(ll);
            return this;
        },
        getLatLng() {
            const ll = marker.getLngLat();
            return { lat: ll.lat, lng: ll.lng };
        },
        bindPopup(html, options = {}) {
            this._popup = createMapboxPopup(html, options);
            marker.setPopup(this._popup);
            return this;
        },
        openPopup() {
            if (!this._popup || !map) return this;
            if (activePopup && activePopup !== this._popup) {
                try { activePopup.remove(); } catch (e) {}
            }
            this._popup.addTo(map);
            activePopup = this._popup;
            return this;
        },
        closePopup() {
            if (this._popup) {
                try { this._popup.remove(); } catch (e) {}
            }
            if (activePopup === this._popup) activePopup = null;
            return this;
        },
        isPopupOpen() {
            if (!this._popup) return false;
            if (typeof this._popup.isOpen === 'function') return this._popup.isOpen();
            return !!this._popup._map;
        },
        getPopup() {
            return this._popup;
        },
        getElement() {
            return marker.getElement();
        },
        togglePopup() {
            if (this.isPopupOpen()) {
                return this.closePopup();
            } else {
                return this.openPopup();
            }
        },
        getLngLat() {
            return marker.getLngLat();
        }
    };

    return wrapper;
}

function createCircleGeoJSON(centerLatLng, radiusMeters, steps = 64) {
    const center = Array.isArray(centerLatLng) ? { lat: centerLatLng[0], lng: centerLatLng[1] } : centerLatLng;
    const coords = [];
    const earthRadius = 6371000;
    const lat = center.lat * Math.PI / 180;
    const lng = center.lng * Math.PI / 180;
    const d = radiusMeters / earthRadius;
    for (let i = 0; i <= steps; i++) {
        const bearing = 2 * Math.PI * (i / steps);
        const lat2 = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing));
        const lng2 = lng + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(lat2));
        coords.push([lng2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
    }
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [coords]
        }
    };
}

// Create GeoJSON from Estancia municipality OSM boundary data
function createEstanciaBoundaryGeoJSON() {
    // Estancia municipality boundary from OpenStreetMap (relation 3477885)
    // Ways chained end-to-end in correct order to form a closed polygon:
    // 259122944 → 68235126 → 259122956(rev) → 259122958 → 259122947(rev) → 259122955(rev) → 259122951(rev) → close
    const boundary = [
        // way 259122944 forward: west side going north
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
        // way 68235126 forward: detailed coastline going northeast
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
        // way 259122956 reversed: going north to peak
        [123.1419388, 11.4825389],
        [123.1475590, 11.4906707],
        [123.1475582, 11.4929820],
        [123.1487757, 11.4952924],
        // way 259122958 forward: east coast going south
        [123.1504154, 11.4911305],
        [123.1564713, 11.4895831],
        [123.1718928, 11.4780858],
        [123.1898970, 11.4537157],
        [123.2051710, 11.4423615],
        [123.2150585, 11.4330320],
        [123.2166081, 11.4205921],
        [123.2136566, 11.3954213],
        // way 259122947 reversed: short segment south
        [123.2077851, 11.3949343],
        // way 259122955 reversed: south coast going northwest
        [123.1945870, 11.3966560],
        [123.1650257, 11.4106524],
        [123.1592760, 11.4200750],
        [123.1326497, 11.4210971],
        // way 259122951 reversed: back to start
        [123.1146958, 11.4277925],
        [123.1042526, 11.4309855]
    ];

    return {
        type: 'Feature',
        properties: {
            name: 'Estancia, Iloilo',
            admin_level: 6,
            population: 53200
        },
        geometry: {
            type: 'Polygon',
            coordinates: [boundary]
        }
    };
}


// Define the ReturnHomeControl class (Mapbox GL control)
class ReturnHomeControl {
    onAdd(mapInstance) {
        this._map = mapInstance;
        const container = document.createElement('div');
        container.className = 'leaflet-bar leaflet-control return-home-control mapboxgl-ctrl';

        const button = document.createElement('a');
        button.className = 'return-home-btn';
        button.href = '#';
        button.title = 'Return Home';
        button.innerHTML = '<i class="fas fa-home"></i>';

        container.style.background = 'none';
        container.style.border = 'none';
        button.style.display = 'block';
        button.style.width = '32px';
        button.style.height = '32px';
        button.style.lineHeight = '32px';
        button.style.textAlign = 'center';
        button.style.backgroundColor = 'white';
        button.style.border = '2px solid rgba(0,0,0,0.2)';
        button.style.borderRadius = '4px';
        button.style.color = '#333';
        button.style.fontSize = '18px';
        button.style.textDecoration = 'none';
        button.style.cursor = 'pointer';
        button.style.marginTop = '10px';
        button.style.webkitTapHighlightColor = 'transparent';
        button.style.outline = 'none';

        button.onmouseover = function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.color = '#007bff';
            this.style.borderColor = '#007bff';
        };
        button.onmouseout = function() {
            this.style.backgroundColor = 'white';
            this.style.color = '#333';
            this.style.borderColor = 'rgba(0,0,0,0.2)';
        };
        button.onmousedown = function() {
            this.style.backgroundColor = '#007bff';
            this.style.color = 'white';
        };
        button.onmouseup = function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.color = '#007bff';
        };

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Close any open popups and modals
            if (map && typeof map.closePopup === 'function') map.closePopup();
            closeRestaurantModal();

            const estanciaCenter = [11.456453464374693, 123.15114185203521];
            try {
                if (typeof hideCoverage === 'function') {
                    hideCoverage();
                }
            } catch (err) {
                console.warn('Error hiding coverage on home click', err);
            }

            if (map && typeof map.flyTo === 'function') {
                map.flyTo({
                    center: [estanciaCenter[1], estanciaCenter[0]],
                    zoom: INITIAL_ZOOM,
                    bearing: 0,
                    pitch: 0,
                    duration: 2000,
                    essential: true
                });
            } else if (map && typeof map.easeTo === 'function') {
                map.easeTo({ center: [estanciaCenter[1], estanciaCenter[0]], zoom: INITIAL_ZOOM, bearing: 0, pitch: 0, duration: 2000 });
            } else if (map && typeof map.setView === 'function') {
                map.setView(estanciaCenter, INITIAL_ZOOM, { animate: true });
            }
        });

        container.appendChild(button);
        this._container = container;
        return container;
    }
    onRemove() {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._map = null;
    }
    getContainer() {
        return this._container;
    }
}

class SavedRestaurantsControl {
    onAdd(mapInstance) {
        this._map = mapInstance;
        const container = document.createElement('div');
        container.className = 'leaflet-bar leaflet-control saved-restaurants-control mapboxgl-ctrl';

        const button = document.createElement('a');
        button.className = 'saved-restaurants-btn';
        button.href = '#';
        button.title = 'Saved Restaurants';
        button.setAttribute('aria-label', 'Saved restaurants');
        button.innerHTML = '<i class="fas fa-bookmark"></i>';

        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showSavedRestaurantsPanel();
        });

        container.appendChild(button);
        this._container = container;
        return container;
    }
    onRemove() {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._map = null;
    }
    getContainer() {
        return this._container;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Load Mapbox token from backend before initializing map
    const tokenLoaded = await loadMapboxToken();
    
    if (!tokenLoaded) {
        console.error('Failed to load Mapbox token. Map functionality may not work.');
        notify.error('Failed to load map configuration. Please refresh the page.');
        return;
    }
    
    initializeMap();

    // Ensure saved user location is restored after the map is ready
    const restoreSavedLocationOnMap = () => {
        const savedLocation = localStorage.getItem('userLocation');
        if (!savedLocation) return;
        let parsed = null;
        try {
            parsed = JSON.parse(savedLocation);
        } catch (e) {
            console.warn('Failed to parse saved location:', e);
            return;
        }
        if (!parsed || parsed.lat === undefined || parsed.lng === undefined) return;
        const lat = Number(parsed.lat);
        const lng = Number(parsed.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const loc = { lat, lng };
        window.userLocation = loc;
        userLocation = loc;

        // Draw marker and nearby list now that map is ready
        try {
            displayUserLocationMarker(loc);
            loadNearbyRestaurants(loc.lat, loc.lng);
            updateLocationPermissionCard(false);
        } catch (e) {
            console.warn('Failed to restore user location on map:', e);
        }

        // If tracking was enabled, resume background tracking to keep location fresh
        const trackingEnabled = localStorage.getItem('locationTrackingEnabled') === 'true';
        if (trackingEnabled) {
            locateUser({ suppressCenter: true }).catch(err => {
                console.warn('Real-time tracking failed, using saved location:', err);
            });
        }
    };
    
    // Wait for map to be ready before loading restaurants and restoring location
    if (map) {
        const loadRestaurantsWhenReady = () => {
            console.log('Map ready, loading restaurants...');
            loadRestaurants();
        };
        const restoreLocationWhenReady = () => {
            restoreSavedLocationOnMap();
        };
        
        if (map.isStyleLoaded && map.isStyleLoaded()) {
            loadRestaurantsWhenReady();
            restoreLocationWhenReady();
        } else {
            map.on('style.load', loadRestaurantsWhenReady);
            map.on('style.load', restoreLocationWhenReady);
        }
    } else {
        // Fallback - load restaurants anyway
        loadRestaurants();
    }
    
    // Register phone input validation for admin add/edit forms
    try { registerPhoneValidation(); } catch (e) { /* ignore if not present */ }
    initializeChatbot();
    setupEventListeners();
    setupMapControls();
    addCurrentLocationButton();
    addFollowUserButton();
    addCoverageArea();
    // Enable smooth touchpad/mouse wheel zooming similar to Google Maps
    try { enableSmoothWheel(); } catch (e) { /* ignore */ }
    setupSidebarToggle();
    initializeCategoryLegend();
    addLayersControl(); // Add layers control button
    addCategoryLegendControl(); // Add category legend button
    map.addControl(new SavedRestaurantsControl(), 'top-right');
    
    // Add return home button
    returnHomeControl = new ReturnHomeControl();
    map.addControl(returnHomeControl, 'top-right');

    // Clear user location button removed - no longer needed

    // Offset the left-side temporary controls below categories
    function positionTemporaryControls() {
        const mapEl = document.getElementById('map');
        const chips = document.getElementById('categoryChipsContainer');
        const isMobile = window.innerWidth <= 768;
        let offset = isMobile ? 200 : 50;

        if (mapEl && chips) {
            const mapRect = mapEl.getBoundingClientRect();
            const chipsRect = chips.getBoundingClientRect();
            const gap = 1; // keep minimal gap
            const calcTop = Math.max(0, chipsRect.bottom - mapRect.top + gap);
            // Use calculated value only on mobile to align under categories
            if (isMobile) offset = Math.max(0, calcTop - 9.5); // lift a bit higher
        }

        const left = 0; // move even further left
        const applyOffset = (el) => {
            if (!el) return;
            el.style.top = offset + 'px';
            el.style.left = left + 'px';
        };
        applyOffset(document.querySelector('.remove-route-control'));
        applyOffset(document.querySelector('.clear-location-control'));
    }
    positionTemporaryControls();
    window.addEventListener('resize', positionTemporaryControls);

    // Add compass/reset rotation control
    try {
        class CompassControl {
            onAdd(mapInstance) {
                this._map = mapInstance;
                const container = document.createElement('div');
                container.className = 'leaflet-bar leaflet-control compass-control mapboxgl-ctrl';
                const button = document.createElement('a');
                button.className = 'compass-btn';
                button.href = '#';
                button.title = 'Reset Map Rotation (Shift+Drag to rotate)';
                button.innerHTML = '<i class="fas fa-compass"></i>';

                container.style.background = 'none';
                container.style.border = 'none';
                button.style.display = 'block';
                button.style.width = '32px';
                button.style.height = '32px';
                button.style.lineHeight = '32px';
                button.style.textAlign = 'center';
                button.style.backgroundColor = 'white';
                button.style.border = '2px solid rgba(0,0,0,0.2)';
                button.style.borderRadius = '4px';
                button.style.color = '#333';
                button.style.fontSize = '14px';
                button.style.webkitTapHighlightColor = 'transparent';
                button.style.outline = 'none';
                button.onmouseout = function() { this.style.backgroundColor = 'white'; this.style.color = '#333'; };

                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (map) {
                        // Use flyTo animation to reset rotation
                        if (typeof map.flyTo === 'function') {
                            const center = map.getCenter();
                            map.flyTo({
                                center: [center.lng, center.lat],
                                bearing: 0,
                                pitch: map.getPitch ? map.getPitch() : 0,
                                duration: 1500,
                                essential: true
                            });
                        } else if (map.setBearing) {
                            // Fallback if flyTo is not available
                            map.setBearing(0);
                        }
                    }
                });

                if (map && typeof map.on === 'function') {
                    map.on('rotate', function() {
                        const bearing = map.getBearing ? map.getBearing() : 0;
                        button.style.transform = `rotate(${-bearing}deg)`;
                    });
                }

                container.appendChild(button);
                this._container = container;
                return container;
            }
            onRemove() {
                if (this._container && this._container.parentNode) {
                    this._container.parentNode.removeChild(this._container);
                }
                this._map = null;
            }
            getContainer() { return this._container; }
        }
        map.addControl(new CompassControl(), 'top-right');
    } catch (e) {
        console.warn('Failed to add CompassControl', e);
    }

    // Add close route button
    try {
        class CloseRouteControl {
            onAdd(mapInstance) {
                this._map = mapInstance;
                const container = document.createElement('div');
                container.className = 'leaflet-bar leaflet-control close-route-control mapboxgl-ctrl';
                container.style.display = 'none';
                
                const button = document.createElement('a');
                button.className = 'close-route-btn';
                button.href = '#';
                button.title = 'Close Route';
                button.innerHTML = '<i class="fas fa-times-circle"></i>';
                
                container.style.background = 'none';
                container.style.border = 'none';
                button.style.display = 'block';
                button.style.width = '32px';
                button.style.height = '32px';
                button.style.lineHeight = '32px';
                button.style.textAlign = 'center';
                button.style.backgroundColor = 'white';
                button.style.border = '2px solid #dc3545';
                button.style.borderRadius = '4px';
                button.style.color = '#dc3545';
                button.style.fontSize = '18px';
                button.style.textDecoration = 'none';
                button.style.cursor = 'pointer';
                button.style.marginTop = '8px';
                
                button.onmouseover = function() {
                    this.style.backgroundColor = '#dc3545';
                    this.style.color = 'white';
                };
                button.onmouseout = function() {
                    this.style.backgroundColor = 'white';
                    this.style.color = '#dc3545';
                };
                
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    clearRoute();
                });
                
                container.appendChild(button);
                this._container = container;
                return container;
            }
            onRemove() {
                if (this._container && this._container.parentNode) {
                    this._container.parentNode.removeChild(this._container);
                }
                this._map = null;
            }
            getContainer() { return this._container; }
        }
        closeRouteControl = new CloseRouteControl();
        map.addControl(closeRouteControl, 'top-right');
    } catch (e) {
        console.warn('Failed to add CloseRouteControl', e);
    }

    // Create a LayerGroup for restaurant markers and add to map
    restaurantLayer = null;
    
    // Set up map move event to show/hide return home button
    setupReturnHomeControl();

    // Ensure map resizes correctly after layout settles
    refreshMapSize(250);
    window.addEventListener('resize', () => refreshMapSize(150));
    window.addEventListener('orientationchange', () => refreshMapSize(300));
    
    // location modal removed per user request
});

// Register client-side phone validation for admin forms
function registerPhoneValidation() {
    const ids = ['#restaurantPhone', '#editRestaurantPhone'];
    ids.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        // ensure attributes are set (in case server didn't add them)
        el.setAttribute('inputmode', 'numeric');
        el.setAttribute('maxlength', '11');
        el.setAttribute('pattern', '\\d{11}');

        // Strip non-digits and enforce max length while typing
        el.addEventListener('input', function () {
            const cleaned = this.value.replace(/\D+/g, '').slice(0, 11);
            if (this.value !== cleaned) this.value = cleaned;
            // clear custom validity while typing
            this.setCustomValidity('');
        });

        // On blur, validate length
        el.addEventListener('blur', function () {
            if (this.value.length === 0) {
                this.setCustomValidity('');
                return;
            }
            if (this.value.length !== 11) {
                this.setCustomValidity('Phone number must be 11 digits');
            } else {
                this.setCustomValidity('');
            }
        });

        // Show friendly message on invalid
        el.addEventListener('invalid', function () {
            if (this.value.length === 0) return; // required will show default
            this.setCustomValidity('Phone number must be 11 digits and contain numbers only');
        });
    });
}

// location modal removed

// Set up return home control visibility - always visible
function setupReturnHomeControl() {
    if (returnHomeControl) {
        const container = returnHomeControl.getContainer();
        if (container) {
            container.style.display = 'block'; // Always show
        }
    }
}

function closeMapControlPanels(exceptPanel = null) {
    const activePanels = document.querySelectorAll('.layers-panel.active, .legend-panel.active');
    activePanels.forEach(activePanel => {
        if (exceptPanel && activePanel === exceptPanel) return;
        activePanel.classList.remove('active');
        // Reset layers button icon if this is the layers panel
        if (activePanel.classList.contains('layers-panel')) {
            const btn = activePanel.closest('.layers-control')?.querySelector('.layers-btn');
            if (btn) btn.innerHTML = '<i class="fas fa-layer-group"></i>';
        }
        if (activePanel.classList.contains('legend-panel')) {
            const btn = activePanel.closest('.legend-control')?.querySelector('.legend-btn');
            if (btn) btn.innerHTML = '<i class="fas fa-list"></i>';
        }
    });
}

function registerMapControlAutoClose() {
    if (window.__fcMapControlAutoCloseBound) return;
    window.__fcMapControlAutoCloseBound = true;

    document.addEventListener('click', function(e) {
        const target = e.target;
        if (!target) return;

        const clickedButton = target.closest('button, a, [role="button"]');
        if (!clickedButton) return;

        const clickedInsideControl = target.closest('.layers-control, .legend-control, .layers-panel, .legend-panel');
        if (clickedInsideControl) return;

        closeMapControlPanels();
    }, true);
}

// Add layers control with base layers and overlay options
function addLayersControl() {
    registerMapControlAutoClose();

    class LayersControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            const container = document.createElement('div');
            container.className = 'leaflet-bar leaflet-control layers-control mapboxgl-ctrl';
            const button = document.createElement('a');
            button.className = 'layers-btn';
            button.href = '#';
            button.title = 'Map Layers';
            button.innerHTML = '<i class="fas fa-layer-group"></i>';

            const panel = document.createElement('div');
            panel.className = 'layers-panel';
            panel.innerHTML = `
                <div class="layers-panel-header">
                    <span>Map Layers</span>
                </div>
                <div class="layers-section">
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
                <div class="layers-section">
                    <div class="layers-section-title">Overlays</div>
                    <label class="layer-option">
                        <input type="checkbox" name="coverageLayer" id="coverageLayerToggle">
                        <span class="toggle-switch"></span>
                        <span>Coverage Area</span>
                    </label>
                    <label class="layer-option">
                        <input type="checkbox" name="restaurantsLayer" id="restaurantsLayerToggle" checked>
                        <span class="toggle-switch"></span>
                        <span>Pin Marks</span>
                    </label>
                    <label class="layer-option">
                        <input type="checkbox" name="statusDots" id="statusDotsToggle" checked>
                        <span class="toggle-switch"></span>
                        <span>Status Dots</span>
                    </label>
                </div>
            `;

            panel.style.position = 'absolute';
            panel.style.top = '-60px';
            panel.style.right = '60px';

            // Restore saved base layer selection
            try {
                const savedBase = localStorage.getItem(MAP_STATE_KEY + ':base');
                if (savedBase && window.mapBaseLayers && window.mapBaseLayers[savedBase]) {
                    const savedRadio = panel.querySelector(`input[name="baseLayer"][value="${savedBase}"]`);
                    if (savedRadio) {
                        panel.querySelectorAll('input[name="baseLayer"]').forEach(r => r.checked = false);
                        savedRadio.checked = true;
                    }
                }
            } catch (e) { /* ignore */ }

            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const willOpen = !panel.classList.contains('active');
                closeMapControlPanels(panel);
                if (willOpen) {
                    panel.classList.add('active');
                    button.innerHTML = '<i class="fas fa-chevron-right"></i>';
                } else {
                    panel.classList.remove('active');
                    button.innerHTML = '<i class="fas fa-layer-group"></i>';
                }
            });

            const outsideClickHandler = function(e) {
                if (!panel.classList.contains('active')) return;
                if (container.contains(e.target)) return;
                panel.classList.remove('active');
                button.innerHTML = '<i class="fas fa-layer-group"></i>';
            };
            document.addEventListener('click', outsideClickHandler);
            container._outsideClickHandler = outsideClickHandler;

            const baseRadios = panel.querySelectorAll('input[name="baseLayer"]');
            baseRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    const layerName = this.value;
                    if (window.mapBaseLayers && window.mapBaseLayers[layerName]) {
                        const styleUrl = window.mapBaseLayers[layerName];
                        if (map && typeof map.setStyle === 'function') {
                            map.__baseLayerName = layerName;
                            map.setStyle(styleUrl);
                        }
                        try {
                            localStorage.setItem(MAP_STATE_KEY + ':base', layerName);
                        } catch (e) { /* ignore */ }
                    }
                });
            });

            const coverageToggle = panel.querySelector('#coverageLayerToggle');
            if (coverageToggle) {
                coverageToggle.addEventListener('change', function() {
                    if (!coverageArea) {
                        addCoverageArea();
                    }
                    if (this.checked) {
                        addCoverageArea(true);
                        if (coverageArea && coverageArea.bounds) {
                            map.fitBounds(coverageArea.bounds, { padding: 64, maxZoom: 15, duration: 600 });
                        }
                    } else {
                        hideCoverage();
                    }
                });
            }

            const restaurantsToggle = panel.querySelector('#restaurantsLayerToggle');
            if (restaurantsToggle) {
                restaurantsToggle.addEventListener('change', function() {
                    if (this.checked) {
                        webglRestaurantLayerVisible = true;
                        showAllRestaurantMarkers();
                    } else {
                        webglRestaurantLayerVisible = false;
                        if (USE_WEBGL_RESTAURANT_MARKERS && map && map.getLayer) {
                            try {
                                if (map.getLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID)) {
                                    map.setLayoutProperty(MAPBOX_RESTAURANT_MARKER_LAYER_ID, 'visibility', 'none');
                                }
                                if (map.getLayer(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID)) {
                                    map.setLayoutProperty(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID, 'visibility', 'none');
                                }
                                if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                                    map.setLayoutProperty(MAPBOX_RESTAURANT_LABEL_LAYER_ID, 'visibility', 'none');
                                }
                            } catch (e) { /* ignore */ }
                        } else {
                            allRestaurantMarkers.forEach(marker => {
                                if (map.hasLayer(marker)) {
                                    map.removeLayer(marker);
                                }
                            });
                        }
                    }
                });
            }

            const statusDotsToggle = panel.querySelector('#statusDotsToggle');
            if (statusDotsToggle) {
                // Load saved state from localStorage
                try {
                    const hideStatusDots = localStorage.getItem(MAP_STATE_KEY + ':hideStatusDots') === 'true';
                    statusDotsToggle.checked = !hideStatusDots;
                    
                    // Apply initial state
                    if (!USE_WEBGL_RESTAURANT_MARKERS) {
                        const dots = document.querySelectorAll('.marker-status-dot');
                        dots.forEach(dot => {
                            dot.style.display = hideStatusDots ? 'none' : '';
                        });
                    }
                } catch (e) { /* ignore */ }

                statusDotsToggle.addEventListener('change', function() {
                    const showDots = this.checked;
                    
                    // Save to localStorage
                    try {
                        localStorage.setItem(MAP_STATE_KEY + ':hideStatusDots', String(!showDots));
                    } catch (e) { /* ignore */ }
                    
                    // Apply visibility
                    if (USE_WEBGL_RESTAURANT_MARKERS) {
                        addMarkersToMap(currentMarkerRestaurants);
                    } else {
                        const dots = document.querySelectorAll('.marker-status-dot');
                        dots.forEach(dot => {
                            dot.style.display = showDots ? '' : 'none';
                        });
                    }
                });
            }

            container.appendChild(button);
            container.appendChild(panel);
            this._container = container;
            return container;
        }
        onRemove() {
            if (this._container && this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            this._map = null;
        }
        getContainer() { return this._container; }
    }

    map.addControl(new LayersControl(), 'top-right');
}

function addCategoryLegendControl() {
    registerMapControlAutoClose();

    class CategoryLegendControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            const container = document.createElement('div');
            container.className = 'leaflet-bar leaflet-control legend-control mapboxgl-ctrl';

            const button = document.createElement('a');
            button.className = 'legend-btn';
            button.href = '#';
            button.title = 'Category Legend';
            button.setAttribute('aria-label', 'Category legend');
            button.innerHTML = '<i class="fas fa-list"></i>';

            const panel = document.createElement('div');
            panel.className = 'legend-panel';
            panel.innerHTML = `
                <div class="legend-panel-header">
                    <span>Legend</span>
                </div>
                <div class="legend-list"></div>
            `;

            panel.style.position = 'absolute';
            panel.style.top = '-60px';
            panel.style.right = '62px';

            const legendList = panel.querySelector('.legend-list');
            const renderLegendItems = () => {
                if (!legendList) return;
                legendList.innerHTML = '';
                const activeCategory = getActiveCategoryFilter();

                const chips = document.querySelectorAll('#categoryChipsContainer .category-chip[data-category]');
                chips.forEach(chip => {
                    const category = (chip.dataset.category || '').trim();
                    if (!category || category === 'all') return;

                    const isHidden = chip.hidden || chip.style.display === 'none';
                    if (isHidden) return;

                    const color = (chip.style.getPropertyValue('--chip-color') || '').trim() || '#6b7280';
                    const labelEl = chip.querySelector('span');
                    const label = (labelEl ? labelEl.textContent : category) || category;

                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    item.dataset.category = category;
                    item.innerHTML = `
                        <span class="legend-color-dot" style="background:${color};"></span>
                        <span class="legend-label"></span>
                    `;

                    const itemLabel = item.querySelector('.legend-label');
                    if (itemLabel) itemLabel.textContent = label.trim();
                    if (activeCategory === category) item.classList.add('active');
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        applyLegendCategoryFilter(category);
                        renderLegendItems();
                    });
                    legendList.appendChild(item);
                });
            };

            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                renderLegendItems();
                const willOpen = !panel.classList.contains('active');
                closeMapControlPanels(panel);
                if (willOpen) {
                    panel.classList.add('active');
                    button.innerHTML = '<i class="fas fa-chevron-right"></i>';
                } else {
                    panel.classList.remove('active');
                    button.innerHTML = '<i class="fas fa-list"></i>';
                }
            });

            const outsideClickHandler = function(e) {
                if (!panel.classList.contains('active')) return;
                if (container.contains(e.target)) return;
                panel.classList.remove('active');
                button.innerHTML = '<i class="fas fa-list"></i>';
            };
            document.addEventListener('click', outsideClickHandler);
            container._outsideClickHandler = outsideClickHandler;

            container.appendChild(button);
            container.appendChild(panel);
            this._container = container;
            return container;
        }
        onRemove() {
            if (this._container && this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            this._map = null;
        }
        getContainer() { return this._container; }
    }

    map.addControl(new CategoryLegendControl(), 'top-right');
}

// Add circular coverage area for Estancia
function addCoverageArea(forceAdd = false) {
    // Create Estancia municipality boundary from OSM data
    const estanciaBoundary = createEstanciaBoundaryGeoJSON();
    
    // Calculate bounds from the boundary coordinates
    let bounds = null;
    if (estanciaBoundary.geometry.type === 'MultiPolygon') {
        estanciaBoundary.geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
                ring.forEach(coord => {
                    const lng = coord[0];
                    const lat = coord[1];
                    if (!bounds) {
                        bounds = [[lng, lat], [lng, lat]];
                    } else {
                        bounds = [
                            [Math.min(bounds[0][0], lng), Math.min(bounds[0][1], lat)],
                            [Math.max(bounds[1][0], lng), Math.max(bounds[1][1], lat)]
                        ];
                    }
                });
            });
        });
    } else if (estanciaBoundary.geometry.coordinates && estanciaBoundary.geometry.coordinates[0]) {
        estanciaBoundary.geometry.coordinates[0].forEach(coord => {
            const lng = coord[0];
            const lat = coord[1];
            if (!bounds) {
                bounds = [[lng, lat], [lng, lat]];
            } else {
                bounds = [
                    [Math.min(bounds[0][0], lng), Math.min(bounds[0][1], lat)],
                    [Math.max(bounds[1][0], lng), Math.max(bounds[1][1], lat)]
                ];
            }
        });
    }

    coverageArea = {
        __fcCoverage: true,
        sourceId: MAPBOX_COVERAGE_SOURCE_ID,
        fillLayerId: MAPBOX_COVERAGE_FILL_LAYER_ID,
        lineLayerId: MAPBOX_COVERAGE_LINE_LAYER_ID,
        bounds: bounds
    };

    const coverageToggle = document.getElementById('coverageLayerToggle');
    const shouldAdd = forceAdd || (coverageToggle && coverageToggle.checked);
    if (!shouldAdd) return;
    if (!map || !map.isStyleLoaded || !map.isStyleLoaded()) return;

    try {
        if (!map.getSource(MAPBOX_COVERAGE_SOURCE_ID)) {
            map.addSource(MAPBOX_COVERAGE_SOURCE_ID, {
                type: 'geojson',
                data: estanciaBoundary
            });
        } else {
            map.getSource(MAPBOX_COVERAGE_SOURCE_ID).setData(estanciaBoundary);
        }

        if (!map.getLayer(MAPBOX_COVERAGE_FILL_LAYER_ID)) {
            map.addLayer({
                id: MAPBOX_COVERAGE_FILL_LAYER_ID,
                type: 'fill',
                source: MAPBOX_COVERAGE_SOURCE_ID,
                paint: {
                    'fill-color': '#4285f4',
                    'fill-opacity': 0.08
                }
            });
        }

        if (!map.getLayer(MAPBOX_COVERAGE_LINE_LAYER_ID)) {
            map.addLayer({
                id: MAPBOX_COVERAGE_LINE_LAYER_ID,
                type: 'line',
                source: MAPBOX_COVERAGE_SOURCE_ID,
                paint: {
                    'line-color': '#1976d2',
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });
        }

        if (!addCoverageArea._clickBound) {
            map.on('click', MAPBOX_COVERAGE_FILL_LAYER_ID, function(e) {
                // Don't show coverage popup if click was on a restaurant marker
                if (e.originalEvent && e.originalEvent.target) {
                    const target = e.originalEvent.target;
                    if (target.closest && target.closest('.fc-restaurant-marker, .fc-marker-wrapper, .user-location-marker')) return;
                }

                const lat = e.lngLat.lat.toFixed(6);
                const lng = e.lngLat.lng.toFixed(6);
                const coordStr = `${lat}, ${lng}`;

                // Show coordinates immediately with a loading placeholder for the address
                const loadingHtml = `
                    <div style="padding: 6px 8px; min-width: 160px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
                        <div style="font-weight: 600; font-size: 11px; color: #555; margin-bottom: 5px;"><i class="fas fa-spinner fa-spin" style="color: #4285f4; margin-right: 3px; font-size: 10px;"></i>Fetching address...</div>
                        <div style="display: flex; align-items: center; gap: 6px; color: #888; font-size: 10px;">
                            <span style="flex: 1;"><b style="color:#666;">Lat</b> ${lat} &nbsp;<b style="color:#666;">Lng</b> ${lng}</span>
                            <i class="fas fa-copy" title="Copy coordinates" style="cursor:pointer; color:#999; font-size:11px;" onclick="navigator.clipboard.writeText('${coordStr}').then(()=>{this.className='fas fa-check';this.style.color='#34a853';setTimeout(()=>{this.className='fas fa-copy';this.style.color='#999'},1200)}).catch(()=>{})"></i>
                        </div>
                    </div>
                `;

                if (activePopup) {
                    try { activePopup.remove(); } catch (e) {}
                }
                activePopup = new mapboxgl.Popup({ className: 'coverage-popup', maxWidth: '240px' })
                    .setLngLat(e.lngLat)
                    .setHTML(loadingHtml)
                    .addTo(map);

                // Reverse geocode using Mapbox API
                if (MAPBOX_ACCESS_TOKEN) {
                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address,poi,place,locality,neighborhood&limit=1`)
                        .then(r => r.json())
                        .then(data => {
                            let address = 'Address not found';
                            if (data.features && data.features.length > 0) {
                                address = data.features[0].place_name || data.features[0].text || address;
                            }
                            const resolvedHtml = `
                                <div style="padding: 6px 8px; min-width: 160px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
                                    <div style="color: #333; line-height: 1.3; margin-bottom: 4px;"><i class="fas fa-map-marker-alt" style="color: #ea4335; margin-right: 3px; font-size: 10px;"></i>${address}</div>
                                    <div style="display: flex; align-items: center; gap: 6px; color: #888; font-size: 10px;">
                                        <span style="flex: 1;"><b style="color:#666;">Lat</b> ${lat} &nbsp;<b style="color:#666;">Lng</b> ${lng}</span>
                                        <i class="fas fa-copy" title="Copy coordinates" style="cursor:pointer; color:#999; font-size:11px;" onclick="navigator.clipboard.writeText('${coordStr}').then(()=>{this.className='fas fa-check';this.style.color='#34a853';setTimeout(()=>{this.className='fas fa-copy';this.style.color='#999'},1200)}).catch(()=>{})"></i>
                                    </div>
                                </div>
                            `;
                            if (activePopup) {
                                activePopup.setHTML(resolvedHtml);
                            }
                        })
                        .catch(() => { /* keep the loading state with coordinates */ });
                }
            });
            addCoverageArea._clickBound = true;
        }
    } catch (err) {
        console.error('Error adding coverage area:', err);
    }
}

// Hide coverage helper: remove coverage layer and update control button state
function hideCoverage() {
    try {
        if (map && map.getLayer) {
            if (map.getLayer(MAPBOX_COVERAGE_FILL_LAYER_ID)) map.removeLayer(MAPBOX_COVERAGE_FILL_LAYER_ID);
            if (map.getLayer(MAPBOX_COVERAGE_LINE_LAYER_ID)) map.removeLayer(MAPBOX_COVERAGE_LINE_LAYER_ID);
        }
        if (map && map.getSource && map.getSource(MAPBOX_COVERAGE_SOURCE_ID)) {
            map.removeSource(MAPBOX_COVERAGE_SOURCE_ID);
        }
        // If the coverage toggle in layers panel exists, uncheck it
        const coverageToggle = document.getElementById('coverageLayerToggle');
        if (coverageToggle) {
            coverageToggle.checked = false;
        }
    } catch (e) {
        console.warn('hideCoverage failed', e);
    }
}

// Mobile sidebar toggle handling
function setupSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const focusableSelectors = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    let previousFocus = null;
    // Hold originals when blocking programmatic moves
    let _blockedOriginalMapMethods = null;
    let _sidebarSwipeInited = false;

    if (!sidebar || !toggleBtn || !overlay) {
        return;
    }

    overlay.hidden = true;

    function initSidebarSwipeToClose() {
        if (!sidebar || _sidebarSwipeInited) return;
        _sidebarSwipeInited = true;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let dragging = false;

        const onTouchStart = (e) => {
            if (!document.body.classList.contains('sidebar-open')) return;
            if (!e.touches || e.touches.length !== 1) return;
            const target = e.target;
            if (target && target.closest && target.closest('input, textarea, select')) return;
            if (target && target.closest && target.closest('.recommendation-filters')) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            dragging = true;
            sidebar.style.setProperty('transition', 'none', 'important');
        };

        const onTouchMove = (e) => {
            if (!dragging || !e.touches || e.touches.length !== 1) return;
            currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            // Only handle horizontal swipes to the left
            if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;
            if (deltaX > 0) return;

            const clamped = Math.max(deltaX, -sidebar.offsetWidth);
            sidebar.style.setProperty('transform', `translateX(${clamped}px)`, 'important');
            e.preventDefault();
        };

        const onTouchEnd = () => {
            if (!dragging) return;
            dragging = false;
            const deltaX = currentX - startX;
            sidebar.style.removeProperty('transition');
            sidebar.style.removeProperty('transform');
            if (deltaX < -80) {
                closeSidebar();
            }
        };

        sidebar.addEventListener('touchstart', onTouchStart, { passive: true });
        sidebar.addEventListener('touchmove', onTouchMove, { passive: false });
        sidebar.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    function openSidebar() {
        // Block programmatic map moves during the opening transition
        blockProgrammaticMapMoves();
        locationPromptDismissed = false;
        previousFocus = document.activeElement;
        document.body.classList.add('sidebar-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        overlay.hidden = false;
        updateLocationPermissionCard(false);
        // Prevent automatic keyboard on mobile by not focusing on input
        // Removed auto-focus on search bar for desktop mode
        document.addEventListener('keydown', handleKeydown);
        // Add outside click listeners on open to close sidebar when clicking outside (desktop only)
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        toggleBtn.classList.add('open');
        // Ensure map is invalidated and view restored after the sidebar transition finishes
        scheduleRestoreAfterSidebarTransition();
        initSidebarSwipeToClose();
    }

    function closeSidebar() {
        // Block programmatic map moves during the closing transition
        blockProgrammaticMapMoves();
        document.body.classList.remove('sidebar-open');
        locationPromptDismissed = false;
        toggleBtn.setAttribute('aria-expanded', 'false');
        overlay.hidden = true;
        document.removeEventListener('keydown', handleKeydown);
        // Remove outside click listeners when closed
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
        if (previousFocus) {
            previousFocus.focus();
        } else {
            toggleBtn.focus();
        }
        toggleBtn.classList.remove('open');
        // Ensure map is invalidated and view restored after the sidebar transition finishes
        scheduleRestoreAfterSidebarTransition();
    }

    // Restore map view after sidebar transition completes. Uses transitionend for reliability
    // and a timeout fallback in case transitionend doesn't fire.
    function scheduleRestoreAfterSidebarTransition() {
        if (!map || !sidebar) {
            // Still call refreshMapSize as a best-effort fallback
            refreshMapSize(200);
            return;
        }

        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        function restore() {
            try {
                map.invalidateSize();
                // restore view without animation to avoid visual jumps
                map.setView(currentCenter, currentZoom, { animate: false });
            } catch (e) {
                // swallow errors
            }
        }

        // Listen for transitionend on the sidebar element (fire once)
        const onTransitionEnd = function (e) {
            if (e && e.target !== sidebar) return; // only react to the sidebar's own transition
            restore();
            // restore programmatic map methods after transition completes
            restoreProgrammaticMapMoves();
        };

        sidebar.addEventListener('transitionend', onTransitionEnd, { once: true });

        // Fallback: if transitionend doesn't fire (e.g., reduced-motion or interrupted), restore after 700ms
        setTimeout(() => {
            // If transitionend already ran, this will have no visible effect
            restore();
            restoreProgrammaticMapMoves();
        }, 700);
    }

    // Replace map movement methods with no-ops to prevent moves while sidebar transitions
    function blockProgrammaticMapMoves() {
        if (!map || _blockedOriginalMapMethods) return;
        _blockedOriginalMapMethods = {
            panTo: map.panTo,
            setView: map.setView,
            flyTo: map.flyTo,
            fitBounds: map.fitBounds
        };
        try {
            map.panTo = function(){};
            map.setView = function(){};
            map.flyTo = function(){};
            map.fitBounds = function(){};
        } catch(e) { _blockedOriginalMapMethods = null; }
    }

    function restoreProgrammaticMapMoves() {
        if (!map || !_blockedOriginalMapMethods) return;
        try {
            map.panTo = _blockedOriginalMapMethods.panTo;
            map.setView = _blockedOriginalMapMethods.setView;
            map.flyTo = _blockedOriginalMapMethods.flyTo;
            map.fitBounds = _blockedOriginalMapMethods.fitBounds;
        } catch(e) { }
        _blockedOriginalMapMethods = null;
    }

    // Close the sidebar when clicking/tapping outside of it (desktop and mobile)
    function handleOutsideClick(e) {
        const target = e.target;
        // If click is inside the sidebar or the toggle button, ignore
        if (sidebar.contains(target) || toggleBtn.contains(target)) return;

        // Otherwise close the sidebar
        if (document.body.classList.contains('sidebar-open')) {
            closeSidebar();
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            closeSidebar();
        }
        if (event.key === 'Tab') {
            trapFocus(event);
        }
    }

    function trapFocus(event) {
        const focusable = sidebar.querySelectorAll(focusableSelectors);
        if (!focusable.length) return;

        const firstItem = focusable[0];
        const lastItem = focusable[focusable.length - 1];

        if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem.focus();
        }

        if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem.focus();
        }
    }

    toggleBtn.addEventListener('click', function() {
        const isOpen = document.body.classList.contains('sidebar-open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Clicking the overlay closes the sidebar
    overlay.addEventListener('click', function(e) {
        // prevent accidental clicks inside the sidebar from propagating
        if (document.body.classList.contains('sidebar-open')) closeSidebar();
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && document.body.classList.contains('sidebar-open')) {
            closeSidebar();
        }
        refreshMapSize(200);
    });
}

// Debug flag to enable verbose logging for map events
window.DEBUG_MAP_EVENTS = window.DEBUG_MAP_EVENTS || false;

// Debounced map resize invalidation to avoid rapid repeated calls
let _invalidateTimer = null;
let _isInvalidating = false;
let _invalidateCount = 0;
function refreshMapSize(delay = 0) {
    if (!map) return;
    // Debug logging
    if (window.DEBUG_MAP_EVENTS) console.debug('[refreshMapSize] requested delay=', delay, 'count=', _invalidateCount);

    // Clear any pending invalidation
    if (_invalidateTimer) {
        clearTimeout(_invalidateTimer);
        _invalidateTimer = null;
    }
    _invalidateTimer = setTimeout(() => {
        if (_isInvalidating) {
            // already running an invalidate, skip this call
            _invalidateTimer = null;
            if (window.DEBUG_MAP_EVENTS) console.debug('[refreshMapSize] skipped due to reentrancy');
            return;
        }
        _isInvalidating = true;
        _invalidateCount++;
        if (window.DEBUG_MAP_EVENTS) console.debug('[refreshMapSize] running invalidateSize count=', _invalidateCount);
        try {
            // Only invalidate the map size here; view restoration is handled
            // by scheduleRestoreAfterSidebarTransition when toggling the sidebar.
            map.invalidateSize();
        } catch (err) {
            // swallow unexpected errors to avoid cascading failures
            console.warn('refreshMapSize: invalidateSize error', err);
        } finally {
            _isInvalidating = false;
            _invalidateTimer = null;
            if (window.DEBUG_MAP_EVENTS) console.debug('[refreshMapSize] completed');
        }
    }, delay);
}

// Clear user location helper: removes marker, accuracy circle, and stops watchPosition
function clearUserLocation() {
    try {
        // Remove GL user location layers
        cleanupUserLocationGL();
        userMarker = null;

        // Remove accuracy circle if present
        if (window.userAccuracyCircle && map) {
            try { map.removeLayer(window.userAccuracyCircle); } catch (e) {}
            window.userAccuracyCircle = null;
        }

        // Clear stored user location and stop watching
        userLocation = null;
        if (userLocationWatchId !== null && navigator.geolocation && typeof navigator.geolocation.clearWatch === 'function') {
            try {
                navigator.geolocation.clearWatch(userLocationWatchId);
            } catch (e) {}
            userLocationWatchId = null;
        }

        // Restore locate button visuals if they stored original HTML
        const locateBtn = document.getElementById('locateMe');
        if (locateBtn && locateBtn.dataset && locateBtn.dataset.originalHtml) {
            locateBtn.innerHTML = locateBtn.dataset.originalHtml;
            locateBtn.disabled = false;
            delete locateBtn.dataset.originalHtml;
        }
        const currentLocBtn = document.querySelector('.current-location-btn');
        if (currentLocBtn && currentLocBtn.dataset && currentLocBtn.dataset.originalHtml) {
            currentLocBtn.innerHTML = currentLocBtn.dataset.originalHtml;
            currentLocBtn.disabled = false;
            delete currentLocBtn.dataset.originalHtml;
        }

        // Close any user popup
        try { if (map) map.closePopup(); } catch (e) {}

        // removed notification: 'User location cleared'
        // Hide the clear location control now that location is cleared
        try { hideClearLocationControl(); } catch (e) {}
        updateLocationPermissionCard(true);
    } catch (e) {
        console.warn('clearUserLocation error', e);
        notify.error('Failed to clear user location');
    }
}

// Initialize Mapbox GL map
function initializeMap() {
    const estanciaCoords = [11.456453464374693, 123.15114185203521];
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    // Restore saved map state (center/zoom/bearing) if available
    let initialCenter = estanciaCoords;
    let initialZoom = INITIAL_ZOOM;
    let initialBearing = 0;
    let hadSavedState = false;
    try {
        const saved = loadSavedMapState();
        // If a user location is stored, avoid restoring a saved map center which may
        // be the user's location — we only want to center to the user when they
        // explicitly request it.
        const hasSavedUserLocation = !!localStorage.getItem('userLocation');
        if (saved && Array.isArray(saved.center) && saved.center.length === 2 && typeof saved.zoom === 'number') {
            // Only accept saved center if it's not wildly far from Estancia
            // and we don't have a saved user location (to avoid auto-centering to it).
            const d = calculateDistance(estanciaCoords[0], estanciaCoords[1], saved.center[0], saved.center[1]);
            if (d < 200 && !hasSavedUserLocation) {
                initialCenter = saved.center;
                initialZoom = saved.zoom;
                if (typeof saved.bearing === 'number') initialBearing = saved.bearing;
                hadSavedState = true;
            }
        }
    } catch (e) {
        console.warn('Map state restore failed', e);
    }

    window.mapBaseLayers = {
        'Standard': 'mapbox://styles/kentts/cmkpgwobm002x01r8gmwofm40',
        'Streets': 'mapbox://styles/mapbox/streets-v12',
        'Satellite': 'mapbox://styles/mapbox/satellite-streets-v12',
        'Outdoors': 'mapbox://styles/mapbox/outdoors-v12'
    };

    let styleToUse = window.mapBaseLayers['Standard'];
    let initialBaseLayerName = 'Standard';
    try {
        localStorage.removeItem(MAP_STATE_KEY + ':base');
        const radio = document.querySelector('input[name="baseLayer"][value="Standard"]');
        if (radio) radio.checked = true;
    } catch (e) { /* ignore */ }

    map = new mapboxgl.Map({
        container: 'map',
        style: styleToUse,
        center: toLngLat(initialCenter),
        zoom: initialZoom,
        bearing: initialBearing,
        minZoom: 0,
        maxZoom: 22,
        attributionControl: false,
        dragRotate: true,
        pitchWithRotate: true,
        projection: 'globe'
    });
    map.__baseLayerName = initialBaseLayerName;
    map.__hadSavedState = hadSavedState;

    // Pre-warm Font Awesome canvas font as early as possible so it's ready when markers are added
    ensureFaCanvasFontReady().catch(() => {});

    // Prune stale pin cache entries from previous hours
    pruneOldPinCache();

    // Ensure the map container uses the true viewport height on mobile and reapplies padding/resizes
    function updateMapViewport() {
        try {
            const container = document.querySelector('.map-container');
            const mapEl = document.getElementById('map');
            const headerEl = document.querySelector('.header');
            const footerEl = document.querySelector('.app-footer');
            const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
            const footerH = (footerEl && getComputedStyle(footerEl).display !== 'none') ? footerEl.getBoundingClientRect().height : 0;
            const h = window.innerHeight - headerH - footerH;
            if (container) container.style.height = h + 'px';
            if (mapEl) mapEl.style.height = h + 'px';

            if (window.map && typeof window.map.resize === 'function') {
                // Reapply size and padding so tiles and controls align across viewports
                map.resize();
                const v = getComputedStyle(document.documentElement).getPropertyValue('--map-bottom-offset') || '120px';
                const offset = parseFloat(v) || 120;
                try { map.setPadding({ top: 0, bottom: offset, left: 0, right: 0 }); } catch (e) { /* ignore */ }
            }
        } catch (e) { /* ignore */ }
    }

    // Run once and keep in sync with resize/orientation changes
    updateMapViewport();
    window.addEventListener('resize', () => { updateMapViewport(); if (window.map && typeof map.resize === 'function') try { map.resize(); } catch(e) {} });
    window.addEventListener('orientationchange', () => { updateMapViewport(); if (window.map && typeof map.resize === 'function') try { map.resize(); } catch(e) {} });

    // Hide Mapbox default restaurant/hotel/lodging POIs on Standard base style
    function hideMapboxPoiIcons() {
        try {
            const style = map.getStyle && map.getStyle();
            if (!style || !Array.isArray(style.layers)) return;

            if (map.__baseLayerName !== 'Standard') return;

            style.layers.forEach(layer => {
                if (!layer || layer.type !== 'symbol') return;
                const id = (layer.id || '').toLowerCase();
                const sourceLayer = (layer['source-layer'] || '').toLowerCase();

                const isPoiLayer = (
                    id.includes('poi') ||
                    id.includes('poi-label') ||
                    id.includes('poi_label') ||
                    sourceLayer.includes('poi') ||
                    sourceLayer.includes('poi_label') ||
                    sourceLayer.includes('poi-label')
                );

                const matchesRestaurantHotel = (
                    id.includes('restaurant') ||
                    id.includes('food') ||
                    id.includes('hotel') ||
                    id.includes('lodging') ||
                    id.includes('accommodation') ||
                    sourceLayer.includes('restaurant') ||
                    sourceLayer.includes('food') ||
                    sourceLayer.includes('hotel') ||
                    sourceLayer.includes('lodging') ||
                    sourceLayer.includes('accommodation')
                );

                if (isPoiLayer && matchesRestaurantHotel) {
                    try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (e) {}
                }
            });
        } catch (e) {
            console.warn('Failed to hide Mapbox POI icons', e);
        }
    }

    // Provide Leaflet-like convenience methods used elsewhere
    const smoothEase = (t) => t * (2 - t);
    map.setView = function(center, zoom, options = {}) {
        const duration = options.animate === false ? 0 : 650;
        map.easeTo({
            center: toLngLat(center),
            zoom: typeof zoom === 'number' ? zoom : map.getZoom(),
            duration,
            easing: options.easing || smoothEase,
            essential: true
        });
    };
    map.panTo = function(center, options = {}) {
        const duration = options.animate === false ? 0 : 600;
        map.easeTo({
            center: toLngLat(center),
            duration,
            easing: options.easing || smoothEase,
            essential: true
        });
    };
    map.invalidateSize = function() { map.resize(); };
    map.closePopup = function() {
        if (activePopup) {
            try { activePopup.remove(); } catch (e) {}
            activePopup = null;
        }
    };
    map.distance = function(a, b) {
        const A = Array.isArray(a) ? { lat: a[0], lng: a[1] } : a;
        const B = Array.isArray(b) ? { lat: b[0], lng: b[1] } : b;
        if (!A || !B) return 0;
        const R = 6371000;
        const dLat = (B.lat - A.lat) * Math.PI / 180;
        const dLng = (B.lng - A.lng) * Math.PI / 180;
        const lat1 = A.lat * Math.PI / 180;
        const lat2 = B.lat * Math.PI / 180;
        const aVal = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
        return R * c;
    };

    const originalAddLayer = map.addLayer.bind(map);
    const originalRemoveLayer = map.removeLayer.bind(map);
    map.addLayer = function(layer, before) {
        if (layer && layer.__fcMarker) {
            layer.addTo(map);
            return map;
        }
        return originalAddLayer(layer, before);
    };
    map.removeLayer = function(layer) {
        if (layer && layer.__fcMarker) {
            layer.remove();
            return map;
        }
        if (typeof layer === 'string') {
            return originalRemoveLayer(layer);
        }
        return originalRemoveLayer(layer);
    };
    map.hasLayer = function(layer) {
        if (layer && layer.__fcMarker) return !!layer._added;
        return false;
    };

    // Enable standard map interactions
    map.scrollZoom.enable();
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    // Add dual scale control to the bottom-left (metric and imperial like Google Maps)
    class DualScaleControl {
        constructor(options = {}) {
            this._map = null;
            this._container = null;
            this._maxWidth = options.maxWidth || 120;
            this._metricLabel = null;
            this._imperialLabel = null;
            this._metricBar = null;
            this._imperialBar = null;
        }

        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-dual-scale';
            this._container.innerHTML = `
                <div class="dual-scale-row">
                    <div class="dual-scale-label dual-scale-metric-label"></div>
                    <div class="dual-scale-bar dual-scale-metric-bar"></div>
                </div>
                <div class="dual-scale-row">
                    <div class="dual-scale-label dual-scale-imperial-label"></div>
                    <div class="dual-scale-bar dual-scale-imperial-bar"></div>
                </div>
            `;

            this._metricLabel = this._container.querySelector('.dual-scale-metric-label');
            this._imperialLabel = this._container.querySelector('.dual-scale-imperial-label');
            this._metricBar = this._container.querySelector('.dual-scale-metric-bar');
            this._imperialBar = this._container.querySelector('.dual-scale-imperial-bar');

            this._update = this._update.bind(this);
            map.on('move', this._update);
            map.on('zoom', this._update);
            this._update();

            return this._container;
        }

        onRemove() {
            if (this._map) {
                this._map.off('move', this._update);
                this._map.off('zoom', this._update);
            }
            if (this._container && this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            this._map = null;
        }

        _getNiceScale(maxValue) {
            if (!maxValue || maxValue <= 0) return 0;
            const nice = [1, 2, 5];
            const exponent = Math.floor(Math.log10(maxValue));
            const pow10 = Math.pow(10, exponent);
            let value = nice[0] * pow10;
            for (const n of nice) {
                const v = n * pow10;
                if (v <= maxValue) value = v;
            }
            return value;
        }

        _formatKm(value) {
            if (value >= 10) return `${Math.round(value)} km`;
            return `${Math.round(value * 10) / 10} km`;
        }

        _formatMiles(value) {
            if (value >= 10) return `${Math.round(value)} mi`;
            return `${Math.round(value * 10) / 10} mi`;
        }

        _update() {
            if (!this._map || !this._metricBar || !this._imperialBar) return;

            const canvas = this._map.getCanvas();
            const y = canvas.height / 2;
            const p1 = this._map.unproject([0, y]);
            const p2 = this._map.unproject([this._maxWidth, y]);
            const maxMeters = this._map.distance(p1, p2);
            if (!maxMeters || !Number.isFinite(maxMeters)) return;

            const metricMeters = this._getNiceScale(maxMeters);
            const metricKm = metricMeters / 1000;
            const metricLabel = metricMeters >= 1000 ? this._formatKm(metricKm) : `${Math.round(metricMeters)} m`;

            const maxFeet = maxMeters * 3.28084;
            let imperialMeters = 0;
            let imperialLabel = '';
            if (maxFeet >= 5280) {
                const maxMiles = maxFeet / 5280;
                const niceMiles = this._getNiceScale(maxMiles);
                imperialMeters = niceMiles * 1609.344;
                imperialLabel = this._formatMiles(niceMiles);
            } else {
                const niceFeet = this._getNiceScale(maxFeet);
                imperialMeters = niceFeet * 0.3048;
                imperialLabel = `${Math.round(niceFeet)} ft`;
            }

            const metricWidth = Math.max(30, Math.round((metricMeters / maxMeters) * this._maxWidth));
            const imperialWidth = Math.max(30, Math.round((imperialMeters / maxMeters) * this._maxWidth));

            this._metricBar.style.width = `${metricWidth}px`;
            this._imperialBar.style.width = `${imperialWidth}px`;
            this._metricLabel.textContent = metricLabel;
            this._imperialLabel.textContent = imperialLabel;
            this._container.dataset.metricKm = (metricMeters / 1000).toString();
        }
    }

    map.addControl(new DualScaleControl({ maxWidth: 120 }), 'bottom-left');

    // Keep zooming unrestricted for all users
    try {
        if (typeof map.setMinZoom === 'function') map.setMinZoom(0);
        if (typeof map.setMaxZoom === 'function') map.setMaxZoom(22);
        if (typeof map.setMaxBounds === 'function') map.setMaxBounds(null);
    } catch (e) { /* ignore */ }

    // Ensure the map renders to the full container after layout/visibility changes
    map.on('load', () => {
        // Hide loading animation when map is fully loaded
        hidePageLoading();
        
        try { map.resize(); } catch (e) { /* ignore */ }
        try {
            if (typeof map.setProjection === 'function') {
                map.setProjection('globe');
            }
        } catch (e) { /* ignore */ }

        // Apply bottom padding so map content is shifted up above controls (scale, buttons)
        function applyMapPadding() {
            try {
                const v = getComputedStyle(document.documentElement).getPropertyValue('--map-bottom-offset') || '120px';
                const offset = parseFloat(v) || 120;
                map.setPadding({ top: 0, bottom: offset, left: 0, right: 0 });
            } catch (err) { /* ignore */ }
        }
        applyMapPadding();
        window.addEventListener('resize', () => { try { applyMapPadding(); map.resize(); } catch (e) {} });
        hideMapboxPoiIcons();
    });

    map.on('error', (e) => {
        console.warn('Mapbox GL error', e && e.error ? e.error : e);
        try { notify.error('Map failed to load. Check your Mapbox token or style.'); } catch (err) {}
    });
    window.addEventListener('resize', () => {
        try { map.resize(); } catch (e) { /* ignore */ }
    });

    // Detect manual user interactions to pause navigation auto-follow
    try {
        const container = map.getContainer();
        const setManualFalse = () => { setTimeout(() => { manualMapInteraction = false; }, 250); };

        container.addEventListener('pointerdown', () => { manualMapInteraction = true; });
        container.addEventListener('touchstart', () => { manualMapInteraction = true; });
        container.addEventListener('wheel', () => { manualMapInteraction = true; setManualFalse(); }, { passive: true });
        container.addEventListener('pointerup', setManualFalse);
        container.addEventListener('touchend', setManualFalse);

        const setTrueOnUser = (ev) => { if (ev && ev.originalEvent) { manualMapInteraction = true; } };
        const setFalseDelayed = () => { setTimeout(() => { manualMapInteraction = false; }, 250); };
        const closePopupOnMoveStart = () => {
            try { if (map && typeof map.closePopup === 'function') map.closePopup(); } catch (e) { /* ignore */ }
        };
        map.on('movestart', setTrueOnUser);
        map.on('zoomstart', setTrueOnUser);
        map.on('rotatestart', setTrueOnUser);
        map.on('movestart', closePopupOnMoveStart);
        map.on('zoomstart', closePopupOnMoveStart);
        map.on('rotatestart', closePopupOnMoveStart);
        map.on('rotatestart', function(ev) {
            try {
                manualMapInteraction = true;
            } catch (e) { /* ignore */ }
        });
        map.on('moveend', setFalseDelayed);
        map.on('zoomend', setFalseDelayed);
        map.on('rotateend', setFalseDelayed);
    } catch (e) {
        console.warn('Failed to attach manual interaction listeners', e);
    }

    // Persist map state (center/zoom/bearing) after interactions
    const persistState = () => saveMapState();
    map.on('moveend', persistState);
    map.on('zoomend', persistState);
    map.on('rotateend', persistState);

    // Toggle marker label visibility based on zoom level for readability
    map.on('zoomstart', () => {
        lastLabelHideState = null;
        lastMarkerHideState = null;
        allRestaurantMarkers.forEach(marker => {
            const label = document.querySelector(`.marker-label[data-restaurant-id='${marker.restaurantId}']`);
            if (!label) return;
            label.style.opacity = '0';
            label.style.pointerEvents = 'none';
        });
    });
    map.on('zoomend', () => updateMarkerLabelVisibility());
    map.on('moveend', () => updateMarkerLabelVisibility());

    // Re-add custom layers after style changes
    map.on('style.load', () => {
        if (coverageArea) addCoverageArea();
        if (routeLine && routeLine.coordinates) renderRouteLine(routeLine.coordinates, routeLine.meta);
        hideMapboxPoiIcons();
        if (USE_WEBGL_RESTAURANT_MARKERS && Array.isArray(currentMarkerRestaurants) && currentMarkerRestaurants.length > 0) {
            addMarkersToMap(currentMarkerRestaurants);
        }
        // Re-add user location GL marker if it was active
        if (userMarker && userLocation) {
            userMarker = null; // reset flag so displayUserLocationMarker re-creates layers
            displayUserLocationMarker(userLocation);
        }
        // Re-add route step GL markers if active
        if (_routeStepFeatures.length > 0) {
            renderRouteStepMarkersGL(_routeStepFeatures);
        }
    });

    // Set map bounds to prevent zooming out too far
    setMapBounds();
}

/* One-time welcome modal: shows on first visit and hides permanently when user clicks Continue */
(function(){
    function showModal(modal){
        if(!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden','false');
        try { document.body.style.overflow = 'hidden'; } catch(e) {}
    }

    function hideModal(modal){
        if(!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden','true');
        try { document.body.style.overflow = ''; } catch(e) {}
    }

    document.addEventListener('DOMContentLoaded', function(){
        // --- Search button progressive retraction ---
        (function(){
            var btn = document.getElementById('mapSearchBtn');
            if (!btn) return;
            var header = btn.closest('.header-inner') || btn.closest('header');
            if (!header) return;
            var brand = header.querySelector('.brand');
            var label = btn.querySelector('.map-search-label');
            var resizeTimer = null;

            // Keep the existing responsive width behavior.
            // Hide the label entirely whenever the full text no longer fits.
            var FULL_W = 108, CIRC_W = 36, HEIGHT = 36;

            function applyState(t, showLabel) {
                var w   = CIRC_W + t * (FULL_W - CIRC_W);
                var pad = Math.round(t * 18);
                var br  = Math.round(18 + t * (999 - 18));

                btn.classList.toggle('icon-only', !showLabel);

                btn.style.width        = w + 'px';
                btn.style.height       = HEIGHT + 'px';
                btn.style.padding      = '0 ' + pad + 'px';
                btn.style.borderRadius = br + 'px';
                if (label) {
                    label.style.maxWidth   = showLabel ? '80px' : '0';
                    label.style.opacity    = showLabel ? '1' : '0';
                    label.style.marginLeft = showLabel ? '6px' : '0';
                }
            }

            function update(animate) {
                var cs     = window.getComputedStyle(header);
                var headerW = header.getBoundingClientRect().width;
                var padL   = parseFloat(cs.paddingLeft)  || 0;
                var padR   = parseFloat(cs.paddingRight) || 0;
                var gap    = parseFloat(cs.gap)          || 0;
                var brandW = brand ? brand.getBoundingClientRect().width : 0;

                // Space the button can actually use
                var available = headerW - padL - padR - brandW - gap;

                var t = Math.max(0, Math.min(1, (available - CIRC_W) / (FULL_W - CIRC_W)));
                var showLabel = t >= 0.999;

                if (animate) {
                    // During drag: no transition — JS IS the animation
                    btn.classList.add('retracting');
                    applyState(t, showLabel);
                } else {
                    // Initial load or resize-end: allow CSS transition
                    btn.classList.remove('retracting');
                    applyState(t, showLabel);
                }
            }

            // Initial render with transition
            update(false);

            if (window.ResizeObserver) {
                new ResizeObserver(function() {
                    // While actively resizing, suppress CSS transitions so state tracks finger
                    update(true);
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function(){ update(false); }, 150);
                }).observe(header);
            } else {
                window.addEventListener('resize', function() {
                    update(true);
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function(){ update(false); }, 150);
                });
            }
        })();
        // -----------------------------------------

        try {
            const modal = document.getElementById('locationModal');
            const btn = document.getElementById('continueBtn');
            if (!modal || !btn) return;

            // Only show if the user hasn't used (clicked Continue) before
            const shown = localStorage.getItem('fc_welcome_shown');
            if (!shown) {
                showModal(modal);
                // ensure the button is focusable and clickable
                btn.tabIndex = 0;
                btn.focus();
            } else {
                hideModal(modal);
            }

            btn.addEventListener('click', function(e){
                try { localStorage.setItem('fc_welcome_shown', '1'); } catch(err) {}
                hideModal(modal);
            });
        } catch (e) {
            // fail silently
            console.warn('welcome modal init failed', e);
        }
    });
})();

// Center map on popup/marker (debounced for smoothness)
let _popupCenterRaf = null;
let _lastPopupCenterAt = 0;
let _lastPopupCenterId = null;
function centerOnPopup(marker, options = {}) {
    if (!map || !marker) return;
    if (manualMapInteraction && !options.force) {
        return;
    }
    let latLng = null;
    if (marker.getLngLat) {
        const lngLat = marker.getLngLat();
        if (lngLat) latLng = [lngLat.lat, lngLat.lng];
    } else if (marker.getLatLng) {
        const ll = marker.getLatLng();
        if (ll) latLng = [ll.lat, ll.lng];
    }
    if (!latLng) return;

    // Avoid rapid re-centering for the same marker
    const markerId = marker.restaurantId || null;
    const now = Date.now();
    if (!options.force && markerId && markerId === _lastPopupCenterId && (now - _lastPopupCenterAt) < 450) {
        return;
    }

    // Skip if already close to target center (prevents jitter)
    try {
        const center = map.getCenter ? map.getCenter() : null;
        if (center) {
            const distMeters = typeof map.distance === 'function'
                ? map.distance([center.lat, center.lng], [latLng[0], latLng[1]])
                : (typeof calculateDistance === 'function'
                    ? calculateDistance(center.lat, center.lng, latLng[0], latLng[1]) * 1000
                    : null);
            const minMeters = typeof options.minDistanceMeters === 'number' ? options.minDistanceMeters : 8;
            if (distMeters !== null && distMeters < minMeters) {
                return;
            }
        }
    } catch (e) { /* ignore */ }

    if (_popupCenterRaf) {
        cancelAnimationFrame(_popupCenterRaf);
        _popupCenterRaf = null;
    }

    _popupCenterRaf = requestAnimationFrame(() => {
        _popupCenterRaf = null;
        try { if (typeof map.stop === 'function') map.stop(); } catch (e) { /* ignore */ }
        if (typeof map.easeTo === 'function') {
            const ease = options.easing || ((t) => 1 - Math.pow(1 - t, 3));
            map.easeTo({
                center: toLngLat(latLng),
                duration: typeof options.duration === 'number' ? options.duration : 750,
                easing: ease,
                essential: true
            });
        } else if (typeof map.panTo === 'function') {
            map.panTo(latLng, { animate: true, duration: 0.75 });
        }
        _lastPopupCenterAt = Date.now();
        _lastPopupCenterId = markerId;
    });
}

// Open a restaurant popup by id and gently center it
function openRestaurantPopupById(restaurantId, options = {}) {
    const { delay = 80, centerDelay = 40 } = options;
    if (!map || !Array.isArray(markers)) return false;

    const marker = markers.find(m => Number(m.restaurantId) === Number(restaurantId));
    if (!marker) return false;

    try { map.closePopup(); } catch (e) {}

    setTimeout(() => {
        try {
            marker.openPopup();
        } catch (err) {
            console.warn('Failed to open popup for restaurant', restaurantId, err);
        }
    }, delay);

    return true;
}

// Set map bounds
function setMapBounds() {
    const estanciaCenter = [11.456453464374693, 123.15114185203521];
    const maxRadius = 100000;
    
    map.on('dragstart', function() {
        // Close any open popups when user starts dragging
        if (map && typeof map.closePopup === 'function') map.closePopup();
    });
}

// Smooth wheel zoom handler: replaces native scrollWheelZoom with a
// Google Maps-like smooth, continuous zoom that zooms toward the cursor.
function enableSmoothWheel() {
    if (!map) return;
    try {
        if (map.scrollZoom && typeof map.scrollZoom.enable === 'function') {
            map.scrollZoom.enable();
        }
    } catch (e) {
        console.warn('enableSmoothWheel failed', e);
    }
}

// Smooth marker animation function - animates marker from current position to target
// Duration is now dynamic based on estimated user speed for responsive tracking
function animateMarkerToPosition(marker, targetLat, targetLng, duration = 300) {
    if (!marker) return;
    
    // Cancel any existing animation
    if (userMarkerAnimationFrame) {
        cancelAnimationFrame(userMarkerAnimationFrame);
        userMarkerAnimationFrame = null;
    }
    
    const currentLngLat = typeof marker.getLngLat === 'function'
        ? marker.getLngLat()
        : (typeof marker.getLatLng === 'function' ? marker.getLatLng() : null);
    if (!currentLngLat) return;
    const startLat = currentLngLat.lat;
    const startLng = currentLngLat.lng;
    const startTime = performance.now();
    
    // Always use linear interpolation – easing causes the marker to lag behind
    const easingFn = (t) => t;
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        
        // Interpolate position
        const newLat = startLat + (targetLat - startLat) * easedProgress;
        const newLng = startLng + (targetLng - startLng) * easedProgress;
        
        // Update marker position
        if (typeof marker.setLngLat === 'function') {
            marker.setLngLat([newLng, newLat]);
        } else if (typeof marker.setLatLng === 'function') {
            marker.setLatLng({ lat: newLat, lng: newLng });
        }
        
        // Also update route progress during animation for smooth sync
        if (routeLine && map && progress < 1) {
            updateRouteProgress(newLat, newLng);
        }
        
        if (progress < 1) {
            userMarkerAnimationFrame = requestAnimationFrame(animate);
        } else {
            userMarkerAnimationFrame = null;
            // Final route progress update at exact target position
            if (routeLine && map) {
                updateRouteProgress(targetLat, targetLng);
            }
        }
    }
    
    userMarkerAnimationFrame = requestAnimationFrame(animate);
}

// Animation frame for navigation marker (separate from user marker)
let navigationMarkerAnimationFrame = null;

// Smooth animation for navigation marker during turn-by-turn navigation
function animateNavigationMarkerToPosition(marker, targetLat, targetLng, duration = 200) {
    if (!marker) return;
    
    // Cancel any existing navigation animation
    if (navigationMarkerAnimationFrame) {
        cancelAnimationFrame(navigationMarkerAnimationFrame);
        navigationMarkerAnimationFrame = null;
    }
    
    const currentLngLat = typeof marker.getLngLat === 'function'
        ? marker.getLngLat()
        : (typeof marker.getLatLng === 'function' ? marker.getLatLng() : null);
    if (!currentLngLat) {
        // Fallback to direct set if can't get current position
        if (typeof marker.setLngLat === 'function') {
            marker.setLngLat([targetLng, targetLat]);
        } else if (typeof marker.setLatLng === 'function') {
            marker.setLatLng([targetLat, targetLng]);
        }
        return;
    }
    
    const startLat = currentLngLat.lat;
    const startLng = currentLngLat.lng;
    const startTime = performance.now();
    
    // Use linear interpolation for smooth, responsive navigation tracking
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Interpolate position
        const newLat = startLat + (targetLat - startLat) * progress;
        const newLng = startLng + (targetLng - startLng) * progress;
        
        // Update marker position
        if (typeof marker.setLngLat === 'function') {
            marker.setLngLat([newLng, newLat]);
        } else if (typeof marker.setLatLng === 'function') {
            marker.setLatLng([newLat, newLng]);
        }
        
        // Update route progress during animation for sync
        if (routeLine && map) {
            updateRouteProgress(newLat, newLng);
        }
        
        if (progress < 1) {
            navigationMarkerAnimationFrame = requestAnimationFrame(animate);
        } else {
            navigationMarkerAnimationFrame = null;
        }
    }
    
    navigationMarkerAnimationFrame = requestAnimationFrame(animate);
}

// Display user location marker (used for restored locations)
function displayUserLocationMarker(location) {
    if (!map || !location || !location.lat || !location.lng) {
        return;
    }

    const coords = [location.lng, location.lat];
    const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} }] };

    // If source already exists, just update it
    if (map.getSource(MAPBOX_USER_LOCATION_SOURCE_ID)) {
        map.getSource(MAPBOX_USER_LOCATION_SOURCE_ID).setData(geojson);
        userMarker = true;
        try { showClearLocationControl(); } catch (e) {}
        return;
    }

    // Add GeoJSON source
    map.addSource(MAPBOX_USER_LOCATION_SOURCE_ID, { type: 'geojson', data: geojson });

    // Pulsing ring layer
    map.addLayer({
        id: MAPBOX_USER_PULSE_LAYER_ID,
        type: 'circle',
        source: MAPBOX_USER_LOCATION_SOURCE_ID,
        paint: {
            'circle-radius': 20,
            'circle-color': 'rgba(51, 136, 255, 0.25)',
            'circle-opacity': 0.6,
            'circle-radius-transition': { duration: 0 },
            'circle-opacity-transition': { duration: 0 }
        }
    });

    // White outline ring
    map.addLayer({
        id: MAPBOX_USER_OUTLINE_LAYER_ID,
        type: 'circle',
        source: MAPBOX_USER_LOCATION_SOURCE_ID,
        paint: {
            'circle-radius': 10,
            'circle-color': '#ffffff',
            'circle-opacity': 1
        }
    });

    // Blue dot
    map.addLayer({
        id: MAPBOX_USER_DOT_LAYER_ID,
        type: 'circle',
        source: MAPBOX_USER_LOCATION_SOURCE_ID,
        paint: {
            'circle-radius': 7,
            'circle-color': '#3388ff',
            'circle-opacity': 1
        }
    });

    // Start pulse animation
    startUserPulseAnimation();

    // Click handler for popup
    map.on('click', MAPBOX_USER_DOT_LAYER_ID, function (e) {
        const acc = userLocationAccuracy || 50;
        const loc = userLocation || location;
        if (userLocationPopup) { try { userLocationPopup.remove(); } catch (_) {} }
        userLocationPopup = new mapboxgl.Popup({ offset: 12, closeButton: true, maxWidth: '220px' })
            .setLngLat([loc.lng, loc.lat])
            .setHTML(buildUserPopupHTML(loc, acc))
            .addTo(map);
    });
    map.on('mouseenter', MAPBOX_USER_DOT_LAYER_ID, function () {
        const c = map.getCanvas(); if (c) c.style.cursor = 'pointer';
    });
    map.on('mouseleave', MAPBOX_USER_DOT_LAYER_ID, function () {
        const c = map.getCanvas(); if (c) c.style.cursor = '';
    });

    userMarker = true; // flag that GL marker exists

    // Show the Clear Location control now that user location is available
    try { showClearLocationControl(); } catch (e) { /* ignore */ }
}

// Build popup HTML for user location marker
function buildUserPopupHTML(loc, accuracy) {
    return `<div class="user-location-popup-card">
        <div class="user-location-popup-header">
            <span class="user-location-popup-icon">📍</span>
            <strong class="user-location-popup-title">Your Location</strong>
        </div>
        <div class="user-location-popup-body">
            <div class="user-location-popup-row">
                <span class="user-location-popup-label">Lat:</span>
                <span class="user-location-popup-value">${loc.lat.toFixed(5)}</span>
            </div>
            <div class="user-location-popup-row">
                <span class="user-location-popup-label">Lng:</span>
                <span class="user-location-popup-value">${loc.lng.toFixed(5)}</span>
            </div>
            <div class="user-location-popup-row user-location-popup-row-accuracy">
                <span class="user-location-popup-label">Accuracy:</span>
                <span class="user-location-popup-badge" style="background: ${getAccuracyColor(accuracy)};">${getAccuracyLevel(accuracy)}</span>
            </div>
        </div>
    </div>`;
}

// Animate the pulsing ring around the user dot
function startUserPulseAnimation() {
    if (userLocationPulseFrame) cancelAnimationFrame(userLocationPulseFrame);
    const startTime = performance.now();
    function tick(now) {
        if (!map || !map.getLayer(MAPBOX_USER_PULSE_LAYER_ID)) { userLocationPulseFrame = null; return; }
        const t = ((now - startTime) % 2000) / 2000; // 0→1 over 2 seconds, repeating
        const radius = 10 + 16 * t;   // 10 → 26
        const opacity = 0.55 * (1 - t); // 0.55 → 0
        try {
            map.setPaintProperty(MAPBOX_USER_PULSE_LAYER_ID, 'circle-radius', radius);
            map.setPaintProperty(MAPBOX_USER_PULSE_LAYER_ID, 'circle-opacity', opacity);
        } catch (_) {}
        userLocationPulseFrame = requestAnimationFrame(tick);
    }
    userLocationPulseFrame = requestAnimationFrame(tick);
}

// Smooth animation state for user location marker
let _userLocAnimFrame = null;
let _userLocFrom = null; // [lng, lat]
let _userLocTo = null;   // [lng, lat]
let _userLocAnimStart = null;
const _USER_LOC_ANIM_DURATION = 800; // ms

function _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function _animateUserLoc() {
    if (!map) return;
    const src = map.getSource(MAPBOX_USER_LOCATION_SOURCE_ID);
    if (!src || !_userLocFrom || !_userLocTo) return;

    const now = performance.now();
    const elapsed = now - _userLocAnimStart;
    const t = _easeOutCubic(Math.min(elapsed / _USER_LOC_ANIM_DURATION, 1));

    const lng = _userLocFrom[0] + (_userLocTo[0] - _userLocFrom[0]) * t;
    const lat = _userLocFrom[1] + (_userLocTo[1] - _userLocFrom[1]) * t;

    src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }] });

    if (t < 1) {
        _userLocAnimFrame = requestAnimationFrame(_animateUserLoc);
    } else {
        _userLocAnimFrame = null;
        _userLocFrom = _userLocTo.slice();
    }
}

// Update GL user marker position with smooth interpolation
function updateUserLocationGL(lat, lng) {
    if (!map) return;
    const src = map.getSource(MAPBOX_USER_LOCATION_SOURCE_ID);
    if (!src) return;

    // Cancel any running animation and capture current mid-animation position as new start
    if (_userLocAnimFrame) {
        cancelAnimationFrame(_userLocAnimFrame);
        _userLocAnimFrame = null;
        // Interpolate to the current rendered position so the new animation starts from there
        if (_userLocFrom && _userLocTo && _userLocAnimStart !== null) {
            const elapsed = performance.now() - _userLocAnimStart;
            const t = _easeOutCubic(Math.min(elapsed / _USER_LOC_ANIM_DURATION, 1));
            _userLocFrom = [
                _userLocFrom[0] + (_userLocTo[0] - _userLocFrom[0]) * t,
                _userLocFrom[1] + (_userLocTo[1] - _userLocFrom[1]) * t
            ];
        }
    }

    // Determine start position (current rendered position or same as target on first update)
    if (!_userLocFrom) {
        // First update — snap instantly
        _userLocFrom = [lng, lat];
        src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }] });
    } else {
        _userLocTo = [lng, lat];
        _userLocAnimStart = performance.now();
        _userLocAnimFrame = requestAnimationFrame(_animateUserLoc);
    }

    // Update open popup position if any
    if (userLocationPopup && userLocationPopup.isOpen()) {
        userLocationPopup.setLngLat([lng, lat]);
        userLocationPopup.setHTML(buildUserPopupHTML({ lat, lng }, userLocationAccuracy || 50));
    }
}

// Cleanup GL user location layers
function cleanupUserLocationGL() {
    if (userLocationPulseFrame) { cancelAnimationFrame(userLocationPulseFrame); userLocationPulseFrame = null; }
    if (_userLocAnimFrame) { cancelAnimationFrame(_userLocAnimFrame); _userLocAnimFrame = null; }
    _userLocFrom = null; _userLocTo = null;
    if (userLocationPopup) { try { userLocationPopup.remove(); } catch (_) {} userLocationPopup = null; }
    if (!map) return;
    try { if (map.getLayer(MAPBOX_USER_DOT_LAYER_ID)) map.removeLayer(MAPBOX_USER_DOT_LAYER_ID); } catch (_) {}
    try { if (map.getLayer(MAPBOX_USER_OUTLINE_LAYER_ID)) map.removeLayer(MAPBOX_USER_OUTLINE_LAYER_ID); } catch (_) {}
    try { if (map.getLayer(MAPBOX_USER_PULSE_LAYER_ID)) map.removeLayer(MAPBOX_USER_PULSE_LAYER_ID); } catch (_) {}
    try { if (map.getSource(MAPBOX_USER_LOCATION_SOURCE_ID)) map.removeSource(MAPBOX_USER_LOCATION_SOURCE_ID); } catch (_) {}
}

// Enhanced locate user function that returns a Promise - UPDATED to use watchPosition for continuous tracking
// By default `suppressCenter` is true so locating does not auto-center the map.
function locateUser(options = {}) {
    let { suppressCenter = true, timeoutMs = 9000 } = options; // if true, do not center map when receiving location updates

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        // Skip loading modal so geolocation runs quietly in the background

        // Show loading state for both buttons
        const locateBtns = [
            document.getElementById('locateMe'),
            document.querySelector('.current-location-btn')
        ].filter(btn => btn !== null);

        locateBtns.forEach(btn => {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            btn.dataset.originalHtml = originalHtml;
        });

        // Clear existing watch if any
        if (userLocationWatchId !== null) {
            navigator.geolocation.clearWatch(userLocationWatchId);
        }

        let settled = false;
        let timeoutHandle = null;

        const finalize = (err, loc) => {
            if (settled) return;
            settled = true;
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
            if (err) {
                reject(err);
                return;
            }
            resolve(loc);
        };

        // Function to update user location with smoothing and jump filtering
        function updateUserLocation(position) {
            const rawAcc = (position.coords.accuracy || 1000);
            const rawLat = position.coords.latitude;
            const rawLng = position.coords.longitude;
            const rawSpeed = position.coords.speed; // speed in m/s if available
            const now = Date.now();

            // Calculate speed from raw positions for more accurate speed estimation
            let calculatedSpeed = 0;
            if (userLocationLastRawPos && userLocationLastTimestamp > 0) {
                const timeDelta = (now - userLocationLastTimestamp) / 1000; // seconds
                if (timeDelta > 0 && timeDelta < 10) { // ignore if too old
                    const distMeters = calculateDistance(
                        userLocationLastRawPos.lat, 
                        userLocationLastRawPos.lng, 
                        rawLat, 
                        rawLng
                    ) * 1000;
                    calculatedSpeed = distMeters / timeDelta;
                }
            }
            
            // Use GPS-reported speed if available and reasonable, otherwise use calculated
            if (typeof rawSpeed === 'number' && rawSpeed >= 0 && !Number.isNaN(rawSpeed)) {
                // Blend GPS speed with calculated speed for smoother transitions
                userLocationSpeed = rawSpeed * 0.7 + calculatedSpeed * 0.3;
            } else {
                userLocationSpeed = calculatedSpeed;
            }
            
            // Store raw position for next speed calculation
            userLocationLastRawPos = { lat: rawLat, lng: rawLng };
            userLocationLastTimestamp = now;

            // If accuracy is very poor, ignore update unless we have no fix yet
            // But allow larger accuracy if moving fast (GPS accuracy degrades at speed)
            const maxAcceptableAccuracy = userLocationSpeed > 10 ? 500 : 200;
            if (rawAcc > maxAcceptableAccuracy && userLocation) {
                return;
            }

            const sample = {
                lat: rawLat,
                lng: rawLng,
                accuracy: rawAcc,
                ts: now
            };

            // Push into circular buffer and keep recent samples
            userLocationBuffer.push(sample);
            if (userLocationBuffer.length > userLocationBufferSize) userLocationBuffer.shift();

            // Drop old samples - shorter window when moving for near-realtime tracking
            const maxAge = userLocationSpeed > 3 ? 3000 : 10000;
            userLocationBuffer = userLocationBuffer.filter(s => (now - s.ts) < maxAge);

            // Use raw position when moving for zero-lag tracking;
            // only apply light smoothing when stationary to reduce GPS jitter
            let smoothLat, smoothLng, smoothAcc;
            
            if (userLocationSpeed > 3) {
                // Any noticeable movement: use raw GPS position directly (no smoothing delay)
                smoothLat = rawLat;
                smoothLng = rawLng;
                smoothAcc = Math.max(5, rawAcc);
            } else if (userLocationBuffer.length >= 2) {
                // Stationary / very slow: light weighted average for jitter reduction
                const recentSamples = userLocationBuffer.slice(-3);
                let wSum = 0, latSum = 0, lngSum = 0, accSum = 0;
                recentSamples.forEach(s => {
                    const a = Math.max(s.accuracy, 5);
                    const w = 1 / a;
                    latSum += s.lat * w;
                    lngSum += s.lng * w;
                    wSum += w;
                    accSum += s.accuracy;
                });
                smoothLat = latSum / wSum;
                smoothLng = lngSum / wSum;
                smoothAcc = Math.max(5, accSum / recentSamples.length);
            } else {
                // First sample: use raw
                smoothLat = rawLat;
                smoothLng = rawLng;
                smoothAcc = Math.max(5, rawAcc);
            }

            const smoothedLocation = { lat: smoothLat, lng: smoothLng };

            const jumpKm = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, smoothedLocation.lat, smoothedLocation.lng) : 0;

            // Only reject truly impossible jumps (teleportation-level GPS glitches)
            // Very permissive so the marker stays responsive during real movement
            const maxReasonableJump = Math.max(0.1, userLocationSpeed * 8 / 1000); // 8 seconds of travel or 100m minimum
            if (userLocation && jumpKm > maxReasonableJump && smoothAcc >= (userLocationAccuracy || 1) * 3) {
                console.warn('Ignored potential GPS glitch', { jumpMeters: Math.round(jumpKm * 1000), maxMeters: Math.round(maxReasonableJump * 1000), speed: userLocationSpeed });
                if (smoothAcc < (userLocationAccuracy || Infinity)) userLocationAccuracy = smoothAcc;
                return;
            }

            // Accept smoothed location
            const prevLocation = userLocation;
            userLocation = smoothedLocation;
            window.userLocation = smoothedLocation;
            userLocationAccuracy = smoothAcc;

            try { updateRecommendationFilterAvailability(); } catch (e) { /* ignore */ }
            try { updateSearchResultFilterAvailability(); } catch (e) { /* ignore */ }

            // Create user location marker HTML
            // If marker doesn't exist, create it via GL layers
            if (!userMarker) {
                displayUserLocationMarker(userLocation);
            } else {
                // Update GL source position directly
                updateUserLocationGL(userLocation.lat, userLocation.lng);
            }

            // Optional map follow: auto-center and rotate to face route when enabled
            if (mapFollowEnabled && map && !manualMapInteraction) {
                try {
                    // Get bearing from route if available
                    const routeBearing = getRouteBearingFromUser(userLocation.lat, userLocation.lng);
                    const targetBearing = routeBearing !== null ? routeBearing : (map.getBearing ? map.getBearing() : 0);
                    
                    // Dynamic map follow duration based on speed
                    const followDuration = userLocationSpeed > 10 ? 300 : (userLocationSpeed > 5 ? 500 : 700);
                    
                    if (typeof map.easeTo === 'function') {
                        map.easeTo({
                            center: [userLocation.lng, userLocation.lat],
                            bearing: targetBearing,
                            duration: followDuration,
                            easing: (t) => t * (2 - t),
                            essential: true
                        });
                    } else if (typeof map.panTo === 'function') {
                        map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: followDuration / 1000 });
                        if (typeof map.setBearing === 'function') {
                            map.setBearing(targetBearing);
                        }
                    } else if (typeof map.setView === 'function') {
                        map.setView([userLocation.lat, userLocation.lng], map.getZoom ? map.getZoom() : INITIAL_ZOOM, { animate: true });
                        if (typeof map.setBearing === 'function') {
                            map.setBearing(targetBearing);
                        }
                    }
                } catch (e) { /* ignore */ }
            }

            // Update travelled route (grey) while tracking
            // Animation handles progress updates during movement; this covers the initial marker creation
            if (routeLine && map && !userMarkerAnimationFrame) {
                updateRouteProgress(userLocation.lat, userLocation.lng);
            }

            // Rotate map toward the next segment when reaching a turn point
            if ((mapFollowEnabled || navigationActive) && routeStepPoints.length > 0 && currentRouteStepIndex < routeStepPoints.length && map && typeof map.distance === 'function') {
                const step = routeStepPoints[currentRouteStepIndex];
                const distToStep = map.distance([userLocation.lng, userLocation.lat], [step.lng, step.lat]);
                if (distToStep <= 20) {
                    try {
                        if (typeof map.setBearing === 'function') {
                            const nextBearing = getRouteBearingFromUser(userLocation.lat, userLocation.lng);
                            map.setBearing(nextBearing !== null ? nextBearing : 0);
                        }
                    } catch (e) { /* ignore */ }
                    currentRouteStepIndex += 1;
                }
            }

            // Remove accuracy circle if it exists (replaced by pulsing waves)
            if (window.userAccuracyCircle) {
                try { map.removeLayer(window.userAccuracyCircle); } catch (e) {}
                window.userAccuracyCircle = null;
            }

            // Show the Clear Location control now that user location is available
            try { showClearLocationControl(); } catch (e) { /* ignore */ }

            // Always hide loading modal on first successful location update
            hideLoadingModal();

            // Restore button states if they were modified
            locateBtns.forEach(btn => {
                if (btn && btn.dataset && btn.dataset.originalHtml) {
                    btn.innerHTML = btn.dataset.originalHtml;
                    btn.disabled = false;
                    delete btn.dataset.originalHtml;
                }
            });

            // Save to localStorage that user has allowed location
            localStorage.setItem('locationPermissionAsked', 'allowed');
            localStorage.setItem('locationTrackingEnabled', 'true');
            
            // Save current location to localStorage for persistence across refreshes
            try {
                localStorage.setItem('userLocation', JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng }));
            } catch (e) { /* ignore */ }

            // Finalize promise on first success (only once)
            if (!settled) {
                // Reload restaurants to show nearest 5 (only first time)
                if (typeof loadRestaurants === 'function') {
                    loadRestaurants();
                }
                finalize(null, userLocation);
            } else {
                // If location changed significantly (beyond previous threshold), refresh restaurants
                const significantChange = !prevLocation || calculateDistance(prevLocation.lat, prevLocation.lng, smoothedLocation.lat, smoothedLocation.lng) > 0.01;
                if (significantChange) {
                    console.log('Location updated in real-time, refreshing nearest restaurants...');
                    if (typeof loadRestaurants === 'function') {
                        loadRestaurants();
                    }
                    // Update saved location
                    try {
                        localStorage.setItem('userLocation', JSON.stringify({ lat: userLocation.lat, lng: userLocation.lng }));
                    } catch (e) { /* ignore */ }
                }
            }
        }

        // Use watchPosition for continuous tracking
        userLocationWatchId = navigator.geolocation.watchPosition(
            updateUserLocation,
            function(error) {
                // Hide loading modal
                hideLoadingModal();

                // Restore button states
                locateBtns.forEach(btn => {
                    if (btn.dataset.originalHtml) {
                        btn.innerHTML = btn.dataset.originalHtml;
                        btn.disabled = false;
                        delete btn.dataset.originalHtml;
                    }
                });

                let message = '';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied. Please allow location access in your browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                    default:
                        message = 'An unknown error occurred.';
                        break;
                }
                // Let callers decide how to notify the user. Reject with the message so callers can show a single notification.
                finalize(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,   // Short timeout for fast retry on failure
                maximumAge: 0    // Always get fresh location for real-time tracking
            }
        );

        // Failsafe timeout: reject promise if the first fix takes too long
        // But do NOT clear the watch - let it continue tracking in the background
        timeoutHandle = setTimeout(() => {
            if (settled) return;
            // Don't clear the watch here - allow it to continue trying
            // Only hide modal and reject the promise

            // Hide loading modal
            hideLoadingModal();

            // Restore button states
            locateBtns.forEach(btn => {
                if (btn.dataset.originalHtml) {
                    btn.innerHTML = btn.dataset.originalHtml;
                    btn.disabled = false;
                    delete btn.dataset.originalHtml;
                }
            });

            const timeoutError = new Error('Location request timed out. Tracking will continue in background.');
            timeoutError.code = 3;
            finalize(timeoutError);
        }, Math.max(3000, timeoutMs));
    });
}

// NEW FUNCTION: Go to user location with animation
function goToUser() {
    if (!userLocation) {
        notify.error('Location not available. Please enable location services first.');
        return;
    }
    
    // Use flyTo for default zooming animation
    if (map && typeof map.flyTo === 'function') {
        map.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 16,
            duration: 2000,
            essential: true
        });
    } else {
        // Fallback to setView if flyTo is not available
        map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    }
}

// UPDATED CurrentLocationControl to use goToUser()
function addCurrentLocationButton() {
    class CurrentLocationControl {
        onAdd(mapInstance) {
            this._map = mapInstance;
            const container = document.createElement('div');
            container.className = 'leaflet-bar leaflet-control current-location-control mapboxgl-ctrl';
            const button = document.createElement('a');
            button.className = 'current-location-btn';
            button.href = '#';
            button.title = 'Get Current Location';
            button.innerHTML = '<i class="fas fa-crosshairs"></i>';

            container.style.background = 'none';
            container.style.border = 'none';
            button.style.display = 'block';
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.lineHeight = '32px';
            button.style.textAlign = 'center';
            button.style.backgroundColor = 'white';
            button.style.border = '2px solid rgba(0,0,0,0.2)';
            button.style.borderRadius = '4px';
            button.style.color = '#333';
            button.style.fontSize = '18px';
            button.style.textDecoration = 'none';
            button.style.cursor = 'pointer';

            button.onmouseover = function() {
                this.style.backgroundColor = '#f8f9fa';
                this.style.color = '#007bff';
                this.style.borderColor = '#007bff';
            };
            button.onmouseout = function() {
                this.style.backgroundColor = 'white';
                this.style.color = '#333';
                this.style.borderColor = 'rgba(0,0,0,0.2)';
            };
            button.onmousedown = function() {
                this.style.backgroundColor = '#007bff';
                this.style.color = 'white';
            };
            button.onmouseup = function() {
                this.style.backgroundColor = '#f8f9fa';
                this.style.color = '#007bff';
            };

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (userLocation) {
                    goToUser();
                } else {
                    locateUser().then(() => {
                        goToUser();
                        try { setRecommendationFilter('nearest'); } catch (e) { /* ignore */ }
                        try { setSearchResultFilter('nearest'); } catch (e) { /* ignore */ }
                    }).catch(() => {
                        notify.error('Failed to get your location. Please enable location services.');
                    });
                }
            });

            container.appendChild(button);
            this._container = container;
            return container;
        }
        onRemove() {
            if (this._container && this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            this._map = null;
        }
        getContainer() { return this._container; }
    }
    map.addControl(new CurrentLocationControl(), 'top-right');
}

// Follow user toggle button as a Mapbox GL top-right control
function addFollowUserButton() {
    if (!map) return;

    class FollowUserControl {
        onAdd(mapInstance) {
            this._map = mapInstance;

            const container = document.createElement('div');
            container.className = 'leaflet-bar leaflet-control map-follow-control mapboxgl-ctrl';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'map-follow-btn';
            btn.setAttribute('aria-pressed', mapFollowEnabled ? 'true' : 'false');
            btn.setAttribute('aria-label', 'Toggle map follow');
            btn.title = 'Toggle map follow (auto-center)';
            btn.innerHTML = '<i class="fas fa-location-arrow"></i><span>Follow</span>';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                setMapFollowEnabled(!mapFollowEnabled);
            });

            container.appendChild(btn);
            this._container = container;
            mapFollowButton = btn;
            updateFollowButtonUI();
            return container;
        }

        onRemove() {
            if (this._container && this._container.parentNode) {
                this._container.parentNode.removeChild(this._container);
            }
            if (mapFollowButton && this._container && this._container.contains(mapFollowButton)) {
                mapFollowButton = null;
            }
            this._map = null;
        }

        getContainer() {
            return this._container;
        }
    }

    map.addControl(new FollowUserControl(), 'top-right');
    ensureFollowControlOrder();
}

function ensureFollowControlOrder() {
    const topRight = document.querySelector('.mapboxgl-ctrl-top-right');
    const follow = document.querySelector('.map-follow-control');
    const compass = document.querySelector('.compass-control');
    if (!topRight || !follow || !compass) return;

    if (follow.previousElementSibling === compass) return;
    topRight.insertBefore(follow, compass.nextSibling);
}

// UPDATED Setup map controls to use goToUser for locateMeBtn
        ensureFollowControlOrder();
function setupMapControls() {
    const locateMeBtn = document.getElementById('locateMe');
    const clearRouteBtn = document.getElementById('clearRoute');

    if (locateMeBtn) {
        locateMeBtn.addEventListener('click', function() {
            if (userLocation) {
                goToUser();
            } else {
                locateUser().then(() => {
                    goToUser();
                }).catch(() => {
                    notify.error('Failed to get your location. Please enable location services.');
                });
            }
        });
    }

    if (clearRouteBtn) {
        clearRouteBtn.addEventListener('click', clearRoute);
    }
}

// Auto-locate helper: attempts to automatically use the user's location.
// If `forcePrompt` is true it will trigger the permission prompt; otherwise
// it only activates when permission is already granted (or previously allowed).
// If `centerOnSuccess` is true, the map will center on the user's location
// (unless a saved map state was restored).
function autoLocateUser(forcePrompt = false, centerOnSuccess = false) {
    if (!navigator.geolocation) return Promise.reject(new Error('Geolocation not supported'));
    const locateAndMaybeCenter = () => locateUser().then((loc) => {
        if (centerOnSuccess && loc && map && !map.__hadSavedState) {
            try { map.setView([loc.lat, loc.lng], INITIAL_ZOOM, { animate: true }); } catch (e) { /* ignore */ }
        }
        return loc;
    });
    // If caller wants to force prompt, just call locateUser()
    if (forcePrompt) {
        return locateAndMaybeCenter();
    }

    // Prefer the Permissions API to check current geolocation permission state
    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        return navigator.permissions.query({ name: 'geolocation' }).then(function(status) {
            try {
                if (status.state === 'granted') {
                    return locateAndMaybeCenter();
                }
                // If state is 'prompt', don't auto-prompt by default
                return Promise.resolve(null);
            } catch (e) {
                return Promise.resolve(null);
            }
        }).catch(function() {
            // If Permissions API fails, only auto-locate if we previously saved consent
            if (localStorage.getItem('locationPermissionAsked') === 'allowed') {
                return locateAndMaybeCenter();
            }
            return Promise.resolve(null);
        });
    }

    // Fallback: only auto-locate if user previously allowed location
    if (localStorage.getItem('locationPermissionAsked') === 'allowed') {
        return locateAndMaybeCenter();
    }
    return Promise.resolve(null);
}

// Calculate distance between two points using Haversine formula (returns distance in km)
// NOTE: Kept only as a fallback when Mapbox APIs are unavailable.
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Calculate driving distance using Mapbox Directions API (returns distance in km)
async function calculateDrivingDistance(lat1, lon1, lat2, lon2) {
    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${lon1},${lat1};${lon2},${lat2}?overview=false&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // Return distance in km
            return data.routes[0].distance / 1000;
        }
        // Fallback to straight-line distance if routing fails
        return calculateDistance(lat1, lon1, lat2, lon2);
    } catch (error) {
        console.warn('Mapbox distance calculation failed, using straight-line:', error);
        return calculateDistance(lat1, lon1, lat2, lon2);
    }
}

// Calculate driving distances and durations for multiple restaurants in batches (Mapbox Matrix API)
async function calculateDrivingDistances(userLat, userLng, restaurants) {
    // Mapbox Matrix API max is 25 coordinates total (1 user origin + 24 destinations)
    const batchSize = 24;
    const results = new Map();

    // Filter to only valid restaurants upfront so stale null/NaN coords never enter the URL
    const valid = restaurants.filter(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        return !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
    });
    // Provide straight-line fallback immediately for invalid-coord restaurants
    restaurants.forEach(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === 0 && lng === 0)) {
            results.set(r.id, { distance: 0, duration: 0 });
        }
    });
    
    for (let i = 0; i < valid.length; i += batchSize) {
        const batch = valid.slice(i, i + batchSize);
        
        // Build coordinates string: user location first, then all restaurant locations
        const coords = [`${userLng},${userLat}`, ...batch.map(r => `${r.longitude},${r.latitude}`)].join(';');
        
        try {
            // Request both distance and duration annotations from Mapbox Matrix API
            const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/${coords}?sources=0&annotations=distance,duration&access_token=${MAPBOX_ACCESS_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.distances && data.distances[0] && data.durations && data.durations[0]) {
                // distances[0] and durations[0] contain values from source (user) to all destinations
                batch.forEach((restaurant, idx) => {
                    // idx+1 because index 0 is user location
                    const distanceMeters = data.distances[0][idx + 1];
                    const durationSeconds = data.durations[0][idx + 1];
                    if (distanceMeters !== null && durationSeconds !== null) {
                        results.set(restaurant.id, {
                            distance: distanceMeters / 1000, // Convert to km
                            duration: durationSeconds // Keep in seconds
                        });
                    } else {
                        // Fallback to straight-line if no route found (estimate time at 40 km/h)
                        const straightDist = calculateDistance(
                            userLat, userLng,
                            parseFloat(restaurant.latitude),
                            parseFloat(restaurant.longitude)
                        );
                        results.set(restaurant.id, {
                            distance: straightDist,
                            duration: (straightDist / 40) * 3600 // Estimate at 40 km/h
                        });
                    }
                });
            } else {
                // Fallback for entire batch
                batch.forEach(restaurant => {
                    const straightDist = calculateDistance(
                        userLat, userLng,
                        parseFloat(restaurant.latitude),
                        parseFloat(restaurant.longitude)
                    );
                    results.set(restaurant.id, {
                        distance: straightDist,
                        duration: (straightDist / 40) * 3600
                    });
                });
            }
        } catch (error) {
            console.warn('Mapbox matrix calculation failed:', error);
            // Fallback to straight-line for this batch
            batch.forEach(restaurant => {
                const straightDist = calculateDistance(
                    userLat, userLng,
                    parseFloat(restaurant.latitude),
                    parseFloat(restaurant.longitude)
                );
                results.set(restaurant.id, {
                    distance: straightDist,
                    duration: (straightDist / 40) * 3600
                });
            });
        }
    }
    
    return results;
}

// Format duration in seconds to human-readable string
function formatTravelTime(seconds) {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
}

// Load nearby restaurants based on user location
async function loadNearbyRestaurants(userLat, userLng) {
    try {
        userLocation = { lat: userLat, lng: userLng };
        
        const response = await fetch('api/restaurants.php?action=getAll');
        restaurants = await response.json();
        updateCategoryChipsVisibility(restaurants);
        
        console.log('Loading nearby restaurants for:', userLocation);
        console.log('Total restaurants:', restaurants.length);

        // Show pins and sidebar immediately
        displayRestaurants(restaurants);
        addMarkersToMap(restaurants);
        try { refreshMapSize(150); } catch (e) {}
        refreshRecommendations(restaurants);

        // Calculate driving distances in the background, then update distance-dependent UI
        calculateDrivingDistances(userLat, userLng, restaurants).then(drivingDistances => {
            const restaurantsWithDistance = restaurants.map(restaurant => {
                const routeData = drivingDistances.get(restaurant.id);
                let distance, duration;
                if (routeData) {
                    distance = routeData.distance;
                    duration = routeData.duration;
                } else {
                    distance = calculateDistance(
                        userLat,
                        userLng,
                        parseFloat(restaurant.latitude),
                        parseFloat(restaurant.longitude)
                    );
                    duration = (distance / 40) * 3600;
                }
                return { ...restaurant, distance, duration };
            });

            restaurants = restaurantsWithDistance;
            updateCategoryChipsVisibility(restaurants);
            displayRestaurants(restaurants);
            refreshRecommendations(restaurantsWithDistance);
        }).catch(err => {
            console.warn('Driving distance calculation failed:', err);
        });
    } catch (error) {
        console.error('Error loading nearby restaurants:', error);
        notify.error('Failed to load nearby restaurants');
    }
}

// Load restaurants from API
async function loadRestaurants() {
    try {
        const response = await fetch('api/restaurants.php?action=getAll');
        restaurants = await response.json();
        updateCategoryChipsVisibility(restaurants);

        // Pre-fetch all restaurant logos immediately so they're cached when addMarkersToMapWebGL runs
        restaurants.forEach(r => { if (r.logo) loadImageForMarkerCanvas(r.logo); });
        
        console.log('User location:', userLocation);
        console.log('Total restaurants:', restaurants.length);

        // Show pins and sidebar immediately — no need to wait for distances
        displayRestaurants(restaurants);
        addMarkersToMap(restaurants);
        try { refreshMapSize(150); } catch (e) {}
        refreshRecommendations(restaurants);

        // If we have a user location, calculate driving distances in the background
        // and update only the distance-dependent parts once ready
        if (userLocation) {
            console.log('Calculating driving distances in background...');
            calculateDrivingDistances(
                userLocation.lat,
                userLocation.lng,
                restaurants
            ).then(drivingDistances => {
                // Add driving distance and duration to each restaurant
                const restaurantsWithDistance = restaurants.map(restaurant => {
                    const routeData = drivingDistances.get(restaurant.id);
                    let distance, duration;
                    if (routeData) {
                        distance = routeData.distance;
                        duration = routeData.duration;
                    } else {
                        distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            parseFloat(restaurant.latitude),
                            parseFloat(restaurant.longitude)
                        );
                        duration = (distance / 40) * 3600;
                    }
                    console.log(`${restaurant.name}: ${distance.toFixed(2)} km, ${formatTravelTime(duration)} (driving)`);
                    return { ...restaurant, distance, duration };
                });

                // Update global array and refresh distance-dependent UI
                restaurants = restaurantsWithDistance;
                updateCategoryChipsVisibility(restaurants);
                displayRestaurants(restaurants);
                refreshRecommendations(restaurantsWithDistance);
            }).catch(err => {
                console.warn('Driving distance calculation failed:', err);
            });
        }

        // Auto-open restaurant popup (and modal fallback) if ?view=<id> is present
        try {
            const params = new URLSearchParams(window.location.search);
            const viewId = params.get('view');
            if (viewId) {
                const viewNumeric = parseInt(viewId, 10);
                const target = restaurants.find(r => Number(r.id) === viewNumeric);
                if (target) {
                    const opened = openRestaurantPopupById(viewNumeric, { delay: 40, centerDelay: 60 });
                    if (!opened) {
                        // Fallback to modal if marker not available yet
                        showRestaurantDetails(target);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to open restaurant from query', e);
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        notify.error('Error loading restaurants. Please try again.');
        hidePageLoading();
    }
}

let currentRecommendationFilter = 'all';
let currentSearchResultFilter = 'all';
let searchResultsCache = [];

async function getAllSortedRestaurants(list) {
    const safeList = Array.isArray(list) ? list : [];
    if (!safeList.length) return [];

    const ratedEntries = await Promise.all(safeList.map(async (restaurant) => {
        const { avg, count } = await fetchAverageRating(restaurant.id);
        const distance = (window.userLocation)
            ? ((typeof restaurant.distance === 'number')
                ? restaurant.distance
                : calculateDistance(
                    window.userLocation.lat,
                    window.userLocation.lng,
                    parseFloat(restaurant.latitude),
                    parseFloat(restaurant.longitude)
                ))
            : (typeof restaurant.distance === 'number' ? restaurant.distance : Infinity);

        return {
            restaurant: { ...restaurant, distance },
            avg: Number(avg) || 0,
            count: Number(count) || 0
        };
    }));

    const rated = ratedEntries.filter(e => e.count > 0);
    const unrated = ratedEntries.filter(e => e.count === 0);

    rated.sort((a, b) => {
        const ratingDiff = (b.avg || 0) - (a.avg || 0);
        if (Math.abs(ratingDiff) > 0.0001) return ratingDiff;
        const countDiff = (b.count || 0) - (a.count || 0);
        if (countDiff !== 0) return countDiff;
        const distanceDiff = (a.restaurant.distance || Infinity) - (b.restaurant.distance || Infinity);
        if (distanceDiff !== 0) return distanceDiff;
        return String(a.restaurant?.name || '').localeCompare(String(b.restaurant?.name || ''));
    });

    unrated.sort((a, b) => {
        const distanceDiff = (a.restaurant.distance || Infinity) - (b.restaurant.distance || Infinity);
        if (distanceDiff !== 0) return distanceDiff;
        return String(a.restaurant?.name || '').localeCompare(String(b.restaurant?.name || ''));
    });

    return [...rated, ...unrated].map(e => ({
        ...e.restaurant,
        _avgRating: e.avg,
        _ratingCount: e.count
    }));
}

function initRecommendationFilters() {
    const filterContainer = document.getElementById('recommendationFilters');
    if (!filterContainer || filterContainer.dataset.listenersAdded) return;

    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recommendation-filter');
        if (!btn) return;
        if (btn.classList.contains('disabled') || btn.disabled) return;
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;
        setRecommendationFilter(filter);
    });

    filterContainer.dataset.listenersAdded = 'true';

    // Default to showing all; user can switch to popular/nearest.
    setRecommendationFilter('all', { silent: true });
    updateRecommendationFilterAvailability();
}

function setRecommendationFilter(filter, options = {}) {
    const { silent = false } = options;
    currentRecommendationFilter = filter;

    const filterButtons = document.querySelectorAll('#recommendationFilters .recommendation-filter');
    filterButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === filter;
        btn.classList.toggle('active', isActive);
    });

    if (!silent) {
        refreshRecommendations(restaurants).catch(() => {});
    }
}

function updateRecommendationFilterAvailability() {
    const hasActiveLocation = !!(window.userLocation && window.userLocation.lat && window.userLocation.lng);
    const filterButtons = document.querySelectorAll('#recommendationFilters .recommendation-filter');
    filterButtons.forEach(btn => {
        const type = btn.getAttribute('data-filter');
        const requiresLocation = type === 'nearest';
        const shouldDisable = requiresLocation && !hasActiveLocation;
        btn.classList.toggle('disabled', shouldDisable);
        btn.disabled = shouldDisable;
    });

    if (!hasActiveLocation && currentRecommendationFilter === 'nearest') {
        setRecommendationFilter('all', { silent: true });
    }
}

function initSearchResultFilters() {
    const filterContainer = document.getElementById('searchResultFilters');
    if (!filterContainer || filterContainer.dataset.listenersAdded) return;

    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recommendation-filter');
        if (!btn) return;
        if (btn.classList.contains('disabled') || btn.disabled) return;
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;
        setSearchResultFilter(filter);
    });

    filterContainer.dataset.listenersAdded = 'true';

    // Default to showing all; user can switch to popular/nearest.
    setSearchResultFilter('all', { silent: true });
    updateSearchResultFilterAvailability();
}

function setSearchResultFilter(filter, options = {}) {
    const { silent = false } = options;
    currentSearchResultFilter = filter;

    const filterButtons = document.querySelectorAll('#searchResultFilters .recommendation-filter');
    filterButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === filter;
        btn.classList.toggle('active', isActive);
    });

    if (!silent) {
        refreshSearchResults().catch(() => {});
    }
}

function updateSearchResultFilterAvailability() {
    const hasActiveLocation = !!(window.userLocation && window.userLocation.lat && window.userLocation.lng);
    const filterButtons = document.querySelectorAll('#searchResultFilters .recommendation-filter');
    filterButtons.forEach(btn => {
        const type = btn.getAttribute('data-filter');
        const requiresLocation = type === 'nearest';
        const shouldDisable = requiresLocation && !hasActiveLocation;
        btn.classList.toggle('disabled', shouldDisable);
        btn.disabled = shouldDisable;
    });

    if (!hasActiveLocation && currentSearchResultFilter === 'nearest') {
        setSearchResultFilter('all', { silent: true });
    }
}

async function getSearchResultsByFilter(list) {
    const safeList = Array.isArray(list) ? list : [];
    if (!safeList.length) return [];

    if (currentSearchResultFilter === 'all' || currentSearchResultFilter === 'both') {
        return getAllSortedRestaurants(safeList);
    }

    if (currentSearchResultFilter === 'nearest') {
        if (!window.userLocation) return safeList;
        // Only include results with actual route-based distances (from Mapbox API)
        // Do NOT use straight-line distance fallbacks for nearest search results
        const withRouteDistance = safeList.filter(r => typeof r.distance === 'number' && r.distance > 0);
        return withRouteDistance.sort((a, b) => a.distance - b.distance);
    }

    // popular
    const topRated = await getTopRatedRestaurants(safeList, safeList.length);
    return topRated.length ? topRated : safeList;
}

async function refreshSearchResults() {
    const list = Array.isArray(searchResultsCache) ? searchResultsCache : [];
    if (!list.length) {
        displayRestaurants([]);
        addMarkersToMap([]);
        return;
    }

    const filtered = await getSearchResultsByFilter(list);
    displayRestaurants(filtered);
    addMarkersToMap(filtered);
}

function getNearestRestaurants(restaurantsList, limit = 6) {
    const list = Array.isArray(restaurantsList) ? restaurantsList : [];
    if (!list.length || !window.userLocation) return [];

    // Only include restaurants that have actual route-based distances (from Mapbox API)
    // Do NOT use straight-line distance fallbacks for nearest restaurants
    const withRouteDistance = list.filter(r => typeof r.distance === 'number' && r.distance > 0);

    return withRouteDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}

async function refreshRecommendations(restaurantsList) {
    const list = Array.isArray(restaurantsList) ? restaurantsList : [];
    if (!list.length) return;

    if (currentRecommendationFilter === 'all' || currentRecommendationFilter === 'both') {
        const allSorted = await getAllSortedRestaurants(list);
        displayAllRestaurantsInRecommendations(allSorted, 'All Restaurants');
        return;
    }

    if (currentRecommendationFilter === 'nearest') {
        const nearest = getNearestRestaurants(list, 6);
        if (nearest.length) {
            displayNearestRestaurants(nearest, '<i class="fas fa-location-dot"></i> Nearest Restaurants');
            return;
        }
        // If nearest is unavailable (no location/distance data), show all instead
        const allSorted = await getAllSortedRestaurants(list);
        displayAllRestaurantsInRecommendations(allSorted, 'All Restaurants');
        return;
    }

    // Popular filter
    await displayTopRatedRestaurants(list, '⭐ Popular Restaurants');
}

function displayAllRestaurantsInRecommendations(restaurantsToShow, headerText = 'All Restaurants') {
    const recommendationsList = document.getElementById('recommendationsList');
    const recommendationsContainer = document.getElementById('recommendationsContainer');

    if (!recommendationsList) {
        console.error('recommendationsList element not found!');
        return;
    }

    let headerElement = recommendationsContainer?.querySelector('h3');
    if (!headerElement) {
        headerElement = document.createElement('h3');
        const filterBar = recommendationsContainer?.querySelector('#recommendationFilters');
        if (recommendationsContainer && filterBar && filterBar.nextSibling) {
            recommendationsContainer.insertBefore(headerElement, filterBar.nextSibling);
        } else if (recommendationsContainer && filterBar) {
            recommendationsContainer.appendChild(headerElement);
        } else if (recommendationsContainer && recommendationsContainer.firstChild) {
            recommendationsContainer.insertBefore(headerElement, recommendationsContainer.firstChild);
        } else if (recommendationsContainer) {
            recommendationsContainer.insertBefore(headerElement, recommendationsList);
        }
    }
    headerElement.innerHTML = headerText;

    recommendationsList.innerHTML = '';
    const list = Array.isArray(restaurantsToShow) ? restaurantsToShow : [];

    if (!list.length) {
        recommendationsList.innerHTML = '<p class="no-results">No restaurants found.</p>';
        return;
    }

    list.forEach((restaurant) => {
        const restaurantElement = document.createElement('div');
        restaurantElement.className = 'restaurant-item';

        const showTravelMeta = currentRecommendationFilter !== 'popular';
        const distanceText = (showTravelMeta && restaurant.distance && isFinite(restaurant.distance))
            ? `<span style="color: var(--accent-amber); font-weight: 600;">📍 ${restaurant.distance.toFixed(2)} km</span>`
            : '';
        const timeText = (showTravelMeta && restaurant.duration)
            ? `<span style="color: #666;"> • <i class="fas fa-clock" style="font-size: 11px;"></i> ${formatTravelTime(restaurant.duration)}</span>`
            : '';
        const travelMetaHtml = (distanceText || timeText)
            ? `<p><small>${distanceText}${timeText}</small></p>`
            : '';

        const logoUrl = (restaurant.logo && restaurant.logo.trim() !== '') ? restaurant.logo : null;
        const categoryIconClass = getCategoryIconClass(restaurant.category);
        const pinColor = getCategoryColor(restaurant.category);

        const logoHtml = logoUrl
            ? `<div class="restaurant-logo-wrapper">
                     <img src="${logoUrl}" alt="${restaurant.name}" class="restaurant-logo" style="border-color: ${pinColor};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                     <div class="restaurant-logo-fallback" style="display:none; background:${pinColor}; width:56px; height:56px; border-radius:50%; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                         <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                     </div>
                 </div>`
            : `<div class="restaurant-logo-fallback" style="background:${pinColor}; width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                     <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
               </div>`;

        const status = isRestaurantOpen(restaurant.hours);
        const statusBadgeHtml = status.isOpen === null
            ? ''
            : `<span class="status-badge ${status.isOpen ? 'open' : 'closed'}">${status.message}</span>`;

        restaurantElement.innerHTML = `
            <div class="restaurant-content">
              <h4>${restaurant.name}</h4>
              <p class="restaurant-address">${restaurant.address}</p>
              ${statusBadgeHtml ? `<div class="restaurant-status">${statusBadgeHtml}</div>` : ''}
              <div class="restaurant-rating" data-restaurant-id="${restaurant.id}" data-hours="${encodeURIComponent(restaurant.hours || '')}">${generateStarRating(0, false)} <span class="rating-suffix">Loading...</span></div>
              ${travelMetaHtml}
            </div>
            ${logoHtml}
        `;

        restaurantElement.addEventListener('click', () => {
            closeRestaurantModal();
            const marker = markers.find(m => m.restaurantId === restaurant.id);
            if (marker) {
                const coords = marker.getLngLat();
                map.flyTo({
                    center: coords,
                    zoom: 16,
                    duration: 1000,
                    essential: true
                });
                map.once('moveend', function() {
                    try {
                        marker.openPopup();
                    } catch (e) {
                        console.warn('openPopup failed', e);
                    }
                });
            }
        });

        recommendationsList.appendChild(restaurantElement);
    });

    updateRatingsInContainer(recommendationsList);
}

// Display nearest restaurants in the recommendations section
function displayNearestRestaurants(restaurantsToShow, headerText = '<i class="fas fa-location-dot"></i> Nearest Restaurants') {
    const recommendationsList = document.getElementById('recommendationsList');
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    
    console.log('displayNearestRestaurants called with:', restaurantsToShow.length, 'restaurants');
    console.log('recommendationsList element:', recommendationsList);
    
    if (!recommendationsList) {
        console.error('recommendationsList element not found!');
        return;
    }
    
    // Remove the location permission card when restaurants appear
    const permissionRequest = document.querySelector('.location-permission-request');
    if (permissionRequest) {
        permissionRequest.remove();
    }
    
    // Create or update the h3 header
    let headerElement = recommendationsContainer?.querySelector('h3');
    if (!headerElement) {
        headerElement = document.createElement('h3');
        const filterBar = recommendationsContainer?.querySelector('#recommendationFilters');
        if (recommendationsContainer && filterBar && filterBar.nextSibling) {
            recommendationsContainer.insertBefore(headerElement, filterBar.nextSibling);
        } else if (recommendationsContainer && filterBar) {
            recommendationsContainer.appendChild(headerElement);
        } else if (recommendationsContainer && recommendationsContainer.firstChild) {
            recommendationsContainer.insertBefore(headerElement, recommendationsContainer.firstChild);
        } else if (recommendationsContainer) {
            recommendationsContainer.insertBefore(headerElement, recommendationsList);
        }
    }
    headerElement.innerHTML = headerText;
    
    recommendationsList.innerHTML = '';
    
    if (restaurantsToShow.length === 0) {
        recommendationsList.innerHTML = '<p class="no-results">No restaurants found.</p>';
        return;
    }
    
    console.log('Creating nearest restaurant elements...');
    restaurantsToShow.forEach((restaurant, index) => {
        console.log(`Creating element for restaurant ${index + 1}:`, restaurant.name);
        const restaurantElement = document.createElement('div');
        restaurantElement.className = 'restaurant-item';
        
        // Build distance and time display (structured for consistent spacing)
        const distanceText = (restaurant.distance && isFinite(restaurant.distance))
            ? `<span class="meta-distance">📍 ${restaurant.distance.toFixed(2)} km</span>`
            : '';
        const timeText = restaurant.duration
            ? `<span class="meta-time"><i class="fas fa-clock"></i> ${formatTravelTime(restaurant.duration)}</span>`
            : '';
        const metaParts = [];
        if (distanceText) metaParts.push(distanceText);
        if (timeText) metaParts.push(timeText);
        const metaHtml = metaParts.length
            ? `<div class="restaurant-meta">${metaParts.join('<span class="meta-separator">•</span>')}</div>`
            : '';
        
        // Get logo image or show utensils icon as fallback
        const logoUrl = (restaurant.logo && restaurant.logo.trim() !== '') ? restaurant.logo : null;
        const categoryIconClass = getCategoryIconClass(restaurant.category);
        const pinColor = getCategoryColor(restaurant.category);
        
        // Create logo HTML with utensils fallback
        const logoHtml = logoUrl 
                ? `<div class="restaurant-logo-wrapper">
                 <img src="${logoUrl}" alt="${restaurant.name}" class="restaurant-logo" style="border-color: ${pinColor};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                     <div class="restaurant-logo-fallback" style="display:none; background:${pinColor}; width:56px; height:56px; border-radius:50%; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                         <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                 </div>
               </div>`
                            : `<div class="restaurant-logo-fallback" style="background:${pinColor}; width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                 <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
               </div>`;
        
                const status = isRestaurantOpen(restaurant.hours);
                const statusBadgeHtml = status.isOpen === null
                        ? ''
                        : `<span class="status-badge ${status.isOpen ? 'open' : 'closed'}">${status.message}</span>`;

                                restaurantElement.innerHTML = `
                        <div class="restaurant-content">
                            <h4>${restaurant.name}</h4>
                            <p class="restaurant-address">${restaurant.address}</p>
                                            ${statusBadgeHtml ? `<div class="restaurant-status">${statusBadgeHtml}</div>` : ''}
                            ${metaHtml}
                        </div>
                        ${logoHtml}
                `;
        
        restaurantElement.addEventListener('click', () => {
            closeRestaurantModal();
            const marker = markers.find(m => m.restaurantId === restaurant.id);
            const sidebarWasOpen = document.body.classList.contains('sidebar-open');

            if (sidebarWasOpen) {
                // Close the sidebar for better map visibility, then zoom and open the popup after transition
                closeSearchSidebar();
                setTimeout(() => {
                    if (marker) {
                        const coords = marker.getLngLat();
                        map.flyTo({
                            center: coords,
                            zoom: 16,
                            duration: 1000,
                            essential: true
                        });
                        map.once('moveend', function() {
                            try { 
                                marker.openPopup();
                            } catch(e) { 
                                console.warn('openPopup failed', e); 
                            }
                        });
                    }
                }, 350);
            } else {
                if (marker) {
                    const coords = marker.getLngLat();
                    map.flyTo({
                        center: coords,
                        zoom: 16,
                        duration: 1000,
                        essential: true
                    });
                    map.once('moveend', function() {
                        try { 
                            marker.openPopup();
                        } catch(e) { 
                            console.warn('openPopup failed', e); 
                        }
                    });
                }
            }
        });
        
        recommendationsList.appendChild(restaurantElement);
        console.log(`Appended restaurant ${restaurant.name} to recommendationsList`);
    });
    
    console.log('Total children in recommendationsList:', recommendationsList.children.length);
    updateRatingsInContainer(recommendationsList);
}

async function getTopRatedRestaurants(restaurantsList, limit = 6) {
    const list = Array.isArray(restaurantsList) ? restaurantsList : [];
    if (!list.length) return [];

    const ratedEntries = await Promise.all(list.map(async (restaurant) => {
        const { avg, count } = await fetchAverageRating(restaurant.id);
        return { restaurant, avg: Number(avg) || 0, count: Number(count) || 0 };
    }));

    const hasRated = ratedEntries.some(e => e.count > 0);
    const sorted = ratedEntries
        .filter(e => (hasRated ? e.count > 0 : true))
        .sort((a, b) => {
            const ratingDiff = (b.avg || 0) - (a.avg || 0);
            if (Math.abs(ratingDiff) > 0.0001) return ratingDiff;
            const countDiff = (b.count || 0) - (a.count || 0);
            if (countDiff !== 0) return countDiff;
            return String(a.restaurant?.name || '').localeCompare(String(b.restaurant?.name || ''));
        });

    return sorted.slice(0, limit).map(e => ({
        ...e.restaurant,
        _avgRating: e.avg,
        _ratingCount: e.count
    }));
}

async function displayTopRatedRestaurants(restaurantsList, headerText = '⭐ Popular Restaurants') {
    const recommendationsList = document.getElementById('recommendationsList');
    const recommendationsContainer = document.getElementById('recommendationsContainer');

    if (!recommendationsList) {
        console.error('recommendationsList element not found!');
        return;
    }

    let headerElement = recommendationsContainer?.querySelector('h3');
    if (!headerElement) {
        headerElement = document.createElement('h3');
        const filterBar = recommendationsContainer?.querySelector('#recommendationFilters');
        if (recommendationsContainer && filterBar && filterBar.nextSibling) {
            recommendationsContainer.insertBefore(headerElement, filterBar.nextSibling);
        } else if (recommendationsContainer && filterBar) {
            recommendationsContainer.appendChild(headerElement);
        } else if (recommendationsContainer && recommendationsContainer.firstChild) {
            recommendationsContainer.insertBefore(headerElement, recommendationsContainer.firstChild);
        } else if (recommendationsContainer) {
            recommendationsContainer.insertBefore(headerElement, recommendationsList);
        }
    }
    headerElement.innerHTML = headerText;

    recommendationsList.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div></div>';

    let topRated = [];
    try {
        topRated = await getTopRatedRestaurants(restaurantsList, 6);
    } catch (e) {
        console.warn('Failed to load top rated restaurants:', e);
        topRated = [];
    }

    recommendationsList.innerHTML = '';

    if (!topRated.length) {
        recommendationsList.innerHTML = '<p class="no-results">No restaurants found.</p>';
        return;
    }

    topRated.forEach((restaurant) => {
        const restaurantElement = document.createElement('div');
        restaurantElement.className = 'restaurant-item';

        // Hide travel meta in pure popular mode; keep it for nearest/both.
        const showTravelMeta = currentRecommendationFilter !== 'popular';
        const distanceText = (showTravelMeta && restaurant.distance && isFinite(restaurant.distance))
            ? `<span style="color: var(--accent-amber); font-weight: 600;">📍 ${restaurant.distance.toFixed(2)} km</span>`
            : '';
        const timeText = (showTravelMeta && restaurant.duration)
            ? `<span style="color: #666;"> • <i class="fas fa-clock" style="font-size: 11px;"></i> ${formatTravelTime(restaurant.duration)}</span>`
            : '';
        const travelMetaHtml = (distanceText || timeText)
            ? `<p><small>${distanceText}${timeText}</small></p>`
            : '';

        const logoUrl = (restaurant.logo && restaurant.logo.trim() !== '') ? restaurant.logo : null;
        const categoryIconClass = getCategoryIconClass(restaurant.category);
        const pinColor = getCategoryColor(restaurant.category);

                const logoHtml = logoUrl
                        ? `<div class="restaurant-logo-wrapper">
                                 <img src="${logoUrl}" alt="${restaurant.name}" class="restaurant-logo" style="border-color: ${pinColor};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                                                 <div class="restaurant-logo-fallback" style="display:none; background:${pinColor}; width:56px; height:56px; border-radius:50%; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                     <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                                 </div>
                             </div>`
                                            : `<div class="restaurant-logo-fallback" style="background:${pinColor}; width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                 <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                             </div>`;

        const ratingHtml = restaurant._ratingCount > 0
            ? generateStarRating(restaurant._avgRating, true, 'ratings')
            : `${generateStarRating(0, false)} <span class="rating-suffix">No ratings</span>`;

        const status = isRestaurantOpen(restaurant.hours);
        const statusBadgeHtml = status.isOpen === null
            ? ''
            : `<span class="status-badge ${status.isOpen ? 'open' : 'closed'}">${status.message}</span>`;

                restaurantElement.innerHTML = `
                        <div class="restaurant-content">
                            <h4>${restaurant.name}</h4>
                                                        <p class="restaurant-address">${restaurant.address}</p>
                            ${statusBadgeHtml ? `<div class="restaurant-status">${statusBadgeHtml}</div>` : ''}
                                                        <div class="restaurant-rating" data-restaurant-id="${restaurant.id}" data-hours="${encodeURIComponent(restaurant.hours || '')}">${ratingHtml}</div>
                            ${travelMetaHtml}
                        </div>
                        ${logoHtml}
                `;

        restaurantElement.addEventListener('click', () => {
            closeRestaurantModal();
            const marker = markers.find(m => m.restaurantId === restaurant.id);
            const sidebarWasOpen = document.body.classList.contains('sidebar-open');

            if (sidebarWasOpen) {
                closeSearchSidebar();
                setTimeout(() => {
                    if (marker) {
                        const coords = marker.getLngLat();
                        map.flyTo({
                            center: coords,
                            zoom: 16,
                            duration: 1000,
                            essential: true
                        });
                        map.once('moveend', function() {
                            try {
                                marker.openPopup();
                            } catch(e) {
                                console.warn('openPopup failed', e);
                            }
                        });
                    }
                }, 350);
            } else {
                if (marker) {
                    const coords = marker.getLngLat();
                    map.flyTo({
                        center: coords,
                        zoom: 16,
                        duration: 1000,
                        essential: true
                    });
                    map.once('moveend', function() {
                        try {
                            marker.openPopup();
                        } catch(e) {
                            console.warn('openPopup failed', e);
                        }
                    });
                }
            }
        });

        recommendationsList.appendChild(restaurantElement);
    });

    updateRatingsInContainer(recommendationsList);
}

// Display restaurants in sidebar
// Display restaurants in sidebar
function displayRestaurants(restaurantsToShow) {
    const resultsList = document.getElementById('resultsList');
    console.log('displayRestaurants called with:', restaurantsToShow.length, 'restaurants');
    console.log('resultsList element:', resultsList);
    
    if (!resultsList) {
        console.error('resultsList element not found!');
        return;
    }
    
    resultsList.innerHTML = '';
    // Render all provided restaurants (no "show more" toggle)
    
    if (restaurantsToShow.length === 0) {
        resultsList.innerHTML = '<p class="no-results">No restaurants found.</p>';
        return;
    }
    
    console.log('Creating restaurant elements...');
    restaurantsToShow.forEach((restaurant, index) => {
        console.log(`Creating element for restaurant ${index + 1}:`, restaurant.name);
        const restaurantElement = document.createElement('div');
        restaurantElement.className = 'restaurant-item';
        
        // Hide travel meta in pure popular mode for search results, too.
        const showTravelMeta = currentSearchResultFilter !== 'popular';
        const showRatings = currentSearchResultFilter !== 'nearest';
        const distanceText = (showTravelMeta && restaurant.distance && isFinite(restaurant.distance))
            ? `<span style="color: var(--accent-amber); font-weight: 600;">📍 ${restaurant.distance.toFixed(2)} km</span>`
            : '';
        const timeText = (showTravelMeta && restaurant.duration)
            ? `<span style="color: #666;"> • <i class="fas fa-clock" style="font-size: 11px;"></i> ${formatTravelTime(restaurant.duration)}</span>`
            : '';
        const travelMetaHtml = (distanceText || timeText)
            ? `<p><small>${distanceText}${timeText}</small></p>`
            : '';
        
        // Get logo image or show utensils icon as fallback
        const logoUrl = (restaurant.logo && restaurant.logo.trim() !== '') ? restaurant.logo : null;
        const categoryIconClass = getCategoryIconClass(restaurant.category);
        const pinColor = getCategoryColor(restaurant.category);
        
        // Create logo HTML with utensils fallback
                const logoHtml = logoUrl 
                        ? `<div class="restaurant-logo-wrapper">
                                 <img src="${logoUrl}" alt="${restaurant.name}" class="restaurant-logo" style="border-color: ${pinColor};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                                                 <div class="restaurant-logo-fallback" style="display:none; background:${pinColor}; width:52px; height:52px; border-radius:50%; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                     <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                                 </div>
                             </div>`
                                                        : `<div class="restaurant-logo-fallback" style="background:${pinColor}; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                                                                 <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                             </div>`;
        
                const status = isRestaurantOpen(restaurant.hours);
                const statusBadgeHtml = status.isOpen === null
                        ? ''
                        : `<span class="status-badge ${status.isOpen ? 'open' : 'closed'}">${status.message}</span>`;

                restaurantElement.innerHTML = `
            <div class="restaurant-content">
              <h4>${restaurant.name}</h4>
                            <p class="restaurant-address">${restaurant.address}</p>
                            ${statusBadgeHtml ? `<div class="restaurant-status">${statusBadgeHtml}</div>` : ''}
                            ${showRatings ? `<div class="restaurant-rating" data-restaurant-id="${restaurant.id}" data-hours="${encodeURIComponent(restaurant.hours || '')}">${generateStarRating(0, false)} <span class="rating-suffix">Loading...</span></div>` : ''}
                            ${travelMetaHtml}
            </div>
            ${logoHtml}
        `;
        
        restaurantElement.addEventListener('click', () => {
            // Close restaurant modal if open
            closeRestaurantModal();

            const marker = markers.find(m => m.restaurantId === restaurant.id);

            // If we're on mobile and the sidebar is open, close it first so the map can resize
            const isMobile = window.innerWidth <= 768;
            const sidebarWasOpen = document.body.classList.contains('sidebar-open');

            if (isMobile && sidebarWasOpen) {
                // Close the sidebar UI
                document.body.classList.remove('sidebar-open');
                const overlay = document.getElementById('sidebarOverlay');
                if (overlay) overlay.hidden = true;
                const toggleBtn = document.getElementById('sidebarToggle');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');

                // Ask map to refresh after the sidebar close animation; then zoom to restaurant
                refreshMapSize(300);
                setTimeout(() => {
                    if (marker) {
                        const coords = marker.getLngLat();
                        map.flyTo({
                            center: coords,
                            zoom: 16,
                            duration: 1000,
                            essential: true
                        });
                        map.once('moveend', function() {
                            try { 
                                marker.openPopup();
                            } catch(e) { 
                                console.warn('openPopup failed', e); 
                            }
                        });
                    }
                }, 350);
            } else {
                // Desktop or sidebar already closed: zoom to restaurant with animation
                if (marker) {
                    const coords = marker.getLngLat();
                    map.flyTo({
                        center: coords,
                        zoom: 16,
                        duration: 1000,
                        essential: true
                    });
                    map.once('moveend', function() {
                        try { 
                            marker.openPopup();
                        } catch(e) { 
                            console.warn('openPopup failed', e); 
                        }
                    });
                }
            }
        });
        resultsList.appendChild(restaurantElement);
        console.log(`Appended restaurant ${restaurant.name} to resultsList`);
    });
    
    console.log('Total children in resultsList:', resultsList.children.length);
    updateRatingsInContainer(resultsList);
}

// Add markers to map with enhanced popups
function getCategoryIconGlyph(category) {
    const icon = getCategoryIconClass(category);
    const glyphCodepoints = {
        'fa-burger': 0xf805,
        'fa-utensils': 0xf2e7,
        'fa-wine-glass': 0xf4e3,
        'fa-mug-hot': 0xf7b6,
        'fa-concierge-bell': 0xf562,
        'fa-truck': 0xf0d1,
        'fa-store': 0xf54e,
        'fa-pizza-slice': 0xf818,
        'fa-users': 0xf0c0,
        'fa-beer-mug-empty': 0xf0fc
    };
    const cp = glyphCodepoints[icon] || 0xf2e7;
    return String.fromCodePoint(cp);
}

async function ensureFaCanvasFontReady() {
    if (faCanvasFontReadyPromise) return faCanvasFontReadyPromise;

    faCanvasFontReadyPromise = (async () => {
        try {
            if (!document || !document.fonts || typeof document.fonts.load !== 'function') return;
            await Promise.all([
                document.fonts.load('900 26px "Font Awesome 6 Free"'),
                document.fonts.load('900 26px "Font Awesome 6 Pro"'),
                document.fonts.load('900 26px "Font Awesome 5 Free"')
            ]);
        } catch (e) {
            console.warn('Font Awesome canvas font load failed', e);
        }
    })();

    return faCanvasFontReadyPromise;
}

const _markerLogoCache = new Map();
function loadImageForMarkerCanvas(url) {
    if (!url) return Promise.resolve(null);
    if (_markerLogoCache.has(url)) return _markerLogoCache.get(url);
    const p = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
    _markerLogoCache.set(url, p);
    return p;
}

// ── Pin image localStorage cache ──────────────────────────────────────────
// Rendered pin canvases are stored as base64 PNG data URLs keyed by
// restaurant id + category + logo filename + date-hour (so the open/closed
// status dot stays accurate). Old entries from previous hours are pruned
// automatically to stay comfortably within the ~5 MB quota.
const _PIN_CACHE_PREFIX = 'fc_pin_v2_';

function _getPinCacheKey(restaurant) {
    // Slot by hour so open/closed colour refreshes every hour automatically.
    const hourSlot = new Date().toISOString().slice(0, 13); // e.g. "2026-03-10T14"
    const logoKey  = (restaurant.logo || '').split('/').pop().split('?')[0] || 'x';
    return `${_PIN_CACHE_PREFIX}${restaurant.id}_${restaurant.category}_${logoKey}_${hourSlot}`;
}

function _savePinToCache(key, canvas) {
    try {
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem(key, dataUrl);
    } catch (e) {
        // Storage full — prune all old pin entries then retry once.
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith(_PIN_CACHE_PREFIX) && k !== key)
                .forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
            localStorage.setItem(key, canvas.toDataURL('image/png'));
        } catch (_) { /* give up silently */ }
    }
}

async function _loadPinFromCache(key, size) {
    try {
        const dataUrl = localStorage.getItem(key);
        if (!dataUrl) return null;
        return await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const c = document.createElement('canvas');
                    c.width = size; c.height = size;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(ctx.getImageData(0, 0, size, size));
                } catch (_) { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
    } catch (e) { return null; }
}

// Remove pin cache entries that belong to a previous hour slot.
function pruneOldPinCache() {
    try {
        const currentHour = new Date().toISOString().slice(0, 13);
        Object.keys(localStorage)
            .filter(k => k.startsWith(_PIN_CACHE_PREFIX) && !k.includes(`_${currentHour}`))
            .forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    } catch (e) { /* ignore */ }
}

async function buildRestaurantMarkerImageData(restaurant, showStatusDot = true, skipLogo = false) {
    // ensureFaCanvasFontReady is hoisted to the caller for batch builds, but kept here
    // as a safety net when this function is called individually.
    await ensureFaCanvasFontReady();

    const size = 128;

    // Check localStorage cache for full-logo renders — avoids both the network
    // fetch and the canvas redraw on repeat page loads.
    if (!skipLogo && restaurant.logo && String(restaurant.logo).trim() !== '') {
        const cacheKey = _getPinCacheKey(restaurant);
        const cached = await _loadPinFromCache(cacheKey, size);
        if (cached) return cached;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const pinColor = getCategoryColor(restaurant.category);
    const status = isRestaurantOpen(restaurant.hours);
    const statusDotColor = status.isOpen ? '#10b981' : '#ef4444';
    // When skipLogo=true we skip the network fetch entirely so pins render instantly.
    const logoUrl = (!skipLogo && restaurant.logo && String(restaurant.logo).trim() !== '') ? restaurant.logo : null;
    const logoImage = skipLogo ? null : await loadImageForMarkerCanvas(logoUrl);

    const centerX = size / 2;
    const centerY = 96;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = pinColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    if (logoImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logoImage, centerX - 22, centerY - 22, 44, 44);
        ctx.restore();
    } else {
        const iconGlyph = getCategoryIconGlyph(restaurant.category);
        ctx.font = '900 32px "Font Awesome 6 Free", "Font Awesome 6 Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = pinColor;
        ctx.fillText(iconGlyph, centerX, centerY);
    }

    if (showStatusDot) {
        ctx.beginPath();
        ctx.arc(centerX + 22, centerY - 22, 10, 0, Math.PI * 2);
        ctx.fillStyle = statusDotColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Persist the fully-rendered pin (with logo) to localStorage so future page
    // loads skip both the network fetch and the canvas redraw.
    if (!skipLogo && restaurant.logo && String(restaurant.logo).trim() !== '') {
        _savePinToCache(_getPinCacheKey(restaurant), canvas);
    }

    return ctx.getImageData(0, 0, size, size);
}

function cleanupWebglRestaurantMarkers() {
    if (!map) return;
    try {
        if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) map.removeLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID);
        if (map.getLayer(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID)) map.removeLayer(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID);
        if (map.getLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID)) map.removeLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID);
        if (map.getSource(MAPBOX_RESTAURANT_MARKER_SOURCE_ID)) map.removeSource(MAPBOX_RESTAURANT_MARKER_SOURCE_ID);
    } catch (e) { /* ignore */ }

    webglMarkerImageIds.forEach(imageId => {
        try {
            if (map.hasImage && map.hasImage(imageId)) map.removeImage(imageId);
        } catch (e) { /* ignore */ }
    });
    webglMarkerImageIds.clear();
}

function createRestaurantPopupMarkup(restaurant, categoryColor) {
    let popupImg = null;
    let popupImageCount = 0;
    const popupIconClass = getCategoryIconClass(restaurant.category);
    const subtitleText = restaurant.category ? String(restaurant.category).trim() : 'Restaurant';
    const trimmedSubtitle = subtitleText.length > 28 ? `${subtitleText.slice(0, 28).trim()}...` : subtitleText;
    const isSaved = isSavedRestaurant(restaurant.id);
    try {
        let popupImages = [];
        if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length > 0) popupImages = restaurant.image_paths.slice();
        else if (restaurant.image_path) popupImages = [restaurant.image_path];
        const _basename = (p) => {
            if (!p) return '';
            try { return p.split('?')[0].split('#')[0].split('/').pop(); } catch (e) { return p || ''; }
        };
        if (restaurant.logo) popupImages = popupImages.filter(p => p && p !== restaurant.logo && _basename(p) !== _basename(restaurant.logo));
        popupImageCount = popupImages.length;
        if (popupImages.length > 0) popupImg = popupImages[0];
        else if (restaurant.image_path && (!restaurant.logo || (restaurant.image_path !== restaurant.logo && _basename(restaurant.image_path) !== _basename(restaurant.logo)))) popupImg = restaurant.image_path;
    } catch (e) { popupImg = null; }

    const dotCount = Math.min(popupImageCount, 3);
    const dotsMarkup = dotCount > 1
        ? `<div class="popup-dots">${Array.from({ length: dotCount }, (_, i) => `<span class="popup-dot${i === 0 ? ' is-active' : ''}"></span>`).join('')}</div>`
        : '';

    return `
        <div class="popup-content popup-card" data-category="${restaurant.category}" style="--category-color: ${categoryColor}">
            <div class="popup-top">
                <div class="popup-icon-badge" aria-hidden="true">
                    <i class="fas ${popupIconClass}"></i>
                </div>
                <div class="popup-title-group">
                    <div class="popup-title">${restaurant.name}</div>
                    <div class="popup-subtitle">${trimmedSubtitle}</div>
                </div>
                <button type="button" class="popup-favorite-btn${isSaved ? ' is-active' : ''}" onclick="event.stopPropagation(); toggleSaveRestaurant(${restaurant.id}); return false;" aria-pressed="${isSaved}" aria-label="Toggle favorite">
                    <i class="${isSaved ? 'fas' : 'far'} fa-bookmark" aria-hidden="true"></i>
                </button>
            </div>
            ${popupImg ? `
                <div class="popup-media">
                    <img src='${popupImg}' alt='${restaurant.name}' class='popup-image'>
                    ${dotsMarkup}
                </div>
            ` : `
                <div class="popup-media popup-image-placeholder" style="--placeholder-color: ${categoryColor};" aria-label="No restaurant photos available">
                    <i class="fas ${popupIconClass}"></i>
                </div>
            `}
            <div class="popup-rating-row">
                <span class="popup-rating" data-restaurant-id="${restaurant.id}">${generateStarRating(0, false)} <span class="rating-suffix">Loading...</span></span>
                <span class="popup-rating-count" data-restaurant-id="${restaurant.id}"></span>
            </div>
            <div class="popup-actions">
                <button type="button" onclick="showRestaurantDetails(${restaurant.id}, true); return false;" class="popup-btn popup-btn-primary">
                    <i class="fas fa-info-circle"></i>
                    View Details
                </button>
                <button type="button" onclick="getDirectionsToRestaurant(${restaurant.id}); return false;" class="popup-btn popup-btn-secondary">
                    <i class="fas fa-route"></i>
                    Get Directions
                </button>
            </div>
            <div class="popup-address-row">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>${restaurant.address || 'Address not available'}</span>
            </div>
        </div>
    `;
}

function createWebglMarkerWrapper(restaurant, popupHtml, categoryColor) {
    const lat = parseFloat(restaurant.latitude);
    const lng = parseFloat(restaurant.longitude);
    const popup = createMapboxPopup(popupHtml, { closeButton: false, className: 'enhanced-popup' });
    popup.setLngLat([lng, lat]);

    popup.on('open', async function() {
        setActiveRestaurantMarker(restaurant.id);
        try {
            const popupContainer = document.querySelector('.mapboxgl-popup');
            if (popupContainer) popupContainer.style.setProperty('--category-color', categoryColor);

            const rid = restaurant.id;
            const popupEl = () => document.querySelector(`.mapboxgl-popup-content .popup-rating[data-restaurant-id="${rid}"]`);
            const countEl = () => document.querySelector(`.mapboxgl-popup-content .popup-rating-count[data-restaurant-id="${rid}"]`);

            // Use cached rating if available — no re-fetch needed
            if (popupRatingsCache.hasOwnProperty(rid)) {
                const cached = popupRatingsCache[rid];
                const avg = cached && typeof cached === 'object' ? Number(cached.avg || 0) : Number(cached || 0);
                const count = cached && typeof cached === 'object' ? Number(cached.count || 0) : 0;
                const el = popupEl();
                if (el) {
                    if (count > 0) {
                        el.innerHTML = generateStarRating(avg, true, '');
                    } else {
                        el.innerHTML = `${generateStarRating(0, false)} <span class="rating-suffix">No ratings</span>`;
                    }
                }
                const cnt = countEl();
                if (cnt) cnt.textContent = count > 0 ? `(${count} rating${count === 1 ? '' : 's'})` : '';
                return;
            }

            const ratingsResp = await fetch(`api/restaurants.php?action=getRatings&restaurant_id=${rid}`);
            const ratings = await ratingsResp.json();
            let avg = 0;
            let count = 0;
            if (Array.isArray(ratings) && ratings.length > 0) {
                count = ratings.length;
                avg = ratings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / ratings.length;
            }
            popupRatingsCache[rid] = { avg, count };
            const el = popupEl();
            if (el) {
                if (count > 0) {
                    el.innerHTML = generateStarRating(avg, true, '');
                } else {
                    el.innerHTML = `${generateStarRating(0, false)} <span class="rating-suffix">No ratings</span>`;
                }
            }
            const cnt = countEl();
            if (cnt) cnt.textContent = count > 0 ? `(${count} rating${count === 1 ? '' : 's'})` : '';
        } catch (err) {
            const popupEl = document.querySelector(`.mapboxgl-popup-content .popup-rating[data-restaurant-id="${restaurant.id}"]`);
            if (popupEl) popupEl.innerHTML = generateStarRating(0, false);
        }
    });

    popup.on('close', function() {
        if (Number(activeRestaurantMarkerId) === Number(restaurant.id)) {
            setActiveRestaurantMarker(null);
        }
    });

    return {
        __fcMarker: true,
        __webglMarker: true,
        _added: true,
        restaurantId: restaurant.id,
        addTo() { this._added = true; return this; },
        remove() { this._added = false; return this; },
        getLngLat() { return { lat, lng }; },
        openPopup() {
            try { if (map && typeof map.closePopup === 'function') map.closePopup(); } catch (e) { /* ignore */ }
            setActiveRestaurantMarker(restaurant.id);
            popup.setLngLat([lng, lat]).addTo(map);
            activePopup = popup;
            return this;
        },
        closePopup() {
            try { popup.remove(); } catch (e) { /* ignore */ }
            if (activePopup === popup) activePopup = null;
            if (Number(activeRestaurantMarkerId) === Number(restaurant.id)) {
                setActiveRestaurantMarker(null);
            }
            return this;
        },
        isPopupOpen() {
            return typeof popup.isOpen === 'function' ? popup.isOpen() : !!popup._map;
        },
        getPopup() { return popup; },
        getElement() { return null; }
    };
}

async function addMarkersToMapWebGL(restaurantsToShow, _retryCount, forceOverlap) {
    _retryCount = _retryCount || 0;
    const MAX_RETRIES = 5;
    const myGeneration = ++webglMarkerGeneration;

    if (!map) return;

    // If style isn't loaded yet, wait for it with retry logic instead of silently returning
    if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        if (_retryCount >= MAX_RETRIES) {
            console.warn('addMarkersToMapWebGL: style never loaded after', MAX_RETRIES, 'retries, giving up');
            return;
        }
        console.log('addMarkersToMapWebGL: style not loaded, waiting... (attempt', _retryCount + 1, ')');
        await new Promise(resolve => {
            let resolved = false;
            const onStyleLoad = () => { if (!resolved) { resolved = true; resolve(); } };
            // Listen for the style.load event
            map.once('style.load', onStyleLoad);
            // Also set a timeout fallback in case the event already fired
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    try { map.off('style.load', onStyleLoad); } catch(e) {}
                    resolve();
                }
            }, 2000);
        });
        // Retry after waiting
        return addMarkersToMapWebGL(restaurantsToShow, _retryCount + 1, forceOverlap);
    }

    const hideStatusDots = (() => {
        try { return localStorage.getItem(MAP_STATE_KEY + ':hideStatusDots') === 'true'; } catch (e) { return false; }
    })();

    // Enforce routing restriction: when a route is active only the destination marker is allowed
    if (hideMarkersDuringRouting && currentRouteDestination && currentRouteDestination.id) {
        const destId = Number(currentRouteDestination.id);
        restaurantsToShow = restaurantsToShow.filter(r => Number(r.id) === destId);
    }

    cleanupWebglRestaurantMarkers();
    markers = [];
    allRestaurantMarkers = [];

    // Filter to only restaurants with valid coordinates
    const validRestaurants = restaurantsToShow.filter(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        return !Number.isNaN(lat) && !Number.isNaN(lng);
    });

    // Hoist font ready once for the whole batch — cached after first call so this
    // resolves instantly on subsequent invocations.
    await ensureFaCanvasFontReady();
    if (myGeneration !== webglMarkerGeneration) return;

    // Build marker images WITHOUT logos first (pure canvas, no network) so pins
    // appear on the map as soon as the API response arrives.
    const imageResults = await Promise.all(
        validRestaurants.map(r => buildRestaurantMarkerImageData(r, !hideStatusDots, /* skipLogo */ true))
    );

    // If a newer call started while we were awaiting, abort this stale invocation
    if (myGeneration !== webglMarkerGeneration) return;

    // Verify style is still loaded before adding source/layers (could have changed during async image building)
    if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        console.warn('addMarkersToMapWebGL: style unloaded during image build, retrying...');
        if (myGeneration !== webglMarkerGeneration) return;
        return addMarkersToMapWebGL(restaurantsToShow, _retryCount + 1, forceOverlap);
    }

    const features = [];
    validRestaurants.forEach((restaurant, i) => {
        const imageData = imageResults[i];
        if (!imageData) return;

        const lat = parseFloat(restaurant.latitude);
        const lng = parseFloat(restaurant.longitude);
        const imageId = `restaurant-marker-${restaurant.id}`;
        try {
            if (map.hasImage && map.hasImage(imageId)) map.removeImage(imageId);
            map.addImage(imageId, imageData, { pixelRatio: 4 });
            webglMarkerImageIds.add(imageId);
        } catch (e) {
            console.warn('Failed to add restaurant marker image', restaurant.name, e);
            return;
        }

        let markerLabelName = restaurant.name || '';
        const maxLabelLength = 16;
        if (markerLabelName.length > maxLabelLength) markerLabelName = markerLabelName.substring(0, maxLabelLength - 1) + '…';
        const categoryColor = getCategoryColor(restaurant.category);

        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: {
                restaurantId: Number(restaurant.id),
                imageId,
                label: markerLabelName,
                pinColor: categoryColor
            }
        });

        const popupHtml = createRestaurantPopupMarkup(restaurant, categoryColor);
        const markerWrapper = createWebglMarkerWrapper(restaurant, popupHtml, categoryColor);
        markers.push(markerWrapper);
        allRestaurantMarkers.push(markerWrapper);
    });

    try {
    map.addSource(MAPBOX_RESTAURANT_MARKER_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
    });

    map.addLayer({
        id: MAPBOX_RESTAURANT_MARKER_LAYER_ID,
        type: 'symbol',
        source: MAPBOX_RESTAURANT_MARKER_SOURCE_ID,
        layout: {
            'icon-image': ['get', 'imageId'],
            'icon-size': 1.3,
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'visibility': webglRestaurantLayerVisible ? 'visible' : 'none'
        },
        paint: {
            'icon-opacity': 1,
            'icon-opacity-transition': { duration: 0, delay: 0 }
        }
    });

    map.addLayer({
        id: MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID,
        type: 'symbol',
        source: MAPBOX_RESTAURANT_MARKER_SOURCE_ID,
        filter: ['==', ['to-number', ['get', 'restaurantId']], -1],
        layout: {
            'icon-image': ['get', 'imageId'],
            'icon-size': 1.3,
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'visibility': webglRestaurantLayerVisible ? 'visible' : 'none'
        },
        paint: {
            'icon-opacity': 1,
            'icon-opacity-transition': { duration: 0, delay: 0 }
        }
    });

    map.addLayer({
        id: MAPBOX_RESTAURANT_LABEL_LAYER_ID,
        type: 'symbol',
        source: MAPBOX_RESTAURANT_MARKER_SOURCE_ID,
        minzoom: MARKER_LABEL_HIDE_ZOOM,
        layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 0.55],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'visibility': webglRestaurantLayerVisible ? 'visible' : 'none'
        },
        paint: {
            'text-color': [
                'case',
                ['==', ['downcase', ['get', 'pinColor']], '#fdd835'],
                '#8a6d00',
                ['get', 'pinColor']
            ],
            'text-halo-color': 'rgba(255,255,255,0.85)',
            'text-halo-width': 0.8,
            'text-opacity': 1,
            'text-opacity-transition': { duration: 0, delay: 0 }
        }
    });
    } catch (sourceLayerError) {
        console.error('addMarkersToMapWebGL: failed to add source/layers, will retry on next style.load', sourceLayerError);
        // Clean up any partial state
        cleanupWebglRestaurantMarkers();
        // Schedule retry on next style.load
        map.once('style.load', () => addMarkersToMapWebGL(restaurantsToShow, 0, forceOverlap));
        return;
    }

    if (!webglRestaurantClickBound) {
        map.on('click', MAPBOX_RESTAURANT_MARKER_LAYER_ID, function(e) {
            closeRestaurantModal();
            const feature = e && e.features && e.features[0];
            if (!feature) return;
            const restaurantId = Number(feature.properties && feature.properties.restaurantId);
            const marker = markers.find(m => Number(m.restaurantId) === restaurantId);
            if (marker) marker.openPopup();
        });

        map.on('mouseenter', MAPBOX_RESTAURANT_MARKER_LAYER_ID, function() {
            const canvas = map && map.getCanvas ? map.getCanvas() : null;
            if (canvas) canvas.style.cursor = 'pointer';
        });
        map.on('mouseleave', MAPBOX_RESTAURANT_MARKER_LAYER_ID, function() {
            const canvas = map && map.getCanvas ? map.getCanvas() : null;
            if (canvas) canvas.style.cursor = '';
        });
        webglRestaurantClickBound = true;
    }

    syncSelectedRestaurantMarkerLayer();
    updateMarkerLabelVisibility();

    // Hide the page loading overlay once markers are rendered for the first time
    hidePageLoading();

    // ── Logo streaming upgrade ──────────────────────────────────────────────
    // Pins are now visible with category icons. Replace each pin's image with
    // its logo version in the background — one at a time to avoid hammering
    // the network. map.updateImage() causes Mapbox to re-render that symbol
    // automatically without touching any other layers.
    validRestaurants.forEach(async (restaurant) => {
        if (!restaurant.logo || String(restaurant.logo).trim() === '') return;
        try {
            const fullImageData = await buildRestaurantMarkerImageData(restaurant, !hideStatusDots, false);
            if (!fullImageData) return;
            // Abort if a newer marker generation has already replaced ours
            if (myGeneration !== webglMarkerGeneration) return;
            const imageId = `restaurant-marker-${restaurant.id}`;
            if (map && map.hasImage && map.hasImage(imageId)) {
                map.updateImage(imageId, fullImageData);
            }
        } catch (e) {
            // Logo upgrade failed silently — category icon stays, no visual break
        }
    });
}

function addMarkersToMap(restaurantsToShow, forceOverlap) {
    currentMarkerRestaurants = Array.isArray(restaurantsToShow) ? restaurantsToShow.slice() : [];
    const shouldShowMarkerLoading = Array.isArray(restaurantsToShow) && restaurantsToShow.length > 0;

    if (!map) {
        console.warn('addMarkersToMap: map not initialized yet');
        return;
    }

    if (shouldShowMarkerLoading) beginMarkerLoading('Loading pins...');

    if (USE_WEBGL_RESTAURANT_MARKERS) {
        // addMarkersToMapWebGL now handles style-not-loaded internally with retries,
        // so we can always call it directly without waiting for style.load
        Promise.resolve(addMarkersToMapWebGL(restaurantsToShow, 0, !!forceOverlap))
            .catch((error) => {
                console.error('addMarkersToMapWebGL failed:', error);
            })
            .finally(() => {
                if (shouldShowMarkerLoading) endMarkerLoading();
            });
        return;
    }
    
    // Function to actually add the markers to the map
    const doAddMarkers = () => {
        console.log('addMarkersToMap: actually adding', restaurantsToShow.length, 'restaurants');
        
        // Clear existing markers (Mapbox GL uses .remove() on each marker)
        markers.forEach(marker => {
            try {
                if (marker && typeof marker.remove === 'function') {
                    marker.remove();
                }
            } catch (e) { console.warn('Error removing marker:', e); }
        });
        markers = [];
        allRestaurantMarkers = []; // Reset stored markers

        restaurantsToShow.forEach(restaurant => {
            // Determine marker color based on category (shared helper)
            const pinColor = getCategoryColor(restaurant.category);
            const pinShadow = hexToRgba(pinColor, 0.28);
            const rimShadow = hexToRgba(pinColor, 0.12);
            // Truncate long names for marker label
            let markerLabelName = restaurant.name;
            const maxLabelLength = 16;
            if (markerLabelName.length > maxLabelLength) {
                markerLabelName = markerLabelName.substring(0, maxLabelLength - 1) + '…';
            }
            
            // Determine if labels should be hidden based on current zoom level
            const currentZoom = map && map.getZoom ? map.getZoom() : INITIAL_ZOOM;
            const shouldHideLabel = currentZoom < MARKER_LABEL_HIDE_ZOOM;
            const labelOpacity = shouldHideLabel ? 0 : 1;
            
            // Prefer using a restaurant logo if available, otherwise fall back to utensil icon
            // Check if logo exists and is not empty/null/undefined
            const logoUrl = (restaurant.logo && restaurant.logo.trim() !== '') ? restaurant.logo : null;
            const categoryIconClass = getCategoryIconClass(restaurant.category);
            
            // Determine if restaurant is open
            const status = isRestaurantOpen(restaurant.hours);
            const statusDotColor = status.isOpen ? '#10b981' : '#ef4444'; // green for open, red for closed
            
            // Check if status dots should be hidden based on saved preference
            let statusDotDisplay = '';
            try {
                const hideStatusDots = localStorage.getItem(MAP_STATE_KEY + ':hideStatusDots') === 'true';
                if (hideStatusDots) {
                    statusDotDisplay = 'display: none;';
                }
            } catch (e) { /* ignore */ }
            
            // Ensure cutlery icon or logo is always visible, with icon color matching pin color
              const markerContent = logoUrl 
                    ? `<img src="${logoUrl}" alt="${restaurant.name} logo" class="marker-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <i class="fas ${categoryIconClass}" aria-hidden="true" style="display:none; color:${pinColor};"></i>`
                    : `<i class="fas ${categoryIconClass}" aria-hidden="true" style="color:${pinColor};"></i>`;
            
            const markerHtml = `
                <div class="restaurant-pin">
                    <div class="marker-pin marker-icon-lg" style="background: ${pinColor} !important; box-shadow: none !important; border: 0.5px solid rgba(255,255,255,0.3) !important;">
                        <div class="marker-plate">
                            <span class="plate-rim" style="box-shadow: inset 0 0 0 0.1px ${rimShadow};"></span>
                            <span class="plate-inner"></span>
                            <span class="cutlery">
                                ${markerContent}
                            </span>
                        </div>
                    </div>
                    <span class="marker-status-dot" style="background-color: ${statusDotColor}; ${statusDotDisplay}"></span>
                    <div class="marker-label" data-restaurant-id="${restaurant.id}" style="display:flex;justify-content:center;align-items:center;text-align:center;font-size:0.75rem;font-weight:600;color:${pinColor};white-space:nowrap;opacity:${labelOpacity}">${markerLabelName}</div>
                </div>
            `;

            // Validate coordinates before creating marker
            const lat = parseFloat(restaurant.latitude);
            const lng = parseFloat(restaurant.longitude);
            if (isNaN(lat) || isNaN(lng)) {
                console.error('Invalid coordinates for restaurant:', restaurant.name, 'lat:', restaurant.latitude, 'lng:', restaurant.longitude);
                return; // Skip this restaurant
            }

            const marker = createMapboxMarker({
                html: markerHtml,
                lat: lat,
                lng: lng,
                anchor: 'bottom'
            });
            const shouldHideForRoute = hideMarkersDuringRouting && currentRouteDestination && restaurant.id !== currentRouteDestination.id;
            // Add marker to the map unless routing should hide it
            if (!shouldHideForRoute) {
                try {
                    marker.addTo(map);
                    console.log('Added marker for:', restaurant.name, 'at', lat, lng);
                } catch (e) {
                    console.error('Failed to add marker for:', restaurant.name, e);
                }
            }

        // Prepare a popup image excluding the logo if present (compare basenames to handle query params)
        let popupImg = null;
        let popupImages = [];
        try {
            if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length > 0) {
                popupImages = restaurant.image_paths.slice();
            } else if (restaurant.image_path) {
                popupImages = [restaurant.image_path];
            }

            const _basename = (p) => {
                if (!p) return '';
                try {
                    return p.split('?')[0].split('#')[0].split('/').pop();
                } catch (e) { return p || ''; }
            };

            if (restaurant.logo) {
                popupImages = popupImages.filter(p => p && p !== restaurant.logo && _basename(p) !== _basename(restaurant.logo));
            }

            if (popupImages.length > 0) popupImg = popupImages[0];
            else if (restaurant.image_path && (!restaurant.logo || (restaurant.image_path !== restaurant.logo && _basename(restaurant.image_path) !== _basename(restaurant.logo)))) popupImg = restaurant.image_path;
        } catch (e) {
            console.warn('popup image prepare failed', e);
            popupImg = null;
        }

        const categoryColor = getCategoryColor(restaurant.category);
        
        const subtitleText = (restaurant.description || '').trim()
            || (restaurant.category ? `${restaurant.category} favorites.` : 'Great food and vibes.');
        const trimmedSubtitle = subtitleText.length > 60 ? `${subtitleText.slice(0, 60).trim()}...` : subtitleText;
        const isSaved = isSavedRestaurant(restaurant.id);
        const dotCount = Math.min(popupImages.length, 3);
        const dotsMarkup = dotCount > 1
            ? `<div class="popup-dots">${Array.from({ length: dotCount }, (_, i) => `<span class="popup-dot${i === 0 ? ' is-active' : ''}"></span>`).join('')}</div>`
            : '';

        marker.bindPopup(
                `
                <div class="popup-content popup-card" data-category="${restaurant.category}" style="--category-color: ${categoryColor}">
                    <div class="popup-top">
                        <div class="popup-icon-badge" aria-hidden="true">
                            <i class="fas ${categoryIconClass}"></i>
                        </div>
                        <div class="popup-title-group">
                            <div class="popup-title">${restaurant.name}</div>
                            <div class="popup-subtitle">${trimmedSubtitle}</div>
                        </div>
                        <button type="button" class="popup-favorite-btn${isSaved ? ' is-active' : ''}" onclick="event.stopPropagation(); toggleSaveRestaurant(${restaurant.id}); return false;" aria-pressed="${isSaved}" aria-label="Toggle favorite">
                            <i class="${isSaved ? 'fas' : 'far'} fa-bookmark" aria-hidden="true"></i>
                        </button>
                    </div>
                    
                    ${popupImg ? `
                        <div class="popup-media">
                            <img src='${popupImg}' alt='${restaurant.name}' class='popup-image'>
                            ${dotsMarkup}
                        </div>
                    ` : `
                        <div class="popup-media popup-image-placeholder" style="--placeholder-color: ${categoryColor};" aria-label="No restaurant photos available">
                            <i class="fas ${categoryIconClass}"></i>
                        </div>
                    `}
                    
                    <div class="popup-rating-row">
                        <span class="popup-rating" data-restaurant-id="${restaurant.id}">${generateStarRating(0, false)} <span class="rating-suffix">Loading...</span></span>
                        <span class="popup-rating-count" data-restaurant-id="${restaurant.id}"></span>
                    </div>
                    
                    <div class="popup-actions">
                        <button type="button" onclick="showRestaurantDetails(${restaurant.id}, true); return false;" class="popup-btn popup-btn-primary">
                            <i class="fas fa-info-circle"></i>
                            View Details
                        </button>
                        <button type="button" onclick="getDirectionsToRestaurant(${restaurant.id}); return false;" class="popup-btn popup-btn-secondary">
                            <i class="fas fa-route"></i>
                            Get Directions
                        </button>
                    </div>
                    
                    <div class="popup-address-row">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        <span>${restaurant.address || 'Address not available'}</span>
                    </div>
                </div>
                `,
                {
                    closeButton: false,
                    className: 'enhanced-popup'
                }
            );

        // Load and display average rating when popup opens
        const popupInstance = marker.getPopup();
        if (popupInstance) {
            popupInstance.on('open', async function () {
                try {
                    // Set the category color on the popup container for the tip to inherit
                    const popupContainer = document.querySelector('.mapboxgl-popup');
                    if (popupContainer) {
                        popupContainer.style.setProperty('--category-color', categoryColor);
                    }
                    
                    const ratingsResp = await fetch(`api/restaurants.php?action=getRatings&restaurant_id=${restaurant.id}`);
                    const ratings = await ratingsResp.json();
                    let avg = 0;
                    let count = 0;
                    if (Array.isArray(ratings) && ratings.length > 0) {
                        count = ratings.length;
                        avg = ratings.reduce((s, r) => s + Number(r.rating || 0), 0) / ratings.length;
                    }
                    const popupEl = document.querySelector(`.mapboxgl-popup-content .popup-rating[data-restaurant-id="${restaurant.id}"]`);
                    if (popupEl) {
                        if (count > 0) {
                            popupEl.innerHTML = generateStarRating(avg, true, '');
                        } else {
                            popupEl.innerHTML = `${generateStarRating(0, false)} <span class="rating-suffix">No ratings</span>`;
                        }
                    }
                    const countEl = document.querySelector(`.mapboxgl-popup-content .popup-rating-count[data-restaurant-id="${restaurant.id}"]`);
                    if (countEl) countEl.textContent = count > 0 ? `(${count} rating${count === 1 ? '' : 's'})` : '';
                } catch (err) {
                    console.warn('Failed to load ratings for popup', err);
                    const popupEl = document.querySelector(`.mapboxgl-popup-content .popup-rating[data-restaurant-id="${restaurant.id}"]`);
                    if (popupEl) popupEl.innerHTML = generateStarRating(0, false);
                }
            });
        }

        marker.restaurantId = restaurant.id;
        markers.push(marker);
        allRestaurantMarkers.push(marker); // Store all markers

        const markerEl = marker.getElement();
        if (markerEl) {
            markerEl.style.cursor = 'pointer';
            markerEl.classList.add('fc-restaurant-marker');
        }

        if (markerEl) markerEl.addEventListener('click', function (e) {
            // Close restaurant modal if open
            closeRestaurantModal();
        });

        // Center popup when content is clicked and adjust title font size dynamically
        if (popupInstance) popupInstance.on('open', function() {
            // Close other popups and center on this one
            markers.forEach(m => {
                if (m !== marker && m.isPopupOpen && m.isPopupOpen()) {
                    m.closePopup();
                }
            });
            try { centerOnPopup(marker); } catch (e) {}

            const popupElement = popupInstance.getElement();
            const content = popupElement ? popupElement.querySelector('.popup-content') : null;
            const titleElement = popupElement ? popupElement.querySelector('.popup-title') : null;

            // Hide marker label
            const markerLabel = document.querySelector(`.marker-label[data-restaurant-id='${marker.restaurantId}']`);
            if (markerLabel) {
                markerLabel.style.opacity = '0';
                markerLabel.style.pointerEvents = 'none';
            }

            if (titleElement) {
                // Adjust font size based on title length
                const titleText = titleElement.textContent.trim();
                const titleLength = titleText.length;

                // Base font size calculation: shorter titles get larger font
                let fontSize;
                if (titleLength <= 15) {
                    fontSize = '1.1rem'; // Large for short titles
                } else if (titleLength <= 25) {
                    fontSize = '1rem'; // Medium for medium titles
                } else if (titleLength <= 35) {
                    fontSize = '0.9rem'; // Smaller for longer titles
                } else {
                    fontSize = '0.8rem'; // Smallest for very long titles
                }

                titleElement.style.fontSize = fontSize;

                // Make icon the same size as the title
                const iconElement = titleElement.querySelector('i');
                if (iconElement) {
                    iconElement.style.fontSize = fontSize;
                }

                if (content) {
                    let isSingleLine = false;
                    if (typeof titleElement.getClientRects === 'function') {
                        isSingleLine = titleElement.getClientRects().length <= 1;
                    }
                    if (!isSingleLine) {
                        const computed = window.getComputedStyle(titleElement);
                        let lineHeight = parseFloat(computed.lineHeight);
                        if (Number.isNaN(lineHeight)) {
                            const fontSizePx = parseFloat(computed.fontSize) || 16;
                            lineHeight = fontSizePx * 1.25;
                        }
                        isSingleLine = titleElement.scrollHeight <= lineHeight * 1.2;
                    }
                    content.classList.toggle('single-line-title', isSingleLine);
                }
            }

            if (content && !content.dataset.centerHandler) {
                content.dataset.centerHandler = '1';
                content.addEventListener('click', (e) => {
                    // Only center if not clicking on buttons and actually clicking the popup
                    if (!e.target.closest('.popup-btn')) {
                        e.stopPropagation();
                        centerOnPopup(marker);
                    }
                });
            }
        });

        if (popupInstance) popupInstance.on('close', function() {
            // Show marker label again
            const markerLabel = document.querySelector(`.marker-label[data-restaurant-id='${marker.restaurantId}']`);
            if (markerLabel) {
                markerLabel.style.opacity = '1';
                markerLabel.style.pointerEvents = 'auto';
            }
        });
        });  // Close restaurantsToShow.forEach
        
        console.log('addMarkersToMap complete. Total markers added:', markers.length);
        
        // Adjust label visibility based on current zoom after markers are (re)drawn
        updateMarkerLabelVisibility();
    };
    
    // Check if map is ready, if not wait for it
    const finalizeMarkerRender = () => {
        if (shouldShowMarkerLoading) endMarkerLoading();
    };

    const wrappedDoAddMarkers = () => {
        try {
            doAddMarkers();
        } finally {
            finalizeMarkerRender();
        }
    };

    if (map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
        // Map is already loaded, add markers immediately
        wrappedDoAddMarkers();
    } else if (map) {
        // Map not yet loaded, wait for style.load event
        console.log('addMarkersToMap: Map not ready, waiting for style.load...');
        map.once('style.load', wrappedDoAddMarkers);
    }
}

// Hide marker labels when zoomed out beyond readability threshold
function updateMarkerLabelVisibility(zoomLevel = null) {
    if (!map) return;
    const currentZoom = zoomLevel !== null ? zoomLevel : (typeof map.getZoom === 'function' ? map.getZoom() : null);
    if (currentZoom === null) return;

    if (USE_WEBGL_RESTAURANT_MARKERS) {
        try {
            const vis = webglRestaurantLayerVisible ? 'visible' : 'none';
            const showLabels = currentZoom >= MARKER_LABEL_HIDE_ZOOM;
            if (map.getLayer && map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                map.setLayoutProperty(MAPBOX_RESTAURANT_LABEL_LAYER_ID, 'visibility', (webglRestaurantLayerVisible && showLabels) ? 'visible' : 'none');
            }
            if (map.getLayer && map.getLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID)) {
                map.setLayoutProperty(MAPBOX_RESTAURANT_MARKER_LAYER_ID, 'visibility', vis);
            }
            if (map.getLayer && map.getLayer(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID)) {
                map.setLayoutProperty(MAPBOX_SELECTED_RESTAURANT_MARKER_LAYER_ID, 'visibility', vis);
            }
        } catch (e) { /* ignore */ }
        return;
    }

    // Labels are only readable when zoomed in past the threshold
    const hideLabels = currentZoom < MARKER_LABEL_HIDE_ZOOM;

    // Throttle DOM updates to the next animation frame for smoother zooming
    if (labelVisibilityRaf !== null) return;
    labelVisibilityRaf = requestAnimationFrame(() => {
        // --- Pixel-space collision detection ---
        // The pin body is 24×24 px rotated 45° (anchor:'bottom'), giving a visual
        // footprint of ~34×34 px. We use a 40×40 px exclusion box around each
        // anchor point so that pins must be at least that far apart to both show.
        const PIN_BOX_W = 40;
        const PIN_BOX_H = 40;

        // Project every marker to screen-space pixel coordinates
        const candidates = [];
        allRestaurantMarkers.forEach(marker => {
            if (!marker.getLngLat) return;
            const lngLat = marker.getLngLat();
            if (!lngLat) return;

            let px, py;
            try {
                const pt = map.project([lngLat.lng, lngLat.lat]);
                px = pt.x; py = pt.y;
            } catch (e) { return; }

            // Use visit_count as priority so popular restaurants survive collisions
            const r = currentMarkerRestaurants.find(r => String(r.id) === String(marker.restaurantId));
            const priority = r ? (Number(r.visit_count) || 0) : 0;
            candidates.push({ marker, px, py, priority });
        });

        // Sort: higher visit_count first; tie-break by x so result is stable
        candidates.sort((a, b) => b.priority - a.priority || a.px - b.px);

        // Greedy O(n²) pass – n is small (<200 restaurants in practice)
        const keptAnchors = [];
        const visibleSet = new Set();
        for (const c of candidates) {
            let collides = false;
            for (const k of keptAnchors) {
                if (Math.abs(c.px - k.px) < PIN_BOX_W && Math.abs(c.py - k.py) < PIN_BOX_H) {
                    collides = true;
                    break;
                }
            }
            if (!collides) {
                keptAnchors.push({ px: c.px, py: c.py });
                visibleSet.add(String(c.marker.restaurantId));
            }
        }

        // Apply visibility to each marker element and its label
        allRestaurantMarkers.forEach(marker => {
            const isVisible = visibleSet.has(String(marker.restaurantId));
            const markerEl = marker.getElement && marker.getElement();
            const label = document.querySelector(`.marker-label[data-restaurant-id='${marker.restaurantId}']`);
            const isRestaurantMarker = markerEl && markerEl.classList && markerEl.classList.contains('fc-restaurant-marker');

            if (markerEl && isRestaurantMarker) {
                // Use CSS class transition (opacity + scale) instead of display:none
                if (!isVisible) {
                    markerEl.classList.add('marker-hidden');
                } else {
                    markerEl.classList.remove('marker-hidden');
                }
            }

            if (label) {
                if (hideLabels || !isVisible) {
                    label.style.opacity = '0';
                    label.style.pointerEvents = 'none';
                } else if (!marker.isPopupOpen || !marker.isPopupOpen()) {
                    label.style.opacity = '1';
                    label.style.pointerEvents = 'auto';
                }
            }
        });

        lastLabelHideState = hideLabels;
        lastMarkerHideState = null; // no longer used by this logic
        labelVisibilityRaf = null;
    });
}

// Save map view to localStorage
function saveMapState() {
    try {
        if (!map || !localStorage) return;
        const center = map.getCenter ? map.getCenter() : null;
        const zoom = map.getZoom ? map.getZoom() : null;
        const bearing = map.getBearing ? map.getBearing() : 0;
        if (!center || typeof zoom !== 'number') return;
        const payload = {
            center: [center.lat, center.lng],
            zoom,
            bearing: typeof bearing === 'number' ? bearing : 0
        };
        localStorage.setItem(MAP_STATE_KEY, JSON.stringify(payload));
    } catch (e) {
        // Ignore storage errors (e.g., private mode)
    }
}

// Load map view from localStorage
function loadSavedMapState() {
    try {
        if (!localStorage) return null;
        const raw = localStorage.getItem(MAP_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.center) || parsed.center.length !== 2) return null;
        if (typeof parsed.zoom !== 'number') return null;
        const center = [Number(parsed.center[0]), Number(parsed.center[1])];
        const zoom = Number(parsed.zoom);
        const bearing = typeof parsed.bearing === 'number' ? parsed.bearing : 0;
        if (!isFinite(center[0]) || !isFinite(center[1]) || !isFinite(zoom)) return null;
        return { center, zoom, bearing };
    } catch (e) {
        return null;
    }
}

// Utility: escape HTML
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
        // Support relative URLs by providing base
        const u = new URL(url, window.location.origin);
        let path = (u.pathname || '').replace(/\/+$/, '');
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return u.hostname;

        // If URL contains '/pages/<name>/<id>' prefer the name segment
        const pagesIdx = parts.indexOf('pages');
        let name = '';
        if (pagesIdx !== -1 && parts.length > pagesIdx + 1) {
            name = parts[pagesIdx + 1];
        } else {
            name = parts[parts.length - 1];
        }

        // If last segment is numeric id, fall back to previous segment
        if (/^\d+$/.test(name) && parts.length > 1) {
            name = parts[parts.length - 2];
        }

        // Decode and clean up
        name = decodeURIComponent(name).replace(/[-_]+/g, ' ');
        return name || u.hostname;
    } catch (e) {
        return url;
    }
}

function showRestaurantDetails(restaurantId, skipFocus) {
    const restaurant = typeof restaurantId === 'object' ? restaurantId : restaurants.find(r => r.id === restaurantId);
    
    if (!restaurant) return;
    
    currentRestaurant = restaurant;
    
    // Increment visit count
    fetch(`api/restaurants.php?action=incrementVisit&id=${restaurant.id}`);
    
    const modal = document.getElementById('restaurantModal');
    const details = document.getElementById('restaurantDetails');
    
    if (!modal || !details) return;
    
    // Build gallery images, excluding the logo if present
    let galleryImages = [];
    try {
        if (Array.isArray(restaurant.image_paths) && restaurant.image_paths.length > 0) {
            galleryImages = restaurant.image_paths.slice();
        } else if (restaurant.image_path) {
            galleryImages = [restaurant.image_path];
        }

        // Remove logo image if it's present in the gallery
        if (restaurant.logo) {
            galleryImages = galleryImages.filter(p => p && p !== restaurant.logo);
        }
    } catch (e) {
        console.warn('Error preparing gallery images', e);
        galleryImages = [];
    }

    // Use first image from filtered gallery, or nothing if none remain
    const heroImg = galleryImages.length > 0 ? galleryImages[0] : null;

    // Build a small marker HTML (pin with logo inside) to reuse in the modal
    // Use only the explicit `logo` field for the logo; if missing, fall back to a category icon
    const logoUrl = (restaurant.logo && String(restaurant.logo).trim() !== '') ? restaurant.logo : null;
    const modalIconClass = getCategoryIconClass(restaurant.category);
    // Use shared helpers so modal header pin color matches map marker exactly
    const modalPinColor = getCategoryColor(restaurant.category);
    const modalPinShadow = hexToRgba(modalPinColor, 0.28);
    const modalRimShadow = hexToRgba(modalPinColor, 0.12);

    const modalMarkerHtml = `
        <div class="restaurant-pin">
          <div class="marker-pin marker-icon-sm" style="background: ${modalPinColor}; box-shadow: none; border: 0.5px solid rgba(255,255,255,0.3);">
              <div class="marker-plate">
                  <span class="plate-rim" style="box-shadow: inset 0 0 0 0.1px ${modalRimShadow};"></span>
                  <span class="plate-inner"></span>
                  <span class="cutlery">
                      ${logoUrl ? `<img src="${logoUrl}" alt="${restaurant.name} logo" class="marker-logo" />` : `<i class="fas ${modalIconClass}" aria-hidden="true" style="color: ${modalPinColor};"></i>`}
                  </span>
              </div>
          </div>
        </div>`;

    // Create gradient for modal header
    const lighterColor = lightenColor(modalPinColor, 35);
    const headerGradient = `linear-gradient(135deg, ${lighterColor}, ${modalPinColor})`;

    details.innerHTML = `
        <div class="modal-header" style="background: ${headerGradient};">
            <h2 class="modal-title">
                ${modalMarkerHtml}
                <div class="modal-title-text">
                    <div class="restaurant-name">${escapeHtml(restaurant.name)}</div>
                    ${restaurant.category ? `<div class="restaurant-category">${escapeHtml(restaurant.category)}</div>` : ''}
                </div>
            </h2>
            <button class="modal-close" aria-label="Close"><i class="fas fa-times icon-desktop"></i><i class="fas fa-chevron-left icon-mobile"></i></button>
        </div>

        <div class="modal-body">
            ${heroImg ? `
                <div class="modal-hero" style="position:relative;">
                    <button class="modal-arrow left" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;${galleryImages.length === 1 ? 'display:none;' : ''}" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>
                    <img id="modalImg" src="${heroImg}" alt="${restaurant.name}" style="max-width:100%;border-radius:12px;">
                    <button class="modal-arrow right" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;${galleryImages.length === 1 ? 'display:none;' : ''}" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>
                    ${galleryImages.length > 1 ? `<div class="gallery-counter" id="galleryCounter">1 / ${galleryImages.length}</div>` : ''}
                    <div class="gallery-loader" id="galleryLoader"><div class="gallery-spinner"></div></div>
                </div>
            ` : `
                <div class="modal-hero modal-hero-placeholder" style="--placeholder-color: ${modalPinColor};" aria-label="No restaurant photos available">
                    <div class="modal-hero-placeholder-content">
                        <i class="fas ${modalIconClass}" aria-hidden="true"></i>
                        <span class="modal-hero-placeholder-text">No pictures available</span>
                    </div>
                </div>
            `}

            <!-- Quick actions moved to modal footer -->

            <div class="ratings-section">
                <div class="ratings-row">
                    <div class="ratings-label">
                        <i class="fas fa-star"></i>
                        <span>Ratings & Reviews</span>
                    </div>
                    <div class="ratings-summary" id="ratingsSummary-${restaurant.id}">
                        <span class="overall-rating">${generateStarRating(0, false)}</span>
                        <button class="review-count-btn" onclick="openReviewsModal(${restaurant.id})" id="reviewCountBtn-${restaurant.id}">
                            <i class="fas fa-plus"></i> Add Review
                        </button>
                    </div>
                </div>
                
                <div id="reviewsList-${restaurant.id}" class="reviews-list" style="display: none;">
                    <div class="loading">Loading reviews...</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-card location-card">
                    <div class="info-card-header">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Location</span>
                    </div>
                    <div class="info-card-content address-text">${restaurant.address}</div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <i class="fas fa-phone"></i>
                        <span>Contact</span>
                    </div>
                    <div class="info-card-content">${restaurant.phone || 'Not provided'}</div>
                </div>

                <div class="info-card">
                    <div class="info-card-header">
                        <i class="fas fa-envelope"></i>
                        <span>Email</span>
                    </div>
                    <div class="info-card-content">${restaurant.email ? `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(restaurant.email)}" target="_blank" rel="noopener">${escapeHtml(restaurant.email)}</a>` : 'Not provided'}</div>
                </div>

                <div class="info-card">
                    <div class="info-card-header">
                        <i class="fab fa-facebook"></i>
                        <span>Facebook</span>
                    </div>
                    <div class="info-card-content">${restaurant.facebook_page ? `<a href="${escapeHtml(restaurant.facebook_page)}" target="_blank" rel="noopener">${escapeHtml(restaurant.facebook_name || getFacebookDisplayName(restaurant.facebook_page))}</a>` : 'Not provided'}</div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header" style="cursor: pointer;" onclick="toggleBusinessHours(${restaurant.id})">
                        <i class="fas fa-clock"></i>
                        <span>Business Hours</span>
                        ${(() => {
                            const status = isRestaurantOpen(restaurant.hours);
                            if (status.isOpen === null) return '';
                            return status.isOpen 
                                ? `<span class="status-badge open"><i class="fas fa-circle"></i> ${status.message}</span>`
                                : `<span class="status-badge closed"><i class="fas fa-circle"></i> ${status.message}</span>`;
                        })()}
                        <i class="fas fa-chevron-down hours-arrow" id="hoursArrow-${restaurant.id}" style="margin-left: 8px; transition: transform 0.2s ease; color: #666;"></i>
                    </div>
                    <div class="info-card-content hours-toggle-content" id="hoursContent-${restaurant.id}"
                        data-summary="${encodeURIComponent(formatBusinessHoursSummary(restaurant.hours))}"
                        data-full="${encodeURIComponent(formatBusinessHoursFull(restaurant.hours))}">
                        ${formatBusinessHoursSummary(restaurant.hours)}
                    </div>
                </div>
                
                ${restaurant.menu_items ? `
                    <div class="info-card menu-card" style="display:flex;gap:12px;align-items:flex-start;">
                        <div style="flex:1;">
                            <div class="info-card-header">
                                <i class="fas fa-utensils"></i>
                                <span>Popular Items</span>
                                ${(() => {
                                    // Show Menu button if full_menu or menu images exist
                                    let hasFullMenu = false;
                                    let hasMenuImages = false;
                                    try {
                                        const fm = restaurant.full_menu ? (typeof restaurant.full_menu === 'string' ? JSON.parse(restaurant.full_menu) : restaurant.full_menu) : [];
                                        hasFullMenu = Array.isArray(fm) && fm.length > 0;
                                    } catch(e) {}
                                    try {
                                        const _mi = (Array.isArray(restaurant.menu_image) ? restaurant.menu_image : (restaurant.menu_image ? (function(){ try { return JSON.parse(restaurant.menu_image); } catch(e){ return [restaurant.menu_image]; } })() : []));
                                        hasMenuImages = _mi && _mi.length > 0;
                                    } catch(e) {}
                                    if (hasFullMenu || hasMenuImages) {
                                        return `<button type="button" class="view-menu-btn" onclick="openFullMenuModal(${restaurant.id})">Show Menu</button>`;
                                    }
                                    return '';
                                })()}
                            </div>
                            <div class="info-card-content">${escapeHtml(restaurant.menu_items)}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${(!restaurant.menu_items) ? (() => {
                    let hasFullMenu = false;
                    let hasMenuImages = false;
                    try {
                        const fm = restaurant.full_menu ? (typeof restaurant.full_menu === 'string' ? JSON.parse(restaurant.full_menu) : restaurant.full_menu) : [];
                        hasFullMenu = Array.isArray(fm) && fm.length > 0;
                    } catch(e) {}
                    try {
                        const _mi = (Array.isArray(restaurant.menu_image) ? restaurant.menu_image : (restaurant.menu_image ? (function(){ try { return JSON.parse(restaurant.menu_image); } catch(e){ return [restaurant.menu_image]; } })() : []));
                        hasMenuImages = _mi && _mi.length > 0;
                    } catch(e) {}
                    if (hasFullMenu || hasMenuImages) {
                        return `<div class="info-card menu-card"><div class="info-card-header"><i class="fas fa-utensils"></i><span>Menu</span><button type="button" class="view-menu-btn" onclick="openFullMenuModal(${restaurant.id})">Show Menu</button></div></div>`;
                    }
                    return '';
                })() : ''}
                
                ${(() => {
                    // Build Pricing & Payment card if any data exists
                    const hasPricing = restaurant.price_range || restaurant.payment_methods;
                    
                    if (!hasPricing) return '';
                    
                    let pricingHtml = '<div class="info-card" style="grid-column: 1 / -1;"><div class="info-card-header"><i class="fas fa-money-bill-wave"></i><span>Pricing & Payment</span></div><div class="info-card-content">';
                    
                    // Price Range
                    if (restaurant.price_range) {
                        pricingHtml += `<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;"><i class="fas fa-tag" style="color: var(--brand); width: 20px;"></i><span><strong>Price Range:</strong> ${escapeHtml(restaurant.price_range)}</span></div>`;
                    }
                    
                    // Payment Methods
                    if (restaurant.payment_methods) {
                        try {
                            const paymentOpts = typeof restaurant.payment_methods === 'string' ? JSON.parse(restaurant.payment_methods) : restaurant.payment_methods;
                            if (Array.isArray(paymentOpts) && paymentOpts.length > 0) {
                                pricingHtml += `<div><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-credit-card" style="color: var(--brand);"></i><strong>Accepted In-Store Payment Methods:</strong></div><div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">`;
                                paymentOpts.forEach(opt => {
                                    pricingHtml += `<span style="background: #e3f2fd; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.9rem; color: #1565c0;">${escapeHtml(opt)}</span>`;
                                });
                                pricingHtml += '</div></div>';
                            }
                        } catch (e) {}
                    }
                    
                    pricingHtml += '</div></div>';
                    return pricingHtml;
                })()}
                
                ${(() => {
                    // Build Facilities & Services card if any data exists
                    const hasFacilities = restaurant.seating_capacity || restaurant.reservation_needed || 
                                         restaurant.parking_availability || restaurant.delivery_options || 
                                         restaurant.wifi_availability || restaurant.accessibility;
                    
                    if (!hasFacilities) return '';
                    
                    let facilitiesHtml = '<div class="info-card" style="grid-column: 1 / -1;"><div class="info-card-header"><i class="fas fa-concierge-bell"></i><span>Facilities & Services</span></div><div class="info-card-content"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">';
                    
                    // Seating Capacity
                    if (restaurant.seating_capacity) {
                        facilitiesHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-chair" style="color: var(--brand); width: 20px;"></i><span><strong>Seating:</strong> ${escapeHtml(restaurant.seating_capacity)}</span></div>`;
                    }
                    
                    // Reservation
                    if (restaurant.reservation_needed) {
                        const reservationIcon = restaurant.reservation_needed === 'Yes' ? 'fa-calendar-check' : 'fa-calendar-xmark';
                        facilitiesHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas ${reservationIcon}" style="color: var(--brand); width: 20px;"></i><span><strong>Reservation:</strong> ${restaurant.reservation_needed}</span></div>`;
                    }
                    
                    // Parking
                    if (restaurant.parking_availability) {
                        const parkingIcon = restaurant.parking_availability === 'Yes' ? 'fa-square-parking' : restaurant.parking_availability === 'Limited' ? 'fa-car' : 'fa-ban';
                        facilitiesHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas ${parkingIcon}" style="color: var(--brand); width: 20px;"></i><span><strong>Parking:</strong> ${restaurant.parking_availability}</span></div>`;
                    }
                    
                    // WiFi
                    if (restaurant.wifi_availability) {
                        const wifiIcon = restaurant.wifi_availability === 'Yes' ? 'fa-wifi' : 'fa-wifi-slash';
                        facilitiesHtml += `<div style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas ${wifiIcon}" style="color: var(--brand); width: 20px;"></i><span><strong>Wi-Fi:</strong> ${restaurant.wifi_availability}</span></div>`;
                    }
                    
                    facilitiesHtml += '</div>';
                    
                    // Delivery Options
                    if (restaurant.delivery_options) {
                        try {
                            const deliveryOpts = typeof restaurant.delivery_options === 'string' ? JSON.parse(restaurant.delivery_options) : restaurant.delivery_options;
                            if (Array.isArray(deliveryOpts) && deliveryOpts.length > 0) {
                                facilitiesHtml += `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;"><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-utensils" style="color: var(--brand);"></i><strong>Service Options:</strong></div><div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">`;
                                deliveryOpts.forEach(opt => {
                                    facilitiesHtml += `<span style="background: #e3f2fd; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.9rem; color: #1565c0;">${escapeHtml(opt)}</span>`;
                                });
                                facilitiesHtml += '</div></div>';
                            }
                        } catch (e) {}
                    }
                    
                    // Accessibility
                    if (restaurant.accessibility) {
                        try {
                            const accessibilityOpts = typeof restaurant.accessibility === 'string' ? JSON.parse(restaurant.accessibility) : restaurant.accessibility;
                            if (Array.isArray(accessibilityOpts) && accessibilityOpts.length > 0) {
                                facilitiesHtml += `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;"><div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;"><i class="fas fa-universal-access" style="color: var(--brand);"></i><strong>Accessibility:</strong></div><div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">`;
                                accessibilityOpts.forEach(opt => {
                                    facilitiesHtml += `<span style="background: #e8f5e9; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; color: #2e7d32;"><i class="fas fa-check" style="font-size: 0.7rem;"></i> ${escapeHtml(opt)}</span>`;
                                });
                                facilitiesHtml += '</div></div>';
                            }
                        } catch (e) {}
                    }
                    
                    facilitiesHtml += '</div></div>';
                    return facilitiesHtml;
                })()}
            </div>

            <div class="desc-section">
                <div class="desc-title">
                    <i class="fas fa-info-circle"></i>
                    <span>About This Restaurant</span>
                </div>
                <div class="desc-text">${restaurant.description || 'No description provided.'}</div>
            </div>
        </div>

        <div class="modal-footer" role="toolbar" aria-label="Restaurant actions">
            <div class="modal-footer-inner actions-grid">
                <div class="action-btn-wrapper">
                    <button type="button" class="action-btn btn-primary" title="Get Directions" onclick="event.stopPropagation(); getDirectionsToRestaurant(${restaurant.id}); return false;">
                        <i class="fas fa-route" aria-hidden="true"></i>
                        <span class="action-label">Get Directions</span>
                    </button>
                </div>

                <div class="action-btn-wrapper">
                    <button type="button" class="action-btn btn-secondary" title="View on Map" onclick="event.stopPropagation(); handleViewOnMap(${restaurant.id}); return false;">
                        <i class="fas fa-map-pin" aria-hidden="true"></i>
                        <span class="action-label">View on Map</span>
                    </button>
                </div>

                <div class="action-btn-wrapper">
                    <button type="button" class="action-btn btn-warning" title="Open in Google Maps" onclick="event.stopPropagation(); handleGoogleMaps(${restaurant.id}); return false;">
                        <i class="fas fa-car" aria-hidden="true"></i>
                        <span class="action-label">Drive</span>
                    </button>
                </div>

                <div class="action-btn-wrapper">
                    <button type="button" class="action-btn btn-save${isSavedRestaurant(restaurant.id) ? ' btn-save--active' : ''}" id="save-btn-${restaurant.id}" title="Save Restaurant" onclick="event.stopPropagation(); toggleSaveRestaurant(${restaurant.id}); return false;">
                        <i class="${isSavedRestaurant(restaurant.id) ? 'fas' : 'far'} fa-bookmark" aria-hidden="true"></i>
                        <span class="action-label">${isSavedRestaurant(restaurant.id) ? 'Saved' : 'Save'}</span>
                    </button>
                </div>

                <!-- Close button intentionally removed from footer per request -->
            </div>
        </div>
    `;

    modal.style.display = 'block';
    // mark body so other UI (chatbot) can adjust z-index while modal is open
    document.body.classList.add('restaurant-modal-open');

    // Cancel any stale transitionend listener left over from a previous close animation
    // (this prevents the open-animation's transitionend from hiding the modal again)
    if (modal._closeOnEnd) {
        modal.removeEventListener('transitionend', modal._closeOnEnd);
        modal._closeOnEnd = null;
    }
    if (modal._closeTimer) {
        clearTimeout(modal._closeTimer);
        modal._closeTimer = null;
    }

    // Defer .active by one frame so the browser paints the initial (off-screen) state first,
    // allowing the slide-up CSS transition to actually play.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });
    
    // Load existing reviews
    loadRestaurantReviews(restaurant.id);
    
    const closeButton = details.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeRestaurantModal);
    }
        // Arrow navigation logic for images
            // Helper to compare filenames (handles absolute vs relative URLs and query/hash parts)
            function _getFilename(p) {
                try {
                    if (!p) return '';
                    const noQuery = p.split('?')[0].split('#')[0];
                    const parts = noQuery.split('/');
                    return parts[parts.length - 1] || '';
                } catch (e) {
                    return p || '';
                }
            }

            let currentImgIdx = 0;
            // Use the already filtered galleryImages for modal interactions. If none, fall back to a filtered image_path.
            const images = (galleryImages && galleryImages.length > 0)
                ? galleryImages.slice()
                : (restaurant.image_path && _getFilename(restaurant.image_path) !== _getFilename(restaurant.logo) ? [restaurant.image_path] : []);

            const imgEl = details.querySelector('#modalImg');
        if (imgEl) {
            // clicking the modal image opens the fullscreen lightbox
            imgEl.style.cursor = 'zoom-in';
            imgEl.addEventListener('click', function(e) {
                e.stopPropagation();
                    openImageLightbox(images, currentImgIdx);
            });

            // Arrow navigation logic for images
            const counterEl = details.querySelector('#galleryCounter');
            const loaderEl = details.querySelector('#galleryLoader');

            function showGalleryLoader() {
                if (loaderEl) loaderEl.classList.add('active');
            }
            function hideGalleryLoader() {
                if (loaderEl) loaderEl.classList.remove('active');
            }
            function updateGalleryCounter() {
                if (counterEl) counterEl.textContent = (currentImgIdx + 1) + ' / ' + images.length;
            }
            function navigateGallery(newIdx) {
                currentImgIdx = newIdx;
                showGalleryLoader();
                updateGalleryCounter();
                const tempImg = new Image();
                tempImg.onload = function() {
                    imgEl.src = images[currentImgIdx];
                    hideGalleryLoader();
                };
                tempImg.onerror = function() {
                    imgEl.src = images[currentImgIdx];
                    hideGalleryLoader();
                };
                tempImg.src = images[currentImgIdx];
            }

            if (images.length > 1) {
                const leftBtn = details.querySelector('.modal-arrow.left');
                const rightBtn = details.querySelector('.modal-arrow.right');
                if (leftBtn) {
                    leftBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        navigateGallery((currentImgIdx - 1 + images.length) % images.length);
                    });
                }
                if (rightBtn) {
                    rightBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        navigateGallery((currentImgIdx + 1) % images.length);
                    });
                }
            }
        }
    
    if (!skipFocus) {
        focusOnRestaurant(restaurant.id);
    }
    
    // Initialize star rating interaction
    initializeStarRating(restaurant.id);
}

// Show rating form
// Rating functions
let currentReviewRestaurantId = null;
let currentReviewsData = [];
let isUserLoggedIn = false;
let currentUserEmail = null;
let currentUserName = null;
let currentUserPicture = null;
// When doing a manual-login that must be verified via Google, store the email here
let pendingEmailVerification = null;

// Check login status from localStorage
function checkLoginStatus() {
    const userData = localStorage.getItem('foodcrawl_user');
    if (userData) {
        const user = JSON.parse(userData);
        isUserLoggedIn = true;
        currentUserEmail = user.email;
        currentUserName = user.name || user.email;
        currentUserPicture = user.picture || null;
        return true;
    }
    return false;
}

// Initialize login status on page load
checkLoginStatus();

// Google Sign-In callback
async function handleGoogleCredentialResponse(response) {
    // Decode the JWT token to get user info
    const userObject = parseJwt(response.credential);
    // If we have a pending manual-email verification, ensure the signed-in Google email matches
    if (pendingEmailVerification) {
        if (!userObject || userObject.email !== pendingEmailVerification) {
            // mismatch: do not accept
            if (typeof notify !== 'undefined') {
                notify.error('Google verification failed: signed-in account does not match the email you provided.');
            } else {
                alert('Google verification failed: signed-in account does not match the email you provided.');
            }
            pendingEmailVerification = null;
            return;
        }
        // match: clear pending and continue to accept this account
        pendingEmailVerification = null;
    }

    const userData = {
        email: userObject.email,
        name: userObject.name,
        picture: userObject.picture,
        provider: 'google',
        loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('foodcrawl_user', JSON.stringify(userData));

    isUserLoggedIn = true;
    currentUserEmail = userData.email;
    currentUserName = userData.name;
    currentUserPicture = userData.picture;

    // Close login modal
    closeLoginModal();

    // Show success message
    if (typeof notify !== 'undefined') {
        notify.success(`Welcome, ${userData.name}!`);
    } else {
        alert(`Welcome, ${userData.name}!`);
    }

    // If the user was trying to add a review, open the reviews modal and show the inline add-review form
    if (currentReviewRestaurantId) {
        try {
            await openReviewsModal(currentReviewRestaurantId);
            // show inline form and focus textarea if available
            const inline = document.getElementById('addReviewFormInline');
            if (inline) {
                inline.style.display = 'block';
                const ta = document.getElementById('reviewCommentInline');
                if (ta) ta.focus();
            }
        } catch (e) {
            // Fallback: open the standalone review modal if anything goes wrong
            console.warn('Failed to open inline reviews modal after Google login', e);
            openReviewModal(currentReviewRestaurantId);
        }
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

async function openReviewsModal(restaurantId) {
    const modal = document.getElementById('reviewsDisplayModal');
    const modalHeader = document.getElementById('reviewsModalHeader');
    const modalContent = document.getElementById('reviewsModalContent');
    modal.style.display = 'block';
    // Cancel any stale close listener before animating open
    if (modal._closeOnEnd) {
        modal.removeEventListener('transitionend', modal._closeOnEnd);
        modal._closeOnEnd = null;
    }
    if (modal._closeTimer) {
        clearTimeout(modal._closeTimer);
        modal._closeTimer = null;
    }
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    });

    // Match the restaurant modal header color: use the category-based gradient
    const _reviewRestaurant = restaurants.find(r => Number(r.id) === Number(restaurantId));
    let _reviewPinColor = null, _reviewLighterColor = null;
    if (_reviewRestaurant && modalHeader) {
        _reviewPinColor = getCategoryColor(_reviewRestaurant.category);
        _reviewLighterColor = lightenColor(_reviewPinColor, 35);
        modalHeader.style.background = `linear-gradient(135deg, ${_reviewLighterColor}, ${_reviewPinColor})`;
    }
    // add an overlay click handler so clicking outside the modal content closes it
    try {
        // remove any previous handler
        if (modal._overlayClickHandler) {
            modal.removeEventListener('click', modal._overlayClickHandler);
            modal._overlayClickHandler = null;
        }
        modal._overlayClickHandler = function (ev) {
            // if the click target is the modal overlay itself (not the inner content), close
            if (ev.target === modal) {
                closeReviewsDisplayModal();
            }
        };
        modal.addEventListener('click', modal._overlayClickHandler);
    } catch (e) {
        console.warn('Could not attach reviews modal overlay handler', e);
    }
    currentReviewRestaurantId = restaurantId;

    // Populate the header with only the summary so the sort control can live outside the header
    modalHeader.innerHTML = `
        <div class="reviews-summary-left">
            <div class="overall-rating" id="modalOverallRating">${generateStarRating(0, true, 'ratings')}</div>
            <div class="reviews-count" id="modalReviewsCount">0 reviews</div>
        </div>
        <button class="modal-close" onclick="closeReviewsDisplayModal()" aria-label="Close"><i class="fas fa-times icon-desktop"></i><i class="fas fa-chevron-left icon-mobile"></i></button>
    `;

    // Show loading state in content area. Place the reviews sort control just under the header
    modalContent.innerHTML = `
        <button class="btn-add-review-modal" id="btnAddReviewModal" title="Add Review">
            <i class="fas fa-plus"></i>
        </button>
        <div class="add-review-form-inline" id="addReviewFormInline" style="display: none;">
            <div class="review-form-expanded">
                <div class="review-form-header">
                    <h4>Write a Review</h4>
                    <button class="btn-cancel-review" id="btnCancelReview"><i class="fas fa-times"></i></button>
                </div>
                <div class="review-account-info">
                    <div class="account-display">
                        <img src="${currentUserPicture || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23ddd%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z%22/%3E%3C/svg%3E'}" alt="Profile" class="account-avatar">
                        <div class="account-details">
                            <span class="account-name">${currentUserName || currentUserEmail || 'Anonymous'}</span>
                            <span class="account-email">${currentUserEmail || ''}</span>
                        </div>
                    </div>
                    <button class="btn-switch-account" id="btnSwitchAccount" title="Switch Account">
                        <i class="fas fa-exchange-alt"></i> Switch
                    </button>
                </div>
                <div class="rating-selector-inline" id="ratingStarsInline">
                    <span class="rating-label">Your Rating:</span>
                    <div class="stars-container">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                </div>
                <textarea id="reviewCommentInline" placeholder="Tell us about your experience..." rows="4"></textarea>
                <div class="review-form-actions">
                    <button class="btn-submit-review" id="btnSubmitReviewInline">
                        <i class="fas fa-paper-plane"></i> Submit Review
                    </button>
                </div>
            </div>
        </div>

        <!-- toolbar containing sort/filter placed outside the orange header so header looks less busy -->
        <div class="reviews-controls reviews-toolbar">
            <label for="reviewsSort">Filter by:</label>
            <select id="reviewsSort">
                <option value="all">All reviews</option>
                <option value="5stars">5 stars</option>
                <option value="4stars">4 stars</option>
                <option value="3stars">3 stars</option>
                <option value="2stars">2 stars</option>
                <option value="1star">1 star</option>
            </select>
        </div>

        <div id="reviewsListModal" class="reviews-modal-list">
            <div class="loading">Loading reviews...</div>
        </div>
    `;

    // Tint the FAB button to match the header gradient
    if (_reviewPinColor && _reviewLighterColor) {
        const _fab = document.getElementById('btnAddReviewModal');
        if (_fab) _fab.style.background = `linear-gradient(135deg, ${_reviewLighterColor}, ${_reviewPinColor})`;
    }

    // Delegate Add Review click handling to avoid lost listeners after re-render
    if (modal && !modal._addReviewClickHandler) {
        modal._addReviewClickHandler = function (ev) {
            const btn = ev.target && ev.target.closest ? ev.target.closest('#btnAddReviewModal') : null;
            if (!btn) return;
            ev.preventDefault();
            ev.stopPropagation();

            if (!checkLoginStatus()) {
                modal.style.display = 'none';
                openLoginModal(restaurantId);
                return;
            }

            const reviewForm = document.getElementById('addReviewFormInline');
            const reviewComment = document.getElementById('reviewCommentInline');
            if (reviewForm) reviewForm.style.display = 'block';
            if (reviewComment) reviewComment.focus();
        };
        modal.addEventListener('click', modal._addReviewClickHandler);
    }

    // Ensure we have reviews data for this restaurant; if not, fetch
    if (!currentReviewsData || currentReviewsData.restaurantId !== restaurantId) {
        try {
            const resp = await fetch(`api/restaurants.php?action=getRatings&restaurant_id=${restaurantId}`);
            const reviews = await resp.json();
            currentReviewsData = { restaurantId, reviews };
        } catch (e) {
            document.getElementById('reviewsListModal').innerHTML = '<div class="error-message">Failed to load reviews</div>';
            return;
        }
    }

    // Render reviews with controls
    const reviewState = {
        sort: document.getElementById('reviewsSort') ? document.getElementById('reviewsSort').value : 'newest'
    };

    // Helper to update header dynamically
    function updateHeader(avg, count) {
    document.getElementById('modalOverallRating').innerHTML = generateStarRating(avg, true, 'ratings');
        document.getElementById('modalReviewsCount').textContent = `${count} ${count === 1 ? 'review' : 'reviews'}`;
    }

    function render() {
        const all = Array.isArray(currentReviewsData.reviews) ? currentReviewsData.reviews.slice() : [];
        // compute stats
        const count = all.length;
        const avg = count ? (all.reduce((s, r) => s + parseFloat(r.rating), 0) / count) : 0;
        updateHeader(avg, count);

        // sort
        const sorted = sortReviews(all, reviewState.sort);

        // show all reviews (no pagination)
        const pageItems = sorted;

        const listEl = document.getElementById('reviewsListModal');
        if (pageItems.length === 0) {
            listEl.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
        } else {
            listEl.innerHTML = pageItems.map(r => renderReviewItem(r)).join('');
        }

    }

    // attach sort handler
    const sortEl = document.getElementById('reviewsSort');
    sortEl.addEventListener('change', (e) => {
        reviewState.sort = e.target.value;
        render();
    });

    render();
    
    // Add Review button handler
    const btnAddReview = document.getElementById('btnAddReviewModal');
    if (btnAddReview) {
        btnAddReview.addEventListener('click', () => {
            // Check if user is logged in
            if (!checkLoginStatus()) {
                modal.style.display = 'none'; // Close reviews modal
                openLoginModal(restaurantId);
                return;
            }
            
            // Show the review form
            const reviewForm = document.getElementById('addReviewFormInline');
            const reviewComment = document.getElementById('reviewCommentInline');
            if (reviewForm) reviewForm.style.display = 'block';
            if (reviewComment) reviewComment.focus();
        });
    } else {
        console.error('Add Review button not found in DOM');
    }
    
    // Inline review form handlers
    let selectedRating = 0;
    
    // Cancel button
    const btnCancelReview = document.getElementById('btnCancelReview');
    if (btnCancelReview) {
        btnCancelReview.addEventListener('click', () => {
            const reviewForm = document.getElementById('addReviewFormInline');
            const reviewComment = document.getElementById('reviewCommentInline');
            if (reviewForm) reviewForm.style.display = 'none';
            if (reviewComment) reviewComment.value = '';
            selectedRating = 0;
            // Reset stars
            document.querySelectorAll('#ratingStarsInline .stars-container i').forEach(star => {
                star.classList.remove('fas');
                star.classList.add('far');
            });
        });
    }
    
    // Switch account button
    const btnSwitchAccount = document.getElementById('btnSwitchAccount');
    if (btnSwitchAccount) {
        btnSwitchAccount.addEventListener('click', () => {
            // Close review form and modal
            const reviewForm = document.getElementById('addReviewFormInline');
            if (reviewForm) reviewForm.style.display = 'none';
            modal.style.display = 'none';
            // Clear current user session
            localStorage.removeItem('foodcrawl_user');
            isUserLoggedIn = false;
            currentUserEmail = null;
            currentUserName = null;
            currentUserPicture = null;
            // Open login modal
            openLoginModal(restaurantId);
        });
    }
    
    // Star rating selection
    const starsContainer = document.querySelectorAll('#ratingStarsInline .stars-container i');
    starsContainer.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            // Update star display
            starsContainer.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            starsContainer.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('fas');
                    s.classList.remove('far');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
    
    document.getElementById('ratingStarsInline').addEventListener('mouseleave', () => {
        // Restore selected rating
        starsContainer.forEach((s, i) => {
            if (i < selectedRating) {
                s.classList.add('fas');
                s.classList.remove('far');
            } else {
                s.classList.remove('fas');
                s.classList.add('far');
            }
        });
    });
    
    // Submit button
    const btnSubmitReview = document.getElementById('btnSubmitReviewInline');
    if (btnSubmitReview) {
        btnSubmitReview.addEventListener('click', async () => {
            const commentField = document.getElementById('reviewCommentInline');
            const comment = commentField ? commentField.value.trim() : '';
            
            if (selectedRating === 0) {
                alert('Please select a rating');
                return;
            }
            
            if (!comment) {
                alert('Please write a comment');
                return;
            }
            
            // Submit review
            try {
                const response = await fetch('api/restaurants.php?action=addRating', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        restaurant_id: restaurantId,
                        rating: selectedRating,
                        reviewer_name: currentUserName || currentUserEmail,
                        comment: comment,
                        profile_picture: currentUserPicture || null
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Review submitted successfully!');
                    // Reset form
                    const reviewForm = document.getElementById('addReviewFormInline');
                    if (reviewForm) reviewForm.style.display = 'none';
                    if (commentField) commentField.value = '';
                    selectedRating = 0;
                    starsContainer.forEach(star => {
                        star.classList.remove('fas');
                        star.classList.add('far');
                    });
                    
                    // Reload reviews
                    currentReviewsData = null;
                    const resp = await fetch(`api/restaurants.php?action=getRatings&restaurant_id=${restaurantId}`);
                    const reviews = await resp.json();
                    currentReviewsData = { restaurantId, reviews };
                    reviewState.page = 1;
                    render();
                    
                    // Update main reviews count
                    loadRestaurantReviews(restaurantId);
                } else {
                    alert('Failed to submit review: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('Failed to submit review. Please try again.');
            }
        });
    }
    
    // Delegate report/delete button clicks
    const listElMain = document.getElementById('reviewsListModal');
    if (!listElMain.dataset.listenerAttached) {
        listElMain.addEventListener('click', async (ev) => {
            // Delete handler (only visible when the reviewer matches current user)
            const delBtn = ev.target.closest('.btn-delete');
            if (delBtn) {
                const reviewId = delBtn.getAttribute('data-id');
                if (!confirm('Delete this review? This action cannot be undone.')) return;
                delBtn.disabled = true;
                delBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    try {
                    const resp = await fetch('api/delete_review.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ review_id: parseInt(reviewId), requester_name: (typeof currentUserName !== 'undefined' ? currentUserName : (window.currentUser?.name || null)) })
                    });
                    const data = await resp.json();
                    if (data.success) {
                        notify.success(data.message || 'Review deleted');
                        const item = delBtn.closest('.review-item');
                        if (item) item.remove();
                        if (currentReviewRestaurantId) loadRestaurantReviews(currentReviewRestaurantId);
                    } else {
                        notify.error(data.message || 'Failed to delete review');
                        delBtn.disabled = false;
                        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    }
                } catch (err) {
                    console.error('Delete error', err);
                    notify.error('Network error');
                    delBtn.disabled = false;
                    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                }
                return;
            }

            // Report handler
            const btn = ev.target.closest('.btn-report');
            if (!btn) return;

            const reviewId = btn.getAttribute('data-id');

            // Ask for confirmation and reason
            const reason = prompt('Please provide a reason for reporting this review (optional):');
            if (reason === null) return; // User cancelled

            // Disable button while submitting
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('api/report_review.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        review_id: parseInt(reviewId),
                        reason: reason || 'No reason provided',
                        reporter_name: window.currentUser?.name || 'Anonymous'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    notify.success(data.message || 'Report submitted successfully');
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-flag"></i>';
                    }, 3000);
                } else {
                    notify.error(data.message || 'Failed to submit report');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-flag"></i>';
                }
            } catch (error) {
                console.error('Report error:', error);
                notify.error('Network error. Please try again.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-flag"></i>';
            }
        });
        listElMain.dataset.listenerAttached = '1';
    }
}

function closeReviewsDisplayModal() {
    const modal = document.getElementById('reviewsDisplayModal');
    if (!modal) return;

    if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
        return;
    }

    modal.classList.remove('active');

    if (modal._closeOnEnd) modal.removeEventListener('transitionend', modal._closeOnEnd);
    if (modal._closeTimer) clearTimeout(modal._closeTimer);

    const onEnd = () => {
        modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
        modal._closeOnEnd = null;
    };
    modal._closeOnEnd = onEnd;
    modal.addEventListener('transitionend', onEnd);
    modal._closeTimer = setTimeout(() => {
        if (modal.style.display !== 'none') modal.style.display = 'none';
        modal._closeOnEnd = null;
        modal._closeTimer = null;
    }, 420);
    // clean up overlay click handler if attached
    try {
        if (modal._overlayClickHandler) {
            modal.removeEventListener('click', modal._overlayClickHandler);
            modal._overlayClickHandler = null;
        }
    } catch (e) {
        console.warn('Error removing reviews modal overlay handler', e);
    }
}

function openReviewModal(restaurantId) {
    // Check if user is logged in
    if (!checkLoginStatus()) {
        openLoginModal(restaurantId);
        return;
    }
    
    currentReviewRestaurantId = restaurantId;
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'block';
    
    // Reset form
    document.getElementById('modalSelectedRating').value = '0';
    document.getElementById('modalReviewerName').value = currentUserName || currentUserEmail || '';
    document.getElementById('modalReviewComment').value = '';
    
    // Reset stars
    const stars = document.querySelectorAll('#modalStarRating .fa-star');
    stars.forEach(star => {
        star.style.color = '#ddd';
        star.classList.remove('selected');
    });
    
    // Initialize star rating for modal
    initializeModalStarRating();
}

function openLoginModal(restaurantId = null) {
    if (restaurantId) {
        currentReviewRestaurantId = restaurantId;
    }
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
    // Use requestAnimationFrame to ensure display:block is applied before adding active class
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    // Initialize Google Sign-In button
    setTimeout(() => {
            const googleBtnTarget = document.getElementById('googleButtonContainer');
            if (googleBtnTarget) {
                googleBtnTarget.innerHTML = '';
            }

            if (typeof google !== 'undefined' && google.accounts && googleBtnTarget) {
            google.accounts.id.initialize({
                client_id: '6275535065-cboqtf739hoiq2k621v4f7edsvmf10io.apps.googleusercontent.com',
                callback: handleGoogleCredentialResponse
            });
            // Render into the dedicated container if present so the manual form isn't affected
            google.accounts.id.renderButton(
                googleBtnTarget,
                { 
                    theme: "outline", 
                    size: "large",
                    width: 240,
                    text: "signin_with"
                }
            );

            // Fallback when Google script loads but button fails to render for any reason.
            setTimeout(() => {
                if (!googleBtnTarget || googleBtnTarget.childElementCount > 0) return;
                googleBtnTarget.innerHTML = `
                    <button type="button" class="btn-google-login btn-google-fallback" onclick="if(window.google&&google.accounts&&google.accounts.id){google.accounts.id.prompt();}">
                        <i class="fab fa-google" aria-hidden="true"></i>
                        Continue with Google
                    </button>
                    <p class="google-fallback-note">If this does not open, refresh and try again.</p>
                `;
            }, 350);
        } else if (googleBtnTarget) {
            googleBtnTarget.innerHTML = `
                <button type="button" class="btn-google-login btn-google-fallback" onclick="window.location.reload()">
                    <i class="fab fa-google" aria-hidden="true"></i>
                    Continue with Google
                </button>
                <p class="google-fallback-note">Google sign-in is still loading. Tap to refresh.</p>
            `;
        }
    }, 100);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    // Remove active class to trigger close animation
    modal.classList.remove('active');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
    }, 350);
}

function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Derive a display name from the email local-part (e.g. 'john.doe' -> 'John Doe')
    function deriveNameFromEmail(e) {
        try {
            const local = (e || '').split('@')[0] || '';
            if (!local) return e;
            return local.split(/[\.\-_]/).filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        } catch (err) {
            return e;
        }
    }

    // Simple validation: only require email and password for manual login
    if (email && password) {
        // We will verify the provided Gmail address via Google Sign-In (OAuth) to confirm ownership.
        // Set pendingEmailVerification so the Google callback can validate the signed-in account.
        pendingEmailVerification = email;

        // Inform the user to complete verification via Google sign-in popup
        if (typeof notify !== 'undefined') {
            notify.info('Please complete the Google sign-in prompt to verify your Gmail account.');
        }

        // Try to show Google One Tap / prompt. If unavailable, fall back to instructing the user to click the Google button.
        if (typeof google !== 'undefined' && google.accounts && typeof google.accounts.id !== 'undefined') {
            try {
                // This will show the One Tap prompt or account chooser depending on browser state
                google.accounts.id.prompt();
            } catch (err) {
                console.warn('google.accounts.id.prompt failed', err);
            }
        } else {
            // Attempt to dynamically load the Google Identity library and then prompt the sign-in flow.
            // This makes the verification automatic when the user clicks the manual "Log in" button.
            const GSI_SRC = 'https://accounts.google.com/gsi/client';

            // Inform user that we're loading Google Sign-In
            if (typeof notify !== 'undefined') {
                notify.info('Loading Google Sign-In to verify your email...');
            }

            // Create a script tag and load the library
            const existingScript = document.querySelector(`script[src="${GSI_SRC}"]`);
            if (!existingScript) {
                const s = document.createElement('script');
                s.src = GSI_SRC;
                s.async = true;
                s.defer = true;
                let handled = false;
                s.onload = function() {
                    handled = true;
                    try {
                        if (typeof google !== 'undefined' && google.accounts) {
                            google.accounts.id.initialize({
                                client_id: '6275535065-cboqtf739hoiq2k621v4f7edsvmf10io.apps.googleusercontent.com',
                                callback: handleGoogleCredentialResponse
                            });
                            // Prompt account chooser / One Tap
                            try { google.accounts.id.prompt(); } catch (e) { console.warn('google.accounts.id.prompt failed after dynamic load', e); }
                        } else {
                            const msg = 'Google Sign-In failed to load correctly. Please ensure scripts are allowed and try again.';
                            if (typeof notify !== 'undefined') notify.error(msg); else alert(msg);
                        }
                    } catch (err) {
                        console.error('Error initializing Google after dynamic load', err);
                        const msg = 'Google Sign-In initialization error. Please try again.';
                        if (typeof notify !== 'undefined') notify.error(msg); else alert(msg);
                    }
                };
                s.onerror = function() {
                    if (handled) return;
                    const msg = 'Failed to load Google Sign-In. Please check your network or browser settings.';
                    if (typeof notify !== 'undefined') notify.error(msg); else alert(msg);
                };
                document.head.appendChild(s);
            } else {
                // Script already present but google object not ready yet; attempt to initialize after a short delay
                setTimeout(() => {
                    if (typeof google !== 'undefined' && google.accounts) {
                        try {
                            google.accounts.id.initialize({
                                client_id: '6275535065-cboqtf739hoiq2k621v4f7edsvmf10io.apps.googleusercontent.com',
                                callback: handleGoogleCredentialResponse
                            });
                            google.accounts.id.prompt();
                        } catch (err) {
                            console.error('Error initializing google after existing script found', err);
                            const msg = 'Google Sign-In initialization error. Please try again.';
                            if (typeof notify !== 'undefined') notify.error(msg); else alert(msg);
                        }
                    } else {
                        const msg = 'Google Sign-In is not available. Please ensure the Google Identity script is allowed.';
                        if (typeof notify !== 'undefined') notify.error(msg); else alert(msg);
                    }
                }, 300);
            }

            // Keep pendingEmailVerification set so when the Google library becomes available
            // and the user completes sign-in, the callback will validate it.
            return;
        }

        // Do not immediately store the manual credentials — wait for Google verification in the callback.
        return;
    }

    // If validation fails, show an error
    if (!email || !password) {
        if (typeof notify !== 'undefined') notify.error('Please enter your email and password');
        return;
    }
    // Note: we do not store manual credentials locally until Google verification occurs in the credential callback
}

function handleGoogleLogin() {
    // Trigger Google One Tap or redirect to Google OAuth
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt();
    } else {
        alert('Google Sign-In is loading. Please try again in a moment.');
    }
}

function openSignupModal(event) {
    event.preventDefault();
    alert('Sign up functionality will be added');
}

function logout() {
    // Sign out from Google if signed in via Google
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
    
    localStorage.removeItem('foodcrawl_user');
    isUserLoggedIn = false;
    currentUserEmail = null;
    currentUserName = null;
    currentUserPicture = null;
    
    if (typeof notify !== 'undefined') {
        notify.success('Logged out successfully!');
    } else {
        alert('Logged out successfully!');
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'none';
    currentReviewRestaurantId = null;
}

function initializeModalStarRating() {
    const starContainer = document.getElementById('modalStarRating');
    if (!starContainer) return;
    
    const stars = starContainer.querySelectorAll('.fa-star');
    
    stars.forEach((star, index) => {
        // Hover effect
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.color = '#ffa500';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
        
        // Click to select
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            document.getElementById('modalSelectedRating').value = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.style.color = '#ffa500';
                    s.classList.add('selected');
                } else {
                    s.style.color = '#ddd';
                    s.classList.remove('selected');
                }
            });
        });
    });
    
    // Reset on mouse leave
    starContainer.addEventListener('mouseleave', () => {
        const selectedRating = parseInt(document.getElementById('modalSelectedRating').value);
        stars.forEach((s, i) => {
            if (i < selectedRating) {
                s.style.color = '#ffa500';
            } else {
                s.style.color = '#ddd';
            }
        });
    });
}

async function submitModalRating() {
    const restaurantId = currentReviewRestaurantId;
    const rating = document.getElementById('modalSelectedRating').value;
    const name = document.getElementById('modalReviewerName').value.trim();
    const comment = document.getElementById('modalReviewComment').value.trim();
    
    // Validation
    if (rating === '0' || rating < 1) {
        notify.error('Please select a rating');
        return;
    }
    
    if (!name) {
        notify.error('Please enter your name');
        return;
    }
    
    if (!comment) {
        notify.error('Please enter a comment');
        return;
    }
    
    try {
        const response = await fetch('api/restaurants.php?action=addRating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurant_id: restaurantId,
                rating: parseInt(rating),
                reviewer_name: name,
                comment: comment,
                profile_picture: currentUserPicture || null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            notify.success('Review submitted successfully!');
            delete popupRatingsCache[restaurantId];
            closeReviewModal();
            loadRestaurantReviews(restaurantId);
        } else {
            notify.error(result.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        notify.error('Error submitting review. Please try again.');
    }
}

// Hide rating form
function hideRatingForm(restaurantId) {
    const form = document.getElementById(`ratingForm-${restaurantId}`);
    if (form) {
        form.style.display = 'none';
        // Reset form
        document.getElementById(`selectedRating-${restaurantId}`).value = '0';
        document.getElementById(`reviewerName-${restaurantId}`).value = '';
        document.getElementById(`reviewComment-${restaurantId}`).value = '';
        resetStars(restaurantId);
    }
}

// Initialize star rating interaction
function initializeStarRating(restaurantId) {
    const starContainer = document.querySelector(`.star-rating[data-restaurant-id="${restaurantId}"]`);
    if (!starContainer) return;
    
    const stars = starContainer.querySelectorAll('.fa-star');
    
    stars.forEach((star, index) => {
        // Hover effect
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.color = '#ffa500';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
        
        // Click to select
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-rating');
            document.getElementById(`selectedRating-${restaurantId}`).value = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.style.color = '#ffa500';
                    s.classList.add('selected');
                } else {
                    s.style.color = '#ddd';
                    s.classList.remove('selected');
                }
            });
        });
    });
    
    // Reset on mouse leave
    starContainer.addEventListener('mouseleave', () => {
        const selectedRating = parseInt(document.getElementById(`selectedRating-${restaurantId}`).value);
        stars.forEach((s, i) => {
            if (i < selectedRating) {
                s.style.color = '#ffa500';
            } else {
                s.style.color = '#ddd';
            }
        });
    });
}

// Reset stars
function resetStars(restaurantId) {
    const stars = document.querySelectorAll(`.star-rating[data-restaurant-id="${restaurantId}"] .fa-star`);
    stars.forEach(star => {
        star.style.color = '#ddd';
        star.classList.remove('selected');
    });
}

// Submit rating
async function submitRating(restaurantId) {
    const rating = document.getElementById(`selectedRating-${restaurantId}`).value;
    const name = document.getElementById(`reviewerName-${restaurantId}`).value.trim();
    const comment = document.getElementById(`reviewComment-${restaurantId}`).value.trim();
    
    // Validation
    if (rating === '0' || rating < 1) {
        notify.error('Please select a rating');
        return;
    }
    
    if (!name) {
        notify.error('Please enter your name');
        return;
    }
    
    if (!comment) {
        notify.error('Please enter a comment');
        return;
    }
    
    try {
        const response = await fetch('api/restaurants.php?action=addRating', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurant_id: restaurantId,
                rating: parseInt(rating),
                reviewer_name: name,
                comment: comment
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            notify.success('Review submitted successfully!');
            delete popupRatingsCache[restaurantId];
            hideRatingForm(restaurantId);
            loadRestaurantReviews(restaurantId);
        } else {
            notify.error(result.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        notify.error('Error submitting review. Please try again.');
    }
}

// Load restaurant reviews
async function loadRestaurantReviews(restaurantId) {
    const reviewsList = document.getElementById(`reviewsList-${restaurantId}`);
    const ratingsSummary = document.getElementById(`ratingsSummary-${restaurantId}`);
    const reviewCountBtn = document.getElementById(`reviewCountBtn-${restaurantId}`);
    
    if (!reviewsList) return;
    
    try {
        const response = await fetch(`api/restaurants.php?action=getRatings&restaurant_id=${restaurantId}`);
        const reviews = await response.json();
        
    currentReviewsData = { restaurantId, reviews };
        
        // Calculate and display rating stats
        if (reviews.length > 0) {
            const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;
            const reviewCount = reviews.length;
            
            if (ratingsSummary) {
                ratingsSummary.innerHTML = `
                    <span class="overall-rating">${generateStarRating(avgRating, true, '')}</span>
                    <button class="review-count-btn" onclick="openReviewsModal(${restaurantId})" id="reviewCountBtn-${restaurantId}">
                        <i class="fas fa-comments"></i> ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}
                    </button>
                `;
            }
        } else {
            if (ratingsSummary) {
                ratingsSummary.innerHTML = `
                    <span class="overall-rating">${generateStarRating(0, false)}</span>
                    <button class="review-count-btn" onclick="openReviewsModal(${restaurantId})" id="reviewCountBtn-${restaurantId}">
                        <i class="fas fa-plus"></i> Add Review
                    </button>
                `;
            }
        }
        
        // Store reviews in hidden list for modal display
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
            return;
        }
        
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.profile_picture ? 
                                `<img src="${escapeHtml(review.profile_picture)}" alt="${escapeHtml(review.reviewer_name)}" class="avatar-img">` : 
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">${escapeHtml(review.reviewer_name)}</div>
                            <div class="review-date">${formatDate(review.created_at)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-comment">${escapeHtml(review.comment)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<div class="error-message">Failed to load reviews</div>';
    }
}

// Generate star display
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #ffa500;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #ddd;"></i>';
        }
    }
    return stars;
}

// Render a single review item for the modal
function renderReviewItem(r) {
    const avatar = r.profile_picture ?
        `<img src="${escapeHtml(r.profile_picture)}" alt="${escapeHtml(r.reviewer_name)}" class="avatar-img" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>';">` :
        `<i class="fas fa-user"></i>`;

    const comment = escapeHtml(r.comment);
    const reviewId = `review-${r.id}`;
    // Check if comment is long (more than 3 lines worth of text, approximately 200 characters)
    const isLongComment = comment.length > 200;

    return `
    <div class="review-item modal-review-item">
        <div class="review-header">
            <div class="reviewer-info">
                <div class="reviewer-avatar">${avatar}</div>
                <div class="reviewer-details">
                    <div class="reviewer-name-rating">
                        <span class="reviewer-name">${escapeHtml(r.reviewer_name)}</span>
                        <div class="review-rating-inline">${generateStars(r.rating)}</div>
                    </div>
                    <div class="review-date-time">${formatDateTime(r.created_at)}</div>
                </div>
            </div>
            <div class="review-actions">
                ${ (typeof currentUserName === 'undefined' || !currentUserName || currentUserName !== r.reviewer_name) ? `<button class="btn-report" data-id="${r.id}"><i class="fas fa-flag"></i></button>` : '' }
                ${ (typeof currentUserName !== 'undefined' && currentUserName && currentUserName === r.reviewer_name) ? `<button class="btn-delete" data-id="${r.id}"><i class="fas fa-trash"></i></button>` : '' }
            </div>
        </div>
        <div class="review-comment ${isLongComment ? 'comment-collapsed' : ''}" id="${reviewId}" data-full-comment="${comment.replace(/"/g, '&quot;')}">
            <span class="comment-text">${comment}</span>
            ${isLongComment ? `<button class="btn-see-more" onclick="toggleCommentExpansion('${reviewId}')">See more</button>` : ''}
        </div>
    </div>
    `;
}

// Toggle comment expansion
function toggleCommentExpansion(reviewId) {
    const commentElement = document.getElementById(reviewId);
    const btnElement = commentElement.querySelector('.btn-see-more');
    
    if (commentElement.classList.contains('comment-collapsed')) {
        commentElement.classList.remove('comment-collapsed');
        commentElement.classList.add('comment-expanded');
        btnElement.textContent = 'See less';
    } else {
        commentElement.classList.remove('comment-expanded');
        commentElement.classList.add('comment-collapsed');
        btnElement.textContent = 'See more';
    }
}

// Sort reviews array by criteria
function sortReviews(arr, criteria) {
    const copy = arr.slice();
    switch (criteria) {
        case '5stars':
            return copy.filter(r => parseFloat(r.rating) === 5).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        case '4stars':
            return copy.filter(r => parseFloat(r.rating) === 4).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        case '3stars':
            return copy.filter(r => parseFloat(r.rating) === 3).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        case '2stars':
            return copy.filter(r => parseFloat(r.rating) === 2).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        case '1star':
            return copy.filter(r => parseFloat(r.rating) === 1).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        case 'all':
        default:
            return copy.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

function parseReviewDate(dateString) {
    if (!dateString) return null;
    if (dateString instanceof Date) return Number.isNaN(dateString.getTime()) ? null : dateString;
    if (typeof dateString !== 'string') {
        const d = new Date(dateString);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const raw = dateString.trim();
    if (!raw) return null;

    // MySQL DATETIME typically arrives as "YYYY-MM-DD HH:MM:SS".
    // Convert to ISO-like local time so browsers parse it consistently.
    const mysqlLike = raw.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})$/);
    if (mysqlLike) {
        const localIsoLike = `${mysqlLike[1]}T${mysqlLike[2]}`;
        const localDate = new Date(localIsoLike);
        if (!Number.isNaN(localDate.getTime())) return localDate;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Format date
function formatDate(dateString) {
    const date = parseReviewDate(dateString);
    if (!date) return 'Unknown date';

    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - date.getTime());

    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}

// Format date with actual date and time
function formatDateTime(dateString) {
    const date = parseReviewDate(dateString);
    if (!date) return 'Unknown date';

    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);

    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
        const mins = Math.floor(diffSeconds / 60);
        return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Yesterday at ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago at ${timeStr}`;
    
    // For older dates, show full date with time
    const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    return `${dateStr} at ${timeStr}`;
}

// Close restaurant modal function
function closeRestaurantModal() {
    const modal = document.getElementById('restaurantModal');
    if (!modal) return;

    // If the modal isn't actually open, just make sure it's hidden and exit.
    // This prevents attaching a stale transitionend listener that would close
    // the modal the next time it opens.
    if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
        document.body.classList.remove('restaurant-modal-open');
        return;
    }

    modal.classList.remove('active');
    document.body.classList.remove('restaurant-modal-open');

    // Remove any leftover handler before adding a fresh one
    if (modal._closeOnEnd) {
        modal.removeEventListener('transitionend', modal._closeOnEnd);
    }
    if (modal._closeTimer) clearTimeout(modal._closeTimer);

    const onEnd = () => {
        modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
        modal._closeOnEnd = null;
    };
    modal._closeOnEnd = onEnd;
    modal.addEventListener('transitionend', onEnd);

    modal._closeTimer = setTimeout(() => {
        if (modal.style.display !== 'none') modal.style.display = 'none';
        modal._closeOnEnd = null;
        modal._closeTimer = null;
    }, 420);
}

// Image lightbox for click-to-enlarge behavior
let _lightboxState = null;
function openImageLightbox(images, startIndex = 0) {
    if (!images || images.length === 0) return;
    // If already open, just update image
    let overlay = document.getElementById('imageLightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'imageLightbox';
        overlay.style.position = 'fixed';
        overlay.style.zIndex = 15001;
        overlay.style.left = 0;
        overlay.style.top = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.cursor = 'zoom-out';

        const img = document.createElement('img');
        img.id = 'imageLightboxImg';
        img.style.maxWidth = '94%';
        img.style.maxHeight = '92%';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
        overlay.appendChild(img);

        // Left/right nav
        const leftNav = document.createElement('button');
        leftNav.id = 'imageLightboxPrev';
        leftNav.innerHTML = '&#10094;';
        leftNav.style.position = 'absolute';
        leftNav.style.left = '18px';
        leftNav.style.top = '50%';
        leftNav.style.transform = 'translateY(-50%)';
        leftNav.style.fontSize = '36px';
        leftNav.style.color = 'white';
        leftNav.style.background = 'transparent';
        leftNav.style.border = 'none';
        leftNav.style.cursor = 'pointer';
        leftNav.style.zIndex = 15002;
        overlay.appendChild(leftNav);

        const rightNav = document.createElement('button');
        rightNav.id = 'imageLightboxNext';
        rightNav.innerHTML = '&#10095;';
        rightNav.style.position = 'absolute';
        rightNav.style.right = '18px';
        rightNav.style.top = '50%';
        rightNav.style.transform = 'translateY(-50%)';
        rightNav.style.fontSize = '36px';
        rightNav.style.color = 'white';
        rightNav.style.background = 'transparent';
        rightNav.style.border = 'none';
        rightNav.style.cursor = 'pointer';
        rightNav.style.zIndex = 15002;
        overlay.appendChild(rightNav);

        overlay.addEventListener('click', function(e) {
            // clicking background closes lightbox; clicking image/nav should not bubble
            if (e.target === overlay) closeImageLightbox();
        });

        leftNav.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!_lightboxState) return;
            _lightboxState.index = (_lightboxState.index - 1 + _lightboxState.images.length) % _lightboxState.images.length;
            document.getElementById('imageLightboxImg').src = _lightboxState.images[_lightboxState.index];
        });

        rightNav.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!_lightboxState) return;
            _lightboxState.index = (_lightboxState.index + 1) % _lightboxState.images.length;
            document.getElementById('imageLightboxImg').src = _lightboxState.images[_lightboxState.index];
        });

        document.body.appendChild(overlay);
    }

    _lightboxState = { images: images.slice(), index: startIndex };
    const imgEl = document.getElementById('imageLightboxImg');
    if (imgEl) imgEl.src = _lightboxState.images[_lightboxState.index];

    // Show/hide nav depending on images length
    const prev = document.getElementById('imageLightboxPrev');
    const next = document.getElementById('imageLightboxNext');
    if (prev && next) {
        if (_lightboxState.images.length <= 1) {
            prev.style.display = 'none'; next.style.display = 'none';
        } else {
            prev.style.display = 'block'; next.style.display = 'block';
        }
    }

    // Key handling
    function _onKey(e) {
        if (!_lightboxState) return;
        if (e.key === 'Escape') closeImageLightbox();
        if (e.key === 'ArrowLeft') {
            _lightboxState.index = (_lightboxState.index - 1 + _lightboxState.images.length) % _lightboxState.images.length;
            document.getElementById('imageLightboxImg').src = _lightboxState.images[_lightboxState.index];
        }
        if (e.key === 'ArrowRight') {
            _lightboxState.index = (_lightboxState.index + 1) % _lightboxState.images.length;
            document.getElementById('imageLightboxImg').src = _lightboxState.images[_lightboxState.index];
        }
    }
    document.addEventListener('keydown', _onKey);
    // store for removal
    overlay = document.getElementById('imageLightbox');
    overlay._keyHandler = _onKey;
}

function closeImageLightbox() {
    const overlay = document.getElementById('imageLightbox');
    if (overlay) {
        if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
        overlay.parentNode.removeChild(overlay);
    }
    _lightboxState = null;
}

// Handle Get Directions button - use built-in routing with turn-by-turn panel
function handleGetDirections(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
        notify.error('Restaurant not found.');
        return;
    }

    closeRestaurantModal();
    
    // On mobile, also close sidebar if open
    const isMobile = window.innerWidth <= 768;
    if (isMobile && document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.hidden = true;
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }
    
    // Use built-in routing (shows on-map route + turn-by-turn panel)
    getDirectionsToRestaurant(restaurantId);
}

// Handle View on Map button
function handleViewOnMap(restaurantId) {
    // Prevent any default behavior or event propagation
    event?.preventDefault?.();
    event?.stopPropagation?.();
    
    closeRestaurantModal();

    // On mobile, also close sidebar so the map is fully visible like desktop
    const isMobile = window.innerWidth <= 768;
    if (isMobile && document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.hidden = true;
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    }

    focusOnRestaurant(restaurantId);
    
    const marker = markers.find(m => m.restaurantId === restaurantId);
    if (marker) {
        markers.forEach(m => {
            if (m !== marker && m.isPopupOpen()) {
                m.closePopup();
            }
        });
        
        setTimeout(() => {
            marker.openPopup();
            setTimeout(() => centerOnPopup(marker), 50);
        }, 100);
    }
    
    // Ensure no navigation happens
    return false;
}

// Handle Google Maps button - now uses the same navigation function
function handleGoogleMaps(restaurantId) {
    closeRestaurantModal();
    openGoogleMapsNavigation(restaurantId);
}

// ── SAVED RESTAURANTS ──────────────────────────────────────────────────────
const SAVED_RESTAURANTS_KEY = 'savedRestaurants';

function getSavedRestaurants() {
    try {
        return JSON.parse(localStorage.getItem(SAVED_RESTAURANTS_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function isSavedRestaurant(id) {
    return getSavedRestaurants().includes(Number(id));
}

function toggleSaveRestaurant(id) {
    id = Number(id);
    const saved = getSavedRestaurants();
    const idx = saved.indexOf(id);
    if (idx === -1) {
        saved.push(id);
    } else {
        saved.splice(idx, 1);
    }
    localStorage.setItem(SAVED_RESTAURANTS_KEY, JSON.stringify(saved));
    const nowSaved = saved.includes(id);

    // Show notification
    if (nowSaved) {
        notify.success('Added to saved restaurants', { duration: 2500 });
    } else {
        notify.info('Removed from saved restaurants', { duration: 2500 });
    }

    // Update button appearance in details view
    const btn = document.getElementById(`save-btn-${id}`);
    if (btn) {
        const icon = btn.querySelector('i');
        const label = btn.querySelector('.action-label');
        if (icon) {
            icon.className = (nowSaved ? 'fas' : 'far') + ' fa-bookmark';
        }
        if (label) label.textContent = nowSaved ? 'Saved' : 'Save';
        btn.classList.toggle('btn-save--active', nowSaved);
        btn.classList.remove('save-animate');
        void btn.offsetWidth;
        btn.classList.add('save-animate');
    }

    // Update popup favorite button appearance
    const popupBtns = document.querySelectorAll('.popup-favorite-btn');
    popupBtns.forEach(popupBtn => {
        // Check if this button is for the current restaurant by looking at nearby elements
        const popupContent = popupBtn.closest('.popup-card') || popupBtn.closest('.popup-content');
        if (popupContent) {
            popupBtn.classList.toggle('is-active', nowSaved);
            popupBtn.setAttribute('aria-pressed', nowSaved);
            const icon = popupBtn.querySelector('i');
            if (icon) {
                icon.className = (nowSaved ? 'fas' : 'far') + ' fa-bookmark';
            }
            popupBtn.classList.remove('save-animate');
            void popupBtn.offsetWidth;
            popupBtn.classList.add('save-animate');
        }
    });

    // Refresh saved panel if open
    if (document.getElementById('savedPanel')?.classList.contains('active')) {
        renderSavedPanel();
    }
}

// ── FOOTER NAV FUNCTIONS ─────────────────────────────────────────────────────
function footerGoHome() {
    const CENTER = [11.456453464374693, 123.15114185203521];
    if (!map) return;
    if (typeof map.easeTo === 'function') {
        map.easeTo({ center: [CENTER[1], CENTER[0]], zoom: INITIAL_ZOOM, bearing: 0, pitch: 0, duration: 800 });
    } else if (typeof map.setView === 'function') {
        map.setView(CENTER, INITIAL_ZOOM, { animate: true });
    }
}

let _layersSheetInited = false;

function footerToggleLayers() {
    const sheet = document.getElementById('layersSheet');
    if (!sheet) return;
    if (sheet.classList.contains('active')) {
        closeLayersSheet();
    } else {
        openLayersSheet();
    }
}

function openLayersSheet() {
    if (!_layersSheetInited) {
        _initLayersSheet();
        _layersSheetInited = true;
    }
    _syncLayersSheet();
    const panel = document.getElementById('layersSheet');
    panel?.classList.add('active');
    document.getElementById('layersSheetBackdrop')?.classList.add('active');
    document.getElementById('footerLayersBtn')?.classList.add('nav-btn--active');
    document.body.classList.add('saved-panel-open');
    _initSwipeToClose(panel, closeLayersSheet, panel?.querySelector('.saved-panel-body'));
}

function closeLayersSheet() {
    document.getElementById('layersSheet')?.classList.remove('active');
    document.getElementById('layersSheetBackdrop')?.classList.remove('active');
    document.getElementById('footerLayersBtn')?.classList.remove('nav-btn--active');
    document.body.classList.remove('saved-panel-open');
}

function _syncLayersSheet() {
    // Sync base layer radio
    const activeBase = document.querySelector('.layers-panel input[name="baseLayer"]:checked')?.value || 'Standard';
    document.querySelectorAll('#layersSheet input[name="sheetBaseLayer"]').forEach(r => {
        r.checked = r.value === activeBase;
    });
    // Sync overlay checkboxes
    ['coverageLayerToggle', 'restaurantsLayerToggle', 'statusDotsToggle'].forEach(id => {
        const orig = document.getElementById(id);
        const sheet = document.getElementById('sheet_' + id);
        if (orig && sheet) sheet.checked = orig.checked;
    });
}

function _initLayersSheet() {
    // Proxy base layer radios → real hidden control
    document.querySelectorAll('#layersSheet input[name="sheetBaseLayer"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const orig = document.querySelector(`.layers-panel input[name="baseLayer"][value="${this.value}"]`);
            if (orig) { orig.checked = true; orig.dispatchEvent(new Event('change', { bubbles: true })); }
        });
    });
    // Proxy overlay checkboxes → real hidden controls
    ['coverageLayerToggle', 'restaurantsLayerToggle', 'statusDotsToggle'].forEach(id => {
        const sheet = document.getElementById('sheet_' + id);
        if (sheet) {
            sheet.addEventListener('change', function() {
                const orig = document.getElementById(id);
                if (orig) { orig.checked = this.checked; orig.dispatchEvent(new Event('change', { bubbles: true })); }
            });
        }
    });
}

function footerToggleLegend() {
    const sheet = document.getElementById('legendSheet');
    if (!sheet) return;
    if (sheet.classList.contains('active')) {
        closeLegendSheet();
    } else {
        openLegendSheet();
    }
}

function openLegendSheet() {
    _renderLegendSheet();
    const panel = document.getElementById('legendSheet');
    panel?.classList.add('active');
    document.getElementById('legendSheetBackdrop')?.classList.add('active');
    document.getElementById('footerLegendBtn')?.classList.add('nav-btn--active');
    document.body.classList.add('saved-panel-open');
    _initSwipeToClose(panel, closeLegendSheet, document.getElementById('legendSheetBody'));
}

function closeLegendSheet() {
    document.getElementById('legendSheet')?.classList.remove('active');
    document.getElementById('legendSheetBackdrop')?.classList.remove('active');
    document.getElementById('footerLegendBtn')?.classList.remove('nav-btn--active');
    document.body.classList.remove('saved-panel-open');
}

function _renderLegendSheet() {
    const body = document.getElementById('legendSheetBody');
    if (!body) return;
    body.innerHTML = '';
    const activeCategory = getActiveCategoryFilter();
    const chips = document.querySelectorAll('#categoryChipsContainer .category-chip[data-category]');
    chips.forEach(chip => {
        const category = (chip.dataset.category || '').trim();
        if (!category || category === 'all') return;
        if (chip.hidden || chip.style.display === 'none') return;
        const color = (chip.style.getPropertyValue('--chip-color') || '').trim() || '#6b7280';
        const labelEl = chip.querySelector('span');
        const label = (labelEl ? labelEl.textContent : category).trim();
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.dataset.category = category;
        item.innerHTML = `<span class="legend-color-dot" style="background:${color};"></span><span class="legend-label"></span>`;
        item.querySelector('.legend-label').textContent = label;
        if (activeCategory === category) item.classList.add('active');
        item.addEventListener('click', function() {
            applyLegendCategoryFilter(category);
            _renderLegendSheet();
        });
        body.appendChild(item);
    });
    if (!body.children.length) {
        body.innerHTML = '<div class="saved-panel-empty"><i class="fas fa-list"></i><p>No categories to show.</p></div>';
    }
}

function footerLocateMe() {
    locateUser({ suppressCenter: false });
}

function _updateFooterActive(btnId, isActive) {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.toggle('nav-btn--active', !!isActive);
}

// ── SAVED PANEL ──────────────────────────────────────────────────────────────
function renderSavedPanel() {
    const body = document.getElementById('savedPanelBody');
    if (!body) return;
    const savedIds = getSavedRestaurants();

    if (!savedIds.length) {
        body.innerHTML = `<div class="saved-panel-empty"><i class="far fa-bookmark"></i><p>No saved restaurants yet.<br>Tap the bookmark icon on any restaurant to save it.</p></div>`;
        return;
    }

    const savedRests = savedIds.map(id => restaurants.find(r => Number(r.id) === id)).filter(Boolean);

    if (!savedRests.length) {
        body.innerHTML = `<div class="saved-panel-empty"><i class="far fa-bookmark"></i><p>No saved restaurants found.</p></div>`;
        return;
    }

    body.innerHTML = savedRests.map(r => {
            const categoryIconClass = getCategoryIconClass(r.category);
            const pinColor = getCategoryColor(r.category);
            const imgHtml = r.image_path
                ? `<img class="saved-item-img" src="${r.image_path}" alt="${r.name}" loading="lazy">`
                : `<div class="saved-item-img-placeholder" style="background:${pinColor};"><i class="fas ${categoryIconClass}"></i></div>`;
        return `
        <div class="saved-item" onclick="closeSavedPanel(); setTimeout(()=>showRestaurantDetails(${r.id}),200);">
            ${imgHtml}
            <div class="saved-item-info">
                <div class="saved-item-name">${r.name}</div>
                <div class="saved-item-category">${r.category || ''}</div>
            </div>
            <button class="saved-item-unsave" title="Remove saved" onclick="event.stopPropagation(); toggleSaveRestaurant(${r.id});" aria-label="Remove from saved">
                <i class="fas fa-bookmark"></i>
            </button>
        </div>`;
    }).join('');
}

function showSavedRestaurantsPanel() {
    renderSavedPanel();
    const panel = document.getElementById('savedPanel');
    panel?.classList.add('active');
    document.getElementById('savedPanelBackdrop')?.classList.add('active');
    document.body.classList.add('saved-panel-open');
    document.getElementById('footerSavedBtn')?.classList.add('nav-btn--active');
    _initSwipeToClose(panel, closeSavedPanel, document.getElementById('savedPanelBody'));
}

function closeSavedPanel() {
    document.getElementById('savedPanel')?.classList.remove('active');
    document.getElementById('savedPanelBackdrop')?.classList.remove('active');
    document.body.classList.remove('saved-panel-open');
    document.getElementById('footerSavedBtn')?.classList.remove('nav-btn--active');
}

// Focus map on specific restaurant
function focusOnRestaurant(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
        map.setView([restaurant.latitude, restaurant.longitude], 16);
    }
}

// BUILT-IN ROUTING SYSTEM
// =======================

// Current route destination info
let currentRouteDestination = null;

// Main function to get directions using built-in routing - automatically gets user location
function getDirectionsToRestaurant(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
        notify.error('Restaurant not found.');
        return;
    }
    
    // Show loading modal
    showLoadingModal('Getting directions...');

    // Close the restaurant details modal when starting directions
    if (typeof closeRestaurantModal === 'function') closeRestaurantModal();

    // Clear any existing route
    clearRoute();

    // Keep only the destination marker visible while routing
    hideMarkersDuringRouting = true;

    // Remove all restaurant markers except the destination
    hideAllRestaurantMarkersExcept(restaurantId);

    // Store destination for navigation
    currentRouteDestination = {
        id: restaurantId,
        lat: restaurant.latitude,
        lng: restaurant.longitude,
        name: restaurant.name
    };

    // Automatically get user location when directions are requested
    if (!userLocation) {
        // Do not auto-center the map when locating as part of directions flow
        locateUser({ suppressCenter: true }).then(() => {
            // After location is obtained, calculate the route
            calculateRoute(
                userLocation.lat, userLocation.lng,
                restaurant.latitude, restaurant.longitude,
                restaurant.name
            );
        }).catch((error) => {
            notify.error('Failed to get your location. Please enable location services.');
            currentRouteDestination = null;
            hideLoadingModal();
            // Show all restaurants again since directions failed
            hideMarkersDuringRouting = false;
            showAllRestaurantMarkers();
        });
    } else {
        // User location already available, calculate route immediately
        calculateRoute(
            userLocation.lat, userLocation.lng,
            restaurant.latitude, restaurant.longitude,
            restaurant.name
        );
    }
}

// Hide all restaurant markers except the specified one
function hideAllRestaurantMarkersExcept(restaurantId) {
    if (USE_WEBGL_RESTAURANT_MARKERS && map && map.getLayer && map.getLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID)) {
        setActiveRestaurantMarker(restaurantId);
        try {
            map.setFilter(MAPBOX_RESTAURANT_MARKER_LAYER_ID, ['==', ['to-number', ['get', 'restaurantId']], Number(restaurantId)]);
            if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                map.setFilter(MAPBOX_RESTAURANT_LABEL_LAYER_ID, ['==', ['to-number', ['get', 'restaurantId']], Number(restaurantId)]);
            }
        } catch (e) { /* ignore */ }

        const marker = markers.find(m => Number(m.restaurantId) === Number(restaurantId));
        if (marker && !hideMarkersDuringRouting) marker.openPopup();
        if (marker && hideMarkersDuringRouting) marker.closePopup();
        return;
    }

    allRestaurantMarkers.forEach(marker => {
        if (marker.restaurantId !== restaurantId) {
            map.removeLayer(marker);
        } else {
            // Ensure the destination marker is visible
            if (!map.hasLayer(marker)) {
                map.addLayer(marker);
            }
            // Avoid auto-opening popups during routing to keep the view clean
            if (!hideMarkersDuringRouting) {
                marker.openPopup();
            } else {
                marker.closePopup();
            }
        }
    });
}

// Show all restaurant markers again
function showAllRestaurantMarkers() {
    if (USE_WEBGL_RESTAURANT_MARKERS && map && map.getLayer) {
        if (!map.getLayer(MAPBOX_RESTAURANT_MARKER_LAYER_ID)) {
            const fallbackList = (Array.isArray(currentMarkerRestaurants) && currentMarkerRestaurants.length)
                ? currentMarkerRestaurants
                : (Array.isArray(restaurants) ? restaurants : []);
            if (fallbackList.length) {
                addMarkersToMap(fallbackList);
            }
            return;
        }
        try {
            if (hideMarkersDuringRouting && currentRouteDestination && currentRouteDestination.id) {
                const destinationId = Number(currentRouteDestination.id);
                map.setFilter(MAPBOX_RESTAURANT_MARKER_LAYER_ID, ['==', ['to-number', ['get', 'restaurantId']], destinationId]);
                if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                    map.setFilter(MAPBOX_RESTAURANT_LABEL_LAYER_ID, ['==', ['to-number', ['get', 'restaurantId']], destinationId]);
                }
            } else {
                map.setFilter(MAPBOX_RESTAURANT_MARKER_LAYER_ID, null);
                if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                    map.setFilter(MAPBOX_RESTAURANT_LABEL_LAYER_ID, null);
                }
            }

            map.setLayoutProperty(MAPBOX_RESTAURANT_MARKER_LAYER_ID, 'visibility', webglRestaurantLayerVisible ? 'visible' : 'none');
            syncSelectedRestaurantMarkerLayer();
            if (map.getLayer(MAPBOX_RESTAURANT_LABEL_LAYER_ID)) {
                map.setLayoutProperty(MAPBOX_RESTAURANT_LABEL_LAYER_ID, 'visibility', webglRestaurantLayerVisible ? 'visible' : 'none');
            }
        } catch (e) { /* ignore */ }
        return;
    }

    allRestaurantMarkers.forEach(marker => {
        const shouldHideForRoute = hideMarkersDuringRouting && currentRouteDestination && marker.restaurantId !== currentRouteDestination.id;
        if (shouldHideForRoute) {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
            return;
        }

        if (!map.hasLayer(marker)) {
            map.addLayer(marker);
        }
    });
}

// Core routing function using Mapbox Directions API
async function calculateRoute(startLat, startLng, endLat, endLng, restaurantName) {
    const profiles = ['driving-traffic', 'driving'];
    let lastError = null;
    for (const profile of profiles) {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                displayRouteOnMap(route, restaurantName);
                displayRouteInstructions(route, restaurantName, endLat, endLng);
                return;
            } else {
                lastError = new Error(`No route found (${profile}): ${data.code || 'unknown'}`);
                console.warn('Routing fallback:', lastError.message);
            }
        } catch (error) {
            lastError = error;
            console.warn(`Routing error with profile ${profile}:`, error);
        }
    }
    console.error('All routing profiles failed:', lastError);
    notify.error('Could not calculate route. Try Google Maps.');
    hideMarkersDuringRouting = false;
    showAllRestaurantMarkers();
    currentRouteDestination = null;
    hideLoadingModal();
}

// Floating navigation controls removed — UI handled via map and route only

function getBoundsFromLatLngs(latLngs) {
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    latLngs.forEach(([lat, lng]) => {
        minLat = Math.min(minLat, lat);
        minLng = Math.min(minLng, lng);
        maxLat = Math.max(maxLat, lat);
        maxLng = Math.max(maxLng, lng);
    });
    return [[minLng, minLat], [maxLng, maxLat]];
}

function renderRouteLine(latLngs, meta = {}) {
    // Save route data immediately so the style.load handler can always re-render it,
    // even if we bail out early because the style isn't ready yet.
    routeLine = { __fcRoute: true, coordinates: latLngs, meta };

    if (!map) return;

    // Do NOT gate on isStyleLoaded() — it returns false even when only tiles are loading
    // (not a style change), which prevents the route line from rendering while
    // renderRouteStepMarkersGL (which has no such guard) succeeds immediately.
    // The try/catch below handles any real style-not-ready errors with an idle retry.

    const geojson = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: latLngs.map(([lat, lng]) => [lng, lat])
        }
    };

    try {
        if (!map.getSource(MAPBOX_ROUTE_SOURCE_ID)) {
            map.addSource(MAPBOX_ROUTE_SOURCE_ID, {
                type: 'geojson',
                data: geojson
            });
        } else {
            map.getSource(MAPBOX_ROUTE_SOURCE_ID).setData(geojson);
        }

        // Add layer for remaining route (blue)
        // Insert before user location layers so the user's pinmark stays on top
        const _beforeUserLayer = map.getLayer(MAPBOX_USER_PULSE_LAYER_ID) ? MAPBOX_USER_PULSE_LAYER_ID : undefined;
        if (!map.getLayer(MAPBOX_ROUTE_LAYER_ID)) {
            map.addLayer({
                id: MAPBOX_ROUTE_LAYER_ID,
                type: 'line',
                source: MAPBOX_ROUTE_SOURCE_ID,
                paint: {
                    'line-color': '#4285f4',
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, 9,
                        14, 11,
                        16, 14,
                        18, 18
                    ],
                    'line-opacity': 0.95
                },
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                }
            }, _beforeUserLayer);
        }

        // Add layer for travelled portion (grey) - this will be updated as user moves
        const TRAVELLED_LAYER_ID = 'route-travelled-layer';
        if (!map.getSource('route-travelled-source')) {
            map.addSource('route-travelled-source', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            });
        }

        if (!map.getLayer(TRAVELLED_LAYER_ID)) {
            // Insert travelled layer on top of route but still below user location layers
            map.addLayer({
                id: TRAVELLED_LAYER_ID,
                type: 'line',
                source: 'route-travelled-source',
                paint: {
                    'line-color': '#9e9e9e',
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, 9,
                        14, 11,
                        16, 14,
                        18, 18
                    ],
                    'line-opacity': 1
                },
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                }
            }, _beforeUserLayer);
        }

        // Store full route coordinates for progress tracking
        window.fullRouteCoordinates = latLngs.map(([lat, lng]) => [lng, lat]);
        // Reset monotonic progress tracking for new route
        window.lastRouteProgress = -1;
        window._routeProgressIndex = 0;
        window._routeProgressFloat = -1;

        // Re-raise user location layers to top so they always appear above route & step markers
        try {
            [MAPBOX_USER_PULSE_LAYER_ID, MAPBOX_USER_OUTLINE_LAYER_ID, MAPBOX_USER_DOT_LAYER_ID].forEach(id => {
                if (map.getLayer(id)) map.moveLayer(id);
            });
        } catch (_) {}

        // Immediately update route progress with current user location
        if (userLocation && userLocation.lat && userLocation.lng) {
            setTimeout(() => updateRouteProgress(userLocation.lat, userLocation.lng), 100);
        }

    } catch (e) {
        console.warn('Failed to render route line', e);
        // Schedule retry on the next idle event so transient errors self-heal
        // (style.load only fires on an actual style change and would never fire otherwise)
        try {
            map && map.once && map.once('idle', () => {
                if (routeLine && routeLine.coordinates) renderRouteLine(routeLine.coordinates, routeLine.meta);
            });
        } catch (_) {}
    }
    // routeLine was already set at the top of this function

    if (!renderRouteLine._clickBound) {
        map.on('click', MAPBOX_ROUTE_LAYER_ID, function(e) {
            if (!routeLine || !routeLine.meta) return;
            // Don't show route popup if the click was on a step marker
            const stepFeatures = map.queryRenderedFeatures(e.point, { layers: [MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID] });
            if (stepFeatures && stepFeatures.length > 0) return;
            const { restaurantName, distanceKm, durationText } = routeLine.meta;
            const shortName = restaurantName.length > 28 ? restaurantName.substring(0, 27) + '…' : restaurantName;
            const html = `
                <div class="route-popup-content">
                    <div class="route-popup-title"><i class="fas fa-route"></i> ${shortName}</div>
                    <div class="route-popup-stats">
                        <div class="route-popup-stat">
                            <i class="fas fa-road"></i>
                            <span class="stat-value">${distanceKm} km</span>
                            <span class="stat-label">Distance</span>
                        </div>
                        <div class="route-popup-stat">
                            <i class="fas fa-clock"></i>
                            <span class="stat-value">${durationText}</span>
                            <span class="stat-label">Est. Time</span>
                        </div>
                    </div>
                </div>
            `;
            if (activePopup) {
                try { activePopup.remove(); } catch (e) {}
            }
            activePopup = new mapboxgl.Popup({ className: 'route-info-popup' })
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        });
        renderRouteLine._clickBound = true;
    }
}

function removeRouteLine() {
    try {
        // Remove main route layer and source
        if (map && map.getLayer && map.getLayer(MAPBOX_ROUTE_LAYER_ID)) {
            map.removeLayer(MAPBOX_ROUTE_LAYER_ID);
        }
        if (map && map.getSource && map.getSource(MAPBOX_ROUTE_SOURCE_ID)) {
            map.removeSource(MAPBOX_ROUTE_SOURCE_ID);
        }
        // Remove travelled route layer and source
        if (map && map.getLayer && map.getLayer('route-travelled-layer')) {
            map.removeLayer('route-travelled-layer');
        }
        if (map && map.getSource && map.getSource('route-travelled-source')) {
            map.removeSource('route-travelled-source');
        }
    } catch (e) {
        console.warn('Failed to remove route line', e);
    }
    routeLine = null;
    window.fullRouteCoordinates = [];
    window._routeProgressIndex = 0;
    window._routeProgressFloat = -1;
}

// Display route on the map - shows route without centering on user location
function displayRouteOnMap(route, restaurantName) {
    // Clear previous route
    if (routeLine) {
        removeRouteLine();
    }
    cleanupRouteStepGL();

    // Close any open popups to avoid covering the route view
    if (map && map.closePopup) {
        map.closePopup();
    }

    // Extract distance and duration from route
    const distanceMeters = route.distance || 0;
    const durationSeconds = route.duration || 0;
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const durationMinutes = Math.ceil(durationSeconds / 60);
    
    // Format duration nicely
    let durationText;
    if (durationMinutes < 60) {
        durationText = `${durationMinutes} min`;
    } else {
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        durationText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }

    // Create route line using Canvas renderer (sticks to map like markers, no lag when panning)
    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    // Render the route line immediately. renderRouteLine handles the case where the
    // Mapbox style isn't ready yet via an internal 'idle' retry, so no rAF wrapper is
    // needed here. Using rAF introduced a race: displayRouteInstructions (called next)
    // triggers renderRouteStepMarkersGL synchronously, which causes Mapbox GL to briefly
    // report isStyleLoaded()=false, making renderRouteLine's rAF callback return early
    // and schedule an 'idle' retry — but fitBounds had already run, so the route appeared
    // only after tiles finished loading (seconds later, or not at all if user panned away).
    renderRouteLine(coordinates, { restaurantName, distanceKm, durationText });

    // Fit map to show the entire route with a slight zoom-out for context
    const routeBounds = getBoundsFromLatLngs(coordinates);
    map.fitBounds(routeBounds, { padding: 48, maxZoom: 15, duration: 600 });

    // Show clear route button
    const clearRouteBtn = document.getElementById('clearRoute');
    if (clearRouteBtn) {
        clearRouteBtn.style.display = 'block';
    }
    

}

// Display route instructions in the panel
function displayRouteInstructions(route, restaurantName, destLat, destLng) {
    // Hide loading modal
    hideLoadingModal();
    
    const directionsContent = document.getElementById('directionsContent');
    if (!directionsContent) return;
    document.body.classList.add('directions-route-active');
    
    // Show the close route button
    if (closeRouteControl) {
        const container = closeRouteControl.getContainer();
        if (container) {
            container.style.display = 'block';
        }
    }
    
    const totalDistance = (route.distance / 1000).toFixed(1);
    const totalTime = Math.round(route.duration / 60);

    let html = `
        <div class="route-summary">
            <h4><i class="fas fa-flag-checkered"></i> Directions to ${restaurantName}</h4>
            <div class="route-stats">
                <div class="route-stat">
                    <i class="fas fa-road"></i>
                    <span>${totalDistance} km</span>
                </div>
                <div class="route-stat">
                    <i class="fas fa-clock"></i>
                    <span>${totalTime} min</span>
                </div>
            </div>
        </div>
        <span class="directions-steps-label"><i class="fas fa-list-ol"></i> Turn-by-Turn Directions:</span>
        <div class="instructions-list">
    `;

    // Clear existing route action markers
    cleanupRouteStepGL();

    // Build step points for turn detection
    routeStepPoints = [];
    currentRouteStepIndex = 0;

    const stepFeatures = [];

    if (route.legs && route.legs[0].steps) {
        route.legs[0].steps.forEach((step, index) => {
            const distance = (step.distance / 1000).toFixed(1);
            const icon = getDirectionIcon(step.maneuver.type, step.maneuver.modifier);
            if (step.maneuver && Array.isArray(step.maneuver.location)) {
                const [lng, lat] = step.maneuver.location;
                routeStepPoints.push({ lat, lng, index });
            }
            
            html += `
                <div class="instruction-step">
                    <div class="instruction-icon">${icon}</div>
                    <div class="instruction-content">
                        <div class="instruction-text">${step.maneuver.instruction || 'Continue'}</div>
                        <div class="instruction-distance">${distance} km</div>
                    </div>
                    <div class="instruction-number">${index + 1}</div>
                </div>
            `;

            // Collect GeoJSON feature for GL rendering
            if (step.intersections && step.intersections.length > 0) {
                const intersection = step.intersections[0];
                const [lng, lat] = intersection.location;
                const instruction = step.maneuver.instruction || 'Continue';
                stepFeatures.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: {
                        stepNumber: String(index + 1),
                        instruction: instruction,
                        distance: distance
                    }
                });
            }
        });
    }

    // Render all step markers as GL layers
    if (stepFeatures.length > 0) {
        renderRouteStepMarkersGL(stepFeatures);
    }

    html += `
        </div>
    `;

    directionsContent.classList.remove('route-placeholder');
    directionsContent.innerHTML = html;

    // Add click handlers to instruction steps
    setTimeout(() => {
        const steps = directionsContent.querySelectorAll('.instruction-step');
        steps.forEach((stepEl, index) => {
            stepEl.style.cursor = 'pointer';
            stepEl.addEventListener('click', function() {
                const step = route.legs[0].steps[index];
                if (step.intersections && step.intersections.length > 0) {
                    const intersection = step.intersections[0];
                    const [lng, lat] = intersection.location;

                    // Close the directions sidebar after selecting a step
                    try { hideDirectionsPanel(); } catch (e) { /* ignore */ }

                    // Pan the map to the selected step without showing a popup
                    if (map && typeof map.flyTo === 'function') {
                        const targetZoom = Math.max(map.getZoom ? map.getZoom() : 0, 17);
                        map.flyTo({
                            center: [lng, lat],
                            zoom: targetZoom,
                            duration: 1200,
                            speed: 1.2,
                            curve: 1.42,
                            easing: (t) => t * t * (3 - 2 * t),
                            essential: true
                        });
                    } else if (map && typeof map.easeTo === 'function') {
                        map.easeTo({
                            center: [lng, lat],
                            zoom: 17,
                            duration: 1200,
                            easing: (t) => t * t * (3 - 2 * t) // smoothstep
                        });
                    } else if (map && typeof map.panTo === 'function') {
                        map.panTo([lng, lat]);
                        try { if (map.setZoom) map.setZoom(17); } catch (e) { /* ignore */ }
                    }
                }
            });
        });
    }, 50);
}

// Remove route step GL layers and source
function cleanupRouteStepGL() {
    if (!map) return;
    // Remove event listeners
    if (_routeStepClickHandler) { try { map.off('click', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepClickHandler); } catch(e){} _routeStepClickHandler = null; }
    if (_routeStepEnterHandler) { try { map.off('mouseenter', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepEnterHandler); } catch(e){} _routeStepEnterHandler = null; }
    if (_routeStepLeaveHandler) { try { map.off('mouseleave', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepLeaveHandler); } catch(e){} _routeStepLeaveHandler = null; }
    try {
        if (map.getLayer(MAPBOX_ROUTE_STEPS_NUMBER_LAYER_ID)) map.removeLayer(MAPBOX_ROUTE_STEPS_NUMBER_LAYER_ID);
        if (map.getLayer(MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID)) map.removeLayer(MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID);
        if (map.getLayer(MAPBOX_ROUTE_STEPS_OUTLINE_LAYER_ID)) map.removeLayer(MAPBOX_ROUTE_STEPS_OUTLINE_LAYER_ID);
        if (map.getSource(MAPBOX_ROUTE_STEPS_SOURCE_ID)) map.removeSource(MAPBOX_ROUTE_STEPS_SOURCE_ID);
    } catch (e) { /* ignore */ }
    if (routeStepPopup) { routeStepPopup.remove(); routeStepPopup = null; }
    _routeStepFeatures = [];
}

// Render route step markers as GL layers
function renderRouteStepMarkersGL(features) {
    if (!map || !features.length) return;
    _routeStepFeatures = features;

    // Remove existing layers first
    cleanupRouteStepGL();
    _routeStepFeatures = features; // restore after cleanup clears it

    // Insert step marker layers below user location layers so user's pinmark stays on top
    const _beforeUser = map.getLayer(MAPBOX_USER_PULSE_LAYER_ID) ? MAPBOX_USER_PULSE_LAYER_ID : undefined;

    map.addSource(MAPBOX_ROUTE_STEPS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: features }
    });

    // White outline circle (slightly larger)
    map.addLayer({
        id: MAPBOX_ROUTE_STEPS_OUTLINE_LAYER_ID,
        type: 'circle',
        source: MAPBOX_ROUTE_STEPS_SOURCE_ID,
        paint: {
            'circle-radius': 7,
            'circle-color': '#ffffff',
            'circle-opacity': 1,
            'circle-opacity-transition': { duration: 0, delay: 0 }
        }
    }, _beforeUser);

    // Red fill circle
    map.addLayer({
        id: MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID,
        type: 'circle',
        source: MAPBOX_ROUTE_STEPS_SOURCE_ID,
        paint: {
            'circle-radius': 6,
            'circle-color': '#dc3545',
            'circle-opacity': 1,
            'circle-opacity-transition': { duration: 0, delay: 0 }
        }
    }, _beforeUser);

    // Step number text
    map.addLayer({
        id: MAPBOX_ROUTE_STEPS_NUMBER_LAYER_ID,
        type: 'symbol',
        source: MAPBOX_ROUTE_STEPS_SOURCE_ID,
        layout: {
            'text-field': ['get', 'stepNumber'],
            'text-size': 9,
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true
        },
        paint: {
            'text-color': '#ffffff',
            'text-opacity-transition': { duration: 0, delay: 0 }
        }
    }, _beforeUser);

    // Click handler for popups
    _routeStepClickHandler = (e) => {
        if (!e.features || !e.features.length) return;
        e.originalEvent && e.originalEvent.stopPropagation();
        map.once('click', () => {}); // consume the event so route line handler doesn't fire
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();

        if (routeStepPopup) routeStepPopup.remove();
        routeStepPopup = new mapboxgl.Popup({
            className: 'route-action-info-popup',
            closeButton: true,
            closeOnClick: true
        })
            .setLngLat(coords)
            .setHTML(`
                <div class="route-action-popup">
                    <div class="popup-step-number">Step ${props.stepNumber}</div>
                    <div class="popup-instruction">${props.instruction}</div>
                    <div class="popup-distance">Distance: ${props.distance} km</div>
                </div>
            `)
            .addTo(map);
    };
    map.on('click', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepClickHandler);

    // Pointer cursor on hover
    _routeStepEnterHandler = () => { map.getCanvas().style.cursor = 'pointer'; };
    _routeStepLeaveHandler = () => { map.getCanvas().style.cursor = ''; };
    map.on('mouseenter', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepEnterHandler);
    map.on('mouseleave', MAPBOX_ROUTE_STEPS_CIRCLE_LAYER_ID, _routeStepLeaveHandler);
}

// Helper function to get direction icons
function getDirectionIcon(type, modifier) {
    const icons = {
        'depart': 'fas fa-play',
        'arrive': 'fas fa-flag-checkered',
        'turn': 'fas fa-arrow-right',
        'new name': 'fas fa-signature',
        'continue': 'fas fa-arrow-right',
        'merge': 'fas fa-arrow-right',
        'on ramp': 'fas fa-arrow-up',
        'off ramp': 'fas fa-arrow-down',
        'fork': 'fas fa-code-branch',
        'end of road': 'fas fa-road',
        'roundabout': 'fas fa-undo'
    };

    const modifierIcons = {
        'left': 'fas fa-arrow-left',
        'right': 'fas fa-arrow-right',
        'sharp left': 'fas fa-arrow-turn-down-left',
        'sharp right': 'fas fa-arrow-turn-down-right',
        'slight left': 'fas fa-arrow-turn-up-left',
        'slight right': 'fas fa-arrow-turn-up-right',
        'straight': 'fas fa-arrow-up',
        'uturn': 'fas fa-undo'
    };

    if (modifier && modifierIcons[modifier]) {
        return `<i class="${modifierIcons[modifier]}"></i>`;
    }
    
    return `<i class="${icons[type] || 'fas fa-arrow-right'}"></i>`;
}

// Share route
function shareRoute(restaurantName) {
    if (navigator.share) {
        navigator.share({
            title: `Directions to ${restaurantName}`,
            text: `Check out these directions to ${restaurantName} in Estancia, Iloilo`,
            url: window.location.href
        });
    } else {
        const tempInput = document.createElement('input');
        tempInput.value = `Directions to ${restaurantName}: ${window.location.href}`;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        notify.info('Route information copied to clipboard!');
    }
}

// Compute bearing between two coordinates (degrees)
function computeBearing(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = Math.atan2(y, x);
    return (toDeg(brng) + 360) % 360;
}

// Smooth bearing changes to avoid jitter; handles wrap-around at 360
function smoothBearing(prev, target, alpha = 0.25) {
    if (prev === null || prev === undefined || Number.isNaN(prev)) return target;
    const diff = (((target - prev + 540) % 360) - 180); // shortest signed diff
    return (prev + diff * alpha + 360) % 360;
}

// Get route bearing based on closest point on the route to the user
function getRouteBearingFromUser(userLat, userLng) {
    const coords = window.fullRouteCoordinates;
    if (!coords || coords.length < 2) return null;

    let closestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i];
        const dist = map && typeof map.distance === 'function'
            ? map.distance([userLng, userLat], [lng, lat])
            : calculateDistance(userLat, userLng, lat, lng) * 1000;
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }

    const nextIndex = Math.min(closestIndex + 1, coords.length - 1);
    const [nextLng, nextLat] = coords[nextIndex];
    const [currLng, currLat] = coords[closestIndex];
    if (nextIndex === closestIndex) return null;
    return computeBearing(currLat, currLng, nextLat, nextLng);
}

// Navigation state
let navigationActive = false;
let navigationDestination = null;
let navigationRotateEnabled = false; // Set true during nav to face route/heading
let lastNavigationPanPos = null; // Last point we actually panned to (for jitter suppression)
let lastNavigationTime = 0;     // Timestamp of last nav update
let lastBearing = null;         // Smoothed bearing to reduce twitch
let manualMapInteraction = false; // true while user is dragging/rotating the map
let mapFollowEnabled = false; // Optional map follow (auto-center) mode
let mapFollowButton = null;

function updateFollowButtonUI() {
    if (!mapFollowButton) return;
    mapFollowButton.classList.toggle('active', mapFollowEnabled);
    mapFollowButton.setAttribute('aria-pressed', mapFollowEnabled ? 'true' : 'false');
    mapFollowButton.dataset.followActive = mapFollowEnabled ? 'true' : 'false';
}

function setMapFollowEnabled(enabled, options = {}) {
    const { skipCenter = false } = options;
    if (mapFollowEnabled === enabled) return;
    mapFollowEnabled = enabled;
    updateFollowButtonUI();

    if (mapFollowEnabled && !skipCenter) {
        if (userLocation && map) {
            const routeBearing = getRouteBearingFromUser(userLocation.lat, userLocation.lng);
            try {
                if (typeof map.easeTo === 'function') {
                    map.easeTo({
                        center: [userLocation.lng, userLocation.lat],
                        zoom: Math.max(map.getZoom ? map.getZoom() : 16, 16),
                        bearing: routeBearing !== null ? routeBearing : (map.getBearing ? map.getBearing() : 0),
                        duration: 700,
                        essential: true
                    });
                } else if (typeof map.panTo === 'function') {
                    map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.7 });
                }
            } catch (e) { /* ignore */ }
        } else {
            locateUser({ suppressCenter: true }).catch(() => {});
        }
    }
}

// Helper: Find closest point on route and mark everything before as travelled
function updateRouteProgress(userLat, userLng) {
    if (!window.fullRouteCoordinates || window.fullRouteCoordinates.length < 2) return;
    if (!map || typeof map.distance !== 'function') return;

    const coords = window.fullRouteCoordinates;
    const userPos = [userLng, userLat];

    if (coords.length < 2) return;

    // ── Bidirectional progress tracking ──
    // Search the entire route for the closest point so progress can move
    // forward OR backward (e.g. user backtracks along the route).
    const searchStart = 0;
    const searchEnd = coords.length - 1;

    let bestIndex = 0;
    let minDistance = Infinity;
    let projectedPoint = userPos;
    let bestT = 0;

    for (let i = searchStart; i < searchEnd; i++) {
        const segStart = coords[i];
        const segEnd = coords[i + 1];
        
        const projection = projectPointOnSegment(userPos, segStart, segEnd);
        const dist = map.distance(userPos, projection.point);
        
        if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i;
            projectedPoint = projection.point;
            bestT = projection.t;
        }
    }

    // Skip update if user is too far from route (off-route > 100m)
    if (minDistance > 100) {
        return;
    }

    // Allow progress to move freely in both directions
    const candidateProgress = bestIndex + bestT; // fractional segment progress
    const newProgress = candidateProgress;
    const newIndex = Math.floor(newProgress);
    const newT = newProgress - newIndex;

    window._routeProgressIndex = newIndex;
    window._routeProgressFloat = newProgress;

    // Compute the exact split point on the current segment
    const splitSeg = coords[newIndex];
    const splitSegEnd = coords[Math.min(newIndex + 1, coords.length - 1)];
    const splitPoint = [
        splitSeg[0] + (splitSegEnd[0] - splitSeg[0]) * newT,
        splitSeg[1] + (splitSegEnd[1] - splitSeg[1]) * newT
    ];

    // GRAY (traveled) = everything from START up to the split point
    const travelledCoordinates = coords.slice(0, newIndex + 1);
    travelledCoordinates.push(splitPoint);
    
    // BLUE (remaining) = from split point to DESTINATION
    const remainingCoordinates = [splitPoint, ...coords.slice(newIndex + 1)];

    try {
        const travelledSource = map.getSource('route-travelled-source');
        if (travelledSource && travelledCoordinates.length >= 2) {
            travelledSource.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: travelledCoordinates
                }
            });
        }

        const mainRouteSource = map.getSource(MAPBOX_ROUTE_SOURCE_ID);
        if (mainRouteSource && remainingCoordinates.length >= 2) {
            mainRouteSource.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: remainingCoordinates
                }
            });
        }
    } catch (e) {
        console.warn('Failed to update route progress', e);
    }
}

// Project a point onto a line segment and return the projected point and parameter t (0-1)
function projectPointOnSegment(point, segStart, segEnd) {
    const dx = segEnd[0] - segStart[0];
    const dy = segEnd[1] - segStart[1];
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) {
        // Segment is a point
        return { point: segStart, t: 0 };
    }
    
    // Calculate projection parameter t (0 = at segStart, 1 = at segEnd)
    let t = ((point[0] - segStart[0]) * dx + (point[1] - segStart[1]) * dy) / lenSq;
    
    // Clamp t to [0, 1] to stay within segment
    t = Math.max(0, Math.min(1, t));
    
    // Calculate the projected point
    const projectedPoint = [
        segStart[0] + t * dx,
        segStart[1] + t * dy
    ];
    
    return { point: projectedPoint, t };
}

// Start live navigation - centers map on user and follows their movement
function startNavigation(destLat, destLng, destName) {
    if (!routeLine) {
        notify.error('Calculate a route first.');
        return;
    }

    if (!navigator.geolocation) {
        notify.error('Geolocation not supported.');
        return;
    }

    // If already running, do nothing
    if (navigationWatchId !== null) {
        notify.info('Navigation already running.');
        return;
    }

    navigationActive = true;
    navigationDestination = { lat: destLat, lng: destLng, name: destName };
    navigationRotateEnabled = true; // face along route during navigation
    lastBearing = null;
    lastNavigationPanPos = null;
    lastNavigationPos = null;
    lastNavigationTime = 0;

    // Navigation marker icon - Google Maps style blue dot with directional beam
    // Beam always points UP since the map rotates to put destination at top
    function createNavIcon() {
        const el = document.createElement('div');
        el.className = 'navigation-marker';
        el.innerHTML = `
            <div class="nav-beam"></div>
            <div class="nav-pulse"></div>
            <div class="nav-dot"></div>
        `;
        return el;
    }

    function updatePosition(position) {
        const { latitude, longitude, heading, speed } = position.coords;
        const latlng = [latitude, longitude];
        const now = Date.now();

        // Update global user location and speed
        userLocation = { lat: latitude, lng: longitude };
        
        // Calculate speed for animation timing
        const calculatedSpeed = (typeof speed === 'number' && speed >= 0) ? speed : 
            (lastNavigationPos && lastNavigationTime > 0) ? 
                (calculateDistance(lastNavigationPos.lat, lastNavigationPos.lng, latitude, longitude) * 1000) / ((now - lastNavigationTime) / 1000) : 0;
        userLocationSpeed = calculatedSpeed;

        // Prefer real device heading; fall back to movement vector; otherwise aim at destination
        const hasHeading = typeof heading === 'number' && !Number.isNaN(heading) && heading >= 0;
        const distFromLast = lastNavigationPos ? map.distance([lastNavigationPos.lat, lastNavigationPos.lng], latlng) : Infinity;
        const movementBearing = (lastNavigationPos && distFromLast > 2) ? computeBearing(lastNavigationPos.lat, lastNavigationPos.lng, latitude, longitude) : null;
        const bearingToDest = computeBearing(latitude, longitude, destLat, destLng);
        const rawBearing = hasHeading ? heading : (movementBearing ?? bearingToDest);
        const mapBearing = smoothBearing(lastBearing, rawBearing, 0.25);
        lastBearing = mapBearing;

        // Create or update navigation marker (beam always points up)
        if (!navigationMarker) {
            navigationMarker = createMapboxMarker({
                element: createNavIcon(),
                lat: latitude,
                lng: longitude,
                anchor: 'center'
            }).addTo(map);
        } else {
            // Animate navigation marker smoothly based on speed
            const navAnimDuration = calculatedSpeed > 15 ? 100 : (calculatedSpeed > 8 ? 200 : 300);
            animateNavigationMarkerToPosition(navigationMarker, latitude, longitude, navAnimDuration);
        }

        // Rotate map only if enabled and user is not manually interacting; keep north-up otherwise
        if (navigationRotateEnabled && map.setBearing && !manualMapInteraction) {
            map.setBearing(mapBearing);
        }

        // Remember last point for movement-derived bearing
        lastNavigationPos = { lat: latitude, lng: longitude };

        // Update route progress only when marker is first created (animation handles it otherwise)
        if (!navigationMarkerAnimationFrame && routeLine && map) {
            updateRouteProgress(latitude, longitude);
        }

        // Keep map centered on user with speed-adaptive duration
        const panDist = lastNavigationPanPos ? map.distance(lastNavigationPanPos, latlng) : Infinity;
        if (panDist > 3 && !manualMapInteraction) {
            const panDuration = calculatedSpeed > 15 ? 150 : (calculatedSpeed > 8 ? 250 : 400);
            if (typeof map.easeTo === 'function') {
                map.easeTo({
                    center: latlng,
                    duration: panDuration,
                    essential: true
                });
            } else {
                map.panTo(latlng, { animate: true });
            }
            lastNavigationPanPos = latlng;
        }

        lastNavigationTime = now;

        // Check if arrived (within 50 meters of destination)
        const distToDest = map.distance(latlng, [destLat, destLng]);
        if (distToDest < 50) {
            notify.success(`You have arrived at ${destName}!`);
            stopNavigation();
        }
    }

    // Get initial position and center map immediately
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            
            // Calculate initial bearing to destination
            const initialBearing = computeBearing(latitude, longitude, destLat, destLng);
            lastBearing = initialBearing;
            lastNavigationPos = { lat: latitude, lng: longitude };
            lastNavigationPanPos = [latitude, longitude];
            lastNavigationTime = Date.now();
            
            // Create marker (beam always points up)
            navigationMarker = createMapboxMarker({
                element: createNavIcon(),
                lat: latitude,
                lng: longitude,
                anchor: 'center'
            }).addTo(map);
            
            // Face the route on start if rotation is enabled
            if (navigationRotateEnabled && map.setBearing) {
                map.setBearing(initialBearing);
            }
            
            // Center map on user at higher zoom for navigation
            map.setView([latitude, longitude], 17, { animate: true });
            
            notify.success(`Navigation started! Head straight up.`);
        },
        (err) => {
            notify.error('Could not get your location.');
        },
        { enableHighAccuracy: true }
    );

    // Start watching position for continuous updates
    navigationWatchId = navigator.geolocation.watchPosition(
        updatePosition,
        err => {
            console.warn('Navigation geolocation error', err);
            notify.error('Lost GPS signal.');
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,        // Always get fresh position for real-time updates
            timeout: 5000         // Fast timeout for responsive updates
        }
    );

    // Update navigation UI
    updateNavigationUI(true, destName);
}

// Update the floating navigation controls for navigation mode
function updateNavigationUI(active, destName) {
    const controls = document.getElementById('navigationControls');
    if (!controls) return;

    const startBtn = document.getElementById('startNavBtn');
    const navInfo = controls.querySelector('.nav-info');

    if (active) {
        // Change Start button to Stop button
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            startBtn.classList.add('stop-mode');
            startBtn.onclick = stopNavigation;
        }
        // Update info text
        if (navInfo) {
            const destDiv = navInfo.querySelector('.nav-destination');
            if (destDiv) destDiv.innerHTML = `<i class="fas fa-satellite-dish fa-pulse"></i> Following...`;
        }
    } else {
        // Restore Start button
        if (startBtn) {
            startBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Start';
            startBtn.classList.remove('stop-mode');
            if (currentRouteDestination) {
                startBtn.onclick = function() {
                    startNavigation(currentRouteDestination.lat, currentRouteDestination.lng, currentRouteDestination.name);
                };
            }
        }
        // Restore info text
        if (navInfo && currentRouteDestination) {
            const destDiv = navInfo.querySelector('.nav-destination');
            if (destDiv) destDiv.textContent = currentRouteDestination.name;
        }
    }
}

// Stop navigation tracking
function stopNavigation() {
    if (navigationWatchId !== null && navigator.geolocation && navigator.geolocation.clearWatch) {
        try { navigator.geolocation.clearWatch(navigationWatchId); } catch (e) { }
    }
    navigationWatchId = null;
    navigationActive = false;
    navigationDestination = null;
    navigationRotateEnabled = false;
    lastNavigationPanPos = null;
    lastNavigationPos = null;
    lastNavigationTime = 0;
    lastBearing = null;

    // Cancel any pending navigation animation
    if (navigationMarkerAnimationFrame) {
        cancelAnimationFrame(navigationMarkerAnimationFrame);
        navigationMarkerAnimationFrame = null;
    }

    // Remove navigation marker
    if (navigationMarker) {
        try { map.removeLayer(navigationMarker); } catch (e) {}
        navigationMarker = null;
    }

    // Update UI
    updateNavigationUI(false);

}

// Start tracking device heading using Geolocation API
function startDeviceHeadingTracking() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not available on this device');
        // Still try device orientation if available
    }

    // Start device orientation tracking for faster heading updates (if available)
    const attachOrientationListener = () => {
        if (deviceOrientationHandler) return;
        deviceOrientationHandler = (event) => {
            // iOS provides webkitCompassHeading (0-360, clockwise from north)
            if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
                deviceHeading = event.webkitCompassHeading;
                updateHeadingIndicator();
                return;
            }
            // Standard alpha is 0 at north, clockwise; convert to compass heading
            if (typeof event.alpha === 'number' && !Number.isNaN(event.alpha)) {
                deviceHeading = (360 - event.alpha) % 360;
                updateHeadingIndicator();
            }
        };
        window.addEventListener('deviceorientation', deviceOrientationHandler, true);
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((permission) => {
            if (permission === 'granted') {
                attachOrientationListener();
            }
        }).catch(() => {
            // ignore permission errors
        });
    } else if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        attachOrientationListener();
    }

    // Stop any existing watch
    if (deviceHeadingWatchId !== null) {
        navigator.geolocation.clearWatch(deviceHeadingWatchId);
    }

    // Watch position to get heading updates
    if (navigator.geolocation) {
        deviceHeadingWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const heading = position.coords.heading;
            if (typeof heading === 'number' && !isNaN(heading) && heading >= 0) {
                deviceHeading = heading;
                updateHeadingIndicator();
            }
        },
        (error) => {
            console.warn('Error tracking device heading:', error.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
        );
    }
}

// Stop tracking device heading
function stopDeviceHeadingTracking() {
    if (deviceHeadingWatchId !== null) {
        navigator.geolocation.clearWatch(deviceHeadingWatchId);
        deviceHeadingWatchId = null;
    }
    if (deviceOrientationHandler) {
        window.removeEventListener('deviceorientation', deviceOrientationHandler, true);
        deviceOrientationHandler = null;
    }
}

// Add heading indicator to user location marker
function addHeadingIndicatorToUserMarker() {
    if (!userMarker) {
        return;
    }

    // GL-rendered user marker — heading indicator not supported on canvas layers
    if (userMarker === true) return;

    const markerEl = typeof userMarker.getElement === 'function'
        ? userMarker.getElement()
        : (userMarker._marker && typeof userMarker._marker.getElement === 'function' ? userMarker._marker.getElement() : null);
    if (!markerEl) return;

    const attachTarget = markerEl.querySelector('.user-marker-wrapper') || markerEl;

    // Remove any existing indicator to avoid duplicates
    if (userLocationHeadingIndicator && userLocationHeadingIndicator.parentNode) {
        userLocationHeadingIndicator.parentNode.removeChild(userLocationHeadingIndicator);
        userLocationHeadingIndicator = null;
    }
    
    // Create heading indicator (arrow pointing in device direction)
    userLocationHeadingIndicator = document.createElement('div');
    userLocationHeadingIndicator.className = 'user-heading-indicator';
    userLocationHeadingIndicator.innerHTML = '<div class="heading-arrow"><i class="fas fa-location-arrow"></i></div>';
    userLocationHeadingIndicator.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;
    `;
    
    attachTarget.appendChild(userLocationHeadingIndicator);
    updateHeadingIndicator();
}

// Remove heading indicator from user location marker
function removeHeadingIndicatorFromUserMarker() {
    if (userLocationHeadingIndicator && userLocationHeadingIndicator.parentNode) {
        userLocationHeadingIndicator.parentNode.removeChild(userLocationHeadingIndicator);
        userLocationHeadingIndicator = null;
    }
}

// Update heading indicator rotation
function updateHeadingIndicator() {
    if (!userLocationHeadingIndicator) return;

    // Smooth heading to avoid sudden jumps/glitches
    const smooth = (prev, target, alpha = 0.18) => {
        if (prev === null || prev === undefined || Number.isNaN(prev)) return target;
        const diff = (((target - prev + 540) % 360) - 180); // shortest signed diff
        return (prev + diff * alpha + 360) % 360;
    };

    const now = performance.now();
    const dt = lastHeadingTimestamp ? Math.max(16, now - lastHeadingTimestamp) : 16;
    lastHeadingTimestamp = now;

    const targetHeading = deviceHeading;
    const current = lastSmoothedHeading ?? targetHeading;
    const rawDiff = (((targetHeading - current + 540) % 360) - 180);
    // Clamp jump size based on elapsed time (max ~120deg/sec)
    const maxStep = (120 * dt) / 1000;
    const clampedTarget = (current + Math.max(-maxStep, Math.min(maxStep, rawDiff)) + 360) % 360;

    // Adaptive smoothing: slower when updates are fast to prevent jitter
    const alpha = dt < 40 ? 0.12 : 0.2;
    if (headingUpdateRaf) cancelAnimationFrame(headingUpdateRaf);
    headingUpdateRaf = requestAnimationFrame(() => {
        lastSmoothedHeading = smooth(lastSmoothedHeading, clampedTarget, alpha);
        userLocationHeadingIndicator.style.transform = `rotate(${lastSmoothedHeading}deg)`;
    });
}

// Clear current route

function clearRoute() {
    // Restore normal marker visibility when clearing routes
    hideMarkersDuringRouting = false;

    if (routeLine) {
        removeRouteLine();
    }
    
    // Clear all route step GL markers
    cleanupRouteStepGL();
    
    // Show all restaurant markers again when route is cleared
    showAllRestaurantMarkers();
    
    // Floating navigation controls removed — nothing to hide
    
    // Clear route destination
    currentRouteDestination = null;

    // Reset turn detection state
    routeStepPoints = [];
    currentRouteStepIndex = 0;
    
    // Keep heading tracking/indicator active even when route is cleared
    
    // Clear turn-by-turn panel
    const directionsContent = document.getElementById('directionsContent');
    if (directionsContent) {
        directionsContent.innerHTML = `
            <i class="fas fa-route"></i>
            <p>Choose a restaurant and tap Get Directions to see turn-by-turn steps.</p>
        `;
        directionsContent.classList.add('route-placeholder');
    }
    hideDirectionsPanel();
    document.body.classList.remove('directions-route-active');
    setMapFollowEnabled(false, { skipCenter: true });
    
    // Hide the close route button
    if (closeRouteControl) {
        const container = closeRouteControl.getContainer();
        if (container) {
            container.style.display = 'none';
        }
    }

    stopNavigation();
}

// Open Google Maps navigation directly in drive mode
function openGoogleMapsNavigation(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    // Detect if user is on mobile to use app-specific URL for automatic navigation start
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Function to open the maps URL
    function openMapsWithLocation(userLat, userLng) {
        // Always use dir_action=navigate to open directly in navigation/driving mode
        // This works on both mobile apps and desktop browsers
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${restaurant.latitude},${restaurant.longitude}&travelmode=driving&dir_action=navigate`;
        
        window.open(url, '_blank');
        notify.success(`Opening navigation to ${restaurant.name} in Google Maps...`);
    }
    
    if (navigator.geolocation && userLocation) {
        // If we have user location, use it immediately
        openMapsWithLocation(userLocation.lat, userLocation.lng);
    } else if (navigator.geolocation) {
        // Try to get user location first before opening maps
        notify.info('Getting your location for navigation...');
        
        locateUser()
            .then(() => {
                if (userLocation) {
                    openMapsWithLocation(userLocation.lat, userLocation.lng);
                } else {
                    // Fallback if location still not available
                    const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
                    window.open(url, '_blank');
                    notify.warning(`Opened ${restaurant.name} in Google Maps. Location unavailable for navigation.`);
                }
            })
            .catch(() => {
                // If location fails, open restaurant location without navigation
                const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
                window.open(url, '_blank');
                notify.warning(`Opened ${restaurant.name} in Google Maps. Enable location for turn-by-turn navigation.`);
            });
    } else {
        // If no geolocation available at all, just open the restaurant location
        const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
        window.open(url, '_blank');
        notify.info(`Opening ${restaurant.name} in Google Maps. Location not available.`);
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const closeDirections = document.getElementById('closeDirections');

    const updateClearSearchBtnVisibility = () => {
        if (!searchInput || !clearSearchBtn) return;
        clearSearchBtn.style.display = searchInput.value.trim() ? 'inline-flex' : 'none';
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', function(event) {
            event.preventDefault();
            performSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
        
        // Clear search results when input is cleared manually
        searchInput.addEventListener('input', function() {
            updateClearSearchBtnVisibility();
            if (searchInput.value.trim() === '') {
                // Reset to show recommendations when input is empty
                const searchResultsSection = document.querySelector('.search-results');
                const recommendationsSection = document.querySelector('.recommendations');
                if (searchResultsSection) {
                    searchResultsSection.style.display = 'none';
                }
                if (recommendationsSection) {
                    recommendationsSection.style.display = 'block';
                }
                searchResultsCache = [];
                displayRestaurants(restaurants);
                addMarkersToMap(restaurants);
            }
        });

        updateClearSearchBtnVisibility();
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', function(event) {
            event.preventDefault();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
        });
    }

    if (closeDirections) {
        closeDirections.addEventListener('click', clearRoute);
    }

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('restaurantModal');
        if (event.target === modal) {
            closeRestaurantModal();
        }
    });
}

// Search function
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    if (!searchInput) return;

    // Clear any active route so search results and markers render cleanly
    if (typeof routeLine !== 'undefined' && routeLine && typeof clearRoute === 'function') {
        clearRoute();
    }
    
    const searchTerm = searchInput.value.trim();
    const normalizeSearchText = (value) => (value || '')
        .toString()
        .toLowerCase()
        .replace(/[\'\u2018\u2019\u0060]/g, '');
    const normalizedTerm = normalizeSearchText(searchTerm);
    
    // Show loading state on search button
    let originalBtnHTML = '';
    if (searchBtn) {
        originalBtnHTML = searchBtn.innerHTML;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchBtn.disabled = true;
    }
    
    // Show loading spinner in results
    const resultsList = document.getElementById('resultsList');
    if (resultsList) {
        resultsList.innerHTML = '<div class="search-loading"><div class="search-loading-spinner"></div></div>';
    }
    
    if (!searchTerm) {
        searchResultsCache = [];
        displayRestaurants(restaurants);
        addMarkersToMap(restaurants);
        
        // Restore search button
        if (searchBtn) {
            searchBtn.innerHTML = originalBtnHTML;
            searchBtn.disabled = false;
        }
        
        // Hide search results and show recommendations when search is empty
        const searchResultsSection = document.querySelector('.search-results');
        const recommendationsSection = document.querySelector('.recommendations');
        if (searchResultsSection) {
            searchResultsSection.style.display = 'none';
        }
        if (recommendationsSection) {
            recommendationsSection.style.display = 'block';
        }
        return;
    }
    
    try {
        const response = await fetch(`api/restaurants.php?action=search&term=${encodeURIComponent(searchTerm)}`);
        let results = await response.json();

        // Also include restaurants that match by category name from the locally loaded `restaurants` list
        // This ensures typing a category (e.g., "Fast Food") returns matches even if backend search doesn't include category.
        try {
            const categoryMatches = (restaurants || []).filter(r => {
                return normalizeSearchText(r.category).includes(normalizedTerm);
            });
            const localMatches = (restaurants || []).filter(r => {
                const nameMatch = normalizeSearchText(r.name).includes(normalizedTerm);
                const addressMatch = normalizeSearchText(r.address).includes(normalizedTerm);

                // Check legacy `menu_items` string field
                const menuItemsField = normalizeSearchText(r.menu_items);
                let menuMatch = menuItemsField && menuItemsField.includes(normalizedTerm);

                // Also defensively check `full_menu` JSON (array of items {name, price, category})
                if (!menuMatch && r.full_menu) {
                    try {
                        const fm = (typeof r.full_menu === 'string') ? JSON.parse(r.full_menu) : r.full_menu;
                        if (Array.isArray(fm)) {
                            menuMatch = fm.some(it => normalizeSearchText(it?.name).includes(normalizedTerm));
                        }
                    } catch (e) {
                        // ignore parse errors and continue
                    }
                }

                return nameMatch || addressMatch || menuMatch;
            });
            // Merge categoryMatches into results (avoid duplicates by id)
            const existingIds = new Set((results || []).map(r => String(r.id)));
            [...categoryMatches, ...localMatches].forEach(cm => {
                if (!existingIds.has(String(cm.id))) results.push(cm);
            });
        } catch (e) {
            console.warn('Category-merge during search failed', e);
        }
        
        // If user location is available, calculate driving distances and sort by nearest
        if (userLocation && results.length > 0) {
            console.log('Search results with user location - calculating driving distances');
            
            // Calculate driving distances for search results
            const drivingDistances = await calculateDrivingDistances(
                userLocation.lat,
                userLocation.lng,
                results
            );
            
            // Add driving distance and duration to each result
            results = results.map(restaurant => {
                const routeData = drivingDistances.get(restaurant.id);
                let distance, duration;
                if (routeData) {
                    distance = routeData.distance;
                    duration = routeData.duration;
                } else {
                    distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        parseFloat(restaurant.latitude),
                        parseFloat(restaurant.longitude)
                    );
                    duration = (distance / 40) * 3600; // Estimate at 40 km/h
                }
                return { ...restaurant, distance, duration };
            });
            
            // Sort by distance (nearest first)
            results.sort((a, b) => a.distance - b.distance);
            
            console.log('Search results ranked by driving distance:', results.map(r => `${r.name}: ${r.distance.toFixed(2)} km, ${formatTravelTime(r.duration)}`));
        }
        
        searchResultsCache = results;
        updateSearchResultFilterAvailability();
        await refreshSearchResults();

        // Show search results and hide recommendations when searching
        const searchResultsSection = document.querySelector('.search-results');
        const recommendationsSection = document.querySelector('.recommendations');
        if (searchResultsSection) {
            searchResultsSection.style.display = 'block';
        }
        if (recommendationsSection) {
            recommendationsSection.style.display = 'none';
        }

        await fetch('api/restaurants.php?action=saveSearch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_term: searchTerm })
        });
        
    } catch (error) {
        console.error('Search error:', error);
        notify.error('Error performing search. Please try again.');
    } finally {
        // Restore search button state
        if (searchBtn) {
            searchBtn.innerHTML = originalBtnHTML;
            searchBtn.disabled = false;
        }
    }
}

// Load recommendations
async function loadRecommendations() {
    try {
        const response = await fetch('api/restaurants.php?action=getRecommendations');
        const recommendations = await response.json();
        
        const recommendationsList = document.getElementById('recommendationsList');
        if (!recommendationsList) return;
        
        recommendationsList.innerHTML = '';
        
        recommendations.forEach(restaurant => {
            const element = document.createElement('div');
            element.className = 'restaurant-item';
            
            // Get logo image: prefer explicit `logo` only. If missing, render category icon as fallback
            const logoUrl = (restaurant.logo && String(restaurant.logo).trim() !== '') ? restaurant.logo : null;
            const categoryIconClass = getCategoryIconClass(restaurant.category);
            const pinColor = getCategoryColor(restaurant.category);
            const logoHtml = logoUrl
                ? `<img src="${logoUrl}" alt="${restaurant.name}" class="restaurant-logo" style="border-color: ${pinColor};" onerror="this.style.display='none'; this.nextElementSibling && (this.nextElementSibling.style.display='flex');" />`
                : `<div class="restaurant-logo-fallback" style="background:${pinColor}; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${pinColor};">
                    <i class="fas ${categoryIconClass}" style="color:#fff; font-size:20px;"></i>
                   </div>`;
            
            element.innerHTML = `
                <div class="restaurant-content">
                    <h4>${restaurant.name}</h4>
                    <p>${restaurant.address}</p>
                    <p><small>${restaurant.description ? restaurant.description.substring(0, 50) + (restaurant.description.length > 50 ? '...' : '') : 'No description'}</small></p>
                    <p><small>Visits: ${restaurant.visit_count} ${restaurant.phone ? '• ' + restaurant.phone : ''}</small></p>
                </div>
                ${logoHtml}
            `;
            
            element.addEventListener('click', () => {
                const marker = markers.find(m => m.restaurantId === restaurant.id);
                if (marker) {
                    marker.openPopup();
                    setTimeout(() => centerOnPopup(marker), 0);
                }
                // Close sidebar on mobile after selecting restaurant
                if (document.body.classList.contains('sidebar-open') && window.innerWidth <= 768) {
                    document.body.classList.remove('sidebar-open');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (overlay) overlay.hidden = true;
                    const toggleBtn = document.getElementById('sidebarToggle');
                    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
            recommendationsList.appendChild(element);
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Initialize chatbot
function buildChatbotSuggestionsFromRestaurants(restaurantsList) {
    const list = Array.isArray(restaurantsList) ? restaurantsList : [];
    const suggestions = [];

    const addSuggestion = (text) => {
        const trimmed = (text || '').toString().trim();
        if (!trimmed) return;
        if (suggestions.includes(trimmed)) return;
        suggestions.push(trimmed);
    };

    if (!list.length) return suggestions;

    const categoryCounts = new Map();
    const keywordCounts = new Map();
    const restaurantsByVisits = [...list].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));

    list.forEach(r => {
        const category = (r.category || '').toString().trim();
        if (category) {
            categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        }

        const menuItems = (r.menu_items || '').toString();
        if (menuItems) {
            menuItems.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
                const keyword = item.length > 2 ? item : '';
                if (keyword) keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
            });
        }
    });

    const topCategories = [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 3);

    const topKeywords = [...keywordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 2);

    if (topCategories[0]) addSuggestion(`Find ${topCategories[0]} restaurants`);
    if (topCategories[1]) addSuggestion(`Any ${topCategories[1]} places?`);
    if (restaurantsByVisits[0]?.name) addSuggestion(`Tell me about ${restaurantsByVisits[0].name}`);
    if (restaurantsByVisits[1]?.name) addSuggestion(`Where is ${restaurantsByVisits[1].name}?`);
    if (topKeywords[0]) addSuggestion(`Any ${topKeywords[0]} here?`);
    if (topKeywords[1]) addSuggestion(`Looking for ${topKeywords[1]}`);

    return suggestions.slice(0, 8);
}

async function loadChatbotSuggestions() {
    const container = document.getElementById('chatbotSuggestions');
    const track = document.getElementById('chatbotSuggestionsTrack');
    if (!container || !track) return;

    if (!container.dataset.swipeReady) {
        // JS-based auto-scroll that works with native touch swipe
        let autoScrollPaused = false;
        let autoScrollRAF = null;
        const SCROLL_SPEED = 1; // pixels per frame

        const startAutoScroll = () => {
            if (autoScrollRAF) return;
            const step = () => {
                if (!autoScrollPaused) {
                    container.scrollLeft += SCROLL_SPEED;
                    // Loop: when scrolled past half (duplicated content), reset
                    if (container.scrollLeft >= container.scrollWidth / 2) {
                        container.scrollLeft = 0;
                    }
                }
                autoScrollRAF = requestAnimationFrame(step);
            };
            autoScrollRAF = requestAnimationFrame(step);
        };

        const pauseAutoScroll = (duration = 3000) => {
            autoScrollPaused = true;
            clearTimeout(container._resumeTimer);
            container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, duration);
        };

        // Touch: pause auto-scroll so user can swipe freely
        container.addEventListener('touchstart', () => {
            autoScrollPaused = true;
            clearTimeout(container._resumeTimer);
        }, { passive: true });

        container.addEventListener('touchend', () => {
            // Resume after momentum scrolling settles
            container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, 3000);
        }, { passive: true });

        container.addEventListener('touchcancel', () => {
            container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, 1000);
        }, { passive: true });

        // Mouse drag: allow click-and-drag scrolling on desktop
        let isPointerDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        container.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse') return;
            isPointerDown = true;
            startX = e.clientX;
            startScrollLeft = container.scrollLeft;
            container.setPointerCapture(e.pointerId);
            autoScrollPaused = true;
            clearTimeout(container._resumeTimer);
        });
        container.addEventListener('pointermove', (e) => {
            if (!isPointerDown || e.pointerType !== 'mouse') return;
            const dx = e.clientX - startX;
            container.scrollLeft = startScrollLeft - dx;
        });
        const stopPointer = (e) => {
            if (e.pointerType !== 'mouse') return;
            isPointerDown = false;
            try { container.releasePointerCapture(e.pointerId); } catch (err) {}
            container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, 2000);
        };
        container.addEventListener('pointerup', stopPointer);
        container.addEventListener('pointercancel', stopPointer);
        container.addEventListener('mouseleave', () => {
            if (isPointerDown) {
                isPointerDown = false;
                container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, 2000);
            }
        });

        // Hover pauses on desktop
        container.addEventListener('mouseenter', () => { autoScrollPaused = true; clearTimeout(container._resumeTimer); });
        container.addEventListener('mouseleave', () => {
            if (!isPointerDown) container._resumeTimer = setTimeout(() => { autoScrollPaused = false; }, 1000);
        });

        container._startAutoScroll = startAutoScroll;
        container.dataset.swipeReady = 'true';
    }

    track.innerHTML = '<div class="chatbot-suggestions-loading">Loading suggestions...</div>';

    let list = Array.isArray(restaurants) && restaurants.length ? restaurants : null;
    if (!list) {
        try {
            const resp = await fetch('api/restaurants.php?action=getAll');
            list = await resp.json();
        } catch (e) {
            list = [];
        }
    }

    const suggestions = buildChatbotSuggestionsFromRestaurants(list || []);
    track.innerHTML = '';

    if (!suggestions.length) return;

    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chatbot-suggestion-btn';
        btn.textContent = text;
        btn.addEventListener('click', () => {
            const input = document.getElementById('chatbotInput');
            if (input) {
                input.value = text;
                // Do not focus input to avoid opening keyboard
                if (document.activeElement === input) {
                    input.blur();
                }
                sendChatbotMessage();
            }
        });
        track.appendChild(btn);
    });

    // Duplicate content for seamless loop (used by JS scrollLeft auto-scroll)
    const originalNodes = Array.from(track.children);
    originalNodes.forEach(node => {
        const clonedNode = node.cloneNode(true);
        // Re-attach click handlers for cloned buttons
        if (clonedNode.classList.contains('chatbot-suggestion-btn')) {
            clonedNode.addEventListener('click', () => {
                const input = document.getElementById('chatbotInput');
                if (input) {
                    input.value = clonedNode.textContent;
                    if (document.activeElement === input) input.blur();
                    sendChatbotMessage();
                }
            });
        }
        track.appendChild(clonedNode);
    });

    // Start JS-based auto-scroll (no CSS animation needed)
    if (container._startAutoScroll) {
        container._startAutoScroll();
    }

    // Close button handler
    const closeBtn = document.getElementById('closeSuggestions');
    const wrapper = document.getElementById('chatbotSuggestionsWrapper');
    if (closeBtn && wrapper) {
        closeBtn.addEventListener('click', () => {
            wrapper.classList.add('hidden');
        });
    }
}

function initializeChatbot() {
    const chatbotIcon = document.getElementById('chatbotIcon');
    const chatbotModal = document.getElementById('chatbotModal');
    const closeChatbot = document.getElementById('closeChatbot');
    const sendMessage = document.getElementById('sendMessage');
    const chatbotInput = document.getElementById('chatbotInput');
    const clearChatbot = document.getElementById('clearChatbot');
    const chatbotHint = document.getElementById('chatbotHint');

    if (!chatbotIcon || !chatbotModal) return;

    let chatbotPreventScrollHandler = null;
    let chatbotSuppressBlur = false;
    let chatbotCloseTimer = null;

    const lockBodyScrollForChatbot = () => {
        if (document.body.classList.contains('chatbot-open')) return;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.dataset.chatbotScrollY = String(scrollY);
        document.body.classList.add('chatbot-open');
        document.body.style.top = `-${scrollY}px`;

        if (!chatbotPreventScrollHandler) {
            chatbotPreventScrollHandler = (ev) => {
                if (!chatbotModal.classList.contains('active')) return;
                const messages = document.getElementById('chatbotMessages');
                if (messages && messages.contains(ev.target)) return;
                // Allow horizontal swipe in suggestions area
                const suggestions = document.getElementById('chatbotSuggestions');
                if (suggestions && suggestions.contains(ev.target)) return;
                ev.preventDefault();
            };
            document.addEventListener('touchmove', chatbotPreventScrollHandler, { passive: false });
            document.addEventListener('wheel', chatbotPreventScrollHandler, { passive: false });
        }
    };

    // Chatbot hint pop-up (encouraging message)
    const hintMessages = [
        'Need help? Ask me!',
        'Looking for a place to eat?',
        'Try asking for nearby cafés!',
        'Want recommendations? Tap me!',
        'Ask me for the best spot nearby!'
    ];
    let hintHideTimer = null;
    let hintLastShown = 0;
    let hintIndex = 0;
    let hintIntervalId = null;

    const getNextHintMessage = () => {
        const message = hintMessages[hintIndex % hintMessages.length];
        hintIndex += 1;
        return message;
    };

    const showChatbotHint = (force = false) => {
        if (!chatbotHint || chatbotModal.classList.contains('active')) return;
        const now = Date.now();
        if (!force && now - hintLastShown < 30000) return; // throttle to once per 30s
        hintLastShown = now;
        const message = getNextHintMessage();
        chatbotHint.textContent = message;
        chatbotHint.classList.add('show');
        if (hintHideTimer) clearTimeout(hintHideTimer);
        hintHideTimer = setTimeout(() => {
            chatbotHint.classList.remove('show');
        }, 3200);
    };

    const unlockBodyScrollForChatbot = () => {
        if (!document.body.classList.contains('chatbot-open')) return;
        const scrollY = parseInt(document.body.dataset.chatbotScrollY || '0', 10) || 0;
        document.body.classList.remove('chatbot-open');
        document.body.style.top = '';
        delete document.body.dataset.chatbotScrollY;
        window.scrollTo(0, scrollY);

        if (chatbotPreventScrollHandler) {
            document.removeEventListener('touchmove', chatbotPreventScrollHandler);
            document.removeEventListener('wheel', chatbotPreventScrollHandler);
            chatbotPreventScrollHandler = null;
        }
    };

    const resetChatbotMessages = () => {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;

        if (messages.classList.contains('is-clearing')) return;

        try {
            localStorage.removeItem('chatbotHistory');
            localStorage.removeItem('chatbotSessionId');
        } catch (e) { /* ignore */ }

        messages.classList.add('is-clearing');
        setTimeout(() => {
            messages.innerHTML = getChatbotEmptyStateMarkup();
            requestAnimationFrame(() => {
                messages.classList.remove('is-clearing');
                scrollChatToBottom();
                updateClearChatbotVisibility();
            });
        }, 180);
    };

    const setChatbotIconOpen = (open) => {
        const ico = chatbotIcon.querySelector('i');
        if (!ico) return;
        ico.style.opacity = '0';
        ico.style.transform = 'scale(0.7)';
        setTimeout(() => {
            if (open) {
                ico.className = 'fas fa-chevron-down';
                chatbotIcon.setAttribute('aria-label', 'Close chat');
            } else {
                ico.className = 'fas fa-robot';
                chatbotIcon.setAttribute('aria-label', 'Open chat');
            }
            ico.style.opacity = '1';
            ico.style.transform = 'scale(1)';
        }, 120);
    };

    const finalizeChatbotClose = () => {
        if (chatbotCloseTimer) {
            clearTimeout(chatbotCloseTimer);
            chatbotCloseTimer = null;
        }
        resetChatbotModalViewportSizing();
        chatbotModal.classList.remove('fullscreen', 'keyboard-open', 'chatbot-closing');
        const _md = document.getElementById('chatbotMenuDropdown');
        if (_md) _md.classList.remove('open');
        unlockBodyScrollForChatbot();
    };

    const closeChatbotModal = () => {
        if (!chatbotModal.classList.contains('active') && !chatbotModal.classList.contains('chatbot-closing')) return;

        if (chatbotCloseTimer) {
            clearTimeout(chatbotCloseTimer);
            chatbotCloseTimer = null;
        }

        const isMobile = window.innerWidth <= 768;
        chatbotModal.classList.add('chatbot-closing');
        chatbotModal.classList.remove('active');
        setChatbotIconOpen(false);

        if (!isMobile) {
            finalizeChatbotClose();
            return;
        }

        // Optimize: faster closing animation on mobile (300ms matches typical transitions)
        chatbotCloseTimer = setTimeout(() => {
            finalizeChatbotClose();
        }, 300);
    };

    chatbotIcon.addEventListener('click', () => {
        // If already open, close it
        if (chatbotModal.classList.contains('active')) {
            closeChatbotModal();
            return;
        }
        if (chatbotHint) chatbotHint.classList.remove('show');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        // Open as fullscreen only on small screens (mobile). On desktop show a smaller modal.
        const isMobile = window.innerWidth <= 768;
        if (chatbotCloseTimer) {
            clearTimeout(chatbotCloseTimer);
            chatbotCloseTimer = null;
        }
        chatbotModal.classList.remove('chatbot-closing');
        resetChatbotModalViewportSizing();
        chatbotModal.classList.remove('keyboard-open');
        lockBodyScrollForChatbot();
        // Restore persisted expanded state
        try {
            const wasExpanded = localStorage.getItem('fc_chatbot_expanded') === '1';
            chatbotModal.classList.toggle('chatbot-expanded', wasExpanded);
            const _et = document.getElementById('chatbotExpandToggle');
            if (_et) _et.innerHTML = wasExpanded
                ? '<i class="fas fa-compress-alt"></i> Collapse'
                : '<i class="fas fa-expand-alt"></i> Expand';
        } catch(e) {}
        // Size the modal BEFORE activating so the transition starts from the correct dimensions
        if (isMobile) {
            chatbotBaseHeight = null;
            updateChatbotModalViewportSizing();
        }
        if (isMobile) {
            chatbotModal.classList.add('active', 'fullscreen');
        } else {
            chatbotModal.classList.add('active');
            // ensure fullscreen class is removed in case it was left behind
            chatbotModal.classList.remove('fullscreen');
        }
        setChatbotIconOpen(true);
        // ensure the latest message is visible when opening
        setTimeout(scrollChatToBottom, isIOS ? 100 : 0);

        // show suggestions wrapper again if it was hidden
        const suggestionsWrapper = document.getElementById('chatbotSuggestionsWrapper');
        if (suggestionsWrapper) {
            const hidden = localStorage.getItem('fc_suggestions_hidden') === '1';
            suggestionsWrapper.classList.toggle('hidden', hidden);
            // sync menu label
            const menuToggleBtn = document.getElementById('chatbotMenuToggleSuggestions');
            if (menuToggleBtn) {
                menuToggleBtn.innerHTML = hidden
                    ? '<i class="fas fa-lightbulb"></i> Show prompt suggestions'
                    : '<i class="fas fa-lightbulb"></i> Remove prompt suggestions';
            }
        }

        // ensure suggestions are loaded when opening
        try { loadChatbotSuggestions(); } catch (e) { /* ignore */ }
    });

    if (chatbotIcon) {
        chatbotIcon.addEventListener('mouseenter', () => showChatbotHint(true));
        chatbotIcon.addEventListener('focus', () => showChatbotHint(true));
        chatbotIcon.addEventListener('touchstart', () => showChatbotHint(true), { passive: true });
    }

    // Show hints periodically, with a gentle initial delay
    const startHintCycle = () => {
        if (hintIntervalId) return;
        setTimeout(() => {
            showChatbotHint(false);
            if (!hintIntervalId) {
                hintIntervalId = setInterval(() => showChatbotHint(false), 45000);
            }
        }, 6000);
    };

    startHintCycle();

    if (closeChatbot) {
        closeChatbot.addEventListener('click', () => {
            closeChatbotModal();
        });
    }

    // Add Escape key support to close modal (standard UX pattern)
    const chatbotKeydownHandler = (e) => {
        if (!chatbotModal.classList.contains('active')) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closeChatbotModal();
        }
    };
    document.addEventListener('keydown', chatbotKeydownHandler);

    // Add swipe-down gesture to close modal on mobile
    let swipeStartY = 0;
    let swipeStartX = 0;
    let swipeTracking = false;
    const swipeThreshold = 60; // pixels to trigger close

    const handleSwipeStart = (e) => {
        if (!chatbotModal.classList.contains('active')) return;
        // Only track swipe from the header area to avoid interfering with message scrolling
        const header = chatbotModal.querySelector('.chatbot-header');
        if (!header || !header.contains(e.target)) {
            swipeTracking = false;
            return;
        }
        
        swipeStartY = e.touches ? e.touches[0].clientY : e.clientY;
        swipeStartX = e.touches ? e.touches[0].clientX : e.clientX;
        swipeTracking = true;
    };

    const handleSwipeEnd = (e) => {
        if (!chatbotModal.classList.contains('active')) return;
        if (!swipeTracking) return;
        if (e.touches && e.touches.length > 0) return; // multi-touch, ignore

        swipeTracking = false;
        
        const swipeEndY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const swipeEndX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        
        const swipeDeltaY = swipeEndY - swipeStartY;
        const swipeDeltaX = Math.abs(swipeEndX - swipeStartX);
        
        // Only close if swiping down more than side-to-side
        if (swipeDeltaY > swipeThreshold && swipeDeltaY > swipeDeltaX) {
            closeChatbotModal();
        }
    };

    chatbotModal.addEventListener('touchstart', handleSwipeStart, { passive: true });
    chatbotModal.addEventListener('touchend', handleSwipeEnd, { passive: true });

    if (clearChatbot) {
        clearChatbot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const confirmed = window.confirm('Clear all chat messages?');
            if (!confirmed) return;
            resetChatbotMessages();
            if (chatbotInput) {
                chatbotInput.value = '';
                chatbotInput.style.height = '36px';
                chatbotInput.style.lineHeight = '36px';
                chatbotInput.style.paddingTop = '0';
                chatbotInput.style.paddingBottom = '0';
                const c = chatbotInput.closest('.chatbot-input');
                if (c) c.style.borderRadius = '';
                chatbotInput.focus();
            }
        });
    }

    // --- Desktop 3-dot menu ---
    const menuBtn = document.getElementById('chatbotMenuBtn');
    const menuDropdown = document.getElementById('chatbotMenuDropdown');
    const menuClear = document.getElementById('chatbotMenuClear');
    const expandToggle = document.getElementById('chatbotExpandToggle');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menuDropdown.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('open');
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Delete conversation via menu
    if (menuClear) {
        menuClear.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menuDropdown && menuDropdown.classList.remove('open');
            const confirmed = window.confirm('Delete all chat messages?');
            if (!confirmed) return;
            resetChatbotMessages();
            if (chatbotInput) {
                chatbotInput.value = '';
                chatbotInput.style.height = '36px';
                chatbotInput.style.lineHeight = '36px';
                chatbotInput.style.paddingTop = '0';
                chatbotInput.style.paddingBottom = '0';
                const c = chatbotInput.closest('.chatbot-input');
                if (c) c.style.borderRadius = '';
                chatbotInput.focus();
            }
        });
    }

    // Expand / Collapse toggle via menu
    if (expandToggle && chatbotModal) {
        expandToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menuDropdown && menuDropdown.classList.remove('open');
            const isExpanded = chatbotModal.classList.toggle('chatbot-expanded');
            expandToggle.innerHTML = isExpanded
                ? '<i class="fas fa-compress-alt"></i> Collapse'
                : '<i class="fas fa-expand-alt"></i> Expand';
            try { localStorage.setItem('fc_chatbot_expanded', isExpanded ? '1' : '0'); } catch(e) {}
        });
    }

    // Toggle prompt suggestions via menu
    const menuToggleSuggestions = document.getElementById('chatbotMenuToggleSuggestions');
    if (menuToggleSuggestions) {
        menuToggleSuggestions.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menuDropdown && menuDropdown.classList.remove('open');
            const wrapper = document.getElementById('chatbotSuggestionsWrapper');
            if (!wrapper) return;
            const isHidden = wrapper.classList.toggle('hidden');
            try { localStorage.setItem('fc_suggestions_hidden', isHidden ? '1' : '0'); } catch(err) {}
            menuToggleSuggestions.innerHTML = isHidden
                ? '<i class="fas fa-lightbulb"></i> Show prompt suggestions'
                : '<i class="fas fa-lightbulb"></i> Remove prompt suggestions';
        });
    }

    // Close chatbot when clicking outside the modal (desktop & mobile)
    // Attach the listener only once per modal instance.
    if (chatbotModal && !chatbotModal.dataset.outsideListener) {
        let pointerDownInsideChatbot = false;

        const trackPointerDown = (ev) => {
            if (!chatbotModal.classList.contains('active')) return;
            const target = ev.target;
            pointerDownInsideChatbot = !!(chatbotModal.contains(target) || (chatbotIcon && chatbotIcon.contains(target)));
        };

        document.addEventListener('pointerdown', trackPointerDown, { capture: true });
        document.addEventListener('touchstart', trackPointerDown, { capture: true });

        document.addEventListener('click', (ev) => {
            try {
                // If modal is not open, do nothing
                if (!chatbotModal.classList.contains('active')) return;

            // On mobile, do not auto-close on outside taps
            if (window.innerWidth <= 768) return;

                // If the interaction started inside the modal, ignore
                if (pointerDownInsideChatbot) {
                    pointerDownInsideChatbot = false;
                    return;
                }

                const target = ev.target;
                // If click is inside the modal or on the chatbot icon, ignore
                if (chatbotModal.contains(target) || (chatbotIcon && chatbotIcon.contains(target))) return;

                // Otherwise close the modal and reset sizing
                closeChatbotModal();
            } catch (e) {
                // ignore errors
                console.warn('chatbot outside click handler error', e);
            }
        }, { capture: true });
        chatbotModal.dataset.outsideListener = '1';
    }

    if (sendMessage) {
        // Prevent the button from blurring the input on mobile by preventing
        // default focus change and re-focusing the input immediately.
        // Ensure button behaves as a plain button (not submit)
        try { sendMessage.type = 'button'; } catch (e) {}

        const keepInputFocused = () => {
            chatbotSuppressBlur = true;
            if (chatbotInput) {
                chatbotInput.focus();
            }
        };

        sendMessage.addEventListener('pointerdown', keepInputFocused);
        sendMessage.addEventListener('touchstart', keepInputFocused, { passive: true });
        sendMessage.addEventListener('mousedown', keepInputFocused);

        sendMessage.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (chatbotIsResponding) {
                terminateChatbotResponse();
                return;
            }
            // Keep focus on input before sending
            if (chatbotInput) {
                chatbotInput.focus();
            }
            // Send message
            sendChatbotMessage();
            // Re-focus input immediately after to keep keyboard open
            if (chatbotInput) {
                setTimeout(() => chatbotInput.focus(), 0);
            }
            // Release blur suppression shortly after click
            setTimeout(() => { chatbotSuppressBlur = false; }, 0);
        });
    }

    if (chatbotInput) {
        // Auto-resize textarea as user types
        const autoResize = () => {
            const maxHeight = 120;
            const minHeight = 36;
            const prevHeight = chatbotInput.offsetHeight;
            const container = chatbotInput.closest('.chatbot-input');

            chatbotInput.style.transition = 'none';
            chatbotInput.style.overflowY = 'hidden';
            chatbotInput.style.height = 'auto';

            const firstMeasuredHeight = chatbotInput.scrollHeight;
            const isSingleLine = firstMeasuredHeight <= (minHeight + 1);

            // Perfect centering for one line; normal readable spacing for multiline.
            chatbotInput.style.lineHeight = isSingleLine ? (minHeight + 'px') : '1.35';
            chatbotInput.style.paddingTop = isSingleLine ? '0' : '0.35rem';
            chatbotInput.style.paddingBottom = isSingleLine ? '0' : '0.35rem';

            // Re-measure after typography/padding update to avoid inflated multiline height.
            chatbotInput.style.height = 'auto';
            const naturalHeight = chatbotInput.scrollHeight;
            const newHeight = Math.min(Math.max(naturalHeight, minHeight), maxHeight);

            // Soften border-radius when multi-line
            if (container) {
                container.style.borderRadius = newHeight > minHeight ? '16px' : '';
            }

            chatbotInput.style.height = prevHeight + 'px';
            void chatbotInput.offsetHeight;

            chatbotInput.style.transition = 'height 0.18s ease';
            chatbotInput.style.height = newHeight + 'px';
            chatbotInput.style.overflowY = naturalHeight > maxHeight ? 'auto' : 'hidden';
        };
        
        chatbotInput.addEventListener('input', autoResize);
        chatbotInput.addEventListener('paste', () => setTimeout(autoResize, 0));
        
        // Initial check for current content
        autoResize();
        
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                // prevent form submit/blur behavior and keep keyboard open
                // Shift+Enter allows new line
                e.preventDefault();
                sendChatbotMessage();
                setTimeout(() => {
                    chatbotInput.focus();
                    chatbotInput.style.transition = 'none';
                    chatbotInput.style.height = '36px';
                    chatbotInput.style.overflowY = 'hidden';
                    chatbotInput.style.lineHeight = '36px';
                    chatbotInput.style.paddingTop = '0';
                    chatbotInput.style.paddingBottom = '0';
                    const c = chatbotInput.closest('.chatbot-input');
                    if (c) c.style.borderRadius = '';
                }, 0);
            }
        });

        chatbotInput.addEventListener('focus', () => {
            const isMobileViewport = window.innerWidth <= 768;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            if (!isMobileViewport) {
                // Desktop: keep modal anchored and skip mobile keyboard adjustments
                resetChatbotModalViewportSizing();
                chatbotModal.classList.remove('keyboard-open');
                scrollChatToBottom();
                return;
            }
            
            // Remember if the messages container was at the bottom before keyboard opens
            try {
                const messagesContainer = document.getElementById('chatbotMessages');
                if (messagesContainer) {
                    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
                    chatbotWasAtBottomBeforeKeyboard = distanceFromBottom <= 8;
                }
            } catch (e) {
                chatbotWasAtBottomBeforeKeyboard = false;
            }

            // iOS: Add a small delay to let the keyboard animation start
            const keyboardDelay = isIOS ? 100 : 0;
            setTimeout(() => {
                updateChatbotModalViewportSizing();
            }, keyboardDelay);
            
            if (!chatbotViewportCleanup) {
                const syncViewport = () => {
                    updateChatbotModalViewportSizing();
                    // If the user was at the bottom before keyboard opened, shift scroll
                    // slightly up so the header doesn't get pushed out of view by the OS
                    try {
                        const messagesContainer = document.getElementById('chatbotMessages');
                        const modal = document.getElementById('chatbotModal');
                        if (messagesContainer && modal && chatbotWasAtBottomBeforeKeyboard) {
                            const header = modal.querySelector('.chatbot-header');
                            const headerHeight = header ? header.getBoundingClientRect().height : 0;
                            const extraPad = 12; // small breathing room
                            const targetScroll = Math.max(0, messagesContainer.scrollHeight - messagesContainer.clientHeight - Math.min(headerHeight, messagesContainer.clientHeight / 2) - extraPad);
                            messagesContainer.scrollTop = targetScroll;
                            // clear flag after adjusting once
                            chatbotWasAtBottomBeforeKeyboard = false;
                        } else {
                            scrollChatToBottom();
                        }
                    } catch (e) {
                        scrollChatToBottom();
                    }
                };

                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', syncViewport);
                    window.visualViewport.addEventListener('scroll', syncViewport);
                    chatbotViewportCleanup = () => {
                        window.visualViewport.removeEventListener('resize', syncViewport);
                        window.visualViewport.removeEventListener('scroll', syncViewport);
                        chatbotViewportCleanup = null;
                    };
                } else {
                    window.addEventListener('resize', syncViewport);
                    chatbotViewportCleanup = () => {
                        window.removeEventListener('resize', syncViewport);
                        chatbotViewportCleanup = null;
                    };
                }
            }
            
            // iOS: Delay scroll to bottom to let keyboard finish animating
            setTimeout(() => {
                scrollChatToBottom();
            }, isIOS ? 350 : 50);
        });

        chatbotInput.addEventListener('blur', () => {
            if (chatbotSuppressBlur) {
                // Keep keyboard open when user taps Send
                setTimeout(() => {
                    chatbotSuppressBlur = false;
                    if (chatbotInput) chatbotInput.focus();
                }, 0);
                return;
            }

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            chatbotModal.classList.remove('keyboard-open');
            
            // iOS: Delay the reset to allow keyboard to finish closing
            const resetDelay = isIOS ? 300 : 50;
            setTimeout(() => {
                resetChatbotModalViewportSizing();
                
                // Restore modal height for mobile after keyboard closes
                setTimeout(() => {
                    if (window.innerWidth <= 768 && chatbotModal.classList.contains('active')) {
                        updateChatbotModalViewportSizing();
                    }
                }, isIOS ? 150 : 70);
            }, resetDelay);
        });
    }

    // Setup scroll lock listener to detect when user scrolls up
    const messagesContainer = document.getElementById('chatbotMessages');
    if (messagesContainer && !chatbotScrollLockListener) {
        chatbotScrollLockListener = () => {
            // Check if user is near the bottom (within 50px of the bottom)
            const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight <= 50;
            chatbotScrollLocked = isNearBottom;
        };
        messagesContainer.addEventListener('scroll', chatbotScrollLockListener);
    }

    // Restore chat history from localStorage without re-saving
    const storedHistory = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
    storedHistory.forEach(entry => addChatMessage(entry.message, entry.sender, true));
    if (!storedHistory.length) ensureChatbotEmptyState();
    scrollChatToBottom();
    updateClearChatbotVisibility();
}

// Send chatbot message
async function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    if (!input) return;

    if (chatbotIsResponding) return;

    const message = input.value.trim();
    if (!message) return;

    addChatMessage(message, 'user');
    input.value = '';
    // Reset textarea height after sending
    input.style.height = '36px';
    input.style.lineHeight = '36px';
    input.style.paddingTop = '0';
    input.style.paddingBottom = '0';
    const c = input.closest('.chatbot-input');
    if (c) c.style.borderRadius = '';
    // Keep focus to allow continuous chatting on mobile

    // Get or create a persistent session ID for conversation context
    let sessionId = localStorage.getItem('chatbotSessionId');
    if (!sessionId) {
        // Generate a unique session ID (UUID-like)
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatbotSessionId', sessionId);
    }

    // Show loading icon and switch to terminate state
    showChatbotLoading();
    setChatbotResponseState(true);
    chatbotAbortController = new AbortController();
    try {
        // Use configured chatbot API URL. Change CHATBOT_API_URL at top of file if needed.
        // The public ngrok URL exposes the chat endpoint at /chat/stream according to the server info.
        const CHATBOT_API_URL = window.CHATBOT_API_URL || 'https://new-llm-production.up.railway.app/chat/stream';
        const response = await fetch(CHATBOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: message,
                session_id: sessionId  // Send session ID for context awareness
            }),
            signal: chatbotAbortController.signal
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            hideChatbotLoading();
            console.error('Chatbot HTTP error', response.status, text);
            addChatMessage(`Sorry, I encountered an error (${response.status}).`, 'bot');
            // Keep focus for continued typing
            return;
        }

        // Check if response is streaming (Server-Sent Events)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream')) {
            // Handle streaming response with real-time display
            hideChatbotLoading();
            
            // Create a bot message element that we'll update in real-time
            const messagesContainer = document.getElementById('chatbotMessages');
            if (!messagesContainer) {
                addChatMessage('Error: Messages container not found.', 'bot');
                // Keep focus for continued typing
                return;
            }
            
            // Create streaming message with typing indicator initially
            const streamMessageElement = document.createElement('div');
            streamMessageElement.className = 'bot-message streaming';
            streamMessageElement.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>';
            messagesContainer.appendChild(streamMessageElement);
            scrollChatToBottom();
            
            const reader = response.body.getReader();
            chatbotStreamReader = reader;
            const decoder = new TextDecoder();
            let fullAnswer = '';
            let firstChunkReceived = false;
            let scrollFrameScheduled = false;
            let textContentElement = null;
            
            try {
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, {stream: true});
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonData = JSON.parse(line.substring(6));
                                if (jsonData.chunk) {
                                    // On first chunk, remove typing indicator and set up text node for smooth streaming
                                    if (!firstChunkReceived) {
                                        firstChunkReceived = true;
                                        streamMessageElement.innerHTML = '';
                                        textContentElement = document.createElement('span');
                                        textContentElement.className = 'streaming-text';
                                        streamMessageElement.appendChild(textContentElement);
                                    }
                                    
                                    fullAnswer += jsonData.chunk;
                                    // Use textContent for raw streaming (no markdown processing yet)
                                    // This is much faster than calling formatChatbotMarkdown on each chunk
                                    if (textContentElement) {
                                        textContentElement.textContent = fullAnswer;
                                    }
                                    
                                    // Batch scroll updates using requestAnimationFrame for smooth scrolling
                                    if (!scrollFrameScheduled && chatbotScrollLocked) {
                                        scrollFrameScheduled = true;
                                        requestAnimationFrame(() => {
                                            scrollChatToBottom();
                                            scrollFrameScheduled = false;
                                        });
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to parse SSE chunk:', line);
                            }
                        }
                    }
                }
                
                // Remove streaming class when complete
                streamMessageElement.classList.remove('streaming');
                
                if (!fullAnswer) {
                    streamMessageElement.textContent = 'Sorry, I received an empty response.';
                } else {
                    // Now apply markdown formatting once after all chunks have arrived
                    setBotMessageContent(streamMessageElement, fullAnswer);
                }
                
                // Save to history after streaming is complete
                if (fullAnswer) {
                    const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
                    history.push({ message: fullAnswer, sender: 'bot' });
                    localStorage.setItem('chatbotHistory', JSON.stringify(history));
                }
                
            } catch (e) {
                if (e && e.name === 'AbortError') {
                    // aborted by user
                    streamMessageElement.classList.remove('streaming');
                } else {
                    console.error('Streaming error:', e);
                    streamMessageElement.classList.remove('streaming');
                    streamMessageElement.textContent = 'Sorry, there was an error receiving the response.';
                }
            }
            
            // Keep focus for continued typing
            return;
        }

        // Handle regular JSON response
        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text().catch(() => '');
            hideChatbotLoading();
            console.error('Chatbot returned invalid JSON:', text);
            addChatMessage('Sorry, I received an unexpected response from the chat server.', 'bot');
            // Keep focus for continued typing
            return;
        }

        hideChatbotLoading();

        // Normalize possible response shapes
        let answer = null;
        if (!data) {
            answer = null;
        } else if (typeof data === 'string') {
            answer = data;
        } else if (data.answer && typeof data.answer === 'string') {
            answer = data.answer;
        } else if (data.answer && typeof data.answer === 'object' && data.answer.text) {
            answer = data.answer.text;
        } else if (data.response && typeof data.response === 'string') {
            answer = data.response;
        } else if (data.reply && typeof data.reply === 'string') {
            answer = data.reply;
        } else if (data.text && typeof data.text === 'string') {
            answer = data.text;
        } else if (data.answer && data.answer.result) {
            answer = String(data.answer.result);
        } else {
            try { answer = JSON.stringify(data); } catch (e) { answer = null; }
        }

        if (!answer) {
            console.warn('Chatbot returned empty answer object:', data);
            try {
                const raw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                addChatMessage('Sorry, the chatbot returned an empty response. Raw: ' + raw, 'bot');
            } catch (e) {
                addChatMessage('Sorry, the chatbot returned an empty response.', 'bot');
            }
        } else {
            addChatMessage(answer, 'bot');
        }

        // Keep focus for continued typing

    } catch (error) {
        if (error && error.name === 'AbortError') {
            // User terminated the response
        } else {
            hideChatbotLoading();
            console.error('Chatbot error (network or unexpected):', error);
            addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
        // Keep focus for continued typing
    } finally {
        chatbotStreamReader = null;
        chatbotAbortController = null;
        hideChatbotLoading();
        setChatbotResponseState(false);
    }
}

// Show chatbot loading icon
function showChatbotLoading() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;

    let loadingElement = document.getElementById('chatbot-loading');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'chatbot-loading';
        loadingElement.className = 'bot-message';
    // Show only the animated typing indicator (no literal "Typing..." text)
    loadingElement.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>';
        messagesContainer.appendChild(loadingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Hide chatbot loading icon
function hideChatbotLoading() {
    const loadingElement = document.getElementById('chatbot-loading');
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

// Add chat message
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (messagesContainer && chatbotScrollLocked) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function scrollMessageToTop(el) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer || !el) return;
    // offsetTop is relative to the messages container; subtract top padding (12px)
    const paddingTop = parseFloat(window.getComputedStyle(messagesContainer).paddingTop) || 12;
    messagesContainer.scrollTop = el.offsetTop - paddingTop;
}

function updateChatbotModalViewportSizing() {
    const modal = document.getElementById('chatbotModal');
    const inputElement = document.querySelector('.chatbot-input');
    if (!modal || !inputElement) return;

    const root = document.documentElement;
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        chatbotBaseHeight = null;
        root.style.removeProperty('--chatbot-keyboard-offset');
        root.style.removeProperty('--chatbot-modal-height');
        root.style.removeProperty('--chatbot-messages-max-height');
        modal.classList.remove('keyboard-open');
        return;
    }

    // Prevent body scroll when chatbot is open
    if (modal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        // iOS: Store scroll position to restore later
        if (!document.body.dataset.scrollY) {
            document.body.dataset.scrollY = window.scrollY.toString();
            document.body.style.top = `-${window.scrollY}px`;
        }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const viewport = window.visualViewport;
    const layoutHeight = window.innerHeight;
    // iOS: visualViewport.height is more reliable for keyboard detection
    const visibleHeight = viewport ? viewport.height : layoutHeight;
    const viewportOffsetTop = viewport ? viewport.offsetTop : 0;

    // iOS fix: use visibleHeight + offsetTop to avoid double keyboard offset
    const modalHeight = isIOS ? Math.round(visibleHeight + viewportOffsetTop) : Math.round(visibleHeight);
    const keyboardHeight = Math.max(0, layoutHeight - (visibleHeight + (isIOS ? viewportOffsetTop : 0)));

    // Apply viewport height to the modal so it resizes with the keyboard
    root.style.setProperty('--chatbot-modal-height', `${modalHeight}px`);
    root.style.setProperty('--chatbot-keyboard-offset', `${Math.round(keyboardHeight)}px`);
    
    // iOS: Set the modal's actual height directly for more reliable sizing
    if (isIOS) {
        modal.style.height = `${modalHeight}px`;
        modal.style.maxHeight = `${modalHeight}px`;
        // Keep modal anchored to bottom (avoid extra offset)
        modal.style.bottom = '0';
    }

    // Calculate max height for messages area to prevent overlap with header/footer
    const header = modal.querySelector('.chatbot-header');
    const footer = modal.querySelector('.chatbot-footer');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
    const messagesMax = Math.max(120, Math.round(visibleHeight - headerHeight - footerHeight - 10));
    root.style.setProperty('--chatbot-messages-max-height', `${messagesMax}px`);

    // Toggle class for any keyboard-specific styling
    if (keyboardHeight > 50) {
        modal.classList.add('keyboard-open');
    } else {
        modal.classList.remove('keyboard-open');
    }
}

function setChatbotResponseState(isResponding) {
    chatbotIsResponding = isResponding;
    const sendBtn = document.getElementById('sendMessage');
    const input = document.getElementById('chatbotInput');

    if (sendBtn) {
        if (isResponding) {
            if (!sendBtn.dataset.originalHtml) {
                sendBtn.dataset.originalHtml = sendBtn.innerHTML;
            }
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
            sendBtn.setAttribute('aria-label', 'Stop response');
        } else {
            if (sendBtn.dataset.originalHtml) {
                sendBtn.innerHTML = sendBtn.dataset.originalHtml;
                delete sendBtn.dataset.originalHtml;
            }
            sendBtn.setAttribute('aria-label', 'Send message');
        }
    }

    if (input) {
        input.disabled = false;
    }
}

function terminateChatbotResponse() {
    if (!chatbotIsResponding) return;
    try {
        if (chatbotAbortController) {
            chatbotAbortController.abort();
        }
        if (chatbotStreamReader) {
            try { chatbotStreamReader.cancel(); } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore */ }
    hideChatbotLoading();
    setChatbotResponseState(false);
}

function resetChatbotModalViewportSizing() {
    const modal = document.getElementById('chatbotModal');
    const inputElement = document.querySelector('.chatbot-input');
    const root = document.documentElement;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (modal) {
        modal.classList.remove('keyboard-open');
        // iOS: Reset inline styles
        if (isIOS) {
            modal.style.height = '';
            modal.style.maxHeight = '';
            modal.style.bottom = '';
        }
    }
    
    if (inputElement) {
        inputElement.style.transform = '';
    }

    // Re-enable body scroll and restore scroll position (iOS)
    if (document.body.dataset.scrollY) {
        const scrollY = parseInt(document.body.dataset.scrollY, 10) || 0;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        delete document.body.dataset.scrollY;
        // Only restore scroll if chatbot is being closed
        if (!modal || !modal.classList.contains('active')) {
            window.scrollTo(0, scrollY);
        }
    } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
    }

    root.style.removeProperty('--chatbot-keyboard-offset');
    root.style.removeProperty('--chatbot-modal-height');
    root.style.removeProperty('--chatbot-messages-max-height');

    chatbotBaseHeight = null;

    if (typeof chatbotViewportCleanup === 'function') {
        chatbotViewportCleanup();
        chatbotViewportCleanup = null;
    }
}

function escapeChatbotHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Inline formatting: bold, italic, URLs — applied to an already-escaped string
function formatChatbotInline(text) {
    const escaped = escapeChatbotHtml(text);
    // Linkify URLs
    const withLinks = escaped.replace(/\bhttps?:\/\/[^\s<&]+/gi, (rawUrl) => {
        let url = rawUrl;
        let trailing = '';
        const m = url.match(/[)\].,!?;:]+$/);
        if (m) { trailing = m[0]; url = url.slice(0, -trailing.length); }
        return `<a class="chatbot-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trailing}`;
    });
    return withLinks
        .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>');
}

// Full block-level markdown renderer: tables, lists, paragraphs
function formatChatbotMarkdown(text) {
    const lines = text.split('\n');
    const out = [];
    let i = 0;

    const parseCells = (line) => {
        const parts = line.split('|');
        if (parts[0].trim() === '') parts.shift();
        if (parts.length && parts[parts.length - 1].trim() === '') parts.pop();
        return parts.map(c => c.trim());
    };


    while (i < lines.length) {
        const line = lines[i];

        // --- Markdown table ---
        if (
            line.includes('|') &&
            i + 1 < lines.length &&
            /^\s*\|?[\s|:\-]+\|/.test(lines[i + 1])
        ) {
            const headers = parseCells(line);
            i += 2; // skip header + separator row
            const rows = [];
            while (i < lines.length && lines[i].includes('|')) {
                rows.push(parseCells(lines[i]));
                i++;
            }
            let html = '<div class="chatbot-table-wrap"><table class="chatbot-table"><thead><tr>';
            headers.forEach(h => { html += `<th>${formatChatbotInline(h)}</th>`; });
            html += '</tr></thead><tbody>';
            rows.forEach(row => {
                html += '<tr>';
                row.forEach(cell => { html += `<td>${formatChatbotInline(cell)}</td>`; });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            out.push(html);
            continue;
        }

        // --- Horizontal rule ---
        if (/^\s*-{3,}\s*$/.test(line)) {
            out.push('<hr>');
            i++;
            continue;
        }

        // --- Heading level 3 ---
        if (/^\s*###\s+/.test(line)) {
            out.push(`<h3>${formatChatbotInline(line.replace(/^\s*###\s+/, ''))}</h3>`);
            i++;
            continue;
        }

        // --- Unordered list ---
        if (/^\s*[-*+]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
                items.push(`<li>${formatChatbotInline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`);
                i++;
            }
            out.push(`<ul class="chatbot-list">${items.join('')}</ul>`);
            continue;
        }

        // --- Ordered list ---
        if (/^\s*\d+\.\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                items.push(`<li>${formatChatbotInline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
                i++;
            }
            out.push(`<ol class="chatbot-list">${items.join('')}</ol>`);
            continue;
        }

        // --- Empty line ---
        if (line.trim() === '') {
            const last = out[out.length - 1];
            if (last && last !== '<br>') out.push('<br>');
            i++;
            continue;
        }

        // --- Regular text ---
        out.push(formatChatbotInline(line) + '<br>');
        i++;
    }

    // Trim trailing <br>s
    while (out.length && out[out.length - 1] === '<br>') out.pop();
    return out.join('');
}

// Keep legacy name as alias
function formatChatbotInlineMarkdown(text) { return formatChatbotMarkdown(text); }
function linkifyChatbotText(text) { return formatChatbotMarkdown(text); }

function getChatbotWelcomeImageSrc() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const fromData = messagesContainer?.dataset?.emptyImageSrc;
    if (fromData && fromData.trim() !== '') return fromData.trim();

    const basePath = (window.APP_BASE_PATH || '').replace(/\/$/, '');
    return `${basePath}/ChatGPT%20Image%20Mar%209%2C%202026%2C%2008_48_11%20PM1.webp`;
}

function getChatbotEmptyStateMarkup() {
    return `
        <div class="chatbot-empty-state" id="chatbotEmptyState" aria-hidden="true">
            <img src="${getChatbotWelcomeImageSrc()}" alt="Assistant welcome" class="chatbot-empty-image">
            <p class="chatbot-empty-text">How can I help you?</p>
        </div>
    `;
}
function ensureChatbotEmptyState() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    const hasRealMessages = !!messagesContainer.querySelector('.bot-message, .user-message');
    if (hasRealMessages) return;
    if (!messagesContainer.querySelector('.chatbot-empty-state')) {
        messagesContainer.innerHTML = getChatbotEmptyStateMarkup();
    }
}

function setBotMessageContent(element, message) {
    element.innerHTML = formatChatbotMarkdown(message);
}

function addChatMessage(message, sender, skipSave = false) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    const emptyState = messagesContainer.querySelector('.chatbot-empty-state');
    if (emptyState) emptyState.remove();
    // Normalize message: remove accidental leading/trailing whitespace/newlines
    message = (message || '').replace(/^\s+|\s+$/g, '');

    const messageElement = document.createElement('div');
    messageElement.className = `${sender}-message`;
    if (sender === 'bot') {
        setBotMessageContent(messageElement, message);
    } else {
        // Use textContent so internal newlines are preserved and rendered according to CSS (pre-line)
        messageElement.textContent = message;
    }

    messagesContainer.appendChild(messageElement);
    if (sender === 'user') {
        // Wait two frames so the element is fully laid out before scrolling
        requestAnimationFrame(() => requestAnimationFrame(() => scrollMessageToTop(messageElement)));
        chatbotScrollLocked = true;
    } else {
        scrollChatToBottom();
    }

    if (!skipSave) {
        const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
        history.push({ message, sender });
        localStorage.setItem('chatbotHistory', JSON.stringify(history));
    }

    updateClearChatbotVisibility();
}

function updateClearChatbotVisibility() {
    const clearBtn = document.getElementById('clearChatbot');
    if (!clearBtn) return;
    let hasChats = false;
    try {
        const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
        hasChats = Array.isArray(history) && history.length > 0;
    } catch (e) {
        hasChats = false;
    }
    clearBtn.style.display = hasChats ? '' : 'none';
    clearBtn.setAttribute('aria-hidden', hasChats ? 'false' : 'true');
}

// Add CSS for routing
const routingStyles = `
/* Route info popup styles */
.route-info-popup .mapboxgl-popup-content {
    border-radius: 10px;
    padding: 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    width: 185px !important;
    max-width: 185px !important;
}

.route-popup-content {
    padding: 7px 10px;
}

.route-popup-title {
    font-weight: 700;
    font-size: 0.63rem;
    color: #1e293b;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.route-popup-title i {
    color: #4285f4;
    font-size: 0.63rem;
    flex-shrink: 0;
}

.route-popup-stats {
    display: flex;
    justify-content: space-around;
    gap: 0;
    border-top: 1px solid rgba(0,0,0,0.07);
    padding-top: 5px;
}

.route-popup-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2px;
    position: relative;
}

.route-popup-stat + .route-popup-stat::before {
    content: '';
    position: absolute;
    left: 0;
    top: 15%;
    height: 70%;
    width: 1px;
    background: rgba(0,0,0,0.1);
}

.route-popup-stat i {
    font-size: 0.85rem;
    color: #4285f4;
}

.route-popup-stat .stat-value {
    font-weight: 700;
    font-size: 0.67rem;
    color: #1e293b;
    line-height: 1.1;
}

.route-popup-stat .stat-label {
    font-size: 0.49rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.route-line {
    stroke-dasharray: 10, 10;
    animation: dash 1s linear infinite;
    stroke-width: 4px; /* thinner route line */
    stroke-linecap: round;
    stroke: rgba(253,115,43,0.95);
}

@keyframes dash {
    to { stroke-dashoffset: -20; }
}

.route-start-marker .route-marker-icon,
.route-end-marker .route-marker-icon {
    background: white;
    border: 3px solid;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.route-start-marker .route-marker-icon {
    border-color: #27ae60;
    color: #27ae60;
}

.route-end-marker .route-marker-icon {
    border-color: #e74c3c;
    color: #e74c3c;
}

.route-loading, .route-error, .route-placeholder {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.route-loading i, .route-error i, .route-placeholder i {
    font-size: 3em;
    margin-bottom: 15px;
    display: block;
}

.route-error { color: #e74c3c; }
.route-placeholder i { color: #ddd; }

.route-summary {
    background: transparent;
    padding: 8px 15px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.route-summary h4 {
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    justify-content: center !important;
    text-align: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0;
}

.route-stats {
    display: flex;
    justify-content: space-around;
    text-align: center;
    margin-top: 2px;
}

.route-stat {
    flex: 1;
}

.route-stat i {
    font-size: 1.5em;
    color: #e74c3c;
    margin-bottom: 5px;
    display: block;
}

.route-stat span {
    font-size: 0.9em;
    color: #666;
}

.instructions-list {
    max-height: none;
    overflow: visible;
    border-top: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    border-left: none;
    border-right: none;
    border-radius: 8px;
}

.instruction-step {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #e9ecef;
    background: white;
    cursor: pointer;
}

.instruction-step:hover { background: #f8f9fa; }
.instruction-step:last-child { border-bottom: none; }

.instruction-icon {
    width: 30px;
    text-align: center;
    color: #e74c3c;
    margin-right: 12px;
    font-size: 1.1em;
}

.instruction-content { flex: 1; }

.instruction-text {
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 4px;
}

.instruction-distance {
    font-size: 0.8em;
    color: #6c757d;
}

.instruction-number {
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    font-weight: bold;
    margin-left: 10px;
}

.route-actions {
    display: flex;
    gap: 10px;
    margin: 20px 0;
}

.action-btn {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-primary {
    background: #e74c3c;
    color: white;
}

.btn-primary:hover { background: #c0392b; }

.btn-secondary {
    background: #3498db;
    color: white;
}

.btn-secondary:hover { background: #2980b9; }

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover { background: #c82333; }

.route-note {
    background: #e8f4fd;
    padding: 10px 15px;
    border-radius: 5px;
    border-left: 4px solid #3498db;
    font-size: 0.9em;
    color: #2c3e50;
}

.remove-route-control {
    z-index: 1000;
}

.remove-route-btn {
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
}

.remove-route-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.return-home-control {
    z-index: 1000;
}

.return-home-btn {
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
}

.return-home-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}
`;

// Inject the styles
const styleSheet = document.createElement('style');
styleSheet.textContent = routingStyles;
document.head.appendChild(styleSheet);

// --- Full Menu Modal (combined: tab slider for items + photos, lightbox) ---
window.openFullMenuModal = function(restaurantId) {
    const restaurant = restaurants.find(r => r.id == restaurantId);
    if (!restaurant) return;

    // Parse full_menu items
    let items = [];
    try {
        const fm = restaurant.full_menu ? (typeof restaurant.full_menu === 'string' ? JSON.parse(restaurant.full_menu) : restaurant.full_menu) : [];
        if (Array.isArray(fm)) items = fm;
    } catch(e) {}

    // Parse menu images
    let menuImages = [];
    try {
        menuImages = Array.isArray(restaurant.menu_image) ? restaurant.menu_image
            : (restaurant.menu_image ? (function(){ try { return JSON.parse(restaurant.menu_image); } catch(e){ return [restaurant.menu_image]; } })()
            : []);
    } catch(e) {}

    if (items.length === 0 && menuImages.length === 0) return;

    // Remove existing modal if any
    let existing = document.querySelector('.full-menu-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'full-menu-modal-overlay';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    const modal = document.createElement('div');
    modal.className = 'full-menu-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'full-menu-modal-header';
    const headerIconClass = getCategoryIconClass(restaurant.category);
    const _menuPinColor = getCategoryColor(restaurant.category);
    const _menuLighterColor = lightenColor(_menuPinColor, 35);
    header.style.background = `linear-gradient(135deg, ${_menuLighterColor}, ${_menuPinColor})`;
    header.innerHTML = `<h3><i class="fas ${headerIconClass}"></i> ${escapeHtml(restaurant.name)}</h3><button class="full-menu-modal-close" onclick="this.closest('.full-menu-modal-overlay').remove()">&times;</button>`;
    modal.appendChild(header);

    // Determine which tabs to show (we always render both tabs so users can toggle)
    const hasItems = items.length > 0;
    const hasPhotos = menuImages.length > 0;

    // --- Tab bar (always render both tabs) ---
    let tabItems = null, tabPhotos = null;
    let panelItems = null, panelPhotos = null;
    const tabSlider = document.createElement('div');
    tabSlider.className = 'full-menu-tab-slider';
    tabSlider.classList.add('has-two-panels');

    const tabBar = document.createElement('div');
    tabBar.className = 'full-menu-tabs';

    tabItems = document.createElement('button');
    tabItems.className = 'full-menu-tab';
    tabItems.innerHTML = `<i class="fas fa-list"></i> Menu Items <span class="full-menu-tab-count">${items.length}</span>`;

    tabPhotos = document.createElement('button');
    tabPhotos.className = 'full-menu-tab';
    tabPhotos.innerHTML = `<i class="fas fa-camera"></i> Menu Photos <span class="full-menu-tab-count">${menuImages.length}</span>`;

    const indicator = document.createElement('div');
    indicator.className = 'full-menu-tab-indicator';

    tabBar.appendChild(tabItems);
    tabBar.appendChild(tabPhotos);
    tabBar.appendChild(indicator);
    modal.appendChild(tabBar);

    // ---- PANEL 1: ITEM LIST ----
    panelItems = document.createElement('div');
    panelItems.className = 'full-menu-panel full-menu-panel-items';
    const list = document.createElement('div');
    list.className = 'full-menu-modal-list';

    if (hasItems) {
        const categoryOrder = [];
        const grouped = {};
        items.forEach(item => {
            const cat = item.category || '';
            if (!grouped[cat]) {
                grouped[cat] = [];
                categoryOrder.push(cat);
            }
            grouped[cat].push(item);
        });

        categoryOrder.forEach(cat => {
            if (cat) {
                const catHeader = document.createElement('div');
                catHeader.className = 'full-menu-modal-category-header';
                catHeader.innerHTML = `<i class="fas fa-tag"></i> ${escapeHtml(cat)}`;
                list.appendChild(catHeader);
            }
            grouped[cat].forEach(item => {
                const row = document.createElement('div');
                row.className = 'full-menu-modal-item' + (cat ? ' has-category' : '');
                row.innerHTML = `<span class="full-menu-modal-item-name">${escapeHtml(item.name || '')}</span><span class="full-menu-modal-item-dots"></span><span class="full-menu-modal-item-price">${item.price ? '₱' + escapeHtml(item.price) : ''}</span>`;
                list.appendChild(row);
            });
        });
    } else {
        const empty = document.createElement('div');
        empty.className = 'full-menu-empty';
        empty.style.padding = '28px 22px';
        empty.style.color = '#8b7e73';
        empty.style.fontWeight = '600';
        empty.textContent = 'No menu items yet.';
        list.appendChild(empty);
    }
    panelItems.appendChild(list);
    tabSlider.appendChild(panelItems);

    // ---- PANEL 2: PHOTO GRID ----
    panelPhotos = document.createElement('div');
    panelPhotos.className = 'full-menu-panel full-menu-panel-photos';
    const grid = document.createElement('div');
    grid.className = 'full-menu-photo-grid';

    if (hasPhotos) {
        menuImages.forEach(function(src, i) {
            const thumb = document.createElement('div');
            thumb.className = 'full-menu-photo-thumb';
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Menu photo ' + (i + 1);
            img.loading = 'lazy';
            thumb.appendChild(img);
            thumb.addEventListener('click', function() {
                openFullMenuLightbox(menuImages, i);
            });
            grid.appendChild(thumb);
        });
    } else {
        const empty = document.createElement('div');
        empty.className = 'full-menu-empty';
        empty.innerHTML = `<i class="fas ${headerIconClass} full-menu-empty-icon" aria-hidden="true"></i><span>No menu photos yet.</span>`;
        grid.appendChild(empty);
    }

    panelPhotos.appendChild(grid);
    tabSlider.appendChild(panelPhotos);

    // Attach tab slider
    modal.appendChild(tabSlider);

    // --- Tab switching logic ---
    // Determine initial active tab: prefer items if available, otherwise photos
    const startOnPhotos = hasPhotos && !hasItems;
    if (startOnPhotos) {
        tabPhotos.classList.add('active');
        panelPhotos.classList.add('active');
        tabSlider.style.transform = 'translateX(-50%)';
    } else {
        tabItems.classList.add('active');
        panelItems.classList.add('active');
        tabSlider.style.transform = 'translateX(0)';
    }

    tabItems.addEventListener('click', function() {
        tabItems.classList.add('active');
        tabPhotos.classList.remove('active');
        panelItems.classList.add('active');
        panelPhotos.classList.remove('active');
        tabSlider.style.transform = 'translateX(0)';
    });
    tabPhotos.addEventListener('click', function() {
        tabPhotos.classList.add('active');
        tabItems.classList.remove('active');
        panelPhotos.classList.add('active');
        panelItems.classList.remove('active');
        tabSlider.style.transform = 'translateX(-50%)';
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// --- Full Menu Lightbox (full-screen image viewer) ---
window.openFullMenuLightbox = function(images, startIndex) {
    let existing = document.querySelector('.full-menu-lightbox-overlay');
    if (existing) existing.remove();

    let idx = startIndex || 0;

    const overlay = document.createElement('div');
    overlay.className = 'full-menu-lightbox-overlay';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    const wrap = document.createElement('div');
    wrap.className = 'full-menu-lightbox-wrap';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'full-menu-lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() { overlay.remove(); });

    const img = document.createElement('img');
    img.className = 'full-menu-lightbox-img';
    img.src = images[idx];
    img.alt = 'Menu photo';

    const counter = document.createElement('div');
    counter.className = 'full-menu-lightbox-counter';
    counter.textContent = `${idx + 1} / ${images.length}`;

    function showSlide(i) {
        if (i < 0) i = images.length - 1;
        if (i >= images.length) i = 0;
        idx = i;
        img.src = images[idx];
        counter.textContent = `${idx + 1} / ${images.length}`;
    }

    wrap.appendChild(closeBtn);
    wrap.appendChild(img);

    if (images.length > 1) {
        const prev = document.createElement('button');
        prev.className = 'full-menu-lightbox-nav prev';
        prev.innerHTML = '&#9664;';
        prev.addEventListener('click', function(e) { e.stopPropagation(); showSlide(idx - 1); });

        const next = document.createElement('button');
        next.className = 'full-menu-lightbox-nav next';
        next.innerHTML = '&#9654;';
        next.addEventListener('click', function(e) { e.stopPropagation(); showSlide(idx + 1); });

        wrap.appendChild(prev);
        wrap.appendChild(next);
        wrap.appendChild(counter);
    }

    overlay.appendChild(wrap);
    document.body.appendChild(overlay);

    // Keyboard navigation
    function onKey(e) {
        if (!document.body.contains(overlay)) { document.removeEventListener('keydown', onKey); return; }
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); }
        if (e.key === 'ArrowLeft') showSlide(idx - 1);
        if (e.key === 'ArrowRight') showSlide(idx + 1);
    }
    document.addEventListener('keydown', onKey);
};

// --- Menu images carousel / lightbox helpers ---
window.openMenuCarouselFromBtn = function(btn) {
    try {
        const encoded = btn.getAttribute('data-menu-images') || '';
        const json = encoded ? decodeURIComponent(encoded) : '[]';
        const images = JSON.parse(json);
        if (!Array.isArray(images) || images.length === 0) return;
        openMenuCarousel(images);
    } catch (e) { console.error('Failed to open menu carousel', e); }
}

function openMenuCarousel(images, startIndex = 0) {
    // Remove existing overlay if any
    let overlay = document.querySelector('.menu-carousel-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'menu-carousel-overlay';

    const carousel = document.createElement('div');
    carousel.className = 'menu-carousel';

    const slide = document.createElement('div');
    slide.className = 'slide';

    const img = document.createElement('img');
    img.src = images[startIndex];
    slide.appendChild(img);
    carousel.appendChild(slide);

    // Counter
    const counter = document.createElement('div');
    counter.className = 'carousel-counter';
    counter.textContent = `${startIndex + 1}/${images.length}`;
    carousel.appendChild(counter);

    // Prev/Next
    const prev = document.createElement('button'); prev.className = 'nav-btn prev-btn'; prev.innerHTML = '&#9664;';
    const next = document.createElement('button'); next.className = 'nav-btn next-btn'; next.innerHTML = '&#9654;';
    carousel.appendChild(prev); carousel.appendChild(next);

    // Close
    const closeBtn = document.createElement('button'); closeBtn.className = 'close-btn'; closeBtn.innerHTML = '&times;';
    carousel.appendChild(closeBtn);

    overlay.appendChild(carousel);
    document.body.appendChild(overlay);

    let idx = startIndex;

    function show(i) {
        if (i < 0) i = images.length - 1;
        if (i >= images.length) i = 0;
        idx = i;
        // update image and counter
        img.src = images[idx];
        if (counter) counter.textContent = `${idx + 1}/${images.length}`;
    }

    prev.addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
    next.addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// Initialize Category Chips (Google Maps Style)
function initializeCategoryLegend() {
    const chipsContainer = document.getElementById('categoryChipsContainer');
    if (!chipsContainer) return;
    
    const chipsScroll = chipsContainer.querySelector('.category-chips-scroll');
    const chips = chipsContainer.querySelectorAll('.category-chip');
    let activeCategory = null;

    const syncAllChipLock = () => {
        const allChip = chipsContainer.querySelector('.category-chip[data-category="all"]');
        if (!allChip) return;
        const isAllActive = activeCategory === 'all';
        allChip.classList.toggle('locked', isAllActive);
        allChip.setAttribute('aria-disabled', isAllActive ? 'true' : 'false');
    };
    
    // Check if chips fit and center them if they do
    function updateChipsAlignment() {
        if (!chipsScroll) return;
        const containerWidth = chipsContainer.clientWidth;
        const scrollWidth = chipsScroll.scrollWidth;
        
        if (scrollWidth <= containerWidth) {
            // All chips fit - center them
            chipsContainer.classList.add('chips-centered');
        } else {
            // Chips overflow - left align
            chipsContainer.classList.remove('chips-centered');
        }
    }
    
    // Run on load and resize
    updateChipsAlignment();
    window.addEventListener('resize', updateChipsAlignment);

    // Set "All" as the default active chip
    const allChipDefault = chipsContainer.querySelector('.category-chip[data-category="all"]');
    if (allChipDefault) {
        allChipDefault.classList.add('active');
        activeCategory = 'all';
        syncAllChipLock();
    }

    chips.forEach(chip => {
        chip.addEventListener('click', function() {
            const category = this.dataset.category;

            // Keep the "All" chip non-clickable while already in All state.
            if (category === 'all' && activeCategory === 'all') {
                return;
            }

            // Clear any active route when the user switches category
            if (typeof routeLine !== 'undefined' && routeLine && typeof clearRoute === 'function') {
                clearRoute();
            }
            
            // If clicking an already-active non-All chip, switch back to All.
            if (category === activeCategory) {
                chips.forEach(c => c.classList.remove('active'));
                activeCategory = 'all';
                const allChip = chipsContainer.querySelector('.category-chip[data-category="all"]');
                if (allChip) allChip.classList.add('active');
                syncAllChipLock();
                filterRestaurantsByCategory(null);
                return;
            }
            
            // Remove active from all chips
            chips.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked chip
            this.classList.add('active');
            
            // Filter restaurants
            if (category === 'all') {
                activeCategory = 'all';
                syncAllChipLock();
                filterRestaurantsByCategory(null);
            } else {
                activeCategory = category;
                syncAllChipLock();
                filterRestaurantsByCategory(category);
            }
        });
    });
}

function getActiveCategoryFilter() {
    const activeChip = document.querySelector('#categoryChipsContainer .category-chip.active[data-category]');
    if (!activeChip) return null;
    const activeCategory = (activeChip.dataset.category || '').trim();
    return activeCategory && activeCategory !== 'all' ? activeCategory : null;
}

function applyLegendCategoryFilter(category) {
    const normalized = (category || '').trim();
    if (!normalized) return;
    const chips = document.querySelectorAll('#categoryChipsContainer .category-chip[data-category]');
    const targetChip = Array.from(chips).find(chip => (chip.dataset.category || '').trim() === normalized);
    if (!targetChip || targetChip.hidden || targetChip.style.display === 'none') return;
    targetChip.click();
}

// Hide category chips that have no restaurants
function updateCategoryChipsVisibility(restaurantsList) {
    const chipsContainer = document.getElementById('categoryChipsContainer');
    if (!chipsContainer) return;

    const chipsScroll = chipsContainer.querySelector('.category-chips-scroll');
    const chips = chipsContainer.querySelectorAll('.category-chip');
    const availableCategories = new Set(
        (restaurantsList || [])
            .map(r => (r.category || '').trim())
            .filter(Boolean)
    );

    chips.forEach(chip => {
        const category = chip.dataset.category;
        if (category === 'all') {
            chip.style.display = '';
            chip.hidden = false;
            return;
        }
        if (availableCategories.has(category)) {
            chip.style.display = '';
            chip.hidden = false;
        } else {
            chip.style.display = 'none';
            chip.hidden = true;
        }
    });

    const activeChip = chipsContainer.querySelector('.category-chip.active');
    if (activeChip && activeChip.dataset.category !== 'all' && !availableCategories.has(activeChip.dataset.category)) {
        chips.forEach(c => c.classList.remove('active'));
        const allChip = chipsContainer.querySelector('.category-chip[data-category="all"]');
        if (allChip) {
            allChip.classList.add('active');
            allChip.classList.add('locked');
            allChip.setAttribute('aria-disabled', 'true');
            filterRestaurantsByCategory(null);
        }
    } else {
        const allChip = chipsContainer.querySelector('.category-chip[data-category="all"]');
        if (allChip) {
            const isAllActive = allChip.classList.contains('active');
            allChip.classList.toggle('locked', isAllActive);
            allChip.setAttribute('aria-disabled', isAllActive ? 'true' : 'false');
        }
    }

    if (chipsScroll) {
        const containerWidth = chipsContainer.clientWidth;
        const scrollWidth = chipsScroll.scrollWidth;
        if (scrollWidth <= containerWidth) {
            chipsContainer.classList.add('chips-centered');
        } else {
            chipsContainer.classList.remove('chips-centered');
        }
    }
}

// Filter restaurants by category
function filterRestaurantsByCategory(category) {
    if (!category) {
        // Show all restaurants — force overlap so every pin is visible
        addMarkersToMap(restaurants, true);
        displayRestaurants(restaurants);
        // Fit map to show all markers when clearing filter
        try {
            const latlngsAll = restaurants.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            if (latlngsAll.length === 1) {
                map.setView(latlngsAll[0], Math.max(map.getZoom(), 13), { animate: true });
                // If there's only one restaurant shown, open its popup and center precisely
                try {
                    const singleId = restaurants[0] && restaurants[0].id;
                    const m = markers.find(mm => mm.restaurantId === singleId);
                    if (m) {
                        m.openPopup();
                        setTimeout(() => centerOnPopup(m), 50);
                    }
                } catch (e) { /* ignore */ }
            } else if (latlngsAll.length > 1) {
                const boundsAll = getBoundsFromLatLngs(latlngsAll);
                map.fitBounds(boundsAll, { padding: 48, duration: 600 });
            }
        } catch (e) {
            console.warn('Failed to fit map bounds when showing all restaurants:', e);
        }
    } else {
        // Filter restaurants by category
        const filtered = restaurants.filter(r => {
            // Normalize category names for comparison
            const restaurantCategory = (r.category || '').trim();
            return restaurantCategory === category;
        });
        
        // Update map markers — force overlap so every filtered pin is visible
        addMarkersToMap(filtered, true);
        // Re-center map to show all filtered markers
        try {
            const latlngs = filtered.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
            if (latlngs.length === 1) {
                // Single marker: pan and zoom in a bit
                map.setView(latlngs[0], Math.max(map.getZoom(), 14), { animate: true });
                // Open popup for the single marker and center it
                try {
                    const singleId = filtered[0] && filtered[0].id;
                    const m = markers.find(mm => mm.restaurantId === singleId);
                    if (m) {
                        m.openPopup();
                        setTimeout(() => centerOnPopup(m), 50);
                    }
                } catch (e) { /* ignore */ }
            } else if (latlngs.length > 1) {
                const bounds = getBoundsFromLatLngs(latlngs);
                // add a small padding so markers aren't at the very edge
                map.fitBounds(bounds, { padding: 64, duration: 600 });
            }
        } catch (e) {
            console.warn('Failed to fit map bounds after filtering:', e);
        }
        
        // Update sidebar lists
        displayRestaurants(filtered);
        
        // Only show notification if no results found (less annoying)
        if (filtered.length === 0) {
            notify.info(`No restaurants found in category: ${category}`);
        }
    }
}

// ============================================================================
// BUSINESS HOURS FUNCTIONS
// ============================================================================

// Parse hours from JSON string to object
function parseBusinessHours(hoursString) {
    if (!hoursString) return null;
    try {
        const hours = JSON.parse(hoursString);
        return hours;
    } catch (e) {
        // If not JSON, return null (legacy format)
        return null;
    }
}

// Check if restaurant is currently open
function isRestaurantOpen(hoursString) {
    const hours = parseBusinessHours(hoursString);
    if (!hours) return { isOpen: null, message: 'Hours not available' };
    
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    const todayHours = hours[currentDay];
    if (!todayHours || todayHours.closed) {
        return { isOpen: false, message: 'Closed today' };
    }
    
    // Parse open and close times
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    // Handle overnight hours (e.g., open until 2 AM)
    if (closeTime < openTime) {
        // If current time is after opening or before closing (past midnight)
        if (currentTime >= openTime || currentTime < closeTime) {
            return { isOpen: true, message: 'Open' };
        }
    } else {
        // Normal hours within same day
        if (currentTime >= openTime && currentTime < closeTime) {
            return { isOpen: true, message: 'Open' };
        }
    }

    return { isOpen: false, message: 'Closed' };
}

// Format time from 24h to 12h format
function formatTime(time24) {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Format business hours for display
function formatBusinessHoursFull(hoursString) {
    const hours = parseBusinessHours(hoursString);
    if (!hours) return hoursString || 'Not specified'; // fallback to legacy format
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let html = '<div style="display: flex; flex-direction: column; gap: 0.4rem;">';
    
    dayNames.forEach(day => {
        const dayHours = hours[day];
        if (dayHours && !dayHours.closed) {
            html += `<div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: #666;">${day}:</span>
                <span>${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}</span>
            </div>`;
        } else {
            html += `<div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: #666;">${day}:</span>
                <span style="color: #999;">Closed</span>
            </div>`;
        }
    });
    
    html += '</div>';
    return html;
}

function formatBusinessHoursSummary(hoursString) {
    const hours = parseBusinessHours(hoursString);
    if (!hours) return hoursString || 'Not specified';

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayIndex = (new Date().getDay() + 6) % 7;
    const todayName = dayNames[todayIndex];
    let displayDay = todayName;
    let dayHours = hours[todayName];

    if (!dayHours) {
        const firstOpenDay = dayNames.find(day => hours[day] && !hours[day].closed && hours[day].open && hours[day].close);
        if (!firstOpenDay) {
            return 'Hours not available';
        }
        displayDay = firstOpenDay;
        dayHours = hours[firstOpenDay];
    }

    const hoursLabel = (dayHours.closed || !dayHours.open || !dayHours.close)
        ? 'Closed'
        : `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`;

    return `<div style="display: flex; align-items: center; gap: 0.6rem;">
        <span style="font-weight: 600; color: #666;">${displayDay}</span>
        <span>${hoursLabel}</span>
    </div>`;
}

function toggleBusinessHours(restaurantId) {
    const content = document.getElementById(`hoursContent-${restaurantId}`);
    const arrow = document.getElementById(`hoursArrow-${restaurantId}`);
    if (!content) return;

    const summary = decodeURIComponent(content.getAttribute('data-summary') || '');
    const full = decodeURIComponent(content.getAttribute('data-full') || '');
    const isShowingFull = content.getAttribute('data-showing') === 'full';

    content.innerHTML = isShowingFull ? summary : full;
    content.setAttribute('data-showing', isShowingFull ? 'summary' : 'full');
    
    // Rotate the arrow to indicate expanded/collapsed state
    if (arrow) {
        arrow.style.transform = isShowingFull ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}
