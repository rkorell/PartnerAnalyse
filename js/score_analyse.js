/*
  Datei: /var/www/html/js/score_analyse.js
  Zweck: JS-Logik für Partner Score Analyse (Collapsing-Tree, Filter, API, Heatmap)
  # Modified: 23.11.2025, 15:00 - Collapsing-Tree für Departments, Parent-Child-Checkbox-Logik, Layout konsistent mit HTML
  # Modified: 23.11.2025, 15:30 - Analyse-Button und Survey-Auswahl: is_active wird bei Default-Auswahl berücksichtigt
*/

document.addEventListener("DOMContentLoaded", function() {
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

    fetchSurveys();
    fetchDepartments();

    minAnswersSlider.addEventListener('input', () => {
        minAnswersValue.textContent = minAnswersSlider.value;
    });
    closeErrorBtn.addEventListener('click', () => {
        errorMessage.style.display = 'none';
    });
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        analyseScores();
    });

    function fetchSurveys() {
        fetch('php/get_data.php')
            .then(response => response.json())
            .then(data => {
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
                    // Wenn keine als aktiv markiert ist: wähle die erste
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
                if (data && data.departments && departmentTreeContainer) {
                    departmentTreeContainer.innerHTML = '';
                    const departments = data.departments.map(dep => ({
                        ...dep,
                        id: Number(dep.id),
                        parent_id: (dep.parent_id === null || dep.parent_id === undefined || dep.parent_id === "") ? null : Number(dep.parent_id),
                        children: []
                    }));

                    // Build id->node map and build tree
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

                    // Tree rendering
                    function renderNode(node, level) {
                        const nodeDiv = document.createElement('div');
                        nodeDiv.className = 'department-node';
                        nodeDiv.style.marginLeft = (level * 20) + "px";
                        // Chevron
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
                        // Checkbox
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
                        // Label
                        const label = document.createElement('label');
                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(node.name));
                        nodeDiv.appendChild(chevron);
                        nodeDiv.appendChild(label);
                        if (node.children.length > 0 && node._expanded) {
                            const groupDiv = document.createElement('div');
                            groupDiv.className = 'department-checkbox-group';
                            node.children
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .forEach(child => {
                                    groupDiv.appendChild(renderNode(child, level + 1));
                                });
                            nodeDiv.appendChild(groupDiv);
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
                            departmentTreeContainer.appendChild(renderNode(root, 0));
                        });
                    }
                    renderTree();
                }
            });
    }

    function showLoader() {
        loadingOverlay._timeout = setTimeout(() => {
            loadingOverlay.style.display = 'flex';
        }, 300);
    }
    function hideLoader() {
        clearTimeout(loadingOverlay._timeout);
        loadingOverlay.style.display = 'none';
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorMessage.style.display = 'flex';
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
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);

        let html = `
        <div class="criteria-group-title">Ergebnis: Partner Score Ranking</div>
        <div class="criteria-table">
            <div class="criteria-row" style="background:#f8f9fa; font-weight:bold;">
                <div class="criteria-content" style="flex:0.3;">Rang</div>
                <div class="criteria-content" style="flex:2;">Partner</div>
                <div class="criteria-content" style="flex:2;">Score</div>
                <div class="criteria-content" style="flex:1;">Anzahl Antworten</div>
            </div>
        `;

        rows.forEach((row, idx) => {
            const pct = (maxScore === minScore)
                ? 1
                : (row.score - minScore) / (maxScore - minScore);

            const color = pct < 0.5
                ? interpolateColor([231, 76, 60], [243, 156, 18], pct * 2)
                : interpolateColor([243, 156, 18], [46, 204, 113], (pct - 0.5) * 2);
            const rgb = `rgb(${color.join(',')})`;

            html += `
            <div class="criteria-row">
                <div class="criteria-content" style="flex:0.3; text-align:center;">${idx + 1}</div>
                <div class="criteria-content" style="flex:2;">${row.partner_name}</div>
                <div class="criteria-content" style="flex:2;">
                    <div class="score-bar-bg">
                        <div class="score-bar-fill" style="width:${Math.round(pct*90)+10}%; background:${rgb};"></div>
                    </div>
                    <div class="score-bar-value">${row.score}</div>
                </div>
                <div class="criteria-content" style="flex:1; text-align:center;">${row.total_answers}</div>
            </div>
            `;
        });

        html += `</div>`;
        resultSection.innerHTML = html;
    }

    function interpolateColor(c1, c2, t) {
        return [
            Math.round(c1[0] + (c2[0]-c1[0])*t),
            Math.round(c1[1] + (c2[1]-c1[1])*t),
            Math.round(c1[2] + (c2[2]-c1[2])*t)
        ];
    }
});