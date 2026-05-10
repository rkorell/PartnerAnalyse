<?php
/*
  DATEI: php/kriterien_strips.php
  Zweck: Endpoint Kriterienanalyse (Strip-Plot) — pro Kriterium AVG Performance pro Partner
  (c) - Dr. Ralf Korell, 2025/26

  # Modified: 2026-05-09 - Initial Prototyp Strip-Diagnose (24 Kriterien)
  # Modified: 2026-05-09 - Iteration 2: MIN_RATINGS=1 (Frontend-Slider filtert)
  # Modified: 2026-05-09 - Iteration 3: partnersFull-Liste mit vollem Namen für Chips
  # Modified: 2026-05-09 - Hardcoded SURVEY_ID=3 (PUBLIC & CPSG Frühjahr 2026), Demo-Surveys ausgeschlossen
  # Modified: 2026-05-09 - Rename strip_proto → kriterien_strips, Filter-Param (?filter=base64-JSON), total_participants
  # Modified: 2026-05-09 - Survey-Liste (id, name) für Picker im No-Param-Modus mitgeben
  # Modified: 2026-05-09 - Refactor: POST-Body + calculate_partner_bilanz + get_partner_matrix_details (kanonische Mechanismen, konsistent zur Analyseseite)
  # Modified: 2026-05-10 - logo_file pro Partner ins JSON aufgenommen (für Quadrant-Integration)
*/

header('Content-Type: application/json');

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php';

if (!file_exists(DB_CONFIG_PATH)) {
    http_response_code(500);
    echo json_encode(["error" => "Konfiguration nicht gefunden."]);
    exit;
}
require_once DB_CONFIG_PATH;

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = [];

$survey_ids     = isset($input['survey_ids']) && is_array($input['survey_ids'])
                  ? array_values(array_filter(array_map('intval', $input['survey_ids']), fn($v) => $v > 0))
                  : [];
$manager_filter = $input['manager_filter'] ?? 'alle';
$department_ids = isset($input['department_ids']) && is_array($input['department_ids'])
                  ? array_values(array_filter(array_map('intval', $input['department_ids']), fn($v) => $v > 0))
                  : [];
$min_answers    = isset($input['min_answers']) ? max(1, intval($input['min_answers'])) : 5;
$exclude_ids    = isset($input['exclude_ids']) && is_array($input['exclude_ids'])
                  ? array_values(array_map('intval', $input['exclude_ids']))
                  : [];

try {
    // all_surveys IMMER liefern (für Standalone-Picker, auch bei Fehler-Fall)
    $allSurveys = [];
    foreach ($pdo->query("SELECT id, name, is_active, test_mode, ranking_mode FROM surveys ORDER BY start_date DESC, id DESC") as $row) {
        $allSurveys[] = [
            'id'           => (int)$row['id'],
            'name'         => $row['name'],
            'is_active'    => $row['is_active'] === 't' || $row['is_active'] === true || $row['is_active'] === 1,
            'test_mode'    => $row['test_mode'] === 't' || $row['test_mode'] === true || $row['test_mode'] === 1,
            'ranking_mode' => $row['ranking_mode'] === 't' || $row['ranking_mode'] === true || $row['ranking_mode'] === 1,
        ];
    }

    // Survey ist Pflicht
    if (empty($survey_ids)) {
        http_response_code(400);
        echo json_encode([
            'error'       => 'survey_ids fehlt',
            'all_surveys' => $allSurveys,
        ]);
        exit;
    }

    // Department-Default: alle aktiven Departments
    if (empty($department_ids)) {
        $department_ids = array_map('intval', $pdo->query("SELECT id FROM departments")->fetchAll(PDO::FETCH_COLUMN));
    }

    // Postgres-Array-Strings (analog partner_score_analyse.php)
    $survey_arr  = '{' . implode(',', array_map('intval', $survey_ids))     . '}';
    $dept_arr    = '{' . implode(',', array_map('intval', $department_ids)) . '}';
    $exclude_arr = '{' . implode(',', $exclude_ids)                          . '}';

    // 1) Eligible Partner über calculate_partner_bilanz (Filter konsistent zur Analyseseite)
    $stmtB = $pdo->prepare("SELECT * FROM calculate_partner_bilanz(?::int[], ?::int[], ?, ?, ?::int[])");
    $stmtB->execute([$survey_arr, $dept_arr, $manager_filter, $min_answers, $exclude_arr]);
    $bilanz = $stmtB->fetchAll(PDO::FETCH_ASSOC);

    // 2) Globale Importance pro Kriterium (gleiche Filter-Pipeline wie get_importance_distribution.php)
    $sqlImp = "
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
        SELECT c.id, c.name, c.category, c.sort_order,
               AVG(r.score)::numeric AS imp_avg
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        JOIN criteria c ON r.criterion_id = c.id
        WHERE r.rating_type = 'importance' AND r.score IS NOT NULL
        GROUP BY c.id, c.name, c.category, c.sort_order
        ORDER BY c.sort_order, c.id";
    $stmtI = $pdo->prepare($sqlImp);
    $stmtI->execute([$survey_arr, $dept_arr, $exclude_arr, $manager_filter, $manager_filter, $manager_filter]);
    $criteriaRows = $stmtI->fetchAll(PDO::FETCH_ASSOC);

    // Falls Bilanz leer (keine Partner über Schwelle), trotzdem Kriterien + leeres Ergebnis liefern
    $criteria = array_map(function($r) {
        return [
            'id'         => (int)$r['id'],
            'name'       => $r['name'],
            'category'   => $r['category'],
            'sort_order' => (int)$r['sort_order'],
            'imp_avg'    => $r['imp_avg'] !== null ? (float)$r['imp_avg'] : null,
        ];
    }, $criteriaRows);

    // 3) Total Participants (distinct in relevant_participants)
    $sqlN = "SELECT COUNT(DISTINCT p.id) AS n
             FROM participants p
             WHERE p.survey_id = ANY(?::int[])
               AND p.department_id IN (SELECT id FROM get_department_subtree(?::int[]))
               AND p.id != ALL(?::int[])
               AND (
                   ? = 'alle'
                   OR (? = 'nur_manager' AND p.is_manager = TRUE)
                   OR (? = 'nur_nicht_manager' AND p.is_manager = FALSE)
               )";
    $stmtN = $pdo->prepare($sqlN);
    $stmtN->execute([$survey_arr, $dept_arr, $exclude_arr, $manager_filter, $manager_filter, $manager_filter]);
    $totalParticipants = (int)$stmtN->fetchColumn();

    // 4) Ranking-Modus (BOOL_OR über gewählte Surveys)
    $stmtR = $pdo->prepare("SELECT BOOL_OR(ranking_mode) FROM surveys WHERE id = ANY(?::int[])");
    $stmtR->execute([$survey_arr]);
    $rankVal = $stmtR->fetchColumn();
    $rankingMode = $rankVal === true || $rankVal === 't';

    // 5) Partner-Stammdaten (id, name, short_name) für die eligible-Liste
    $partnersOut = [];
    $perPartnerPerf = [];
    if (!empty($bilanz)) {
        $eligibleIds = array_map(fn($b) => (int)$b['partner_id'], $bilanz);
        $idsList = implode(',', $eligibleIds);
        $sqlP = "SELECT id, name, short_name, logo_file FROM partners WHERE id IN ($idsList)";
        $stmtP = $pdo->query($sqlP);
        $nameMap = [];
        $shortMap = [];
        $logoMap = [];
        foreach ($stmtP as $row) {
            $pid = (int)$row['id'];
            $nameMap[$pid]  = $row['name'];
            $shortMap[$pid] = $row['short_name'];
            $logoMap[$pid]  = $row['logo_file'];
        }

        // 6) Pro eligible Partner: get_partner_matrix_details → liefert imp + perf pro Kriterium-NAME
        // Mapping zurück auf criterion_id über criteria-Liste
        $critIdByName = [];
        foreach ($criteria as $c) $critIdByName[$c['name']] = $c['id'];

        $stmtM = $pdo->prepare("SELECT * FROM get_partner_matrix_details(?, ?::int[], ?::int[], ?, ?::int[])");

        foreach ($bilanz as $b) {
            $pid = (int)$b['partner_id'];
            $name = $nameMap[$pid] ?? $b['partner_name'];
            $short = $shortMap[$pid] ?? null;
            $label = ($short !== null && $short !== '') ? $short : $name;
            $totalAssessors = (int)($b['num_assessors_mgr'] ?? 0) + (int)($b['num_assessors_team'] ?? 0);

            $partnersOut[] = [
                'id'              => $pid,
                'name'            => $name,
                'label'           => $label,
                'logo_file'       => $logoMap[$pid] ?? null,
                'total_assessors' => $totalAssessors,
            ];

            $stmtM->execute([$pid, $survey_arr, $dept_arr, $manager_filter, $exclude_arr]);
            foreach ($stmtM as $mr) {
                $cname = $mr['name'];
                if (!isset($critIdByName[$cname])) continue;
                if ($mr['perf'] === null) continue;
                $perPartnerPerf[] = [
                    'partner_id'   => $pid,
                    'criterion_id' => $critIdByName[$cname],
                    'perf'         => (float)$mr['perf'],
                ];
            }
        }
    }

    echo json_encode([
        'applied_filter' => [
            'survey_ids'     => $survey_ids,
            'department_ids' => $department_ids,
            'manager_filter' => $manager_filter,
            'min_answers'    => $min_answers,
            'exclude_ids'    => $exclude_ids,
            'partner_ids'    => $input['partner_ids'] ?? null,
        ],
        'total_participants' => $totalParticipants,
        'ranking_mode'       => $rankingMode,
        'criteria'           => $criteria,
        'partners'           => $partnersOut,
        'per_partner_perf'   => $perPartnerPerf,
        'all_surveys'        => $allSurveys,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('kriterien_strips error: ' . $e->getMessage());
    echo json_encode(['error' => 'Interner Fehler.']);
}
