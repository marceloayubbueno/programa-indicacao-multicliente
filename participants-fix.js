// CENTRAL DE PARTICIPANTES - VERSÃO PRAGMÁTICA E FUNCIONAL

// Configuração
const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
               (window.location.hostname === 'localhost' ? 
                'http://localhost:3000/api' : 
                'https://programa-indicacao-multicliente-production.up.railway.app/api');

function getApiUrl() {
    return window.API_URL || API_URL;
}

// Estado Global (ÚNICA DECLARAÇÃO)
let participants = [];
let lists = [];
let currentPage = 1;
let totalPages = 1; 
let totalParticipants = 0;
let pageSize = 25;
let currentTab = 'users';

// Função principal para carregar participantes
async function loadParticipants(page = 1) {
    const token = localStorage.getItem('clientToken');
    const clientId = localStorage.getItem('clientId');
    
    if (!token || !clientId) {
        console.error('Token ou ClientId não encontrados');
        return;
    }
    
    try {
        console.log('🔄 Carregando participantes...');
        
        const response = await fetch(`${getApiUrl()}/participants?page=${page}&limit=${pageSize}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        participants = result.participants || [];
        totalParticipants = result.total || 0;
        currentPage = page;
        totalPages = result.totalPages || 1;
        
        console.log('✅ Participantes carregados:', participants.length);
        
        displayParticipants();
        
    } catch (error) {
        console.error('❌ Erro ao carregar participantes:', error);
        document.getElementById('participantsTableBody').innerHTML = 
            '<tr><td colspan="9" class="text-center text-red-400 py-4">Erro ao carregar participantes</td></tr>';
    }
}

// Função para exibir participantes na tabela
function displayParticipants() {
    const tbody = document.getElementById('participantsTableBody');
    
    if (!tbody) {
        console.error('Elemento participantsTableBody não encontrado');
        return;
    }
    
    if (!participants || participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-400 py-4">Nenhum participante encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = participants.map(participant => {
        const tipoInfo = getTipoInfo(participant.tipo || 'participante');
        
        return `
            <tr class="hover:bg-gray-800 transition-colors">
                <td class="px-4 py-3">
                    <input type="checkbox" class="user-checkbox" value="${participant._id}">
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${tipoInfo.bgColor} flex items-center justify-center">
                            <i class="${tipoInfo.icon} text-white text-sm"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-100">${participant.name || 'Sem nome'}</div>
                            <div class="text-sm text-gray-400">${participant.email || 'Sem email'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">${participant.phone || '-'}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-300">-</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">-</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoInfo.badgeClass}">
                        <i class="${tipoInfo.icon} mr-1"></i>
                        ${tipoInfo.label}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm">-</div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-green-400">Ativo</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <button class="text-blue-400 hover:text-blue-300" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-yellow-400 hover:text-yellow-300" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-400 hover:text-red-300" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ Tabela de participantes atualizada');
}

// Função para obter info do tipo
function getTipoInfo(tipo) {
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

// Função para trocar abas
function switchTab(tabName) {
    currentTab = tabName;
    
    // Atualizar botões das abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('bg-gray-700', 'text-gray-300');
        activeTab.classList.add('bg-blue-600', 'text-white');
    }
    
    // Mostrar/esconder conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`tab-content-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // Carregar dados da aba
    if (tabName === 'users') {
        loadParticipants();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Central de Participantes - Versão Pragmática Iniciada');
    loadParticipants();
});

console.log('✅ Participants.js carregado com sucesso - versão pragmática'); 