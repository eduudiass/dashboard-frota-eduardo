# 🚗 FleetManager — Dashboard de Gestão de Frota

Dashboard profissional para gestão e acompanhamento de uma frota de veículos de aluguel, com visualização de receitas, manutenções, gastos fixos, compras e vendas.

**🔗 [Acessar Dashboard](https://eduudiass.github.io/dashboard-frota-eduardo/)**

---

## 📊 Funcionalidades

- **Dashboard Geral** — KPIs de receita, manutenção, gastos e lucro com gráficos interativos
- **Veículos** — Cards individuais com busca e filtros por status, modelo e motorista
- **Manutenções** — Resumo por veículo e registros detalhados de cada serviço
- **Receitas** — Tabela mensal de aluguéis recebidos com percentual de recebimento
- **Gastos Fixos** — Seguro, IPVA, licenciamento e combustível por veículo
- **Compras** — Custos de aquisição e reforma detalhados por carro
- **Vendas** — Controle de vendas com cálculo de lucro e margem

## 🛠️ Stack

- **Frontend:** HTML, CSS, JavaScript puro
- **Gráficos:** Chart.js
- **Dados:** JSON gerado via Python (openpyxl)
- **Hospedagem:** GitHub Pages
- **Fonte de dados:** Planilha Excel (.xlsx)

## 📁 Estrutura

```
dashboard-frota-eduardo/
├── index.html          → Página principal
├── app.js              → Lógica core e gráficos
├── pages.js            → Renderização das páginas
├── style.css           → Tema dark customizado
├── dados.json          → Dados extraídos da planilha
├── atualizar.py        → Script de extração de dados
└── ATUALIZAR_SITE.bat  → Atalho para atualizar com duplo clique
```

## 🔄 Como Atualizar os Dados

1. Editar e salvar a planilha `Gestao_Frota_Atual.xlsx`
2. **Fechar a planilha no Excel**
3. Duplo clique no `ATUALIZAR_SITE.bat`
4. Pressionar Enter quando solicitado
5. Aguardar 1-2 minutos para o GitHub Pages atualizar

## 👤 Autor

**Eduardo Dias** — Estudante de Data Science & AI na PUCRS

[![GitHub](https://img.shields.io/badge/GitHub-eduudiass-181717?style=flat&logo=github)](https://github.com/eduudiass)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Eduardo_Dias-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/eduudiass)
