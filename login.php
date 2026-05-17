<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/auth.php';
require_once 'includes/owner_auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: admin.php');
    exit;
}
if (isOwnerLoggedIn()) {
    header('Location: owner.php');
    exit;
}

$error = '';
$activeTab = $_GET['tab'] ?? 'admin'; // 'admin' or 'owner'

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $loginType = $_POST['login_type'] ?? 'admin';
    $activeTab  = $loginType;

    if ($loginType === 'admin') {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        if (empty($username) || empty($password)) {
            $error = 'Please enter both username and password.';
        } elseif (login($username, $password)) {
            header('Location: admin.php');
            exit;
        } else {
            $error = 'Invalid username or password.';
        }
    } else {
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        if (empty($email) || empty($password)) {
            $error = 'Please enter your email/phone and password.';
        } elseif (ownerLogin($email, $password)) {
            header('Location: owner.php');
            exit;
        } else {
            $error = 'Invalid email or password.';
        }
    }
}

$isAdmin = ($activeTab === 'admin');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login – Estancia Food Crawl</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .auth-shell {
            min-height: 100vh;
            min-height: 100dvh; /* modern mobile: excludes browser chrome */
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.25rem 0.9rem;
            padding-top: max(1.25rem, env(safe-area-inset-top));
            padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
            background: linear-gradient(180deg,#fafafb 0%, var(--bg, #f7f7fb) 100%);
        }

        .auth-card {
            background: var(--panel, #ffffff);
            border: 1px solid rgba(0,0,0,0.04);
            border-radius: 14px;
            padding: 1.9rem 1.55rem;
            box-shadow: var(--shadow-md, 0 12px 30px rgba(0,0,0,0.08));
            width: 100%;
            max-width: 440px;
        }

        /* Brand */
        .brand-hero { text-align: center; margin-bottom: 1.5rem; }
        .brand-icon {
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .brand-icon .brand-logo {
            display: block;
            width: 112px;
            height: auto;
            object-fit: contain;
            max-width: 100%;
            max-height: 112px;
        }
        .brand-hero h1 {
            margin: 0.6rem 0 0.25rem;
            font-size: 1.65rem;
            font-weight: 700;
            color: var(--ink, #222);
        }
        .auth-subtitle {
            text-align: center;
            color: var(--muted, #6b7280);
            margin-bottom: 0;
            font-size: 0.97rem;
        }

        /* Tab switcher */
        .tab-switcher {
            display: flex;
            background: #f3f4f6;
            border-radius: 12px;
            padding: 4px;
            margin: 1.25rem 0 1.35rem;
            gap: 4px;
        }
        .tab-btn {
            flex: 1;
            padding: 0.65rem 0.75rem;
            border: none;
            background: transparent;
            border-radius: 9px;
            font-size: 0.93rem;
            font-weight: 600;
            color: var(--muted, #6b7280);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s;
            white-space: nowrap;
        }
        .tab-btn.active {
            background: #fff;
            color: var(--brand, #fd732b);
            box-shadow: 0 1px 6px rgba(0,0,0,0.10);
        }
        .tab-btn:not(.active):hover {
            background: rgba(255,255,255,0.6);
            color: var(--ink, #333);
        }

        /* Form panel */
        .form-panel { display: none; }
        .form-panel.active { display: block; }

        /* Form elements */
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: .45rem; font-weight: 600; color: var(--ink, #222); }
        .system-form .input-icon-group { position: relative; }
        .system-form .input-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--muted, #6b7280);
            pointer-events: none;
        }
        .system-form input[type="text"],
        .system-form input[type="email"],
        .system-form input[type="password"] {
            width: 100%;
            padding: 0.95rem 2.8rem 0.95rem 3.1rem; /* right space for eye btn, left space after icon */
            border: 1px solid #e6e8ec;
            border-radius: 12px;
            font-size: 1rem;
            box-sizing: border-box;
            transition: border-color 0.15s;
            -webkit-appearance: none; /* removes iOS inner shadow */
            appearance: none;
        }
        .system-form input:focus {
            outline: none;
            border-color: var(--brand, #fd732b);
            box-shadow: 0 0 0 3px rgba(253,115,43,0.12);
        }
        .show-pass-btn {
            position: absolute;
            right: 0.6rem;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: var(--muted, #6b7280);
            cursor: pointer;
            padding: 0.35rem;
        }

        .btn-primary {
            width: 100%;
            padding: 1rem 1.1rem;
            background: linear-gradient(135deg, var(--brand,#fd732b), #e85e1b);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(253,115,43,0.25));
            transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover, .btn-primary:focus {
            transform: translateY(-1px);
            box-shadow: var(--shadow-md, 0 4px 16px rgba(253,115,43,0.3));
        }

        .error-message {
            background: var(--brand, #fd732b);
            color: #fff;
            padding: .8rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            gap: .6rem;
            align-items: center;
        }

        /* Back link */
        .back-link {
            margin-top: 1.1rem;
            text-align: center;
        }
        .back-link a {
            color: var(--brand, #fd732b);
            text-decoration: none;
            padding: .55rem .9rem;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.94rem;
            border: 1px solid rgba(253, 115, 43, 0.18);
        }
        .back-link a:hover { background: rgba(253,115,43,0.06); }

        /* ── Responsive ──────────────────────────────── */

        /* Tablet / large phone */
        @media (max-width: 600px) {
            .auth-shell {
                align-items: flex-start; /* allow card to sit near top, not clip */
                padding: 1.5rem 1rem;
                padding-top: max(1.5rem, env(safe-area-inset-top));
                padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
            }
            .auth-card {
                padding: 1.5rem 1.25rem;
                box-shadow: 0 8px 22px rgba(0,0,0,0.06);
                border-radius: 16px;
            }
            .brand-hero { margin-bottom: 1.15rem; }
            .brand-hero h1 { font-size: 1.4rem; }
            .tab-switcher { margin: 1rem 0 1.15rem; }
            .tab-btn { font-size: 0.87rem; padding: 0.6rem 0.5rem; gap: 0.35rem; }
        }

        /* Small phone */
        @media (max-width: 420px) {
            .auth-shell { padding: 1rem 0.65rem; }
            .auth-card {
                padding: 1.25rem 1rem;
                border-radius: 14px;
            }
            .brand-icon .brand-logo { width: 88px; }
            .brand-hero h1 { font-size: 1.25rem; }
            .auth-subtitle { font-size: 0.88rem; }

            /* Prevent iOS from zooming on input focus – must be 16px */
            .system-form input[type="text"],
            .system-form input[type="email"],
            .system-form input[type="password"] {
                font-size: 16px;
                padding: 0.9rem 2.6rem 0.9rem 3rem;
            }

            /* Larger touch targets */
            .btn-primary { padding: 1rem; font-size: 0.97rem; min-height: 48px; }
            .show-pass-btn { padding: 0.55rem; min-width: 36px; min-height: 36px; }
            .tab-btn { min-height: 42px; }
            .back-link a { padding: 0.7rem 1rem; font-size: 0.9rem; }
        }

        /* Very small phone (≤ 360px) – hide tab label text, show icon only */
        @media (max-width: 360px) {
            .tab-btn .tab-label { display: none; }
            .tab-btn { font-size: 0.82rem; padding: 0.6rem 0.4rem; gap: 0; }
            .auth-card { padding: 1.1rem 0.85rem; }
        }
    </style>
</head>
<body class="login-body">
    <div class="auth-shell">
        <div class="auth-card">

            <!-- Brand -->
            <div class="brand-hero">
                <div class="brand-icon" aria-hidden="true">
                    <img src="Your%20paragraph%20text%20(1)2.webp" alt="Estancia Food Crawl" class="brand-logo">
                </div>
                <h1>Login</h1>
                <p class="auth-subtitle">Estancia Food Crawl</p>
            </div>

            <!-- Tab switcher -->
            <div class="tab-switcher" role="tablist" aria-label="Login type">
                <button
                    class="tab-btn <?= $isAdmin ? 'active' : '' ?>"
                    role="tab"
                    aria-selected="<?= $isAdmin ? 'true' : 'false' ?>"
                    aria-controls="panel-admin"
                    id="tab-admin"
                    type="button"
                >
                    <i class="fas fa-user-shield" aria-hidden="true"></i><span class="tab-label"> Admin</span>
                </button>
                <button
                    class="tab-btn <?= !$isAdmin ? 'active' : '' ?>"
                    role="tab"
                    aria-selected="<?= !$isAdmin ? 'true' : 'false' ?>"
                    aria-controls="panel-owner"
                    id="tab-owner"
                    type="button"
                >
                    <i class="fas fa-store" aria-hidden="true"></i><span class="tab-label"> Restaurant Owner</span>
                </button>
            </div>

            <!-- Error -->
            <div aria-live="polite" aria-atomic="true">
                <?php if ($error): ?>
                    <div class="error-message" role="alert" id="error-msg">
                        <i class="fas fa-exclamation-circle"></i>
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Admin panel -->
            <div class="form-panel <?= $isAdmin ? 'active' : '' ?>" id="panel-admin" role="tabpanel" aria-labelledby="tab-admin">
                <form method="POST" action="?tab=admin" class="system-form">
                    <input type="hidden" name="login_type" value="admin">

                    <div class="form-group">
                        <label for="admin-username">Username</label>
                        <div class="input-icon-group">
                            <span class="input-icon"><i class="fas fa-user"></i></span>
                            <input
                                type="text"
                                id="admin-username"
                                name="username"
                                required
                                autocomplete="username"
                                value="<?php echo htmlspecialchars($isAdmin ? ($_POST['username'] ?? '') : ''); ?>"
                                placeholder="Enter your username"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="admin-password">Password</label>
                        <div class="input-icon-group">
                            <span class="input-icon"><i class="fas fa-lock"></i></span>
                            <input
                                type="password"
                                id="admin-password"
                                name="password"
                                required
                                autocomplete="current-password"
                                placeholder="Enter your password"
                            >
                            <button type="button" class="show-pass-btn" aria-label="Show password" data-target="admin-password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary">
                        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                        <span>Login to Admin Dashboard</span>
                    </button>
                </form>
            </div>

            <!-- Owner panel -->
            <div class="form-panel <?= !$isAdmin ? 'active' : '' ?>" id="panel-owner" role="tabpanel" aria-labelledby="tab-owner">
                <form method="POST" action="?tab=owner" class="system-form">
                    <input type="hidden" name="login_type" value="owner">

                    <div class="form-group">
                        <label for="owner-email">Email or Phone Number</label>
                        <div class="input-icon-group">
                            <span class="input-icon"><i class="fas fa-envelope"></i></span>
                            <input
                                type="text"
                                id="owner-email"
                                name="email"
                                required
                                autocomplete="username"
                                value="<?php echo htmlspecialchars(!$isAdmin ? ($_POST['email'] ?? '') : ''); ?>"
                                placeholder="Enter your email or phone"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="owner-password">Password</label>
                        <div class="input-icon-group">
                            <span class="input-icon"><i class="fas fa-lock"></i></span>
                            <input
                                type="password"
                                id="owner-password"
                                name="password"
                                required
                                autocomplete="current-password"
                                placeholder="Enter your password"
                            >
                            <button type="button" class="show-pass-btn" aria-label="Show password" data-target="owner-password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary">
                        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                        <span>Login to Owner Dashboard</span>
                    </button>
                </form>
            </div>

            <!-- Back to site -->
            <div class="back-link">
                <a href="index.php">
                    <i class="fas fa-arrow-left"></i>
                    <span>Back to main site</span>
                </a>
            </div>

        </div><!-- /.auth-card -->
    </div><!-- /.auth-shell -->

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const tabs    = document.querySelectorAll('.tab-btn');
            const panels  = document.querySelectorAll('.form-panel');

            // Tab switching
            tabs.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    tabs.forEach(function (t) {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    panels.forEach(function (p) { p.classList.remove('active'); });

                    btn.classList.add('active');
                    btn.setAttribute('aria-selected', 'true');
                    const target = document.getElementById(btn.getAttribute('aria-controls'));
                    if (target) {
                        target.classList.add('active');
                        const firstInput = target.querySelector('input');
                        if (firstInput) firstInput.focus();
                    }

                    // Clear error when switching tabs
                    const errEl = document.getElementById('error-msg');
                    if (errEl) errEl.remove();
                });
            });

            // Show/hide password toggles
            document.querySelectorAll('.show-pass-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const targetId  = btn.getAttribute('data-target');
                    const pwdInput  = document.getElementById(targetId);
                    if (!pwdInput) return;
                    const isText = pwdInput.type === 'text';
                    pwdInput.type  = isText ? 'password' : 'text';
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye',       isText);
                        icon.classList.toggle('fa-eye-slash', !isText);
                    }
                });
            });

            // Auto-focus first input of active panel
            const activePanel = document.querySelector('.form-panel.active');
            if (activePanel) {
                const first = activePanel.querySelector('input');
                if (first) first.focus();
            }

            // Auto-dismiss error after 8 s
            const errEl = document.getElementById('error-msg');
            if (errEl) {
                setTimeout(function () {
                    errEl.style.transition = 'opacity 0.5s';
                    errEl.style.opacity    = '0';
                    setTimeout(function () { errEl.remove(); }, 500);
                }, 8000);
            }
        });
    </script>
</body>
</html>
