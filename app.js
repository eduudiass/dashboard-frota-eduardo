// Dados globais
let dadosGlobais = null;
let charts = {};

// Função auxiliar para garantir que um valor seja numérico
function safeNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const parsed = parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
}

// Carregar dados iniciais (JSON ou Padrão)
async function carregarDados() {
    mostrarLoading(true);
    try {
        const response = await fetch('dados.json');
        if (response.ok) {
            dadosGlobais = await response.json();
        } else {
            console.warn("dados.json não encontrado ou inválido. Iniciando com dados vazios.");
            dadosGlobais = {};
        }
    } catch (error) {
         console.warn("Erro ao buscar dados.json. Iniciando com dados vazios.", error);
         dadosGlobais = {};
    } finally {
        garantirEstruturaDados();
        inicializarDashboard();
        mostrarLoading(false);
    }
}

// Garante que a estrutura exista e calcula totais
function garantirEstruturaDados() {
    dadosGlobais = dadosGlobais || {};
    dadosGlobais.compras = Array.isArray(dadosGlobais.compras) ? dadosGlobais.compras : [];
    dadosGlobais.receitas = Array.isArray(dadosGlobais.receitas) ? dadosGlobais.receitas : [];
    dadosGlobais.gastos = Array.isArray(dadosGlobais.gastos) ? dadosGlobais.gastos : [];
    dadosGlobais.veiculos = Array.isArray(dadosGlobais.veiculos) ? dadosGlobais.veiculos : [];
    dadosGlobais.manutencao = Array.isArray(dadosGlobais.manutencao) ? dadosGlobais.manutencao : [];
    dadosGlobais.resumo = dadosGlobais.resumo || {};

    // Recalcula totais sempre para garantir consistência
    dadosGlobais.resumo.receita_mensal = dadosGlobais.veiculos.reduce((sum, v) => sum + safeNumber(v.aluguel_mensal || v.receita || 0), 0);
    dadosGlobais.resumo.total_manutencao = dadosGlobais.manutencao.reduce((sum, m) => sum + safeNumber(m.total_gasto || m.valor || 0), 0);
    dadosGlobais.resumo.gastos_fixos_mensal = dadosGlobais.gastos.reduce((sum, g) => sum + safeNumber(g.total_mensal || g.valor || 0), 0);
    dadosGlobais.resumo.lucro_mensal = dadosGlobais.resumo.receita_mensal - dadosGlobais.resumo.total_manutencao - dadosGlobais.resumo.gastos_fixos_mensal;
    dadosGlobais.resumo.total_veiculos = dadosGlobais.veiculos.length;
    dadosGlobais.resumo.veiculos_ativos = dadosGlobais.veiculos.filter(v => v.status && String(v.status).toLowerCase() === 'ativo').length;
    dadosGlobais.resumo.total_investido = dadosGlobais.compras.reduce((sum, c) => sum + safeNumber(c.total || c.valor || 0), 0);
}

function inicializarDashboard() {
    atualizarResumo();
    criarGraficos();
    configurarEventos();
}

function atualizarResumo() {
    const { resumo } = dadosGlobais;
    
    document.getElementById('totalVeiculos').textContent = resumo.total_veiculos;
    document.getElementById('veiculosAtivos').textContent = resumo.veiculos_ativos;
    
    document.getElementById('kpiReceita').textContent = formatarMoeda(resumo.receita_mensal);
    document.getElementById('kpiManutencao').textContent = formatarMoeda(resumo.total_manutencao);
    document.getElementById('kpiGastos').textContent = formatarMoeda(resumo.gastos_fixos_mensal);
    
    const lucro = resumo.lucro_mensal;
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
    
    const totalCombustivel = dadosGlobais.gastos.reduce((sum, g) => sum + safeNumber(g.combustivel_mensal || g.combustivel || 0), 0);
    const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + safeNumber(m.num_servicos || m.quantidade || 0), 0);
    const totalKM = dadosGlobais.veiculos.reduce((sum, v) => sum + safeNumber(v.km_atual || v.km || 0), 0);
    
    document.getElementById('statCombustivel').textContent = formatarMoeda(totalCombustivel);
    document.getElementById('statServicos').textContent = totalServicos;
    document.getElementById('statKM').textContent = totalKM.toLocaleString('pt-BR') + ' km';
    document.getElementById('statInvestimento').textContent = formatarMoeda(resumo.total_investido);
}

function criarGraficos() {
    criarGraficoReceitas();
    criarGraficoManutencoes();
    criarGraficoStatus();
    criarGraficoModelos();
    criarGraficoROI();
}

function criarGraficoReceitas() {
    const ctx = document.getElementById('chartReceitas');
    if (charts.receitas) charts.receitas.destroy();
    
    const veiculosOrdenados = [...dadosGlobais.veiculos]
        .filter(v => safeNumber(v.aluguel_mensal) > 0)
        .sort((a, b) => safeNumber(b.aluguel_mensal) - safeNumber(a.aluguel_mensal))
        .slice(0, 10);
    
    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: veiculosOrdenados.map(v => v.placa || 'Sem Placa'),
            datasets: [{
                label: 'Aluguel Mensal',
                data: veiculosOrdenados.map(v => safeNumber(v.aluguel_mensal)),
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => formatarMoeda(context.parsed.y) } } } }
    });
}

function criarGraficoManutencoes() {
    const ctx = document.getElementById('chartManutencoes');
    if (charts.manutencoes) charts.manutencoes.destroy();
    
    const manutencoesOrdenadas = [...dadosGlobais.manutencao]
        .filter(m => safeNumber(m.total_gasto) > 0)
        .sort((a, b) => safeNumber(b.total_gasto) - safeNumber(a.total_gasto))
        .slice(0, 10);
    
    charts.manutencoes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: manutencoesOrdenadas.map(m => m.placa || 'Sem Placa'),
            datasets: [{
                label: 'Gasto Total',
                data: manutencoesOrdenadas.map(m => safeNumber(m.total_gasto)),
                backgroundColor: 'rgba(255, 71, 87, 0.2)',
                borderColor: 'rgba(255, 71, 87, 1)',
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => formatarMoeda(context.parsed.y) } } } }
    });
}

function criarGraficoStatus() {
    const ctx = document.getElementById('chartStatus');
    if (charts.status) charts.status.destroy();
    
    const statusCount = {};
    dadosGlobais.veiculos.forEach(v => {
        const status = v.status || 'Desconhecido';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: ['rgba(0, 255, 136, 0.8)', 'rgba(255, 71, 87, 0.8)', 'rgba(255, 165, 2, 0.8)', 'rgba(100, 100, 100, 0.8)'],
                borderColor: '#1e2433', borderWidth: 3
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#a0aec0' } } } }
    });
}

function criarGraficoModelos() {
    const ctx = document.getElementById('chartModelos');
    if (charts.modelos) charts.modelos.destroy();
    
    const modelosCount = {};
    dadosGlobais.veiculos.forEach(v => {
        const modelo = v.modelo || 'Outros';
        modelosCount[modelo] = (modelosCount[modelo] || 0) + 1;
    });
    
    charts.modelos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(modelosCount),
            datasets: [{
                data: Object.values(modelosCount),
                backgroundColor: ['rgba(0, 255, 136, 0.8)', 'rgba(52, 152, 219, 0.8)', 'rgba(155, 89, 182, 0.8)', 'rgba(241, 196, 15, 0.8)', 'rgba(231, 76, 60, 0.8)'],
                borderColor: '#1e2433', borderWidth: 3
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#a0aec0' } } } }
    });
}

function criarGraficoROI() {
    const ctx = document.getElementById('chartROI');
    if (charts.roi) charts.roi.destroy();
    
    const veiculosComROI = dadosGlobais.veiculos
        .map(v => ({ placa: v.placa || 'Sem Placa', roi: safeNumber(v.aluguel_mensal) * 12 }))
        .filter(v => v.roi > 0)
        .sort((a, b) => b.roi - a.roi).slice(0, 8);
    
    charts.roi = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: veiculosComROI.map(v => v.placa),
            datasets: [{
                label: 'Receita Anual',
                data: veiculosComROI.map(v => v.roi),
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => formatarMoeda(context.parsed.x) } } } }
    });
}

function configurarEventos() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPara(item.dataset.page);
        });
    });
    
    document.getElementById('menuToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('active'));
    document.getElementById('btnUpload')?.addEventListener('click', abrirUploadModal);
    document.getElementById('btnMobileUpload')?.addEventListener('click', abrirUploadModal);
    document.getElementById('fileInput')?.addEventListener('change', processarArquivo);
    
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = 'var(--green-primary)'; });
        uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = 'var(--border-color)'; });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length > 0) {
                document.getElementById('fileInput').files = e.dataTransfer.files;
                processarArquivo({ target: { files: e.dataTransfer.files } });
            }
        });
        uploadZone.addEventListener('click', () => { document.getElementById('fileInput').click(); });
    }
}

function navegarPara(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) item.classList.add('active');
    });
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('active');
    
    if (typeof carregarPagina === 'function') {
        carregarPagina(page);
    } else {
        console.error("Função carregarPagina não encontrada. Verifique se pages.js está carregado corretamente.");
    }
}

function abrirUploadModal() { document.getElementById('uploadModal').classList.add('active'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.remove('active'); }

async function processarArquivo(e) {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.xlsx')) return alert('Por favor, selecione um arquivo .xlsx válido');
    
    mostrarLoading(true);
    closeUploadModal();
    
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        dadosGlobais = extrairDadosPlanilha(workbook);
        garantirEstruturaDados(); // Garante consistência após leitura
        inicializarDashboard();
        alert('✅ Planilha atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert('❌ Erro ao processar arquivo. Verifique o console para detalhes.');
    } finally {
        mostrarLoading(false);
    }
}

function extrairDadosPlanilha(workbook) {
    const dados = { resumo: {}, veiculos: [], manutencao: [], gastos: [], receitas: [], compras: [] };
    
    const padronizarChaves = (arr) => arr.map(row => {
        let newRow = {};
        for (let key in row) {
            let cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_');
            newRow[cleanKey] = row[key];
        }
        return newRow;
    });

    workbook.SheetNames.forEach(name => {
        const lowerName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" }); // defval vazio previne erros
        
        if (lowerName.includes('veiculo')) dados.veiculos = padronizarChaves(sheetData);
        else if (lowerName.includes('manutencao')) dados.manutencao = padronizarChaves(sheetData);
        else if (lowerName.includes('gasto') || lowerName.includes('despesa')) dados.gastos = padronizarChaves(sheetData);
        else if (lowerName.includes('receita')) dados.receitas = padronizarChaves(sheetData);
        else if (lowerName.includes('compra')) dados.compras = padronizarChaves(sheetData);
    });

    return dados;
}

function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (mostrar) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeNumber(valor));
}

document.addEventListener('DOMContentLoaded', carregarDados);
