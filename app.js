/* ═══════════════════════════════════════════
   FleetManager — Core App Logic
   ═══════════════════════════════════════════ */

let D = null; // dados globais
let charts = {};

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    configurarNavegacao();
    configurarUpload();
    configurarMobile();
});

async function carregarDados() {
    mostrarLoading(true);
    try {
        // 1. Tenta carregar do localStorage (dados atualizados pelo upload)
        const saved = localStorage.getItem('fleet_dados');
        if (saved) {
            D = JSON.parse(saved);
            renderPage('dashboard');
            return;
        }
        // 2. Fallback: carrega o dados.json padrão
        const r = await fetch('dados.json');
        D = await r.json();
        renderPage('dashboard');
    } catch (e) {
        console.error('Erro:', e);
        toast('Erro ao carregar dados', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function salvarDados() {
    try {
        localStorage.setItem('fleet_dados', JSON.stringify(D));
    } catch (e) {
        console.error('Erro ao salvar:', e);
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
            if (el) { el.classList.add('active'); }
            renderPage(page);
            // close mobile
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
    document.getElementById('btnMobileUpload')?.addEventListener('click', openUploadModal);
    // Close sidebar on outside click
    document.querySelector('.main-content')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// ─── Upload ───
function configurarUpload() {
    document.getElementById('btnUpload')?.addEventListener('click', openUploadModal);
    const fileInput = document.getElementById('fileInput');
    fileInput?.addEventListener('change', e => processarArquivo(e.target.files[0]));

    const zone = document.getElementById('uploadZone');
    if (zone) {
        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
        zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (file) processarArquivo(file);
        });
    }
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('active');
    // Show info if localStorage has data
    const info = document.getElementById('uploadInfo');
    const btnReset = document.getElementById('btnReset');
    if (localStorage.getItem('fleet_dados')) {
        info.textContent = '📦 Usando dados do último upload salvo no navegador.';
        btnReset.classList.remove('hidden');
    } else {
        info.textContent = '';
        btnReset.classList.add('hidden');
    }
}

async function resetarDados() {
    localStorage.removeItem('fleet_dados');
    closeUploadModal();
    mostrarLoading(true);
    try {
        const r = await fetch('dados.json');
        D = await r.json();
        renderPage(getCurrentPage());
        toast('Dados resetados para o original', 'success');
    } catch (e) {
        toast('Erro ao resetar', 'error');
    } finally {
        mostrarLoading(false);
    }
}
function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

async function processarArquivo(file) {
    if (!file || !file.name.endsWith('.xlsx')) {
        toast('Selecione um arquivo .xlsx válido', 'error');
        return;
    }
    mostrarLoading(true);
    closeUploadModal();
    try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        D = extrairDadosPlanilha(wb);
        salvarDados();
        renderPage(getCurrentPage());
        toast('Planilha atualizada com sucesso!', 'success');
    } catch (e) {
        console.error('Erro:', e);
        toast('Erro ao processar arquivo', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function getCurrentPage() {
    const active = document.querySelector('.nav-item.active');
    return active ? active.dataset.page : 'dashboard';
}

// ─── Extract from XLSX ───
function extrairDadosPlanilha(wb) {
    const d = { veiculos:[], manutencao_resumo:[], manutencao_registros:[], receitas:[], gastos:[], compras:[], vendas_resumo:{}, vendas_registros:[], resumo:{} };
    const sj = (sheet, opts) => XLSX.utils.sheet_to_json(sheet, { header:1, ...opts });
    const str = v => (v !== null && v !== undefined && v !== 0) ? String(v) : '';
    const num = v => parseFloat(v) || 0;
    const int = v => parseInt(v) || 0;
    const dateStr = v => {
        if (!v) return '';
        if (typeof v === 'number') {
            const d = XLSX.SSF.parse_date_code(v);
            return `${String(d.d).padStart(2,'0')}/${String(d.m).padStart(2,'0')}/${d.y}`;
        }
        return String(v);
    };

    // Veiculos
    const sv = wb.Sheets['Cadastro de Veículos'];
    if (sv) {
        const rows = sj(sv);
        for (let i = 3; i < rows.length; i++) {
            const r = rows[i];
            if (!r[0] || !r[1] || String(r[0]).toUpperCase().includes('TOTAL')) continue;
            if (r[1] === 0) continue;
            d.veiculos.push({ numero:int(r[0]), placa:str(r[1]), modelo:str(r[2]), ano:int(r[3]), cor:str(r[4]),
                motorista: (r[5] && r[5]!==0) ? String(r[5]) : 'Sem motorista',
                contato: (r[6] && r[6]!==0) ? String(r[6]) : '',
                aluguel_mensal:num(r[7]), data_inicio:dateStr(r[8]), km_atual:num(r[9]), status:str(r[10])||'Ativo' });
        }
    }

    // Manutencao Resumo
    const sm = wb.Sheets['Manutenção'];
    if (sm) {
        const rows = sj(sm);
        for (let i = 3; i < rows.length; i++) {
            const r = rows[i];
            if (String(r[0]).toUpperCase().includes('TOTAL')) break;
            if (!r[0] || !r[1] || r[1]===0) continue;
            d.manutencao_resumo.push({ numero:int(r[0]), placa:str(r[1]), modelo:str(r[2]),
                motorista:(r[3]&&r[3]!==0)?String(r[3]):'Sem motorista', num_servicos:int(r[4]), total_gasto:num(r[5]),
                status:str(r[9])||'Ativo' });
        }
        // Registros (after header row ~26)
        let regStart = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] && String(rows[i][0]).includes('REGISTROS')) { regStart = i + 2; break; }
        }
        if (regStart > 0) {
            for (let i = regStart; i < rows.length; i++) {
                const r = rows[i];
                if (!r[0] || !r[2]) continue;
                if (typeof r[0] !== 'number') continue;
                d.manutencao_registros.push({ numero:int(r[0]), data:dateStr(r[1]), placa:str(r[2]), modelo:str(r[3]),
                    tipo:str(r[4]), descricao:str(r[5]), oficina:str(r[6]), custo:num(r[7]),
                    km_servico:str(r[8]), prox_revisao:str(r[9]) });
            }
        }
    }

    // Receitas
    const sr = wb.Sheets['Receitas Mensais'];
    if (sr) {
        const rows = sj(sr);
        const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
        for (let i = 3; i < rows.length; i++) {
            const r = rows[i];
            if (!r[0] || !r[1] || r[1]===0 || String(r[0]).toUpperCase().includes('TOTAL')) continue;
            const rm = {};
            meses.forEach((m,j) => { rm[m] = num(r[5+j]); });
            const totalRec = num(r[17]);
            const pctRec = num(r[18]);
            d.receitas.push({ numero:int(r[0]), placa:str(r[1]), modelo:str(r[2]),
                motorista:(r[3]&&r[3]!==0)?String(r[3]):'Sem motorista',
                aluguel_previsto:num(r[4]), receitas_mensais:rm, total_recebido:totalRec, pct_recebido:pctRec });
        }
    }

    // Gastos
    const sg = wb.Sheets['Gastos'];
    if (sg) {
        const rows = sj(sg);
        for (let i = 3; i < rows.length; i++) {
            const r = rows[i];
            if (!r[0] || !r[1] || r[1]===0 || String(r[0]).toUpperCase().includes('TOTAL')) continue;
            d.gastos.push({ numero:int(r[0]), placa:str(r[1]), modelo:str(r[2]),
                motorista:(r[3]&&r[3]!==0)?String(r[3]):'Sem motorista',
                seguro_anual:num(r[4]), ipva_anual:num(r[5]), licenciamento:num(r[6]),
                combustivel_mensal:num(r[7]), total_mensal:num(r[8]) });
        }
    }

    // Compras
    const sc = wb.Sheets['🚗 Compra de Carros'];
    if (sc) {
        const rows = sj(sc);
        let cur = null;
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const a = r[0] ? String(r[0]) : '';
            if (a.includes('🚗') && a.includes('—')) {
                if (cur) d.compras.push(cur);
                cur = { titulo:a.trim(), itens:[], total:0 };
                continue;
            }
            if (cur && a.toUpperCase() === 'TOTAL') {
                cur.total = num(r[4]);
                continue;
            }
            if (cur && typeof r[0] === 'number' && r[0] > 0 && (r[2]||r[3]||r[4])) {
                cur.itens.push({ numero:int(r[0]), data:dateStr(r[1]), categoria:str(r[2]),
                    descricao:str(r[3]), valor:num(r[4]), observacao:str(r[5]) });
            }
        }
        if (cur) d.compras.push(cur);
        d.compras = d.compras.filter(c => c.total > 0 || c.itens.length > 0);
    }

    // Vendas
    const sve = wb.Sheets['🚗 Vendas'];
    if (sve) {
        const rows = sj(sve);
        d.vendas_resumo = { carros_vendidos:int(rows[5]?.[0]), total_investido:num(rows[5]?.[2]),
            total_arrecadado:num(rows[5]?.[4]), lucro_total:num(rows[5]?.[6]), lucro_medio:num(rows[5]?.[8]) };
        for (let i = 8; i < rows.length; i++) {
            const r = rows[i];
            if (!r[0]) continue;
            if (r[2]||r[3]||r[6]) {
                d.vendas_registros.push({ numero:int(r[0]), data_venda:dateStr(r[1]), placa:str(r[2]),
                    modelo:str(r[3]), preco_compra:num(r[4]), gastos_mecanica:num(r[5]),
                    valor_venda:num(r[6]), custo_total:num(r[7]), lucro:num(r[8]), margem:num(r[9]) });
            }
        }
    }

    // Resumo calculado
    const resumo = {};
    resumo.receita_mensal = d.veiculos.reduce((s,v) => s + v.aluguel_mensal, 0);
    resumo.total_manutencao = d.manutencao_resumo.reduce((s,m) => s + m.total_gasto, 0);
    resumo.num_servicos = d.manutencao_resumo.reduce((s,m) => s + m.num_servicos, 0);
    resumo.gastos_fixos_mensal = d.gastos.reduce((s,g) => s + g.total_mensal, 0);
    resumo.total_investido_compras = d.compras.reduce((s,c) => s + c.total, 0);
    resumo.total_veiculos = d.veiculos.length;
    resumo.veiculos_ativos = d.veiculos.filter(v => v.status === 'Ativo').length;
    resumo.veiculos_inativos = resumo.total_veiculos - resumo.veiculos_ativos;
    resumo.total_combustivel_mes = d.gastos.reduce((s,g) => s + g.combustivel_mensal, 0);
    resumo.total_km = d.veiculos.reduce((s,v) => s + v.km_atual, 0);
    resumo.media_por_carro = resumo.total_veiculos > 0 ? resumo.receita_mensal / resumo.total_veiculos : 0;
    resumo.lucro_mensal = resumo.receita_mensal - resumo.gastos_fixos_mensal - resumo.total_manutencao;
    d.resumo = resumo;

    return d;
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
function fmtPct(v) {
    return ((v || 0) * 100).toFixed(1).replace('.', ',') + '%';
}

function mostrarLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (show) el.classList.remove('hidden'); else el.classList.add('hidden');
}

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
    el.className = 'toast ' + type;
    setTimeout(() => { el.className = 'toast hidden'; }, 3000);
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
