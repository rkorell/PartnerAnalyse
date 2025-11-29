<?php
/*
  DATEI: php/get_partner_details.php
  Zweck: Lädt Details (Matrix, Kommentare) für einen einzelnen Partner nach (Lazy Loading)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 17:00 - Part of AP 12 Performance Optimization
  # Modified: 28.11.2025, 09:00 - Centralized DB config path & added error logging (AP 17)
  # Modified: 28.11.2025, 14:40 - AP 23.2: Refactored to use SQL function get_department_subtree() instead of inline CTE
  # Modified: 28.11.2025, 14:50 - AP 23.4: Refactored to use view_ratings_extended for simplified queries
  # Modified: 28.11.2025, 18:45 - AP 29.2: Enable access protection
  # Modified: 29.11.2025, 11:15 - AP I.2: Switched to view_ratings_v2 (Non-destructive testing of V2.1 Model)
*/

header('Content-Type: application/json');

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php'; 

if (!file_exists(DB_CONFIG_PATH)) {
    http_response_code(500);
    echo json_encode(["error" => "Konfiguration fehlt."]);
    exit;
}

require_once DB_CONFIG_PATH;

$input = json_decode(file_get_contents('php://input'), true);

// Validierung
$partner_id = isset($input['partner_id']) ? intval($input['partner_id']) : 0;
$survey_ids = $input['survey_ids'] ?? [];
$department_ids = $input['department_ids'] ?? [];
$manager_filter = $input['manager_filter'] ?? "alle";

if ($partner_id <= 0 || empty($survey_ids) || empty($department_ids)) {
    http_response_code(400);
    echo json_encode(["error" => "Parameter fehlen."]);
    exit;
}

$dept_array_string = '{' . implode(',', array_map('intval', $department_ids)) . '}';
$survey_placeholders = implode(',', array_fill(0, count($survey_ids), '?'));

$manager_sql = "";
if ($manager_filter === "nur_manager") $manager_sql = "AND v_perf.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_sql = "AND v_perf.is_manager = FALSE";

$manager_sql_p = "";
if ($manager_filter === "nur_manager") $manager_sql_p = "AND p.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_sql_p = "AND p.is_manager = FALSE";

try {
    require_once DB_CONFIG_PATH;

    // 1. Matrix Details & Specific Comments holen (via Shadow View V2)
    // Wir joinen den View mit sich selbst: Performance-Einträge mit passenden Importance-Einträgen desselben Teilnehmers.
    $sqlDetails = "
    WITH subdeps AS (
        SELECT id FROM get_department_subtree(?::int[])
    )
    SELECT 
        v_perf.criterion_name as name,
        -- Hier nehmen wir den simulierten 1-5 Score aus dem View
        ROUND(AVG(v_imp.score)::numeric, 1) as imp,
        ROUND(AVG(v_perf.score)::numeric, 1) as perf,
        ROUND(AVG(v_perf.score) FILTER (WHERE v_perf.is_manager)::numeric, 1) as perf_mgr,
        ROUND(AVG(v_perf.score) FILTER (WHERE NOT v_perf.is_manager)::numeric, 1) as perf_team,
        JSON_AGG(v_perf.comment) FILTER (WHERE v_perf.comment IS NOT NULL AND trim(v_perf.comment) <> '') as comments
    FROM view_ratings_v2 v_perf
    JOIN view_ratings_v2 v_imp 
      ON v_perf.participant_id = v_imp.participant_id 
     AND v_perf.criterion_id = v_imp.criterion_id
    WHERE v_perf.partner_id = ?
      AND v_perf.rating_type = 'performance'
      AND v_imp.rating_type = 'importance'
      AND v_perf.survey_id IN ($survey_placeholders)
      AND v_perf.department_id IN (SELECT id FROM subdeps)
      $manager_sql
    GROUP BY v_perf.criterion_id, v_perf.criterion_name
    ORDER BY v_perf.criterion_name
    ";

    $params = [];
    $params[] = $dept_array_string; // 1. Dept Array
    $params[] = $partner_id; // 2. Partner ID
    foreach ($survey_ids as $id) $params[] = intval($id); // 3..N Survey IDs

    $stmt = $pdo->prepare($sqlDetails);
    $stmt->execute($params);
    $matrix_details = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // JSON Strings decodieren
    foreach ($matrix_details as &$row) {
        if (isset($row['comments'])) {
            $row['comments'] = json_decode($row['comments'], true);
        }
    }
    unset($row);

    // 2. General Comments holen (via Tabelle partner_feedback + participants)
    // Hier nutzen wir NICHT den View, da dieser auf ratings basiert.
    $sqlGeneral = "
    WITH subdeps AS (
        SELECT id FROM get_department_subtree(?::int[])
    )
    SELECT 
        JSON_AGG(f.general_comment) FILTER (WHERE f.general_comment IS NOT NULL AND trim(f.general_comment) <> '') as general_comments
    FROM partner_feedback f
    JOIN participants p ON f.participant_id = p.id
    WHERE f.partner_id = ?
    AND p.survey_id IN ($survey_placeholders)
    AND p.department_id IN (SELECT id FROM subdeps)
    $manager_sql_p
    ";

    // Params neu aufbauen für 2. Query
    $paramsGen = [];
    $paramsGen[] = $dept_array_string;
    $paramsGen[] = $partner_id;
    foreach ($survey_ids as $id) $paramsGen[] = intval($id);

    $stmtGen = $pdo->prepare($sqlGeneral);
    $stmtGen->execute($paramsGen);
    $resGen = $stmtGen->fetch(PDO::FETCH_ASSOC);
    
    $general_comments = [];
    if ($resGen && $resGen['general_comments']) {
        $general_comments = json_decode($resGen['general_comments'], true);
    }

    echo json_encode([
        'partner_id' => $partner_id,
        'matrix_details' => $matrix_details,
        'general_comments' => $general_comments
    ]);

} catch (Exception $e) {
    error_log("Fehler in get_partner_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler beim Laden der Details."]);
}
?>