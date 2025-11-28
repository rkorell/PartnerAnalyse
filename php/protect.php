<?php
/*
  DATEI: php/protect.php
  Zweck: Inkludierbare Sicherheitsprüfung für API-Endpunkte
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 28.11.2025, 18:45 - AP 29.2: Session check logic
*/

// Sicherstellen, dass common.php geladen ist (für USE_LOGIN Konstante)
require_once __DIR__ . '/common.php';

// Session starten, falls noch nicht geschehen
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Prüfung: Ist Login aktiv und User NICHT eingeloggt?
if (defined('USE_LOGIN') && USE_LOGIN === true) {
    if (!isset($_SESSION['user_id'])) {
        // Zugriff verweigern
        header('Content-Type: application/json');
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Nicht eingeloggt', 'login_required' => true]);
        exit;
    }
}
?>