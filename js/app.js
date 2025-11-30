// Datei: /var/www/html/js/app.js
// created: November 21, 2025, 20:50 - Vollständiges JavaScript für Cisco Partner Quality Index Wizard erstellt
// # Modified: 22.11.2025, 14:45 - Umstellung auf DB-Backend, Fix Standardwerte, Header-Korrektur, Unique DOM IDs, Name/Email/Manager
// # Modified: 23.11.2025, 11:35 - Anpassung auf englische JSON-Keys (category, name, description)
// # Modified: 24.11.2025, 23:10 - Implemented Test-Mode, N/A Slider State (0), Importance Validation
// # Modified: 26.11.2025, 21:15 - Added Partner Header (Freq, NPS, GenComment) and Per-Criteria Comments
// # Modified: 27.11.2025, 10:15 - Changed GenComment to Textarea, Updated Placeholders
// # Modified: 27.11.2025, 13:00 - Added XSS protection (escapeHtml) for user inputs
// # Modified: 27.11.2025, 14:05 - DOM performance optimization (AP 5a): Pre-render all partner views, only toggle visibility. (INKLUSIVE bindEvents FIX)
// # Modified: 27.11.2025, 14:15 - FIX: Missing Submit button (Regression from AP 5a). Added missing updateNavigationButtons call.
// # Modified: 27.11.2025, 14:30 - Centralized configuration via config.js (AP 6)
// # Modified: 27.11.2025, 14:50 - Converted to ES6 module entry point (AP 8)
// # Modified: 30.11.2025, 10:04 - AP 38: Bound close event listeners for global info modal

/*
  
  Zweck: Einstiegspunkt und Initialisierung des Wizard-Controllers (Ersatz für die God-Class)
  # Modified: 27.11.2025, 14:50 - Converted to ES6 module entry point (AP 8)
*/

// Wichtig: Die Erweiterung .js am Ende des Imports ist für ES6-Module notwendig
import { WizardController } from './wizard-controller.js';

document.addEventListener('DOMContentLoaded', () => {
    // Macht die openInfoModal Funktion global verfügbar, da die HTML-Datei sie über onclick benötigt.
    // Die Logik ist im Controller, der Aufruf muss hier aber an window gehängt werden.
    window.openInfoModal = (category) => {
        if (window.wizardInstance) {
            window.wizardInstance.openInfoModal(category);
        }
    };
    
    // AP 38: Modal Close Event-Listener binden
    const infoModal = document.getElementById('global-info-modal');
    const closeInfoBtn = document.getElementById('close-info-modal');
    
    if(closeInfoBtn) {
        closeInfoBtn.addEventListener('click', () => { 
            if(infoModal) infoModal.style.display = 'none'; 
        });
    }
    
    if(infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.style.display = 'none';
        });
    }
    
    // Starte die Anwendung
    window.wizardInstance = new WizardController();
});