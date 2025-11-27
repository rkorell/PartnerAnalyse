/*
  Datei: js/config.js
  Zweck: Zentrale Konfigurationsdatei für alle Magic Numbers und Schwellenwerte
  # Created: 27.11.2025, 14:30 - Centralized application constants (AP 6)
  # Modified: 27.11.2025, 14:50 - Changed to ES6 module export (AP 8)
*/

export const CONFIG = {
    // --- Konfiguration für den Analyse-Dashboard (score_analyse.js) ---
    ANALYSIS: {
        // Schwellenwert für die maximale Divergenz (Konflikt) zwischen Manager und Team.
        // Hartcodiert in score_analyse.js: 2.0
        CONFLICT_THRESHOLD: 2.0, 
    },
    
    // --- Konfiguration für den Eingabe-Wizard (app.js) ---
    WIZARD: {
        // Schwellenwerte für die Anzeige des Kommentar-Icons (Performance)
        // Hartcodiert in app.js: <= 3 ODER >= 8
        PERFORMANCE_COMMENT_THRESHOLD: {
            MIN: 3, 
            MAX: 8 
        },
        
        // Schwellenwerte für die Tooltips (Importance)
        // Hartcodiert in app.js: <= 2 ODER >= 8
        IMPORTANCE_TOOLTIP_THRESHOLD: {
            MIN: 2, 
            MAX: 8 
        },
        
        // NPS-Kategorisierung (Promoter, Detractor)
        NPS_RANGES: {
            // Wert für "Bitte wählen"
            NA_VALUE: -2 
        },
        
        // Frequenz-Werte (für Validierung)
        FREQUENCY_MAX: 4,
    }
};