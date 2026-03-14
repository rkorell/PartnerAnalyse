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
-- Stand: 2026-03-14
-- ============================================================================

-- 1. entry-mask (Wizard: Methodik & Zielsetzung)
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

-- 2. analytic-mask (Analyse: Lesehilfe & Methodik)
INSERT INTO app_texts (id, category, content) VALUES
(34, 'analytic-mask', $$<div class="help-content">
    <p style="text-align: center; font-style: italic;">
        Eine ausf&uuml;hrliche Anleitung zur Analyse findest Du im
        <a href="docs/CPQI_Analyse_Anleitung.pdf" target="_blank">Analyse-Leitfaden (PDF)</a>.
    </p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

    <h2 class="modal-headline">So liest Du die Partner-Bilanz (Diverging Bar Chart)</h2>

    <h3>Wichtig vorab: Gruppenkonsens</h3>
    <p>
        Diese Analyse zeigt nicht die Meinung eines Einzelnen, sondern den <strong>Gruppenkonsens</strong> &ndash;
        die kumulierte und gemittelte Gesamtbewertung aller Teilnehmer. Jeder Balken, jeder Score und jede
        Rangfolge basiert auf der aggregierten Einsch&auml;tzung der gesamten Befragungsgruppe. Damit bildet diese
        Darstellung ab, wie die Organisation als Ganzes die Zusammenarbeit mit ihren Partnern bewertet.
    </p>

    <h3>Das Prinzip: Belastung vs. Wertbeitrag</h3>
    <p>
        Anstatt eines einfachen Durchschnittswerts zeigt diese Grafik eine <strong>Bilanz</strong> der Zusammenarbeit.
        Sie stellt die Schw&auml;chen eines Partners (Belastung, links) direkt seinen St&auml;rken (Wertbeitrag, rechts) gegen&uuml;ber.
    </p>
    <p>Die Balken wachsen von der neutralen Mitte (0) in zwei Richtungen:</p>

    <div style="margin-bottom: 20px;">
        <h4 style="color: #e74c3c;">1. Der Rote Balken (Links): Das Strategische Defizit</h4>
        <ul>
            <li><strong>Was er zeigt:</strong> Die Summe aller negativen Leistungen, gewichtet nach der Wichtigkeit, die die Befragungsgruppe diesen Kriterien beimisst.</li>
            <li><strong>Bedeutung:</strong> Je l&auml;nger dieser Balken nach links reicht, desto mehr bremst der Partner die strategischen Ziele der Organisation (&bdquo;Liability&ldquo;).</li>
            <li><strong>Entstehung:</strong> Schwache Leistung (1&ndash;2) in Themen, die der Gruppe wichtig sind.</li>
        </ul>
    </div>

    <div style="margin-bottom: 20px;">
        <h4 style="color: #2ecc71;">2. Der Gr&uuml;ne Balken (Rechts): Der Strategische Wertbeitrag</h4>
        <ul>
            <li><strong>Was er zeigt:</strong> Die Summe aller positiven Leistungen, gewichtet nach der Wichtigkeit, die die Befragungsgruppe diesen Kriterien beimisst.</li>
            <li><strong>Bedeutung:</strong> Je l&auml;nger dieser Balken nach rechts reicht, desto mehr zahlt der Partner auf die strategischen Ziele der Organisation ein (&bdquo;Asset&ldquo;).</li>
            <li><strong>Entstehung:</strong> Starke Leistung (4&ndash;5) in Themen, die der Gruppe wichtig sind.</li>
        </ul>
    </div>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

    <h3>Die Zahl in Klammern: (Anzahl der Themen)</h3>
    <p>
        Neben jedem Balken steht eine Zahl, z.B. <code>(3)</code>. Sie zeigt, aus wie vielen einzelnen Kriterien
        sich der Balken zusammensetzt &ndash; und damit, wie <strong>breit oder fokussiert</strong> das Urteil der Gruppe ist:
    </p>
    <ul>
        <li><strong>Hohe Anzahl (z.B. 12):</strong> Die St&auml;rke oder Schw&auml;che zieht sich durch viele Bereiche der Zusammenarbeit &ndash; ein systematisches Muster.</li>
        <li><strong>Niedrige Anzahl (z.B. 3):</strong> Das Ergebnis konzentriert sich auf wenige spezifische Felder. Der Partner wird in einem begrenzten, aber klar definierten Bereich positiv oder negativ bewertet.</li>
    </ul>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

    <h3>F&uuml;nf Partner-Archetypen als Orientierung</h3>
    <ul style="list-style-type: none; padding-left: 0;">
        <li style="margin-bottom: 15px;">
            <strong>Der Solide</strong> <em>(Lang Gr&uuml;n / Kurz oder Kein Rot)</em><br>
            Das ist der Wunschpartner. Stark ausgepr&auml;gtes Gr&uuml;n &uuml;ber viele Kriterien hinweg bei wenig oder keinem Rot.
            Hoher Score, hohes Potenzial, hohe Loyalit&auml;t und Leistungsf&auml;higkeit. Dieser Partner zahlt breit und verl&auml;sslich
            auf die strategischen Ziele der Organisation ein. Die Zusammenarbeit funktioniert &ndash; und zwar nicht nur punktuell,
            sondern in der Fl&auml;che. Pflegen, wertsch&auml;tzen, ausbauen.
        </li>
        <li style="margin-bottom: 15px;">
            <strong>Der Spezialist</strong> <em>(Kurz bis Mittel Gr&uuml;n / Kein Rot)</em><br>
            Kein Fl&auml;chenspieler, aber dort, wo er antritt, ist er exzellent. Dieser Partner hat einige wenige Kriterien
            mit hoher Importance, in denen er herausragend abschneidet &ndash; und keine Schw&auml;chen. Typisch f&uuml;r
            technologiefokussierte Spezialistenpartner, die in ihrem Fachgebiet verl&auml;sslich Top-Leistung bringen.
            Der gr&uuml;ne Balken ist nicht der l&auml;ngste, aber er ist frei von rotem Gegengewicht. Ein wertvoller Partner
            in seinem Segment.
        </li>
        <li style="margin-bottom: 15px;">
            <strong>Der Stratege ohne Execution</strong> <em>(Lang Gr&uuml;n / Lang Rot)</em><br>
            Ein Partner mit zwei Gesichtern. Er liefert in wichtigen strategischen Feldern exzellente Ergebnisse &ndash;
            die gr&uuml;ne Seite ist beeindruckend. Gleichzeitig zeigt die ebenso ausgepr&auml;gte rote Seite, dass es im
            operativen Bereich erhebliche Schw&auml;chen gibt. Strategisch brillant, in der Umsetzung mit Defiziten.
            Die Handlungsempfehlung ist klar: Nicht trennen (daf&uuml;r ist das Gr&uuml;n zu wertvoll), sondern die spezifischen
            roten Blocker gezielt identifizieren und weg-managen.
        </li>
        <li style="margin-bottom: 15px;">
            <strong>Der Sanierungsfall</strong> <em>(Lang Rot / Kurz oder Kein Gr&uuml;n)</em><br>
            Dieser Partner verursacht deutlich mehr strategische Belastung, als er Wertbeitrag liefert. Die roten Balken
            dominieren, w&auml;hrend auf der gr&uuml;nen Seite wenig bis nichts zu finden ist. In den Bereichen, die der Gruppe
            wichtig sind, bleibt er systematisch hinter den Erwartungen zur&uuml;ck &ndash; nicht nur punktuell, sondern strukturell.
            Hier besteht akuter Handlungsbedarf: Ein strukturiertes Gespr&auml;ch &uuml;ber die Zusammenarbeit ist dringend angeraten,
            bevor sich die Defizite weiter verfestigen.
        </li>
        <li style="margin-bottom: 15px;">
            <strong>Der Konflikt</strong> <em>(Unterschiedliche Bewertung je nach Perspektive)</em><br>
            Dieser Archetyp f&auml;llt nicht durch die Balkenl&auml;nge auf, sondern durch eine <strong>Diskrepanz zwischen
            Management- und Team-Bewertung</strong>. Zwei Szenarien: (1)&nbsp;Das Management ist begeistert &ndash;
            der Partner macht einen tollen Job auf Entscheider-Ebene &ndash; aber das Team sagt: &bdquo;Der liefert nicht.&ldquo;
            (2)&nbsp;Umgekehrt: Das Team sch&auml;tzt die operative Zusammenarbeit, aber das Management sieht keinen strategischen
            Mehrwert. Der Konflikt wird am Divergenz-Symbol im Ranking sichtbar. Der Filter (Alle / Manager / Team)
            macht die unterschiedlichen Perspektiven transparent.
        </li>
    </ul>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="text-align: center; font-style: italic;">
        Eine ausf&uuml;hrliche Anleitung zur Analyse findest Du im
        <a href="docs/CPQI_Analyse_Anleitung.pdf" target="_blank">Analyse-Leitfaden (PDF)</a>.
    </p>
</div>$$);

-- 3. nps-explanation (Wizard: NPS-Erklärung, Schwellenwerte ≥7/≤4)
INSERT INTO app_texts (id, category, content) VALUES
(36, 'nps-explanation', $$<div class="info-content">
    <h3>Der Net Promoter Score (NPS)</h3>
    <p>
        Im Rahmen unserer Partnerbewertung stellen wir Dir eine zentrale Frage:
        <em>"Wie wahrscheinlich ist es, dass Du diesen Partner einem anderen Cisco-Kollegen weiterempfehlen würdest?"</em>
    </p>
    <p>
        Diese Frage liefert uns den <strong>NPS</strong>. Er ist ein weltweit etablierter Standard, um die Loyalität und die Qualität der Geschäftsbeziehung zu messen – er geht damit über eine reine Momentaufnahme der Zufriedenheit hinaus.
    </p>

    <h4>Die Einteilung der Antworten:</h4>
    <p>Deine Bewertung auf der Skala von 0 bis 10 klassifiziert den Partner in eine von drei Kategorien:</p>
    <ul>
        <li>
            <strong style="color: #2ecc71;">🟢 Promotoren (7 – 10):</strong>
            Diese Partner sind unsere strategischen "Fürsprecher". Sie sind hochgradig loyal, treiben gemeinsame Innovationen voran und empfehlen Cisco aktiv weiter.
        </li>
        <li>
            <strong style="color: #f1c40f;">🟡 Passive (5 – 6):</strong>
            Diese Gruppe verhält sich neutral. Sie sind zufrieden, aber nicht emotional an uns gebunden. Sie sind anfällig für Wettbewerbsangebote und treiben das Geschäft oft nur reaktiv voran.
        </li>
        <li>
            <strong style="color: #e74c3c;">🔴 Detraktoren (0 – 4):</strong>
            Hier liegt eine Störung in der Geschäftsbeziehung vor. Diese Kritiker sind unzufrieden, was unserem Ruf oder dem gemeinsamen Wachstum schaden kann. Hier besteht Handlungsbedarf.
        </li>
    </ul>

    <h4>Angepasste Schwellenwerte:</h4>
    <p>
        Die klassische NPS-Methodik nach Reichheld (2003) verwendet die Schwellenwerte ≥ 9 / ≤ 6,
        die aus der Endkunden-Zufriedenheitsmessung stammen. Im internen Kontext der Partner-Zusammenarbeit
        ist die Bewertungsskala erfahrungsgemäß moderater — eine 7 bedeutet hier bereits hohe Zufriedenheit,
        nicht bloße Neutralität. Die verschobenen Schwellenwerte (≥ 7 / ≤ 4) bilden die interne
        Bewertungskultur realistischer ab.
    </p>

    <h4>Die Berechnungsformel:</h4>
    <p>
        Der NPS ist kein einfacher Durchschnittswert. Er berechnet sich aus dem Verhältnis der positiven zu den negativen Stimmen. Die "Passiven" fließen nicht in den Wert ein.
    </p>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; font-weight: bold; border: 1px solid #ddd; color: #2c3e50;">
        NPS = (% Promotoren) — (% Detraktoren)
    </div>
    <p>
        Das Ergebnis ist eine Kennzahl zwischen <strong>-100</strong> (alle sind Kritiker) und <strong>+100</strong> (alle sind Promotoren). Ein Wert über 0 gilt als gut, Werte über +50 als exzellent.
    </p>

    <h4>Sinn und Zweck für den Quality Index:</h4>
    <p>
        Der NPS fungiert als unser strategisches <strong>Barometer</strong>. Während die Detail-Kriterien die operativen Fakten messen, quantifiziert der NPS das Vertrauen in die Partnerschaft.
    </p>
    <p>
        Ein hoher NPS identifiziert Partner, die als Multiplikatoren für unsere Strategie wirken. Ein niedriger NPS dient als Frühwarnsystem für strukturelle Konflikte, noch bevor diese in den Umsatzzahlen sichtbar werden.
    </p>
</div>$$);

-- 4. fraud-detection (Analyse: Fraud-Detection Erklärung)
INSERT INTO app_texts (id, category, content) VALUES
(37, 'fraud-detection', $$<div class="help-content">
    <h2 class="modal-headline">Survey-Fraud-Detection</h2>

    <p>Die Fraud-Detection identifiziert Bewertungen, die auf <strong>Manipulation</strong> oder <strong>nachlässiges Ausfüllen</strong> (Satisficing) hindeuten. Sie basiert auf drei Qualitätsindikatoren:</p>

    <h3>Severity 3 – IP-Duplikate <span style="color:#c0392b;">(starke Indikation)</span></h3>
    <p>Mehrere Bewertungen von derselben IP-Adresse innerhalb einer Survey. Dies kann auf Mehrfach-Abgaben durch dieselbe Person hindeuten. IP-Adressen werden nur als anonymisierter Hash gespeichert – eine Identifizierung der Person ist nicht möglich.</p>

    <h3>Severity 2 – Häufung identischer Bewertungen <span style="color:#e67e22;">(Verdacht)</span></h3>
    <p>Alle Kriterien wurden mit demselben Wert bewertet (z.B. durchgängig 5). In der Forschung als "Straightlining" bekannt – typisches Zeichen für fehlende inhaltliche Auseinandersetzung mit den Fragen.</p>

    <h3>Severity 1 – Extreme Scores <span style="color:#f1c40f;">(Hinweis)</span></h3>
    <p>Durchgängig Extremwerte (nur 1 oder nur 5) ohne weitere Auffälligkeiten. Kann legitim sein, ist aber prüfenswert.</p>

    <h3>So arbeitest Du mit der Fraud-Detection</h3>
    <p>Die Liste zeigt alle auffälligen Bewertungen, sortiert nach Schweregrad. IP-Duplikate erscheinen als Cluster – eine Zeile fasst alle Bewertungen derselben IP zusammen.</p>

    <p><em>Schritt 1 – Sichten:</em> Klappe die Liste auf und verschaffe Dir einen Überblick. Die Severity-Badges (rot / orange / gelb) zeigen die Gewichtung der Indikation.</p>

    <p><em>Schritt 2 – Bewerten:</em> Prüfe die Indikationen im Kontext. Ein Cluster mit 13 identischen Höchstbewertungen für denselben Partner wiegt anders als zwei Bewertungen von derselben IP mit unterschiedlichen Profilen.</p>

    <p><em>Schritt 3 – Ausschließen:</em> Markiere die Bewertungen, die Du aus der Analyse herausnehmen möchtest, per Checkbox. Der Button zeigt die Anzahl der betroffenen Bewertungen. Nach dem Ausschluss wird das Scoring automatisch neu berechnet.</p>

    <p><em>Schritt 4 – Ergebnis vergleichen:</em> Beobachte, wie sich das Ranking verändert. Verschiebt ein Partner mehrere Plätze, war der Einfluss der ausgeschlossenen Bewertungen signifikant – und der Ausschluss vermutlich berechtigt.</p>

    <p><em>Zurücksetzen:</em> Alle Ausschlüsse können jederzeit über "Ausschlüsse zurücksetzen" rückgängig gemacht werden. Nichts geht verloren.</p>

    <h3>Einordnung</h3>
    <p>Die Indikationen sind Hinweise, keine Urteile. Die Entscheidung über den Ausschluss liegt beim Analysten. Nicht jede Auffälligkeit ist Manipulation – aber jede verdient einen zweiten Blick.</p>
</div>$$);

-- 5. dsgvo-info (Beide Seiten: Datenschutz & Sicherheit)
INSERT INTO app_texts (id, category, content) VALUES
(38, 'dsgvo-info', $$<div class="help-content">
    <h2 class="modal-headline">Datenschutz &amp; Sicherheit</h2>

    <p>Die CPQI-Erhebung ist <strong>vollständig anonym</strong>. Es werden weder Name noch E-Mail-Adresse erfasst.</p>

    <h3>Was wird gespeichert?</h3>
    <ul>
        <li><strong>Deine Bewertungen</strong> (Skala 1-5) und optionale Kommentare</li>
        <li><strong>Abteilung und Rolle</strong> (Manager ja/nein) – für die Auswertung nach Gruppen</li>
        <li><strong>IP-Adresse</strong> – ausschließlich als anonymisierter Hash (SHA-256 mit Salt). Der Klartext wird nicht gespeichert und ist nicht rekonstruierbar.</li>
    </ul>

    <h3>Was wird <em>nicht</em> gespeichert?</h3>
    <ul>
        <li>Kein Name, keine E-Mail-Adresse</li>
        <li>Keine Cookies, kein Browser-Fingerprinting</li>
        <li>Keine Tracking-Daten</li>
    </ul>

    <h3>Wozu der IP-Hash?</h3>
    <p>Der anonymisierte Hash dient ausschließlich der Qualitätssicherung: Er ermöglicht die Erkennung von Mehrfach-Abgaben (Fraud-Detection), ohne dass Rückschlüsse auf einzelne Personen möglich sind.</p>

    <h3>Technische Maßnahmen</h3>
    <ul>
        <li>Verschlüsselte Übertragung (HTTPS/TLS)</li>
        <li>CSRF-Schutz gegen externe Angriffe</li>
        <li>Datenbank-Credentials und Salt außerhalb des Webroots</li>
        <li>Apache-Logs mit anonymisierter IP (letztes Oktett entfernt, 7 Tage Aufbewahrung)</li>
    </ul>

    <h3>Rechtsrahmen</h3>
    <p>Das Sicherheitskonzept orientiert sich an der <strong>DSGVO</strong> (Art. 5, 25, 32), den <strong>BSI-Richtlinien</strong> (TR-02102, APP.3.1) und den <strong>OWASP</strong>-Empfehlungen. Das vollständige Konzept mit Quellenverzeichnis steht als PDF zur Verfügung:</p>

    <p style="text-align: center; margin-top: 15px;">
        <a href="docs/CPQI_Security_Konzept.pdf" target="_blank" style="display: inline-block; padding: 10px 24px; background: #049fd9; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">📄 Security-Konzept (PDF)</a>
    </p>
</div>$$);

-- 6. csv-export (Analyse: Export-Spaltenreferenz)
INSERT INTO app_texts (id, category, content) VALUES
(39, 'csv-export', $$
<h3>CSV-Export — Datenformat</h3>
<p>Der Export enthält die <strong>denormalisierten Rohdaten</strong> der aktuellen Filterauswahl. Jede Zeile entspricht einer einzelnen Bewertung (Teilnehmer × Partner × Kriterium).</p>

<table style="width:100%; border-collapse:collapse; font-size:0.9em; margin:12px 0;">
<tr style="background:#2c3e50; color:white;"><th style="padding:6px 8px; text-align:left;">Spalte</th><th style="padding:6px 8px; text-align:left;">Bedeutung</th></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Teilnehmer_ID</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Anonyme laufende Nummer des Bewertenden</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Abteilung</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Zugehörige Abteilung</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Rolle_Manager_JN</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Ja = Manager, Nein = Team-Mitglied</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Partner</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Bewerteter Partner</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Partnergruppe</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Sortiergruppe (1 = Top-Partner)</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Kriterium</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Bewertetes Qualitätskriterium</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Kriterium_Nr</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Sortierung des Kriteriums</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Performance_Rohwert_1-5</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Bewertung: 1 (schlecht) bis 5 (sehr gut), leer = keine Aussage</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Interaktionshaeufigkeit_1-4</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">1 = selten bis 4 = sehr häufig</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Performance_x_Haeufigkeit</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Rohwert × Häufigkeit (für gewichteten Ø in Pivot)</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Importance_Mittelwert_1-5</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Durchschnittliche Wichtigkeit des Kriteriums (über alle Teilnehmer)</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Importance_Faktor_0-12</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Stufenmodell: Note 5→12, 4→7, 3→4, 2→2, sonst→0</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Impact_Faktor_x_Abweichung</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Importance_Faktor × (Rohwert − 3,0). Positiv = Stärke, negativ = Schwäche</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>NPS_Wert_0-10</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Net Promoter Score: ≥7 Promoter, ≤4 Detractor, 5-6 Passiv</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Kommentar_Kriterium</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Freitext zum einzelnen Kriterium</td></tr>
<tr><td style="padding:4px 8px; border-bottom:1px solid #eee;"><strong>Kommentar_Partner</strong></td><td style="padding:4px 8px; border-bottom:1px solid #eee;">Allgemeiner Freitext zum Partner</td></tr>
</table>

<h4>Gewichteter Durchschnitt in Excel Pivot</h4>
<p>Für den häufigkeitsgewichteten Performance-Durchschnitt:<br>
<code>= SUMME(Performance_x_Haeufigkeit) / SUMME(Interaktionshaeufigkeit_1-4)</code></p>

<h4>Score-Berechnung</h4>
<p>Der CPQI-Score pro Partner ergibt sich als Summe aller Impact-Werte:<br>
<code>Score = Σ Impact_Faktor_x_Abweichung</code></p>
$$);

SELECT setval('app_texts_id_seq', (SELECT MAX(id) FROM app_texts));
