# Fluxo da LP de Divulgação – Programa de Indicação

> **Objetivo:** Documentar o funcionamento completo da Landing Page de Divulgação, detalhando o fluxo de cadastro, integração frontend-backend, persistência no banco e pontos críticos para manutenção e evolução futura.

---

## 1. Visão Geral
A LP de Divulgação é um canal público para captação de leads/indicações, permitindo que visitantes preencham um formulário e tenham seus dados salvos diretamente na coleção `referrals` do MongoDB. O fluxo é robusto, seguro e padronizado, seguindo as melhores práticas do projeto.

---

## 2. Estrutura do Fluxo

### **Frontend**
- **Página:** `client/pages/lp-preview-divulgacao.html` (preview dinâmico) e páginas geradas pelo editor.
- **Formulário:** Bloco Hero/Cadastro, com campos nome, e-mail e celular.
- **JS Público:** `client/js/lp-referral-form-public.js`
  - Intercepta o submit do formulário.
  - Valida campos obrigatórios.
  - Lê o ID da LP do localStorage (`currentLpDivulgacaoId`).
  - Monta o payload e envia via `fetch` para o backend.
  - Exibe feedback visual (sucesso/erro) na própria página.

### **Backend**
- **Endpoint público:** `POST /api/lp-divulgacao/submit-referral`
  - Controller: `server/src/lp-divulgacao/lp-divulgacao.controller.ts`
  - Service: `server/src/lp-divulgacao/lp-divulgacao.service.ts`
- **Persistência:**
  - Salva os dados recebidos diretamente no schema/coleção `referrals` (`server/src/referrals/entities/referral.schema.ts`).
  - Inclui metadados como o nome da LP de origem (`originMetadata.lpName`).
- **Logs detalhados:**
  - O service loga entrada, payload, busca da LP, dados salvos e atualização de estatísticas.

---

## 3. Passo a Passo do Funcionamento

1. **Usuário acessa a LP de Divulgação (preview ou publicada).**
2. O JS salva o ID da LP no localStorage (`currentLpDivulgacaoId`).
3. Ao preencher e enviar o formulário:
   - O JS intercepta o submit, valida os campos e lê o ID da LP.
   - Monta o payload com nome, e-mail, celular e `lpId`.
   - Envia para o endpoint `/api/lp-divulgacao/submit-referral`.
4. O backend:
   - Busca a LP pelo `lpId`.
   - Salva a indicação no schema `referrals`, incluindo `originMetadata.lpName`.
   - Atualiza estatísticas da LP (ex: totalSubmissions).
   - Retorna sucesso ou erro para o frontend.
5. O frontend exibe feedback visual ao usuário.
6. O lead fica disponível na coleção `referrals` para acompanhamento/administração.

---

## 4. Manutenção e Pontos Críticos

- **Schema Referral:**
  - O campo `originMetadata` deve existir e aceitar objetos.
  - Novos campos podem ser adicionados conforme evolução do fluxo.
- **ID da LP:**
  - Sempre garantir que o ID da LP está salvo no localStorage e enviado no payload.
- **Validação:**
  - O backend valida existência da LP antes de salvar a indicação.
- **Logs:**
  - Logs detalhados no service facilitam depuração e rastreamento de problemas.
- **Listagem de LPs:**
  - O filtro de `clientId` no backend busca tanto por string quanto por ObjectId, garantindo compatibilidade.
- **Edição de LP:**
  - O editor detecta modo de edição via parâmetro `id` na URL e faz PUT para atualizar, nunca removendo `clientId` ou `status`.
- **Status:**
  - Toda LP criada tem status `draft` por padrão. O status é mantido ao editar.

---

## 5. Dicas para Evolução Futura

- **Adicionar campos personalizados no formulário:**
  - Basta ajustar o JS público e o schema Referral para aceitar novos campos.
- **Integração com campanhas:**
  - O campo `campaignId` pode ser usado para associar a LP a campanhas específicas.
- **Aprovação e workflow:**
  - O status da indicação pode ser evoluído para `aprovada`, `rejeitada`, etc, conforme regras de negócio.
- **Notificações:**
  - Pode-se integrar envio de e-mails ou notificações a cada nova indicação.
- **Auditoria:**
  - Manter logs e histórico de alterações para rastreabilidade.

---

## 6. Referências de Código
- Frontend: `client/js/lp-referral-form-public.js`, `client/pages/lp-preview-divulgacao.html`, `client/pages/lp-divulgacao.html`, `client/js/lp-divulgacao.js`
- Backend: `server/src/lp-divulgacao/lp-divulgacao.controller.ts`, `server/src/lp-divulgacao/lp-divulgacao.service.ts`, `server/src/referrals/entities/referral.schema.ts`

---

> **Manutenção:** Sempre revise este documento ao alterar o fluxo da LP de Divulgação. Atualize endpoints, exemplos e pontos críticos para garantir que o conhecimento do processo esteja consolidado para todo o time. 