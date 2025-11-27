/*
  Datei: js/wizard-data-view.js
  Zweck: View-Logik und HTML-Generierung für Wichtigkeit & Performance-Slider
  # Created: 27.11.2025, 15:40 - Extracted Rendering Logic from wizard-controller.js (AP 10)
*/

import { CONFIG } from './config.js';

export class DataView {
    constructor(state, callbacks) {
        this.state = state; // Zugriff auf z.B. criteriaData, isTestMode
        this.callbacks = callbacks; // Funktionen zum Speichern der Werte
    }
    
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

    setupImportanceCriteria() {
        const { criteriaData, isTestMode, callbacks } = this.state;

        setTimeout(() => {
            const container = document.getElementById('importance-criteria-container');
            const groupedCriteria = this.groupCriteria(criteriaData);

            container.innerHTML = ''; // Leeren vor dem Rendern

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
                        // Stellt sicher, dass 0 als initialer Wert gesetzt wird
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

            this.callbacks.bindSliderEvents('importance');
        }, 10);
    }
    
    // Helper für Header Slider (Frequenz & NPS)
    createHeaderSliderHTML(domId, type, initialValue, min, max, labels) {
        // Bestimme visuelle Klasse: Grau wenn Startwert
        let extraClass = 'slider-neutral';
        let displayValue = 'Bitte wählen...';

        if (type === 'frequency' && initialValue > 0) {
            extraClass = '';
            displayValue = labels[initialValue] || initialValue;
        } else if (type === 'nps' && initialValue > CONFIG.WIZARD.NPS_RANGES.NA_VALUE) {
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

    renderPartnerView(partner) {
        const { isTestMode, criteriaData, partnerFeedback, performanceData } = this.state;
        const partnerId = partner.id;

        // Initiale Datenstrukturen sicherstellen
        if (!partnerFeedback[partnerId]) {
            // Test Mode Werte oder Default
            partnerFeedback[partnerId] = {
                frequency: isTestMode ? (Math.floor(Math.random() * 4) + 1) : 0,
                nps: isTestMode ? (Math.floor(Math.random() * 11)) : CONFIG.WIZARD.NPS_RANGES.NA_VALUE, 
                general_comment: ""
            };
        }
        const pf = partnerFeedback[partnerId];
        const initialComment = this.callbacks.escapeHtml(pf.general_comment || '');

        // Header (Freq, Comment, NPS)
        const headerHTML = `
            <h3>Bewertung: ${this.callbacks.escapeHtml(partner.name)}</h3>
            <div class="partner-header" style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ecf0f1; margin-bottom:30px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Wie häufig arbeitest Du mit ${this.callbacks.escapeHtml(partner.name)} zusammen? *</label>
                        ${this.createHeaderSliderHTML(`freq_${partnerId}`, 'frequency', pf.frequency, 0, CONFIG.WIZARD.FREQUENCY_MAX, {1:"Selten", 2:"Monatlich / Gelegentlich", 4:"Täglich / Intensiv"})}
                    </div>
                    <div class="form-group">
                        <label>Generelles Feedback (optional):</label>
                        <textarea id="gen_comment_${partnerId}" placeholder="[FREIWILLIG: Dein generelles Feedback]" style="width:100%; height:80px; padding:10px; border:2px solid #ddd; border-radius:8px; resize:vertical;">${initialComment}</textarea>
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
            <div id="performance-criteria-container-${partnerId}">`; // Eindeutige ID

        let criteriaHTML = '';
        const groupedCriteria = this.groupCriteria(criteriaData);

        Object.entries(groupedCriteria).forEach(([groupName, criteria]) => {
            criteriaHTML += `<div class="criteria-group">
                <div class="criteria-group-title">${groupName}</div>
                <div class="criteria-table">`;

            criteria.forEach((criterion) => {
                const rawId = criterion.id;
                const domId = 'perf_' + rawId + '_' + partnerId; // Eindeutige ID pro Partner/Kriterium
                
                // Initiale Datenlogik
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
                        currentVal = storedData; // Fallback für alte Datenstruktur
                    }
                } else if (isTestMode) {
                    currentVal = Math.floor(Math.random() * 10) + 1; 
                    // Setze die volle Objektstruktur, um Konsistenz zu gewährleisten
                    performanceData[partnerId][rawId] = { score: currentVal, comment: '' };
                } else {
                    performanceData[partnerId][rawId] = { score: 0, comment: '' };
                }

                // XSS-Schutz für Kommentar in Textarea
                const escapedComment = this.callbacks.escapeHtml(currentComment);
                
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
}