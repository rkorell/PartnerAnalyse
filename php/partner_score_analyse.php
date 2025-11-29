<?php
/*
  DATEI: php/partner_score_analyse.php
  Zweck: Analyse-API für Partner-Score-Berechnung mit Filter
  (c) - Dr. Ralf Korell, 2025/26

  # Modified: 28.11.2025, 14:50 - AP 23.4: Refactored to use view_ratings_extended for simplified queries
  # Modified: 28.11.2025, 18:45 - AP 29.2: Enable access protection
  # Modified: 29.11.2025, 10:45 - FIX: Restored correct content (was accidentally overwritten with save_data.php code)
*/

header('Content-Type: application/json');

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php'; // Analyse MUSS geschützt sein!

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

// Array-String für PostgreSQL Funktion vorbereiten "{1,2,3}"
$dept_array_string = '{' . implode(',', array_map('intval', $department_ids)) . '}';

// Survey Placeholders
$survey_placeholders = implode(',', array_fill(0, count($survey_ids), '?'));

// Filter-Logik für WHERE-Klauseln (jetzt direkt auf Spalten des Views/Tabelle)
$manager_sql = "";
if ($manager_filter === "nur_manager") $manager_sql = "AND is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_sql = "AND is_manager = FALSE";

// Manager-Filter für Tabellen mit Alias 'p' (participants)
$manager_sql_p = "";
if ($manager_filter === "nur_manager") $manager_sql_p = "AND p.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_sql_p = "AND p.is_manager = FALSE";

try {
    require_once DB_CONFIG_PATH;

    // QUERY REFACTORING (AP 23.4): Nutzung von view_ratings_extended
    $sql = "
WITH subdeps AS (
  SELECT id FROM get_department_subtree(?::int[])
),
global_stats AS (
  SELECT COUNT(DISTINCT participant_id) as unique_assessors_total
    FROM view_ratings_extended
   WHERE rating_type = 'performance'
     AND survey_id IN ($survey_placeholders)
     AND department_id IN (SELECT id FROM subdeps)
     $manager_sql
),
assessor_counts AS (
  SELECT partner_id, 
         COUNT(DISTINCT participant_id) as num_assessors,
         COUNT(DISTINCT participant_id) FILTER (WHERE is_manager) as num_assessors_mgr,
         COUNT(DISTINCT participant_id) FILTER (WHERE NOT is_manager) as num_assessors_team
    FROM view_ratings_extended
   WHERE rating_type = 'performance'
     AND survey_id IN ($survey_placeholders)
     AND department_id IN (SELECT id FROM subdeps)
     $manager_sql
   GROUP BY partner_id
),
feedback_stats AS (
  -- Hier müssen wir partner_feedback mit participants joinen, da nicht im View
  SELECT f.partner_id,
         COUNT(f.general_comment) as cnt_gen_comments,
         ROUND(100.0 * (COUNT(*) FILTER (WHERE f.nps_score >= 9) - COUNT(*) FILTER (WHERE f.nps_score <= 6)) / NULLIF(COUNT(f.nps_score), 0), 0) as nps_score
    FROM partner_feedback f
    JOIN participants p ON f.participant_id = p.id
   WHERE p.survey_id IN ($survey_placeholders)
     AND p.department_id IN (SELECT id FROM subdeps)
     $manager_sql_p
   GROUP BY f.partner_id
),
importance_avg AS (
  SELECT criterion_id, AVG(score) AS importance
    FROM view_ratings_extended
   WHERE rating_type = 'importance'
     AND survey_id IN ($survey_placeholders)
     AND department_id IN (SELECT id FROM subdeps)
     $manager_sql
   GROUP BY criterion_id
),
performance_avg AS (
  SELECT partner_id, criterion_id, 
         AVG(score) AS performance,
         AVG(score) FILTER (WHERE is_manager) as perf_mgr,
         AVG(score) FILTER (WHERE NOT is_manager) as perf_team,
         COUNT(comment) as cnt_spec_comments
    FROM view_ratings_extended
   WHERE rating_type = 'performance'
     AND survey_id IN ($survey_placeholders)
     AND department_id IN (SELECT id FROM subdeps)
     $manager_sql
   GROUP BY partner_id, criterion_id
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
    $params[] = $dept_array_string; // Parameter 1: Department IDs
    // Survey IDs werden mehrfach benötigt (für jede CTE)
    for($i=0; $i<5; $i++) {
        foreach ($survey_ids as $id) $params[] = intval($id);
    }
    $params[] = $min_answers; // Letzter Parameter

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