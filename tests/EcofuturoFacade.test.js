import { describe, it, expect, beforeEach } from 'vitest';
import EcofuturoFacade from '../EcofuturoFacade.js';
import SistemaEcofuturo from '../SistemaEcofuturo.js';
import { mockClient, pushResponse, resetMock } from './setup.js';

describe('EcofuturoFacade', () => {
    beforeEach(() => {
        const s = SistemaEcofuturo.getInstance();
        s.isLoggedIn = false; s.currentUser = null; s._userCache = null;
        resetMock();
    });

    it('isLoggedIn false', () => { expect(EcofuturoFacade.isLoggedIn()).toBe(false); });
    it('isAdmin delega', () => {
        SistemaEcofuturo.getInstance().currentUser = { type: 'admin' };
        expect(EcofuturoFacade.isAdmin()).toBe(true);
    });
    it('getCurrentUser null', () => { expect(EcofuturoFacade.getCurrentUser()).toBeNull(); });
    it('login delega', async () => {
        mockClient.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'x' } });
        expect((await EcofuturoFacade.login('a@b', 'x')).success).toBe(false);
    });
    it('logout delega', async () => { expect((await EcofuturoFacade.logout()).success).toBe(true); });
    it('cadastrar delega', async () => {
        pushResponse(null, null);
        mockClient.auth.signUp.mockResolvedValue({ data: null, error: null });
        pushResponse(null, null);
        expect(typeof (await EcofuturoFacade.cadastrar('N', 'e@m', '123456', 'aluno')).success).toBe('boolean');
    });
    it('getSaldo 0 sem login', async () => { expect(await EcofuturoFacade.getSaldo()).toBe(0); });
    it('getUserType', () => {
        expect(EcofuturoFacade.getUserType()).toBeNull();
        SistemaEcofuturo.getInstance().currentUser = { type: 'aluno' };
        expect(EcofuturoFacade.getUserType()).toBe('aluno');
    });
    it('Observer delegam', () => {
        const o = { atualizar: () => {} };
        EcofuturoFacade.adicionarObserver(o);
        EcofuturoFacade.removerObserver(o);
    });
    it('formatarTipoUsuario', () => {
        expect(EcofuturoFacade.formatarTipoUsuario('aluno')).toBe('Aluno');
        expect(EcofuturoFacade.formatarTipoUsuario('professor')).toBe('Professor');
        expect(EcofuturoFacade.formatarTipoUsuario('admin')).toBe('Administrador');
        expect(EcofuturoFacade.formatarTipoUsuario('x')).toBe('x');
    });
});
