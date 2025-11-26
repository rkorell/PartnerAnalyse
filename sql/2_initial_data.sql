/* 2_initial_data.sql - Stammdaten (Partner, Kriterien, Hierarchie) */
/* # Modified: 26.11.2025, 22:45 - Added TRUNCATE for partner_feedback */

-- Tabellen leeren (Reihenfolge beachten wegen Foreign Keys!)
TRUNCATE TABLE partner_feedback CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE participants CASCADE;
TRUNCATE TABLE criteria CASCADE;
TRUNCATE TABLE partners CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE surveys CASCADE;

-- Survey
INSERT INTO surveys (name, start_date, is_active, test_mode) VALUES ('Partner Survey 2026', CURRENT_DATE, TRUE, FALSE);

-- Partner
INSERT INTO partners (name) VALUES 
('ATOS'), ('AVODAQ AG'), ('AXIANS'), ('BECHTLE'), ('CANCOM'),
('COMPUTACENTER PLC'), ('CONTROLWARE GMBH, KOMMUNIKATIONSSYSTEME'), ('DEUTSCHE TELEKOM'),
('DIMENSION DATA HOLDINGS PLC'), ('NETFOX AG'), ('SanData EDV Systemhaus GmbH'), ('SVA GmbH'),
('SWS COMPUTERSYSTEME AG'), ('SYSTEMA GESELLSCHAFT FUER ANGEWANDTE DATENTECHNIK MBH'), 
('UNISYS CORPORATION'), ('XEVIT GMBH');

-- Kriterien
INSERT INTO criteria (category, name, description, sort_order) VALUES
('I. Strategie, Innovation & Cisco 360 Alignment', '1. Strategisches Alignment & Cisco Mindshare', 'Bewertung, ob der Partner seine Firmenstrategie aktiv an Cisco ausrichtet oder ob Cisco nur "einer von vielen" Herstellern ist.', 10),
('I. Strategie, Innovation & Cisco 360 Alignment', '2. Investitionsbereitschaft & Zertifizierungen', 'Bewertung der Bereitschaft des Partners, vor einem konkreten Projekt in Wissen zu investieren.', 20),
('I. Strategie, Innovation & Cisco 360 Alignment', '3. Innovationskraft (KI, Automation, Programmability)', 'Der Markt wandelt sich von Hardware zu Software/Automatisierung.', 30),
('I. Strategie, Innovation & Cisco 360 Alignment', '4. Digitale Transformation & Cloud-Kompetenz', 'Bewertung der Fähigkeit, Kunden von klassischen On-Premise-Lösungen in hybride oder Cloud-Modelle zu begleiten.', 40),
('I. Strategie, Innovation & Cisco 360 Alignment', '5. Sustainability Engagement', 'Bewertung, wie aktiv der Partner Cisco-Nachhaltigkeitsprogramme nutzt.', 50),
('II. Vertriebs-Performance & Marktabdeckung', '6. Marktpräsenz & Channel-Abdeckung', 'Einschätzung der Sichtbarkeit des Partners im relevanten Marktsegment.', 60),
('II. Vertriebs-Performance & Marktabdeckung', '7. Cybersecurity-Kompetenz & -Fokus', 'Cybersecurity ist der Wachstumstreiber und im Public Sector oft K.O.-Kriterium.', 70),
('II. Vertriebs-Performance & Marktabdeckung', '8. Neukunden-Akquise & Hunting', 'Bewertung des Willens ("Hunger"), neue Dienststellen oder Behörden zu erschließen.', 80),
('II. Vertriebs-Performance & Marktabdeckung', '9. Bestandskunden-Engagement & Rahmenvertragsmanagement', 'Bewertung der Pflege bestehender Verträge und Rahmennverträge...', 90),
('II. Vertriebs-Performance & Marktabdeckung', '10. Pipeline-Qualität & Forecast-Treue', 'Bewertung der Zuverlässigkeit von vertrieblichen Aussagen...', 100),
('III. Public Sector Kompetenz', '11. Vergaberechtliche Kompetenz & Frameworks', 'Der Partner muss die juristischen Spielregeln und Frameworks beherrschen...', 110),
('III. Public Sector Kompetenz', '12. Vertikalisierung & Fach-Spezialisierung', 'Wir bewerten, ob der Partner die "Fachsprache" und Mission spezifischer Teilmärkte versteht...', 120),
('III. Public Sector Kompetenz', '13. Politisches Stakeholder-Management', 'Bewertung des Netzwerks des Partners...', 130),
('IV. Operational Excellence & Delivery', '14. Verlässlichkeit & Liefertreue', 'Bewertung der Verbindlichkeit von Aussagen zu Lieferterminen...', 140),
('IV. Operational Excellence & Delivery', '15. Reaktionsgeschwindigkeit & Agilität', 'Wie schnell kann der Partner agieren, wenn es brennt?', 150),
('IV. Operational Excellence & Delivery', '16. Operational Excellence (Booking & Backoffice)', 'Wir bewerten Fehlerfreiheit und Automatisierungsgrad.', 160),
('IV. Operational Excellence & Delivery', '17. Lifecycle & Services Integration (CX/AS)', 'Bewertung, ob der Partner über den reinen Produktverkauf hinausgeht...', 170),
('V. Zusammenarbeit & "Soft Factors"', '18. Proaktive & Transparente Kommunikation', 'Findet ein Austausch auch über "unangenehme" Themen statt?', 180),
('V. Zusammenarbeit & "Soft Factors"', '19. Customer Success & Adoption', 'Zentral für Cisco 360.', 190),
('V. Zusammenarbeit & "Soft Factors"', '20. "Ease of doing Business"', 'Subjektive Bewertung der "Chemie".', 200);

-- Hierarchie (Ebene 1)
INSERT INTO departments (name, level_depth, parent_id) VALUES ('Public', 1, NULL);

-- Ebene 2 (basierend auf Public ID)
DO $$ 
DECLARE public_id INT;
BEGIN 
    SELECT id INTO public_id FROM departments WHERE name = 'Public';
    INSERT INTO departments (name, level_depth, parent_id) VALUES 
    ('Federal', 2, public_id), 
    ('Healthcare', 2, public_id), 
    ('SLED', 2, public_id);
END $$;

-- Ebene 3 (Federal)
DO $$ 
DECLARE fed_id INT;
BEGIN 
    SELECT id INTO fed_id FROM departments WHERE name = 'Federal';
    INSERT INTO departments (name, level_depth, parent_id) VALUES 
    ('Defense', 3, fed_id), 
    ('Sovereignity&Nat Security', 3, fed_id), 
    ('Fed. Services&Multicloud', 3, fed_id);
END $$;

-- Ebene 3 (SLED)
DO $$ 
DECLARE sled_id INT;
BEGIN 
    SELECT id INTO sled_id FROM departments WHERE name = 'SLED';
    INSERT INTO departments (name, level_depth, parent_id) VALUES 
    ('SLED-Mitte', 3, sled_id), 
    ('SLED-South', 3, sled_id), 
    ('SLED-NW', 3, sled_id);
END $$;