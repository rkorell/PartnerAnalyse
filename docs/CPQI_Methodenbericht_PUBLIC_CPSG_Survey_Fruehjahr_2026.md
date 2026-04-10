# CPQI Methodenbericht: PUBLIC & CPSG Survey Frühjahr 2026

**Stand:** 2026-04-10  
**Autor:** Dr. Ralf Korell, Client Executive Cisco Systems  
**Klassifikation:** Cisco-intern

---

## Management Summary

Der Cisco Partner Quality Index (CPQI) bewertet die Leistung von Cisco-Vertriebspartnern durch eine strukturierte Befragung der Cisco-Belegschaft. Die Methodik basiert auf der wissenschaftlich etablierten Importance-Performance-Analyse (IPA) nach Martilla & James (1977) und kombiniert qualitative Bewertungen über 24 Kriterien mit einem quantitativen Scoring-Modell.

Im Erhebungszeitraum Februar–April 2026 haben **98 Teilnehmerinnen und Teilnehmer** aus 10 Abteilungen **20 Partner** bewertet. Die Ergebnisse zeigen eine überwiegend positive Bewertungslandschaft mit klarer Differenzierung: Die Score-Spannweite reicht von +232 bis -305, wobei 16 von 20 Partnern im positiven Bereich liegen. Diese Verteilung ist methodisch erklärbar und spiegelt die tatsächliche Wahrnehmung der Belegschaft wider — nicht eine Schwäche des Modells.

Vier zentrale Validierungsergebnisse:

1. **Das Scoring-Modell differenziert korrekt** — sowohl positiv als auch negativ bewertete Partner werden mit angemessener Spreizung abgebildet.
2. **Die Importance-Messung ist relevant** — obwohl 23 von 24 Kriterien denselben Faktor erhalten, stabilisiert die empirische Bestätigung das Modell gegenüber arbiträren Gewichtungen.
3. **Manager und Team bewerten unterschiedlich** — das Modell bildet dies ab und ermöglicht gezielte Auswertungen.
4. **Die Datenqualität ist hoch** — 86% der Teilnahmen sind anomaliefrei; die automatisierte Fraud-Detection identifiziert und dokumentiert Auffälligkeiten transparent.

---

## 1. Methodik (Kurzabriss)

### 1.1 Grundlage: Importance-Performance-Analyse

Der CPQI basiert auf dem IPA-Framework (Martilla & James, 1977), das zwei unabhängige Dimensionen misst:

- **Importance:** Wie strategisch relevant ist ein Kriterium für Cisco? (Erhoben über alle Teilnehmer, partnerunabhängig)
- **Performance:** Wie gut erfüllt ein konkreter Partner dieses Kriterium? (Erhoben pro Partner, von den Teilnehmern, die diesen Partner kennen)

### 1.2 Scoring-Modell V2.3

Die Bewertungen werden über ein lineares Scoring-Modell zu einem Gesamtscore verdichtet:

```
Score = Σ (Performance_i − 3.0) × Importance-Faktor_i
```

Der Neutralwert 3.0 (Mitte der 5er-Skala) teilt jeden Beitrag in positiv (Performance > 3.0) und negativ (Performance < 3.0). Der Importance-Faktor verstärkt den Beitrag strategisch wichtiger Kriterien überproportional:

| Importance (gerundet) | Faktor |
|---|---|
| 5 (höchste Relevanz) | 12 |
| 4 | 7 |
| 3 | 4 |
| 2 | 2 |

Die vollständige Methodik ist in der [CPQI-Gesamtdokumentation](cpqi_gesamtdoku.md) beschrieben.

---

## 2. Erhebungs-Steckbrief

### 2.1 Rahmen

| Parameter | Wert |
|---|---|
| **Survey** | PUBLIC & CPSG Survey Frühjahr 2026 |
| **Erhebungszeitraum** | 17. Februar – 17. April 2026 |
| **Erste Teilnahme** | 23. Februar 2026 |
| **Letzte Teilnahme** | 10. April 2026 |
| **Teilnehmer gesamt** | 98 |
| **davon Manager** | 18 (18,4%) |
| **davon Team** | 80 (81,6%) |
| **Bewertete Partner** | 20 (von 21 im System) |
| **Bewertungskriterien** | 24 |

**Hinweis zur Datenbasis dieses Berichts:** Die folgende Analyse betrachtet bewusst **alle 20 bewerteten Partner ohne Mindestfilter**. Im operativen Dashboard wird standardmäßig ein konfigurierbarer Mindestantworten-Filter angewendet (Standard: 5 Bewerter), der die Auswertung auf statistisch belastbare Stichproben einschränkt — damit verbleiben 13 Partner. Dieser Bericht verzichtet auf den Filter, weil er die **Methode** validiert, nicht Ergebnisse präsentiert. Gerade die Edge-Cases — Partner mit sehr wenigen Bewertungen und entsprechend extremen Scores — sind für die Methodenvalidierung besonders aufschlussreich: Sie demonstrieren das Verhalten des Modells an den Rändern der Datenverteilung.

### 2.2 Teilnehmer nach Abteilung

| Abteilung | Teilnehmer | Manager | Team |
|---|---|---|---|
| SLED-South | 18 | 1 | 17 |
| CPSG | 15 | 4 | 11 |
| SLED-NW | 14 | 2 | 12 |
| SLED-Mitte | 11 | 1 | 10 |
| Healthcare | 10 | 0 | 10 |
| Public | 8 | 5 | 3 |
| Multicloud | 8 | 2 | 6 |
| Sovereignity | 6 | 1 | 5 |
| Defense | 4 | 0 | 4 |
| SLED / Federal / Cisco Dtl. | 4 | 2 | 2 |

Alle Abteilungen der PUBLIC- und CPSG-Organisation sind vertreten. Die Verteilung spiegelt die natürliche Organisationsstruktur wider: Die Bereichsleitungen (SLED, Federal) sind mit 1–2 Personen besetzt — das sind die Führungskräfte. Die Masse der Teilnehmer sitzt in den operativen Unterabteilungen.

### 2.3 Awareness und Bewertungstiefe

Nicht jeder Teilnehmer kennt jeden Partner. Die Teilnehmer bewerten nur Partner, mit denen sie tatsächlich zusammenarbeiten. Das ist methodisch gewollt: Bewertungen sollen auf Erfahrung basieren, nicht auf Hörensagen.

| Kennzahl | Wert |
|---|---|
| Partner pro Teilnehmer (Durchschnitt) | 3,0 |
| Partner pro Teilnehmer (Median) | 2 |
| Partner pro Teilnehmer (Maximum) | 11 |

Die fünf bekanntesten Partner (Computacenter, Telekom, Bechtle, SVA, NTT Data) werden von 26–50% der Teilnehmer bewertet. Spezialisierte Partner (Systema, Pandacom, Fundamental) haben naturgemäß weniger Bewerter (1–2), da sie nur in bestimmten Segmenten aktiv sind.

| Partner | Bewerter | Awareness |
|---|---|---|
| Computacenter | 49 | 50,0% |
| Telekom | 42 | 42,9% |
| Bechtle | 33 | 33,7% |
| SVA | 28 | 28,6% |
| NTT Data | 25 | 25,5% |
| Avodaq | 21 | 21,4% |
| Controlware | 17 | 17,3% |
| Cancom | 16 | 16,3% |
| NTS | 12 | 12,2% |
| ACP | 10 | 10,2% |
| *10 weitere Partner* | *1–9* | *1–9%* |

---

## 3. Datenqualität und Fraud-Detection

### 3.1 Automatisierte Anomalie-Erkennung

Jede Teilnahme wird automatisch auf Manipulationshinweise geprüft. Das System analysiert zwei unabhängige Indikatoren (vgl. Krosnick, 1991; Meade & Craig, 2012):

- **IP-Duplikate:** Mehrere Teilnahmen von derselben IP-Adresse *und* derselben Abteilung (verschiedene Abteilungen von derselben IP sind Infrastruktur-Artefakte, z.B. gemeinsames Büro-WLAN)
- **Straightlining:** ≥80% identische Bewertungen über alle Kriterien hinweg — ein etablierter Indikator für nachlässiges Ausfüllen (Leiner, 2019)

IP-Adressen werden ausschließlich als anonymisierter Hash (SHA-256 mit Salt) gespeichert. Eine Identifizierung der Person ist technisch nicht möglich.

### 3.2 Ergebnis

| Kategorie | Teilnahmen | Anteil |
|---|---|---|
| Unauffällig | 84 | 85,7% |
| Straightlining (ohne IP-Duplikat) | 5 | 5,1% |
| IP-Duplikat (gleiche Abteilung) | 8 | 8,2% |
| IP + Muster (stärkste Indikation) | 1 | 1,0% |

**85,7% der Teilnahmen sind vollständig anomaliefrei.** Die identifizierten Auffälligkeiten sind Hinweise, keine Urteile. Das Dashboard ermöglicht dem Analysten, einzelne Bewertungen gezielt auszuschließen und die Auswirkung auf das Ranking in Echtzeit zu beobachten. In der vorliegenden Auswertung wurden keine Teilnahmen ausgeschlossen — die Auffälligkeiten wurden geprüft und als nicht ergebnisrelevant eingestuft.

Das vollständige Sicherheitskonzept einschließlich Quellenverzeichnis ist im [CPQI Security-Konzept](CPQI_Security_Konzept.md) dokumentiert.

---

## 4. Ergebnisvalidierung

### 4.1 Score-Verteilung: Warum überwiegt Positives?

Die Gesamt-Score-Verteilung zeigt 16 Partner im positiven und 4 im negativen Bereich. Das wirft die Frage auf: **Ist das Modell zu optimistisch?**

Die Antwort liegt in den Rohdaten. Die Verteilung aller 6.096 Performance-Bewertungen:

| Score | Anzahl | Anteil | Semantik |
|---|---|---|---|
| 1 (sehr schlecht) | 282 | 4,6% | Deutlich negativ |
| 2 (schlecht) | 879 | 14,4% | Negativ |
| 3 (neutral) | 1.302 | 21,4% | Kein Beitrag zum Score |
| 4 (gut) | 2.125 | 34,9% | Positiv |
| 5 (sehr gut) | 1.508 | 24,7% | Deutlich positiv |

**59,6% aller Bewertungen liegen über dem Neutralwert**, nur 19,0% darunter. Der Gesamt-Durchschnitt beträgt **3,61** (Standardabweichung 1,14). Das Scoring-Modell bildet diese Verteilung korrekt ab — es erzeugt keine positive Verzerrung, es gibt sie wieder.

Drei Faktoren erklären die überwiegend positive Bewertung:

1. **Selection Bias:** Die bewerteten Partner sind etablierte Cisco-Vertriebspartner mit langjähriger Geschäftsbeziehung. Wirklich leistungsschwache Partner werden typischerweise nicht in eine Qualitätserhebung einbezogen.

2. **Acquiescence Bias:** In Likert-Skalen (1–5) tendieren Befragte systematisch zur positiven Seite. Dieses Phänomen ist in der Umfrageforschung gut dokumentiert (Krosnick, 1999) und kein Defizit des CPQI-Modells.

3. **Kontexteffekt:** Die Teilnehmer bewerten Partner, mit denen sie aktiv zusammenarbeiten und die sie *selbst ausgewählt* haben (Awareness-Prinzip). Diese Selbstselektion begünstigt tendenziell Partner, mit denen die Zusammenarbeit funktioniert.

**Entscheidend:** Wo Partner tatsächlich schlecht bewertet werden, schlägt das Modell massiv durch. Die vier Partner im negativen Bereich erreichen Scores von -65 bis -305 — das Modell ist symmetrisch und zeigt Defizite mit derselben Verstärkung wie Stärken.

### 4.2 Die Importance-Frage: Wozu messen, wenn fast alles Faktor 7 ist?

Die empirische Importance-Bewertung ergibt, dass 23 von 24 Kriterien auf den gerundeten Wert 4 (Faktor 7) fallen. Nur zwei Kriterien weichen ab:

| Kriterium | Ø Importance | Faktor |
|---|---|---|
| „Ease of doing Business" (K24) | 4,55 | **12** |
| „Sustainability Engagement" (K5) | 2,80 | **4** |
| *Alle anderen 22 Kriterien* | *3,61 – 4,49* | *7* |

Das könnte den Eindruck erwecken, die Importance-Erhebung sei überflüssig. Das Gegenteil ist der Fall:

**Erstens** bestätigt die Messung, dass die 24 Kriterien tatsächlich als relevant eingestuft werden. Wäre ein Kriterium irrelevant (Importance < 3), fiele es aus der Berechnung heraus. Diese empirische Bestätigung ist wertvoller als eine arbiträre Expertengewichtung.

**Zweitens** erzeugen die beiden Abweichungen reale Effekte. „Ease of doing Business" (Faktor 12 statt 7) verstärkt den Beitrag dieses Kriteriums um 71%. Bei einem Partner mit überdurchschnittlicher persönlicher Zusammenarbeit (+0,4 über Neutral) bedeutet das +4,8 statt +2,8 Punkte — ein messbarer Vorteil.

**Drittens** verifiziert eine Sensitivitätsanalyse die Robustheit: Was passiert, wenn man die empirischen Faktoren durch einen Einheitsfaktor 7 für alle Kriterien ersetzt?

| Partner | Score (empirisch) | Score (Einheitsfaktor) | Rang-Änderung |
|---|---|---|---|
| SVA | 207 | 202 | 0 |
| ACP | 184 | 176 | 0 |
| Computacenter | 153 | 145 | +2 |
| Systema | 152 | 147 | -2 |
| NTT Data | 145 | 138 | 0 |
| Bechtle | 32 | 30 | 0 |
| Conscia | -70 | -71 | 0 |
| SPIE | -267 | -263 | 0 |

**Das Ranking ist hochstabil** — maximale Verschiebung: 2 Plätze, und das nur im Mittelfeld. Die Importance-Erhebung liefert also keine dramatische Umgewichtung, aber sie **legitimiert** die Gewichtung empirisch statt spekulativ. Das ist für die Akzeptanz der Ergebnisse wesentlich.

### 4.3 Manager vs. Team: Unterschiedliche Perspektiven

Das Scoring-Modell gewichtet Manager- und Team-Bewertungen gleich. Ist das angemessen?

Die Daten zeigen, dass Manager und Team **teilweise erheblich** unterschiedlich bewerten. Bei 13 Partnern mit ausreichend Bewertungen aus beiden Gruppen beträgt die durchschnittliche Rang-Divergenz 4,5 Plätze, mit Ausreißern bis 9 Plätze:

| Partner | Rang (Gesamt) | Rang (Manager) | Rang (Team) | Divergenz |
|---|---|---|---|---|
| Advanced Unibyte | 7 | 14 | 5 | **9** |
| NTT Data | 6 | 1 | 9 | **8** |
| Axians | 13 | 8 | 15 | **7** |
| Conscia | 18 | 12 | 19 | **7** |

Diese Divergenz ist **kein Fehler**, sondern ein Feature: Manager und Team haben unterschiedliche Berührungspunkte mit Partnern. Manager bewerten strategische Aspekte (Alignment, Pipeline), Team-Mitglieder operative (Reaktionsgeschwindigkeit, Pre-Sales-Verfügbarkeit).

Die Gleichgewichtung ist bewusst gewählt:
- **Manager** bringen die strategische Perspektive ein (18% der Teilnehmer)
- **Team** bringt die operative Erfahrung ein (82% der Teilnehmer)
- Im Gesamtscore fließen beide proportional ein — das Team dominiert numerisch, aber die Manager-Perspektive ist im Dashboard separat abrufbar

Das Dashboard bietet explizite Filter für „nur Manager" und „nur Team", sodass beide Sichtweisen isoliert analysiert werden können. Die IPA-Matrix zeigt die Manager/Team-Divergenz pro Kriterium als Conflict-Indikator (Schwelle: 2,0 Punkte Abweichung).

### 4.4 NPS als unabhängige Gegenprobe

Neben dem kriterienbasierten Scoring erhebt der CPQI einen Net Promoter Score (NPS) pro Partner. Der NPS basiert auf einer einzigen Frage („Wie wahrscheinlich ist es, dass Sie diesen Partner einem Kollegen empfehlen?") und ist damit methodisch unabhängig vom Kriterien-Scoring.

Die Korrelation zwischen CPQI-Score und NPS bestätigt die Plausibilität:

| Partner | CPQI-Score | NPS |
|---|---|---|
| Computacenter | 159 | +82 |
| ACP | 190 | +80 |
| SVA | 232 | +75 |
| NTS | 169 | +67 |
| Bechtle | 43 | -24 |
| Conscia | -65 | -75 |

Partner mit hohem CPQI-Score haben durchweg positiven NPS; Partner mit niedrigem Score haben negativen NPS. Die beiden unabhängigen Metriken validieren sich gegenseitig.

### 4.5 Fehlende Normierung: Was bedeutet „Score 150"?

Der CPQI-Score ist ein absoluter Wert ohne externe Benchmark. Ein Score von 150 hat keine Bedeutung im Sinne von „gut" oder „schlecht" — er gewinnt seine Aussagekraft ausschließlich im **Vergleich** mit den anderen Partnern derselben Erhebung.

Das ist bewusst so: Eine externe Normierung (z.B. Branchendurchschnitt) würde eine Vergleichsbasis voraussetzen, die für Cisco-Vertriebspartner nicht existiert. Der CPQI ist ein **Ranking-Instrument**, kein Rating.

Was der Score aussagt:
- **Relativ:** Partner A (Score 232) wird deutlich besser bewertet als Partner B (Score 43)
- **Komponentenbasiert:** Der Score zerfällt in positiven und negativen Anteil — die Bilanz zeigt, ob ein Partner überwiegend Stärken oder Schwächen aufweist
- **Zeitlich vergleichbar:** Wenn dieselben Kriterien in Folgeerhebungen verwendet werden, ist ein Trend-Vergleich möglich

### 4.6 Awareness-Bias: Werden bekannte Partner bevorzugt?

Partner mit hoher Awareness (viele Bewerter) könnten durch die größere Stichprobe einen stabileren — und tendenziell mittleren — Score erhalten, während Partner mit wenigen Bewertungen extremere Werte zeigen.

Die Daten bestätigen diesen Effekt teilweise:

- Die vier Partner im negativen Bereich haben **1–8 Bewerter**
- Die Top-5 Partner haben **10–49 Bewerter**

Allerdings: Computacenter (49 Bewerter, Rang 8) liegt trotz der größten Stichprobe nicht an der Spitze. SVA (28 Bewerter, Rang 1) dominiert mit substantiellem Vorsprung. Die Stichprobengröße glättet Extremwerte, aber sie verhindert keine klare Differenzierung.

Für Partner mit sehr wenigen Bewertungen (< 5) empfiehlt sich grundsätzlich Vorsicht bei der Interpretation — nicht weil das Scoring fehlerhaft rechnet, sondern weil einzelne Bewertungen den Score überproportional beeinflussen. Ein einziger Teilnehmer, der durchgehend 1 vergibt, erzeugt bei einem Partner mit nur einem Bewerter einen Score von -305; derselbe Teilnehmer in einer Gruppe von 30 Bewertern verschiebt den Score um wenige Punkte.

Das Dashboard adressiert dieses Problem durch einen **konfigurierbaren Mindestantworten-Filter** (Standard: 5 Bewerter). Partner unterhalb der Schwelle werden ausgeblendet. Das Scoring selbst rechnet korrekt — aber die statistische Belastbarkeit steigt mit der Stichprobengröße. Der Filter ist eine bewusste Darstellungsentscheidung, keine Korrektur der Methodik. Er kann jederzeit angepasst werden, um auch Partner mit weniger Bewertungen einzubeziehen — mit dem Bewusstsein, dass die Ergebnisse dort stärker von Einzelmeinungen geprägt sind.

---

## 5. Kriterienkatalog: Validierung durch die Organisation

Die 24 Bewertungskriterien des CPQI wurden nicht am Reißbrett entworfen, sondern in einem strukturierten Prozess unter Beteiligung von über 100 Kolleginnen und Kollegen aus allen relevanten Abteilungen qualitätsgesichert. Der Katalog bildet die gesamte Breite der Partner-Interaktion ab — von strategischem Alignment über operative Exzellenz bis zur persönlichen Zusammenarbeit.

Die fünf Kategorien:

| Kategorie | Kriterien | Beispiele |
|---|---|---|
| Strategie, Innovation & Alignment | 5 | Cisco Mindshare, Investitionsbereitschaft, KI/Automation |
| Vertriebs-Performance & Markt | 9 | Neukunden-Akquise, Pipeline-Qualität, Pre-Sales |
| Vertikale Kompetenz | 3 | Vergaberecht, Vertikalisierung, Stakeholder-Mgmt |
| Operational Excellence & Delivery | 4 | Verlässlichkeit, Reaktionsgeschwindigkeit, CX |
| Zusammenarbeit & Soft Factors | 3 | Kommunikation, Customer Success, Ease of doing Business |

Die Kriterien decken das Cisco 360 Partner Value Index (PVI) Framework weitgehend ab und ergänzen es um Cisco-Deutschland-spezifische Aspekte (Vergaberecht, Vertikalisierung). Details in der [CPQI-Gesamtdokumentation](cpqi_gesamtdoku.md), Abschnitt 6 (Framework Cross-Check).

---

## 6. Limitationen

Jede Erhebungsmethodik hat Grenzen. Die folgenden sind bekannt und dokumentiert:

1. **Selbstselektion bei Awareness:** Teilnehmer bewerten nur Partner, die sie kennen. Partner mit geringer Sichtbarkeit werden von weniger Personen bewertet — ihre Scores sind anfälliger für Einzelmeinungen.

2. **Positive Antworttendenz:** Die durchschnittliche Performance-Bewertung liegt bei 3,61 (über dem Neutralwert 3,0). Das ist ein bekanntes Phänomen bei Likert-Skalen und kein Defizit des Modells.

3. **Keine externe Benchmark:** Der CPQI misst relativ, nicht absolut. Ein Score von 200 ist nicht „gut" — er ist besser als 100.

4. **Querschnitt, kein Längsschnitt:** Diese Erhebung ist eine Momentaufnahme. Trendaussagen sind erst mit Folgeerhebungen möglich.

---

## 7. Ausblick

Der CPQI ist als wiederkehrendes Instrument konzipiert. Aus der ersten Vollerhebung ergeben sich drei Entwicklungsperspektiven:

**Zeitlicher Vergleich:** Bei unverändertem Kriterienkatalog ermöglichen Folgeerhebungen eine Trendanalyse. Verändert sich die Bewertung eines Partners über die Zeit? Greifen getroffene Maßnahmen? Die Infrastruktur ist dafür vorbereitet — das Dashboard unterstützt Multi-Survey-Auswertungen.

**Erweiterung auf Enterprise und Commercial:** Die vorliegende Erhebung deckt die Bereiche PUBLIC und CPSG ab. Eine Ausweitung auf Enterprise und Commercial würde die Bewertungsbasis verbreitern und abteilungsübergreifende Vergleiche ermöglichen.

**Eigenbild/Fremdbild:** Eine ergänzende Erhebung, in der die Partner *sich selbst* anhand derselben Kriterien bewerten, würde eine Fremdbild/Eigenbild-Analyse ermöglichen. Diskrepanzen zwischen Cisco-Wahrnehmung und Partner-Selbsteinschätzung können gezielte Entwicklungsgespräche fundieren.

---

## Anhang A: Sensitivitätsanalyse — Einheitsfaktor vs. empirische Gewichtung

Die folgende Tabelle zeigt den vollständigen Ranking-Vergleich: Links das Scoring mit den empirisch erhobenen Importance-Faktoren (2/4/7/12), rechts ein hypothetisches Scoring mit Einheitsfaktor 7 für alle 24 Kriterien.

| Partner | Score (empirisch) | Rang | Score (Einheitsfaktor) | Rang | Δ Rang |
|---|---|---|---|---|---|
| SVA | 207,36 | 1 | 202,41 | 1 | 0 |
| Fundamental | 199,00 | 2 | 189,00 | 2 | 0 |
| ACP | 183,74 | 3 | 176,24 | 3 | 0 |
| Pandacom | 167,00 | 4 | 154,00 | 4 | 0 |
| Computacenter | 152,99 | 5 | 145,23 | 7 | +2 |
| Advanced Unibyte | 152,38 | 6 | 146,44 | 6 | 0 |
| Systema | 152,00 | 7 | 147,00 | 5 | -2 |
| NTS | 151,35 | 8 | 144,94 | 8 | 0 |
| NTT Data | 145,33 | 9 | 138,37 | 9 | 0 |
| Telekom | 91,88 | 10 | 88,56 | 10 | 0 |
| Controlware | 89,24 | 11 | 87,24 | 11 | 0 |
| Telent | 78,67 | 12 | 68,83 | 12 | 0 |
| Avodaq | 51,37 | 13 | 46,75 | 13 | 0 |
| Axians | 43,94 | 14 | 41,11 | 14 | 0 |
| Cancom | 40,03 | 15 | 38,51 | 15 | 0 |
| Bechtle | 32,46 | 16 | 29,99 | 16 | 0 |
| Conscia | -70,38 | 17 | -70,67 | 17 | 0 |
| Damovo | -124,00 | 18 | -119,00 | 18 | 0 |
| SPIE | -266,50 | 19 | -262,50 | 19 | 0 |
| Infosys | -305,00 | 20 | -301,00 | 20 | 0 |

**Ergebnis:** Maximale Rang-Verschiebung: 2 Plätze (Computacenter/Systema, Positionen 5–7). 18 von 20 Partnern behalten exakt denselben Rang. Das Ranking ist gegenüber der Importance-Gewichtung hochstabil.

---

*Methodische Referenzen: Martilla, J. A. & James, J. C. (1977). Importance-Performance Analysis. Journal of Marketing, 41(1), 77–79. · Krosnick, J. A. (1991). Response Strategies for Coping with the Cognitive Demands of Attitude Measures in Surveys. Applied Cognitive Psychology, 5(3), 213–236. · Krosnick, J. A. (1999). Survey Research. Annual Review of Psychology, 50, 537–567. · Meade, A. W. & Craig, S. B. (2012). Identifying Careless Responses in Survey Data. Psychological Methods, 17(3), 437–455. · Leiner, D. J. (2019). Too Fast, Too Straight, Too Weird: Non-Reactive Indicators for Meaningless Data in Internet Surveys. Survey Research Methods, 13(3), 229–248.*
