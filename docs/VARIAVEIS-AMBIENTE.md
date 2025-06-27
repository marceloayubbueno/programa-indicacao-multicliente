# 🔧 Variáveis de Ambiente - Sistema de Indicação

## 📋 Variáveis Obrigatórias

### **Configurações Gerais**
```env
NODE_ENV=production
PORT=3000
```

### **Autenticação JWT**
```env
JWT_SECRET=sua-jwt-secret-super-forte-aqui-minimo-32-caracteres
```

### **Banco de Dados MongoDB**
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```

### **URLs da Aplicação**
```env
CLIENT_URL=https://sua-app-frontend.vercel.app
```

## 🔐 Super Admin (Auto-Criação)

**O sistema cria automaticamente um Super Admin na inicialização se não existir nenhum.**

### **Credenciais do Super Admin**
```env
SUPER_ADMIN_EMAIL=admin@programa-indicacao.com
SUPER_ADMIN_PASSWORD=Admin@123456
SUPER_ADMIN_NAME=Super Administrador
```

### **⚠️ Configurações de Segurança:**
1. **Altere a senha padrão** após o primeiro login
2. Use uma **senha forte** (mínimo 12 caracteres)
3. **Email deve ser único** no sistema
4. **Sempre valide** as credenciais após deploy

## 📧 Email (Opcional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
```

## 💰 Pagamentos (Opcional)
```env
STRIPE_SECRET_KEY=sk_test_...
MERCADOPAGO_ACCESS_TOKEN=APP_USR...
```

---

## 🚀 Deploy Railway

### **Configurar no Railway:**
1. Acesse o projeto no Railway
2. Vá em **Settings > Environment**
3. Configure **TODAS** as variáveis obrigatórias
4. Deploy será feito automaticamente

### **Verificar Super Admin:**
```bash
# Endpoint para verificar se existe admin
GET /api/auth/admins

# Endpoint para recriar super admin (emergencial)
POST /api/auth/recreate-super-admin
Body: { "confirmacao": "RECRIAR_SUPER_ADMIN_CONFIRMO" }
```

---

## 🔍 Como Funciona o Auto-Seed

### **Processo Automático:**
1. **Na inicialização** do sistema (main.ts)
2. **Verifica** se existe algum super admin ativo
3. **Se não existir**, cria automaticamente
4. **Usa** as variáveis de ambiente configuradas
5. **Loga** o resultado no console

### **Logs de Boot:**
```
✅ Super Admin já existe no sistema.
ou
🔧 Super Admin não encontrado. Criando super admin padrão...
📧 Super Admin criado: admin@programa-indicacao.com
🔐 Senha: Admin@123456
⚠️  IMPORTANTE: Altere a senha após o primeiro login!
✅ Super Admin criado com sucesso!
```

### **Comportamento:**
- **Idempotente**: Não cria duplicatas
- **Seguro**: Só cria se não existir nenhum
- **Automático**: Roda a cada inicialização
- **Robusto**: Lida com erros graciosamente

---

## 🛠️ Comandos Úteis

### **Verificar Logs do Railway:**
```bash
railway logs
```

### **Testar Conexão MongoDB:**
```bash
# No Railway, verificar se MONGODB_URI está correto
railway run echo $MONGODB_URI
```

### **Redeploy Railway:**
```bash
git push origin main
```

---

## 🚨 Troubleshooting

### **Super Admin não foi criado:**
1. Verificar logs do Railway
2. Confirmar MONGODB_URI correto
3. Usar endpoint de recriação

### **Erro de autenticação:**
1. Verificar se super admin existe: `GET /api/auth/admins`
2. Testar credenciais exatas
3. Verificar CORS no Railway

### **Recriar Super Admin:**
```bash
POST /api/auth/recreate-super-admin
{
  "confirmacao": "RECRIAR_SUPER_ADMIN_CONFIRMO"
}
``` 