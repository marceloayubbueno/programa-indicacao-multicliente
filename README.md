# Sistema de Programa de Indicação

Sistema web para gerenciamento de programas de indicação de clientes.

> **Para entender os conceitos, papéis, fluxos e funcionamento detalhado do sistema, consulte o documento principal de referência conceitual:**
> 
> [docs/resumo_do_software.md](docs/resumo_do_software.md)

## Estrutura do Projeto

```
├── admin/                 # Área Administrativa
│   ├── css/              # Arquivos CSS da área administrativa
│   ├── js/               # Arquivos JavaScript da área administrativa
│   └── pages/            # Páginas HTML da área administrativa
├── client/               # Área do Cliente
│   ├── css/              # Arquivos CSS da área do cliente
│   ├── js/               # Arquivos JavaScript da área do cliente
│   └── pages/            # Páginas HTML da área do cliente
└── shared/               # Recursos compartilhados
    ├── css/              # CSS compartilhado
    ├── js/               # JavaScript compartilhado
    └── assets/           # Imagens e outros recursos
```

## Funcionalidades Principais

### Área Administrativa
- Gerenciamento de empresas, planos, campanhas, usuários e métricas globais
- Dashboard administrativo
- Gestão de configurações gerais

### Área do Cliente
- Dashboard com métricas de campanhas
- Gestão de campanhas de indicação
- Gerenciamento de participantes e indicadores
- Controle de indicações
- Configuração de recompensas
- Integrações e configurações gerais

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=nome_do_banco

# Configurações JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=1d

# Configurações do Servidor
PORT=3000
NODE_ENV=development 
