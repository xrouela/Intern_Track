<?php
// Prevent session hijacking and secure cookies
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    
    // Support SameSite attribute for cookie protection
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    } else {
        // Fallback for older PHP versions
        $secureParam = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? '; Secure' : '';
        ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 1 : 0);
        ini_set('session.cookie_path', '/; SameSite=Lax' . $secureParam);
    }
    
    session_start();
}

/**
 * Checks if the user is authenticated and authorized for a specific role.
 * Redirects to the login page if not authenticated, or to the respective dashboard if unauthorized.
 * 
 * @param string|array|null $allowed_roles Roles allowed to access the page (e.g. 'admin', 'intern')
 */
function check_auth($allowed_roles = null) {
    // 1. Check if user session exists
    if (!isset($_SESSION['user']) || !isset($_SESSION['user']['uid'])) {
        session_unset();
        session_destroy();
        
        $login_path = 'login.php';
        if (!file_exists($login_path) && file_exists('../login.php')) {
            $login_path = '../login.php';
        }
        
        header("Location: " . $login_path);
        exit;
    }
    
    // 2. Session timeout checks (e.g., 30 minutes)
    $timeout_seconds = 1800; // 30 minutes
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout_seconds)) {
        session_unset();
        session_destroy();
        
        $login_path = 'login.php';
        if (!file_exists($login_path) && file_exists('../login.php')) {
            $login_path = '../login.php';
        }
        
        header("Location: " . $login_path . "?timeout=1");
        exit;
    }
    $_SESSION['last_activity'] = time();
    
    // 3. Role authorization checks
    if ($allowed_roles !== null) {
        $user_role = $_SESSION['user']['role'] ?? '';
        
        if (is_array($allowed_roles)) {
            $is_authorized = in_array($user_role, $allowed_roles) || 
                             ($user_role === 'superadmin' && in_array('admin', $allowed_roles));
        } else {
            $is_authorized = ($user_role === $allowed_roles) || 
                             ($user_role === 'superadmin' && $allowed_roles === 'admin');
        }
        
        if (!$is_authorized) {
            // Determine the base path relative to the current file
            $base_dir = '';
            if (!file_exists('login.php') && file_exists('../login.php')) {
                $base_dir = '../';
            }
            
            // Redirect authorized roles to their dashboards, or to login
            if ($user_role === 'admin') {
                header("Location: " . $base_dir . "admin/dashboard.php");
            } else if ($user_role === 'intern') {
                header("Location: " . $base_dir . "intern/dashboard.php");
            } else {
                header("Location: " . $base_dir . "login.php?error=unauthorized");
            }
            exit;
        }
    }
}
?>
