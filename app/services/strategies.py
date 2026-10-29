class BicicletaStrategy:
    def calcular_moedas(self, d): return d * 0.5
    def calcular_co2(self, d): return d * 0.20

class CaminhadaStrategy:
    def calcular_moedas(self, d): return d * 0.4
    def calcular_co2(self, d): return d * 0.15

class TransportePublicoStrategy:
    def calcular_moedas(self, d): return d * 0.3
    def calcular_co2(self, d): return d * 0.10

class CarroEletricoStrategy:
    def calcular_moedas(self, d): return d * 0.2
    def calcular_co2(self, d): return d * 0.05

STRATEGIES = {
    "bicicleta": BicicletaStrategy(),
    "caminhada": CaminhadaStrategy(),
    "transportePublico": TransportePublicoStrategy(),
    "carroEletrico": CarroEletricoStrategy(),
}