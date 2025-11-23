<?php
/*
  Datei: /var/www/html/php/get_data.php
  Zweck: Liefert Survey-/Partner-/Kriterien-/Abteilungsdaten für das Frontend als JSON (Analyse & Erhebung)
  # Modified: 22.11.2025, 23:00 - surveys jetzt immer als Array (id, name), CI/CD für Analyse-Frontend
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

    // Criteria (alle Felder, CI/CD für Wizard)
    $criteria = [];
    $stmt = $pdo->query("SELECT id, category AS Gruppe, name AS Kriterium, description AS Erläuterung, sort_order FROM criteria ORDER BY sort_order ASC, id ASC");
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
    file_put_contents('/tmp/debug_criteria.txt', print_r($criteria, true));
    echo json_encode([
        'surveys'     => $surveys,
        'partners'    => $partners,
        'criteria'    => $criteria,
        'departments' => $departments
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fehler beim Laden der Daten: ' . $e->getMessage()]);
    exit;
}
?>