async function handleChangePassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem.');
        return false;
    }

    const token = localStorage.getItem('clientToken');
    const clientData = JSON.parse(localStorage.getItem('clientData'));
    if (!token || !clientData) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login.html';
        return false;
    }

    try {
        const response = await fetch(`http://localhost:5501/api/clients/${clientData.id}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                senhaAtual: '', // No primeiro acesso, não precisa da senha atual
                novaSenha: newPassword
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao trocar a senha');
        }
        alert('Senha alterada com sucesso!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(error.message || 'Erro ao trocar a senha.');
    }
    return false;
} 