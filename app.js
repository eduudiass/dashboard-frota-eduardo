// ===================== APP.JS FINAL FUNCIONAL =====================

// Dados
let dadosGlobais = null;
let chart = null;

// ===================== EXCEL =====================
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    dadosGlobais = {
        veiculos: json,
        resumo: {
            total_veiculos: json.length,
            veiculos_ativos: json.length,
            receita_mensal: json.reduce((s, v) => s + (v.aluguel_mensal || 0), 0),
            lucro_mensal: json.reduce((s, v) => s + (v.aluguel_mensal || 0), 0)
        }
    };

    atualizarTudo();
});

// ===================== ATUALIZAR TELA =====================
function atualizarTudo() {
    atualizarResumo();
    atualizarLista();
    atualizarGrafico();
}

// ===================== RESUMO =====================
function atualizarResumo() {
    document.getElementById('totalVeiculos').textContent = dadosGlobais.resumo.total_veiculos;
    document.getElementById('veiculosAtivos').textContent = dadosGlobais.resumo.veiculos_ativos;
    document.getElementById('kpiReceita').textContent = dadosGlobais.resumo.receita_mensal;
    document.getElementById('kpiLucro').textContent = dadosGlobais.resumo.lucro_mensal;
}

// ===================== LISTA =====================
function atualizarLista() {
    const el = document.getElementById('listaVeiculos');
    el.innerHTML = '';

    dadosGlobais.veiculos.forEach(v => {
        const div = document.createElement('div');
        div.textContent = `${v.placa || ''} - ${v.aluguel_mensal || 0}`;
        el.appendChild(div);
    });
}

// ===================== GRÁFICO =====================
function atualizarGrafico() {
    const ctx = document.getElementById('chartReceitas');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosGlobais.veiculos.map(v => v.placa),
            datasets: [{
                data: dadosGlobais.veiculos.map(v => v.aluguel_mensal || 0)
            }]
        }
    });
}

// ===================== NAVEGAÇÃO =====================
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${btn.dataset.page}`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
    });
});
