class WhatsAppTriggerTester {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addLog('Sistema de teste de gatilhos inicializado', 'info');
        this.checkAuth();
    }

    setupEventListeners() {
        // Form de teste de novo indicador
        document.getElementById('indicatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.testIndicatorJoined();
        });

        // Form de teste de novo lead
        document.getElementById('leadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.testLeadIndicated();
        });

        // Form de teste de recompensa
        document.getElementById('rewardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.testRewardEarned();
        });

        // Form de teste genérico
        document.getElementById('genericForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.testGenericTrigger();
        });
    }

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            this.addLog('❌ Usuário não autenticado. Redirecionando para login...', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        this.addLog('✅ Usuário autenticado', 'success');
    }

    async testIndicatorJoined() {
        const participantId = document.getElementById('indicatorParticipantId').value;
        const clientId = document.getElementById('indicatorClientId').value;
        const campaignId = document.getElementById('indicatorCampaignId').value;

        if (!participantId || !clientId) {
            this.showResult('indicatorResult', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        const button = document.getElementById('testIndicatorBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';

        try {
            this.addLog(`🚀 Testando gatilho INDICATOR_JOINED para participante: ${participantId}`, 'info');

            const response = await fetch(`${API_BASE_URL}/api/admin/whatsapp/triggers/test/indicator-joined`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                },
                body: JSON.stringify({
                    participantId,
                    clientId,
                    campaignId: campaignId || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('indicatorResult', `
                    <h4>✅ Gatilho executado com sucesso!</h4>
                    <p><strong>Fluxos acionados:</strong> ${result.data.flowsTriggered}</p>
                    <p><strong>Mensagens adicionadas:</strong> ${result.data.messagesAdded}</p>
                    <p><strong>Mensagem:</strong> ${result.data.message}</p>
                `, 'success');

                this.addLog(`✅ Gatilho INDICATOR_JOINED executado: ${result.data.flowsTriggered} fluxos, ${result.data.messagesAdded} mensagens`, 'success');
            } else {
                this.showResult('indicatorResult', `
                    <h4>❌ Erro ao executar gatilho</h4>
                    <p><strong>Erro:</strong> ${result.message}</p>
                    ${result.error ? `<p><strong>Detalhes:</strong> ${result.error}</p>` : ''}
                `, 'error');

                this.addLog(`❌ Erro no gatilho INDICATOR_JOINED: ${result.message}`, 'error');
            }

        } catch (error) {
            this.showResult('indicatorResult', `
                <h4>❌ Erro de conexão</h4>
                <p><strong>Erro:</strong> ${error.message}</p>
            `, 'error');

            this.addLog(`❌ Erro de conexão: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Testar Gatilho';
        }
    }

    async testLeadIndicated() {
        const referralId = document.getElementById('leadReferralId').value;
        const clientId = document.getElementById('leadClientId').value;
        const campaignId = document.getElementById('leadCampaignId').value;

        if (!referralId || !clientId) {
            this.showResult('leadResult', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        const button = document.getElementById('testLeadBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';

        try {
            this.addLog(`🚀 Testando gatilho LEAD_INDICATED para indicação: ${referralId}`, 'info');

            const response = await fetch(`${API_BASE_URL}/api/admin/whatsapp/triggers/test/lead-indicated`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                },
                body: JSON.stringify({
                    referralId,
                    clientId,
                    campaignId: campaignId || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('leadResult', `
                    <h4>✅ Gatilho executado com sucesso!</h4>
                    <p><strong>Fluxos acionados:</strong> ${result.data.flowsTriggered}</p>
                    <p><strong>Mensagens adicionadas:</strong> ${result.data.messagesAdded}</p>
                    <p><strong>Mensagem:</strong> ${result.data.message}</p>
                `, 'success');

                this.addLog(`✅ Gatilho LEAD_INDICATED executado: ${result.data.flowsTriggered} fluxos, ${result.data.messagesAdded} mensagens`, 'success');
            } else {
                this.showResult('leadResult', `
                    <h4>❌ Erro ao executar gatilho</h4>
                    <p><strong>Erro:</strong> ${result.message}</p>
                    ${result.error ? `<p><strong>Detalhes:</strong> ${result.error}</p>` : ''}
                `, 'error');

                this.addLog(`❌ Erro no gatilho LEAD_INDICATED: ${result.message}`, 'error');
            }

        } catch (error) {
            this.showResult('leadResult', `
                <h4>❌ Erro de conexão</h4>
                <p><strong>Erro:</strong> ${error.message}</p>
            `, 'error');

            this.addLog(`❌ Erro de conexão: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Testar Gatilho';
        }
    }

    async testRewardEarned() {
        const participantId = document.getElementById('rewardParticipantId').value;
        const clientId = document.getElementById('rewardClientId').value;
        const rewardAmount = parseFloat(document.getElementById('rewardAmount').value);
        const rewardType = document.getElementById('rewardType').value;
        const totalEarnings = parseFloat(document.getElementById('totalEarnings').value);

        if (!participantId || !clientId || isNaN(rewardAmount) || !rewardType || isNaN(totalEarnings)) {
            this.showResult('rewardResult', 'Por favor, preencha todos os campos obrigatórios corretamente', 'error');
            return;
        }

        const button = document.getElementById('testRewardBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';

        try {
            this.addLog(`🚀 Testando gatilho REWARD_EARNED para participante: ${participantId}`, 'info');

            const response = await fetch(`${API_BASE_URL}/api/admin/whatsapp/triggers/test/reward-earned`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                },
                body: JSON.stringify({
                    participantId,
                    clientId,
                    rewardAmount,
                    rewardType,
                    totalEarnings,
                }),
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('rewardResult', `
                    <h4>✅ Gatilho executado com sucesso!</h4>
                    <p><strong>Fluxos acionados:</strong> ${result.data.flowsTriggered}</p>
                    <p><strong>Mensagens adicionadas:</strong> ${result.data.messagesAdded}</p>
                    <p><strong>Mensagem:</strong> ${result.data.message}</p>
                `, 'success');

                this.addLog(`✅ Gatilho REWARD_EARNED executado: ${result.data.flowsTriggered} fluxos, ${result.data.messagesAdded} mensagens`, 'success');
            } else {
                this.showResult('rewardResult', `
                    <h4>❌ Erro ao executar gatilho</h4>
                    <p><strong>Erro:</strong> ${result.message}</p>
                    ${result.error ? `<p><strong>Detalhes:</strong> ${result.error}</p>` : ''}
                `, 'error');

                this.addLog(`❌ Erro no gatilho REWARD_EARNED: ${result.message}`, 'error');
            }

        } catch (error) {
            this.showResult('rewardResult', `
                <h4>❌ Erro de conexão</h4>
                <p><strong>Erro:</strong> ${error.message}</p>
            `, 'error');

            this.addLog(`❌ Erro de conexão: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Testar Gatilho';
        }
    }

    async testGenericTrigger() {
        const triggerType = document.getElementById('genericTriggerType').value;
        const participantId = document.getElementById('genericParticipantId').value;
        const referralId = document.getElementById('genericReferralId').value;
        const clientId = document.getElementById('genericClientId').value;
        const campaignId = document.getElementById('genericCampaignId').value;
        const eventDataText = document.getElementById('genericEventData').value;

        if (!triggerType || !clientId) {
            this.showResult('genericResult', 'Por favor, selecione o tipo de gatilho e informe o ID do cliente', 'error');
            return;
        }

        let eventData = {};
        if (eventDataText.trim()) {
            try {
                eventData = JSON.parse(eventDataText);
            } catch (error) {
                this.showResult('genericResult', 'Dados do evento devem ser um JSON válido', 'error');
                return;
            }
        }

        const button = document.getElementById('testGenericBtn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';

        try {
            this.addLog(`🚀 Testando gatilho genérico: ${triggerType}`, 'info');

            const response = await fetch(`${API_BASE_URL}/api/admin/whatsapp/triggers/test/generic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                },
                body: JSON.stringify({
                    triggerType,
                    participantId: participantId || undefined,
                    referralId: referralId || undefined,
                    clientId,
                    campaignId: campaignId || undefined,
                    eventData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('genericResult', `
                    <h4>✅ Gatilho executado com sucesso!</h4>
                    <p><strong>Tipo:</strong> ${triggerType}</p>
                    <p><strong>Fluxos acionados:</strong> ${result.data.flowsTriggered}</p>
                    <p><strong>Mensagens adicionadas:</strong> ${result.data.messagesAdded}</p>
                    <p><strong>Mensagem:</strong> ${result.data.message}</p>
                `, 'success');

                this.addLog(`✅ Gatilho genérico ${triggerType} executado: ${result.data.flowsTriggered} fluxos, ${result.data.messagesAdded} mensagens`, 'success');
            } else {
                this.showResult('genericResult', `
                    <h4>❌ Erro ao executar gatilho</h4>
                    <p><strong>Erro:</strong> ${result.message}</p>
                    ${result.error ? `<p><strong>Detalhes:</strong> ${result.error}</p>` : ''}
                `, 'error');

                this.addLog(`❌ Erro no gatilho genérico ${triggerType}: ${result.message}`, 'error');
            }

        } catch (error) {
            this.showResult('genericResult', `
                <h4>❌ Erro de conexão</h4>
                <p><strong>Erro:</strong> ${error.message}</p>
            `, 'error');

            this.addLog(`❌ Erro de conexão: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Testar Gatilho';
        }
    }

    showResult(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.innerHTML = message;
        
        // Aplicar classes Tailwind baseadas no tipo
        let classes = 'mt-6 p-4 rounded-lg border';
        if (type === 'success') {
            classes += ' bg-green-900/20 border-green-500/30 text-green-400';
        } else if (type === 'error') {
            classes += ' bg-red-900/20 border-red-500/30 text-red-400';
        } else {
            classes += ' bg-blue-900/20 border-blue-500/30 text-blue-400';
        }
        
        element.className = classes;
        element.style.display = 'block';

        // Auto-hide after 10 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 10000);
    }

    addLog(message, type = 'info') {
        const logsContainer = document.getElementById('testLogs');
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        
        const logEntry = document.createElement('div');
        
        // Aplicar classes Tailwind baseadas no tipo
        let classes = 'py-2 border-b border-gray-700 last:border-b-0 font-mono text-sm';
        if (type === 'success') {
            classes += ' text-green-400';
        } else if (type === 'error') {
            classes += ' text-red-400';
        } else {
            classes += ' text-gray-300';
        }
        
        logEntry.className = classes;
        logEntry.innerHTML = `
            <span class="text-gray-500 mr-3">[${timestamp}]</span>
            <span>${message}</span>
        `;
        
        logsContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Keep only last 50 logs
        const logs = logsContainer.querySelectorAll('div');
        if (logs.length > 50) {
            logs[0].remove();
        }
    }

    clearLogs() {
        document.getElementById('testLogs').innerHTML = '';
        this.addLog('Logs limpos', 'info');
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new WhatsAppTriggerTester();
});

// Função global para limpar logs
function clearLogs() {
    if (window.triggerTester) {
        window.triggerTester.clearLogs();
    }
}
