import { describe, it, expect } from 'vitest';
import BicicletaStrategy from '../strategies/BicicletaStrategy.js';
import CaminhadaStrategy from '../strategies/CaminhadaStrategy.js';
import TransportePublicoStrategy from '../strategies/TransportePublicoStrategy.js';
import CarroEletricoStrategy from '../strategies/CarroEletricoStrategy.js';

describe('Strategy Pattern - TransportStrategy', () => {
    const strategies = [
        { Cls: BicicletaStrategy, name: 'bicicleta', moedasPerKm: 0.5, co2PerKm: 0.20, emoji: '🚲' },
        { Cls: CaminhadaStrategy, name: 'caminhada', moedasPerKm: 0.4, co2PerKm: 0.15, emoji: '🚶' },
        { Cls: TransportePublicoStrategy, name: 'transportePublico', moedasPerKm: 0.3, co2PerKm: 0.10, emoji: '🚌' },
        { Cls: CarroEletricoStrategy, name: 'carroEletrico', moedasPerKm: 0.2, co2PerKm: 0.05, emoji: '⚡' },
    ];

    strategies.forEach(({ Cls, name, moedasPerKm, co2PerKm, emoji }) => {
        describe(name, () => {
            const s = new Cls();

            it('getNome()', () => {
                expect(s.getNome()).toBe(name);
            });

            it('getEmoji()', () => {
                expect(s.getEmoji()).toBe(emoji);
            });

            it('calcularMoedas(10)', () => {
                expect(s.calcularMoedas(10)).toBe(10 * moedasPerKm);
            });

            it('calcularMoedas(0) retorna 0', () => {
                expect(s.calcularMoedas(0)).toBe(0);
            });

            it('calcularCO2(10)', () => {
                expect(s.calcularCO2(10)).toBe(10 * co2PerKm);
            });

            it('calcularCO2(0) retorna 0', () => {
                expect(s.calcularCO2(0)).toBe(0);
            });
        });
    });
});
