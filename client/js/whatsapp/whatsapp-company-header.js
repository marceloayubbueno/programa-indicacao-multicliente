// WhatsApp Company Header Configuration
class WhatsAppCompanyHeader {
  constructor() {
    this.clientId = null;
    this.config = null;
    this.init();
  }

  async init() {
    try {
      // Extrair token JWT e clientId
      const token = this.getJWTToken();
      if (!token) {
        console.error('Token JWT não encontrado');
        return;
      }

      this.clientId = this.extractClientId(token);
      if (!this.clientId) {
        console.error('ClientId não encontrado no token');
        return;
      }

      // Carregar configuração existente
      await this.loadCompanyHeader();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Atualizar preview inicial
      this.updateMessagePreview();
      
      console.log('WhatsApp Company Header inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  }

  getJWTToken() {
    return localStorage.getItem('clientToken');
  }

  extractClientId(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.clientId || payload.sub;
    } catch (error) {
      console.error('Erro ao extrair clientId:', error);
      return null;
    }
  }

  async loadCompanyHeader() {
    try {
      // Tentar carregar do servidor primeiro
      const response = await fetch('/api/whatsapp/company-header', {
        headers: { 'Authorization': `Bearer ${this.getJWTToken()}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          this.config = result.data;
          this.populateForm();
          console.log('Configuração carregada do servidor:', result.data);
          return;
        }
      }
      
      // Se não conseguir do servidor, usar dados mock como fallback
      const mockData = {
        companyInfo: {
          name: 'Viral lead',
          description: 'Plataforma de indicação',
          website: 'https://virallead.com.br/',
          phone: '28999468999',
          email: 'marcelo_ayub@hotmail.com'
        },
        socialMedia: {
          instagram: '@empresa',
          facebook: 'facebook.com/empresa',
          linkedin: 'linkedin.com/company/empresa',
          whatsapp: '(11) 99999-9999'
        },
        headerConfig: {
          enabled: false,
          separator: '---',
          customText: 'Texto adicional opcional'
        },
        activeFields: {
          description: true,
          website: true,
          phone: true,
          email: true,
          instagram: false,
          facebook: false,
          linkedin: false,
          whatsapp: false
        }
      };

      this.config = mockData;
      this.populateForm();
      console.log('Usando dados mock como fallback');
      
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  }

  populateForm() {
    if (!this.config) return;

    // Preencher dados da empresa
    document.getElementById('companyName').value = this.config.companyInfo.name || '';
    document.getElementById('companyDescription').value = this.config.companyInfo.description || '';
    document.getElementById('website').value = this.config.companyInfo.website || '';
    document.getElementById('phone').value = this.config.companyInfo.phone || '';
    document.getElementById('email').value = this.config.companyInfo.email || '';

    // Preencher redes sociais
    document.getElementById('instagram').value = this.config.socialMedia.instagram || '';
    document.getElementById('facebook').value = this.config.socialMedia.facebook || '';
    document.getElementById('linkedin').value = this.config.socialMedia.linkedin || '';
    document.getElementById('whatsapp').value = this.config.socialMedia.whatsapp || '';

    // Preencher configuração do cabeçalho
    document.getElementById('headerEnabled').checked = this.config.headerConfig.enabled;
    document.getElementById('separator').value = this.config.headerConfig.separator || '---';
    document.getElementById('customText').value = this.config.headerConfig.customText || '';

    // Preencher checkboxes de campos ativos
    document.getElementById('includeDescription').checked = this.config.activeFields.description;
    document.getElementById('includeWebsite').checked = this.config.activeFields.website;
    document.getElementById('includePhone').checked = this.config.activeFields.phone;
    document.getElementById('includeEmail').checked = this.config.activeFields.email;
    document.getElementById('includeInstagram').checked = this.config.activeFields.instagram;
    document.getElementById('includeFacebook').checked = this.config.activeFields.facebook;
    document.getElementById('includeLinkedin').checked = this.config.activeFields.linkedin;
    document.getElementById('includeWhatsapp').checked = this.config.activeFields.whatsapp;
  }

  setupEventListeners() {
    // Event listeners para checkboxes
    const checkboxes = [
      'includeDescription', 'includeWebsite', 'includePhone', 'includeEmail',
      'includeInstagram', 'includeFacebook', 'includeLinkedin', 'includeWhatsapp'
    ];

    checkboxes.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => this.updateMessagePreview());
      }
    });

    // Event listeners para campos de texto
    const textFields = [
      'companyName', 'companyDescription', 'website', 'phone', 'email',
      'instagram', 'facebook', 'linkedin', 'whatsapp', 'separator', 'customText'
    ];

    textFields.forEach(id => {
      const field = document.getElementById(id);
      if (field) {
        field.addEventListener('input', () => this.updateMessagePreview());
      }
    });

    // Event listener para checkbox de ativação
    const headerEnabled = document.getElementById('headerEnabled');
    if (headerEnabled) {
      headerEnabled.addEventListener('change', () => this.updateMessagePreview());
    }
  }

  updateMessagePreview() {
    const previewDiv = document.getElementById('messagePreview');
    if (!previewDiv) return;

    const headerContent = this.generateHeaderContent();
    
    if (headerContent) {
      previewDiv.innerHTML = `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <div class="text-green-400 font-semibold mb-2">📱 Cabeçalho da Mensagem:</div>
          <div class="text-gray-300 whitespace-pre-line">${headerContent}</div>
        </div>
      `;
    } else {
      previewDiv.innerHTML = `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-600 text-gray-500">
          Configure os dados da empresa e marque os campos para incluir no cabeçalho...
        </div>
      `;
    }
  }

  generateHeaderContent() {
    const headerEnabled = document.getElementById('headerEnabled');
    if (!headerEnabled || !headerEnabled.checked) return null;

    const parts = [];
    
    // Nome da empresa (sempre incluído se ativo)
    const companyName = document.getElementById('companyName').value.trim();
    if (companyName) {
      parts.push(`🏢 ${companyName}`);
    }

    // Descrição
    if (document.getElementById('includeDescription').checked) {
      const description = document.getElementById('companyDescription').value.trim();
      if (description) {
        parts.push(description);
      }
    }

    // Website
    if (document.getElementById('includeWebsite').checked) {
      const website = document.getElementById('website').value.trim();
      if (website) {
        parts.push(`🌐 ${website}`);
      }
    }

    // Telefone
    if (document.getElementById('includePhone').checked) {
      const phone = document.getElementById('phone').value.trim();
      if (phone) {
        parts.push(`📞 ${phone}`);
      }
    }

    // Email
    if (document.getElementById('includeEmail').checked) {
      const email = document.getElementById('email').value.trim();
      if (email) {
        parts.push(`✉️ ${email}`);
      }
    }

    // Redes sociais
    if (document.getElementById('includeInstagram').checked) {
      const instagram = document.getElementById('instagram').value.trim();
      if (instagram) {
        parts.push(`📷 ${instagram}`);
      }
    }

    if (document.getElementById('includeFacebook').checked) {
      const facebook = document.getElementById('facebook').value.trim();
      if (facebook) {
        parts.push(`📘 ${facebook}`);
      }
    }

    if (document.getElementById('includeLinkedin').checked) {
      const linkedin = document.getElementById('linkedin').value.trim();
      if (linkedin) {
        parts.push(`💼 ${linkedin}`);
      }
    }

    if (document.getElementById('includeWhatsapp').checked) {
      const whatsapp = document.getElementById('whatsapp').value.trim();
      if (whatsapp) {
        parts.push(`💬 ${whatsapp}`);
      }
    }

    if (parts.length === 0) return null;

    // Separador
    const separator = document.getElementById('separator').value.trim() || '---';
    
    // Texto personalizado
    const customText = document.getElementById('customText').value.trim();
    
    let result = parts.join('\n');
    
    if (customText) {
      result += `\n${separator}\n${customText}`;
    }
    
    return result;
  }

  async saveCompanyHeader() {
    try {
      const formData = this.collectFormData();
      
      // Salvar no backend via API
      const response = await fetch('/api/whatsapp/company-header', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getJWTToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Salvar também no localStorage como backup
      localStorage.setItem('whatsapp-company-header', JSON.stringify(formData));
      
      this.showSuccess('Configuração salva com sucesso no servidor!');
      console.log('Configuração salva no servidor:', result);
      
    } catch (error) {
      console.error('Erro ao salvar no servidor:', error);
      
      // Fallback: salvar apenas no localStorage
      localStorage.setItem('whatsapp-company-header', JSON.stringify(formData));
      this.showError('Erro ao salvar no servidor, mas dados salvos localmente');
    }
  }

  collectFormData() {
    return {
      companyInfo: {
        name: document.getElementById('companyName').value.trim(),
        description: document.getElementById('companyDescription').value.trim(),
        website: document.getElementById('website').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim()
      },
      socialMedia: {
        instagram: document.getElementById('instagram').value.trim(),
        facebook: document.getElementById('facebook').value.trim(),
        linkedin: document.getElementById('linkedin').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.trim()
      },
      headerConfig: {
        enabled: document.getElementById('headerEnabled').checked,
        separator: document.getElementById('separator').value.trim(),
        customText: document.getElementById('customText').value.trim()
      },
      activeFields: {
        description: document.getElementById('includeDescription').checked,
        website: document.getElementById('includeWebsite').checked,
        phone: document.getElementById('includePhone').checked,
        email: document.getElementById('includeEmail').checked,
        instagram: document.getElementById('includeInstagram').checked,
        facebook: document.getElementById('includeFacebook').checked,
        linkedin: document.getElementById('includeLinkedin').checked,
        whatsapp: document.getElementById('includeWhatsapp').checked
      }
    };
  }

  resetCompanyHeader() {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      // Limpar formulário
      const form = document.querySelector('form');
      if (form) form.reset();
      
      // Limpar localStorage
      localStorage.removeItem('whatsapp-company-header');
      
      // Recarregar configuração padrão
      this.loadCompanyHeader();
      
      // Atualizar preview
      this.updateMessagePreview();
      
      this.showSuccess('Configuração resetada com sucesso!');
    }
  }

  previewHeader() {
    this.updateMessagePreview();
  }

  showSuccess(message) {
    // Implementar notificação de sucesso
    console.log('✅', message);
    alert(message); // TODO: Substituir por notificação mais elegante
  }

  showError(message) {
    // Implementar notificação de erro
    console.error('❌', message);
    alert(message); // TODO: Substituir por notificação mais elegante
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.whatsappCompanyHeader = new WhatsAppCompanyHeader();
});

// Funções globais para os botões HTML
window.saveCompanyHeader = function() {
  if (window.whatsappCompanyHeader) {
    window.whatsappCompanyHeader.saveCompanyHeader();
  }
};

window.resetCompanyHeader = function() {
  if (window.whatsappCompanyHeader) {
    window.whatsappCompanyHeader.resetCompanyHeader();
  }
};

window.previewHeader = function() {
  if (window.whatsappCompanyHeader) {
    window.whatsappCompanyHeader.previewHeader();
  }
};
