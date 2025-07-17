# 🚀 Guia de Desenvolvimento - Programa de Indicação

## 📋 Configuração Inicial (Faça apenas 1 vez)

### 1. Clone e Configuração
```bash
# Se ainda não clonou
git clone <seu-repositorio>
cd "Programa de indicação 03"

# Instalar dependências do backend
cd server
npm install
cd ..

# Instalar dependências do frontend (se houver)
npm install
```

### 2. Variáveis de Ambiente Locais
Crie o arquivo `server/.env.local`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=seu-jwt-secret-local-pode-ser-diferente
MONGODB_URI=mongodb://localhost:27017/programa-indicacao-dev
CLIENT_URL=http://localhost:8080
SUPER_ADMIN_EMAIL=admin@programa-indicacao.com
SUPER_ADMIN_PASSWORD=Admin@123456
```

### 3. MongoDB Local (Opcional)
```bash
# Opção A: Usar MongoDB local
# Instalar MongoDB Community Edition no Windows
# Ou usar Docker: docker run -d -p 27017:27017 mongo

# Opção B: Usar o mesmo Atlas de produção (mais fácil)
# No .env.local, usar a mesma MONGODB_URI do Railway
```

## 🔄 Fluxo de Trabalho Diário

### Quando Abrir o Projeto
```bash
# 1. Abrir o Cursor no diretório do projeto
cd "D:\DEV PROJETOS\Programa de indicação 03"
cursor .

# 2. Iniciar backend local (Terminal 1)
cd server
npm run start:dev

# 3. Iniciar frontend local (Terminal 2)
cd client
# Usar Live Server do VS Code ou
python -m http.server 8080
# ou
npx serve -p 8080
```

### URLs de Desenvolvimento
- **Frontend Local**: `http://localhost:8080`
- **Backend Local**: `http://localhost:3000`
- **Admin Local**: `http://localhost:8080/admin/pages/login.html`

### Quando Terminar o Desenvolvimento
```bash
# Parar os servidores (Ctrl+C nos terminais)
# Fechar o Cursor
# Pronto! Nada mais necessário
```

## 🌐 URLs de Produção (Sempre Online)
- **Frontend**: `https://app.virallead.com.br`
- **Backend**: `https://programa-indicacao-multicliente-production.up.railway.app`
- **Admin**: `https://app.virallead.com.br/admin/pages/login.html`

## 🔀 Configuração Automática de URLs

O sistema detecta automaticamente o ambiente:

```javascript
// Em config.js
const API_URL = window.location.hostname === 'localhost' ? 
                'http://localhost:3000/api' : 
                'https://programa-indicacao-multicliente-production.up.railway.app/api';
```

## 📦 Deploy Automático

Quando você fizer push:
```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

**Deploys automáticos:**
- ✅ **Vercel**: Frontend atualizado em ~30 segundos
- ✅ **Railway**: Backend atualizado em ~2 minutos

## 🎯 Recomendação de Fluxo

### Para Melhorias Pequenas
1. Abrir Cursor
2. Editar arquivos
3. Testar em produção diretamente
4. Commit e push

### Para Melhorias Grandes/Arriscadas
1. Abrir Cursor
2. Iniciar ambiente local (`npm run start:dev`)
3. Desenvolver e testar localmente
4. Quando estiver OK, fazer commit e push
5. Testar em produção

## 🚨 Importante

- **Nunca** commitar arquivos `.env` 
- **Sempre** testar antes do push em mudanças críticas
- **Branch** `main` vai direto para produção
- **Logs** disponíveis no Railway Dashboard

## 🛠️ Comandos Úteis

```bash
# Backend - Desenvolvimento
npm run start:dev      # Modo development com hot reload
npm run start:debug    # Com debugger
npm run build         # Build para produção
npm run start:prod    # Modo produção local

# Ver logs de produção
# Acessar: https://railway.app/dashboard

# Verificar se produção está OK
curl https://programa-indicacao-multicliente-production.up.railway.app/api/health
``` 