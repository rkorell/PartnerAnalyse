<?php
/*
  DATEI: php/login.php
  Zweck: Authentifizierungs-Endpunkt (Login)
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 28.11.2025, 18:45 - AP 29.2: Initial implementation
*/

header('Content-Type: application/json');
require_once __DIR__ . '/common.php';

// Session starten (für Login-Status)
session_start();

// Wenn Login deaktiviert ist, immer Erfolg melden
if (!defined('USE_LOGIN') || !USE_LOGIN) {
    echo json_encode(['success' => true, 'message' => 'Login not required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

if (empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Passwort fehlt']);
    exit;
}

try {
    if (!file_exists(DB_CONFIG_PATH)) {
        throw new Exception("Datenbank-Konfiguration fehlt.");
    }
    require_once DB_CONFIG_PATH;

    // User 'admin' prüfen
    $stmt = $pdo->prepare("SELECT id, password_hash FROM admin_users WHERE username = 'admin'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        // Login erfolgreich
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = 'admin';
        $_SESSION['login_time'] = time();
        
        echo json_encode(['success' => true]);
    } else {
        // Login fehlgeschlagen
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Falsches Passwort']);
    }

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Interner Serverfehler']);
}
?>