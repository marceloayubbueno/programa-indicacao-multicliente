class Router {
    static async init() {
        // Lista de rotas protegidas
        const protectedRoutes = [
            'dashboard.html',
            'participants.html',
            'rewards.html',
            'campaigns.html',
            'referrals.html',
            'participant-lists.html',
            'campaign-form.html'
        ];

        // Lista de rotas administrativas
        const adminRoutes = [
            'admin/dashboard.html',
            'admin/campaigns.html',
            'admin/users.html',
            'admin/reports.html'
        ];

        // Obtém o nome do arquivo atual
        const currentPage = window.location.pathname.split('/').pop();

        // Verifica se a rota atual é protegida
        if (protectedRoutes.includes(currentPage)) {
            const isAuthenticated = await AuthService.validateToken();
            if (!isAuthenticated) {
                window.location.href = 'login.html';
                return;
            }
        }

        // Verifica se a rota atual é administrativa
        if (adminRoutes.some(route => window.location.pathname.includes(route))) {
            const user = AuthService.getUser();
            if (!user || user.role !== 'admin') {
                window.location.href = '../login.html';
                return;
            }
        }

        // Verifica se o usuário está tentando acessar páginas de login/registro estando autenticado
        if (['login.html', 'register.html', 'forgot-password.html'].includes(currentPage)) {
            const isAuthenticated = await AuthService.validateToken();
            if (isAuthenticated) {
                window.location.href = 'dashboard.html';
                return;
            }
        }
    }

    static async navigateTo(url) {
        // Verifica se a rota é protegida
        const protectedRoutes = [
            'dashboard.html',
            'participants.html',
            'rewards.html',
            'campaigns.html',
            'referrals.html',
            'participant-lists.html',
            'campaign-form.html'
        ];

        const adminRoutes = [
            'admin/dashboard.html',
            'admin/campaigns.html',
            'admin/users.html',
            'admin/reports.html'
        ];

        const targetPage = url.split('/').pop();

        if (protectedRoutes.includes(targetPage)) {
            const isAuthenticated = await AuthService.validateToken();
            if (!isAuthenticated) {
                window.location.href = 'login.html';
                return;
            }
        }

        if (adminRoutes.some(route => url.includes(route))) {
            const user = AuthService.getUser();
            if (!user || user.role !== 'admin') {
                window.location.href = '../login.html';
                return;
            }
        }

        window.location.href = url;
    }
} 