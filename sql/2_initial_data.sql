-- ============================================================================
-- CPQI - 2_initial_data.sql
-- Stand: 21.12.2025 - 24 Kriterien
-- ============================================================================

-- ============================================================================
-- KATEGORIEN
-- ============================================================================
INSERT INTO criteria_categories (id, name, sort_order) VALUES
(1, 'I. Strategie, Innovation & Cisco 360 Alignment', 10),
(2, 'II. Vertriebs-Performance & Marktabdeckung', 20),
(3, 'III. Vertikale Kompetenz', 30),
(4, 'IV. Operational Excellence & Delivery', 40),
(5, 'V. Zusammenarbeit & "Soft Factors"', 50);

-- ============================================================================
-- KRITERIEN (24 Stück)
-- ============================================================================

-- Kategorie I: Strategie, Innovation & Cisco 360 Alignment (5 Kriterien)
INSERT INTO criteria (id, category_id, name, description, sort_order) VALUES
(1, 1, 'Strategisches Alignment & Cisco Mindshare', 
 'Richtet der Partner seine Firmenstrategie aktiv an Cisco aus oder ist Cisco nur "einer von vielen" Herstellern?', 10),

(2, 1, 'Investitionsbereitschaft & Zertifizierungen', 
 'Bewertung der Bereitschaft des Partners, vor einem konkreten Projekt in Wissen zu investieren. Cisco 360 belohnt Kompetenzaufbau und Zertifizierungen stärker als reinen Umsatz.', 20),

(3, 1, 'Innovationskraft (KI, Automation, Programmability)', 
 'Ist der Partner technologisch "vorne" und treibt moderne/innovative Themen oder verharrt er in reiner "Projekterfüllung"?', 30),

(4, 1, 'Digitale Transformation & Cloud-Kompetenz', 
 'Unterstützt der Partner aktiv die gemeinsamen Kunden bei ihrer digitalen Transformation und auf dem Weg in (hybride) Cloud-Modelle?', 40),

(5, 1, 'Sustainability Engagement', 
 'Wie aktiv nutzt der Partner eigene oder Cisco-Nachhaltigkeitsprogramme, um "Green IT" Initiativen und Regelwerke der gemeinsamen Kunden zu erfüllen?', 50),

-- Kategorie II: Vertriebs-Performance & Marktabdeckung (9 Kriterien)
(6, 2, 'Marktpräsenz & Channel-Abdeckung', 
 'Einschätzung der Sichtbarkeit des Partners im relevanten Marktsegment. Wird er von potenziellen Kunden als relevanter Player wahrgenommen? Deckt der Partner alle relevanten Vertriebskanäle ab?', 100),

(7, 2, 'Cybersecurity-Kompetenz & -Fokus', 
 'Cybersecurity ist einer der wichtigsten und größten Wachstumstreiber. Hat der Partner tiefes, eigenständiges Know-how und eine solide Vertriebsstrategie für diesen Bereich?', 110),

(8, 2, 'Neukunden-Akquise & Hunting', 
 'Bewertung des Willens ("Hunger"), neue Kunden zu erschließen, statt nur Bestandskunden zu verwalten.', 120),

(9, 2, 'Bestandskunden-Engagement & Rahmenvertragsmanagement', 
 'Bewertung der Pflege bestehender Verträge und Rahmenverträge. Werden Rahmenverträge voll ausgeschöpft? Werden Renewals rechtzeitig gesichert? Unterhält der Partner ein dediziertes Renewals-Team?', 130),

(10, 2, 'Pipeline-Qualität & Forecast-Treue', 
 'Ist Forecasting mit diesem Partner möglich und zuverlässig? Gibt es eine solide Pipeline?', 140),

(11, 2, 'Cisco-Portfoliokenntnisse der Partner-Vertriebsteams', 
 'Wie gut kennen die Account Manager des Partners das Cisco-Portfolio in seiner Breite? Erfolgt die Adressierung des Gesamtportfolios oder "nur" Networking?', 150),

(12, 2, 'Verfügbarkeit von Pre-Sales-Ressourcen beim Partner', 
 'Sind kompetente Pre-Sales-Ressourcen beim Partner vorhanden? Ist die Verfügbarkeit ausreichend (Auslastung)? Müssen Pre-Sales-Ressourcen bezahlt werden, bevor Umsatz fließt, oder sind sie vertrieblich kostenneutral?', 160),

(13, 2, 'Dedizierter Personaleinsatz', 
 'Einschätzung der Ressourcen-Allokation: Verfügt der Partner über fokussierte Teams für Deine vertriebliche Verantwortung oder teilen sich die Ansprechpartner auf unterschiedliche Kundensegmente (SMB, Enterprise, Public) auf?', 170),

(14, 2, 'Partner Eco-System', 
 'Wie breit ist das Eco-System des Partners? (bestehen Partnerschaften zu Dritt-Herstellern? Kann hierüber Co-/Upselling realisiert werden?)', 180),

-- Kategorie III: Vertikale Kompetenz (3 Kriterien)
(15, 3, 'Public: Vergaberecht', 
 'Im Public Sector scheitern Projekte oft nicht an der Technik, sondern am Vergaberecht. Der Partner muss die Spielregeln beherrschen und im besten Fall in der Lage sein, Ausschreibungen mitzugestalten, bevor sie veröffentlicht werden. Teamplay mit Consultants?', 200),

(16, 3, 'Vertikalisierung & Fach-Spezialisierung', 
 'Kundensegmente sind sehr heterogen. Versteht der Partner die Fachsprache und Mission spezifischer Teilmärkte und hat Branchen-Know-how? - Oder sogar eigene, kundenzentrierte Fach- oder Branchen-Applikationen? - Gibt es dedizierte, vertikale Vertriebsteams?', 210),

(17, 3, 'Stakeholder-Management', 
 'Bewertung des Netzwerks des Partners. Hat er Zugang zu Entscheidern oberhalb der IT-Leitung (Public: Politik, Behördenleitung; Private: CxO?)?', 220),

-- Kategorie IV: Operational Excellence & Delivery (4 Kriterien)
(18, 4, 'Verlässlichkeit & Liefertreue', 
 'Basis-Hygiene-Faktor: Wie zuverlässig sind die Aussagen des Partners in Bezug auf Termine, Verfügbarkeiten und weitere Vereinbarungen?', 300),

(19, 4, 'Reaktionsgeschwindigkeit & Agilität', 
 'Bewertung der Flexibilität: Wie schnell kann der Partner agieren, wenn es brennt? Gibt es Lösungsvarianten oder immer "nur die eine Lösung" (haben wir immer so gemacht ...)?', 310),

(20, 4, 'Operational Excellence (Booking & Backoffice)', 
 'Wie ist die operative Qualität des Partners (Auftragsabwicklung, Kundenkommunikation, Rechnungslegung)? Termintreue? Fehlerquote?', 320),

(21, 4, 'Lifecycle & Services Integration (CX)', 
 'Ist der Partner bereit und in der Lage, Cisco Services (CX) als Mehrwert zu integrieren?', 330),

-- Kategorie V: Zusammenarbeit & "Soft Factors" (3 Kriterien)
(22, 5, 'Proaktive & Transparente Kommunikation', 
 'Bewertung der Offenheit. Findet ein Austausch auch über "unangenehme" Themen statt? Besteht ein guter Austausch hinsichtlich der Governance? (Macht der Partner seine Ansprechpartner beim Kunden transparent, teilt er seine eigene Agenda und Account-Strategie offen mit uns?)', 400),

(23, 5, 'Customer Success & Adoption', 
 'Fördert der Partner aktiv die Nutzung (Adoption) der Cisco-Lösungen beim Kunden?', 410),

(24, 5, '"Ease of doing Business" (Persönliche Zusammenarbeit)', 
 'Subjektive Bewertung der "Chemie". Gutes Zusammenpassen erleichtert das Tagesgeschäft und ggfs. erforderliche Konfliktlösungen deutlich.', 420);
