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
        
        if (dadosGlobais.resumo) {
            // Corrige nomes errados que vieram do JSON
            dadosGlobais.resumo.gastos_fixos_mensal = dadosGlobais.resumo.gastos_fixos_mensal || dadosGlobais.resumo.gastos_fixos || 0;
            dadosGlobais.resumo.total_investido = dadosGlobais.resumo.total_investido || dadosGlobais.resumo.investimento_total || 0;
            dadosGlobais.resumo.total_veiculos = dadosGlobais.veiculos.length;
            dadosGlobais.resumo.veiculos_ativos = dadosGlobais.veiculos.filter(v => v.status === 'Ativo').length;
            
            // Calcula o lucro real
            if (typeof dadosGlobais.resumo.lucro_mensal === 'undefined') {
                dadosGlobais.resumo.lucro_mensal = dadosGlobais.resumo.receita_mensal - dadosGlobais.resumo.total_manutencao - dadosGlobais.resumo.gastos_fixos_mensal;
            }
        }

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
    document.getElementById('totalVeiculos').textContent = resumo.total_veiculos;
    document.getElementById('veiculosAtivos').textContent = resumo.veiculos_ativos;
    
    // KPI Cards
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
    
    // Quick stats
    const totalCombustivel = dadosGlobais.gastos.reduce((sum, g) => sum + (g.combustivel_mensal || 0), 0);
    const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + (m.num_servicos || 0), 0);
    const totalKM = dadosGlobais.veiculos.reduce((sum, v) => sum + (v.km_atual || 0), 0);
    
    document.getElementById('statCombustivel').textContent = formatarMoeda(totalCombustivel);
    document.getElementById('statServicos').textContent = totalServicos;
    document.getElementById('statKM').textContent = totalKM.toLocaleString('pt-BR') + ' km';
    document.getElementById('statInvestimento').textContent = formatarMoeda(resumo.total_investido);
}

// Criar gráficos
function criarGraficos() {
    criarGraficoReceitas();
    criarGraficoManutencoes();
    criarGraficoStatus();
    criarGraficoModelos();
    criarGraficoROI();
}

// Gráfico de receitas
function criarGraficoReceitas() {
    const ctx = document.getElementById('chartReceitas');
    
    if (charts.receitas) {
        charts.receitas.destroy();
    }
    
    const veiculosOrdenados = [...dadosGlobais.veiculos]
        .filter(v => v.aluguel_mensal > 0)
        .sort((a, b) => b.aluguel_mensal - a.aluguel_mensal)
        .slice(0, 10);
    
    charts.receitas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: veiculosOrdenados.map(v => v.placa),
            datasets: [{
                label: 'Aluguel Mensal',
                data: veiculosOrdenados.map(v => v.aluguel_mensal),
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                borderColor: 'rgba(0, 255, 136, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 36, 51, 0.95)',
                    borderColor: 'rgba(0, 255, 136, 0.5)',
                    borderWidth: 1,
                    titleColor: '#ffffff',
                    bodyColor: '#a0aec0',
                    padding: 12,
                    callbacks: {
                        label: (context) => 'R$ ' + context.parsed.y.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}

// Gráfico de manutenções
function criarGraficoManutencoes() {
    const ctx = document.getElementById('chartManutencoes');
    
    if (charts.manutencoes) {
        charts.manutencoes.destroy();
    }
    
    const manutencoesOrdenadas = [...dadosGlobais.manutencao]
        .filter(m => m.total_gasto > 0)
        .sort((a, b) => b.total_gasto - a.total_gasto)
        .slice(0, 10);
    
    charts.manutencoes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: manutencoesOrdenadas.map(m => m.placa),
            datasets: [{
                label: 'Gasto Total',
                data: manutencoesOrdenadas.map(m => m.total_gasto),
                backgroundColor: 'rgba(255, 71, 87, 0.2)',
                borderColor: 'rgba(255, 71, 87, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 36, 51, 0.95)',
                    borderColor: 'rgba(255, 71, 87, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (context) => 'R$ ' + context.parsed.y.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}

// Gráfico de status
function criarGraficoStatus() {
    const ctx = document.getElementById('chartStatus');
    
    if (charts.status) {
        charts.status.destroy();
    }
    
    const statusCount = {};
    dadosGlobais.veiculos.forEach(v => {
        statusCount[v.status] = (statusCount[v.status] || 0) + 1;
    });
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: [
                    'rgba(0, 255, 136, 0.8)',
                    'rgba(255, 71, 87, 0.8)',
                    'rgba(255, 165, 2, 0.8)'
                ],
                borderColor: '#1e2433',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#a0aec0', padding: 15, font: { size: 12 } }
                }
            }
        }
    });
}

// Gráfico de modelos
function criarGraficoModelos() {
    const ctx = document.getElementById('chartModelos');
    
    if (charts.modelos) {
        charts.modelos.destroy();
    }
    
    const modelosCount = {};
    dadosGlobais.veiculos.forEach(v => {
        if (v.modelo) {
            modelosCount[v.modelo] = (modelosCount[v.modelo] || 0) + 1;
        }
    });
    
    const cores = [
        'rgba(0, 255, 136, 0.8)', 'rgba(52, 152, 219, 0.8)', 'rgba(155, 89, 182, 0.8)',
        'rgba(241, 196, 15, 0.8)', 'rgba(231, 76, 60, 0.8)', 'rgba(26, 188, 156, 0.8)'
    ];
    
    charts.modelos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(modelosCount),
            datasets: [{
                data: Object.values(modelosCount),
                backgroundColor: cores,
                borderColor: '#1e2433',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#a0aec0', padding: 10, font: { size: 11 } } }
            }
        }
    });
}

// Gráfico de ROI
function criarGraficoROI() {
    const ctx = document.getElementById('chartROI');
    if (charts.roi) charts.roi.destroy();
    
    const veiculosComROI = dadosGlobais.veiculos
        .map(v => ({ placa: v.placa, roi: (v.aluguel_mensal * 12) }))
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
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, indexAxis: 'y',
            plugins: { legend: { display: false } }
        }
    });
}

// Navegação e Eventos
function configurarEventos() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPara(item.dataset.page);
        });
    });
    
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
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

// Processar arquivo
async function processarArquivo(e) {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.xlsx')) {
        alert('Por favor, selecione um arquivo .xlsx válido');
        return;
    }
    
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

// Extrair dados da planilha
function extrairDadosPlanilha(workbook) {
    const dados = {
        resumo: {},
        veiculos: [],
        manutencao: [],
        gastos: [],
        receitas: [],
        compras: []
    };
    
    // Lê todas as abas do Excel e organiza os dados
    workbook.SheetNames.forEach(name => {
        const lowerName = name.toLowerCase();
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        
        if (lowerName.includes('veiculo') || lowerName.includes('veículo')) dados.veiculos = sheetData;
        else if (lowerName.includes('manutencao') || lowerName.includes('manutenção')) dados.manutencao = sheetData;
        else if (lowerName.includes('gasto')) dados.gastos = sheetData;
        else if (lowerName.includes('receita')) dados.receitas = sheetData;
        else if (lowerName.includes('compra')) dados.compras = sheetData;
        else if (lowerName.includes('resumo') && sheetData.length > 0) dados.resumo = sheetData[0];
    });

    // Atualiza estatísticas baseadas nos veículos carregados
    dados.resumo.total_veiculos = dados.veiculos.length;
    dados.resumo.veiculos_ativos = dados.veiculos.filter(v => v.status === 'Ativo').length;
    
    return dados;
}

function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (mostrar) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

document.addEventListener('DOMContentLoaded', carregarDados);
