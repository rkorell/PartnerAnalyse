/*
  Datei: /var/www/html/js/score_analyse.js
  Zweck: JS-Logik für Partner Score Analyse (Collapsing-Tree, Filter, API, Heatmap, IPA Matrix)
  # Modified: 23.11.2025, 17:00 - Nutzung der neuen CSS-Klassen
  # Modified: 23.11.2025, 17:45 - Integration IPA-Matrix (Modal, SVG, Tooltip)
  # Modified: 23.11.2025, 18:30 - Dynamische Zentrierung (Mean/Median) für Matrix implementiert
  # Modified: 23.11.2025, 19:15 - Echter Zoom/Entzerrung (Fadenkreuz fix in Mitte, Punkte dynamisch skaliert)
  # Modified: 23.11.2025, 19:45 - Cleanup: Median-Logik entfernt
  # Modified: 23.11.2025, 21:30 - Integration Info-Modal und App-Texte aus DB
*/

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

    // Matrix Modal Elemente
    const matrixModal = document.getElementById('matrix-modal');
    const closeMatrixBtn = document.getElementById('close-matrix');
    const matrixContainer = document.getElementById('matrix-container');
    const matrixTitle = document.getElementById('matrix-title');
    const matrixTooltip = document.getElementById('matrix-tooltip');
    
    // Matrix Radio Buttons
    const matrixRadios = document.querySelectorAll('input[name="matrix-center"]');

    // NEU: Info Modal Elemente und Speicher für Texte
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

    // NEU: Info Modal Schließen
    if(closeInfoBtn) closeInfoBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
    if(infoModal) infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.style.display = 'none';
    });

    // Globaler Öffner für das Info-Modal (für onclick im HTML)
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
                // NEU: Texte speichern (gleich beim ersten Fetch)
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
                // Falls fetchSurveys schiefgeht, holen wir Texte hier zur Sicherheit auch
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

                    // Render-Funktion mit CSS-Klassen für Explorer-Look
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
            } else if (data && data.message) {
                resultSection.innerHTML = `<div class="selection-info">${data.message}</div>`;
            } else if (data && data.error) {
                showError(data.error);
            } else {
                showError("Unbekanntes Antwortformat.");
            }
        })
        .catch(err => {
            hideLoader();
            showError("Analyse konnte nicht durchgeführt werden.");
        });
    }

    function renderResultTable(rows) {
        const scores = rows.map(r => r.score);
        const min = Math.min(...scores); const max = Math.max(...scores);

        let html = `
        <div class="criteria-group-title">Ergebnis: Partner Score Ranking</div>
        <div class="criteria-table">
            <div class="criteria-row" style="background:#f8f9fa; font-weight:bold;">
                <div class="criteria-content" style="flex:0.3;">Rang</div>
                <div class="criteria-content" style="flex:2;">Partner</div>
                <div class="criteria-content" style="flex:2;">Score</div>
                <div class="criteria-content" style="flex:1;">Anzahl Antworten</div>
            </div>`;

        rows.forEach((row, idx) => {
            const pct = (max === min) ? 1 : (row.score - min) / (max - min);
            const color = pct < 0.5
                ? interpolateColor([231, 76, 60], [243, 156, 18], pct * 2)
                : interpolateColor([243, 156, 18], [46, 204, 113], (pct - 0.5) * 2);
            const rgb = `rgb(${color.join(',')})`;

            html += `
            <div class="criteria-row partner-row-clickable" data-partner-id="${row.partner_id}">
                <div class="criteria-content" style="flex:0.3; text-align:center;">${idx + 1}</div>
                <div class="criteria-content" style="flex:2; color:#3498db; cursor:pointer; font-weight:500;">${row.partner_name} ↗</div>
                <div class="criteria-content" style="flex:2;">
                    <div class="score-bar-bg"><div class="score-bar-fill" style="width:${Math.round(pct*90)+10}%; background:${rgb};"></div></div>
                    <div class="score-bar-value">${row.score}</div>
                </div>
                <div class="criteria-content" style="flex:1; text-align:center;">${row.total_answers}</div>
            </div>`;
        });
        html += `</div>`;
        resultSection.innerHTML = html;
        document.querySelectorAll('.partner-row-clickable').forEach(row => {
            row.addEventListener('click', function() { openMatrix(this.getAttribute('data-partner-id')); });
        });
    }

    function interpolateColor(c1, c2, t) { return [ Math.round(c1[0] + (c2[0]-c1[0])*t), Math.round(c1[1] + (c2[1]-c1[1])*t), Math.round(c1[2] + (c2[2]-c1[2])*t) ]; }

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

        // Reset auf "Standard"
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
        let maxDist = 5.0; // Standard

        if (mode === 'mean') {
            centerX = stats.mean.perf;
            centerY = stats.mean.imp;
            maxDist = calculateMaxDeviation(currentPartnerDetails.matrix_details, centerX, centerY);
        } else {
            // Standard: Center 5.0, Scale 5.0
            centerX = 5.0;
            centerY = 5.0;
            maxDist = 5.0;
        }

        renderMatrixSVG(currentPartnerDetails.matrix_details, centerX, centerY, maxDist);
    }

    // Hilfsfunktion: Maximale Abweichung für Zoom
    function calculateMaxDeviation(details, cx, cy) {
        let maxD = 0;
        details.forEach(d => {
            const dx = Math.abs(d.perf - cx);
            const dy = Math.abs(d.imp - cy);
            maxD = Math.max(maxD, dx, dy);
        });
        return Math.max(maxD * 1.1, 0.5); // 10% Rand
    }

    function renderMatrixSVG(details, centerX, centerY, rangeRadius) {
        const size = 400;
        
        // Mapping Funktion: Wert -> Pixel
        // Visuelles Zentrum ist IMMER size/2
        // Skalierung: 1 Einheit = (size/2) / rangeRadius
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

        // Punkte zeichnen
        details.forEach(d => {
            // Berechnung relativ zum Zentrum
            const dx = d.perf - centerX;
            const dy = d.imp - centerY; 
            
            // Umrechnung in Pixel relativ zur Mitte
            const px = mid + (dx * scale);
            const py = mid - (dy * scale); // SVG Y ist invertiert

            svg += `<circle cx="${px}" cy="${py}" r="6" fill="#3498db" stroke="#fff" stroke-width="1"
                    class="matrix-dot" 
                    data-name="${d.name}" data-imp="${d.imp}" data-perf="${d.perf}" />`;
        });
        
        svg += `</svg>`;
        matrixContainer.innerHTML = svg;

        // Tooltips
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