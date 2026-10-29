import Observer from './Observer.js';

export default class ToastObserver extends Observer {
    atualizar(evento) {
        if (!evento || !evento.tipo) return;
        const container = document.getElementById('toast-container');
        if (!container) return;

        let msg = '';
        let cor = 'bg-green-500/90';
        switch (evento.tipo) {
            case 'moedas_ganhas':
                msg = `💰 +${evento.valor.toFixed(2)} moedas!`;
                cor = 'bg-green-500/90';
                break;
            case 'resgate_feito':
                msg = `🎁 "${evento.beneficio}" resgatado por ${evento.custo} moedas!`;
                cor = 'bg-blue-500/90';
                break;
            case 'moedas_devolvidas':
                msg = `🔄 ${evento.valor.toFixed(2)} moedas devolvidas!`;
                cor = 'bg-yellow-500/90';
                break;
            case 'voucher_expirado':
                msg = `⚠️ Voucher "${evento.codigo}" expirado.`;
                cor = 'bg-red-500/90';
                break;
            default:
                return;
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification ${cor} backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-lg border border-white/20 font-medium transition-all duration-500`;
        toast.textContent = msg;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('toast-show'));

        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }
}
