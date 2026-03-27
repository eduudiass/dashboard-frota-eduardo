// Dados globais
let dadosGlobais = null;
let charts = {};

// Carregar dados iniciais
async function carregarDados() {
    mostrarLoading(true);
    try {
        const response = await fetch('dados.json');
        dadosGlobais = await response.json();
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
    const totalCombustivel = dadosGlobais.gastos.reduce((sum, g) => sum + g.combustivel_mensal, 0);
    const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + m.num_servicos, 0);
    const totalKM = dadosGlobais.veiculos.reduce((sum, v) => sum + v.km_atual, 0);
    
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
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#718096' }
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
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: '#718096',
                        callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#718096' }
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
        'rgba(0, 255, 136, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(155, 89, 182, 0.8)',
        'rgba(241, 196, 15, 0.8)',
        'rgba(231, 76, 60, 0.8)',
        'rgba(26, 188, 156, 0.8)',
        'rgba(230, 126, 34, 0.8)',
        'rgba(149, 165, 166, 0.8)'
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
                legend: {
                    position: 'bottom',
                    labels: { color: '#a0aec0', padding: 10, font: { size: 11 } }
                }
            }
        }
    });
}

// Gráfico de ROI
function criarGraficoROI() {
    const ctx = document.getElementById('chartROI');
    
    if (charts.roi) {
        charts.roi.destroy();
    }
    
    // Calcular ROI simplificado (aluguel anual vs custo)
    const veiculosComROI = dadosGlobais.veiculos
        .map(v => ({
            placa: v.placa,
            roi: (v.aluguel_mensal * 12) // Simplificado para o exemplo
        }))
        .filter(v => v.roi > 0)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 8);
    
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
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 36, 51, 0.95)',
                    borderColor: 'rgba(0, 255, 136, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (context) => 'R$ ' + context.parsed.x.toLocaleString('pt-BR')
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: {
                        color: '#718096',
                        callback: (value) => 'R$ ' + (value / 1000).toFixed(0) + 'k'
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#718096' }
                }
            }
        }
    });
}

// Navegação
function configurarEventos() {
    // Menu navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navegarPara(page);
        });
    });
    
    // Mobile menu toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Upload buttons
    document.getElementById('btnUpload')?.addEventListener('click', abrirUploadModal);
    document.getElementById('btnMobileUpload')?.addEventListener('click', abrirUploadModal);
    
    // File input
    document.getElementById('fileInput')?.addEventListener('change', processarArquivo);
    
    // Upload zone drag & drop
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--green-primary)';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = 'var(--border-color)';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length > 0) {
                document.getElementById('fileInput').files = e.dataTransfer.files;
                processarArquivo({ target: { files: e.dataTransfer.files } });
            }
        });
        
        uploadZone.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }
}

// Navegação entre páginas
function navegarPara(page) {
    // Atualizar menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Atualizar páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    document.getElementById(`page-${page}`)?.classList.add('active');
    
    // Fechar menu mobile
    document.getElementById('sidebar')?.classList.remove('active');
    
    // Carregar conteúdo da página se necessário
    carregarPagina(page);
}

// Modal de upload
function abrirUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

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
        
        // Extrair dados (lógica similar ao Python)
        dadosGlobais = extrairDadosPlanilha(workbook);
        
        // Atualizar dashboard
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
    
    try {
        // 1. VEÍCULOS
        const sheetVeiculos = workbook.Sheets['Cadastro de Veículos'];
        if (sheetVeiculos) {
            const jsonVeiculos = XLSX.utils.sheet_to_json(sheetVeiculos, { header: 1 });
            
            for (let i = 3; i < jsonVeiculos.length; i++) {
                const row = jsonVeiculos[i];
                if (!row[0] || !row[1] || row[1] === '0' || String(row[0]).toUpperCase() === 'TOTAL GERAL') continue;
                
                dados.veiculos.push({
                    numero: parseInt(row[0]) || 0,
                    placa: String(row[1] || ''),
                    modelo: String(row[2] || ''),
                    ano: parseInt(row[3]) || 0,
                    cor: String(row[4] || ''),
                    motorista: String(row[5] || 'Sem motorista'),
                    contato: String(row[6] || ''),
                    aluguel_mensal: parseFloat(row[7]) || 0,
                    data_inicio: row[8] ? String(row[8]) : '',
                    km_atual: parseInt(row[9]) || 0,
                    status: String(row[10] || 'Ativo')
                });
            }
        }
        
        // 2. MANUTENÇÃO
        const sheetManutencao = workbook.Sheets['Manutenção'];
        if (sheetManutencao) {
            const jsonManutencao = XLSX.utils.sheet_to_json(sheetManutencao, { header: 1 });
            
            for (let i = 3; i < jsonManutencao.length; i++) {
                const row = jsonManutencao[i];
                if (!row[0] || !row[1] || row[1] === '0' || String(row[0]).toUpperCase() === 'TOTAL GERAL') continue;
                
                dados.manutencao.push({
                    numero: parseInt(row[0]) || 0,
                    placa: String(row[1] || ''),
                    modelo: String(row[2] || ''),
                    motorista: String(row[3] || ''),
                    num_servicos: parseInt(row[4]) || 0,
                    total_gasto: parseFloat(row[5]) || 0
                });
            }
        }
        
        // 3. RECEITAS
        const sheetReceitas = workbook.Sheets['Receitas Mensais'];
        if (sheetReceitas) {
            const jsonReceitas = XLSX.utils.sheet_to_json(sheetReceitas, { header: 1 });
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            
            for (let i = 3; i < jsonReceitas.length; i++) {
                const row = jsonReceitas[i];
                if (!row[0] || !row[1] || row[1] === '0' || String(row[0]).toUpperCase() === 'TOTAL GERAL') continue;
                
                const receitas_mensais = {};
                for (let j = 0; j < meses.length; j++) {
                    const valor = parseFloat(row[5 + j]) || 0;
                    receitas_mensais[meses[j]] = valor;
                }
                
                dados.receitas.push({
                    numero: parseInt(row[0]) || 0,
                    placa: String(row[1] || ''),
                    modelo: String(row[2] || ''),
                    aluguel_previsto: parseFloat(row[4]) || 0,
                    receitas_mensais: receitas_mensais,
                    total_recebido: Object.values(receitas_mensais).reduce((a, b) => a + b, 0)
                });
            }
        }
        
        // 4. GASTOS
        const sheetGastos = workbook.Sheets['Gastos'];
        if (sheetGastos) {
            const jsonGastos = XLSX.utils.sheet_to_json(sheetGastos, { header: 1 });
            
            for (let i = 3; i < jsonGastos.length; i++) {
                const row = jsonGastos[i];
                if (!row[0] || !row[1] || row[1] === '0' || String(row[0]).toUpperCase() === 'TOTAL GERAL') continue;
                
                dados.gastos.push({
                    numero: parseInt(row[0]) || 0,
                    placa: String(row[1] || ''),
                    modelo: String(row[2] || ''),
                    seguro_anual: parseFloat(row[4]) || 0,
                    ipva_anual: parseFloat(row[5]) || 0,
                    licenciamento: parseFloat(row[6]) || 0,
                    combustivel_mensal: parseFloat(row[7]) || 0,
                    total_mensal: parseFloat(row[8]) || 0
                });
            }
        }
        
        // 5. COMPRAS
        const sheetCompras = workbook.Sheets['🚗 Compra de Carros'];
        if (sheetCompras) {
            const jsonCompras = XLSX.utils.sheet_to_json(sheetCompras, { header: 1 });
            
            let carroAtual = null;
            let comprasPorCarro = [];
            
            for (let i = 0; i < jsonCompras.length; i++) {
                const row = jsonCompras[i];
                
                // Detectar início de bloco
                if (row[0] && String(row[0]).includes('🚗') && String(row[0]).includes('—')) {
                    if (carroAtual && carroAtual.total > 0) {
                        comprasPorCarro.push(carroAtual);
                    }
                    
                    carroAtual = {
                        titulo: String(row[0]),
                        itens: [],
                        total: 0
                    };
                    continue;
                }
                
                // Linha TOTAL
                if (carroAtual && String(row[0]).toUpperCase() === 'TOTAL') {
                    carroAtual.total = parseFloat(row[4]) || 0;
                    continue;
                }
                
                // Adicionar itens
                if (carroAtual && row[0] && !isNaN(row[0]) && row[1]) {
                    carroAtual.itens.push({
                        numero: parseInt(row[0]),
                        data: row[1] ? String(row[1]) : '',
                        categoria: String(row[2] || ''),
                        descricao: String(row[3] || ''),
                        valor: parseFloat(row[4]) || 0,
                        observacao: String(row[5] || '')
                    });
                }
            }
            
            if (carroAtual && carroAtual.total > 0) {
                comprasPorCarro.push(carroAtual);
            }
            
            dados.compras = comprasPorCarro;
        }
        
        // CALCULAR RESUMO
        dados.resumo = {
            total_veiculos: dados.veiculos.length,
            veiculos_ativos: dados.veiculos.filter(v => v.status === 'Ativo').length,
            receita_mensal: dados.veiculos.reduce((sum, v) => sum + v.aluguel_mensal, 0),
            total_manutencao: dados.manutencao.reduce((sum, m) => sum + m.total_gasto, 0),
            gastos_fixos_mensal: dados.gastos.reduce((sum, g) => sum + g.total_mensal, 0),
            total_investido: dados.compras.reduce((sum, c) => sum + c.total, 0)
        };
        
        dados.resumo.lucro_mensal = dados.resumo.receita_mensal - dados.resumo.gastos_fixos_mensal;
        
    } catch (error) {
        console.error('Erro ao extrair dados:', error);
        throw error;
    }
    
    return dados;
}

// Loading
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (mostrar) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Formatação
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Inicializar quando carregar
document.addEventListener('DOMContentLoaded', carregarDados);
