/*
  Datei: js/wizard-data-view.js
  Zweck: View-Logik für Wichtigkeit & Performance-Slider
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 27.11.2025, 15:40 - Extracted Rendering Logic from wizard-controller.js (AP 10)
  # Modified: 27.11.2025, 15:50 - Moved all Slider/Input Handler Logic from controller (AP 10 Deep Refactoring)
  # Modified: 27.11.2025, 17:45 - Refactoring: Deduplicated slider HTML generation and fixed tooltip toggle (AP 13)
  # Modified: 27.11.2025, 18:00 - CSS Cleanup (AP 14): Replaced inline styles with CSS classes.
  # Modified: 27.11.2025, 18:30 - FIX: Critical Regression (AP 15). Data Setters were inside 'else' block, preventing '0' (N/A) from being saved.
  # Modified: 28.11.2025, 13:00 - AP 21: CamelCase consolidation for generalComment
  # Modified: 28.11.2025, 15:15 - AP 18: Refactored slider markup (DRY) and fixed layout/value update logic
  # Modified: 28.11.2025, 15:30 - AP 24: Use central CONFIG for render delays
  # Modified: 28.11.2025, 16:00 - AP 25: Extracted HTML generation to templates.js
  # Modified: 28.11.2025, 17:00 - AP 27: Prefer loaded state over default/random values in initialization
*/

import { CONFIG } from './config.js';
import * as Tpl from './templates.js';

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
    
    // --- HAUPT VIEW METHODEN ---

    setupImportanceCriteria() {
        const { criteriaData, isTestMode, importanceData } = this.state;

        // AP 24: Nutzung von CONFIG.UI.RENDER_DELAY_MS
        setTimeout(() => {
            const container = document.getElementById('importance-criteria-container');
            const groupedCriteria = this.groupCriteria(criteriaData);

            container.innerHTML = ''; 

            Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
                let rowsHTML = '';

                criteria.forEach((criterion) => {
                    const rawId = criterion.id;
                    const domId = 'imp_' + rawId;
                    
                    // AP 27: Daten aus State bevorzugen
                    let initialValue = 0;
                    if (importanceData && importanceData[rawId] !== undefined) {
                        initialValue = importanceData[rawId];
                    } else {
                        // Fallback auf Test/Default
                        if (isTestMode) {
                            initialValue = Math.floor(Math.random() * 10) + 1;
                        } else {
                            initialValue = 0;
                        }
                        // Wert im State setzen, damit es konsistent ist
                        this.callbacks.setImportance(rawId, initialValue);
                    }

                    // AP 25: Template Usage
                    const sliderHTML = this.createSliderHTML(domId, rawId, 'importance', initialValue);
                    rowsHTML += Tpl.getCriteriaRowHTML(criterion.name, criterion.description, sliderHTML);
                });

                container.innerHTML += Tpl.getCriteriaGroupStartHTML(groupName) + rowsHTML + '</div></div>';
            });

            this.bindSliderEvents('importance');
        }, CONFIG.UI.RENDER_DELAY_MS);
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

        // AP 25: Template Usage
        return Tpl.getSliderHTML(domId, type, min, max, initialValue, {
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
            // AP 25: Template Usage
            iconHTML = Tpl.getCommentIconHTML(domId, isExtreme);
        }

        // AP 25: Template Usage
        const sliderContainer = Tpl.getSliderHTML(domId, type, 0, 10, initialValue, {
            rawId: rawId,
            extraInputClass: extraInputClass,
            displayValue: displayValue,
            showMinMaxLabels: true,
            valueLabelClass: 'slider-value',
            iconHTML: iconHTML
        });

        // AP 25: Template Usage
        const commentHTML = type === 'performance' 
            ? Tpl.getCommentBoxHTML(domId, '[FREIWILLIG: Warum diese Bewertung?]')
            : '';

        return sliderContainer + commentHTML;
    }
    
    renderPartnerView(partner) {
        const { isTestMode, criteriaData, partnerFeedback, performanceData } = this.state;
        const partnerId = partner.id;

        // AP 27: Hier prüfen wir auch den State, bevor wir initialisieren
        // Da partnerFeedback direkt aus this.state kommt, ist es bereits geladen (durch _loadState im Controller)
        if (!partnerFeedback[partnerId]) {
            partnerFeedback[partnerId] = {
                frequency: isTestMode ? (Math.floor(Math.random() * 4) + 1) : 0,
                nps: isTestMode ? (Math.floor(Math.random() * 11)) : CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 
                generalComment: ""
            };
        }
        const pf = partnerFeedback[partnerId];
        const initialComment = pf.generalComment || '';

        // AP 25: Header Template
        const freqSliderHTML = this.createHeaderSliderHTML(`freq_${partnerId}`, 'frequency', pf.frequency, 0, CONFIG.WIZARD.FREQUENCY_MAX, {1:"Selten", 2:"Monatlich / Gelegentlich", 4:"Täglich / Intensiv"});
        const npsSliderHTML = this.createHeaderSliderHTML(`nps_${partnerId}`, 'nps', pf.nps, CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 10, {});
        
        const headerHTML = Tpl.getPartnerHeaderHTML(partner.name, freqSliderHTML, npsSliderHTML, initialComment, partnerId);

        let criteriaHTML = '';
        const groupedCriteria = this.groupCriteria(criteriaData);

        Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
            let rowsHTML = '';
            
            criteria.forEach((criterion) => {
                const rawId = criterion.id;
                const domId = 'perf_' + rawId + '_' + partnerId; 
                
                if (!performanceData[partnerId]) {
                    performanceData[partnerId] = {};
                }
                
                // AP 27: Daten aus State verwenden
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

                const sliderContainer = this.createSliderHTMLWithComment(domId, rawId, 'performance', currentVal, currentComment);
                rowsHTML += Tpl.getCriteriaRowHTML(criterion.name, criterion.description, sliderContainer);
            });

            criteriaHTML += Tpl.getCriteriaGroupStartHTML(groupName) + rowsHTML + '</div></div>';
        });
        
        return `<div id="partner-view-${partnerId}" style="display: none;">${headerHTML}${criteriaHTML}</div></div>`;
    }

    // Hilfsmethode für AP 25 Refactoring (Kommentar-Support)
    createSliderHTMLWithComment(domId, rawId, type, initialValue, initialComment) {
        const extraInputClass = initialValue === 0 ? 'slider-neutral' : '';
        const displayValue = initialValue === 0 ? 'N/A' : initialValue;
        
        let iconHTML = '';
        const isExtreme = (initialValue > 0 && initialValue <= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MIN) || initialValue >= CONFIG.WIZARD.PERFORMANCE_COMMENT_THRESHOLD.MAX;
        iconHTML = Tpl.getCommentIconHTML(domId, isExtreme);

        const sliderContainer = Tpl.getSliderHTML(domId, type, 0, 10, initialValue, {
            rawId: rawId,
            extraInputClass: extraInputClass,
            displayValue: displayValue,
            showMinMaxLabels: true,
            valueLabelClass: 'slider-value',
            iconHTML: iconHTML
        });

        const isHidden = !initialComment || initialComment.trim() === '';
        const commentHTML = Tpl.getCommentBoxHTML(domId, '[FREIWILLIG: Warum diese Bewertung?]', initialComment, isHidden);

        return sliderContainer + commentHTML;
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
        
        let displayValue = value; 
        let tooltipText = `${value} - Neutral`;
        let isNeutral = false;

        if (type === 'frequency') {
            const labels = {1: "Selten / Einmalig", 2: "Monatlich / Gelegentlich", 3: "Wöchentlich / Regelmäßig", 4: "Täglich / Intensiv"};
            if (value === 0) {
                isNeutral = true;
                displayValue = "Bitte wählen...";
                tooltipText = displayValue;
            } else {
                displayValue = labels[value] || value; 
                tooltipText = displayValue;
            }
            this.callbacks.setFeedback(this.callbacks.getCurrentPartnerId(), 'frequency', value);

        } else if (type === 'nps') {
            if (value === CONFIG.WIZARD.NPS_RANGES.NA_VALUE || value === -2) {
                isNeutral = true;
                displayValue = "Bitte wählen...";
                tooltipText = displayValue;
            } else {
                if (value === -1) displayValue = "Möchte ich nicht bewerten";
                else if (value === 0) displayValue = "0 - Auf keinen Fall";
                else if (value >= 1 && value <= 3) displayValue = value + " - Eher nicht";
                else if (value >= 4 && value <= 6) displayValue = value + " - Eher schon";
                else if (value >= 7 && value <= 10) displayValue = value + " - Auf jeden Fall";
                else displayValue = value; 
                
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
        
        if (isNeutral) {
            slider.classList.add('slider-neutral');
        } else {
            slider.classList.remove('slider-neutral');
        }

        if (valueDisplay) valueDisplay.textContent = displayValue;
        if (tooltip && !isNeutral) tooltip.textContent = tooltipText;
    }
}