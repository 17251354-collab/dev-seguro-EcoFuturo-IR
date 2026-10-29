import TransportStrategy from './TransportStrategy.js';

export default class TransportePublicoStrategy extends TransportStrategy {
    calcularMoedas(d) { return d * 0.3; }
    calcularCO2(d)    { return d * 0.10; }
    getNome()         { return 'transportePublico'; }
    getEmoji()        { return '🚌'; }
}
