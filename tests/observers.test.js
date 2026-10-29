import { describe, it, expect, vi, beforeEach } from 'vitest';
import Observer from '../observers/Observer.js';
import ToastObserver from '../observers/ToastObserver.js';
import CoinAnimationObserver from '../observers/CoinAnimationObserver.js';

describe('Observer Pattern - Interface', () => {
    it('Observer base lança erro', () => {
        const o = new Observer();
        expect(() => o.atualizar({})).toThrow('Método atualizar deve ser implementado');
    });
});

describe('ToastObserver', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="toast-container"></div>';
    });

    it('cria toast para moedas_ganhas', () => {
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'moedas_ganhas', valor: 50 });
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(1);
        expect(container.children[0].textContent).toContain('+50.00');
    });

    it('cria toast para resgate_feito', () => {
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'resgate_feito', beneficio: 'EcoBag', custo: 30 });
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(1);
        expect(container.children[0].textContent).toContain('EcoBag');
        expect(container.children[0].textContent).toContain('30');
    });

    it('cria toast para moedas_devolvidas', () => {
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'moedas_devolvidas', valor: 25 });
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(1);
        expect(container.children[0].textContent).toContain('25.00');
    });

    it('cria toast para voucher_expirado', () => {
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'voucher_expirado', codigo: 'ABC123' });
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(1);
        expect(container.children[0].textContent).toContain('ABC123');
    });

    it('ignora eventos desconhecidos', () => {
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'desconhecido' });
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(0);
    });

    it('ignora null/undefined', () => {
        const toast = new ToastObserver();
        toast.atualizar(null);
        toast.atualizar(undefined);
        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(0);
    });

    it('ignora se container nao existe', () => {
        document.body.innerHTML = '';
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'moedas_ganhas', valor: 10 });
        expect(document.getElementById('toast-container')).toBeNull();
    });

    it('adiciona classe toast-show no proximo frame', () => {
        vi.useFakeTimers();
        const toast = new ToastObserver();
        toast.atualizar({ tipo: 'moedas_ganhas', valor: 5 });
        const el = document.querySelector('.toast-notification');
        expect(el.classList.contains('toast-show')).toBe(false);
        vi.advanceTimersByTime(17);
        expect(el.classList.contains('toast-show')).toBe(true);
        vi.useRealTimers();
    });
});

describe('CoinAnimationObserver', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="coin-animation" class="hidden"></div>';
    });

    it('mostra animacao para moedas_ganhas', () => {
        const obs = new CoinAnimationObserver();
        const el = document.getElementById('coin-animation');
        expect(el.classList.contains('hidden')).toBe(true);
        obs.atualizar({ tipo: 'moedas_ganhas', valor: 20 });
        expect(el.classList.contains('hidden')).toBe(false);
    });

    it('ignora outros eventos', () => {
        const obs = new CoinAnimationObserver();
        obs.atualizar({ tipo: 'resgate_feito' });
        const el = document.getElementById('coin-animation');
        expect(el.classList.contains('hidden')).toBe(true);
    });

    it('ignora null', () => {
        const obs = new CoinAnimationObserver();
        obs.atualizar(null);
        const el = document.getElementById('coin-animation');
        expect(el.classList.contains('hidden')).toBe(true);
    });

    it('esconde apos 1500ms', () => {
        vi.useFakeTimers();
        const obs = new CoinAnimationObserver();
        obs.atualizar({ tipo: 'moedas_ganhas', valor: 10 });
        const el = document.getElementById('coin-animation');
        expect(el.classList.contains('hidden')).toBe(false);
        vi.advanceTimersByTime(1500);
        expect(el.classList.contains('hidden')).toBe(true);
        vi.useRealTimers();
    });

    it('nao quebra se elemento nao existe', () => {
        document.body.innerHTML = '';
        const obs = new CoinAnimationObserver();
        expect(() => obs.atualizar({ tipo: 'moedas_ganhas', valor: 10 })).not.toThrow();
    });
});
