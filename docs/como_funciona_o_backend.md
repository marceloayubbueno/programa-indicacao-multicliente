# Como funciona o backend

> **Atenção:** Para garantir integração correta, consulte sempre o documento [Padronização de Dados – Contratos Frontend/Backend](./padroes-dados.md) para contratos, exemplos e convenções.

O backend do Programa de Indicação é composto por duas abordagens:

- **NestJS (src/):** Utilizado para a API principal, com arquitetura modular baseada em módulos, controladores e serviços. Utiliza TypeORM para integração com banco de dados relacional (PostgreSQL) e Mongoose para integração com MongoDB em scripts e rotas específicas.
- **Express (server.js):** Responsável por servir arquivos estáticos (admin/client), expor rotas básicas e realizar integrações rápidas. Utiliza middlewares para autenticação, CORS, logging e tratamento de erros.

# ESQUEMAS BANCO DE DADOS

Esquemas que devem ser criados no banco de dados MongoDB:

## USUÁRIOS ADM
Armazenar dados de usuários administrativos.

**Schema:** UsuarioAdminSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **adminId** (não existe campo explícito, usar _id)
- nome (string)
- email (string, único)
- senha (string)
- telefone (string)
- role (string: 'superadmin' | 'admin')
- superadmin (boolean)
- ativo (boolean)

## CLIENTES
Armazenar dados dos clientes cadastrados.

**Schema:** ClientSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **clientId** (não existe campo explícito, usar _id)
- companyName (string)
- cnpj (string, único, opcional)
- responsibleName (string)
- responsiblePhone (string)
- responsiblePosition (string, opcional)
- responsibleEmail (string)
- responsibleCPF (string, opcional)
- cep, street, number, complement, neighborhood, city, state (strings)
- accessEmail (string, único)
- password (string)
- 🆔 **plan** (ObjectId, ref Plan)
- status (string: 'pendente' | 'ativo' | 'inativo')
- employeeCount (string, opcional)
- profileComplete (boolean)
- createdAt (Date)

## LISTA DE PARTICIPANTES
Armazenar dados subidos de participantes aglomerados em listas.

**Schema:** ParticipantListSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **participantListId** (não existe campo explícito, usar _id)
- name (string)
- description (string, opcional)
- 🆔 **clientId** (ObjectId, ref Client)
- 🆔 **participants** (array de ObjectId, ref Participant)
- createdAt, updatedAt (Date)

## PARTICIPANTES
Armazenar dados de participantes subidos por clientes.

**Schema:** ParticipantSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **participantId** (string, único, campo explícito de ID do participante)
- name (string)
- email (string)
- phone (string)
- company (string, opcional)
- status (string: 'ativo' | 'inativo' | 'pendente')
- 🆔 **lists** (array de ObjectId, ref ParticipantList)
- 🆔 **clientId** (ObjectId, ref Client)
- shareLink (string, opcional)
- 🆔 **originLandingPageId** (ObjectId, opcional)
- 🆔 **originCampaignId** (ObjectId, opcional)
- originSource (string: 'landing-page' | 'manual' | 'import' | 'api' | 'bulk-upload')
- originMetadata (objeto, opcional)
- totalIndicacoes, indicacoesAprovadas, recompensasRecebidas (number)
- lastIndicacaoAt (Date, opcional)
- canIndicate (boolean)
- indicatorLevel (string, opcional)
- customShareMessage (string, opcional)
- createdAt, updatedAt (Date)

## LP DE INDICADORES
Armazenar os dados das LPs para captação de indicadores (não tem relação direta com participantes).

**Schema:** LPIndicadoresSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **lpIndicadoresId** (não existe campo explícito, usar _id)
- name (string)
- slug (string, único)
- description (string, opcional)
- status (string: 'draft' | 'published' | 'inactive')
- 🆔 **clientId** (ObjectId)
- 🆔 **campaignId** (ObjectId, opcional)
- grapesData, compiledOutput, metadata (objetos)
- formConfig (objeto, opcional)
- statistics (objeto)
- publishedAt, publishedUrl, previewUrl (string/data, opcionais)
- metaTitle, metaDescription, metaKeywords, ogImage (SEO, opcionais)
- customCSS, customJS, trackingCodes (opcionais)
- templateId, parentLPId (string/ObjectId, opcionais)
- isTemplate (boolean)
- createdBy, lastModifiedBy (ObjectId, opcionais)
- createdAt, updatedAt (Date)

## RECOMPENSAS
Armazenar dados de recompensas criadas pelo cliente para beneficiar os indicadores.

**Schema:** RewardSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **rewardId** (não existe campo explícito, usar _id)
- type (string: 'pix' | 'pontos' | 'desconto')
- value (number)
- status (string: 'pendente' | 'aprovada' | 'paga' | 'cancelada')
- 🆔 **campaign** (ObjectId, opcional)
- description (string, opcional)
- paymentDate (Date, opcional)
- 🆔 **indicator** (ObjectId, opcional)
- history (array de objetos: status, date, changedBy)
- paymentGatewayId (string, opcional)
- createdAt, updatedAt (Date)

## LP DE DIVULGAÇÃO
Armazenar dados das LPs criadas para que os indicadores divulguem produtos e serviços e possam ganhar suas comissões.

**Schema:** LandingPageSchema (sugestão: renomear para LPDivulgacaoSchema para maior clareza)

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **lpdedivulgacaoId** (não existe campo explícito, usar _id)
- name (string)
- slug (string, único)
- status (string: 'draft' | 'published' | 'inactive')
- 🆔 **clientId** (ObjectId)
- 🆔 **campaignId** (ObjectId, opcional)
- content (objeto)
- templateId (string, opcional)
- images (array de string, opcional)
- createdAt, updatedAt (Date)

## INDICADORES
Armazenar indicadores criados pelas campanhas.

**Schema:** IndicatorSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **indicatorId** (string, campo explícito de ID do indicador)
- name (string)
- email (string)
- phone (string)
- 🆔 **clientId** (ObjectId, opcional)
- 🆔 **campaignId** (ObjectId, opcional)
- 🆔 **lpId** (ObjectId, opcional)
- status (string: 'ativo' | 'inativo' | 'pendente')
- shareLink (string, opcional)
- originMetadata (objeto, opcional)
- lpName (string, opcional)
- createdAt, updatedAt (Date)

## PLANOS
Armazenar dados dos planos de serviço disponíveis para clientes.

**Schema:** PlanSchema

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- nome (string)
- descricao (string, opcional)
- preco (number)
- periodoTrial (number)
- limiteIndicadores (number)
- limiteIndicacoes (number)
- funcionalidades (objeto: Record<string, boolean>)
- createdAt, updatedAt (Date)

## CAMPANHAS
Armazenar campanhas criadas pelo cliente.

**Schema:** (sugestão: CampaignSchema)

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **campaignId** (não existe campo explícito, usar _id)
- name (string)
- 🆔 **clientId** (ObjectId, ref Client)
- status (string: 'ativa' | 'inativa' | 'finalizada')
- dataInicio, dataFim (Date)
- regras, metas, etc. (conforme necessidade)
- createdAt, updatedAt (Date)

## INDICAÇÕES (REFERRALS)
Armazenar indicações/novos leads vindos da LP de divulgação.

**Schema:** (sugestão: ReferralSchema)

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **referralId** (não existe campo explícito, usar _id)
- 🆔 **indicatorId** (ObjectId, ref Indicator)
- 🆔 **clientId** (ObjectId, ref Client)
- 🆔 **campaignId** (ObjectId, ref Campaign)
- leadName, leadEmail, leadPhone (string)
- status (string: 'pendente' | 'aprovada' | 'rejeitada')
- createdAt, updatedAt (Date)

## ENGAJAMENTOS
Armazenar informações de estratégias de e-mail marketing e WhatsApp.

**Schema:** (sugestão: EngajamentoSchema)

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **engajamentoId** (não existe campo explícito, usar _id)
- 🆔 **clientId** (ObjectId, ref Client)
- 🆔 **campaignId** (ObjectId, ref Campaign)
- tipo (string: 'email' | 'whatsapp')
- mensagem (string)
- status (string)
- createdAt, updatedAt (Date)

## PAGAMENTOS
Armazenar e gerenciar os pagamentos dos indicadores.

**Schema:** (sugestão: PagamentoSchema)

**Campos principais:**
- 🆔 **_id** (ObjectId, gerado pelo MongoDB)
- 🆔 **pagamentoId** (não existe campo explícito, usar _id)
- 🆔 **indicatorId** (ObjectId, ref Indicator)
- 🆔 **clientId** (ObjectId, ref Client)
- valor (number)
- status (string: 'pendente' | 'pago' | 'cancelado')
- dataPagamento (Date)
- createdAt, updatedAt (Date)

### Principais módulos do backend (NestJS)
- **Auth:** Autenticação e autorização JWT.
- **Admins:** Gerenciamento de administradores do sistema.
- **Clients:** Gestão de empresas (Clientes) que utilizam o sistema.
- **Campaigns:** Gestão de campanhas de indicação criadas pelos Clientes.
- **Forms, Referrals, Rewards:** Gerenciamento de formulários, indicações (leads gerados por Indicadores) e recompensas.

O backend é responsável por toda a lógica de negócio, persistência de dados, autenticação, envio de e-mails e exposição de APIs RESTful.

# Funcionamento do Backend – Área do Cliente

## Autenticação de Clientes

- O backend utiliza uma estratégia JWT separada para autenticação de Clientes (`JwtClientStrategy`).
- O token JWT do Cliente é gerado no login e deve ser enviado no header `Authorization: Bearer <token>` em todas as rotas protegidas.
- O guard `JwtClientAuthGuard` protege endpoints exclusivos do Cliente, garantindo que apenas Clientes autenticados acessem seus próprios dados.
- O campo `sub` do JWT corresponde ao `_id` do Cliente na base MongoDB.

### Exemplo de payload do JWT do Cliente
```json
{
  "sub": "64f1c2e8b2e4a2a1b8c1d2e3",
  "iat": 1693512345,
  "exp": 1693598745
}
```

## Endpoints principais do Cliente

- `POST /api/clients/login` – Login do Cliente
  - Body:
    ```json
    {
      "email": "cliente@empresa.com",
      "password": "senha"
    }
    ```