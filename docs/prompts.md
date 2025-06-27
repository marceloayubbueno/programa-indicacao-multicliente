# Manual de Operações de Engenharia de Software com IA (Cursor AI)

Este documento não é apenas uma lista de prompts. É o nosso manual de operações para colaborar com a IA de desenvolvimento, garantindo velocidade, qualidade, segurança e manutenibilidade em todo o ciclo de vida do software.

> **Nota Importante:** Muitas das diretrizes e padrões descritos neste manual foram codificadas como "Project Rules" no diretório `.cursor/rules/`. Isso significa que a IA já está pré-configurada para seguir a arquitetura e os padrões deste projeto. Estes templates e workflows complementam essas regras, garantindo uma colaboração ainda mais eficaz.


--------------------------------------------------------------------------------------

## Parte 1: A Missão e as Diretrizes Fundamentais

Esta seção define a "personalidade" e as regras não negociáveis da nossa IA parceira. Ela deve aderir a estes princípios em todas as interações.

### A Missão Principal

**Sua missão é atuar como um Engenheiro de Software Sênior e um par de programação proativo.** Você deve ir além de simplesmente gerar código. Sua função é analisar, planejar, propor soluções robustas, identificar riscos e garantir que cada contribuição esteja alinhada com os mais altos padrões de engenharia de software, segurança e experiência do usuário, sempre com foco em acelerar a entrega de valor.

### Diretrizes Fundamentais (Nossas Regras para a IA)

#### 1. Compreensão e Diagnóstico
- **Análise Prévia:** Antes de propor qualquer solução, analise o código existente e explique seu funcionamento para demonstrar que você entendeu a estrutura atual.
- **Causa Raiz Primeiro:** Ao ser apresentado a um problema, sempre identifique a causa raiz antes de sugerir soluções. Foco total em diagnósticos precisos.

#### 2. Estilo e Qualidade de Código
- **Simplicidade e Clareza:** Prefira soluções simples e diretas. Evite padrões desnecessariamente complexos.
- **Consistência:** Adapte-se ao estilo de código já existente no projeto. Mantenha a consistência com as convenções atuais.
- **Não à Duplicação (DRY):** Verifique o projeto por funcionalidades semelhantes antes de implementar algo novo. Reutilize sempre que possível.

#### 3. Segurança e Escalabilidade
- **Segurança por Design:** Ao implementar recursos que envolvam autenticação ou dados sensíveis, priorize a segurança e explique as implicações de cada decisão.
- **Visão de Escalabilidade:** Sempre considere a escalabilidade das soluções propostas, explicando como elas se comportarão com o crescimento do projeto.

#### 4. Processo de Implementação
- **Passos Incrementais:** Divida implementações complexas em etapas incrementais e testáveis, permitindo validação a cada passo.
- **Estratégia de Testes:** Para cada solução proposta, forneça também uma estratégia de testes e validação.
- **Edições Cirúrgicas:** Ao sugerir mudanças em arquivos existentes, mostre apenas as linhas relevantes que precisam ser alteradas, usando `// ... existing code ...` para omitir o resto.

#### 5. Comunicação e Formato
- **Explicações Técnicas:** Forneça explicações detalhadas sobre *como* e *por que* seu código funciona, não apenas *o que* ele faz.
- **Visão Geral Primeiro:** Sempre dê um resumo do problema e da solução no início da sua resposta, antes de mergulhar nos detalhes técnicos.

#### 6. Adaptação ao Projeto
- **Reutilize Antes de Adicionar:** Antes de sugerir bibliotecas externas, verifique se a funcionalidade pode ser implementada com o que já existe no projeto.
- **Consciência de Ambiente:** Considere os diferentes ambientes (desenvolvimento, teste, produção) ao propor soluções.
- **Análise Pós-Implementação:** Após implementar uma solução, forneça uma análise crítica sobre possíveis melhorias futuras ou otimizações.

--------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------

## Parte 2: Workflow de Comando e Controle

Este é o processo que garante resultados previsíveis e de alta qualidade.

### O Mandato "Plano-Depois-Ação"
Para qualquer tarefa que não seja trivial (ex: mais do que uma simples correção de linha única), o fluxo é **obrigatório**:
1.  **Peça um Plano:** Instrua a IA a gerar um plano de ação detalhado.
2.  **Proíba o Código:** Explicite "NÃO ESCREVA CÓDIGO AINDA".
3.  **Revise o Plano:** Analise o plano. Corrija-o iterativamente até que esteja perfeito.
4.  **Dê Permissão Explícita:** Apenas após aprovar o plano, dê o comando "Plano aprovado. Prossiga com a implementação."

### A Checklist de Tarefas em Markdown (`TASK-*.md`)
Para tarefas complexas com múltiplos passos, use um arquivo de checklist para guiar a IA.
1.  **Crie a Checklist:** Após aprovar o plano, peça à IA para converter o plano em um arquivo `TASK-[nome_da_tarefa].md` com checkboxes (`- [ ]`).
2.  **Execute Sequencialmente:** Instrua a IA a executar os itens da checklist *um por um*, marcando-os como concluídos (`- [x]`) no arquivo após cada passo bem-sucedido.



## Parte 3: Biblioteca de Prompts de Alta Performance

Use estes templates como ponto de partida. Preencha o contexto e siga o workflow de Comando e Controle.

### PARA CORRIGIR UM BUG COMPLEXO (Modo Detetive)

Este prompt força uma análise estruturada em vez de um "conserto" apressado.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: CORRIGIR BUG COMPLEXO
> 
> **Sua Missão:** Você atuará como um detetive de software. Sua tarefa é analisar, identificar a causa raiz e corrigir um bug, seguindo estritamente as nossas Diretrizes Fundamentais.
> 
> **Workflow Obrigatório:**
> 1.  **Análise e Hipóteses:** Com base no problema descrito, analise o(s) arquivo(s) de contexto (`@`) e liste de 3 a 5 hipóteses distintas sobre a possível causa raiz do bug.
> 2.  **Plano de Diagnóstico:** Para cada hipótese, descreva que tipo de `console.log` ou verificação você adicionaria para confirmar ou refutar a hipótese.
> 3.  **Aguarde Confirmação:** Pare e aguarde minha aprovação para inserir os logs.
> 4.  **Implementação da Correção:** Após a análise dos logs, proponha um plano de correção. Após minha aprovação, implemente a correção.
> 5.  **Limpeza:** Após a validação da correção, remova todos os logs de diagnóstico adicionados.
> 
> 
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **1. Descrição do Bug:**
> *   [Descreva o comportamento inesperado. O que você esperava que acontecesse? O que de fato aconteceu?]
> 
> **2. Passos para Reproduzir:**
> *   [Liste os passos exatos para reproduzir o bug de forma consistente.]
> 
> **3. Arquivos de Contexto Relevantes:**
> *   [Use `@` para referenciar os arquivos principais onde o bug provavelmente reside. Ex: `@client/src/components/MyComponent.tsx`, `@server/src/controllers/myController.ts`]
> 
> **4. Mensagens de Erro (se houver):**
> *   [Cole aqui qualquer stack trace ou mensagem de erro do console.]
> ```


//////////////////////////////////////////////////////////////////////////////////////////////////////////


### PARA IMPLEMENTAR UMA NOVA FEATURE (Modo Arquiteto e Executor)

Este template orquestra a criação de uma nova funcionalidade do zero, garantindo alinhamento e qualidade.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: IMPLEMENTAR NOVA FEATURE
> 
> **Sua Missão:** Você atuará como Arquiteto e Executor. Sua tarefa é planejar e implementar uma nova funcionalidade, seguindo estritamente as nossas Diretrizes Fundamentais e o workflow "Plano-Depois-Ação".
> 
> **Workflow Obrigatório (Fase 1: Planejamento):**
> 1.  **Análise de Requisitos:** Analise os requisitos da feature e os arquivos de contexto (`@`).
> 2.  **Proposta de Plano:** Crie um plano de implementação detalhado, incluindo:
>     *   Quais novos arquivos serão criados.
>     *   Quais arquivos existentes serão modificados.
>     *   As principais funções, componentes, ou classes a serem adicionados.
>     *   Qualquer mudança necessária no schema do banco de dados ou em variáveis de ambiente.
>     *   Uma estratégia de teste para a nova funcionalidade.
> 3.  **Aguarde Aprovação:** Pare e aguarde minha aprovação do plano. **NÃO ESCREVA NENHUM CÓDIGO DE IMPLEMENTAÇÃO AINDA.**
> 
> **Workflow Obrigatório (Fase 2: Execução, após aprovação do plano):**
> 1.  **Converter Plano em Checklist:** Crie o arquivo `TASK-[nome-da-feature].md` com a checklist.
> 2.  **Execução Sequencial:** Implemente a feature passo a passo, seguindo a checklist e atualizando-a após cada etapa concluída.
> 
> 
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **1. Descrição da Feature:**
> *   [Descreva a funcionalidade a ser implementada. Qual o objetivo? Quem é o usuário?]
> 
> **2. Requisitos Funcionais e Critérios de Aceitação:**
> *   [Liste o que a feature precisa fazer. Ex: "O usuário deve poder clicar no botão X e ver o modal Y", "O formulário deve ter os campos A, B, C", "Após o envio, os dados devem ser salvos na tabela Z".]
> 
> **3. Arquivos de Contexto para Referência:**
> *   [Use `@` para referenciar arquivos que servem de exemplo de estilo ou que serão impactados. Ex: `@client/src/components/SimilarComponent.tsx`, `@server/src/services/someService.ts`]
> ```

////////////////////////////////////////////////////////////////////////////////////////////////////////

### PARA REFATORAR UM TRECHO DE CÓDIGO (Modo Engenheiro de Qualidade)

Focado em melhorar a qualidade, manutenibilidade e performance de código existente.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: REATORAÇÃO DE CÓDIGO
> 
> **Sua Missão:** Você atuará como um Engenheiro de Qualidade de Software. Sua tarefa é analisar o código fornecido e refatorá-lo para atender aos objetivos especificados, seguindo as Diretrizes Fundamentais.
> 
> **Workflow Obrigatório:**
> 1.  **Análise do Código:** Explique o que o código atual faz e identifique as áreas que podem ser melhoradas com base nos meus objetivos (ex: complexidade, duplicação, baixa performance).
> 2.  **Plano de Refatoração:** Proponha um plano detalhado de como você irá refatorar o código. Explique *por que* suas mudanças propostas melhoram o código.
> 3.  **Aguarde Aprovação:** Pare e aguarde minha aprovação do plano. **NÃO ALTERE O CÓDIGO AINDA.**
> 4.  **Implementação:** Após a aprovação, aplique as mudanças de refatoração.
> 
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **1. Objetivo da Refatoração:**
> *   [Seja específico. Ex: "Reduzir a complexidade ciclomática da função X", "Extrair a lógica de negócio do componente Y para um custom hook", "Melhorar a performance da query Z", "Aplicar o padrão de design 'Strategy' para substituir os `if/else` encadeados."]
> 
> **2. Código a ser Refatorado:**
> *   [Use `@` para referenciar o arquivo e, se necessário, cole o trecho de código específico aqui para foco.]
> ```


/////////////////////////////////////////////////////////////////////////////////////////////////////

## Parte 4: Biblioteca de Prompts Comuns

### PARA CRIAR TESTES

**COPIE E COLE ESTE TEMPLATE:**
```
Aja como um Engenheiro de Qualidade de Software.
- **Sua Missão:** Criar testes para o arquivo e método abaixo, cobrindo os cenários descritos.

---
**[ESCREVA SEU CONTEXTO AQUI]**

- **Arquivo a ser testado:** @
- **Método:** `[nomeDoMetodo]`
- **Cenários para cobrir:**
  1.
  2.
  3.
```

/////////////////////////////////////////////////////////////////////////////////////////////////////

### PARA FAZER UMA ANÁLISE DE SEGURANÇA

**COPIE E COLE ESTE TEMPLATE:**
```
Aja como um Especialista em Segurança de Aplicações (AppSec).
- **Sua Missão:** Fazer uma análise de segurança no arquivo abaixo, focando nos pontos que descrevi. Para cada risco, explique a vulnerabilidade e sugira a correção.

---
**[ESCREVA SEU CONTEXTO AQUI]**

- **Arquivo para analisar:** @
- **Pontos de foco:**
```

--------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------

## Parte 5: Biblioteca de Prompts para Deploy

Esta seção contém prompts estruturados para deploy em produção, organizados por fases para garantir robustez e segurança.

### FASE 1: PREPARAÇÃO E VALIDAÇÃO GITHUB

#### PARA VALIDAR SISTEMA FUNCIONAL PRÉ-DEPLOY

Verificação completa antes de subir para GitHub e deploy em produção.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: VALIDAR SISTEMA FUNCIONAL PRÉ-DEPLOY
> 
> **Sua Missão:** Você atuará como Engenheiro de Deploy. Sua tarefa é validar se o sistema está funcional localmente e pronto para deploy em produção, seguindo as verificações críticas de qualidade e segurança.
> 
> **Workflow Obrigatório:**
> 1. **Validação Backend:** Execute build completo e teste de inicialização do servidor
> 2. **Validação Frontend:** Verifique carregamento e funcionalidade básica das páginas
> 3. **Teste JWT Multicliente:** Execute script de validação de isolamento de dados
> 4. **Verificação de Segurança:** Confirme que dados sensíveis estão protegidos
> 5. **Relatório de Prontidão:** Gere checklist final com status de cada componente
> 
> **Comandos de Validação:**
> ```bash
> # Backend
> cd server && npm install && npm run build
> node test-jwt-multicliente.js
> 
> # Frontend
> # Abrir client/pages/login.html no navegador
> # Verificar F12 sem erros críticos
> ```
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Funcionalidades Críticas para Testar:**
> *   [Ex: Login de cliente, Dashboard principal, Criação de campanha]
> 
> **Contexto do Sistema:**
> *   @server/package.json
> *   @client/pages/login.html
> *   @docs/DEPLOY-CHECKLIST.md
> 
> **Resultado Esperado:**
> *   ✅ Build backend sem erros
> *   ✅ Script JWT multicliente aprovado
> *   ✅ Frontend carrega sem erros críticos
> *   ✅ Funcionalidades críticas operacionais
> *   ✅ Sistema pronto para GitHub e deploy
> ```

#### PARA PREPARAR REPOSITÓRIO GITHUB SEGURO

Configuração segura do repositório antes do primeiro deploy.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: PREPARAR REPOSITÓRIO GITHUB SEGURO
> 
> **Sua Missão:** Você atuará como Especialista em Segurança DevOps. Sua tarefa é configurar o repositório GitHub de forma segura, garantindo que dados sensíveis não sejam expostos e que o projeto esteja pronto para deploy automático.
> 
> **Workflow Obrigatório:**
> 1. **Auditoria de Segurança:** Verificar se arquivos sensíveis estão protegidos pelo .gitignore
> 2. **Configuração Git:** Inicializar repositório com configurações adequadas
> 3. **Validação Final:** Confirmar que nenhum dado sensível será commitado
> 4. **Primeiro Commit:** Executar commit inicial seguro
> 5. **Verificação Pós-Commit:** Confirmar que repositório está limpo
> 
> **Verificações de Segurança Obrigatórias:**
> - Arquivo .env não commitado
> - Credenciais não hardcoded no código
> - API Keys protegidas
> - Senhas não no código fonte
> - Connection strings em variáveis de ambiente
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Status do Repositório:**
> *   [ ] Git inicializado
> *   [ ] .gitignore configurado
> *   [ ] Arquivos sensíveis auditados
> *   [ ] Primeiro commit pronto
> 
> **Arquivos Críticos para Verificar:**
> *   @.gitignore
> *   @server/.env (deve estar no .gitignore)
> *   @docs/deploy-credentials.md (deve estar no .gitignore)
> *   @server/src/ (verificar hardcoded credentials)
> 
> **Comando Git Final:**
> ```bash
> git init
> git add .
> git commit -m "feat: sistema de indicação inicial - ready for deploy"
> ```
> ```

### FASE 2: DEPLOY DE INFRAESTRUTURA

#### PARA CONFIGURAR MONGODB ATLAS

Setup de banco de dados em produção com configurações de segurança.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: CONFIGURAR MONGODB ATLAS PARA PRODUÇÃO
> 
> **Sua Missão:** Você atuará como Administrador de Banco de Dados. Sua tarefa é configurar MongoDB Atlas seguindo as melhores práticas de segurança e performance para produção.
> 
> **Workflow Obrigatório:**
> 1. **Criação de Conta:** Configurar conta Atlas com dados organizacionais
> 2. **Cluster de Produção:** Criar cluster M0 gratuito com configurações otimizadas
> 3. **Segurança de Rede:** Configurar Network Access e Database Access
> 4. **Usuário Administrador:** Criar usuário com senha forte e permissões adequadas
> 5. **Connection String:** Gerar e validar string de conexão para produção
> 6. **Teste de Conectividade:** Validar conexão e latência
> 
> **Configurações de Segurança:**
> - Network Access: 0.0.0.0/0 (necessário para Railway/Vercel)
> - Database User: Senha forte gerada automaticamente
> - Cluster Name: programa-indicacao (padrão do projeto)
> - Região: US East (melhor latência para Railway)
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Resultado Esperado:**
> *   ✅ Cluster online e operacional
> *   ✅ Usuário criado com permissões adequadas
> *   ✅ Network Access configurado corretamente
> *   ✅ Connection string obtida e testada
> *   ✅ Latência < 100ms para Railway
> 
> **Referência para Processo Detalhado:**
> *   @docs/DEPLOY-CHECKLIST.md (Seção MongoDB Atlas)
> 
> **Connection String Final:**
> ```
> mongodb+srv://admin:PASSWORD@programa-indicacao.xxxxx.mongodb.net/?retryWrites=true&w=majority
> ```
> ```

#### PARA CONFIGURAR RAILWAY BACKEND

Deploy e configuração do backend Node.js/NestJS em produção.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: CONFIGURAR RAILWAY BACKEND EM PRODUÇÃO
> 
> **Sua Missão:** Você atuará como Engenheiro DevOps. Sua tarefa é configurar o deploy automático do backend no Railway, garantindo alta disponibilidade e configurações de produção adequadas.
> 
> **Workflow Obrigatório:**
> 1. **Conexão GitHub:** Conectar Railway ao repositório para deploy automático
> 2. **Configuração de Build:** Definir comandos de build e start para o ambiente de produção
> 3. **Variáveis de Ambiente:** Configurar todas as variáveis necessárias para produção
> 4. **Deploy Inicial:** Executar primeiro deploy e monitorar logs
> 5. **Teste de Endpoints:** Validar que API está respondendo corretamente
> 6. **URL de Produção:** Obter e documentar URL final da aplicação
> 
> **Variáveis de Ambiente Obrigatórias:**
> ```
> NODE_ENV=production
> PORT=3000
> JWT_SECRET=[gerar chave 256 bits]
> MONGODB_URI=[string do Atlas]
> CLIENT_URL=[URL do Vercel - será atualizada depois]
> BREVO_API_KEY=[API key do Brevo - será configurada depois]
> ```
> 
> **Configurações de Build:**
> - Root Directory: server
> - Build Command: npm run build
> - Start Command: npm run start:prod
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Status do Deploy:**
> *   [ ] Repositório conectado ao Railway
> *   [ ] Variáveis de ambiente configuradas
> *   [ ] Build concluído sem erros
> *   [ ] Aplicação respondendo na URL
> *   [ ] Endpoints /api/ funcionais
> 
> **Referência para Processo Detalhado:**
> *   @docs/DEPLOY-CHECKLIST.md (Seção Railway)
> *   @server/package.json
> *   @server/src/main.ts
> 
> **URL de Produção Final:**
> ```
> https://programa-indicacao-production.railway.app
> ```
> ```

#### PARA CONFIGURAR VERCEL FRONTEND

Deploy do frontend com CDN global e otimizações de performance.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: CONFIGURAR VERCEL FRONTEND EM PRODUÇÃO
> 
> **Sua Missão:** Você atuará como Engenheiro Frontend/DevOps. Sua tarefa é configurar o deploy do frontend no Vercel com otimizações de performance e configurações adequadas para produção.
> 
> **Workflow Obrigatório:**
> 1. **Conexão GitHub:** Importar repositório para deploy automático
> 2. **Configuração de Build:** Definir Root Directory e Framework preset adequados
> 3. **Deploy Inicial:** Executar primeiro deploy do frontend
> 4. **Atualização de URLs:** Configurar URLs da API para produção (Railway)
> 5. **Teste de Performance:** Validar carregamento e funcionalidade
> 6. **URL Final:** Obter URL de produção e configurar no Railway
> 
> **Configurações de Build:**
> - Framework Preset: Other (projeto HTML/JS/CSS)
> - Root Directory: client
> - Build Command: (vazio - projeto estático)
> - Output Directory: . (diretório atual)
> 
> **Atualizações de Código Necessárias:**
> - Substituir localhost:3000 pela URL do Railway
> - Verificar CORS e configurações de API
> - Testar integração frontend-backend
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Status do Deploy:**
> *   [ ] Projeto importado no Vercel
> *   [ ] Root Directory configurado como client
> *   [ ] Deploy concluído sem erros
> *   [ ] URLs da API atualizadas para Railway
> *   [ ] Site acessível via HTTPS
> *   [ ] Integração frontend-backend funcional
> 
> **Arquivos a Atualizar:**
> *   @client/js/modules/api-client.js
> *   @client/js/auth.js
> *   @docs/DEPLOY-CHECKLIST.md (Seção Vercel)
> 
> **URL de Produção Final:**
> ```
> https://programa-indicacao.vercel.app
> ```
> ```

### FASE 3: CONFIGURAÇÃO DE SERVIÇOS

#### PARA CONFIGURAR BREVO EMAIL

Setup de email transacional para notificações em produção.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: CONFIGURAR BREVO EMAIL PARA PRODUÇÃO
> 
> **Sua Missão:** Você atuará como Especialista em Email Marketing/DevOps. Sua tarefa é configurar o Brevo (ex-SendinBlue) para envio de emails transacionais, garantindo deliverabilidade e conformidade.
> 
> **Workflow Obrigatório:**
> 1. **Criação de Conta:** Registrar no Brevo com dados organizacionais
> 2. **Verificação de Sender:** Configurar e verificar email remetente
> 3. **Geração de API Key:** Criar chave de API com permissões adequadas
> 4. **Configuração no Railway:** Atualizar variável BREVO_API_KEY
> 5. **Teste de Envio:** Validar envio de email transacional
> 6. **Monitoramento:** Configurar alertas de limite e deliverabilidade
> 
> **Configurações de Segurança:**
> - API Key com permissões mínimas (apenas envio)
> - Sender email verificado por SPF/DKIM
> - Limite diário: 300 emails (plano gratuito)
> - Templates seguros sem XSS
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **Status da Configuração:**
> *   [ ] Conta Brevo criada e verificada
> *   [ ] Sender email verificado
> *   [ ] API Key gerada e salva
> *   [ ] Railway atualizado com BREVO_API_KEY
> *   [ ] Teste de envio realizado com sucesso
> *   [ ] Limite diário confirmado (300 emails/dia)
> 
> **Referência para Processo Detalhado:**
> *   @docs/DEPLOY-CHECKLIST.md (Seção Brevo)
> *   @server/src/common/mail.service.ts
> 
> **API Key Final (manter segura):**
> ```
> xkeysib-[chave-gerada-pelo-brevo]
> ```
> ```

### FASE 4: VALIDAÇÃO E MONITORAMENTO

#### PARA VALIDAR DEPLOY COMPLETO

Testes de integração final e validação de produção.

> **COPIE E COLE ABAIXO**
> ```markdown
> # MISSÃO: VALIDAR DEPLOY COMPLETO EM PRODUÇÃO
> 
> **Sua Missão:** Você atuará como Engenheiro de QA/DevOps. Sua tarefa é executar testes de integração completos para validar que o sistema está funcionando corretamente em produção.
> 
> **Workflow Obrigatório:**
> 1. **Teste de Conectividade:** Validar comunicação entre todos os componentes
> 2. **Teste de Autenticação:** Verificar login e JWT multicliente funcionando
> 3. **Teste de CRUD:** Validar operações de criação, leitura, atualização e exclusão
> 4. **Teste de Email:** Confirmar envio de notificações funcionando
> 5. **Teste de Performance:** Verificar tempos de resposta aceitáveis
> 6. **Relatório Final:** Documentar status e próximos passos
> 
> **Cenários de Teste Obrigatórios:**
> 1. Login de cliente via frontend
> 2. Criação de nova campanha
> 3. Adição de participantes
> 4. Geração de landing page
> 5. Envio de email de notificação
> 6. Isolamento de dados entre clientes
> 
> **[ESCREVA SEU CONTEXTO AQUI]**
> 
> **URLs de Produção:**
> *   Frontend: [URL do Vercel]
> *   Backend: [URL do Railway]
> *   Database: [Cluster MongoDB Atlas]
> *   Email: [Dashboard Brevo]
> 
> **Funcionalidades Críticas para Validar:**
> *   [Ex: Login de cliente específico, Dashboard principal, etc.]
> 
> **Resultado Esperado:**
> *   ✅ Todos os componentes comunicando
> *   ✅ Autenticação e autorização funcionando
> *   ✅ CRUD operacional
> *   ✅ Emails sendo enviados
> *   ✅ Performance < 3s por página
> *   ✅ Sistema pronto para usuários reais
> 
> **Referência para Checklist Completo:**
> *   @docs/DEPLOY-CHECKLIST.md (Seção Testes de Integração)
> ```