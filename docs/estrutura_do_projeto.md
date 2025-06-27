# Estrutura do Projeto

O projeto está organizado em múltiplos diretórios e arquivos, cada um com uma responsabilidade clara e bem definida. Abaixo, apresento a estrutura detalhada e o papel de cada componente.

```
├── admin/                  # Área Administrativa (HTML, CSS, JS)
│   ├── css/               # Estilos da área administrativa
│   ├── js/                # Scripts da área administrativa
│   └── pages/             # Páginas HTML da área administrativa
├── client/                 # Área do Cliente (HTML, CSS, JS)
│   ├── css/               # Estilos da área do Cliente
│   ├── js/                # Scripts da área do Cliente
│   └── pages/             # Páginas HTML da área do Cliente
├── server/                 # Backend (Express + NestJS)
│   ├── src/               # Código-fonte principal (NestJS)
│   │   ├── auth/          # Autenticação e autorização
│   │   ├── admins/        # Administradores do sistema
│   │   ├── clients/       # Empresas (Clientes) que utilizam o sistema
│   │   ├── campaigns/     # Campanhas criadas pelos Clientes
│   │   ├── forms/         # Formulários
│   │   ├── referrals/     # Indicações (leads gerados por Indicadores)
│   │   ├── rewards/       # Recompensas
│   │   ├── scripts/       # Scripts utilitários
│   │   ├── config/        # Configurações (ex: TypeORM)
│   │   ├── migrations/    # Migrações de banco de dados
│   │   ├── common/        # Utilitários e helpers
│   │   └── ...            # Outros módulos
│   ├── routes/            # Rotas Express (client, plano, lista)
│   ├── controllers/       # Controllers Express
│   ├── models/            # Modelos de dados (Mongoose)
│   ├── middleware/        # Middlewares Express
│   ├── config/            # Configurações Express/Mongoose
│   ├── utils/             # Utilitários (ex: envio de e-mail)
│   ├── dist/              # Build do NestJS
│   ├── test/              # Testes automatizados
│   ├── campaignscd/       # Módulo adicional de campanhas
│   ├── serve/             # Scripts/infraestrutura
│   ├── server.js          # Inicialização Express
│   ├── package.json       # Dependências backend
│   ├── tsconfig.json      # Configuração TypeScript
│   └── ...                # Outros arquivos de configuração
├── docs/                   # Documentação detalhada do projeto
│   ├── promptify-project-overview.md # Visão geral centralizada
│   ├── prompts.md         # Prompts para IA e automação
│   ├── arquitetura.md     # Arquitetura do sistema
│   ├── como_funciona_o_backend.md
│   ├── como_funciona_o_frontend.md
│   ├── estrutura_do_projeto.md
│   ├── plataforma_do_backend.md
│   ├── quais_frameworks.md
│   ├── quais_bibliotecas.md
│   ├── resumo_do_software.md
│   ├── contexto_do_projeto.md
│   └── ...                # Outros arquivos e subpastas (api, requisitos, diagramas, decisões)
├── planos.json             # Configuração dos planos disponíveis
├── package.json            # Dependências globais do projeto
├── README.md               # Visão geral e instruções iniciais
└── ...                     # Outros arquivos de configuração (.vscode, .prettierrc, etc.)
```

## Observações Importantes
- O backend utiliza **duas abordagens**: uma estrutura moderna com NestJS (em `server/src/`) e uma estrutura Express tradicional (rotas, controllers, models, etc.), coexistindo para atender diferentes necessidades do sistema.
- A documentação do projeto está centralizada em `docs/`, com arquivos para overview, prompts de IA, arquitetura, funcionamento, requisitos, API, decisões técnicas e mais.
- Arquivos de configuração e scripts utilitários estão distribuídos conforme a responsabilidade (TypeScript, lint, build, banco de dados, etc.).
- O arquivo `planos.json` define os planos de serviço disponíveis para Clientes.

Essa estrutura foi pensada para facilitar a escalabilidade, manutenção, colaboração e integração com ferramentas de automação e IA. 