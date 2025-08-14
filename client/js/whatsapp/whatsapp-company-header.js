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
      
      // Atualizar preview após preencher o formulário
      setTimeout(() => {
        this.updateMessagePreview();
        console.log('✅ [FRONTEND] Preview atualizado após preenchimento do formulário');
      }, 100);
      
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
      const fullMessage = this.generateFullMessagePreview();
      console.log('🔍 [FRONTEND] Conteúdo do cabeçalho gerado:', headerContent);
      console.log('🔍 [FRONTEND] Mensagem completa gerada:', fullMessage);
      
      if (headerContent) {
        previewDiv.innerHTML = `
          <div class="space-y-4">
            <!-- Preview do Cabeçalho -->
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div class="text-green-400 font-semibold mb-2">📱 Cabeçalho da Empresa:</div>
              <div class="text-gray-300 whitespace-pre-line">${headerContent}</div>
            </div>
            
            <!-- Preview da Mensagem Completa - Smartphone Realista -->
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div class="text-blue-300 font-semibold mb-3">💬 Preview WhatsApp Realista:</div>
              
              <!-- Smartphone Realista -->
              <div class="mx-auto max-w-sm">
                <!-- Frame do Smartphone -->
                <div class="relative mx-auto">
                  <!-- Bordas do Smartphone -->
                  <div class="w-80 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
                    <!-- Tela do Smartphone -->
                    <div class="w-full h-full bg-gray-900 rounded-[2.5rem] overflow-hidden relative">
                      <!-- Notch Superior -->
                      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10"></div>
                      
                      <!-- Status Bar -->
                      <div class="absolute top-2 left-0 right-0 flex justify-between items-center px-6 text-white text-xs z-20">
                        <span>9:41</span>
                        <div class="flex items-center space-x-1">
                          <div class="w-4 h-2 border border-white rounded-sm"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <!-- Cabeçalho WhatsApp -->
                      <div class="bg-[#075E54] text-white pt-12 pb-3 px-4 relative">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                              <i class="fas fa-building text-[#075E54] text-lg"></i>
                            </div>
                            <div>
                              <div class="font-semibold text-base">${document.getElementById('companyName')?.value.trim() || 'Empresa'}</div>
                              <div class="text-sm opacity-90">online</div>
                            </div>
                          </div>
                          <div class="flex items-center space-x-4">
                            <i class="fas fa-search text-white text-lg opacity-80"></i>
                            <i class="fas fa-ellipsis-v text-white text-lg opacity-80"></i>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Corpo do Chat -->
                      <div class="bg-[#E5DDD5] h-full p-4 overflow-y-auto">
                        <!-- Background Pattern (opcional) -->
                        <div class="absolute inset-0 opacity-5">
                          <div class="w-full h-full" style="background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
                        </div>
                        
                        <!-- Mensagens -->
                        <div class="space-y-3 relative z-10">
                          <!-- Cabeçalho da Empresa -->
                          <div class="flex justify-start">
                            <div class="max-w-xs">
                              <div class="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                                ${this.formatHeaderForWhatsApp(headerContent)}
                                <div class="text-xs text-gray-500 mt-2 text-right">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Separador -->
                          <div class="flex justify-center">
                            <div class="bg-gray-300 text-gray-600 text-xs rounded-full px-4 py-1">${document.getElementById('separator')?.value.trim() || '---'}</div>
                          </div>
                          
                          <!-- Mensagem do Template -->
                          <div class="flex justify-end">
                            <div class="max-w-xs">
                              <div class="bg-[#DCF8C6] p-3 rounded-2xl shadow-sm">
                                <div class="text-sm text-gray-800 whitespace-pre-line">${this.generateTemplateExample()}</div>
                                <div class="text-xs text-gray-500 mt-2 text-right">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} ✓✓</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Barra de Navegação Inferior -->
                      <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                        <div class="flex justify-around items-center py-2">
                          <div class="flex flex-col items-center">
                            <i class="fas fa-comments text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Chats</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-phone text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Calls</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-users text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Status</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-ellipsis-h text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">More</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Botão Home (opcional) -->
                  <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        `;
        console.log('✅ [FRONTEND] Preview completo atualizado com smartphone realista');
      } else {
        previewDiv.innerHTML = `
          <div class="space-y-4">
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-600 text-gray-500">
              Configure os dados da empresa e marque os campos para incluir no cabeçalho...
            </div>
            
            <!-- Preview vazio com smartphone realista -->
            <div class="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div class="text-blue-300 font-semibold mb-3">💬 Preview WhatsApp Realista:</div>
              
              <!-- Smartphone Vazio -->
              <div class="mx-auto max-w-sm">
                <div class="relative mx-auto">
                  <div class="w-80 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
                    <div class="w-full h-full bg-gray-900 rounded-[2.5rem] overflow-hidden relative">
                      <!-- Notch Superior -->
                      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10"></div>
                      
                      <!-- Status Bar -->
                      <div class="absolute top-2 left-0 right-0 flex justify-between items-center px-6 text-white text-xs z-20">
                        <span>9:41</span>
                        <div class="flex items-center space-x-1">
                          <div class="w-4 h-2 border border-white rounded-sm"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                          <div class="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <!-- Cabeçalho WhatsApp -->
                      <div class="bg-[#075E54] text-white pt-12 pb-3 px-4 relative">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                              <i class="fas fa-building text-[#075E54] text-lg"></i>
                            </div>
                            <div>
                              <div class="font-semibold text-base">Empresa</div>
                              <div class="text-sm opacity-90">online</div>
                            </div>
                          </div>
                          <div class="flex items-center space-x-4">
                            <i class="fas fa-search text-white text-lg opacity-80"></i>
                            <i class="fas fa-ellipsis-v text-white text-lg opacity-80"></i>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Corpo do Chat Vazio -->
                      <div class="bg-[#E5DDD5] h-full flex items-center justify-center">
                        <div class="text-center text-gray-500">
                          <i class="fas fa-comment-dots text-6xl mb-4 opacity-30"></i>
                          <div class="text-sm">Configure o cabeçalho para ver a mensagem</div>
                        </div>
                      </div>
                      
                      <!-- Barra de Navegação Inferior -->
                      <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                        <div class="flex justify-around items-center py-2">
                          <div class="flex flex-col items-center">
                            <i class="fas fa-comments text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Chats</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-phone text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Calls</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-users text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">Status</span>
                          </div>
                          <div class="flex flex-col items-center">
                            <i class="fas fa-ellipsis-h text-gray-400 text-lg"></i>
                            <span class="text-xs text-gray-400 mt-1">More</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Botão Home -->
                  <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        `;
        console.log('🔍 [FRONTEND] Preview atualizado com smartphone vazio realista');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao atualizar preview:', error);
    }
  }

  // NOVO MÉTODO: Formatar cabeçalho para WhatsApp com cada linha separada
  formatHeaderForWhatsApp(headerContent) {
    if (!headerContent) return '';
    
    // Dividir o cabeçalho em linhas
    const lines = headerContent.split('\n').filter(line => line.trim());
    
    // Criar HTML com cada linha separada
    return lines.map(line => {
      // Adicionar espaçamento entre linhas
      return `<div class="mb-2">${line}</div>`;
    }).join('');
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

  // NOVO MÉTODO: Gerar preview da mensagem completa
  generateFullMessagePreview() {
    const headerContent = this.generateHeaderContent();
    
    if (!headerContent) {
      return "Configure o cabeçalho da empresa para ver a mensagem completa...";
    }

    // Template exemplo de mensagem (simula uma mensagem real)
    const templateMessage = this.generateTemplateExample();
    
    // Separador entre cabeçalho e mensagem
    const separator = document.getElementById('separator')?.value.trim() || '---';
    
    // Combinar cabeçalho + separador + mensagem do template
    const fullMessage = `${headerContent}\n\n${separator}\n\n${templateMessage}`;
    
    return fullMessage;
  }

  // NOVO MÉTODO: Gerar template exemplo para preview
  generateTemplateExample() {
    // Simula uma mensagem de template real que seria enviada
    const templates = [
      {
        title: "🎉 Bem-vindo ao Programa de Indicações!",
        content: `Olá {nome}, seja bem-vindo ao nosso programa de indicações!

🎁 **Oferta Especial**
Ganhe R$ 50 por cada indicação aprovada!

📞 **Fale Conosco**
WhatsApp: {whatsapp_empresa}
📧 Email: {email_empresa}

💡 **Como Funciona:**
1. Indique amigos e familiares
2. Eles se cadastram usando seu código
3. Você recebe R$ 50 por cada aprovação!

🚀 **Comece Agora!**
Use o código: {codigo_indicacao}`,
        variables: ["nome", "whatsapp_empresa", "email_empresa", "codigo_indicacao"]
      },
      {
        title: "🎯 Nova Indicação Recebida!",
        content: `Parabéns! Você recebeu uma nova indicação!

👤 **Indicado:** {nome_indicado}
📱 **Telefone:** {telefone_indicado}
📅 **Data:** {data_indicacao}

💰 **Ganhos Acumulados:** R$ {total_ganhos}

🎉 Continue indicando para ganhar mais!`,
        variables: ["nome_indicado", "telefone_indicado", "data_indicacao", "total_ganhos"]
      },
      {
        title: "💰 Recompensa Aprovada!",
        content: `🎊 **PARABÉNS!** 🎊

Sua indicação foi aprovada e você ganhou R$ 50!

👤 **Indicado:** {nome_indicado}
💵 **Valor:** R$ 50,00
📅 **Data:** {data_aprovacao}

🏦 **Total Acumulado:** R$ {total_acumulado}

💡 **Dica:** Continue indicando para aumentar seus ganhos!`,
        variables: ["nome_indicado", "data_aprovacao", "total_acumulado"]
      }
    ];

    // Selecionar template baseado no nome da empresa ou usar o primeiro
    const companyName = document.getElementById('companyName')?.value.trim() || '';
    let selectedTemplate = templates[0]; // Padrão

    if (companyName.toLowerCase().includes('indicação') || companyName.toLowerCase().includes('referral')) {
      selectedTemplate = templates[0]; // Template de boas-vindas
    } else if (companyName.toLowerCase().includes('venda') || companyName.toLowerCase().includes('produto')) {
      selectedTemplate = templates[1]; // Template de indicação
    }

    // Substituir variáveis por valores exemplo
    let message = selectedTemplate.content;
    
    // Substituir variáveis comuns
    const replacements = {
      '{nome}': 'João Silva',
      '{whatsapp_empresa}': document.getElementById('whatsapp')?.value.trim() || '(11) 99999-9999',
      '{email_empresa}': document.getElementById('email')?.value.trim() || 'contato@empresa.com',
      '{codigo_indicacao}': 'REF123',
      '{nome_indicado}': 'Maria Santos',
      '{telefone_indicado}': '(11) 88888-8888',
      '{data_indicacao}': '15/08/2025',
      '{total_ganhos}': '150,00',
      '{data_aprovacao}': '15/08/2025',
      '{total_acumulado}': '200,00'
    };

    Object.entries(replacements).forEach(([variable, value]) => {
      message = message.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return message;
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
    
    if (confirm('Tem certeza que deseja resetar todas as configurações? Isso limpará todos os dados salvos.')) {
      console.log('🔍 [FRONTEND] Usuário confirmou reset');
      
      // Usar o novo método para limpar tudo
      this.clearAllData();
      
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

  // Método para limpar completamente o localStorage e forçar recarregamento
  clearAllData() {
    console.log('🔍 [FRONTEND] clearAllData() - Limpando todos os dados...');
    
    // Limpar localStorage
    localStorage.removeItem('whatsapp-company-header');
    console.log('✅ [FRONTEND] localStorage limpo');
    
    // Limpar configuração atual
    this.config = null;
    
    // Limpar formulário
    this.clearForm();
    
    // Recarregar dados do servidor
    this.loadCompanyHeader();
    
    console.log('✅ [FRONTEND] Todos os dados foram limpos e recarregados');
  }

  // Método para limpar o formulário
  clearForm() {
    console.log('🔍 [FRONTEND] clearForm() - Limpando formulário...');
    
    try {
      // Limpar todos os campos de texto
      const textFields = [
        'companyName', 'companyDescription', 'website', 'phone', 'email',
        'instagram', 'facebook', 'linkedin', 'whatsapp', 'separator', 'customText'
      ];
      
      textFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
          field.value = '';
          console.log(`🔍 [FRONTEND] Campo ${id} limpo`);
        }
      });
      
      // Desmarcar todos os checkboxes
      const checkboxes = [
        'includeDescription', 'includeWebsite', 'includePhone', 'includeEmail',
        'includeInstagram', 'includeFacebook', 'includeLinkedin', 'includeWhatsapp',
        'headerEnabled'
      ];
      
      checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.checked = false;
          console.log(`🔍 [FRONTEND] Checkbox ${id} desmarcado`);
        }
      });
      
      console.log('✅ [FRONTEND] Formulário limpo com sucesso');
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao limpar formulário:', error);
    }
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

// NOVA FUNÇÃO: Limpar todos os dados e forçar recarregamento
window.clearAllData = function() {
  console.log('🔍 [FRONTEND] Função global clearAllData() chamada');
  if (window.whatsappCompanyHeader) {
    console.log('🔍 [FRONTEND] Instância encontrada, executando clearAllData...');
    window.whatsappCompanyHeader.clearAllData();
  } else {
    console.error('❌ [FRONTEND] Instância WhatsAppCompanyHeader não encontrada!');
  }
};
