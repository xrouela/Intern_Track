<?php
// Initialize session secure flags via middleware
require_once 'auth_middleware.php';
require_once 'db.php';

// Force JSON response header
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Read inputs (supporting both standard form-urlencoded and JSON payloads)
$email = '';
$password = '';
$remember = false;

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $rawData = file_get_contents('php://input');
    $jsonData = json_decode($rawData, true);
    if (is_array($jsonData)) {
        $email = $jsonData['email'] ?? '';
        $password = $jsonData['password'] ?? '';
        $remember = isset($jsonData['remember']) ? (bool)$jsonData['remember'] : false;
    }
} else {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']) && ($_POST['remember'] === '1' || $_POST['remember'] === 'on' || $_POST['remember'] === 'true');
}

// Trim email
$email = trim($email);

// 1. Validation for empty fields
if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Both email and password are required.']);
    exit;
}

// Validate basic email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

try {
    // 2. Fetch user using PDO Prepared Statements to prevent SQL Injection
    $stmt = $pdo->prepare("SELECT uid, name, email, password, role, department FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // 3. Verify user password securely
    if ($user && password_verify($password, $user['password'])) {
        // Regenerate session ID to prevent Session Fixation attacks
        session_regenerate_id(true);

        // Remove password hash from session data for security
        unset($user['password']);

        // Store user details in session
        $_SESSION['user'] = $user;
        $_SESSION['last_activity'] = time();

        // 4. Handle "Remember Me"
        if ($remember) {
            // Set session cookie to last for 30 days (2592000 seconds)
            $cookieParams = session_get_cookie_params();
            setcookie(
                session_name(),
                session_id(),
                time() + 2592000, // 30 days
                $cookieParams['path'],
                $cookieParams['domain'],
                $cookieParams['secure'],
                $cookieParams['httponly']
            );
        }

        // Determine dashboard redirection based on role
        $role = $user['role'];
        $redirect = '';
        if ($role === 'admin') {
            $redirect = 'admin/dashboard.php';
        } else {
            // Default redirects for intern or managers (mapping managers/interns to intern dashboard or similar)
            $redirect = 'intern/dashboard.php';
        }

        echo json_encode([
            'success' => true,
            'message' => 'Login successful! Redirecting...',
            'redirect' => $redirect,
            'user' => [
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ]);
        exit;
    } else {
        // Generic failure response to prevent email harvesting
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

} catch (PDOException $e) {
    // Log exception details securely on the server and return user-friendly API error
    error_log("Database error during authentication: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An internal database error occurred. Please try again later.']);
    exit;
}
?>
