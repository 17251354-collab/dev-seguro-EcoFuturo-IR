import { describe, it, expect, beforeEach, vi } from 'vitest';
import SistemaEcofuturo from '../SistemaEcofuturo.js';
import { mockClient, pushResponse, resetMock } from './setup.js';

function loginUser(sys, overrides = {}) {
    const user = {
        id: 1, name: 'Aluno Teste', email: 'aluno@esuda.edu.br',
        type: 'aluno', coins: 100, data_cadastro: '2025-01-01', status: 'ATIVO',
        ...overrides,
    };
    sys.isLoggedIn = true;
    sys.currentUser = user;
    sys._userCache = { ...user };
    return user;
}

describe('SistemaEcofuturo', () => {
    beforeEach(() => {
        const s = SistemaEcofuturo.getInstance();
        s.isLoggedIn = false; s.currentUser = null; s._userCache = null;
        resetMock();
    });

    describe('Singleton', () => {
        it('getInstance retorna sempre a mesma', () => {
            expect(SistemaEcofuturo.getInstance()).toBe(SistemaEcofuturo.getInstance());
        });
        it('new retorna a mesma instancia', () => {
            expect(new SistemaEcofuturo()).toBe(SistemaEcofuturo.getInstance());
        });
    });

    describe('isAdmin', () => {
        it('true p/ admin', () => { const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' }; expect(s.isAdmin()).toBe(true); });
        it('false p/ aluno', () => { const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'aluno' }; expect(s.isAdmin()).toBe(false); });
        it('false s/ user', () => { expect(SistemaEcofuturo.getInstance().isAdmin()).toBe(false); });
    });

    describe('getCurrentUserSafe', () => {
        it('retorna copia', () => {
            const s = SistemaEcofuturo.getInstance(); s._userCache = { id: 1, name: 'T' };
            expect(s.getCurrentUserSafe()).toEqual({ id: 1, name: 'T' });
        });
        it('null s/ login', () => { expect(SistemaEcofuturo.getInstance().getCurrentUserSafe()).toBeNull(); });
    });

    describe('Observer', () => {
        it('adiciona e dispara', async () => {
            const s = SistemaEcofuturo.getInstance();
            const spy = { atualizar: vi.fn() };
            s.adicionarObserver(spy);
            loginUser(s);
            pushResponse([]);                          // dup check (then)
            pushResponse({ id_atividade: 10 }, null);  // insert atividade (single)
            pushResponse({ id_emissao: 20 }, null);    // insert emissao (single)
            pushResponse({ id_conversao: 30 }, null);  // insert conversao (single)
            pushResponse(null, null); // insert moeda (then)
            pushResponse([{ quantidade: 5, tipo_movimento: 'ENTRADA' }], null); // atualizar select moeda (then)
            pushResponse(null, null); // atualizar update usuario (then)
            const r = await s.registrarAtividade('bicicleta', 10, 30, '2025-01-01');
            expect(r.success).toBe(true);
            expect(spy.atualizar).toHaveBeenCalled();
            expect(spy.atualizar.mock.calls[0][0].tipo).toBe('moedas_ganhas');
        });
        it('remove', () => {
            const s = SistemaEcofuturo.getInstance();
            const o = { atualizar: vi.fn() };
            s.adicionarObserver(o); s.removerObserver(o);
        });
    });

    describe('login', () => {
        it('erro p/ credenciais invalidas', async () => {
            mockClient.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid' } });
            const r = await SistemaEcofuturo.getInstance().login('x@x', 'x');
            expect(r.success).toBe(false); expect(r.message).toContain('inválidos');
        });
        it('bloqueia apos 5 tentativas', async () => {
            const s = SistemaEcofuturo.getInstance();
            mockClient.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'x' } });
            for (let i = 0; i < 5; i++) await s.login('lock@t.com', 'x');
            const r = await s.login('lock@t.com', 'x');
            expect(r.success).toBe(false); expect(r.message).toContain('bloqueada');
        });
        it('sucesso', async () => {
            const s = SistemaEcofuturo.getInstance();
            mockClient.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: 'a@b' } }, error: null });
            pushResponse({ id_usuario: 1, nome: 'J', email: 'a@b', tipo_usuario: 'aluno', qtd_moeda: 0, data_cadastro: '2025-01-01', status: 'ATIVO' }, null);
            const r = await s.login('a@b', 'p');
            expect(r.success).toBe(true); expect(s.isLoggedIn).toBe(true);
        });
        it('usuario nao encontrado no banco', async () => {
            const s = SistemaEcofuturo.getInstance();
            mockClient.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: 'a@b' } }, error: null });
            pushResponse(null, null);
            const r = await s.login('a@b', 'p');
            expect(r.success).toBe(false); expect(r.message).toContain('não encontrado');
        });
    });

    describe('cadastrar', () => {
        it('valida campos obrigatorios', async () => {
            expect((await SistemaEcofuturo.getInstance().cadastrar('', '', '', '')).success).toBe(false);
        });
        it('valida senha 6-8', async () => {
            const s = SistemaEcofuturo.getInstance();
            expect((await s.cadastrar('N', 'a@b', '12', 'a')).success).toBe(false);
            expect((await s.cadastrar('N', 'a@b', '123456789', 'a')).success).toBe(false);
        });
        it('rejeita email duplicado', async () => {
            pushResponse({ id_usuario: 1 }, null);
            expect((await SistemaEcofuturo.getInstance().cadastrar('N', 'dup@t', '123456', 'a')).success).toBe(false);
        });
        it('cadastra sem auto-login', async () => {
            const s = SistemaEcofuturo.getInstance();
            pushResponse(null, null); // check existing
            mockClient.auth.signUp.mockResolvedValue({ data: { user: { email: 'n@t' } }, error: null });
            pushResponse(null, null); // insert
            const r = await s.cadastrar('N', 'n@t', '123456', 'aluno', false);
            expect(r.success).toBe(true);
        });
        it('cadastra com auto-login', async () => {
            const s = SistemaEcofuturo.getInstance();
            pushResponse(null, null); // check existing
            mockClient.auth.signUp.mockResolvedValue({ data: { user: { email: 'n@t' }, session: { access_token: 'x' } }, error: null });
            pushResponse(null, null); // insert
            pushResponse({ id_usuario: 1, nome: 'N', email: 'n@t', tipo_usuario: 'aluno', qtd_moeda: 0, data_cadastro: '2025-01-01', status: 'ATIVO' }, null); // select p/ auto-login
            const r = await s.cadastrar('N', 'n@t', '123456', 'aluno', true);
            expect(r.success).toBe(true); expect(s.isLoggedIn).toBe(true);
        });
    });

    describe('logout', () => {
        it('limpa estado', async () => {
            const s = SistemaEcofuturo.getInstance();
            s.isLoggedIn = true; s.currentUser = { id: 1 }; s._userCache = { id: 1 };
            const r = await s.logout();
            expect(r.success).toBe(true); expect(s.isLoggedIn).toBe(false); expect(s.currentUser).toBeNull();
        });
    });

    describe('getSaldoUsuario', () => {
        it('0 s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getSaldoUsuario()).toBe(0); });
        it('retorna saldo', async () => {
            const s = SistemaEcofuturo.getInstance();
            loginUser(s);
            pushResponse({ qtd_moeda: 50 }, null);
            expect(await s.getSaldoUsuario()).toBe(50);
        });
    });

    describe('registrarAtividade', () => {
        it('bloqueia s/ login', async () => {
            expect((await SistemaEcofuturo.getInstance().registrarAtividade('b', 10, 30, '2025-01-01')).success).toBe(false);
        });
        it('bloqueia admin', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.registrarAtividade('b', 10, 30, '2025-01-01')).success).toBe(false);
        });
        it('valida distancia', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            expect((await s.registrarAtividade('b', 0, 30, '2025-01-01')).success).toBe(false);
        });
        it('valida duracao', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            expect((await s.registrarAtividade('b', 10, 0, '2025-01-01')).success).toBe(false);
        });
        it('rejeita data futura', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            expect((await s.registrarAtividade('b', 10, 30, '2099-12-31')).success).toBe(false);
        });
        it('rejeita transporte invalido', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([], null);
            expect((await s.registrarAtividade('x', 10, 30, '2025-01-01')).success).toBe(false);
        });
        it('rejeita duplicata', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_atividade: 1 }], null);
            const r = await s.registrarAtividade('b', 10, 30, '2025-01-01');
            expect(r.success).toBe(false); expect(r.message).toContain('já registrou');
        });
        it('registra com sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([], null);               // dup check (then)
            pushResponse({ id_atividade: 10 }, null);  // insert atividade (single)
            pushResponse({ id_emissao: 20 }, null);    // insert emissao (single)
            pushResponse({ id_conversao: 30 }, null);  // insert conversao (single)
            pushResponse(null, null);                  // insert moeda (then)
            pushResponse([{ quantidade: 5, tipo_movimento: 'ENTRADA' }], null); // atualizar select moeda (then)
            pushResponse(null, null);                  // atualizar update usuario (then)
            const r = await s.registrarAtividade('bicicleta', 10, 30, '2025-01-01');
            expect(r.success).toBe(true); expect(r.coinsGained).toBe(5);
        });
        it('rollback se moeda falhar', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([], null);
            pushResponse({ id_atividade: 10 }, null);
            pushResponse({ id_emissao: 20 }, null);
            pushResponse({ id_conversao: 30 }, null);
            pushResponse(null, { message: 'erro' });
            expect((await s.registrarAtividade('b', 10, 30, '2025-01-01')).success).toBe(false);
        });
    });

    describe('reservarBeneficio', () => {
        it('bloqueia s/ login', async () => {
            expect((await SistemaEcofuturo.getInstance().reservarBeneficio(1)).success).toBe(false);
        });
        it('bloqueia admin', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.reservarBeneficio(1)).success).toBe(false);
        });
        it('beneficio inexistente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse(null, null);
            expect((await s.reservarBeneficio(999)).success).toBe(false);
        });
        it('estoque zerado', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 0, publico_alvo: ['aluno'] }, null);
            expect((await s.reservarBeneficio(1)).success).toBe(false);
        });
        it('publico_alvo incompativel', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { type: 'comunidadeExterna' });
            pushResponse({ id_beneficio: 1, nome: 'Ingresso', valor_moedas: 10, estoque: 5, publico_alvo: ['aluno', 'professor'] }, null);
            expect((await s.reservarBeneficio(1)).success).toBe(false);
        });
        it('email nao institucional', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { email: 'ext@gmail.com', type: 'aluno' });
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 5, publico_alvo: ['aluno'] }, null);
            expect((await s.reservarBeneficio(1)).success).toBe(false);
        });
        it('comunidadeExterna sem email institucional OK', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { type: 'comunidadeExterna', email: 'ext@gmail.com' });
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 5, publico_alvo: ['comunidadeExterna'] }, null); // select beneficio (single)
            pushResponse({ qtd_moeda: 100 }, null);  // getSaldo (single)
            pushResponse({ id_resgate: 1 }, null);   // insert resgate (single)
            pushResponse(null, null);                 // voucher trigger (maybeSingle)
            pushResponse(null, null);                 // update voucher OR insert voucher (then)
            pushResponse([{ quantidade: 10, tipo_movimento: 'ENTRADA' }], null); // atualizar select moeda (then)
            pushResponse(null, null);                 // atualizar update usuario (then)
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 4 }, null); // update beneficio (single)
            expect((await s.reservarBeneficio(1)).success).toBe(true);
        });
        it('saldo insuficiente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { coins: 5 });
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 200, estoque: 5, publico_alvo: ['aluno'] }, null);
            pushResponse({ qtd_moeda: 5 }, null);
            expect((await s.reservarBeneficio(1)).success).toBe(false);
        });
        it('reserva com sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 5, publico_alvo: ['aluno'] }, null);
            pushResponse({ qtd_moeda: 100 }, null);
            pushResponse({ id_resgate: 1 }, null);
            pushResponse(null, null);                 // voucher trigger (maybeSingle)
            pushResponse(null, null);                 // update or insert voucher (then)
            pushResponse([{ quantidade: 10, tipo_movimento: 'ENTRADA' }], null);
            pushResponse(null, null);
            pushResponse({ id_beneficio: 1, nome: 'EcoBag', valor_moedas: 10, estoque: 4 }, null);
            const r = await s.reservarBeneficio(1);
            expect(r.success).toBe(true); expect(r.voucher.benefitName).toBe('EcoBag');
        });
    });

    describe('marcarVoucherComoUsado', () => {
        it('bloqueia s/ login', async () => { expect((await SistemaEcofuturo.getInstance().marcarVoucherComoUsado('C')).success).toBe(false); });
        it('voucher inexistente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse(null, null);
            expect((await s.marcarVoucherComoUsado('X')).success).toBe(false);
        });
        it('voucher de outro usuario', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_voucher: 1, codigo: 'C', status: 'ATIVO', dt_validade: '2025-06-01', resgate: { id_usuario: 2 } }, null);
            expect((await s.marcarVoucherComoUsado('C')).success).toBe(false);
        });
        it('usa com sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_voucher: 1, codigo: 'C', status: 'ATIVO', dt_validade: '2025-06-01', resgate: { id_usuario: 1 } }, null);
            pushResponse(null, null);
            expect((await s.marcarVoucherComoUsado('C')).success).toBe(true);
        });
    });

    describe('deletarVoucher', () => {
        it('bloqueia s/ login', async () => { expect((await SistemaEcofuturo.getInstance().deletarVoucher('C')).success).toBe(false); });
        it('cancela e devolve', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_voucher: 1, codigo: 'C', status: 'ATIVO', resgate: { id_resgate: 10, id_usuario: 1, id_beneficio: 5, moedas_usadas: 30 } }, null);
            pushResponse({ id_voucher: 1, status: 'CANCELADO' }, null);  // update (single)
            pushResponse({ estoque: 5 }, null);    // select beneficio (single)
            pushResponse(null, null);               // update beneficio (then)
            pushResponse(null, null);               // insert moeda (then)
            pushResponse([{ quantidade: 30, tipo_movimento: 'ENTRADA' }], null); // atualizar select (then)
            pushResponse(null, null);               // atualizar update (then)
            expect((await s.deletarVoucher('C')).success).toBe(true);
        });
        it('bloqueia outro user', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ id_voucher: 1, codigo: 'C', status: 'ATIVO', resgate: { id_resgate: 10, id_usuario: 2, id_beneficio: 5, moedas_usadas: 30 } }, null);
            expect((await s.deletarVoucher('C')).success).toBe(false);
        });
    });

    describe('getCatalogo', () => {
        it('vazio s/ dados', async () => {
            pushResponse(null, null);
            expect(await SistemaEcofuturo.getInstance().getCatalogo()).toEqual([]);
        });
        it('admin ve todos', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse([{ id_beneficio: 1, nome: 'A', valor_moedas: 10, estoque: 5, descricao: '', id_parceiro: 1 }], null);
            expect((await s.getCatalogo()).length).toBe(1);
        });
        it('filtra por publico_alvo', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { type: 'comunidadeExterna' });
            pushResponse([
                { id_beneficio: 1, nome: 'A', valor_moedas: 10, estoque: 5, descricao: '', id_parceiro: 1, publico_alvo: ['aluno'] },
                { id_beneficio: 2, nome: 'B', valor_moedas: 5, estoque: 3, descricao: '', id_parceiro: 1, publico_alvo: ['comunidadeExterna'] },
            ], null);
            expect((await s.getCatalogo()).length).toBe(1);
        });
    });

    describe('transferirMoedas', () => {
        it('bloqueia s/ login', async () => { expect((await SistemaEcofuturo.getInstance().transferirMoedas('a@b', 10)).success).toBe(false); });
        it('bloqueia admin', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.transferirMoedas('a@b', 10)).success).toBe(false);
        });
        it('valor invalido', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            expect((await s.transferirMoedas('a@b', 0)).success).toBe(false);
            expect((await s.transferirMoedas('a@b', -5)).success).toBe(false);
        });
        it('saldo insuficiente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s, { coins: 5 });
            pushResponse({ qtd_moeda: 5 }, null);
            expect((await s.transferirMoedas('a@b', 10)).success).toBe(false);
        });
        it('destino inexistente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ qtd_moeda: 100 }, null);
            pushResponse(null, null);
            expect((await s.transferirMoedas('x@x', 10)).success).toBe(false);
        });
        it('auto-transferencia', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ qtd_moeda: 100 }, null);
            pushResponse({ id_usuario: 1 }, null);
            expect((await s.transferirMoedas('aluno@esuda.edu.br', 10)).success).toBe(false);
        });
        it('transfere com sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse({ qtd_moeda: 100 }, null);   // getSaldo (single)
            pushResponse({ id_usuario: 2 }, null);    // select destino (maybeSingle)
            pushResponse({ id_moeda: 1 }, null);      // insert saida (single)
            pushResponse({ id_moeda: 2 }, null);      // insert entrada (single)
            pushResponse([{ quantidade: 10, tipo_movimento: 'SAIDA' }], null); // atualizar select (then)
            pushResponse(null, null);                  // atualizar update (then)
            expect((await s.transferirMoedas('dest@t.com', 10)).success).toBe(true);
        });
    });

    describe('CRUD parceiros', () => {
        it('adicionar bloqueia s/ admin', async () => { expect((await SistemaEcofuturo.getInstance().adicionarParceiro('P', '123')).success).toBe(false); });
        it('adicionar valida CNPJ', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.adicionarParceiro('P', '')).success).toBe(false);
        });
        it('adiciona parceiro', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse({ id_parceiro: 1 }, null);
            expect((await s.adicionarParceiro('P', '123')).success).toBe(true);
        });
        it('editar bloqueia s/ nome', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.editarParceiro(1, '', '123')).success).toBe(false);
        });
        it('editar sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse(null, null);
            expect((await s.editarParceiro(1, 'N', '987')).success).toBe(true);
        });
        it('listar vazio s/ admin', async () => {
            expect(await SistemaEcofuturo.getInstance().listarParceiros()).toEqual([]);
        });
        it('listar parceiros', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse([{ id_parceiro: 1, nome: 'P1' }], null);
            expect((await s.listarParceiros()).length).toBe(1);
        });
        it('deletar bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().deletarParceiro(1)).success).toBe(false);
        });
    });

    describe('CRUD beneficios', () => {
        it('adicionar bloqueia s/ admin', async () => { expect((await SistemaEcofuturo.getInstance().adicionarBeneficio('T', 10, 5, 1, '')).success).toBe(false); });
        it('adicionar valida custo', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.adicionarBeneficio('T', 0, 5, 1, '')).success).toBe(false);
        });
        it('adicionar sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse({ id_beneficio: 1 }, null);
            expect((await s.adicionarBeneficio('Novo', 15, 10, 1, '🎁', ['aluno'])).success).toBe(true);
        });
        it('editar valida nome', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.editarBeneficio(1, '', 10, 5)).success).toBe(false);
        });
        it('editar sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse(null, null);
            expect((await s.editarBeneficio(1, 'E', 20, 8, ['prof'])).success).toBe(true);
        });
        it('atualizar estoque bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().atualizarEstoqueBeneficio(1, 10)).success).toBe(false);
        });
        it('atualizar estoque sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse(null, null);
            expect((await s.atualizarEstoqueBeneficio(1, 20)).success).toBe(true);
        });
        it('deletar bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().deletarBeneficio(1)).success).toBe(false);
        });
    });

    describe('CRUD usuarios', () => {
        it('listar vazio s/ admin', async () => { expect(await SistemaEcofuturo.getInstance().listarUsuarios()).toEqual([]); });
        it('listar usuarios', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse([{ id_usuario: 1, nome: 'J', email: 'j@j', tipo_usuario: 'aluno', qtd_moeda: 0, status: 'ATIVO', data_cadastro: '2025-01-01' }], null);
            expect((await s.listarUsuarios()).length).toBe(1);
        });
        it('adicionar bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().adicionarUsuario('X', 'x@y', '123456', 'aluno')).success).toBe(false);
        });
        it('adicionar bloqueia tipo admin', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
            expect((await s.adicionarUsuario('X', 'x@y', '123456', 'admin')).success).toBe(false);
        });
        it('editar bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().editarUsuario('x@y', { name: 'N' })).success).toBe(false);
        });
        it('editar bloqueia tipo admin', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.editarUsuario('x@y', { type: 'admin' })).success).toBe(false);
        });
        it('editar coins negativo', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            expect((await s.editarUsuario('x@y', { coins: -1 })).success).toBe(false);
        });
        it('editar sucesso', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse(null, null);
            expect((await s.editarUsuario('x@y', { name: 'N', type: 'prof', coins: 50 })).success).toBe(true);
        });
        it('deletar bloqueia s/ admin', async () => {
            expect((await SistemaEcofuturo.getInstance().deletarUsuario('x@y')).success).toBe(false);
        });
    });

    describe('verificarExpiracao', () => {
        it('0 expirados', async () => {
            pushResponse(null, null);
            expect((await SistemaEcofuturo.getInstance().verificarExpiracaoVouchers()).expirados).toBe(0);
        });
        it('captura excecao', async () => {
            pushResponse(null, { message: 'fail' });
            const r = await SistemaEcofuturo.getInstance().verificarExpiracaoVouchers();
            expect(r.expirados).toBe(0);
        });
    });

    describe('getHistoricoTransferencias', () => {
        it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getHistoricoTransferencias()).toEqual([]); });
        it('retorna dados', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_moeda: 1, quantidade: '10', created_at: '2025-01-01' }], null);
            const r = await s.getHistoricoTransferencias();
            expect(r.length).toBe(1); expect(r[0].valor).toBe(10);
        });
    });

    describe('getRelatorioResgates', () => {
        it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getRelatorioResgates()).toEqual([]); });
        it('retorna dados', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_resgate: 1, moedas_usadas: '10', dt_resgate: '2025-01-01', status_resgate: 'CONCLUIDO', beneficio: { nome: 'EcoBag' }, voucher: [{ codigo: 'C1', status: 'ATIVO', dt_validade: '2025-02-01', dt_emissao: '2025-01-01' }] }], null);
            const r = await s.getRelatorioResgates();
            expect(r.length).toBe(1); expect(r[0].beneficio).toBe('EcoBag');
        });
    });

    describe('getEstatisticasPessoais', () => {
        it('null s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getEstatisticasPessoais()).toBeNull(); });
        it('retorna metricas', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_atividade: 1, distancia: '10', dt_registro: '2025-01-01', emissao_co2: [{ quantidade_co2: '2.0' }] }], null);
            const r = await s.getEstatisticasPessoais('total');
            expect(r.totalActivities).toBe(1); expect(r.totalCO2).toBe(2.0);
        });
    });

    describe('getEstatisticasComunidade', () => {
        it('retorna metricas', async () => {
            pushResponse([], null);        // atividade select (then)
            pushResponse(null, null, 10); // usuario count (then)
            pushResponse([{ quantidade: '5' }, { quantidade: '3' }], null); // moeda saidas (then)
            const r = await SistemaEcofuturo.getInstance().getEstatisticasComunidade();
            expect(r.totalUsuarios).toBe(10);
            expect(r.totalMoedasDoadas).toBe(8);
        });
    });

    describe('deletarTodosUsuarios', () => {
        it('bloqueia s/ admin', async () => { expect((await SistemaEcofuturo.getInstance().deletarTodosUsuarios()).success).toBe(false); });
        it('vazio', async () => {
            const s = SistemaEcofuturo.getInstance(); s.currentUser = { type: 'admin' };
            pushResponse([], null);
            expect((await s.deletarTodosUsuarios()).success).toBe(true);
        });
    });

    describe('restoreSession', () => {
        it('ativa', async () => {
            const s = SistemaEcofuturo.getInstance();
            mockClient.auth.getSession.mockResolvedValue({ data: { session: { user: { email: 't@t' } } } });
            pushResponse({ id_usuario: 1, nome: 'T', email: 't@t', tipo_usuario: 'aluno', qtd_moeda: 0, data_cadastro: '2025-01-01', status: 'ATIVO' }, null);
            expect(await s.restoreSession()).toBe(true);
            expect(s.isLoggedIn).toBe(true);
        });
        it('false s/ sessao', async () => {
            mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
            expect(await SistemaEcofuturo.getInstance().restoreSession()).toBe(false);
        });
    });

    describe('getHistoricoAtividades', () => {
        it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getHistoricoAtividades()).toEqual([]); });
        it('retorna dados', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_atividade: 1, distancia: '10', duracao: 30, dt_registro: '2025-01-01', transport_type: 'bicicleta', emissao_co2: [{ quantidade_co2: '2.0', conversao_moedas: [{ quantidade_moeda: '5' }] }] }], null);
            const r = await s.getHistoricoAtividades();
            expect(r.length).toBe(1); expect(r[0].coins).toBe(5); expect(r[0].transport).toBe('bicicleta');
        });
        it('fallback para inferirTransporte se transport_type ausente', async () => {
            const s = SistemaEcofuturo.getInstance(); loginUser(s);
            pushResponse([{ id_atividade: 2, distancia: '10', duracao: 30, dt_registro: '2025-01-01', emissao_co2: [{ quantidade_co2: '2.0', conversao_moedas: [{ quantidade_moeda: '4' }] }] }], null);
            const r = await s.getHistoricoAtividades();
            expect(r.length).toBe(1); expect(r[0].transport).toBe('bicicleta');
        });
    });

    describe('Fase 4', () => {
        describe('getRanking', () => {
            it('vazio sem dados', async () => {
                pushResponse([], null);
                expect(await SistemaEcofuturo.getInstance().getRanking()).toEqual([]);
            });
            it('retorna ranking', async () => {
                pushResponse([{ id_usuario: 1, nome: 'A', email: 'a@b', qtd_moeda: '100', tipo_usuario: 'aluno' }], null);
                const r = await SistemaEcofuturo.getInstance().getRanking();
                expect(r.length).toBe(1); expect(r[0].moedas).toBe(100);
            });
        });

        describe('getMissoes', () => {
            it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getMissoes()).toEqual([]); });
            it('retorna missoes com progresso', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ distancia: '5', dt_registro: new Date().toISOString().split('T')[0], emissao_co2: [{ quantidade_co2: '1' }] }], null);
                const r = await s.getMissoes();
                expect(r.length).toBe(4);
                expect(r.some(m => m.id === 'daily_walk')).toBe(true);
                expect(r.find(m => m.id === 'daily_transport').concluida).toBe(true);
            });
        });

        describe('getMedalhas', () => {
            it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getMedalhas()).toEqual([]); });
            it('retorna medalhas', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ distancia: '10', emissao_co2: [{ quantidade_co2: '5', conversao_moedas: [{ quantidade_moeda: '3' }] }] }], null);
                pushResponse([{ id_usuario: 1, qtd_moeda: '100' }, { id_usuario: 999, qtd_moeda: '50' }], null);
                const r = await s.getMedalhas();
                expect(r.length).toBe(12);
                expect(r.find(m => m.id === 'first_km').desbloqueada).toBe(true);
                expect(r.find(m => m.id === 'ten_km').desbloqueada).toBe(true);
                expect(r.find(m => m.id === 'first_activity').desbloqueada).toBe(true);
            });
        });

        describe('getNotificacoes', () => {
            it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getNotificacoes()).toEqual([]); });
            it('retorna notificacoes', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ id_notificacao: 1, mensagem: 'Teste', tipo: 'info', lida: false, dt_criacao: '2025-01-01T00:00:00' }], null);
                const r = await s.getNotificacoes();
                expect(r.length).toBe(1);
                expect(r[0].mensagem).toBe('Teste');
            });
            it('nao lidas count', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ id_notificacao: 1 }], null);
                expect(await s.getNotificacoesNaoLidas()).toBe(1);
            });
            it('marcar lida', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse(null, null);
                expect(await s.marcarNotificacaoLida(1)).toBe(true);
            });
        });

        describe('verificarMoedasExpiradas', () => {
            it('0 s/ login', async () => { expect(await SistemaEcofuturo.getInstance().verificarMoedasExpiradas()).toBe(0); });
            it('expira moedas antigas', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ id_moeda: 1, quantidade: '50' }, { id_moeda: 2, quantidade: '30' }], null);
                pushResponse(null, null); // update moeda
                pushResponse({ qtd_moeda: 100 }, null); // getSaldoUsuario
                pushResponse(null, null); // update usuario
                const r = await s.verificarMoedasExpiradas();
                expect(r).toBe(80);
            });
            it('0 sem moedas expiraveis', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([], null);
                expect(await s.verificarMoedasExpiradas()).toBe(0);
            });
        });

        describe('getCreditosParceiro', () => {
            it('vazio', async () => {
                pushResponse([], null);
                expect(await SistemaEcofuturo.getInstance().getCreditosParceiro()).toEqual([]);
            });
            it('retorna creditos', async () => {
                pushResponse([{ id_parceiro: 1, moedas_usadas: '50', parceiro: { nome: 'Parceiro X' } }], null);
                const r = await SistemaEcofuturo.getInstance().getCreditosParceiro();
                expect(r.length).toBe(1);
                expect(r[0].totalResgates).toBe(1);
                expect(r[0].totalMoedas).toBe(50);
            });
        });

        describe('getDesafios', () => {
            it('vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getDesafios()).toEqual([]); });
            it('retorna desafios', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ distancia: '15', transport_type: 'bicicleta', dt_registro: new Date().toISOString().split('T')[0], emissao_co2: [{ quantidade_co2: '3' }] }], null);
                const r = await s.getDesafios();
                expect(r.length).toBe(5);
                expect(r.find(d => d.id === 'month_30km').progresso).toBe(15);
            });
        });

        describe('mensagens', () => {
            it('enviar bloqueia s/ login', async () => {
                expect((await SistemaEcofuturo.getInstance().enviarMensagem('a@b', 'A', 'C')).success).toBe(false);
            });
            it('enviar destino inexistente', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse(null, null); // select destino
                const r = await s.enviarMensagem('x@y', 'A', 'C');
                expect(r.success).toBe(false);
            });
            it('enviar com sucesso', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse({ id_usuario: 2 }, null); // select destino
                pushResponse(null, null); // insert mensagem
                const r = await s.enviarMensagem('dest@b', 'Ola', 'Tudo bem?');
                expect(r.success).toBe(true);
            });
            it('recebidas vazio s/ login', async () => { expect(await SistemaEcofuturo.getInstance().getMensagensRecebidas()).toEqual([]); });
            it('recebidas retorna dados', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ id_mensagem: 1, assunto: 'Ola', conteudo: 'C', lida: false, dt_envio: '2025-01-01', remetente: { nome: 'R', email: 'r@t' } }], null);
                const r = await s.getMensagensRecebidas();
                expect(r.length).toBe(1);
                expect(r[0].assunto).toBe('Ola');
            });
            it('nao lidas', async () => {
                const s = SistemaEcofuturo.getInstance(); loginUser(s);
                pushResponse([{ id_mensagem: 1 }], null);
                expect(await s.getMensagensNaoLidas()).toBe(1);
            });
        });
    });
});
