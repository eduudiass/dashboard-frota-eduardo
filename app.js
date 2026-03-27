// ===================== APP.JS FINAL COMPLETO =====================

// Dados globais
let dadosGlobais = null;
let charts = {};

// ===================== SAFE SET =====================
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

// ===================== CARREGAR JSON =====================
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
    if (!dadosGlobais) return;
    atualizarResumo();
    criarGraficos();
    configurarEventos();
}

// ===================== RESUMO =====================
function atualizarResumo() {
    const resumo = dadosGlobais.resumo || {};

    setText('totalVeiculos', resumo.total_veiculos || 0);
    setText('veiculosAtivos', resumo.veiculos_ativos || 0);

    setText('kpiReceita', formatarMoeda(resumo.receita_mensal || 0));
    setText('kpiManutencao', formatarMoeda(resumo.total_manutencao || 0));
    setText('kpiGastos', formatarMoeda(resumo.gastos_fixos_mensal || 0));
    setText('kpiLucro', formatarMoeda(resumo.lucro_mensal || 0));

    const veiculos = dadosGlobais.veiculos || [];
    const gastos = dadosGlobais.gastos || [];
    const manutencao = dadosGlobais.manutencao || [];

    const totalCombustivel = gastos.reduce((s, g) => s + (g.combustivel_mensal || 0), 0);
    const totalServicos = manutencao.reduce((s, m) => s + (m.num_servicos || 0), 0);
    const totalKM = veiculos.reduce((s, v) => s + (v.km_atual || 0), 0);

    setText('statCombustivel', formatarMoeda(totalCombustivel));
    setText('statServicos', totalServicos);
    setText('statKM', totalKM.toLocaleString('pt-BR') + ' km');
    setText('statInvestimento', formatarMoeda(resumo.total_investido || 0));
}

// ===================== GRÁFICOS =====================
function criarGraficos() {
    criarGraficoReceitas();
}

function criarGraficoReceitas() {
    const ctx = document.getElementById('chartReceitas');
    if (!ctx) return;

    if (charts.receitas) charts.receitas.destroy();

    const veiculos = dadosGlobais.veiculos || [];

    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: veiculos.map(v => v.placa || '---'),
            datasets: [{
                label: 'Receita',
                data: veiculos.map(v => v.aluguel_mensal || 0)
            }]
        }
    });
}

// ===================== EVENTOS =====================
function configurarEventos() {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            navegarPara(item.dataset.page);
        };
    });

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.onchange = processarArquivo;
    }
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

// ===================== EXCEL =====================
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

        alert('✅ Planilha carregada com sucesso');
    } catch (error) {
        console.error(error);
        alert('Erro ao ler Excel');
    } finally {
        mostrarLoading(false);
    }
}

// ===================== EXTRAÇÃO =====================
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
