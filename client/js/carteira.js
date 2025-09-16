// Integração Carteira do Cliente

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  carregarSaldoCarteira();
  carregarExtratoCarteira();
});

async function carregarSaldoCarteira() {
  const token = localStorage.getItem('clientToken');
  if (!token) return;
  const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL :
    (window.location.hostname === 'localhost' ?
      'http://localhost:3000' :
      'https://programa-indicacao-multicliente-production.up.railway.app/');
  try {
    const res = await fetch(`${apiUrl}/admin/api/carteira/saldo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    document.getElementById('saldoCarteira').textContent =
      data.saldo !== undefined ? formatarMoeda(data.saldo) : 'R$ 0,00';
  } catch (e) {
    document.getElementById('saldoCarteira').textContent = 'Erro';
  }
}

async function carregarExtratoCarteira() {
  const token = localStorage.getItem('clientToken');
  if (!token) return;
  const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL :
    (window.location.hostname === 'localhost' ?
      'http://localhost:3000' :
      'https://programa-indicacao-multicliente-production.up.railway.app/');
  try {
    const res = await fetch(`${apiUrl}/admin/api/carteira/extrato`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    preencherExtratoCarteira(data);
  } catch (e) {
    document.getElementById('extratoCarteiraBody').innerHTML = '<tr><td colspan="5">Erro ao carregar extrato</td></tr>';
  }
}

function preencherExtratoCarteira(transacoes) {
  const tbody = document.getElementById('extratoCarteiraBody');
  if (!Array.isArray(transacoes) || transacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Nenhuma transação encontrada</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  transacoes.forEach(tx => {
    const tipo = tx.tipo === 'entrada' ? 'Crédito' : 'Débito';
    const valor = (tx.tipo === 'entrada' ? '+ ' : '- ') + formatarMoeda(tx.valor);
    const cor = tx.tipo === 'entrada' ? 'text-green-400' : 'text-red-400';
    const status = tx.status === 'confirmado' ? 'Aprovado' : (tx.status === 'pendente' ? 'Pendente' : 'Cancelado');
    const data = formatarData(tx.data);
    tbody.innerHTML += `
      <tr>
        <td class="px-6 py-4">${data}</td>
        <td class="px-6 py-4 ${cor}">${tipo}</td>
        <td class="px-6 py-4 ${cor}">${valor}</td>
        <td class="px-6 py-4">${status}</td>
        <td class="px-6 py-4">${tx.descricao || ''}</td>
      </tr>
    `;
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR');
}

// Integração real do modal de adicionar saldo
window.gerarCobrancaReal = async function gerarCobrancaReal() {
  const valor = parseFloat(document.getElementById('valorRecarga').value);
  const tipo = document.getElementById('tipoCobranca').value;
  if (!valor || valor <= 0) {
    alert('Informe um valor válido.');
    return;
  }
  const token = localStorage.getItem('clientToken');
  const clientId = localStorage.getItem('clientId');
  const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL :
    (window.location.hostname === 'localhost' ?
      'http://localhost:3000' :
      'https://programa-indicacao-multicliente-production.up.railway.app/api');
  const btn = document.querySelector('#formGerarCobranca button');
  btn.disabled = true;
  btn.textContent = 'Gerando...';
  try {
    const res = await fetch(`${apiUrl}/admin/api/carteira/gerar-cobranca`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId, valor, origem: tipo })
    });
    const data = await res.json();
    if (data && data.dadosBanco) {
      exibirCobrancaGerada(data.dadosBanco, valor);
    } else {
      alert('Cobrança gerada, mas sem dados bancários retornados.');
    }
  } catch (e) {
    alert('Erro ao gerar cobrança.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Gerar Cobrança';
  }
}

function exibirCobrancaGerada(dadosBanco, valor) {
  const div = document.getElementById('cobrancaMock');
  div.classList.remove('hidden');
  div.innerHTML = `
    <div class="mb-2 text-sm text-gray-400">Cobrança gerada:</div>
    <div class="flex flex-col gap-2">
      ${dadosBanco.linhaDigitavel ? `<div><span class="font-semibold text-blue-400">Linha digitável:</span> ${dadosBanco.linhaDigitavel}</div>` : ''}
      ${dadosBanco.pixCopiaCola ? `<div><span class="font-semibold text-green-400">PIX Copia e Cola:</span> ${dadosBanco.pixCopiaCola}</div>` : ''}
      <div><span class="font-semibold text-gray-300">Valor:</span> ${formatarMoeda(valor)}</div>
      <div><span class="font-semibold text-gray-300">Vencimento:</span> ${dadosBanco.vencimento ? formatarData(dadosBanco.vencimento) : '-'}</div>
    </div>
    ${dadosBanco.qrCodeUrl ? `<div class="mt-2"><img src="${dadosBanco.qrCodeUrl}" alt="QR Code PIX" class="inline-block rounded bg-white p-1"></div>` : ''}
    <div class="mt-2 text-xs text-gray-400">* Use os dados acima para efetuar o pagamento.</div>
  `;
} 