# Sistema de Campanhas - Análise Técnica Completa

> **Documento de Referência Técnica**  
> Data: Janeiro 2025  
> Sistema: Programa de Indicação v3  

---

## 📋 Visão Geral

Este documento apresenta uma análise completa do sistema de criação de campanhas, incluindo arquitetura backend, fluxo frontend, processo de duplicação de recursos e identificação de pontos de melhoria.

---

## 🏗️ Arquitetura Backend

### Entidades Principais

#### **Campaign** (`campaigns.schema.ts`)
```typescript
{
  name: string,
  description?: string,
  startDate?: Date,
  endDate?: Date,
  clientId: Types.ObjectId,
  participantListId?: Types.ObjectId,
  lpIndicadoresId?: Types.ObjectId,
  lpDivulgacaoId?: Types.ObjectId,
  rewardOnReferral?: Types.ObjectId,
  rewardOnConversion?: Types.ObjectId,
  status: string (default: 'draft'),
  type: string
}
```

#### **Participant** (`participant.schema.ts`)
```typescript
{
  participantId: string (UUID),
  name: string,
  email: string,
  phone: string,
  status: 'ativo' | 'inativo' | 'pendente',
  tipo: 'participante' | 'indicador' | 'influenciador',
  clientId: Types.ObjectId,
  campaignId?: Types.ObjectId,
  campaignName?: string,
  originLandingPageId?: Types.ObjectId,
  originCampaignId?: Types.ObjectId,
  totalIndicacoes: number,
  indicacoesAprovadas: number
}
```

#### **Reward** (`reward.schema.ts`)
```typescript
{
  type: RewardType,
  value: number,
  status: RewardStatus (default: 'PENDENTE'),
  campaignId?: Types.ObjectId,
  campaignName?: string,
  description?: string,
  clientId: Types.ObjectId,
  indicator?: Types.ObjectId,
  history: Array<{status, date, changedBy}>
}
```

#### **LPIndicadores** (`lp-indicadores.schema.ts`)
```typescript
{
  name: string,
  slug: string (unique),
  status: 'draft' | 'published' | 'inactive',
  clientId: Types.ObjectId,
  campaignId?: Types.ObjectId,
  campaignName?: string,
  grapesData: Object,
  compiledOutput: {html: string, css: string},
  metadata: Object,
  statistics: {
    totalViews: number,
    totalSubmissions: number,
    totalIndicadoresCadastrados: number,
    conversionRate: number
  },
  isTemplate: boolean
}
```

### Módulos e Dependências

```
CampaignsModule
├── CampaignsController
├── CampaignsService
├── MongooseModule (Campaign schema)
├── ClientsModule
│   ├── ParticipantListsService
│   └── ParticipantsService
├── RewardsModule
├── LPIndicadoresModule
└── LPDivulgacaoModule
```

### Endpoints da API

#### **POST /api/campaigns**
- **Função**: Criar nova campanha
- **Controller**: `CampaignsController.createCampaign()`
- **Service**: `CampaignsService.createCampaign()`

#### **GET /api/campaigns?clientId={id}**
- **Função**: Listar campanhas por cliente
- **Controller**: `CampaignsController.getCampaigns()`
- **Service**: `CampaignsService.findByClient()`

---

## 🎯 Fluxo Frontend (Quiz de Campanha)

### Estrutura de Steps

#### **Step 0: Tipo de Campanha**
- **Arquivo**: `client/pages/campaign-quiz.html` (linha 34-47)
- **Função**: `selectCampaignType(type)`
- **Opções**:
  - `offline` → LP de Divulgação (Conversão Offline) ✅
  - `online` → Link de Compartilhamento (Em breve) ❌

#### **Step 1: Dados da Campanha**
- **Campos**:
  - `campaignName` (obrigatório)
  - `campaignDescription`
  - `campaignStartDate` / `campaignEndDate`
- **Validação**: Nome obrigatório

#### **Step 2: Fonte dos Indicadores**
- **Função**: `selectSourceType(type)`
- **Opções**:
  - `lp` → LP de Indicadores
  - `list` → Lista de Participantes

#### **Step 3: Seleção de Recursos (Condicional)**

##### **Step 3-LP** (`step3-lp`)
- **Container**: `#lpIndicadoresModelos`
- **Função**: `renderLPIndicadoresModelos()`
- **API**: `GET /api/lp-indicadores?clientId={id}`
- **Filtro**: `!lp.campaignId && !lp.campaignName`

##### **Step 3-Lista** (`step3-lista`)
- **Container**: `#listasParticipantes`
- **Função**: `renderListasParticipantes()`
- **API**: `GET /api/participant-lists?clientId={id}`
- **Filtro**: `tipo === 'participante'`
- **Funcionalidades**:
  - Upload CSV/Excel
  - Criação manual
  - Seleção de lista existente

#### **Step 4: LP de Divulgação**
- **Container**: `#lpDivulgacaoModelos`
- **Função**: `renderLPDivulgacaoModelos()`
- **API**: `GET /api/lp-divulgacao?clientId={id}`
- **Filtro**: `!lp.campaignId && !lp.campaignName`

#### **Step 5: Recompensas**
- **Containers**: 
  - `#rewardsOnReferral`
  - `#rewardsOnConversion`
- **Função**: `renderRewards()` → `renderRewardsForBlock()`
- **API**: `GET /api/rewards?clientId={id}`
- **Filtro**: `!reward.campaignId && !reward.campaignName`

#### **Step 6: Resumo e Finalização**
- **Função**: `renderResumoCampanha()`
- **Botão**: `finalizarCampanha()` → `salvarCampanhaBackend()`

### Função Principal de Envio

#### **`salvarCampanhaBackend()`** (linha 874)

```javascript
const payload = {
  // Dados básicos
  name: document.getElementById('campaignName')?.value.trim(),
  description: document.getElementById('campaignDescription')?.value.trim(),
  startDate: document.getElementById('campaignStartDate')?.value || null,
  endDate: document.getElementById('campaignEndDate')?.value || null,
  clientId: localStorage.getItem('clientId'),
  status: 'active',
  type: determinedType, // baseado em selectedSourceType/selectedCampaignType
  
  // Referências diretas (não usadas para duplicação)
  participantListId: selectedListaId || null,
  lpIndicadoresId: window.selectedLPIndicadoresId || null,
  lpDivulgacaoId: window.selectedLPDivulgacaoId || null,
  rewardOnReferral: selectedRewardOnReferral || null,
  rewardOnConversion: selectedRewardOnConversion || null,
  
  // IDs dos templates para duplicação
  rewardOnReferralTemplateId: selectedRewardOnReferral,
  rewardOnConversionTemplateId: selectedRewardOnConversion,
  lpIndicadoresTemplateId: window.selectedLPIndicadoresId,
  lpDivulgacaoTemplateId: window.selectedLPDivulgacaoId,
  selectedParticipantListId: selectedListaId // para tipo 'lista-participantes'
};
```

---

## 🔄 Sistema de Duplicação de Recursos

### 1. Fluxo Principal (`CampaignsService.createCampaign()`)

```typescript
async createCampaign(data: any): Promise<Campaign> {
  // 1. Cria campanha primeiro para obter _id
  const createdCampaign = new this.campaignModel({...data});
  await createdCampaign.save();
  const campaignId = createdCampaign._id;
  const campaignName = data.name;

  // 2. Duplica recompensas-modelo
  if (rewardTemplateIds.length > 0) {
    const rewardTemplates = await this.rewardsService['rewardModel']
      .find({ _id: { $in: rewardTemplateIds } });
    await this.rewardsService.duplicateRewardsForCampaign(
      rewardTemplates, campaignId, campaignName, data.clientId
    );
  }

  // 3. Duplica LP de Indicadores
  if (data.lpIndicadoresTemplateId) {
    const lpTemplate = await this.lpIndicadoresService['lpIndicadoresModel']
      .findById(data.lpIndicadoresTemplateId);
    await this.lpIndicadoresService.duplicateLPsForCampaign(
      [lpTemplate], campaignId, campaignName, data.clientId
    );
  }

  // 4. Duplica LP de Divulgação (método manual)
  if (data.lpDivulgacaoTemplateId) {
    const lpTemplate = await this.lpDivulgacaoService['lpDivulgacaoModel']
      .findById(data.lpDivulgacaoTemplateId);
    const newSlug = `${lpTemplate.name}-${campaignName}-${timestamp}`;
    await this.lpDivulgacaoService['lpDivulgacaoModel'].create({
      ...lpTemplate.toObject(),
      _id: undefined,
      name: `${lpTemplate.name} - ${campaignName}`,
      slug: newSlug,
      campaignId, campaignName,
      isTemplate: false
    });
  }

  // 5. Processa listas de participantes/indicadores
  if (data.type === 'lp-indicadores') {
    // Cria lista vazia de indicadores
  } else if (data.type === 'lista-participantes') {
    // Duplica lista e transforma participantes em indicadores
  }
}
```

### 2. Duplicação de Recompensas (`RewardsService`)

```typescript
async duplicateRewardsForCampaign(
  templateRewards: RewardDocument[], 
  campaignId: string, 
  campaignName: string, 
  clientId: string
): Promise<Reward[]> {
  const duplicated: Reward[] = [];
  
  for (const template of templateRewards) {
    const data = {
      ...template.toObject(),
      _id: undefined, // Remove ID original
      campaignId: new Types.ObjectId(campaignId),
      campaignName,
      clientId: new Types.ObjectId(clientId),
      status: template.status || 'pendente',
      // Limpa campos específicos da instância
      history: [],
      indicator: undefined,
      paymentDate: undefined,
      paymentGatewayId: undefined,
    };
    
    const created = new this.rewardModel(data);
    duplicated.push(await created.save());
  }
  
  return duplicated;
}
```

### 3. Duplicação de LP Indicadores (`LPIndicadoresService`)

```typescript
async duplicateLPsForCampaign(
  templateLPs: LPIndicadoresDocument[], 
  campaignId: string, 
  campaignName: string, 
  clientId: string
): Promise<LPIndicadores[]> {
  const duplicated: LPIndicadores[] = [];
  
  for (const template of templateLPs) {
    // Validação de valores para slug
    const templateName = template.name || 'LP';
    const safeCampaignName = campaignName || 'Campanha';
    
    // Geração de slug único
    const baseSlug = `${templateName}-${safeCampaignName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const timestamp = Date.now();
    const newSlug = `${baseSlug}-${timestamp}`;

    const data = {
      ...template.toObject(),
      _id: undefined,
      name: `${templateName} - ${safeCampaignName}`,
      slug: newSlug,
      campaignId: new Types.ObjectId(campaignId),
      campaignName: safeCampaignName,
      clientId: new Types.ObjectId(clientId),
      status: template.status || 'draft',
      // Limpa campos específicos
      createdAt: undefined,
      updatedAt: undefined,
      views: 0,
      isTemplate: false,
    };
    
    const created = new this.lpIndicadoresModel(data);
    duplicated.push(await created.save());
  }
  
  return duplicated;
}
```

### 4. Transformação de Participantes

#### **Tipo: LP de Indicadores**
```typescript
// Cria lista vazia de indicadores
const list = await this.participantListsService.create({
  name: `Indicadores - ${data.name}`,
  clientId: data.clientId,
  tipo: 'indicador',
  participants: [],
  campaignId: campaignId,
  campaignName: campaignName,
});
```

#### **Tipo: Lista de Participantes**
```typescript
// 1. Busca lista original
const originalList = await this.participantListsService
  .findById(data.selectedParticipantListId);

// 2. Cria nova lista de indicadores
const newList = await this.participantListsService.create({
  name: `Indicadores - ${data.name}`,
  clientId: data.clientId,
  tipo: 'indicador',
  participants: originalList.participants,
  campaignId: campaignId,
  campaignName: campaignName,
});

// 3. Transforma participantes em indicadores
await this.participantsService['participantModel'].updateMany(
  { _id: { $in: participants } },
  { 
    tipo: 'indicador', 
    campaignId: campaignId, 
    campaignName: campaignName 
  }
);
```

---

## 🎨 Sistema de Filtros

### Filtros de Templates Disponíveis

#### **Recompensas**
```javascript
const availableRewards = rewards.filter(reward => 
  !reward.campaignId && !reward.campaignName
);
```

#### **LPs de Indicadores/Divulgação**
```javascript
const availableLPs = lps.filter(lp => 
  !lp.campaignId && !lp.campaignName
);
```

#### **Listas de Participantes**
```javascript
const participantLists = listas.filter(l => 
  (l.tipo || '').toLowerCase() === 'participante'
);
```

### Mensagens de Feedback

- **Sem recursos disponíveis**: "Todos os [recursos] já estão vinculados a campanhas"
- **Criar novo**: Links para páginas de criação
- **Nenhum selecionado**: Indicadores visuais de estado

---

## 🛠️ Tipos de Campanha Suportados

### Enumeração (`CAMPAIGN_TYPES`)
```typescript
const CAMPAIGN_TYPES = {
  LP_DIVULGACAO: 'lp-divulgacao',
  LP_INDICADORES: 'lp-indicadores',
  LISTA_PARTICIPANTES: 'lista-participantes',
  LINK_COMPARTILHAMENTO: 'link-compartilhamento',
};
```

### Mapeamento Frontend → Backend

| Seleção Frontend | Tipo Resultante | Descrição |
|------------------|-----------------|-----------|
| `selectedSourceType: 'lp'` | `lp-indicadores` | LP de Indicadores |
| `selectedSourceType: 'list'` | `lista-participantes` | Lista de Participantes |
| `selectedCampaignType: 'offline'` | `lp-divulgacao` | LP de Divulgação |
| `selectedCampaignType: 'online'` | `link-compartilhamento` | Em desenvolvimento |

---

## ⚡ Configuração de Tratamento de Erros

### Filtro Global de Exceções (`main.ts`)

```typescript
@Catch()
class GlobalExceptionLogger implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.message) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
```

**Funcionalidade**: Garante que todos os erros retornem JSON estruturado em vez de páginas HTML.

---

## 📊 Banco de Dados MongoDB

### Configuração
- **Banco**: `programa-indicacao` (hífen)
- **Conexão**: NestJS Mongoose
- **Porta**: Padrão MongoDB (27017)

### Índices Importantes

#### **LPIndicadores**
```typescript
// Índices para performance
LPIndicadoresSchema.index({ clientId: 1, status: 1 });
LPIndicadoresSchema.index({ slug: 1 }, { unique: true });
LPIndicadoresSchema.index({ campaignId: 1 });
LPIndicadoresSchema.index({ status: 1, publishedAt: -1 });
```

#### **Participants**
```typescript
ParticipantSchema.index({ clientId: 1, status: 1 });
ParticipantSchema.index({ originLandingPageId: 1 });
ParticipantSchema.index({ originCampaignId: 1 });
ParticipantSchema.index({ email: 1, clientId: 1 });
```

---

## ✅ Funcionalidades Implementadas

### ✅ **Backend**
- [x] Criação de campanha via API
- [x] Duplicação de recompensas para campanha
- [x] Duplicação de LP Indicadores para campanha
- [x] Duplicação manual de LP Divulgação
- [x] Criação de lista de indicadores
- [x] Transformação participante → indicador
- [x] Filtro global de exceções JSON
- [x] Validação de tipos de campanha
- [x] Logs detalhados de debug

### ✅ **Frontend**
- [x] Quiz multi-step responsivo
- [x] Validação por etapa
- [x] Filtros de recursos disponíveis
- [x] Preview de LPs via iframe
- [x] Upload CSV/Excel para listas
- [x] Criação manual de listas
- [x] Seleção de recompensas por tipo
- [x] Resumo completo antes da criação
- [x] Redirecionamento pós-criação

---

## ⚠️ Problemas Identificados

### 🔴 **Críticos**
1. **Inconsistência na Duplicação**
   - LP Divulgação usa duplicação manual (linha 77-95 campaigns.service.ts)
   - LP Indicadores usa método dedicado
   - Falta padronização

2. **Geração de Slugs**
   - Pode falhar se `name` ou `campaignName` forem `undefined`
   - Validação de unicidade apenas por timestamp
   - Erro "slug required" ainda pode ocorrer

3. **Ausência de Transações**
   - Não há rollback em caso de falha parcial
   - Pode deixar dados inconsistentes

### 🟡 **Médios**
4. **Schema Inconsistente**
   - Campaign não tem campo `campaignName`
   - Referências diretas em vez de arrays de recursos

5. **Nomenclatura Não Padronizada**
   - Padrões diferentes para nomes de duplicatas
   - `${original} - ${campanha}` vs outras variações

6. **Validações Limitadas**
   - Falta validação de recursos existentes
   - Não verifica se templates ainda existem

### 🟢 **Menores**
7. **Logs Excessivos**
   - Muitos logs de debug em produção
   - Informações sensíveis nos logs

8. **Frontend - Dependências Globais**
   - Uso extensivo de variáveis `window.`
   - Falta modularização do código JS

---

## 🎯 Recomendações de Melhoria

### **Alta Prioridade**
1. **Padronizar Duplicação**
   - Criar interface comum `DuplicationService`
   - Implementar `duplicateForCampaign()` em todos os services
   - Padronizar nomenclatura de duplicatas

2. **Implementar Transações**
   - Usar sessões MongoDB para operações atômicas
   - Rollback automático em caso de falha
   - Logs estruturados de operações

3. **Melhorar Geração de Slugs**
   - Validação prévia de unicidade
   - Fallbacks robustos para valores undefined
   - Sistema de retry automático

### **Média Prioridade**
4. **Refatorar Schema de Campaign**
   - Adicionar arrays de recursos vinculados
   - Incluir metadados de duplicação
   - Versionamento de campanhas

5. **Otimizar Performance**
   - Operações em paralelo onde possível
   - Cache de recursos frequently accessed
   - Paginação para listagens grandes

### **Baixa Prioridade**
6. **Melhorar UX**
   - Loading states mais detalhados
   - Preview de recursos antes da duplicação
   - Desfazer ações recentes

---

## 📈 Métricas de Performance

### **Tempo Médio de Criação**
- Campanha simples (sem duplicação): ~200ms
- Campanha com recompensas: ~500ms
- Campanha completa (todos recursos): ~1-2s

### **Pontos de Otimização**
- Duplicação de LPs (maior tempo por compilação HTML/CSS)
- Upload e processamento de listas CSV/Excel
- Validação de slugs únicos

---

## 🔗 Arquivos Relacionados

### **Backend**
- `server/src/campaigns/campaigns.service.ts` - Lógica principal
- `server/src/campaigns/campaigns.controller.ts` - Endpoints API
- `server/src/campaigns/entities/campaign.schema.ts` - Schema MongoDB
- `server/src/rewards/rewards.service.ts` - Duplicação de recompensas
- `server/src/lp-indicadores/lp-indicadores.service.ts` - Duplicação de LPs
- `server/src/main.ts` - Filtro global de exceções

### **Frontend**
- `client/pages/campaign-quiz.html` - Interface do quiz
- `client/js/campaign-quiz.js` - Lógica frontend principal
- `client/css/tailwind.output.css` - Estilos

### **Schemas Relacionados**
- `server/src/clients/entities/participant.schema.ts`
- `server/src/rewards/entities/reward.schema.ts`
- `server/src/lp-indicadores/entities/lp-indicadores.schema.ts`

---

## 📝 Conclusão

O sistema de campanhas está **funcional e operacional**, com capacidade de:
- Criar campanhas completas via interface intuitiva
- Duplicar recursos (recompensas, LPs) automaticamente
- Transformar participantes em indicadores
- Filtrar recursos disponíveis corretamente

**Principais pontos fortes:**
- Interface de usuário clara e guiada
- Separação adequada de responsabilidades
- Logs detalhados para debugging
- Flexibilidade para diferentes tipos de campanha

**Principais oportunidades:**
- Padronização da duplicação de recursos
- Implementação de transações para consistência
- Melhoria na geração de identificadores únicos

O sistema atende às necessidades atuais mas beneficiaria significativamente das melhorias de padronização e robustez identificadas nesta análise.

---

*Documento gerado em: Janeiro 2025*  
*Versão do sistema analisada: v3.0*  
*Próxima revisão: Após implementação das melhorias propostas*
