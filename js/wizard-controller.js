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
  # Modified: 28.11.2025, 17:00 - AP 27: Added LocalStorage persistence (Light version)
  # Modified: 28.11.2025, 20:00 - AP 29.3: Integrated CSRF token handling
  # Modified: 30.11.2025, 10:04 - AP 38: Added openInfoModal() method for app_texts integration
  # Modified: 2026-02-13 - AP 48: Survey date validation (start_date/end_date) with overlay block
  # Modified: 2026-02-14 - AP 50: Header 3-Spalten-Layout (insertLogo angepasst für header-logo-left Container)
*/

import { CONFIG } from './config.js';
import { escapeHtml, toggleGlobalLoader } from './utils.js';
import { DataView } from './wizard-data-view.js'; 
import { WizardFlow } from './wizard-flow.js';   

const STORAGE_KEY = 'cpqi_wizard_state';

export class WizardController {
    constructor() {
        // --- STATE ---
        this.currentStep = 1;
        this.totalSteps = 5;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
        
        this.surveyId = null;
        this.csrfToken = null; // AP 29.3: Token Speicher
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

    // --- AP 27: PERSISTENCE METHODS ---
    _saveState() {
        if (!CONFIG.WIZARD.USE_LOCAL_STORAGE) return;
        
        const stateToSave = {
            personalData: this.personalData,
            selectedPartners: this.selectedPartners,
            importanceData: this.importanceData,
            performanceData: this.performanceData,
            partnerFeedback: this.partnerFeedback
        };
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
    }

    _loadState() {
        if (!CONFIG.WIZARD.USE_LOCAL_STORAGE) {
            this._clearState();
            return;
        }

        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (!json) return;

            const saved = JSON.parse(json);
            
            if (saved.personalData) this.personalData = saved.personalData;
            if (saved.selectedPartners) this.selectedPartners = saved.selectedPartners;
            if (saved.importanceData) this.importanceData = saved.importanceData;
            if (saved.performanceData) this.performanceData = saved.performanceData;
            if (saved.partnerFeedback) this.partnerFeedback = saved.partnerFeedback;
            
        } catch (e) {
            console.warn('LocalStorage load failed, resetting:', e);
            this._clearState();
        }
    }

    _clearState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    // --- CALLBACKS ---
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
            escapeHtml: escapeHtml, 

            // Data Setter
            setCurrentStep: (step) => { 
                this.currentStep = step; 
            },
            setPersonalData: (data) => { 
                this.personalData = data; 
                this._saveState(); 
            },
            setImportance: (critId, value) => { 
                this.importanceData[critId] = value; 
                this._saveState(); 
            },
            setFeedback: (pId, type, value) => { 
                this._setPartnerFeedback(pId, type, value); 
                this._saveState(); 
            },
            setPerformance: (pId, critId, score, comment) => { 
                this._setPerformance(pId, critId, score, comment); 
                this._saveState(); 
            },
            
            // Event Binding
            bindSliderEvents: (type) => this.view.bindSliderEvents(type),
            bindCommentEvents: (pId) => this.view.bindCommentEvents(pId)
        };
    }
    
    // --- PRIVATE DATA SETTER ---
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

            if (this.surveyBlocked) return;

            this._loadState();
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
        this.view.setupImportanceCriteria(); 
        this.setupPartnerSelection();
        this.updateNavigationButtons();
    }

    // --- NAVIGATION DELEGIERT ---
    previousStep() { return this.flow.previousStep(); }
    nextStep() { return this.flow.nextStep(); }
    previousPartner() { return this.flow.previousPartner(); }
    nextPartner() { return this.flow.nextPartner(); }
    validateCurrentStep() { return this.flow.validateCurrentStep(); }
    validatePartnerStep() { return this.flow.validatePartnerStep(); }


    // --- EVENT BINDING & HANDLER ---
    bindEvents() {
        document.getElementById('prev-btn').addEventListener('click', () => this.flow.previousStep());
        document.getElementById('next-btn').addEventListener('click', () => this.flow.nextStep());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitSurvey());
        document.getElementById('restart-survey').addEventListener('click', () => this.restartSurvey());

        document.getElementById('prev-partner').addEventListener('click', () => this.flow.previousPartner());
        document.getElementById('next-partner').addEventListener('click', () => this.flow.nextPartner());
        document.getElementById('close-error').addEventListener('click', () => this.hideError());
    }
    
    // --- AP 38: INFO MODAL ---
    openInfoModal(category) {
        const content = this.appTexts[category] || "<p>Information wird geladen oder ist nicht verfügbar.</p>";
        document.getElementById('info-modal-body').innerHTML = content;
        const modal = document.getElementById('global-info-modal');
        if(modal) modal.style.display = 'flex';
    }
    
    // --- HIERARCHIE & PARTNER SELECTION ---
    setupHierarchyDropdowns() {
        const departmentSelect = document.getElementById('department');
        const rootDeptIdField = document.getElementById('root-dept-id');
        const rootDeptLabel = document.getElementById('root-dept-label');

        // Root (level_depth 0) als festen Text anzeigen, Dropdowns ab Ebene 1
        const root = this.hierarchyData.find(d => d.parent_id === null);
        if (root) {
            rootDeptIdField.value = root.id;
            rootDeptLabel.textContent = root.name;
        }

        const departments = this.hierarchyData.filter(d => root && d.parent_id == root.id);

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
        document.getElementById('name').value = "Test User " + Math.floor(Math.random() * 1000);
        document.getElementById('email').value = "test@example.com";
        document.getElementById('is_manager').checked = Math.random() < 0.3; 

        const leafs = this.hierarchyData.filter(d => d.level_depth === 3);
        if (leafs.length > 0) {
            const randomLeaf = leafs[Math.floor(Math.random() * leafs.length)];
            const level2 = this.hierarchyData.find(d => d.id === randomLeaf.parent_id);
            if (level2) {
                const level1 = this.hierarchyData.find(d => d.id === level2.parent_id);
                if (level1) {
                    const deptSelect = document.getElementById('department');
                    deptSelect.value = level1.id;
                    
                    this.updateAreas(); 
                    
                    const areaSelect = document.getElementById('area');
                    areaSelect.value = level2.id;
                    
                    this.updateTeams(); 
                    
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

        // Toolbar mit Radio-Buttons und Suchfeld (nur einmal)
        let toolbar = document.getElementById('partner-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'partner-toolbar';
            toolbar.className = 'partner-toolbar';
            toolbar.innerHTML = `
                <div class="partner-search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="partner-search" placeholder="Tippen zum Filtern">
                </div>
                <div class="toolbar-divider"></div>
                <div class="partner-sort-options">
                    <label><input type="radio" name="partner-sort" value="alpha" checked> Alphabetisch</label>
                    <label><input type="radio" name="partner-sort" value="grouped"> Gruppiert</label>
                </div>
            `;
            container.parentNode.insertBefore(toolbar, container);

            // Event-Listener für Sortierung
            toolbar.querySelectorAll('input[name="partner-sort"]').forEach(radio => {
                radio.addEventListener('change', () => this.renderPartnerList());
            });

            // Event-Listener für Suche
            toolbar.querySelector('#partner-search').addEventListener('input', () => this.renderPartnerList());
        }

        this.renderPartnerList();

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

    renderPartnerList() {
        const container = document.getElementById('partner-selection-container');
        container.innerHTML = '';

        // Aktuelle Sortierung und Suchbegriff ermitteln
        const sortMode = document.querySelector('input[name="partner-sort"]:checked')?.value || 'alpha';
        const searchTerm = document.getElementById('partner-search')?.value?.toLowerCase() || '';

        // Partner sortieren
        let sortedPartners = [...this.partnerData];
        if (sortMode === 'grouped') {
            sortedPartners.sort((a, b) => {
                const groupA = a.sortgroup ?? 999;
                const groupB = b.sortgroup ?? 999;
                if (groupA !== groupB) return groupA - groupB;
                return a.name.localeCompare(b.name);
            });
        } else {
            sortedPartners.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Nach Suchbegriff filtern (beginnt mit)
        if (searchTerm) {
            sortedPartners = sortedPartners.filter(p => p.name.toLowerCase().startsWith(searchTerm));
        }

        let lastGroup = null;
        sortedPartners.forEach((partner, index) => {
            // Bei gruppierter Ansicht: Trenner bei Gruppenwechsel
            if (sortMode === 'grouped') {
                const currentGroup = partner.sortgroup ?? 999;
                if (lastGroup !== null && currentGroup !== lastGroup) {
                    const separator = document.createElement('div');
                    separator.className = 'partner-group-separator';
                    container.appendChild(separator);
                }
                lastGroup = currentGroup;
            }

            const isLoaded = this.selectedPartners.some(p => p.id == partner.id);
            const isSelected = isLoaded || (this.isTestMode && !this._testModeInitialized && Math.random() < 0.3);

            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'partner-checkbox' + (isSelected ? ' selected' : '');

            checkboxDiv.innerHTML = `
                <input type="checkbox" id="partner_${partner.id}" value="${partner.id}" data-name="${escapeHtml(partner.name)}" ${isSelected ? 'checked' : ''}>
                <label for="partner_${partner.id}">${escapeHtml(partner.name)}</label>
            `;

            const checkbox = checkboxDiv.querySelector('input');
            checkbox.addEventListener('change', () => {
                this.updatePartnerSelection();
                this._saveState();

                if (checkbox.checked) {
                    checkboxDiv.classList.add('selected');
                } else {
                    checkboxDiv.classList.remove('selected');
                }
            });

            container.appendChild(checkboxDiv);
        });

        this._testModeInitialized = true;
        this.updatePartnerSelection();
    }

    updatePartnerSelection() {
        const checkboxes = document.querySelectorAll('#partner-selection-container input[type="checkbox"]');

        // Sichtbare Partner-IDs ermitteln
        const visibleIds = Array.from(checkboxes).map(cb => cb.value);

        // Nicht-sichtbare Partner behalten
        const hiddenSelected = this.selectedPartners.filter(p => !visibleIds.includes(String(p.id)));

        // Sichtbare gecheckte Partner ermitteln
        const visibleSelected = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ({
                id: cb.value,
                name: cb.dataset.name
            }));

        // Zusammenführen
        this.selectedPartners = [...hiddenSelected, ...visibleSelected];
        
        document.getElementById('selected-partners-count').textContent = this.selectedPartners.length;
        
        const nextBtn = document.getElementById('next-btn');
        if (this.currentStep === 3) {
            nextBtn.disabled = this.selectedPartners.length === 0;
        }
        this._updateButtonState(nextBtn, !nextBtn.disabled); 
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
            
            document.getElementById(`gen_comment_${partner.id}`).addEventListener('input', (e) => {
                this.partnerFeedback[partner.id].generalComment = e.target.value;
                this._saveState(); 
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
    
    insertLogo() {
        const container = document.getElementById('header-logo-left');
        if(container && !document.getElementById('cisco-logo')) {
            const img = document.createElement('img');
            img.src = 'img/cisco.png';
            img.id = 'cisco-logo';
            img.alt = 'Cisco Logo';
            container.appendChild(img);
        }
    }

    async loadConfigData() {
        try {
            const response = await fetch('php/get_data.php');
            if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
            
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            // AP 29.3: CSRF Token sichern
            if (data.csrf_token) {
                this.csrfToken = data.csrf_token;
            }

            // AP 48: Aktive Survey suchen (nicht einfach surveys[0])
            const survey = Array.isArray(data.surveys)
                ? data.surveys.find(s => s.is_active)
                : null;

            if (survey) {
                this.surveyId = survey.id;
                this.isTestMode = !!survey.test_mode;

                const subtitle = document.getElementById('survey-subtitle');
                if(subtitle && survey.name) {
                    subtitle.textContent = survey.name + (this.isTestMode ? " [TEST-MODE]" : "");
                }

                // AP 48: Datumsprüfung (skip bei test_mode oder NULL-Datum)
                if (!this.isTestMode) {
                    const now = new Date();
                    const dateOpts = { day: '2-digit', month: 'long', year: 'numeric' };

                    if (survey.start_date) {
                        const startDate = new Date(survey.start_date + 'T00:00:00');
                        if (now < startDate) {
                            const formatted = startDate.toLocaleDateString('de-DE', dateOpts);
                            const remaining = this._formatTimeDiff(startDate - now);
                            this.blockWizard(
                                'Etwas zu früh ...',
                                `Schön, dass Du dabei sein willst!<br><br>Die Erhebung „${survey.name}" startet erst <strong>in ${remaining}</strong> (${formatted}).<br><br>Wir freuen uns, wenn Du dann wiederkommst – Dein Feedback ist uns wichtig!`
                            );
                            return;
                        }
                    }

                    if (survey.end_date) {
                        const endDate = new Date(survey.end_date + 'T18:00:00');
                        if (now > endDate) {
                            const formatted = new Date(survey.end_date + 'T00:00:00')
                                .toLocaleDateString('de-DE', dateOpts);
                            this.blockWizard(
                                'Leider zu spät ...',
                                `Die Erhebung „${survey.name}" endete am <strong>${formatted}</strong>.<br><br>Schade, dass wir Dein Feedback diesmal verpasst haben. Beim nächsten Mal bist Du hoffentlich dabei!`
                            );
                            return;
                        }
                    }
                }
            } else {
                this.surveyId = null;
                this.blockWizard(
                    'Gerade nichts los ...',
                    'Aktuell ist keine Erhebung aktiv.<br><br>Sobald eine neue Runde startet, wirst Du informiert.'
                );
                return;
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

        this._updateButtonState(prevBtn, this.currentPartnerIndex > 0);
        this._updateButtonState(nextBtn, this.currentPartnerIndex < totalPartners - 1);
    }

    // AP 48: Zeitdifferenz menschenlesbar formatieren ("4 Tagen, 8 Stunden und 10 Minuten")
    _formatTimeDiff(diffMs) {
        const totalMin = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;

        const parts = [];
        if (days > 0) parts.push(`${days} ${days === 1 ? 'Tag' : 'Tagen'}`);
        if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`);
        if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`);

        if (parts.length === 1) return parts[0];
        return parts.slice(0, -1).join(', ') + ' und ' + parts[parts.length - 1];
    }

    // AP 48: Wizard sperren mit halbtransparentem Overlay (Inhalt sichtbar im Hintergrund)
    blockWizard(title, message) {
        this.surveyBlocked = true;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'background: rgba(0,0,0,0.85); z-index: 5000;';
        overlay.innerHTML = `
            <div class="modal-content-large" style="max-width: 460px; text-align: left; align-items: stretch;">
                <h2 class="modal-headline">${title}</h2>
                <p style="font-size: 1.1em; color: #666; margin: 20px 0 0 0; line-height: 1.6;">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
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
        
        let nextEnabled = true;
        if (this.currentStep === 3) {
            nextEnabled = this.selectedPartners.length > 0;
        }
        this._updateButtonState(nextBtn, nextEnabled);
    }

    async submitSurvey() {
        if (!this.flow.validatePartnerStep()) return;

        toggleGlobalLoader(true);
        
        try {
            const performanceData = {};
            for (const partnerId in this.performanceData) {
                performanceData[partnerId] = {};
                for (const critId in this.performanceData[partnerId]) {
                    const data = this.performanceData[partnerId][critId];
                    performanceData[partnerId][critId] = data; 
                }
            }

            const partnerFeedbackMapped = {};
            for (const pId in this.partnerFeedback) {
                const fb = this.partnerFeedback[pId];
                partnerFeedbackMapped[pId] = {
                    frequency: fb.frequency,
                    nps: fb.nps,
                    general_comment: fb.generalComment 
                };
            }

            const surveyData = {
                survey_id: this.surveyId,
                department_id: this.personalData.finalDeptId, 
                name: this.personalData.name,
                email: this.personalData.email,
                is_manager: this.personalData.isManager, 
                
                importance: this.importanceData,
                performance: performanceData,
                partner_feedback: partnerFeedbackMapped, 
                
                // AP 29.3: CSRF Token mitsenden
                csrf_token: this.csrfToken,
                
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('php/save_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surveyData)
            });
            
            const result = await response.json();
            
            if (response.ok && (result.status === 'success' || result.id)) {
                this._clearState();
                
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
        this._clearState();
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