# 🚗 Fleet Manager — Dashboard de Gestão de Frota

Fleet Manager é um dashboard interativo desenvolvido para análise e gerenciamento de frotas de veículos, focado em transformar dados brutos em informações visuais claras e úteis para tomada de decisão. O sistema permite acompanhar receitas, custos, desempenho da frota e indicadores-chave de forma simples e eficiente, diretamente no navegador.

🔗 Acesse o projeto: https://eduudiass.github.io/dashboard-frota-eduardo/

O sistema funciona 100% no front-end, sem necessidade de backend, utilizando JavaScript puro, leitura de arquivos Excel e gráficos dinâmicos.

## 📊 Funcionalidades

- Dashboard com indicadores principais (KPIs)
- Visualização de receita mensal, gastos e lucro
- Gráficos dinâmicos com Chart.js
- Upload de planilhas Excel (.xlsx)
- Atualização instantânea dos dados
- Navegação entre páginas (Dashboard, Veículos, Manutenção, Gastos)
- Interface responsiva e moderna

## 🧠 Como funciona

O fluxo do sistema é simples e eficiente:

Excel (.xlsx) → Processamento com SheetJS → Conversão para objeto JavaScript → Renderização no DOM + gráficos

O sistema também pode carregar dados automaticamente via `dados.json`, evitando problemas de cache com um sistema de atualização forçada.

## 📁 Estrutura do Projeto

- index.html → estrutura principal do sistema
- style.css → estilização visual
- app.js → lógica completa do dashboard
- pages.js → controle de navegação entre páginas
- dados.json → base de dados padrão

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Chart.js
- SheetJS (XLSX)
- GitHub Pages (deploy)

## 📤 Como usar

1. Acesse o site pelo link do GitHub Pages
2. Clique em "Atualizar Dados"
3. Selecione um arquivo Excel (.xlsx)
4. O sistema processa automaticamente e atualiza o dashboard

Também é possível atualizar os dados manualmente editando o arquivo `dados.json`.

## 📌 Formato da planilha

Para melhor funcionamento, a planilha deve conter colunas como:

- placa
- aluguel_mensal
- km_atual
- manutencao (opcional)
- combustivel (opcional)
- gastos (opcional)

Exemplo:

| placa | aluguel_mensal | km_atual |
|------|----------------|----------|
| ABC1234 | 2500 | 120000 |
| XYZ5678 | 1800 | 98000 |

## ⚠️ Limitações atuais

- Não possui backend
- Dados não são persistidos
- Upload de Excel não salva permanentemente
- Alguns dados são simulados caso não existam na planilha

## 🔮 Melhorias futuras

- Integração com banco de dados
- Persistência de dados
- Filtros avançados e busca
- Exportação de relatórios
- Atualização em tempo real
- Análise preditiva com IA

## 👨‍💻 Autor

Eduardo Dias  
Estudante de Ciência de Dados e Inteligência Artificial

## 📄 Licença

Projeto open-source para fins educacionais.

## ⭐ Considerações finais

Este projeto representa a construção de uma solução prática de análise de dados aplicada, saindo do nível teórico para um sistema funcional. É um passo importante na evolução para projetos mais complexos e profissionais dentro da área de dados.
