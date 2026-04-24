# Cisco Partner Questionnaire Insight (CPQI)

**Version:** 1.2
**Datum:** 2026-02-16

> 📖 **Ausführliche Dokumentation:** [docs/cpqi_gesamtdoku.md](docs/cpqi_gesamtdoku.md) – Methodik, Kriterienkatalog, Scoring-Modell, Datenmodell

## 1. Einleitung & Methodik

### 1.1. Zielsetzung
Das System dient der Erhebung, Speicherung und Analyse von qualitativen Bewertungen der Cisco-Vertriebspartner im Public Sector. Ziel ist es, subjektive Einzelmeinungen in objektivierbare Kennzahlen zu überführen, historisch vergleichbar zu machen und Handlungsempfehlungen abzuleiten.

### 1.2. Methodischer Ansatz: Importance-Performance Analysis (IPA)
Das System basiert auf dem Modell der **Importance-Performance Analysis**. Die Leistung (*Performance*) eines Partners wird nicht isoliert betrachtet, sondern in Relation zur Wichtigkeit (*Importance*) des jeweiligen Kriteriums für den Bewerter gesetzt.

**Datenerhebung:**
* **Importance:** Der Teilnehmer gewichtet ca. 20 Kriterien nach ihrer Relevanz (Skala 1-5).
* **Performance:** Der Teilnehmer bewertet ausgewählte Partner anhand derselben Kriterien (Skala 1-5, optional).
* **Metadaten:** Zusätzlich werden **NPS** (Net Promoter Score), **Interaktionsfrequenz** und **Qualitative Kommentare** erhoben.

**Berechnungsziel (Scoring-Modell V2.3):**
Der finale "Score" eines Partners ist ein gewichteter Index:
$$Score = \sum (Performance_i - 3.0) \times ImportanceFaktor_i$$

**Importance-Faktoren:**
| Importance | Faktor |
|------------|--------|
| 5 | 12 |
| 4 | 7 |
| 3 | 4 |
| 2 | 2 |
| andere | 0 |

Zusätzlich werden Diskrepanzen in der Wahrnehmung zwischen Führungskräften (Manager) und operativen Mitarbeitern (Team) analysiert ("Conflict-Check", Schwellenwert > 2.0).

---

## 2. Systemarchitektur

Das System folgt einer schlanken **Client-Server-Architektur (LAPP-Stack)** auf einem Raspberry Pi.

### 2.1. Software Stack
* **Webserver:** Apache2 (Port 443/HTTPS) mit aktivierten Modulen `headers` und `rewrite` (.htaccess Support).
* **Datenbank:** PostgreSQL (Strikte Typisierung, JSON-Support, Rekursive Funktionen, Views).
* **Backend:** PHP 8.x (API-Layer) mit PDO.
* **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Cisco CI/CD Konformität).

### 2.2. UI-Layout (AP 50)

Beide Seiten (Wizard und Analyse) verwenden einen **Sticky Header** mit 3-Spalten-Layout: CPQI-Logo (links), Titel (Mitte), DSGVO-Icon (rechts). Das DSGVO-Icon öffnet ein Info-Modal mit Datenschutz-Zusammenfassung und PDF-Download-Link.

**Willkommensseite (AP 51):** Der Begrüßungstext betont die Anonymität als methodisches Prinzip. Drei Info-Tiles (Flexbox-Kacheln) neben der Überschrift verlinken auf Datenschutz-Modal, Security-Konzept (PDF) und CPQI-Gesamtdarstellung (PDF).

### 2.3. Sicherheitsarchitektur (Neu in v1.2)

> **Ausführliches Security-Konzept:** [docs/CPQI_Security_Konzept.md](docs/CPQI_Security_Konzept.md) – DSGVO-Rechtsrahmen, technische Maßnahmen, Fraud-Detection-Methodik mit Quellenverzeichnis.

Das System implementiert ein mehrschichtiges Sicherheitskonzept ("Defense in Depth"):
* **Server-Härtung:** `.htaccess` blockiert Zugriff auf Systemdateien (`.git`, `*.sql`, `README.md`) und setzt Security-Headers (`X-Frame-Options`, `X-Content-Type-Options`).
* **Zugriffsschutz:** Die Analyse-API ist passwortgeschützt. Ein globaler Schalter `USE_LOGIN` in `php/common.php` steuert dies.
* **Authentifizierung:** Session-basierter Login gegen eine gehashte Datenbank-Tabelle (`admin_users`).
* **CSRF-Schutz:** Öffentliche Formulare (`save_data.php`) sind durch dynamische Session-Tokens gegen externe Angriffe (Flooding) geschützt.
* **Datenbank:** Credentials liegen außerhalb des Webroots (`/etc/partneranalyse/db_connect.php`).
* **IP-Anonymisierung (AP 50):** Teilnehmer-IPs werden als SHA-256-Hash mit Salt gespeichert (Duplikat-Erkennung ohne Rückverfolgbarkeit). Der Salt liegt ebenfalls außerhalb des Webroots.
* **Apache-Logs:** IP-Adressen werden via Piped Logging anonymisiert (letztes Oktett → 0). Log-Retention: 7 Tage.
* **Fraud-Detection (AP 50):** Mehrstufige Qualitätssicherung im Analyse-Dashboard – IP-Duplikate (Severity 3), Straightlining (Severity 2), Extreme Scores (Severity 1). Methodische Grundlagen: Krosnick 1991, Leiner 2019, REAL-Framework (Lawlor 2021).

---

## 3. Modulbeschreibung

### 3.1. Erhebung (Wizard)
**Pfad:** `/var/www/html/index.html` + `js/app.js` (Controller: `js/wizard-controller.js`)

Ein 5-Schritte-Wizard zur Datenerfassung:
1.  **Persönliche Angaben:** Organisationszugehörigkeit (Hierarchie, siehe unten), Manager-Status. Die Erhebung ist anonym (Name/Email seit AP 44 ausgeblendet).
2.  **Wichtigkeits-Bewertung:** Festlegung der persönlichen Prioritäten (Pflicht).
3.  **Partner-Auswahl:** Selektion der zu bewertenden Firmen.
4.  **Partner-Bewertung (Detail):**
    * **Header:** Frequenz (1-4), NPS (0-10, optional), Genereller Kommentar.
    * **Kriterien:** Slider je Kriterium. Bei Extremwerten (1 oder 5) erscheint ein Icon (`📝`) für spezifische Kommentare.
    * **Features:** Lokale Datenspeicherung (`localStorage`) schützt vor Datenverlust bei Refresh (konfigurierbar in `js/config.js` via `USE_LOCAL_STORAGE`).
5.  **Abschluss:** Speicherung & Dankeseite.

**Abteilungs-Hierarchie (AP 50):** Die Organisationsstruktur umfasst bis zu 4 Ebenen. Die Root-Ebene (z.B. "Cisco Deutschland") wird als festes Text-Label angezeigt und gilt als gültige Vorauswahl. Drei kaskadierende Dropdowns (Organisation → Bereich → Team) erlauben eine optionale Verfeinerung. Gespeichert wird die feinste gewählte Ebene.

*Features:*
* **Test-Modus** (aktivierbar in DB), der Formulare automatisch mit Zufallsdaten befüllt.
* **Survey-Lifecycle:** Der Wizard prüft beim Laden `start_date` und `end_date` (EOB 18:00) der aktiven Survey. Außerhalb des Erhebungszeitraums wird ein Overlay mit freundlicher Meldung und Countdown angezeigt. Prüfung entfällt bei `test_mode` oder NULL-Datum.

### 3.2. Analyse (Dashboard)
**Pfad:** `/var/www/html/score_analyse.html` + `js/score_analyse.js`

Interaktives Dashboard für Auswertungen (Login erforderlich):
* **Filter:** Survey, Abteilung (rekursiv), Manager-Status, Mindest-Stichprobe (Köpfe).
* **Visualisierung:**
    * Ranking-Tabelle mit Heatmap-Balken.
    * **Insights-Spalte** mit Status-Icons:
        * `📣` **NPS:** Net Promoter Score Indikator.
        * `💬` **Kommentare:** Anzahl und Drill-Down (Allgemein vs. Spezifisch).
        * `⚠️` **Action:** Kritische Handlungsfelder (Imp ≥ 4 & Perf ≤ 2).
        * `⚡` **Divergenz:** Signifikante Abweichung (> 2.0) zwischen Manager- und Team-Bewertung.
* **Interaktion:** Klick auf Partner öffnet **IPA-Matrix** (Scatterplot). Klick auf Icons öffnet **Detail-Modal**.
* **Info-Modals:** Kontextsensitive Hilfetexte (aus `app_texts`-Tabelle) erreichbar über "i"-Beacons: Bilanz-Erklärung mit Archetypen (`analytic-mask`), Fraud-Detection-Workflow (`fraud-detection`), Datenschutz-Info (`dsgvo-info`).
* **Fraud-Detection:** Panel mit Qualitätsindikatoren pro Teilnehmer (Backend: `php/get_fraud_data.php`, DB-View: `view_survey_fraud`).
* **Export:** CSV-Export der gefilterten Daten.

### 3.4. Live-Counter
**Pfad:** `/var/www/html/cpqi_counter.html`

Öffentliche Seite (kein Login) zur Echtzeit-Übersicht der Teilnehmerzahlen:
* **Layout:** Cisco-Dunkelblau-Gradient (60% Mitte, 20% schwarz links/rechts), CPQI-Logo, Gesamtzahl als Badge.
* **Abteilungsbaum:** Vollständig aufgeklappt, non-interaktiv, mit aggregierten Teilnehmerzahlen pro Organisationseinheit.
* **Farbkodierung:** Rot (0), Orange (1-4), Gelb (5-14), Grün (15+).
* **Datenquelle:** `php/MagicMirrorModuleStats.php` (aktive Survey, keine Parameter nötig).
* **Auto-Refresh:** Alle 60 Sekunden.

### 3.3. Survey-Verwaltung (Admin)
**Pfad:** `/var/www/html/survey_admin.html` + `php/survey_admin.php`

Login-geschützte Verwaltungsseite für Surveys (gleiches Passwort wie Analyse):
* **Tabellarische Übersicht** aller Surveys mit Inline-Editing.
* **Editierbar:** Name, Start-/Enddatum (Date-Picker), Test-Modus (Checkbox).
* **Aktiv-Steuerung:** Radio-Buttons – genau eine Survey ist aktiv (atomarer Wechsel).
* **Neue Survey:** Anlage per Button (wird inaktiv und ohne Test-Modus erstellt).
* **Löschen:** Checkbox-Auswahl + Bestätigungsdialog mit Teilnehmerzahl-Warnung. CASCADE löscht alle zugehörigen Daten (participants, ratings, partner_feedback).
* **Teilnehmerzahl (n):** Zeigt pro Survey die Anzahl der Antworten an.

---

## 4. Datenmodell (PostgreSQL)

Das Schema ist normalisiert (3NF) und nutzt fortschrittliche DB-Features.

**Tabellen:**
* **`surveys`**: Kampagnen-Steuerung (inkl. `test_mode` Flag, `start_date`/`end_date` für Erhebungszeitraum).
* **`partners`**: Stammdaten der Firmen.
* **`criteria`**: Fragenkatalog.
* **`departments`**: Hierarchie-Baum (Adjacency List).
* **`participants`**: Bewerter (Manager-Status, IP-Adresse; Name/Email-Felder existieren, werden aber seit AP 44 nicht mehr erfasst).
* **`ratings`**: Die Einzelnoten (1-5 oder NULL) inkl. Kommentar.
* **`partner_feedback`**: Kopfdaten pro Partner-Interaktion (`nps_score`, `interaction_frequency`, `general_comment`).
* **`app_texts`**: Konfigurierbare Hilfetexte (HTML) für Info-Modals. Kategorien: `entry-mask`, `nps-explanation`, `dsgvo-info`, `analytic-mask`, `fraud-detection`.
* **`admin_users`**: Benutzerverwaltung für das Dashboard (Username, Password-Hash).

**Referentielle Integrität:**
* `participants → surveys`: ON DELETE CASCADE
* `ratings → participants`: ON DELETE CASCADE
* `partner_feedback → participants`: ON DELETE CASCADE

Löschen einer Survey entfernt automatisch alle zugehörigen Teilnehmer, Bewertungen und Feedback.

**Views & Funktionen (Architektur-Layer):**
* **Function `get_department_subtree(INT[])`**: Rekursive PL/pgSQL Funktion, um Abteilungsbäume effizient aufzulösen.
* **View `view_ratings_extended`**: Flache, denormalisierte Sicht auf Bewertungen für einfachere SQL-Abfragen im Backend.
* **View `view_survey_fraud`**: Fraud-Indikatoren pro Teilnehmer (IP-Duplikate, Straightlining, Extreme Scores) für das Analyse-Dashboard.

---

## 5. Installation & Setup

### 5.1. Systemvoraussetzungen
* Apache 2 mit aktivierten Modulen: `sudo a2enmod headers rewrite`
* PHP 8.x mit PDO_PGSQL Treiber.
* PostgreSQL 13+.

### 5.2. Datenbank initialisieren
Die Datenbank wird über SQL-Skripte initialisiert.

**Schritt 1: Struktur anlegen**
Erstellt Tabellen, Indizes, Views und Funktionen. Löscht vorhandene Daten!
```bash
psql -h localhost -U dein_user -d deine_db -f sql/1_create_schema.sql
```

**Schritt 2: Stammdaten importieren**
Lädt Partner, Kriterien und Hierarchie.
```bash
psql -h localhost -U dein_user -d deine_db -f sql/2_initial_data.sql
```

### 5.3. Admin-User anlegen
Für den Zugang zur Analyse muss initial ein Passwort gesetzt werden. Führen Sie dazu diesen Befehl auf der Konsole aus. Er fragt das Passwort ab, hasht es sicher und trägt es in die Datenbank ein:

```bash
php -r '$p=readline("Neues Admin-Passwort: "); $h=password_hash($p, PASSWORD_DEFAULT); system("psql -h localhost -U <db_user> -d <db_name> -c \"INSERT INTO admin_users (username, password_hash) VALUES ('\''admin'\'', '\''$h'\'') ON CONFLICT (username) DO UPDATE SET password_hash = '\''$h'\'';\""); echo "\nFertig.\n";'
```

### 5.4. Konfiguration
1.  **Datenbank:** Zugangsdaten in einer Konfigurationsdatei außerhalb des Webroots anlegen (Pfad in `DB_CONFIG_PATH` konfigurierbar).
2.  **App-Einstellungen:** Zentrale Steuerung in `php/common.php`:
    * `DB_CONFIG_PATH`: Pfad zur DB-Config.
    * `USE_LOGIN`: Login-Zwang aktivieren (`true`) oder deaktivieren (`false`).
3.  **Frontend-Einstellungen:** In `js/config.js` können Farben, Schwellenwerte und das LocalStorage-Verhalten (`USE_LOCAL_STORAGE`) konfiguriert werden.

```php
// Beispiel Inhalt php/common.php
<?php
define('DB_CONFIG_PATH', '/pfad/zur/db_connect.php');
define('USE_LOGIN', true);
?>
```
