// Dados globais
let dadosGlobais = null;
let charts = {};

// Carregar dados iniciais
async function carregarDados() {
    mostrarLoading(true);
    try {
        const response = await fetch('dados.json');
        dadosGlobais = await response.json();
        
        // --- PROTEÇÃO CONTRA QUEBRA DE PÁGINAS ---
        dadosGlobais.compras = dadosGlobais.compras || [];
        dadosGlobais.receitas = dadosGlobais.receitas || [];
        dadosGlobais.gastos = dadosGlobais.gastos || [];
        dadosGlobais.veiculos = dadosGlobais.veiculos || [];
        dadosGlobais.manutencao = dadosGlobais.manutencao || [];
        dadosGlobais.resumo = dadosGlobais.resumo || {};
        
        // Garante que os totais existam
        dadosGlobais.resumo.receita_mensal = Number(dadosGlobais.resumo.receita_mensal) || 0;
        dadosGlobais.resumo.total_manutencao = Number(dadosGlobais.resumo.total_manutencao) || 0;
        dadosGlobais.resumo.gastos_fixos_mensal = Number(dadosGlobais.resumo.gastos_fixos_mensal) || Number(dadosGlobais.resumo.gastos_fixos) || 0;
        dadosGlobais.resumo.lucro_mensal = dadosGlobais.resumo.receita_mensal - dadosGlobais.resumo.total_manutencao - dadosGlobais.resumo.gastos_fixos_mensal;

        inicializarDashboard();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    } finally {
        mostrarLoading(false);
    }
}

// Inicializar dashboard
function inicializarDashboard() {
    atualizarResumo();
    criarGraficos();
    configurarEventos();
}

// Atualizar cards de resumo
function atualizarResumo() {
    const { resumo } = dadosGlobais;
    
    // Header stats
    document.getElementById('totalVeiculos').textContent = dadosGlobais.veiculos.length || 0;
    document.getElementById('veiculosAtivos').textContent = dadosGlobais.veiculos.filter(v => v.status && v.status.toLowerCase() === 'ativo').length || 0;
    
    // KPI Cards protegidos contra NaN
    document.getElementById('kpiReceita').textContent = formatarMoeda(Number(resumo.receita_mensal) || 0);
    document.getElementById('kpiManutencao').textContent = formatarMoeda(Number(resumo.total_manutencao) || 0);
    document.getElementById('kpiGastos').textContent = formatarMoeda(Number(resumo.gastos_fixos_mensal) || 0);
    
    const lucro = Number(resumo.lucro_mensal) || 0;
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
    
    // Quick stats
    const totalCombustivel = dadosGlobais.gastos.reduce((sum, g) => sum + (Number(g.combustivel_mensal) || 0), 0);
    const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + (Number(m.num_servicos) || 0), 0);
    const totalKM = dadosGlobais.veiculos.reduce((sum, v) => sum + (Number(v.km_atual) || 0), 0);
    
    document.getElementById('statCombustivel').textContent = formatarMoeda(totalCombustivel);
    document.getElementById('statServicos').textContent = totalServicos;
    document.getElementById('statKM').textContent = totalKM.toLocaleString('pt-BR') + ' km';
    document.getElementById('statInvestimento').textContent = formatarMoeda(Number(resumo.total_investido) || 0);
}

// Criar gráficos
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
        .filter(v => Number(v.aluguel_mensal) > 0)
        .sort((a, b) => Number(b.aluguel_mensal) - Number(a.aluguel_mensal))
        .slice(0, 10);
    
    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: veiculosOrdenados.map(v => v.placa || 'Sem Placa'),
            datasets: [{
                label: 'Aluguel Mensal',
                data: veiculosOrdenados.map(v => Number(v.aluguel_mensal) || 0),
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => 'R$ ' + context.parsed.y.toLocaleString('pt-BR') } }
            }
        }
    });
}

function criarGraficoManutencoes() {
    const ctx = document.getElementById('chartManutencoes');
    if (charts.manutencoes) charts.manutencoes.destroy();
    
    const manutencoesOrdenadas = [...dadosGlobais.manutencao]
        .filter(m => Number(m.total_gasto) > 0)
        .sort((a, b) => Number(b.total_gasto) - Number(a.total_gasto))
        .slice(0, 10);
    
    charts.manutencoes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: manutencoesOrdenadas.map(m => m.placa || 'Sem Placa'),
            datasets: [{
                label: 'Gasto Total',
                data: manutencoesOrdenadas.map(m => Number(m.total_gasto) || 0),
                backgroundColor: 'rgba(255, 71, 87, 0.2)',
                borderColor: 'rgba(255, 71, 87, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => 'R$ ' + context.parsed.y.toLocaleString('pt-BR') } }
            }
        }
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
        .map(v => ({ placa: v.placa || 'Sem Placa', roi: (Number(v.aluguel_mensal) || 0) * 12 }))
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
        options: { responsive: true, maintainAspectRatio: true, indexAxis: 'y', plugins: { legend: { display: false } } }
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
    carregarPagina(page);
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
        inicializarDashboard();
        alert('✅ Planilha atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert('❌ Erro ao processar arquivo. Verifique se é uma planilha válida.');
    } finally {
        mostrarLoading(false);
    }
}

// Extrator INTELIGENTE - Não importa se o nome da coluna tem espaço, letra maiúscula ou acento!
function extrairDadosPlanilha(workbook) {
    const dados = { resumo: {}, veiculos: [], manutencao: [], gastos: [], receitas: [], compras: [] };
    
    const padronizarChaves = (arr) => arr.map(row => {
        let newRow = {};
        for (let key in row) {
            // Transforma "Aluguel Mensal" em "aluguel_mensal", etc.
            let cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '_');
            newRow[cleanKey] = row[key];
        }
        return newRow;
    });

    workbook.SheetNames.forEach(name => {
        const lowerName = name.toLowerCase();
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: 0 });
        
        if (lowerName.includes('veiculo') || lowerName.includes('veículo')) dados.veiculos = padronizarChaves(sheetData);
        else if (lowerName.includes('manutencao') || lowerName.includes('manutenção')) dados.manutencao = padronizarChaves(sheetData);
        else if (lowerName.includes('gasto')) dados.gastos = padronizarChaves(sheetData);
        else if (lowerName.includes('receita')) dados.receitas = padronizarChaves(sheetData);
        else if (lowerName.includes('compra')) dados.compras = padronizarChaves(sheetData);
    });

    // Calcula os totais do Resumo FORÇADAMENTE (Ignora tab Resumo e soma na unha pra nunca dar NaN)
    dados.resumo.receita_mensal = dados.veiculos.reduce((sum, v) => sum + (Number(v.aluguel_mensal) || 0), 0);
    dados.resumo.total_manutencao = dados.manutencao.reduce((sum, m) => sum + (Number(m.total_gasto) || 0), 0);
    dados.resumo.gastos_fixos_mensal = dados.gastos.reduce((sum, g) => sum + (Number(g.total_mensal) || 0), 0);
    dados.resumo.lucro_mensal = dados.resumo.receita_mensal - dados.resumo.total_manutencao - dados.resumo.gastos_fixos_mensal;
    dados.resumo.total_veiculos = dados.veiculos.length;
    dados.resumo.veiculos_ativos = dados.veiculos.filter(v => v.status && String(v.status).toLowerCase() === 'ativo').length;
    dados.resumo.total_investido = dados.compras.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

    return dados;
}

function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (mostrar) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
}

document.addEventListener('DOMContentLoaded', carregarDados);
