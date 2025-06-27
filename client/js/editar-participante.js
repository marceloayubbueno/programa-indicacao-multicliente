const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-editar-participante');
  const feedback = document.getElementById('mensagem-feedback');
  let isSubmitting = false;

  // Detecta se é cadastro ou edição
  const urlParams = new URLSearchParams(window.location.search);
  const participantId = urlParams.get('id');
  const token = localStorage.getItem('clientToken');
  const clientId = localStorage.getItem('clientId');

  // --- INTEGRAÇÃO COM LISTAS (select simples, filtrado por tipo) ---
  let allLists = [];
  let selectedList = '';

  function getTipoSelecionado() {
    return document.getElementById('tipo').value;
  }

  function atualizarSelectListas() {
    const select = document.getElementById('listas-select');
    const tipo = getTipoSelecionado();
    select.innerHTML = '<option value="">Nenhuma lista</option>';
    const listasFiltradas = allLists.filter(list => list.tipo === tipo);
    if (!listasFiltradas.length) {
      return;
    }
    listasFiltradas.forEach(list => {
      const opt = document.createElement('option');
      opt.value = list._id;
      opt.textContent = list.name;
      if (selectedList && selectedList === list._id) opt.selected = true;
      select.appendChild(opt);
    });
    // Se a lista selecionada não está mais disponível, limpa seleção
    if (selectedList && !listasFiltradas.some(l => l._id === selectedList)) {
      select.value = '';
      selectedList = '';
    }
  }

  async function carregarListas() {
    const select = document.getElementById('listas-select');
    select.innerHTML = '<option disabled>Carregando listas...</option>';
    try {
      const resp = await fetch(`${API_URL}/participant-lists?clientId=${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Erro ao buscar listas');
      allLists = await resp.json();
      atualizarSelectListas();
    } catch (err) {
      select.innerHTML = '<option disabled>Erro ao carregar listas</option>';
    }
  }

  // Função para preencher o formulário com dados do participante
  async function carregarParticipante(id) {
    feedback.textContent = 'Carregando dados...';
    try {
      const response = await fetch(`${API_URL}/participants/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar participante');
      const p = await response.json();
      document.getElementById('nome').value = p.name || '';
      document.getElementById('email').value = p.email || '';
      document.getElementById('celular').value = p.phone || '';
      document.getElementById('pix').value = p.pix || '';
      document.getElementById('tipo').value = p.tipo || 'participante';
      document.getElementById('status').value = p.status || 'ativo';
      // Seleciona a primeira lista (se houver) ou vazio
      if (Array.isArray(p.lists) && p.lists.length > 0) {
        selectedList = typeof p.lists[0] === 'object' ? p.lists[0]._id : p.lists[0];
      } else {
        selectedList = '';
      }
      await carregarListas();
      feedback.textContent = '';
    } catch (err) {
      feedback.textContent = 'Erro ao carregar participante.';
    }
  }

  // Atualizar listas ao mudar o tipo
  document.getElementById('tipo').addEventListener('change', () => {
    selectedList = '';
    atualizarSelectListas();
  });

  // Carregar listas (e participante, se edição)
  if (participantId) {
    carregarParticipante(participantId);
  } else {
    carregarListas();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = false;
    feedback.textContent = '';

    // Captura campos
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const celular = document.getElementById('celular').value.trim();
    const pix = document.getElementById('pix').value.trim();
    const tipo = document.getElementById('tipo').value;
    const status = document.getElementById('status').value;
    const listaSelect = document.getElementById('listas-select');
    const listaSelecionada = listaSelect.value || null;
    const lists = listaSelecionada ? [listaSelecionada] : [];

    // Validação básica
    if (!nome || !email || !celular) {
      feedback.textContent = 'Preencha todos os campos obrigatórios.';
      isSubmitting = false;
      return;
    }
    if (!clientId || !token) {
      feedback.textContent = 'Erro de autenticação. Faça login novamente.';
      isSubmitting = false;
      return;
    }

    try {
      let response;
      if (participantId) {
        // Edição: PATCH
        response = await fetch(`${API_URL}/participants/${participantId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: nome,
            email,
            phone: celular,
            pix,
            status,
            tipo,
            lists
          })
        });
      } else {
        // Cadastro: POST
        response = await fetch(`${API_URL}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: nome,
            email,
            phone: celular,
            pix,
            status,
            clientId,
            tipo,
            lists
          })
        });
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar participante');
      }
      feedback.textContent = participantId ? 'Participante atualizado com sucesso!' : 'Participante cadastrado com sucesso!';
      if (!participantId) form.reset();
    } catch (error) {
      feedback.textContent = error.message || 'Erro ao salvar participante';
    }
    isSubmitting = false;
  });
}); 