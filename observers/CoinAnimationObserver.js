import Observer from './Observer.js';

export default class CoinAnimationObserver extends Observer {
    atualizar(evento) {
        if (!evento || evento.tipo !== 'moedas_ganhas') return;
        const anim = document.getElementById('coin-animation');
        if (!anim) return;
        anim.classList.remove('hidden');
        setTimeout(() => anim.classList.add('hidden'), 1500);
    }
}
