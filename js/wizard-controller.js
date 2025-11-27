/*
  Datei: js/wizard-controller.js
  Zweck: Kernlogik der Quality Index Datenerfassung (ehemals QualityIndexWizard in app.js)
  # Created: 27.11.2025, 14:50 - Extracted core logic from app.js (AP 8)
  # Modified: 27.11.2025, 15:30 - Removed unused 'restorePartnerValues' method (Dead Code Cleanup - AP 9)
  # Modified: 27.11.2025, 15:40 - Refactored into DataView and WizardFlow modules (AP 10)
  # Modified: 27.11.2025, 15:45 - FIX: Regression: Test-Mode no longer selects hierarchy/partners (AP 10 Regression Fix)
*/

import { CONFIG } from './config.js';
import { escapeHtml } from './utils.js';
import { DataView } from './wizard-data-view.js'; // NEU: Import DataView
import { WizardFlow } from './wizard-flow.js';   // NEU: Import WizardFlow

export class WizardController {
    constructor() {
        // --- STATE ---
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

    // --- CALLBACKS ZUR STEUERUNG DER MODULE (NEU) ---
    _createCallbacks() {
        return {
            showError: (msg) => this.showError(msg),
            showStep: (step) => this.showStep(step),
            updateProgress: () => this.updateProgress(),
            updateNavigationButtons: () => this.updateNavigationButtons(),
            setupPerformanceEvaluation: () => this.setupPerformanceEvaluation(),
            showPartnerEvaluationPage: (idx) => this.showPartnerEvaluationPage(idx),
            
            // Data Setter (für externe Module)
            setCurrentStep: (step) => this.currentStep = step,
            setPersonalData: (data) => this.personalData = data,
            setImportance: (critId, value) => this.importanceData[critId] = value,

            // View Helpers
            escapeHtml: escapeHtml,
            bindSliderEvents: (type) => this._bindSliderEvents(type)
        };
    }

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

    // --- DATEN & LOGIK (REDUZIERT) ---
    async loadConfigData() {
        // ... (Logik bleibt hier, da es den Kern des Controllers betrifft)
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
            throw new Error('Konfigurationsdateien konnten nicht geladen werden: ' + error.message);
        }
    }

    setupUI() {
        this.setupHierarchyDropdowns();
        this.view.setupImportanceCriteria(); // DELEGIERT
        this.setupPartnerSelection();
        this.updateNavigationButtons();
    }
    
    // HIER KORRIGIERT (FIX 1): Sicherstellen, dass die Hierarchie-Auswahl Events auslöst.
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
                    
                    // WICHTIG: Das Auslösen des finalen Events, damit die Logik den finalen Wert erkennt.
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
            
            // HIER GEÄNDERT: escapeHtml für Partner Name
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

        // HIER KORRIGIERT (FIX 2): Initiales Auslösen der Partner-Auswahl im Test-Modus
        if (this.isTestMode) {
             // 1. Manuelles Update des State, basierend auf den 'checked' Attributen
             this.updatePartnerSelection(); 

             // 2. Fallback: Sicherstellen, dass mindestens ein Partner ausgewählt ist.
             if (this.selectedPartners.length === 0 && this.partnerData.length > 0) {
                 const firstBox = container.querySelector('input');
                 if(firstBox) {
                    firstBox.checked = true;
                    // WICHTIG: Event auslösen, damit die CSS-Klasse gesetzt wird und der State (updatePartnerSelection) aktualisiert wird
                    firstBox.dispatchEvent(new Event('change'));
                 }
             }
        }
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

    _bindSliderEvents(type) {
        const sliders = document.querySelectorAll(`input[data-type="${type}"]`);
        
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target);
            });
            
            slider.addEventListener('mouseover', (e) => {
                this.showSliderTooltip(e.target);
            });
            
            // NEU: Tooltip verstecken beim Verlassen
            slider.addEventListener('mouseout', (e) => {
                const tooltip = document.getElementById(`tooltip_${e.target.id}`);
                if (tooltip) tooltip.style.opacity = '0';
            });
        });
    }

    // Event-Handling für Kommentare (Logik bleibt hier, da sie den State aktualisiert)
    bindCommentEvents(partnerId) {
        // Suche alle Icons und Textareas auf der aktuellen Seite
        const currentView = document.getElementById(`partner-view-${partnerId}`);

        const icons = currentView.querySelectorAll('.comment-icon');
        icons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const domId = e.target.id.replace('icon_', ''); // z.B. perf_10_1
                const container = document.getElementById(`comment_container_${domId}`);
                if (container) {
                    container.style.display = 'block';
                    const textarea = container.querySelector('textarea');
                    if(textarea) textarea.focus();
                }
            });
        });

        const textareas = currentView.querySelectorAll('textarea[id^="comment_perf_"]');
        textareas.forEach(area => {
            area.addEventListener('input', (e) => {
                const domId = e.target.id.replace('comment_', ''); // perf_10_1
                const parts = domId.split('_');
                const rawId = parts[1]; // Criterion ID
                const pId = parts[2]; // Partner ID

                const val = e.target.value;
                
                // Speichern im Datenobjekt
                if (!this.performanceData[pId]) this.performanceData[pId] = {};
                if (!this.performanceData[pId][rawId]) {
                    this.performanceData[pId][rawId] = { score: 0, comment: val };
                } else {
                    let entry = this.performanceData[pId][rawId];
                    if (typeof entry !== 'object') {
                        entry = { score: entry, comment: val };
                    } else {
                        entry.comment = val;
                    }
                    this.performanceData[pId][rawId] = entry;
                }
            });
        });
    }

    updateSliderValue(slider) {
        const type = slider.dataset.type;
        const value = parseInt(slider.value);
        const rawId = slider.dataset.critId; 
        const domId = slider.id;

        const valueDisplay = document.getElementById(`value_${domId}`);
        const tooltip = document.getElementById(`tooltip_${domId}`);
        
        // Logik für Frequenz & NPS
        if (type === 'frequency') {
            const labels = {1: "Selten / Einmalig", 2: "Monatlich / Gelegentlich", 3: "Wöchentlich / Regelmäßig", 4: "Täglich / Intensiv"};
            let text = labels[value] || "Bitte wählen...";
            
            if (value === 0) {
                slider.classList.add('slider-neutral');
            } else {
                slider.classList.remove('slider-neutral');
            }
            if(valueDisplay) valueDisplay.textContent = text;
            if(tooltip) tooltip.textContent = text;
            
            const pid = this.getCurrentPartnerId();
            if(!this.partnerFeedback[pid]) this.partnerFeedback[pid] = {};
            this.partnerFeedback[pid].frequency = value;
            return;
        }

        if (type === 'nps') {
            let text = "Bitte wählen...";
            if (value === CONFIG.WIZARD.NPS_RANGES.NA_VALUE) {
                slider.classList.add('slider-neutral');
            } else {
                slider.classList.remove('slider-neutral');
                if (value === -1) text = "Möchte ich nicht bewerten";
                else if (value === 0) text = "0 - Auf keinen Fall";
                else if (value >= 1 && value <= 3) text = value + " - Eher nicht";
                else if (value >= 4 && value <= 6) text = value + " - Eher schon";
                else if (value >= 7 && value <= 10) text = value + " - Auf jeden Fall";
            }
            if(valueDisplay) valueDisplay.textContent = text;
            if(tooltip) tooltip.textContent = text;

            const pid = this.getCurrentPartnerId();
            if(!this.partnerFeedback[pid]) this.partnerFeedback[pid] = {};
            this.partnerFeedback[pid].nps = value;
            return;
        }

        // Logik für Criteria (Importance / Performance)
        let tooltipText = `${value} - Neutral`;
        
        if (value === 0) {
            slider.classList.add('slider-neutral');
            if (valueDisplay) valueDisplay.textContent = 'N/A';
            if (tooltip) tooltip.textContent = 'Keine Angabe';
        } else {
            slider.classList.remove('slider-neutral');
            if (valueDisplay) valueDisplay.textContent = value;
            
            if (type === 'importance') {
                if (value <= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MIN) tooltipText = `${value} - ist mir eher unwichtig`;
                else if (value >= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MAX) tooltipText = `${value} - ist mir extrem wichtig`;
                else tooltipText = `${value} - wichtig`;
            } else {
                if (value <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) tooltipText = `${value} - erfüllt der Partner sehr schlecht`;
                else if (value >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX) tooltipText = `${value} - erfüllt der Partner sehr gut`;
                else tooltipText = `${value} - neutral`;
            }
            if (tooltip) tooltip.textContent = tooltipText;
        }
        
        // Daten speichern
        if (type === 'importance') {
            this.importanceData[rawId] = value;
        } else {
            const partnerId = this.getCurrentPartnerId(); 
            if (partnerId) {
                const partnerCritId = domId.split('_').slice(1).join('_');
                const rawCritId = partnerCritId.split('_')[0]; 
                
                if (!this.performanceData[partnerId]) this.performanceData[partnerId] = {};
                
                let current = this.performanceData[partnerId][rawCritId];
                let comment = '';
                if (current && typeof current === 'object') comment = current.comment;
                
                this.performanceData[partnerId][rawCritId] = { score: value, comment: comment };

                // Icon Logik
                const icon = document.getElementById(`icon_${domId}`);
                const container = document.getElementById(`comment_container_${domId}`);
                const textarea = document.getElementById(`comment_${domId}`);
                
                if (icon) {
                    const isExtreme = (value > 0 && value <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) || value >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX;
                    const hasText = textarea && textarea.value.trim() !== '';
                    
                    if (isExtreme || hasText) {
                        icon.style.visibility = 'visible';
                        if (hasText && container) container.style.display = 'block';
                    } else {
                        icon.style.visibility = 'hidden';
                        if (container) container.style.display = 'none';
                    }
                }
            }
        }
    }

    showSliderTooltip(slider) {
        const tooltip = document.getElementById(`tooltip_${slider.id}`);
        if (tooltip) {
            tooltip.style.opacity = '1';
        }
    }

    // --- VIEW HELPER METHODEN ---

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

    // ... (updateAreas, updateTeams, prefillTestData, setupPartnerSelection, updatePartnerSelection bleiben als State/Flow-Methoden)

    // --- PARTNER EVALUATION LOGIC ---

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
            this._createCallbacks().bindSliderEvents('frequency');
            this._createCallbacks().bindSliderEvents('nps');
            this._createCallbacks().bindSliderEvents('performance');
            this.bindCommentEvents(partner.id); 
            
            document.getElementById(`gen_comment_${partner.id}`).addEventListener('input', (e) => {
                this.partnerFeedback[partner.id].general_comment = e.target.value;
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
    
    // ... (updatePartnerNavigation, getPartnerId, submitSurvey, etc. bleiben)
    
    // --- UTILITIES (Show/Hide/Update) ---
    // ... (showError, hideError, showLoading, showStep, updateProgress, updateNavigationButtons bleiben)
    
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
                    
                    // WICHTIG: Das Auslösen des finalen Events, damit die Logik den finalen Wert erkennt.
                    teamSelect.dispatchEvent(new Event('change', { bubbles: true }));
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
                name: cb.dataset.name // Das ist bereits escaped/safe aus DOM
            }));
        
        document.getElementById('selected-partners-count').textContent = this.selectedPartners.length;
        
        const nextBtn = document.getElementById('next-btn');
        if (this.currentStep === 3) {
            nextBtn.disabled = this.selectedPartners.length === 0;
        }
    }
    
    getCurrentPartnerId() {
        if (this.selectedPartners.length > 0 && this.currentPartnerIndex >= 0) {
            return this.selectedPartners[this.currentPartnerIndex].id;
        }
        return null;
    }
    
    updatePartnerNavigation() {
        const totalPartners = this.selectedPartners.length;
        const currentNum = this.currentPartnerIndex + 1;
        
        document.getElementById('partner-progress').textContent = `Partner ${currentNum} von ${totalPartners}`;
        
        document.getElementById('prev-partner').disabled = this.currentPartnerIndex === 0;
        document.getElementById('next-partner').disabled = this.currentPartnerIndex === totalPartners - 1;
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
        
        prevBtn.disabled = this.currentStep === 1;
        
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
        
        if (this.currentStep === 3) {
            nextBtn.disabled = this.selectedPartners.length === 0;
        } else {
            nextBtn.disabled = false;
        }
    }

    async submitSurvey() {
        // Auch beim Submit den aktuellen Partner validieren
        if (!this.flow.validatePartnerStep()) return;

        this.showLoading(true);
        
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

            const surveyData = {
                survey_id: this.surveyId,
                department_id: this.personalData.final_dept_id, 
                name: this.personalData.name,
                email: this.personalData.email,
                is_manager: this.personalData.is_manager,
                
                importance: this.importanceData,
                performance: performanceData,
                partner_feedback: this.partnerFeedback,
                
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
            this.showLoading(false);
        }
    }

    restartSurvey() {
        location.reload();
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
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