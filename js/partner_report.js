/*
  Datei: js/partner_report.js
  Zweck: Entry Point für die Partner-Bericht-Seite (partner_report.html)
  (c) - Dr. Ralf Korell, 2025/26

  # Created: 2026-03-02 - AP 57: Partner-Bericht (Report Page)
  # Modified: 2026-03-10 - AP 58: Partner-Filter (partner_ids aus URL-Parameter auswerten)
  # Modified: 2026-03-13 - AP 59: NPS-Verteilung (Torte), Awareness entfernt
*/

import { CONFIG } from './config.js';
import { escapeHtml, interpolateColor } from './utils.js';
import * as Tpl from './templates.js';

document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('report-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const statusEl = document.getElementById('report-status');

    // --- 1. Filter aus URL parsen ---
    let filterParams;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const raw = urlParams.get('filter');
        if (!raw) throw new Error('Kein Filter-Parameter');
        filterParams = JSON.parse(atob(decodeURIComponent(raw)));
        if (!filterParams.survey_ids || !filterParams.department_ids) throw new Error('Filter unvollständig');
    } catch (e) {
        container.innerHTML = `<div class="report-error"><h2>Fehler</h2><p>Ungültiger oder fehlender Filter-Parameter.</p><p>${escapeHtml(e.message)}</p></div>`;
        return;
    }

    // --- 2. Daten laden ---
    loadingOverlay.style.display = 'block';
    statusEl.textContent = 'Lade Partner-Übersicht...';

    let partners;
    try {
        // 2a. Bilanz laden
        const bilanzResp = await fetch('php/partner_score_analyse.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterParams)
        });

        if (bilanzResp.status === 401) {
            container.innerHTML = `<div class="report-error"><h2>Nicht angemeldet</h2><p>Bitte zuerst auf der <a href="score_analyse.html">Analyseseite</a> anmelden.</p></div>`;
            loadingOverlay.style.display = 'none';
            return;
        }

        const bilanzData = await bilanzResp.json();
        if (!Array.isArray(bilanzData) || bilanzData.length === 0) {
            container.innerHTML = `<div class="report-error"><h2>Keine Daten</h2><p>Keine Partner mit den gewählten Filtern gefunden.</p></div>`;
            loadingOverlay.style.display = 'none';
            return;
        }

        // camelCase Mapping (gleiche Logik wie score_analyse.js)
        partners = bilanzData.map(row => ({
            partnerId: row.partner_id,
            partnerName: row.partner_name,
            score: parseFloat(row.score || 0),
            scorePositive: parseFloat(row.score_positive || 0),
            scoreNegative: Math.abs(parseFloat(row.score_negative || 0)),
            countPositive: parseInt(row.count_positive || 0),
            countNegative: parseInt(row.count_negative || 0),
            awarenessPct: parseInt(row.awareness_pct || 0),
            npsScore: parseInt(row.nps_score || 0),
            npsPromoterPct: parseInt(row.nps_promoter_pct || 0),
            npsPassivePct: parseInt(row.nps_passive_pct || 0),
            npsDetractorPct: parseInt(row.nps_detractor_pct || 0),
            commentCount: parseInt(row.comment_count || 0),
            maxDivergence: parseFloat(row.max_divergence || 0),
            hasActionItem: parseInt(row.has_action_item || 0),
            totalAnswers: parseInt(row.total_answers || 0),
            numAssessorsMgr: parseInt(row.num_assessors_mgr || 0),
            numAssessorsTeam: parseInt(row.num_assessors_team || 0),
            globalParticipantCount: parseInt(row.global_participant_count || 0),
            logoFile: row.logo_file || null,
            areaDistribution: (row.area_distribution || []).map(a => ({
                segmentId: a.segment_id,
                segmentName: a.segment_name,
                displayOrder: a.display_order,
                count: parseInt(a.participant_count)
            })),
            areaColors: CONFIG.COLORS.AREA_COLORS
        }));

        // Partner-Filter anwenden (AP 58)
        if (filterParams.partner_ids) {
            const allowedIds = new Set(filterParams.partner_ids);
            partners = partners.filter(p => allowedIds.has(p.partnerId));
        }

        // 2b. Details für alle Partner parallel laden
        statusEl.textContent = `Lade Details für ${partners.length} Partner...`;
        const detailPromises = partners.map(p =>
            fetch('php/get_partner_details.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partner_id: p.partnerId,
                    survey_ids: filterParams.survey_ids,
                    department_ids: filterParams.department_ids,
                    manager_filter: filterParams.manager_filter,
                    exclude_ids: filterParams.exclude_ids || []
                })
            }).then(r => r.json()).catch(() => null)
        );

        const detailResults = await Promise.all(detailPromises);
        detailResults.forEach((details, i) => {
            if (details && !details.error) {
                partners[i].matrixDetails = details.matrix_details || [];
                partners[i].generalComments = details.general_comments || [];
                partners[i].structureStats = details.structure_stats || [];
            }
        });

    } catch (e) {
        container.innerHTML = `<div class="report-error"><h2>Fehler</h2><p>Daten konnten nicht geladen werden.</p><p>${escapeHtml(e.message)}</p></div>`;
        loadingOverlay.style.display = 'none';
        return;
    }

    // --- 3. Report rendern ---
    statusEl.textContent = 'Rendere Bericht...';
    const maxBarValue = Math.max(...partners.map(p => Math.max(p.scorePositive, p.scoreNegative)), 1);

    let html = '';
    partners.forEach(partner => {
        html += renderPartnerSection(partner, partners, maxBarValue);
    });

    container.innerHTML = html;
    loadingOverlay.style.display = 'none';
    statusEl.textContent = `Bericht: ${partners.length} Partner`;
});


// ============================================================
// Render Functions
// ============================================================

function renderPartnerSection(partner, allPartners, maxBarValue) {
    const logoSrc = partner.logoFile
        ? `img/partnerlogo/${escapeHtml(partner.logoFile)}`
        : 'img/partnerlogo/partner.png';

    const details = partner.matrixDetails || [];
    const totalCriteria = details.length;

    return `
    <div class="partner-section">
        ${renderHeader(partner, logoSrc, totalCriteria)}
        ${renderAreaBar(partner)}
        ${renderScoreRow(partner, allPartners, maxBarValue)}
        ${renderMatrixAndDetails(details)}
        ${renderDivergences(details)}
        ${renderActionItems(details)}
        ${renderComments(partner, details)}
    </div>`;
}


function renderHeader(partner, logoSrc, totalCriteria) {
    const npsColor = partner.npsScore > 0 ? '#2ecc71' : partner.npsScore < 0 ? '#e74c3c' : '#999';
    const detractorDisplay = 100 - partner.npsPromoterPct - partner.npsPassivePct;
    const pD = partner.npsPromoterPct + detractorDisplay;
    const pieStyle = `background: conic-gradient(from 180deg, #2ecc71 0% ${partner.npsPromoterPct}%, #e74c3c ${partner.npsPromoterPct}% ${pD}%, #f1c40f ${pD}% 100%);`;
    const pieTitle = `Promoter: ${partner.npsPromoterPct}% · Detractor: ${detractorDisplay}% · Passive: ${partner.npsPassivePct}%`;

    return `
    <div class="report-header">
        <div class="report-header-left">
            <img src="${logoSrc}" alt="${escapeHtml(partner.partnerName)}" onerror="this.src='img/partnerlogo/partner.png'">
        </div>
        <div class="report-header-center">
            <h2>${escapeHtml(partner.partnerName)}</h2>
            <div class="report-kpi-row">
                <span class="report-kpi">Bewertungen: <strong>${partner.totalAnswers}</strong></span>
                <span class="report-kpi">Kriterien: <strong>${totalCriteria}</strong></span>
            </div>
            <div class="report-kpi-row">
                <span class="report-kpi">NPS:</span>
                <div class="nps-pie-report" style="${pieStyle}"></div>
                <span class="report-kpi"><strong style="color:${npsColor}">${partner.npsScore > 0 ? '+' : ''}${partner.npsScore}</strong></span>
                <span class="report-kpi" style="color:#555; font-size:0.72em;">Promoter: ${partner.npsPromoterPct}% · Detractor: ${detractorDisplay}% · Passive: ${partner.npsPassivePct}%</span>
            </div>
        </div>
        <div class="report-header-right">
            <img src="img/cisco.png" alt="Cisco">
        </div>
    </div>`;
}


function renderAreaBar(partner) {
    return Tpl.getAreaHBarHTML(partner.areaDistribution, partner.areaColors);
}


function renderScoreRow(partner, allPartners, maxBarValue) {
    const scoreBarHTML = getReportScoreBarHTML(partner, maxBarValue);
    const miniRankingHTML = getMiniRankingHTML(allPartners, partner);

    return `
    <div class="report-score-row">
        <div style="flex:1;">
            ${scoreBarHTML}
        </div>
        <div class="mini-ranking">
            ${miniRankingHTML}
        </div>
    </div>`;
}


function getReportScoreBarHTML(partner, maxBarValue) {
    const posW = maxBarValue > 0 ? (partner.scorePositive / maxBarValue * 50) : 0;
    const negW = maxBarValue > 0 ? (partner.scoreNegative / maxBarValue * 50) : 0;
    const score = partner.score;
    const scoreColor = score >= 0 ? '#2ecc71' : '#e74c3c';

    return `
    <div style="display:flex; align-items:center; gap:10px;">
        <div class="report-score-bar" style="flex:1;">
            ${negW > 0 ? `<div class="report-score-neg" style="flex:${negW.toFixed(1)};">-${Math.round(partner.scoreNegative)}</div>` : ''}
            ${posW > 0 ? `<div class="report-score-pos" style="flex:${posW.toFixed(1)};">+${Math.round(partner.scorePositive)}</div>` : ''}
        </div>
        <div class="report-score-total" style="color:${scoreColor};">${score >= 0 ? '+' : ''}${Math.round(score)}</div>
    </div>`;
}


function getMiniRankingHTML(allPartners, currentPartner) {
    const sorted = [...allPartners].sort((a, b) => b.score - a.score);
    const maxAbs = Math.max(...sorted.map(p => Math.abs(p.score)), 1);

    const rowH = 10;         // Gesamthöhe pro Zeile
    const currentRowH = 18;  // Hervorgehobene Zeile
    const nameW = 160;
    const barAreaW = 200;
    const midX = nameW + barAreaW / 2;
    const maxBarHalf = barAreaW / 2 - 5;
    const scoreW = 50;
    const totalW = nameW + barAreaW + scoreW;

    // Gesamthöhe berechnen
    let totalH = 20; // Padding oben für Label
    sorted.forEach(p => {
        totalH += (p.partnerId === currentPartner.partnerId) ? currentRowH : rowH;
    });
    totalH += 5; // Padding unten

    let rows = '';
    let yPos = 20;

    sorted.forEach(p => {
        const score = p.score;
        const isCurrent = p.partnerId === currentPartner.partnerId;
        const barLen = (Math.abs(score) / maxAbs) * maxBarHalf;
        const h = isCurrent ? currentRowH : rowH;
        const barH = isCurrent ? 12 : 3;
        const barY = yPos + (h - barH) / 2;

        if (isCurrent) {
            // Hervorgehobener Partner: Name + Balken + Score
            const color = score >= 0 ? '#3498db' : '#e74c3c';
            const scoreStr = score >= 0 ? `+${Math.round(score)}` : `${Math.round(score)}`;

            // Hintergrund-Highlight
            rows += `<rect x="0" y="${yPos}" width="${totalW}" height="${h}" fill="#f0f7ff" rx="3"/>`;

            // Name (rechts ausgerichtet, vor dem Bar-Bereich)
            rows += `<text x="${nameW - 8}" y="${yPos + h/2 + 4}" text-anchor="end" font-size="11" font-weight="bold" fill="#333">${escapeHtml(p.partnerName)}</text>`;

            // Balken
            if (score >= 0) {
                rows += `<rect x="${midX}" y="${barY}" width="${barLen}" height="${barH}" fill="${color}" rx="2"/>`;
            } else {
                rows += `<rect x="${midX - barLen}" y="${barY}" width="${barLen}" height="${barH}" fill="${color}" rx="2"/>`;
            }

            // Score-Wert
            rows += `<text x="${nameW + barAreaW + 5}" y="${yPos + h/2 + 4}" font-size="11" font-weight="bold" fill="${color}">${scoreStr}</text>`;
        } else {
            // Andere Partner: nur 3px Strich
            const color = '#bdc3c7';
            if (score >= 0) {
                rows += `<rect x="${midX}" y="${barY}" width="${barLen}" height="${barH}" fill="${color}" rx="1"/>`;
            } else {
                rows += `<rect x="${midX - barLen}" y="${barY}" width="${barLen}" height="${barH}" fill="${color}" rx="1"/>`;
            }
        }

        yPos += h;
    });

    // Mittellinie
    const lineHTML = `<line x1="${midX}" y1="15" x2="${midX}" y2="${totalH - 5}" stroke="#e0e0e0" stroke-width="1"/>`;

    return `
    <div class="mini-ranking-label">Ranking (${sorted.length} Partner)</div>
    <svg viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
        ${lineHTML}
        ${rows}
    </svg>`;
}


// --- Matrix + Detail Table ---

function renderMatrixAndDetails(details) {
    if (!details || details.length === 0) return '';

    const matrixHTML = renderMatrixSVG(details);
    const detailTableHTML = renderDetailTable(details);

    return `
    <div class="report-matrix-col">
        <div class="report-section-title">IPA-Matrix</div>
        ${matrixHTML}
    </div>
    <div class="report-page-break report-detail-col">
        <div class="report-section-title">Kriteriendetails</div>
        ${detailTableHTML}
    </div>`;
}


function renderMatrixSVG(details) {
    const size = CONFIG.UI.MATRIX_SIZE;
    const padding = CONFIG.UI.MATRIX_PADDING;
    const valueMin = CONFIG.UI.MATRIX_VALUE_MIN;
    const valueMax = CONFIG.UI.MATRIX_VALUE_MAX;
    const jitterRange = CONFIG.UI.MATRIX_JITTER;
    const plotSize = size - 2 * padding;
    const valueRange = valueMax - valueMin;

    const scaleX = (val) => padding + ((val - valueMin) / valueRange) * plotSize;
    const scaleY = (val) => padding + plotSize - ((val - valueMin) / valueRange) * plotSize;

    let dotsHTML = '';
    details.forEach(d => {
        const imp = parseFloat(d.imp || 3);
        const perf = parseFloat(d.perf || 3);
        // Deterministischer Jitter basierend auf Name-Hash (statt random)
        const hash = d.name.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
        const jX = ((hash % 100) / 100 - 0.5) * 2 * jitterRange;
        const jY = (((hash >> 8) % 100) / 100 - 0.5) * 2 * jitterRange;

        const cx = scaleX(perf + jX);
        const cy = scaleY(imp + jY);
        dotsHTML += Tpl.getMatrixDotHTML(cx, cy, d.name, imp, perf);
    });

    return Tpl.getMatrixSVG_Standard(dotsHTML, size, padding, plotSize);
}


function renderDetailTable(details) {
    let html = `<table class="report-table">
        <tr>
            <th>Kriterium</th>
            <th>Wichtigkeit</th>
            <th>Performance</th>
            <th>Mgr</th>
            <th>Team</th>
        </tr>`;

    details.forEach(d => {
        const imp = parseFloat(d.imp || 0).toFixed(1);
        const perf = parseFloat(d.perf || 0).toFixed(1);
        const mgrVal = d.perf_mgr ? parseFloat(d.perf_mgr).toFixed(1) : '-';
        const teamVal = d.perf_team ? parseFloat(d.perf_team).toFixed(1) : '-';

        html += `<tr>
            <td>${escapeHtml(d.name)}</td>
            <td class="num">${imp}</td>
            <td class="num">${perf}</td>
            <td class="num">${mgrVal}</td>
            <td class="num">${teamVal}</td>
        </tr>`;
    });

    html += '</table>';
    return html;
}


// --- Divergences ---

function renderDivergences(details) {
    const threshold = CONFIG.ANALYSIS.CONFLICT_THRESHOLD;
    const conflicts = details.filter(d => {
        const mgr = parseFloat(d.perf_mgr || 0);
        const team = parseFloat(d.perf_team || 0);
        return d.perf_mgr && d.perf_team && Math.abs(mgr - team) > threshold;
    });

    if (conflicts.length === 0) return '';

    let html = `<div class="report-section">
        <div class="report-section-title"><span class="report-insight-badge badge-warning">&#9889;</span> Divergenzen (Manager vs. Team, Delta &gt; ${threshold})</div>
        <table class="report-table">
            <tr><th>Kriterium</th><th>Manager</th><th>Team</th><th>Delta</th></tr>`;

    conflicts.forEach(c => {
        const mgr = parseFloat(c.perf_mgr).toFixed(1);
        const team = parseFloat(c.perf_team).toFixed(1);
        const delta = Math.abs(parseFloat(c.perf_mgr) - parseFloat(c.perf_team)).toFixed(1);
        html += `<tr><td>${escapeHtml(c.name)}</td><td class="num">${mgr}</td><td class="num">${team}</td><td class="num">${delta}</td></tr>`;
    });

    html += '</table></div>';
    return html;
}


// --- Action Items ---

function renderActionItems(details) {
    const items = details.filter(d => {
        const imp = parseFloat(d.imp || 0);
        const perf = parseFloat(d.perf || 0);
        return imp >= CONFIG.ANALYSIS.ACTION_ITEM.IMPORTANCE_MIN && perf <= CONFIG.ANALYSIS.ACTION_ITEM.PERFORMANCE_MAX;
    });

    if (items.length === 0) return '';

    let html = `<div class="report-section">
        <div class="report-section-title"><span class="report-insight-badge badge-danger">&#10071;</span> Handlungsfelder</div>
        <table class="report-table">
            <tr><th>Kriterium</th><th>Wichtigkeit</th><th>Performance</th></tr>`;

    items.forEach(i => {
        html += `<tr><td>${escapeHtml(i.name)}</td><td class="num">${parseFloat(i.imp).toFixed(1)}</td><td class="num" style="color:#e74c3c; font-weight:bold;">${parseFloat(i.perf).toFixed(1)}</td></tr>`;
    });

    html += '</table></div>';
    return html;
}


// --- Comments ---

function renderComments(partner, details) {
    const genComments = partner.generalComments || [];
    const specComments = details.filter(d => d.comments && d.comments.length > 0);

    if (genComments.length === 0 && specComments.length === 0) return '';

    let html = '';

    if (genComments.length > 0) {
        html += `<div class="report-section">
            <div class="report-section-title">Allgemeine Kommentare</div>
            <ul class="report-comment-list">`;
        genComments.forEach(c => {
            html += `<li>${escapeHtml(c)}</li>`;
        });
        html += '</ul></div>';
    }

    if (specComments.length > 0) {
        html += `<div class="report-section">
            <div class="report-section-title">Spezifische Kommentare</div>
            <ul class="report-comment-list">`;
        specComments.forEach(d => {
            d.comments.forEach(c => {
                html += `<li><div class="report-comment-criterion">${escapeHtml(d.name)}</div>${escapeHtml(c)}</li>`;
            });
        });
        html += '</ul></div>';
    }

    return html;
}
