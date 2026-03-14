<?php
/*
  DATEI: php/export_data.php
  Zweck: CSV-Export der denormalisierten Rohdaten (Streaming-Download)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-03-14 - AP 60: Denormalisierter CSV-Export für Excel-Pivot
*/

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/protect.php';

if (!file_exists(DB_CONFIG_PATH)) {
    http_response_code(500);
    echo "Konfiguration nicht gefunden.";
    exit;
}

require_once DB_CONFIG_PATH;

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo "Ungültiger Request.";
    exit;
}

$survey_ids     = $input['survey_ids'] ?? [];
$manager_filter = $input['manager_filter'] ?? "alle";
$department_ids = $input['department_ids'] ?? [];
$min_answers    = isset($input['min_answers']) ? intval($input['min_answers']) : 1;
$exclude_ids    = isset($input['exclude_ids']) && is_array($input['exclude_ids']) ? array_map('intval', $input['exclude_ids']) : [];
$partner_ids    = isset($input['partner_ids']) && is_array($input['partner_ids']) ? array_map('intval', $input['partner_ids']) : [];

if (empty($survey_ids) || empty($department_ids)) {
    http_response_code(400);
    echo "Filter unvollständig.";
    exit;
}

$survey_array_string  = '{' . implode(',', array_map('intval', $survey_ids)) . '}';
$dept_array_string    = '{' . implode(',', array_map('intval', $department_ids)) . '}';
$exclude_array_string = '{' . implode(',', $exclude_ids) . '}';
$partner_array_string = '{' . implode(',', $partner_ids) . '}';

try {
    $sql = "SELECT * FROM export_raw_data(?::int[], ?::int[], ?, ?, ?::int[], ?::int[])";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $survey_array_string,
        $dept_array_string,
        $manager_filter,
        $min_answers,
        $exclude_array_string,
        $partner_array_string
    ]);

    // CSV-Header für Browser-Download
    $filename = 'cpqi_rohdaten_export_' . date('Y-m-d_Hi') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');

    // UTF-8 BOM für Excel
    echo "\xEF\xBB\xBF";

    // Spaltenüberschriften
    $headers = [
        'Teilnehmer_ID',
        'Abteilung',
        'Rolle_Manager_JN',
        'Partner',
        'Partnergruppe',
        'Kriterium',
        'Kriterium_Nr',
        'Performance_Rohwert_1-5',
        'Interaktionshaeufigkeit_1-4',
        'Performance_x_Haeufigkeit',
        'Importance_Mittelwert_1-5',
        'Importance_Faktor_0-12',
        'Impact_Faktor_x_Abweichung',
        'NPS_Wert_0-10',
        'Kommentar_Kriterium',
        'Kommentar_Partner'
    ];
    echo implode(';', $headers) . "\n";

    // Datenzeilen streamen
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $fields = [];
        foreach ($row as $i => $value) {
            if ($value === null) {
                $fields[] = '';
            } elseif ($i === 2) {
                // Boolean: is_manager -> Ja/Nein
                $fields[] = ($value === 't' || $value === true || $value === '1') ? 'Ja' : 'Nein';
            } elseif (is_numeric($value) && strpos($value, '.') !== false) {
                // Dezimalzahl: Punkt -> Komma
                $fields[] = str_replace('.', ',', $value);
            } elseif ($i >= 14) {
                // Textfelder (Kommentare): Anführungszeichen escapen, Semikolons schützen
                $fields[] = '"' . str_replace('"', '""', str_replace(["\r\n", "\r", "\n"], ' ', $value)) . '"';
            } else {
                $fields[] = $value;
            }
        }
        echo implode(';', $fields) . "\n";
    }

} catch (Exception $e) {
    error_log("Fehler in export_data.php: " . $e->getMessage());
    http_response_code(500);
    echo "Fehler beim Export.";
}
?>
