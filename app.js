import EcofuturoFacade from './EcofuturoFacade.js';
import ToastObserver from './observers/ToastObserver.js';
import CoinAnimationObserver from './observers/CoinAnimationObserver.js';

const app = {
    currentPage: 'landing',
    chart: null,
    _pageCache: {},
    _observersRegistered: false,

    async init() {
        this.bindEvents();
        await this.checkAuth();
        this.startBackgroundAnimation();
    },

    showMessage(msg) {
        document.getElementById('message-text').textContent = msg;
        document.getElementById('message-box-overlay').classList.remove('hidden');
    },

    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    },

    setupDateInput() {
        const today = new Date().toISOString().split('T')[0];
        const d = document.getElementById('activity-date');
        if (d) { d.max = today; d.value = today; }
    },

    bindEvents() {
        const byId = (id) => document.getElementById(id);

        byId('show-login-btn')?.addEventListener('click', () => this.showAuthModal());
        byId('close-modal-btn')?.addEventListener('click', () => this.hideAuthModal());
        byId('toggle-auth-modal')?.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode(); });
        byId('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        byId('cadastro-form')?.addEventListener('submit', (e) => this.handleCadastro(e));
        byId('qr-code-modal-ok')?.addEventListener('click', () => byId('qr-code-modal')?.classList.add('hidden'));
        byId('hamburger-menu-btn')?.addEventListener('click', () => this.toggleSideMenu());
        byId('close-side-menu-btn')?.addEventListener('click', () => this.toggleSideMenu());
        byId('side-menu-backdrop')?.addEventListener('click', () => this.toggleSideMenu());
        byId('message-box-ok')?.addEventListener('click', () => byId('message-box-overlay')?.classList.add('hidden'));

        byId('admin-edit-user-form')?.addEventListener('submit', (e) => this.handleAdminEditUser(e));
        byId('btn-cancel-edit')?.addEventListener('click', () => byId('edit-user-modal')?.classList.add('hidden'));

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'activity-form') this.handleActivitySubmit(e);
            if (e.target.id === 'admin-add-user-form') this.handleAdminAddUser(e);
            if (e.target.id === 'admin-add-partner-form') this.handleAdminAddPartner(e);
            if (e.target.id === 'admin-add-benefit-form') this.handleAdminAddBenefit(e);
            if (e.target.id === 'admin-edit-partner-form') this.handleEditPartner(e);
            if (e.target.id === 'admin-edit-benefit-form') this.handleEditBenefit(e);
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-cancel-edit-partner')) {
                document.getElementById('edit-partner-modal')?.classList.add('hidden');
            }
            if (e.target.classList.contains('btn-cancel-edit-benefit')) {
                document.getElementById('edit-benefit-modal')?.classList.add('hidden');
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'report-period-filter') this.renderReportsPage();
        });
    },

    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const cadastroForm = document.getElementById('cadastro-form');
        const modalTitle = document.getElementById('modal-title');
        const toggleLink = document.getElementById('toggle-auth-modal');

        if (modalTitle) modalTitle.textContent = 'Entrar';
        if (toggleLink) toggleLink.textContent = 'Ainda não tem conta? Cadastre-se';
        if (loginForm) loginForm.classList.remove('hidden');
        if (cadastroForm) cadastroForm.classList.add('hidden');

        modal?.classList.remove('hidden');
    },

    hideAuthModal() {
        document.getElementById('auth-modal')?.classList.add('hidden');
    },

    toggleAuthMode() {
        const loginForm = document.getElementById('login-form');
        const cadastroForm = document.getElementById('cadastro-form');
        const modalTitle = document.getElementById('modal-title');
        const toggleLink = document.getElementById('toggle-auth-modal');
        const isLogin = !loginForm?.classList.contains('hidden');

        if (isLogin) {
            if (modalTitle) modalTitle.textContent = 'Cadastrar';
            if (toggleLink) toggleLink.textContent = 'Já tem conta? Entrar';
            loginForm?.classList.add('hidden');
            cadastroForm?.classList.remove('hidden');
        } else {
            if (modalTitle) modalTitle.textContent = 'Entrar';
            if (toggleLink) toggleLink.textContent = 'Ainda não tem conta? Cadastre-se';
            loginForm?.classList.remove('hidden');
            cadastroForm?.classList.add('hidden');
        }
    },

    toggleSideMenu() {
        const m = document.getElementById('side-menu');
        const b = document.getElementById('side-menu-backdrop');
        m?.classList.toggle('-translate-x-full');
        b?.classList.toggle('opacity-0');
        b?.classList.toggle('pointer-events-none');
    },

    async checkAuth() {
        const sessionRestored = await EcofuturoFacade.restoreSession();
        const header = document.getElementById('main-header');
        const publicHeader = document.getElementById('public-header');

        if (EcofuturoFacade.isLoggedIn()) {
            if (!this._observersRegistered) {
                EcofuturoFacade.adicionarObserver(new ToastObserver());
                EcofuturoFacade.adicionarObserver(new CoinAnimationObserver());
                this._observersRegistered = true;
            }
            const result = await EcofuturoFacade.verificarExpiracao();
            if (result?.proximos?.length > 0) {
                this.showMessage(`⚠️ Você tem ${result.proximos.length} voucher(s) prestes a expirar!`);
            }
            const expiradas = await EcofuturoFacade.verificarMoedasExpiradas();
            if (expiradas > 0) {
                await this.updateHeaderCoins();
            }
            if (publicHeader) publicHeader.style.display = 'none';
            if (header) { header.style.display = 'flex'; header.classList.remove('translate-y-[-100px]', 'opacity-0'); }
            await this.renderHeader();
            await this.showPage(EcofuturoFacade.isAdmin() ? 'reports' : 'dashboard');
        } else {
            if (publicHeader) publicHeader.style.display = 'flex';
            if (header) header.style.display = 'none';
            await this.loadPage('landing');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
        try {
        const r = await EcofuturoFacade.login(
            document.getElementById('login-email')?.value,
            document.getElementById('login-password')?.value
        );
        if (r.success) {
            this.hideAuthModal();
            await this.checkAuth();
        } else {
            this.showMessage(r.message);
        }
        } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
        finally { if (btn) { btn.disabled = false; btn.textContent = '🔑 Entrar'; } }
    },

    async handleCadastro(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
        try {
        const nome = document.getElementById('cadastro-nome')?.value.trim();
        const email = document.getElementById('cadastro-email')?.value.trim();
        const senha = document.getElementById('cadastro-password')?.value;
        const tipo = document.getElementById('cadastro-tipo')?.value;

        if (!nome || !email || !senha || !tipo) {
            this.showMessage('Por favor, preencha todos os campos.');
            return;
        }

        const r = await EcofuturoFacade.cadastrar(nome, email, senha, tipo);
        if (r.success) {
            this.hideAuthModal();
            await this.checkAuth();
        } else {
            this.showMessage(r.message);
        }
        } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
        finally { if (btn) { btn.disabled = false; btn.textContent = '📝 Cadastrar'; } }
    },

    async handleLogout() {
        this.currentPage = 'landing';
        await EcofuturoFacade.logout();
        await this.checkAuth();
    },

    async renderHeader() {
        const user = EcofuturoFacade.getCurrentUser();
        if (!user) return;

        const items = [
            { page: 'dashboard', text: '📊 Dashboard' },
            { page: 'catalog', text: '🎁 Catálogo' },
            { page: 'resgate', text: '🎫 Meus Resgates' },
            { page: 'reports', text: '📈 Relatórios' },
            { page: 'ranking', text: '🏆 Ranking' },
            { page: 'missoes', text: '🎯 Missões' },
            { page: 'notificacoes', text: '🔔 Notificações' }
        ];
        if (user.type === 'admin') {
            items.push(
                { page: 'management', text: '👥 Usuários' },
                { page: 'managementPartners', text: '🤝 Parceiros' }
            );
        }

        document.getElementById('main-nav-desktop').innerHTML =
            items.map(i => `<a href="#" class="nav-link text-gray-300 hover:text-green-400 font-medium px-3 py-2 rounded-md transition-all" data-page="${i.page}">${i.text}</a>`).join('') +
            `<button id="btn-logout" class="bg-red-500/80 backdrop-blur text-white font-medium px-4 py-2 rounded-xl ml-4">🚪 Sair</button>`;

        document.getElementById('main-nav-side').innerHTML =
            items.map(i => `<a href="#" class="nav-link-side text-gray-300 hover:bg-green-500/20 font-medium px-3 py-2 rounded-md block transition-all" data-page="${i.page}">${i.text}</a>`).join('');

        document.getElementById('btn-logout').onclick = () => this.handleLogout();
        document.getElementById('btn-logout-side').onclick = () => this.handleLogout();

        document.querySelectorAll('.nav-link, .nav-link-side').forEach(l => l.onclick = (e) => {
            e.preventDefault();
            const p = l.getAttribute('data-page');
            if (p) this.showPage(p);
            if (!document.getElementById('side-menu')?.classList.contains('-translate-x-full')) this.toggleSideMenu();
        });

        this.updateActiveLink(this.currentPage);
        await this.updateHeaderCoins();
    },

    async updateHeaderCoins() {
        const hc = document.getElementById('header-user-coins');
        const dc = document.getElementById('user-coins');
        const balance = (await EcofuturoFacade.getSaldo()).toFixed(2);
        if (hc) hc.textContent = balance;
        if (dc) dc.textContent = balance;
    },

    updateActiveLink(p) {
        document.querySelectorAll('.nav-link, .nav-link-side').forEach(l => {
            l.classList.remove('active-link');
            if (l.getAttribute('data-page') === p) l.classList.add('active-link');
        });
    },

    async showPage(page) {
        const pageMap = {
            dashboard: 'dashboard',
            catalog: 'catalog',
            resgate: 'resgate',
            reports: 'reports',
            ranking: 'ranking',
            missoes: 'missoes',
            notificacoes: 'notificacoes',
            management: 'admin-users',
            managementPartners: 'admin-partners'
        };

        const file = pageMap[page];
        if (file) await this.loadPage(file);

        this.currentPage = page;
        this.updateActiveLink(page);

        if (page === 'dashboard') await this.renderDashboardPage();
        else if (page === 'catalog') await this.renderCatalogPage();
        else if (page === 'resgate') await this.renderResgatePage();
        else if (page === 'reports') await this.renderReportsPage();
        else if (page === 'ranking') await this.renderRankingPage();
        else if (page === 'missoes') await this.renderMissoesPage();
        else if (page === 'notificacoes') await this.renderNotificacoesPage();
        else if (page === 'management') await this.renderAdminManagementPage();
        else if (page === 'managementPartners') await this.renderAdminPartnersPage();

        window.scrollTo(0, 0);
    },

    async renderDashboardPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const user = EcofuturoFacade.getCurrentUser();
        if (!user) return;

        const userNameEl = document.getElementById('user-name');
        const userCoinsEl = document.getElementById('user-coins');
        const activityFormContainer = document.getElementById('activity-form-container');

        if (userNameEl) userNameEl.textContent = user.name;
        if (userCoinsEl) userCoinsEl.textContent = user.coins.toFixed(2);
        await this.updateHeaderCoins();

        if (activityFormContainer) {
            activityFormContainer.style.display = EcofuturoFacade.isAdmin() ? 'none' : 'block';
        }

        await this.renderActivityHistory();
        this.setupDateInput();
    },

    async renderActivityHistory() {
        const acts = await EcofuturoFacade.getHistoricoAtividades(10);
        const list = document.getElementById('activity-history-list');
        const no = document.getElementById('no-recent-activities');
        if (!list) return;

        list.innerHTML = '';
        if (!acts.length) { if (no) no.classList.remove('hidden'); return; }
        if (no) no.classList.add('hidden');

        const names = { bicicleta: '🚲 Bicicleta', caminhada: '🚶 Caminhada', transportePublico: '🚌 Transporte Público', carroEletrico: '⚡ Carro Elétrico' };

        acts.forEach(a => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10';
            const emoji = a.transport === 'bicicleta' ? '🚲' : a.transport === 'caminhada' ? '🚶' : a.transport === 'transportePublico' ? '🚌' : '⚡';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span class="text-xl">${emoji}</span><span class="font-semibold text-white">${names[a.transport]}</span></div><div class="text-sm text-gray-400">📅 ${this.formatDate(a.date)}</div></div><div class="text-right"><div class="font-bold text-white">${a.distance} km</div><div class="text-green-400">💰 +${a.coins.toFixed(2)}</div></div>`;
            list.appendChild(div);
        });
    },

    async handleActivitySubmit(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
        try {
        const t = document.getElementById('transport-type')?.value;
        const d = document.getElementById('distance')?.value;
        const dur = document.getElementById('activity-duration')?.value || '1';
        const dt = document.getElementById('activity-date')?.value;

        if (!t) return this.showMessage('Selecione o transporte.');
        const distNum = parseFloat(d);
        if (isNaN(distNum) || distNum <= 0) return this.showMessage('Distância inválida.');
        if (parseInt(dur) <= 0) return this.showMessage('Duração inválida.');

        const today = new Date().toISOString().split('T')[0];
        if (dt > today) return this.showMessage('A data não pode ser futura.');

        const r = await EcofuturoFacade.registrarAtividade(t, d, dur, dt);
        if (r.success) {
            await this.updateHeaderCoins();

            const names = { bicicleta: '🚲 Bicicleta', caminhada: '🚶 Caminhada', transportePublico: '🚌 Transporte Público', carroEletrico: '⚡ Carro Elétrico' };
            const recent = document.getElementById('recent-activity');
            const recentTransport = document.getElementById('recent-transport');
            const recentDistance = document.getElementById('recent-distance');
            const recentCoins = document.getElementById('recent-coins');

            if (recentTransport) recentTransport.textContent = names[t];
            if (recentDistance) recentDistance.textContent = distNum;
            if (recentCoins) recentCoins.textContent = r.coinsGained.toFixed(2);
            if (recent) recent.classList.remove('hidden');

            this.animateCoinGain(r.coinsGained);
            await this.renderActivityHistory();
            if (this.currentPage === 'reports') await this.renderReportsPage();

            this.setupDateInput();
            document.getElementById('activity-form')?.reset();
            document.getElementById('transport-type') ? document.getElementById('transport-type').value = '' : null;
            if (document.getElementById('activity-duration')) document.getElementById('activity-duration').value = '';
        } else {
            this.showMessage(r.message);
        }
        } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
        finally { if (btn) { btn.disabled = false; btn.textContent = '🌱 Registrar'; } }
    },

    async renderCatalogPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const cat = await EcofuturoFacade.getCatalogo();
        const isAdmin = EcofuturoFacade.isAdmin();
        const userType = EcofuturoFacade.getUserType();
        const grid = document.getElementById('catalog-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const catalogMsg = document.getElementById('catalog-message');
        if (cat.length === 0) {
            grid.innerHTML = '';
            if (catalogMsg) catalogMsg.classList.remove('hidden');
            return;
        }
        if (catalogMsg) catalogMsg.classList.add('hidden');

        cat.forEach(b => {
            const stock = b.stock || 0;
            const div = document.createElement('div');
            div.className = 'bg-white/5 backdrop-blur-md rounded-xl overflow-hidden hover:shadow-xl transition-all benefit-card border border-white/10';

            let restrictionBadge = '';
            if (userType === 'comunidadeExterna') {
                restrictionBadge = '<div class="absolute top-2 right-2"><span class="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">🎓 Benefício ESUDA</span></div>';
            }

            div.innerHTML = `<div class="relative">${restrictionBadge}<div class="h-40 bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center"><span class="text-6xl">${b.imagem || '🎁'}</span></div></div><div class="p-4"><h4 class="text-lg font-bold text-white">${b.nome}</h4><p class="text-2xl font-bold text-green-400">💰 ${b.custo} moedas</p></div><div class="p-4 border-t border-white/10"><p class="text-sm font-medium ${stock > 0 ? 'text-green-400' : 'text-red-400'} mb-2">📦 ${stock > 0 ? `${stock} disponíveis` : 'Esgotado'}</p><button data-id="${b.id}" class="btn-reservar w-full ${isAdmin ? 'bg-blue-500/80 hover:bg-blue-600' : (stock > 0 ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gray-600 cursor-not-allowed')} text-white py-2 rounded-xl font-semibold transition-all" ${!isAdmin && stock <= 0 ? 'disabled' : ''}>${isAdmin ? '✏️ Editar' : '🎁 Reservar'}</button></div>`;
            grid.appendChild(div);
        });

        document.querySelectorAll('.btn-reservar').forEach(btn => btn.onclick = async () => {
            if (!EcofuturoFacade.isLoggedIn()) return this.showMessage('🔒 Faça login.');
            if (EcofuturoFacade.isAdmin()) return this.showMessage('👑 Administradores não podem reservar.');
            btn.disabled = true; btn.textContent = '⏳...';
            try {
            const r = await EcofuturoFacade.reservarBeneficio(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) {
                await this.updateHeaderCoins();
                await this.renderCatalogPage();
                if (this.currentPage === 'resgate') await this.renderResgatePage();
            }
            } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
            finally { btn.disabled = false; btn.textContent = '🎁 Reservar'; }
        });
    },

    async renderResgatePage() {
        if (!EcofuturoFacade.isLoggedIn()) return;

        const vouchers = await EcofuturoFacade.getVouchersPendentes();
        const history = await EcofuturoFacade.getVouchersHistorico();

        const pList = document.getElementById('pending-vouchers-list');
        const hList = document.getElementById('history-vouchers-list');
        const noP = document.getElementById('no-pending-vouchers');
        const noH = document.getElementById('no-history-vouchers');
        if (!pList) return;
        pList.innerHTML = '';
        hList.innerHTML = '';

        if (!vouchers.length) noP?.classList.remove('hidden'); else noP?.classList.add('hidden');
        vouchers.forEach(v => {
            const div = document.createElement('div');
            div.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span class="text-xl">🎁</span><span class="font-bold text-white">${v.benefitName}</span></div><div class="text-sm text-gray-400">📅 ${this.formatDate(v.redeemDate)}</div><div class="text-xs text-gray-500">⏰ Expira: ${this.formatDate(v.expirationDate)}</div></div><div class="flex items-center gap-2"><span class="px-3 py-1 rounded-full text-xs font-semibold ${v.status === 'reserved' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}">${v.status === 'pending' ? '✨ Pronto' : '📌 Ativo'}</span></div><div class="flex gap-2 mt-2 sm:mt-0"><button data-id="${v.id}" class="btn-usar bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-lg">🎫 Usar</button><button data-id="${v.id}" class="btn-deletar bg-red-500/80 text-white px-3 py-1 rounded-lg">🗑️</button></div>`;
            pList.appendChild(div);
        });

        if (!history.length) noH?.classList.remove('hidden'); else noH?.classList.add('hidden');
        history.forEach(v => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 opacity-75';
            const statusEmoji = v.status === 'expired' || v.status === 'expirado' ? '⏰' : '✅';
            const statusText = v.status === 'expired' || v.status === 'expirado' ? 'Expirado' : v.status === 'cancelado' ? 'Cancelado' : 'Usado';
            const statusClass = v.status === 'expired' || v.status === 'expirado' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span>${statusEmoji}</span><span class="font-bold text-white">${v.benefitName}</span></div><div class="text-sm text-gray-400">📅 ${this.formatDate(v.redeemDate)}</div></div><span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span>`;
            hList.appendChild(div);
        });

        document.querySelectorAll('.btn-usar').forEach(btn => btn.onclick = async () => {
            btn.disabled = true; btn.textContent = '⏳...';
            try {
            const r = await EcofuturoFacade.marcarVoucherComoUsado(btn.dataset.id);
            this.showMessage(r.message);
            if (r.success) {
                await this.renderResgatePage();
                const m = document.getElementById('qr-code-modal');
                const img = document.getElementById('qr-code-img');
                if (img) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Ecofuturo_${r.voucherId}`;
                m?.classList.remove('hidden');
            }
            } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
            finally { btn.disabled = false; btn.textContent = '🎫 Usar'; }
        });

        document.querySelectorAll('.btn-deletar').forEach(btn => btn.onclick = async () => {
            btn.disabled = true; btn.textContent = '⏳...';
            try {
            const r = await EcofuturoFacade.deletarVoucher(btn.dataset.id);
            this.showMessage(r.message);
            if (r.success) {
                await this.updateHeaderCoins();
                await this.renderResgatePage();
                await this.renderCatalogPage();
            }
            } catch (err) { console.error(err); this.showMessage('Erro inesperado.'); }
            finally { btn.disabled = false; btn.textContent = '🗑️'; }
        });

        const transferForm = document.getElementById('transfer-form');
        if (transferForm) {
            transferForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('transfer-email').value.trim();
                const amount = parseFloat(document.getElementById('transfer-amount').value);
                const r = await EcofuturoFacade.transferirMoedas(email, amount);
                this.showMessage(r.message);
                if (r.success) {
                    document.getElementById('transfer-email').value = '';
                    document.getElementById('transfer-amount').value = '';
                    await this.updateHeaderCoins();
                }
            };
        }

        const hist = await EcofuturoFacade.getHistoricoTransferencias();
        const histList = document.getElementById('transfer-history-list');
        if (histList) {
            histList.innerHTML = hist.length ? hist.map(m =>
                `<div class="flex justify-between border-b border-white/10 pb-1">💰 <span class="text-red-400">-${m.valor.toFixed(2)}</span> <span class="text-gray-500">${this.formatDate(m.data?.split('T')[0])}</span></div>`
            ).join('') : '<p class="text-gray-500">Nenhuma transferência encontrada.</p>';
        }
    },

    async renderReportsPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const period = document.getElementById('report-period-filter')?.value || 'total';
        const periodText = { total: 'Total Geral', today: 'Hoje', week: 'Últimos 7 dias', month: 'Últimos 30 dias', year: 'Este Ano' }[period];

        const p = await EcofuturoFacade.getEstatisticasPessoais(period);
        if (p) {
            const personalCo2 = document.getElementById('personal-co2');
            const personalActs = document.getElementById('personal-activities');
            if (personalCo2) personalCo2.textContent = p.totalCO2.toFixed(2);
            if (personalActs) personalActs.textContent = p.totalActivities;
        }

        const resgates = await EcofuturoFacade.getRelatorioResgates(period);
        const body = document.getElementById('resgate-report-body');
        if (body) {
            body.innerHTML = '';
            resgates.forEach(r => {
                const row = body.insertRow();
                const cor = { ATIVO: 'text-green-400', USADO: 'text-blue-400', EXPIRADO: 'text-red-400', CANCELADO: 'text-yellow-400', CONCLUIDO: 'text-green-400' };
                row.innerHTML = `
                    <td class="px-4 py-3 text-sm text-white">${this.escapeHtml(r.beneficio)}</td>
                    <td class="px-4 py-3 text-sm font-bold text-green-400">💰 ${r.moedas.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${this.formatDate(r.data?.split('T')[0])}</td>
                    <td class="px-4 py-3 text-sm ${cor[r.voucherStatus] || cor[r.status] || 'text-gray-400'}">${r.voucherStatus === 'ATIVO' ? '🟢 Ativo' : r.voucherStatus === 'USADO' ? '✅ Usado' : r.voucherStatus === 'EXPIRADO' ? '⏰ Expirado' : r.voucherStatus === 'CANCELADO' ? '🗑️ Cancelado' : r.status}</td>
                `;
            });
        }

        const c = await EcofuturoFacade.getEstatisticasComunidade(period);
        const totalCo2El = document.getElementById('total-co2');
        const totalActsEl = document.getElementById('total-activities');
        const totalCoinsEl = document.getElementById('total-coins-donated');
        const totalUsersEl = document.getElementById('total-users');
        const communityTitle = document.getElementById('community-reports-title');

        if (totalCo2El) totalCo2El.textContent = c.totalCO2.toFixed(2);
        if (totalActsEl) totalActsEl.textContent = c.totalActivities;
        if (totalCoinsEl) totalCoinsEl.textContent = c.totalMoedasDoadas.toFixed(2);
        if (totalUsersEl) totalUsersEl.textContent = c.totalUsuarios;
        if (communityTitle) communityTitle.textContent = `👥 Impacto da Comunidade (${periodText})`;

        this.renderChart(c.co2ByTransport);
    },

    renderChart(data) {
        const canvas = document.getElementById('co2-chart');
        if (!canvas) return;
        if (this.chart) this.chart.destroy();
        if (typeof Chart === 'undefined') return;
        try {
            this.chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Bicicleta', 'Caminhada', 'Transporte Público', 'Carro Elétrico'],
                    datasets: [{
                        label: 'CO₂ Reduzido (kg)',
                        data: [Number(data.bicicleta) || 0, Number(data.caminhada) || 0, Number(data.transportePublico) || 0, Number(data.carroEletrico) || 0],
                        backgroundColor: ['#22c55e', '#34d399', '#4ade80', '#86efac'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'kg de CO₂', color: '#fff' }, ticks: { color: '#fff' } },
                        x: { ticks: { color: '#fff' } }
                    },
                    plugins: { legend: { labels: { color: '#fff' } } }
                }
            });
        } catch (err) {
            console.error('Chart error:', err);
        }
    },

    async renderRankingPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const ranking = await EcofuturoFacade.getRanking();
        const body = document.getElementById('ranking-body');
        if (!body) return;
        body.innerHTML = '';
        if (!ranking.length) {
            body.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-8">Nenhum usuário no ranking ainda.</td></tr>';
            return;
        }
        ranking.forEach(u => {
            const row = body.insertRow();
            const medal = u.posicao === 1 ? '🥇' : u.posicao === 2 ? '🥈' : u.posicao === 3 ? '🥉' : `#${u.posicao}`;
            row.innerHTML = `
                <td class="px-4 py-3 text-sm font-bold text-white">${medal}</td>
                <td class="px-4 py-3 text-sm text-white">${this.escapeHtml(u.nome)}</td>
                <td class="px-4 py-3 text-sm text-gray-300">${EcofuturoFacade.formatarTipoUsuario(u.tipo)}</td>
                <td class="px-4 py-3 text-sm font-bold text-green-400">💰 ${u.moedas.toFixed(2)}</td>
            `;
        });
    },

    async renderMissoesPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const missoes = await EcofuturoFacade.getMissoes();
        const medalhas = await EcofuturoFacade.getMedalhas();
        const desafios = await EcofuturoFacade.getDesafios();

        const container = document.getElementById('missoes-container');
        if (!container) return;

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

        // Missões diárias
        html += '<div class="glass-card p-6"><h3 class="text-xl font-bold text-white mb-4">📅 Missões Diárias</h3><div class="space-y-4">';
        const diarias = missoes.filter(m => m.tipo === 'diaria');
        if (!diarias.length) html += '<p class="text-gray-400">Nenhuma missão diária disponível.</p>';
        diarias.forEach(m => {
            const pct = Math.min(100, (m.progresso / m.alvo) * 100);
            html += `<div class="p-4 ${m.concluida ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'} rounded-xl border">
                <div class="flex justify-between items-start mb-2"><div><div class="font-semibold text-white">${m.titulo} ${m.concluida ? '✅' : ''}</div><div class="text-xs text-gray-400">${m.descricao}</div></div>
                <div class="text-yellow-400 font-bold">💰 ${m.recompensa}</div></div>
                <div class="w-full bg-gray-700 rounded-full h-2"><div class="bg-green-400 h-2 rounded-full transition-all" style="width:${pct}%"></div></div>
                <div class="text-xs text-gray-400 mt-1">${Math.min(m.progresso, m.alvo)}/${m.alvo}</div></div>`;
        });
        html += '</div></div>';

        // Missões semanais
        html += '<div class="glass-card p-6"><h3 class="text-xl font-bold text-white mb-4">📆 Missões Semanais</h3><div class="space-y-4">';
        const semanais = missoes.filter(m => m.tipo === 'semanal');
        if (!semanais.length) html += '<p class="text-gray-400">Nenhuma missão semanal disponível.</p>';
        semanais.forEach(m => {
            const pct = Math.min(100, (m.progresso / m.alvo) * 100);
            html += `<div class="p-4 ${m.concluida ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'} rounded-xl border">
                <div class="flex justify-between items-start mb-2"><div><div class="font-semibold text-white">${m.titulo} ${m.concluida ? '✅' : ''}</div><div class="text-xs text-gray-400">${m.descricao}</div></div>
                <div class="text-yellow-400 font-bold">💰 ${m.recompensa}</div></div>
                <div class="w-full bg-gray-700 rounded-full h-2"><div class="bg-green-400 h-2 rounded-full transition-all" style="width:${pct}%"></div></div>
                <div class="text-xs text-gray-400 mt-1">${Math.min(m.progresso, m.alvo)}/${m.alvo}</div></div>`;
        });
        html += '</div></div>';

        // Medalhas
        html += '<div class="glass-card p-6 md:col-span-2"><h3 class="text-xl font-bold text-white mb-4">🏅 Medalhas</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
        medalhas.forEach(m => {
            html += `<div class="p-4 text-center rounded-xl ${m.desbloqueada ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5 border border-white/10 opacity-50'}">
                <div class="text-4xl mb-2">${m.icone}</div>
                <div class="font-semibold text-sm text-white ${m.desbloqueada ? '' : ''}">${m.nome}</div>
                <div class="text-xs text-gray-400 mt-1">${m.descricao}</div>
                ${m.desbloqueada ? '<div class="text-xs text-green-400 mt-1">✅ Desbloqueada</div>' : '<div class="text-xs text-gray-500 mt-1">🔒 Bloqueada</div>'}
            </div>`;
        });
        html += '</div></div>';

        // Desafios do mês
        html += '<div class="glass-card p-6 md:col-span-2"><h3 class="text-xl font-bold text-white mb-4">🔥 Desafios do Mês</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
        if (!desafios.length) html += '<p class="text-gray-400 col-span-2">Nenhum desafio disponível.</p>';
        desafios.forEach(d => {
            const pct = Math.min(100, (d.progresso / d.alvo) * 100);
            html += `<div class="p-4 ${d.concluido ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'} rounded-xl border">
                <div class="flex justify-between items-start mb-2"><div><div class="font-semibold text-white">${d.titulo} ${d.concluido ? '🏁' : ''}</div><div class="text-xs text-gray-400">${d.descricao}</div></div>
                <div class="text-purple-400 font-bold">💰 ${d.recompensa}</div></div>
                <div class="w-full bg-gray-700 rounded-full h-2"><div class="bg-purple-400 h-2 rounded-full transition-all" style="width:${pct}%"></div></div>
                <div class="text-xs text-gray-400 mt-1">${Math.min(d.progresso, d.alvo)}/${d.alvo}</div></div>`;
        });
        html += '</div></div></div>';

        container.innerHTML = html;
    },

    async renderNotificacoesPage() {
        if (!EcofuturoFacade.isLoggedIn()) return;
        const notificacoes = await EcofuturoFacade.getNotificacoes();
        const mensagens = await EcofuturoFacade.getMensagensRecebidas();
        const container = document.getElementById('notificacoes-container');
        if (!container) return;

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

        // Notificações
        html += '<div class="glass-card p-6"><h3 class="text-xl font-bold text-white mb-4">🔔 Notificações</h3><div class="space-y-3">';
        if (!notificacoes.length) html += '<p class="text-gray-400 text-center py-4">Nenhuma notificação.</p>';
        notificacoes.forEach(n => {
            const icone = n.tipo === 'alerta' ? '⚠️' : n.tipo === 'mensagem' ? '✉️' : 'ℹ️';
            html += `<div class="p-3 rounded-lg ${n.lida ? 'bg-white/5' : 'bg-blue-500/10 border border-blue-500/30'} flex justify-between items-start cursor-pointer" data-id="${n.id}" onclick="app.marcarNotificacaoLida(this)">
                <div><div class="text-sm ${n.lida ? 'text-gray-300' : 'text-white font-medium'}">${icone} ${this.escapeHtml(n.mensagem)}</div>
                <div class="text-xs text-gray-500 mt-1">${n.data ? this.formatDate(n.data.split('T')[0]) : ''}</div></div>
                ${n.lida ? '' : '<span class="w-2 h-2 bg-blue-400 rounded-full inline-block mt-2"></span>'}
            </div>`;
        });
        html += '</div></div>';

        // Mensagens recebidas
        html += '<div class="glass-card p-6"><h3 class="text-xl font-bold text-white mb-4">✉️ Mensagens</h3><div class="space-y-3">';
        if (!mensagens.length) html += '<p class="text-gray-400 text-center py-4">Nenhuma mensagem.</p>';
        mensagens.forEach(m => {
            html += `<div class="p-3 rounded-lg ${m.lida ? 'bg-white/5' : 'bg-purple-500/10 border border-purple-500/30'}" data-id="${m.id}">
                <div class="flex justify-between"><div class="text-sm font-medium text-white">${this.escapeHtml(m.assunto)}</div>
                <div class="text-xs text-gray-400">${m.data ? this.formatDate(m.data.split('T')[0]) : ''}</div></div>
                <div class="text-xs text-gray-400">De: ${this.escapeHtml(m.remetente)}</div>
                <div class="text-sm text-gray-300 mt-1">${this.escapeHtml(m.conteudo)}</div>
                ${m.lida ? '' : '<div class="text-xs text-purple-400 mt-1">📩 Não lida</div>'}
            </div>`;
            if (!m.lida) EcofuturoFacade.marcarMensagemLida(m.id);
        });
        html += '</div></div></div>';

        container.innerHTML = html;
    },

    async marcarNotificacaoLida(el) {
        const id = el.getAttribute('data-id');
        if (id) await EcofuturoFacade.marcarNotificacaoLida(parseInt(id));
        el.classList.remove('bg-blue-500/10', 'border-blue-500/30');
        el.classList.add('bg-white/5');
        const dot = el.querySelector('span');
        if (dot) dot.remove();
    },

    async renderAdminManagementPage() {
        if (EcofuturoFacade.isAdmin()) await this.renderUserList();
    },

    async renderUserList() {
        const users = await EcofuturoFacade.listarUsuarios();
        const body = document.getElementById('admin-user-list-body');
        if (!body) return;
        body.innerHTML = '';
        const userCount = document.getElementById('user-count');
        if (userCount) userCount.textContent = users.length;

        users.forEach(u => {
            const row = body.insertRow();
            const escapedName = this.escapeHtml(u.name);
            const escapedEmail = this.escapeHtml(u.email);
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-white">${escapedName}</td>
                <td class="px-6 py-4 text-sm text-gray-300">${escapedEmail}</td>
                <td class="px-6 py-4 text-sm text-gray-300">${EcofuturoFacade.formatarTipoUsuario(u.type)}</td>
                <td class="px-6 py-4 text-sm font-bold text-green-400">💰 ${u.coins.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm"><button data-email="${escapedEmail}" class="btn-edit-user text-blue-400 hover:text-blue-300 font-semibold mr-3">✏️ Editar</button><button data-email="${escapedEmail}" class="btn-delete-user text-red-400 hover:text-red-300 font-semibold">🗑️ Excluir</button></td>
            `;
        });

        document.querySelectorAll('.btn-edit-user').forEach(btn => btn.onclick = () => {
            const usersList = document.getElementById('admin-user-list-body');
            if (!usersList) return;
            const email = btn.dataset.email;
            const row = Array.from(usersList.rows).find(r => r.cells[1]?.textContent === email);
            if (row) {
                const rawType = ({ 'Aluno':'aluno', 'Professor':'professor', 'Funcionário ESUDA':'funcionarioEsuda', 'Comunidade Externa':'comunidadeExterna' })[row.cells[2]?.textContent?.trim()] || '';
                const coins = parseFloat(row.cells[3]?.textContent?.replace('💰', '')?.trim()) || 0;
                this.showEditUserModal({ email, name: row.cells[0]?.textContent || '', type: rawType, coins });
            }
        });

        document.querySelectorAll('.btn-delete-user').forEach(btn => btn.onclick = async () => {
            if (confirm('Excluir este usuário?')) {
                const r = await EcofuturoFacade.deletarUsuario(btn.dataset.email);
                this.showMessage(r.message);
                if (r.success) await this.renderUserList();
            }
        });
    },

    showEditUserModal(user) {
        const originalEmail = document.getElementById('edit-user-original-email');
        const nomeInput = document.getElementById('edit-user-nome');
        const emailInput = document.getElementById('edit-user-email');
        const tipoSelect = document.getElementById('edit-user-tipo');
        const coinsInput = document.getElementById('edit-user-coins');
        const modal = document.getElementById('edit-user-modal');

        if (originalEmail) originalEmail.value = user.email;
        if (nomeInput) nomeInput.value = user.name;
        if (emailInput) emailInput.value = user.email;
        if (tipoSelect) tipoSelect.value = user.type;
        if (coinsInput) coinsInput.value = user.coins ?? '';
        modal?.classList.remove('hidden');
    },

    async handleAdminEditUser(e) {
        e.preventDefault();
        const originalEmail = document.getElementById('edit-user-original-email')?.value;
        const coinsRaw = document.getElementById('edit-user-coins')?.value;
        const coins = coinsRaw !== '' ? parseFloat(coinsRaw) : undefined;
        if (coins !== undefined && (isNaN(coins) || coins < 0)) {
            return this.showMessage('Valor de moedas inválido.');
        }
        const r = await EcofuturoFacade.editarUsuario(originalEmail, {
            name: document.getElementById('edit-user-nome')?.value.trim(),
            email: document.getElementById('edit-user-email')?.value.trim(),
            type: document.getElementById('edit-user-tipo')?.value,
            coins
        });
        this.showMessage(r.message);
        if (r.success) {
            await this.renderUserList();
            document.getElementById('edit-user-modal')?.classList.add('hidden');
        }
    },

    async handleAdminAddUser(e) {
        e.preventDefault();
        const r = await EcofuturoFacade.adicionarUsuario(
            document.getElementById('admin-add-nome')?.value.trim(),
            document.getElementById('admin-add-email')?.value.trim(),
            document.getElementById('admin-add-password')?.value,
            document.getElementById('admin-add-tipo')?.value
        );
        this.showMessage(r.message);
        if (r.success) {
            await this.renderUserList();
            e.target.reset();
        }
    },

    async renderAdminPartnersPage() {
        if (EcofuturoFacade.isAdmin()) {
            await this.renderPartnersList();
            await this.renderBenefitsList();
        }
    },

    async renderPartnersList() {
        const partners = await EcofuturoFacade.listarParceiros();
        const body = document.getElementById('admin-partner-list-body');
        if (!body) return;
        body.innerHTML = '';
        const partnerCount = document.getElementById('partner-count');
        if (partnerCount) partnerCount.textContent = partners.length;

        partners.forEach(p => {
            const row = body.insertRow();
            row.innerHTML = `<td class="px-6 py-4 text-sm font-medium text-white">🏢 ${this.escapeHtml(p.nome)}</td><td class="px-6 py-4 text-sm text-gray-300">${this.escapeHtml(p.cnpj || '')}</td><td class="px-6 py-4 text-sm"><button data-id="${p.id_parceiro}" data-nome="${this.escapeHtml(p.nome)}" data-cnpj="${this.escapeHtml(p.cnpj || '')}" class="btn-edit-partner text-blue-400 hover:text-blue-300 font-semibold mr-3">✏️</button><button data-id="${p.id_parceiro}" class="btn-delete-partner text-red-400 hover:text-red-300 font-semibold">🗑️</button></td>`;
        });

        document.querySelectorAll('.btn-delete-partner').forEach(btn => btn.onclick = async () => {
            const nome = btn.closest('tr')?.cells[0]?.textContent?.trim() || 'este parceiro';
            if (!confirm(`Excluir ${nome}?`)) return;
            const r = await EcofuturoFacade.deletarParceiro(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) await this.renderPartnersList();
        });

        document.querySelectorAll('.btn-edit-partner').forEach(btn => btn.onclick = () => {
            document.getElementById('edit-partner-id').value = btn.dataset.id;
            document.getElementById('edit-partner-name').value = btn.dataset.nome;
            document.getElementById('edit-partner-cnpj').value = btn.dataset.cnpj;
            document.getElementById('edit-partner-modal').classList.remove('hidden');
        });
    },

    async handleAdminAddPartner(e) {
        e.preventDefault();
        const nome = document.getElementById('partner-name')?.value.trim();
        const cnpj = document.getElementById('partner-cnpj')?.value.trim();
        const r = await EcofuturoFacade.adicionarParceiro(nome, cnpj);
        this.showMessage(r.message);
        if (r.success) {
            await this.renderPartnersList();
            e.target.reset();
        }
    },

    async renderBenefitsList() {
        await this.populatePartnerSelect();
        const cat = await EcofuturoFacade.getCatalogo();
        const partners = await EcofuturoFacade.listarParceiros();
        const partnerMap = {};
        partners.forEach(p => { partnerMap[p.id_parceiro] = p.nome; });
        const body = document.getElementById('admin-benefit-list-body');
        if (!body) return;
        body.innerHTML = '';

        cat.forEach(b => {
            const row = body.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-400">${b.id}</td>
                <td class="px-6 py-4 text-sm font-medium text-white">${this.escapeHtml(b.nome)}</td>
                <td class="px-6 py-4 text-sm font-bold text-green-400">💰 ${b.custo}</td>
                <td class="px-6 py-4 text-sm"><input type="number" data-id="${b.id}" value="${b.stock}" class="stock-input w-24 bg-white/10 border border-white/20 rounded-lg text-center py-1 px-2 text-white"></td>
                <td class="px-6 py-4 text-sm text-gray-300">${this.escapeHtml(partnerMap[b.parceiro_id] || '🏢 Desconhecido')}</td>
                <td class="px-6 py-4 text-sm"><button data-id="${b.id}" data-nome="${this.escapeHtml(b.nome)}" data-custo="${b.custo}" data-stock="${b.stock}" class="btn-edit-benefit text-blue-400 hover:text-blue-300 font-semibold mr-2">✏️</button><button data-id="${b.id}" class="btn-delete-benefit text-red-400 hover:text-red-300 font-semibold mr-2">🗑️</button><button data-id="${b.id}" class="btn-update-stock text-green-400 hover:text-green-300 font-semibold">🔄</button></td>
            `;
        });

        document.querySelectorAll('.btn-delete-benefit').forEach(btn => btn.onclick = async () => {
            const nome = btn.closest('tr')?.cells[1]?.textContent?.trim() || 'este benefício';
            if (!confirm(`Excluir "${nome}"?`)) return;
            const r = await EcofuturoFacade.deletarBeneficio(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) {
                await this.renderBenefitsList();
                await this.renderCatalogPage();
            }
        });

        document.querySelectorAll('.btn-update-stock').forEach(btn => btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const input = document.querySelector(`.stock-input[data-id="${id}"]`);
            const r = await EcofuturoFacade.atualizarEstoqueBeneficio(id, parseInt(input?.value || 0));
            this.showMessage(r.message);
            if (r.success) {
                await this.renderBenefitsList();
                await this.renderCatalogPage();
            }
        });

        document.querySelectorAll('.btn-edit-benefit').forEach(btn => btn.onclick = () => {
            document.getElementById('edit-benefit-id').value = btn.dataset.id;
            document.getElementById('edit-benefit-name').value = btn.dataset.nome;
            document.getElementById('edit-benefit-cost').value = btn.dataset.custo;
            document.getElementById('edit-benefit-stock').value = btn.dataset.stock;
            document.querySelectorAll('#edit-benefit-audience input[type="checkbox"]').forEach(cb => cb.checked = true);
            document.getElementById('edit-benefit-modal').classList.remove('hidden');
        });
    },

    async populatePartnerSelect() {
        const select = document.getElementById('benefit-partner');
        if (!select) return;
        const partners = await EcofuturoFacade.listarParceiros();
        select.innerHTML = '<option value="">Selecione o Parceiro...</option>';
        partners.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_parceiro;
            opt.textContent = p.nome;
            select.appendChild(opt);
        });
    },

    async handleAdminAddBenefit(e) {
        e.preventDefault();
        const r = await EcofuturoFacade.adicionarBeneficio(
            document.getElementById('benefit-name')?.value.trim(),
            parseInt(document.getElementById('benefit-cost')?.value),
            parseInt(document.getElementById('benefit-stock')?.value),
            parseInt(document.getElementById('benefit-partner')?.value)
        );
        this.showMessage(r.message);
        if (r.success) {
            await this.renderBenefitsList();
            await this.renderCatalogPage();
            e.target.reset();
        }
    },

    async handleEditPartner(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-partner-id')?.value);
        const nome = document.getElementById('edit-partner-name')?.value.trim();
        const cnpj = document.getElementById('edit-partner-cnpj')?.value.trim();
        const r = await EcofuturoFacade.editarParceiro(id, nome, cnpj);
        this.showMessage(r.message);
        if (r.success) {
            document.getElementById('edit-partner-modal')?.classList.add('hidden');
            await this.renderPartnersList();
        }
    },

    async handleEditBenefit(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-benefit-id')?.value);
        const nome = document.getElementById('edit-benefit-name')?.value.trim();
        const custo = parseFloat(document.getElementById('edit-benefit-cost')?.value);
        const estoque = parseInt(document.getElementById('edit-benefit-stock')?.value);
        const checks = document.querySelectorAll('#edit-benefit-audience input[type="checkbox"]:checked');
        const publicoAlvo = Array.from(checks).map(cb => cb.value);
        const r = await EcofuturoFacade.editarBeneficio(id, nome, custo, estoque, publicoAlvo);
        this.showMessage(r.message);
        if (r.success) {
            document.getElementById('edit-benefit-modal')?.classList.add('hidden');
            await this.renderBenefitsList();
            await this.renderCatalogPage();
        }
    },

    animateCoinGain(coins) {
        const coin = document.getElementById('coin-animation');
        if (!coin) return;
        coin.classList.remove('hidden');
        const msg = document.createElement('div');
        msg.className = 'absolute text-2xl font-bold text-yellow-500 bg-gray-900/90 px-4 py-2 rounded-full';
        msg.style.cssText = 'top:50%;left:50%;transform:translate(-50%,-50%)';
        msg.textContent = `+${coins.toFixed(2)}💰`;
        coin.appendChild(msg);
        setTimeout(() => { coin.classList.add('hidden'); msg.remove(); }, 1500);
    },

    async loadPage(pageName) {
        if (this._pageCache[pageName]) {
            document.getElementById('page-container').innerHTML = this._pageCache[pageName];
            return;
        }
        const resp = await fetch(`pages/${pageName}.html`);
        if (!resp.ok) {
            document.getElementById('page-container').innerHTML = '<div class="glass-card p-8 text-center"><p class="text-red-400 text-xl">Erro ao carregar página.</p></div>';
            return;
        }
        const html = await resp.text();
        this._pageCache[pageName] = html;
        document.getElementById('page-container').innerHTML = html;
    },

    startBackgroundAnimation() {
        const imgs = [document.getElementById('bg-img-1'), document.getElementById('bg-img-2'), document.getElementById('bg-img-3')];
        let idx = 0;
        setInterval(() => {
            imgs[idx]?.classList.remove('show');
            imgs[idx]?.classList.add('hide');
            idx = (idx + 1) % 3;
            imgs[idx]?.classList.remove('hide');
            imgs[idx]?.classList.add('show');
        }, 10000);
    }
};

window.onload = () => app.init();
