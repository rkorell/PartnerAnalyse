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
  # Modified: 29.11.2025, 20:30 - AP 33: Added main analysis function calculate_partner_bilanz
  # Modified: 29.11.2025, 22:45 - AP 34: Updated calculate_partner_bilanz to use V2.3 Linear Model (No Rounding)
  # Modified: 30.11.2025 - AP 36: Changed ratings_score_check constraint from 1-10 to 1-5
  # Modified: 30.11.2025, 11:55 - AP 40: Fixed criteria sorting in get_partner_matrix_details (sort_order instead of name)
# Modified: 22.01.2026 - AP 47a: Added be_geo_id column to partners table
# Modified: 23.01.2026 - FIX: Awareness-Berechnung dynamisch (SELECT COUNT FROM criteria statt hardcoded 20)
# Modified: 2026-02-13 - AP 48: ON DELETE CASCADE für participants→surveys, ratings→participants, partner_feedback→participants
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
DROP FUNCTION IF EXISTS calculate_partner_bilanz CASCADE;
DROP FUNCTION IF EXISTS get_partner_matrix_details CASCADE;
DROP FUNCTION IF EXISTS get_partner_structure_stats CASCADE;
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
    be_geo_id INTEGER UNIQUE,
    sortgroup INTEGER,
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
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
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
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    criterion_id INTEGER REFERENCES criteria(id),
    partner_id INTEGER REFERENCES partners(id),
    rating_type VARCHAR(20),
    score INTEGER,
    comment TEXT,
    CONSTRAINT ratings_rating_type_check CHECK (rating_type IN ('importance', 'performance')),
    CONSTRAINT ratings_score_check CHECK ((score BETWEEN 1 AND 5) OR score IS NULL),
    CONSTRAINT unique_vote_per_survey UNIQUE (participant_id, criterion_id, partner_id, rating_type)
);

-- 8. Partner Feedback (Kopfdaten: Frequenz, NPS, Globaler Kommentar)
CREATE TABLE partner_feedback (
    id BIGSERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
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

/*
  Funktion: calculate_partner_bilanz (AP 33 / AP 34 Update)
  Zweck: Zentrale Berechnung des Partner-Scores nach Modell V2.3 (Lineares Modell / Continuous Net Value)
  Änderung V2.3: Keine Rundung mehr bei Performance. Abweichung vom Mittelwert (3.0) wird berechnet.
*/
CREATE OR REPLACE FUNCTION calculate_partner_bilanz(
    p_survey_ids INT[],
    p_dept_ids INT[],
    p_manager_filter TEXT, 
    p_min_answers INT
)
RETURNS TABLE (
    partner_id INT,
    partner_name VARCHAR,
    score NUMERIC,
    score_positive NUMERIC,
    score_negative NUMERIC,
    count_positive INT,
    count_negative INT,
    awareness_pct INT,
    max_divergence NUMERIC,
    has_action_item INT,
    total_answers INT,
    num_assessors_mgr INT,
    num_assessors_team INT,
    nps_score INT,
    comment_count INT,
    global_participant_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH
    -- 1. Relevante Teilnehmer filtern
    relevant_participants AS (
        SELECT p.id, p.is_manager 
        FROM participants p
        WHERE p.survey_id = ANY(p_survey_ids)
          AND p.department_id IN (SELECT id FROM get_department_subtree(p_dept_ids))
          AND (
              p_manager_filter = 'alle'
              OR (p_manager_filter = 'nur_manager' AND p.is_manager = TRUE)
              OR (p_manager_filter = 'nur_nicht_manager' AND p.is_manager = FALSE)
          )
    ),

    -- 2. Wichtigkeit pro Kriterium (Separat berechnet!)
    avg_importance AS (
        SELECT 
            r.criterion_id,
            AVG(r.score) as val
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        WHERE r.rating_type = 'importance'
        GROUP BY r.criterion_id
    ),

    -- 3. Performance pro Partner & Kriterium
    partner_performance AS (
        SELECT 
            r.partner_id,
            r.criterion_id,
            -- Gewichteter Durchschnitt: Sum(Score * Freq) / Sum(Freq)
            (SUM(r.score * COALESCE(pf.interaction_frequency, 1))::numeric / 
             NULLIF(SUM(COALESCE(pf.interaction_frequency, 1)), 0)) as val,
            
            -- Hilfswerte
            AVG(CASE WHEN rp.is_manager THEN r.score END) as val_mgr,
            AVG(CASE WHEN NOT rp.is_manager THEN r.score END) as val_team,
            COUNT(CASE WHEN r.comment IS NOT NULL AND trim(r.comment) <> '' THEN 1 END) as comment_cnt

        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        LEFT JOIN partner_feedback pf ON r.participant_id = pf.participant_id AND r.partner_id = pf.partner_id
        WHERE r.rating_type = 'performance' 
          AND r.score IS NOT NULL 
        GROUP BY r.partner_id, r.criterion_id
    ),
    
    -- 4. Zusammenführung & Faktoren (Join via Criterion ID)
    impacts AS (
        SELECT
            pp.partner_id,
            pp.criterion_id,
            pp.comment_cnt,
            pp.val_mgr,
            pp.val_team,
            
            -- Wichtigkeit (Hebel): Bleibt Stufenmodell (0, 2, 4, 7, 12)
            CASE ROUND(COALESCE(ai.val, 0)) 
                WHEN 5 THEN 12 WHEN 4 THEN 7 WHEN 3 THEN 4 WHEN 2 THEN 2 ELSE 0 
            END as f_imp,
            
            -- Performance (Wert): LINEARES MODELL V2.3
            -- Berechnung der Abweichung vom Neutralwert 3.0
            -- Beispiel: Note 3.5 -> +0.5 | Note 2.33 -> -0.67
            (COALESCE(pp.val, 3.0) - 3.0) as f_perf
            
        FROM partner_performance pp
        LEFT JOIN avg_importance ai ON pp.criterion_id = ai.criterion_id
    ),

    -- 5. Bilanzierung
    partner_bilanz AS (
        SELECT
            i.partner_id,
            SUM(CASE WHEN (i.f_imp * i.f_perf) > 0 THEN (i.f_imp * i.f_perf) ELSE 0 END) as score_pos,
            SUM(CASE WHEN (i.f_imp * i.f_perf) < 0 THEN (i.f_imp * i.f_perf) ELSE 0 END) as score_neg,
            COUNT(CASE WHEN (i.f_imp * i.f_perf) > 0 THEN 1 END) as count_pos,
            COUNT(CASE WHEN (i.f_imp * i.f_perf) < 0 THEN 1 END) as count_neg,
            MAX(ABS(COALESCE(i.val_mgr, 0) - COALESCE(i.val_team, 0))) as max_div,
            
            -- Action Item Logik angepasst an lineares Modell:
            -- f_perf <= -1.0 entspricht einer Note <= 2.0 (Echtes Defizit)
            MAX(CASE WHEN i.f_imp >= 7 AND i.f_perf <= -1.0 THEN 1 ELSE 0 END) as has_action,
            
            SUM(i.comment_cnt) as total_spec_comments
        FROM impacts i
        GROUP BY i.partner_id
    ),

    -- 6. Metadaten
    partner_meta AS (
        SELECT
            r.partner_id,
            COUNT(DISTINCT r.participant_id) as num_assessors,
            COUNT(DISTINCT r.participant_id) FILTER (WHERE rp.is_manager) as num_assessors_mgr,
            COUNT(DISTINCT r.participant_id) FILTER (WHERE NOT rp.is_manager) as num_assessors_team,
            ROUND(100.0 * (COUNT(DISTINCT CASE WHEN pf.nps_score >= 9 THEN pf.participant_id END) - 
                           COUNT(DISTINCT CASE WHEN pf.nps_score <= 6 THEN pf.participant_id END)) / 
                           NULLIF(COUNT(DISTINCT CASE WHEN pf.nps_score IS NOT NULL THEN pf.participant_id END), 0), 0) as nps,
            COUNT(DISTINCT CASE WHEN pf.general_comment IS NOT NULL AND trim(pf.general_comment) <> '' THEN pf.participant_id END) as cnt_gen_comments,
            ROUND(100.0 * COUNT(CASE WHEN r.rating_type='performance' AND r.score IS NOT NULL THEN 1 END) /
                          NULLIF(COUNT(DISTINCT r.participant_id) * (SELECT COUNT(*) FROM criteria), 0), 0) as awareness
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        LEFT JOIN partner_feedback pf ON r.participant_id = pf.participant_id AND r.partner_id = pf.partner_id
        WHERE r.rating_type = 'performance'
        GROUP BY r.partner_id
    ),
    
    global_total AS (
        SELECT COUNT(id) as cnt FROM relevant_participants
    )

    -- Final Select
    SELECT
        p.id,
        p.name,
        (COALESCE(pb.score_pos, 0) + COALESCE(pb.score_neg, 0))::numeric as score,
        COALESCE(pb.score_pos, 0)::numeric,
        COALESCE(pb.score_neg, 0)::numeric,
        COALESCE(pb.count_pos, 0)::int,
        COALESCE(pb.count_neg, 0)::int,
        COALESCE(pm.awareness, 0)::int,
        COALESCE(pb.max_div, 0)::numeric,
        COALESCE(pb.has_action, 0)::int,
        COALESCE(pm.num_assessors, 0)::int,
        COALESCE(pm.num_assessors_mgr, 0)::int,
        COALESCE(pm.num_assessors_team, 0)::int,
        COALESCE(pm.nps, 0)::int,
        (COALESCE(pb.total_spec_comments, 0) + COALESCE(pm.cnt_gen_comments, 0))::int,
        (SELECT cnt FROM global_total)::int
    FROM partners p
    JOIN partner_meta pm ON p.id = pm.partner_id
    LEFT JOIN partner_bilanz pb ON p.id = pb.partner_id
    WHERE pm.num_assessors >= p_min_answers
    ORDER BY (COALESCE(pb.score_pos, 0) + COALESCE(pb.score_neg, 0)) DESC;
END;
$$ LANGUAGE plpgsql;


/* Funktion: get_partner_matrix_details (AP 36 / AP 40 Fix)
  Zweck: Liefert die Punkte für die IPA-Matrix.
  WICHTIG: Nutzt Frequenz-Gewichtung für Performance, damit Matrix und Score konsistent sind.
  Skala: 1-5 (für die Grafik), nicht Netto-Wert.
  AP 40: Sortierung nach sort_order statt name
*/
CREATE OR REPLACE FUNCTION get_partner_matrix_details(
    p_partner_id INT,
    p_survey_ids INT[],
    p_dept_ids INT[],
    p_manager_filter TEXT
)
RETURNS TABLE (
    name VARCHAR,
    imp NUMERIC,      -- Durchschnitt Wichtigkeit (Ungewichtet, da strategisch)
    perf NUMERIC,     -- Durchschnitt Performance (GEWICHTET nach Frequenz!)
    perf_mgr NUMERIC, -- Reiner Schnitt Manager (für Tooltip/Konflikt)
    perf_team NUMERIC,-- Reiner Schnitt Team (für Tooltip/Konflikt)
    comments JSON     -- Liste der Kommentare
) AS $$
BEGIN
    RETURN QUERY
    WITH relevant_participants AS (
        SELECT p.id, p.is_manager 
        FROM participants p
        WHERE p.survey_id = ANY(p_survey_ids)
          AND p.department_id IN (SELECT id FROM get_department_subtree(p_dept_ids))
          AND (
              p_manager_filter = 'alle'
              OR (p_manager_filter = 'nur_manager' AND p.is_manager = TRUE)
              OR (p_manager_filter = 'nur_nicht_manager' AND p.is_manager = FALSE)
          )
    ),
    -- Performance: Gewichtung mit Frequenz!
    perf_data AS (
        SELECT 
            r.criterion_id,
            -- Formel: Sum(Score * Freq) / Sum(Freq)
            (SUM(r.score * COALESCE(pf.interaction_frequency, 1))::numeric / 
             NULLIF(SUM(COALESCE(pf.interaction_frequency, 1)), 0)) as val_weighted,
            -- Splits (Ungewichtet für Vergleich)
            AVG(CASE WHEN rp.is_manager THEN r.score END) as val_mgr,
            AVG(CASE WHEN NOT rp.is_manager THEN r.score END) as val_team,
            -- Kommentare
            JSON_AGG(r.comment) FILTER (WHERE r.comment IS NOT NULL AND trim(r.comment) <> '') as comment_list
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        LEFT JOIN partner_feedback pf ON r.participant_id = pf.participant_id AND r.partner_id = pf.partner_id
        WHERE r.partner_id = p_partner_id AND r.rating_type = 'performance'
        GROUP BY r.criterion_id
    ),
    -- Importance: Einfacher Durchschnitt
    imp_data AS (
        SELECT 
            r.criterion_id,
            AVG(r.score) as val_imp
        FROM ratings r
        JOIN relevant_participants rp ON r.participant_id = rp.id
        WHERE r.rating_type = 'importance'
        GROUP BY r.criterion_id
    )
    SELECT
        c.name,
        ROUND(i.val_imp, 1) as imp,
        ROUND(p.val_weighted, 1) as perf,
        ROUND(p.val_mgr, 1) as perf_mgr,
        ROUND(p.val_team, 1) as perf_team,
        p.comment_list as comments
    FROM perf_data p
    JOIN imp_data i ON p.criterion_id = i.criterion_id
    JOIN criteria c ON p.criterion_id = c.id
    ORDER BY c.sort_order, c.id;
END;
$$ LANGUAGE plpgsql;

/* Funktion: get_partner_structure_stats (AP 36)
  Zweck: Liefert die "Erklär-Tabelle" (Wer hat bewertet? Wie oft? Welche Note?)
*/
CREATE OR REPLACE FUNCTION get_partner_structure_stats(
    p_partner_id INT,
    p_survey_ids INT[],
    p_dept_ids INT[],
    p_manager_filter TEXT
)
RETURNS TABLE (
    role TEXT,
    headcount INT,
    avg_score NUMERIC, -- Reine Note (ungewichtet)
    avg_freq NUMERIC   -- Durchschnittliche Frequenz
) AS $$
BEGIN
    RETURN QUERY
    WITH base_data AS (
        SELECT 
            rp.is_manager,
            r.score,
            COALESCE(pf.interaction_frequency, 1) as freq,
            rp.id as pid
        FROM ratings r
        JOIN participants rp ON r.participant_id = rp.id
        LEFT JOIN partner_feedback pf ON r.participant_id = pf.participant_id AND r.partner_id = pf.partner_id
        WHERE r.partner_id = p_partner_id
          AND r.rating_type = 'performance'
          AND rp.survey_id = ANY(p_survey_ids)
          AND rp.department_id IN (SELECT id FROM get_department_subtree(p_dept_ids))
          AND (
              p_manager_filter = 'alle'
              OR (p_manager_filter = 'nur_manager' AND rp.is_manager = TRUE)
              OR (p_manager_filter = 'nur_nicht_manager' AND rp.is_manager = FALSE)
          )
    )
    -- Zeile 1: Manager
    SELECT 
        'Manager'::text as role,
        COUNT(DISTINCT pid)::int as headcount,
        ROUND(AVG(score), 1) as avg_score,
        ROUND(AVG(freq), 1) as avg_freq
    FROM base_data WHERE is_manager = TRUE
    
    UNION ALL
    
    -- Zeile 2: Team
    SELECT 
        'Team'::text as role,
        COUNT(DISTINCT pid)::int as headcount,
        ROUND(AVG(score), 1) as avg_score,
        ROUND(AVG(freq), 1) as avg_freq
    FROM base_data WHERE is_manager = FALSE
    
    UNION ALL
    
    -- Zeile 3: Gesamt (Gewichtet!)
    SELECT 
        'Gesamt (Gewichtet)'::text as role,
        COUNT(DISTINCT pid)::int as headcount,
        -- Hier zeigen wir den gewichteten Score, der auch im Balken landet
        ROUND(SUM(score * freq) / NULLIF(SUM(freq), 0), 1) as avg_score,
        ROUND(AVG(freq), 1) as avg_freq
    FROM base_data;
END;
$$ LANGUAGE plpgsql;