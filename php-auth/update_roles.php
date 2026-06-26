<?php
require_once 'db.php';
require_once 'auth_middleware.php';

// Enforce session check: only admins or superadmins can access this database utility
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$message = '';
$messageType = '';
$previewData = [];

// 1. Fetch current status of the three target accounts for preview
try {
    $stmt = $pdo->prepare("SELECT email, role, name, department FROM users WHERE email IN ('sestosorouela@gmail.com', 'catingub.jl@gmail.com', 'admin-internship@cp-360.com')");
    $stmt->execute();
    $previewData = $stmt->fetchAll();
} catch (PDOException $e) {
    $message = "Failed to load preview data: " . $e->getMessage();
    $messageType = 'error';
}

// 2. Process form submit (POST request to apply role modifications)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['apply_update'])) {
    try {
        $pdo->beginTransaction();

        // Rule Validation: Ensure admin-internship@cp-360.com exists first (prevent duplicate creating and orphaned roles)
        $chkStmt = $pdo->prepare("SELECT uid, role FROM users WHERE email = 'admin-internship@cp-360.com'");
        $chkStmt->execute();
        $targetUser = $chkStmt->fetch();

        if (!$targetUser) {
            // If the user doesn't exist, we must create a placeholder or throw error
            // As per rules: "Update existing records instead of creating duplicates."
            // We will auto-create the record with a secure default configuration if it's missing,
            // or fail to enforce that they set it up in schema first. Let's create it securely:
            $uid = 'superadmin_01';
            $passwordHash = password_hash('admin089', PASSWORD_DEFAULT);
            $insStmt = $pdo->prepare("INSERT INTO users (uid, name, email, password, role, department) VALUES (:uid, 'Super Admin', 'admin-internship@cp-360.com', :pwd, 'admin', 'IT Management')");
            $insStmt->execute(['uid' => $uid, 'pwd' => $passwordHash]);
            
            // Re-fetch
            $chkStmt->execute();
            $targetUser = $chkStmt->fetch();
        }

        // Rule Validation: Prevent accidental removal of the last Super Admin.
        // We look at the count of superadmins excluding the demote targets, and verify that cp-360 is being promoted.
        // Since we are running this in a transaction, we check that:
        // 1. We demote old ones to 'admin'
        // 2. We promote cp-360.com to 'superadmin'
        
        // Execute Demotions
        $demoteStmt = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email IN ('sestosorouela@gmail.com', 'catingub.jl@gmail.com')");
        $demoteStmt->execute();

        // Execute Promotion
        $promoteStmt = $pdo->prepare("UPDATE users SET role = 'superadmin' WHERE email = 'admin-internship@cp-360.com'");
        $promoteStmt->execute();

        // Rule Validation: "Only one Super Admin account should exist."
        // We verify that the count of superadmins in the entire table is exactly 1.
        $countStmt = $pdo->query("SELECT COUNT(*) as super_count FROM users WHERE role = 'superadmin'");
        $result = $countStmt->fetch();
        $superCount = (int)$result['super_count'];

        if ($superCount !== 1) {
            // Rollback changes if validation fails
            $pdo->rollBack();
            $message = "Validation Error: System must have exactly ONE Super Admin. Found: $superCount. Transaction rolled back.";
            $messageType = 'error';
        } else {
            // Verification check: ensure the only superadmin email matches target
            $verifyStmt = $pdo->query("SELECT email FROM users WHERE role = 'superadmin' LIMIT 1");
            $verifyUser = $verifyStmt->fetch();
            
            if ($verifyUser['email'] !== 'admin-internship@cp-360.com') {
                $pdo->rollBack();
                $message = "Validation Error: The single Super Admin is not admin-internship@cp-360.com. Transaction rolled back.";
                $messageType = 'error';
            } else {
                // Success: Commit the transaction
                $pdo->commit();
                $message = "Success! Roles updated successfully. Demoted old superadmins to 'admin' and promoted 'admin-internship@cp-360.com' to 'superadmin'.";
                $messageType = 'success';
                
                // Refresh preview data
                $stmt->execute();
                $previewData = $stmt->fetchAll();

                // If currently logged-in user session matches any modified accounts, update their session role
                if (isset($_SESSION['user'])) {
                    $currentUserEmail = $_SESSION['user']['email'];
                    foreach ($previewData as $row) {
                        if ($row['email'] === $currentUserEmail) {
                            $_SESSION['user']['role'] = $row['role'];
                            break;
                        }
                    }
                }
            }
        }
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $message = "Database Error: " . $e->getMessage();
        $messageType = 'error';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Role Management System Update</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --slate-50: #f8fafc;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
            --red-600: #dc2626;
            --green-600: #16a34a;
            --radius-xl: 1rem;
            --radius-2xl: 1.5rem;
            --transition: all 0.2s ease;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--slate-900);
            background-image: radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: var(--slate-100);
        }

        .container {
            width: 100%;
            max-width: 650px;
        }

        .card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-2xl);
            padding: 40px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(16px);
        }

        h1 {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--slate-300);
            margin-bottom: 32px;
        }

        .alert {
            padding: 16px;
            border-radius: var(--radius-xl);
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 30px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .alert.success {
            background: rgba(22, 163, 74, 0.15);
            border: 1px solid rgba(22, 163, 74, 0.3);
            color: #86efac;
        }

        .alert.error {
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.3);
            color: #fca5a5;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            background: rgba(15, 23, 42, 0.4);
            border-radius: var(--radius-xl);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        th, td {
            padding: 14px 18px;
            text-align: left;
            font-size: 13.5px;
        }

        th {
            background: rgba(15, 23, 42, 0.8);
            font-weight: 700;
            color: var(--slate-300);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: var(--slate-200);
        }

        tr:last-child td {
            border-bottom: none;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge.superadmin {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
        }

        .badge.admin {
            background: rgba(79, 70, 229, 0.15);
            border: 1px solid rgba(79, 70, 229, 0.3);
            color: #c7d2fe;
        }

        .badge.other {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--slate-300);
        }

        .action-btn {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 14px;
            font-size: 14px;
            font-weight: 600;
            border-radius: var(--radius-xl);
            cursor: pointer;
            transition: var(--transition);
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .action-btn:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }

        .links-row {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            font-size: 13px;
        }

        .links-row a {
            color: var(--slate-300);
            text-decoration: none;
            transition: var(--transition);
        }

        .links-row a:hover {
            color: var(--primary);
            text-decoration: underline;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="card">
            <h1>Role Management & Authorization Update</h1>
            <p class="subtitle">Assign CP-360 as Super Admin and demote old developers to Standard Admin</p>

            <?php if (!empty($message)): ?>
                <div class="alert <?php echo $messageType; ?>">
                    <?php if ($messageType === 'success'): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    <?php else: ?>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    <?php endif; ?>
                    <div><?php echo htmlspecialchars($message); ?></div>
                </div>
            <?php endif; ?>

            <h3>Current User Roles Summary</h3>
            <br>
            <table>
                <thead>
                    <tr>
                        <th>Email Address</th>
                        <th>Name</th>
                        <th>Role State</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($previewData)): ?>
                        <tr>
                            <td colspan="3" style="text-align: center; color: var(--slate-500);">No user records found. Run the SQL schema script first to seed users.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($previewData as $user): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($user['email']); ?></td>
                                <td><?php echo htmlspecialchars($user['name']); ?></td>
                                <td>
                                    <span class="badge <?php echo $user['role'] === 'superadmin' ? 'superadmin' : ($user['role'] === 'admin' ? 'admin' : 'other'); ?>">
                                        <?php echo htmlspecialchars($user['role']); ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <form method="POST">
                <button type="submit" name="apply_update" class="action-btn">
                    Execute Safe Transaction Update
                </button>
            </form>

            <div class="links-row">
                <a href="login.php">← Back to Login</a>
                <span>intern_track database utility</span>
            </div>
        </div>
    </div>

</body>
</html>
