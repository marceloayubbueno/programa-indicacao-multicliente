# Planejamento: Extração de clientId do JWT e Autenticação Multi-Cliente

## Visão Geral
Este documento detalha o planejamento para evoluir o sistema de envio manual do clientId (via query param) para extração automática e segura do clientId a partir do JWT, garantindo isolamento de dados entre clientes e escalabilidade para múltiplos tenants.

---

## Por que migrar para extração do clientId via JWT?
- **Segurança:** Impede que um cliente acesse dados de outro apenas trocando o clientId na URL.
- **Escalabilidade:** Facilita o crescimento do sistema para múltiplos clientes (multi-tenant).
- **Praticidade:** O backend controla o acesso, reduzindo dependência do frontend.

---

## Como funciona na prática?
1. **Login:**
   - O backend gera um JWT com o clientId no payload.
   - Exemplo de payload:
     ```json
     {
       "sub": "id_do_usuario",
       "clientId": "id_do_cliente",
       "role": "cliente"
     }
     ```
2. **Frontend:**
   - Envia o JWT no header Authorization em todas as requisições:
     ```
     Authorization: Bearer SEU_TOKEN_JWT
     ```
3. **Backend:**
   - Um guard/middleware decodifica o JWT e popula req.user.
   - Controllers usam req.user.clientId para filtrar dados.

---

## Etapas de Implementação

### 1. Gerar JWT com clientId no login
- Ajustar o service de autenticação para incluir o clientId no payload do token.

### 2. Configurar guard de autenticação
- Usar o AuthGuard padrão do NestJS para decodificar o JWT e popular req.user.

### 3. Ajustar controllers para usar clientId do token
- Exemplo:
  ```typescript
  @Get()
  async getCampaigns(@Req() req) {
    const clientId = req.user.clientId;
    return this.campaignsService.findByClient(clientId);
  }
  ```

### 4. Remover dependência de clientId vindo do frontend
- Eliminar o uso de query param para clientId em endpoints protegidos.

### 5. Testes e validação
- Garantir que cada cliente só acessa seus próprios dados.
- Testar tentativas de acesso cruzado (troca de token, manipulação de URL).

---

## Benefícios
- Isolamento total de dados entre clientes.
- Código mais limpo e seguro.
- Pronto para SaaS multi-tenant.

---

## Considerações Finais
- A migração deve ser feita após estabilizar o fluxo de campanhas.
- Documentar endpoints e payloads JWT para onboarding de novos clientes.
- Avaliar impacto em integrações externas (se houver).

---

**Este documento será revisitado após a finalização do fluxo de campanhas.** 