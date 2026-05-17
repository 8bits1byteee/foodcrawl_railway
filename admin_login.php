<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/auth.php';

// Check if already logged in
if (isLoggedIn()) {
    header('Location: admin.php');
    exit;
}

// Redirect to combined login page
header('Location: login.php?tab=admin');
exit;

$error = '';

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        if (login($username, $password)) {
            header('Location: admin.php');
            exit;
        } else {
            $error = 'Invalid username or password';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Estancia Food Crawl</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Minimal, site-consistent admin login styles
           These reuse global tokens from `css/style.css` so the login blends with the main site. */
        .auth-shell {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.25rem 0.9rem;
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

        .brand-hero { text-align: center; margin-bottom: 1.5rem; }
        .brand-icon {
            /* remove the circular background so the logo image is shown as-is */
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: inline-flex; align-items: center; justify-content: center;
            padding: 0;
            width: auto; height: auto;
        }
        .brand-icon .brand-logo {
            display: block;
            width: 112px; /* slightly larger per request */
            height: auto;
            object-fit: contain;
            max-width: 100%;
            max-height: 112px;
        }

        .auth-card h1 { text-align:center; margin:0 0 .35rem 0; font-size:1.65rem; font-weight:700; color:var(--ink,#222); }
        .auth-subtitle { text-align:center; color:var(--muted,#6b7280); margin-bottom:1.1rem; font-size:0.97rem }

        .form-group { margin-bottom:1rem }
        .form-group label { display:block; margin-bottom:.45rem; font-weight:600; color:var(--ink) }
        .system-form .input-icon-group { position:relative }
        .system-form .input-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:var(--muted); }
        .system-form input[type="text"], .system-form input[type="password"] {
            width:100%; padding:0.95rem 1rem 0.95rem 2.65rem; border:1px solid #e6e8ec; border-radius:12px; font-size:1rem; box-sizing:border-box;
        }

        .show-pass-btn { position:absolute; right:0.6rem; top:50%; transform:translateY(-50%); background:transparent; border:none; color:var(--muted); padding:0.35rem; }

        .remember-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem }

        .btn-primary { width:100%; padding:1rem 1.1rem; background:linear-gradient(135deg,var(--brand,#fd732b),var(--brand-2,#fd732b)); color:#fff; border:none; border-radius:12px; font-weight:700; box-shadow:var(--shadow-sm); }
        .btn-primary:hover, .btn-primary:focus { transform:translateY(-1px); box-shadow:var(--shadow-md) }

        .error-message { background:var(--brand,#fd732b); color:#fff; padding:.8rem 1rem; border-radius:8px; margin-bottom:1rem; display:flex; gap:.6rem; align-items:center }

        .back-link {
            margin-top: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            flex-wrap: wrap;
            text-align: center;
        }
        .back-link a {
            color: var(--brand);
            text-decoration: none;
            padding: .55rem .9rem;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
            border: 1px solid rgba(253, 115, 43, 0.16);
        }
        .back-link a:hover { background: rgba(253,115,43,0.06); }

        .demo-credentials { background:#fbfbfc; padding:1rem; border-radius:10px; font-size:.92rem; border-left:4px solid var(--brand); }

        @media (max-width: 600px) {
            .auth-shell { padding: 1rem 0.75rem; }
            .auth-card { padding: 1.35rem 1.15rem; max-width: 100%; box-shadow: 0 8px 22px rgba(0,0,0,0.06); }
            .auth-card h1 { font-size: 1.45rem; }
            .auth-subtitle { font-size: 0.93rem; }
            .system-form input[type="text"], .system-form input[type="password"] { font-size: 1rem; }
            .back-link { flex-direction: column; align-items: stretch; gap: 0.5rem; }
            .back-link a { width: 100%; justify-content: center; }
        }

        @media (max-width: 420px) {
            .auth-card { border-radius: 12px; }
            .brand-hero { margin-bottom: 1.1rem; }
            .brand-icon .brand-logo { width: 96px; }
            .form-group label { font-size: 0.95rem; }
            .btn-primary { padding: 0.95rem 1rem; font-size: 1.02rem; }
        }
    </style>
</head>
<body class="login-body">
    <div class="auth-shell">
        <div class="auth-card">
            <!-- Brand Hero Section -->
            <div class="brand-hero">
                <div class="brand-icon" aria-hidden="true">
                    <img src="Your paragraph text (1)2.png" alt="Estancia Food Crawl" class="brand-logo">
                </div>
                <h1>Admin Login</h1>
                <p class="auth-subtitle">Estancia Food Crawl Management</p>
            </div>

            <!-- Error Message with ARIA Live Region -->
            <div id="error-region" aria-live="polite" aria-atomic="true">
                <?php if ($error): ?>
                    <div class="error-message" role="alert">
                        <i class="fas fa-exclamation-circle"></i> 
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- Login Form -->
            <form method="POST" action="" class="system-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <div class="input-icon-group">
                        <span class="input-icon"><i class="fas fa-user"></i></span>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            required 
                            autocomplete="username"
                            value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                            placeholder="Enter your username"
                            aria-describedby="username-help"
                        >
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="input-icon-group">
                        <span class="input-icon"><i class="fas fa-lock"></i></span>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required 
                            autocomplete="current-password"
                            placeholder="Enter your password"
                            aria-describedby="password-help"
                        >
                        <button type="button" class="show-pass-btn" aria-label="Show password" title="Show password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <!-- removed 'Remember me' and 'Forgot?' per request -->

                <button type="submit" class="btn-primary">
                    <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                    <span>Login to Dashboard</span>
                </button>
            </form>
            
            <!-- Back Link -->
            <div class="back-link">
                <a href="index.php">
                    <i class="fas fa-arrow-left"></i> 
                    <span>Back to main site</span>
                </a>
                <a href="owner_login.php">
                    <i class="fas fa-store"></i>
                    <span>Restaurant Owner Login</span>
                </a>
            </div>
        </div>
    </div>

    <script>
        // Enhanced focus management for accessibility
        document.addEventListener('DOMContentLoaded', function() {
            const mainInput = document.getElementById('username');
            if (mainInput) {
                mainInput.focus();
            }

            // Add focus trapping for better keyboard navigation
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            focusableElements.forEach(element => {
                element.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && this.tagName !== 'BUTTON' && this.type !== 'submit') {
                        e.preventDefault();
                        this.click();
                    }
                });
            });

            // Auto-hide error message after 8 seconds if present
            const errorMessage = document.querySelector('.error-message');
            if (errorMessage) {
                setTimeout(() => {
                    errorMessage.style.opacity = '0';
                    errorMessage.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => errorMessage.remove(), 500);
                }, 8000);
            }

            // Show / hide password toggle
            const showBtn = document.querySelector('.show-pass-btn');
            const pwdInput = document.getElementById('password');
            if (showBtn && pwdInput) {
                showBtn.addEventListener('click', function() {
                    const isText = pwdInput.type === 'text';
                    pwdInput.type = isText ? 'password' : 'text';
                    const icon = showBtn.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                    showBtn.setAttribute('aria-pressed', String(!isText));
                });
            }
        });
    </script>
</body>
</html>