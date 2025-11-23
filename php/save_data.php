<?php
/* DATEI: php/save_data.php
   # Modified: 22.11.2025 - Speichert Name und Email
*/
header('Content-Type: application/json');
require 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Keine Daten empfangen']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Teilnehmer anlegen (Erweitert um name, email)
    // department_id ist die ID der untersten Ebene
    $stmt = $pdo->prepare("INSERT INTO participants (survey_id, department_id, is_manager, name, email) VALUES (?, ?, ?, ?, ?) RETURNING id");
    
    $stmt->execute([
        $input['survey_id'],
        $input['department_id'], 
        isset($input['is_manager']) && $input['is_manager'] === true ? 'true' : 'false',
        $input['name'] ?? null,
        $input['email'] ?? null
    ]);
    
    $participantId = $stmt->fetchColumn();

    // 2. Bewertungen speichern
    $stmtRating = $pdo->prepare("INSERT INTO ratings (participant_id, criterion_id, partner_id, rating_type, score) VALUES (?, ?, ?, ?, ?)");

    // A) Importance (Kriterien-Wichtigkeit)
    if (isset($input['importance'])) {
        foreach ($input['importance'] as $critId => $score) {
            $stmtRating->execute([$participantId, $critId, NULL, 'importance', $score]);
        }
    }

    // B) Performance (Partner-Bewertung)
    if (isset($input['performance'])) {
        foreach ($input['performance'] as $partnerId => $criteriaList) {
            foreach ($criteriaList as $critId => $score) {
                $stmtRating->execute([$participantId, $critId, $partnerId, 'performance', $score]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'id' => $participantId]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Speicherfehler: ' . $e->getMessage()]);
}
?>