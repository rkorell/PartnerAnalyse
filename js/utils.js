/*
  Datei: js/utils.js
  Zweck: Allgemeine Hilfsfunktionen (XSS-Schutz)
  # Created: 27.11.2025, 14:50 - Extracted utilities from app.js (AP 8)
*/

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