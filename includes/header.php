<?php
$siteLogo = 'Your%20paragraph%20text%20(1)2.webp';
?>
<?php if (empty($isAdmin)): ?>
<header class="header" role="banner" aria-label="Site header">
  <div class="header-inner">
    <div class="brand">
      <img src="<?php echo $siteLogo; ?>" alt="Food Crawl" class="top-logo" onerror="this.style.display='none'" />
      <div class="header-divider"></div>
      <div class="header-copy">
        <span class="header-estancia">Discover the Local</span>
        <span class="header-estancia">Restaurants in Estancia, Iloilo</span>
      </div>
    </div>
    <button id="mapSearchBtn" class="map-search-btn" aria-label="Open search" title="Search"
      onclick="(function(){var t=document.getElementById('sidebarToggle'); if(t){t.click();} else {document.body.classList.add('sidebar-open'); var o=document.getElementById('sidebarOverlay'); if(o) o.hidden=false;}})();">
      <i class="fas fa-search" aria-hidden="true"></i>
      <span class="map-search-label">Search</span>
    </button>
  </div>
  <div class="header-accent"></div>
</header>
<?php else: ?>
<?php
// show admin header with username when available
$adminName = isset($_SESSION['admin_username']) ? htmlspecialchars($_SESSION['admin_username']) : 'admin';
?>
<nav class="admin-header" role="banner" aria-label="Admin header">
  <button type="button" class="admin-mobile-menu" id="adminMobileMenuBtn" aria-label="Open navigation" aria-expanded="false">
    <i class="fas fa-bars" aria-hidden="true"></i>
  </button>
  <div class="admin-title"><i class="fas fa-cog" aria-hidden="true"></i> <span>Admin Panel</span></div>
  <div class="admin-actions" role="navigation" aria-label="Admin actions">
    <a class="admin-btn" href="index.php" target="_blank" rel="noopener" aria-label="View site"><i class="fas fa-home" aria-hidden="true"></i> <span>View Site</span></a>
    <a class="admin-btn" href="admin.php?logout=1" aria-label="Logout"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> <span>Logout</span></a>
  </div>
</nav>
<?php endif; ?>
