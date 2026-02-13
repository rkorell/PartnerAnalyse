<?php
/*
  DATEI: php/survey_admin.php
  Zweck: CRUD-Endpunkt für Survey-Verwaltung
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-02-13 - AP 49: Survey-Admin (list, save, create, delete)
*/

header('Content-Type: application/json');

require_once __DIR__ . '/protect.php';
require_once DB_CONFIG_PATH;

// CSRF-Check für schreibende Operationen
function checkCsrf($input) {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (!isset($input['csrf_token']) || $input['csrf_token'] !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['error' => 'Ungültiger Session-Token. Bitte Seite neu laden.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ==================== LIST ====================
    if ($method === 'GET') {
        $stmt = $pdo->query("
            SELECT s.id, s.name, s.start_date, s.end_date, s.is_active, s.test_mode,
                   COUNT(p.id) AS participant_count
            FROM surveys s
            LEFT JOIN participants p ON p.survey_id = s.id
            GROUP BY s.id
            ORDER BY s.start_date DESC, s.id DESC
        ");
        $surveys = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($surveys as &$s) {
            $s['id'] = intval($s['id']);
            $s['is_active'] = $s['is_active'] === true || $s['is_active'] === 't' || $s['is_active'] === 1;
            $s['test_mode'] = $s['test_mode'] === true || $s['test_mode'] === 't' || $s['test_mode'] === 1;
            $s['participant_count'] = intval($s['participant_count']);
        }
        unset($s);

        echo json_encode(['surveys' => $surveys]);
    }

    // ==================== SAVE / CREATE / DELETE ====================
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Keine Daten empfangen']);
            exit;
        }

        checkCsrf($input);
        $action = $input['action'] ?? '';

        // ---------- CREATE ----------
        if ($action === 'create') {
            $name = trim($input['name'] ?? '');
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['error' => 'Name darf nicht leer sein.']);
                exit;
            }

            $stmt = $pdo->prepare("
                INSERT INTO surveys (name, start_date, end_date, is_active, test_mode)
                VALUES (?, NULL, NULL, FALSE, FALSE)
                RETURNING id
            ");
            $stmt->execute([$name]);
            $newId = $stmt->fetchColumn();

            echo json_encode(['success' => true, 'id' => intval($newId)]);
        }

        // ---------- SAVE (Update) ----------
        elseif ($action === 'save') {
            $surveys = $input['surveys'] ?? [];
            if (!is_array($surveys) || empty($surveys)) {
                http_response_code(400);
                echo json_encode(['error' => 'Keine Surveys zum Speichern.']);
                exit;
            }

            // Genau eine Survey muss is_active sein
            $activeCount = count(array_filter($surveys, fn($s) => !empty($s['is_active'])));
            if ($activeCount !== 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Es muss genau eine Survey aktiv sein.']);
                exit;
            }

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                UPDATE surveys
                SET name = ?, start_date = ?, end_date = ?, is_active = ?, test_mode = ?
                WHERE id = ?
            ");

            foreach ($surveys as $s) {
                $id = intval($s['id'] ?? 0);
                if ($id <= 0) continue;

                $name = trim($s['name'] ?? '');
                if (empty($name)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(['error' => "Name darf nicht leer sein (Survey ID $id)."]);
                    exit;
                }

                $startDate = !empty($s['start_date']) ? $s['start_date'] : null;
                $endDate = !empty($s['end_date']) ? $s['end_date'] : null;
                $isActive = !empty($s['is_active']);
                $testMode = !empty($s['test_mode']);

                $stmt->execute([$name, $startDate, $endDate, $isActive ? 'true' : 'false', $testMode ? 'true' : 'false', $id]);
            }

            $pdo->commit();
            echo json_encode(['success' => true]);
        }

        // ---------- DELETE ----------
        elseif ($action === 'delete') {
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültige Survey-ID.']);
                exit;
            }

            // Prüfen ob es die letzte Survey ist
            $countStmt = $pdo->query("SELECT COUNT(*) FROM surveys");
            if (intval($countStmt->fetchColumn()) <= 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Die letzte Survey kann nicht gelöscht werden.']);
                exit;
            }

            // Prüfen ob die aktive Survey gelöscht wird
            $activeStmt = $pdo->prepare("SELECT is_active FROM surveys WHERE id = ?");
            $activeStmt->execute([$id]);
            $isActive = $activeStmt->fetchColumn();
            if ($isActive === true || $isActive === 't' || $isActive === 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Die aktive Survey kann nicht gelöscht werden. Bitte zuerst eine andere Survey aktivieren.']);
                exit;
            }

            // CASCADE löscht participants, ratings, partner_feedback automatisch
            $stmt = $pdo->prepare("DELETE FROM surveys WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true]);
        }

        else {
            http_response_code(400);
            echo json_encode(['error' => "Unbekannte Aktion: $action"]);
        }
    }

    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Fehler in survey_admin.php: " . $e->getMessage());
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Serverfehler beim Verarbeiten der Anfrage.']);
}
?>
