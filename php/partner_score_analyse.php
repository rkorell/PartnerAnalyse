<?php
/*
  DATEI: php/partner_score_analyse.php
  Zweck: Analyse-API für Partner-Score-Berechnung mit Filter (Survey, Abteilung inkl. Subabteilungen, Manager, Mindestanzahl)
  Erwartet: POST (application/json) mit Parametern
    - survey_ids (Array)
    - manager_filter ("alle", "nur_manager", "nur_nicht_manager")
    - department_ids (Array)
    - min_answers (Integer)
  Antwort: JSON (Partner, Score, total_answers) oder Fehlermeldung
  # Modified: 22.11.2025, 22:00 - Initialversion für Score-Analyse mit Filter
  # Modified: 23.11.2025, 17:45 - Erweiterung um JSON-Details (IPA Matrix) per Eager Loading
*/

header('Content-Type: application/json');
require_once 'db_connect.php';

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

$department_id_list = implode(',', array_map('intval', $department_ids));
$survey_id_list     = implode(',', array_map('intval', $survey_ids));

$manager_where = "";
if ($manager_filter === "nur_manager") $manager_where = "AND p.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_where = "AND p.is_manager = FALSE";

try {
    $sql = "
WITH RECURSIVE subdeps AS (
  SELECT id FROM departments WHERE id IN ($department_id_list)
  UNION ALL
  SELECT d.id FROM departments d JOIN subdeps s ON d.parent_id = s.id
),
participants_filtered AS (
  SELECT p.id
    FROM participants p
   WHERE p.survey_id IN ($survey_id_list)
     $manager_where
     AND p.department_id IN (SELECT id FROM subdeps)
),
importance_avg AS (
  SELECT r.criterion_id, AVG(r.score) AS importance
    FROM ratings r
   WHERE r.rating_type = 'importance'
     AND r.participant_id IN (SELECT id FROM participants_filtered)
   GROUP BY r.criterion_id
),
performance_avg AS (
  SELECT r.partner_id, r.criterion_id, AVG(r.score) AS performance, COUNT(*) AS num_answers
    FROM ratings r
   WHERE r.rating_type = 'performance'
     AND r.participant_id IN (SELECT id FROM participants_filtered)
   GROUP BY r.partner_id, r.criterion_id
)
SELECT
  pa.id         AS partner_id,
  pa.name       AS partner_name,
  ROUND(SUM(pf.performance * ia.importance)::numeric, 2) AS score,
  SUM(pf.num_answers) AS total_answers,
  
  -- Hier holen wir die Details für die Matrix direkt als JSON-Array
  json_agg(json_build_object(
      'name', c.name,
      'imp',  ROUND(ia.importance::numeric, 1),
      'perf', ROUND(pf.performance::numeric, 1)
  )) AS matrix_details

FROM performance_avg pf
JOIN importance_avg ia ON pf.criterion_id = ia.criterion_id
JOIN partners pa ON pa.id = pf.partner_id
JOIN criteria c ON c.id = pf.criterion_id
GROUP BY pa.id, pa.name
HAVING SUM(pf.num_answers) >= :min_answers
ORDER BY score DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':min_answers', $min_answers, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$result) {
        echo json_encode(["message" => "Keine Daten bei dieser Auswahl"]);
        exit;
    }

    // Nachbearbeitung: JSON-String aus Postgres in echtes PHP-Array wandeln
    foreach ($result as &$row) {
        if (isset($row['matrix_details'])) {
            $row['matrix_details'] = json_decode($row['matrix_details'], true);
        }
    }
    unset($row);

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Datenbankfehler: " . $e->getMessage()]);
}
?>