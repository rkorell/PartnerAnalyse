# Cisco Partner Quality Index (CPQI)

**Version:** 1.2
**Datum:** 28.11.2025

> 📖 **Ausführliche Dokumentation:** [docs/cpqi_gesamtdoku.md](docs/cpqi_gesamtdoku.md) – Methodik, Kriterienkatalog, Scoring-Modell, Datenmodell

## 1. Einleitung & Methodik

### 1.1. Zielsetzung
Das System dient der Erhebung, Speicherung und Analyse von qualitativen Bewertungen der Cisco-Vertriebspartner im Public Sector. Ziel ist es, subjektive Einzelmeinungen in objektivierbare Kennzahlen zu überführen, historisch vergleichbar zu machen und Handlungsempfehlungen abzuleiten.

### 1.2. Methodischer Ansatz: Importance-Performance Analysis (IPA)
Das System basiert auf dem Modell der **Importance-Performance Analysis**. Die Leistung (*Performance*) eines Partners wird nicht isoliert betrachtet, sondern in Relation zur Wichtigkeit (*Importance*) des jeweiligen Kriteriums für den Bewerter gesetzt.

**Datenerhebung:**
* **Importance:** Der Teilnehmer gewichtet ca. 20 Kriterien nach ihrer Relevanz (Skala 1-10).
* **Performance:** Der Teilnehmer bewertet ausgewählte Partner anhand derselben Kriterien (Skala 1-10, optional).
* **Metadaten:** Zusätzlich werden **NPS** (Net Promoter Score), **Interaktionsfrequenz** und **Qualitative Kommentare** erhoben.

**Berechnungsziel:**
Der finale "Score" eines Partners ist ein gewichteter Index:
$$Score = \sum (Performance_i \times Importance_i)$$

Zusätzlich werden Diskrepanzen in der Wahrnehmung zwischen Führungskräften (Manager) und operativen Mitarbeitern (Team) analysiert ("Conflict-Check").

---

## 2. Systemarchitektur

Das System folgt einer schlanken **Client-Server-Architektur (LAPP-Stack)** auf einem Raspberry Pi.

### 2.1. Software Stack
* **Webserver:** Apache2 (Port 443/HTTPS) mit aktivierten Modulen `headers` und `rewrite` (.htaccess Support).
* **Datenbank:** PostgreSQL (Strikte Typisierung, JSON-Support, Rekursive Funktionen, Views).
* **Backend:** PHP 8.x (API-Layer) mit PDO.
* **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Cisco CI/CD Konformität).

### 2.2. Sicherheitsarchitektur (Neu in v1.2)
Das System implementiert ein mehrschichtiges Sicherheitskonzept ("Defense in Depth"):
* **Server-Härtung:** `.htaccess` blockiert Zugriff auf Systemdateien (`.git`, `*.sql`, `README.md`) und setzt Security-Headers (`X-Frame-Options`, `X-Content-Type-Options`).
* **Zugriffsschutz:** Die Analyse-API ist passwortgeschützt. Ein globaler Schalter `USE_LOGIN` in `php/common.php` steuert dies.
* **Authentifizierung:** Session-basierter Login gegen eine gehashte Datenbank-Tabelle (`admin_users`).
* **CSRF-Schutz:** Öffentliche Formulare (`save_data.php`) sind durch dynamische Session-Tokens gegen externe Angriffe (Flooding) geschützt.
* **Datenbank:** Credentials liegen außerhalb des Webroots (`/etc/partneranalyse/db_connect.php`).

---

## 3. Modulbeschreibung

### 3.1. Erhebung (Wizard)
**Pfad:** `/var/www/html/index.html` + `js/app.js` (Controller: `js/wizard-controller.js`)

Ein 5-Schritte-Wizard zur Datenerfassung:
1.  **Persönliche Angaben:** Name, Email, Abteilung (Hierarchie), Manager-Status.
2.  **Wichtigkeits-Bewertung:** Festlegung der persönlichen Prioritäten (Pflicht).
3.  **Partner-Auswahl:** Selektion der zu bewertenden Firmen.
4.  **Partner-Bewertung (Detail):**
    * **Header:** Frequenz (1-4), NPS (-2 bis 10), Genereller Kommentar.
    * **Kriterien:** Slider je Kriterium. Bei Extremwerten (≤3 oder ≥8) erscheint ein Icon (`📝`) für spezifische Kommentare.
    * **Features:** Lokale Datenspeicherung (`localStorage`) schützt vor Datenverlust bei Refresh (konfigurierbar in `js/config.js` via `USE_LOCAL_STORAGE`).
5.  **Abschluss:** Speicherung & Dankeseite.

*Feature:* **Test-Modus** (aktivierbar in DB), der Formulare automatisch mit Zufallsdaten befüllt.

### 3.2. Analyse (Dashboard)
**Pfad:** `/var/www/html/score_analyse.html` + `js/score_analyse.js`

Interaktives Dashboard für Auswertungen (Login erforderlich):
* **Filter:** Survey, Abteilung (rekursiv), Manager-Status, Mindest-Stichprobe (Köpfe).
* **Visualisierung:**
    * Ranking-Tabelle mit Heatmap-Balken.
    * **Insights-Spalte** mit Status-Icons:
        * `📣` **NPS:** Net Promoter Score Indikator.
        * `💬` **Kommentare:** Anzahl und Drill-Down (Allgemein vs. Spezifisch).
        * `⚠️` **Action:** Kritische Handlungsfelder (Imp ≥ 8 & Perf ≤ 5).
        * `⚡` **Divergenz:** Signifikante Abweichung (> 2.0) zwischen Manager- und Team-Bewertung.
* **Interaktion:** Klick auf Partner öffnet **IPA-Matrix** (Scatterplot). Klick auf Icons öffnet **Detail-Modal**.
* **Export:** CSV-Export der gefilterten Daten.

---

## 4. Datenmodell (PostgreSQL)

Das Schema ist normalisiert (3NF) und nutzt fortschrittliche DB-Features.

**Tabellen:**
* **`surveys`**: Kampagnen-Steuerung (inkl. `test_mode` Flag).
* **`partners`**: Stammdaten der Firmen.
* **`criteria`**: Fragenkatalog.
* **`departments`**: Hierarchie-Baum (Adjacency List).
* **`participants`**: Bewerter (Name, Email, Manager-Status, `session_token`).
* **`ratings`**: Die Einzelnoten (1-10 oder NULL) inkl. Kommentar.
* **`partner_feedback`**: Kopfdaten pro Partner-Interaktion (`nps_score`, `interaction_frequency`, `general_comment`).
* **`app_texts`**: Konfigurierbare Texte für Tooltips/Modals.
* **`admin_users`**: Benutzerverwaltung für das Dashboard (Username, Password-Hash).

**Views & Funktionen (Architektur-Layer):**
* **Function `get_department_subtree(INT[])`**: Rekursive PL/pgSQL Funktion, um Abteilungsbäume effizient aufzulösen.
* **View `view_ratings_extended`**: Flache, denormalisierte Sicht auf Bewertungen für einfachere SQL-Abfragen im Backend.

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
php -r '$p=readline("Neues Admin-Passwort: "); $h=password_hash($p, PASSWORD_DEFAULT); system("psql -h localhost -U admin_partner -d partner_analyse -c \"INSERT INTO admin_users (username, password_hash) VALUES ('\''admin'\'', '\''$h'\'') ON CONFLICT (username) DO UPDATE SET password_hash = '\''$h'\'';\""); echo "\nFertig.\n";'
```

### 5.4. Konfiguration
1.  **Datenbank:** Zugangsdaten in `/etc/partneranalyse/db_connect.php` anlegen.
2.  **App-Einstellungen:** Zentrale Steuerung in `php/common.php`:
    * `DB_CONFIG_PATH`: Pfad zur DB-Config.
    * `USE_LOGIN`: Login-Zwang aktivieren (`true`) oder deaktivieren (`false`).
3.  **Frontend-Einstellungen:** In `js/config.js` können Farben, Schwellenwerte und das LocalStorage-Verhalten (`USE_LOCAL_STORAGE`) konfiguriert werden.

```php
// Beispiel Inhalt php/common.php
<?php
define('DB_CONFIG_PATH', '/etc/partneranalyse/db_connect.php');
define('USE_LOGIN', true);
?>
```