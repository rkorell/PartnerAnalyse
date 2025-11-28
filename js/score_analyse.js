/*
  Datei: /var/www/html/js/score_analyse.js
  Zweck: JS-Logik für Partner Score Analyse
  (c) - Dr. Ralf Korell, 2025/26

  # Modified: 27.11.2025, 15:30 - Layout Clean-Up: Removed Rank Column, Aligned Score Bar & Value horizontally
  # Modified: 27.11.2025, 13:00 - Added XSS protection (escapeHtml) for user inputs
  # Modified: 27.11.2025, 14:30 - Centralized configuration via config.js (AP 6)
  # Modified: 27.11.2025, 14:45 - FIX: Memory Leaks & Race Condition via Event Delegation (AP 7)
  # Modified: 27.11.2025, 15:15 - FIX: Analysis failure (AP 8 regression). Converted to ES6 module import.
  # Modified: 27.11.2025, 17:00 - Performance Optimization (AP 12): Implemented Lazy Loading for details. 
  # Modified: 27.11.2025, 18:00 - CSS Cleanup (AP 14): Replaced inline styles with CSS classes.
  # Modified: 27.11.2025, 18:35 - Code Quality: Converted snake_case DB fields to camelCase in frontend logic (AP 16).
  # Modified: 28.11.2025, 12:45 - CSS Cleanup (AP 19): Replaced remaining inline styles with utility classes.
  # Modified: 28.11.2025, 12:46 - FIX (AP 20): Use visibility instead of display for Matrix tooltip to prevent layout jumping.
  # Modified: 28.11.2025, 13:00 - AP 21: CamelCase consolidation for matrixDetails and generalComments
  # Modified: 28.11.2025, 15:45 - AP 24 FIX: Use central CONFIG/utils AND restored missing exportToCSV function
  # Modified: 28.11.2025, 16:00 - AP 25: Extracted HTML generation to templates.js
*/

import { CONFIG } from './config.js';
import { escapeHtml, toggleGlobalLoader, interpolateColor } from './utils.js';
import * as Tpl from './templates.js';

document.addEventListener("DOMContentLoaded", function() {
    // ... (Selektoren)
    const surveySelect = document.getElementById('survey-filter');
    const departmentTreeContainer = document.getElementById('department-collapsing-tree');
    const minAnswersSlider = document.getElementById('min-answers-slider');
    const minAnswersValue = document.getElementById('min-answers-value');
    const filterForm = document.getElementById('analyse-filter-form');
    const resultSection = document.getElementById('result-section');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const closeErrorBtn = document.getElementById('close-error');
    const exportBtn = document.getElementById('export-btn'); 

    const matrixModal = document.getElementById('matrix-modal');
    const closeMatrixBtn = document.getElementById('close-matrix');
    const matrixContainer = document.getElementById('matrix-container');
    const matrixTitle = document.getElementById('matrix-title');
    const matrixTooltip = document.getElementById('matrix-tooltip');
    
    const matrixRadios = document.querySelectorAll('input[name="matrix-center"]');

    let appTexts = {};
    const infoModal = document.getElementById('global-info-modal');
    const closeInfoBtn = document.getElementById('close-info-modal');

    let analysisData = []; // Beinhaltet jetzt die camelCase Felder
    let currentPartnerDetails = null;
    let currentFilterState = null; 

    fetchSurveys();
    fetchDepartments();

    minAnswersSlider.addEventListener('input', () => { minAnswersValue.textContent = minAnswersSlider.value; });
    closeErrorBtn.addEventListener('click', () => { errorMessage.style.display = 'none'; });
    
    closeMatrixBtn.addEventListener('click', () => { matrixModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === matrixModal) matrixModal.style.display = 'none'; });

    if(closeInfoBtn) closeInfoBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
    if(infoModal) infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });

    if(exportBtn) exportBtn.addEventListener('click', exportToCSV);

    window.openInfoModal = function(category) {
        const content = appTexts[category] || "<p>Information wird geladen oder ist nicht verfügbar.</p>";
        document.getElementById('info-modal-body').innerHTML = content;
        infoModal.style.display = 'flex';
    }

    matrixRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentPartnerDetails) {
                updateMatrixView(radio.value);
            }
        });
    });

    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        analyseScores();
    });

    // Event Delegation
    resultSection.addEventListener('click', function(e) {
        const insightIcon = e.target.closest('.insight-icon');
        if (insightIcon) {
            e.stopPropagation();
            handleInsightClickAsync(insightIcon.dataset.action, insightIcon.dataset.id);
            return;
        }

        const partnerRow = e.target.closest('.partner-row-clickable');
        if (partnerRow) {
            openMatrixAsync(partnerRow.getAttribute('data-partner-id'));
            return;
        }
    });

    matrixContainer.addEventListener('mouseenter', function(e) {
        const dot = e.target.closest('.matrix-dot');
        if (dot) {
            const name = dot.getAttribute('data-name');
            const i = dot.getAttribute('data-imp');
            const p = dot.getAttribute('data-perf');
            matrixTooltip.textContent = `${name} (I: ${i} / P: ${p})`;
            matrixTooltip.style.visibility = 'visible'; 
        }
    }, true);

    matrixContainer.addEventListener('mouseleave', function(e) {
        if (!e.relatedTarget || !e.relatedTarget.closest('.matrix-dot')) {
             matrixTooltip.style.visibility = 'hidden'; 
        }
    }, true);


    function fetchSurveys() { 
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.app_texts) appTexts = data.app_texts;
                if (data && data.surveys) {
                    surveySelect.innerHTML = '';
                    let anyActive = false;
                    data.surveys.forEach(survey => {
                        const opt = document.createElement('option');
                        opt.value = survey.id;
                        opt.textContent = survey.name;
                        if (survey.is_active) {
                            opt.selected = true;
                            anyActive = true;
                        }
                        surveySelect.appendChild(opt);
                    });
                    if (!anyActive && surveySelect.options.length) surveySelect.options[0].selected = true;
                }
            });
    }

    function fetchDepartments() {
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.app_texts) appTexts = data.app_texts;
                if (data && data.departments && departmentTreeContainer) {
                    // Tree Render Logic (bleibt hier, da sehr spezifisch mit Event-Listenern)
                    // Könnte man auch refactorn, aber Template-Fokus lag auf den Strings.
                    // Ich lasse den komplexen Tree-Code hier, da er DOM Elemente erzeugt und nicht HTML-Strings.
                    // Das passt nicht ganz ins Template-String-Konzept von AP 25.
                    departmentTreeContainer.innerHTML = '';
                    const departments = data.departments.map(dep => ({
                        ...dep,
                        id: Number(dep.id),
                        parent_id: (dep.parent_id === null || dep.parent_id === undefined || dep.parent_id === "") ? null : Number(dep.parent_id),
                        children: []
                    }));
                    const deptMap = {};
                    departments.forEach(dep => { deptMap[dep.id] = dep; });
                    const roots = [];
                    departments.forEach(dep => {
                        if (dep.parent_id === null) roots.push(dep);
                        else if (deptMap[dep.parent_id]) deptMap[dep.parent_id].children.push(dep);
                    });
                    
                    function renderNode(node) { 
                        const nodeDiv = document.createElement('div');
                        nodeDiv.className = 'tree-node';
                        const headerDiv = document.createElement('div');
                        headerDiv.className = 'tree-header';
                        const chevron = document.createElement('span');
                        chevron.className = 'chevron';
                        if (node.children.length > 0) {
                            chevron.textContent = node._expanded ? "▼" : "▶";
                            chevron.addEventListener('click', function(e) {
                                node._expanded = !node._expanded;
                                renderTree();
                                e.stopPropagation();
                            });
                        } else {
                            chevron.classList.add('invisible');
                            chevron.textContent = "▶";
                        }
                        const checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        checkbox.value = node.id;
                        checkbox.checked = !!node._checked;
                        checkbox.indeterminate = !!node._indeterminate;
                        checkbox.addEventListener('change', function(e) {
                            setCheckState(node, checkbox.checked);
                            updateParentIndeterminate(node);
                            renderTree();
                            e.stopPropagation();
                        });
                        const label = document.createElement('label');
                        label.textContent = node.name;
                        label.addEventListener('click', function(e) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change'));
                            e.stopPropagation();
                        });
                        headerDiv.appendChild(chevron);
                        headerDiv.appendChild(checkbox);
                        headerDiv.appendChild(label);
                        nodeDiv.appendChild(headerDiv);
                        if (node.children.length > 0 && node._expanded) {
                            const childrenDiv = document.createElement('div');
                            childrenDiv.className = 'tree-children'; 
                            node.children.sort((a, b) => a.name.localeCompare(b.name)).forEach(child => {
                                childrenDiv.appendChild(renderNode(child));
                            });
                            nodeDiv.appendChild(childrenDiv);
                        }
                        return nodeDiv;
                    }
                    function setCheckState(node, checked) {
                        node._checked = checked;
                        node._indeterminate = false;
                        if (node.children) node.children.forEach(child => setCheckState(child, checked));
                    }
                    function updateParentIndeterminate(node) {
                        if (node.parent_id !== null && deptMap[node.parent_id]) {
                            const parent = deptMap[node.parent_id];
                            const total = parent.children.length;
                            const checked = parent.children.filter(c => c._checked).length;
                            const indet = parent.children.filter(c => c._indeterminate).length;
                            if (checked === total) { parent._checked = true; parent._indeterminate = false; } 
                            else if (checked === 0 && indet === 0) { parent._checked = false; parent._indeterminate = false; } 
                            else { parent._checked = false; parent._indeterminate = true; }
                            updateParentIndeterminate(parent);
                        }
                    }
                    function expandRoots(nodes) {
                        nodes.forEach(n => {
                            if (typeof n._expanded === "undefined") n._expanded = true;
                            if (n.children.length > 0) expandRoots(n.children);
                        });
                    }
                    expandRoots(roots);
                    function renderTree() {
                        departmentTreeContainer.innerHTML = '';
                        roots.sort((a, b) => a.name.localeCompare(b.name)).forEach(root => {
                            departmentTreeContainer.appendChild(renderNode(root));
                        });
                    }
                    renderTree();
                }
            });
    }

    function showError(msg) { errorText.textContent = msg; errorMessage.style.display = 'flex'; }

    function setExportButtonState(enabled) { 
        if (!exportBtn) return;
        exportBtn.disabled = !enabled;
        if (enabled) {
            exportBtn.classList.replace('btn-secondary', 'btn-primary');
        } else {
            exportBtn.classList.replace('btn-primary', 'btn-secondary');
        }
    }

    function analyseScores() {
        const surveyIds = Array.from(surveySelect.selectedOptions).map(opt => parseInt(opt.value));
        const departmentCheckboxes = departmentTreeContainer.querySelectorAll('input[type="checkbox"]:checked');
        const departmentIds = Array.from(departmentCheckboxes).map(cb => parseInt(cb.value));
        const managerFilter = document.querySelector('input[name="manager-filter"]:checked').value;
        const minAnswers = parseInt(minAnswersSlider.value);

        if (!surveyIds.length || !departmentIds.length) {
            showError("Bitte mindestens einen Survey und eine Abteilung auswählen.");
            return;
        }

        currentFilterState = {
            survey_ids: surveyIds,
            manager_filter: managerFilter,
            department_ids: departmentIds
        };

        resultSection.innerHTML = "";
        setExportButtonState(false);
        toggleGlobalLoader(true);

        fetch('php/partner_score_analyse.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ...currentFilterState,
                min_answers: minAnswers
            })
        })
        .then(resp => resp.json())
        .then(data => {
            toggleGlobalLoader(false);
            if (Array.isArray(data) && data.length > 0) {
                analysisData = data.map(row => ({
                    partnerId: row.partner_id,
                    partnerName: row.partner_name,
                    score: row.score,
                    totalAnswers: row.total_answers,
                    globalParticipantCount: row.global_participant_count,
                    npsScore: row.nps_score,
                    commentCount: row.comment_count,
                    maxDivergence: row.max_divergence,
                    hasActionItem: row.has_action_item,
                    numAssessorsMgr: row.num_assessors_mgr,
                    numAssessorsTeam: row.num_assessors_team
                }));

                renderResultTable(analysisData);
                setExportButtonState(true);
            } else if (data && data.message) {
                resultSection.innerHTML = `<div class="selection-info">${data.message}</div>`;
                analysisData = [];
                setExportButtonState(false);
            } else if (data && data.error) {
                showError(data.error);
                analysisData = [];
                setExportButtonState(false);
            } else {
                showError("Unbekanntes Antwortformat.");
                analysisData = [];
                setExportButtonState(false);
            }
        })
        .catch(err => {
            toggleGlobalLoader(false);
            showError("Analyse konnte nicht durchgeführt werden.");
            analysisData = [];
            setExportButtonState(false);
        });
    }

    function renderResultTable(rows) {
        const scores = rows.map(r => r.score);
        const min = Math.min(...scores); const max = Math.max(...scores);
        
        const globalCount = rows.length > 0 && rows[0].globalParticipantCount ? rows[0].globalParticipantCount : 0;

        // AP 25: Template Usage
        let html = Tpl.getScoreTableStartHTML(`Ergebnis: Partner Score Ranking (Basierend auf ${globalCount} Teilnehmern)`);

        rows.forEach((row, idx) => {
            const pct = (max === min) ? 1 : (row.score - min) / (max - min);
            const color = pct < 0.5
                ? interpolateColor(CONFIG.COLORS.HEATMAP_LOW, CONFIG.COLORS.HEATMAP_MID, pct * 2)
                : interpolateColor(CONFIG.COLORS.HEATMAP_MID, CONFIG.COLORS.HEATMAP_HIGH, (pct - 0.5) * 2);
            const rgb = `rgb(${color.join(',')})`;

            // --- Insights Slots ---
            let slot1 = ''; 
            let slot2 = ''; 
            let slot3 = ''; 
            let slot4 = ''; 

            // 1. NPS
            if (row.npsScore !== null && row.npsScore !== undefined) {
                const nps = parseInt(row.npsScore);
                let npsColor = CONFIG.COLORS.NPS_DETRACTOR; 
                if (nps >= 0 && nps <= 30) npsColor = CONFIG.COLORS.NPS_PASSIVE_LOW; 
                else if (nps > 30 && nps <= 70) npsColor = CONFIG.COLORS.NPS_PASSIVE_HIGH; 
                else if (nps > 70) npsColor = CONFIG.COLORS.NPS_PROMOTER; 
                
                // AP 25: Template
                slot1 = Tpl.getInsightNpsHTML(nps, npsColor);
            }

            // 2. Kommentare (Flag/Count)
            const commentCount = parseInt(row.commentCount || 0);
            if (commentCount > 0) {
                // AP 25: Template
                slot2 = Tpl.getInsightIconHTML('comments', row.partnerId, `${commentCount} Kommentare - Klick für Details`, `💬 <span class="action-count">${commentCount}</span>`);
            }

            // 3. Action List
            if (parseInt(row.hasActionItem) === 1) {
                // AP 25: Template
                slot3 = Tpl.getInsightIconHTML('action', row.partnerId, 'Handlungsbedarf - Klick für Details', '⚠️');
            }

            // 4. Divergenz
            const maxDiv = parseFloat(row.maxDivergence || 0);
            const cntMgr = parseInt(row.numAssessorsMgr || 0);
            const cntTeam = parseInt(row.numAssessorsTeam || 0);
            
            const conflictThreshold = CONFIG.ANALYSIS.CONFLICT_THRESHOLD || 2.0;
            
            if (cntMgr >= 3 && cntTeam >= 3 && maxDiv > conflictThreshold) {
                const title = `Maximale Divergenz: ${maxDiv.toFixed(1)} (Schwellenwert: ${conflictThreshold})`;
                // AP 25: Template
                slot4 = Tpl.getInsightIconHTML('conflict', row.partnerId, title, '⚡');
            }

            // AP 25: Template Usage
            html += Tpl.getScoreRowHTML(row, pct, rgb, { slot1, slot2, slot3, slot4 });
        });
        html += `</div>`;

        // AP 25: Template Usage
        html += Tpl.getLegendHTML();

        resultSection.innerHTML = html;
    }

    // NEU: Lädt Details nach, falls noch nicht vorhanden
    async function ensurePartnerDetails(partner) {
        if (partner.matrixDetails && partner.generalComments) {
            return partner; // Bereits geladen
        }

        toggleGlobalLoader(true);
        try {
            const response = await fetch('php/get_partner_details.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...currentFilterState,
                    partner_id: partner.partnerId
                })
            });
            
            const details = await response.json();
            
            if (details.error) throw new Error(details.error);

            partner.matrixDetails = details.matrix_details;
            partner.generalComments = details.general_comments;
            
            return partner;
        } catch (e) {
            alert("Fehler beim Laden der Details: " + e.message);
            return null;
        } finally {
            toggleGlobalLoader(false);
        }
    }

    async function handleInsightClickAsync(action, partnerId) {
        let partner = analysisData.find(p => p.partnerId == partnerId);
        if (!partner) return;

        partner = await ensurePartnerDetails(partner);
        if (!partner) return;

        let title = "";
        let content = "";

        if (action === 'comments') {
            title = `Kommentare zu ${escapeHtml(partner.partnerName)}`;
            if (partner.generalComments && partner.generalComments.length > 0) {
                // AP 25 Template
                content += Tpl.getCommentsListHTML('Allgemeines Feedback', partner.generalComments);
            }
            if (partner.matrixDetails) {
                const specific = partner.matrixDetails.filter(d => d.comments && d.comments.length > 0);
                if (specific.length > 0) {
                    // AP 25 Template
                    content += Tpl.getSpecificCommentsHTML(specific);
                }
            }
        } 
        else if (action === 'action') {
            title = `Handlungsfelder für ${escapeHtml(partner.partnerName)}`;
            if (partner.matrixDetails) {
                const items = partner.matrixDetails.filter(d => parseFloat(d.imp) >= 8.0 && parseFloat(d.perf) <= 5.0);
                if (items.length > 0) {
                    // AP 25 Template
                    content += Tpl.getActionTableHTML(items);
                }
            }
        }
        else if (action === 'conflict') {
            title = `Signifikante Abweichungen: ${escapeHtml(partner.partnerName)}`;
            
            const partnerListRow = analysisData.find(p => p.partnerId == partnerId); 
            const maxDiv = partnerListRow ? partnerListRow.maxDivergence : 0;
            
            if (partner.matrixDetails) {
                const conflictThreshold = CONFIG.ANALYSIS.CONFLICT_THRESHOLD || 2.0;
                const conflicts = partner.matrixDetails.filter(d => {
                    const mgr = parseFloat(d.perf_mgr || 0);
                    const team = parseFloat(d.perf_team || 0);
                    return Math.abs(mgr - team) > conflictThreshold;
                });
                
                if (conflicts.length > 0) {
                    // AP 25 Template
                    content += Tpl.getConflictTableHTML(conflicts);
                } else {
                    content += `<p>Keine Kriterien gefunden, die den Schwellenwert von ${conflictThreshold} überschreiten.</p>`;
                }
            }
        }

        const modalBody = document.getElementById('info-modal-body');
        // AP 25 Template
        modalBody.innerHTML = Tpl.getModalContentHTML(title, content);
        document.getElementById('global-info-modal').style.display = 'flex';
    }

    // --- IPA Matrix Logik ---
    function calculateStats(details) { /* ... (bleibt gleich) ... */
        const imps = details.map(d => parseFloat(d.imp));
        const perfs = details.map(d => parseFloat(d.perf));
        const sumImp = imps.reduce((a,b) => a+b, 0);
        const sumPerf = perfs.reduce((a,b) => a+b, 0);
        return { mean: { imp: sumImp / imps.length, perf: sumPerf / perfs.length } };
    }

    async function openMatrixAsync(partnerId) {
        let partner = analysisData.find(p => p.partnerId == partnerId);
        if (!partner) return;

        partner = await ensurePartnerDetails(partner);
        if (!partner || !partner.matrixDetails) return;

        currentPartnerDetails = partner; 
        matrixTitle.textContent = "IPA Matrix: " + partner.partnerName;

        const radios = document.querySelectorAll('input[name="matrix-center"]');
        radios.forEach(r => { if(r.value === 'standard') r.checked = true; });
        
        updateMatrixView('standard');
        matrixModal.style.display = 'flex';
    }

    function updateMatrixView(mode) {
        if (!currentPartnerDetails) return;
        const stats = calculateStats(currentPartnerDetails.matrixDetails);
        let centerX = 5.0;
        let centerY = 5.0;
        let maxDist = 5.0; 
        if (mode === 'mean') {
            centerX = stats.mean.perf;
            centerY = stats.mean.imp;
            maxDist = calculateMaxDeviation(currentPartnerDetails.matrixDetails, centerX, centerY);
        }
        renderMatrixSVG(currentPartnerDetails.matrixDetails, centerX, centerY, maxDist);
    }

    function calculateMaxDeviation(details, cx, cy) { /* ... (bleibt gleich) ... */
        let maxD = 0;
        details.forEach(d => {
            const dx = d.perf - cx;
            const dy = d.imp - cy;
            maxD = Math.max(maxD, dx, dy);
        });
        return Math.max(maxD * 1.1, 0.5); 
    }

    function renderMatrixSVG(details, centerX, centerY, rangeRadius) {
        // AP 24: Matrix Size aus Config
        const size = CONFIG.UI.MATRIX_SIZE;
        const scale = (size / 2) / rangeRadius;
        const mid = size / 2;

        let dotsHTML = '';
        details.forEach(d => {
            const dx = d.perf - centerX;
            const dy = d.imp - centerY; 
            const px = mid + (dx * scale);
            const py = mid - (dy * scale); 
            // AP 25: Template Usage
            dotsHTML += Tpl.getMatrixDotHTML(px, py, d.name, d.imp, d.perf);
        });
        
        // AP 25: Template Usage
        matrixContainer.innerHTML = Tpl.getMatrixSVG(size, centerX, centerY, dotsHTML);
    }

    function exportToCSV() {
        if (!analysisData || analysisData.length === 0) return;
        
        let csvContent = "Partner;Gesamt-Score;Anzahl Beurteiler;Kriterium (Matrix);Wichtigkeit (I);Performance (P)\n";

        analysisData.forEach(partner => {
            if (partner.matrixDetails) {
                partner.matrixDetails.forEach(detail => {
                    let row = [
                        partner.partnerName,
                        partner.score,
                        partner.totalAnswers,
                        detail.name, 
                        detail.imp,
                        detail.perf
                    ].map((field, index) => {
                        if (index === 1 || index === 4 || index === 5) {
                            return field.toString().replace('.', ',');
                        }
                        if (typeof field === 'string') {
                            return `"${field.replace(/"/g, '""')}"`;
                        }
                        return field;
                    }).join(";");
                    csvContent += row + "\n";
                });
            }
        });

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `partner_score_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});