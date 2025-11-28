/*
  Datei: js/wizard-data-view.js
  Zweck: View-Logik und HTML-Generierung für Wichtigkeit & Performance-Slider
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 27.11.2025, 15:40 - Extracted Rendering Logic from wizard-controller.js (AP 10)
  # Modified: 27.11.2025, 15:50 - Moved all Slider/Input Handler Logic from controller (AP 10 Deep Refactoring)
  # Modified: 27.11.2025, 17:45 - Refactoring: Deduplicated slider HTML generation and fixed tooltip toggle (AP 13)
  # Modified: 27.11.2025, 18:00 - CSS Cleanup (AP 14): Replaced inline styles with CSS classes.
  # Modified: 27.11.2025, 18:30 - FIX: Critical Regression (AP 15). Data Setters were inside 'else' block, preventing '0' (N/A) from being saved.
  # Modified: 28.11.2025, 12:30 - FIX: Slider layout & value update logic (AP 18 Revision)
  # Modified: 28.11.2025, 13:00 - AP 21: CamelCase consolidation for generalComment
*/

import { CONFIG } from './config.js';

export class DataView {
    constructor(state, callbacks) {
        this.state = state; 
        this.callbacks = callbacks; 
    }
    
    // --- PRIVATE/HELPER METHODEN ---
    
    groupCriteria(criteriaData) {
        const grouped = {};
        criteriaData.forEach(criterion => {
            const groupName = criterion.category;
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(criterion);
        });
        return grouped;
    }

    showSliderTooltip(slider, show = true) {
        const tooltip = document.getElementById(`tooltip_${slider.id}`);
        if (tooltip) {
            tooltip.style.opacity = show ? '1' : '0';
        }
    }

    /**
     * Zentralisierte Methode zur Generierung des gesamten Slider-Markups.
     * Ersetzt die redundante HTML-Erzeugung in createHeaderSliderHTML und createSliderHTML.
     * WICHTIG: Keine Zeilenumbrüche/Whitespace im Return-String, da Flexbox-Gap diese als Elemente interpretiert!
     */
    _generateSliderMarkup(domId, type, min, max, value, options = {}) {
        const {
            rawId = null,
            extraInputClass = '',
            displayValue = '',
            showMinMaxLabels = false,
            valueLabelClass = 'slider-value',
            iconHTML = ''
        } = options;

        const critAttr = rawId ? `data-crit-id="${rawId}"` : '';
        
        // Kompakter HTML String ohne Whitespace zwischen Tags
        const wrapperHTML = `<div class="slider-wrapper"><input type="range" id="${domId}" ${critAttr} class="fancy-slider ${extraInputClass}" min="${min}" max="${max}" value="${value}" data-type="${type}"><div class="slider-tooltip" id="tooltip_${domId}">${displayValue}</div></div>`;

        const leftLabel = showMinMaxLabels ? `<span class="slider-label">${min}</span>` : '';
        const rightLabel = showMinMaxLabels ? `<span class="slider-label">${max}</span>` : '';

        return `<div class="slider-container">${leftLabel}${wrapperHTML}${rightLabel}<span class="slider-value ${valueLabelClass}" id="value_${domId}">${displayValue}</span>${iconHTML}</div>`;
    }
    
    // --- HAUPT VIEW METHODEN ---

    setupImportanceCriteria() {
        const { criteriaData, isTestMode } = this.state;

        setTimeout(() => {
            const container = document.getElementById('importance-criteria-container');
            const groupedCriteria = this.groupCriteria(criteriaData);

            container.innerHTML = ''; 

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
                    if (isTestMode) {
                        initialValue = Math.floor(Math.random() * 10) + 1;
                        this.callbacks.setImportance(rawId, initialValue);
                    } else {
                        this.callbacks.setImportance(rawId, 0); 
                    }

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
    
    createHeaderSliderHTML(domId, type, initialValue, min, max, labels) {
        let extraInputClass = 'slider-neutral';
        let displayValue = 'Bitte wählen...';

        if (type === 'frequency' && initialValue > 0) {
            extraInputClass = '';
            displayValue = labels[initialValue] || initialValue;
        } else if (type === 'nps' && initialValue > CONFIG.WIZARD.NPS_RANGES.NA_VALUE) {
            extraInputClass = '';
            if (labels[initialValue]) {
                displayValue = labels[initialValue].replace('{Val}', initialValue);
            } else {
                if (initialValue === 0) displayValue = "0 - Auf keinen Fall";
                else if (initialValue >= 1 && initialValue <= 3) displayValue = initialValue + " - Eher nicht";
                else if (initialValue >= 4 && initialValue <= 6) displayValue = initialValue + " - Eher schon";
                else if (initialValue >= 7 && initialValue <= 10) displayValue = initialValue + " - Auf jeden Fall";
                else if (initialValue === -1) displayValue = "Möchte ich nicht bewerten";
            }
        }

        return this._generateSliderMarkup(domId, type, min, max, initialValue, {
            extraInputClass: extraInputClass,
            displayValue: displayValue,
            showMinMaxLabels: false,
            valueLabelClass: 'slider-value slider-value-label'
        });
    }

    createSliderHTML(domId, rawId, type, initialValue = 0) {
        const extraInputClass = initialValue === 0 ? 'slider-neutral' : '';
        const displayValue = initialValue === 0 ? 'N/A' : initialValue;
        
        let iconHTML = '';
        if (type === 'performance') {
            const isExtreme = (initialValue > 0 && initialValue <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) || initialValue >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX;
            const visibility = isExtreme ? 'visible' : 'hidden';
            iconHTML = `<span class="comment-icon" id="icon_${domId}" style="visibility:${visibility}; cursor:pointer; font-size:1.2em; margin-left:10px;" title="Kommentar hinzufügen">📝</span>`;
        }

        const sliderContainer = this._generateSliderMarkup(domId, type, 0, 10, initialValue, {
            rawId: rawId,
            extraInputClass: extraInputClass,
            displayValue: displayValue,
            showMinMaxLabels: true,
            valueLabelClass: 'slider-value',
            iconHTML: iconHTML
        });

        const commentHTML = type === 'performance' 
            ? `<div id="comment_container_${domId}" class="comment-container"><textarea id="comment_${domId}" class="comment-textarea" placeholder="[FREIWILLIG: Warum diese Bewertung?]"></textarea></div>` 
            : '';

        return sliderContainer + commentHTML;
    }
    
    renderPartnerView(partner) {
        const { isTestMode, criteriaData, partnerFeedback, performanceData } = this.state;
        const partnerId = partner.id;

        if (!partnerFeedback[partnerId]) {
            partnerFeedback[partnerId] = {
                frequency: isTestMode ? (Math.floor(Math.random() * 4) + 1) : 0,
                nps: isTestMode ? (Math.floor(Math.random() * 11)) : CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 
                // HIER GEÄNDERT (AP 21): CamelCase
                generalComment: ""
            };
        }
        const pf = partnerFeedback[partnerId];
        // HIER GEÄNDERT (AP 21): CamelCase Zugriff
        const initialComment = this.callbacks.escapeHtml(pf.generalComment || '');

        const headerHTML = `
            <h3>Bewertung: ${this.callbacks.escapeHtml(partner.name)}</h3>
            <div class="partner-header-box">
                <div class="form-row">
                    <div class="form-group">
                        <label>Wie häufig arbeitest Du mit ${this.callbacks.escapeHtml(partner.name)} zusammen? *</label>
                        ${this.createHeaderSliderHTML(`freq_${partnerId}`, 'frequency', pf.frequency, 0, CONFIG.WIZARD.FREQUENCY_MAX, {1:"Selten", 2:"Monatlich / Gelegentlich", 4:"Täglich / Intensiv"})}
                    </div>
                    <div class="form-group">
                        <label>Generelles Feedback (optional):</label>
                        <textarea id="gen_comment_${partnerId}" class="comment-textarea-large" placeholder="[FREIWILLIG: Dein generelles Feedback]">${initialComment}</textarea>
                    </div>
                </div>
                <div class="form-row" style="margin-top:20px;">
                    <div class="form-group" style="width:100%;">
                        <label>Würdest Du ${this.callbacks.escapeHtml(partner.name)} weiterempfehlen? (NPS) *</label>
                        ${this.createHeaderSliderHTML(`nps_${partnerId}`, 'nps', pf.nps, CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 10, {})}
                    </div>
                </div>
            </div>
            <hr style="margin-bottom:30px; border:0; border-top:1px solid #eee;">
            <div id="performance-criteria-container-${partnerId}">`;

        let criteriaHTML = '';
        const groupedCriteria = this.groupCriteria(criteriaData);

        Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
            criteriaHTML += `<div class="criteria-group">
                <div class="criteria-group-title">${groupName}</div>
                <div class="criteria-table">`;

            criteria.forEach((criterion) => {
                const rawId = criterion.id;
                const domId = 'perf_' + rawId + '_' + partnerId; 
                
                if (!performanceData[partnerId]) {
                    performanceData[partnerId] = {};
                }
                
                let storedData = performanceData[partnerId][rawId];
                let currentVal = 0;
                let currentComment = '';

                if (storedData !== undefined) {
                    if (typeof storedData === 'object') {
                        currentVal = storedData.score;
                        currentComment = storedData.comment || '';
                    } else {
                        currentVal = storedData;
                    }
                } else if (isTestMode) {
                    currentVal = Math.floor(Math.random() * 10) + 1; 
                    performanceData[partnerId][rawId] = { score: currentVal, comment: '' };
                } else {
                    performanceData[partnerId][rawId] = { score: 0, comment: '' };
                }

                const escapedComment = this.callbacks.escapeHtml(currentComment);
                
                const sliderAndCommentHTML = `
                    <div class="criteria-content">
                        ${this.createSliderHTML(domId, rawId, 'performance', currentVal)}
                        <div id="comment_container_${domId}" class="comment-container" style="display:${currentComment.trim() !== '' ? 'block' : 'none'};">
                            <textarea id="comment_${domId}" class="comment-textarea" placeholder="[FREIWILLIG: Warum diese Bewertung?]"></textarea></div></div>`; 

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

    // --- EVENT BINDING & HANDLER LOGIK ---
    
    bindSliderEvents(type) {
        const sliders = document.querySelectorAll(`input[data-type="${type}"]`);
        
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target);
            });
            
            slider.addEventListener('mouseover', (e) => {
                this.showSliderTooltip(e.target);
            });
            
            slider.addEventListener('mouseout', (e) => {
                this.showSliderTooltip(e.target, false); 
            });
        });
    }
    
    bindCommentEvents(partnerId) {
        const currentView = document.getElementById(`partner-view-${partnerId}`);

        const icons = currentView.querySelectorAll('.comment-icon');
        icons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const domId = e.target.id.replace('icon_', ''); 
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
                const domId = e.target.id.replace('comment_', ''); 
                const parts = domId.split('_');
                const rawId = parts[1]; 
                const pId = parts[2]; 

                const val = e.target.value;
                this.callbacks.setPerformance(pId, rawId, undefined, val);
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
        
        let displayValue = value; // Default: Zeige Zahl
        let tooltipText = `${value} - Neutral`;
        let isNeutral = false;

        // SPEZIAL-LOGIK FÜR HEADER SLIDER (Frequenz & NPS)
        // Hier muss der Text ermittelt werden, nicht die Zahl!
        
        if (type === 'frequency') {
            const labels = {1: "Selten / Einmalig", 2: "Monatlich / Gelegentlich", 3: "Wöchentlich / Regelmäßig", 4: "Täglich / Intensiv"};
            if (value === 0) {
                isNeutral = true;
                displayValue = "Bitte wählen...";
                tooltipText = displayValue;
            } else {
                displayValue = labels[value] || value; // Text statt Zahl!
                tooltipText = displayValue;
            }
            this.callbacks.setFeedback(this.callbacks.getCurrentPartnerId(), 'frequency', value);

        } else if (type === 'nps') {
            if (value === CONFIG.WIZARD.NPS_RANGES.NA_VALUE || value === -2) {
                isNeutral = true;
                displayValue = "Bitte wählen...";
                tooltipText = displayValue;
            } else {
                // NPS Text Logik (Replikation aus createHeaderSliderHTML)
                if (value === -1) displayValue = "Möchte ich nicht bewerten";
                else if (value === 0) displayValue = "0 - Auf keinen Fall";
                else if (value >= 1 && value <= 3) displayValue = value + " - Eher nicht";
                else if (value >= 4 && value <= 6) displayValue = value + " - Eher schon";
                else if (value >= 7 && value <= 10) displayValue = value + " - Auf jeden Fall";
                else displayValue = value; // Fallback
                
                tooltipText = displayValue;
            }
            this.callbacks.setFeedback(this.callbacks.getCurrentPartnerId(), 'nps', value);

        } else if (type === 'importance') {
            if (value === 0) {
                isNeutral = true;
                displayValue = 'N/A';
                tooltipText = 'Keine Angabe';
            } else {
                if (value <= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MIN) tooltipText = `${value} - ist mir eher unwichtig`;
                else if (value >= CONFIG.WIZARD.IMPORTANCE_TOOLTIP_THRESHOLD.MAX) tooltipText = `${value} - ist mir extrem wichtig`;
                else tooltipText = `${value} - wichtig`;
            }
            this.callbacks.setImportance(rawId, value);

        } else if (type === 'performance') {
            if (value === 0) {
                isNeutral = true;
                displayValue = 'N/A';
                tooltipText = 'Keine Angabe';
            } else {
                if (value <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) tooltipText = `${value} - erfüllt der Partner sehr schlecht`;
                else if (value >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX) tooltipText = `${value} - erfüllt der Partner sehr gut`;
                else tooltipText = `${value} - neutral`;
            }
            
            const partnerId = this.callbacks.getCurrentPartnerId(); 
            if (partnerId) {
                this.callbacks.setPerformance(partnerId, rawId, value, undefined);
                
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
        
        // UI Updates
        if (isNeutral) {
            slider.classList.add('slider-neutral');
        } else {
            slider.classList.remove('slider-neutral');
        }

        if (valueDisplay) valueDisplay.textContent = displayValue; // Jetzt korrekt mit Text für Freq/NPS
        if (tooltip && !isNeutral) tooltip.textContent = tooltipText;
    }
}