<?php
/* DATEI: php/save_data.php
   # Modified: 22.11.2025 - Speichert Name und Email
   # Modified: 24.11.2025, 23:45 - Handle 0 as NULL for performance ratings
   # Modified: 26.11.2025, 20:50 - Added support for comments and partner_feedback table (NPS/Frequency)
   # Modified: 27.11.2025, 13:30 - Strict Backend Input Validation (Range Check, Type Check, Fail-Fast)
   # Modified: 27.11.2025, 13:50 - Safer transaction handling (check inTransaction before rollback) (AP 5)
   # Modified: 27.11.2025, 16:00 - Security Fix: Required db_connect.php via absolute, private path (AP 11)
   # Modified: 27.11.2025, 16:30 - Final FIX: require_once moved into try-block for stable error handling (AP 11 Final Fix)
*/
header('Content-Type: application/json');

// HIER GEÄNDERT: Definieren des absoluten Pfades außerhalb des Webroot
define('DB_CONFIG_PATH', '/etc/partneranalyse/db_connect.php');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Keine Daten empfangen']);
    exit;
}

// --- VALIDATION HELPER ---
// Prüft, ob ein Wert eine Ganzzahl im gegebenen Bereich ist.
function validateIntRange($value, $min, $max) {
    // NULL oder leerer String ist ungültig, da wir das im save-Teil explizit mappen
    if ($value === null || $value === "") {
        return false;
    }
    // Strikter Check, ob es sich um eine Zahl handelt (keine Strings wie "abc")
    if (!is_numeric($value)) { 
        return false;
    }
    $val = intval($value);
    
    // Strikter Check, ob z.B. "5.5" als 5 gespeichert würde (Sicherstellung, dass nur Integer ankommen)
    if ((string)$val !== (string)$value && (string)($val . ".0") !== (string)$value) {
        return false;
    }
    
    return ($val >= $min && $val <= $max);
}

// --- CORE VALIDATION & DATA PREPARATION ---

// 1. Participant/Survey Data (Muss positiv sein)
$surveyId = $input['survey_id'] ?? null;
$departmentId = $input['department_id'] ?? null;
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$isManager = isset($input['is_manager']) && $input['is_manager'] === true ? 'true' : 'false';

if (!validateIntRange($surveyId, 1, PHP_INT_MAX) || !validateIntRange($departmentId, 1, PHP_INT_MAX)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Survey- oder Abteilungs-ID (muss positive Ganzzahl sein).']);
    exit;
}

// 2. Importance (Muss 1-10 sein, Pflichtfeld)
if (empty($input['importance']) || !is_array($input['importance'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Wichtigkeitsbewertungen fehlen.']);
    exit;
}
foreach ($input['importance'] as $critId => $score) {
    // Wichtigkeit MUSS zwischen 1 und 10 liegen (kein 0/N/A)
    if (!validateIntRange($score, 1, 10)) {
        http_response_code(400);
        echo json_encode(['error' => "Ungültiger Wert für Wichtigkeit Kriterium {$critId}. Erlaubt: 1-10."]);
        exit;
    }
}

// 3. Performance (Muss 0-10 sein, 0 wird zu NULL gemappt)
if (isset($input['performance']) && is_array($input['performance'])) {
    foreach ($input['performance'] as $partnerId => $criteriaList) {
        if (!is_array($criteriaList) || !validateIntRange($partnerId, 1, PHP_INT_MAX)) {
            http_response_code(400);
            echo json_encode(['error' => "Ungültiger Partner-ID oder Kriterienliste."]);
            exit;
        }
        foreach ($criteriaList as $critId => $data) {
            $val = 0;
            if (is_array($data)) {
                $val = $data['score'] ?? 0;
            } else {
                $val = $data; // Legacy number format
            }
            
            // Performance Score muss 0-10 sein
            if (!validateIntRange($val, 0, 10)) {
                http_response_code(4_00);
                echo json_encode(['error' => "Ungültiger Performance-Score für Partner {$partnerId} / Kriterium {$critId}. Erlaubt: 0-10."]);
                exit;
            }
        }
    }
}

// 4. Partner Feedback (Frequency, NPS)
if (isset($input['partner_feedback']) && is_array($input['partner_feedback'])) {
    foreach ($input['partner_feedback'] as $partnerId => $fb) {
        
        // Frequency check (0-4 validiert)
        $freq = $fb['frequency'] ?? 0; // Frontend sendet 0 für "Bitte wählen..."
        if (!validateIntRange($freq, 0, 4)) {
            http_response_code(400);
            echo json_encode(['error' => "Ungültige Frequenz für Partner {$partnerId}. Erlaubt: 0-4."]);
            exit;
        }

        // NPS check (-2 to 10 validiert)
        $nps = $fb['nps'] ?? -2; // Frontend sendet -2 für "Bitte wählen..."
        if (!validateIntRange($nps, -2, 10)) {
            http_response_code(400);
            echo json_encode(['error' => "Ungültiger NPS-Wert für Partner {$partnerId}. Erlaubt: -2 bis 10."]);
            exit;
        }
    }
}

// --- SPEICHERUNG (Start der Transaktion) ---

// WICHTIG: require_once ist jetzt im try-Block, um PHP-Fatal-Errors abzufangen
try {
    require_once DB_CONFIG_PATH;

    $pdo->beginTransaction();

    // 1. Teilnehmer anlegen (Verwendet trim-ed Name/Email und validierte IDs)
    $stmt = $pdo->prepare("INSERT INTO participants (survey_id, department_id, is_manager, name, email) VALUES (?, ?, ?, ?, ?) RETURNING id");
    
    $stmt->execute([
        $surveyId,
        $departmentId, 
        $isManager,
        $name,
        $email
    ]);
    
    $participantId = $stmt->fetchColumn();

    // 2. Bewertungen speichern
    $stmtRating = $pdo->prepare("INSERT INTO ratings (participant_id, criterion_id, partner_id, rating_type, score, comment) VALUES (?, ?, ?, ?, ?, ?)");

    // A) Importance (Kriterien-Wichtigkeit)
    if (isset($input['importance'])) {
        foreach ($input['importance'] as $critId => $score) {
            // Bereits validiert (1-10)
            $val = intval($score);
            $stmtRating->execute([$participantId, $critId, NULL, 'importance', $val, NULL]);
        }
    }

    // B) Performance (Partner-Bewertung)
    if (isset($input['performance'])) {
        foreach ($input['performance'] as $partnerId => $criteriaList) {
            foreach ($criteriaList as $critId => $data) {
                // Bereits validiert (0-10)
                $val = 0;
                $comment = NULL;

                if (is_array($data)) {
                    $val = isset($data['score']) ? intval($data['score']) : 0;
                    if (isset($data['comment']) && trim($data['comment']) !== '') {
                        $comment = trim($data['comment']); // Trimmen
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
    if (isset($input['partner_feedback'])) {
        $stmtFeedback = $pdo->prepare("INSERT INTO partner_feedback (participant_id, partner_id, interaction_frequency, nps_score, general_comment) VALUES (?, ?, ?, ?, ?)");

        foreach ($input['partner_feedback'] as $partnerId => $fb) {
            
            // Frequency (0-4 validiert)
            $freq = isset($fb['frequency']) ? intval($fb['frequency']) : NULL;
            if ($freq === 0) $freq = NULL; // 0 -> NULL Mapping

            // NPS (-2 to 10 validiert)
            $nps = isset($fb['nps']) ? intval($fb['nps']) : NULL;
            // -2 ("Bitte wählen...") und -1 ("Möchte nicht bewerten") mappen auf NULL
            if ($nps === -2 || $nps === -1) $nps = NULL; 

            // General Comment
            $genComment = NULL;
            if (isset($fb['general_comment']) && trim($fb['general_comment']) !== '') {
                $genComment = trim($fb['general_comment']); // Trimmen
            }

            $stmtFeedback->execute([$participantId, $partnerId, $freq, $nps, $genComment]);
        }
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'id' => $participantId]);

} catch (Exception $e) {
    // HIER GEÄNDERT: Rollback nur, wenn Transaktion noch aktiv ist
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    // Neutralere Fehlermeldung, um DB-Details nicht preiszugeben
    echo json_encode(['error' => 'Speicherfehler auf dem Server. Bitte überprüfe die Eingaben oder versuche es später erneut.']);
}
?>