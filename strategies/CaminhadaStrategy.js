import TransportStrategy from './TransportStrategy.js';

export default class CaminhadaStrategy extends TransportStrategy {
    calcularMoedas(d) { return d * 0.4; }
    calcularCO2(d)    { return d * 0.15; }
    getNome()         { return 'caminhada'; }
    getEmoji()        { return '🚶'; }
}
