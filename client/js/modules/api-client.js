/**
 * 🌐 API Client - Centraliza todas as comunicações com o backend
 * Foco: Melhorar comunicação com MongoDB e reduzir chamadas redundantes
 */
class APIClient {
    constructor(baseURL = null) {
        // 🌍 URL DINÂMICA PARA API CLIENT
                this.baseURL = baseURL || (window.APP_CONFIG ? window.APP_CONFIG.API_URL :
                           window.API_URL);
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // 🔐 Métodos de Autenticação
    getAuthHeaders() {
        const token = localStorage.getItem('clientToken');
        console.log('🔍 DEBUG AUTH - Token exists:', !!token);
        console.log('🔍 DEBUG AUTH - Token sample:', token ? token.substring(0, 20) + '...' : 'null');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    getClientId() {
        const clientId = localStorage.getItem('clientId');
        console.log('🔍 DEBUG AUTH - ClientId from localStorage:', clientId);
        return clientId;
    }

    // 🗄️ Cache Management
    getCacheKey(url, params = {}) {
        return `${url}_${JSON.stringify(params)}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache() {
        this.cache.clear();
    }

    // 🔥 Método de requisição genérico com melhor tratamento de erro
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: this.getAuthHeaders(),
                ...options
            });

            if (!response.ok) {
                let errorMessage;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `Erro HTTP ${response.status}`;
                } else {
                    errorMessage = await response.text() || `Erro HTTP ${response.status}`;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`✅ API Success: ${endpoint}`, { status: response.status, dataLength: Array.isArray(data) ? data.length : 'object' });
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            throw error;
        }
    }

    // 👥 PARTICIPANTES - Métodos otimizados para MongoDB
    async getParticipants(options = {}) {
        const {
            page = 1,
            limit = 10,
            filters = {},
            useCache = true
        } = options;

        const clientId = this.getClientId();
        if (!clientId) {
            throw new Error('Client ID não encontrado');
        }

        // 🔍 DEBUG H1 - ClientId e URL
        console.log('🔍 DEBUG H1 - ClientId usado na consulta:', clientId);

        // Construir URL com parâmetros
        let url = `/participants?clientId=${clientId}&page=${page}&limit=${limit}`;
        
        // Adicionar filtros à URL
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }
        });

        // 🔍 DEBUG H1 - URL completa
        console.log('🔍 DEBUG H1 - URL completa:', url);
        
        // 🔍 H2 - DIAGNÓSTICO URL COM FILTROS
        console.log('🔍 H2 - URL COM FILTROS DETALHADA:', {
            baseUrl: url,
            filters: filters,
            hasListIdFilter: !!filters.listId,
            listIdValue: filters.listId || 'VAZIO',
            allFilters: Object.keys(filters).map(key => ({ key, value: filters[key], hasValue: !!filters[key] }))
        });

        // Verificar cache
        const cacheKey = this.getCacheKey(url);
        
        // 🔍 DEBUG H4 - Cache info
        console.log('🔍 DEBUG H4 - Cache key:', cacheKey);
        console.log('🔍 DEBUG H4 - Using cache?', useCache);
        
        // 🔍 H4 - DIAGNÓSTICO CACHE STATUS
        console.log('🔍 H4 - CACHE STATUS DETALHADO:', {
            cacheKey: cacheKey,
            useCache: useCache,
            cacheHit: !!this.getCache(cacheKey),
            cacheSize: this.cache.size,
            cacheKeys: Array.from(this.cache.keys()).slice(0, 3) // Primeiras 3 chaves para não sobrecarregar
        });
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            console.log('🔍 DEBUG H4 - Cache hit:', !!cached);
            if (cached) {
                console.log('📦 Cache hit:', url);
                // 🔍 H4 - DADOS DO CACHE
                console.log('🔍 H4 - DADOS RETORNADOS DO CACHE:', {
                    participantsCount: cached.participants?.length || 0,
                    hasParticipants: (cached.participants?.length || 0) > 0,
                    sampleFromCache: cached.participants?.slice(0, 2).map(p => ({ id: p._id, name: p.name })) || []
                });
                return cached;
            }
        }

        const data = await this.request(url);
        
        // 🔍 H4 - DIAGNÓSTICO FILTROS E REQUISIÇÃO
        console.log('[H4] DIAGNÓSTICO - Filtros aplicados:', filters);
        console.log('[H4] DIAGNÓSTICO - URL requisição:', url);
        console.log('[H4] DIAGNÓSTICO - Dados recebidos backend:', { 
            total: data.total, 
            participantsCount: data.participants?.length || 0,
            hasParticipants: (data.participants?.length || 0) > 0
        });
        console.log('[H4] DIAGNÓSTICO - Indicadores na resposta:', data.participants?.filter(p => p.tipo === 'indicador').length || 0);
        console.log('[H4] DIAGNÓSTICO - Participantes por tipo:', {
            participante: data.participants?.filter(p => p.tipo === 'participante').length || 0,
            indicador: data.participants?.filter(p => p.tipo === 'indicador').length || 0,
            influenciador: data.participants?.filter(p => p.tipo === 'influenciador').length || 0,
            undefined: data.participants?.filter(p => !p.tipo).length || 0
        });
        
        // 🔍 DEBUG H3 - API Response
        console.log('🔍 DEBUG H3 - API Response raw:', data);
        console.log('🔍 DEBUG H3 - Total participants returned:', data.participants?.length);
        console.log('🔍 DEBUG H3 - Participants sample (first 3):', data.participants?.slice(0, 3));
        console.log('🔍 DEBUG H3 - All participants origins:', data.participants?.map(p => ({ 
            id: p._id, 
            name: p.name, 
            originSource: p.originSource,
            clientId: p.clientId 
        })));
        
        // 🔍 H1 - DIAGNÓSTICO CLIENTID FRONTEND
        console.log('🔍 H1 - ClientId do localStorage:', clientId);
        console.log('🔍 H1 - Participantes com clientId diferente:', data.participants?.filter(p => 
            p.clientId?.toString() !== clientId
        ).length || 0);
        
        // 🔍 H4 - DIAGNÓSTICO DADOS RECEBIDOS BACKEND
        console.log('🔍 H4 - Dados recebidos do backend:', {
            participantsCount: data.participants?.length || 0,
            page: data.page,
            totalPages: data.totalPages,
            hasParticipants: (data.participants?.length || 0) > 0
        });
        
        // Salvar no cache
        if (useCache) {
            this.setCache(cacheKey, data);
        }

        return data;
    }

    async getParticipantById(id) {
        return await this.request(`/participants/${id}`);
    }

    async createParticipant(participantData) {
        const clientId = this.getClientId();
        const data = { ...participantData, clientId };
        
        const result = await this.request('/participants', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Limpar cache de participantes após criação
        this.clearParticipantsCache();
        return result;
    }

    async updateParticipant(id, participantData) {
        const result = await this.request(`/participants/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(participantData)
        });
        
        // Limpar cache de participantes após atualização
        this.clearParticipantsCache();
        return result;
    }

    async deleteParticipant(id) {
        const result = await this.request(`/participants/${id}`, {
            method: 'DELETE'
        });
        
        // Limpar cache de participantes após exclusão
        this.clearParticipantsCache();
        return result;
    }

    // 📋 LISTAS DE PARTICIPANTES - Métodos otimizados
    async getParticipantLists(options = {}) {
        const { useCache = true } = options;
        const clientId = this.getClientId();
        
        if (!clientId) {
            throw new Error('ClientId não encontrado');
        }
        
        const endpoint = '/participant-lists';
        const cacheKey = this.getCacheKey(endpoint, { clientId });
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) {
                console.log('🗄️ Cache hit for participant lists');
                return cached;
            }
        }
        
        console.log('🔍 [API-CLIENT] Buscando listas do cliente:', clientId);
        
        const result = await this.request(endpoint);
        
        if (useCache && result) {
            this.setCache(cacheKey, result);
        }
        
        console.log(`✅ [API-CLIENT] ${Array.isArray(result) ? result.length : 0} listas carregadas`);
        return result;
    }

    async getParticipantListById(id, includeParticipants = true) {
        const cacheKey = this.getCacheKey(`/participant-lists/${id}`, { includeParticipants });
        const cached = this.getCache(cacheKey);
        
        if (cached) {
            console.log('📦 Cache hit - List details:', id);
            return cached;
        }

        const data = await this.request(`/participant-lists/${id}`);
        this.setCache(cacheKey, data);
        
        return data;
    }

    async createParticipantList(listData) {
        const clientId = this.getClientId();
        const data = { ...listData, clientId };
        
        const result = await this.request('/participant-lists', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Limpar cache de listas após criação
        this.clearListsCache();
        return result;
    }

    async updateParticipantList(id, listData) {
        const result = await this.request(`/participant-lists/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(listData)
        });
        
        this.clearListsCache();
        return result;
    }

    async deleteParticipantList(id) {
        const result = await this.request(`/participant-lists/${id}`, {
            method: 'DELETE'
        });
        
        this.clearListsCache();
        return result;
    }

    // 🔄 Gerenciamento de Participantes em Listas
    async addParticipantToList(listId, participantId) {
        const result = await this.request(`/participant-lists/${listId}/add-participant/${participantId}`, {
            method: 'POST'
        });
        
        // Limpar cache relevante
        this.clearListsCache();
        this.clearParticipantsCache();
        return result;
    }

    async removeParticipantFromList(listId, participantId) {
        const result = await this.request(`/participant-lists/${listId}/remove-participant/${participantId}`, {
            method: 'POST'
        });
        
        // Limpar cache relevante
        this.clearListsCache();
        this.clearParticipantsCache();
        return result;
    }

    // 📊 Estatísticas e Contadores
    async getParticipantListCount(listId) {
        return await this.request(`/participant-lists/${listId}/participants/count`);
    }

    // 📤 Importação/Exportação
    async importParticipants(importData) {
        const clientId = this.getClientId();
        const data = { ...importData, clientId };
        
        const result = await this.request('/participants/import', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        this.clearParticipantsCache();
        return result;
    }

    // 🔗 Códigos de Referral
    async generateReferralCode(participantId) {
        return await this.request(`/participants/${participantId}/generate-referral-code`, {
            method: 'POST'
        });
    }

    async validateReferralCode(code) {
        return await this.request(`/participants/validate-referral/${code}`);
    }

    // 🧹 Cache Management específico
    clearParticipantsCache() {
        const keysToDelete = [];
        for (let key of this.cache.keys()) {
            if (key.includes('/participants')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log('🧹 Cleared participants cache');
    }

    clearListsCache() {
        const keysToDelete = [];
        for (let key of this.cache.keys()) {
            if (key.includes('/participant-lists')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log('🧹 Cleared lists cache');
    }

    // 📧 EMAIL TEMPLATES - Métodos para gerenciar templates
    async getEmailTemplates(options = {}) {
        const {
            type = null,
            useCache = true
        } = options;

        const cacheKey = this.getCacheKey('/email-templates', { type });
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) {
                console.log('📧 [CACHE] Email templates loaded from cache');
                return cached;
            }
        }

        try {
            let url = '/email-templates';
            if (type && type !== 'all') {
                url += `?type=${type}`;
            }

            const data = await this.request(url);
            this.setCache(cacheKey, data);
            
            console.log('📧 [API] Email templates loaded:', data.templates ? data.templates.length : 0);
            return data;
            
        } catch (error) {
            console.error('❌ [API] Error loading email templates:', error);
            throw error;
        }
    }

    async getEmailTemplateById(id) {
        try {
            const data = await this.request(`/email-templates/${id}`);
            console.log('📧 [API] Email template loaded:', data.name);
            return data;
        } catch (error) {
            console.error('❌ [API] Error loading email template:', error);
            throw error;
        }
    }

    clearEmailTemplatesCache() {
        const keysToDelete = [];
        for (let key of this.cache.keys()) {
            if (key.includes('/email-templates')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log('🧹 Cleared email templates cache');
    }

    // 🔍 Debug e Monitoramento
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
        };
    }
}

// 🌍 Instância global
window.apiClient = new APIClient();

// 📤 Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
} 