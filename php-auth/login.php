<?php
// Initialize session secure flags via middleware
require_once 'auth_middleware.php';

// If user is already logged in, redirect them directly to their dashboard
if (isset($_SESSION['user']) && isset($_SESSION['user']['role'])) {
    $role = $_SESSION['user']['role'];
    if ($role === 'admin') {
        header("Location: admin/dashboard.php");
        exit;
    } else {
        header("Location: intern/dashboard.php");
        exit;
    }
}

// Check for timeouts or errors passed via URL
$infoMessage = '';
$infoType = '';

if (isset($_GET['timeout'])) {
    $infoMessage = 'Your session has expired due to inactivity. Please sign in again.';
    $infoType = 'warning';
} elseif (isset($_GET['error'])) {
    if ($_GET['error'] === 'unauthorized') {
        $infoMessage = 'You are not authorized to view that page. Please sign in with the correct account.';
        $infoType = 'error';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NexTrack - Login</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --primary-light: #e0e7ff;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-500: #64748b;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --red-50: #fef2f2;
            --red-100: #fee2e2;
            --red-600: #dc2626;
            --green-50: #f0fdf4;
            --green-100: #dcfce7;
            --green-600: #16a34a;
            --yellow-50: #fefce8;
            --yellow-100: #fef9c3;
            --yellow-800: #854d0e;
            --radius-xl: 1rem;
            --radius-2xl: 1.5rem;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--slate-900);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 1) 0%, rgba(9, 15, 29, 1) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: var(--slate-100);
            overflow-x: hidden;
        }

        .login-container {
            width: 100%;
            max-width: 440px;
            perspective: 1000px;
        }

        .login-card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-2xl);
            padding: 40px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transform: translateY(0);
            animation: cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cardEntrance {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .brand-section {
            text-align: center;
            margin-bottom: 32px;
        }

        .brand-logo-container {
            width: 72px;
            height: 72px;
            margin: 0 auto 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-xl);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 2px 4px 0 rgba(255, 255, 255, 0.05);
            transition: var(--transition);
        }

        .brand-logo-container img {
            width: 80%;
            height: 80%;
            object-fit: contain;
            border-radius: 8px;
        }

        .brand-logo-container svg {
            width: 60%;
            height: 60%;
            color: var(--primary);
        }

        .brand-logo-container:hover {
            transform: scale(1.05) rotate(3deg);
            border-color: rgba(79, 70, 229, 0.4);
            box-shadow: 0 0 15px rgba(79, 70, 229, 0.2);
        }

        h1 {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--slate-500);
            font-weight: 500;
        }

        /* Form elements */
        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        .label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        label {
            font-size: 13px;
            font-weight: 600;
            color: var(--slate-300);
            display: block;
        }

        .forgot-link {
            font-size: 12px;
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            transition: var(--transition);
        }

        .forgot-link:hover {
            color: #6366f1;
            text-decoration: underline;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-icon {
            position: absolute;
            left: 14px;
            color: var(--slate-500);
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 13px 44px 13px 42px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-xl);
            color: #ffffff;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            outline: none;
            transition: var(--transition);
            box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }

        input[type="email"]::placeholder,
        input[type="password"]::placeholder {
            color: rgba(100, 116, 139, 0.8);
        }

        input[type="email"]:focus,
        input[type="password"]:focus {
            border-color: var(--primary);
            background: rgba(15, 23, 42, 0.8);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }

        input[type="email"]:focus + .input-icon,
        input[type="password"]:focus + .input-icon {
            color: var(--primary);
        }

        .toggle-password {
            position: absolute;
            right: 14px;
            background: none;
            border: none;
            color: var(--slate-500);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 4px;
            transition: var(--transition);
        }

        .toggle-password:hover {
            color: var(--slate-300);
        }

        /* Checkbox styling */
        .remember-container {
            display: flex;
            align-items: center;
            user-select: none;
            margin-bottom: 24px;
        }

        .checkbox-input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 13px;
            color: var(--slate-500);
            font-weight: 500;
            transition: var(--transition);
        }

        .custom-checkbox {
            height: 18px;
            width: 18px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
            flex-shrink: 0;
        }

        .checkbox-input:checked ~ .checkbox-label .custom-checkbox {
            background-color: var(--primary);
            border-color: var(--primary);
        }

        .checkbox-input:checked ~ .checkbox-label {
            color: var(--slate-200);
        }

        .custom-checkbox::after {
            content: "";
            display: none;
            width: 5px;
            height: 9px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg) translate(-0.5px, -1px);
        }

        .checkbox-input:checked ~ .checkbox-label .custom-checkbox::after {
            display: block;
        }

        .checkbox-input:focus ~ .checkbox-label .custom-checkbox {
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
            border-color: var(--primary);
        }

        /* Buttons & Animations */
        .submit-btn {
            width: 100%;
            background: var(--primary);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-xl);
            padding: 14px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .submit-btn:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3), 0 4px 6px -2px rgba(79, 70, 229, 0.2);
        }

        .submit-btn:active {
            transform: translateY(1px);
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        /* Spinner animation */
        .spinner {
            display: none;
            width: 18px;
            height: 18px;
            border: 2.5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #ffffff;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Alerts and notices */
        .alert-banner {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
            border-radius: var(--radius-xl);
            font-size: 13.5px;
            line-height: 1.4;
            margin-bottom: 24px;
            animation: alertSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(-10px);
        }

        @keyframes alertSlideIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .alert-banner.error {
            background-color: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(220, 38, 38, 0.2);
            color: #fca5a5;
        }

        .alert-banner.success {
            background-color: rgba(22, 163, 74, 0.1);
            border: 1px solid rgba(22, 163, 74, 0.2);
            color: #86efac;
        }

        .alert-banner.warning {
            background-color: rgba(234, 179, 8, 0.08);
            border: 1px solid rgba(234, 179, 8, 0.15);
            color: #fde047;
        }

        .alert-banner svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .alert-banner.error svg { color: var(--red-600); }
        .alert-banner.success svg { color: var(--green-600); }
        .alert-banner.warning svg { color: var(--yellow-800); }

        .footer-note {
            margin-top: 32px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 24px;
            font-size: 12px;
            color: var(--slate-500);
            line-height: 1.5;
        }

        /* Modal styling for Forgot Password */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: var(--transition);
        }

        .modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        .modal-card {
            background: var(--slate-800);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-2xl);
            padding: 32px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: scale(0.95);
            transition: var(--transition);
            text-align: center;
        }

        .modal-overlay.open .modal-card {
            transform: scale(1);
        }

        .modal-icon {
            width: 56px;
            height: 56px;
            background: rgba(79, 70, 229, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: var(--primary);
        }

        .modal-title {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 12px;
        }

        .modal-desc {
            font-size: 14px;
            color: var(--slate-300);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .modal-close-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #ffffff;
            padding: 10px 24px;
            border-radius: var(--radius-xl);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
        }

        .modal-close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>

    <div class="login-container">
        <div class="login-card">
            
            <div class="brand-section">
                <div class="brand-logo-container" id="logo-box">
                    <!-- Check logo.png or fall back to beautiful inline SVG -->
                    <?php if (file_exists('../public/logo.png')): ?>
                        <img src="../public/logo.png" alt="NexTrack Logo">
                    <?php elseif (file_exists('logo.png')): ?>
                        <img src="logo.png" alt="NexTrack Logo">
                    <?php else: ?>
                        <!-- Standard futuristic arrow icon represent NexTrack -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28m-5.94-2.28l-2.28 5.941" />
                        </svg>
                    <?php endif; ?>
                </div>
                <h1>Welcome to NexTrack</h1>
                <p class="subtitle">Monitor your internship progress</p>
            </div>

            <!-- Dynamic Alert Container -->
            <div id="alert-container">
                <?php if (!empty($infoMessage)): ?>
                    <div class="alert-banner <?php echo htmlspecialchars($infoType); ?>">
                        <?php if ($infoType === 'error'): ?>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <?php elseif ($infoType === 'success'): ?>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <?php else: ?>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <?php endif; ?>
                        <span><?php echo htmlspecialchars($infoMessage); ?></span>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Form -->
            <form id="login-form" autocomplete="on">
                <!-- Email Field -->
                <div class="form-group">
                    <div class="label-row">
                        <label htmlFor="email">Email Address</label>
                    </div>
                    <div class="input-wrapper">
                        <input 
                            type="email" 
                            id="email" 
                            name="email"
                            placeholder="you@example.com" 
                            required 
                            autofocus
                        >
                        <span class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </span>
                    </div>
                </div>

                <!-- Password Field -->
                <div class="form-group">
                    <div class="label-row">
                        <label htmlFor="password">Password</label>
                        <a href="#" class="forgot-link" id="forgot-pwd-trigger">Forgot Password?</a>
                    </div>
                    <div class="input-wrapper">
                        <input 
                            type="password" 
                            id="password" 
                            name="password"
                            placeholder="••••••••" 
                            required
                        >
                        <span class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <button type="button" class="toggle-password" id="toggle-password-btn" aria-label="Show password">
                            <!-- eye icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" id="eye-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Remember Me Checkbox -->
                <div class="remember-container">
                    <input type="checkbox" id="remember" name="remember" class="checkbox-input">
                    <label for="remember" class="checkbox-label">
                        <span class="custom-checkbox"></span>
                        Keep me signed in
                    </label>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="submit-btn" id="submit-btn">
                    <span class="spinner" id="btn-spinner"></span>
                    <span id="btn-text">Sign In</span>
                </button>
            </form>

            <div class="footer-note">
                <p>For administrative access, please sign in with your authorized IT account.</p>
            </div>

        </div>
    </div>

    <!-- Modal for Forgot Password -->
    <div class="modal-overlay" id="forgot-modal">
        <div class="modal-card">
            <div class="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <div class="modal-title">Password Recovery</div>
            <div class="modal-desc">
                For security reasons, password recovery is managed by the system administrator. 
                Please contact the IT Management office or email your department supervisor to reset your password.
            </div>
            <button class="modal-close-btn" id="modal-close-btn">Close</button>
        </div>
    </div>

    <!-- Script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('login-form');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const submitBtn = document.getElementById('submit-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            const alertContainer = document.getElementById('alert-container');
            const togglePasswordBtn = document.getElementById('toggle-password-btn');
            const eyeIcon = document.getElementById('eye-icon');
            
            // Password Show/Hide Toggle
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                
                // Switch eye SVG based on state
                if (isPassword) {
                    // eye-off icon SVG
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    `;
                    togglePasswordBtn.setAttribute('aria-label', 'Hide password');
                } else {
                    // standard eye icon SVG
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    `;
                    togglePasswordBtn.setAttribute('aria-label', 'Show password');
                }
            });

            // Alert helpers
            function showAlert(message, type) {
                let iconHtml = '';
                if (type === 'error') {
                    iconHtml = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
                } else if (type === 'success') {
                    iconHtml = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
                }

                alertContainer.innerHTML = `
                    <div class="alert-banner ${type}">
                        ${iconHtml}
                        <span>${escapeHtml(message)}</span>
                    </div>
                `;
            }

            function clearAlert() {
                alertContainer.innerHTML = '';
            }

            function escapeHtml(text) {
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, function(m) { return map[m]; });
            }

            // AJAX login submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                clearAlert();

                const email = emailInput.value.trim();
                const password = passwordInput.value;

                // Validate empty fields (JS Fallback)
                if (!email || !password) {
                    showAlert('Please enter both your email address and password.', 'error');
                    return;
                }

                // Activate Loading state animation
                submitBtn.disabled = true;
                emailInput.disabled = true;
                passwordInput.disabled = true;
                btnText.textContent = 'Verifying...';
                btnSpinner.style.display = 'inline-block';

                try {
                    // Send request via Fetch API
                    const formData = new FormData(form);
                    
                    const response = await fetch('authenticate.php', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        showAlert(data.message, 'success');
                        
                        // Wait briefly for user to view the success message, then redirect
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 800);
                    } else {
                        // Request failed or error response
                        showAlert(data.message || 'An error occurred during authentication.', 'error');
                        resetLoadingState();
                    }
                } catch (err) {
                    showAlert('Unable to reach the authentication server. Please check that XAMPP Apache is running.', 'error');
                    resetLoadingState();
                }
            });

            function resetLoadingState() {
                submitBtn.disabled = false;
                emailInput.disabled = false;
                passwordInput.disabled = false;
                btnText.textContent = 'Sign In';
                btnSpinner.style.display = 'none';
            }

            // Modal Trigger & Close behavior for Forgot Password
            const forgotTrigger = document.getElementById('forgot-pwd-trigger');
            const forgotModal = document.getElementById('forgot-modal');
            const modalClose = document.getElementById('modal-close-btn');

            forgotTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                forgotModal.classList.add('open');
            });

            modalClose.addEventListener('click', () => {
                forgotModal.classList.remove('open');
            });

            // Close modal when clicking on overlay background
            forgotModal.addEventListener('click', (e) => {
                if (e.target === forgotModal) {
                    forgotModal.classList.remove('open');
                }
            });
        });
    </script>
</body>
</html>
