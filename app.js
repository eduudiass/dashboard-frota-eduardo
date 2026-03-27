// ===================== APP FINAL FUNCIONANDO =====================

let dadosGlobais = {
    resumo: {
        total_veiculos: 0,
        veiculos_ativos: 0,
        receita_mensal: 0,
        total_manutencao: 0,
        gastos_fixos_mensal: 0,
        lucro_mensal: 0
    },
    veiculos: [],
    manutencao: [],
    gastos: []
};

let charts = {};

// ===================== SAFE =====================
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    atualizarTudo();
});

// ===================== EVENTOS =====================
function configurarEventos() {

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            navegarPara(item.dataset.page);
        };
    });

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.onchange = processarArquivo;
}

// ===================== NAV =====================
function navegarPara(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
}

// ===================== EXCEL =====================
async function processarArquivo(e) {

    const file = e.target.files[0];

    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    dadosGlobais = extrairDadosPlanilha(workbook);

    atualizarTudo();
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
            total_manutencao: json.reduce((s, v) => s + (v.manutencao || 0), 0),
            gastos_fixos_mensal: json.reduce((s, v) => s + (v.gastos || 0), 0),
            lucro_mensal: json.reduce((s, v) => s + (v.aluguel_mensal || 0), 0)
        },

        veiculos: json,

        manutencao: json.map(v => ({
            placa: v.placa || '---',
            total_gasto: v.manutencao || 0,
            num_servicos: 1
        })),

        gastos: json.map(v => ({
            combustivel_mensal: v.combustivel || 0
        }))
    };
}

// ===================== ATUALIZAR TUDO =====================
function atualizarTudo() {
    atualizarResumo();
    atualizarGrafico();
}

// ===================== RESUMO =====================
function atualizarResumo() {

    const r = dadosGlobais.resumo;

    setText('totalVeiculos', r.total_veiculos);
    setText('veiculosAtivos', r.veiculos_ativos);
    setText('kpiReceita', formatarMoeda(r.receita_mensal));
    setText('kpiLucro', formatarMoeda(r.lucro_mensal));
}

// ===================== GRÁFICO =====================
function atualizarGrafico() {

    const ctx = document.getElementById('chartReceitas');
    if (!ctx) return;

    if (charts.receitas) charts.receitas.destroy();

    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosGlobais.veiculos.map(v => v.placa || '---'),
            datasets: [{
                label: 'Receita',
                data: dadosGlobais.veiculos.map(v => v.aluguel_mensal || 0)
            }]
        }
    });
}

// ===================== UTIL =====================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}
