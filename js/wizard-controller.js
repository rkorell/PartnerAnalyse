/*
  Datei: js/wizard-controller.js
  Zweck: Kernlogik der Quality Index Datenerfassung (ehemals QualityIndexWizard in app.js)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 27.11.2025, 14:50 - Extracted core logic from app.js (AP 8)
  # Modified: 27.11.2025, 15:30 - Removed unused 'restorePartnerValues' method (Dead Code Cleanup - AP 9)
  # Modified: 27.11.2025, 15:40 - Refactored into DataView and WizardFlow modules (AP 10)
  # Modified: 27.11.2025, 15:45 - FIX: Regression: Test-Mode no longer selects hierarchy/partners (AP 10 Regression Fix)
  # Modified: 27.11.2025, 15:50 - Deep Refactoring: Moved all Slider/Input Handler Logic from Controller to DataView (AP 10 Deep Refactoring)
  # Modified: 28.11.2025, 13:00 - AP 21: Mapping logic CamelCase <-> SnakeCase for Backend
  # Modified: 28.11.2025, 15:30 - AP 24: Use central toggleGlobalLoader from utils
  # Modified: 28.11.2025, 16:30 - AP 26: Implemented dynamic button coloring (Blue=Active, Grey=Inactive)
*/

import { CONFIG } from './config.js';
import { escapeHtml, toggleGlobalLoader } from './utils.js';
import { DataView } from './wizard-data-view.js'; // NEU: Import DataView
import { WizardFlow } from './wizard-flow.js';   // NEU: Import WizardFlow

export class WizardController {
    constructor() {
        // --- STATE (Der Controller hält nur noch die Daten) ---
        this.currentStep = 1;
        this.totalSteps = 5;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
        
        this.surveyId = null;
        this.isTestMode = false;
        this.hierarchyData = [];
        this.criteriaData = [];
        this.partnerData = [];
        this.appTexts = {};
        this.importanceData = {};
        this.performanceData = {};
        this.partnerFeedback = {}; 
        this.personalData = {};

        // --- MODULE INSTANCES ---
        const callbacks = this._createCallbacks();
        this.flow = new WizardFlow(this, callbacks);
        this.view = new DataView(this, callbacks);
        
        this.init();
    }

    // --- CALLBACKS ZUR STEUERUNG DER MODULE ---
    _createCallbacks() {
        return {
            // General
            showError: (msg) => this.showError(msg),
            showStep: (step) => this.showStep(step),
            updateProgress: () => this.updateProgress(),
            updateNavigationButtons: () => this.updateNavigationButtons(),
            setupPerformanceEvaluation: () => this.setupPerformanceEvaluation(),
            showPartnerEvaluationPage: (idx) => this.showPartnerEvaluationPage(idx),
            getCurrentPartnerId: () => this.getCurrentPartnerId(),
            escapeHtml: escapeHtml, // Aus utils.js

            // Data Setter (Vom View aufgerufen, um den State zu aktualisieren)
            setCurrentStep: (step) => this.currentStep = step,
            setPersonalData: (data) => this.personalData = data,
            setImportance: (critId, value) => this.importanceData[critId] = value,
            setFeedback: (pId, type, value) => this._setPartnerFeedback(pId, type, value),
            setPerformance: (pId, critId, score, comment) => this._setPerformance(pId, critId, score, comment),
            
            // Event Binding wird direkt vom View ausgeführt
            bindSliderEvents: (type) => this.view.bindSliderEvents(type),
            bindCommentEvents: (pId) => this.view.bindCommentEvents(pId)
        };
    }
    
    // --- PRIVATE DATA SETTER (STATE LOGIC) ---
    _setPartnerFeedback(pId, type, value) {
        if(!this.partnerFeedback[pId]) this.partnerFeedback[pId] = {};
        this.partnerFeedback[pId][type] = value;
    }
    
    _setPerformance(pId, critId, score, comment) {
        if (!this.performanceData[pId]) this.performanceData[pId] = {};
        
        let current = this.performanceData[pId][critId];
        let currentComment = (current && typeof current === 'object') ? current.comment : '';
        let currentScore = (current && typeof current === 'object') ? current.score : 0;
        
        this.performanceData[pId][critId] = {
            score: (score !== undefined) ? score : currentScore,
            comment: (comment !== undefined) ? comment : currentComment,
        };
    }
    
    // --- INIT & CORE ---
    async init() {
        try {
            this.insertLogo();
            await this.loadConfigData();
            this.setupUI();
            
            if (this.isTestMode) {
                console.warn("ACHTUNG: Test-Mode aktiv!");
                this.prefillTestData();
            }

            this.bindEvents();
            this.updateProgress();
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            this.showError('Fehler beim Laden der Konfigurationsdaten: ' + error.message);
        }
    }
    
    setupUI() {
        this.setupHierarchyDropdowns();
        this.view.setupImportanceCriteria(); // DELEGIERT
        this.setupPartnerSelection();
        this.updateNavigationButtons();
    }

    // --- NAVIGATION DELEGIERT AN FLOW MODULE ---
    previousStep() { return this.flow.previousStep(); }
    nextStep() { return this.flow.nextStep(); }
    previousPartner() { return this.flow.previousPartner(); }
    nextPartner() { return this.flow.nextPartner(); }
    validateCurrentStep() { return this.flow.validateCurrentStep(); }
    validatePartnerStep() { return this.flow.validatePartnerStep(); }


    // --- EVENT BINDING & HANDLER ---
    bindEvents() {
        // Logik bleibt hier, da sie an this.flow delegiert:
        document.getElementById('prev-btn').addEventListener('click', () => this.flow.previousStep());
        document.getElementById('next-btn').addEventListener('click', () => this.flow.nextStep());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitSurvey());
        document.getElementById('restart-survey').addEventListener('click', () => this.restartSurvey());

        document.getElementById('prev-partner').addEventListener('click', () => this.flow.previousPartner());
        document.getElementById('next-partner').addEventListener('click', () => this.flow.nextPartner());
        document.getElementById('close-error').addEventListener('click', () => this.hideError());

        const modal = document.getElementById('global-info-modal');
        const closeBtn = document.getElementById('close-info-modal'); 
        const closeBtnClass = document.querySelector('.info-modal-close');
        
        if(closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        else if(closeBtnClass) closeBtnClass.addEventListener('click', () => { modal.style.display = 'none'; });

        if(modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
    
    // --- HIERARCHIE & PARTNER SELECTION (Bleibt hier wegen DOM/State-Nähe) ---
    setupHierarchyDropdowns() {
        const departmentSelect = document.getElementById('department');
        const departments = this.hierarchyData.filter(d => d.parent_id === null);
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id; 
            option.textContent = dept.name;
            departmentSelect.appendChild(option);
        });

        departmentSelect.addEventListener('change', () => {
            this.updateAreas();
            this.updateTeams();
        });

        document.getElementById('area').addEventListener('change', () => {
            this.updateTeams();
        });
    }

    updateAreas() {
        const departmentSelect = document.getElementById('department');
        const areaSelect = document.getElementById('area');
        const teamSelect = document.getElementById('team');
        
        areaSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        teamSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        
        const selectedDeptId = departmentSelect.value;
        if (!selectedDeptId) return;

        const areas = this.hierarchyData.filter(d => d.parent_id == selectedDeptId);

        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            areaSelect.appendChild(option);
        });
    }

    updateTeams() {
        const areaSelect = document.getElementById('area');
        const teamSelect = document.getElementById('team');
        
        teamSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        
        const selectedAreaId = areaSelect.value;
        
        if (!selectedAreaId) return;

        const teams = this.hierarchyData.filter(d => d.parent_id == selectedAreaId);

        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            teamSelect.appendChild(option);
        });
    }

    prefillTestData() {
        // Step 1: Personal Data
        document.getElementById('name').value = "Test User " + Math.floor(Math.random() * 1000);
        document.getElementById('email').value = "test@example.com";
        document.getElementById('is_manager').checked = Math.random() < 0.3; 

        // Step 1: Hierarchy Selection
        const leafs = this.hierarchyData.filter(d => d.level_depth === 3);
        if (leafs.length > 0) {
            const randomLeaf = leafs[Math.floor(Math.random() * leafs.length)];
            const level2 = this.hierarchyData.find(d => d.id === randomLeaf.parent_id);
            if (level2) {
                const level1 = this.hierarchyData.find(d => d.id === level2.parent_id);
                if (level1) {
                    const deptSelect = document.getElementById('department');
                    deptSelect.value = level1.id;
                    
                    this.updateAreas(); // Füllt Area-Dropdown
                    
                    const areaSelect = document.getElementById('area');
                    areaSelect.value = level2.id;
                    
                    this.updateTeams(); // Füllt Team-Dropdown
                    
                    const teamSelect = document.getElementById('team');
                    teamSelect.value = randomLeaf.id;
                    
                    teamSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }

    setupPartnerSelection() {
        const container = document.getElementById('partner-selection-container');
        container.innerHTML = ''; 
        
        this.partnerData.forEach((partner, index) => {
            const isSelected = this.isTestMode && Math.random() < 0.3; 

            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'partner-checkbox' + (isSelected ? ' selected' : '');
            
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="partner_${index}" value="${partner.id}" data-name="${escapeHtml(partner.name)}" ${isSelected ? 'checked' : ''}>
                <label for="partner_${index}">${escapeHtml(partner.name)}</label>
            `;
            
            const checkbox = checkboxDiv.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.updatePartnerSelection(); 
                if (checkbox.checked) {
                    checkboxDiv.classList.add('selected');
                } else {
                    checkboxDiv.classList.remove('selected');
                }
            });
            
            container.appendChild(checkboxDiv);
        });

        if (this.isTestMode) {
             this.updatePartnerSelection(); 

             if (this.selectedPartners.length === 0 && this.partnerData.length > 0) {
                 const firstBox = container.querySelector('input');
                 if(firstBox) {
                    firstBox.checked = true;
                    firstBox.dispatchEvent(new Event('change'));
                 }
             }
        }
    }

    updatePartnerSelection() {
        const checkboxes = document.querySelectorAll('#partner-selection-container input[type="checkbox"]');
        this.selectedPartners = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ({
                id: cb.value,
                name: cb.dataset.name 
            }));
        
        document.getElementById('selected-partners-count').textContent = this.selectedPartners.length;
        
        const nextBtn = document.getElementById('next-btn');
        if (this.currentStep === 3) {
            nextBtn.disabled = this.selectedPartners.length === 0;
        }
    }
    
    // --- EVALUATION & PARTNER FLOW ---
    setupPerformanceEvaluation() {
        const container = document.getElementById('partner-views-container');
        container.innerHTML = ''; 
        
        if (this.selectedPartners.length === 0) return;
        
        let allViewsHTML = '';
        this.selectedPartners.forEach(partner => {
            allViewsHTML += this.view.renderPartnerView(partner);
        });
        container.innerHTML = allViewsHTML;

        this.selectedPartners.forEach(partner => {
            this.view.bindSliderEvents('frequency');
            this.view.bindSliderEvents('nps');
            this.view.bindSliderEvents('performance');
            this.view.bindCommentEvents(partner.id); 
            
            // Listener für General Comment
            document.getElementById(`gen_comment_${partner.id}`).addEventListener('input', (e) => {
                // HIER GEÄNDERT (AP 21): CamelCase
                this.partnerFeedback[partner.id].generalComment = e.target.value;
            });
        });
        
        this.currentPartnerIndex = 0;
        this.showPartnerEvaluationPage(0);
    }

    showPartnerEvaluationPage(index) {
        document.querySelectorAll('#partner-views-container > div').forEach(view => {
            view.style.display = 'none';
        });

        const partner = this.selectedPartners[index];
        if (!partner) return;

        const currentView = document.getElementById(`partner-view-${partner.id}`);
        if (currentView) {
            currentView.style.display = 'block';
        }
        
        this.currentPartnerIndex = index;
        this.updatePartnerNavigation();
        this.updateNavigationButtons();
    }
    
    // --- HELPER & UTILITIES ---

    getCurrentPartnerId() {
        if (this.selectedPartners.length > 0 && this.currentPartnerIndex >= 0) {
            return this.selectedPartners[this.currentPartnerIndex].id;
        }
        return null;
    }
    
    // ... (updatePartnerNavigation, updateProgress, updateNavigationButtons, submitSurvey, etc.)
    
    // Hier nur die verbleibenden Methoden, die in der alten Klasse waren:

    insertLogo() {
        const header = document.querySelector('.header h1');
        if(header && !document.getElementById('cisco-logo')) {
            const img = document.createElement('img');
            img.src = 'img/cisco.png';
            img.id = 'cisco-logo';
            img.alt = 'Cisco Logo';
            img.style.height = '60px'; 
            img.style.marginRight = '20px';
            img.style.verticalAlign = 'middle';
            header.parentNode.insertBefore(img, header);
        }
    }

    async loadConfigData() {
        try {
            const response = await fetch('php/get_data.php');
            if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
            
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            if (Array.isArray(data.surveys) && data.surveys.length > 0) {
                this.surveyId = data.surveys[0].id;
                this.isTestMode = !!data.surveys[0].test_mode; 

                const subtitle = document.getElementById('survey-subtitle');
                if(subtitle && data.surveys[0].name) {
                    subtitle.textContent = data.surveys[0].name + (this.isTestMode ? " [TEST-MODE]" : "");
                }
            } else {
                this.surveyId = null;
                const subtitle = document.getElementById('survey-subtitle');
                if (subtitle) subtitle.textContent = "Kein aktives Survey gefunden";
            }

            this.hierarchyData = data.departments; 
            this.criteriaData = data.criteria; 
            this.partnerData = data.partners; 
            
            if (data.app_texts) {
                this.appTexts = data.app_texts;
            }

        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            this.showError('Fehler beim Laden der Konfigurationsdaten: ' + error.message);
        }
    }
    
    // AP 26: Dynamische Button-Klasse basierend auf 'enabled'
    _updateButtonState(button, isEnabled) {
        if (!button) return;
        button.disabled = !isEnabled;
        if (isEnabled) {
            button.classList.add('btn-primary');
            button.classList.remove('btn-secondary');
        } else {
            button.classList.add('btn-secondary');
            button.classList.remove('btn-primary');
        }
    }

    updatePartnerNavigation() {
        const totalPartners = this.selectedPartners.length;
        const currentNum = this.currentPartnerIndex + 1;
        
        document.getElementById('partner-progress').textContent = `Partner ${currentNum} von ${totalPartners}`;
        
        const prevBtn = document.getElementById('prev-partner');
        const nextBtn = document.getElementById('next-partner');

        // AP 26: Dynamische Einfärbung
        this._updateButtonState(prevBtn, this.currentPartnerIndex > 0);
        this._updateButtonState(nextBtn, this.currentPartnerIndex < totalPartners - 1);
    }

    showStep(stepNumber) {
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`wizard-step-${stepNumber}`).classList.add('active');
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`step-${i}`);
            step.classList.remove('active', 'completed');
            
            if (i < this.currentStep) {
                step.classList.add('completed');
            } else if (i === this.currentStep) {
                step.classList.add('active');
            }
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        // AP 26: Dynamische Einfärbung
        this._updateButtonState(prevBtn, this.currentStep > 1);
        
        if (this.currentStep === 4) {
            const isLastPartner = this.currentPartnerIndex === this.selectedPartners.length - 1;
            
            if (isLastPartner) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            }
        } else if (this.currentStep === 5) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
            prevBtn.style.display = 'inline-flex';
        }
        
        // AP 26: Dynamische Einfärbung für Next Button (Step 3 Check)
        let nextEnabled = true;
        if (this.currentStep === 3) {
            nextEnabled = this.selectedPartners.length > 0;
        }
        this._updateButtonState(nextBtn, nextEnabled);
    }

    async submitSurvey() {
        // Auch beim Submit den aktuellen Partner validieren
        if (!this.flow.validatePartnerStep()) return;

        // AP 24: toggleGlobalLoader
        toggleGlobalLoader(true);
        
        try {
            // Strukturierung der Performance Daten für das Backend
            const performanceData = {};
            for (const partnerId in this.performanceData) {
                performanceData[partnerId] = {};
                for (const critId in this.performanceData[partnerId]) {
                    const data = this.performanceData[partnerId][critId];
                    performanceData[partnerId][critId] = data; 
                }
            }

            // HIER GEÄNDERT (AP 21): Mapping von CamelCase zurück zu SnakeCase für Backend
            const partnerFeedbackMapped = {};
            for (const pId in this.partnerFeedback) {
                const fb = this.partnerFeedback[pId];
                partnerFeedbackMapped[pId] = {
                    frequency: fb.frequency,
                    nps: fb.nps,
                    general_comment: fb.generalComment // Mapping
                };
            }

            const surveyData = {
                survey_id: this.surveyId,
                department_id: this.personalData.finalDeptId, // Mapping
                name: this.personalData.name,
                email: this.personalData.email,
                is_manager: this.personalData.isManager, // Mapping
                
                importance: this.importanceData,
                performance: performanceData,
                partner_feedback: partnerFeedbackMapped, // Mapped object
                
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('php/save_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surveyData)
            });
            
            const result = await response.json();
            
            if (response.ok && (result.status === 'success' || result.id)) {
                this.currentStep = 5;
                this.showStep(this.currentStep);
                this.updateProgress();
                this.updateNavigationButtons();
            } else {
                throw new Error(result.error || 'Unbekannter Fehler');
            }
            
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showError('Fehler beim Speichern der Daten: ' + error.message);
        } finally {
            toggleGlobalLoader(false);
        }
    }

    restartSurvey() {
        location.reload();
    }

    showError(message) {
        const errorModal = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        errorText.textContent = message;
        errorModal.style.display = 'flex';
    }

    hideError() {
        const errorModal = document.getElementById('error-message');
        errorModal.style.display = 'none';
    }
}