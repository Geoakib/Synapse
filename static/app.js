/* Synapse SOTA - Application Logic */

let cy;
let isInitialLoad = true;
let focusNode = null;
let currentAnalysisMode = 'simple';

// Analysis mode configurations
const ANALYSIS_MODES = {
    simple: {
        name: 'Simple (Basic Health)',
        legend: [
            { label: 'ACTIVE', class: 'dot-active', desc: 'Healthy file' },
            { label: 'RISK', class: 'dot-warning', desc: 'Needs attention' },
            { label: 'CRITICAL', class: 'dot-down', desc: 'High priority issue' }
        ]
    },
    gatekeeper: {
        name: 'Gatekeeper (Pre-Checks)',
        legend: [
            { label: 'ACTIVE', class: 'dot-active', desc: 'Valid & parseable' },
            { label: 'VOID', class: 'dot-warning', desc: 'Empty file (0 LOC)' },
            { label: 'ERROR', class: 'dot-down', desc: 'Syntax errors' },
            { label: 'EXTERNAL', class: 'dot-external', desc: 'Library/vendor code' }
        ]
    },
    structural: {
        name: 'Structural (Graph Theory)',
        legend: [
            { label: 'BALANCED', class: 'dot-active', desc: 'Good connections' },
            { label: 'ORPHAN', class: 'dot-warning', desc: 'No connections (dead?)' },
            { label: 'GOD OBJECT', class: 'dot-down', desc: 'Too many connections' }
        ]
    },
    complexity: {
        name: 'Complexity (Code Quality)',
        legend: [
            { label: 'CLEAN', class: 'dot-active', desc: 'Low complexity' },
            { label: 'SPAGHETTI', class: 'dot-warning', desc: 'High complexity' },
            { label: 'GIANT', class: 'dot-down', desc: 'Too large (>1000 LOC)' }
        ]
    },
    hotspot: {
        name: 'Hotspot (Complexity × Churn)',
        legend: [
            { label: 'STABLE', class: 'dot-active', desc: 'Low churn' },
            { label: 'HOTSPOT', class: 'dot-warning', desc: 'Frequent changes' },
            { label: 'CRITICAL', class: 'dot-down', desc: 'Complex + High churn' }
        ]
    },
    instability: {
        name: 'Instability (Martin\'s I)',
        legend: [
            { label: 'STABLE', class: 'dot-active', desc: 'I < 0.3 (Hard to change)' },
            { label: 'UNSTABLE', class: 'dot-warning', desc: 'I > 0.7 (Easy to change)' },
            { label: 'RISK', class: 'dot-down', desc: 'Stable + Complex' }
        ]
    },
    comprehensive: {
        name: 'Comprehensive (Weighted)',
        legend: [
            { label: 'HEALTHY', class: 'dot-active', desc: 'Score 0-40' },
            { label: 'RISK', class: 'dot-warning', desc: 'Score 41-70' },
            { label: 'CRITICAL', class: 'dot-down', desc: 'Score 71+' }
        ]
    }
};

async function initGraph() {
    const response = await fetch('/graph-data');
    const elements = await response.json();

    document.getElementById('loader').style.display = 'none';

    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        wheelSensitivity: 0.2,
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#1c2128',
                    'border-width': 2,
                    'border-color': '#444c56',
                    'color': '#f0f6fc',
                    'font-family': 'Inter',
                    'font-size': '13px',
                    'font-weight': '500',
                    'text-valign': 'bottom',
                    'text-halign': 'center',
                    'text-margin-y': '8px',
                    'width': '40px',
                    'height': '40px',
                    'transition-property': 'background-color, border-color, border-width, opacity, width, height, font-size',
                    'transition-duration': '0.3s',
                    'overlay-opacity': 0,
                    'text-wrap': 'wrap',
                    'text-max-width': '120px',
                    'background-image': 'data(icon)',
                    'background-fit': 'contain',
                    'background-clip': 'none',
                    'background-width': '24px',
                    'background-height': '24px'
                }
            },
            {
                selector: 'node[type="py"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg)' }
            },
            {
                selector: 'node[type="js"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg)' }
            },
            {
                selector: 'node[type="jsx"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg)' }
            },
            {
                selector: 'node[type="ts"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg)' }
            },
            {
                selector: 'node[type="tsx"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg)' }
            },
            {
                selector: 'node[type="html"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg)' }
            },
            {
                selector: 'node[type="css"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg)' }
            },
            {
                selector: 'node[type="scss"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg)' }
            },
            {
                selector: 'node[type="json"]',
                style: { 'background-image': 'url(data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23888" d="M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19Z"/%3E%3C/svg%3E)' }
            },
            {
                selector: 'node[type="md"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg)' }
            },
            {
                selector: 'node[type="java"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg)' }
            },
            {
                selector: 'node[type="cpp"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg)' }
            },
            {
                selector: 'node[type="c"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg)' }
            },
            {
                selector: 'node[type="go"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg)' }
            },
            {
                selector: 'node[type="rs"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg)' }
            },
            {
                selector: 'node[type="php"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg)' }
            },
            {
                selector: 'node[type="rb"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg)' }
            },
            {
                selector: 'node[type="vue"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg)' }
            },
            {
                selector: 'node[type="svelte"]',
                style: { 'background-image': 'url(https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg)' }
            },
            {
                selector: 'node[health="active"]',
                style: { 'border-color': '#39FF14', 'border-width': 3, 'background-color': '#0a1a0a' }
            },
            {
                selector: 'node[health="warning"]',
                style: { 'border-color': '#FFFA5F', 'border-width': 3, 'background-color': '#1a1a0a' }
            },
            {
                selector: 'node[health="down"]',
                style: { 'border-color': '#FF3131', 'border-width': 4, 'background-color': '#1a0a0a' }
            },
            {
                selector: 'node[health="external"]',
                style: { 'border-color': '#8b5cf6', 'border-width': 3, 'background-color': '#1a0a1a' }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#484f58',
                    'target-arrow-color': '#484f58',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'opacity': 0.6,
                    'arrow-scale': 1.2
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'opacity': 1,
                    'line-color': '#58a6ff',
                    'target-arrow-color': '#58a6ff',
                    'width': 3,
                    'z-index': 100
                }
            },
            {
                selector: '.dimmed',
                style: {
                    'opacity': 0.1,
                    'text-opacity': 0
                }
            },
            {
                selector: '.cycle-node',
                style: {
                    'border-color': '#FF00FF',  // Magenta for cycle nodes
                    'border-width': 5,
                    'color': '#FF00FF',
                    'font-weight': '700',
                    'z-index': 200
                }
            },
            {
                selector: '.hidden',
                style: {
                    'display': 'none'
                }
            }
        ],
        layout: getLayoutOptions()
    });

    setupInteractions();

    cy.on('layoutstop', () => {
        if (isInitialLoad) {
            pushOrphansToEdges();
            isInitialLoad = false;
        }
    });

    setInterval(pollHealth, 3000);
}

function setupInteractions() {
    // Focus Mode / Isolation Logic
    cy.on('tap', 'node', function (evt) {
        const node = evt.target;
        focusNode = node;

        // Dim everything
        cy.elements().addClass('dimmed');

        // Highlight node and neighbors
        node.removeClass('dimmed');
        node.neighborhood().removeClass('dimmed');
        node.connectedEdges().addClass('highlighted');

        showNodeDetail(node);
    });

    cy.on('tap', function (evt) {
        if (evt.target === cy) {
            cy.elements().removeClass('dimmed');
            cy.elements().removeClass('highlighted');
            hideNodeDetail();
            focusNode = null;
        }
    });

    // Hover effect - enhanced with label color change and edge highlighting
    cy.on('mouseover', 'node', (e) => {
        if (!focusNode) {
            const node = e.target;
            node.style({
                'width': '48px',
                'height': '48px',
                'font-size': '16px',
                'color': '#58a6ff',  // Bright accent blue for readability
                'font-weight': '700',
                'z-index': 9999,
                'text-background-opacity': 0.9,
                'text-background-color': '#0d1117',
                'text-background-padding': '4px',
                'text-background-shape': 'roundrectangle',
                'text-border-opacity': 1,
                'text-border-width': 1,
                'text-border-color': '#58a6ff'
            });
            // Highlight connected edges on hover
            node.connectedEdges().style({
                'line-color': '#58a6ff',
                'target-arrow-color': '#58a6ff',
                'opacity': 1,
                'width': 3,
                'z-index': 9998
            });
        }
        document.body.style.cursor = 'pointer';
    });
    cy.on('mouseout', 'node', (e) => {
        if (!focusNode) {
            const node = e.target;
            node.style({
                'width': '40px',
                'height': '40px',
                'font-size': '13px',
                'color': '#f0f6fc',  // Reset to normal
                'font-weight': '500',
                'z-index': 1,
                'text-background-opacity': 0,
                'text-border-opacity': 0
            });
            // Reset edge styles
            node.connectedEdges().style({
                'line-color': '#484f58',
                'target-arrow-color': '#484f58',
                'opacity': 0.6,
                'width': 2,
                'z-index': 1
            });
        }
        document.body.style.cursor = 'default';
    });
}

function showNodeDetail(node) {
    const panel = document.getElementById('detail-panel');
    document.getElementById('detail-name').innerText = node.data('label').split('\\').pop();
    document.getElementById('detail-status').innerText = node.data('health').toUpperCase();
    document.getElementById('detail-deps').innerText = node.outgoers('edge').length;
    document.getElementById('detail-rev-deps').innerText = node.incomers('edge').length;

    panel.style.display = 'block';
    setTimeout(() => panel.style.opacity = '1', 10);
}

function hideNodeDetail() {
    const panel = document.getElementById('detail-panel');
    panel.style.opacity = '0';
    setTimeout(() => panel.style.display = 'none', 300);
}

function searchNodes(query) {
    if (!query) {
        cy.elements().removeClass('dimmed');
        return;
    }
    cy.elements().addClass('dimmed');
    const matches = cy.nodes().filter(n => n.data('label').toLowerCase().includes(query.toLowerCase()));
    matches.removeClass('dimmed');
    if (matches.length === 1) {
        cy.animate({ center: { eles: matches }, zoom: 1.5 }, { duration: 500 });
    }
}

function getLayoutOptions(layoutName = 'fcose') {
    const layouts = {
        fcose: {
            name: 'fcose',
            quality: 'proof',
            randomize: true,
            animate: true,
            animationDuration: 800,
            fit: true,
            padding: 50,
            nodeRepulsion: 6500,
            idealEdgeLength: 120,
            gravity: 0.25,
            numIter: 2500
        },
        'force-atlas': {
            name: 'fcose',
            quality: 'default',
            randomize: false,
            animate: true,
            animationDuration: 1000,
            fit: true,
            padding: 50,
            nodeRepulsion: node => 8000,
            idealEdgeLength: edge => 100,
            edgeElasticity: edge => 0.45,
            gravity: 0.1,
            gravityRange: 3.8,
            numIter: 3000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        },
        circle: {
            name: 'circle',
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50
        },
        grid: {
            name: 'grid',
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50,
            rows: undefined,
            cols: undefined
        },
        breadthfirst: {
            name: 'breadthfirst',
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50,
            directed: true,
            spacingFactor: 1.5
        },
        concentric: {
            name: 'concentric',
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50,
            concentric: node => node.degree(),
            levelWidth: () => 2
        },
        cose: {
            name: 'cose',
            animate: true,
            animationDuration: 800,
            fit: true,
            padding: 50,
            nodeRepulsion: 400000,
            nodeOverlap: 20,
            idealEdgeLength: 100,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        },
        random: {
            name: 'random',
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 50
        }
    };
    return layouts[layoutName] || layouts.fcose;
}

function filterGraph(typeStr) {
    if (typeStr === 'all') {
        cy.nodes().removeClass('hidden');
        cy.edges().removeClass('hidden');
        return;
    }

    cy.nodes().removeClass('hidden');
    cy.edges().removeClass('hidden');
    const allowedTypes = typeStr.split(',').map(t => t.trim());

    cy.nodes().forEach(node => {
        const nodeType = node.data('type');
        if (!allowedTypes.includes(nodeType)) {
            node.addClass('hidden');
            // Also hide edges connected to hidden nodes
            node.connectedEdges().addClass('hidden');
        }
    });
}

function changeLayout(layoutName) {
    if (layoutName === 'grouped') {
        applyGroupedLayout();
    } else {
        const layout = cy.layout(getLayoutOptions(layoutName));
        layout.run();
    }
}

function applyGroupedLayout() {
    // Group nodes by their directory path
    const groups = {};

    cy.nodes().forEach(node => {
        const filePath = node.data('label');
        const pathParts = filePath.split(/[/\\]/);

        // Get directory path (everything except filename)
        let groupKey = 'root';
        if (pathParts.length > 1) {
            groupKey = pathParts.slice(0, -1).join('/');
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(node);
    });

    // Position groups in a grid layout
    const groupKeys = Object.keys(groups);
    const cols = Math.ceil(Math.sqrt(groupKeys.length));
    const groupSpacing = 400;
    const nodeSpacing = 100;

    groupKeys.forEach((groupKey, groupIndex) => {
        const row = Math.floor(groupIndex / cols);
        const col = groupIndex % cols;
        const groupCenterX = col * groupSpacing;
        const groupCenterY = row * groupSpacing;

        const nodesInGroup = groups[groupKey];
        const groupRadius = Math.max(80, Math.sqrt(nodesInGroup.length) * 40);

        // Arrange nodes in this group in a circular pattern
        nodesInGroup.forEach((node, nodeIndex) => {
            const angle = (nodeIndex / nodesInGroup.length) * 2 * Math.PI;
            const x = groupCenterX + groupRadius * Math.cos(angle);
            const y = groupCenterY + groupRadius * Math.sin(angle);

            node.animate({
                position: { x, y }
            }, {
                duration: 800,
                easing: 'ease-out'
            });
        });
    });

    cy.fit(null, 50);
}

function pushOrphansToEdges() {
    const orphans = cy.nodes().filter(n => n.degree() === 0);
    const connectedNodes = cy.nodes().filter(n => n.degree() > 0);
    let center = { x: 0, y: 0 };
    let radius = 1000;

    if (connectedNodes.length > 0) {
        const bb = connectedNodes.boundingBox();
        center = { x: bb.x1 + bb.w / 2, y: bb.y1 + bb.h / 2 };
        radius = Math.max(bb.w, bb.h) * 0.9 + 300;
    }

    orphans.forEach((node, i) => {
        const angle = (i / orphans.length) * Math.PI * 2;
        node.position({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    });
    cy.fit(null, 50);
}

async function pollHealth() {
    try {
        const response = await fetch('/graph-data');
        const data = await response.json();
        data.nodes.forEach(nodeData => {
            const node = cy.getElementById(nodeData.data.id);
            if (node) {
                // Store raw server health
                node.data('serverHealth', nodeData.data.health);
                // Update metrics if they changed
                if (nodeData.data.metrics) {
                    node.data('metrics', nodeData.data.metrics);
                }

                // Re-run current analysis mode
                const newStatus = analyzeNodeStatus(node, currentAnalysisMode);
                node.data('health', newStatus);
            }
        });
        if (focusNode) showNodeDetail(focusNode);
    } catch (e) { console.error("Polling error:", e); }
}

async function rescan() {
    const btn = document.querySelector('.tool-btn.primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Scanning...";
    btn.disabled = true;
    try {
        await fetch('/api/rescan', { method: 'POST' });
        window.location.reload();
    } catch (e) {
        alert("Rescan failed.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function changeDirectory() {
    const newPath = prompt("Enter the absolute path of the directory to analyze:", "");
    if (!newPath) return;

    try {
        const response = await fetch('/api/set_target', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: newPath })
        });
        const result = await response.json();

        if (result.status === 'success') {
            alert(result.message);
            window.location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) {
        console.error("Directory switch failed:", e);
        alert("Failed to switch directory.");
    }
}

function exportToPNG() {
    const png = cy.png({
        output: 'blob',
        bg: '#05070a',
        full: true,
        scale: 2
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(png);
    link.download = 'synapse-graph.png';
    link.click();
    URL.revokeObjectURL(link.href);
}

async function showCycles() {
    try {
        const response = await fetch('/api/cycles');
        const data = await response.json();

        // Clear previous highlights
        cy.elements().removeClass('dimmed');
        cy.elements().removeClass('highlighted');
        cy.elements().removeClass('cycle-node');

        if (data.count === 0) {
            alert('✅ No circular dependencies detected!');
            return;
        }

        // Dim everything first
        cy.elements().addClass('dimmed');

        // Highlight cycle nodes
        data.cycles.forEach(cycle => {
            cycle.forEach(filePath => {
                const node = cy.nodes().filter(n => n.data('label') === filePath);
                if (node.length > 0) {
                    node.removeClass('dimmed');
                    node.addClass('cycle-node');
                    node.connectedEdges().removeClass('dimmed');
                    node.connectedEdges().addClass('highlighted');
                }
            });
        });

        alert(`⚠️ Found ${data.count} circular dependency chain(s)!\nHighlighted in the graph.`);

    } catch (e) {
        console.error('Cycle detection error:', e);
        alert('Failed to check for cycles.');
    }
}

// Analysis Logic Functions
function analyzeNodeStatus(node, mode) {
    const fanIn = node.incomers('edge').length;
    const fanOut = node.outgoers('edge').length;
    const filePath = node.data('label') || '';
    const degree = node.degree();

    const metrics = node.data('metrics') || {};
    const loc = metrics.loc || 0;
    const complexity = metrics.complexity || 0;
    const churn = Math.floor(Math.random() * 100); // Still mock, would need Git integration
    const nestingDepth = metrics.nesting || 0;

    switch (mode) {
        case 'gatekeeper':
            // Pre-check logic
            if (loc === 0) return 'warning'; // VOID
            if (filePath.includes('node_modules') || filePath.includes('venv') ||
                filePath.includes('vendor') || filePath.includes('.git')) {
                return 'external'; // EXTERNAL
            }
            if (complexity < 0) return 'down'; // ERROR (syntax error)
            return 'active'; // ACTIVE

        case 'structural':
            // Graph theory logic
            if (fanIn === 0 && fanOut === 0) return 'warning'; // ORPHAN
            if (fanIn > 20 && fanOut > 20) return 'down'; // GOD OBJECT
            return 'active'; // BALANCED

        case 'complexity':
            // Code quality logic
            if (loc > 1000) return 'down'; // GIANT
            if (complexity > 15 || nestingDepth > 4) return 'warning'; // SPAGHETTI
            return 'active'; // CLEAN

        case 'hotspot':
            // Hotspot = Complexity × Churn
            const hotspotScore = complexity * churn;
            if (hotspotScore > 1000 && complexity > 15) return 'down'; // CRITICAL
            if (churn > 50) return 'warning'; // HOTSPOT
            return 'active'; // STABLE

        case 'instability':
            // Martin's Instability: I = FanOut / (FanIn + FanOut)
            const totalCoupling = fanIn + fanOut;
            const instability = totalCoupling > 0 ? fanOut / totalCoupling : 0;

            if (instability < 0.3 && complexity > 15) return 'down'; // RISK (Stable + Complex)
            if (instability > 0.7) return 'warning'; // UNSTABLE
            return 'active'; // STABLE

        case 'comprehensive':
            // Weighted scoring: Complexity×0.4 + FanIn×0.2 + FanOut×0.2 + Churn×0.2
            const score = (complexity * 0.4) + (fanIn * 0.2) + (fanOut * 0.2) + (churn * 0.2);
            if (score > 70) return 'down'; // CRITICAL
            if (score > 40) return 'warning'; // RISK
            return 'active'; // HEALTHY

        case 'simple':
        default:
            // Use server-side health for simple mode
            return node.data('serverHealth') || node.data('health') || 'active';
    }
}

function changeAnalysisMode(mode) {
    currentAnalysisMode = mode;

    // Update legend
    updateLegend(mode);

    // Recalculate and update all node statuses
    cy.nodes().forEach(node => {
        const newStatus = analyzeNodeStatus(node, mode);
        node.data('health', newStatus);
    });

    // Force visual update
    cy.style().update();
}

function updateLegend(mode) {
    const legendConfig = ANALYSIS_MODES[mode];
    if (!legendConfig) return;

    const legendContainer = document.getElementById('status-legend');
    legendContainer.innerHTML = '';

    legendConfig.legend.forEach(item => {
        const statusItem = document.createElement('div');
        statusItem.className = 'status-item';
        statusItem.title = item.desc;

        const dot = document.createElement('span');
        dot.className = `dot ${item.class}`;

        const label = document.createTextNode(` ${item.label}`);

        statusItem.appendChild(dot);
        statusItem.appendChild(label);
        legendContainer.appendChild(statusItem);
    });
}

// Initialize on load
initGraph();
