<?php
/*
  DATEI: php/partner_score_analyse.php
  Zweck: Analyse-API für Partner-Score-Berechnung mit Filter
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
*/

header('Content-Type: application/json');

require_once __DIR__ . '/common.php';

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

if (empty($survey_ids) || empty($department_ids)) {
    http_response_code(400);
    echo json_encode(["error" => "Filter unvollständig."]);
    exit;
}

// HIER GEÄNDERT: Array-String für PostgreSQL Funktion vorbereiten "{1,2,3}"
$dept_array_string = '{' . implode(',', array_map('intval', $department_ids)) . '}';

// Survey Placeholders bleiben klassisch (IN (?,?))
$survey_placeholders = implode(',', array_fill(0, count($survey_ids), '?'));

$manager_where = "";
if ($manager_filter === "nur_manager") $manager_where = "AND p.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_where = "AND p.is_manager = FALSE";

try {
    require_once DB_CONFIG_PATH;

    // OPTIMIERTE QUERY: Nutzt jetzt get_department_subtree
    $sql = "
WITH subdeps AS (
  SELECT id FROM get_department_subtree(?::int[])
),
participants_filtered AS (
  SELECT p.id, p.is_manager
    FROM participants p
   WHERE p.survey_id IN ($survey_placeholders)
     $manager_where
     AND p.department_id IN (SELECT id FROM subdeps)
),
global_stats AS (
  SELECT COUNT(DISTINCT r.participant_id) as unique_assessors_total
    FROM ratings r
   WHERE r.rating_type = 'performance'
     AND r.participant_id IN (SELECT id FROM participants_filtered)
),
assessor_counts AS (
  SELECT r.partner_id, 
         COUNT(DISTINCT r.participant_id) as num_assessors,
         COUNT(DISTINCT r.participant_id) FILTER (WHERE p.is_manager) as num_assessors_mgr,
         COUNT(DISTINCT r.participant_id) FILTER (WHERE NOT p.is_manager) as num_assessors_team
    FROM ratings r
    JOIN participants_filtered p ON r.participant_id = p.id
   WHERE r.rating_type = 'performance'
   GROUP BY r.partner_id
),
feedback_stats AS (
  SELECT f.partner_id,
         COUNT(f.general_comment) as cnt_gen_comments,
         ROUND(100.0 * (COUNT(*) FILTER (WHERE f.nps_score >= 9) - COUNT(*) FILTER (WHERE f.nps_score <= 6)) / NULLIF(COUNT(f.nps_score), 0), 0) as nps_score
    FROM partner_feedback f
   WHERE f.participant_id IN (SELECT id FROM participants_filtered)
   GROUP BY f.partner_id
),
importance_avg AS (
  SELECT r.criterion_id, AVG(r.score) AS importance
    FROM ratings r
   WHERE r.rating_type = 'importance'
     AND r.participant_id IN (SELECT id FROM participants_filtered)
   GROUP BY r.criterion_id
),
performance_avg AS (
  SELECT r.partner_id, r.criterion_id, 
         AVG(r.score) AS performance,
         AVG(r.score) FILTER (WHERE p.is_manager) as perf_mgr,
         AVG(r.score) FILTER (WHERE NOT p.is_manager) as perf_team,
         COUNT(r.comment) as cnt_spec_comments
    FROM ratings r
    JOIN participants_filtered p ON r.participant_id = p.id
   WHERE r.rating_type = 'performance'
   GROUP BY r.partner_id, r.criterion_id
)
SELECT
  pa.id         AS partner_id,
  pa.name       AS partner_name,
  
  -- Gesamt Score
  ROUND(SUM(pf.performance * ia.importance)::numeric, 2) AS score,
  
  -- Indikator ⚡: Maximale Divergenz
  MAX(ABS(COALESCE(pf.perf_mgr, 0) - COALESCE(pf.perf_team, 0))) AS max_divergence,
  
  -- Indikator ⚠️: Action Item Flag
  MAX(CASE WHEN ia.importance >= 8.0 AND pf.performance <= 5.0 THEN 1 ELSE 0 END) as has_action_item,

  -- Beurteiler-Zahlen
  MAX(ac.num_assessors) AS total_answers,
  MAX(ac.num_assessors_mgr) AS num_assessors_mgr,
  MAX(ac.num_assessors_team) AS num_assessors_team,
  
  -- Insights Daten
  MAX(fs.nps_score) as nps_score,
  (COALESCE(SUM(pf.cnt_spec_comments), 0) + COALESCE(MAX(fs.cnt_gen_comments), 0)) as comment_count,
  
  -- Globaler Zähler
  (SELECT unique_assessors_total FROM global_stats) AS global_participant_count

FROM performance_avg pf
JOIN importance_avg ia ON pf.criterion_id = ia.criterion_id
JOIN partners pa ON pa.id = pf.partner_id
JOIN assessor_counts ac ON ac.partner_id = pa.id 
LEFT JOIN feedback_stats fs ON fs.partner_id = pa.id 

GROUP BY pa.id, pa.name
HAVING MAX(ac.num_assessors) >= ? 
ORDER BY score DESC
    ";

    $params = [];
    $params[] = $dept_array_string; // Parameter 1: Department IDs als PG Array String
    foreach ($survey_ids as $id) $params[] = intval($id); // Parameter 2..N: Survey IDs
    $params[] = $min_answers; // Parameter N+1: Min Answers

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
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