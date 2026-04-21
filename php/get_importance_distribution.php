<?php
/*
  DATEI: php/get_importance_distribution.php
  FUNKTION: Liefert die Importance-Verteilung pro Kriterium für den Partner-Bericht (Anhang).
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-04-21 - AP 61: Importance-Anhang im Partner-Bericht
*/
header('Content-Type: application/json');

require_once __DIR__ . '/common.php';

try {
    require_once DB_CONFIG_PATH;

    $input = json_decode(file_get_contents('php://input'), true);
    $survey_ids     = $input['survey_ids'] ?? [];
    $department_ids = $input['department_ids'] ?? [];
    $manager_filter = $input['manager_filter'] ?? 'alle';
    $exclude_ids    = $input['exclude_ids'] ?? [];

    if (empty($survey_ids)) {
        http_response_code(400);
        echo json_encode(["error" => "Keine Survey-IDs angegeben."]);
        exit;
    }

    $sql = "
        WITH relevant_participants AS (
            SELECT p.id
            FROM participants p
            WHERE p.survey_id = ANY(?::int[])
              AND p.department_id IN (SELECT id FROM get_department_subtree(?::int[]))
              AND p.id != ALL(?::int[])
              AND (
                  ? = 'alle'
                  OR (? = 'nur_manager' AND p.is_manager = TRUE)
                  OR (? = 'nur_nicht_manager' AND p.is_manager = FALSE)
              )
        )
        SELECT
            c.name,
            c.sort_order,
            ROUND(AVG(r.score), 2) as avg_importance,
            COUNT(*) as n,
            COUNT(*) FILTER (WHERE r.score = 5) as n_5,
            COUNT(*) FILTER (WHERE r.score = 4) as n_4,
            COUNT(*) FILTER (WHERE r.score = 3) as n_3,
            COUNT(*) FILTER (WHERE r.score = 2) as n_2,
            COUNT(*) FILTER (WHERE r.score = 1) as n_1
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        JOIN criteria c ON r.criterion_id = c.id
        WHERE r.rating_type = 'importance'
        GROUP BY c.name, c.sort_order
        ORDER BY COUNT(*) FILTER (WHERE r.score = 5)::float / COUNT(*) DESC, AVG(r.score) DESC
    ";

    $survey_arr = '{' . implode(',', array_map('intval', $survey_ids)) . '}';
    $dept_arr   = '{' . implode(',', array_map('intval', $department_ids)) . '}';
    $excl_arr   = '{' . implode(',', array_map('intval', $exclude_ids)) . '}';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $survey_arr, $dept_arr, $excl_arr,
        $manager_filter, $manager_filter, $manager_filter
    ]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Numerische Felder casten
    foreach ($rows as &$row) {
        $row['avg_importance'] = floatval($row['avg_importance']);
        $row['sort_order']    = intval($row['sort_order']);
        $row['n']    = intval($row['n']);
        $row['n_5']  = intval($row['n_5']);
        $row['n_4']  = intval($row['n_4']);
        $row['n_3']  = intval($row['n_3']);
        $row['n_2']  = intval($row['n_2']);
        $row['n_1']  = intval($row['n_1']);
    }
    unset($row);

    echo json_encode($rows);

} catch (Exception $e) {
    error_log("Fehler in get_importance_distribution.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler bei der Importance-Analyse."]);
}
?>
