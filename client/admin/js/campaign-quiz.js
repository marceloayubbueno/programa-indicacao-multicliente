let currentStep = 0;
let selectedCampaignType = null;
let selectedSourceType = null;

const totalSteps = 6; // 0 a 6

function showStep(step) {
  // Atualiza indicador visual
  const steps = document.querySelectorAll('.quiz-step');
  steps.forEach((el, idx) => {
    el.classList.toggle('active', idx === step);
  });
  // Atualiza step-indicator
  const indicators = document.querySelectorAll('#stepIndicator .step');
  indicators.forEach((el, idx) => {
    el.classList.remove('active', 'completed');
    if (idx < step) el.classList.add('completed');
    if (idx === step) el.classList.add('active');
  });
  // Botões
  document.getElementById('prevButton').style.display = step > 0 ? '' : 'none';
  document.getElementById('nextButton').style.display = step < totalSteps ? '' : 'none';
  document.getElementById('nextButton').textContent = step === totalSteps ? 'Finalizar' : 'Próxima';
}

function nextStep() {
  // Validação por etapa
  if (currentStep === 0) {
    if (!selectedCampaignType) {
      alert('Selecione o tipo de campanha.');
      return;
    }
    if (selectedCampaignType === 'online') {
      alert('O fluxo de Link de Compartilhamento (Conversão Online) estará disponível em breve!');
      return;
    }
  }
  if (currentStep === 1) {
    const name = document.getElementById('campaignName').value.trim();
    if (!name) {
      alert('Informe o nome da campanha.');
      return;
    }
  }
  if (currentStep === 2) {
    if (!selectedSourceType) {
      alert('Selecione a fonte dos indicadores.');
      return;
    }
  }
  if (currentStep < totalSteps) {
    currentStep++;
    showStep(currentStep);
  }
}

function previousStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
}

function selectCampaignType(type) {
  selectedCampaignType = type;
  // Visual feedback
  document.getElementById('cardOffline').classList.toggle('ring-2', type === 'offline');
  document.getElementById('cardOffline').classList.toggle('ring-blue-500', type === 'offline');
  document.getElementById('cardOnline').classList.toggle('ring-2', type === 'online');
  document.getElementById('cardOnline').classList.toggle('ring-yellow-500', type === 'online');
}

function selectSourceType(type) {
  selectedSourceType = type;
  document.getElementById('cardList').classList.toggle('ring-2', type === 'list');
  document.getElementById('cardList').classList.toggle('ring-blue-500', type === 'list');
  document.getElementById('cardLP').classList.toggle('ring-2', type === 'lp');
  document.getElementById('cardLP').classList.toggle('ring-green-500', type === 'lp');
}

// Inicialização
window.onload = function() {
  showStep(currentStep);
};

// Expor funções globalmente
window.nextStep = nextStep;
window.previousStep = previousStep;
window.selectCampaignType = selectCampaignType;
window.selectSourceType = selectSourceType; 