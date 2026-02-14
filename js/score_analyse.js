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
  # Modified: 28.11.2025, 20:15 - AP 29.3: Implement proactive login gatekeeper
  # Modified: 29.11.2025, 12:00 - AP 31: Map awarenessPct to frontend
  # Modified: 29.11.2025, 16:00 - CRITICAL FIX: Restored missing Tree-View logic & Implemented DBC Visuals (AP I.3)
  # Modified: 29.11.2025, 20:30 - AP 32: Implemented soft filter initialization (set min only, keep html default value)
  # Modified: 29.11.2025, 23:15 - AP 35: Added Jitter logic to Matrix generation to solve overplotting
  # Modified: 29.11.2025, 23:45 - AP 36: Integration of Structure Table and new DB-based data loading
  # Modified: 30.11.2025, 10:39 - AP 39: Matrix redesign - coordinate mapping with padding buffer to prevent clipping
  # Modified: 02.12.2025, 17:30 - AP 43: Replaced all Magic Numbers with CONFIG references
  # Modified: 2026-02-14 - AP 50: Fraud-Detection Panel (parallel fetch + UI)
  # Modified: 2026-02-14 - AP 50: Fix: Fraud-Panel bleibt nach Ausschluss bedienbar (Option C)
  # Modified: 2026-02-14 - Teilnehmerzahlen im Abteilungsbaum (per Survey, via MagicMirrorModuleStats)
  # Modified: 2026-02-14 - AP 50: Fraud-Panel IP-Clustering + Sortierung (Severity DESC, Score 5 vor 1)
  # Modified: 2026-02-14 - AP 50: Info-Sticker (i) im Fraud-Panel-Header mit Hilfetext aus app_texts
*/

import { CONFIG } from './config.js';
import { escapeHtml, toggleGlobalLoader, interpolateColor } from './utils.js';
import * as Tpl from './templates.js';

document.addEventListener("DOMContentLoaded", function() {
    // Selektoren
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
    
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    
    const matrixControls = document.querySelector('.matrix-controls');
    
    let appTexts = {};
    const infoModal = document.getElementById('global-info-modal');
    const closeInfoBtn = document.getElementById('close-info-modal');

    const fraudSection = document.getElementById('fraud-section');

    let analysisData = [];
    let currentPartnerDetails = null;
    let currentFilterState = null;
    let _deptCounts = null;

    // Initial Load
    initializeFilters();
    fetchSurveys();
    fetchDepartments();

    // Event Listeners
    minAnswersSlider.addEventListener('input', () => { minAnswersValue.textContent = minAnswersSlider.value; });
    closeErrorBtn.addEventListener('click', () => { errorMessage.style.display = 'none'; });
    
    closeMatrixBtn.addEventListener('click', () => { matrixModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === matrixModal) matrixModal.style.display = 'none'; });

    if(closeInfoBtn) closeInfoBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
    if(infoModal) infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });

    if(exportBtn) exportBtn.addEventListener('click', exportToCSV);
    surveySelect.addEventListener('change', onSurveySelectionChange);

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(loginPasswordInput.value);
        });
    }

    window.openInfoModal = function(category) {
        const content = appTexts[category] || "<p>Information wird geladen oder ist nicht verfügbar.</p>";
        document.getElementById('info-modal-body').innerHTML = content;
        infoModal.style.display = 'flex';
    }
    
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

    function initializeFilters() {
        if (CONFIG.ANALYSIS.MIN_ANSWERS_LIMIT) {
            minAnswersSlider.min = CONFIG.ANALYSIS.MIN_ANSWERS_LIMIT;
            minAnswersValue.textContent = minAnswersSlider.value;
        }
    }

    // Login Helper
    function showLoginModal() {
        if (loginModal) {
            loginModal.style.display = 'flex';
            if(loginPasswordInput) loginPasswordInput.focus();
        }
    }

    function handleLogin(password) {
        toggleGlobalLoader(true);
        if(loginError) loginError.style.display = 'none';

        fetch('php/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        })
        .then(response => response.json())
        .then(data => {
            toggleGlobalLoader(false);
            if (data.success) {
                location.reload();
            } else {
                if(loginError) {
                    loginError.textContent = data.error || 'Login fehlgeschlagen';
                    loginError.style.display = 'block';
                }
            }
        })
        .catch(err => {
            toggleGlobalLoader(false);
            if(loginError) {
                loginError.textContent = 'Verbindungsfehler';
                loginError.style.display = 'block';
            }
        });
    }

    function showLoader() { if(loadingOverlay) { loadingOverlay._timeout = setTimeout(() => { loadingOverlay.style.display = 'flex'; }, 300); } }
    function hideLoader() { if(loadingOverlay) { clearTimeout(loadingOverlay._timeout); loadingOverlay.style.display = 'none'; } }
    function showError(msg) { if(errorText && errorMessage) { errorText.textContent = msg; errorMessage.style.display = 'flex'; } }

    function setExportButtonState(enabled) { 
        if (!exportBtn) return;
        exportBtn.disabled = !enabled;
        if (enabled) {
            exportBtn.classList.replace('btn-secondary', 'btn-primary');
        } else {
            exportBtn.classList.replace('btn-primary', 'btn-secondary');
        }
    }

    // --- DATA LOADING LOGIC (Surveys & Departments) ---

    function fetchSurveys() { 
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.auth_status && data.auth_status.enabled && !data.auth_status.logged_in) {
                    showLoginModal();
                    return;
                }

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
                onSurveySelectionChange();
            });
    }

    function fetchDepartments() {
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.app_texts) appTexts = data.app_texts;
                if (data && data.departments && departmentTreeContainer) {
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
                            chevron.classList.add('chevron-leaf');
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
                        const countSpan = document.createElement('span');
                        countSpan.className = 'dept-count';
                        countSpan.dataset.deptId = node.id;
                        if (_deptCounts && _deptCounts.hasOwnProperty(node.id)) {
                            const c = _deptCounts[node.id];
                            countSpan.textContent = ` (${c})`;
                            if (c === 0) countSpan.classList.add('zero');
                        }
                        label.appendChild(countSpan);
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
                    onSurveySelectionChange();
                }
            });
    }

    // --- DEPARTMENT COUNTS (Teilnehmerzahlen im Abteilungsbaum) ---

    function onSurveySelectionChange() {
        const selected = Array.from(surveySelect.selectedOptions);
        if (selected.length === 1) {
            updateDepartmentCounts(parseInt(selected[0].value));
        } else {
            clearDepartmentCounts();
        }
    }

    function updateDepartmentCounts(surveyId) {
        fetch(`php/MagicMirrorModuleStats.php?survey_id=${surveyId}`)
            .then(resp => resp.json())
            .then(data => {
                _deptCounts = {};
                function flatten(node) {
                    _deptCounts[node.id] = node.count;
                    if (node.children) node.children.forEach(flatten);
                }
                const roots = Array.isArray(data.root) ? data.root : [data.root];
                roots.forEach(flatten);

                departmentTreeContainer.querySelectorAll('.dept-count').forEach(span => {
                    const id = parseInt(span.dataset.deptId);
                    if (_deptCounts.hasOwnProperty(id)) {
                        const c = _deptCounts[id];
                        span.textContent = ` (${c})`;
                        span.className = c === 0 ? 'dept-count zero' : 'dept-count';
                    } else {
                        span.textContent = ' (0)';
                        span.className = 'dept-count zero';
                    }
                });
            })
            .catch(() => { clearDepartmentCounts(); });
    }

    function clearDepartmentCounts() {
        _deptCounts = null;
        departmentTreeContainer.querySelectorAll('.dept-count').forEach(span => {
            span.textContent = '';
        });
    }

    // --- CORE LOGIC (ANALYSE & VISUALISIERUNG V2.2) ---

    function analyseScores(keepExclusions = false) {
        const surveyIds = Array.from(surveySelect.selectedOptions).map(opt => parseInt(opt.value));
        const departmentCheckboxes = departmentTreeContainer.querySelectorAll('input[type="checkbox"]:checked');
        const departmentIds = Array.from(departmentCheckboxes).map(cb => parseInt(cb.value));
        let managerFilter = "alle";
        const mgrRadio = document.querySelector('input[name="manager-filter"]:checked');
        if(mgrRadio) managerFilter = mgrRadio.value;
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
        if (!keepExclusions) {
            excludedParticipantIds = [];
            fraudSection.innerHTML = "";
        }
        setExportButtonState(false);
        toggleGlobalLoader(true);

        fetch('php/partner_score_analyse.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ...currentFilterState,
                min_answers: minAnswers,
                exclude_ids: excludedParticipantIds
            })
        })
        .then(resp => {
            if (resp.status === 401) {
                showLoginModal();
                throw new Error("Login required");
            }
            return resp.json();
        })
        .then(data => {
            toggleGlobalLoader(false);
            if (Array.isArray(data) && data.length > 0) {
                analysisData = data.map(row => ({
                    partnerId: row.partner_id,
                    partnerName: row.partner_name,
                    score: row.score,
                    totalAnswers: row.total_answers,
                    globalParticipantCount: row.global_participant_count,

                    scorePositive: parseFloat(row.score_positive || 0),
                    scoreNegative: Math.abs(parseFloat(row.score_negative || 0)),
                    countPositive: parseInt(row.count_positive || 0),
                    countNegative: parseInt(row.count_negative || 0),

                    awarenessPct: parseInt(row.awareness_pct || 0),

                    npsScore: row.nps_score,
                    commentCount: row.comment_count,
                    maxDivergence: row.max_divergence,
                    hasActionItem: row.has_action_item,
                    numAssessorsMgr: row.num_assessors_mgr,
                    numAssessorsTeam: row.num_assessors_team
                }));

                renderResultTable(analysisData);
                setExportButtonState(true);

                // Fraud-Detection erst nach erfolgreicher Analyse laden
                if (!keepExclusions) {
                    fetchFraudData(currentFilterState);
                }
            } else if (data && data.message) {
                resultSection.innerHTML = `<div class="selection-info">${data.message}</div>`;
                analysisData = [];
                fraudSection.innerHTML = "";
                setExportButtonState(false);
            } else if (data && data.error) {
                showError(data.error);
                analysisData = [];
                fraudSection.innerHTML = "";
                setExportButtonState(false);
            } else {
                showError("Unbekanntes Antwortformat.");
                analysisData = [];
                setExportButtonState(false);
            }
        })
        .catch(err => {
            toggleGlobalLoader(false);
            if (err.message !== "Login required") {
                showError("Analyse konnte nicht durchgeführt werden.");
            }
            analysisData = [];
            setExportButtonState(false);
        });
    }

    function renderResultTable(rows) {
        const globalCount = rows.length > 0 && rows[0].globalParticipantCount ? rows[0].globalParticipantCount : 0;

        let maxBarValue = 0;
        rows.forEach(r => {
            if (r.scorePositive > maxBarValue) maxBarValue = r.scorePositive;
            if (r.scoreNegative > maxBarValue) maxBarValue = r.scoreNegative;
        });
        if (maxBarValue === 0) maxBarValue = 1; 

        let html = Tpl.getScoreTableStartHTML(`Ergebnis: Partner Score Ranking (Basierend auf ${globalCount} Teilnehmern)`);

        rows.forEach((row) => {
            const posWidth = (row.scorePositive / maxBarValue) * 100;
            const negWidth = (row.scoreNegative / maxBarValue) * 100;

            let awColor = '#e74c3c';
            if (row.awarenessPct >= 80) awColor = '#2ecc71';
            else if (row.awarenessPct >= 50) awColor = '#f1c40f';

            let slot1 = ''; 
            let slot2 = ''; 
            let slot3 = ''; 
            let slot4 = ''; 

            if (row.npsScore !== null && row.npsScore !== undefined) {
                const nps = parseInt(row.npsScore);
                let npsColor = CONFIG.COLORS.NPS_DETRACTOR; 
                if (nps >= 0 && nps <= CONFIG.ANALYSIS.NPS_THRESHOLDS.PASSIVE_LOW_MAX) {
                    npsColor = CONFIG.COLORS.NPS_PASSIVE_LOW;
                } else if (nps > CONFIG.ANALYSIS.NPS_THRESHOLDS.PASSIVE_LOW_MAX && nps <= CONFIG.ANALYSIS.NPS_THRESHOLDS.PASSIVE_HIGH_MAX) {
                    npsColor = CONFIG.COLORS.NPS_PASSIVE_HIGH;
                } else if (nps > CONFIG.ANALYSIS.NPS_THRESHOLDS.PASSIVE_HIGH_MAX) {
                    npsColor = CONFIG.COLORS.NPS_PROMOTER;
                }
                
                slot1 = Tpl.getInsightNpsHTML(nps, npsColor);
            }

            const commentCount = parseInt(row.commentCount || 0);
            if (commentCount > 0) {
                slot2 = Tpl.getInsightIconHTML('comments', row.partnerId, `${commentCount} Kommentare - Klick für Details`, `💬 <span class="action-count">${commentCount}</span>`);
            }

            if (parseInt(row.hasActionItem) === 1) {
                slot3 = Tpl.getInsightIconHTML('action', row.partnerId, 'Handlungsbedarf - Klick für Details', '⚠️');
            }

            const maxDiv = parseFloat(row.maxDivergence || 0);
            const cntMgr = parseInt(row.numAssessorsMgr || 0);
            const cntTeam = parseInt(row.numAssessorsTeam || 0);
            
            if (cntMgr >= CONFIG.ANALYSIS.CONFLICT_MIN_ASSESSORS && cntTeam >= CONFIG.ANALYSIS.CONFLICT_MIN_ASSESSORS && maxDiv > CONFIG.ANALYSIS.CONFLICT_THRESHOLD) {
                const title = `Maximale Divergenz: ${maxDiv.toFixed(1)} (Schwellenwert: ${CONFIG.ANALYSIS.CONFLICT_THRESHOLD})`;
                slot4 = Tpl.getInsightIconHTML('conflict', row.partnerId, title, '⚡');
            }

            html += Tpl.getScoreRowHTML_DBC(row, { slot1, slot2, slot3, slot4 }, {
                posWidth, negWidth,
                posCount: row.countPositive, negCount: row.countNegative,
                posScore: Math.round(row.scorePositive), negScore: Math.round(row.scoreNegative),
                awarenessColor: awColor
            });
        });
        html += `</div>`;
        html += Tpl.getLegendHTML();
        resultSection.innerHTML = html;
    }

    async function ensurePartnerDetails(partner) {
        if (partner.matrixDetails && partner.generalComments && partner.structureStats) {
            return partner; 
        }

        toggleGlobalLoader(true);
        try {
            const response = await fetch('php/get_partner_details.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...currentFilterState,
                    partner_id: partner.partnerId,
                    exclude_ids: excludedParticipantIds
                })
            });
            
            if (response.status === 401) {
                showLoginModal();
                throw new Error("Login required");
            }

            const details = await response.json();
            
            if (details.error) throw new Error(details.error);

            partner.matrixDetails = details.matrix_details;
            partner.generalComments = details.general_comments;
            partner.structureStats = details.structure_stats;
            
            return partner;
        } catch (e) {
            if (e.message !== "Login required") {
                alert("Fehler beim Laden der Details: " + e.message);
            }
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
        
        content += Tpl.getParticipantStructureHTML(partner.structureStats);
        content += "<hr style='margin: 15px 0; border: 0; border-top: 1px solid #eee;'>";

        if (action === 'comments') {
            title = `Kommentare zu ${escapeHtml(partner.partnerName)}`;
            if (partner.generalComments && partner.generalComments.length > 0) {
                content += Tpl.getCommentsListHTML('Allgemeines Feedback', partner.generalComments);
            }
            if (partner.matrixDetails) {
                const specific = partner.matrixDetails.filter(d => d.comments && d.comments.length > 0);
                if (specific.length > 0) {
                    content += Tpl.getSpecificCommentsHTML(specific);
                }
            }
        } 
        else if (action === 'action') {
            title = `Handlungsfelder für ${escapeHtml(partner.partnerName)}`;
            if (partner.matrixDetails) {
                const items = partner.matrixDetails.filter(d => 
                    parseFloat(d.imp) >= CONFIG.ANALYSIS.ACTION_ITEM.IMPORTANCE_MIN && 
                    parseFloat(d.perf) <= CONFIG.ANALYSIS.ACTION_ITEM.PERFORMANCE_MAX
                );
                if (items.length > 0) {
                    content += Tpl.getActionTableHTML(items);
                } else {
                    content += "<p>Keine spezifischen Handlungsfelder gefunden.</p>";
                }
            }
        }
        else if (action === 'conflict') {
            title = `Signifikante Abweichungen: ${escapeHtml(partner.partnerName)}`;
            if (partner.matrixDetails) {
                const conflicts = partner.matrixDetails.filter(d => 
                    Math.abs(parseFloat(d.perf_mgr) - parseFloat(d.perf_team)) > CONFIG.ANALYSIS.CONFLICT_THRESHOLD
                );
                
                if (conflicts.length > 0) {
                    content += Tpl.getConflictTableHTML(conflicts);
                } else {
                    content += `<p>Keine Kriterien gefunden, die den Schwellenwert überschreiten.</p>`;
                }
            }
        }

        const modalBody = document.getElementById('info-modal-body');
        modalBody.innerHTML = Tpl.getModalContentHTML(title, content);
        document.getElementById('global-info-modal').style.display = 'flex';
    }

    // IPA Matrix Logic - AP 39/43: Coordinate mapping with padding buffer, CONFIG values
    function calculateStats(details) {
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

        if(matrixControls) matrixControls.style.display = 'none';
        
        updateMatrixView('standard');
        matrixModal.style.display = 'flex';
    }

    function updateMatrixView(mode) {
        if (!currentPartnerDetails) return;
        renderMatrixSVG(currentPartnerDetails.matrixDetails);
    }

    // AP 43: Matrix rendering with CONFIG values
    function renderMatrixSVG(details) {
        const size = CONFIG.UI.MATRIX_SIZE; 
        const padding = CONFIG.UI.MATRIX_PADDING;
        const plotSize = size - (padding * 2);
        
        const valueMin = CONFIG.UI.MATRIX_VALUE_MIN;
        const valueMax = CONFIG.UI.MATRIX_VALUE_MAX;
        const valueRange = valueMax - valueMin;
        
        // Skalierungsfunktion: Wert (0.8-5.2) -> Pixel
        const scaleX = (val) => padding + ((val - valueMin) / valueRange) * plotSize;
        const scaleY = (val) => padding + plotSize - ((val - valueMin) / valueRange) * plotSize;

        const jitterRange = CONFIG.UI.MATRIX_JITTER;
        const jitter = () => (Math.random() - 0.5) * jitterRange;

        let dotsHTML = '';
        details.forEach(d => {
            const valImp = parseFloat(d.imp);
            const valPerf = parseFloat(d.perf);

            const cx = scaleX(valPerf + jitter());
            const cy = scaleY(valImp + jitter());

            dotsHTML += Tpl.getMatrixDotHTML(cx, cy, d.name, valImp, valPerf);
        });
        
        matrixContainer.innerHTML = Tpl.getMatrixSVG_Standard(dotsHTML, size, padding, plotSize);
    }

    // --- FRAUD DETECTION (AP 50) ---

    let fraudData = [];
    let excludedParticipantIds = [];

    function fetchFraudData(filterState) {
        fetch('php/get_fraud_data.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(filterState)
        })
        .then(resp => {
            if (resp.status === 401) return [];
            return resp.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                fraudData = data;
                renderFraudPanel(data);
            } else {
                fraudData = [];
                renderFraudClean();
            }
        })
        .catch(() => {
            fraudData = [];
            fraudSection.innerHTML = '';
        });
    }

    function renderFraudClean() {
        fraudSection.innerHTML = `<div class="fraud-panel fraud-clean">
            <div class="fraud-header fraud-header-clean">
                Survey-Fraud-Detection: Keine Auffälligkeiten
            </div>
        </div>`;
    }

    function renderFraudPanel(rows) {
        // 1. IP-Gruppen bilden (Clustering)
        const ipGroups = {};
        const standalone = [];

        rows.forEach(r => {
            if (r.is_ip_duplicate && r.ip_hash) {
                if (!ipGroups[r.ip_hash]) ipGroups[r.ip_hash] = [];
                ipGroups[r.ip_hash].push(r);
            } else {
                standalone.push(r);
            }
        });

        // 2. Display-Items aufbauen
        const displayItems = [];

        Object.values(ipGroups).forEach(group => {
            const maxSev = Math.max(...group.map(r => r.severity));
            const straightliners = group.filter(r => r.is_straightliner);
            const slScores = [...new Set(straightliners.map(r => r.mode_score))];
            const pids = group.map(r => r.participant_id);
            const depts = [...new Set(group.map(r => r.department_name))];

            displayItems.push({
                type: 'cluster',
                severity: maxSev,
                sortScore: slScores.length > 0 ? Math.max(...slScores) : null,
                participantIds: pids,
                count: group.length,
                slCount: straightliners.length,
                slScores,
                departments: depts
            });
        });

        standalone.forEach(r => {
            displayItems.push({
                type: 'single',
                severity: r.is_straightliner && r.mode_score === 3 ? 0 : r.severity,
                sortScore: r.is_straightliner ? r.mode_score : null,
                participantIds: [r.participant_id],
                entry: r
            });
        });

        // 3. Sortierung: Severity DESC, dann Score 5 vor 1 vor Rest
        displayItems.sort((a, b) => {
            if (a.severity !== b.severity) return b.severity - a.severity;
            const scoreOrd = (s) => s === 5 ? 0 : s === 1 ? 1 : s === null ? 3 : 2;
            return scoreOrd(a.sortScore) - scoreOrd(b.sortScore);
        });

        // 4. Render
        const totalParticipants = rows.length;
        const incidentCount = displayItems.length;
        const excludeInfo = excludedParticipantIds.length > 0
            ? ` (${excludedParticipantIds.length} Bewertungen ausgeschlossen)` : '';

        let bodyHTML = '';
        displayItems.forEach(item => {
            const pidsStr = item.participantIds.join(',');
            const isExcluded = item.participantIds.every(pid => excludedParticipantIds.includes(pid));

            if (item.type === 'cluster') {
                let sevClass, sevLabel;
                if (item.severity === 3) { sevClass = 'sev-3'; sevLabel = 'IP + Muster'; }
                else { sevClass = 'sev-2'; sevLabel = 'IP-Duplikat'; }

                let tags = `<span class="fraud-tag ip">${item.count}× gleiche IP</span>`;
                if (item.slCount > 0) {
                    const scoreStr = item.slScores.join('/');
                    tags += `<span class="fraud-tag pattern">${item.slCount}× Häufung identischer Bewertungen: Score ${scoreStr}</span>`;
                }

                const deptStr = item.departments.join(', ');

                bodyHTML += `<div class="fraud-row fraud-row-cluster${isExcluded ? ' fraud-row-excluded' : ''}" data-participant-ids="${pidsStr}">
                    <input type="checkbox" class="fraud-cb" value="${pidsStr}">
                    <span class="fraud-badge ${sevClass}">${sevLabel}</span>
                    <span>${tags}</span>
                    <span class="fraud-info">${escapeHtml(deptStr)}</span>
                </div>`;
            } else {
                const r = item.entry;
                const isHarmless = r.is_straightliner && r.mode_score === 3;
                let sevClass, sevLabel;
                if (isHarmless) {
                    sevClass = 'sev-harmless';
                    sevLabel = 'Hinweis';
                } else {
                    sevClass = `sev-${r.severity}`;
                    sevLabel = r.severity >= 2 ? 'Auffällig' : 'Auffällig';
                }

                let tags = '';
                if (r.is_straightliner) {
                    const tagClass = r.mode_score === 3 ? 'harmless' : 'pattern';
                    tags += `<span class="fraud-tag ${tagClass}">Häufung identischer Bewertungen: ${r.straightline_pct}% Score ${r.mode_score}</span>`;
                }

                const role = r.is_manager ? 'Manager' : 'Team';
                bodyHTML += `<div class="fraud-row${isExcluded ? ' fraud-row-excluded' : ''}" data-participant-ids="${r.participant_id}">
                    <input type="checkbox" class="fraud-cb" value="${r.participant_id}">
                    <span class="fraud-badge ${sevClass}">${escapeHtml(sevLabel)}</span>
                    <span>${tags}</span>
                    <span class="fraud-info">#${r.participant_id} · ${escapeHtml(r.department_name)} · ${role}</span>
                </div>`;
            }
        });

        fraudSection.innerHTML = `<div class="fraud-panel">
            <div class="fraud-header" id="fraud-toggle" style="position: relative;">
                <span class="chevron">▶</span>
                Survey-Fraud-Detection: ${incidentCount} Indikation${incidentCount === 1 ? '' : 'en'}, ${totalParticipants} Bewertungen${excludeInfo}
                <span class="help-beacon-header" onclick="event.stopPropagation(); window.openInfoModal('fraud-detection')" title="Was ist Fraud-Detection?">i</span>
            </div>
            <div class="fraud-body" id="fraud-body">
                <div class="fraud-actions">
                    <button type="button" id="fraud-select-all">Alle auswählen</button>
                    <button type="button" id="fraud-select-none">Auswahl aufheben</button>
                    <button type="button" id="fraud-exclude" class="btn-exclude" disabled>Markierte ausschließen</button>
                    <button type="button" id="fraud-reset" class="btn-reset" style="display:${excludedParticipantIds.length > 0 ? 'inline-block' : 'none'}">Alle Ausschlüsse zurücksetzen</button>
                </div>
                ${bodyHTML}
            </div>
        </div>`;

        bindFraudEvents();
    }

    function bindFraudEvents() {
        const toggle = document.getElementById('fraud-toggle');
        const body = document.getElementById('fraud-body');
        if (toggle && body) {
            toggle.addEventListener('click', function() {
                this.classList.toggle('open');
                body.classList.toggle('open');
            });
        }

        const selectAll = document.getElementById('fraud-select-all');
        const selectNone = document.getElementById('fraud-select-none');
        const excludeBtn = document.getElementById('fraud-exclude');

        if (selectAll) selectAll.addEventListener('click', () => {
            fraudSection.querySelectorAll('.fraud-row:not(.fraud-row-excluded) .fraud-cb').forEach(cb => { cb.checked = true; });
            updateFraudExcludeBtn();
        });

        if (selectNone) selectNone.addEventListener('click', () => {
            fraudSection.querySelectorAll('.fraud-row:not(.fraud-row-excluded) .fraud-cb').forEach(cb => { cb.checked = false; });
            updateFraudExcludeBtn();
        });

        fraudSection.addEventListener('change', (e) => {
            if (e.target.classList.contains('fraud-cb')) updateFraudExcludeBtn();
        });

        if (excludeBtn) excludeBtn.addEventListener('click', excludeSelectedFraud);

        const resetBtn = document.getElementById('fraud-reset');
        if (resetBtn) resetBtn.addEventListener('click', resetFraudExclusions);
    }

    function updateFraudExcludeBtn() {
        let totalPids = 0;
        fraudSection.querySelectorAll('.fraud-row:not(.fraud-row-excluded) .fraud-cb:checked').forEach(cb => {
            totalPids += cb.value.split(',').length;
        });
        const btn = document.getElementById('fraud-exclude');
        if (btn) {
            btn.disabled = totalPids === 0;
            btn.textContent = totalPids > 0 ? `${totalPids} Bewertungen ausschließen` : 'Markierte ausschließen';
        }
    }

    function excludeSelectedFraud() {
        const newExcludes = [];
        fraudSection.querySelectorAll('.fraud-cb:checked').forEach(cb => {
            if (cb.closest('.fraud-row').classList.contains('fraud-row-excluded')) return;
            cb.value.split(',').forEach(id => newExcludes.push(parseInt(id)));
        });
        if (newExcludes.length === 0) return;

        excludedParticipantIds = [...new Set([...excludedParticipantIds, ...newExcludes])];

        // Zeilen visuell als ausgeschlossen markieren
        fraudSection.querySelectorAll('.fraud-row:not(.fraud-row-excluded)').forEach(row => {
            const pids = row.dataset.participantIds.split(',').map(Number);
            if (pids.every(pid => excludedParticipantIds.includes(pid))) {
                row.classList.add('fraud-row-excluded');
                const cb = row.querySelector('.fraud-cb');
                if (cb) cb.checked = false;
            }
        });

        updateFraudHeader();
        updateFraudExcludeBtn();
        showFraudResetBtn(true);

        // Panel einklappen
        const toggle = document.getElementById('fraud-toggle');
        const body = document.getElementById('fraud-body');
        if (toggle) toggle.classList.remove('open');
        if (body) body.classList.remove('open');

        // Neuberechnung der Scores OHNE die ausgeschlossenen Teilnehmer
        analyseScores(true);
    }

    function resetFraudExclusions() {
        excludedParticipantIds = [];
        fraudSection.querySelectorAll('.fraud-row-excluded').forEach(row => {
            row.classList.remove('fraud-row-excluded');
        });
        updateFraudHeader();
        updateFraudExcludeBtn();
        showFraudResetBtn(false);

        // Komplette Neuberechnung ohne Ausschlüsse
        analyseScores(true);
    }

    function updateFraudHeader() {
        const toggle = document.getElementById('fraud-toggle');
        if (!toggle) return;
        const totalParticipants = fraudData.length;
        const incidentCount = fraudSection.querySelectorAll('.fraud-row').length;
        const excluded = excludedParticipantIds.length;
        const chevron = toggle.querySelector('.chevron');
        const chevronHTML = chevron ? chevron.outerHTML : '<span class="chevron">▶</span>';
        const excludeInfo = excluded > 0 ? ` (${excluded} Bewertungen ausgeschlossen)` : '';
        toggle.innerHTML = `${chevronHTML} Survey-Fraud-Detection: ${incidentCount} Indikation${incidentCount === 1 ? '' : 'en'}, ${totalParticipants} Bewertungen${excludeInfo}`;
    }

    function showFraudResetBtn(visible) {
        const btn = document.getElementById('fraud-reset');
        if (btn) btn.style.display = visible ? 'inline-block' : 'none';
    }

    function exportToCSV() {
        if (!analysisData || analysisData.length === 0) return;
        
        let csvContent = "Partner;Score;Positiv;Negativ;Awareness;Kriterium;Wichtigkeit;Performance\n";

        analysisData.forEach(partner => {
            if (partner.matrixDetails) {
                partner.matrixDetails.forEach(detail => {
                    let row = [
                        partner.partnerName,
                        partner.score,
                        partner.scorePositive,
                        partner.scoreNegative,
                        partner.awarenessPct,
                        detail.name, 
                        detail.imp,
                        detail.perf
                    ].map((field, index) => {
                        if (typeof field === 'string') {
                            return `"${field.replace(/"/g, '""')}"`;
                        }
                        return String(field).replace('.', ',');
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