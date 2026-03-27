// Gerenciador de páginas
const Pages = {
    carregar: function(pageName) {
        switch(pageName) {
            case 'veiculos': this.renderVeiculos(); break;
            case 'manutencoes': this.renderManutencoes(); break;
            case 'receitas': this.renderReceitas(); break;
            case 'gastos': this.renderGastos(); break;
            case 'compras': this.renderCompras(); break;
        }
    },
    
    renderVeiculos: function() {
        const container = document.getElementById('page-veiculos');
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Gestão de Veículos</h1>
                    <p class="page-subtitle">Controle completo da sua frota</p>
                </div>
            </div>
            <div class="filter-bar">
                <input type="text" class="search-input" id="searchVeiculos" placeholder="🔍 Buscar por placa, modelo ou motorista...">
                <select class="filter-select" id="filterStatus">
                    <option value="todos">Todos os Status</option>
                    <option value="Ativo">Ativos</option>
                    <option value="Inativo">Inativos</option>
                </select>
                <select class="filter-select" id="filterModelo">
                    <option value="todos">Todos os Modelos</option>
                </select>
            </div>
            <div class="veiculos-grid" id="veiculosGrid"></div>
        `;
        container.innerHTML = html;
        
        const modelos = [...new Set(dadosGlobais.veiculos.map(v => v.modelo))];
        const filterModelo = document.getElementById('filterModelo');
        modelos.forEach(modelo => {
            if (modelo) filterModelo.appendChild(new Option(modelo, modelo));
        });
        
        this.renderVeiculosGrid();
        
        document.getElementById('searchVeiculos').addEventListener('input', () => this.renderVeiculosGrid());
        document.getElementById('filterStatus').addEventListener('change', () => this.renderVeiculosGrid());
        document.getElementById('filterModelo').addEventListener('change', () => this.renderVeiculosGrid());
    },
    
    renderVeiculosGrid: function() {
        const grid = document.getElementById('veiculosGrid');
        const search = document.getElementById('searchVeiculos')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filterStatus')?.value || 'todos';
        const modeloFilter = document.getElementById('filterModelo')?.value || 'todos';
        
        let veiculos = dadosGlobais.veiculos.filter(v => {
            const matchSearch = search === '' || 
                (v.placa && v.placa.toLowerCase().includes(search)) ||
                (v.modelo && v.modelo.toLowerCase().includes(search)) ||
                (v.motorista && v.motorista.toLowerCase().includes(search));
            const matchStatus = statusFilter === 'todos' || v.status === statusFilter;
            const matchModelo = modeloFilter === 'todos' || v.modelo === modeloFilter;
            return matchSearch && matchStatus && matchModelo;
        });
        
        grid.innerHTML = veiculos.map(v => this.criarCardVeiculo(v)).join('');
        
        grid.querySelectorAll('.veiculo-card').forEach((card, index) => {
            card.addEventListener('click', () => this.abrirDetalhesVeiculo(veiculos[index]));
        });
    },
    
    criarCardVeiculo: function(v) {
        const manutencao = dadosGlobais.manutencao.find(m => m.placa === v.placa) || { total_gasto: 0, num_servicos: 0 };
        const statusClass = (v.status && v.status.toLowerCase() === 'ativo') ? 'success' : 'inactive';
        
        return `
            <div class="veiculo-card" data-placa="${v.placa || ''}">
                <div class="veiculo-header">
                    <div class="veiculo-placa">${v.placa || 'Sem Placa'}</div>
                    <div class="status-badge ${statusClass}">${v.status || 'N/A'}</div>
                </div>
                <div class="veiculo-modelo">${v.modelo || ''} ${v.ano || ''}</div>
                <div class="veiculo-motorista">
                    <span class="label">👤</span> ${v.motorista || 'Sem motorista'}
                </div>
                <div class="veiculo-stats">
                    <div class="veiculo-stat">
                        <span class="stat-icon">💰</span>
                        <div>
                            <div class="stat-value">${formatarMoeda(v.aluguel_mensal || 0)}</div>
                            <div class="stat-label">Aluguel/mês</div>
                        </div>
                    </div>
                    <div class="veiculo-stat">
                        <span class="stat-icon">🔧</span>
                        <div>
                            <div class="stat-value">${formatarMoeda(manutencao.total_gasto || 0)}</div>
                            <div class="stat-label">${manutencao.num_servicos || 0} serviços</div>
                        </div>
                    </div>
                </div>
                <div class="veiculo-km">
                    📍 ${Number(v.km_atual || 0).toLocaleString('pt-BR')} km
                </div>
            </div>
        `;
    },
    
    abrirDetalhesVeiculo: function(veiculo) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'modalDetalhes';
        
        const manutencao = dadosGlobais.manutencao.find(m => m.placa === veiculo.placa) || {};
        const gastos = dadosGlobais.gastos.find(g => g.placa === veiculo.placa) || {};
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <div>
                        <h3>🚗 ${veiculo.modelo || ''} - ${veiculo.placa || ''}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">Motorista: ${veiculo.motorista || '-'}</p>
                    </div>
                    <button class="modal-close" onclick="document.getElementById('modalDetalhes').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detalhes-grid">
                        <div class="detalhe-section">
                            <h4>📋 Informações Básicas</h4>
                            <div class="info-list">
                                <div class="info-item"><span class="info-label">Placa:</span><span class="info-value">${veiculo.placa || '-'}</span></div>
                                <div class="info-item"><span class="info-label">Modelo:</span><span class="info-value">${veiculo.modelo || '-'}</span></div>
                                <div class="info-item"><span class="info-label">Ano:</span><span class="info-value">${veiculo.ano || '-'}</span></div>
                                <div class="info-item"><span class="info-label">KM Atual:</span><span class="info-value">${Number(veiculo.km_atual || 0).toLocaleString('pt-BR')} km</span></div>
                            </div>
                        </div>
                        <div class="detalhe-section">
                            <h4>💰 Financeiro</h4>
                            <div class="financial-cards">
                                <div class="mini-card success">
                                    <div class="mini-label">Aluguel Mensal</div>
                                    <div class="mini-value">${formatarMoeda(veiculo.aluguel_mensal || 0)}</div>
                                </div>
                                <div class="mini-card danger">
                                    <div class="mini-label">Gastos Mensais</div>
                                    <div class="mini-value">${formatarMoeda(gastos.total_mensal || 0)}</div>
                                </div>
                                <div class="mini-card ${(Number(veiculo.aluguel_mensal || 0) - Number(gastos.total_mensal || 0)) > 0 ? 'success' : 'danger'}">
                                    <div class="mini-label">Lucro Mensal</div>
                                    <div class="mini-value">${formatarMoeda(Number(veiculo.aluguel_mensal || 0) - Number(gastos.total_mensal || 0))}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    renderCompras: function() {
        const container = document.getElementById('page-compras');
        const comprasData = dadosGlobais.compras || [];
        const totalInvestido = comprasData.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">🛒 Compra de Carros</h1>
                    <p class="page-subtitle">Investimentos e aquisições da frota</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge success">
                        <span class="stat-value">${comprasData.length}</span>
                        <span class="stat-label">Carros</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-value">${formatarMoeda(totalInvestido)}</span>
                        <span class="stat-label">Investido</span>
                    </div>
                </div>
            </div>
            <div class="compras-grid">
                ${comprasData.map(carro => {
                    carro.titulo = carro.titulo || 'Carro sem título';
                    carro.itens = carro.itens || [];
                    return this.criarCardCompra(carro);
                }).join('')}
            </div>
        `;
    },
    
    criarCardCompra: function(carro) {
        const placaMatch = carro.titulo.match(/([A-Z]{3}\d{1}[A-Z0-9]{1}\d{2}|[A-Z]{3}\d{4})/);
        const placa = placaMatch ? placaMatch[0] : '';
        const totalCarro = Number(carro.total) || 0;
        
        return `
            <div class="compra-card">
                <div class="compra-header">
                    <div class="compra-titulo">${carro.titulo.replace('🚗', '').trim()}</div>
                    ${placa ? `<div class="compra-placa">${placa}</div>` : ''}
                </div>
                <div class="compra-total">
                    <div class="total-label">Investimento Total</div>
                    <div class="total-valor">${formatarMoeda(totalCarro)}</div>
                </div>
            </div>
        `;
    },
    
    renderManutencoes: function() {
        const container = document.getElementById('page-manutencoes');
        const totalGasto = dadosGlobais.manutencao.reduce((sum, m) => sum + (Number(m.total_gasto) || 0), 0);
        const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + (Number(m.num_servicos) || 0), 0);
        
        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">🔧 Manutenções</h1>
                    <p class="page-subtitle">Histórico de serviços realizados</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge danger"><span class="stat-value">${formatarMoeda(totalGasto)}</span><span class="stat-label">Total Gasto</span></div>
                    <div class="stat-badge"><span class="stat-value">${totalServicos}</span><span class="stat-label">Serviços</span></div>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Placa</th><th>Modelo</th><th>Motorista</th><th>Nº Serviços</th><th>Total Gasto</th></tr></thead>
                    <tbody>
                        ${dadosGlobais.manutencao.sort((a, b) => (Number(b.total_gasto) || 0) - (Number(a.total_gasto) || 0)).map(m => `
                            <tr>
                                <td><strong>${m.placa || '-'}</strong></td>
                                <td>${m.modelo || '-'}</td>
                                <td>${m.motorista || '-'}</td>
                                <td>${m.num_servicos || 0}</td>
                                <td class="danger">${formatarMoeda(m.total_gasto || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    // AGORA TEMOS A PÁGINA DE RECEITAS!
    renderReceitas: function() {
        const container = document.getElementById('page-receitas');
        const veiculos = dadosGlobais.veiculos || [];
        const totalReceita = veiculos.reduce((sum, v) => sum + (Number(v.aluguel_mensal) || 0), 0);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">💰 Receitas</h1>
                    <p class="page-subtitle">Receitas geradas pelos aluguéis da frota</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge success">
                        <span class="stat-value">${formatarMoeda(totalReceita)}</span>
                        <span class="stat-label">Receita Total Estimada</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Modelo</th>
                            <th>Motorista</th>
                            <th>Status</th>
                            <th class="text-right">Aluguel Mensal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${veiculos.sort((a,b) => (Number(b.aluguel_mensal)||0) - (Number(a.aluguel_mensal)||0)).map(v => `
                            <tr>
                                <td><strong>${v.placa || '-'}</strong></td>
                                <td>${v.modelo || '-'}</td>
                                <td>${v.motorista || '-'}</td>
                                <td><span class="status-badge ${String(v.status).toLowerCase() === 'ativo' ? 'success' : 'inactive'}">${v.status || '-'}</span></td>
                                <td class="text-right" style="color: var(--success); font-weight: bold;">${formatarMoeda(v.aluguel_mensal || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    // AGORA TEMOS A PÁGINA DE GASTOS!
    renderGastos: function() {
        const container = document.getElementById('page-gastos');
        const gastos = dadosGlobais.gastos || [];
        const totalGastos = gastos.reduce((sum, g) => sum + (Number(g.total_mensal) || 0), 0);

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">💸 Gastos</h1>
                    <p class="page-subtitle">Despesas fixas e variáveis</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge danger">
                        <span class="stat-value">${formatarMoeda(totalGastos)}</span>
                        <span class="stat-label">Total de Gastos</span>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Modelo</th>
                            <th class="text-right">Gasto Mensal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gastos.sort((a,b) => (Number(b.total_mensal)||0) - (Number(a.total_mensal)||0)).map(g => `
                            <tr>
                                <td><strong>${g.placa || '-'}</strong></td>
                                <td>${g.modelo || '-'}</td>
                                <td class="text-right danger"><strong>${formatarMoeda(g.total_mensal || 0)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

function carregarPagina(page) { Pages.carregar(page); }
