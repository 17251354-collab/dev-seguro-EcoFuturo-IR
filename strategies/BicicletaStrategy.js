import TransportStrategy from './TransportStrategy.js';

export default class BicicletaStrategy extends TransportStrategy {
    calcularMoedas(d) { return d * 0.5; }
    calcularCO2(d)    { return d * 0.20; }
    getNome()         { return 'bicicleta'; }
    getEmoji()        { return '🚲'; }
}
