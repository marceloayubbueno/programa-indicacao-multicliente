# Fluxo Trial (Teste Grátis) – Programa de Indicação

> **Veja também:** [Visão Geral do Projeto](./promptify-project-overview.md)

---

## Sumário
1. [Visão Geral](#visão-geral)
2. [Cadastro Trial (Frontend)](#1-cadastro-trial-frontend)
3. [Cadastro Trial (Backend)](#2-cadastro-trial-backend)
4. [Login Automático](#3-login-automático)
5. [Área do Cliente Trial](#4-área-do-cliente-trial)
6. [Expiração e Upgrade](#5-expiração-e-upgrade)
7. [Pontos de Extensão e Melhoria](#6-pontos-de-extensão-e-melhoria)
8. [Observações Técnicas](#7-observações-técnicas)
9. [Exemplos de Payloads](#exemplos-de-payloads)
10. [Troubleshooting](#troubleshooting)
11. [Referências](#8-referências)

---

## Visão Geral
O fluxo Trial permite que empresas (Clientes) se cadastrem rapidamente para testar o sistema por 14 dias, sem necessidade de CNPJ. Após o período, o acesso é bloqueado até upgrade manual pelo Administrador.

---

## 1. Cadastro Trial (Frontend)
- Página: `client/pages/teste-gratis.html`
- Campos obrigatórios: Nome completo, e-mail corporativo, WhatsApp, nome da empresa, número de funcionários, senha, aceite dos termos.
- Não exige CNPJ.
- Ao submeter:
  - Busca o plano Trial via API (`/api/planos`), pega o `_id`.
  - Envia cadastro para `/api/clients/trial` com os dados e o `_id` do plano.
  - Após sucesso, faz login automático (`/api/clients/login`) e salva o token em `localStorage` como `clientToken`.
  - Redireciona para a área do Cliente (`dashboard.html` ou `my-data.html`).

---

## 2. Cadastro Trial (Backend)
- Endpoint: `POST /api/clients/trial`
- Recebe os dados do frontend, incluindo `plan` como ObjectId do plano Trial.
- Cria o Cliente sem campo CNPJ.
- Valida unicidade de e-mail.
- Não envia e-mail automático (responsabilidade de automações externas).
- Retorna sucesso para o frontend.

---

## 3. Login Automático
- Endpoint: `POST /api/clients/login`
- Recebe `{ email, password }`.
- Retorna JWT no campo `token`.
- Frontend salva o token como `clientToken`.

---

## 4. Área do Cliente Trial
- Página: `client/pages/my-data.html` (ou similar)
- JS busca o token `clientToken` e faz `GET /api/clients/me` com header `Authorization: Bearer <token>`.
- Backend retorna os dados do Cliente, incluindo plano populado.
- Campos obrigatórios para Trial podem estar em branco (exceto os do cadastro Trial).
- CNPJ não aparece nem pode ser editado.

---

## 5. Expiração e Upgrade
- Após 14 dias, se o cadastro não for convertido, o acesso é bloqueado.
- Upgrade para plano pago é feito manualmente pelo Administrador, que preenche o CNPJ e outros campos obrigatórios.
- O campo `plan` é atualizado para o novo plano (ObjectId).

---

## 6. Pontos de Extensão e Melhoria
- Permitir upgrade self-service no futuro.
- Notificações automáticas de expiração.
- Integração com CRMs ou automações de marketing.
- Relatórios de uso do Trial.
- Customização do período Trial por plano.

---

## 7. Observações Técnicas
- O campo `plan` do Cliente **sempre** deve ser um ObjectId válido.
- O campo `cnpj` não existe para Clientes Trial.
- O backend valida obrigatoriedade do CNPJ apenas para planos pagos.
- O índice `unique + sparse` em `cnpj` permite múltiplos Trials sem conflito.
- O frontend e backend devem sempre alinhar o nome do token (`clientToken`).
- O login automático depende do backend aceitar `{ email, password }`.
- O populate do plano no backend espera sempre um ObjectId válido.

---

## Exemplos de Payloads

### Cadastro Trial (POST /api/clients/trial)
```json
{
  "nome": "Empresa Teste",
  "email": "contato@empresateste.com.br",
  "whatsapp": "(11) 99999-9999",
  "empresa": "Empresa Teste",
  "funcionarios": "11-50",
  "senha": "minhasenha123",
  "plan": "663b1e2f8b1e2f0012345678" // _id do plano Trial
}
```

### Login Automático (POST /api/clients/login)
```json
{
  "email": "contato@empresateste.com.br",
  "password": "minhasenha123"
}
```

---

## Troubleshooting
- **Erro de índice `{ cnpj: null }`**: Certifique-se de que o campo `plan` é sempre um ObjectId e que o índice `cnpj` está como `unique: true, sparse: true`.
- **Erro ao popular plano**: O campo `plan` deve ser sempre o _id do plano Trial, nunca a string "trial".
- **Login automático falha**: Verifique se o frontend envia os campos `email` e `password` corretamente.
- **Dados não aparecem na área do Cliente**: Confirme se o token está salvo como `clientToken` e enviado no header Authorization.

---

## 8. Referências
- [Visão Geral do Projeto](./promptify-project-overview.md)
- Código do fluxo Trial: `client/js/teste-gratis.js`, `server/src/clients/clients.controller.ts`, `server/src/clients/clients.service.ts`
- Schema do Cliente: `server/src/clients/entities/client.schema.ts`
- DTOs: `server/src/clients/dto/create-client.dto.ts`

---

**Última atualização:** 15/05/2025 