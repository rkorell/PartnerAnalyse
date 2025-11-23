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
*/

// Fehlerausgabe immer als JSON
header('Content-Type: application/json');

// Datenbankverbindung
require_once 'db_connect.php';

// POST-Body lesen und dekodieren
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(["error" => "Ungültiger oder fehlender JSON-Request."]);
    exit;
}

// Filter-Parameter prüfen
$survey_ids     = isset($input['survey_ids']) ? $input['survey_ids'] : [];
$manager_filter = isset($input['manager_filter']) ? $input['manager_filter'] : "alle";
$department_ids = isset($input['department_ids']) ? $input['department_ids'] : [];
$min_answers    = isset($input['min_answers']) ? intval($input['min_answers']) : 1;

// Plausibilitätsprüfung
if (!is_array($survey_ids) || count($survey_ids) < 1) {
    http_response_code(400);
    echo json_encode(["error" => "survey_ids (Array) muss angegeben werden."]);
    exit;
}
if (!is_array($department_ids) || count($department_ids) < 1) {
    http_response_code(400);
    echo json_encode(["error" => "department_ids (Array) muss angegeben werden."]);
    exit;
}
if (!in_array($manager_filter, ["alle", "nur_manager", "nur_nicht_manager"])) {
    http_response_code(400);
    echo json_encode(["error" => "manager_filter ungültig."]);
    exit;
}

// Rekursive Departments (inkl. Unterabteilungen)
$department_id_list = implode(',', array_map('intval', $department_ids));
$survey_id_list     = implode(',', array_map('intval', $survey_ids));

// Dynamisches WHERE für Manager-Filter
if ($manager_filter === "nur_manager") {
    $manager_where = "AND p.is_manager = TRUE";
} else if ($manager_filter === "nur_nicht_manager") {
    $manager_where = "AND p.is_manager = FALSE";
} else {
    $manager_where = "";
}

try {
    // Rekursive Departments (WITH RECURSIVE)
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
  SUM(pf.performance * ia.importance) AS score,
  SUM(pf.num_answers)                 AS total_answers
FROM performance_avg pf
JOIN importance_avg ia ON pf.criterion_id = ia.criterion_id
JOIN partners pa ON pa.id = pf.partner_id
GROUP BY pa.id, pa.name
HAVING SUM(pf.num_answers) >= :min_answers
ORDER BY score DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':min_answers', $min_answers, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$result || count($result) === 0) {
        echo json_encode(["message" => "keine Daten bei dieser Auswahl"]);
        exit;
    }

    // Ergebnisse als JSON ausgeben
    foreach ($result as &$row) {
        if (isset($row['score'])) {
            $row['score'] = round(floatval($row['score']), 2);
        }
        if (isset($row['total_answers'])) {
            $row['total_answers'] = intval($row['total_answers']);
        }
    }
    unset($row);

    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Analysefehler: " . $e->getMessage()]);
    exit;
}
?>