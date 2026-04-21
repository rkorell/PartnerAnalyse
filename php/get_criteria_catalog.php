<?php
/*
  DATEI: php/get_criteria_catalog.php
  FUNKTION: Liefert den Kriterienkatalog (Name, Kategorie, Beschreibung) für den Bericht-Anhang.
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-04-21 - AP 61: Kriterienkatalog-Glossar für Partner-Bericht (Anhang 3)
*/
header('Content-Type: application/json');

require_once __DIR__ . '/common.php';

try {
    require_once DB_CONFIG_PATH;

    $stmt = $pdo->query("
        SELECT name, category, description, sort_order
        FROM criteria
        ORDER BY sort_order
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$row) {
        $row['sort_order'] = intval($row['sort_order']);
    }
    unset($row);

    echo json_encode($rows);

} catch (Exception $e) {
    error_log("Fehler in get_criteria_catalog.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Fehler beim Kriterienkatalog."]);
}
?>
