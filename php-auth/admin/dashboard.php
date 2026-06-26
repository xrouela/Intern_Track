<?php
require_once '../auth_middleware.php';

// Verify user is logged in AND has the 'admin' role
check_auth('admin');

$user = $_SESSION['user'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - NexTrack</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: #4f46e5;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-600: #475569;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --radius-xl: 1rem;
            --radius-2xl: 1.5rem;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--slate-900);
            background-image: radial-gradient(circle at top right, rgba(79, 70, 229, 0.1), transparent 30%), radial-gradient(circle at bottom left, rgba(15, 23, 42, 1) 0%, rgba(9, 15, 29, 1) 100%);
            min-height: 100vh;
            color: var(--slate-100);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .dashboard-card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-2xl);
            padding: 40px;
            width: 100%;
            max-width: 550px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            text-align: center;
        }

        .role-badge {
            display: inline-block;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 24px;
        }

        h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .welcome-text {
            color: var(--slate-300);
            margin-bottom: 32px;
            font-size: 15px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            text-align: left;
            margin-bottom: 32px;
            background: rgba(15, 23, 42, 0.4);
            padding: 24px;
            border-radius: var(--radius-xl);
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 12px;
        }

        .info-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .info-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--slate-500);
        }

        .info-val {
            font-size: 14px;
            font-weight: 500;
            color: var(--slate-100);
        }

        .logout-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #ef4444;
            color: white;
            border: none;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            border-radius: var(--radius-xl);
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
        }

        .logout-btn:hover {
            background: #dc2626;
            box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
            transform: translateY(-1px);
        }
    </style>
</head>
<body>

    <div class="dashboard-card">
        <span class="role-badge">System Administrator</span>
        <h1>Welcome, <?php echo htmlspecialchars($user['name']); ?></h1>
        <p class="welcome-text">Successfully logged in and session protected.</p>

        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">User ID</span>
                <span class="info-val"><?php echo htmlspecialchars($user['uid']); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Email Address</span>
                <span class="info-val"><?php echo htmlspecialchars($user['email']); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">Department</span>
                <span class="info-val"><?php echo htmlspecialchars($user['department'] ?: 'IT Operations'); ?></span>
            </div>
            <div class="info-item">
                <span class="info-label">System Role</span>
                <span class="info-val"><?php echo htmlspecialchars($user['role']); ?></span>
            </div>
        </div>

        <a href="../logout.php" class="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
        </a>
    </div>

</body>
</html>
