// Gerenciador de páginas
const Pages = {
    // Carregar página dinamicamente
    carregar: function(pageName) {
        switch(pageName) {
            case 'veiculos':
                this.renderVeiculos();
                break;
            case 'manutencoes':
                this.renderManutencoes();
                break;
            case 'receitas':
                this.renderReceitas();
                break;
            case 'gastos':
                this.renderGastos();
                break;
            case 'compras':
                this.renderCompras();
                break;
        }
    },
    
    // Página de Veículos
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
        
        // Preencher filtro de modelos
        const modelos = [...new Set(dadosGlobais.veiculos.map(v => v.modelo))];
        const filterModelo = document.getElementById('filterModelo');
        modelos.forEach(modelo => {
            if (modelo) {
                const option = document.createElement('option');
                option.value = modelo;
                option.textContent = modelo;
                filterModelo.appendChild(option);
            }
        });
        
        // Renderizar cards de veículos
        this.renderVeiculosGrid();
        
        // Configurar eventos de filtro
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
                v.placa.toLowerCase().includes(search) ||
                v.modelo.toLowerCase().includes(search) ||
                v.motorista.toLowerCase().includes(search);
            
            const matchStatus = statusFilter === 'todos' || v.status === statusFilter;
            const matchModelo = modeloFilter === 'todos' || v.modelo === modeloFilter;
            
            return matchSearch && matchStatus && matchModelo;
        });
        
        grid.innerHTML = veiculos.map(v => this.criarCardVeiculo(v)).join('');
        
        // Adicionar eventos de clique
        grid.querySelectorAll('.veiculo-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.abrirDetalhesVeiculo(veiculos[index]);
            });
        });
    },
    
    criarCardVeiculo: function(v) {
        const manutencao = dadosGlobais.manutencao.find(m => m.placa === v.placa) || { total_gasto: 0, num_servicos: 0 };
        const statusClass = v.status === 'Ativo' ? 'success' : 'inactive';
        
        return `
            <div class="veiculo-card" data-placa="${v.placa}">
                <div class="veiculo-header">
                    <div class="veiculo-placa">${v.placa}</div>
                    <div class="status-badge ${statusClass}">${v.status}</div>
                </div>
                <div class="veiculo-modelo">${v.modelo} ${v.ano}</div>
                <div class="veiculo-motorista">
                    <span class="label">👤</span> ${v.motorista}
                </div>
                <div class="veiculo-stats">
                    <div class="veiculo-stat">
                        <span class="stat-icon">💰</span>
                        <div>
                            <div class="stat-value">${formatarMoeda(v.aluguel_mensal)}</div>
                            <div class="stat-label">Aluguel/mês</div>
                        </div>
                    </div>
                    <div class="veiculo-stat">
                        <span class="stat-icon">🔧</span>
                        <div>
                            <div class="stat-value">${formatarMoeda(manutencao.total_gasto)}</div>
                            <div class="stat-label">${manutencao.num_servicos} serviços</div>
                        </div>
                    </div>
                </div>
                <div class="veiculo-km">
                    📍 ${v.km_atual.toLocaleString('pt-BR')} km
                </div>
            </div>
        `;
    },
    
    abrirDetalhesVeiculo: function(veiculo) {
        // Modal com detalhes completos do veículo
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'modalDetalhes';
        
        const manutencao = dadosGlobais.manutencao.find(m => m.placa === veiculo.placa) || {};
        const gastos = dadosGlobais.gastos.find(g => g.placa === veiculo.placa) || {};
        const receitas = dadosGlobais.receitas.find(r => r.placa === veiculo.placa) || {};
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <div>
                        <h3>🚗 ${veiculo.modelo} - ${veiculo.placa}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">
                            Motorista: ${veiculo.motorista}
                        </p>
                    </div>
                    <button class="modal-close" onclick="document.getElementById('modalDetalhes').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detalhes-grid">
                        <!-- Info básica -->
                        <div class="detalhe-section">
                            <h4>📋 Informações Básicas</h4>
                            <div class="info-list">
                                <div class="info-item">
                                    <span class="info-label">Placa:</span>
                                    <span class="info-value">${veiculo.placa}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Modelo:</span>
                                    <span class="info-value">${veiculo.modelo}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Ano:</span>
                                    <span class="info-value">${veiculo.ano}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Cor:</span>
                                    <span class="info-value">${veiculo.cor}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">KM Atual:</span>
                                    <span class="info-value">${veiculo.km_atual.toLocaleString('pt-BR')} km</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Status:</span>
                                    <span class="status-badge ${veiculo.status === 'Ativo' ? 'success' : 'inactive'}">${veiculo.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Financeiro -->
                        <div class="detalhe-section">
                            <h4>💰 Financeiro</h4>
                            <div class="financial-cards">
                                <div class="mini-card success">
                                    <div class="mini-label">Aluguel Mensal</div>
                                    <div class="mini-value">${formatarMoeda(veiculo.aluguel_mensal)}</div>
                                </div>
                                <div class="mini-card danger">
                                    <div class="mini-label">Gastos Mensais</div>
                                    <div class="mini-value">${formatarMoeda(gastos.total_mensal || 0)}</div>
                                </div>
                                <div class="mini-card ${(veiculo.aluguel_mensal - (gastos.total_mensal || 0)) > 0 ? 'success' : 'danger'}">
                                    <div class="mini-label">Lucro Mensal</div>
                                    <div class="mini-value">${formatarMoeda(veiculo.aluguel_mensal - (gastos.total_mensal || 0))}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Manutenção -->
                        <div class="detalhe-section full-width">
                            <h4>🔧 Histórico de Manutenção</h4>
                            <div class="info-list">
                                <div class="info-item">
                                    <span class="info-label">Total de Serviços:</span>
                                    <span class="info-value">${manutencao.num_servicos || 0}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Total Gasto:</span>
                                    <span class="info-value danger">${formatarMoeda(manutencao.total_gasto || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Página de Compras (ESPECIAL!)
    renderCompras: function() {
        const container = document.getElementById('page-compras');
        
        const totalInvestido = dadosGlobais.compras.reduce((sum, c) => sum + c.total, 0);
        const numCarros = dadosGlobais.compras.length;
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">🛒 Compra de Carros</h1>
                    <p class="page-subtitle">Investimentos e aquisições da frota</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge success">
                        <span class="stat-value">${numCarros}</span>
                        <span class="stat-label">Carros</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-value">${formatarMoeda(totalInvestido)}</span>
                        <span class="stat-label">Investido</span>
                    </div>
                </div>
            </div>
            
            <div class="compras-grid">
                ${dadosGlobais.compras.map(carro => this.criarCardCompra(carro)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    criarCardCompra: function(carro) {
        // Extrair placa do título
        const placaMatch = carro.titulo.match(/([A-Z]{3}\d{1}[A-Z0-9]{1}\d{2}|[A-Z]{3}\d{4})/);
        const placa = placaMatch ? placaMatch[0] : '';
        
        // Agrupar gastos por categoria
        const categorias = {};
        carro.itens.forEach(item => {
            const cat = item.categoria || 'OUTROS';
            if (!categorias[cat]) {
                categorias[cat] = { valor: 0, itens: [] };
            }
            categorias[cat].valor += item.valor;
            categorias[cat].itens.push(item);
        });
        
        const categoriasHtml = Object.entries(categorias)
            .sort((a, b) => b[1].valor - a[1].valor)
            .map(([cat, data]) => `
                <div class="categoria-item">
                    <div class="categoria-header">
                        <span class="categoria-nome">${this.getCategoriaIcon(cat)} ${cat}</span>
                        <span class="categoria-valor">${formatarMoeda(data.valor)}</span>
                    </div>
                    <div class="categoria-bar">
                        <div class="categoria-fill" style="width: ${(data.valor / carro.total * 100).toFixed(1)}%"></div>
                    </div>
                </div>
            `).join('');
        
        // Calcular ROI se possível
        const veiculoInfo = dadosGlobais.veiculos.find(v => v.placa === placa);
        const receitaAnual = veiculoInfo ? veiculoInfo.aluguel_mensal * 12 : 0;
        const roi = receitaAnual > 0 ? ((receitaAnual / carro.total - 1) * 100).toFixed(1) : 0;
        const payback = carro.total > 0 && receitaAnual > 0 ? (carro.total / (receitaAnual / 12)).toFixed(1) : 0;
        
        return `
            <div class="compra-card">
                <div class="compra-header">
                    <div class="compra-titulo">
                        ${carro.titulo.replace('🚗', '').trim()}
                    </div>
                    ${placa ? `<div class="compra-placa">${placa}</div>` : ''}
                </div>
                
                <div class="compra-total">
                    <div class="total-label">Investimento Total</div>
                    <div class="total-valor">${formatarMoeda(carro.total)}</div>
                </div>
                
                <div class="compra-categorias">
                    ${categoriasHtml}
                </div>
                
                ${receitaAnual > 0 ? `
                    <div class="compra-roi">
                        <div class="roi-item">
                            <span class="roi-label">Receita Anual</span>
                            <span class="roi-value success">${formatarMoeda(receitaAnual)}</span>
                        </div>
                        <div class="roi-item">
                            <span class="roi-label">ROI Anual</span>
                            <span class="roi-value ${roi > 0 ? 'success' : 'danger'}">${roi}%</span>
                        </div>
                        <div class="roi-item">
                            <span class="roi-label">Payback</span>
                            <span class="roi-value">${payback} meses</span>
                        </div>
                    </div>
                ` : ''}
                
                <button class="btn-detalhes" onclick="Pages.verDetalhesCompra('${placa || carro.titulo}')">
                    Ver Detalhes →
                </button>
            </div>
        `;
    },
    
    getCategoriaIcon: function(categoria) {
        const icons = {
            'COMPRA': '🛒',
            'MECÂNICO': '🔧',
            'IPVA': '📄',
            'TRANSFERÊNCIA': '📝',
            'DESPACHANTE': '👔',
            'GUINCHO': '🚛',
            'PNEU': '⚫',
            'PEÇAS': '🔩',
            'COMISSÃO': '💼',
            'PLACA': '🏷️',
            'CERTIDÃO': '📋'
        };
        return icons[categoria] || '📌';
    },
    
    verDetalhesCompra: function(identificador) {
        const carro = dadosGlobais.compras.find(c => 
            c.titulo.includes(identificador) || c.titulo === identificador
        );
        
        if (!carro) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'modalCompraDetalhes';
        
        const itensHtml = carro.itens
            .sort((a, b) => new Date(a.data) - new Date(b.data))
            .map(item => `
                <tr>
                    <td>${new Date(item.data).toLocaleDateString('pt-BR')}</td>
                    <td>${this.getCategoriaIcon(item.categoria)} ${item.categoria}</td>
                    <td>${item.descricao}</td>
                    <td class="text-right">${formatarMoeda(item.valor)}</td>
                    <td class="text-muted">${item.observacao || '-'}</td>
                </tr>
            `).join('');
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${carro.titulo}</h3>
                    <button class="modal-close" onclick="document.getElementById('modalCompraDetalhes').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="compra-total-destaque">
                        <span>Total Investido:</span>
                        <span>${formatarMoeda(carro.total)}</span>
                    </div>
                    
                    <h4 style="margin: 24px 0 16px 0;">📋 Detalhamento de Custos</h4>
                    <div class="table-responsive">
                        <table class="detalhes-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Categoria</th>
                                    <th>Descrição</th>
                                    <th class="text-right">Valor</th>
                                    <th>Observação</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itensHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Página de Manutenções
    renderManutencoes: function() {
        const container = document.getElementById('page-manutencoes');
        const totalGasto = dadosGlobais.manutencao.reduce((sum, m) => sum + m.total_gasto, 0);
        const totalServicos = dadosGlobais.manutencao.reduce((sum, m) => sum + m.num_servicos, 0);
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">🔧 Manutenções</h1>
                    <p class="page-subtitle">Histórico de serviços realizados</p>
                </div>
                <div class="header-stats">
                    <div class="stat-badge danger">
                        <span class="stat-value">${formatarMoeda(totalGasto)}</span>
                        <span class="stat-label">Total Gasto</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-value">${totalServicos}</span>
                        <span class="stat-label">Serviços</span>
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
                            <th>Nº Serviços</th>
                            <th>Total Gasto</th>
                            <th>Média/Serviço</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dadosGlobais.manutencao
                            .sort((a, b) => b.total_gasto - a.total_gasto)
                            .map(m => `
                                <tr>
                                    <td><strong>${m.placa}</strong></td>
                                    <td>${m.modelo}</td>
                                    <td>${m.motorista}</td>
                                    <td>${m.num_servicos}</td>
                                    <td class="danger">${formatarMoeda(m.total_gasto)}</td>
                                    <td>${formatarMoeda(m.num_servicos > 0 ? m.total_gasto / m.num_servicos : 0)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // Outras páginas (Receitas e Gastos) com estrutura similar...
    renderReceitas: function() {
        // Implementação similar às outras
        const container = document.getElementById('page-receitas');
        container.innerHTML = '<h1>Em desenvolvimento...</h1>';
    },
    
    renderGastos: function() {
        // Implementação similar às outras
        const container = document.getElementById('page-gastos');
        container.innerHTML = '<h1>Em desenvolvimento...</h1>';
    }
};

// Hook para carregar páginas
function carregarPagina(page) {
    Pages.carregar(page);
}
