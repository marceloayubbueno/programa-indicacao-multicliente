# Como funciona o frontend

> **Atenção:** Para integração correta com o backend, consulte sempre o documento [Padronização de Dados – Contratos Frontend/Backend](./padroes-dados.md) para contratos, exemplos e convenções.

O frontend do Programa de Indicação é dividido em duas áreas:

- **Área do Cliente (client/):** Interface para empresas (Clientes) gerenciarem suas campanhas, participantes, indicadores e indicações. Utiliza HTML, CSS e JavaScript puro. Os dados são obtidos via requisições à API backend.
- **Área Administrativa (admin/):** Interface para Administradores gerenciarem usuários, clientes, planos e campanhas globais. Também utiliza HTML, CSS e JavaScript puro, com integração direta à API backend.

Ambas as áreas utilizam Chart.js para exibição de gráficos e Font Awesome para ícones. Não há uso de frameworks modernos (React, Vue, Angular). O roteamento é feito via navegação entre páginas HTML e controle de acesso por scripts JS. 