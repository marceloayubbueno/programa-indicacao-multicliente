/**
 * 👥 Participants Manager - Gerencia especificamente a lógica de participantes
 * Foco: Exibição otimizada de usuários do MongoDB com todos os campos dos schemas
 */
class ParticipantsManager {
    constructor() {
        this.participants = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.currentFilters = {};
        this.isLoading = false;
        
        // 🎯 Configuração de campos para exibição flexível
        this.displayFields = {
            id: { label: 'ID', visible: false },
            name: { label: 'Nome', visible: true, required: true },
            email: { label: 'Email', visible: true, required: true },
            phone: { label: 'Telefone', visible: true },
            company: { label: 'Empresa', visible: false },
            tipo: { label: 'Tipo', visible: true },
            status: { label: 'Status', visible: true },
            lists: { label: 'Listas', visible: true },
            campaignName: { label: 'Campanha', visible: true },
            displayLink: { label: 'Link', visible: true },
            originSource: { label: 'Origem', visible: false },
            createdAt: { label: 'Cadastro', visible: false },
            totalIndicacoes: { label: 'Indicações', visible: false },
            indicacoesAprovadas: { label: 'Aprovadas', visible: false }
        };
    }

    // 📊 CARREGAMENTO DE PARTICIPANTES
    async loadParticipants(options = {}) {
        const {
            page = this.currentPage,
            limit = this.itemsPerPage,
            filters = this.currentFilters,
            forceRefresh = false
        } = options;

        // 🔍 DEBUG H5 - Paginação e filtros
        console.log('🔍 DEBUG H5 - Page:', page, 'Limit:', limit);
        console.log('🔍 DEBUG H5 - Current filters:', filters);
        console.log('🔍 DEBUG H5 - Force refresh:', forceRefresh);

        if (this.isLoading) {
            console.log('⏳ Carregamento já em andamento...');
            return;
        }

        this.isLoading = true;
        this.showLoadingState(true);

        try {
            console.log('🔄 Carregando participantes...', { page, limit, filters });

            const data = await window.apiClient.getParticipants({
                page,
                limit,
                filters,
                useCache: !forceRefresh
            });

            // 🔍 DEBUG H5 - Total items from API
            console.log('🔍 DEBUG H5 - Total items from API:', data.total);
            console.log('🔍 DEBUG H5 - Raw participants before adaptation:', data.participants?.length);

            // 🔍 H4 - DIAGNÓSTICO DADOS ANTES DA ADAPTAÇÃO
            console.log('🔍 H4 - Dados recebidos do API Client:', {
                participantsCount: data.participants?.length || 0,
                total: data.total,
                page: data.page,
                rawParticipants: data.participants?.slice(0, 2).map(p => ({
                    id: p._id,
                    name: p.name,
                    email: p.email,
                    originSource: p.originSource,
                    tipo: p.tipo
                }))
            });
            
            // 🔍 H5 - DIAGNÓSTICO ANTES E APÓS ADAPTAÇÃO
            console.log('🔍 H5 - Participantes ANTES da adaptação:', data.participants?.length || 0);
            
            // 🎯 Adaptar dados usando DataAdapter
            this.participants = data.participants?.map(p => DataAdapter.adaptParticipant(p)) || [];
            
            console.log('🔍 H5 - Participantes APÓS adaptação:', this.participants.length);
            console.log('🔍 H5 - Participantes perdidos na adaptação:', (data.participants?.length || 0) - this.participants.length);
            
            this.totalItems = data.total || this.participants.length;
            this.currentPage = page;
            this.currentFilters = filters;

            // 🔍 DEBUG H5 - After adaptation
            console.log('🔍 DEBUG H5 - Participants after adaptation:', this.participants.length);
            console.log('🔍 DEBUG H5 - Participants sample after adaptation:', this.participants.slice(0, 2));

            console.log('✅ Participantes carregados:', {
                count: this.participants.length,
                total: this.totalItems,
                page: this.currentPage
            });

            // 📊 Debug da qualidade dos dados
            const quality = DataAdapter.getDataQuality(this.participants, []);
            console.log('📊 Qualidade dos dados:', quality.participants);

            this.displayParticipants();
            this.updatePaginationInfo();
            this.updateStatistics();

        } catch (error) {
            console.error('❌ Erro ao carregar participantes:', error);
            this.showError('Erro ao carregar participantes', error.message);
            this.participants = [];
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
        }
    }

    // 🎨 EXIBIÇÃO DE PARTICIPANTES
    displayParticipants() {
        // 🔍 H4 - DIAGNÓSTICO EXIBIÇÃO
        console.log('🔍 H4 - Iniciando exibição de participantes');
        console.log('🔍 H4 - Participantes para exibir:', this.participants.length);
        console.log('🔍 H4 - Filtros ativos:', this.currentFilters);
        console.log('🔍 H4 - Página atual:', this.currentPage);
        console.log('🔍 H4 - Total de itens:', this.totalItems);
        
        // 🔍 DEBUG - Display info
        console.log('🔍 DEBUG DISPLAY - Participants to display:', this.participants.length);
        console.log('🔍 DEBUG DISPLAY - Sample participants:', this.participants.slice(0, 2).map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            originSource: p.originSource,
            tipo: p.tipo
        })));

        const tbody = document.getElementById('participantsList');
        if (!tbody) {
            console.error('❌ Elemento participantsList não encontrado');
            return;
        }

        tbody.innerHTML = '';

        if (this.participants.length === 0) {
            console.log('🔍 H4 - Nenhum participante para exibir - exibindo mensagem vazia');
            console.log('🔍 DEBUG DISPLAY - No participants to show');
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="px-4 py-8 text-center text-gray-400">
                        <div class="flex flex-col items-center gap-3">
                            <i class="fas fa-users text-4xl text-gray-600"></i>
                            <p class="text-lg">Nenhum participante encontrado</p>
                            <p class="text-sm">Tente ajustar os filtros ou adicionar novos participantes</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.participants.forEach((participant, index) => {
            console.log(`🔍 DEBUG DISPLAY - Creating row ${index + 1} for:`, participant.name);
            const row = this.createParticipantRow(participant);
            tbody.appendChild(row);
        });

        console.log('🎨 Participantes exibidos:', this.participants.length);
    }

    // 🏗️ CRIAÇÃO DE LINHA DE PARTICIPANTE
    createParticipantRow(participant) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800 transition-colors';
        tr.dataset.participantId = participant.id;

        // 📱 Formatação de telefone
        const phoneDisplay = DataAdapter.formatPhone(participant.phone) || 'Não informado';
        
        // 📋 Exibição de listas
        const listsDisplay = this.formatListsForDisplay(participant);
        
        // 🏷️ Campanha
        const campaignDisplay = participant.campaignName || 
                              participant.originMetadata?.campaignName || 
                              'Nenhuma campanha';
        
        // 🔗 Link de indicação
        const linkDisplay = this.formatLinkForDisplay(participant);
        
        tr.innerHTML = `
            <td class="px-4 py-3">
                <input type="checkbox" value="${participant.id}" 
                       class="user-checkbox rounded border-gray-600 text-blue-600"
                       onchange="participantsManager.handleCheckboxChange('${participant.id}', this.checked)">
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${participant.typeInfo.bgColor} flex items-center justify-center text-sm text-white font-medium">
                        ${participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-medium text-gray-100">${participant.name}</div>
                        <div class="text-sm text-gray-400">ID: ${participant.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm">
                    <div class="text-gray-100">${participant.email}</div>
                    <div class="text-gray-400">${phoneDisplay}</div>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm">
                    ${listsDisplay}
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm">
                    <span class="text-gray-300">${campaignDisplay}</span>
                    ${participant.originSource !== 'manual' ? `<br><small class="text-gray-500">via ${participant.originSource}</small>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participant.typeInfo.badgeClass}">
                    <i class="${participant.typeInfo.icon} mr-1"></i>
                    ${participant.typeInfo.label}
                </span>
            </td>
            <td class="px-4 py-3">
                ${linkDisplay}
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participant.statusInfo.badgeClass}">
                    ${participant.statusInfo.label}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <button onclick="participantsManager.editParticipant('${participant.id}')" 
                            class="text-blue-400 hover:text-blue-300 transition-colors" 
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="participantsManager.showParticipantDetails('${participant.id}')" 
                            class="text-green-400 hover:text-green-300 transition-colors" 
                            title="Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="participantsManager.manageParticipantLists('${participant.id}')" 
                            class="text-purple-400 hover:text-purple-300 transition-colors" 
                            title="Gerenciar Listas">
                        <i class="fas fa-list"></i>
                    </button>
                    <button onclick="participantsManager.deleteParticipant('${participant.id}')" 
                            class="text-red-400 hover:text-red-300 transition-colors" 
                            title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return tr;
    }

    // 📋 FORMATAÇÃO DE LISTAS PARA EXIBIÇÃO
    formatListsForDisplay(participant) {
        if (!participant.lists || participant.lists.length === 0) {
            return '<span class="text-gray-500">Nenhuma lista</span>';
        }

        const count = participant.lists.length;
        return `
            <button onclick="participantsManager.showParticipantLists('${participant.id}')" 
                    class="text-blue-400 hover:text-blue-300 text-sm">
                ${count} lista${count !== 1 ? 's' : ''}
                <i class="fas fa-external-link-alt ml-1 text-xs"></i>
            </button>
        `;
    }

    // 🔗 FORMATAÇÃO DE LINK PARA EXIBIÇÃO
    formatLinkForDisplay(participant) {
        if (!participant.displayLink) {
            return '<span class="text-gray-500 text-xs">Sem link</span>';
        }

        return `
            <div class="flex items-center gap-2">
                <button onclick="participantsManager.copyLink('${participant.displayLink}')" 
                        class="text-blue-400 hover:text-blue-300 text-xs transition-colors" 
                        title="Copiar link">
                    <i class="fas fa-copy"></i>
                </button>
                <button onclick="participantsManager.regenerateReferralCode('${participant.id}')" 
                        class="text-green-400 hover:text-green-300 text-xs transition-colors" 
                        title="Gerar novo código">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        `;
    }

    // 🔍 FILTROS E BUSCA
    async applyFilters(filters = {}) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.currentPage = 1; // Reset para primeira página
        await this.loadParticipants({ filters: this.currentFilters, page: 1 });
    }

    async search(searchTerm) {
        const filters = { ...this.currentFilters };
        
        if (searchTerm && searchTerm.trim()) {
            filters.search = searchTerm.trim();
        } else {
            delete filters.search;
        }
        
        await this.applyFilters(filters);
    }

    async filterByType(tipo) {
        await this.applyFilters({ tipo });
    }

    async filterByStatus(status) {
        await this.applyFilters({ status });
    }

    async filterByList(listId) {
        await this.applyFilters({ listId });
    }

    // 📄 PAGINAÇÃO
    async changePage(direction) {
        let newPage = this.currentPage;
        
        if (direction === 'prev' && this.currentPage > 1) {
            newPage = this.currentPage - 1;
        } else if (direction === 'next') {
            const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                newPage = this.currentPage + 1;
            }
        }
        
        if (newPage !== this.currentPage) {
            await this.loadParticipants({ page: newPage });
        }
    }

    async goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (page >= 1 && page <= totalPages && page !== this.currentPage) {
            await this.loadParticipants({ page });
        }
    }

    // 📊 ATUALIZAÇÃO DE INFORMAÇÕES
    updatePaginationInfo() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

        // Atualizar elementos da interface
        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const usersShowingEl = document.getElementById('usersShowing');
        const usersTotalEl = document.getElementById('usersTotal');

        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = totalPages;
        if (usersShowingEl) usersShowingEl.textContent = `${startItem}-${endItem}`;
        if (usersTotalEl) usersTotalEl.textContent = this.totalItems;
    }

    updateStatistics() {
        const stats = {
            total: this.totalItems,
            active: this.participants.filter(p => p.status === 'ativo').length,
            withLists: this.participants.filter(p => p.lists && p.lists.length > 0).length,
            withReferralCode: this.participants.filter(p => p.uniqueReferralCode).length
        };

        // Emitir evento para outros componentes
        window.dispatchEvent(new CustomEvent('participantsStatsUpdated', { detail: stats }));
    }

    // 🎬 AÇÕES DE PARTICIPANTES
    async editParticipant(participantId) {
        window.location.href = `editar-participante.html?id=${participantId}`;
    }

    async showParticipantDetails(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) return;

        // Implementar modal de detalhes
        const modal = this.createDetailsModal(participant);
        document.body.appendChild(modal);
    }

    async deleteParticipant(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) return;

        const confirmed = confirm(`Tem certeza que deseja excluir ${participant.name}?\n\nEsta ação não pode ser desfeita.`);
        if (!confirmed) return;

        try {
            await window.apiClient.deleteParticipant(participantId);
            this.showSuccess('Participante excluído com sucesso!');
            await this.loadParticipants({ forceRefresh: true });
        } catch (error) {
            this.showError('Erro ao excluir participante', error.message);
        }
    }

    async regenerateReferralCode(participantId) {
        try {
            const result = await window.apiClient.generateReferralCode(participantId);
            this.showSuccess('Novo código de referral gerado!');
            await this.loadParticipants({ forceRefresh: true });
        } catch (error) {
            this.showError('Erro ao gerar código', error.message);
        }
    }

    // 🔗 UTILITÁRIOS
    copyLink(link) {
        navigator.clipboard.writeText(link).then(() => {
            this.showSuccess('Link copiado para a área de transferência!');
        }).catch(() => {
            this.showError('Erro ao copiar link');
        });
    }

    // ✅ CHECKBOX MANAGEMENT
    handleCheckboxChange(participantId, checked) {
        const participant = this.participants.find(p => p.id === participantId);
        if (participant) {
            participant.selected = checked;
        }
        
        this.updateBulkActionsVisibility();
    }

    updateBulkActionsVisibility() {
        const selectedCount = this.participants.filter(p => p.selected).length;
        const bulkActions = document.getElementById('bulkActions');
        
        if (bulkActions) {
            bulkActions.style.display = selectedCount > 0 ? 'block' : 'none';
        }
    }

    // 🎨 UI HELPERS
    showLoadingState(show) {
        const tbody = document.getElementById('participantsList');
        if (!tbody) return;

        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="100%" class="px-4 py-8 text-center">
                        <div class="flex items-center justify-center gap-3">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                            <span class="text-gray-300">Carregando participantes...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showError(title, message = '') {
        // Implementar notificação de erro
        console.error(`❌ ${title}:`, message);
        if (window.showNotification) {
            window.showNotification(`${title}: ${message}`, 'error');
        }
    }

    showSuccess(message) {
        // Implementar notificação de sucesso
        console.log(`✅ ${message}`);
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }

    // 🔍 DEBUG E MONITORAMENTO
    getDebugInfo() {
        return {
            participants: this.participants.length,
            currentPage: this.currentPage,
            totalItems: this.totalItems,
            filters: this.currentFilters,
            isLoading: this.isLoading
        };
    }
}

// 🌍 Instância global
window.participantsManager = new ParticipantsManager();

// 📤 Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticipantsManager;
} 