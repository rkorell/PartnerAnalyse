/*
  Datei: js/templates.js
  Zweck: Zentrale Sammlung aller HTML-Templates (View-Komponenten)
  (c) - Dr. Ralf Korell, 2025/26
  
  # Created: 28.11.2025, 16:00 - AP 25: Extracted HTML templates from logic files
*/

import { escapeHtml } from './utils.js';

// --- WIZARD TEMPLATES ---

export function getSliderHTML(domId, type, min, max, value, options = {}) {
    const {
        rawId = null,
        extraInputClass = '',
        displayValue = '',
        showMinMaxLabels = false,
        valueLabelClass = 'slider-value',
        iconHTML = ''
    } = options;

    const critAttr = rawId ? `data-crit-id="${rawId}"` : '';
    
    // Kompakter HTML String
    const wrapperHTML = `<div class="slider-wrapper"><input type="range" id="${domId}" ${critAttr} class="fancy-slider ${extraInputClass}" min="${min}" max="${max}" value="${value}" data-type="${type}"><div class="slider-tooltip" id="tooltip_${domId}">${displayValue}</div></div>`;

    const leftLabel = showMinMaxLabels ? `<span class="slider-label">${min}</span>` : '';
    const rightLabel = showMinMaxLabels ? `<span class="slider-label">${max}</span>` : '';

    return `<div class="slider-container">${leftLabel}${wrapperHTML}${rightLabel}<span class="slider-value ${valueLabelClass}" id="value_${domId}">${displayValue}</span>${iconHTML}</div>`;
}

export function getCommentBoxHTML(domId, placeholder, initialValue = '', isHidden = true) {
    const style = isHidden ? 'style="display:none;"' : 'style="display:block;"';
    return `<div id="comment_container_${domId}" class="comment-container" ${style}><textarea id="comment_${domId}" class="comment-textarea" placeholder="${escapeHtml(placeholder)}">${escapeHtml(initialValue)}</textarea></div>`;
}

export function getPartnerHeaderHTML(partnerName, freqHTML, npsHTML, initialComment, partnerId) {
    return `
        <h3>Bewertung: ${escapeHtml(partnerName)}</h3>
        <div class="partner-header-box">
            <div class="form-row">
                <div class="form-group">
                    <label>Wie häufig arbeitest Du mit ${escapeHtml(partnerName)} zusammen? *</label>
                    ${freqHTML}
                </div>
                <div class="form-group">
                    <label>Generelles Feedback (optional):</label>
                    <textarea id="gen_comment_${partnerId}" class="comment-textarea-large" placeholder="[FREIWILLIG: Dein generelles Feedback]">${escapeHtml(initialComment)}</textarea>
                </div>
            </div>
            <div class="form-row" style="margin-top:20px;">
                <div class="form-group" style="width:100%;">
                    <label>Würdest Du ${escapeHtml(partnerName)} weiterempfehlen? (NPS) *</label>
                    ${npsHTML}
                </div>
            </div>
        </div>
        <hr style="margin-bottom:30px; border:0; border-top:1px solid #eee;">
        <div id="performance-criteria-container-${partnerId}">`;
}

export function getCriteriaGroupStartHTML(groupName) {
    return `<div class="criteria-group"><div class="criteria-group-title">${escapeHtml(groupName)}</div><div class="criteria-table">`;
}

export function getCriteriaRowHTML(name, description, contentHTML) {
    return `
    <div class="criteria-row">
        <div class="criteria-info">
            <div class="criteria-name">${escapeHtml(name)}</div>
            <div class="criteria-description">${escapeHtml(description)}</div>
        </div>
        <div class="criteria-content">${contentHTML}</div>
    </div>`;
}

export function getCommentIconHTML(domId, isVisible) {
    const visibility = isVisible ? 'visible' : 'hidden';
    return `<span class="comment-icon" id="icon_${domId}" style="visibility:${visibility}; cursor:pointer; font-size:1.2em; margin-left:10px;" title="Kommentar hinzufügen">📝</span>`;
}

// --- SCORE ANALYSE TEMPLATES ---

export function getScoreTableStartHTML(title) {
    return `
    <div class="criteria-group-title">${escapeHtml(title)}</div>
    <div class="criteria-table">
        <div class="criteria-row score-table-header">
            <div class="criteria-content col-partner">Partner</div>
            <div class="criteria-content col-score-graph">Score</div>
            <div class="criteria-content col-count">Anzahl Beurteiler</div>
            <div class="criteria-content col-insights text-center">Insights</div>
        </div>`;
}

export function getScoreRowHTML(row, pct, rgb, slots) {
    return `
    <div class="criteria-row partner-row-clickable score-table-row" data-partner-id="${row.partnerId}">
        <div class="criteria-content col-partner col-partner-link">${escapeHtml(row.partnerName)} ↗</div>
        
        <div class="criteria-content col-score-graph">
            <div class="score-bar-wrapper">
                <div class="score-bar-fill" style="width:${Math.round(pct*90)+10}%; background:${rgb};"></div>
            </div>
            <div class="score-bar-text">${row.score}</div>
        </div>
        
        <div class="criteria-content col-count">${row.totalAnswers}</div>
        
        <div class="criteria-content col-insights">
            <div class="insight-slot-nps">${slots.slot1}</div>
            <div class="insight-slot-icon">${slots.slot2}</div>
            <div class="insight-slot-mini">${slots.slot3}</div>
            <div class="insight-slot-mini">${slots.slot4}</div>
        </div>
    </div>`;
}

export function getLegendHTML() {
    return `
    <div class="icon-legend-box">
        <strong class="legend-label">Legende:</strong>
        <span class="legend-item">📣 NPS-Score</span>
        <span class="legend-item">💬 Kommentare vorhanden</span>
        <span class="legend-item">⚠️ Handlungsfelder (Vorschläge)</span>
        <span>⚡ Bewertungsunterschiede Mgmt/Field</span>
    </div>`;
}

export function getInsightNpsHTML(nps, color) {
    const sign = nps > 0 ? '+' : '';
    return `<span class="nps-display" title="NPS Score: ${nps}">📣 <span class="nps-value" style="color:${color};">${sign}${nps}</span></span>`;
}

export function getInsightIconHTML(action, id, title, content) {
    return `<span class="insight-icon action-icon" data-action="${action}" data-id="${id}" title="${escapeHtml(title)}">${content}</span>`;
}

// --- MODAL & MATRIX TEMPLATES ---

export function getModalContentHTML(title, content) {
    return `<h2 class="modal-headline">${escapeHtml(title)}</h2>${content}`;
}

export function getCommentsListHTML(title, items) {
    let html = `<h4>${escapeHtml(title)}</h4><ul>`;
    items.forEach(c => html += `<li>${escapeHtml(c)}</li>`);
    html += `</ul>`;
    return html;
}

export function getSpecificCommentsHTML(items) {
    let html = `<h4>Spezifisches Feedback</h4>`;
    items.forEach(d => {
        html += `<strong>${escapeHtml(d.name)}</strong> (I:${d.imp}/P:${d.perf})<ul>`;
        d.comments.forEach(c => html += `<li>${escapeHtml(c)}</li>`);
        html += `</ul>`;
    });
    return html;
}

export function getActionTableHTML(items) {
    let html = `<table class="modal-table"><tr><th>Kriterium</th><th>Wichtigkeit</th><th>Performance</th></tr>`;
    items.forEach(i => {
        html += `<tr><td>${escapeHtml(i.name)}</td><td>${i.imp}</td><td class="text-danger-bold">${i.perf}</td></tr>`;
    });
    html += `</table>`;
    return html;
}

export function getConflictTableHTML(conflicts) {
    let html = `<table class="modal-table"><tr><th>Kriterium</th><th>Manager Ø</th><th>Team Ø</th><th>Delta</th></tr>`;
    conflicts.forEach(c => {
        const mgr = parseFloat(c.perf_mgr || 0);
        const team = parseFloat(c.perf_team || 0);
        const delta = Math.abs(mgr - team).toFixed(1);
        html += `<tr>
            <td>${escapeHtml(c.name)}</td>
            <td class="text-danger-bold">${mgr.toFixed(1)}</td>
            <td class="text-primary-bold">${team.toFixed(1)}</td>
            <td>${delta}</td>
        </tr>`;
    });
    html += `</table>`;
    return html;
}

export function getMatrixSVG(size, centerX, centerY, dotsHTML) {
    const mid = size / 2;
    // Basis SVG Struktur
    return `<svg viewBox="0 0 ${size} ${size}" class="matrix-svg">
            <line x1="0" y1="${mid}" x2="${size}" y2="${mid}" stroke="#bdc3c7" stroke-width="2" stroke-dasharray="5,5" />
            <line x1="${mid}" y1="0" x2="${mid}" y2="${size}" stroke="#bdc3c7" stroke-width="2" stroke-dasharray="5,5" />
            <text x="10" y="20" fill="#95a5a6" font-size="12">Konzentrieren!</text>
            <text x="${size-10}" y="20" fill="#95a5a6" font-size="12" text-anchor="end">Weiter so</text>
            <text x="10" y="${size-10}" fill="#95a5a6" font-size="12">Niedrige Prio</text>
            <text x="${size-10}" y="${size-10}" fill="#95a5a6" font-size="12" text-anchor="end">Overkill?</text>
            <text x="${size-10}" y="${mid-10}" fill="#bdc3c7" font-size="11" text-anchor="end">
                Zentrum: ${centerX.toFixed(2)} / ${centerY.toFixed(2)}
            </text>
            ${dotsHTML}
        </svg>`;
}

export function getMatrixDotHTML(cx, cy, name, imp, perf) {
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="#3498db" stroke="#fff" stroke-width="1"
            class="matrix-dot" 
            data-name="${escapeHtml(name)}" data-imp="${imp}" data-perf="${perf}" />`;
}