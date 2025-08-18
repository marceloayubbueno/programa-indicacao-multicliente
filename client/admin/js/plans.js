/**
 * Plans Management JavaScript
 * Gerenciamento de planos
 */

// 🔧 CONFIGURAÇÃO DA API - COMO ESTAVA FUNCIONANDO ANTES
const API_BASE_URL = 'https://programa-indicacao-multicliente-production.up.railway.app';

// Endpoints da API
const API_URL = `${API_BASE_URL}/api/planos`;
let editingPlanId = null;

const DEFAULT_PLANS = [
  {
    nome: 'Trial',
    descricao: 'Plano de avaliação gratuito',
    limiteIndicadores: 3,
    limiteIndicacoes: 10,
    funcionalidades: { exportacao: false, relatorios: false, campanhasExtras: false }
  },
  {
    nome: 'Start',
    descricao: 'Plano inicial para pequenas empresas',
    limiteIndicadores: 10,
    limiteIndicacoes: 50,
    funcionalidades: { exportacao: true, relatorios: false, campanhasExtras: false }
  },
  {
    nome: 'Premium',
    descricao: 'Plano completo para empresas que querem crescer',
    limiteIndicadores: 100,
    limiteIndicacoes: 1000,
    funcionalidades: { exportacao: true, relatorios: true, campanhasExtras: true }
  }
];

const FIXED_PLAN_NAMES = ['trial', 'start', 'premium'];

// Carregar planos ao iniciar
window.onload = () => {
    console.log('Página de planos carregada. Chamando loadPlans...');
    loadPlans();
};

async function loadPlans() {
    const container = document.getElementById('plansCardsContainer');
    if (!container) {
        console.error('Elemento #plansCardsContainer não encontrado no HTML!');
        return;
    }
    try {
        const response = await fetch(API_URL);
        let planos = await response.json();
        console.log('Planos recebidos da API:', planos);
        // Se a resposta não for um array, tente acessar uma propriedade comum ou exiba erro
        if (!Array.isArray(planos)) {
            // Tente acessar uma propriedade comum (ex: data, planos, results)
            if (Array.isArray(planos.data)) planos = planos.data;
            else if (Array.isArray(planos.planos)) planos = planos.planos;
            else if (Array.isArray(planos.results)) planos = planos.results;
            else {
                console.error('A resposta da API não é um array de planos:', planos);
                container.innerHTML = '<div style="color: #c00; padding: 24px;">Erro ao carregar planos: resposta inesperada da API.</div>';
                return;
            }
        }
        // Seed automático se não houver planos fixos
        for (const plan of DEFAULT_PLANS) {
            if (!planos.some(p => p.nome.toLowerCase() === plan.nome.toLowerCase())) {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(plan)
                });
            }
        }
        const seeded = await fetch(API_URL);
        let planosSeeded = await seeded.json();
        if (!Array.isArray(planosSeeded)) {
            if (Array.isArray(planosSeeded.data)) planosSeeded = planosSeeded.data;
            else if (Array.isArray(planosSeeded.planos)) planosSeeded = planosSeeded.planos;
            else if (Array.isArray(planosSeeded.results)) planosSeeded = planosSeeded.results;
            else {
                console.error('A resposta da API não é um array de planos após seed:', planosSeeded);
                container.innerHTML = '<div style="color: #c00; padding: 24px;">Erro ao carregar planos: resposta inesperada da API.</div>';
                return;
            }
        }
        // Ordenar: Trial, Start, Premium primeiro
        planosSeeded.sort((a, b) => {
            const ia = FIXED_PLAN_NAMES.indexOf(a.nome.toLowerCase());
            const ib = FIXED_PLAN_NAMES.indexOf(b.nome.toLowerCase());
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });
        container.innerHTML = '';
        planosSeeded.forEach(plan => {
            const isFixed = FIXED_PLAN_NAMES.includes(plan.nome.toLowerCase());
            let badge = '';
            if (plan.nome.toLowerCase() === 'trial') badge = '<span class="badge badge-trial">Trial</span>';
            if (plan.nome.toLowerCase() === 'start') badge = '<span class="badge badge-start">Start</span>';
            if (plan.nome.toLowerCase() === 'premium') badge = '<span class="badge badge-premium">Premium</span>';
            const card = document.createElement('div');
            card.className = 'plan-card';
            card.innerHTML = `
                <h2>${plan.nome} ${badge}</h2>
                <div class="desc">${plan.descricao || ''}</div>
                <div class="limits">
                    <strong>Indicadores:</strong> ${plan.limiteIndicadores}<br>
                    <strong>Indicações:</strong> ${plan.limiteIndicacoes}
                </div>
                <div class="features">
                    ${plan.funcionalidades.exportacao ? '<span>Exportação</span>' : ''}
                    ${plan.funcionalidades.relatorios ? '<span>Relatórios</span>' : ''}
                    ${plan.funcionalidades.campanhasExtras ? '<span>Campanhas Extras</span>' : ''}
                </div>
                <div class="actions">
                    <button class="btn-primary" onclick="editPlan('${plan._id}')"><i class='fas fa-edit'></i> Editar</button>
                    ${isFixed ? '' : `<button class="btn-secondary" onclick="deletePlan('${plan._id}')"><i class='fas fa-trash'></i> Excluir</button>`}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        container.innerHTML = '<div style="color: #c00; padding: 24px;">Erro ao carregar planos. Verifique sua conexão ou tente novamente mais tarde.</div>';
    }
}

function openPlanModal() {
    editingPlanId = null;
    document.getElementById('planModalTitle').innerText = 'Novo Plano';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').style.display = 'block';
}

function closePlanModal() {
    document.getElementById('planModal').style.display = 'none';
}

async function savePlan() {
    const nome = document.getElementById('planName').value;
    const descricao = document.getElementById('planDescription').value;
    const limiteIndicadores = parseInt(document.getElementById('planIndicadores').value);
    const limiteIndicacoes = parseInt(document.getElementById('planIndicacoes').value);
    const funcionalidades = {
        exportacao: document.getElementById('planExportacao').checked,
        relatorios: document.getElementById('planRelatorios').checked,
        campanhasExtras: document.getElementById('planCampanhasExtras').checked
    };
    const planData = { nome, descricao, limiteIndicadores, limiteIndicacoes, funcionalidades };
    try {
        let response;
        if (editingPlanId) {
            response = await fetch(`${API_URL}/${editingPlanId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData)
            });
        }
        if (!response.ok) throw new Error('Erro ao salvar plano');
        closePlanModal();
        loadPlans();
    } catch (error) {
        alert(error.message);
    }
}

async function editPlan(id) {
    try {
        const response = await fetch(`${API_URL}`);
        const planos = await response.json();
        const plan = planos.find(p => p._id === id);
        if (!plan) return;
        editingPlanId = id;
        document.getElementById('planModalTitle').innerText = 'Editar Plano';
        document.getElementById('planName').value = plan.nome;
        document.getElementById('planDescription').value = plan.descricao || '';
        document.getElementById('planIndicadores').value = plan.limiteIndicadores;
        document.getElementById('planIndicacoes').value = plan.limiteIndicacoes;
        document.getElementById('planExportacao').checked = !!plan.funcionalidades.exportacao;
        document.getElementById('planRelatorios').checked = !!plan.funcionalidades.relatorios;
        document.getElementById('planCampanhasExtras').checked = !!plan.funcionalidades.campanhasExtras;
        document.getElementById('planModal').style.display = 'block';
    } catch (error) {
        alert('Erro ao editar plano');
    }
}

async function deletePlan(id) {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao excluir plano');
        loadPlans();
    } catch (error) {
        alert(error.message);
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('planModal');
    if (event.target === modal) {
        closePlanModal();
    }
}; 