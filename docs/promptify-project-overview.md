> **Documento principal de conceitos:** Consulte sempre o [Conceitos do Sistema](./conceitos.md) para entender os termos, papéis e entidades fundamentais do projeto.

> **Padronização de Dados:** Consulte o documento [Padronização de Dados – Contratos Frontend/Backend](./padroes-dados.md) para garantir integração consistente entre frontend e backend.

# Project Overview – Programa de Indicação

> **Atenção:** Sempre consulte o [Checklist de Desenvolvimento](./dev-checklist.md) ao iniciar ou finalizar qualquer tarefa para garantir qualidade, padronização e documentação completa.

Este documento centraliza a visão geral do projeto, servindo como referência rápida para desenvolvedores, colaboradores e ferramentas automatizadas.

---

## Como usar este overview com IA
- Consulte as seções abaixo para entender rapidamente a arquitetura e os fluxos do projeto.
- Antes de implementar novas features, verifique os padrões e exemplos nos arquivos de `docs/`.
- Use os exemplos de comandos para automatizar setup e testes.
- Para dúvidas sobre regras de negócio, consulte o glossário e os fluxos descritos.
- Sempre siga as convenções de código e estrutura de pastas para garantir manutenibilidade.

> **Prompt sugerido para IA:**
> "Antes de responder, consulte os arquivos em `docs/` para garantir que as respostas estejam alinhadas com a arquitetura e padrões do projeto."

---

## Exemplos de perguntas para IA
- Como criar um novo módulo no backend?
- Quais endpoints existem para campanhas?
- Como autenticar um usuário no frontend?
- Como rodar os testes automatizados?
- Como adicionar um novo fluxo de indicação?

---

## Links úteis para documentação
- [Prompts para IA e automação](./prompts.md)
- [Arquitetura do sistema](./arquitetura.md)
- [Funcionamento do backend](./como_funciona_o_backend.md)
- [Funcionamento do frontend](./como_funciona_o_frontend.md)
- [Estrutura do projeto](./estrutura_do_projeto.md)
- [Sistema de Campanhas - Análise Técnica Completa](./sistema-campanhas-analise-completa.md)
- [Requisitos](./requisitos/)
- [API](./api/)
- [API – Clientes](./api/clients.md)
- [Decisões técnicas](./decisoes/)
- [API – Login de Administrador](./api/auth-admin-login.md)
- [Fluxo Trial (Teste Grátis) – Documentação detalhada](./fluxo-trial.md)
- [Conceitos do Sistema (Glossário e Definições)](./conceitos.md)
- [Padronização de Dados – Contratos Frontend/Backend](./padroes-dados.md)

---

## Convenções e padrões
- Siga a estrutura de pastas descrita em `docs/estrutura_do_projeto.md`.
- Use nomes de arquivos e funções em inglês e no padrão camelCase.
- Separe responsabilidades em módulos pequenos e coesos.
- Documente novas features e endpoints na pasta `docs/`.

---

## Fluxos críticos do sistema
- Cadastro e autenticação de usuários (JWT)
- Criação e gestão de campanhas (consulte [análise completa](./sistema-campanhas-analise-completa.md))
- Indicação de novos clientes
- Aprovação e recompensa de indicações
- Acesso administrativo e controle de permissões

## Sistema de Campanhas
> **📋 Para informações detalhadas, consulte:** [Sistema de Campanhas - Análise Técnica Completa](./sistema-campanhas-analise-completa.md)

### Funcionalidades Principais
- **Quiz Multi-Step**: Interface guiada para criação de campanhas
- **Duplicação Automática**: Cópia de recursos (recompensas, LPs, listas) para campanhas
- **Filtros Inteligentes**: Mostra apenas recursos disponíveis para duplicação
- **Tipos Suportados**: LP de Indicadores, LP de Divulgação, Lista de Participantes

### Endpoints da API
- `POST /api/campaigns` - Criar campanha
- `GET /api/campaigns?clientId={id}` - Listar campanhas por cliente
- `GET /api/rewards?clientId={id}` - Listar recompensas disponíveis
- `GET /api/lp-indicadores?clientId={id}` - Listar LPs de indicadores
- `GET /api/lp-divulgacao?clientId={id}` - Listar LPs de divulgação
- `GET /api/participant-lists?clientId={id}` - Listar listas de participantes

### Status Atual
✅ **Funcional e operacional** - Sistema completo de criação de campanhas com duplicação de recursos implementado e testado.

---

## Comandos úteis de desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar backend em dev (NestJS + MongoDB)
npm run start:dev

# Build para produção
npm run build

# Rodar backend em produção
npm start

# Rodar testes (ajustar conforme implementação)
npm run test
```

---

## Variáveis de ambiente essenciais

Exemplo de `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/programa_indicacao
PORT=3000
JWT_SECRET=sua-chave-secreta-aqui
```

---

## Pontos de extensão
- Para criar um novo módulo no backend, siga o padrão de `src/<modulo>` e registre no `app.module.ts`.
- Novos endpoints devem ser documentados em `docs/api/`.
- Novos fluxos de negócio devem ser descritos em `docs/` e comunicados à equipe.

---

## Regras de negócio importantes
- Apenas administradores podem criar campanhas globais.
- Indicações duplicadas não são permitidas para o mesmo cliente.
- Recompensas só são liberadas após validação da indicação.

---

## Glossário de termos
- **Administrador:** Usuário que faz a gestão global do sistema.
- **Cliente:** Empresa que contrata nossa solução para automatizar seu programa de indicação e captar novos leads, visando aumentar receita e reduzir custos.
- **Participante:** Contato cadastrado pelo Cliente, que pode ser convidado a participar de campanhas.
- **Indicador:** Participante que, ao ser incluído em uma campanha ou se cadastrar via formulário, passa a indicar novos leads e recebe um link exclusivo de divulgação.
- **Indicação:** Lead gerado por meio do compartilhamento do link exclusivo do Indicador.
- **Campanha:** Ação promocional criada pelo Cliente para captar indicações.
- **Recompensa:** Benefício concedido ao Indicador por uma indicação válida.

---

## Backend

### Estrutura
- Diretório principal: `server/`
- Código-fonte principal: `server/src/` (NestJS)
- Módulos: `auth`, `users`, `campaigns`, `forms`, `referrals`, `rewards`, etc.

### Frameworks e Tecnologias
- **NestJS**: Estrutura modular para APIs RESTful
- **Mongoose**: ODM para MongoDB
- **Node.js**: Ambiente de execução

### Autenticação e Funcionamento
- **JWT (JSON Web Token)**: Autenticação e autorização de usuários
- **Validação global**: Pipes de validação no NestJS
- **CORS**: Configurado para múltiplas origens
- **Envio de e-mails**: Nodemailer
- **Persistência**: MongoDB

---

## Frontend

### Estrutura
- Diretórios principais: `client/` (área do cliente), `admin/` (área administrativa)
- Organização: `css/`, `js/`, `pages/` em ambos os diretórios
- Navegação: Baseada em múltiplas páginas HTML

### Frameworks e Tecnologias
- **JavaScript puro**: Lógica de interface e integração com API
- **HTML/CSS**: Estrutura e estilo das páginas
- **Chart.js**: Gráficos e visualizações
- **Font Awesome**: Ícones

### Autenticação e Funcionamento
- **Controle de acesso**: Scripts JS validam tokens e redirecionam usuários não autenticados
- **Integração com backend**: Requisições HTTP para APIs protegidas
- **Sem frameworks modernos**: Não utiliza React, Vue ou Angular

---

## Integração Frontend-Backend

- O frontend consome apenas a API RESTful do backend NestJS.
- Todas as requisições protegidas devem enviar o token JWT no header `Authorization: Bearer <token>`.
- Exemplos de endpoints e payloads podem ser encontrados em `docs/api/`.

---

## Testes

- Testes manuais: Utilize ferramentas como Postman ou Insomnia para validar endpoints.
- Testes automatizados: (Ajustar conforme implementação) Utilize `npm run test` para rodar testes unitários/e2e.
- Documente casos de teste relevantes em `docs/`.

---

## Estrutura Recomendada de Coleções e Entidades (MongoDB)

O sistema utiliza uma modelagem orientada a documentos, onde cada entidade principal possui sua própria coleção no MongoDB. Essa abordagem garante escalabilidade, performance e facilidade de manutenção.

### Coleções principais sugeridas:

- **usuarioadmins**: Administradores do sistema (gestão, permissões, auditoria).
- **clientes**: Empresas ou pessoas que contratam a solução.
- **produtos**: Produtos ou serviços ofertados para indicação.
- **indicadores**: Usuários que fazem indicações (participantes do programa).
- **indicacoes**: Registros das indicações realizadas (quem indicou, quem foi indicado, status, data, etc).
- **campanhas**: Campanhas promocionais de indicação.
- **recompensas**: Benefícios concedidos por indicações válidas.
- Outras coleções podem ser criadas conforme a evolução do sistema (ex: logs, auditoria, planos, notificações, etc).

### Boas práticas:
- Cada coleção deve ter seu próprio schema Mongoose, DTOs, service, controller e módulo NestJS.
- Relacionamentos entre entidades podem ser feitos via referências (`ObjectId`) ou embutidos, conforme a necessidade.
- Padronize nomes de coleções e campos para evitar confusão futura.
- Documente a estrutura e o propósito de cada coleção nesta seção e/ou na documentação técnica.

> **Esta seção deve ser expandida continuamente conforme novas entidades e fluxos forem implementados.**

---

## Roadmap e Funcionalidades

Consulte o arquivo [`docs/roadmap-funcionalidades.md`](./roadmap-funcionalidades.md) para uma visão detalhada das funcionalidades principais, em desenvolvimento e planejadas para o sistema.

---

## Boas Práticas de Testes e Checklist de Entregas

> **Consulte também:** [Checklist de Desenvolvimento](./dev-checklist.md) para um passo a passo prático ao longo do ciclo de desenvolvimento.

### 1. Testes Automatizados
- **Testes unitários:** Cada módulo (ex: login, cadastro de cliente) deve ter testes que garantam seu funcionamento isolado.
- **Testes de integração:** Simulam fluxos completos (ex: login + navegação + cadastro de cliente).
- **Testes end-to-end (E2E):** Simulam o uso real do sistema, garantindo que o frontend e backend funcionam juntos.
- **Ferramentas sugeridas:** Jest (NestJS), Cypress, Playwright, Selenium.

### 2. Checklist de Entregas
- [ ] Documentar endpoints e contratos de API alterados ou criados.
- [ ] Atualizar exemplos de payloads e respostas.
- [ ] Adicionar/atualizar testes automatizados para fluxos críticos.
- [ ] Validar manualmente os fluxos principais após grandes mudanças (login, cadastro, listagem, etc.).
- [ ] Atualizar esta documentação ao final de cada tarefa.

### 3. Padronização de Documentação
- Sempre que desenvolver novas funcionalidades, **documente**:
  - Contratos de API (payloads, respostas, status codes)
  - Fluxos de negócio implementados
  - Pontos de integração frontend-backend
  - Estratégia de testes automatizados e manuais
- Utilize este arquivo (`promptify-project-overview.md`) como referência central.
- Mantenha a documentação clara, objetiva e sempre alinhada com o código.

### 4. Integração Contínua e Revisão
- Utilize pipelines de CI/CD para rodar testes a cada push/merge.
- Realize code review antes de integrar novas features ao branch principal.
- Utilize ambientes de homologação para validar novas funcionalidades antes de liberar para produção.

> **Atenção:** Ao final de cada tarefa, revise este checklist e atualize a documentação para garantir que o conhecimento do projeto esteja sempre consolidado e acessível a todos.

## Padrão de Portas do Projeto

- **Backend (NestJS):** roda por padrão na porta **3000**.
- **Frontend (servidor estático):** roda por padrão na porta **5501**.

> **Atenção:**
> Sempre que for integrar o frontend com a API do backend, utilize a URL base `http://localhost:3000/api`. Não utilize a porta do servidor estático (5501) para chamadas de API, pois ela serve apenas para servir arquivos HTML, JS e CSS.
>
> Consulte este padrão antes de configurar endpoints, ambientes de desenvolvimento ou documentar exemplos de integração. Isso evita erros comuns de comunicação entre frontend e backend.

## Portas e Endpoints Padrão

- O backend NestJS roda por padrão na porta **3000**.
- Todos os endpoints da API devem ser acessados via `http://localhost:3000/api`.
- Certifique-se de que o frontend consome a API usando essa URL base, especialmente em ambientes de desenvolvimento.

## Tipos de Campanha Aceitos (API)

- `lp-divulgacao`: Landing Page de divulgação (não cria lista automática)
- `lp-indicadores`: Landing Page de indicadores (cria lista de indicadores vazia automaticamente)
- `lista-participantes`: Cria lista de indicadores a partir de uma lista de participantes existente
- `link-compartilhamento`: Link de compartilhamento (não cria lista automática)

### Exemplo de payload para criação de campanha com LP de Indicadores
```json
{
  "name": "Campanha LP Indicadores",
  "type": "lp-indicadores",
  "clientId": "<id do cliente>",
  // outros campos necessários
}
```

### Exemplo de payload para criação de campanha com lista de participantes
```json
{
  "name": "Campanha Lista Participantes",
  "type": "lista-participantes",
  "clientId": "<id do cliente>",
  "selectedParticipantListId": "<id da lista de participantes>",
  // outros campos necessários
}
``` 