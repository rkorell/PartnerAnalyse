<?php
/* DATEI: php/save_data.php
   # Modified: 22.11.2025 - Speichert Name und Email
   # Modified: 24.11.2025, 23:45 - Handle 0 as NULL for performance ratings
   # Modified: 26.11.2025, 20:50 - Added support for comments and partner_feedback table (NPS/Frequency)
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

    // 1. Teilnehmer anlegen
    $stmt = $pdo->prepare("INSERT INTO participants (survey_id, department_id, is_manager, name, email) VALUES (?, ?, ?, ?, ?) RETURNING id");
    
    $stmt->execute([
        $input['survey_id'],
        $input['department_id'], 
        isset($input['is_manager']) && $input['is_manager'] === true ? 'true' : 'false',
        $input['name'] ?? null,
        $input['email'] ?? null
    ]);
    
    $participantId = $stmt->fetchColumn();

    // 2. Bewertungen speichern (Ratings Tabelle erweitert um comment)
    // HIER GEÄNDERT: Spalte comment hinzugefügt
    $stmtRating = $pdo->prepare("INSERT INTO ratings (participant_id, criterion_id, partner_id, rating_type, score, comment) VALUES (?, ?, ?, ?, ?, ?)");

    // A) Importance (Kriterien-Wichtigkeit)
    if (isset($input['importance'])) {
        foreach ($input['importance'] as $critId => $score) {
            // Importance hat keine Kommentare -> NULL
            $val = intval($score);
            if ($val < 1) $val = 1;
            $stmtRating->execute([$participantId, $critId, NULL, 'importance', $val, NULL]);
        }
    }

    // B) Performance (Partner-Bewertung)
    if (isset($input['performance'])) {
        foreach ($input['performance'] as $partnerId => $criteriaList) {
            foreach ($criteriaList as $critId => $data) {
                // HIER GEÄNDERT: Checken, ob $data ein Wert oder ein Objekt {score, comment} ist
                $val = 0;
                $comment = NULL;

                if (is_array($data)) {
                    $val = isset($data['score']) ? intval($data['score']) : 0;
                    if (isset($data['comment']) && trim($data['comment']) !== '') {
                        $comment = trim($data['comment']);
                    }
                } else {
                    $val = intval($data);
                }

                // 0 -> NULL Mapping für Score
                $scoreParam = ($val === 0) ? NULL : $val;
                
                $stmtRating->execute([$participantId, $critId, $partnerId, 'performance', $scoreParam, $comment]);
            }
        }
    }

    // 3. Partner Feedback speichern (Kopfdaten: Frequenz, NPS, Globaler Text)
    // HIER NEU: Insert in die neue Tabelle
    if (isset($input['partner_feedback'])) {
        $stmtFeedback = $pdo->prepare("INSERT INTO partner_feedback (participant_id, partner_id, interaction_frequency, nps_score, general_comment) VALUES (?, ?, ?, ?, ?)");

        foreach ($input['partner_feedback'] as $partnerId => $fb) {
            // Frequency (1-4)
            $freq = isset($fb['frequency']) ? intval($fb['frequency']) : NULL;
            if ($freq === 0) $freq = NULL; // Sicherheitshalber

            // NPS (-1 -> NULL Mapping)
            $nps = isset($fb['nps']) ? intval($fb['nps']) : NULL;
            if ($nps === -1) $nps = NULL; // "Möchte nicht bewerten" -> NULL

            // General Comment
            $genComment = NULL;
            if (isset($fb['general_comment']) && trim($fb['general_comment']) !== '') {
                $genComment = trim($fb['general_comment']);
            }

            $stmtFeedback->execute([$participantId, $partnerId, $freq, $nps, $genComment]);
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