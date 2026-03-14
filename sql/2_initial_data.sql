-- ============================================================================
-- CPQI - 2_initial_data.sql
-- Zweck: Initialdaten (Stammdaten) für alle Tabellen
-- Stand: 2026-03-14
-- ============================================================================

-- ============================================================================
-- KRITERIEN (24 Stück)
-- ============================================================================

-- Kategorie I: Strategie, Innovation & Cisco 360 Alignment (5 Kriterien)
INSERT INTO criteria (id, category, sort_order, name, description) VALUES
(1, 'I. Strategie, Innovation & Cisco 360 Alignment', 10,
 '1. Strategisches Alignment & Cisco Mindshare',
 'Richtet der Partner seine Firmenstrategie aktiv an Cisco aus oder ist Cisco nur "einer von vielen" Herstellern?'),

(2, 'I. Strategie, Innovation & Cisco 360 Alignment', 20,
 '2. Investitionsbereitschaft & Zertifizierungen',
 'Bewertung der Bereitschaft des Partners, vor einem konkreten Projekt in Wissen zu investieren. Cisco 360 belohnt Kompetenzaufbau und Zertifizierungen stärker als reinen Umsatz.'),

(3, 'I. Strategie, Innovation & Cisco 360 Alignment', 30,
 '3. Innovationskraft (KI, Automation, Programmability)',
 'Ist der Partner technologisch "vorne" und treibt moderne/innovative Themen oder verharrt er in reiner "Projekterfüllung"?'),

(4, 'I. Strategie, Innovation & Cisco 360 Alignment', 40,
 '4. Digitale Transformation & Cloud-Kompetenz',
 'Unterstützt der Partner aktiv die gemeinsamen Kunden bei ihrer digitalen Transformation und auf dem Weg in (hybride) Cloud-Modelle?'),

(5, 'I. Strategie, Innovation & Cisco 360 Alignment', 50,
 '5. Sustainability Engagement',
 'Wie aktiv nutzt der Partner eigene oder Cisco-Nachhaltigkeitsprogramme, um "Green IT" Initiativen und Regelwerke der gemeinsamen Kunden zu erfüllen?'),

-- Kategorie II: Vertriebs-Performance & Marktabdeckung (9 Kriterien)
(6, 'II. Vertriebs-Performance & Marktabdeckung', 60,
 '6. Marktpräsenz & Channel-Abdeckung',
 'Einschätzung der Sichtbarkeit des Partners im relevanten Marktsegment. Wird er von potenziellen Kunden als relevanter Player wahrgenommen? Deckt der Partner alle relevanten Vertriebskanäle ab?'),

(7, 'II. Vertriebs-Performance & Marktabdeckung', 70,
 '7. Cybersecurity-Kompetenz & -Fokus',
 'Cybersecurity ist einer der wichtigsten und größten Wachstumstreiber. Hat der Partner tiefes, eigenständiges Know-how und eine solide Vertriebsstrategie für diesen Bereich?'),

(8, 'II. Vertriebs-Performance & Marktabdeckung', 80,
 '8. Neukunden-Akquise & Hunting',
 'Bewertung des Willens ("Hunger"), neue Kunden zu erschließen, statt nur Bestandskunden zu verwalten.'),

(9, 'II. Vertriebs-Performance & Marktabdeckung', 90,
 '9. Bestandskunden-Engagement & Rahmenvertragsmanagement',
 'Bewertung der Pflege bestehender Verträge und Rahmenverträge. Werden Rahmenverträge voll ausgeschöpft? Werden Renewals rechtzeitig gesichert? Unterhält der Partner ein dediziertes Renewals-Team?'),

(10, 'II. Vertriebs-Performance & Marktabdeckung', 100,
 '10. Pipeline-Qualität & Forecast-Treue',
 'Ist Forecasting mit diesem Partner möglich und zuverlässig? Gibt es eine solide Pipeline?'),

(21, 'II. Vertriebs-Performance & Marktabdeckung', 101,
 '11. Cisco-Portfoliokenntnisse der Partner-Vertriebsteams',
 'Wie gut kennen die Account Manager des Partners das Cisco-Portfolio in seiner Breite? Erfolgt die Adressierung des Gesamtportfolios oder "nur" Networking?'),

(22, 'II. Vertriebs-Performance & Marktabdeckung', 102,
 '12. Verfügbarkeit von Pre-Sales-Ressourcen beim Partner',
 'Sind kompetente Pre-Sales-Ressourcen beim Partner vorhanden? Ist die Verfügbarkeit ausreichend (Auslastung)? Müssen Pre-Sales-Ressourcen bezahlt werden, bevor Umsatz fließt, oder sind sie vertrieblich kostenneutral?'),

(23, 'II. Vertriebs-Performance & Marktabdeckung', 103,
 '13. Dedizierter Personaleinsatz',
 'Einschätzung der Ressourcen-Allokation: Verfügt der Partner über fokussierte Teams für Deine vertriebliche Verantwortung oder teilen sich die Ansprechpartner auf unterschiedliche Kundensegmente (SMB, Enterprise, Public) auf?'),

(24, 'II. Vertriebs-Performance & Marktabdeckung', 104,
 '14. Partner Eco-System',
 'Wie breit ist das Eco-System des Partners? (bestehen Partnerschaften zu Dritt-Herstellern?  Kann hierüber Co-/Upselling realisiert werden?)'),

-- Kategorie III: Vertikale Kompetenz (3 Kriterien)
(11, 'III. Vertikale Kompetenz', 110,
 '15. Public: Vergaberecht',
 'Im Public Sector scheitern Projekte oft nicht an der Technik, sondern am Vergaberecht. Der Partner muss die Spielregeln beherrschen und im besten Fall in der Lage sein, Ausschreibungen mitzugestalten, bevor sie veröffentlicht werden. Teamplay mit Consultern?'),

(12, 'III. Vertikale Kompetenz', 120,
 '16. Vertikalisierung & Fach-Spezialisierung',
 'Kundensegmente sind sehr heterogen. Versteht der Partner die Fachsprache und Mission spezifischer Teilmärkte und hat Branchen-Know-How? - Oder sogar eigene, kundenzentrierte Fach- oder Branchen-Applikationen? - Gibt es dedizierte, vertikale Vertriebsteams?'),

(13, 'III. Vertikale Kompetenz', 130,
 '17. Stakeholder-Management',
 'Bewertung des Netzwerks des Partners. Hat er Zugang zu Entscheidern oberhalb der IT-Leitung (Public: Politik, Behördenleitung; Private: CxO?)?'),

-- Kategorie IV: Operational Excellence & Delivery (4 Kriterien)
(14, 'IV. Operational Excellence & Delivery', 140,
 '18. Verlässlichkeit & Liefertreue',
 'Basis-Hygiene-Faktor: Wie zuverlässig sind die Aussagen des Partners in Bezug auf Termine, Verfügbarkeiten und weitere Vereinbarungen?'),

(15, 'IV. Operational Excellence & Delivery', 150,
 '19. Reaktionsgeschwindigkeit & Agilität',
 'Bewertung der Flexibilität: Wie schnell kann der Partner agieren, wenn es brennt? Gibt es Lösungsvarianten oder immer "nur die eine Lösung" (haben wir immer so gemacht ...)?'),

(16, 'IV. Operational Excellence & Delivery', 160,
 '20. Operational Excellence (Booking & Backoffice)',
 'Wie ist die operative Qualität des Partners (Auftragsabwicklung, Kundenkommunikation, Rechnungslegung)? Termintreue? Fehlerquote?'),

(17, 'IV. Operational Excellence & Delivery', 170,
 '21. Lifecycle & Services Integration (CX)',
 'Ist der Partner bereit und in der Lage, Cisco Services (CX) als Mehrwert zu integrieren?'),

-- Kategorie V: Zusammenarbeit & "Soft Factors" (3 Kriterien)
(18, 'V. Zusammenarbeit & "Soft Factors"', 180,
 '22. Proaktive & Transparente Kommunikation',
 'Bewertung der Offenheit. Findet ein Austausch auch über "unangenehme" Themen statt? Besteht ein guter Austausch hinsichtlich der Governance? (Macht der Partner seine Ansprechpartner beim Kunden transparent, teilt er seine eigene Agenda und Account-Strategie offen mit uns?)'),

(19, 'V. Zusammenarbeit & "Soft Factors"', 190,
 '23. Customer Success & Adoption',
 'Fördert der Partner aktiv die Nutzung (Adoption) der Cisco-Lösungen beim Kunden?'),

(20, 'V. Zusammenarbeit & "Soft Factors"', 200,
 '24. "Ease of doing Business" (Persönliche Zusammenarbeit)',
 'Subjektive Bewertung der "Chemie". Gutes Zusammenpassen erleichtert das Tagesgeschäft und ggfs. erforderliche Konfliktlösungen deutlich.');

-- Sequence für criteria auf nächsten freien Wert setzen
SELECT setval('criteria_id_seq', (SELECT MAX(id) FROM criteria));

-- ============================================================================
-- PARTNER (27 Stück)
-- ============================================================================

INSERT INTO partners (name, be_geo_id, sortgroup, logo_file) VALUES
('Accenture', 71517, 3, 'accenture.png'),
('ACP', 52658, 2, 'acp.png'),
('Advanced Unibyte', 534900, 2, 'advancedunibyte.png'),
('Avodaq', 60985, 2, 'avodaq.png'),
('Axians', 17345, 2, 'axians.png'),
('Bechtle', 51590, 1, 'bechtle.png'),
('Cancom', 52777, 1, 'cancom.png'),
('Computacenter', 63917, 1, 'computacenter.png'),
('Conscia', 50058, 2, 'conscia.png'),
('Controlware', 55017, 1, 'controlware.png'),
('Damovo', 66698, 2, 'damovo.png'),
('Fundamental', 46304, 2, 'fundamental.png'),
('Infosys', 695680, 3, 'infosys.png'),
('Logicalis', 1865, 2, 'logicalis.png'),
('NTS', 657066, 2, 'nts.png'),
('NTT Data', 51524, 1, 'ntt.png'),
('Pandacom', 57342, 2, 'pandacom.png'),
('Scaltel', 50437, 2, 'scaltel.png'),
('SPIE', 57447, 3, 'spie.png'),
('SVA', 107667, 1, 'sva.png'),
('Systema', 52903, 2, 'systema.png'),
('Tata Communications', 497984, 3, 'tatacommunications.png'),
('Tata Consulting', 634901, 3, 'tataconsulting.png'),
('Tech Mahindra', 625805, 3, 'techmahindra.png'),
('Telekom', 51272, 1, 'telekom.png'),
('Telent', 35807, 2, 'telent.png'),
('Wipro', 606459, 3, 'wipro.svg');

-- ============================================================================
-- ABTEILUNGEN (12 Stück, hierarchisch)
-- ============================================================================

-- Root-Knoten zuerst (kein parent_id)
INSERT INTO departments (id, name, parent_id, display_order) VALUES (13, 'Cisco Deutschland', NULL, NULL);

-- Ebene 1: Bereiche
INSERT INTO departments (id, name, parent_id, display_order) VALUES (1, 'Public', 13, 10);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (11, 'CPSG', 13, 50);

-- Ebene 2: Segmente (unter Public)
INSERT INTO departments (id, name, parent_id, display_order) VALUES (2, 'Federal', 1, 20);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (4, 'SLED', 1, 30);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (3, 'Healthcare', 1, 40);

-- Ebene 3: Teams (unter Federal)
INSERT INTO departments (id, name, parent_id, display_order) VALUES (5, 'Defense', 2, NULL);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (6, 'Sovereignity', 2, NULL);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (7, 'Multicloud', 2, NULL);

-- Ebene 3: Teams (unter SLED)
INSERT INTO departments (id, name, parent_id, display_order) VALUES (8, 'SLED-Mitte', 4, NULL);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (9, 'SLED-South', 4, NULL);
INSERT INTO departments (id, name, parent_id, display_order) VALUES (10, 'SLED-NW', 4, NULL);

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- ============================================================================
-- ADMIN-BENUTZER (1 Stück)
-- ============================================================================

INSERT INTO admin_users (username, password_hash) VALUES
('admin', '$2y$10$Mt6MO0siK.p82Ra.ZJEpVOHMleL7SPljA7x6YP.mUXhoXdyPz51r.');

-- ============================================================================
-- SURVEYS (Vorlagen, ohne Erhebungsdaten)
-- ============================================================================

INSERT INTO surveys (id, name, is_active, test_mode, start_date, end_date, description) VALUES
(1, 'Demo-Survey (Archetypen)', false, false, NULL, NULL, NULL),
(2, 'Demo-Survey II', false, true, NULL, NULL, 'Test-Survey für Entwicklung'),
(5, 'Demo-Survey (Fraud)', false, false, '2026-02-14', '2026-12-31', 'AP 50: Fraud-Detection Testdaten');

SELECT setval('surveys_id_seq', (SELECT MAX(id) FROM surveys));

-- ============================================================================
-- APP_TEXTS (Info-Modals, 6 Stück)
-- ============================================================================

INSERT INTO app_texts (id, category, content) VALUES
(1, 'entry-mask', $$<h3>Methodik & Zielsetzung</h3>

<p>
    <strong>Warum diese Erhebung notwendig ist</strong><br>
    In der Zusammenarbeit mit Partnern entstehen oft subjektive Eindrücke, die in strategischen Gesprächen schwer als Argument dienen können.
    Ziel dieses Systems ist die Überführung von Einzelmeinungen in eine <strong>objektivierte, datenbasierte Gesamtsicht</strong>.
    Dies stärkt die Argumentationsposition und ermöglicht ein gezieltes Feedback, das vom Partner ernst genommen wird.
</p>

<p>
    <strong>Warum eine zweistufige Abfrage?</strong><br>
    Die Erhebung basiert auf der <strong>Importance-Performance Analysis (IPA)</strong>.
    Eine isolierte Betrachtung der Leistung (Performance) ist strategisch oft irreführend. Daher erfolgt die Bewertung in zwei getrennten Schritten:
</p>

<ul>
    <li>
        <strong>Gewichtung der Relevanz (Importance):</strong><br>
        Zunächst definierst Du, wie wichtig das Kriterium aktuell für den Erfolg im Public Sector ist.
    </li>
    <li>
        <strong>Bewertung der Leistung (Performance):</strong><br>
        Erst danach bewertest Du, wie gut der Partner diese Anforderung erfüllt.
    </li>
</ul>

<p>
    <strong>Das Ergebnis</strong><br>
    Durch diese Trennung entsteht kein einfacher Mittelwert, sondern ein <strong>gewichteter Qualitäts-Index</strong>.
    Er macht sichtbar, wo Ressourcen nicht optimal eingesetzt werden oder strategische Lücken bestehen.
</p>

<p>
    <strong>Unsere Bitte an Dich</strong><br>
    Diese Analyse ist nur so gut wie die Datenbasis. Bitte nimm Dir daher ausreichend Zeit, um die Kriterien sorgfältig durchzugehen und die Partner differenziert zu bewerten.
    Die Bearbeitungszeit beträgt in der Regel <strong>mindestens 15 Minuten</strong>. Wenn Du mehrere Partner bewerten möchtest, kann sich die benötigte Zeit entsprechend verlängern. Die investierte Zeit lohnt sich - Deine Einschätzung hat direkten Einfluss auf unsere Partner-Strategie.
</p>
<BR>
<p>
    Vielen Dank für Deine Unterstützung!
</p>
<BR>$$);

-- Hinweis: analytic-mask, nps-explanation, fraud-detection, dsgvo-info und csv-export
-- sind lange HTML-Texte. Sie werden über die Survey-Admin-Oberfläche oder direkt
-- in der Datenbank gepflegt. Die vollständigen Inhalte sind im pg_dump-Backup enthalten.
-- Für eine Neuinstallation müssen sie manuell aus dem Backup eingespielt werden.

SELECT setval('app_texts_id_seq', (SELECT MAX(id) FROM app_texts));
