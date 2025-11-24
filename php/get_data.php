<?php
/*
  Datei: /var/www/html/php/get_data.php
  Zweck: Liefert Survey-/Partner-/Kriterien-/Abteilungsdaten für das Frontend als JSON (Analyse & Erhebung)
  # Modified: 22.11.2025, 23:00 - surveys jetzt immer als Array (id, name), CI/CD für Analyse-Frontend
  # Modified: 23.11.2025, 11:35 - Aliase entfernt (Fix: Keine Umlaute/Germanismen in JSON-Keys)
  # Modified: 23.11.2025, 21:15 - App-Texte (Tooltips) aus DB laden (app_texts)
*/

header('Content-Type: application/json');

require_once 'db_connect.php';

try {
    // Surveys als Array
    $surveys = [];
    $stmt = $pdo->query("SELECT id, name FROM surveys ORDER BY start_date DESC, id DESC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $surveys[] = [
            'id' => intval($row['id']),
            'name' => $row['name']
        ];
    }

    // Partners
    $partners = [];
    $stmt = $pdo->query("SELECT id, name FROM partners WHERE active = TRUE ORDER BY name ASC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $partners[] = [
            'id' => intval($row['id']),
            'name' => $row['name']
        ];
    }

    // Criteria (Original Spaltennamen)
    $criteria = [];
    $stmt = $pdo->query("SELECT id, category, name, description, sort_order FROM criteria ORDER BY sort_order ASC, id ASC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $criteria[] = $row;
    }

    // Departments (Adjacency List)
    $departments = [];
    $stmt = $pdo->query("SELECT id, name, parent_id, level_depth FROM departments ORDER BY level_depth ASC, name ASC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $departments[] = [
            'id' => intval($row['id']),
            'name' => $row['name'],
            'parent_id' => $row['parent_id'] === null ? null : intval($row['parent_id']),
            'level_depth' => intval($row['level_depth'])
        ];
    }

    // NEU: App Texte laden
    $app_texts = [];
    try {
        // Wir prüfen vorsichtig, ob die Tabelle existiert/gefüllt ist
        $stmt = $pdo->query("SELECT category, content FROM app_texts");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $app_texts[$row['category']] = $row['content'];
        }
    } catch (Exception $e) {
        // Fallback: Wenn Tabelle fehlt, leeres Array (Frontend zeigt dann Platzhalter oder nichts)
        // Man könnte hier auch Default-Texte hardcoden, aber wir nutzen die DB.
    }

    echo json_encode([
        'surveys'     => $surveys,
        'partners'    => $partners,
        'criteria'    => $criteria,
        'departments' => $departments,
        'app_texts'   => $app_texts // Neue Property
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Laden der Daten: ' . $e->getMessage()]);
    exit;
}
?>