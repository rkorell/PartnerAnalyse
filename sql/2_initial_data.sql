-- ============================================================================
-- CPQI - 2_initial_data.sql
-- Zweck: Initialdaten für Kriterien und Partner
-- Stand: 22.01.2026
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
-- PARTNER (20 Stück)
-- ============================================================================

INSERT INTO partners (name, be_geo_id) VALUES
('Avodaq', 60985),
('Axians', 17345),
('Bechtle', 51590),
('Cancom', 52777),
('Computacenter', 63917),
('Conscia', 50058),
('Controlware', 55017),
('Damovo', 66698),
('Telekom', 51272),
('Fundamental', 46304),
('Logicalis', 1865),
('NTS', 657066),
('NTT Data', 51524),
('Pandacom', 57342),
('Scaltel', 50437),
('SVA', 107667),
('SWS / ACP', 52658),
('Systema', 52903),
('Telent', 35807),
('Advanced Unibyte', 534900);
