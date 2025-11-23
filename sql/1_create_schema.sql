/* 1_create_schema.sql - Struktur ohne Daten */
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- 1. Kampagnen
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- 2. Abteilungen (Hierarchie)
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES departments(id),
    level_depth INTEGER,
    description TEXT
);

-- 3. Partner
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
);

-- 4. Kriterien
CREATE TABLE criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sort_order INTEGER
);

-- 5. Teilnehmer
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id),
    department_id INTEGER REFERENCES departments(id),
    is_manager BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bewertungen
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id),
    criterion_id INTEGER REFERENCES criteria(id),
    partner_id INTEGER REFERENCES partners(id),
    rating_type VARCHAR(20) CHECK (rating_type IN ('importance', 'performance')),
    score INTEGER CHECK (score BETWEEN 1 AND 10),
    CONSTRAINT unique_vote UNIQUE (participant_id, criterion_id, partner_id, rating_type)
);

-- Indizes
CREATE INDEX idx_partner_active ON partners(active);
CREATE INDEX idx_survey_active ON surveys(is_active);
