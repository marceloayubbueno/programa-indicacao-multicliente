let allIndicators = [];

// Exibe loading enquanto carrega
function showLoading() {
    const tbody = document.querySelector('.indicators-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    showLoading();
    loadIndicators();
    document.getElementById('searchIndicator').addEventListener('input', searchIndicators);
});

async function loadIndicators() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('clientToken');
        const indicatorId = localStorage.getItem('indicatorId');
        if (!indicatorId) {
            alert('IndicatorId não encontrado. Faça login novamente.');
            renderIndicatorsTable([]);
            return;
        }
        const response = await fetch(`http://localhost:3000/api/indicadores?indicatorId=${indicatorId}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': 'Bearer ' + token })
            }
        });
        if (!response.ok) {
            let msg = 'Erro ao buscar indicadores';
            try { const errJson = await response.json(); msg = errJson.message || msg; } catch {}
            throw new Error(msg);
        }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Erro ao buscar indicadores');
        allIndicators = result.data || [];
        renderIndicatorsTable(allIndicators);
    } catch (err) {
        alert('Erro ao carregar indicadores: ' + err.message);
        renderIndicatorsTable([]); // fallback visual
    }
}

function renderIndicatorsTable(indicators) {
    const tbody = document.querySelector('.indicators-table tbody');
    if (!tbody) return;
    if (!indicators || indicators.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum indicador encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = indicators.map(ind => `
        <tr>
            <td>${ind.name || ind.nome || '-'}</td>
            <td>${ind.email || '-'}</td>
            <td>${ind.lpName || ind.campaignId || '-'}</td>
            <td><span class="status-badge ${ind.status || 'ativo'}">${(ind.status || 'Ativo').toUpperCase()}</span></td>
            <td>
                <div class="indicator-actions">
                    <button class="btn-icon" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Excluir"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Busca local em tempo real
function searchIndicators() {
    const search = document.getElementById('searchIndicator').value.trim().toLowerCase();
    if (!search) {
        renderIndicatorsTable(allIndicators);
        return;
    }
    const filtered = allIndicators.filter(ind =>
        (ind.name || '').toLowerCase().includes(search) ||
        (ind.email || '').toLowerCase().includes(search) ||
        (ind.lpName || '').toLowerCase().includes(search) ||
        (ind.campaignId || '').toLowerCase().includes(search)
    );
    renderIndicatorsTable(filtered);
} 