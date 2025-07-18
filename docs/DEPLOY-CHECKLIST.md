# 🚀 CHECKLIST DE DEPLOY - PROGRAMA DE INDICAÇÃO (MVP)

## 🎯 **STACK MVP - CUSTO ZERO/MÍNIMO**

```
💰 CUSTO TOTAL: $0/mês iniciais
⏱️ TEMPO SETUP: 2-3 horas
🎯 OBJETIVO: Validar produto com máximo valor, mínimo investimento

🏗️ STACK ESCOLHIDA:
├── 🚀 Backend:    Railway (gratuito - 500h/mês)
├── 🗄️ Database:   MongoDB Atlas M0 (gratuito - 512MB)  
├── 🌐 Frontend:   Vercel (gratuito)
├── 📧 Email:      Brevo (300 emails/dia gratuito)
└── 🔒 SSL/CDN:    Inclusos automaticamente
```

---

## ✅ **ETAPA 1: PRÉ-REQUISITOS E VALIDAÇÕES (15 min)**

### **🔧 Validações Locais Obrigatórias**
```bash
# 1. Verificar se o sistema local está funcionando
cd server
npm install
npm run build

# 2. Verificar se ENV.EXAMPLE existe (padronização de variáveis)
ls ENV.EXAMPLE
# ✅ Resultado esperado: arquivo existe

# 3. Executar script de teste JWT multicliente
node test-jwt-multicliente.js
# ✅ Resultado esperado: "Deploy AUTORIZADO para produção!"

# 4. Verificar frontend local
cd ../client
# Abrir index.html no navegador (com Live Server)
# ✅ Resultado esperado: página carrega sem erros de console

# 5. Verificar config.js está padronizado
cat js/config.js | grep "window.APP_CONFIG"
# ✅ Resultado esperado: config centralizado encontrado
```

### **📋 Checklist Pré-Deploy**
- [ ] ✅ Script JWT multicliente aprovado
- [ ] ✅ Build do backend sem erros
- [ ] ✅ Frontend carrega localmente
- [ ] ✅ Repositório Git atualizado
- [ ] ✅ Commits recentes funcionais
- [ ] ✅ ENV.EXAMPLE existe e está atualizado
- [ ] ✅ config.js centralizado funcionando
- [ ] ✅ Nenhuma URL hardcodada no código

### **🔍 Verificação de URLs - CRÍTICO**
```bash
# Verificar se não há URLs hardcodadas no código
cd client
grep -r "railway.app" . --exclude-dir=node_modules || echo "✅ Nenhuma URL Railway hardcodada"
grep -r "vercel.app" . --exclude-dir=node_modules || echo "✅ Nenhuma URL Vercel hardcodada"
grep -r "localhost:3000" . --exclude-dir=node_modules || echo "⚠️ URLs localhost encontradas"

# Verificar se config.js centralizado está sendo usado
grep -r "window.APP_CONFIG" . || echo "⚠️ APP_CONFIG não encontrado"
```

### **🚨 Se Alguma Validação Falhar:**
- ❌ **PARE AQUI** - Não prossiga com deploy
- 🔧 Corrija os problemas localmente primeiro
- ✅ Re-execute as validações

### **📖 Documentos de Referência:**
- `docs/README_VARIAVEIS_DE_AMBIENTE.md` - Guia completo de variáveis
- `server/ENV.EXAMPLE` - Template para variáveis locais
- `client/js/config.js` - Configurações centralizadas do frontend

---

## 🏗️ **ETAPA 2: CONFIGURAÇÃO LOCAL DE DESENVOLVIMENTO (10 min)**

### **⚙️ Configurar Variáveis de Ambiente Locais**

#### **Passo 1: Configurar Backend**
```bash
# 1. Copiar template de variáveis
cd server
cp ENV.EXAMPLE .env

# 2. Editar arquivo .env com suas configurações locais
nano .env  # ou seu editor preferido
```

#### **Exemplo de .env local (baseado em ENV.EXAMPLE):**
```bash
# Banco de dados
MONGODB_URI=mongodb://localhost:27017/programa-indicacao

# JWT
JWT_SECRET=temporario123

# Porta do servidor
PORT=3000

# URL do frontend autorizado
CLIENT_URL=http://localhost:5501

# URLs para detecção de ambiente
API_BASE_URL=http://localhost:3000
CLIENT_BASE_URL=http://localhost:5501
BACKEND_URL=http://localhost:3000

# E-mail (configure conforme necessário)
BREVO_API_KEY=placeholder
FROM_NAME=Programa de Indicação
FROM_EMAIL=noreply@localhost

# Ambiente
NODE_ENV=development
```

#### **Passo 2: Testar Sistema Local**
```bash
# 1. Iniciar backend
cd server
npm run start:dev

# 2. Em outro terminal, servir frontend
cd client
# Use Live Server do VS Code ou
python -m http.server 5501

# 3. Testar no navegador
# Abrir http://localhost:5501
# Verificar se APP_CONFIG está definido no console
```

### **✅ Validação Ambiente Local:**
- [ ] ✅ Backend inicia sem erros
- [ ] ✅ Frontend carrega corretamente
- [ ] ✅ Console do navegador sem erros de CORS
- [ ] ✅ window.APP_CONFIG definido corretamente
- [ ] ✅ Detecção de ambiente funcionando (development)

---

## 🏗️ **ETAPA 3: CRIAÇÃO DE CONTAS (55 min)**

**🎯 OBJETIVO GERAL:** Criar todas as contas necessárias para hospedar sua aplicação na nuvem de forma gratuita.

**💰 CUSTO TOTAL:** $0/mês (todos os serviços no plano gratuito)

**🔧 SERVIÇOS QUE VOCÊ VAI CONFIGURAR:**
1. **MongoDB Atlas** (15 min) - Banco de dados na nuvem
2. **Railway** (20 min) - Hospedagem do backend Node.js  
3. **Vercel** (15 min) - Hospedagem do frontend HTML/CSS/JS
4. **Brevo** (12 min) - Serviço de email transacional

**📝 INFORMAÇÕES IMPORTANTES PARA SALVAR:**
Durante esta etapa, você vai gerar várias informações importantes. **SALVE TUDO** em um local seguro:
- MongoDB: Connection String com senha
- Railway: URL da aplicação backend
- Vercel: URL do site frontend  
- Brevo: API Key para emails
- JWT Secret: Chave de segurança gerada

### **🗄️ 1. MongoDB Atlas (15 min)**

**🎯 OBJETIVO:** Criar um banco de dados MongoDB gratuito na nuvem para armazenar todos os dados da aplicação.

**💡 O QUE VOCÊ VAI FAZER:**
- Criar uma conta gratuita no MongoDB Atlas
- Configurar um cluster gratuito M0 (512MB)
- Criar um usuário administrador para o banco
- Configurar acesso de rede
- Obter a string de conexão para o backend

---

#### **Passo 1: Criar Conta no MongoDB Atlas**

**🔗 1.1 - Acessar o site oficial**
1. Abra seu navegador
2. Digite na barra de endereços: `https://mongodb.com/atlas`
3. Pressione Enter

**👀 O QUE VOCÊ DEVE VER:**
- Uma página com título "MongoDB Atlas" 
- Um botão verde escrito **"Try Free"** no canto superior direito
- Texto sobre "Build faster. Build smarter."

**🖱️ 1.2 - Iniciar cadastro**
1. Clique no botão verde **"Try Free"**
2. **IMPORTANTE**: NÃO clique em "Login" se você não tem conta

**👀 O QUE VOCÊ DEVE VER:**
- Uma página de registro com campos para:
  - Email address
  - First name
  - Last name
  - Password
  - Checkboxes de termos

**📝 1.3 - Preencher dados de cadastro**
1. **Email address**: Digite seu email principal (você receberá confirmações)
2. **First name**: Seu primeiro nome
3. **Last name**: Seu sobrenome  
4. **Password**: Crie uma senha forte (mínimo 8 caracteres, maiúscula, número)
5. Marque a checkbox **"I agree to the Terms of Service"**
6. **OPCIONAL**: Desmarque newsletters se não quiser receber emails
7. Clique no botão **"Create your Atlas account"**

**⚠️ IMPORTANTE**: Anote sua senha em local seguro!

**👀 O QUE VOCÊ DEVE VER:**
- Mensagem "Please verify your email address"
- Instruções para verificar seu email

**📧 1.4 - Verificar email**
1. Abra seu email
2. Procure por email de "MongoDB Atlas" (verifique spam)
3. Clique no link **"Verify Email"** dentro do email
4. Volta para o navegador automaticamente

**👀 O QUE VOCÊ DEVE VER:**
- Página perguntando sobre seu objetivo
- Opções como "Learn MongoDB", "Build a new application", etc.

**🎯 1.5 - Escolher objetivo**
1. Selecione **"Learn MongoDB"**
2. Clique em **"Finish"**

---

#### **Passo 2: Criar Cluster Gratuito M0**

**🎯 OBJETIVO:** Configurar o servidor de banco de dados gratuito.

**👀 O QUE VOCÊ DEVE VER:**
- Página "Deploy your database"
- Diferentes opções de deploy (Serverless, Dedicated, Shared)

**🖱️ 2.1 - Escolher plano gratuito**
1. Procure pela seção **"Shared"** (deve ser a primeira opção)
2. Verifique se mostra **"FREE"** e **"M0 Sandbox"**
3. Clique no botão **"Create"** na seção Shared

**👀 O QUE VOCÊ DEVE VER DEPOIS DO CLIQUE:**
- Página de configuração do cluster
- Seções para Cloud Provider, Region, Cluster Name

**⚙️ 2.2 - Configurar provider e região**
1. **Cloud Provider**: Deixe **"AWS"** selecionado (padrão)
2. **Region**: Escolha **"N. Virginia (us-east-1)"** 
   - **DICA**: Se não aparecer esta opção, escolha a mais próxima ao Brasil
   - Procure por regiões que mostram **"FREE TIER AVAILABLE"**

**📝 2.3 - Nomear o cluster**
1. **Cluster Name**: Substitua o nome padrão por `programa-indicacao`
2. **IMPORTANTE**: Use exatamente este nome, sem espaços ou caracteres especiais

**✅ 2.4 - Criar cluster**
1. Role a página para baixo
2. Clique no botão **"Create Cluster"** (botão verde/laranja)

**👀 O QUE VOCÊ DEVE VER:**
- Página "Security Quickstart"
- Mensagem sobre criar usuário de banco de dados
- Seu cluster sendo criado em background (pode demorar 3-5 minutos)

---

#### **Passo 3: Configurar Usuário Administrador**

**🎯 OBJETIVO:** Criar um usuário com senha para acessar o banco de dados.

**👀 O QUE VOCÊ DEVE VER:**
- Seção "How would you like to authenticate your connection?"
- Duas opções: "Username and Password" e "Certificate"

**🔐 3.1 - Escolher autenticação por senha**
1. Certifique-se que **"Username and Password"** está selecionado (padrão)

**📝 3.2 - Criar credenciais**
1. **Username**: Digite exatamente `admin`
2. **Password**: 
   - Clique em **"Autogenerate Secure Password"** (RECOMENDADO)
   - OU crie uma senha forte manualmente (mínimo 8 caracteres)
3. **CRÍTICO**: Clique em **"Copy"** ao lado da senha
4. **SALVE A SENHA**: Cole em um local seguro (bloco de notas, papel, etc.)

**⚠️ ATENÇÃO CRÍTICA:** Se você perder esta senha, terá que recriar tudo!

**✅ 3.3 - Criar usuário**
1. Clique no botão **"Create User"**

**👀 O QUE VOCÊ DEVE VER:**
- Mensagem de confirmação "Database user created"
- A seção muda para "Where would you like to connect from?"

---

#### **Passo 4: Configurar Acesso de Rede**

**🎯 OBJETIVO:** Permitir que sua aplicação acesse o banco de qualquer lugar.

**👀 O QUE VOCÊ DEVE VER:**
- Seção "Where would you like to connect from?"
- Opções como "My Local Environment", "Cloud Environment"

**🌐 4.1 - Configurar acesso global**
1. Clique em **"My Local Environment"** 
2. Vá para **"IP Access List"**
3. Clique em **"Add My Current IP Address"**
4. **IMPORTANTE**: Clique também em **"Allow Access from Anywhere"**
   - Isso adicionará o IP `0.0.0.0/0`

**✅ 4.2 - Confirmar configuração**
1. Clique em **"Finish and Close"**

**👀 O QUE VOCÊ DEVE VER:**
- Página principal do MongoDB Atlas
- Seu cluster `programa-indicacao` aparecendo
- Status pode ser "Creating..." inicialmente

**⏱️ 4.3 - Aguardar cluster ficar pronto**
1. **AGUARDE**: O cluster pode demorar 3-5 minutos para ficar pronto
2. **Atualize a página** se necessário
3. **Status final**: Deve mostrar um botão **"Connect"** quando estiver pronto

---

#### **Passo 5: Obter String de Conexão**

**🎯 OBJETIVO:** Conseguir a URL que sua aplicação usará para conectar no banco.

**👀 O QUE VOCÊ DEVE VER:**
- Seu cluster `programa-indicacao` com status online
- Botão **"Connect"** disponível

**🔗 5.1 - Iniciar conexão**
1. Clique no botão **"Connect"** no seu cluster

**👀 O QUE VOCÊ DEVE VER:**
- Modal "Connect to programa-indicacao" 
- Três opções de conexão

**🖱️ 5.2 - Escolher tipo de conexão**
1. Clique em **"Connect your application"**
   - **NÃO** clique em "MongoDB Compass" ou "MongoDB Shell"

**👀 O QUE VOCÊ DEVE VER:**
- Página para escolher driver e versão
- Campo com string de conexão

**⚙️ 5.3 - Configurar driver**
1. **Driver**: Selecione **"Node.js"**
2. **Version**: Selecione **"4.0 or later"**

**📋 5.4 - Copiar string de conexão**
1. Encontre o campo **"Connection string"**
2. Clique no botão **"Copy"** ao lado da string
3. **SALVE**: Cole em local seguro junto com a senha

**🔧 5.5 - Ajustar string de conexão**
1. A string vai parecer com isso:
```
mongodb+srv://admin:<password>@programa-indicacao.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

2. **SUBSTITUA** `<password>` pela senha real que você salvou:
```
mongodb+srv://admin:SUA_SENHA_REAL_AQUI@programa-indicacao.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**✅ VALIDAÇÃO FINAL:**
- [ ] ✅ Cluster `programa-indicacao` está online
- [ ] ✅ Usuário `admin` criado com senha salva
- [ ] ✅ Acesso de rede configurado (0.0.0.0/0)
- [ ] ✅ String de conexão copiada e senha substituída
- [ ] ✅ String final salva em local seguro

**🎉 PARABÉNS!** Seu banco MongoDB está pronto para usar!

---

### **🚀 2. Railway (20 min)**

**🎯 OBJETIVO:** Criar uma plataforma de hospedagem gratuita para seu backend Node.js.

**💡 O QUE VOCÊ VAI FAZER:**
- Criar conta no Railway conectada ao GitHub
- Conectar seu repositório para deploy automático
- Configurar variáveis de ambiente para produção
- Configurar comandos de build e start
- Realizar o primeiro deploy

---

#### **Passo 1: Criar Conta no Railway**

**🔗 1.1 - Acessar o site oficial**
1. Abra uma nova aba no navegador
2. Digite na barra de endereços: `https://railway.app`
3. Pressione Enter

**👀 O QUE VOCÊ DEVE VER:**
- Uma página escura/roxa com título "Railway"
- Texto sobre "Deploy from GitHub"
- Botão **"Login"** no canto superior direito

**🖱️ 1.2 - Iniciar login com GitHub**
1. Clique no botão **"Login"** (canto superior direito)
2. **IMPORTANTE**: Você precisa ter uma conta GitHub com seu código

**👀 O QUE VOCÊ DEVE VER:**
- Uma página com opções de login
- Botão **"Login with GitHub"** 

**🔐 1.3 - Conectar com GitHub**
1. Clique em **"Login with GitHub"**
2. Se não estiver logado no GitHub, faça login
3. **AUTORIZAR**: Clique em **"Authorize Railway"** quando aparecer

**👀 O QUE VOCÊ DEVE VER APÓS AUTORIZAR:**
- Dashboard do Railway
- Mensagem de boas-vindas
- Botão **"New Project"** em destaque

---

#### **Passo 2: Criar Projeto**

**🎯 OBJETIVO:** Conectar seu repositório GitHub ao Railway para deploy automático.

**👀 O QUE VOCÊ DEVE VER:**
- Dashboard principal do Railway
- Botão grande **"New Project"** ou **"Create a New Project"**

**🖱️ 2.1 - Iniciar novo projeto**
1. Clique no botão **"New Project"**

**👀 O QUE VOCÊ DEVE VER:**
- Modal ou página com opções de deploy
- Opções como:
  - "Deploy from GitHub repo"
  - "Deploy from template"
  - "Empty project"

**📂 2.2 - Escolher deploy do GitHub**
1. Clique em **"Deploy from GitHub repo"**

**👀 O QUE VOCÊ DEVE VER:**
- Lista dos seus repositórios GitHub
- Barra de busca para filtrar repositórios
- Repositório "Programa de indicação 03" (ou nome similar)

**🔍 2.3 - Selecionar repositório**
1. **ENCONTRE** seu repositório do programa de indicação
2. Clique no botão **"Deploy"** ou **"Deploy Now"** ao lado dele

**👀 O QUE VOCÊ DEVE VER APÓS CLICAR:**
- Página de configuração do projeto
- Railway detectando automaticamente que é Node.js
- Logs de build começando a aparecer

**⏱️ 2.4 - Aguardar detecção automática**
1. **AGUARDE** 1-2 minutos
2. Railway automaticamente:
   - Detecta que é projeto Node.js
   - Executa `npm install`
   - Tenta fazer build

**👀 SINAIS DE SUCESSO:**
- Logs mostrando "npm install" executando
- Status "Building" ou "Running"
- **NÃO SE PREOCUPE** se der erro agora - vamos configurar variáveis

---

#### **Passo 3: Configurar Variáveis de Ambiente**

**🎯 OBJETIVO:** Definir todas as configurações que sua aplicação precisa em produção.

**👀 O QUE VOCÊ DEVE VER:**
- Dashboard do seu projeto Railway
- Abas como "Deployments", "Variables", "Settings", "Logs"

**⚙️ 3.1 - Acessar variáveis**
1. Clique na aba **"Variables"** (ou "Environment Variables")

**👀 O QUE VOCÊ DEVE VER:**
- Página para adicionar variáveis de ambiente
- Campo para "Variable Name" e "Value"
- Botão **"Add Variable"** ou similar

**📝 3.2 - Adicionar variáveis uma por uma**

**VARIÁVEL 1 - NODE_ENV:**
1. **Variable Name**: `NODE_ENV`
2. **Value**: `production`
3. Clique **"Add"** ou pressione Enter

**VARIÁVEL 2 - PORT:**
1. **Variable Name**: `PORT`
2. **Value**: `3000`
3. Clique **"Add"**

**VARIÁVEL 3 - JWT_SECRET:**
1. **Variable Name**: `JWT_SECRET`
2. **Value**: Você precisa gerar uma chave segura
3. **COMO GERAR**:
   - Abra um terminal local
   - Execute: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Copie o resultado (será algo como: `a1b2c3d4e5f6...`)
4. Cole o valor gerado
5. Clique **"Add"**

**VARIÁVEL 4 - MONGODB_URI:**
1. **Variable Name**: `MONGODB_URI`
2. **Value**: Cole sua string do MongoDB que você salvou antes
   - Deve ser algo como: `mongodb+srv://admin:SUA_SENHA@programa-indicacao.xxxxx.mongodb.net/...`
3. Clique **"Add"**

**VARIÁVEL 5 - CLIENT_URL:**
1. **Variable Name**: `CLIENT_URL`
2. **Value**: `https://placeholder.vercel.app` (vamos atualizar depois)
3. Clique **"Add"**

**VARIÁVEL 6 - API_BASE_URL:**
1. **Variable Name**: `API_BASE_URL`
2. **Value**: `https://programa-indicacao-production.railway.app`
3. **IMPORTANTE**: Substitua pela sua URL real do Railway
4. Clique **"Add"**

**VARIÁVEL 7 - CLIENT_BASE_URL:**
1. **Variable Name**: `CLIENT_BASE_URL`
2. **Value**: `https://placeholder.vercel.app` (atualize com URL do Vercel depois)
3. Clique **"Add"**

**VARIÁVEL 8 - BACKEND_URL:**
1. **Variable Name**: `BACKEND_URL`
2. **Value**: `https://programa-indicacao-production.railway.app`
3. **IMPORTANTE**: Mesma URL do Railway
4. Clique **"Add"**

**VARIÁVEL 9 - BREVO_API_KEY:**
1. **Variable Name**: `BREVO_API_KEY`
2. **Value**: `placeholder` (vamos atualizar depois)
3. Clique **"Add"**

**✅ 3.3 - Verificar variáveis**
**VOCÊ DEVE TER ESTAS 9 VARIÁVEIS (padronizadas conforme ENV.EXAMPLE):**
- ✅ NODE_ENV = production
- ✅ PORT = 3000
- ✅ JWT_SECRET = (sua chave gerada)
- ✅ MONGODB_URI = (sua string MongoDB)
- ✅ CLIENT_URL = https://placeholder.vercel.app
- ✅ API_BASE_URL = https://sua-app.railway.app
- ✅ CLIENT_BASE_URL = https://placeholder.vercel.app
- ✅ BACKEND_URL = https://sua-app.railway.app
- ✅ BREVO_API_KEY = placeholder

**🔧 IMPORTANTE:** As variáveis API_BASE_URL, CLIENT_BASE_URL e BACKEND_URL são fundamentais para o sistema de detecção automática de ambiente funcionar corretamente!

---

#### **Passo 4: Configurar Build**

**🎯 OBJETIVO:** Ensinar o Railway como fazer build e executar sua aplicação.

**👀 O QUE VOCÊ DEVE VER:**
- Abas do projeto Railway
- Aba **"Settings"**

**⚙️ 4.1 - Acessar configurações**
1. Clique na aba **"Settings"**

**👀 O QUE VOCÊ DEVE VER:**
- Várias seções de configuração
- Seção sobre "Build & Deploy" ou "Environment"

**🔧 4.2 - Configurar comandos**
Procure pelas seguintes configurações e ajuste:

**Build Command:**
1. Encontre campo **"Build Command"**
2. Digite: `npm run build`

**Start Command:**
1. Encontre campo **"Start Command"**
2. Digite: `npm run start:prod`

**Root Directory:**
1. Encontre campo **"Root Directory"** ou **"Source"**
2. Digite: `server`
3. **IMPORTANTE**: Isso diz ao Railway que seu backend está na pasta `server`

**✅ 4.3 - Salvar configurações**
1. Clique em **"Save"** ou **"Update"** se houver
2. **OU** as mudanças podem salvar automaticamente

**🔄 4.4 - Trigger novo deploy**
1. Vá para aba **"Deployments"**
2. Clique em **"Deploy"** ou **"Redeploy"**
3. **OU** faça um push no GitHub para trigger automático

**👀 O QUE VOCÊ DEVE VER:**
- Logs de build começando
- Mensagens de `npm install`
- Build executando

---

#### **Passo 5: Verificar Deploy**

**🎯 OBJETIVO:** Confirmar que sua aplicação está rodando corretamente.

**📊 5.1 - Monitorar logs**
1. Vá para aba **"Logs"** ou **"Deployments"**
2. **AGUARDE** o build completar (2-5 minutos)

**👀 SINAIS DE SUCESSO NOS LOGS:**
- ✅ "npm install" concluído
- ✅ "npm run build" executado sem erro
- ✅ "Application is running on port 3000" ou similar
- ✅ Conexão com MongoDB estabelecida

**👀 SINAIS DE PROBLEMA:**
- ❌ Erros de "Module not found"
- ❌ "Connection failed" para MongoDB
- ❌ Build failed

**🌐 5.2 - Obter URL da aplicação**
1. Na página principal do projeto
2. Procure por **"Your app is live at:"** ou similar
3. **COPIE** a URL (será algo como: `https://programa-indicacao-production.railway.app`)
4. **SALVE** esta URL - você vai precisar dela!

**🧪 5.3 - Testar aplicação**
1. **Abra** a URL copiada em uma nova aba
2. **TESTE**: Adicione `/api/` no final da URL
   - Exemplo: `https://sua-app.railway.app/api/`

**👀 O QUE VOCÊ DEVE VER:**
- **SUCESSO**: Alguma resposta JSON ou mensagem da API
- **PROBLEMA**: Erro 500, 502, ou "Application Error"

**✅ VALIDAÇÃO FINAL RAILWAY:**
- [ ] ✅ Projeto criado e conectado ao GitHub
- [ ] ✅ 6 variáveis de ambiente configuradas
- [ ] ✅ Build configurado (npm run build, npm run start:prod)
- [ ] ✅ Root directory = server
- [ ] ✅ Deploy bem-sucedido (logs sem erro)
- [ ] ✅ URL da aplicação obtida e testada
- [ ] ✅ Endpoint /api/ responde

**🎉 PARABÉNS!** Seu backend está rodando na nuvem!

---

### **🌐 3. Vercel (15 min)**

**🎯 OBJETIVO:** Hospedar seu frontend (HTML/CSS/JS) gratuitamente com CDN global.

**💡 O QUE VOCÊ VAI FAZER:**
- Criar conta no Vercel conectada ao GitHub
- Importar repositório para deploy automático do frontend
- Configurar pasta `client` como root do projeto
- Realizar deploy e obter URL pública
- Testar se site está acessível

---

#### **Passo 1: Criar Conta no Vercel**

**🔗 1.1 - Acessar o site oficial**
1. Abra uma nova aba no navegador
2. Digite na barra de endereços: `https://vercel.com`
3. Pressione Enter

**👀 O QUE VOCÊ DEVE VER:**
- Uma página moderna e limpa do Vercel
- Texto sobre "Deploy web apps"
- Botões **"Sign up"** e **"Log in"** no topo

**🖱️ 1.2 - Iniciar cadastro**
1. Clique no botão **"Sign up"** (canto superior direito)

**👀 O QUE VOCÊ DEVE VER:**
- Página de registro com opções
- Botão **"Continue with GitHub"**
- Outras opções como GitLab, Bitbucket

**🔐 1.3 - Conectar com GitHub**
1. Clique em **"Continue with GitHub"**
2. Se não estiver logado no GitHub, faça login
3. **AUTORIZAR**: Clique em **"Authorize Vercel"** quando aparecer

**👀 O QUE VOCÊ DEVE VER APÓS AUTORIZAR:**
- Dashboard do Vercel
- Mensagem de boas-vindas
- Botão **"Import Project"** ou **"Add New Project"**

---

#### **Passo 2: Importar Projeto**

**🎯 OBJETIVO:** Conectar seu repositório GitHub para deploy automático do frontend.

**👀 O QUE VOCÊ DEVE VER:**
- Dashboard principal do Vercel
- Botão **"Add New..."** ou **"Import Project"**

**🖱️ 2.1 - Iniciar import**
1. Clique em **"Add New..."** 
2. Escolha **"Project"** no dropdown
3. **OU** clique diretamente em **"Import Project"**

**👀 O QUE VOCÊ DEVE VER:**
- Página "Import Git Repository"
- Lista dos seus repositórios GitHub
- Barra de busca

**📂 2.2 - Encontrar repositório**
1. **BUSQUE** pelo repositório "Programa de indicação 03" (ou nome similar)
2. **OU** use a barra de busca para filtrar

**👀 O QUE VOCÊ DEVE VER:**
- Seu repositório listado
- Botão **"Import"** ao lado do repositório

**🔍 2.3 - Importar repositório**
1. Clique no botão **"Import"** do seu repositório

**👀 O QUE VOCÊ DEVE VER APÓS CLICAR:**
- Página "Configure Project"
- Configurações de build
- Detectou automaticamente como projeto de frontend

---

#### **Passo 3: Configurar Deploy**

**🎯 OBJETIVO:** Configurar o Vercel para fazer deploy apenas do frontend (pasta client).

**👀 O QUE VOCÊ DEVE VER:**
- Página "Configure Project"
- Campos para:
  - Project Name
  - Framework Preset
  - Root Directory
  - Build and Output Settings

**📝 3.1 - Configurar informações básicas**

**Project Name:**
1. Deixe o nome sugerido ou mude para algo como `programa-indicacao`
2. **IMPORTANTE**: Este nome será parte da sua URL

**Framework Preset:**
1. **MUDE** de "Next.js" (se estiver) para **"Other"**
2. Clique no dropdown e selecione **"Other"**

**Root Directory:**
1. **CRÍTICO**: Clique em **"Edit"** ao lado de Root Directory
2. Digite: `client`
3. **IMPORTANTE**: Isso diz ao Vercel que o frontend está na pasta `client`

**🔧 3.2 - Configurar Build Settings**

**Build Command:**
1. Deixe **VAZIO** ou digite `npm run build` se você tiver um comando de build
2. **PARA ESTE PROJETO**: Deixe vazio (projeto HTML simples)

**Output Directory:**
1. Deixe como `.` (ponto) - diretório atual
2. **OU** deixe vazio

**Install Command:**
1. Deixe **VAZIO** 
2. **MOTIVO**: Projeto HTML não precisa de instalação de dependências

**✅ 3.3 - Verificar configurações**
**SUAS CONFIGURAÇÕES DEVEM ESTAR:**
- ✅ Framework Preset: Other
- ✅ Root Directory: client
- ✅ Build Command: (vazio)
- ✅ Output Directory: . ou (vazio)
- ✅ Install Command: (vazio)

---

#### **Passo 4: Fazer Deploy**

**🎯 OBJETIVO:** Executar o primeiro deploy e obter URL pública.

**👀 O QUE VOCÊ DEVE VER:**
- Todas configurações preenchidas
- Botão **"Deploy"** em destaque

**🚀 4.1 - Iniciar deploy**
1. Clique no botão **"Deploy"**

**👀 O QUE VOCÊ DEVE VER APÓS CLICAR:**
- Página de progresso do deploy
- Logs de build em tempo real
- Status "Building..." ou "Deploying..."

**⏱️ 4.2 - Aguardar build**
1. **AGUARDE** 2-3 minutos
2. Vercel irá:
   - Copiar arquivos da pasta `client`
   - Configurar CDN
   - Gerar URL pública

**👀 SINAIS DE SUCESSO:**
- ✅ Status muda para "Ready" ou "Completed"
- ✅ Aparece confetes na tela 🎉
- ✅ Mostra mensagem "Your project has been deployed"

**👀 SINAIS DE PROBLEMA:**
- ❌ Status "Failed" ou "Error"
- ❌ Logs mostrando erros vermelhos

**🌐 4.3 - Obter URL do site**
1. **APÓS SUCESSO**: Procure pela URL do seu site
2. Deve aparecer algo como: `https://programa-indicacao-xxxxx.vercel.app`
3. **COPIE** esta URL completa
4. **SALVE** - você vai precisar dela para configurar o backend!

---

#### **Passo 5: Testar Site**

**🎯 OBJETIVO:** Verificar se seu frontend está acessível e funcionando.

**🧪 5.1 - Testar acesso básico**
1. **CLIQUE** na URL gerada ou abra em nova aba
2. **OU** digite a URL no navegador

**👀 O QUE VOCÊ DEVE VER:**
- **SUCESSO**: Sua página de login ou página inicial carrega
- **PROBLEMA**: Erro 404, página em branco, ou erro do servidor

**🔍 5.2 - Testar navegação**
1. **TENTE** navegar entre páginas do site
2. **VERIFIQUE** se imagens, CSS e JS carregam

**⚠️ 5.3 - Problemas esperados (normal neste momento)**
**É NORMAL ter estes problemas agora:**
- ❌ Erro ao tentar fazer login (backend ainda não conectado)
- ❌ Formulários não funcionam (API não configurada)
- ❌ Dados não carregam (banco não conectado)

**✅ O QUE DEVE FUNCIONAR:**
- ✅ Páginas HTML carregam
- ✅ CSS aplicado corretamente
- ✅ Site acessível via HTTPS
- ✅ Navegação entre páginas estáticas

---

#### **Passo 6: Configurar Deploy Automático**

**🎯 OBJETIVO:** Garantir que novos commits façam deploy automático.

**⚙️ 6.1 - Verificar auto-deploy**
1. No dashboard do Vercel, vá para seu projeto
2. Procure por aba **"Settings"** ou **"Git"**

**👀 O QUE VOCÊ DEVE VER:**
- Configurações de Git
- **"Auto-deploy"** ou **"Automatic deployments"** HABILITADO

**🔄 6.2 - Testar auto-deploy (opcional)**
1. Faça uma pequena mudança no código local
2. Commit e push para GitHub
3. Vercel deve automaticamente fazer novo deploy

**✅ VALIDAÇÃO FINAL VERCEL:**
- [ ] ✅ Conta criada e conectada ao GitHub
- [ ] ✅ Projeto importado corretamente
- [ ] ✅ Root Directory configurado como `client`
- [ ] ✅ Framework Preset = Other
- [ ] ✅ Deploy concluído com sucesso
- [ ] ✅ URL pública obtida e testada
- [ ] ✅ Site acessível via HTTPS
- [ ] ✅ Páginas HTML carregam corretamente
- [ ] ✅ Auto-deploy configurado

**🎉 PARABÉNS!** Seu frontend está na internet!

---

### **📧 4. Brevo (Email) (12 min)**

**🎯 OBJETIVO:** Configurar serviço de email transacional gratuito para envio de notificações.

**💡 O QUE VOCÊ VAI FAZER:**
- Criar conta gratuita no Brevo (ex-SendinBlue)
- Verificar endereço de email como remetente
- Gerar API Key para integração com o backend
- Testar envio de email
- Configurar limite de 300 emails/dia grátis

---

#### **Passo 1: Criar Conta no Brevo**

**🔗 1.1 - Acessar o site oficial**
1. Abra uma nova aba no navegador
2. Digite na barra de endereços: `https://brevo.com`
3. Pressione Enter

**👀 O QUE VOCÊ DEVE VER:**
- Página do Brevo (ex-SendinBlue)
- Texto sobre "Email Marketing & Automation"
- Botão **"Sign up free"** ou **"Try for free"**

**🖱️ 1.2 - Iniciar cadastro**
1. Clique no botão **"Sign up free"**

**👀 O QUE VOCÊ DEVE VER:**
- Formulário de registro
- Campos para email, nome, empresa, etc.

**📝 1.3 - Preencher dados de cadastro**
1. **Email**: Digite seu email principal (será usado como remetente)
2. **First name**: Seu primeiro nome
3. **Last name**: Seu sobrenome
4. **Company**: Digite um nome (ex: "Programa Indicação")
5. **Website**: Pode deixar vazio ou colocar seu domínio
6. **Country**: Brasil
7. **Phone**: Seu telefone (opcional)
8. Marque **"I agree to the Terms and Conditions"**
9. Clique **"Create my account"**

**📧 1.4 - Verificar email**
1. Abra seu email
2. Procure email de "Brevo" (verifique spam)
3. Clique no link de verificação
4. Volta para o navegador

**👀 O QUE VOCÊ DEVE VER APÓS VERIFICAÇÃO:**
- Dashboard do Brevo
- Tour ou guia de boas-vindas
- Menu lateral com opções

---

#### **Passo 2: Configurar Sender (Remetente)**

**🎯 OBJETIVO:** Verificar seu email como remetente autorizado.

**👀 O QUE VOCÊ DEVE VER:**
- Dashboard principal do Brevo
- Menu lateral com várias opções

**⚙️ 2.1 - Acessar configurações de remetente**
1. **PROCURE** no menu lateral por **"Settings"** ou **"Configurações"**
2. Clique em **"Settings"**
3. **OU** procure por **"Senders, Domains & Dedicated IPs"**

**👀 O QUE VOCÊ DEVE VER:**
- Página de configurações
- Seção **"Senders"** ou **"Remetentes"**

**📧 2.2 - Adicionar sender**
1. Procure por botão **"Add a sender"** ou **"Adicionar remetente"**
2. Clique neste botão

**👀 O QUE VOCÊ DEVE VER:**
- Modal ou formulário para adicionar remetente
- Campos para email e nome

**📝 2.3 - Configurar dados do remetente**
1. **Sender email**: Digite o email que você usou para se cadastrar
2. **Sender name**: Digite um nome amigável (ex: "Programa Indicação")
3. Clique **"Save"** ou **"Add sender"**

**📧 2.4 - Verificar email de remetente**
1. Brevo enviará um email de verificação
2. Vá para sua caixa de entrada
3. Procure por email de "Brevo" sobre verificação de remetente
4. Clique no link **"Verify this sender"** ou similar

**👀 SINAIS DE SUCESSO:**
- ✅ Status do sender muda para "Verified" ou "Verificado"
- ✅ Email aparece na lista de senders aprovados

---

#### **Passo 3: Gerar API Key**

**🎯 OBJETIVO:** Obter chave de API para integração com seu backend.

**👀 O QUE VOCÊ DEVE VER:**
- Ainda na área de Settings do Brevo

**🔑 3.1 - Acessar API Keys**
1. **NO MENU SETTINGS**, procure por **"API Keys"**
2. Clique em **"API Keys"**

**👀 O QUE VOCÊ DEVE VER:**
- Página com lista de API Keys (provavelmente vazia)
- Botão **"Generate a new API key"** ou **"Create API Key"**

**🖱️ 3.2 - Criar nova API Key**
1. Clique em **"Generate a new API key"**

**👀 O QUE VOCÊ DEVE VER:**
- Modal para configurar a API Key
- Campo para nome da API Key

**📝 3.3 - Configurar API Key**
1. **Name**: Digite `Programa Indicacao` (ou nome descritivo)
2. **Permissions**: Deixe as padrões (normalmente já vem marcado "Send emails")
3. Clique **"Generate"** ou **"Create"**

**🔑 3.4 - Copiar API Key**
1. **IMPORTANTE**: A API Key aparecerá apenas UMA VEZ
2. **COPIE** a API Key completa (será algo longo como: `xkeysib-xxxxx...`)
3. **SALVE** em local seguro (bloco de notas, arquivo)

**⚠️ ATENÇÃO CRÍTICA:** Se você perder esta API Key, terá que gerar outra!

**👀 SINAIS DE SUCESSO:**
- ✅ API Key criada e salva
- ✅ Aparece na lista de API Keys
- ✅ Status "Active" ou "Ativa"

---

#### **Passo 4: Verificar Limite Gratuito**

**🎯 OBJETIVO:** Confirmar que você tem 300 emails/dia gratuitos.

**📊 4.1 - Verificar plano atual**
1. No dashboard, procure por **"Plan"**, **"Billing"** ou **"Faturamento"**
2. **OU** procure no menu lateral por **"My Plan"**

**👀 O QUE VOCÊ DEVE VER:**
- Informações do plano atual
- **"Free Plan"** ou **"Plano Gratuito"**
- Limite de **"300 emails/day"** ou **"300 emails/dia"**

**📈 4.2 - Verificar estatísticas**
1. Vá para **"Statistics"** ou **"Estatísticas"** no menu
2. Veja dashboard com estatísticas de envio

**👀 O QUE VOCÊ DEVE VER:**
- Dashboard com gráficos (todos zerados inicialmente)
- Informações sobre emails enviados (0)
- Limite diário disponível

---

#### **Passo 5: Teste Básico (Opcional)**

**🎯 OBJETIVO:** Fazer um teste simples para verificar se tudo funciona.

**✉️ 5.1 - Teste de envio manual**
1. Procure por **"Campaigns"** ou **"Send a test email"**
2. **OU** ignore este passo por enquanto

**⚠️ NOTA:** Você pode pular este passo. O teste real será feito quando conectarmos com o backend.

---

#### **Passo 6: Atualizar Railway**

**🎯 OBJETIVO:** Atualizar a variável de ambiente no Railway com a API Key real.

**🔄 6.1 - Voltar ao Railway**
1. Abra nova aba com `https://railway.app`
2. Vá para seu projeto do programa de indicação
3. Clique na aba **"Variables"**

**🔧 6.2 - Atualizar BREVO_API_KEY**
1. **ENCONTRE** a variável `BREVO_API_KEY`
2. Clique no ícone de **"Edit"** ou **"Editar"**
3. **SUBSTITUA** `placeholder` pela sua API Key real do Brevo
4. **SALVE** a mudança

**🔄 6.3 - Redeploy (se necessário)**
1. **OPCIONAL**: Vá para aba "Deployments"
2. Clique em **"Redeploy"** para aplicar a nova configuração

**✅ VALIDAÇÃO FINAL BREVO:**
- [ ] ✅ Conta Brevo criada e verificada
- [ ] ✅ Email verificado como sender
- [ ] ✅ API Key gerada e salva
- [ ] ✅ Plano gratuito confirmado (300 emails/dia)
- [ ] ✅ API Key atualizada no Railway
- [ ] ✅ Limite diário disponível confirmado

**🎉 PARABÉNS!** Seu sistema de email está configurado!

**📝 IMPORTANTE PARA DEPOIS:**
- Sua API Key do Brevo: [salve em local seguro]
- Limite: 300 emails/dia
- Sender verificado: [seu email]
- Para aumentar limite: Você pode upgradar o plano depois

---

## 🔗 **ETAPA 4: ATUALIZAR URLS ENTRE SERVIÇOS (10 min)**

**🎯 OBJETIVO:** Conectar corretamente frontend (Vercel) com backend (Railway) utilizando URLs reais.

### **📝 Passo 1: Atualizar Railway com URL do Vercel**

#### **1.1 - Obter URL real do Vercel**
1. **Volte ao Vercel Dashboard**
2. **Copie** a URL real do seu site (ex: `https://programa-indicacao-abc123.vercel.app`)

#### **1.2 - Atualizar variáveis no Railway**
1. **Volte ao Railway Dashboard**
2. **Vá para aba "Variables"**
3. **Atualizar as seguintes variáveis:**

```bash
# Substitua os placeholders pelas URLs reais:
CLIENT_URL=https://programa-indicacao-abc123.vercel.app
CLIENT_BASE_URL=https://programa-indicacao-abc123.vercel.app

# Confirme se estas estão com a URL do Railway:
API_BASE_URL=https://programa-indicacao-production.railway.app
BACKEND_URL=https://programa-indicacao-production.railway.app
```

#### **1.3 - Redeploy para aplicar mudanças**
1. **Clique em "Deployments"**
2. **Clique em "Redeploy"** para aplicar as novas URLs
3. **Aguarde** o deploy completar

### **🔍 Passo 2: Verificar Detecção Automática de Ambiente**

#### **2.1 - Testar no navegador**
1. **Acesse sua URL do Vercel**
2. **Abra Developer Tools (F12)**
3. **Vá para aba Console**
4. **Digite:** `window.APP_CONFIG`

#### **👀 O que você deve ver:**
```javascript
{
  apiBaseUrl: "https://programa-indicacao-production.railway.app",
  clientBaseUrl: "https://programa-indicacao-abc123.vercel.app",
  environment: "production"
}
```

#### **✅ Sinais de sucesso:**
- ✅ `environment: "production"` (não development)
- ✅ `apiBaseUrl` aponta para Railway (não localhost)
- ✅ URLs corretas sendo detectadas automaticamente

### **🧪 Passo 3: Testar Conexão Frontend-Backend**

#### **3.1 - Teste de conectividade**
1. **No console do navegador, digite:**
```javascript
fetch(window.APP_CONFIG.apiBaseUrl + '/api/')
  .then(r => r.text())
  .then(console.log)
```

#### **👀 Resultado esperado:**
- ✅ Resposta da API (não erro de CORS)
- ✅ Sem erros no console
- ✅ Conexão estabelecida com Railway

#### **3.2 - Teste funcional**
1. **Tente fazer login** (se funcionalidade disponível)
2. **Verifique Network tab** (F12 → Network)
3. **Confirme requests vão para Railway** (não localhost)

### **✅ Validação Final da Integração:**
- [ ] ✅ URLs do Railway atualizadas no Railway
- [ ] ✅ Frontend detecta ambiente production
- [ ] ✅ API calls vão para Railway (não localhost)
- [ ] ✅ CORS configurado corretamente
- [ ] ✅ Não há erros no console do navegador
- [ ] ✅ Sistema de detecção automática funcionando

**🎯 RESULTADO:** Frontend e backend agora estão conectados e comunicando corretamente!

---

## ✅ **RESUMO FINAL DA ETAPA 3**

**🎉 PARABÉNS!** Você completou todas as configurações de contas necessárias!

### **📋 CHECKLIST FINAL DA ETAPA 3:**
- [ ] ✅ **MongoDB Atlas:** Cluster criado, usuário configurado, connection string obtida
- [ ] ✅ **Railway:** Projeto conectado, 9 variáveis padronizadas configuradas, deploy executado  
- [ ] ✅ **Vercel:** Frontend online, URL pública obtida, auto-deploy configurado
- [ ] ✅ **Brevo:** Conta criada, sender verificado, API key configurada
- [ ] ✅ **URLs Integradas:** Frontend e backend conectados com URLs reais

### **🔗 SUAS URLs E CREDENCIAIS:**
**SALVE ESTAS INFORMAÇÕES** - você vai precisar delas nas próximas etapas:

```
📊 MONGODB ATLAS:
- Connection String: mongodb+srv://admin:SUA_SENHA@programa-indicacao.xxxxx.mongodb.net/...
- Usuário: admin
- Senha: [sua senha salva]

🚀 RAILWAY (Backend):
- URL da API: https://programa-indicacao-production.railway.app
- Status: [verificar se está online]

🌐 VERCEL (Frontend):
- URL do Site: https://programa-indicacao-xxxxx.vercel.app  
- Status: [verificar se carrega]

📧 BREVO (Email):
- API Key: xkeysib-xxxxx... [sua chave]
- Sender: [seu email verificado]
- Limite: 300 emails/dia

🔐 SEGURANÇA:
- JWT Secret: [chave gerada para Railway]
```

### **🔧 PRÓXIMOS PASSOS:**
Agora que todas as contas estão criadas e URLs conectadas, vamos:
1. **ETAPA 5:** Testes de integração completos  
2. **ETAPA 6:** Configurar monitoramento
3. **ETAPA 7:** Validações de segurança
4. **ETAPA 8:** Go-live final

### **🆕 MELHORIAS IMPLEMENTADAS:**
- ✅ **Sistema de detecção automática de ambiente** via `config.js`
- ✅ **9 variáveis padronizadas** conforme `ENV.EXAMPLE`
- ✅ **URLs centralizadas** - nenhuma URL hardcodada no código
- ✅ **Detecção por hostname** - automaticamente detecta desenvolvimento vs produção
- ✅ **Fallbacks seguros** - localhost como fallback no backend

### **⚠️ SE ALGO DEU ERRADO:**
- **MongoDB:** Verifique se cluster está online e connection string está correta
- **Railway:** Verifique se variáveis de ambiente estão todas configuradas
- **Vercel:** Verifique se Root Directory está como `client`
- **Brevo:** Verifique se sender foi verificado por email

**🆘 DICA:** Se algum serviço não estiver funcionando, volte na seção específica e refaça os passos com mais atenção.

---

## 🚀 **ETAPA 5: TESTES DE INTEGRAÇÃO COMPLETOS (20 min)**

### **🔧 Preparação Local**
```bash
# 1. Entrar no diretório do servidor
cd server

# 2. Verificar se build funciona
npm install
npm run build

# 3. Commitar mudanças se necessário
git add .
git commit -m "feat: configurações para deploy Railway"
git push origin main
```

### **⚙️ Configurar Variáveis no Railway**

1. **Acessar seu projeto Railway**
2. **Ir para "Variables"**
3. **Adicionar/Atualizar variáveis:**

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=gerar_chave_256_bits_aqui
MONGODB_URI=sua_connection_string_completa
CLIENT_URL=https://seu-app.vercel.app
BREVO_API_KEY=sua_api_key_brevo
```

#### **🔐 Gerar JWT_SECRET Seguro:**
```bash
# Executar no terminal para gerar chave segura:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **🚀 Deploy Automático**
1. **Railway detecta push no GitHub automaticamente**
2. **Aguardar build** (3-5 min)
3. **Verificar logs** para erros
4. **Copiar URL do deploy** (ex: https://programa-indicacao-production.railway.app)

### **✅ Testar Backend Deployed**
```bash
# 1. Testar endpoint básico
curl https://sua-app.railway.app/api/

# 2. Testar endpoint de health (se houver)
curl https://sua-app.railway.app/api/health

# 3. Verificar logs no Railway Dashboard
```

#### **🔍 Sinais de Deploy Bem-Sucedido:**
- ✅ Build concluído sem erros
- ✅ Aplicação rodando na URL
- ✅ Logs mostram "Application is running on port 3000"
- ✅ Endpoints respondem (não 500/502)

---

## 🌐 **ETAPA 6: CONFIGURAR MONITORAMENTO (15 min)**

### **🔧 Atualizar URLs da API**

#### **Passo 1: Localizar arquivos de configuração**
```bash
# Buscar por URLs hardcoded do localhost
cd client
grep -r "localhost:3000" .
grep -r "127.0.0.1" .
```

#### **Passo 2: Atualizar URLs principais**
Procurar nos arquivos JS por configurações como:
```javascript
// Substituir configurações como esta:
const API_BASE_URL = 'http://localhost:3000/api';

// Por:
const API_BASE_URL = 'https://sua-app.railway.app/api';
```

#### **📁 Arquivos comuns para verificar:**
- `client/js/modules/api-client.js`
- `client/js/auth.js`
- `client/js/dashboard.js`
- Qualquer arquivo com fetch() ou axios()

### **🚀 Commit e Deploy Automático**
```bash
# 1. Commit das mudanças
git add client/
git commit -m "feat: atualizar URLs da API para produção"
git push origin main

# 2. Vercel deployrá automaticamente
# 3. Aguardar 2-3 min
```

### **✅ Testar Frontend**
1. **Acessar URL do Vercel**
2. **Abrir Developer Tools** (F12)
3. **Verificar Console** - sem erros de CORS
4. **Testar login** (se disponível)
5. **Verificar network tab** - calls para Railway

#### **🔍 Sinais de Frontend Funcionando:**
- ✅ Páginas carregam sem erro
- ✅ Console sem erros de CORS
- ✅ Requests vão para Railway (não localhost)
- ✅ Formulários fazem chamadas para API

---

## 📧 **ETAPA 7: VALIDAÇÕES DE SEGURANÇA (10 min)**

### **🔧 Atualizar Variável no Railway**
1. **Voltar ao Railway Dashboard**
2. **Variables** → Atualizar:
```bash
BREVO_API_KEY=sua_api_key_brevo_real
```

### **📧 Testar Envio de Email**
```bash
# 1. Fazer uma ação que trigger email (ex: registro)
# 2. Verificar logs no Railway
# 3. Verificar dashboard do Brevo
# 4. Verificar caixa de entrada do email teste
```

### **🔍 Verificar Brevo Dashboard**
1. **Login no Brevo**
2. **Statistics** → verificar emails enviados
3. **Logs** → verificar se não há errors

#### **✅ Validação Email:**
- [ ] ✅ Email de teste recebido
- [ ] ✅ Brevo dashboard mostra envio
- [ ] ✅ Railway logs sem errors de email
- [ ] ✅ Templates renderizando corretamente

---

## ✅ **ETAPA 8: GO-LIVE FINAL (20 min)**

### **🧪 Cenários de Teste Obrigatórios**

#### **1. Fluxo de Autenticação**
```bash
# Testar via Frontend:
1. Acessar página de login
2. Tentar login com credenciais inválidas
3. Verificar mensagem de erro
4. Login com credenciais válidas
5. Verificar redirect para dashboard
6. Logout e verificar redirect
```

#### **2. Isolamento de Dados (JWT Multicliente)**
```bash
# Testar via API direta:
curl -X POST https://sua-app.railway.app/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente1@teste.com","password":"senha123"}'

# Verificar se retorna token
# Testar endpoints protegidos com token
```

#### **3. Funcionalidades Core**
- [ ] ✅ Criação de campanhas
- [ ] ✅ Gestão de participantes
- [ ] ✅ Landing pages carregando
- [ ] ✅ Formulários de indicação
- [ ] ✅ Sistema de recompensas

#### **4. Performance Básica**
- [ ] ✅ Tempo de resposta < 3s
- [ ] ✅ Páginas carregam rapidamente
- [ ] ✅ Database queries funcionando

### **🔍 Logs para Monitorar**
```bash
# Railway Logs:
- Verificar startup sem errors
- Verificar conexão com MongoDB
- Verificar requests de API

# Vercel Logs:
- Verificar build success
- Verificar requests frontend

# MongoDB Atlas:
- Verificar connections
- Verificar queries executadas
```

---

## 🔒 **ETAPA 7: VALIDAÇÕES DE SEGURANÇA (10 min)**

### **🛡️ Checklist de Segurança**

#### **1. JWT e Autenticação**
```bash
# Testar token inválido:
curl -H "Authorization: Bearer token_invalido" \
  https://sua-app.railway.app/api/protected-endpoint

# ✅ Deve retornar 401 Unauthorized
```

#### **2. CORS Configuration**
```bash
# Testar CORS do navegador:
# Frontend deve conseguir fazer requests
# Outros domínios devem ser bloqueados
```

#### **3. Variáveis de Ambiente**
- [ ] ✅ JWT_SECRET nunca exposto no código
- [ ] ✅ MONGODB_URI com credenciais seguras
- [ ] ✅ API_KEYS não commitadas no Git
- [ ] ✅ NODE_ENV=production configurado

#### **4. Isolamento de Dados**
```bash
# Executar script de teste:
cd server
node test-jwt-multicliente.js

# ✅ Deve passar em todos os testes
```

### **🔐 Recomendações Adicionais**
- [ ] ✅ HTTPS habilitado automaticamente
- [ ] ✅ Conexões database criptografadas
- [ ] ✅ Rate limiting básico (se implementado)
- [ ] ✅ Input validation funcionando

---

## 📊 **ETAPA 8: MONITORAMENTO BÁSICO (15 min)**

### **⏱️ Configurar UptimeRobot (Gratuito)**

#### **Passo 1: Criar Conta**
1. Acesse: https://uptimerobot.com
2. Cadastre-se gratuitamente
3. Limite: 50 monitores gratuitos

#### **Passo 2: Adicionar Monitores**
```bash
# Monitor 1: Backend API
URL: https://sua-app.railway.app/api/
Type: HTTP(s)
Interval: 5 minutes

# Monitor 2: Frontend
URL: https://sua-app.vercel.app
Type: HTTP(s)  
Interval: 5 minutes
```

#### **Passo 3: Configurar Alertas**
1. **Alert Contacts** → adicionar seu email
2. **Configurar notificação** quando down > 5 min
3. **Configurar notificação** quando volta online

### **📊 Dashboards Nativos**

#### **Railway Analytics:**
- Acessar dashboard do Railway
- Verificar **Metrics** → CPU, Memory, Network
- Configurar **Alerts** para uso alto

#### **Vercel Analytics:**
- Acessar dashboard do Vercel
- Verificar **Analytics** → Page views, Performance
- Verificar **Functions** (se houver)

#### **MongoDB Atlas:**
- Acessar **Metrics** no cluster
- Verificar connections, operations
- Configurar **Alerts** para problemas

#### **Brevo Statistics:**
- Verificar emails sent/delivered
- Monitor bounce rate
- Verificar reputation score

### **✅ Validação Monitoramento:**
- [ ] ✅ UptimeRobot configurado e enviando pings
- [ ] ✅ Alertas de email configurados
- [ ] ✅ Dashboards nativos acessíveis
- [ ] ✅ Métricas básicas sendo coletadas

---

## 🚨 **TROUBLESHOOTING COMUM**

### **❌ Backend não Deploy**

#### **Erro: Build Failed**
```bash
# Verificar logs do Railway:
1. Ir para Deploy logs
2. Procurar por errors de npm install
3. Verificar se package.json está correto

# Solução comum:
- Verificar Node.js version no package.json
- Limpar cache: Railway → Settings → Clear cache
- Re-deploy manual
```

#### **Erro: Application Crashed**
```bash
# Verificar:
1. Railway logs → Runtime errors
2. MongoDB connection string
3. Variáveis de ambiente

# Comandos debug:
- Verificar PORT=3000 definido
- Verificar MONGODB_URI válido
- Testar conexão local primeiro
```

### **❌ Frontend CORS Errors**

#### **Erro: Blocked by CORS Policy**
```bash
# Verificar:
1. CLIENT_URL no Railway matches Vercel URL
2. CORS configuration no backend
3. URLs no frontend corretas

# Solução:
- Atualizar CLIENT_URL no Railway
- Verificar se backend permite o domain do Vercel
```

### **❌ Database Connection Issues**

#### **Erro: MongoDB Connection Failed**
```bash
# Verificar:
1. MongoDB Atlas → Network Access (0.0.0.0/0)
2. Database User criado e senha correta
3. Connection string format

# Connection string correta:
mongodb+srv://admin:SENHA@cluster.xxxxx.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

### **❌ Email não Enviando**

#### **Erro: Brevo API Errors**
```bash
# Verificar:
1. BREVO_API_KEY válida
2. Sender email verificado
3. Não excedeu limite de 300/dia

# Debug:
- Testar API key no Postman
- Verificar Brevo dashboard para errors
- Verificar logs do Railway
```

### **🔧 Comandos de Debug Úteis**

```bash
# Testar endpoints:
curl -v https://sua-app.railway.app/api/health

# Verificar DNS:
nslookup sua-app.railway.app

# Testar conectividade:
ping sua-app.railway.app

# Ver headers HTTP:
curl -I https://sua-app.vercel.app
```

---

## 🚦 **PLANO DE ROLLBACK**

### **🚨 Se Deploy Falhar Completamente:**

#### **1. Diagnóstico Rápido (5 min)**
```bash
# Verificar status:
1. Railway dashboard → última deploy
2. Vercel dashboard → último build  
3. UptimeRobot → status current
4. MongoDB Atlas → connections

# Identificar componente com problema
```

#### **2. Rollback por Componente**

**🚀 Railway (Backend):**
```bash
# Opção 1: Rollback pelo dashboard
1. Railway → Deployments
2. Selecionar deploy anterior funcionando
3. "Redeploy"

# Opção 2: Rollback via Git
git revert HEAD
git push origin main
```

**🌐 Vercel (Frontend):**
```bash
# Rollback automático:
1. Vercel dashboard → Deployments  
2. Deploy anterior → "Promote to Production"

# Ou via Git:
git revert HEAD~1 -- client/
git commit -m "rollback: frontend to working version"
git push origin main
```

#### **3. Validação Pós-Rollback**
- [ ] ✅ Site acessível
- [ ] ✅ Login funcionando
- [ ] ✅ API respondendo
- [ ] ✅ Monitoramento verde

#### **4. Análise de Causa Raiz**
1. **Coletar logs** de todos os componentes
2. **Identificar** exatamente o que quebrou
3. **Reproduzir** problema localmente
4. **Corrigir** em ambiente local
5. **Testar** localmente antes de novo deploy
6. **Documentar** lição aprendida

---

## 📋 **RESUMO FINAL - STATUS MVP**

### **✅ STACK IMPLEMENTADA:**
```
🚀 Backend:    Railway + NestJS + JWT Multicliente
🗄️ Database:   MongoDB Atlas M0 (512MB gratuito)
🌐 Frontend:   Vercel + HTML/JS/CSS 
📧 Email:      Brevo (300 emails/dia gratuito)
🔒 Security:   HTTPS automático + JWT + CORS
📊 Monitor:    UptimeRobot + Dashboards nativos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 CUSTO:      $0/mês iniciais
⏱️ SETUP:      2-3 horas total
🎯 CAPACIDADE: Suporta centenas de usuários
📈 ESCALABILIDADE: Migração simples quando necessário
```

### **🎯 FUNCIONALIDADES VALIDADAS:**
- [x] ✅ Sistema de autenticação multicliente
- [x] ✅ Isolamento total de dados entre clientes
- [x] ✅ Gestão de campanhas e landing pages
- [x] ✅ Sistema de indicações e recompensas
- [x] ✅ Dashboard e métricas básicas
- [x] ✅ Email transacional funcionando
- [x] ✅ HTTPS e segurança básica
- [x] ✅ Monitoramento de uptime

### **📊 PRÓXIMOS PASSOS (PÓS-MVP):**

#### **🚀 Crescimento (Quando necessário):**
```
📊 Monitoramento:
├── Railway Pro ($5/mês) → métricas avançadas
├── MongoDB Atlas M2 ($9/mês) → performance
└── Vercel Pro ($20/mês) → analytics avançados

🔧 Funcionalidades:
├── Analytics avançados
├── A/B testing landing pages  
├── Email marketing campaigns
├── Integração com e-commerce
└── Mobile app (PWA)

🛡️ Segurança:
├── Rate limiting avançado
├── WAF (Web Application Firewall)
├── Backup automático 
└── Disaster recovery
```

### **🏆 STATUS FINAL:**

```
🟢 MVP PRONTO PARA PRODUÇÃO

✅ Infraestrutura: Deploy automatizado
✅ Segurança: JWT multicliente validado
✅ Performance: Otimizada para MVP
✅ Monitoramento: Básico configurado
✅ Escalabilidade: Plano de crescimento
✅ Custo: $0/mês iniciais
✅ Documentação: Completa e testada

🚀 PODE RECEBER USUÁRIOS REAIS COM CONFIANÇA!
```

---

### **📞 Suporte Contínuo:**
- 📊 **Monitorar métricas** nas primeiras 24-48h
- 🔍 **Revisar logs** semanalmente
- 💬 **Coletar feedback** de usuários
- 📈 **Planejar melhorias** baseadas em uso real
- 🚀 **Escalar componentes** conforme demanda

*Deploy MVP realizado seguindo melhores práticas de DevOps, segurança e economia.*

---

## 📚 **DOCUMENTAÇÃO DE REFERÊNCIA**

### **📖 Documentos Criados Durante o Desenvolvimento:**

#### **🔧 `docs/README_VARIAVEIS_DE_AMBIENTE.md`**
- **Descrição:** Guia completo sobre gerenciamento de variáveis de ambiente
- **Conteúdo:** Diferenças entre desenvolvimento e produção, lista completa de variáveis, configurações de segurança
- **Uso:** Consultar sempre que precisar configurar ou entender as variáveis do sistema

#### **⚙️ `server/ENV.EXAMPLE`**
- **Descrição:** Template de exemplo para configuração local de desenvolvimento
- **Conteúdo:** Todas as variáveis necessárias com valores de exemplo para localhost
- **Uso:** Copiar para `.env` e personalizar para desenvolvimento local

#### **🌐 `client/js/config.js`**
- **Descrição:** Sistema centralizado de configuração do frontend
- **Conteúdo:** Detecção automática de ambiente, URLs configuradas dinamicamente
- **Uso:** Sistema funciona automaticamente - detecta se está em localhost ou produção

### **🆕 MELHORIAS IMPLEMENTADAS:**

#### **🔄 Sistema de Detecção Automática de Ambiente**
```javascript
// O sistema agora detecta automaticamente o ambiente:
// - localhost = desenvolvimento (usa http://localhost:3000)  
// - vercel.app ou railway.app = produção (usa URLs dos serviços)
```

#### **🏗️ Arquitetura de URLs Padronizada**
```bash
# Backend (server/.env):
API_BASE_URL=http://localhost:3000          # local
CLIENT_BASE_URL=http://localhost:5501       # local
# Em produção: automaticamente usa URLs do Railway/Vercel

# Frontend (client/js/config.js):
# Detecta automaticamente via window.location.hostname
# Nunca precisa ser alterado manualmente
```

#### **🛡️ Melhorias de Segurança**
- ✅ **Nenhuma URL hardcodada** no código fonte
- ✅ **Variáveis centralizadas** em ENV.EXAMPLE
- ✅ **Detecção automática** evita configuração manual  
- ✅ **Fallbacks seguros** para localhost em desenvolvimento
- ✅ **Separação clara** entre ambientes dev/prod

#### **🔧 Processo de Deploy Simplificado**
1. **Desenvolvimento:** Usar ENV.EXAMPLE → .env local
2. **Produção:** Railway/Vercel detectam automaticamente
3. **Zero configuração manual** de URLs após setup inicial
4. **Deploy automático** via GitHub push

### **📋 CHECKSUMS DE VALIDAÇÃO**

#### **Arquivos Principais Atualizados:**
```bash
# Use estes comandos para verificar se os arquivos estão corretos:

# 1. Verificar config.js centralizado:
grep -q "window.APP_CONFIG" client/js/config.js && echo "✅ Config centralizado OK"

# 2. Verificar ENV.EXAMPLE existe:
ls server/ENV.EXAMPLE > /dev/null && echo "✅ ENV.EXAMPLE existe"

# 3. Verificar ausência de URLs hardcodadas:
! grep -r "railway.app\|vercel.app" client/ --exclude-dir=node_modules && echo "✅ Sem URLs hardcodadas"

# 4. Verificar sistema de detecção:
grep -q "hostname" client/js/config.js && echo "✅ Detecção automática OK"
```

### **🚀 COMANDOS DE VALIDAÇÃO RÁPIDA**

#### **Deploy Bem-Sucedido:**
```bash
# Verificar se tudo está funcionando:
curl -s https://sua-app.railway.app/api/ && echo "✅ Backend OK"
curl -s https://sua-app.vercel.app && echo "✅ Frontend OK"
```

#### **Desenvolvimento Local:**
```bash
# Verificar setup local:
cd server && npm run start:dev &
cd client && python -m http.server 5501 &
curl http://localhost:3000/api/ && echo "✅ Backend local OK"
curl http://localhost:5501 && echo "✅ Frontend local OK"
```

---

**🎯 RESULTADO FINAL:** Sistema com arquitetura robusta, detecção automática de ambiente, variáveis padronizadas e processo de deploy simplificado para máxima eficiência em desenvolvimento e produção.
