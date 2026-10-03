import SistemaEcofuturo from './SistemaEcofuturo.js';

export default class EcofuturoFacade {
    static get #sistema() {
        return SistemaEcofuturo.getInstance();
    }

    static async login(e, p) { return this.#sistema.login(e, p); }
    static async logout() { return this.#sistema.logout(); }
    static async cadastrar(n, e, s, t) { return this.#sistema.cadastrar(n, e, s, t); }
    static async restoreSession() { return this.#sistema.restoreSession(); }
    static isLoggedIn() { return this.#sistema.isLoggedIn; }
    static getCurrentUser() { return this.#sistema.getCurrentUserSafe(); }
    static adicionarObserver(o) { this.#sistema.adicionarObserver(o); }
    static removerObserver(o) { this.#sistema.removerObserver(o); }
    static isAdmin() { return this.#sistema.isAdmin(); }
    static async getSaldo() { return this.#sistema.getSaldoUsuario(); }
    static getUserType() { return this.#sistema.currentUser?.type || null; }

    static async registrarAtividade(t, d, dur, dt) { return this.#sistema.registrarAtividade(t, d, dur, dt); }
    static async getHistoricoAtividades(l) { return this.#sistema.getHistoricoAtividades(l); }
    static async getEstatisticasPessoais(p) { return this.#sistema.getEstatisticasPessoais(p); }
    static async getEstatisticasComunidade(p) { return this.#sistema.getEstatisticasComunidade(p); }

    static async getCatalogo() { return this.#sistema.getCatalogo(); }
    static async reservarBeneficio(id) { return this.#sistema.reservarBeneficio(id); }
    static async marcarVoucherComoUsado(id) { return this.#sistema.marcarVoucherComoUsado(id); }
    static async deletarVoucher(id) { return this.#sistema.deletarVoucher(id); }
    static async getVouchersPendentes() { return this.#sistema.getVouchersPendentes(); }
    static async getVouchersHistorico() { return this.#sistema.getVouchersHistorico(); }
    static async verificarExpiracao() { return this.#sistema.verificarExpiracaoVouchers(); }

    static async listarUsuarios() { return this.#sistema.listarUsuarios(); }
    static async adicionarUsuario(n, e, s, t) { return this.#sistema.adicionarUsuario(n, e, s, t); }
    static async editarUsuario(eOriginal, d) { return this.#sistema.editarUsuario(eOriginal, d); }
    static async deletarUsuario(e) { return this.#sistema.deletarUsuario(e); }
    static async deletarTodosUsuarios() { return this.#sistema.deletarTodosUsuarios(); }

    static async listarParceiros() { return this.#sistema.listarParceiros(); }
    static async adicionarParceiro(n, c) { return this.#sistema.adicionarParceiro(n, c); }
    static async editarParceiro(id, n, c) { return this.#sistema.editarParceiro(id, n, c); }
    static async deletarParceiro(id) { return this.#sistema.deletarParceiro(id); }
    static async adicionarBeneficio(n, c, e, p, i) { return this.#sistema.adicionarBeneficio(n, c, e, p, i); }
    static async editarBeneficio(id, n, c, e, a) { return this.#sistema.editarBeneficio(id, n, c, e, a); }
    static async atualizarEstoqueBeneficio(id, e) { return this.#sistema.atualizarEstoqueBeneficio(id, e); }
    static async deletarBeneficio(id) { return this.#sistema.deletarBeneficio(id); }

    static async getRelatorioResgates(p) { return this.#sistema.getRelatorioResgates(p); }
    static async transferirMoedas(e, v) { return this.#sistema.transferirMoedas(e, v); }
    static async getHistoricoTransferencias() { return this.#sistema.getHistoricoTransferencias(); }

    // Fase 4
    static async getRanking() { return this.#sistema.getRanking(); }
    static async getMissoes() { return this.#sistema.getMissoes(); }
    static async getMedalhas() { return this.#sistema.getMedalhas(); }
    static async getNotificacoes() { return this.#sistema.getNotificacoes(); }
    static async getNotificacoesNaoLidas() { return this.#sistema.getNotificacoesNaoLidas(); }
    static async marcarNotificacaoLida(id) { return this.#sistema.marcarNotificacaoLida(id); }
    static async verificarMoedasExpiradas() { return this.#sistema.verificarMoedasExpiradas(); }
    static async getCreditosParceiro() { return this.#sistema.getCreditosParceiro(); }
    static async getDesafios() { return this.#sistema.getDesafios(); }
    static async enviarMensagem(d, a, c) { return this.#sistema.enviarMensagem(d, a, c); }
    static async getMensagensRecebidas() { return this.#sistema.getMensagensRecebidas(); }
    static async getMensagensEnviadas() { return this.#sistema.getMensagensEnviadas(); }
    static async getMensagensNaoLidas() { return this.#sistema.getMensagensNaoLidas(); }
    static async marcarMensagemLida(id) { return this.#sistema.marcarMensagemLida(id); }

    static formatarTipoUsuario(t) {
        return {
            aluno: 'Aluno',
            professor: 'Professor',
            funcionarioEsuda: 'Funcionário ESUDA',
            comunidadeExterna: 'Comunidade Externa',
            admin: 'Administrador'
        }[t] || t;
    }
}
