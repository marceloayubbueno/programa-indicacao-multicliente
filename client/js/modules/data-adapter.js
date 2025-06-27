/**
 * 🔄 Data Adapter - Adapta dados dos schemas MongoDB para a interface
 * Foco: Garantir que todos os campos dos schemas sejam exibidos corretamente
 */
class DataAdapter {
    
    // 👥 ADAPTAÇÃO DE PARTICIPANTES
    static adaptParticipant(participant) {
        if (!participant) {
            console.log('🔍 H5 - Participant é null/undefined, retornando null');
            return null;
        }

        // 🔍 H5 - DIAGNÓSTICO ANTES DA ADAPTAÇÃO
        console.log('🔍 H5 - Participant raw data antes adaptação:', {
            id: participant._id,
            name: participant.name,
            email: participant.email,
            originSource: participant.originSource,
            tipo: participant.tipo,
            clientId: participant.clientId,
            lists: participant.lists?.length || 0,
            campaignId: participant.campaignId,
            campaignName: participant.campaignName
        });

        // 🔍 DEBUG H2 - Estrutura de dados
        console.log('🔍 DEBUG H2 - Participant raw data:', participant);
        console.log('🔍 DEBUG H2 - Participant origin:', participant.originSource);
        console.log('🔍 DEBUG H2 - Participant tipo:', participant.tipo);
        console.log('🔍 DEBUG H2 - Participant clientId:', participant.clientId);
        console.log('🔍 DEBUG H2 - Participant name:', participant.name);
        console.log('🔍 DEBUG H2 - Participant email:', participant.email);

        // 🎯 Garantir campos obrigatórios
        const adapted = {
            // IDs e identificadores
            id: participant._id || participant.id,
            _id: participant._id || participant.id,
            participantId: participant.participantId,
            
            // Dados básicos
            name: participant.name || 'Nome não informado',
            email: participant.email || 'Email não informado',
            phone: participant.phone || '',
            company: participant.company || '',
            
            // Status e tipo
            status: participant.status || 'ativo',
            tipo: participant.tipo || 'participante',
            
            // Relacionamentos
            clientId: participant.clientId,
            lists: participant.lists || [],
            
            // Links e códigos
            shareLink: participant.shareLink || '',
            uniqueReferralCode: participant.uniqueReferralCode || '',
            
            // Recompensas
            assignedRewards: participant.assignedRewards || [],
            totalIndicacoes: participant.totalIndicacoes || 0,
            indicacoesAprovadas: participant.indicacoesAprovadas || 0,
            recompensasRecebidas: participant.recompensasRecebidas || 0,
            
            // Origem e metadata
            originLandingPageId: participant.originLandingPageId,
            originCampaignId: participant.originCampaignId,
            originSource: participant.originSource || 'manual',
            originMetadata: this.adaptOriginMetadata(participant.originMetadata),
            
            // Configurações de indicação
            canIndicate: participant.canIndicate !== false, // Default true
            indicatorLevel: participant.indicatorLevel || '',
            customShareMessage: participant.customShareMessage || '',
            lastIndicacaoAt: participant.lastIndicacaoAt,
            
            // Campanhas
            campaignId: participant.campaignId,
            campaignName: participant.campaignName || this.getCampaignNameFromMetadata(participant),
            
            // Timestamps
            createdAt: participant.createdAt || participant.created_at,
            updatedAt: participant.updatedAt || participant.updated_at
        };

        // 🔗 Gerar link de compartilhamento se necessário
        adapted.displayLink = this.generateDisplayLink(adapted);
        
        // 📋 Processar listas associadas
        adapted.listsDisplay = this.formatListsDisplay(adapted.lists);
        
        // 🎨 Informações de formatação
        adapted.typeInfo = this.getTypeInfo(adapted.tipo);
        adapted.statusInfo = this.getStatusInfo(adapted.status);
        
        // 🔍 H5 - DIAGNÓSTICO APÓS ADAPTAÇÃO
        console.log('🔍 H5 - Participant após adaptação:', {
            id: adapted.id,
            name: adapted.name,
            email: adapted.email,
            originSource: adapted.originSource,
            tipo: adapted.tipo,
            clientId: adapted.clientId,
            lists: adapted.lists?.length || 0,
            campaignName: adapted.campaignName,
            displayLink: adapted.displayLink ? 'presente' : 'ausente',
            typeInfo: adapted.typeInfo?.label
        });
        
        // 🔍 H6 - DIAGNÓSTICO PARTICIPANTES ÓRFÃOS NO FRONTEND
        if (adapted.campaignId && (!adapted.lists || adapted.lists.length === 0)) {
            console.log('🔍 H6 - SUSPEITO: Participante de campanha SEM listas no frontend:', {
                id: adapted.id,
                name: adapted.name,
                email: adapted.email,
                campaignId: adapted.campaignId,
                campaignName: adapted.campaignName,
                originSource: adapted.originSource,
                lists: adapted.lists
            });
        }
        
        return adapted;
    }

    // 📋 ADAPTAÇÃO DE LISTAS
    static adaptParticipantList(list) {
        if (!list) return null;

        const adapted = {
            // IDs
            id: list._id || list.id,
            _id: list._id || list.id,
            
            // Dados básicos
            name: list.name || 'Lista sem nome',
            description: list.description || '',
            tipo: list.tipo || 'participante',
            
            // Relacionamentos
            clientId: list.clientId,
            participants: list.participants || [],
            participantCount: list.participantCount || (list.participants ? list.participants.length : 0),
            
            // Campanha
            campaignId: list.campaignId,
            campaignName: list.campaignName || '',
            
            // Timestamps
            createdAt: list.createdAt || list.created_at,
            updatedAt: list.updatedAt || list.updated_at
        };

        // 🎨 Informações de formatação
        adapted.typeInfo = this.getListTypeInfo(adapted.tipo);
        adapted.statusInfo = this.getListStatusInfo(adapted);
        
        return adapted;
    }

    // 🔍 ADAPTAÇÃO DE METADATA DE ORIGEM
    static adaptOriginMetadata(metadata) {
        if (!metadata) return {};

        return {
            lpName: metadata.lpName || '',
            campaignName: metadata.campaignName || '',
            utmSource: metadata.utmSource || '',
            utmMedium: metadata.utmMedium || '',
            utmCampaign: metadata.utmCampaign || '',
            utmContent: metadata.utmContent || '',
            utmTerm: metadata.utmTerm || '',
            referrerUrl: metadata.referrerUrl || '',
            userAgent: metadata.userAgent || '',
            ipAddress: metadata.ipAddress || '',
            submissionDate: metadata.submissionDate,
            formData: metadata.formData || {}
        };
    }

    // 🔗 GERAÇÃO DE LINKS
    static generateDisplayLink(participant) {
        // Priorizar uniqueReferralCode
        if (participant.uniqueReferralCode) {
            return `http://localhost:3000/indicacao/${participant.uniqueReferralCode}`;
        }
        
        // Fallback para shareLink legacy
        if (participant.shareLink) {
            return `http://localhost:3000/indicacao/${participant.shareLink}`;
        }
        
        // Não há link disponível
        return null;
    }

    // 📋 FORMATAÇÃO DE LISTAS
    static formatListsDisplay(lists) {
        if (!lists || !Array.isArray(lists) || lists.length === 0) {
            return 'Nenhuma lista';
        }

        // Se temos apenas IDs, mostrar quantidade
        if (typeof lists[0] === 'string') {
            return `${lists.length} lista${lists.length !== 1 ? 's' : ''}`;
        }

        // Se temos objetos completos, mostrar nomes
        const listNames = lists
            .slice(0, 3) // Máximo 3 nomes
            .map(list => list.name || 'Lista sem nome')
            .join(', ');

        if (lists.length > 3) {
            return `${listNames} e mais ${lists.length - 3}`;
        }

        return listNames;
    }

    // 🎨 INFORMAÇÕES DE TIPO (PARTICIPANTES)
    static getTypeInfo(tipo) {
        const tipos = {
            participante: {
                label: 'Participante',
                icon: 'fas fa-user',
                bgColor: 'bg-blue-600',
                badgeClass: 'bg-blue-100 text-blue-800'
            },
            indicador: {
                label: 'Indicador',
                icon: 'fas fa-share-alt',
                bgColor: 'bg-green-600',
                badgeClass: 'bg-green-100 text-green-800'
            },
            influenciador: {
                label: 'Influenciador',
                icon: 'fas fa-star',
                bgColor: 'bg-purple-600',
                badgeClass: 'bg-purple-100 text-purple-800'
            }
        };

        return tipos[tipo] || tipos.participante;
    }

    // 🎨 INFORMAÇÕES DE STATUS
    static getStatusInfo(status) {
        const statuses = {
            ativo: {
                label: 'Ativo',
                color: 'text-green-400',
                bgColor: 'bg-green-100',
                badgeClass: 'bg-green-100 text-green-800'
            },
            inativo: {
                label: 'Inativo',
                color: 'text-red-400',
                bgColor: 'bg-red-100',
                badgeClass: 'bg-red-100 text-red-800'
            },
            pendente: {
                label: 'Pendente',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-100',
                badgeClass: 'bg-yellow-100 text-yellow-800'
            }
        };

        return statuses[status] || statuses.ativo;
    }

    // 📋 INFORMAÇÕES DE TIPO (LISTAS)
    static getListTypeInfo(tipo) {
        const tipos = {
            participante: {
                label: 'Participantes',
                icon: 'fas fa-users',
                color: 'text-blue-400',
                bgColor: 'bg-blue-600'
            },
            indicador: {
                label: 'Indicadores',
                icon: 'fas fa-share-alt',
                color: 'text-green-400',
                bgColor: 'bg-green-600'
            },
            influenciador: {
                label: 'Influenciadores',
                icon: 'fas fa-star',
                color: 'text-purple-400',
                bgColor: 'bg-purple-600'
            },
            mista: {
                label: 'Mista',
                icon: 'fas fa-users-cog',
                color: 'text-orange-400',
                bgColor: 'bg-orange-600'
            }
        };

        return tipos[tipo] || tipos.participante;
    }

    // 📊 STATUS DE LISTAS
    static getListStatusInfo(list) {
        const hasParticipants = list.participantCount > 0;
        const isRecent = list.createdAt && new Date(list.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return {
            hasParticipants,
            isRecent,
            isEmpty: !hasParticipants,
            status: hasParticipants ? 'active' : 'empty',
            statusLabel: hasParticipants ? 'Ativa' : 'Vazia',
            statusColor: hasParticipants ? 'text-green-400' : 'text-gray-400'
        };
    }

    // 🏷️ NOME DA CAMPANHA A PARTIR DOS METADADOS
    static getCampaignNameFromMetadata(participant) {
        if (participant.campaignName) return participant.campaignName;
        if (participant.originMetadata?.campaignName) return participant.originMetadata.campaignName;
        if (participant.originMetadata?.lpName) return participant.originMetadata.lpName;
        return '';
    }

    // 📅 FORMATAÇÃO DE DATAS
    static formatDate(dateString) {
        if (!dateString) return 'Data não disponível';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Data inválida';
        }
    }

    // 📊 FORMATAÇÃO DE NÚMEROS
    static formatNumber(value, defaultValue = 0) {
        const num = parseInt(value) || defaultValue;
        return num.toLocaleString('pt-BR');
    }

    // 💰 FORMATAÇÃO DE VALORES MONETÁRIOS
    static formatCurrency(value, defaultValue = 0) {
        const num = parseFloat(value) || defaultValue;
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // 📱 FORMATAÇÃO DE TELEFONE
    static formatPhone(phone) {
        if (!phone) return '';
        
        // Remove tudo que não é número
        const cleaned = phone.replace(/\D/g, '');
        
        // Formatar conforme o tamanho
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone; // Retorna original se não conseguir formatar
    }

    // 🔍 FILTROS E BUSCA
    static filterParticipants(participants, filters = {}) {
        if (!Array.isArray(participants)) return [];

        return participants.filter(participant => {
            const adapted = this.adaptParticipant(participant);
            
            // Filtro por texto (nome, email)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `${adapted.name} ${adapted.email}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // Filtro por tipo
            if (filters.tipo && filters.tipo !== 'todos') {
                if (adapted.tipo !== filters.tipo) return false;
            }
            
            // Filtro por status
            if (filters.status && adapted.status !== filters.status) {
                return false;
            }
            
            // Filtro por lista
            if (filters.listId && adapted.lists && Array.isArray(adapted.lists)) {
                const listIds = adapted.lists.map(list => 
                    typeof list === 'string' ? list : list._id || list.id
                );
                if (!listIds.includes(filters.listId)) return false;
            }
            
            return true;
        });
    }

    // 📋 FILTROS DE LISTAS
    static filterLists(lists, filters = {}) {
        if (!Array.isArray(lists)) return [];

        return lists.filter(list => {
            const adapted = this.adaptParticipantList(list);
            
            // Filtro por texto (nome, descrição)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `${adapted.name} ${adapted.description}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // Filtro por tipo
            if (filters.tipo && filters.tipo !== 'todas') {
                if (adapted.tipo !== filters.tipo) return false;
            }
            
            // Filtro por status (vazia/com participantes)
            if (filters.status === 'with-participants' && adapted.participantCount === 0) {
                return false;
            }
            if (filters.status === 'empty' && adapted.participantCount > 0) {
                return false;
            }
            
            return true;
        });
    }

    // 🔧 VALIDAÇÕES
    static validateParticipant(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Nome é obrigatório');
        }
        
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Email válido é obrigatório');
        }
        
        if (!data.tipo || !['participante', 'indicador', 'influenciador'].includes(data.tipo)) {
            errors.push('Tipo deve ser participante, indicador ou influenciador');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateParticipantList(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Nome da lista é obrigatório');
        }
        
        if (!data.tipo || !['participante', 'indicador', 'influenciador', 'mista'].includes(data.tipo)) {
            errors.push('Tipo deve ser participante, indicador, influenciador ou mista');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 📧 VALIDAÇÃO DE EMAIL
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 🔍 DEBUG E MONITORAMENTO
    static getDataQuality(participants, lists) {
        const quality = {
            participants: {
                total: participants.length,
                withEmail: participants.filter(p => p.email).length,
                withPhone: participants.filter(p => p.phone).length,
                withLists: participants.filter(p => p.lists && p.lists.length > 0).length,
                withReferralCode: participants.filter(p => p.uniqueReferralCode).length
            },
            lists: {
                total: lists.length,
                withParticipants: lists.filter(l => l.participantCount > 0).length,
                withCampaign: lists.filter(l => l.campaignId).length
            }
        };

        return quality;
    }
}

// 🌍 Disponibilizar globalmente
window.DataAdapter = DataAdapter;

// 📤 Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAdapter;
} 