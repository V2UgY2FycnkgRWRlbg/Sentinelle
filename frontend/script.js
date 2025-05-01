// Variables globales
let selectedSubdomains = [];
const API_URL = "http://localhost:8000";
const MAX_SUBDOMAINS = 3;
let scanHistory = [];
let vulnerabilities = [];
let darkMode = false;
let refreshInterval = 3; // secondes

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initTabSystem();
    initModalSystem();
    loadSavedSettings();
    updateStats();
});

// Initialisation de la navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Retirer la classe active de tous les éléments
            navItems.forEach(i => i.classList.remove('active'));

            // Ajouter la classe active à l'élément cliqué
            item.classList.add('active');

            // Afficher la section correspondante
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

// Afficher une section spécifique
function showSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Afficher la section demandée
    document.getElementById(sectionId).classList.add('active');

    // Mettre à jour le titre de la section
    document.getElementById('section-title').textContent =
        document.querySelector(`.nav-item[data-section="${sectionId}"]`).querySelector('span').textContent;
}

// Initialisation du système d'onglets
function initTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Retirer la classe active de tous les boutons et panneaux
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            // Ajouter la classe active au bouton cliqué et au panneau correspondant
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialisation du système de modales
function initModalSystem() {
    const modal = document.getElementById('resultsModal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialisation du toggle de thème
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');

    themeToggle.addEventListener('click', toggleDarkMode);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
        });
    }
}

// Activer le mode sombre
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    if (document.getElementById('darkModeToggle')) {
        document.getElementById('darkModeToggle').checked = true;
    }
    darkMode = true;
    localStorage.setItem('darkMode', 'true');
}

// Désactiver le mode sombre
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    if (document.getElementById('darkModeToggle')) {
        document.getElementById('darkModeToggle').checked = false;
    }
    darkMode = false;
    localStorage.setItem('darkMode', 'false');
}

// Basculer le mode sombre
function toggleDarkMode() {
    if (darkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Charger les paramètres sauvegardés
function loadSavedSettings() {
    // Charger le mode sombre
    if (localStorage.getItem('darkMode') === 'true') {
        enableDarkMode();
    }

    // Charger l'intervalle de rafraîchissement
    const savedInterval = localStorage.getItem('refreshInterval');
    if (savedInterval) {
        refreshInterval = parseInt(savedInterval);
        if (document.getElementById('refreshInterval')) {
            document.getElementById('refreshInterval').value = refreshInterval;
        }
    }

    // Ajouter un écouteur d'événements pour l'intervalle de rafraîchissement
    const intervalInput = document.getElementById('refreshInterval');
    if (intervalInput) {
        intervalInput.addEventListener('change', (e) => {
            refreshInterval = parseInt(e.target.value);
            localStorage.setItem('refreshInterval', refreshInterval);
        });
    }
}

// Mettre à jour les statistiques
function updateStats() {
    document.getElementById('totalScans').textContent = scanHistory.length;
    document.getElementById('totalVulnerabilities').textContent = vulnerabilities.length;

    // Calculer le nombre de domaines uniques
    const domains = new Set();
    scanHistory.forEach(scan => {
        domains.add(scan.target);
    });
    document.getElementById('totalDomains').textContent = domains.size;

    // Mettre à jour la liste des scans récents
    updateRecentScans();
}

// Mettre à jour la liste des scans récents
function updateRecentScans() {
    const recentScansList = document.getElementById('recentScansList');
    const historyList = document.getElementById('historyList');

    if (scanHistory.length === 0) {
        recentScansList.innerHTML = '<p class="empty-state">Aucun scan récent</p>';
        historyList.innerHTML = '<p class="empty-state">Aucun historique disponible</p>';
        return;
    }

    recentScansList.innerHTML = '';
    historyList.innerHTML = '';

    // Afficher les 5 scans les plus récents sur le tableau de bord
    const recentScans = scanHistory.slice(0, 5);

    recentScans.forEach(scan => {
        const scanItem = document.createElement('div');
        scanItem.className = 'scan-item';
        scanItem.innerHTML = `
            <div class="scan-item-header">
                <h4>${scan.target}</h4>
                <span class="scan-date">${new Date(scan.date).toLocaleString()}</span>
            </div>
            <div class="scan-item-footer">
                <span class="scan-status ${scan.status}">${scan.status}</span>
                <button class="btn-view-results" data-task-id="${scan.taskId}">Voir les résultats</button>
            </div>
        `;

        recentScansList.appendChild(scanItem);

        // Ajouter un écouteur d'événements pour le bouton "Voir les résultats"
        scanItem.querySelector('.btn-view-results').addEventListener('click', () => {
            showResults(scan.taskId);
        });
    });

    // Afficher tous les scans dans l'historique
    scanHistory.forEach(scan => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-header">
                <h4>${scan.target}</h4>
                <span class="history-date">${new Date(scan.date).toLocaleString()}</span>
            </div>
            <div class="history-item-details">
                <span class="history-status ${scan.status}">${scan.status}</span>
                <span class="history-type">${scan.type || 'direct'}</span>
            </div>
            <div class="history-item-actions">
                <button class="btn-view-history" data-task-id="${scan.taskId}">Voir les résultats</button>
            </div>
        `;

        historyList.appendChild(historyItem);

        // Ajouter un écouteur d'événements pour le bouton "Voir les résultats"
        historyItem.querySelector('.btn-view-history').addEventListener('click', () => {
            showResults(scan.taskId);
        });
    });

    // Ajouter des styles pour les éléments d'historique
    const style = document.createElement('style');
    if (!document.getElementById('history-styles')) {
        style.id = 'history-styles';
        style.textContent = `
            .history-item {
                background-color: white;
                border-radius: var(--border-radius);
                padding: 15px;
                margin-bottom: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            }

            .dark-mode .history-item {
                background-color: var(--card-bg);
            }

            .history-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .history-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .history-item-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }

            .history-date {
                font-size: 12px;
                color: var(--secondary-color);
            }

            .history-item-details {
                display: flex;
                margin-bottom: 10px;
                font-size: 14px;
            }

            .history-status {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                margin-right: 10px;
            }

            .history-status.completed {
                background-color: #d4edda;
                color: #155724;
            }

            .dark-mode .history-status.completed {
                background-color: #264c36;
                color: #8fd19e;
            }

            .history-status.running {
                background-color: #cce5ff;
                color: #004085;
            }

            .dark-mode .history-status.running {
                background-color: #1a3a5f;
                color: #8cb8ff;
            }

            .history-status.error {
                background-color: #f8d7da;
                color: #721c24;
            }

            .dark-mode .history-status.error {
                background-color: #5c2329;
                color: #f5c6cb;
            }

            .history-type {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                background-color: #f8f9fa;
                color: #6c757d;
            }

            .dark-mode .history-type {
                background-color: #2c3035;
                color: #adb5bd;
            }

            .history-item-actions {
                display: flex;
                justify-content: flex-end;
            }

            .btn-view-history {
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            .btn-view-history:hover {
                background-color: #3a5ce5;
            }

            .scan-item {
                background-color: white;
                border-radius: var(--border-radius);
                padding: 15px;
                margin-bottom: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            }

            .dark-mode .scan-item {
                background-color: var(--card-bg);
            }

            .scan-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .scan-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .scan-item-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }

            .scan-date {
                font-size: 12px;
                color: var(--secondary-color);
            }

            .scan-item-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .scan-status {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
            }

            .scan-status.completed {
                background-color: #d4edda;
                color: #155724;
            }

            .dark-mode .scan-status.completed {
                background-color: #264c36;
                color: #8fd19e;
            }

            .btn-view-results {
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            .btn-view-results:hover {
                background-color: #3a5ce5;
            }
        `;
        document.head.appendChild(style);
    }
}

// Afficher les résultats d'un scan
function showResults(taskId) {
    console.log("Récupération des résultats pour le taskId:", taskId);

    fetch(`${API_URL}/results/${taskId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Données reçues du backend:", data);

            if (data.status === "completed" && data.result) {
                console.log("Résultats complets:", data.result);
                displayResultsInModal(data.result);
            } else {
                console.warn("Résultats non disponibles:", data);
                alert("Les résultats ne sont pas encore disponibles.");
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des résultats:", error);
            alert("Erreur lors de la récupération des résultats.");
        });
}

// Afficher les résultats dans la modale
function displayResultsInModal(results) {
    console.log("Affichage des résultats dans la modale:", results);

    // Déterminer si les résultats sont pour un seul domaine ou plusieurs
    let isSingleDomain = true;
    let domains = [];

    if (typeof results === 'object' && results !== null) {
        // Vérifier si c'est un scan multi-domaines
        if (Object.keys(results).some(key => typeof results[key] === 'object' && results[key] !== null)) {
            isSingleDomain = false;
            domains = Object.keys(results);
            console.log("Scan multi-domaines détecté. Domaines:", domains);
        }
    }

    // Préparer les conteneurs pour les résultats
    document.getElementById('nmapResult').innerHTML = '';
    document.getElementById('nucleiResult').innerHTML = '';
    document.getElementById('niktoResult').innerHTML = '';

    // Variables pour les statistiques
    let totalOpenPorts = 0;
    let totalServices = 0;
    let totalVulnerabilities = 0;

    if (isSingleDomain) {
        console.log("Traitement des résultats pour un seul domaine");

        // Traitement pour un seul domaine
        const nmapResults = results.nmap || "Aucun résultat Nmap";
        const nucleiResults = results.nuclei || "Aucun résultat Nuclei";
        const niktoResults = results.nikto || "Aucun résultat Nikto";

        console.log("Résultats Nuclei:", nucleiResults);

        document.getElementById('nmapResult').textContent = nmapResults;
        document.getElementById('nucleiResult').textContent = nucleiResults;
        document.getElementById('niktoResult').textContent = niktoResults;

        // Compter les ports ouverts
        const openPortsMatch = nmapResults.match(/(\d+)\/tcp\s+open/g);
        totalOpenPorts = openPortsMatch ? openPortsMatch.length : 0;

        // Compter les services
        const serviceMatch = nmapResults.match(/(\d+)\/tcp\s+open\s+(\w+)/g);
        totalServices = serviceMatch ? serviceMatch.length : 0;

        // Compter les vulnérabilités
        if (nucleiResults && nucleiResults !== "Aucune vulnérabilité détectée par Nuclei.") {
            totalVulnerabilities += (nucleiResults.match(/\[(\w+)\]/g) || []).length;
        }
        if (niktoResults) {
            totalVulnerabilities += (niktoResults.match(/\+ /g) || []).length;
        }
    } else {
        // Traitement pour plusieurs domaines
        domains.forEach(domain => {
            const domainResults = results[domain];
            if (!domainResults) return;

            const nmapResults = domainResults.nmap || "Aucun résultat Nmap";
            const nucleiResults = domainResults.nuclei || "Aucun résultat Nuclei";
            const niktoResults = domainResults.nikto || "Aucun résultat Nikto";

            // Ajouter les résultats avec des séparateurs de domaine
            document.getElementById('nmapResult').innerHTML +=
                `<div class="domain-separator">${domain}</div>${nmapResults}<hr>`;
            document.getElementById('nucleiResult').innerHTML +=
                `<div class="domain-separator">${domain}</div>${nucleiResults}<hr>`;
            document.getElementById('niktoResult').innerHTML +=
                `<div class="domain-separator">${domain}</div>${niktoResults}<hr>`;

            // Compter les ports ouverts
            const openPortsMatch = nmapResults.match(/(\d+)\/tcp\s+open/g);
            if (openPortsMatch) totalOpenPorts += openPortsMatch.length;

            // Compter les services
            const serviceMatch = nmapResults.match(/(\d+)\/tcp\s+open\s+(\w+)/g);
            if (serviceMatch) totalServices += serviceMatch.length;

            // Compter les vulnérabilités
            if (nucleiResults && nucleiResults !== "Aucune vulnérabilité détectée par Nuclei.") {
                const nucleiVulns = nucleiResults.match(/\[(\w+)\]/g) || [];
                totalVulnerabilities += nucleiVulns.length;
            }
            if (niktoResults) {
                const niktoVulns = niktoResults.match(/\+ /g) || [];
                totalVulnerabilities += niktoVulns.length;
            }
        });
    }

    // Mettre à jour les statistiques
    document.getElementById('openPorts').textContent = totalOpenPorts;
    document.getElementById('serviceCount').textContent = totalServices;
    document.getElementById('vulnCount').textContent = totalVulnerabilities;

    // Créer un résumé des vulnérabilités
    const vulnSummary = document.getElementById('vulnSummary');
    vulnSummary.innerHTML = '<h4>Résumé des vulnérabilités</h4>';

    // Extraire et afficher les vulnérabilités
    const oldVulnCount = vulnerabilities.length;
    extractVulnerabilities(results);
    const newVulnCount = vulnerabilities.length;
    const addedVulnCount = newVulnCount - oldVulnCount;

    if (addedVulnCount === 0) {
        vulnSummary.innerHTML += '<p>Aucune nouvelle vulnérabilité détectée.</p>';
    } else {
        vulnSummary.innerHTML += `<p>${addedVulnCount} vulnérabilité(s) détectée(s) et ajoutée(s) à l'onglet Vulnérabilités.</p>`;

        // Afficher un résumé des vulnérabilités par sévérité
        const severityCounts = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0,
            'info': 0
        };

        // Compter uniquement les nouvelles vulnérabilités
        const newVulnerabilities = vulnerabilities.slice(oldVulnCount);
        newVulnerabilities.forEach(vuln => {
            if (severityCounts[vuln.severity] !== undefined) {
                severityCounts[vuln.severity]++;
            }
        });

        // Créer un graphique de résumé
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'severity-summary';
        summaryDiv.innerHTML = `
            <div class="severity-bar">
                <div class="severity-bar-item critical" style="width: ${severityCounts.critical > 0 ? Math.max(5, severityCounts.critical * 10) : 0}%" title="Critique: ${severityCounts.critical}"></div>
                <div class="severity-bar-item high" style="width: ${severityCounts.high > 0 ? Math.max(5, severityCounts.high * 10) : 0}%" title="Élevée: ${severityCounts.high}"></div>
                <div class="severity-bar-item medium" style="width: ${severityCounts.medium > 0 ? Math.max(5, severityCounts.medium * 10) : 0}%" title="Moyenne: ${severityCounts.medium}"></div>
                <div class="severity-bar-item low" style="width: ${severityCounts.low > 0 ? Math.max(5, severityCounts.low * 10) : 0}%" title="Faible: ${severityCounts.low}"></div>
                <div class="severity-bar-item info" style="width: ${severityCounts.info > 0 ? Math.max(5, severityCounts.info * 10) : 0}%" title="Info: ${severityCounts.info}"></div>
            </div>
            <div class="severity-legend">
                <div class="legend-item"><span class="legend-color critical"></span> Critique: ${severityCounts.critical}</div>
                <div class="legend-item"><span class="legend-color high"></span> Élevée: ${severityCounts.high}</div>
                <div class="legend-item"><span class="legend-color medium"></span> Moyenne: ${severityCounts.medium}</div>
                <div class="legend-item"><span class="legend-color low"></span> Faible: ${severityCounts.low}</div>
                <div class="legend-item"><span class="legend-color info"></span> Info: ${severityCounts.info}</div>
            </div>
        `;
        vulnSummary.appendChild(summaryDiv);

        // Ajouter des styles pour le graphique
        const style = document.createElement('style');
        if (!document.getElementById('summary-styles')) {
            style.id = 'summary-styles';
            style.textContent = `
                .severity-summary {
                    margin-top: 15px;
                }

                .severity-bar {
                    display: flex;
                    height: 20px;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }

                .severity-bar-item {
                    height: 100%;
                }

                .severity-bar-item.critical {
                    background-color: #dc3545;
                }

                .severity-bar-item.high {
                    background-color: #fd7e14;
                }

                .severity-bar-item.medium {
                    background-color: #ffc107;
                }

                .severity-bar-item.low {
                    background-color: #17a2b8;
                }

                .severity-bar-item.info {
                    background-color: #6c757d;
                }

                .severity-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                }

                .legend-color {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    margin-right: 5px;
                    border-radius: 2px;
                }

                .legend-color.critical {
                    background-color: #dc3545;
                }

                .legend-color.high {
                    background-color: #fd7e14;
                }

                .legend-color.medium {
                    background-color: #ffc107;
                }

                .legend-color.low {
                    background-color: #17a2b8;
                }

                .legend-color.info {
                    background-color: #6c757d;
                }

                .domain-separator {
                    font-weight: bold;
                    margin: 10px 0 5px;
                    padding: 5px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                }

                .dark-mode .domain-separator {
                    background-color: #2c3035;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Afficher la modale
    document.getElementById('resultsModal').style.display = 'block';
}

// Scanner directement le domaine principal
async function startDirectScan() {
    const url = document.getElementById("urlInput").value;
    if (!url) {
        alert("Veuillez entrer une URL !");
        return;
    }

    // Afficher la progression du scan
    document.getElementById('scanProgress').classList.remove('hidden');
    const statusElement = document.getElementById("scanStatus");
    statusElement.textContent = "Initialisation du scan...";

    // Réinitialiser la barre de progression
    document.getElementById('progressFill').style.width = '0%';

    try {
        // Démarrer un scan direct
        const response = await fetch(`${API_URL}/scan/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: url })
        });
        const data = await response.json();
        const taskId = data.task_id;

        // Vérifier les résultats régulièrement
        let result = null;
        let progress = 0;

        while (!result) {
            await new Promise(resolve => setTimeout(resolve, refreshInterval * 1000));
            const resultResponse = await fetch(`${API_URL}/results/${taskId}`);
            const resultData = await resultResponse.json();

            if (resultData.status === "completed") {
                result = resultData.result;
                statusElement.textContent = "Scan terminé !";
                document.getElementById('progressFill').style.width = '100%';

                // Ajouter le scan à l'historique
                const scanRecord = {
                    taskId: taskId,
                    target: url,
                    date: new Date(),
                    status: 'completed'
                };
                scanHistory.unshift(scanRecord);
                updateStats();

                // Afficher les résultats
                displayResultsInModal(result);

            } else if (resultData.status === "running" && resultData.progress) {
                // Mettre à jour la progression
                statusElement.textContent = resultData.progress;

                // Mettre à jour la barre de progression
                if (resultData.progress.includes("(1/3)")) {
                    progress = 33;
                } else if (resultData.progress.includes("(2/3)")) {
                    progress = 66;
                } else if (resultData.progress.includes("(3/3)")) {
                    progress = 90;
                }
                document.getElementById('progressFill').style.width = `${progress}%`;

            } else if (resultData.status === "error") {
                throw new Error(resultData.error);
            }
        }
    } catch (error) {
        statusElement.textContent = "Erreur lors du scan.";
        console.error("Erreur:", error);
    }
}

// Lancer le scan des sous-domaines
async function startSubdomainScan() {
    const url = document.getElementById("urlInput").value;
    if (!url) {
        alert("Veuillez entrer une URL !");
        return;
    }

    // Afficher la progression du scan
    document.getElementById('scanProgress').classList.remove('hidden');
    const statusElement = document.getElementById("scanStatus");
    statusElement.textContent = "Recherche des sous-domaines en cours...";

    // Réinitialiser la barre de progression
    document.getElementById('progressFill').style.width = '0%';

    try {
        // Démarrer un scan de sous-domaines
        const response = await fetch(`${API_URL}/scan/subdomains/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: url })
        });
        const data = await response.json();
        const taskId = data.task_id;

        // Vérifier les résultats régulièrement
        let result = null;

        while (!result) {
            await new Promise(resolve => setTimeout(resolve, refreshInterval * 1000));
            const resultResponse = await fetch(`${API_URL}/results/${taskId}`);
            const resultData = await resultResponse.json();

            if (resultData.status === "completed") {
                result = resultData.result;

                // Mettre à jour la barre de progression
                document.getElementById('progressFill').style.width = '100%';

                // Ajouter le scan à l'historique
                const scanRecord = {
                    taskId: taskId,
                    target: url,
                    date: new Date(),
                    status: 'completed',
                    type: 'subdomain'
                };
                scanHistory.unshift(scanRecord);
                updateStats();

                // Afficher les sous-domaines
                displaySubdomains(result.subdomains);

                // Cacher la progression et afficher la sélection des sous-domaines
                document.getElementById('scanProgress').classList.add('hidden');
                document.getElementById('subdomainSelection').classList.remove('hidden');

                // Mettre à jour le statut
                statusElement.textContent = `${result.subdomains.length} sous-domaines trouvés !`;

            } else if (resultData.status === "running" && resultData.progress) {
                // Mettre à jour la progression
                statusElement.textContent = resultData.progress;
                document.getElementById('progressFill').style.width = '50%';

            } else if (resultData.status === "error") {
                throw new Error(resultData.error);
            }
        }
    } catch (error) {
        statusElement.textContent = "Erreur lors de la recherche des sous-domaines.";
        console.error("Erreur:", error);
    }
}

// Annuler la sélection des sous-domaines
function cancelSubdomainSelection() {
    document.getElementById('subdomainSelection').classList.add('hidden');
    selectedSubdomains = [];
}

// Afficher les sous-domaines trouvés
function displaySubdomains(subdomains) {
    const subdomainListElement = document.getElementById("subdomainList");
    subdomainListElement.innerHTML = "";

    if (subdomains.length === 0) {
        subdomainListElement.innerHTML = "<p class='empty-state'>Aucun sous-domaine trouvé.</p>";
        return;
    }

    subdomains.forEach(subdomain => {
        const item = document.createElement("div");
        item.className = "subdomain-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `subdomain-${subdomain.replace(/\./g, '-')}`;
        checkbox.value = subdomain;
        checkbox.addEventListener("change", handleSubdomainSelection);

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = subdomain;

        item.appendChild(checkbox);
        item.appendChild(label);
        subdomainListElement.appendChild(item);
    });
}

// Gérer la sélection des sous-domaines
function handleSubdomainSelection(event) {
    const subdomain = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
        // Ajouter à la sélection si moins de 3 sous-domaines sont déjà sélectionnés
        if (selectedSubdomains.length < MAX_SUBDOMAINS) {
            selectedSubdomains.push(subdomain);
            event.target.parentElement.classList.add("selected");
        } else {
            alert(`Vous ne pouvez sélectionner que ${MAX_SUBDOMAINS} sous-domaines maximum.`);
            event.target.checked = false;
            return;
        }
    } else {
        // Retirer de la sélection
        const index = selectedSubdomains.indexOf(subdomain);
        if (index !== -1) {
            selectedSubdomains.splice(index, 1);
            event.target.parentElement.classList.remove("selected");
        }
    }

    // Mettre à jour le compteur et l'état du bouton
    updateSelectionCount();
}

// Mettre à jour le compteur de sous-domaines sélectionnés
function updateSelectionCount() {
    const countElement = document.getElementById("selectionCount");
    countElement.textContent = `${selectedSubdomains.length} sous-domaine(s) sélectionné(s)`;

    // Activer/désactiver le bouton de scan en fonction du nombre de sous-domaines sélectionnés
    const scanButton = document.getElementById("scanSelectedButton");
    scanButton.disabled = selectedSubdomains.length === 0;
}

// Lancer le scan complet sur les sous-domaines sélectionnés
async function startFullScan() {
    if (selectedSubdomains.length === 0) {
        alert("Veuillez sélectionner au moins un sous-domaine.");
        return;
    }

    // Cacher la sélection des sous-domaines et afficher la progression
    document.getElementById('subdomainSelection').classList.add('hidden');
    document.getElementById('scanProgress').classList.remove('hidden');

    const statusElement = document.getElementById("scanStatus");
    statusElement.textContent = "Initialisation du scan des sous-domaines...";

    // Réinitialiser la barre de progression
    document.getElementById('progressFill').style.width = '0%';

    try {
        // Démarrer un scan complet
        const response = await fetch(`${API_URL}/scan/full/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subdomains: selectedSubdomains })
        });
        const data = await response.json();
        const taskId = data.task_id;

        // Vérifier les résultats régulièrement
        let result = null;
        let progress = 0;

        while (!result) {
            await new Promise(resolve => setTimeout(resolve, refreshInterval * 1000));
            const resultResponse = await fetch(`${API_URL}/results/${taskId}`);
            const resultData = await resultResponse.json();

            if (resultData.status === "completed") {
                result = resultData.result;
                statusElement.textContent = "Scan terminé !";
                document.getElementById('progressFill').style.width = '100%';

                // Ajouter le scan à l'historique
                const scanRecord = {
                    taskId: taskId,
                    target: selectedSubdomains.join(', '),
                    date: new Date(),
                    status: 'completed',
                    type: 'full'
                };
                scanHistory.unshift(scanRecord);
                updateStats();

                // Extraire et stocker les vulnérabilités
                extractVulnerabilities(result, selectedSubdomains);

                // Afficher les résultats
                displayResultsInModal(result);

            } else if (resultData.status === "running" && resultData.progress) {
                // Mettre à jour la progression
                statusElement.textContent = resultData.progress;

                // Calculer la progression approximative
                if (resultData.progress.includes("1/")) {
                    progress = 10 + (selectedSubdomains.indexOf(resultData.progress.split(':')[0].trim()) * 30);
                } else if (resultData.progress.includes("2/")) {
                    progress = 20 + (selectedSubdomains.indexOf(resultData.progress.split(':')[0].trim()) * 30);
                } else if (resultData.progress.includes("3/")) {
                    progress = 30 + (selectedSubdomains.indexOf(resultData.progress.split(':')[0].trim()) * 30);
                }
                document.getElementById('progressFill').style.width = `${progress}%`;

            } else if (resultData.status === "error") {
                throw new Error(resultData.error);
            }
        }
    } catch (error) {
        statusElement.textContent = "Erreur lors du scan.";
        console.error("Erreur:", error);
    }
}

// Extraire et stocker les vulnérabilités
function extractVulnerabilities(results) {
    console.log("Résultats reçus:", results);

    // Traiter les résultats selon leur format
    if (typeof results === 'object' && results !== null) {
        // Format pour les scans de sous-domaines multiples
        if (Object.keys(results).some(key => typeof results[key] === 'object' && results[key] !== null)) {
            // Pour chaque cible (sous-domaine)
            Object.keys(results).forEach(target => {
                processTargetResults(target, results[target]);
            });
        } else {
            // Format pour un scan direct (un seul domaine)
            processTargetResults("domaine principal", results);
        }
    }

    // Mettre à jour l'affichage des vulnérabilités
    updateVulnerabilitiesList();

    // Retourner le nombre de vulnérabilités trouvées pour les statistiques
    return vulnerabilities.length;
}

// Traiter les résultats d'une cible spécifique
function processTargetResults(target, results) {
    if (!results) {
        console.warn(`Aucun résultat pour la cible ${target}`);
        return;
    }

    console.log(`Traitement des résultats pour ${target}:`, results);

    const nucleiResults = results.nuclei || "";
    const niktoResults = results.nikto || "";
    const nmapResults = results.nmap || "";

    console.log(`Détail des résultats pour ${target}:`, {
        nuclei: nucleiResults,
        nucleiType: typeof nucleiResults,
        nucleiLength: nucleiResults.length,
        nikto: niktoResults
    });

    // Extraire les vulnérabilités de Nuclei
    if (nucleiResults && nucleiResults !== "Aucune vulnérabilité détectée par Nuclei.") {
        console.log(`Traitement des résultats Nuclei pour ${target}:`, nucleiResults);

        // Diviser les résultats en lignes
        const nucleiLines = nucleiResults.split('\n');
        console.log(`Nombre de lignes Nuclei: ${nucleiLines.length}`);

        nucleiLines.forEach((line, index) => {
            if (!line.trim()) {
                console.log(`Ligne ${index} vide, ignorée`);
                return;
            }

            console.log(`Traitement de la ligne ${index}: ${line}`);

            let severity = "info";

            // Essayer d'extraire la sévérité
            if (line.includes("[critical]")) {
                severity = "critical";
            } else if (line.includes("[high]")) {
                severity = "high";
            } else if (line.includes("[medium]")) {
                severity = "medium";
            } else if (line.includes("[low]")) {
                severity = "low";
            } else if (line.includes("[info]")) {
                severity = "info";
            }

            console.log(`Sévérité détectée: ${severity}`);

            vulnerabilities.push({
                target: target,
                source: 'nuclei',
                description: line.trim(),
                severity: severity,
                date: new Date()
            });
        });
    } else {
        console.warn(`Pas de résultats Nuclei valides pour ${target}`);
    }

    // Extraire les vulnérabilités de Nikto
    if (niktoResults) {
        const niktoVulns = niktoResults.match(/\+ (.*)/g) || [];
        niktoVulns.forEach(vuln => {
            // Déterminer la sévérité en fonction du contenu
            let severity = 'medium'; // Par défaut

            const vulnText = vuln.toLowerCase();
            if (vulnText.includes('critical') || vulnText.includes('dangerous') ||
                vulnText.includes('remote code execution') || vulnText.includes('sql injection')) {
                severity = 'critical';
            } else if (vulnText.includes('high') || vulnText.includes('xss') ||
                       vulnText.includes('cross site') || vulnText.includes('csrf')) {
                severity = 'high';
            } else if (vulnText.includes('low') || vulnText.includes('information disclosure') ||
                       vulnText.includes('missing header')) {
                severity = 'low';
            }

            vulnerabilities.push({
                target: target,
                source: 'nikto',
                description: vuln.trim(),
                severity: severity,
                date: new Date()
            });
        });
    }

    // Extraire les informations de ports ouverts de Nmap comme vulnérabilités de faible gravité
    if (nmapResults) {
        const openPorts = nmapResults.match(/(\d+)\/tcp\s+open\s+(\w+)/g) || [];
        openPorts.forEach(port => {
            vulnerabilities.push({
                target: target,
                source: 'nmap',
                description: `Port ouvert: ${port.trim()}`,
                severity: 'info',
                date: new Date()
            });
        });
    }
}

// Mettre à jour la liste des vulnérabilités
function updateVulnerabilitiesList() {
    const vulnList = document.getElementById('vulnList');

    if (vulnerabilities.length === 0) {
        vulnList.innerHTML = '<p class="empty-state">Aucune vulnérabilité détectée</p>';
        return;
    }

    vulnList.innerHTML = '';

    // Ajouter des styles pour les vulnérabilités
    const style = document.createElement('style');
    if (!document.getElementById('vuln-styles')) {
        style.id = 'vuln-styles';
        style.textContent = `
            .vuln-item {
                background-color: white;
                border-radius: var(--border-radius);
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 4px solid #ccc;
            }

            .dark-mode .vuln-item {
                background-color: var(--card-bg);
            }

            .vuln-item.severity-critical {
                border-left-color: #dc3545;
            }

            .vuln-item.severity-high {
                border-left-color: #fd7e14;
            }

            .vuln-item.severity-medium {
                border-left-color: #ffc107;
            }

            .vuln-item.severity-low {
                border-left-color: #17a2b8;
            }

            .vuln-item.severity-info {
                border-left-color: #6c757d;
            }

            .vuln-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }

            .vuln-severity {
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }

            .severity-critical {
                background-color: #f8d7da;
                color: #721c24;
            }

            .dark-mode .severity-critical {
                background-color: #5c2329;
                color: #f5c6cb;
            }

            .severity-high {
                background-color: #fff3cd;
                color: #856404;
            }

            .dark-mode .severity-high {
                background-color: #533f04;
                color: #ffe69c;
            }

            .severity-medium {
                background-color: #fff3cd;
                color: #856404;
            }

            .dark-mode .severity-medium {
                background-color: #533f04;
                color: #ffe69c;
            }

            .severity-low {
                background-color: #d1ecf1;
                color: #0c5460;
            }

            .dark-mode .severity-low {
                background-color: #0c3d44;
                color: #bee5eb;
            }

            .severity-info {
                background-color: #e2e3e5;
                color: #383d41;
            }

            .dark-mode .severity-info {
                background-color: #2c2e31;
                color: #d6d8db;
            }

            .vuln-target {
                font-weight: 500;
            }

            .vuln-date {
                font-size: 12px;
                color: var(--secondary-color);
            }

            .vuln-description {
                margin: 10px 0;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 4px;
                font-family: monospace;
                white-space: pre-wrap;
                word-break: break-word;
                font-size: 14px;
                line-height: 1.5;
            }

            .dark-mode .vuln-description {
                background-color: #2c3035;
            }

            .vuln-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                font-size: 12px;
            }

            .vuln-source {
                padding: 2px 8px;
                border-radius: 12px;
                background-color: #e9ecef;
                color: #495057;
            }

            .dark-mode .vuln-source {
                background-color: #343a40;
                color: #adb5bd;
            }
        `;
        document.head.appendChild(style);
    }

    // Trier les vulnérabilités par sévérité (critique en premier)
    const severityOrder = {
        'critical': 0,
        'high': 1,
        'medium': 2,
        'low': 3,
        'info': 4
    };

    const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    sortedVulnerabilities.forEach(vuln => {
        const vulnItem = document.createElement('div');
        vulnItem.className = `vuln-item severity-${vuln.severity.toLowerCase()}`;
        vulnItem.innerHTML = `
            <div class="vuln-header">
                <span class="vuln-severity severity-${vuln.severity.toLowerCase()}">${vuln.severity.toUpperCase()}</span>
                <span class="vuln-target">${vuln.target}</span>
                <span class="vuln-date">${new Date(vuln.date).toLocaleString()}</span>
            </div>
            <div class="vuln-description">${vuln.description}</div>
            <div class="vuln-footer">
                <span class="vuln-source">Source: ${vuln.source}</span>
            </div>
        `;

        vulnList.appendChild(vulnItem);
    });
}
