<?php
/*
  DATEI: php/get_partner_details.php
  Zweck: Lädt Details (Matrix, Kommentare) für einen einzelnen Partner nach (Lazy Loading)
  # Created: 27.11.2025, 17:00 - Part of AP 12 Performance Optimization
*/

header('Content-Type: application/json');

define('DB_CONFIG_PATH', '/etc/partneranalyse/db_connect.php');

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

$dept_placeholders = implode(',', array_fill(0, count($department_ids), '?'));
$survey_placeholders = implode(',', array_fill(0, count($survey_ids), '?'));

$manager_where = "";
if ($manager_filter === "nur_manager") $manager_where = "AND p.is_manager = TRUE";
else if ($manager_filter === "nur_nicht_manager") $manager_where = "AND p.is_manager = FALSE";

try {
    require_once DB_CONFIG_PATH;

    // 1. Matrix Details & Specific Comments holen
    $sqlDetails = "
    WITH RECURSIVE subdeps AS (
        SELECT id FROM departments WHERE id IN ($dept_placeholders)
        UNION ALL
        SELECT d.id FROM departments d JOIN subdeps s ON d.parent_id = s.id
    ),
    participants_filtered AS (
        SELECT p.id, p.is_manager
        FROM participants p
        WHERE p.survey_id IN ($survey_placeholders)
        $manager_where
        AND p.department_id IN (SELECT id FROM subdeps)
    )
    SELECT 
        c.name,
        ROUND(AVG(r_imp.score)::numeric, 1) as imp,
        ROUND(AVG(r_perf.score)::numeric, 1) as perf,
        ROUND(AVG(r_perf.score) FILTER (WHERE p.is_manager)::numeric, 1) as perf_mgr,
        ROUND(AVG(r_perf.score) FILTER (WHERE NOT p.is_manager)::numeric, 1) as perf_team,
        JSON_AGG(r_perf.comment) FILTER (WHERE r_perf.comment IS NOT NULL AND trim(r_perf.comment) <> '') as comments
    FROM criteria c
    JOIN ratings r_imp ON r_imp.criterion_id = c.id AND r_imp.rating_type = 'importance'
    JOIN ratings r_perf ON r_perf.criterion_id = c.id AND r_perf.rating_type = 'performance'
    JOIN participants_filtered p ON r_imp.participant_id = p.id AND r_perf.participant_id = p.id
    WHERE r_perf.partner_id = ?
    GROUP BY c.id, c.name
    ORDER BY c.name
    ";

    $params = [];
    foreach ($department_ids as $id) $params[] = intval($id);
    foreach ($survey_ids as $id) $params[] = intval($id);
    $params[] = $partner_id; // Partner ID am Ende

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

    // 2. General Comments holen
    $sqlGeneral = "
    WITH RECURSIVE subdeps AS (
        SELECT id FROM departments WHERE id IN ($dept_placeholders)
        UNION ALL
        SELECT d.id FROM departments d JOIN subdeps s ON d.parent_id = s.id
    )
    SELECT 
        JSON_AGG(f.general_comment) FILTER (WHERE f.general_comment IS NOT NULL AND trim(f.general_comment) <> '') as general_comments
    FROM partner_feedback f
    JOIN participants p ON f.participant_id = p.id
    WHERE f.partner_id = ?
    AND p.survey_id IN ($survey_placeholders)
    AND p.department_id IN (SELECT id FROM subdeps)
    $manager_where
    ";

    // Params neu aufbauen (gleiche Reihenfolge, aber PartnerID am Ende für Feedback Query)
    $stmtGen = $pdo->prepare($sqlGeneral);
    $stmtGen->execute($params);
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
    http_response_code(500);
    echo json_encode(["error" => "Fehler beim Laden der Details."]);
}
?>