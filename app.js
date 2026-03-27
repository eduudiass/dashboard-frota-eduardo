// ===================== APP.JS FINAL FUNCIONAL =====================

// Dados globais
let dadosGlobais = null;
let charts = {};

// ===================== CARREGAR JSON (COM CACHE FIX) =====================
async function carregarDados() {
    mostrarLoading(true);
    try {
        const response = await fetch('dados.json?nocache=' + new Date().getTime());
        dadosGlobais = await response.json();
        inicializarDashboard();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    } finally {
        mostrarLoading(false);
    }
}

// ===================== INICIALIZAR =====================
function inicializarDashboard() {
    atualizarResumo();
    criarGraficos();
    configurarEventos();
}

// ===================== RESUMO =====================
function atualizarResumo() {
    const { resumo } = dadosGlobais;

    document.getElementById('totalVeiculos').textContent = resumo.total_veiculos || 0;
    document.getElementById('veiculosAtivos').textContent = resumo.veiculos_ativos || 0;

    document.getElementById('kpiReceita').textContent = formatarMoeda(resumo.receita_mensal || 0);
    document.getElementById('kpiManutencao').textContent = formatarMoeda(resumo.total_manutencao || 0);
    document.getElementById('kpiGastos').textContent = formatarMoeda(resumo.gastos_fixos_mensal || 0);

    const lucro = resumo.lucro_mensal || 0;

    const lucroEl = document.getElementById('kpiLucro');
    const lucroIcon = document.getElementById('lucroIcon');
    const lucroChange = document.getElementById('lucroChange');

    lucroEl.textContent = formatarMoeda(lucro);

    if (lucro > 0) {
        lucroIcon.className = 'kpi-icon success';
        lucroIcon.textContent = '📈';
        lucroChange.className = 'kpi-change positive';
        lucroChange.textContent = 'Positivo';
    } else {
        lucroIcon.className = 'kpi-icon danger';
        lucroIcon.textContent = '📉';
        lucroChange.className = 'kpi-change negative';
        lucroChange.textContent = 'Negativo';
    }

    const totalCombustivel = (dadosGlobais.gastos || []).reduce((s, g) => s + (g.combustivel_mensal || 0), 0);
    const totalServicos = (dadosGlobais.manutencao || []).reduce((s, m) => s + (m.num_servicos || 0), 0);
    const totalKM = (dadosGlobais.veiculos || []).reduce((s, v) => s + (v.km_atual || 0), 0);

    document.getElementById('statCombustivel').textContent = formatarMoeda(totalCombustivel);
    document.getElementById('statServicos').textContent = totalServicos;
    document.getElementById('statKM').textContent = totalKM.toLocaleString('pt-BR') + ' km';
    document.getElementById('statInvestimento').textContent = formatarMoeda(resumo.total_investido || 0);
}

// ===================== GRÁFICOS =====================
function criarGraficos() {
    criarGraficoReceitas();
}

function criarGraficoReceitas() {
    const ctx = document.getElementById('chartReceitas');

    if (!ctx) return;

    if (charts.receitas) charts.receitas.destroy();

    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: (dadosGlobais.veiculos || []).map(v => v.placa),
            datasets: [{
                label: 'Receita',
                data: (dadosGlobais.veiculos || []).map(v => v.aluguel_mensal || 0)
            }]
        }
    });
}

// ===================== EVENTOS =====================
function configurarEventos() {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navegarPara(page);
        });
    });

    document.getElementById('fileInput')?.addEventListener('change', processarArquivo);
}

// ===================== NAVEGAÇÃO =====================
function navegarPara(page) {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) item.classList.add('active');
    });

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');
}

// ===================== EXCEL FUNCIONANDO =====================
async function processarArquivo(e) {

    const file = e.target.files[0];

    if (!file || !file.name.endsWith('.xlsx')) {
        alert('Selecione um Excel válido');
        return;
    }

    mostrarLoading(true);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        dadosGlobais = extrairDadosPlanilha(workbook);

        inicializarDashboard();

        alert('✅ Planilha carregada');
    } catch (error) {
        console.error(error);
        alert('Erro ao ler Excel');
    } finally {
        mostrarLoading(false);
    }
}

// ===================== EXTRAÇÃO REAL =====================
function extrairDadosPlanilha(workbook) {

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    return {
        resumo: {
            total_veiculos: json.length,
            veiculos_ativos: json.length,
            receita_mensal: json.reduce((s, v) => s + (v.aluguel_mensal || 0), 0),
            total_manutencao: 0,
            gastos_fixos_mensal: 0,
            lucro_mensal: 0
        },
        veiculos: json,
        manutencao: [],
        gastos: []
    };
}

// ===================== UTIL =====================
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    overlay.classList.toggle('hidden', !mostrar);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
});
