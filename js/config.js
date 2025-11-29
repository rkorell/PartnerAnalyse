/*
  Datei: js/config.js
  Zweck: Zentrale Konfigurationsdatei für alle Magic Numbers und Schwellenwerte
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 14:30 - Centralized application constants (AP 6)
  # Modified: 27.11.2025, 14:50 - Changed to ES6 module export (AP 8)
  # Modified: 28.11.2025, 15:30 - AP 24: Added COLORS and UI constants for modularization
  # Modified: 28.11.2025, 17:00 - AP 27: Added USE_LOCAL_STORAGE switch
  # Modified: 29.11.2025, 20:10 - AP 32: Added ANALYSIS thresholds (Min Answers, Conflict) for validation phase
*/

export const CONFIG = {
    // --- Konfiguration für den Analyse-Dashboard (score_analyse.js) ---
    ANALYSIS: {
        // Schwellenwert für die maximale Divergenz (Konflikt) zwischen Manager und Team.
        CONFLICT_THRESHOLD: 2.0, 
        
        // Standard-Wert für den Slider "Mindestanzahl Antworten" beim Laden
        // Für Validierung auf 1 gesetzt (damit "Der Sanierungsfall" sichtbar ist)
        MIN_ANSWERS_DEFAULT: 1,

        // Mindestanzahl von Bewertern (pro Gruppe: Mgr/Team), damit ein Konflikt angezeigt wird
        // Für Validierung auf 1 gesetzt (damit "Der Konflikt" auch bei kleinen Datenmengen sichtbar ist)
        CONFLICT_MIN_ASSESSORS: 1,
    },
    
    // --- Konfiguration für den Eingabe-Wizard (app.js) ---
    WIZARD: {
        // Feature Flag für State-Persistenz (AP 27)
        USE_LOCAL_STORAGE: false, 

        // Schwellenwerte für die Anzeige des Kommentar-Icons (Performance)
        // Hartcodiert in app.js: <= 3 ODER >= 8
        PERFORMANCE_COMMENT_THRESHOLD: {
            MIN: 1, 
            MAX: 10 
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
    },

    // --- Farben (AP 24) ---
    COLORS: {
        // NPS Ampel
        NPS_DETRACTOR: '#e74c3c', // Rot
        NPS_PASSIVE_LOW: '#f39c12', // Orange
        NPS_PASSIVE_HIGH: '#f1c40f', // Gelb
        NPS_PROMOTER: '#2ecc71', // Grün

        // Score Heatmap (RGB Arrays für Interpolation)
        HEATMAP_LOW: [231, 76, 60],   // Rot
        HEATMAP_MID: [243, 156, 18],  // Orange
        HEATMAP_HIGH: [46, 204, 113], // Grün
    },

    // --- UI Konstanten (AP 24) ---
    UI: {
        MATRIX_SIZE: 400,
        LOADER_DELAY_MS: 300,
        RENDER_DELAY_MS: 10,
    }
};