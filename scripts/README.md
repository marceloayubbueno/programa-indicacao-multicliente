# 🚀 Scripts de Automação - Programa de Indicação

Este diretório contém scripts que automatizam tarefas comuns de desenvolvimento, deploy e manutenção do projeto.

## 📋 Comandos Disponíveis

### 🔄 **Desenvolvimento e Status**

```bash
npm run dev           # Inicia servidor de desenvolvimento
npm run status        # Mostra status completo do projeto
npm run test-prod     # Testa se produção está funcionando
npm run logs          # Links para visualizar logs
```

### 📝 **Commits Automatizados**

```bash
npm run commit                        # Commit interativo com padrões
npm run quick-commit "sua mensagem"   # Commit rápido
```

### 🚀 **Deploy e Redeploy**

```bash
npm run deploy        # Deploy completo (build + commit + push + trigger)
npm run redeploy      # Redeploy rápido (apenas trigger Railway)
```

---

## 📖 Guia Detalhado

### 1. 📝 **Commit Inteligente** (`npm run commit`)

Script interativo que te guia através de um commit seguindo padrões:

- **Tipos disponíveis**: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- **Escopos**: client, server, admin, auth, api, db, ui, lp, config, deploy
- **Preview**: Mostra como ficará o commit antes de confirmar
- **Push opcional**: Pergunta se quer fazer push automaticamente

**Exemplo de uso:**
```bash
npm run commit
# Segue as perguntas interativas
# Resultado: "feat(client): adiciona validação de formulário"
```

### 2. ⚡ **Commit Rápido** (`npm run quick-commit`)

Para commits simples e rápidos:

```bash
npm run quick-commit "fix: corrige bug na autenticação"
npm run quick-commit "feat: adiciona nova página"
npm run quick-commit "docs: atualiza README"
```

**Vantagens:**
- ✅ Add, commit e push automático
- ✅ Mensagem direto na linha de comando
- ✅ Trigger deploy automático

### 3. 🚀 **Deploy Completo** (`npm run deploy`)

Processo completo de deploy com validações:

**O que faz:**
1. ✅ Verifica alterações pendentes
2. ✅ Pede mensagem de commit (se necessário)
3. ✅ Testa build local
4. ✅ Faz push para GitHub
5. ✅ Triggera redeploy no Railway
6. ✅ Mostra links para monitoramento

**Exemplo:**
```bash
npm run deploy
# Seguir instruções interativas
```

### 4. 🔄 **Redeploy Rápido** (`npm run redeploy`)

Para quando só precisa refazer deploy sem alterações de código:

**Casos de uso:**
- 🔧 Problemas no deploy anterior
- ⚙️ Mudanças nas variáveis de ambiente
- 🔄 Restart da aplicação

```bash
npm run redeploy
# Opcionalmente commita alterações pendentes
# Triggera novo deploy no Railway
```

### 5. 📊 **Status do Sistema** (`npm run status`)

Dashboard completo do projeto:

**Informações mostradas:**
- 📂 Status do Git (branch, último commit, alterações)
- 🌐 Status dos deploys (Railway, Vercel)
- 🔗 Links importantes (dashboards, aplicações)
- 📈 Últimos commits
- 🛠️ Comandos disponíveis
- 💡 Dicas rápidas

### 6. 🧪 **Teste de Produção** (`npm run test-prod`)

Testa se todos os endpoints estão funcionando:

**Endpoints testados:**
- ✅ Backend API (Railway)
- ✅ Frontend (Vercel)
- ✅ Login page
- ✅ Admin page
- ✅ LP Indicadores

**Informações mostradas:**
- 🔍 Status HTTP
- ⏱️ Tempo de resposta
- 📄 Preview do conteúdo
- 📊 Resumo dos testes

---

## 🎯 Fluxos de Trabalho Recomendados

### 🔧 **Para Desenvolvimento Diário**

```bash
# 1. Ver status atual
npm run status

# 2. Desenvolver localmente
npm run dev

# 3. Commit rápido
npm run quick-commit "fix: corrige validação"

# 4. Testar produção
npm run test-prod
```

### 🚀 **Para Deploy de Nova Feature**

```bash
# 1. Commit interativo (mais cuidadoso)
npm run commit

# 2. Deploy completo com validações
npm run deploy

# 3. Monitorar resultado
npm run test-prod
```

### 🔄 **Para Problemas em Produção**

```bash
# 1. Ver status para entender problema
npm run status

# 2. Fazer correções

# 3. Deploy urgente
npm run quick-commit "hotfix: corrige erro crítico"

# 4. Verificar se resolveu
npm run test-prod
```

### 🛠️ **Para Redeploy de Emergência**

```bash
# Quando algo der errado no deploy
npm run redeploy
```

---

## 🔗 Links Importantes

### 📋 **Dashboards**
- [Railway Dashboard](https://railway.app/dashboard) - Backend
- [Vercel Dashboard](https://vercel.com/dashboard) - Frontend  
- [GitHub Repository](https://github.com/marceloayubbueno/programa-indicacao-multicliente)

### 🌐 **Aplicações**
- [Frontend](https://programa-indicacao-multicliente.vercel.app/)
- [Backend API](https://programa-indicacao-multicliente-production.up.railway.app/api)
- [Admin Panel](https://programa-indicacao-multicliente.vercel.app/admin/pages/login.html)

---

## 💡 Dicas e Truques

### ⚡ **Atalhos Rápidos**
```bash
# Para mudanças pequenas/urgentes
npm run quick-commit "fix: bug crítico"

# Para deploy completo e seguro
npm run deploy

# Para ver se tudo está OK
npm run test-prod
```

### 🔍 **Debugging**
```bash
# Ver status completo
npm run status

# Testar produção
npm run test-prod

# Ver logs (abre links)
npm run logs
```

### 🚨 **Em Caso de Problemas**
1. `npm run status` - Para entender a situação
2. `npm run redeploy` - Para tentar redeploy
3. `npm run test-prod` - Para verificar se resolveu
4. Verificar dashboards Railway/Vercel se ainda houver problemas

---

## 🛡️ **Segurança e Boas Práticas**

- ✅ Scripts validam antes de executar
- ✅ Mostram preview antes de commitar  
- ✅ Perguntam confirmação em ações críticas
- ✅ Testam build local antes do deploy
- ✅ Seguem padrões de commit convencionais
- ✅ Logs coloridos para fácil identificação

---

## 📚 **Exemplos Práticos**

### **Cenário 1: Correção de Bug Urgente**
```bash
# Fazer correção no código
npm run quick-commit "hotfix: corrige erro crítico no login"
npm run test-prod  # Verificar se funcionou
```

### **Cenário 2: Nova Funcionalidade**
```bash
# Desenvolver feature
npm run commit  # Commit detalhado
npm run deploy  # Deploy com validações
npm run test-prod  # Verificar tudo OK
```

### **Cenário 3: Problema no Deploy**
```bash
npm run status    # Ver o que aconteceu
npm run redeploy  # Tentar redeploy
npm run test-prod # Verificar se resolveu
```

### **Cenário 4: Desenvolvimento Local**
```bash
npm run dev       # Iniciar desenvolvimento
# ... fazer alterações ...
npm run status    # Ver alterações pendentes
npm run commit    # Commit interativo
```

---

*Scripts criados para maximizar produtividade e minimizar erros em deploy* 🚀

## 🏁 **Resumo dos Comandos Essenciais**

| Comando | Uso | Quando Usar |
|---------|-----|-------------|
| `npm run status` | Ver situação atual | Sempre antes de começar |
| `npm run quick-commit "msg"` | Commit rápido | Mudanças simples |
| `npm run commit` | Commit interativo | Mudanças importantes |
| `npm run deploy` | Deploy completo | Nova feature/versão |
| `npm run redeploy` | Redeploy sem código | Problemas de deploy |
| `npm run test-prod` | Testar produção | Após qualquer deploy |
| `npm run dev` | Desenvolvimento | Trabalho local | 