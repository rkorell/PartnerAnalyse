/*
  Datei: js/utils.js
  Zweck: Allgemeine Hilfsfunktionen (XSS-Schutz, UI-Helper, Math)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 14:50 - Extracted utilities from app.js (AP 8)
  # Modified: 28.11.2025, 15:30 - AP 24: Added interpolateColor and toggleGlobalLoader
*/

import { CONFIG } from './config.js';

/**
 * Escapes HTML characters in a string to prevent Cross-Site Scripting (XSS) attacks.
 * @param {string} text The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Zeigt oder versteckt das globale Lade-Overlay mit Verzögerung.
 * @param {boolean} show - True zum Anzeigen, False zum Verstecken.
 */
export function toggleGlobalLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (!loader) return;

    if (show) {
        // Timeout setzen, um Flackern bei schnellen Requests zu vermeiden
        if (!loader._timeout) {
            loader._timeout = setTimeout(() => {
                loader.style.display = 'flex';
            }, CONFIG.UI.LOADER_DELAY_MS);
        }
    } else {
        // Sofort verstecken und Timeout löschen
        if (loader._timeout) {
            clearTimeout(loader._timeout);
            loader._timeout = null;
        }
        loader.style.display = 'none';
    }
}

/**
 * Interpoliert zwischen zwei Farben (RGB Arrays).
 * @param {number[]} c1 - Startfarbe [r, g, b]
 * @param {number[]} c2 - Endfarbe [r, g, b]
 * @param {number} t - Faktor (0.0 bis 1.0)
 * @returns {number[]} - Interpolierte Farbe [r, g, b]
 */
export function interpolateColor(c1, c2, t) {
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t)
    ];
}