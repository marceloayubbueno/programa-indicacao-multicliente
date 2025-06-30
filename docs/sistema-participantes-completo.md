# 👥 Sistema de Participantes - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura Frontend](#arquitetura-frontend)
3. [Arquitetura Backend](#arquitetura-backend)
4. [Fluxos de Dados](#fluxos-de-dados)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Como Fazer Modificações](#como-fazer-modificações)
7. [Troubleshooting](#troubleshooting)
8. [Estrutura de Arquivos](#estrutura-de-arquivos)

---

## 🎯 Visão Geral

O **Sistema de Participantes** é o módulo central para gerenciamento de usuários e listas na plataforma. Permite:

- ✅ **Gerenciar participantes** (CRUD completo)
- ✅ **Organizar em listas** (criação, edição, associação)
- ✅ **Filtrar e buscar** (por lista, tipo, status, email)
- ✅ **Importar/exportar** dados
- ✅ **Sistema de abas** (Listas, Usuários, Estatísticas)

### 🏗️ Tecnologias Utilizadas
- **Frontend:** Vanilla JavaScript + TailwindCSS
- **Backend:** NestJS + MongoDB + Mongoose
- **Arquitetura:** Modular com separação clara de responsabilidades

---

## 🎨 Arquitetura Frontend

### 📁 Estrutura Modular

```
client/
├── pages/participants.html           # Interface principal
├── js/
│   ├── participants.js              # Orquestrador principal
│   ├── modules/
│   │   ├── participants-manager.js  # Gerencia usuários
│   │   ├── api-client.js           # Comunicação com API
│   │   └── data-adapter.js         # Adaptação de dados
│   └── participants-helpers.js     # Utilitários
└── css/
    └── participants.css             # Estilos específicos
```

### 🔧 Componentes Principais

#### 1. **participants.js** - Orquestrador Principal
```javascript
// Responsabilidades:
- Inicialização dos managers
- Sistema de abas (Listas, Usuários, Estatísticas)
- Funções globais (viewListParticipants, switchTab)
- Coordenação entre componentes
```

#### 2. **participants-manager.js** - Gerenciador de Usuários
```javascript
// Funcionalidades:
- Carregamento paginado de participantes
- Sistema de filtros (tipo, status, lista, email)
- Exibição em tabela com ações
- Cache inteligente
- Adaptação de dados via DataAdapter
```

#### 3. **api-client.js** - Cliente de API
```javascript
// Recursos:
- Autenticação automática (JWT + ClientId)
- Cache de requisições (5 minutos)
- Tratamento de erros robusto
- Métodos para participantes e listas
```

#### 4. **data-adapter.js** - Adaptador de Dados
```javascript
// Funções:
- Normalização de dados do MongoDB
- Formatação de campos (telefone, data)
- Mapeamento de tipos e status
- Qualidade de dados
```

### 🔄 Fluxo de Inicialização

```
DOM Load → participants.js → initializeManagers → ParticipantsManager + ListsManager
    ↓
switchTab('lists') → loadLists → API Call → displayLists
```

---

## ⚙️ Arquitetura Backend

### 📁 Estrutura NestJS

```
server/src/clients/
├── participants.controller.ts        # Endpoints REST
├── participants.service.ts          # Lógica de negócio
├── participant-lists.controller.ts  # Endpoints de listas
├── participant-lists.service.ts     # Lógica de listas
├── entities/
│   ├── participant.schema.ts        # Schema MongoDB
│   └── participant-list.schema.ts   # Schema de listas
└── dto/
    ├── create-participant.dto.ts     # Validação criação
    └── update-participant.dto.ts     # Validação atualização
```

### 🗄️ Schemas MongoDB

#### Participant Schema
```typescript
{
  _id: ObjectId,
  participantId: String,        // UUID único
  name: String,                 // Nome completo
  email: String,                // Email único por cliente
  phone: String,                // Telefone
  clientId: ObjectId,           // Cliente proprietário
  tipo: String,                 // 'participante' | 'indicador' | 'influenciador'
  status: String,               // 'ativo' | 'inativo'
  lists: [ObjectId],            // Referências para listas
  originSource: String,         // 'manual' | 'import' | 'campaign'
  uniqueReferralCode: String,   // Código de referência único
  createdAt: Date,
  updatedAt: Date
}
```

#### ParticipantList Schema
```typescript
{
  _id: ObjectId,
  name: String,                 // Nome da lista
  description: String,          // Descrição
  clientId: ObjectId,           // Cliente proprietário
  tipo: String,                 // 'participante' | 'indicador'
  participants: [ObjectId],     // IDs dos participantes
  campaignId: ObjectId,         // Campanha associada (opcional)
  createdAt: Date,
  updatedAt: Date
}
```

### 🔐 Sistema de Autenticação

```typescript
// JWT Client Strategy
@UseGuards(JwtClientAuthGuard)
@ClientId() clientId: string  // Auto-injetado do token

// Validação automática:
- Token JWT válido
- ClientId extraído automaticamente
- Isolamento de dados por cliente
```

### 📊 Endpoints Principais

#### Participantes
```typescript
GET    /participants              # Listar com filtros e paginação
POST   /participants              # Criar participante
GET    /participants/:id          # Buscar por ID
PATCH  /participants/:id          # Atualizar
DELETE /participants/:id          # Excluir
POST   /participants/import       # Importação em lote
POST   /participants/fix-orphans  # Correção automática
```

#### Listas
```typescript
GET    /participant-lists         # Listar listas do cliente
POST   /participant-lists         # Criar lista
GET    /participant-lists/:id     # Buscar lista com participantes
PATCH  /participant-lists/:id     # Atualizar lista
DELETE /participant-lists/:id     # Excluir lista
```

---

## 🔄 Fluxos de Dados

### 1. **Carregamento de Participantes**

```
UI → ParticipantsManager → ApiClient → Backend → MongoDB
                                     ↓
UI ← displayParticipants() ← DataAdapter ← {participants, total, page}
```

### 2. **Filtro por Lista**

```
Botão "Ver Participantes" → viewListParticipants(listId, listName)
    ↓
1. Limpar filtros existentes
2. switchTab('users')  
3. applyFilters({listId})
4. Exibir apenas participantes da lista
```

### 3. **Sincronização Participante-Lista**

```
Participante ←→ Lista (bidirecional)
    ↓
Adicionar: $addToSet em ambos
Remover: $pull em ambos
```

---

## ⚡ Funcionalidades Principais

### 📋 Sistema de Abas
- **Listas:** Gerenciamento de listas de participantes
- **Usuários:** Visualização e filtros de participantes
- **Estatísticas:** Resumos e métricas

### 🔍 Sistema de Filtros
- **Por Tipo:** Todos, Participantes, Indicadores, Influenciadores
- **Por Status:** Ativo, Inativo
- **Por Lista:** Filtro específico por lista
- **Por Email:** Busca textual

### 📊 Exibição de Dados
- **Tabela paginada** (10-25 itens por página)
- **Colunas configuráveis** via displayFields
- **Ações por linha** (editar, visualizar, excluir)
- **Seleção múltipla** para ações em lote

### 🔧 Correção Automática
- **Participantes órfãos:** Auto-associação à Lista Geral
- **Sincronização bidirecional:** Participante ↔ Lista
- **Detecção de inconsistências:** Logs detalhados

---

## 🛠️ Como Fazer Modificações

### ➕ Adicionar Nova Coluna

1. **Frontend - participants-manager.js:**
```javascript
// 1. Adicionar campo em displayFields
this.displayFields = {
    // ... campos existentes
    novoCampo: { label: 'Novo Campo', visible: true }
};

// 2. Modificar createParticipantRow()
<td class="px-4 py-3">
    ${participant.novoCampo || 'Não informado'}
</td>
```

2. **Backend - participant.schema.ts:**
```typescript
@Schema()
export class Participant {
    // ... campos existentes
    
    @Prop()
    novoCampo: string;
}
```

### 🔍 Adicionar Novo Filtro

1. **Frontend - participants.html:**
```html
<select id="novoFiltro" onchange="filterParticipants()">
    <option value="">Todos</option>
    <option value="valor1">Valor 1</option>
</select>
```

2. **Frontend - participants.js:**
```javascript
async function filterParticipants() {
    const filters = {
        // ... filtros existentes
        novoFiltro: document.getElementById('novoFiltro')?.value || ''
    };
    await participantsManager.applyFilters(filters);
}
```

3. **Backend - participants.service.ts:**
```typescript
async findAll(clientId: string, page = 1, limit = 20, filter: any = {}) {
    const { novoFiltro, ...otherFilters } = filter;
    const query: any = { clientId, ...otherFilters };
    
    if (novoFiltro) {
        query.novoFiltro = novoFiltro;
    }
    
    // ... resto da lógica
}
```

### 🎯 Adicionar Nova Ação

1. **Frontend - participants-manager.js:**
```javascript
// Em createParticipantRow(), adicionar botão:
<button onclick="participantsManager.novaAcao('${participant.id}')" 
        class="text-purple-400 hover:text-purple-300" 
        title="Nova Ação">
    <i class="fas fa-star"></i>
</button>

// Implementar método:
async novaAcao(participantId) {
    try {
        const result = await window.apiClient.novaAcao(participantId);
        this.showSuccess('Ação executada com sucesso!');
        await this.loadParticipants({ forceRefresh: true });
    } catch (error) {
        this.showError('Erro ao executar ação', error.message);
    }
}
```

2. **Backend - participants.controller.ts:**
```typescript
@Post(':id/nova-acao')
@UseGuards(JwtClientAuthGuard)
async novaAcao(@Param('id') id: string, @ClientId() clientId: string) {
    return this.participantsService.novaAcao(id, clientId);
}
```

---

## 🐛 Troubleshooting

### ❌ Problemas Comuns

#### 1. **Participantes não aparecem após filtro**
```javascript
// Verificar logs no console:
🔍 H2 - URL COM FILTROS DETALHADA
🔍 H2 - FILTRO BACKEND APLICADO
🔍 H3 - DADOS PARTICIPANTES

// Soluções:
- Verificar se listId está sendo enviado corretamente
- Confirmar sincronização participante ↔ lista no MongoDB
- Executar correção automática: POST /participants/fix-orphans
```

#### 2. **Contagem de listas incorreta**
```javascript
// Verificar:
- updateParticipantCounts() sendo chamado múltiplas vezes
- Cache interferindo nos resultados
- Dados do backend inconsistentes

// Soluções:
- Limpar cache: apiClient.clearCache()
- Usar dados diretos das listas em vez de chamadas à API
```

#### 3. **Filtros não funcionam**
```javascript
// Verificar:
- Elementos DOM existem (getElementById não retorna null)
- Eventos onChange estão funcionando
- participantsManager foi inicializado

// Debug:
console.log('Filtros:', {
    statusFilter: document.getElementById('statusFilter')?.value,
    listFilter: document.getElementById('listFilter')?.value,
    participantsManager: !!participantsManager
});
```

### 🔧 Ferramentas de Debug

#### 1. **Logs Estruturados**
```javascript
// Procurar por prefixos no console:
🔍 H1 - População de filtros
🔍 H2 - Sincronização frontend-backend  
🔍 H3 - Relação lista-participantes
🔍 H4 - Cache e adaptação
🔍 H5 - Data Adapter
🎯 AJUSTE FINO - Filtros específicos
```

#### 2. **Endpoints de Debug**
```typescript
GET /participants/debug          // Info detalhada do sistema
POST /participants/fix-orphans   // Correção automática
```

#### 3. **Cache Management**
```javascript
// Limpar cache quando necessário:
window.apiClient.clearCache();
window.apiClient.clearParticipantsCache();
window.apiClient.clearListsCache();
```

---

## 📁 Estrutura de Arquivos

### Frontend
```
client/
├── pages/
│   └── participants.html                    # Interface principal
├── js/
│   ├── participants.js                      # Orquestrador (631 linhas)
│   ├── participants-helpers.js             # Utilitários
│   └── modules/
│       ├── participants-manager.js         # Manager usuários (519 linhas)
│       ├── api-client.js                   # Cliente API (384 linhas)
│       └── data-adapter.js                 # Adaptador dados
└── css/
    └── participants.css                     # Estilos específicos
```

### Backend
```
server/src/clients/
├── participants.controller.ts               # 21 endpoints REST
├── participants.service.ts                 # Lógica negócio (855 linhas)
├── participant-lists.controller.ts         # Endpoints listas
├── participant-lists.service.ts            # Lógica listas (366 linhas)
├── entities/
│   ├── participant.schema.ts               # Schema MongoDB
│   └── participant-list.schema.ts          # Schema listas
└── dto/
    ├── create-participant.dto.ts            # Validação criação
    ├── update-participant.dto.ts            # Validação atualização
    └── import-participants.dto.ts           # Validação importação
```

---

## 📈 Métricas e Performance

### 📊 Números do Sistema
- **Frontend:** ~1.200 linhas de código
- **Backend:** ~1.200 linhas de código
- **Endpoints:** 21 endpoints REST
- **Cache:** 5 minutos TTL
- **Paginação:** 10-25 itens por página

### ⚡ Otimizações Implementadas
- ✅ **Cache inteligente** no frontend
- ✅ **Paginação eficiente** no backend
- ✅ **Filtros otimizados** com índices MongoDB
- ✅ **Correção automática** de inconsistências
- ✅ **Logs estruturados** para debug

---

## 🎯 Conclusão

Este sistema foi construído com foco em:
- ✅ **Manutenibilidade:** Código modular e bem documentado
- ✅ **Performance:** Cache, paginação e otimizações
- ✅ **Robustez:** Tratamento de erros e correções automáticas
- ✅ **Escalabilidade:** Arquitetura preparada para crescimento
- ✅ **Debug:** Logs detalhados e ferramentas de diagnóstico

Para qualquer modificação, siga os padrões estabelecidos e mantenha a documentação atualizada.

---

*Última atualização: Dezembro 2024*
*Versão do sistema: 2.0* 