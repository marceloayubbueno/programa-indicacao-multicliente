/**
 * Componente de Menu Lateral Compartilhado
 * Implementa a nova estrutura de navegação com submenus
 */
class MenuComponent {
  constructor(activePage = '') {
    this.activePage = activePage;
    this.menuStructure = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'chart-line',
        url: 'dashboard.html'
      },
      {
        id: 'participants',
        title: 'Central de Participantes',
        icon: 'users',
        url: 'participants.html'
      },
      {
        id: 'lp-indicadores',
        title: 'LP de Indicadores',
        icon: 'clipboard-list',
        url: 'lp-indicadores.html'
      },
      {
        id: 'rewards',
        title: 'Recompensas',
        icon: 'gift',
        url: 'rewards.html'
      },
      {
        id: 'lp-divulgacao',
        title: 'LP de Divulgação',
        icon: 'bullhorn',
        url: 'lp-divulgacao.html'
      },
      {
        id: 'campaigns',
        title: 'Campanhas',
        icon: 'rocket',
        url: 'campaigns.html'
      },
      {
        id: 'engajamento-email',
        title: 'Engajamento E-mail',
        icon: 'envelope',
        hasSubmenu: true,
        submenu: [
          {
            id: 'email-marketing',
            title: 'E-mail Marketing',
            icon: 'paper-plane',
            url: 'email-templates.html'
          },
          {
            id: 'email-flows',
            title: 'Fluxos de E-mail',
            icon: 'project-diagram',
            url: 'engajamento-email-flows.html'
          }
        ]
      },
      {
        id: 'engajamento-whatsapp',
        title: 'Engajamentos WhatsApp',
        icon: 'whatsapp',
        url: 'engajamento-whatsapp.html'
      },
      {
        id: 'leads',
        title: 'Gestão de Leads',
        icon: 'user-plus',
        url: 'referrals.html'
      },
      {
        id: 'financeiro',
        title: 'Financeiro',
        icon: 'wallet',
        hasSubmenu: true,
        submenu: [
          {
            id: 'carteira',
            title: 'Carteira',
            icon: 'piggy-bank',
            url: 'carteira.html'
          },
          {
            id: 'payments',
            title: 'Pagamentos',
            icon: 'money-bill-wave',
            url: 'payments.html'
          }
        ]
      },
      {
        id: 'configuracoes',
        title: 'Configurações',
        icon: 'cog',
        hasSubmenu: true,
        submenu: [
          {
            id: 'my-data',
            title: 'Meus Dados',
            icon: 'user',
            url: 'my-data.html'
          },
          {
            id: 'email-config',
            title: 'Configuração de E-mail',
            icon: 'envelope-open',
            url: 'email-config.html'
          },
          {
            id: 'whatsapp-config',
            title: 'Configuração de WhatsApp',
            icon: 'whatsapp',
            url: 'configuracao-whatsapp.html'
          },
          {
            id: 'integrations',
            title: 'Configuração Integrações',
            icon: 'plug',
            url: 'configuracao-integracoes.html'
          }
        ]
      }
    ];
  }

  /**
   * Verifica se um item ou submenu está ativo
   */
  isActive(itemId, submenuId = null) {
    if (submenuId) {
      return this.activePage === submenuId;
    }
    return this.activePage === itemId;
  }

  /**
   * Verifica se um submenu deve estar expandido
   */
  isSubmenuExpanded(itemId) {
    const item = this.menuStructure.find(i => i.id === itemId);
    if (!item || !item.hasSubmenu) return false;
    
    // Expande se algum submenu está ativo
    return item.submenu.some(sub => this.isActive(sub.id));
  }

  /**
   * Renderiza um item do menu
   */
  renderMenuItem(item, level = 0) {
    const isActive = this.isActive(item.id);
    const paddingClass = level === 0 ? 'pl-4' : 'pl-10';
    const activeClass = isActive ? 'bg-gray-800 text-blue-400 font-semibold' : 'hover:bg-gray-700';

    if (item.hasSubmenu) {
      const isExpanded = this.isSubmenuExpanded(item.id);
      const arrowRotation = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      
      return `
        <li>
          <div class="flex items-center ${paddingClass} px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer group" onclick="toggleSubmenu('${item.id}')">
            <i class="fas fa-${item.icon} mr-2"></i> ${item.title}
            <span class="ml-2"></span><i class="fas fa-chevron-right transition-transform duration-200" id="${item.id}Arrow" style="transform: ${arrowRotation};"></i>
          </div>
          <ul id="${item.id}Menu" class="ml-8 mt-1 space-y-1 ${isExpanded ? '' : 'hidden'}">
            ${item.submenu.map(sub => this.renderMenuItem(sub, 1)).join('')}
          </ul>
        </li>
      `;
    }

    return `
      <li>
        <a href="${item.url}" class="flex items-center ${paddingClass} px-3 py-2 rounded-lg ${activeClass}">
          <i class="fas fa-${item.icon} mr-2"></i> ${item.title}
        </a>
      </li>
    `;
  }

  /**
   * Renderiza o menu completo
   */
  render() {
    const menuItems = this.menuStructure.map(item => this.renderMenuItem(item)).join('');
    
    return `
      <nav class="w-64 bg-gray-800 flex-shrink-0 flex flex-col py-6 px-4 min-h-screen text-gray-100">
        <div class="flex items-center mb-8">
          <span class="text-2xl font-bold text-blue-400">Programa de Indicação</span>
        </div>
        <ul class="space-y-2 flex-1">
          ${menuItems}
          <li>
            <a href="#" onclick="logout()" class="flex items-center pl-4 px-3 py-2 rounded-lg hover:bg-gray-700">
              <i class="fas fa-sign-out-alt mr-2"></i> Sair
            </a>
          </li>
        </ul>
      </nav>
    `;
  }

  /**
   * Inicializa o componente e vincula eventos
   */
  init(containerId = 'sidebar-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = this.render();
      this.bindEvents();
    } else {
      console.error(`Container com ID '${containerId}' não encontrado`);
    }
  }

  /**
   * Vincula eventos de interação
   */
  bindEvents() {
    // Os eventos são vinculados via onclick nos elementos
    // As funções globais são definidas abaixo
  }
}

/**
 * Funções globais para compatibilidade
 */
function toggleSubmenu(menuId) {
  const menu = document.getElementById(menuId + 'Menu');
  const arrow = document.getElementById(menuId + 'Arrow');
  
  if (menu && arrow) {
    menu.classList.toggle('hidden');
    const isOpen = !menu.classList.contains('hidden');
    arrow.style.transform = `rotate(${isOpen ? 90 : 0}deg)`;
  }
}

function logout() {
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    window.location.href = 'login.html';
  }
}

// Manter compatibilidade com funções antigas
function toggleEngagementMenu() {
  toggleSubmenu('engajamento-email');
}

function toggleFinanceMenu() {
  toggleSubmenu('financeiro');
}

function toggleConfiguracoesMenu() {
  toggleSubmenu('configuracoes');
}

/**
 * Função utilitária para inicializar o menu em qualquer página
 */
function initSharedMenu(activePage) {
  const menu = new MenuComponent(activePage);
  menu.init();
} 