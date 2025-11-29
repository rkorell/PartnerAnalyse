<?php
/*
  DATEI: php/get_partner_details.php
  Zweck: Lädt Details (Matrix, Kommentare) für einen einzelnen Partner nach (Lazy Loading)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 17:00 - Part of AP 12 Performance Optimization
  # Modified: 28.11.2025, 09:00 - Centralized DB config path & added error logging (AP 17)
  # Modified: 28.11.2025, 14:40 - AP 23.2: Refactored to use SQL function get_department_subtree for recursive hierarchy lookup
  # Modified: 28.11.2025, 14:50 - AP 23.4: Refactored to use view_ratings_extended for simplified queries
  # Modified: 28.11.2025, 18:45 - AP 29.2: Enable access protection
  # Modified: 29.11.2025, 11:15 - AP I.2: Switched to view_ratings_v2 (Non-destructive testing of V2.1 Model)
  # Modified: 29.11.2025, 23:45 - AP 36: Full Refactoring - Use DB functions for Matrix & Structure Stats to ensure consistency
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

$partner_id = isset($input['partner_id']) ? intval($input['partner_id']) : 0;
$survey_ids = $input['survey_ids'] ?? [];
$department_ids = $input['department_ids'] ?? [];
$manager_filter = $input['manager_filter'] ?? "alle";

if ($partner_id <= 0 || empty($survey_ids) || empty($department_ids)) {
    http_response_code(400);
    echo json_encode(["error" => "Parameter fehlen."]);
    exit;
}

// Arrays für Postgres vorbereiten
$dept_array = '{' . implode(',', array_map('intval', $department_ids)) . '}';
$survey_array = '{' . implode(',', array_map('intval', $survey_ids)) . '}';

try {
    // 1. Matrix Details laden (inkl. ungewichteter Splits für Tooltips)
    // Nutzt die neue DB-Funktion, die Frequenz-Gewichtung korrekt anwendet.
    $stmtMatrix = $pdo->prepare("SELECT * FROM get_partner_matrix_details(?, ?::int[], ?::int[], ?)");
    $stmtMatrix->execute([$partner_id, $survey_array, $dept_array, $manager_filter]);
    $matrix_details = $stmtMatrix->fetchAll(PDO::FETCH_ASSOC);

    // JSON-Strings in der DB-Antwort decodieren (Kommentare)
    foreach ($matrix_details as &$row) {
        if (isset($row['comments'])) {
            $row['comments'] = json_decode($row['comments'], true);
        }
    }
    unset($row);

    // 2. Struktur-Daten laden (Wer hat bewertet?)
    $stmtStruct = $pdo->prepare("SELECT * FROM get_partner_structure_stats(?, ?::int[], ?::int[], ?)");
    $stmtStruct->execute([$partner_id, $survey_array, $dept_array, $manager_filter]);
    $structure_stats = $stmtStruct->fetchAll(PDO::FETCH_ASSOC);

    // 3. General Comments laden
    // Einfache Abfrage, da diese nicht Teil der komplexen Matrix-Berechnung sind.
    // Wir filtern hier ebenfalls auf Survey, um konsistent zu bleiben.
    // (Department-Filterung ist hier implizit über participants-Tabelle und Survey-Logik ausreichend für den Kontext "Partner-Feedback", 
    // aber sauberer wäre auch hier der Dept-Filter. Wir belassen es bei Survey-Filterung wie im vorherigen Stand für Comments.)
    $sqlGen = "SELECT general_comment FROM partner_feedback pf 
               JOIN participants p ON pf.participant_id = p.id 
               WHERE pf.partner_id = ? AND p.survey_id = ANY(?::int[]) 
               AND pf.general_comment IS NOT NULL AND trim(pf.general_comment) <> ''";
    
    $stmtGen = $pdo->prepare($sqlGen);
    $stmtGen->execute([$partner_id, $survey_array]);
    $gen_comments = $stmtGen->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'partner_id' => $partner_id,
        'matrix_details' => $matrix_details,
        'structure_stats' => $structure_stats,
        'general_comments' => $gen_comments
    ]);

} catch (Exception $e) {
    error_log("Fehler in get_partner_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler beim Laden der Details."]);
}
?>