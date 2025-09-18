// Lógica para página dedicada de edição/criação de tipos de recompensa

// 🌍 CONFIGURAÇÃO DINÂMICA: usar config.js quando disponível
const apiBaseUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                  (window.location.hostname === 'localhost' ? 
                   'http://localhost:3000' : 
                   'https://programa-indicacao-multicliente-production.up.railway.app');
const apiUrl = `${apiBaseUrl}/rewards`;
let editingRewardTypeId = null;
let originalRewardData = null;

// Carregar dados para edição, se houver ID na querystring
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const type = params.get('type');
  
  if (id) {
    loadRewardType(id);
  } else if (type) {
    // Pré-selecionar tipo de recompensa quando vindo de rewards-available.html
    preSelectRewardType(type);
  }

  document.getElementById('rewardTypeForm').addEventListener('submit', handleSaveRewardType);
  document.getElementById('duplicateBtn').addEventListener('click', handleDuplicate);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    // Verificar se foi aberto a partir do quiz ou da área de recompensas
    const urlParams = new URLSearchParams(window.location.search);
    const fromQuiz = urlParams.get('from') === 'quiz';
    
    if (fromQuiz) {
      // Fechar aba e voltar ao quiz
      window.close();
    } else {
      // Retorno normal para rewards.html
      window.location.href = 'rewards.html';
    }
  });
  
  // Inicializar campos baseado no tipo selecionado
  toggleRewardFields();
});

// Pré-selecionar tipo de recompensa quando vindo de rewards-available.html
function preSelectRewardType(type) {
  console.log(`🎯 [REWARD-EDITOR] Pré-selecionando tipo: ${type}`);
  
  const rewardTypeSelect = document.getElementById('rewardType');
  if (rewardTypeSelect) {
    rewardTypeSelect.value = type;
    
    // Atualizar título da página para mostrar o tipo selecionado
    const typeLabels = {
      pontos: 'Pontos',
      pix: 'PIX',
      desconto: 'Desconto em %',
      desconto_valor_financeiro: 'Desconto em Valor',
      valor_fixo: 'Valor Fixo',
      valor_percentual: 'Valor % Percentual',
      desconto_recorrente: 'Desconto Recorrente',
      cashback: 'Cashback',
      credito_digital: 'Crédito Digital',
      produto_gratis: 'Produto/Serviço Grátis',
      comissao_recorrente: 'Comissão Recorrente',
      bonus_volume: 'Bônus por Volume',
      desconto_progressivo: 'Desconto Progressivo',
      vale_presente: 'Vale-Presente',
      valor_conversao: 'Por Valor da Conversão',
      meta: 'Por Meta'
    };
    
    const typeLabel = typeLabels[type] || type;
    document.title = `Criar ${typeLabel} - Editor de Recompensas`;
    
    // Atualizar campos baseado no tipo selecionado
    toggleRewardFields();
  }
}

async function loadRewardType(id) {
  try {
    const token = localStorage.getItem('clientToken');
    const response = await fetch(`${apiUrl}/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    });
    if (!response.ok) throw new Error('Erro ao buscar tipo de recompensa');
    const data = await response.json();
    fillForm(data);
    editingRewardTypeId = id;
    originalRewardData = data;
  } catch (err) {
    alert('Erro ao carregar tipo de recompensa: ' + err.message);
  }
}

function fillForm(data) {
  document.getElementById('rewardName').value = data.description || '';
  document.getElementById('rewardType').value = data.type;
  document.getElementById('rewardDescription').value = data.description || '';
  
  // Preencher campos específicos baseado no tipo
  switch(data.type) {
    case 'pontos':
      document.getElementById('pontosValue').value = data.value || '';
      break;
    case 'pix':
      document.getElementById('pixValue').value = data.value || '';
      break;
    case 'desconto':
      document.getElementById('descontoValue').value = data.value || '';
      break;
    case 'desconto_valor_financeiro':
      document.getElementById('descontoValorFinanceiroValue').value = data.value || '';
      break;
    case 'valor_fixo':
      document.getElementById('valorFixo').value = data.fixedValue || data.value || '';
      break;
    case 'valor_percentual':
      document.getElementById('percentualValue').value = data.percentageValue || data.value || '';
      break;
    case 'desconto_recorrente':
      document.getElementById('descontoRecorrenteValue').value = data.value || '';
      break;
    case 'cashback':
      document.getElementById('cashbackValue').value = data.value || '';
      break;
    case 'credito_digital':
      document.getElementById('creditoDigitalValue').value = data.value || '';
      break;
    case 'produto_gratis':
      document.getElementById('produtoGratisValue').value = data.value || '';
      break;
    case 'comissao_recorrente':
      document.getElementById('comissaoRecorrenteValue').value = data.value || '';
      break;
    case 'bonus_volume':
      document.getElementById('bonusVolumeValue').value = data.value || '';
      break;
    case 'desconto_progressivo':
      document.getElementById('descontoProgressivoValue').value = data.value || '';
      break;
    case 'vale_presente':
      document.getElementById('valePresenteValue').value = data.value || '';
      break;
    case 'valor_conversao':
      document.getElementById('valorConversaoValue').value = data.value || '';
      break;
    case 'meta':
      document.getElementById('metaValue').value = data.value || '';
      break;
    default:
      // Para tipos não implementados, usar campo genérico
      document.getElementById('rewardValue').value = data.value || '';
      break;
  }
  
  // Atualizar exibição dos campos
  toggleRewardFields();
}

async function handleSaveRewardType(event) {
  event.preventDefault();
  const rewardType = document.getElementById('rewardType').value;
  const rewardData = {
    type: rewardType,
    description: document.getElementById('rewardName').value,
    details: document.getElementById('rewardDescription').value,
    clientId: localStorage.getItem('clientId')
  };
  
  // Coletar valor do campo específico baseado no tipo
  switch(rewardType) {
    case 'pontos':
      rewardData.value = parseInt(document.getElementById('pontosValue').value);
      break;
    case 'pix':
      rewardData.value = parseFloat(document.getElementById('pixValue').value);
      break;
    case 'desconto':
      rewardData.value = parseFloat(document.getElementById('descontoValue').value);
      break;
    case 'desconto_valor_financeiro':
      rewardData.value = parseFloat(document.getElementById('descontoValorFinanceiroValue').value);
      break;
    case 'valor_fixo':
      rewardData.value = parseFloat(document.getElementById('valorFixo').value);
      rewardData.fixedValue = parseFloat(document.getElementById('valorFixo').value);
      break;
    case 'valor_percentual':
      rewardData.percentageValue = parseFloat(document.getElementById('percentualValue').value);
      rewardData.value = parseFloat(document.getElementById('percentualValue').value); // Campo obrigatório no schema
      break;
    case 'desconto_recorrente':
      rewardData.value = parseFloat(document.getElementById('descontoRecorrenteValue').value);
      break;
    case 'cashback':
      rewardData.value = parseFloat(document.getElementById('cashbackValue').value);
      break;
    case 'credito_digital':
      rewardData.value = parseFloat(document.getElementById('creditoDigitalValue').value);
      break;
    case 'produto_gratis':
      rewardData.value = parseInt(document.getElementById('produtoGratisValue').value);
      break;
    case 'comissao_recorrente':
      rewardData.value = parseFloat(document.getElementById('comissaoRecorrenteValue').value);
      break;
    case 'bonus_volume':
      rewardData.value = parseFloat(document.getElementById('bonusVolumeValue').value);
      break;
    case 'desconto_progressivo':
      rewardData.value = parseFloat(document.getElementById('descontoProgressivoValue').value);
      break;
    case 'vale_presente':
      rewardData.value = parseFloat(document.getElementById('valePresenteValue').value);
      break;
    case 'valor_conversao':
      rewardData.value = parseFloat(document.getElementById('valorConversaoValue').value);
      break;
    case 'meta':
      rewardData.value = parseFloat(document.getElementById('metaValue').value);
      break;
    default:
      // Para tipos não implementados, usar campo genérico
      rewardData.value = parseFloat(document.getElementById('rewardValue').value);
      break;
  }
  try {
    const token = localStorage.getItem('clientToken');
    let response;
    if (editingRewardTypeId) {
      response = await fetch(`${apiUrl}/${editingRewardTypeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': 'Bearer ' + token })
        },
        body: JSON.stringify(rewardData)
      });
    } else {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': 'Bearer ' + token })
        },
        body: JSON.stringify(rewardData)
      });
    }
    if (!response.ok) throw new Error('Erro ao salvar tipo de recompensa');
    alert('Tipo de recompensa salvo com sucesso!');
    
    // Verificar se foi aberto a partir do quiz ou da área de recompensas
    const urlParams = new URLSearchParams(window.location.search);
    const fromQuiz = urlParams.get('from') === 'quiz';
    
    if (fromQuiz) {
      // Fechar aba e voltar ao quiz
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      // Retorno normal para rewards.html
      window.location.href = 'rewards.html';
    }
  } catch (err) {
    alert('Erro ao salvar tipo de recompensa: ' + err.message);
  }
}

function handleDuplicate() {
  if (!originalRewardData) {
    alert('Só é possível duplicar após carregar um tipo de recompensa existente.');
    return;
  }
  // Preenche o formulário com os dados originais, mas limpa o nome e o id de edição
  fillForm({ ...originalRewardData, description: '', _id: undefined });
  editingRewardTypeId = null;
  alert('Dados duplicados! Edite o nome e salve para criar um novo tipo de recompensa.');
}

// Função para controlar exibição dos campos específicos por tipo de recompensa
function toggleRewardFields() {
  const rewardType = document.getElementById('rewardType').value;
  
  // Esconder todos os campos específicos
  document.querySelectorAll('.reward-type-fields').forEach(field => {
    field.style.display = 'none';
  });
  
  // Esconder todos os campos de valor específicos
  document.querySelectorAll('.reward-type-value-field').forEach(field => {
    field.style.display = 'none';
  });
  
  // Esconder campo genérico
  document.getElementById('rewardValueField').style.display = 'none';
  
  // Mostrar campo específico baseado no tipo selecionado
  switch(rewardType) {
    case 'pontos':
      document.getElementById('pontosValueField').style.display = 'block';
      break;
    case 'pix':
      document.getElementById('pixValueField').style.display = 'block';
      break;
    case 'desconto':
      document.getElementById('descontoValueField').style.display = 'block';
      break;
    case 'desconto_valor_financeiro':
      document.getElementById('descontoValorFinanceiroValueField').style.display = 'block';
      break;
    case 'valor_fixo':
      document.getElementById('valorFixoFields').style.display = 'block';
      break;
    case 'valor_percentual':
      document.getElementById('valorPercentualFields').style.display = 'block';
      break;
    case 'desconto_recorrente':
      document.getElementById('descontoRecorrenteValueField').style.display = 'block';
      break;
    case 'cashback':
      document.getElementById('cashbackValueField').style.display = 'block';
      break;
    case 'credito_digital':
      document.getElementById('creditoDigitalValueField').style.display = 'block';
      break;
    case 'produto_gratis':
      document.getElementById('produtoGratisValueField').style.display = 'block';
      break;
    case 'comissao_recorrente':
      document.getElementById('comissaoRecorrenteValueField').style.display = 'block';
      break;
    case 'bonus_volume':
      document.getElementById('bonusVolumeValueField').style.display = 'block';
      break;
    case 'desconto_progressivo':
      document.getElementById('descontoProgressivoValueField').style.display = 'block';
      break;
    case 'vale_presente':
      document.getElementById('valePresenteValueField').style.display = 'block';
      break;
    case 'valor_conversao':
      document.getElementById('valorConversaoValueField').style.display = 'block';
      break;
    case 'meta':
      document.getElementById('metaValueField').style.display = 'block';
      break;
    default:
      // Para tipos não implementados, mostrar campo genérico
      document.getElementById('rewardValueField').style.display = 'block';
      break;
  }
  
  // Mostrar descrição da recompensa selecionada
  showRewardTypeDescription(rewardType);
}

// Função para mostrar descrição do tipo de recompensa selecionado
function showRewardTypeDescription(rewardType) {
  const descriptionContainer = document.getElementById('rewardTypeDescription');
  const descriptionText = document.getElementById('rewardDescriptionText');
  
  const descriptions = {
    pontos: 'Sistema de pontos que podem ser acumulados e trocados por benefícios. Ideal para programas de fidelidade e engajamento contínuo.',
    pix: 'Pagamento instantâneo via PIX em dinheiro real. Perfeito para recompensas financeiras diretas e motivacionais.',
    desconto: 'Desconto percentual aplicado em produtos ou serviços. Ideal para incentivar compras e reduzir custos para clientes indicados.',
    desconto_valor_financeiro: 'Desconto em valor fixo (R$) aplicado em produtos ou serviços. Oferece economia direta e tangível.',
    valor_fixo: 'Valor financeiro fixo pago mensalmente para indicadores/influenciadores. Garante renda estável e previsível.',
    valor_percentual: 'Comissionamento variável baseado no valor do produto adquirido pelo cliente indicado. Recompensa proporcional ao resultado.',
    desconto_recorrente: 'Desconto aplicado mensalmente de forma recorrente. Ideal para manter clientes engajados a longo prazo.',
    cashback: 'Devolução de parte do valor gasto em compras. Incentiva novas compras e aumenta o valor do cliente.',
    credito_digital: 'Crédito digital para uso na plataforma ou em produtos específicos. Flexível e fácil de gerenciar.',
    produto_gratis: 'Produto ou serviço gratuito como recompensa. Aumenta o valor percebido e pode gerar upsell.',
    comissao_recorrente: 'Comissão mensal recorrente baseada em indicadores ativos. Cria fonte de renda contínua.',
    bonus_volume: 'Bônus adicional baseado no volume de indicações. Incentiva alta performance e produtividade.',
    desconto_progressivo: 'Desconto que aumenta conforme mais indicações são feitas. Recompensa progressiva e escalável.',
    vale_presente: 'Vale-presente para uso em produtos ou serviços específicos. Flexível e atrativo para clientes.',
    valor_conversao: 'Recompensa baseada no valor da conversão do lead indicado. Alinha incentivos com resultados financeiros.',
    meta: 'Recompensa baseada no cumprimento de metas específicas. Ideal para campanhas com objetivos claros.'
  };
  
  if (rewardType && descriptions[rewardType]) {
    descriptionText.textContent = descriptions[rewardType];
    descriptionContainer.style.display = 'block';
  } else {
    descriptionContainer.style.display = 'none';
  }
} 