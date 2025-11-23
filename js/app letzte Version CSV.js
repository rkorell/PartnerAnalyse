// Modified: November 21, 2025, 20:50 - Vollständiges JavaScript für Cisco Partner Quality Index Wizard erstellt

class QualityIndexWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
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
            await this.loadConfigData();
            this.setupUI();
            this.bindEvents();
            this.updateProgress();
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            this.showError('Fehler beim Laden der Konfigurationsdaten');
        }
    }

    async loadConfigData() {
        try {
            // CSV-Dateien laden
            const [hierarchyResponse, criteriaResponse, partnerResponse] = await Promise.all([
                fetch('config/hierarchie.csv'),
                fetch('config/kriterien.csv'),
                fetch('config/partner.csv')
            ]);

            const hierarchyText = await hierarchyResponse.text();
            const criteriaText = await criteriaResponse.text();
            const partnerText = await partnerResponse.text();

            // CSV parsen
            this.hierarchyData = this.parseCSV(hierarchyText, true);
            this.criteriaData = this.parseCSV(criteriaText, true);
            this.partnerData = this.parseCSV(partnerText, false);

        } catch (error) {
            throw new Error('Konfigurationsdateien konnten nicht geladen werden: ' + error.message);
        }
    }



    parseCSV(text, hasHeader) {
        const lines = text.trim().split('\n');
        const result = [];
        
        //console.log(`=== CSV Parsing ===`);
        //console.log(`Zeilen gesamt:`, lines.length);
        //console.log(`Hat Header:`, hasHeader);
        
        const startIndex = hasHeader ? 1 : 0;
        //console.log(`Start-Index:`, startIndex);
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = line.split(';').map(val => val.trim());
                console.log(`Zeile ${i}:`, values);
                result.push(values);
            }
        }
        
        //console.log(`Ergebnis:`, result);
        return result;
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

        // Unique Abteilungen extrahieren
        const departments = [...new Set(this.hierarchyData.map(row => row[0]))];
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
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
        
        const selectedDepartment = departmentSelect.value;
        if (!selectedDepartment) return;

        const areas = [...new Set(
            this.hierarchyData
                .filter(row => row[0] === selectedDepartment && row[1])
                .map(row => row[1])
        )];

        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });
    }

    updateTeams() {
        const departmentSelect = document.getElementById('department');
        const areaSelect = document.getElementById('area');
        const teamSelect = document.getElementById('team');
        
        teamSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        
        const selectedDepartment = departmentSelect.value;
        const selectedArea = areaSelect.value;
        
        if (!selectedDepartment || !selectedArea) return;

        const teams = this.hierarchyData
            .filter(row => row[0] === selectedDepartment && row[1] === selectedArea && row[2])
            .map(row => row[2]);

        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
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
                    //const criterionId = `importance_${groupName}_${index}`;
                    const criterionId = `importance_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'criteria-row';

                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'criteria-info';
                    
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'criteria-name';
                    nameDiv.textContent = criterion[1];
                    
                    const descDiv = document.createElement('div');
                    descDiv.className = 'criteria-description';
                    descDiv.textContent = criterion[2];
                    
                    infoDiv.appendChild(nameDiv);
                    infoDiv.appendChild(descDiv);
                    rowDiv.appendChild(infoDiv);

                    const sliderDiv = document.createElement('div');
                    sliderDiv.className = 'criteria-content';
                    sliderDiv.innerHTML = this.createSliderHTML(criterionId, 'importance');
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
            const groupName = criterion[0];
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(criterion);
        });
        return grouped;
    }

    createSliderHTML(id, type) {
        const tooltipText = type === 'importance' 
            ? 'ist mir eher unwichtig|ist mir extrem wichtig'
            : 'erfüllt der Partner sehr schlecht|erfüllt der Partner sehr gut';
        
        const [minText, maxText] = tooltipText.split('|');

        return `
            <div class="slider-container">
                <span class="slider-label">0</span>
                <div class="slider-wrapper">
                    <input type="range" 
                           id="${id}" 
                           class="fancy-slider" 
                           min="0" 
                           max="10" 
                           value="5" 
                           data-type="${type}">
                    <div class="slider-tooltip" id="tooltip_${id}">
                        5 - Neutral
                    </div>
                </div>
                <span class="slider-label">10</span>
                <span class="slider-value" id="value_${id}">5</span>
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
        console.log(`Slider ID:`, slider.id);
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
        
        // Daten speichern
        if (type === 'importance') {
            this.importanceData[slider.id] = value;
        } else {
            const partnerName = this.getCurrentPartnerName();
            if (partnerName) {
                if (!this.performanceData[partnerName]) {
                    this.performanceData[partnerName] = {};
                }
                this.performanceData[partnerName][slider.id] = value;
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
        
        this.partnerData.forEach((partner, index) => {
            const partnerName = partner[0];
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'partner-checkbox';
            
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="partner_${index}" value="${partnerName}">
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
            .map(cb => cb.value);
        
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
        const partnerName = this.selectedPartners[this.currentPartnerIndex];
        
        container.innerHTML = `
            <h3>Bewertung: ${partnerName}</h3>
            <p class="step-description">Bewerten Sie, wie gut ${partnerName} die folgenden Kriterien erfüllt:</p>
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
                //const criterionId = `performance_${partnerName}_${groupName}_${index}`;
                const criterionId = `performance_${partnerName.replace(/[^a-zA-Z0-9]/g, '_')}_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                const rowDiv = document.createElement('div');
                rowDiv.className = 'criteria-row';

                const infoDiv = document.createElement('div');
                infoDiv.className = 'criteria-info';
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'criteria-name';
                nameDiv.textContent = criterion[1];
                
                const descDiv = document.createElement('div');
                descDiv.className = 'criteria-description';
                descDiv.textContent = criterion[2];
                
                infoDiv.appendChild(nameDiv);
                infoDiv.appendChild(descDiv);
                rowDiv.appendChild(infoDiv);

                const sliderDiv = document.createElement('div');
                sliderDiv.className = 'criteria-content';
                sliderDiv.innerHTML = this.createSliderHTML(criterionId, 'performance');
                rowDiv.appendChild(sliderDiv);

                tableDiv.appendChild(rowDiv);
            });

            groupDiv.appendChild(tableDiv);
            criteriaContainer.appendChild(groupDiv);
        });

        // Gespeicherte Werte wiederherstellen
        this.restorePartnerValues(partnerName);
        
        // Event Listeners für neue Slider
        this.bindSliderEvents('performance');
    }

    restorePartnerValues(partnerName) {
        if (this.performanceData[partnerName]) {
            Object.entries(this.performanceData[partnerName]).forEach(([sliderId, value]) => {
                const slider = document.getElementById(sliderId);
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
        
        // Wizard Navigation anpassen
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

    getCurrentPartnerName() {
        return this.selectedPartners[this.currentPartnerIndex];
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
                const department = document.getElementById('department').value;
                if (!department) {
                    this.showError('Bitte wählen Sie eine Abteilung aus.');
                    return false;
                }
                
                // Persönliche Daten speichern
                this.personalData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    department: department,
                    area: document.getElementById('area').value,
                    team: document.getElementById('team').value
                };
                return true;
                
            case 2:
                // Importance-Daten sind bereits in this.importanceData gespeichert
                return true;
                
            case 3:
                if (this.selectedPartners.length === 0) {
                    this.showError('Bitte wählen Sie mindestens einen Partner aus.');
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
                personal: this.personalData,
                importance: this.importanceData,
                performance: this.performanceData,
                selectedPartners: this.selectedPartners,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('php/save_data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(surveyData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentStep = 5;
                this.showStep(this.currentStep);
                this.updateProgress();
                this.updateNavigationButtons();
            } else {
                throw new Error(result.message || 'Unbekannter Fehler');
            }
            
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.showError('Fehler beim Speichern der Daten: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    restartSurvey() {
        // Reset all data
        this.currentStep = 1;
        this.currentPartnerIndex = 0;
        this.selectedPartners = [];
        this.importanceData = {};
        this.performanceData = {};
        this.personalData = {};
        
        // Reset form
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('department').value = '';
        document.getElementById('area').innerHTML = '<option value="">Bitte wählen...</option>';
        document.getElementById('team').innerHTML = '<option value="">Bitte wählen...</option>';
        
        // Reset partner selection
        document.querySelectorAll('#partner-selection-container input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('selected');
        });
        
        document.getElementById('selected-partners-count').textContent = '0';
        
        // Reset sliders
        document.querySelectorAll('.fancy-slider').forEach(slider => {
            slider.value = 5;
            this.updateSliderValue(slider);
        });
        
        this.showStep(1);
        this.updateProgress();
        this.updateNavigationButtons();
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