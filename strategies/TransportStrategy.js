export default class TransportStrategy {
    calcularMoedas(distanciaKm) {
        throw new Error('Método calcularMoedas deve ser implementado');
    }
    calcularCO2(distanciaKm) {
        throw new Error('Método calcularCO2 deve ser implementado');
    }
    getNome() {
        throw new Error('Método getNome deve ser implementado');
    }
    getEmoji() {
        throw new Error('Método getEmoji deve ser implementado');
    }
}
