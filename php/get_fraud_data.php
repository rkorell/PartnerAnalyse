<?php
/*
  DATEI: php/get_fraud_data.php
  FUNKTION: Liefert Fraud-Indikatoren aus der View view_survey_fraud für das Analyse-Dashboard.
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-02-14 - AP 50: Fraud-Detection API
  # Modified: 2026-02-14 - AP 50: mode_score, department/manager Filter
*/
header('Content-Type: application/json');

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php';

try {
    require_once DB_CONFIG_PATH;

    $input = json_decode(file_get_contents('php://input'), true);
    $survey_ids     = $input['survey_ids'] ?? [];
    $department_ids = $input['department_ids'] ?? [];
    $manager_filter = $input['manager_filter'] ?? 'alle';

    if (empty($survey_ids)) {
        http_response_code(400);
        echo json_encode(["error" => "Keine Survey-IDs angegeben."]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($survey_ids), '?'));
    $params = array_map('intval', $survey_ids);

    // Basis-Query
    $sql = "SELECT participant_id, survey_id, survey_name, department_name,
                   is_manager, ip_hash, created_at,
                   ip_submit_count, is_ip_duplicate,
                   total_perf_ratings, mode_score, straightline_pct, is_straightliner,
                   avg_score, severity
            FROM view_survey_fraud
            WHERE survey_id IN ($placeholders)
              AND severity > 0";

    // Abteilungsfilter (rekursiv via get_department_subtree)
    if (!empty($department_ids)) {
        $dept_array = '{' . implode(',', array_map('intval', $department_ids)) . '}';
        $sql .= " AND department_id IN (SELECT id FROM get_department_subtree(?::int[]))";
        $params[] = $dept_array;
    }

    // Manager-Filter
    if ($manager_filter === 'nur_manager') {
        $sql .= " AND is_manager = TRUE";
    } elseif ($manager_filter === 'nur_nicht_manager') {
        $sql .= " AND is_manager = FALSE";
    }

    $sql .= " ORDER BY severity DESC, created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Boolean-Werte normalisieren (PDO liefert 't'/'f' für PostgreSQL BOOLEAN)
    foreach ($result as &$row) {
        $row['is_ip_duplicate']  = $row['is_ip_duplicate'] === true || $row['is_ip_duplicate'] === 't';
        $row['is_straightliner'] = $row['is_straightliner'] === true || $row['is_straightliner'] === 't';
        $row['is_manager']       = $row['is_manager'] === true || $row['is_manager'] === 't';
        $row['severity']         = intval($row['severity']);
        $row['ip_submit_count']  = intval($row['ip_submit_count']);
        $row['mode_score']       = intval($row['mode_score']);
        $row['straightline_pct'] = intval($row['straightline_pct']);
        $row['avg_score']        = floatval($row['avg_score']);
    }
    unset($row);

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Fehler in get_fraud_data.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler bei der Fraud-Analyse."]);
}
?>
