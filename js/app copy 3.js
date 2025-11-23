// Modified: November 21, 2025, 20:50 - Vollständiges JavaScript für Cisco Partner Quality Index Wizard erstellt
// # Modified: 22.11.2025, 14:45 - Umstellung auf DB-Backend, Fix Standardwerte, Header-Korrektur, Unique DOM IDs, Name/Email/Manager

class QualityIndexWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
        
        // Daten-Container
        this.surveyId = null;
        this.hierarchyData = [];
        this.criteriaData = [];
        this.partnerData = [];
        
        this.importanceData = {};
        this.performanceData = {};
        this.personalData = {};
        
        this.init();
    }

    async init() {
        try {
            this.insertLogo();
            await this.loadConfigData();
            this.setupUI();
            this.bindEvents();
            this.updateProgress();
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            this.showError('Fehler beim Laden der Konfigurationsdaten: ' + error.message);
        }
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
            // Wir nutzen fetch auf get_data.php um JSON zu erhalten
            const response = await fetch('php/get_data.php');
            if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
            
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

           // this.surveyId = data.survey_id;
            if (Array.isArray(data.surveys) && data.surveys.length > 0) {
                this.surveyId = data.surveys[0].id;
                const subtitle = document.getElementById('survey-subtitle');
                if(subtitle && data.surveys[0].name) {
                    subtitle.textContent = data.surveys[0].name;
                }
            } else {
                this.surveyId = null;
                const subtitle = document.getElementById('survey-subtitle');
                if (subtitle) subtitle.textContent = "Kein aktives Survey gefunden";
            }





            this.hierarchyData = data.departments; 
            this.criteriaData = data.criteria; 
            this.partnerData = data.partners; 

            // NEU: Survey Name im Header setzen
            //const subtitle = document.getElementById('survey-subtitle');
            //if(subtitle && data.survey_name) {
              //  subtitle.textContent = data.survey_name;
           //  }

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
        const areaSelect = document.getElementById('area');
        const teamSelect = document.getElementById('team');

        // Level 1: Items ohne parent_id
        const departments = this.hierarchyData.filter(d => d.parent_id === null);
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id; // DB ID
            option.textContent = dept.name;
            departmentSelect.appendChild(option);
        });

        // Event Listeners für Kaskadierung
        departmentSelect.addEventListener('change', () => {
            this.updateAreas();
            this.updateTeams();
        });

        areaSelect.addEventListener('change', () => {
            this.updateTeams();
        });
    }

    updateAreas() {
        const departmentSelect = document.getElementById('department');
        const areaSelect = document.getElementById('area');
        const teamSelect = document.getElementById('team');
        
        // Reset
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

                criteria.forEach((criterion, index) => {
                    const rawId = criterion.id;
                    // WICHTIG: Unique DOM ID für Step 2
                    const domId = 'imp_' + rawId;
                    
                    // FIX: Initialwert 5 setzen
                    this.importanceData[rawId] = 5;

                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'criteria-row';

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'criteria-info';
                    
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'criteria-name';
                    nameDiv.textContent = criterion.Kriterium;
                    
                    const descDiv = document.createElement('div');
                    descDiv.className = 'criteria-description';
                    descDiv.textContent = criterion.Erläuterung;
                    
                    infoDiv.appendChild(nameDiv);
                    infoDiv.appendChild(descDiv);
                    rowDiv.appendChild(infoDiv);

                    const sliderDiv = document.createElement('div');
                    sliderDiv.className = 'criteria-content';
                    // Wir übergeben DOM-ID und Echte-ID
                    sliderDiv.innerHTML = this.createSliderHTML(domId, rawId, 'importance');
                    rowDiv.appendChild(sliderDiv);

                    tableDiv.appendChild(rowDiv);
                });

                groupDiv.appendChild(tableDiv);
                container.appendChild(groupDiv);
            });

            // Slider Event Listeners hinzufügen
            this.bindSliderEvents('importance');
        }, 10); // end timer gegen race condition

    }

    groupCriteria() {
        const grouped = {};
        this.criteriaData.forEach(criterion => {
            const groupName = criterion.Gruppe;
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(criterion);
        });
        return grouped;
    }

    createSliderHTML(domId, rawId, type) {
        const tooltipText = type === 'importance' 
            ? 'ist mir eher unwichtig|ist mir extrem wichtig'
            : 'erfüllt der Partner sehr schlecht|erfüllt der Partner sehr gut';
        
        const [minText, maxText] = tooltipText.split('|');

        return `
            <div class="slider-container">
                <span class="slider-label">0</span>
                <div class="slider-wrapper">
                    <input type="range" 
                           id="${domId}" 
                           data-crit-id="${rawId}"
                           class="fancy-slider" 
                           min="0" 
                           max="10" 
                           value="5" 
                           data-type="${type}">
                    <div class="slider-tooltip" id="tooltip_${domId}">
                        5 - Neutral
                    </div>
                </div>
                <span class="slider-label">10</span>
                <span class="slider-value" id="value_${domId}">5</span>
            </div>
        `;
    }


    bindSliderEvents(type) {
        const sliders = document.querySelectorAll(`input[data-type="${type}"]`);
        console.log(`Binde Events für ${type}, gefundene Slider:`, sliders.length); // DEBUG
        
        sliders.forEach(slider => {
            console.log(`Binde Event für Slider:`, slider.id); // DEBUG
            
            slider.addEventListener('input', (e) => {
                console.log(`Slider ${e.target.id} bewegt auf:`, e.target.value); // DEBUG
                this.updateSliderValue(e.target);
            });
            
            slider.addEventListener('mouseover', (e) => {
                this.showSliderTooltip(e.target);
            });
        });
    }




    updateSliderValue(slider) {
        

        console.log(`=== START updateSliderValue ===`);
        console.log(`Slider DOM ID:`, slider.id);
        
        // WICHTIG: Echte ID aus data-Attribute holen
        const rawId = slider.dataset.critId;
        console.log(`DB ID (raw):`, rawId);

        console.log(`Slider.value VORHER:`, slider.value);
        console.log(`Slider.min:`, slider.min);
        console.log(`Slider.max:`, slider.max);
        
        const value = parseInt(slider.value);
        console.log(`Parsed value:`, value);
        
        const valueDisplay = document.getElementById(`value_${slider.id}`);
        console.log(`ValueDisplay Element:`, valueDisplay);
        const tooltip = document.getElementById(`tooltip_${slider.id}`);

        if (valueDisplay) {
            console.log(`ValueDisplay.textContent VORHER:`, valueDisplay.textContent);
            valueDisplay.textContent = value;
            console.log(`ValueDisplay.textContent NACHHER:`, valueDisplay.textContent);
        }
        
        console.log(`Slider.value NACHHER:`, slider.value);
        console.log(`=== ENDE updateSliderValue ===`);





        const type = slider.dataset.type;
        let tooltipText = `${value} - Neutral`;
        
        if (type === 'importance') {
            if (value <= 2) tooltipText = `${value} - ist mir eher unwichtig`;
            else if (value >= 8) tooltipText = `${value} - ist mir extrem wichtig`;
        } else {
            if (value <= 2) tooltipText = `${value} - erfüllt der Partner sehr schlecht`;
            else if (value >= 8) tooltipText = `${value} - erfüllt der Partner sehr gut`;
        }
        
        if (tooltip) {
            tooltip.textContent = tooltipText;
        }
        
        // Daten speichern unter der ECHTEN ID (rawId)
        if (type === 'importance') {
            this.importanceData[rawId] = value;
        } else {
            const partnerId = this.getCurrentPartnerId(); 
            if (partnerId) {
                if (!this.performanceData[partnerId]) {
                    this.performanceData[partnerId] = {};
                }
                this.performanceData[partnerId][rawId] = value;
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
            const partnerName = partner.name;
            const partnerId = partner.id;

            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'partner-checkbox';
            
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="partner_${index}" value="${partnerId}" data-name="${partnerName}">
                <label for="partner_${index}">${partnerName}</label>
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
        
        // Navigation Button aktivieren/deaktivieren
        const nextBtn = document.getElementById('next-btn');
        if (this.currentStep === 3) {
            nextBtn.disabled = this.selectedPartners.length === 0;
        }
    }

    setupPerformanceEvaluation() {
        const container = document.getElementById('performance-container');
        container.innerHTML = '';
        
        if (this.selectedPartners.length === 0) return;
        
        this.currentPartnerIndex = 0;
        this.createPartnerEvaluationPage();
        this.updatePartnerNavigation();
    }

    createPartnerEvaluationPage() {
        const container = document.getElementById('performance-container');
        const partner = this.selectedPartners[this.currentPartnerIndex];
        
        container.innerHTML = `
            <h3>Bewertung: ${partner.name}</h3>
            <p class="step-description">Bewerte, wie gut ${partner.name} die folgenden Kriterien erfüllt:</p>
            <div id="performance-criteria-container"></div>
        `;
        
        const criteriaContainer = document.getElementById('performance-criteria-container');
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

            criteria.forEach((criterion, index) => {
                const rawId = criterion.id;
                // WICHTIG: Unique DOM ID für Step 4
                const domId = 'perf_' + rawId;
                
                // FIX: Standardwerte sicherstellen
                if (!this.performanceData[partner.id]) {
                    this.performanceData[partner.id] = {};
                }
                if (this.performanceData[partner.id][rawId] === undefined) {
                    this.performanceData[partner.id][rawId] = 5;
                }

                const rowDiv = document.createElement('div');
                rowDiv.className = 'criteria-row';

                const infoDiv = document.createElement('div');
                infoDiv.className = 'criteria-info';
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'criteria-name';
                nameDiv.textContent = criterion.Kriterium;
                
                const descDiv = document.createElement('div');
                descDiv.className = 'criteria-description';
                descDiv.textContent = criterion.Erläuterung;
                
                infoDiv.appendChild(nameDiv);
                infoDiv.appendChild(descDiv);
                rowDiv.appendChild(infoDiv);

                const sliderDiv = document.createElement('div');
                sliderDiv.className = 'criteria-content';
                // Hier auch Unique ID nutzen
                sliderDiv.innerHTML = this.createSliderHTML(domId, rawId, 'performance');
                rowDiv.appendChild(sliderDiv);

                tableDiv.appendChild(rowDiv);
            });

            groupDiv.appendChild(tableDiv);
            criteriaContainer.appendChild(groupDiv);
        });

        // Gespeicherte Werte wiederherstellen
        this.restorePartnerValues(partner.id);
        
        // Event Listeners für neue Slider
        this.bindSliderEvents('performance');
    }

    restorePartnerValues(partnerId) {
        if (this.performanceData[partnerId]) {
            // rawId ist hier der Key (z.B. 10)
            Object.entries(this.performanceData[partnerId]).forEach(([rawId, value]) => {
                // Wir müssen die DOM-ID rekonstruieren ('perf_' + 10)
                const domId = 'perf_' + rawId;
                const slider = document.getElementById(domId);
                if (slider) {
                    slider.value = value;
                    this.updateSliderValue(slider);
                }
            });
        }
    }

    updatePartnerNavigation() {
        const prevBtn = document.getElementById('prev-partner');
        const nextBtn = document.getElementById('next-partner');
        const progress = document.getElementById('partner-progress');
        
        prevBtn.disabled = this.currentPartnerIndex === 0;
        nextBtn.disabled = this.currentPartnerIndex === this.selectedPartners.length - 1;
        
        progress.textContent = `Partner ${this.currentPartnerIndex + 1} von ${this.selectedPartners.length}`;
        
        const wizardNextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        if (this.currentPartnerIndex === this.selectedPartners.length - 1) {
            wizardNextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-flex';
        } else {
            wizardNextBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'none';
        }
    }

    getCurrentPartnerId() {
        return this.selectedPartners[this.currentPartnerIndex].id;
    }

    bindEvents() {
        // Navigation Buttons
        document.getElementById('prev-btn').addEventListener('click', () => this.previousStep());
        document.getElementById('next-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitSurvey());
        document.getElementById('restart-survey').addEventListener('click', () => this.restartSurvey());

        // Partner Navigation
        document.getElementById('prev-partner').addEventListener('click', () => this.previousPartner());
        document.getElementById('next-partner').addEventListener('click', () => this.nextPartner());

        // Error Modal
        document.getElementById('close-error').addEventListener('click', () => this.hideError());
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigationButtons();
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep === 3) {
                this.setupPerformanceEvaluation();
            }
            
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigationButtons();
        }
    }

    previousPartner() {
        if (this.currentPartnerIndex > 0) {
            this.currentPartnerIndex--;
            this.createPartnerEvaluationPage();
            this.updatePartnerNavigation();
        }
    }

    nextPartner() {
        if (this.currentPartnerIndex < this.selectedPartners.length - 1) {
            this.currentPartnerIndex++;
            this.createPartnerEvaluationPage();
            this.updatePartnerNavigation();
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
                
                // Persönliche Daten speichern (inkl IDs, Name, Email, Manager)
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
                // Importance-Daten sind bereits in this.importanceData gespeichert
                return true;
                
            case 3:
                if (this.selectedPartners.length === 0) {
                    this.showError('Bitte wähle mindestens einen Partner aus.');
                    return false;
                }
                return true;
            case 4:
                // Performance-Daten sind bereits gespeichert
                return true;
                
            default:
                return true;
        }
    }

    showStep(stepNumber) {
        // Alle Schritte verstecken
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Aktuellen Schritt anzeigen
        document.getElementById(`wizard-step-${stepNumber}`).classList.add('active');
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        // Steps aktualisieren
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
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-flex';
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
        this.showLoading(true);
        
        try {
            const surveyData = {
                survey_id: this.surveyId,
                department_id: this.personalData.final_dept_id, 
                name: this.personalData.name,
                email: this.personalData.email,
                is_manager: this.personalData.is_manager,
                
                importance: this.importanceData,
                performance: this.performanceData,
                
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('php/save_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(surveyData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success' || result.id) {
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

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    new QualityIndexWizard();
});