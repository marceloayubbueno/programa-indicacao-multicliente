function showError(element, message) {
    const formGroup = element.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(errorElement);
    }
    
    element.classList.add('error');
}

function clearError(element) {
    const formGroup = element.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    element.classList.remove('error');
}

function showSuccess(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    const form = document.getElementById('forgotPasswordForm');
    form.insertBefore(successElement, form.firstChild);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    
    try {
        await AuthService.forgotPassword(email);
        showSuccess('Instruções de recuperação enviadas para seu e-mail!');
        document.getElementById('email').value = '';
    } catch (error) {
        showError(document.getElementById('email'), error.message);
    }
    
    return false;
}

// Limpa o erro quando o usuário começa a digitar
document.getElementById('email').addEventListener('input', function(e) {
    clearError(e.target);
}); 