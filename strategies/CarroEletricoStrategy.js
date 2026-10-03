import TransportStrategy from './TransportStrategy.js';

export default class CarroEletricoStrategy extends TransportStrategy {
    calcularMoedas(d) { return d * 0.2; }
    calcularCO2(d)    { return d * 0.05; }
    getNome()         { return 'carroEletrico'; }
    getEmoji()        { return '⚡'; }
}
