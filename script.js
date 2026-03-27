// Variáveis Globais para guardar os dados e gráficos
let frotaData = { veiculos: [], receitas: [], gastos: [], manutencao: [], compras: [], vendas: [] };
let graficos = {};

// 1. Navegação do Menu
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove ativo de todos e esconde páginas
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Ativa o clicado
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        document.getElementById(target).classList.add('active');

        // Fecha menu no mobile
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Menu Mobile Toggle
document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// 2. Leitura do Arquivo Excel
document.getElementById('excel-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('file-name').textContent = "Processando: " + file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        processarPlanilhas(workbook);
        document.getElementById('file-name').textContent = "✅ Dados atualizados com sucesso!";
    };
    reader.readAsArrayBuffer(file);
});

// 3. Processamento das Abas da Planilha
function processarPlanilhas(workbook) {
    frotaData = { veiculos: [], receitas: [], gastos: [], manutencao: [], compras: [], vendas: [] };

    workbook.SheetNames.forEach(sheetName => {
        const nomeLower = sheetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // Lê os dados pulando linhas vazias ou cabeçalhos complexos se houver
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
        
        // Padroniza as chaves (cabeçalhos do excel)
        const cleanData = rawData.map(row => {
            let newRow = {};
            for (let key in row) {
                let cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_');
                newRow[cleanKey] = row[key];
            }
            return newRow;
        });

        if (nomeLower.includes('veiculo')) frotaData.veiculos = cleanData;
        else if (nomeLower.includes('receita')) frotaData.receitas = cleanData;
        else if (nomeLower.includes('gasto')) frotaData.gastos = cleanData;
        else if (nomeLower.includes('manutencao')) frotaData.manutencao = cleanData;
        else if (nomeLower.includes('compra')) frotaData.compras = cleanData;
        else if (nomeLower.includes('venda')) frotaData.vendas = cleanData;
    });

    renderizarDashboard();
    renderizarTabelas();
}

// Utilitários
function toNum(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
}
function toBRL(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNum(val));
}

// 4. Renderizar Resumo (Dashboard)
function renderizarDashboard() {
    const totalReceitas = frotaData.receitas.reduce((acc, row) => acc + toNum(row.valor || row.total || row.receita || 0), 0);
    const totalGastos = frotaData.gastos.reduce((acc, row) => acc + toNum(row.valor || row.total || row.gasto || 0), 0);
    const totalManutencao = frotaData.manutencao.reduce((acc, row) => acc + toNum(row.valor || row.total || row.custo || 0), 0);
    const lucroLiquido = totalReceitas - totalGastos - totalManutencao;
    const qdtVeiculos = frotaData.veiculos.length;

    document.getElementById('resumo-cards').innerHTML = `
        <div class="card">
            <h3>🚗 Total de Veículos</h3>
            <div class="value">${qdtVeiculos}</div>
        </div>
        <div class="card">
            <h3>💰 Receitas Totais</h3>
            <div class="value positive">${toBRL(totalReceitas)}</div>
        </div>
        <div class="card">
            <h3>💸 Gastos + Manutenção</h3>
            <div class="value negative">${toBRL(totalGastos + totalManutencao)}</div>
        </div>
        <div class="card">
            <h3>📊 Resultado Liquido</h3>
            <div class="value ${lucroLiquido >= 0 ? 'positive' : 'negative'}">${toBRL(lucroLiquido)}</div>
        </div>
    `;

    atualizarGraficos(totalReceitas, totalGastos, totalManutencao);
}

// 5. Atualizar Gráficos
function atualizarGraficos(receita, gasto, manutencao) {
    if(graficos.financas) graficos.financas.destroy();
    if(graficos.status) graficos.status.destroy();

    // Gráfico de Barras (Finanças)
    const ctxFin = document.getElementById('chartReceitasDespesas').getContext('2d');
    graficos.financas = new Chart(ctxFin, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Gastos', 'Manutenção'],
            datasets: [{
                label: 'Valores em R$',
                data: [receita, gasto, manutencao],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderRadius: 6
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    // Gráfico de Rosca (Status dos Veículos)
    const statusCount = {};
    frotaData.veiculos.forEach(v => {
        const s = v.status || 'Desconhecido';
        statusCount[s] = (statusCount[s] || 0) + 1;
    });

    const ctxStat = document.getElementById('chartStatus').getContext('2d');
    graficos.status = new Chart(ctxStat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } } }
    });
}

// 6. Criador Automático de Tabelas
function renderizarTabelas() {
    gerarTabelaHTML(frotaData.veiculos, 'tabela-veiculos');
    gerarTabelaHTML(frotaData.receitas, 'tabela-receitas');
    gerarTabelaHTML(frotaData.gastos, 'tabela-gastos');
    gerarTabelaHTML(frotaData.manutencao, 'tabela-manutencao');
    gerarTabelaHTML(frotaData.compras, 'tabela-compras');
    gerarTabelaHTML(frotaData.vendas, 'tabela-vendas');
}

function gerarTabelaHTML(dados, elementoId) {
    const div = document.getElementById(elementoId);
    if (!dados || dados.length === 0) {
        div.innerHTML = "<p style='padding: 20px; color: #94a3b8;'>Nenhum dado encontrado para esta aba na planilha.</p>";
        return;
    }

    const cabecalhos = Object.keys(dados[0]).filter(k => k !== '__rowNum__');

    let html = '<table><thead><tr>';
    cabecalhos.forEach(cab => {
        let nomeBonito = cab.charAt(0).toUpperCase() + cab.slice(1).replace(/_/g, ' ');
        html += `<th>${nomeBonito}</th>`;
    });
    html += '</tr></thead><tbody>';

    dados.forEach(linha => {
        html += '<tr>';
        cabecalhos.forEach(cab => {
            let valor = linha[cab];
            if (typeof valor === 'number' && (cab.includes('valor') || cab.includes('total') || cab.includes('preco') || cab.includes('custo') || cab.includes('aluguel'))) {
                valor = toBRL(valor);
            }
            html += `<td>${valor !== undefined && valor !== "" ? valor : '-'}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    div.innerHTML = html;
}
