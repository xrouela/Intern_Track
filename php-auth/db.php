<?php
$host = '127.0.0.1';
$user = 'root';
$password = '';
$database = 'intern_track';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Detect if AJAX or API client expecting JSON
    $isJsonExpected = (
        (isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) ||
        (isset($_SERVER['HTTP_ACCEPT']) && stripos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) ||
        (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    );

    if ($isJsonExpected) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please ensure MySQL is running in XAMPP.'
        ]);
    } else {
        echo "<div style='font-family: \"Inter\", sans-serif; padding: 24px; background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; border-radius: 12px; margin: 40px auto; max-width: 550px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>";
        echo "<h3 style='margin-top: 0; font-size: 18px;'>Database Connection Error</h3>";
        echo "<p style='font-size: 14px; line-height: 1.5;'>Failed to connect to the MySQL database. Please verify your XAMPP Control Panel has Apache and MySQL running.</p>";
        echo "<code style='display: block; background: #fff; padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid #fed7d7; margin-top: 15px; word-break: break-all;'>" . htmlspecialchars($e->getMessage()) . "</code>";
        echo "</div>";
    }
    exit;
}
?>
