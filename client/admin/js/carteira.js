// Carregar saldo e extrato ao abrir a página
window.addEventListener('DOMContentLoaded', async () => {
  await carregarSaldo();
  await carregarClientesESaldos();
});

let clientesMap = {};

async function carregarSaldo() {
  try {
    const apiUrl = 'https://programa-indicacao-multicliente-production.up.railway.app';
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    console.log('[CarteiraAdmin] Buscando saldo...', apiUrl);
    const res = await fetch(`${apiUrl}/admin/carteira/saldo`, { headers });
    const text = await res.clone().text();
    console.log('[CarteiraAdmin] Status resposta saldo:', res.status, text);
    const data = JSON.parse(text);
    const saldoEl = document.getElementById('saldoTotal');
    if (saldoEl) {
      saldoEl.textContent =
        data.saldo !== undefined ? `R$ ${data.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';
    }
  } catch (e) {
    const saldoEl = document.getElementById('saldoTotal');
    if (saldoEl) saldoEl.textContent = 'Erro ao carregar saldo';
    console.error('[CarteiraAdmin] Erro ao buscar saldo:', e);
  }
}

async function carregarClientesESaldos() {
  try {
    const apiUrl = 'https://programa-indicacao-multicliente-production.up.railway.app';
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    console.log('[CarteiraAdmin] Buscando clientes...', apiUrl);
    const resClientes = await fetch(`${apiUrl}/admin/carteira/clientes`, { headers });
    const textClientes = await resClientes.clone().text();
    console.log('[CarteiraAdmin] Status resposta clientes:', resClientes.status, textClientes);
    const listaClientes = JSON.parse(textClientes);
    console.log('[CarteiraAdmin] Clientes recebidos:', listaClientes);
    clientesMap = {};
    listaClientes.forEach(c => { clientesMap[c._id] = c.companyName; });

    console.log('[CarteiraAdmin] Buscando extrato...', apiUrl);
    const resExtrato = await fetch(`${apiUrl}/admin/carteira/extrato`, { headers });
    const textExtrato = await resExtrato.clone().text();
    console.log('[CarteiraAdmin] Status resposta extrato:', resExtrato.status, textExtrato);
    const extrato = JSON.parse(textExtrato);
    console.log('[CarteiraAdmin] Extrato recebido:', extrato);
    const tbody = document.getElementById('carteiraClientesBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const saldos = {};
    extrato.forEach(mov => {
      if (!saldos[mov.clientId]) saldos[mov.clientId] = 0;
      if (mov.status === 'confirmado') saldos[mov.clientId] += mov.valor;
    });
    Object.entries(saldos).forEach(([clientId, saldo]) => {
      if (!clientesMap[clientId]) return;
      const nome = clientesMap[clientId];
      console.log(`[CarteiraAdmin] Preenchendo linha: ${nome} - Saldo: ${saldo}`);
      tbody.innerHTML += `
        <tr>
          <td class="px-6 py-4">${nome}</td>
          <td class="px-6 py-4 text-green-400 font-semibold">R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="px-6 py-4">
            <button onclick="abrirDetalheCliente('${clientId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <i class="fas fa-search"></i> Detalhar
            </button>
          </td>
        </tr>
      `;
    });
  } catch (e) {
    console.error('[CarteiraAdmin] Erro ao buscar clientes/saldos:', e);
    const tbody = document.getElementById('carteiraClientesBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar clientes/saldos</td></tr>';
  }
}

window.abrirDetalheCliente = async function abrirDetalheCliente(clientId) {
  document.getElementById('modalDetalheCliente').classList.remove('hidden');
  document.getElementById('modalClienteNome').textContent = clientesMap[clientId] || `Cliente ${clientId}`;
  await carregarExtratoCliente(clientId);
}

window.fecharDetalheCliente = function fecharDetalheCliente() {
  document.getElementById('modalDetalheCliente').classList.add('hidden');
}

async function carregarExtratoCliente(clientId) {
  const tbody = document.querySelector('#modalDetalheCliente tbody');
  tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
  try {
    const apiUrl = 'https://programa-indicacao-multicliente-production.up.railway.app';
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch(`${apiUrl}/admin/carteira/extrato?clientId=${clientId}`, { headers });
    const text = await res.clone().text();
    console.log('[CarteiraAdmin] Status resposta extrato cliente:', res.status, text);
    const extrato = JSON.parse(text);
    if (!Array.isArray(extrato) || extrato.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Nenhuma transação encontrada</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    extrato.forEach(tx => {
      const tipo = tx.tipo === 'entrada' ? 'Crédito' : 'Débito';
      const valor = (tx.tipo === 'entrada' ? '+ ' : '- ') + `R$ ${tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const cor = tx.tipo === 'entrada' ? 'text-green-400' : 'text-red-400';
      const data = formatarData(tx.data);
      tbody.innerHTML += `
        <tr>
          <td class="px-4 py-2">${data}</td>
          <td class="px-4 py-2 ${cor}">${tipo}</td>
          <td class="px-4 py-2 ${cor}">${valor}</td>
          <td class="px-4 py-2">${tx.descricao || ''}</td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar extrato</td></tr>';
  }
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR');
}

console.log('[DEPURACAO] carteira.js carregado');
console.log('[DEPURACAO] Hostname:', window.location.hostname);
console.log('[DEPURACAO] APP_CONFIG:', window.APP_CONFIG);
console.log('[DEPURACAO] adminToken:', localStorage.getItem('adminToken')); 