/* ═══════════════════════════════════════════
   FleetManager — Page Renderers
   ═══════════════════════════════════════════ */

const Pages = {

    // ─── DASHBOARD ───
    dashboard() {
        const c = document.getElementById('page-dashboard');
        const r = D.resumo;
        const lucro = r.receita_mensal - r.gastos_fixos_mensal;

        c.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Dashboard Geral</h1>
                    <p class="page-subtitle">Visão completa da sua frota</p>
                </div>
                <div class="header-badges">
                    <div class="h-badge accent"><span class="val">${r.total_veiculos}</span><span class="lbl">Veículos</span></div>
                    <div class="h-badge green"><span class="val">${r.veiculos_ativos}</span><span class="lbl">Ativos</span></div>
                    <div class="h-badge red"><span class="val">${r.veiculos_inativos}</span><span class="lbl">Inativos</span></div>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card green">
                    <div class="kpi-icon green">💰</div>
                    <div>
                        <div class="kpi-label">Receita Mensal</div>
                        <div class="kpi-value" style="color:var(--green)">${fmt(r.receita_mensal)}</div>
                        <div class="kpi-sub">${fmt(r.media_por_carro)}/carro</div>
                    </div>
                </div>
                <div class="kpi-card red">
                    <div class="kpi-icon red">🔧</div>
                    <div>
                        <div class="kpi-label">Manutenção Total</div>
                        <div class="kpi-value" style="color:var(--red)">${fmt(r.total_manutencao)}</div>
                        <div class="kpi-sub">${r.num_servicos} serviços</div>
                    </div>
                </div>
                <div class="kpi-card yellow">
                    <div class="kpi-icon yellow">💸</div>
                    <div>
                        <div class="kpi-label">Gastos Fixos/mês</div>
                        <div class="kpi-value" style="color:var(--yellow)">${fmt(r.gastos_fixos_mensal)}</div>
                        <div class="kpi-sub">Combustível: ${fmt(r.total_combustivel_mes)}</div>
                    </div>
                </div>
                <div class="kpi-card ${lucro >= 0 ? 'green' : 'red'}">
                    <div class="kpi-icon ${lucro >= 0 ? 'green' : 'red'}">${lucro >= 0 ? '📈' : '📉'}</div>
                    <div>
                        <div class="kpi-label">Lucro Mensal</div>
                        <div class="kpi-value" style="color:var(--${lucro >= 0 ? 'green' : 'red'})">${fmt(lucro)}</div>
                        <div class="kpi-sub ${lucro >= 0 ? 'positive' : 'negative'}">${lucro >= 0 ? 'Positivo' : 'Negativo'}</div>
                    </div>
                </div>
            </div>

            <div class="charts-row">
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">📊</span> Receita por Veículo</div>
                    <canvas id="chReceita"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">🔧</span> Manutenção por Veículo</div>
                    <canvas id="chManut"></canvas>
                </div>
            </div>

            <div class="charts-row">
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">🚗</span> Status da Frota</div>
                    <canvas id="chStatus" style="max-height:260px"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">🏷️</span> Distribuição por Modelo</div>
                    <canvas id="chModelos" style="max-height:260px"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">💵</span> Gastos Fixos por Veículo</div>
                    <canvas id="chGastos"></canvas>
                </div>
            </div>

            <div class="quick-stats">
                <div class="qs-item"><div class="qs-icon">⛽</div><div><div class="qs-value">${fmt(r.total_combustivel_mes)}</div><div class="qs-label">Combustível/mês</div></div></div>
                <div class="qs-item"><div class="qs-icon">🛠️</div><div><div class="qs-value">${r.num_servicos}</div><div class="qs-label">Serviços realizados</div></div></div>
                <div class="qs-item"><div class="qs-icon">📍</div><div><div class="qs-value">${fmtNum(r.total_km)} km</div><div class="qs-label">KM total da frota</div></div></div>
                <div class="qs-item"><div class="qs-icon">💎</div><div><div class="qs-value">${fmt(r.total_investido_compras)}</div><div class="qs-label">Investido em compras</div></div></div>
            </div>
        `;

        // Charts
        const vSorted = [...D.veiculos].sort((a, b) => b.aluguel_mensal - a.aluguel_mensal);
        createBar('chReceita', 'receita', vSorted.map(v => v.placa), vSorted.map(v => v.aluguel_mensal), 'green');

        const mSorted = [...D.manutencao_resumo].filter(m => m.total_gasto > 0).sort((a, b) => b.total_gasto - a.total_gasto);
        createBar('chManut', 'manut', mSorted.map(m => m.placa), mSorted.map(m => m.total_gasto), 'red');

        // Status doughnut
        const ativos = D.veiculos.filter(v => v.status === 'Ativo').length;
        const inativos = D.veiculos.length - ativos;
        createDoughnut('chStatus', 'status', ['Ativos', 'Inativos'], [ativos, inativos], ['#10b981', '#ef4444']);

        // Modelos doughnut
        const modeloCount = {};
        D.veiculos.forEach(v => { modeloCount[v.modelo] = (modeloCount[v.modelo] || 0) + 1; });
        const mLabels = Object.keys(modeloCount);
        const mData = Object.values(modeloCount);
        const mColors = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        createDoughnut('chModelos', 'modelos', mLabels, mData, mColors.slice(0, mLabels.length));

        // Gastos bar
        const gSorted = [...D.gastos].filter(g => g.total_mensal > 0).sort((a, b) => b.total_mensal - a.total_mensal);
        createBar('chGastos', 'gastosBar', gSorted.map(g => g.placa), gSorted.map(g => g.total_mensal), 'yellow');
    },

    // ─── VEÍCULOS ───
    veiculos() {
        const c = document.getElementById('page-veiculos');
        const modelos = [...new Set(D.veiculos.map(v => v.modelo))];

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Gestão de Veículos</h1><p class="page-subtitle">Controle completo da frota</p></div>
                <div class="header-badges">
                    <div class="h-badge accent"><span class="val">${D.veiculos.length}</span><span class="lbl">Total</span></div>
                </div>
            </div>
            <div class="filter-bar">
                <input type="text" class="search-input" id="searchV" placeholder="Buscar placa, modelo ou motorista...">
                <select class="filter-select" id="filterStatus">
                    <option value="todos">Todos</option><option value="Ativo">Ativos</option><option value="Inativo">Inativos</option>
                </select>
                <select class="filter-select" id="filterModelo">
                    <option value="todos">Todos os Modelos</option>
                    ${modelos.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </div>
            <div class="v-grid" id="vGrid"></div>
        `;

        const render = () => {
            const search = (document.getElementById('searchV')?.value || '').toLowerCase();
            const sf = document.getElementById('filterStatus')?.value || 'todos';
            const mf = document.getElementById('filterModelo')?.value || 'todos';
            const filtered = D.veiculos.filter(v => {
                const ms = !search || v.placa.toLowerCase().includes(search) || v.modelo.toLowerCase().includes(search) || v.motorista.toLowerCase().includes(search);
                const ss = sf === 'todos' || v.status === sf;
                const mm = mf === 'todos' || v.modelo === mf;
                return ms && ss && mm;
            });
            document.getElementById('vGrid').innerHTML = filtered.map(v => {
                const m = D.manutencao_resumo.find(x => x.placa === v.placa) || { total_gasto: 0, num_servicos: 0 };
                const g = D.gastos.find(x => x.placa === v.placa) || { total_mensal: 0 };
                const statusCls = v.status === 'Ativo' ? 'ativo' : 'inativo';
                return `
                    <div class="v-card" data-placa="${v.placa}">
                        <div class="v-card-head">
                            <span class="v-placa">${v.placa}</span>
                            <span class="v-status ${statusCls}">${v.status}</span>
                        </div>
                        <div class="v-modelo">${v.modelo} ${v.ano}</div>
                        <div class="v-motorista">👤 ${v.motorista} ${v.cor ? '· ' + v.cor : ''}</div>
                        <div class="v-stats">
                            <div class="v-stat"><div class="v-stat-label">Aluguel</div><div class="v-stat-value" style="color:var(--green)">${fmt(v.aluguel_mensal)}</div></div>
                            <div class="v-stat"><div class="v-stat-label">Manutenção</div><div class="v-stat-value" style="color:var(--red)">${fmt(m.total_gasto)}</div></div>
                            <div class="v-stat"><div class="v-stat-label">Gastos Fixos</div><div class="v-stat-value" style="color:var(--yellow)">${fmt(g.total_mensal)}</div></div>
                            <div class="v-stat"><div class="v-stat-label">KM Atual</div><div class="v-stat-value">${fmtNum(v.km_atual)}</div></div>
                        </div>
                    </div>`;
            }).join('') || '<div class="empty-state"><div class="icon">🔍</div><h3>Nenhum veículo encontrado</h3></div>';
        };

        render();
        document.getElementById('searchV')?.addEventListener('input', render);
        document.getElementById('filterStatus')?.addEventListener('change', render);
        document.getElementById('filterModelo')?.addEventListener('change', render);
    },

    // ─── MANUTENÇÕES ───
    manutencoes() {
        const c = document.getElementById('page-manutencoes');
        const totalGasto = D.manutencao_resumo.reduce((s, m) => s + m.total_gasto, 0);
        const totalServ = D.manutencao_resumo.reduce((s, m) => s + m.num_servicos, 0);

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Manutenções</h1><p class="page-subtitle">Histórico e resumo de serviços</p></div>
                <div class="header-badges">
                    <div class="h-badge red"><span class="val">${fmt(totalGasto)}</span><span class="lbl">Total Gasto</span></div>
                    <div class="h-badge accent"><span class="val">${totalServ}</span><span class="lbl">Serviços</span></div>
                </div>
            </div>

            <div class="chart-card mb-20">
                <div class="chart-title"><span class="icon">📊</span> Gasto por Veículo</div>
                <canvas id="chManutPage"></canvas>
            </div>

            <h3 style="font-size:1rem;margin-bottom:14px;color:var(--text-secondary)">Resumo por Veículo</h3>
            <div class="table-wrap table-responsive mb-20">
                <table>
                    <thead><tr><th>Placa</th><th>Modelo</th><th>Motorista</th><th>Serviços</th><th>Total Gasto</th></tr></thead>
                    <tbody>
                        ${[...new Map(D.manutencao_resumo.map(m => [m.placa, m])).values()].sort((a, b) => b.total_gasto - a.total_gasto).map(m => `
                            <tr>
                                <td><strong class="text-accent">${m.placa}</strong></td>
                                <td>${m.modelo}</td>
                                <td>${m.motorista}</td>
                                <td class="mono">${m.num_servicos}</td>
                                <td class="mono ${m.total_gasto > 0 ? 'text-red' : 'text-muted'}">${fmt(m.total_gasto)}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            ${D.manutencao_registros.length > 0 ? `
            <h3 style="font-size:1rem;margin-bottom:14px;color:var(--text-secondary)">Registros Detalhados</h3>
            <div class="table-wrap table-responsive">
                <table>
                    <thead><tr><th>#</th><th>Data</th><th>Placa</th><th>Modelo</th><th>Tipo</th><th>Descrição</th><th>Oficina</th><th>Custo</th></tr></thead>
                    <tbody>
                        ${D.manutencao_registros.map(r => `
                            <tr>
                                <td class="text-muted">${r.numero}</td>
                                <td class="mono">${r.data}</td>
                                <td><strong class="text-accent">${r.placa}</strong></td>
                                <td>${r.modelo}</td>
                                <td>${r.tipo}</td>
                                <td>${r.descricao}</td>
                                <td>${r.oficina}</td>
                                <td class="mono text-red">${fmt(r.custo)}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        `;

        const mSorted = [...D.manutencao_resumo].filter(m => m.total_gasto > 0).sort((a, b) => b.total_gasto - a.total_gasto);
        createBar('chManutPage', 'manutPage', mSorted.map(m => m.placa), mSorted.map(m => m.total_gasto), 'red');
    },

    // ─── RECEITAS ───
    receitas() {
        const c = document.getElementById('page-receitas');
        const totalPrevisto = D.receitas.reduce((s, r) => s + r.aluguel_previsto, 0);
        const totalRecebido = D.receitas.reduce((s, r) => s + r.total_recebido, 0);
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

        // Check if any receita has data
        const hasData = D.receitas.some(r => r.total_recebido > 0);

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Receitas Mensais</h1><p class="page-subtitle">Acompanhamento de pagamentos recebidos</p></div>
                <div class="header-badges">
                    <div class="h-badge green"><span class="val">${fmt(totalPrevisto)}</span><span class="lbl">Previsto/mês</span></div>
                    <div class="h-badge ${totalRecebido > 0 ? 'accent' : ''}" ><span class="val">${fmt(totalRecebido)}</span><span class="lbl">Recebido no Ano</span></div>
                </div>
            </div>

            <div class="kpi-grid">
                ${D.receitas.slice().sort((a, b) => b.aluguel_mensal - a.aluguel_mensal).slice(0, 4).map(r => `
                    <div class="kpi-card accent">
                        <div class="kpi-icon accent">🚗</div>
                        <div>
                            <div class="kpi-label">${r.placa} — ${r.modelo}</div>
                            <div class="kpi-value" style="color:var(--green)">${fmt(r.aluguel_previsto)}<span style="font-size:.7rem;color:var(--text-muted)">/mês</span></div>
                            <div class="kpi-sub">${r.motorista}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="chart-card mb-20">
                <div class="chart-title"><span class="icon">📊</span> Aluguel Previsto por Veículo</div>
                <canvas id="chReceitaPage"></canvas>
            </div>

            <div class="table-wrap table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Placa</th><th>Modelo</th><th>Motorista</th><th>Previsto</th>
                            ${meses.map(m => `<th>${m.toUpperCase()}</th>`).join('')}
                            <th>Total</th><th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${D.receitas.map(r => {
            const pct = r.aluguel_previsto > 0 ? ((r.total_recebido / (r.aluguel_previsto * 12)) * 100).toFixed(0) : 0;
            return `<tr>
                                <td><strong class="text-accent">${r.placa}</strong></td>
                                <td>${r.modelo}</td>
                                <td>${r.motorista}</td>
                                <td class="mono">${fmt(r.aluguel_previsto)}</td>
                                ${meses.map(m => {
                const v = r.receitas_mensais[m] || 0;
                return `<td class="mono ${v > 0 ? 'text-green' : 'text-muted'}">${v > 0 ? fmt(v) : '—'}</td>`;
            }).join('')}
                                <td class="mono text-green"><strong>${fmt(r.total_recebido)}</strong></td>
                                <td class="mono ${pct >= 80 ? 'text-green' : pct >= 40 ? 'text-yellow' : 'text-muted'}">${pct}%</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>

            ${!hasData ? `
            <div style="margin-top:20px;padding:24px;background:var(--yellow-dim);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius);color:var(--yellow);">
                <strong>Nenhum pagamento registrado ainda.</strong> Preencha os valores mensais na aba "Receitas Mensais" da planilha e faça o upload novamente.
            </div>` : ''}
        `;

        const vSorted = [...D.receitas].sort((a, b) => b.aluguel_previsto - a.aluguel_previsto);
        createBar('chReceitaPage', 'receitaPage', vSorted.map(v => v.placa), vSorted.map(v => v.aluguel_previsto), 'green');
    },

    // ─── GASTOS ───
    gastos() {
        const c = document.getElementById('page-gastos');
        const totalMensal = D.gastos.reduce((s, g) => s + g.total_mensal, 0);
        const totalSeguro = D.gastos.reduce((s, g) => s + g.seguro_anual, 0);
        const totalIPVA = D.gastos.reduce((s, g) => s + g.ipva_anual, 0);
        const totalComb = D.gastos.reduce((s, g) => s + g.combustivel_mensal, 0);

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Gastos Fixos</h1><p class="page-subtitle">Despesas recorrentes da frota</p></div>
                <div class="header-badges">
                    <div class="h-badge red"><span class="val">${fmt(totalMensal)}</span><span class="lbl">Total/mês</span></div>
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card yellow">
                    <div class="kpi-icon yellow">🛡️</div>
                    <div><div class="kpi-label">Seguro (Anual)</div><div class="kpi-value">${fmt(totalSeguro)}</div><div class="kpi-sub">${fmt(totalSeguro / 12)}/mês</div></div>
                </div>
                <div class="kpi-card purple">
                    <div class="kpi-icon purple">📄</div>
                    <div><div class="kpi-label">IPVA (Anual)</div><div class="kpi-value">${fmt(totalIPVA)}</div><div class="kpi-sub">${fmt(totalIPVA / 12)}/mês</div></div>
                </div>
                <div class="kpi-card red">
                    <div class="kpi-icon red">⛽</div>
                    <div><div class="kpi-label">Combustível</div><div class="kpi-value">${fmt(totalComb)}</div><div class="kpi-sub">por mês</div></div>
                </div>
            </div>

            <div class="chart-card mb-20">
                <div class="chart-title"><span class="icon">📊</span> Gasto Mensal por Veículo</div>
                <canvas id="chGastosPage"></canvas>
            </div>

            <div class="table-wrap table-responsive">
                <table>
                    <thead><tr><th>Placa</th><th>Modelo</th><th>Motorista</th><th>Seguro/mês</th><th>IPVA/mês</th><th>Licenc./mês</th><th>Combustível</th><th>Total Mensal</th></tr></thead>
                    <tbody>
                        ${D.gastos.sort((a, b) => b.total_mensal - a.total_mensal).map(g => `
                            <tr>
                                <td><strong class="text-accent">${g.placa}</strong></td>
                                <td>${g.modelo}</td>
                                <td>${g.motorista}</td>
                                <td class="mono">${fmt(g.seguro_anual / 12)}</td>
                                <td class="mono">${fmt(g.ipva_anual / 12)}</td>
                                <td class="mono">${fmt(g.licenciamento / 12)}</td>
                                <td class="mono">${g.combustivel_mensal > 0 ? fmt(g.combustivel_mensal) : '<span class="text-muted">—</span>'}</td>
                                <td class="mono ${g.total_mensal > 0 ? 'text-red' : 'text-muted'}"><strong>${fmt(g.total_mensal)}</strong></td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const gSorted = [...D.gastos].filter(g => g.total_mensal > 0).sort((a, b) => b.total_mensal - a.total_mensal);
        createBar('chGastosPage', 'gastosPage', gSorted.map(g => g.placa), gSorted.map(g => g.total_mensal), 'yellow');
    },

    // ─── COMPRAS ───
    compras() {
        const c = document.getElementById('page-compras');
        const totalInvest = D.compras.reduce((s, cp) => s + cp.total, 0);
        const totalItens = D.compras.reduce((s, cp) => s + cp.itens.length, 0);

        if (D.compras.length === 0 || (D.compras.length > 0 && totalItens === 0)) {
            c.innerHTML = `
                <div class="page-header"><div><h1 class="page-title">Compra de Carros</h1><p class="page-subtitle">Custos de aquisição e reforma</p></div></div>
                <div class="empty-state"><div class="icon">🛒</div><h3>Nenhuma compra registrada</h3><p>Preencha a aba "🚗 Compra de Carros" na planilha e faça o upload.</p></div>
            `;
            return;
        }

        // Build category breakdown
        const catTotals = {};
        D.compras.forEach(cp => cp.itens.forEach(it => {
            if (it.categoria) catTotals[it.categoria] = (catTotals[it.categoria] || 0) + it.valor;
        }));

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Compra de Carros</h1><p class="page-subtitle">Custos de aquisição e reforma</p></div>
                <div class="header-badges">
                    <div class="h-badge red"><span class="val">${fmt(totalInvest)}</span><span class="lbl">Total Investido</span></div>
                    <div class="h-badge accent"><span class="val">${totalItens}</span><span class="lbl">Itens</span></div>
                </div>
            </div>

            <div class="charts-row mb-20">
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">📊</span> Investimento por Carro</div>
                    <canvas id="chComprasCarro"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-title"><span class="icon">🏷️</span> Gastos por Categoria</div>
                    <canvas id="chComprasCat" style="max-height:260px"></canvas>
                </div>
            </div>

            ${D.compras.filter(cp => cp.itens.length > 0).map(cp => `
                <div class="compra-block">
                    <div class="compra-header">
                        <h3>${cp.titulo}</h3>
                        <span class="compra-total">${fmt(cp.total)}</span>
                    </div>
                    <div class="compra-body">
                        <table>
                            <thead><tr><th>#</th><th>Data</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Obs</th></tr></thead>
                            <tbody>
                                ${cp.itens.map(it => `
                                    <tr>
                                        <td class="text-muted">${it.numero}</td>
                                        <td class="mono">${it.data}</td>
                                        <td>${it.categoria}</td>
                                        <td>${it.descricao}</td>
                                        <td class="mono text-red">${fmt(it.valor)}</td>
                                        <td class="text-muted">${it.observacao}</td>
                                    </tr>`).join('')}
                                <tr style="background:rgba(0,0,0,0.2)">
                                    <td colspan="4" style="text-align:right;font-weight:700">TOTAL</td>
                                    <td class="mono text-accent" style="font-weight:700">${fmt(cp.total)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `).join('')}
        `;

        // Charts
        const cpWithData = D.compras.filter(cp => cp.total > 0);
        const cpLabels = cpWithData.map(cp => {
            const m = cp.titulo.match(/[A-Z]{2,}/g);
            return m ? m.join(' ') : cp.titulo.substring(0, 20);
        });
        createBar('chComprasCarro', 'comprasCarro', cpLabels, cpWithData.map(cp => cp.total), 'red');

        const catLabels = Object.keys(catTotals);
        const catData = Object.values(catTotals);
        const catColors = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a78bfa'];
        createDoughnut('chComprasCat', 'comprasCat', catLabels, catData, catColors.slice(0, catLabels.length));
    },

    // ─── VENDAS ───
    vendas() {
        const c = document.getElementById('page-vendas');
        const vr = D.vendas_resumo || {};
        const regs = D.vendas_registros || [];

        const hasData = regs.length > 0 && regs.some(r => r.placa);

        c.innerHTML = `
            <div class="page-header">
                <div><h1 class="page-title">Vendas de Veículos</h1><p class="page-subtitle">Controle de vendas e lucros</p></div>
                ${vr.carros_vendidos > 0 ? `
                <div class="header-badges">
                    <div class="h-badge accent"><span class="val">${vr.carros_vendidos}</span><span class="lbl">Vendidos</span></div>
                    <div class="h-badge green"><span class="val">${fmt(vr.lucro_total)}</span><span class="lbl">Lucro Total</span></div>
                </div>` : ''}
            </div>

            ${vr.carros_vendidos > 0 ? `
            <div class="kpi-grid">
                <div class="kpi-card accent">
                    <div class="kpi-icon accent">🚗</div>
                    <div><div class="kpi-label">Carros Vendidos</div><div class="kpi-value">${vr.carros_vendidos}</div></div>
                </div>
                <div class="kpi-card green">
                    <div class="kpi-icon green">💰</div>
                    <div><div class="kpi-label">Total Arrecadado</div><div class="kpi-value">${fmt(vr.total_arrecadado)}</div></div>
                </div>
                <div class="kpi-card red">
                    <div class="kpi-icon red">💸</div>
                    <div><div class="kpi-label">Total Investido</div><div class="kpi-value">${fmt(vr.total_investido)}</div></div>
                </div>
                <div class="kpi-card ${vr.lucro_total >= 0 ? 'green' : 'red'}">
                    <div class="kpi-icon ${vr.lucro_total >= 0 ? 'green' : 'red'}">📈</div>
                    <div><div class="kpi-label">Lucro Médio/Carro</div><div class="kpi-value">${fmt(vr.lucro_medio)}</div></div>
                </div>
            </div>` : ''}

            ${hasData ? `
            <div class="table-wrap table-responsive">
                <table>
                    <thead><tr><th>#</th><th>Data</th><th>Placa</th><th>Modelo</th><th>Compra</th><th>Mecânica</th><th>Venda</th><th>Custo Total</th><th>Lucro</th><th>Margem</th></tr></thead>
                    <tbody>
                        ${regs.filter(r => r.placa).map(r => `
                            <tr>
                                <td class="text-muted">${r.numero}</td>
                                <td class="mono">${r.data_venda}</td>
                                <td><strong class="text-accent">${r.placa}</strong></td>
                                <td>${r.modelo}</td>
                                <td class="mono">${fmt(r.preco_compra)}</td>
                                <td class="mono">${fmt(r.gastos_mecanica)}</td>
                                <td class="mono text-green">${fmt(r.valor_venda)}</td>
                                <td class="mono text-red">${fmt(r.custo_total)}</td>
                                <td class="mono ${r.lucro >= 0 ? 'text-green' : 'text-red'}"><strong>${fmt(r.lucro)}</strong></td>
                                <td class="mono">${(r.margem * 100).toFixed(1)}%</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : `
            <div class="empty-state">
                <div class="icon">📦</div>
                <h3>Nenhuma venda registrada</h3>
                <p>Preencha a aba "🚗 Vendas" na planilha e faça o upload para ver os dados aqui.</p>
            </div>`}
        `;
    }
};