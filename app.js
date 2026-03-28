/* ═══════════════════════════════════════════
   FleetManager — Core App Logic
   ═══════════════════════════════════════════ */

let D = null;
let charts = {};

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    configurarNavegacao();
    configurarMobile();
});

async function carregarDados() {
    mostrarLoading(true);
    try {
        const r = await fetch('dados.json');
        D = await r.json();
        renderPage('dashboard');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        mostrarLoading(false);
    }
}

// ─── Navigation ───
function configurarNavegacao() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const page = item.dataset.page;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const el = document.getElementById('page-' + page);
            if (el) el.classList.add('active');
            renderPage(page);
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

function renderPage(page) {
    if (!D) return;
    switch(page) {
        case 'dashboard': Pages.dashboard(); break;
        case 'veiculos': Pages.veiculos(); break;
        case 'manutencoes': Pages.manutencoes(); break;
        case 'receitas': Pages.receitas(); break;
        case 'gastos': Pages.gastos(); break;
        case 'compras': Pages.compras(); break;
        case 'vendas': Pages.vendas(); break;
    }
}

// ─── Mobile ───
function configurarMobile() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.querySelector('.main-content')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// ─── Helpers ───
function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
}
function fmtK(v) {
    if (Math.abs(v) >= 1000) return 'R$ ' + (v/1000).toFixed(1).replace('.', ',') + 'k';
    return fmt(v);
}
function fmtNum(v) {
    return (v || 0).toLocaleString('pt-BR');
}

function mostrarLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (show) el.classList.remove('hidden'); else el.classList.add('hidden');
}

// ─── Chart Helpers ───
const chartColors = {
    accent: { bg: 'rgba(34,211,238,0.15)', border: '#22d3ee' },
    green: { bg: 'rgba(16,185,129,0.15)', border: '#10b981' },
    red: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444' },
    yellow: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
    purple: { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6' },
};
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderColor: 'rgba(30,42,62,1)',
            borderWidth: 1,
            titleColor: '#e8ecf4',
            bodyColor: '#7a8ba8',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: "'DM Sans'", weight: '600' },
            bodyFont: { family: "'JetBrains Mono'", size: 12 },
        }
    }
};
const gridOpts = {
    y: { beginAtZero:true, grid:{ color:'rgba(255,255,255,0.04)', drawBorder:false },
        ticks:{ color:'#4a5a74', font:{ family:"'JetBrains Mono'", size:11 }, callback: v => fmtK(v) } },
    x: { grid:{ display:false }, ticks:{ color:'#4a5a74', font:{ family:"'DM Sans'", size:11 } } }
};

function destroyChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

function createBar(canvasId, key, labels, data, color = 'accent') {
    destroyChart(key);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    charts[key] = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: chartColors[color].bg, borderColor: chartColors[color].border, borderWidth: 2, borderRadius: 6 }] },
        options: { ...chartDefaults, scales: gridOpts }
    });
}

function createDoughnut(canvasId, key, labels, data, colors) {
    destroyChart(key);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    charts[key] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: { ...chartDefaults, cutout: '65%',
            plugins: { ...chartDefaults.plugins, legend: { display:true, position:'bottom',
                labels:{ color:'#7a8ba8', font:{ family:"'DM Sans'", size:12 }, padding:16, usePointStyle:true, pointStyleWidth:8 } } } }
    });
}
