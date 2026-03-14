/* ============================================================================
   CPQI - 0_destroy_database.sql
   Zweck: Vollständige Löschung aller Tabellen, Funktionen und Views
   Stand: 2026-03-14

   ██████████████████████████████████████████████████████████████████████████████
   ██                                                                        ██
   ██   WARNUNG: DIESE DATEI LÖSCHT ALLE DATEN UNWIDERRUFLICH!               ██
   ██                                                                        ██
   ██   NIEMALS auf einer Produktionsdatenbank ausführen!                     ██
   ██   Nur für vollständige Neuinstallation auf leerer Datenbank.            ██
   ██                                                                        ██
   ██   Reihenfolge bei Neuinstallation:                                     ██
   ██   1. 0_destroy_database.sql  (diese Datei — leert die DB)              ██
   ██   2. 1_create_schema.sql     (erstellt Struktur)                       ██
   ██   3. 2_initial_data.sql      (lädt Stammdaten)                         ██
   ██                                                                        ██
   ██████████████████████████████████████████████████████████████████████████████
   ============================================================================ */

-- Tabellen (in Abhängigkeitsreihenfolge: abhängige zuerst)
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS app_texts CASCADE;
DROP TABLE IF EXISTS partner_feedback CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- Funktionen
DROP FUNCTION IF EXISTS get_department_subtree CASCADE;
DROP FUNCTION IF EXISTS calculate_partner_bilanz CASCADE;
DROP FUNCTION IF EXISTS get_partner_matrix_details CASCADE;
DROP FUNCTION IF EXISTS get_partner_structure_stats CASCADE;
DROP FUNCTION IF EXISTS get_area_distribution CASCADE;
DROP FUNCTION IF EXISTS export_raw_data CASCADE;

-- Views
DROP VIEW IF EXISTS view_ratings_extended CASCADE;
DROP VIEW IF EXISTS view_survey_fraud CASCADE;
