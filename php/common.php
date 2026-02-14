<?php
/*
  DATEI: php/common.php
  FUNKTION: Zentrale Definition globaler Konstanten und Konfigurationen für das Backend.
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 28.11.2025, 09:00 - Centralized DB config path (AP 17)
  # Modified: 28.11.2025, 18:45 - AP 29.2: Added login feature flag
  # Modified: 2026-02-14 - AP 50: IP-Hash Salt für Anomalie-Erkennung
*/

// Absoluter Pfad zur Datenbank-Konfiguration (außerhalb des Webroots)
define('DB_CONFIG_PATH', '/etc/partneranalyse/db_connect.php');

// Feature-Flag für Login-System (AP 29)
// Setzen Sie dies auf TRUE, um den Passwortschutz zu aktivieren.
define('USE_LOGIN', true);

// HINWEIS: IP_HASH_SALT liegt in /etc/partneranalyse/db_connect.php
// (außerhalb des Webroots, DSGVO-konform, nicht über HTTP erreichbar)
?>