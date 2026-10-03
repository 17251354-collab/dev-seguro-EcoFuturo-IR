import { describe, it, expect } from 'vitest';

describe('Smoke tests', () => {
    it('SistemaEcofuturo importa sem erro', async () => {
        const mod = await import('../SistemaEcofuturo.js');
        expect(mod.default).toBeDefined();
    });

    it('EcofuturoFacade importa sem erro', async () => {
        const mod = await import('../EcofuturoFacade.js');
        expect(mod.default).toBeDefined();
    });

    it('Strategies importam sem erro', async () => {
        const b = await import('../strategies/BicicletaStrategy.js');
        const c = await import('../strategies/CaminhadaStrategy.js');
        const tp = await import('../strategies/TransportePublicoStrategy.js');
        const ce = await import('../strategies/CarroEletricoStrategy.js');
        const ts = await import('../strategies/TransportStrategy.js');
        expect(b.default).toBeDefined();
        expect(c.default).toBeDefined();
        expect(tp.default).toBeDefined();
        expect(ce.default).toBeDefined();
        expect(ts.default).toBeDefined();
    });

    it('Observers importam sem erro', async () => {
        const o = await import('../observers/Observer.js');
        const t = await import('../observers/ToastObserver.js');
        const ca = await import('../observers/CoinAnimationObserver.js');
        expect(o.default).toBeDefined();
        expect(t.default).toBeDefined();
        expect(ca.default).toBeDefined();
    });

    it('Sistema singleton funciona', async () => {
        const s = (await import('../SistemaEcofuturo.js')).default;
        const i1 = s.getInstance();
        const i2 = s.getInstance();
        expect(i1).toBe(i2);
    });

    it('Todos os métodos Fase 4 existem', async () => {
        const s = (await import('../SistemaEcofuturo.js')).default.getInstance();
        expect(typeof s.getRanking).toBe('function');
        expect(typeof s.getMissoes).toBe('function');
        expect(typeof s.getMedalhas).toBe('function');
        expect(typeof s.getNotificacoes).toBe('function');
        expect(typeof s.getNotificacoesNaoLidas).toBe('function');
        expect(typeof s.marcarNotificacaoLida).toBe('function');
        expect(typeof s.verificarMoedasExpiradas).toBe('function');
        expect(typeof s.getCreditosParceiro).toBe('function');
        expect(typeof s.getDesafios).toBe('function');
        expect(typeof s.enviarMensagem).toBe('function');
        expect(typeof s.getMensagensRecebidas).toBe('function');
        expect(typeof s.getMensagensEnviadas).toBe('function');
        expect(typeof s.getMensagensNaoLidas).toBe('function');
        expect(typeof s.marcarMensagemLida).toBe('function');
    });
});
