<?php
/*
  DATEI: php/get_performance_benchmark.php
  FUNKTION: Liefert Performance-Benchmark pro Kriterium (Ø, Min, Max über alle Partner).
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-04-21 - AP 61: Performance-Benchmark für Partner-Bericht (Anhang 2)
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
        ),
        partner_criterion_avg AS (
            SELECT
                r.partner_id,
                r.criterion_id,
                AVG(r.score) as avg_score
            FROM ratings r
            JOIN relevant_participants rp ON r.participant_id = rp.id
            WHERE r.rating_type = 'performance'
            GROUP BY r.partner_id, r.criterion_id
        )
        SELECT
            c.name,
            c.sort_order,
            ROUND(AVG(pca.avg_score)::numeric, 2) as avg_performance,
            ROUND(STDDEV_POP(pca.avg_score)::numeric, 2) as stddev_performance,
            COUNT(DISTINCT pca.partner_id) as n_partners
        FROM partner_criterion_avg pca
        JOIN criteria c ON pca.criterion_id = c.id
        GROUP BY c.name, c.sort_order
        ORDER BY c.sort_order
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

    foreach ($rows as &$row) {
        $row['avg_performance']    = floatval($row['avg_performance']);
        $row['stddev_performance'] = floatval($row['stddev_performance']);
        $row['sort_order']         = intval($row['sort_order']);
        $row['n_partners']         = intval($row['n_partners']);
    }
    unset($row);

    echo json_encode($rows);

} catch (Exception $e) {
    error_log("Fehler in get_performance_benchmark.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler beim Performance-Benchmark."]);
}
?>
