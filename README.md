# Cisco Partner Quality Index (CPQI)

**Version:** 1.1  
**Datum:** 27.11.2025

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
* **Webserver:** Apache2 (Port 443/HTTPS)
* **Datenbank:** PostgreSQL (Strikte Typisierung, JSON-Support, komplexe Aggregationen)
* **Backend:** PHP 8.x (API-Layer)
* **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Cisco CI/CD Konformität)

---

## 3. Modulbeschreibung

### 3.1. Erhebung (Wizard)
**Pfad:** `/var/www/html/index.html` + `js/app.js`

Ein 5-Schritte-Wizard zur Datenerfassung:
1.  **Persönliche Angaben:** Name, Email, Abteilung (Hierarchie), Manager-Status.
2.  **Wichtigkeits-Bewertung:** Festlegung der persönlichen Prioritäten (Pflicht).
3.  **Partner-Auswahl:** Selektion der zu bewertenden Firmen.
4.  **Partner-Bewertung (Detail):**
    * **Header:** Frequenz (1-4), NPS (-2 bis 10), Genereller Kommentar.
    * **Kriterien:** Slider je Kriterium. Bei Extremwerten (≤3 oder ≥8) erscheint ein Icon (`📝`) für spezifische Kommentare.
    * **Validierung:** Pflichtfelder für Frequenz und NPS.
5.  **Abschluss:** Speicherung & Dankeseite.

*Feature:* **Test-Modus** (aktivierbar in DB), der Formulare automatisch mit Zufallsdaten befüllt.

### 3.2. Analyse (Dashboard)
**Pfad:** `/var/www/html/score_analyse.html` + `js/score_analyse.js`

Interaktives Dashboard für Auswertungen:
* **Filter:** Survey, Abteilung (rekursiv), Manager-Status, Mindest-Stichprobe (Köpfe).
* **Visualisierung:**
    * Ranking-Tabelle mit Heatmap-Balken.
    * **Insights-Spalte** mit Status-Icons:
        * `📣` **NPS:** Net Promoter Score Indikator.
        * `💬` **Kommentare:** Anzahl und Drill-Down (Allgemein vs. Spezifisch).
        * `⚠️` **Action:** Kritische Handlungsfelder (Imp ≥ 8 & Perf ≤ 5).
        * `⚡` **Divergenz:** Signifikante Abweichung (> 2.0) zwischen Manager- und Team-Bewertung.
* **Interaktion:** Klick auf Partner öffnet **IPA-Matrix** (Scatterplot). Klick auf Icons öffnet **Detail-Modal**.
* **Export:** CSV-Export der gefilterten Daten (Long-Format für Excel Pivot).


## 4. Datenmodell (PostgreSQL)

Das Schema ist normalisiert (3NF) und auf Historisierung ausgelegt.

* **`surveys`**: Kampagnen-Steuerung (inkl. `test_mode` Flag).
* **`partners`**: Stammdaten der Firmen.
* **`criteria`**: Fragenkatalog.
* **`departments`**: Hierarchie-Baum (Adjacency List).
* **`participants`**: Bewerter (Name, Email, Manager-Status).
* **`ratings`**: Die Einzelnoten (1-10 oder NULL).
    * Erweiterung: Spalte `comment` für kriterienbezogenes Feedback.
* **`partner_feedback`**: Neue Tabelle für Kopfdaten pro Partner-Interaktion.
    * Spalten: `nps_score`, `interaction_frequency`, `general_comment`.

---

## 5. Installation & Setup

Die Datenbank wird über SQL-Skripte initialisiert.

### Schritt 1: Struktur anlegen
Erstellt Tabellen, Constraints und Indizes. Achtung: Löscht vorhandene Daten!
```bash
psql -U dein_user -d deine_db -f sql/1_create_schema.sql
```

### Schritt 2: Stammdaten importieren
Lädt Partner, Kriterien und Hierarchie. Setzt Survey auf Test-Modus (Standard).
```bash
psql -U dein_user -d deine_db -f sql/2_initial_data.sql
```

### Schritt 3: Konfiguration
Datenbank-Zugangsdaten in php/db_connect.php anpassen.


```bash
$host = 'localhost';
$db   = 'partner_analyse';
$user = '...';
$pass = '...';
```


