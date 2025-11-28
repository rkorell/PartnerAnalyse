/* Datei: sql/1_create_schema.sql
  Zweck: Definition des Datenbankschemas (Tabellen, Indizes, Constraints)
  (c) - Dr. Ralf Korell, 2025/26

  # Modified: 26.11.2025, 20:40 - Added partner_feedback table and comment column to ratings
  # Modified: 27.11.2025, 13:50 - Added critical indices for analysis query performance (AP 5)
  # Modified: 28.11.2025, 14:00 - AP 22: Synchronized schema with production DB (added app_texts, session_token, missing indices)
  # Modified: 28.11.2025, 14:20 - AP 23.1: Added stored function get_department_subtree for recursive hierarchy lookup
  # Modified: 28.11.2025, 14:30 - AP 23.2: Added view_ratings_extended to simplify PHP joins
  # Modified: 28.11.2025, 15:00 - FIX AP 23.2: Added missing participant_id to view_ratings_extended
  # Modified: 28.11.2025, 18:00 - AP 29.1: Added admin_users table for authentication
*/

DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS app_texts CASCADE;
DROP TABLE IF EXISTS partner_feedback CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP FUNCTION IF EXISTS get_department_subtree CASCADE;
DROP VIEW IF EXISTS view_ratings_extended CASCADE;

-- 1. App Texte (Tooltips & Statische Texte)
CREATE TABLE app_texts (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    content TEXT
);

-- 2. Kampagnen
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    test_mode BOOLEAN DEFAULT FALSE
);

-- 3. Abteilungen (Hierarchie)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES departments(id),
    level_depth INTEGER,
    description TEXT
);

-- 4. Partner
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
);

-- 5. Kriterien
CREATE TABLE criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    sort_order INTEGER,
    description TEXT
);

-- 6. Teilnehmer
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id),
    department_id INTEGER REFERENCES departments(id),
    session_token VARCHAR(100),
    is_manager BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bewertungen
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id),
    criterion_id INTEGER REFERENCES criteria(id),
    partner_id INTEGER REFERENCES partners(id),
    rating_type VARCHAR(20),
    score INTEGER,
    comment TEXT,
    CONSTRAINT ratings_rating_type_check CHECK (rating_type IN ('importance', 'performance')),
    CONSTRAINT ratings_score_check CHECK ((score BETWEEN 1 AND 10) OR score IS NULL),
    CONSTRAINT unique_vote_per_survey UNIQUE (participant_id, criterion_id, partner_id, rating_type)
);

-- 8. Partner Feedback (Kopfdaten: Frequenz, NPS, Globaler Kommentar)
CREATE TABLE partner_feedback (
    id BIGSERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id),
    partner_id INTEGER REFERENCES partners(id),
    interaction_frequency INTEGER,
    nps_score INTEGER,
    general_comment TEXT,
    CONSTRAINT unique_feedback UNIQUE (participant_id, partner_id)
);

-- 9. Authentifizierung (AP 29.1)
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- --- INDIZES (Synchronisiert mit DB Stand AP 22) ---

-- Departments
CREATE INDEX idx_departments_parent ON departments(parent_id);

-- Partners
CREATE INDEX idx_partner_active ON partners(active);

-- Surveys
CREATE INDEX idx_survey_active ON surveys(is_active);

-- Participants
CREATE INDEX idx_participants_department ON participants(department_id);
CREATE INDEX idx_participants_manager ON participants(is_manager);
CREATE INDEX idx_participants_survey ON participants(survey_id);

-- Ratings
CREATE INDEX idx_ratings_criterion ON ratings(criterion_id);
CREATE INDEX idx_ratings_participant ON ratings(participant_id);
CREATE INDEX idx_ratings_partner ON ratings(partner_id);
CREATE INDEX idx_ratings_partner_type ON ratings(partner_id, rating_type);
CREATE INDEX idx_ratings_type ON ratings(rating_type);

-- Feedback
CREATE INDEX idx_feedback_partner ON partner_feedback(partner_id);

-- --- 10. FUNCTIONS & VIEWS (AP 23 Architecture Refactoring) ---

/*
  Funktion: get_department_subtree
  Zweck: Liefert rekursiv alle Abteilungs-IDs unterhalb der gegebenen Root-IDs.
  Parameter: root_ids INT[] (Array von Abteilungs-IDs)
  Rückgabe: Tabelle mit einer Spalte (id)
*/
CREATE OR REPLACE FUNCTION get_department_subtree(root_ids INT[])
RETURNS TABLE(id INT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subdeps AS (
        SELECT d.id FROM departments d WHERE d.id = ANY(root_ids)
        UNION ALL
        SELECT d.id FROM departments d JOIN subdeps s ON d.parent_id = s.id
    )
    SELECT s.id FROM subdeps s;
END;
$$ LANGUAGE plpgsql;

/*
  View: view_ratings_extended
  Zweck: Flache Sicht auf Bewertungen inkl. Kontext (Abteilung, Manager, Kategorie)
  Ersetzt komplexe Joins im PHP-Code.
*/
CREATE OR REPLACE VIEW view_ratings_extended AS
SELECT 
    r.id AS rating_id,
    r.partner_id,
    r.participant_id, 
    r.score,
    r.comment,
    r.rating_type,
    p.survey_id,
    p.department_id,
    p.is_manager,
    c.id AS criterion_id,
    c.category,
    c.name AS criterion_name
FROM ratings r
JOIN participants p ON r.participant_id = p.id
JOIN criteria c ON r.criterion_id = c.id;