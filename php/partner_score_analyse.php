<?php
/*
  DATEI: php/partner_score_analyse.php
  Zweck: Analyse-API für Partner-Score-Berechnung mit Filter (V2.1 Logic)
  (c) - Dr. Ralf Korell, 2025/26

  # Modified: 26.11.2025, 16:45 - Change logic to count distinct participants (Assessors) instead of total ratings
  # Modified: 26.11.2025, 17:00 - Added global_participant_count (Total Unique Assessors across all partners)
  # Modified: 26.11.2025, 21:30 - Extended SQL for Split-Scores (Mgr/Team), NPS and Comment Counts
  # Modified: 27.11.2025, 09:00 - Extended SQL to return actual comment texts (General & Specific)
  # Modified: 27.11.2025, 11:45 - Fix: Cast JSON to text in GROUP BY to avoid DB error
  # Modified: 27.11.2025, 13:30 - Calc MAX divergence per criterion and return split details in matrix_json
  # Modified: 27.11.2025, 12:30 - Fix SQL Injection (Prepared Statements)
  # Modified: 27.11.2025, 13:45 - Suppress detailed DB error message for security
  # Modified: 27.11.2025, 16:00 - Security Fix: Required db_connect.php via absolute, private path (AP 11)
  # Modified: 27.11.2025, 16:15 - FIX: Added file_exists check for robust require_once handling (AP 11 Fix)
  # Modified: 27.11.2025, 16:30 - Final FIX: require_once moved into try-block for stable error handling (AP 11 Final Fix)
  # Modified: 27.11.2025, 17:00 - Performance Optimization (AP 12): "Smart Aggregation". Removed expensive JSON_AGG. Now returns only scores, counts and flags.
  # Modified: 28.11.2025, 09:00 - Centralized DB config path & added error logging (AP 17)
  # Modified: 28.11.2025, 14:40 - AP 23.2: Refactored to use SQL function get_department_subtree() instead of inline CTE
  # Modified: 28.11.2025, 14:50 - AP 23.4: Refactored to use view_ratings_extended for simplified queries
  # Modified: 28.11.2025, 18:45 - AP 29.2: Enable access protection
  # Modified: 29.11.2025, 11:15 - AP I.2: Switched to view_ratings_v2 (V2.1 Model with Factors)
  # Modified: 29.11.2025, 12:00 - AP 31: Added Awareness-Quote calculation
  # Modified: 29.11.2025, 16:00 - AP I.3: Full Refactoring - Use DB Function calculate_partner_bilanz
  # Modified: 2026-02-14 - AP 50: exclude_ids Parameter für Fraud-Ausschluss
*/

header('Content-Type: application/json');

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php'; // Analyse ist geschützt

if (!file_exists(DB_CONFIG_PATH)) {
    http_response_code(500);
    echo json_encode(["error" => "Interner Serverfehler (Konfiguration nicht gefunden)."]);
    exit;
}

require_once DB_CONFIG_PATH;

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültiger Request."]);
    exit;
}

$survey_ids     = $input['survey_ids'] ?? [];
$manager_filter = $input['manager_filter'] ?? "alle";
$department_ids = $input['department_ids'] ?? [];
$min_answers    = isset($input['min_answers']) ? intval($input['min_answers']) : 1;
$exclude_ids    = isset($input['exclude_ids']) && is_array($input['exclude_ids']) ? array_map('intval', $input['exclude_ids']) : [];

if (empty($survey_ids) || empty($department_ids)) {
    http_response_code(400);
    echo json_encode(["error" => "Filter unvollständig."]);
    exit;
}

// Array-String für PostgreSQL Funktion vorbereiten "{1,2,3}"
$dept_array_string = '{' . implode(',', array_map('intval', $department_ids)) . '}';
$survey_array_string = '{' . implode(',', array_map('intval', $survey_ids)) . '}';
$exclude_array_string = '{' . implode(',', $exclude_ids) . '}';

try {
    require_once DB_CONFIG_PATH;

    // AP I.3/AP 50: Aufruf der gekapselten DB-Funktion mit optionalem Teilnehmer-Ausschluss
    $sql = "SELECT * FROM calculate_partner_bilanz(?::int[], ?::int[], ?, ?, ?::int[])";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $survey_array_string,
        $dept_array_string,
        $manager_filter,
        $min_answers,
        $exclude_array_string
    ]);
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$result) {
        echo json_encode(["message" => "Keine Daten bei dieser Auswahl"]);
        exit;
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Fehler in partner_score_analyse.php: " . $e->getMessage());
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "Fehler bei der Analyse-Abfrage."]);
}
?>