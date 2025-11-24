# Cisco Partner Quality Index (CPQI)

**Version:** 1.0  
**Datum:** 23.11.2025

## 1. Einleitung & Methodik

### 1.1. Zielsetzung
Das System dient der Erhebung, Speicherung und Analyse von qualitativen Bewertungen der Cisco-Vertriebspartner. Ziel ist es, subjektive Einzelmeinungen in objektivierbare Kennzahlen zu überführen und historisch vergleichbar zu machen.

### 1.2. Methodischer Ansatz: Importance-Performance Analysis (IPA)
Das System basiert auf dem Modell der **Importance-Performance Analysis**. Die Leistung (*Performance*) eines Partners wird nicht isoliert betrachtet, sondern in Relation zur Wichtigkeit (*Importance*) des jeweiligen Kriteriums für den Bewerter gesetzt.

**Datenerhebung:**
* **Importance:** Der Teilnehmer gewichtet ca. 20 Kriterien nach ihrer Relevanz (Skala 1-10).
* **Performance:** Der Teilnehmer bewertet ausgewählte Partner anhand derselben Kriterien (Skala 1-10).

**Berechnungsziel:**
Der finale "Score" eines Partners ist ein gewichteter Index:
$$Score = \sum (Performance_i \times Importance_i)$$

### 1.3. Architektur-Evolution
Das System ersetzt eine manuelle, Excel-basierte Lösung.

**Vorteile der Neulösung:**
* Zentrale Datenhaltung (Single Source of Truth)
* Skalierbarkeit
* Flexible Hierarchien durch RDBMS
* Einfache Benutzeroberfläche via Web-Wizard

---

## 2. Systemarchitektur

Das System folgt einer schlanken **Client-Server-Architektur (LAPP-Stack)** auf einem Raspberry Pi.

### 2.1. Software Stack
* **Webserver:** Apache2 (Port 443/HTTPS)
* **Datenbank:** PostgreSQL (Gewählt wegen strikter Typisierung und besserer Performance bei analytischen Abfragen)
* **Backend:** PHP 8.x (API-Layer)
* **Frontend:** Vanilla JavaScript (ES6+), CSS3

---

## 3. Modulbeschreibung

### 3.1. Frontend (Client-Side)
**Pfad:** `/var/www/html/`

* **`index.html`**: Beinhaltet das HTML-Gerüst des Wizards, Checkbox für Führungsverantwortung und dynamischen Header.
* **`css/style.css`**: Steuert das Design (Cisco CI/CD Konformität).
* **`js/app.js`**:
    * *Core Logic:* Steuert den Ablauf des Wizards (Steps 1-5).
    * *Data Handling:* Lädt Konfiguration via fetch vom PHP-Backend (JSON).
    * *Unique ID Handling:* Trennt DOM-IDs (`imp_10`, `perf_10`) von Datenbank-IDs (`10`), um Konflikte zu vermeiden.
    * *Validation:* Prüft Pflichtfelder.

### 3.2. Backend (Server-Side API)
**Pfad:** `/var/www/html/php/`

* **`db_connect.php`**: Zentrale PDO-Verbindung zur PostgreSQL-Datenbank.
* **`get_data.php`**: Liest Stammdaten (Kriterien, Partner, Hierarchie) und liefert JSON für das Frontend.
* **`save_data.php`**: Empfängt Survey-Ergebnisse als JSON, nutzt Transaktionen (BEGIN/COMMIT) und speichert Teilnehmerdaten sowie Bewertungen.

---

## 4. Datenmodell (PostgreSQL)

Das Schema ist normalisiert (3NF) und auf Historisierung ausgelegt.

* **`surveys`**: Steuert Kampagnen (z.B. "Winter 2025"). Erlaubt Vergleichbarkeit über Zeiträume.
* **`partners`**: Stammdaten der zu bewertenden Firmen.
* **`criteria`**: Fragenkatalog. `sort_order` bestimmt die Reihenfolge im UI.
* **`departments`**: Hierarchie-Baum (Adjacency List Model mit `parent_id`).
* **`participants`**: Speichert den Bewerter (Name, Email, Abteilung, Manager-Status).
* **`ratings`**: Die Messwerte (Long-Format). Unterscheidung durch `rating_type` ('importance' vs 'performance').

---

## 5. Installation & Setup

Um die Datenbankstruktur und die Stammdaten (Partner, Kriterien) zu initialisieren, liegen SQL-Skripte im Ordner `sql/` bereit.

### Schritt 1: Struktur anlegen
Führt einen Reset der Datenbankstruktur durch und erstellt alle Tabellen.

```bash
psql -U dein_user -d deine_db -f sql/1_create_schema.sql
```
### Schritt 2: Stammdaten importieren
Befüllt die Tabellen mit Partnern, Kriterien und der Organisationshierarchie.

```bash
psql -U dein_user -d deine_db -f sql/2_initial_data.sql
```

