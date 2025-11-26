/*
  Datei: /var/www/html/js/score_analyse.js
  Zweck: JS-Logik für Partner Score Analyse (Collapsing-Tree, Filter, API, Heatmap, IPA Matrix)
  # Modified: 23.11.2025, 17:00 - Nutzung der neuen CSS-Klassen
  # Modified: 23.11.2025, 17:45 - Integration IPA-Matrix (Modal, SVG, Tooltip)
  # Modified: 23.11.2025, 18:30 - Dynamische Zentrierung (Mean/Median) für Matrix implementiert
  # Modified: 23.11.2025, 19:15 - Echter Zoom/Entzerrung (Fadenkreuz fix in Mitte, Punkte dynamisch skaliert)
  # Modified: 23.11.2025, 19:45 - Cleanup: Median-Logik entfernt
  # Modified: 23.11.2025, 21:30 - Integration Info-Modal und App-Texte aus DB
  # Modified: 26.11.2025, 16:00 - Added CSV Export functionality
  # Modified: 26.11.2025, 16:30 - UX Fix: Button turns blue (primary); Excel Fix: Decimal comma
  # Modified: 26.11.2025, 16:45 - Updated table header to "Anzahl Beurteiler"
  # Modified: 26.11.2025, 17:00 - Show global participant count in table title
  # Modified: 26.11.2025, 21:45 - Implemented Insights column
  # Modified: 27.11.2025, 11:45 - Revert to Emojis, Fix NPS Colors (Text), Fix DB Grouping Error
  # Modified: 27.11.2025, 13:30 - CONST Threshold, Max Divergence Logic, Centered Icons
  # Modified: 27.11.2025, 14:00 - Layout Update: Wider Slots (NPS 80px, Comments 60px), Flex 2.2
  # Modified: 27.11.2025, 14:30 - Fix: Comment Count Alignment (middle instead of top)
*/

// HIER: Konfigurierbarer Schwellenwert für Konflikt-Icon
const CONFLICT_THRESHOLD = 2.0;

document.addEventListener("DOMContentLoaded", function() {
    // --- Bestehende Referenzen ---
    const surveySelect = document.getElementById('survey-filter');
    const departmentTreeContainer = document.getElementById('department-collapsing-tree');
    const minAnswersSlider = document.getElementById('min-answers-slider');
    const minAnswersValue = document.getElementById('min-answers-value');
    const filterForm = document.getElementById('analyse-filter-form');
    const resultSection = document.getElementById('result-section');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const closeErrorBtn = document.getElementById('close-error');
    const exportBtn = document.getElementById('export-btn'); 

    // Matrix Modal Elemente
    const matrixModal = document.getElementById('matrix-modal');
    const closeMatrixBtn = document.getElementById('close-matrix');
    const matrixContainer = document.getElementById('matrix-container');
    const matrixTitle = document.getElementById('matrix-title');
    const matrixTooltip = document.getElementById('matrix-tooltip');
    
    // Matrix Radio Buttons
    const matrixRadios = document.querySelectorAll('input[name="matrix-center"]');

    // Info Modal Elemente und Speicher für Texte
    let appTexts = {};
    const infoModal = document.getElementById('global-info-modal');
    const closeInfoBtn = document.getElementById('close-info-modal');

    // Globale Daten
    let analysisData = [];
    let currentPartnerDetails = null; 

    fetchSurveys();
    fetchDepartments();

    // Event Listeners
    minAnswersSlider.addEventListener('input', () => { minAnswersValue.textContent = minAnswersSlider.value; });
    closeErrorBtn.addEventListener('click', () => { errorMessage.style.display = 'none'; });
    
    // Matrix Modal Schließen
    closeMatrixBtn.addEventListener('click', () => { matrixModal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === matrixModal) matrixModal.style.display = 'none'; });

    // Info Modal Schließen
    if(closeInfoBtn) closeInfoBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
    if(infoModal) infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });

    // Export Button Event
    if(exportBtn) exportBtn.addEventListener('click', exportToCSV);

    // Globaler Öffner für das Info-Modal
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

    function fetchSurveys() {
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
                if (data.app_texts) {
                    appTexts = data.app_texts;
                }

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
                    if (!anyActive && surveySelect.options.length) {
                        surveySelect.options[0].selected = true;
                    }
                }
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
                        if (dep.parent_id === null) {
                            roots.push(dep);
                        } else if (deptMap[dep.parent_id]) {
                            deptMap[dep.parent_id].children.push(dep);
                        }
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
                            
                            node.children
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .forEach(child => {
                                    childrenDiv.appendChild(renderNode(child));
                                });
                            nodeDiv.appendChild(childrenDiv);
                        }

                        return nodeDiv;
                    }

                    function setCheckState(node, checked) {
                        node._checked = checked;
                        node._indeterminate = false;
                        if (node.children) {
                            node.children.forEach(child => setCheckState(child, checked));
                        }
                    }
                    function updateParentIndeterminate(node) {
                        if (node.parent_id !== null && deptMap[node.parent_id]) {
                            const parent = deptMap[node.parent_id];
                            const total = parent.children.length;
                            const checked = parent.children.filter(c => c._checked).length;
                            const indet = parent.children.filter(c => c._indeterminate).length;
                            if (checked === total) {
                                parent._checked = true;
                                parent._indeterminate = false;
                            } else if (checked === 0 && indet === 0) {
                                parent._checked = false;
                                parent._indeterminate = false;
                            } else {
                                parent._checked = false;
                                parent._indeterminate = true;
                            }
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

    function showLoader() { loadingOverlay._timeout = setTimeout(() => { loadingOverlay.style.display = 'flex'; }, 300); }
    function hideLoader() { clearTimeout(loadingOverlay._timeout); loadingOverlay.style.display = 'none'; }
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

        resultSection.innerHTML = "";
        setExportButtonState(false);
        
        showLoader();

        fetch('php/partner_score_analyse.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                survey_ids: surveyIds,
                manager_filter: managerFilter,
                department_ids: departmentIds,
                min_answers: minAnswers
            })
        })
        .then(resp => resp.json())
        .then(data => {
            hideLoader();
            if (Array.isArray(data) && data.length > 0) {
                analysisData = data;
                renderResultTable(data);
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
            hideLoader();
            showError("Analyse konnte nicht durchgeführt werden.");
            analysisData = [];
            setExportButtonState(false);
        });
    }

    function renderResultTable(rows) {
        const scores = rows.map(r => r.score);
        const min = Math.min(...scores); const max = Math.max(...scores);
        
        const globalCount = rows.length > 0 && rows[0].global_participant_count ? rows[0].global_participant_count : 0;

        let html = `
        <div class="criteria-group-title">Ergebnis: Partner Score Ranking (Basierend auf ${globalCount} Teilnehmern)</div>
        <div class="criteria-table">
            <div class="criteria-row" style="background:#f8f9fa; font-weight:bold; display:flex; align-items:center;">
                <div class="criteria-content" style="flex:0.3;">Rang</div>
                <div class="criteria-content" style="flex:2;">Partner</div>
                <div class="criteria-content" style="flex:2;">Score</div>
                <div class="criteria-content" style="flex:1;">Anzahl Beurteiler</div>
                <div class="criteria-content" style="flex:2.2; text-align:center;">Insights</div>
            </div>`;

        rows.forEach((row, idx) => {
            const pct = (max === min) ? 1 : (row.score - min) / (max - min);
            const color = pct < 0.5
                ? interpolateColor([231, 76, 60], [243, 156, 18], pct * 2)
                : interpolateColor([243, 156, 18], [46, 204, 113], (pct - 0.5) * 2);
            const rgb = `rgb(${color.join(',')})`;

            // --- Insights Slots (4 Feste Plätze) ---
            let slot1 = ''; // NPS
            let slot2 = ''; // Comments
            let slot3 = ''; // Action
            let slot4 = ''; // Conflict

            // 1. NPS (📣)
            if (row.nps_score !== null && row.nps_score !== undefined) {
                const nps = parseInt(row.nps_score);
                let npsColor = '#e74c3c'; // Rot (<0)
                if (nps >= 0 && nps <= 30) npsColor = '#f39c12'; // Orange
                else if (nps > 30 && nps <= 70) npsColor = '#f1c40f'; // Gelb
                else if (nps > 70) npsColor = '#2ecc71'; // Grün
                
                slot1 = `<span style="margin:0; cursor:default; font-size:1.2em; white-space:nowrap;" title="NPS Score: ${nps}">📣 <span style="font-size:0.8em; font-weight:bold; vertical-align:middle; color:${npsColor};">${nps > 0 ? '+' : ''}${nps}</span></span>`;
            }

            // 2. Kommentare (💬)
            const commentCount = parseInt(row.comment_count || 0);
            if (commentCount > 0) {
                // HIER GEÄNDERT: vertical-align: middle
                slot2 = `<span class="insight-icon" data-action="comments" data-id="${row.partner_id}" style="margin:0; cursor:pointer; font-size:1.5em;" title="${commentCount} Kommentare - Klick für Details">💬 <span style="font-size:0.6em; font-weight:bold; vertical-align:middle;">${commentCount}</span></span>`;
            }

            // 3. Action List (⚠️)
            let hasAction = false;
            if (row.matrix_details) {
                hasAction = row.matrix_details.some(d => parseFloat(d.imp) >= 8.0 && parseFloat(d.perf) <= 5.0);
            }
            if (hasAction) {
                slot3 = `<span class="insight-icon" data-action="action" data-id="${row.partner_id}" style="margin:0; cursor:pointer; font-size:1.5em;" title="Handlungsbedarf - Klick für Details">⚠️</span>`;
            }

            // 4. Divergenz (⚡) - NEU: Basiert auf Max Divergence > Threshold
            const maxDiv = parseFloat(row.max_divergence || 0);
            const cntMgr = parseInt(row.num_assessors_mgr || 0);
            const cntTeam = parseInt(row.num_assessors_team || 0);
            
            if (cntMgr >= 3 && cntTeam >= 3 && maxDiv > CONFLICT_THRESHOLD) {
                const title = `Maximale Divergenz: ${maxDiv.toFixed(1)} (Schwellenwert: ${CONFLICT_THRESHOLD})`;
                slot4 = `<span class="insight-icon" data-action="conflict" data-id="${row.partner_id}" style="margin:0; cursor:pointer; font-size:1.5em;" title="${title}">⚡</span>`;
            }

            // HIER GEÄNDERT: Flex Anteil erhöht auf 2.2 und feste Slot-Breiten
            html += `
            <div class="criteria-row partner-row-clickable" data-partner-id="${row.partner_id}" style="display:flex; align-items:center;">
                <div class="criteria-content" style="flex:0.3; text-align:center;">${idx + 1}</div>
                <div class="criteria-content" style="flex:2; color:#3498db; cursor:pointer; font-weight:500;">${row.partner_name} ↗</div>
                <div class="criteria-content" style="flex:2;">
                    <div class="score-bar-bg"><div class="score-bar-fill" style="width:${Math.round(pct*90)+10}%; background:${rgb};"></div></div>
                    <div class="score-bar-value">${row.score}</div>
                </div>
                <div class="criteria-content" style="flex:1; text-align:center;">${row.total_answers}</div>
                <div class="criteria-content" style="flex:2.2; display:flex; justify-content:space-between; align-items:center; padding:5px 15px;">
                    <div style="width:80px; text-align:left;">${slot1}</div>
                    <div style="width:60px; text-align:center;">${slot2}</div>
                    <div style="width:30px; text-align:center;">${slot3}</div>
                    <div style="width:30px; text-align:center;">${slot4}</div>
                </div>
            </div>`;
        });
        html += `</div>`;

        // Footer Legende
        html += `
        <div class="icon-legend" style="margin-top:15px; padding:10px; background:#f8f9fa; border-radius:4px; font-size:0.9em; color:#7f8c8d;">
            <strong style="margin-right:10px;">Legende:</strong>
            <span style="margin-right:20px;">📣 NPS-Score</span>
            <span style="margin-right:20px;">💬 Kommentare vorhanden</span>
            <span style="margin-right:20px;">⚠️ Handlungsfelder (Vorschläge)</span>
            <span>⚡ Bewertungsunterschiede Mgmt/Field</span>
        </div>`;

        resultSection.innerHTML = html;
        
        document.querySelectorAll('.partner-row-clickable').forEach(row => {
            row.addEventListener('click', function(e) {
                if(e.target.closest('.insight-icon')) return;
                openMatrix(this.getAttribute('data-partner-id')); 
            });
        });

        document.querySelectorAll('.insight-icon').forEach(icon => {
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                handleInsightClick(this.dataset.action, this.dataset.id);
            });
        });
    }

    function handleInsightClick(action, partnerId) {
        const partner = analysisData.find(p => p.partner_id == partnerId);
        if (!partner) return;

        let title = "";
        let content = "";

        if (action === 'comments') {
            title = `Kommentare zu ${partner.partner_name}`;
            if (partner.general_comments && partner.general_comments.length > 0) {
                content += `<h4>Allgemeines Feedback</h4><ul>`;
                partner.general_comments.forEach(c => content += `<li>${c}</li>`);
                content += `</ul>`;
            }
            if (partner.matrix_details) {
                const specific = partner.matrix_details.filter(d => d.comments && d.comments.length > 0);
                if (specific.length > 0) {
                    content += `<h4>Spezifisches Feedback</h4>`;
                    specific.forEach(d => {
                        content += `<strong>${d.name}</strong> (I:${d.imp}/P:${d.perf})<ul>`;
                        d.comments.forEach(c => content += `<li>${c}</li>`);
                        content += `</ul>`;
                    });
                }
            }
        } 
        else if (action === 'action') {
            title = `Handlungsfelder für ${partner.partner_name}`;
            if (partner.matrix_details) {
                const items = partner.matrix_details.filter(d => parseFloat(d.imp) >= 8.0 && parseFloat(d.perf) <= 5.0);
                if (items.length > 0) {
                    content += `<table style="width:100%; text-align:left;"><tr><th>Kriterium</th><th>Wichtigkeit</th><th>Performance</th></tr>`;
                    items.forEach(i => {
                        content += `<tr><td>${i.name}</td><td>${i.imp}</td><td style="color:#e74c3c; font-weight:bold;">${i.perf}</td></tr>`;
                    });
                    content += `</table>`;
                }
            }
        }
        else if (action === 'conflict') {
            title = `Signifikante Abweichungen: ${partner.partner_name}`;
            // NEU: Liste der Kriterien mit hoher Divergenz
            if (partner.matrix_details) {
                const conflicts = partner.matrix_details.filter(d => {
                    const mgr = parseFloat(d.perf_mgr || 0);
                    const team = parseFloat(d.perf_team || 0);
                    return Math.abs(mgr - team) > CONFLICT_THRESHOLD;
                });
                
                if (conflicts.length > 0) {
                    content += `<table style="width:100%; text-align:left;"><tr><th>Kriterium</th><th>Manager Ø</th><th>Team Ø</th><th>Delta</th></tr>`;
                    conflicts.forEach(c => {
                        const mgr = parseFloat(c.perf_mgr || 0);
                        const team = parseFloat(c.perf_team || 0);
                        const delta = Math.abs(mgr - team).toFixed(1);
                        content += `<tr>
                            <td>${c.name}</td>
                            <td style="color:#e74c3c; font-weight:bold;">${mgr.toFixed(1)}</td>
                            <td style="color:#3498db; font-weight:bold;">${team.toFixed(1)}</td>
                            <td>${delta}</td>
                        </tr>`;
                    });
                    content += `</table>`;
                } else {
                    content += `<p>Keine Kriterien gefunden, die den Schwellenwert von ${CONFLICT_THRESHOLD} überschreiten.</p>`;
                }
            }
        }

        const modalBody = document.getElementById('info-modal-body');
        modalBody.innerHTML = `<h2 style="margin-top:0; border-bottom:2px solid #3498db; padding-bottom:10px;">${title}</h2>` + content;
        document.getElementById('global-info-modal').style.display = 'flex';
    }

    function interpolateColor(c1, c2, t) { return [ Math.round(c1[0] + (c2[0]-c1[0])*t), Math.round(c1[1] + (c2[1]-c1[1])*t), Math.round(c1[2] + (c2[2]-c1[2])*t) ]; }

    function exportToCSV() {
        if (!analysisData || analysisData.length === 0) return;

        let csvContent = "Partner;Gesamt-Score;Anzahl Beurteiler;Kriterium (Matrix);Wichtigkeit (I);Performance (P)\n";

        analysisData.forEach(partner => {
            if (partner.matrix_details) {
                partner.matrix_details.forEach(detail => {
                    let row = [
                        partner.partner_name,
                        partner.score,
                        partner.total_answers,
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

    // --- IPA Matrix Logik ---

    function calculateStats(details) {
        const imps = details.map(d => parseFloat(d.imp));
        const perfs = details.map(d => parseFloat(d.perf));
        
        const sumImp = imps.reduce((a,b) => a+b, 0);
        const sumPerf = perfs.reduce((a,b) => a+b, 0);
        
        return {
            mean: { imp: sumImp / imps.length, perf: sumPerf / perfs.length }
        };
    }

    window.openMatrix = function(partnerId) {
        const partner = analysisData.find(p => p.partner_id == partnerId);
        if (!partner || !partner.matrix_details) return;

        currentPartnerDetails = partner; 
        matrixTitle.textContent = "IPA Matrix: " + partner.partner_name;

        const radios = document.querySelectorAll('input[name="matrix-center"]');
        radios.forEach(r => { if(r.value === 'standard') r.checked = true; });
        
        updateMatrixView('standard');
        matrixModal.style.display = 'flex';
    }

    function updateMatrixView(mode) {
        if (!currentPartnerDetails) return;
        
        const stats = calculateStats(currentPartnerDetails.matrix_details);
        let centerX = 5.0;
        let centerY = 5.0;
        let maxDist = 5.0; 

        if (mode === 'mean') {
            centerX = stats.mean.perf;
            centerY = stats.mean.imp;
            maxDist = calculateMaxDeviation(currentPartnerDetails.matrix_details, centerX, centerY);
        } else {
            centerX = 5.0;
            centerY = 5.0;
            maxDist = 5.0;
        }

        renderMatrixSVG(currentPartnerDetails.matrix_details, centerX, centerY, maxDist);
    }

    function calculateMaxDeviation(details, cx, cy) {
        let maxD = 0;
        details.forEach(d => {
            const dx = Math.abs(d.perf - cx);
            const dy = Math.abs(d.imp - cy);
            maxD = Math.max(maxD, dx, dy);
        });
        return Math.max(maxD * 1.1, 0.5); 
    }

    function renderMatrixSVG(details, centerX, centerY, rangeRadius) {
        const size = 400;
        
        const scale = (size / 2) / rangeRadius;

        let svg = `<svg viewBox="0 0 ${size} ${size}" class="matrix-svg">`;
        const mid = size / 2;

        svg += `
            <line x1="0" y1="${mid}" x2="${size}" y2="${mid}" stroke="#bdc3c7" stroke-width="2" stroke-dasharray="5,5" />
            <line x1="${mid}" y1="0" x2="${mid}" y2="${size}" stroke="#bdc3c7" stroke-width="2" stroke-dasharray="5,5" />
            
            <text x="10" y="20" fill="#95a5a6" font-size="12">Konzentrieren!</text>
            <text x="${size-10}" y="20" fill="#95a5a6" font-size="12" text-anchor="end">Weiter so</text>
            <text x="10" y="${size-10}" fill="#95a5a6" font-size="12">Niedrige Prio</text>
            <text x="${size-10}" y="${size-10}" fill="#95a5a6" font-size="12" text-anchor="end">Overkill?</text>
            
            <text x="${size-10}" y="${mid-10}" fill="#bdc3c7" font-size="11" text-anchor="end">
                Zentrum: ${centerX.toFixed(2)} / ${centerY.toFixed(2)}
            </text>
        `;

        details.forEach(d => {
            const dx = d.perf - centerX;
            const dy = d.imp - centerY; 
            
            const px = mid + (dx * scale);
            const py = mid - (dy * scale); 

            svg += `<circle cx="${px}" cy="${py}" r="6" fill="#3498db" stroke="#fff" stroke-width="1"
                    class="matrix-dot" 
                    data-name="${d.name}" data-imp="${d.imp}" data-perf="${d.perf}" />`;
        });
        
        svg += `</svg>`;
        matrixContainer.innerHTML = svg;

        const dots = matrixContainer.querySelectorAll('.matrix-dot');
        dots.forEach(dot => {
            dot.addEventListener('mouseenter', () => {
                const name = dot.getAttribute('data-name');
                const i = dot.getAttribute('data-imp');
                const p = dot.getAttribute('data-perf');
                matrixTooltip.textContent = `${name} (I: ${i} / P: ${p})`;
                matrixTooltip.style.display = 'block';
            });
        });
    }
});