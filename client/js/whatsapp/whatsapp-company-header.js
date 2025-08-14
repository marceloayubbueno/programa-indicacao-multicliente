// WhatsApp Company Header Configuration
class WhatsAppCompanyHeader {
  constructor() {
    console.log('🔍 [FRONTEND] WhatsAppCompanyHeader - Construtor iniciado');
    this.clientId = null;
    this.config = null;
    this.init();
  }

  async init() {
    console.log('🔍 [FRONTEND] init() - Iniciando inicialização...');
    try {
      // Extrair token JWT e clientId
      const token = this.getJWTToken();
      console.log('🔍 [FRONTEND] Token JWT encontrado:', token ? 'SIM' : 'NÃO');
      
      if (!token) {
        console.error('❌ [FRONTEND] Token JWT não encontrado');
        return;
      }

      this.clientId = this.extractClientId(token);
      console.log('🔍 [FRONTEND] ClientId extraído:', this.clientId);
      
      if (!this.clientId) {
        console.error('❌ [FRONTEND] ClientId não encontrado no token');
        return;
      }

      // Carregar configuração existente
      console.log('🔍 [FRONTEND] Carregando configuração existente...');
      await this.loadCompanyHeader();
      
      // Configurar event listeners
      console.log('🔍 [FRONTEND] Configurando event listeners...');
      this.setupEventListeners();
      
      // Atualizar preview inicial
      console.log('🔍 [FRONTEND] Atualizando preview inicial...');
      this.updateMessagePreview();
      
      console.log('✅ [FRONTEND] WhatsApp Company Header inicializado com sucesso');
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao inicializar:', error);
    }
  }

  getJWTToken() {
    const token = localStorage.getItem('clientToken');
    console.log('🔍 [FRONTEND] getJWTToken() - Token encontrado:', token ? 'SIM' : 'NÃO');
    return token;
  }

  extractClientId(token) {
    try {
      console.log('🔍 [FRONTEND] extractClientId() - Iniciando extração...');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const clientId = payload.clientId || payload.sub;
      console.log('🔍 [FRONTEND] Payload do token:', payload);
      console.log('🔍 [FRONTEND] ClientId extraído:', clientId);
      return clientId;
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao extrair clientId:', error);
      return null;
    }
  }

  async loadCompanyHeader() {
    console.log('🔍 [FRONTEND] loadCompanyHeader() - Iniciando carregamento...');
    try {
      // Tentar carregar do servidor primeiro
      const apiUrl = window.APP_CONFIG?.API_URL || '/api';
      const url = `${apiUrl}/whatsapp/company-header`;
      console.log('🔍 [FRONTEND] Fazendo requisição para:', url);
      console.log('🔍 [FRONTEND] API_URL configurada:', apiUrl);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.getJWTToken()}` }
      });
      
      console.log('🔍 [FRONTEND] Response status:', response.status);
      console.log('🔍 [FRONTEND] Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 [FRONTEND] Dados recebidos do servidor:', result);
        
        if (result.data) {
          this.config = result.data;
          this.populateForm();
          console.log('✅ [FRONTEND] Configuração carregada do servidor:', result.data);
          return;
        }
      }
      
      // Se não conseguir do servidor, verificar localStorage
      console.log('⚠️ [FRONTEND] Não foi possível carregar do servidor, verificando localStorage...');
      const savedData = localStorage.getItem('whatsapp-company-header');
      
      if (savedData) {
        try {
          this.config = JSON.parse(savedData);
          this.populateForm();
          console.log('✅ [FRONTEND] Configuração carregada do localStorage:', this.config);
          return;
        } catch (parseError) {
          console.error('❌ [FRONTEND] Erro ao parsear dados do localStorage:', parseError);
        }
      }
      
      // Se não houver dados salvos, usar dados padrão vazios
      console.log('⚠️ [FRONTEND] Nenhum dado encontrado, usando dados padrão vazios...');
      const defaultData = {
        companyInfo: {
          name: '',
          description: '',
          website: '',
          phone: '',
          email: ''
        },
        socialMedia: {
          instagram: '',
          facebook: '',
          linkedin: '',
          whatsapp: ''
        },
        headerConfig: {
          enabled: false,
          separator: '---',
          customText: ''
        },
        activeFields: {
          description: false,
          website: false,
          phone: false,
          email: false,
          instagram: false,
          facebook: false,
          linkedin: false,
          whatsapp: false
        }
      };

      this.config = defaultData;
      this.populateForm();
      console.log('✅ [FRONTEND] Formulário preenchido com dados padrão vazios');
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao carregar configuração:', error);
      
      // Em caso de erro, usar dados padrão vazios
      const defaultData = {
        companyInfo: { name: '', description: '', website: '', phone: '', email: '' },
        socialMedia: { instagram: '', facebook: '', linkedin: '', whatsapp: '' },
        headerConfig: { enabled: false, separator: '---', customText: '' },
        activeFields: { description: false, website: false, phone: false, email: false, instagram: false, facebook: false, linkedin: false, whatsapp: false }
      };
      
      this.config = defaultData;
      this.populateForm();
      console.log('✅ [FRONTEND] Formulário preenchido com dados padrão após erro');
    }
  }

  populateForm() {
    console.log('🔍 [FRONTEND] populateForm() - Preenchendo formulário com dados...');
    console.log('🔍 [FRONTEND] Dados para preencher:', JSON.stringify(this.config, null, 2));
    
    if (!this.config) {
      console.log('⚠️ [FRONTEND] Nenhuma configuração para preencher');
      return;
    }

    try {
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
      
      console.log('✅ [FRONTEND] Formulário preenchido com sucesso');
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao preencher formulário:', error);
    }
  }

  setupEventListeners() {
    console.log('🔍 [FRONTEND] setupEventListeners() - Configurando event listeners...');
    
    try {
      // Event listeners para checkboxes
      const checkboxes = [
        'includeDescription', 'includeWebsite', 'includePhone', 'includeEmail',
        'includeInstagram', 'includeFacebook', 'includeLinkedin', 'includeWhatsapp'
      ];

      checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.addEventListener('change', () => this.updateMessagePreview());
          console.log(`🔍 [FRONTEND] Event listener adicionado para checkbox: ${id}`);
        } else {
          console.warn(`⚠️ [FRONTEND] Checkbox não encontrado: ${id}`);
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
          console.log(`🔍 [FRONTEND] Event listener adicionado para campo: ${id}`);
        } else {
          console.warn(`⚠️ [FRONTEND] Campo não encontrado: ${id}`);
        }
      });

      // Event listener para checkbox de ativação
      const headerEnabled = document.getElementById('headerEnabled');
      if (headerEnabled) {
        headerEnabled.addEventListener('change', () => this.updateMessagePreview());
        console.log('🔍 [FRONTEND] Event listener adicionado para headerEnabled');
      } else {
        console.warn('⚠️ [FRONTEND] Campo headerEnabled não encontrado');
      }
      
      console.log('✅ [FRONTEND] Event listeners configurados com sucesso');
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao configurar event listeners:', error);
    }
  }

  updateMessagePreview() {
    console.log('🔍 [FRONTEND] updateMessagePreview() - Atualizando preview...');
    
    try {
      const previewDiv = document.getElementById('messagePreview');
      if (!previewDiv) {
        console.warn('⚠️ [FRONTEND] Elemento messagePreview não encontrado');
        return;
      }

      const headerContent = this.generateHeaderContent();
      console.log('🔍 [FRONTEND] Conteúdo do cabeçalho gerado:', headerContent);
      
      if (headerContent) {
        previewDiv.innerHTML = `
          <div class="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <div class="text-green-400 font-semibold mb-2">📱 Cabeçalho da Mensagem:</div>
            <div class="text-gray-300 whitespace-pre-line">${headerContent}</div>
          </div>
        `;
        console.log('✅ [FRONTEND] Preview atualizado com conteúdo');
      } else {
        previewDiv.innerHTML = `
          <div class="bg-gray-800 p-4 rounded-lg border border-gray-600 text-gray-500">
            Configure os dados da empresa e marque os campos para incluir no cabeçalho...
          </div>
        `;
        console.log('🔍 [FRONTEND] Preview atualizado com mensagem padrão');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao atualizar preview:', error);
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
    console.log('🔍 [FRONTEND] saveCompanyHeader() - Iniciando...');
    
    try {
      const formData = this.collectFormData();
      const token = this.getJWTToken();
      
      console.log('🔍 [FRONTEND] Token JWT:', token ? 'EXISTE' : 'NÃO EXISTE');
      console.log('🔍 [FRONTEND] Dados do formulário:', JSON.stringify(formData, null, 2));
      
      // Salvar no backend via API
      const apiUrl = window.APP_CONFIG?.API_URL || '/api';
      const url = `${apiUrl}/whatsapp/company-header`;
      console.log('🔍 [FRONTEND] Fazendo requisição PUT para:', url);
      console.log('🔍 [FRONTEND] API_URL configurada:', apiUrl);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('🔍 [FRONTEND] Response status:', response.status);
      console.log('🔍 [FRONTEND] Response ok:', response.ok);
      console.log('🔍 [FRONTEND] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ [FRONTEND] Response success:', result);
      
      // Salvar também no localStorage como backup
      localStorage.setItem('whatsapp-company-header', JSON.stringify(formData));
      console.log('🔍 [FRONTEND] Dados salvos no localStorage como backup');
      
      this.showSuccess('Configuração salva com sucesso no servidor!');
      console.log('✅ [FRONTEND] Configuração salva no servidor:', result);
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao salvar no servidor:', error);
      
      // Fallback: salvar apenas no localStorage
      try {
        const formData = this.collectFormData();
        localStorage.setItem('whatsapp-company-header', JSON.stringify(formData));
        console.log('🔍 [FRONTEND] Fallback: dados salvos no localStorage');
        this.showError('Erro ao salvar no servidor, mas dados salvos localmente');
      } catch (fallbackError) {
        console.error('❌ [FRONTEND] Erro no fallback também:', fallbackError);
        this.showError('Erro ao salvar dados');
      }
    }
  }

  collectFormData() {
    console.log('🔍 [FRONTEND] collectFormData() - Coletando dados do formulário...');
    
    const formData = {
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
    
    console.log('🔍 [FRONTEND] Dados coletados:', JSON.stringify(formData, null, 2));
    return formData;
  }

  resetCompanyHeader() {
    console.log('🔍 [FRONTEND] resetCompanyHeader() - Iniciando reset...');
    
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      console.log('🔍 [FRONTEND] Usuário confirmou reset');
      
      // Limpar formulário
      const form = document.querySelector('form');
      if (form) {
        form.reset();
        console.log('🔍 [FRONTEND] Formulário resetado');
      }
      
      // Limpar localStorage
      localStorage.removeItem('whatsapp-company-header');
      console.log('🔍 [FRONTEND] localStorage limpo');
      
      // Recarregar configuração padrão
      this.loadCompanyHeader();
      
      // Atualizar preview
      this.updateMessagePreview();
      
      this.showSuccess('Configuração resetada com sucesso!');
      console.log('✅ [FRONTEND] Reset concluído com sucesso');
    } else {
      console.log('🔍 [FRONTEND] Usuário cancelou reset');
    }
  }

  previewHeader() {
    console.log('🔍 [FRONTEND] previewHeader() - Atualizando preview...');
    this.updateMessagePreview();
  }

  showSuccess(message) {
    console.log('✅ [FRONTEND] SUCCESS:', message);
    alert(message); // TODO: Substituir por notificação mais elegante
  }

  showError(message) {
    console.error('❌ [FRONTEND] ERROR:', message);
    alert(message); // TODO: Substituir por notificação mais elegante
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 [FRONTEND] DOM carregado, inicializando WhatsAppCompanyHeader...');
  window.whatsappCompanyHeader = new WhatsAppCompanyHeader();
});

// Funções globais para os botões HTML
window.saveCompanyHeader = function() {
  console.log('🔍 [FRONTEND] Função global saveCompanyHeader() chamada');
  if (window.whatsappCompanyHeader) {
    console.log('🔍 [FRONTEND] Instância encontrada, executando saveCompanyHeader...');
    window.whatsappCompanyHeader.saveCompanyHeader();
  } else {
    console.error('❌ [FRONTEND] Instância WhatsAppCompanyHeader não encontrada!');
  }
};

window.resetCompanyHeader = function() {
  console.log('🔍 [FRONTEND] Função global resetCompanyHeader() chamada');
  if (window.whatsappCompanyHeader) {
    console.log('🔍 [FRONTEND] Instância encontrada, executando resetCompanyHeader...');
    window.whatsappCompanyHeader.resetCompanyHeader();
  } else {
    console.error('❌ [FRONTEND] Instância WhatsAppCompanyHeader não encontrada!');
  }
};

window.previewHeader = function() {
  console.log('🔍 [FRONTEND] Função global previewHeader() chamada');
  if (window.whatsappCompanyHeader) {
    console.log('🔍 [FRONTEND] Instância encontrada, executando previewHeader...');
    window.whatsappCompanyHeader.previewHeader();
  } else {
    console.error('❌ [FRONTEND] Instância WhatsAppCompanyHeader não encontrada!');
  }
};
