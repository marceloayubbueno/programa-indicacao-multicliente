# Sistema de Programa de Indicação

Sistema web para gerenciamento de programas de indicação de clientes.

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

## Níveis de Acesso

1. **Clientes**: Empresas que contratam o sistema para gerenciar indicações
2. **Indicadores**: Clientes das empresas que indicam novos clientes
3. **Indicados**: Novos leads e indicações

## Funcionalidades

### Área Administrativa
- Gerenciamento de usuários e contas
- Dashboard administrativo
- Gestão de planos e configurações
- Gerenciamento de contas administrativas

### Área do Cliente
- Dashboard com métricas de campanhas
- Gestão de campanhas de indicação
- Gerenciamento de participantes
- Controle de indicações
- Configuração de recompensas
- Configurações gerais 

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

# Documentação do Projeto: Programa de Indicação

Esta pasta contém toda a documentação relevante para o desenvolvimento, manutenção e operação do sistema.

> **Para entender os conceitos, papéis, fluxos e funcionamento detalhado do sistema, consulte o documento principal de referência conceitual:**
> 
> [resumo_do_software.md](resumo_do_software.md)

## Estrutura dos Documentos

- `contexto_do_projeto.md`: Visão geral e motivação do projeto.
- `resumo_do_software.md`: Referência central de conceitos, papéis e fluxos do sistema.
- `quais_bibliotecas.md`: Lista das principais bibliotecas utilizadas.
- `quais_frameworks.md`: Frameworks utilizados no backend e frontend.
- `como_funciona_o_backend.md`: Arquitetura, tecnologias e funcionamento do backend.
- `como_funciona_o_frontend.md`: Estrutura, tecnologias e funcionamento do frontend.
- `plataforma_do_backend.md`: Detalhes sobre a plataforma e ambiente do backend.
- `estrutura_do_projeto.md`: Explicação da organização das pastas e módulos.
- `arquitetura.md`: Diagramas e explicações da arquitetura do sistema.
- `guia_de_instalacao.md`: Passos para instalar e rodar o projeto.
- `guia_de_uso.md`: Como utilizar o sistema.
- `padroes_de_codigo.md`: Convenções e boas práticas de código.
- `changelog.md`: Registro de mudanças relevantes.
- `requisitos/`: Detalhamento dos requisitos funcionais e não funcionais.
- `api/`: Especificação dos endpoints e exemplos de uso.
- `diagramas/`: Diagramas de arquitetura, fluxo, ER, etc.
- `decisoes/`: Documentos de decisões arquiteturais (ADR).

Mantenha esta documentação sempre atualizada! 