# FleetManager — Dashboard de Gestão de Frota

Dashboard para acompanhamento de uma frota de veículos de aluguel. Desenvolvido para uso real no negócio da família, cobre receitas, manutenções, gastos fixos, compras e vendas em uma única página interativa.

**[Acessar Dashboard](https://eduudiass.github.io/dashboard-frota-eduardo/)**

## Sobre

O dashboard centraliza todas as informações da frota em uma única página. Os dados são extraídos de uma planilha Excel via script Python e publicados automaticamente no GitHub Pages.

## Funcionalidades

- Dashboard geral com KPIs de receita, manutenção, gastos e lucro
- Cards individuais por veículo com busca e filtros por status, modelo e motorista
- Resumo de manutenções por veículo e histórico detalhado de cada serviço
- Tabela mensal de aluguéis com percentual de recebimento
- Controle de gastos fixos: seguro, IPVA, licenciamento e combustível
- Registro de compras com custo de aquisição e reforma por veículo
- Controle de vendas com cálculo de lucro e margem

## Tecnologias

- HTML, CSS, JavaScript puro
- Chart.js
- Python (openpyxl)
- GitHub Pages

## Estrutura do projeto

    dashboard-frota-eduardo/
    ├── index.html          → Página principal
    ├── app.js              → Lógica core e gráficos
    ├── pages.js            → Renderização das páginas
    ├── style.css           → Tema dark customizado
    ├── dados.json          → Dados extraídos da planilha
    ├── atualizar.py        → Script de extração de dados
    └── ATUALIZAR_SITE.bat  → Atalho para atualizar com duplo clique

## Como atualizar os dados

1. Editar e salvar a planilha `Gestao_Frota_Atual.xlsx`
2. Fechar a planilha no Excel
3. Duplo clique no `ATUALIZAR_SITE.bat`
4. Pressionar Enter quando solicitado
5. Aguardar 1-2 minutos para o GitHub Pages atualizar

## Conceitos praticados

- Manipulação de dados com Python e openpyxl
- Geração de JSON a partir de planilha Excel
- Visualização de dados com Chart.js
- Deploy estático via GitHub Pages

---

**Eduardo Dias** — Estudante de Data Science & AI na PUCRS

[![GitHub](https://img.shields.io/badge/GitHub-eduudiass-181717?style=flat&logo=github)](https://github.com/eduudiass)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Eduardo_Dias-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/eduardodiasds)
