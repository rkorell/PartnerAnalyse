// Modified: November 21, 2025, 20:50 - Vollständiges JavaScript für Cisco Partner Quality Index Wizard erstellt
// # Modified: 22.11.2025, 14:45 - Umstellung auf DB-Backend, Fix Standardwerte, Header-Korrektur, Unique DOM IDs, Name/Email/Manager
// # Modified: 23.11.2025, 11:35 - Anpassung auf englische JSON-Keys (category, name, description)
// # Modified: 24.11.2025, 23:10 - Implemented Test-Mode, N/A Slider State (0), Importance Validation
// # Modified: 26.11.2025, 21:15 - Added Partner Header (Freq, NPS, GenComment) and Per-Criteria Comments
// # Modified: 27.11.2025, 10:15 - Changed GenComment to Textarea, Updated Placeholders
// # Modified: 27.11.2025, 13:00 - Added XSS protection (escapeHtml) for user inputs
// # Modified: 27.11.2025, 14:05 - DOM performance optimization (AP 5a): Pre-render all partner views, only toggle visibility. (INKLUSIVE bindEvents FIX)
// # Modified: 27.11.2025, 14:15 - FIX: Missing Submit button (Regression from AP 5a). Added missing updateNavigationButtons call.
// # Modified: 27.11.2025, 14:30 - Centralized configuration via config.js (AP 6)

class QualityIndexWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
        
        // Daten-Container
        this.surveyId = null;
        this.isTestMode = false;

        this.hierarchyData = [];
        this.criteriaData = [];
        this.partnerData = [];
        
        // NEU: Texte für Tooltips
        this.appTexts = {};
        
        this.importanceData = {};
        this.performanceData = {};
        // NEU: Container für Partner-Kopfdaten (Frequenz, NPS, General Comment)
        this.partnerFeedback = {}; 
        this.personalData = {};
        
        this.init();
    }

    // NEU: Hilfsfunktion gegen XSS
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async init() {
        try {
            this.insertLogo();
            await this.loadConfigData();
            this.setupUI();
            
            // Wenn Testmodus aktiv, Daten generieren
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

    // HIER GEFEHLT: Bindet alle Event-Listener an die Buttons und Modal-Trigger
    bindEvents() {
        document.getElementById('prev-btn').addEventListener('click', () => this.previousStep());
        document.getElementById('next-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitSurvey());
        document.getElementById('restart-survey').addEventListener('click', () => this.restartSurvey());

        document.getElementById('prev-partner').addEventListener('click', () => this.previousPartner());
        document.getElementById('next-partner').addEventListener('click', () => this.nextPartner());
        document.getElementById('close-error').addEventListener('click', () => this.hideError());

        const modal = document.getElementById('global-info-modal');
        const closeBtn = document.getElementById('close-info-modal'); 
        const closeBtnClass = document.querySelector('.info-modal-close');
        
        if(closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        else if(closeBtnClass) closeBtnClass.addEventListener('click', () => { modal.style.display = 'none'; });

        if(modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // Macht die Funktion global für den onclick-Handler im HTML
        window.openInfoModal = (category) => this.openInfoModal(category);
    }
    
    openInfoModal(category) {
        const modal = document.getElementById('global-info-modal');
        const body = document.getElementById('info-modal-body');
        
        const content = this.appTexts[category] || "Keine Informationen verfügbar.";
        
        // HIER GEÄNDERT: Anzeigen von Markdown-Inhalten mit einfachen Zeilenumbrüchen
        body.innerHTML = content.replace(/\n/g, '<br>');
        
        modal.style.display = 'flex';
    }


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
            throw new Error('Konfigurationsdateien konnten nicht geladen werden: ' + error.message);
        }
    }

    setupUI() {
        this.setupHierarchyDropdowns();
        this.setupImportanceCriteria();
        this.setupPartnerSelection();
        this.updateNavigationButtons();
    }

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
                }
            }
        }
    }

    setupImportanceCriteria() {
        setTimeout(() => {
            const container = document.getElementById('importance-criteria-container');
            const groupedCriteria = this.groupCriteria();

            Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'criteria-group';

                const titleDiv = document.createElement('div');
                titleDiv.className = 'criteria-group-title';
                titleDiv.textContent = groupName;
                groupDiv.appendChild(titleDiv);

                const tableDiv = document.createElement('div');
                tableDiv.className = 'criteria-table';

                criteria.forEach((criterion) => {
                    const rawId = criterion.id;
                    const domId = 'imp_' + rawId;
                    
                    let initialValue = 0;
                    if (this.isTestMode) {
                        initialValue = Math.floor(Math.random() * 10) + 1;
                    }
                    
                    this.importanceData[rawId] = initialValue;

                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'criteria-row';

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'criteria-info';
                    
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'criteria-name';
                    nameDiv.textContent = criterion.name;
                    
                    const descDiv = document.createElement('div');
                    descDiv.className = 'criteria-description';
                    descDiv.textContent = criterion.description;
                    
                    infoDiv.appendChild(nameDiv);
                    infoDiv.appendChild(descDiv);
                    rowDiv.appendChild(infoDiv);

                    const sliderDiv = document.createElement('div');
                    sliderDiv.className = 'criteria-content';
                    sliderDiv.innerHTML = this.createSliderHTML(domId, rawId, 'importance', initialValue);
                    rowDiv.appendChild(sliderDiv);

                    tableDiv.appendChild(rowDiv);
                });

                groupDiv.appendChild(tableDiv);
                container.appendChild(groupDiv);
            });

            this.bindSliderEvents('importance');
        }, 10);
    }

    groupCriteria() {
        const grouped = {};
        this.criteriaData.forEach(criterion => {
            const groupName = criterion.category;
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(criterion);
        });
        return grouped;
    }

    // Helper für Header Slider (Frequenz & NPS)
    createHeaderSliderHTML(domId, type, initialValue, min, max, labels) {
        // Bestimme visuelle Klasse: Grau wenn Startwert
        // Freq: Start=0 (Grau), 1-4 (Blau)
        // NPS: Start=-2 (Grau), -1 bis 10 (Blau)
        let extraClass = 'slider-neutral';
        let displayValue = 'Bitte wählen...';

        if (type === 'frequency' && initialValue > 0) {
            extraClass = '';
            displayValue = labels[initialValue] || initialValue;
        } else if (type === 'nps' && initialValue > -2) {
            extraClass = '';
            if (labels[initialValue]) {
                displayValue = labels[initialValue].replace('{Val}', initialValue);
            } else {
                // Fallback Logik für NPS Lücken
                if (initialValue === 0) displayValue = "0 - Auf keinen Fall";
                else if (initialValue >= 1 && initialValue <= 3) displayValue = initialValue + " - Eher nicht";
                else if (initialValue >= 4 && initialValue <= 6) displayValue = initialValue + " - Eher schon";
                else if (initialValue >= 7 && initialValue <= 10) displayValue = initialValue + " - Auf jeden Fall";
                else if (initialValue === -1) displayValue = "Möchte ich nicht bewerten";
            }
        }

        return `
            <div class="slider-container">
                <div class="slider-wrapper">
                    <input type="range" 
                           id="${domId}" 
                           class="fancy-slider ${extraClass}" 
                           min="${min}" 
                           max="${max}" 
                           value="${initialValue}" 
                           data-type="${type}">
                    <div class="slider-tooltip" id="tooltip_${domId}">
                        ${displayValue}
                    </div>
                </div>
                <span class="slider-value" id="value_${domId}" style="min-width:200px; text-align:left; margin-left:15px;">${displayValue}</span>
            </div>
        `;
    }

    createSliderHTML(domId, rawId, type, initialValue = 0) {
        const extraClass = initialValue === 0 ? 'slider-neutral' : '';
        const displayValue = initialValue === 0 ? 'N/A' : initialValue;
        
        // Für Performance: Icon Container hinzufügen
        let iconHTML = '';
        if (type === 'performance') {
            // Icon erscheint bei <= 3 oder >= 8
            const isExtreme = (initialValue > 0 && initialValue <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) || initialValue >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX;
            const visibility = isExtreme ? 'visible' : 'hidden';
            iconHTML = `<span class="comment-icon" id="icon_${domId}" style="visibility:${visibility}; cursor:pointer; font-size:1.2em; margin-left:10px;" title="Kommentar hinzufügen">📝</span>`;
        }

        // HIER GEÄNDERT: Placeholder für spezifische Kommentare
        return `
            <div class="slider-container">
                <span class="slider-label">1</span>
                <div class="slider-wrapper">
                    <input type="range" 
                           id="${domId}" 
                           data-crit-id="${rawId}"
                           class="fancy-slider ${extraClass}" 
                           min="0" 
                           max="10" 
                           value="${initialValue}" 
                           data-type="${type}">
                    <div class="slider-tooltip" id="tooltip_${domId}">
                        ${displayValue}
                    </div>
                </div>
                <span class="slider-label">10</span>
                <span class="slider-value" id="value_${domId}">${displayValue}</span>
                ${iconHTML}
            </div>
            ${type === 'performance' ? `<div id="comment_container_${domId}" style="display:none; margin-top:10px; padding-left:20px;"><textarea id="comment_${domId}" placeholder="[FREIWILLIG: Warum diese Bewertung?]" style="width:100%; height:60px; padding:5px; border-radius:4px; border:1px solid #ccc;"></textarea></div>` : ''}
        `;
    }

    bindSliderEvents(type) {
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

    // Event-Handling für Kommentare
    bindCommentEvents(partnerId) {
        // Suche alle Icons und Textareas auf der aktuellen Seite
        // HIER GEÄNDERT: Wir suchen nur im aktuell sichtbaren Partner-View
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
                    // Fallback, falls Score noch nicht gesetzt (sollte nicht passieren)
                    this.performanceData[pId][rawId] = { score: 0, comment: val };
                } else {
                    // Existierendes Objekt oder Wert updaten
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
        const rawId = slider.dataset.critId; // Nur bei Criteria vorhanden
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
            
            // Speichern
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
                // HIER GEÄNDERT: Verwende CONFIG
                if (value <= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MIN) tooltipText = `${value} - ist mir eher unwichtig`;
                else if (value >= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MAX) tooltipText = `${value} - ist mir extrem wichtig`;
                else tooltipText = `${value} - wichtig`;
            } else {
                // HIER GEÄNDERT: Verwende CONFIG
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
                // Strukturierung der ID für Speicherung
                const partnerCritId = domId.split('_').slice(1).join('_'); // Entfernt nur das 'perf_' Präfix
                const rawCritId = partnerCritId.split('_')[0]; 
                
                // Struktur für Performance: Objekt {score, comment}
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
                    // Extremwert Check (<=3 oder >=8) UND Wert > 0 (N/A zählt nicht als extrem in dem Sinne)
                    // HIER GEÄNDERT: Verwende CONFIG
                    const isExtreme = (value > 0 && value <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) || value >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX;
                    
                    // Persistenz-Check: Ist Text drin?
                    const hasText = textarea && textarea.value.trim() !== '';
                    
                    if (isExtreme || hasText) {
                        icon.style.visibility = 'visible';
                        // Wenn Text drin ist, muss Container offen bleiben, sonst nur Icon zeigen
                        if (hasText && container) container.style.display = 'block';
                    } else {
                        // Kein Extremwert und kein Text -> Verstecken
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

    setupPartnerSelection() {
        const container = document.getElementById('partner-selection-container');
        container.innerHTML = ''; 
        
        this.partnerData.forEach((partner, index) => {
            const isSelected = this.isTestMode && Math.random() < 0.3; 

            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'partner-checkbox' + (isSelected ? ' selected' : '');
            
            // HIER GEÄNDERT: escapeHtml für Partner Name
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="partner_${index}" value="${partner.id}" data-name="${this.escapeHtml(partner.name)}" ${isSelected ? 'checked' : ''}>
                <label for="partner_${index}">${this.escapeHtml(partner.name)}</label>
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

    // HIER GEÄNDERT: Funktion pre-rendert jetzt ALLE Views beim ersten Aufruf
    setupPerformanceEvaluation() {
        const container = document.getElementById('partner-views-container');
        container.innerHTML = ''; // Container einmal leeren
        
        if (this.selectedPartners.length === 0) return;
        
        let allViewsHTML = '';
        // Alle Partner-Views vor-rendern 
        this.selectedPartners.forEach(partner => {
            allViewsHTML += this.renderPartnerView(partner);
        });
        container.innerHTML = allViewsHTML;

        // HIER GEÄNDERT: Events NACH dem innerHTML setzen binden
        this.selectedPartners.forEach(partner => {
            this.bindSliderEvents('frequency');
            this.bindSliderEvents('nps');
            this.bindSliderEvents('performance');
            this.bindCommentEvents(partner.id); 
            
            // Listener für General Comment muss hier neu gebunden werden
            document.getElementById(`gen_comment_${partner.id}`).addEventListener('input', (e) => {
                this.partnerFeedback[partner.id].general_comment = e.target.value;
            });
        });
        
        this.currentPartnerIndex = 0;
        this.showPartnerEvaluationPage(0); // Ersten Partner anzeigen
    }

    // HIER NEU: Rendert den kompletten Partner-View als HTML-String (wird nur 1x pro Partner aufgerufen)
    renderPartnerView(partner) {
        const partnerId = partner.id;

        // Initiale Datenstrukturen sicherstellen
        if (!this.partnerFeedback[partnerId]) {
            // Test Mode Werte oder Default
            this.partnerFeedback[partnerId] = {
                frequency: this.isTestMode ? (Math.floor(Math.random() * 4) + 1) : 0,
                nps: this.isTestMode ? (Math.floor(Math.random() * 11)) : CONFIG.WIZARD.NPS_RANGES.NA_VALUE, // HIER GEÄNDERT: Verwende CONFIG
                general_comment: ""
            };
        }
        const pf = this.partnerFeedback[partnerId];
        const initialComment = this.escapeHtml(pf.general_comment || '');

        // Header (Freq, Comment, NPS)
        const headerHTML = `
            <h3>Bewertung: ${this.escapeHtml(partner.name)}</h3>
            <div class="partner-header" style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ecf0f1; margin-bottom:30px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Wie häufig arbeitest Du mit ${this.escapeHtml(partner.name)} zusammen? *</label>
                        ${this.createHeaderSliderHTML(`freq_${partnerId}`, 'frequency', pf.frequency, 0, CONFIG.WIZARD.FREQUENCY_MAX, {1:"Selten", 2:"Monatlich / Gelegentlich", 4:"Täglich / Intensiv"})}
                    </div>
                    <div class="form-group">
                        <label>Generelles Feedback (optional):</label>
                        <textarea id="gen_comment_${partnerId}" placeholder="[FREIWILLIG: Dein generelles Feedback]" style="width:100%; height:80px; padding:10px; border:2px solid #ddd; border-radius:8px; resize:vertical;">${initialComment}</textarea>
                    </div>
                </div>
                <div class="form-row" style="margin-top:20px;">
                    <div class="form-group" style="width:100%;">
                        <label>Würdest Du ${this.escapeHtml(partner.name)} weiterempfehlen? (NPS) *</label>
                        ${this.createHeaderSliderHTML(`nps_${partnerId}`, 'nps', pf.nps, CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 10, {})}
                    </div>
                </div>
            </div>
            <hr style="margin-bottom:30px; border:0; border-top:1px solid #eee;">
            <div id="performance-criteria-container-${partnerId}">`; // Eindeutige ID

        let criteriaHTML = '';
        const groupedCriteria = this.groupCriteria();

        Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
            criteriaHTML += `<div class="criteria-group">
                <div class="criteria-group-title">${groupName}</div>
                <div class="criteria-table">`;

            criteria.forEach((criterion) => {
                const rawId = criterion.id;
                const domId = 'perf_' + rawId + '_' + partnerId; // Eindeutige ID pro Partner/Kriterium
                
                // Initiale Datenlogik
                if (!this.performanceData[partnerId]) {
                    this.performanceData[partnerId] = {};
                }
                
                let storedData = this.performanceData[partnerId][rawId];
                let currentVal = 0;
                let currentComment = '';

                if (storedData !== undefined) {
                    if (typeof storedData === 'object') {
                        currentVal = storedData.score;
                        currentComment = storedData.comment || '';
                    } else {
                        currentVal = storedData; // Fallback für alte Datenstruktur
                    }
                } else if (this.isTestMode) {
                    currentVal = Math.floor(Math.random() * 10) + 1; 
                    // Setze die volle Objektstruktur, um Konsistenz zu gewährleisten
                    this.performanceData[partnerId][rawId] = { score: currentVal, comment: '' };
                } else {
                    this.performanceData[partnerId][rawId] = { score: 0, comment: '' };
                }

                // XSS-Schutz für Kommentar in Textarea
                const escapedComment = this.escapeHtml(currentComment);
                
                // Dynamisch generierte Slider und Kommentar-Container
                const sliderAndCommentHTML = `
                    <div class="criteria-content">
                        ${this.createSliderHTML(domId, rawId, 'performance', currentVal)}
                        <div id="comment_container_${domId}" style="display:${currentComment.trim() !== '' ? 'block' : 'none'}; margin-top:10px; padding-left:20px;">
                            <textarea id="comment_${domId}" placeholder="[FREIWILLIG: Warum diese Bewertung?]" style="width:100%; height:60px; padding:5px; border-radius:4px; border:1px solid #ccc;">${escapedComment}</textarea>
                        </div>
                    </div>`;

                criteriaHTML += `
                <div class="criteria-row">
                    <div class="criteria-info">
                        <div class="criteria-name">${criterion.name}</div>
                        <div class="criteria-description">${criterion.description}</div>
                    </div>
                    ${sliderAndCommentHTML}
                </div>`;
            });

            criteriaHTML += `</div></div>`;
        });
        
        return `<div id="partner-view-${partnerId}" style="display: none;">
            ${headerHTML}
            ${criteriaHTML}
        </div></div>`;
    }

    // HIER NEU: Zeigt den Partner-View an der gegebenen Index-Stelle an
    showPartnerEvaluationPage(index) {
        // Alle Views ausblenden
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
        
        // FIX für Missing Submit Button (Bug aus AP 5a)
        this.updateNavigationButtons();
    }


    previousPartner() {
        if (this.validatePartnerStep()) {
            if (this.currentPartnerIndex > 0) {
                this.showPartnerEvaluationPage(this.currentPartnerIndex - 1);
            }
        }
    }

    nextPartner() {
        if (this.validatePartnerStep()) {
            if (this.currentPartnerIndex < this.selectedPartners.length - 1) {
                this.showPartnerEvaluationPage(this.currentPartnerIndex + 1);
            }
        }
    }
    
    updatePartnerNavigation() {
        const totalPartners = this.selectedPartners.length;
        const currentNum = this.currentPartnerIndex + 1;
        
        document.getElementById('partner-progress').textContent = `Partner ${currentNum} von ${totalPartners}`;
        
        document.getElementById('prev-partner').disabled = this.currentPartnerIndex === 0;
        document.getElementById('next-partner').disabled = this.currentPartnerIndex === totalPartners - 1;
    }

    // Validierung für Step 4 (Partner)
    validatePartnerStep() {
        const currentPartner = this.selectedPartners[this.currentPartnerIndex];
        if (!currentPartner) {
            this.showError("Interner Fehler: Partner-Daten fehlen.");
            return false;
        }
        
        const pid = currentPartner.id; 
        const fb = this.partnerFeedback[pid];
        
        // Frequenz muss > 0 sein
        if (!fb || !fb.frequency || fb.frequency === 0) {
            this.showError(`Bitte gib für Partner ${currentPartner.name} an, wie häufig Du mit diesem Partner zusammenarbeitest.`);
            return false;
        }
        // NPS muss gewählt sein (nicht -2)
        if (fb.nps === undefined || fb.nps === CONFIG.WIZARD.NPS_RANGES.NA_VALUE) {
            this.showError(`Bitte gib für Partner ${currentPartner.name} an, ob Du den Partner weiterempfehlen würdest.`);
            return false;
        }
        return true;
    }
    
    // Wizard Navigation
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigationButtons();
            
            // Sonderfall: Wenn von Step 4 zurück zu Step 3
            if (this.currentStep === 3) {
                // Partner-View-Container leeren, da der DOM beim Zurückgehen nicht gebraucht wird
                document.getElementById('partner-views-container').innerHTML = '';
            }
        }
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigationButtons();
            
            // Sonderfall: Vorbereitung für Step 4
            if (this.currentStep === 4) {
                this.setupPerformanceEvaluation();
            }
        }
    }


    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const departmentEl = document.getElementById('department');
                const departmentId = departmentEl.value;
                const departmentName = departmentEl.options[departmentEl.selectedIndex].text;

                if (!departmentId) {
                    this.showError('Bitte wähle eine Abteilung aus.');
                    return false;
                }
                
                this.personalData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    is_manager: document.getElementById('is_manager').checked,
                    department_id: departmentId,
                    department_name: departmentName,
                    final_dept_id: document.getElementById('team').value || document.getElementById('area').value || departmentId
                };
                return true;
                
            case 2:
                // Prüft auf 0
                const invalidImportance = Object.values(this.importanceData).some(val => val === 0);
                if (invalidImportance) {
                    this.showError('Bitte gewichte ALLE Kriterien. Wähle einen Wert zwischen 1 und 10.');
                    return false;
                }
                return true;
                
            case 3:
                if (this.selectedPartners.length === 0) {
                    this.showError('Bitte wähle mindestens einen Partner aus.');
                    return false;
                }
                return true;
            case 4:
                // Wenn man beim letzten Partner auf "Weiter" klickt, muss er validieren
                if (this.currentPartnerIndex === this.selectedPartners.length - 1) {
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
            // Wird in validateCurrentStep und updatePartnerNavigation gehandhabt
            nextBtn.disabled = false;
        }
    }

    async submitSurvey() {
        // Auch beim Submit den aktuellen Partner validieren
        if (!this.validatePartnerStep()) return;

        this.showLoading(true);
        
        try {
            // Strukturierung der Performance Daten für das Backend
            const performanceData = {};
            for (const partnerId in this.performanceData) {
                performanceData[partnerId] = {};
                for (const critId in this.performanceData[partnerId]) {
                    const data = this.performanceData[partnerId][critId];
                    // Das Backend erwartet entweder ein Objekt {score, comment} oder nur den Score (Legacy)
                    // Wir schicken das Objekt, da wir Kommentare speichern wollen
                    performanceData[partnerId][critId] = data; 
                }
            }

            const surveyData = {
                survey_id: this.surveyId,
                // final_dept_id ist die tiefste Ebene (Team/Area/Dept)
                department_id: this.personalData.final_dept_id, 
                name: this.personalData.name,
                email: this.personalData.email,
                is_manager: this.personalData.is_manager,
                
                importance: this.importanceData,
                performance: performanceData,
                // Partner Feedback
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
            // Nutze die Fehlermeldung vom Backend, falls vorhanden, sonst Fallback
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

document.addEventListener('DOMContentLoaded', () => {
    // Da hier keine Fehlerbehandlung mehr nötig ist, starten wir den Wizard
    new QualityIndexWizard();
});