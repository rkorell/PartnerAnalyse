/*
  Datei: js/wizard-flow.js
  Zweck: Logik für Navigation, Validierung und Step-Flow
  # Created: 27.11.2025, 15:40 - Extracted Flow and Validation Logic from wizard-controller.js (AP 10)
  # Modified: 27.11.2025, 15:50 - Minor update to use explicit callbacks (AP 10 Deep Refactoring)
*/

import { CONFIG } from './config.js';

export class WizardFlow {
    constructor(state, callbacks) {
        this.state = state; // Zugriff auf currentStep, selectedPartners, etc.
        this.callbacks = callbacks; // Funktionen zum Steuern des Controllers (showError, setImportance, etc.)
    }

    previousStep() {
        if (this.state.currentStep > 1) {
            this.callbacks.setCurrentStep(this.state.currentStep - 1);
            this.callbacks.showStep(this.state.currentStep);
            this.callbacks.updateProgress();
            this.callbacks.updateNavigationButtons();
            
            // Sonderfall: Wenn von Step 4 zurück zu Step 3
            if (this.state.currentStep === 3) {
                // Partner-View-Container leeren, da der DOM beim Zurückgehen nicht gebraucht wird
                document.getElementById('partner-views-container').innerHTML = '';
            }
        }
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;
        
        if (this.state.currentStep < this.state.totalSteps) {
            this.callbacks.setCurrentStep(this.state.currentStep + 1);
            this.callbacks.showStep(this.state.currentStep);
            this.callbacks.updateProgress();
            this.callbacks.updateNavigationButtons();
            
            // Sonderfall: Vorbereitung für Step 4
            if (this.state.currentStep === 4) {
                this.callbacks.setupPerformanceEvaluation();
            }
        }
    }

    previousPartner() {
        if (this.validatePartnerStep()) {
            if (this.state.currentPartnerIndex > 0) {
                this.callbacks.showPartnerEvaluationPage(this.state.currentPartnerIndex - 1);
            }
        }
    }

    nextPartner() {
        if (this.validatePartnerStep()) {
            if (this.state.currentPartnerIndex < this.state.selectedPartners.length - 1) {
                this.callbacks.showPartnerEvaluationPage(this.state.currentPartnerIndex + 1);
            }
        }
    }

    validatePartnerStep() {
        const currentPartner = this.state.selectedPartners[this.state.currentPartnerIndex];
        if (!currentPartner) {
            this.callbacks.showError("Interner Fehler: Partner-Daten fehlen.");
            return false;
        }
        
        const pid = currentPartner.id; 
        const fb = this.state.partnerFeedback[pid];
        
        // Frequenz muss > 0 sein
        if (!fb || !fb.frequency || fb.frequency === 0) {
            this.callbacks.showError(`Bitte gib für Partner ${currentPartner.name} an, wie häufig Du mit diesem Partner zusammenarbeitest.`);
            return false;
        }
        // NPS muss gewählt sein (nicht -2)
        if (fb.nps === undefined || fb.nps === CONFIG.WIZARD.NPS_RANGES.NA_VALUE) {
            this.callbacks.showError(`Bitte gib für Partner ${currentPartner.name} an, ob Du den Partner weiterempfehlen würdest.`);
            return false;
        }
        return true;
    }

    validateCurrentStep() {
        switch (this.state.currentStep) {
            case 1:
                const departmentEl = document.getElementById('department');
                const departmentId = departmentEl.value;
                const departmentName = departmentEl.options[departmentEl.selectedIndex].text;

                if (!departmentId) {
                    this.callbacks.showError('Bitte wähle eine Abteilung aus.');
                    return false;
                }
                
                this.callbacks.setPersonalData({
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    is_manager: document.getElementById('is_manager').checked,
                    department_id: departmentId,
                    department_name: departmentName,
                    final_dept_id: document.getElementById('team').value || document.getElementById('area').value || departmentId
                });
                return true;
                
            case 2:
                // Prüft auf 0
                const invalidImportance = Object.values(this.state.importanceData).some(val => val === 0);
                if (invalidImportance) {
                    this.callbacks.showError('Bitte gewichte ALLE Kriterien. Wähle einen Wert zwischen 1 und 10.');
                    return false;
                }
                return true;
                
            case 3:
                if (this.state.selectedPartners.length === 0) {
                    this.callbacks.showError('Bitte wähle mindestens einen Partner aus.');
                    return false;
                }
                return true;
            case 4:
                // Wenn man beim letzten Partner auf "Weiter" klickt, muss er validieren
                if (this.state.currentPartnerIndex === this.state.selectedPartners.length - 1) {
                    return this.validatePartnerStep();
                } else {
                    // Andernfalls einfach zum nächsten Partner gehen (wird in nextPartner() geprüft)
                    this.nextPartner(); 
                    return false; // Verhindert, dass der Wizard weitergeht
                }
                
            default:
                return true;
        }
    }
}