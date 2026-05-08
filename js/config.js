/*
  Datei: js/config.js
  Zweck: Zentrale Konfigurationsdatei für alle Magic Numbers und Schwellenwerte
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 14:30 - Centralized application constants (AP 6)
  # Modified: 27.11.2025, 14:50 - Changed to ES6 module export (AP 8)
  # Modified: 28.11.2025, 15:30 - AP 24: Added COLORS and UI constants for modularization
  # Modified: 28.11.2025, 17:00 - AP 27: Added USE_LOCAL_STORAGE switch
  # Modified: 29.11.2025, 20:30 - AP 32: Configured Analysis thresholds (Min Answers Limit, Conflict)
  # Modified: 30.11.2025 - AP X: Adjusted thresholds for 1-5 scale, removed IMPORTANCE_TOOLTIP_THRESHOLD (fixed mapping now)
  # Modified: 02.12.2025, 17:30 - AP 43: Consolidated all Magic Numbers (NPS, Action-Item, Matrix, Slider-Tooltips)
  # Modified: 2026-03-02 - AP 56: Added AREA_COLORS for area distribution stacked bars
  # Modified: 2026-03-10 - AP 58: Added SORT_GROUP_NAMES for partner filter grouping
  # Modified: 2026-04-23 - AP 61: BIAS_THRESHOLD für systematische Manager/Team-Divergenz
  # Modified: 2026-04-23 - AP 61: Action-Item PERFORMANCE_MAX 2.0 → 2.2
  # Modified: 2026-04-25 - DISPLAY-Modus: RANKING_MODE, Balkenfarben, Matrix-Label-Farben konfigurierbar
  # Modified: 2026-05-08 11:20 - MATRIX_JITTER (Wert-Einheiten) → MATRIX_PIXEL_JITTER (2 px)
*/

export const CONFIG = {
    // --- Konfiguration für den Analyse-Dashboard (score_analyse.js) ---
    ANALYSIS: {
        // Schwellenwert für die maximale Divergenz (Konflikt) zwischen Manager und Team.
        CONFLICT_THRESHOLD: 2.0, 
        
        // Unteres Limit für den Slider "Mindestanzahl Antworten".
        MIN_ANSWERS_LIMIT: 1,

        // Mindestanzahl von Bewertern (pro Gruppe: Mgr/Team), damit ein Konflikt angezeigt wird
        CONFLICT_MIN_ASSESSORS: 1,

        // Schwellenwert für systematischen Manager/Team-Bias (Ø Abweichung über alle Kriterien)
        BIAS_THRESHOLD: 0.4,

        // NPS-Schwellenwerte für Farbkodierung
        NPS_THRESHOLDS: {
            PASSIVE_LOW_MAX: 30,   // 0-30: Rot/Orange
            PASSIVE_HIGH_MAX: 70,  // 31-70: Gelb
            // >70: Grün (Promoter)
        },

        // Action-Item-Schwellenwerte (Handlungsbedarf)
        ACTION_ITEM: {
            IMPORTANCE_MIN: 4.0,   // Wichtigkeit >= 4 (gerundet)
            PERFORMANCE_MAX: 2.2,  // Performance <= 2.2
        },
    },
    
    // --- Konfiguration für den Eingabe-Wizard (app.js) ---
    WIZARD: {
        // Feature Flag für State-Persistenz (AP 27)
        USE_LOCAL_STORAGE: false, 

        // Schwellenwerte für die Anzeige des Kommentar-Icons (Performance)
        PERFORMANCE_COMMENT_THRESHOLD: {
            MIN: 1, 
            MAX: 5 
        },
        
        // NPS-Kategorisierung (Promoter, Detractor)
        NPS_RANGES: {
            NA_VALUE: -2 
        },
        
        // Frequenz-Werte (für Validierung)
        FREQUENCY_MAX: 4,
    },

    // --- Farben (AP 24) ---
    COLORS: {
        // NPS Ampel
        NPS_DETRACTOR: '#e74c3c',
        NPS_PASSIVE_LOW: '#f39c12',
        NPS_PASSIVE_HIGH: '#f1c40f',
        NPS_PROMOTER: '#2ecc71',

        // Area Distribution Farben (kein Grün, kein Rot!)
        AREA_COLORS: [
            '#4682B4',  // Steel Blue
            '#E67E22',  // Orange
            '#1ABC9C',  // Teal
            '#8E44AD',  // Purple
            '#5C6BC0',  // Indigo
        ],

        // Score Heatmap (RGB Arrays für Interpolation)
        HEATMAP_LOW: [231, 76, 60],
        HEATMAP_MID: [243, 156, 18],
        HEATMAP_HIGH: [46, 204, 113],
    },

    // --- Partner-Sortiergruppen (AP 58) ---
    SORT_GROUP_NAMES: {
        1: 'Systemhäuser',
        2: 'Spezialisierte Partner',
        3: 'Global System Integrators',
    },

    // --- Branding ---
    BRANDING: {
        CPQI_LONG: 'Cisco Partner Questionnaire Insight',
    },

    // --- Darstellungsmodus ---
    DISPLAY: {
        // false = neutral (alphabetisch, Petrol/Blau), true = Ranking (nach Score, Rot/Grün)
        RANKING_MODE: false,

        // Balkenfarben je Modus
        BAR_COLORS: {
            neutral: { left: '#2c8c99', right: '#3498db' },   // Petrol / Blau
            ranking: { left: '#e74c3c', right: '#2ecc71' },   // Rot / Grün
        },

        // Gradient-Varianten der Balkenfarben
        BAR_GRADIENTS: {
            neutral: { left: 'linear-gradient(90deg, #1a6b75, #4db8c7)', right: 'linear-gradient(90deg, #3498db, #2980b9)' },
            ranking: { left: 'linear-gradient(90deg, #ef5350, #e57373)', right: 'linear-gradient(90deg, #66bb6a, #43a047)' },
        },

        // IPA-Matrix Label-Farben (Pastellversionen der Balkenfarben)
        MATRIX_LABEL_COLORS: {
            neutral: { potential: '#4db8c7', competence: '#5a9fd4' },
            ranking: { potential: '#e57373', competence: '#81c784' },
        },
    },

    // --- UI Konstanten (AP 24) ---
    UI: {
        MATRIX_SIZE: 400,
        LOADER_DELAY_MS: 300,
        RENDER_DELAY_MS: 10,

        // Matrix-Konfiguration (AP 43)
        MATRIX_PADDING: 50,
        MATRIX_VALUE_MIN: 0.8,
        MATRIX_VALUE_MAX: 5.2,
        MATRIX_PIXEL_JITTER: 2,   // Pixel-Jitter (vorher MATRIX_JITTER 0.15 in Wert-Einheiten)
    },

    // --- Slider-Tooltip-Texte (AP 43) ---
    SLIDER_TOOLTIPS: {
        IMPORTANCE: {
            0: 'Keine Angabe',
            1: '1 - Völlig unwichtig',
            2: '2 - Nicht so wichtig',
            3: '3 - Egal',
            4: '4 - Wichtiger',
            5: '5 - SEHR wichtig',
        },
        PERFORMANCE: {
            0: 'Keine Angabe',
            1: '1 - GAR nicht',
            2: '2 - Einigermaßen',
            3: '3 - OK',
            4: '4 - Gut',
            5: '5 - Sehr, sehr GUT',
        },
        FREQUENCY: {
            0: 'Bitte wählen...',
            1: 'Selten / Einmalig',
            2: 'Monatlich / Gelegentlich',
            3: 'Wöchentlich / Regelmäßig',
            4: 'Täglich / Intensiv',
        },
        NPS: {
            '-2': 'Bitte wählen...',
            '-1': 'Möchte ich nicht bewerten',
            '0': '0 - Auf keinen Fall',
            '1-3': '{value} - Eher nicht',
            '4-6': '{value} - Eher schon',
            '7-10': '{value} - Auf jeden Fall',
        },
    },
};