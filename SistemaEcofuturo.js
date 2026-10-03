import { supabase } from './supabase-config.js';
import BicicletaStrategy from './strategies/BicicletaStrategy.js';
import CaminhadaStrategy from './strategies/CaminhadaStrategy.js';
import TransportePublicoStrategy from './strategies/TransportePublicoStrategy.js';
import CarroEletricoStrategy from './strategies/CarroEletricoStrategy.js';

export default class SistemaEcofuturo {
    static #instance = null;

    constructor() {
        if (SistemaEcofuturo.#instance) {
            return SistemaEcofuturo.#instance;
        }

        this.isLoggedIn = false;
        this.currentUser = null;
        this._userCache = null;

        SistemaEcofuturo.#instance = this;
    }

    static getInstance() {
        if (!SistemaEcofuturo.#instance) {
            SistemaEcofuturo.#instance = new SistemaEcofuturo();
        }
        return SistemaEcofuturo.#instance;
    }

    #strategies = {
        bicicleta: new BicicletaStrategy(),
        caminhada: new CaminhadaStrategy(),
        transportePublico: new TransportePublicoStrategy(),
        carroEletrico: new CarroEletricoStrategy()
    };

    #observers = [];
    #loginAttempts = {};
    #dominioInstitucional = '@esuda.edu.br';

    adicionarObserver(o) {
        if (o && typeof o.atualizar === 'function' && !this.#observers.includes(o)) {
            this.#observers.push(o);
        }
    }

    removerObserver(o) {
        this.#observers = this.#observers.filter(x => x !== o);
    }

    #disparar(evento) {
        this.#observers.forEach(o => {
            try { o.atualizar(evento); } catch (e) { console.error('Observer error:', e); }
        });
    }

    #benefitEmojis = {
        'EcoBag': '🛍️',
        'Cafe na Delta Expresso': '☕',
        'Ingresso de Cinema': '🎬',
        'Vale-refeicao de R$50': '🍽️',
        'Camiseta EcoFuturo Esuda': '👕',
        'Desconto 50% na Livraria Jaqueira': '📚',
        'Desconto 50% na Matricula ESUDA': '🎓',
        'Fone de Ouvido Gamer': '🎧'
    };

    #publicoAlvo = {
        'EcoBag': ['aluno', 'professor', 'funcionarioEsuda', 'comunidadeExterna'],
        'Cafe na Delta Expresso': ['aluno', 'professor', 'funcionarioEsuda'],
        'Ingresso de Cinema': ['aluno', 'professor', 'funcionarioEsuda'],
        'Vale-refeicao de R$50': ['aluno', 'professor', 'funcionarioEsuda'],
        'Camiseta EcoFuturo Esuda': ['aluno', 'professor', 'funcionarioEsuda', 'comunidadeExterna'],
        'Desconto 50% na Livraria Jaqueira': ['aluno', 'professor', 'funcionarioEsuda'],
        'Desconto 50% na Matricula ESUDA': ['aluno', 'professor', 'funcionarioEsuda', 'comunidadeExterna'],
        'Fone de Ouvido Gamer': ['aluno', 'professor', 'funcionarioEsuda']
    };

    #inferirTransporte(quantidadeCo2, distancia) {
        if (!distancia || distancia <= 0) return 'bicicleta';
        const ratio = quantidadeCo2 / distancia;
        let best = 'bicicleta', bestDiff = Infinity;
        for (const [key, s] of Object.entries(this.#strategies)) {
            const diff = Math.abs(ratio - s.calcularCO2(1));
            if (diff < bestDiff) { bestDiff = diff; best = key; }
        }
        return best;
    }

    #mapUsuario(userRow) {
        return {
            id: userRow.id_usuario,
            name: userRow.nome,
            email: userRow.email,
            type: userRow.tipo_usuario,
            coins: parseFloat(userRow.qtd_moeda || 0),
            data_cadastro: userRow.data_cadastro,
            status: userRow.status
        };
    }

    async restoreSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: userRow } = await supabase
                .from('usuario')
                .select('*')
                .eq('email', session.user.email)
                .maybeSingle();
            if (userRow) {
                this.isLoggedIn = true;
                const mapped = this.#mapUsuario(userRow);
                this.currentUser = mapped;
                this._userCache = mapped;
                return true;
            }
        }
        return false;
    }

    async login(email, password) {
        const now = Date.now();
        const record = this.#loginAttempts[email];
        if (record && record.count >= 5 && record.blockedUntil > now) {
            const segundos = Math.ceil((record.blockedUntil - now) / 1000);
            return { success: false, message: `Conta temporariamente bloqueada. Tente novamente em ${segundos} segundos.` };
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
            if (!this.#loginAttempts[email]) this.#loginAttempts[email] = { count: 0, blockedUntil: 0 };
            this.#loginAttempts[email].count += 1;
            if (this.#loginAttempts[email].count >= 5) {
                this.#loginAttempts[email].blockedUntil = now + 60000;
            }
            return { success: false, message: 'E-mail ou senha inválidos.' };
        }

        delete this.#loginAttempts[email];

        const { data: userRow } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (!userRow) {
            await supabase.auth.signOut();
            return { success: false, message: 'Perfil de usuário não encontrado.' };
        }

        this.isLoggedIn = true;
        const mapped = this.#mapUsuario(userRow);
        this.currentUser = mapped;
        this._userCache = mapped;
        return { success: true, user: this.getCurrentUserSafe() };
    }

    async logout() {
        await supabase.auth.signOut();
        this.isLoggedIn = false;
        this.currentUser = null;
        this._userCache = null;
        return { success: true };
    }

    async cadastrar(nome, email, senha, tipo, autoLogin = true) {
        if (!nome || !email || !senha || !tipo) {
            return { success: false, message: 'Por favor, preencha todos os campos.' };
        }

        if (senha.length < 6 || senha.length > 8) {
            return { success: false, message: 'A senha deve ter entre 6 e 8 caracteres.' };
        }

        const { data: existingUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return { success: false, message: 'E-mail já cadastrado.' };
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome, tipo_usuario: tipo } }
        });

        if (signUpError) {
            if (signUpError.message?.toLowerCase().includes('already')) {
                return { success: false, message: 'Este e-mail já possui cadastro. Tente fazer login.' };
            }
            return { success: false, message: signUpError.message };
        }

        const { error: insertError } = await supabase
            .from('usuario')
            .insert({
                nome,
                email,
                senha: '',
                tipo_usuario: tipo,
                qtd_moeda: 0,
                status: 'ATIVO'
            });

        if (insertError) {
            return { success: false, message: 'Erro ao criar perfil.' };
        }

        if (autoLogin && signUpData?.session) {
            const { data: newUser } = await supabase
                .from('usuario')
                .select('*')
                .eq('email', email)
                .maybeSingle();
            if (newUser) {
                this.isLoggedIn = true;
                const mapped = this.#mapUsuario(newUser);
                this.currentUser = mapped;
                this._userCache = mapped;
            }
        }

        return { success: true, message: '✅ Cadastro realizado!' };
    }

    isAdmin() {
        return this.currentUser?.type === 'admin';
    }

    getCurrentUserSafe() {
        return this._userCache ? { ...this._userCache } : null;
    }

    async getSaldoUsuario() {
        if (!this.currentUser) return 0;
        const { data: userRow } = await supabase
            .from('usuario')
            .select('qtd_moeda')
            .eq('id_usuario', this.currentUser.id)
            .single();
        const balance = parseFloat(userRow?.qtd_moeda || 0);
        this.currentUser.coins = balance;
        this._userCache.coins = balance;
        return balance;
    }

    async #atualizarSaldoUsuario() {
        const { data: movs } = await supabase
            .from('moeda')
            .select('quantidade, tipo_movimento')
            .eq('id_usuario', this.currentUser.id);
        const balance = (movs || []).reduce((sum, m) => {
            return sum + (m.tipo_movimento === 'ENTRADA' ? parseFloat(m.quantidade) : -parseFloat(m.quantidade));
        }, 0);
        await supabase.from('usuario').update({ qtd_moeda: balance }).eq('id_usuario', this.currentUser.id);
        this.currentUser.coins = balance;
        this._userCache.coins = balance;
    }

    async registrarAtividade(transport, distance, duration, date) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        if (this.isAdmin()) return { success: false, message: 'Administradores não podem registrar atividades.' };

        const distNum = parseFloat(distance);
        if (isNaN(distNum) || distNum <= 0) return { success: false, message: 'Distância inválida.' };

        const durNum = parseInt(duration) || 0;
        if (durNum <= 0) return { success: false, message: 'Duração inválida.' };

        const today = new Date().toISOString().split('T')[0];
        if (date > today) return { success: false, message: 'A data não pode ser futura.' };

        const { data: dup } = await supabase
            .from('atividade')
            .select('id_atividade')
            .eq('id_usuario', this.currentUser.id)
            .eq('dt_registro', date)
            .limit(1);
        if (dup && dup.length > 0) {
            return { success: false, message: 'Você já registrou uma atividade nesta data.' };
        }

        const strategy = this.#strategies[transport];
        if (!strategy) return { success: false, message: 'Transporte inválido.' };

        const coinsGained = strategy.calcularMoedas(distNum);
        const co2Reduced = strategy.calcularCO2(distNum);

        const { data: ativData, error: ativError } = await supabase
            .from('atividade')
            .insert({
                id_usuario: this.currentUser.id,
                distancia: distNum,
                duracao: durNum,
                dt_registro: date,
                transport_type: transport
            })
            .select()
            .single();

        if (ativError) return { success: false, message: 'Erro ao registrar atividade.' };

        let ativId = ativData.id_atividade;

        const { data: emissaoData, error: co2Error } = await supabase
            .from('emissao_co2')
            .insert({
                id_atividade: ativId,
                quantidade_co2: co2Reduced
            })
            .select()
            .single();

        if (co2Error) {
            await supabase.from('atividade').delete().eq('id_atividade', ativId);
            return { success: false, message: 'Erro ao calcular CO2.' };
        }

        const emissaoId = emissaoData.id_emissao;

        const { data: convData, error: convError } = await supabase
            .from('conversao_moedas')
            .insert({
                id_emissao: emissaoId,
                quantidade_moeda: coinsGained
            })
            .select()
            .single();

        if (convError) {
            await supabase.from('emissao_co2').delete().eq('id_emissao', emissaoId);
            await supabase.from('atividade').delete().eq('id_atividade', ativId);
            return { success: false, message: 'Erro ao converter moedas.' };
        }

        const convId = convData.id_conversao;

        const { error: moedaError } = await supabase
            .from('moeda')
            .insert({
                id_usuario: this.currentUser.id,
                quantidade: coinsGained,
                tipo_movimento: 'ENTRADA',
                id_conversao: convId
            });

        if (moedaError) {
            await supabase.from('conversao_moedas').delete().eq('id_conversao', convId);
            await supabase.from('emissao_co2').delete().eq('id_emissao', emissaoId);
            await supabase.from('atividade').delete().eq('id_atividade', ativId);
            return { success: false, message: 'Erro ao creditar moedas.' };
        }

        await this.#atualizarSaldoUsuario();

        this.#disparar({ tipo: 'moedas_ganhas', valor: coinsGained, transporte: transport });

        const newActivity = {
            id: ativData.id_atividade,
            transport,
            distance: distNum,
            duration: durNum,
            coins: coinsGained,
            date
        };

        return { success: true, activity: newActivity, coinsGained, newBalance: this.currentUser.coins };
    }

    async getHistoricoAtividades(limit = 10) {
        if (!this.currentUser) return [];

        const { data: rows, error } = await supabase
            .from('atividade')
            .select(`
                id_atividade,
                distancia,
                duracao,
                dt_registro,
                transport_type,
                emissao_co2 (
                    quantidade_co2,
                    conversao_moedas (quantidade_moeda)
                )
            `)
            .eq('id_usuario', this.currentUser.id)
            .order('dt_registro', { ascending: false })
            .limit(limit);

        if (error) console.error('getHistoricoAtividades error:', error);
        if (!rows) return [];

        return rows.map(r => {
            const co2 = r.emissao_co2?.[0]?.quantidade_co2 || 0;
            const coins = r.emissao_co2?.[0]?.conversao_moedas?.[0]?.quantidade_moeda || 0;
            return {
                id: r.id_atividade,
                transport: r.transport_type || this.#inferirTransporte(parseFloat(co2), parseFloat(r.distancia)),
                distance: parseFloat(r.distancia),
                duration: r.duracao,
                coins: parseFloat(coins),
                date: r.dt_registro
            };
        });
    }

    async getCatalogo() {
        const { data: rows } = await supabase
            .from('beneficio')
            .select('*')
            .order('id_beneficio');

        if (!rows) return [];

        if (!this.currentUser || this.currentUser.type === 'admin') {
            return rows.map(b => ({
                id: b.id_beneficio,
                nome: b.nome,
                custo: parseFloat(b.valor_moedas),
                imagem: this.#benefitEmojis[b.nome] || '🎁',
                stock: b.estoque,
                descricao: b.descricao,
                parceiro_id: b.id_parceiro
            }));
        }

        const userType = this.currentUser.type;

        return rows
            .filter(b => {
                const audience = Array.isArray(b.publico_alvo) ? b.publico_alvo : (this.#publicoAlvo[b.nome] || null);
                if (!audience) return true;
                return audience.includes(userType);
            })
            .map(b => ({
                id: b.id_beneficio,
                nome: b.nome,
                custo: parseFloat(b.valor_moedas),
                imagem: this.#benefitEmojis[b.nome] || '🎁',
                stock: b.estoque,
                descricao: b.descricao,
                parceiro_id: b.id_parceiro,
                publico_alvo: Array.isArray(b.publico_alvo) ? b.publico_alvo : (this.#publicoAlvo[b.nome] || null)
            }));
    }

    async reservarBeneficio(benefitId) {
        if (!this.currentUser) return { success: false, message: 'Você precisa estar logado.' };
        if (this.isAdmin()) return { success: false, message: 'Administradores não podem resgatar benefícios.' };

        const { data: benefit } = await supabase
            .from('beneficio')
            .select('*')
            .eq('id_beneficio', benefitId)
            .single();

        if (!benefit) return { success: false, message: 'Benefício não encontrado.' };
        if (benefit.estoque <= 0) return { success: false, message: 'Desculpe, este benefício esgotou.' };

        const audience = Array.isArray(benefit.publico_alvo) ? benefit.publico_alvo : (this.#publicoAlvo[benefit.nome] || null);
        if (audience && !audience.includes(this.currentUser.type)) {
            return { success: false, message: 'Este benefício não está disponível para seu tipo de usuário.' };
        }

        const email = this.currentUser.email || '';
        if (this.currentUser.type !== 'comunidadeExterna' && !email.endsWith(this.#dominioInstitucional)) {
            return { success: false, message: `E-mail institucional (${this.#dominioInstitucional}) é obrigatório para resgatar benefícios.` };
        }

        const custo = parseFloat(benefit.valor_moedas);
        const saldoAtual = await this.getSaldoUsuario();
        if (saldoAtual < custo) {
            return { success: false, message: `Moedas insuficientes. Você precisa de ${custo} moedas.` };
        }

        const voucherCode = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        const { data: resgate } = await supabase
            .from('resgate')
            .insert({
                id_usuario: this.currentUser.id,
                id_beneficio: benefitId,
                moedas_usadas: custo,
                status_resgate: 'CONCLUIDO'
            })
            .select()
            .single();

        if (!resgate) return { success: false, message: 'Erro ao criar resgate.' };

        const { data: voucherTrigger } = await supabase
            .from('voucher')
            .select('id_voucher')
            .eq('id_resgate', resgate.id_resgate)
            .maybeSingle();

        if (voucherTrigger) {
            await supabase
                .from('voucher')
                .update({
                    codigo: voucherCode,
                    dt_validade: expirationDate.toISOString().split('T')[0]
                })
                .eq('id_voucher', voucherTrigger.id_voucher);
        } else {
            await supabase
                .from('voucher')
                .insert({
                    id_resgate: resgate.id_resgate,
                    codigo: voucherCode,
                    dt_emissao: new Date().toISOString().split('T')[0],
                    dt_validade: expirationDate.toISOString().split('T')[0],
                    status: 'ATIVO'
                });
        }

        // Trigger do banco ja cria SAIDA na moeda automaticamente
        await this.#atualizarSaldoUsuario();

        const newStock = Math.max(0, (parseInt(benefit.estoque) || 0) - 1);
        const { data: updated } = await supabase
            .from('beneficio')
            .update({ estoque: newStock })
            .eq('id_beneficio', benefitId)
            .gt('estoque', 0)
            .select()
            .single();

        if (!updated) {
            return { success: false, message: 'Benefício esgotado no momento da confirmação.' };
        }

        this.#disparar({ tipo: 'resgate_feito', beneficio: benefit.nome, custo });

        return {
            success: true,
            message: `✅ Você reservou "${benefit.nome}" por ${custo} moedas!`,
            voucher: {
                id: voucherCode,
                benefitId: benefit.id_beneficio,
                benefitName: benefit.nome,
                cost: custo,
                redeemDate: new Date().toISOString().split('T')[0],
                expirationDate: expirationDate.toISOString().split('T')[0],
                status: 'ATIVO'
            }
        };
    }

    async marcarVoucherComoUsado(voucherCode) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };

        const { data: voucher } = await supabase
            .from('voucher')
            .select(`
                id_voucher,
                codigo,
                status,
                dt_validade,
                resgate!inner (id_usuario)
            `)
            .eq('codigo', voucherCode)
            .eq('status', 'ATIVO')
            .single();

        if (!voucher) return { success: false, message: 'Voucher não encontrado ou já foi usado.' };
        if (voucher.resgate.id_usuario !== this.currentUser.id) {
            return { success: false, message: 'Este voucher não pertence a você.' };
        }

        const { error } = await supabase
            .from('voucher')
            .update({ status: 'USADO' })
            .eq('id_voucher', voucher.id_voucher);

        if (error) return { success: false, message: 'Erro ao usar voucher.' };

        return { success: true, message: `🎉 Voucher utilizado!`, voucherId: voucherCode };
    }

    async deletarVoucher(voucherCode) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };

        const { data: voucher } = await supabase
            .from('voucher')
            .select(`
                id_voucher,
                codigo,
                status,
                dt_validade,
                resgate!inner (
                    id_resgate,
                    id_usuario,
                    id_beneficio,
                    moedas_usadas
                )
            `)
            .eq('codigo', voucherCode)
            .in('status', ['ATIVO'])
            .single();

        if (!voucher || !voucher.resgate) return { success: false, message: 'Voucher não encontrado.' };
        if (voucher.resgate.id_usuario !== this.currentUser.id) {
            return { success: false, message: 'Este voucher não pertence a você.' };
        }

        const custo = parseFloat(voucher.resgate.moedas_usadas);

        const { data: updatedVoucher } = await supabase
            .from('voucher')
            .update({ status: 'CANCELADO' })
            .eq('id_voucher', voucher.id_voucher)
            .eq('status', 'ATIVO')
            .select()
            .single();

        if (!updatedVoucher) return { success: false, message: 'Voucher já foi processado.' };

        const { data: benefitRow } = await supabase
            .from('beneficio')
            .select('estoque')
            .eq('id_beneficio', voucher.resgate.id_beneficio)
            .single();

        if (benefitRow) {
            await supabase
                .from('beneficio')
                .update({ estoque: (parseInt(benefitRow.estoque) || 0) + 1 })
                .eq('id_beneficio', voucher.resgate.id_beneficio);
        }

        await supabase
            .from('moeda')
            .insert({
                id_usuario: this.currentUser.id,
                quantidade: custo,
                tipo_movimento: 'ENTRADA',
                id_resgate: voucher.resgate.id_resgate
            });

        await this.#atualizarSaldoUsuario();

        this.#disparar({ tipo: 'moedas_devolvidas', valor: custo });

        return { success: true, message: `🗑️ Voucher excluído e ${custo} moedas devolvidas.` };
    }

    async #fetchVouchersByStatus(statuses) {
        if (!this.currentUser) return [];

        const { data: rows } = await supabase
            .from('voucher')
            .select(`
                id_voucher,
                codigo,
                status,
                dt_emissao,
                dt_validade,
                resgate!inner (
                    id_resgate,
                    id_beneficio,
                    moedas_usadas,
                    dt_resgate,
                    beneficio!inner (nome)
                )
            `)
            .in('status', statuses)
            .eq('resgate.id_usuario', this.currentUser.id)
            .order('dt_emissao', { ascending: false });

        if (!rows) return [];

        return rows.map(r => ({
            id: r.codigo,
            voucherId: r.id_voucher,
            benefitId: r.resgate.id_beneficio,
            benefitName: r.resgate.beneficio.nome,
            cost: parseFloat(r.resgate.moedas_usadas),
            redeemDate: r.resgate.dt_resgate?.split('T')[0] || '',
            expirationDate: r.dt_validade,
            status: r.status === 'ATIVO' ? 'pending' : r.status.toLowerCase()
        }));
    }

    async getVouchersPendentes() {
        return this.#fetchVouchersByStatus(['ATIVO']);
    }

    async getVouchersHistorico() {
        return this.#fetchVouchersByStatus(['USADO', 'EXPIRADO', 'CANCELADO']);
    }

    async verificarExpiracaoVouchers() {
        const expirados = [];
        const proximos = [];
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data: expired } = await supabase
                .from('voucher')
                .update({ status: 'EXPIRADO' })
                .eq('status', 'ATIVO')
                .lt('dt_validade', today)
                .select();
            expirados.push(...(expired || []));

            if (this.currentUser) {
                const seteDias = new Date();
                seteDias.setDate(seteDias.getDate() + 7);
                const limite = seteDias.toISOString().split('T')[0];

                const { data: aboutToExpire } = await supabase
                    .from('voucher')
                    .select('codigo, dt_validade, resgate!inner(id_beneficio, beneficio!inner(nome))')
                    .eq('status', 'ATIVO')
                    .eq('resgate.id_usuario', this.currentUser.id)
                    .gte('dt_validade', today)
                    .lte('dt_validade', limite);

                if (aboutToExpire) {
                    aboutToExpire.forEach(v => {
                        proximos.push({ codigo: v.codigo, data: v.dt_validade, beneficio: v.resgate?.beneficio?.nome });
                        this.#disparar({ tipo: 'voucher_proximo_expiracao', codigo: v.codigo, data: v.dt_validade });
                    });
                }
            }

            expirados.forEach(v => this.#disparar({ tipo: 'voucher_expirado', codigo: v.codigo }));
            return { expirados: expirados.length, proximos };
        } catch (e) {
            console.warn('Erro ao expirar vouchers (nao critico):', e);
            return { expirados: 0, proximos: [] };
        }
    }

    async transferirMoedas(emailDestino, valor) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        if (this.isAdmin()) return { success: false, message: 'Administradores não podem transferir moedas.' };

        const valorNum = parseFloat(valor);
        if (isNaN(valorNum) || valorNum <= 0) {
            return { success: false, message: 'Valor inválido para transferência.' };
        }

        const saldo = await this.getSaldoUsuario();
        if (saldo < valorNum) {
            return { success: false, message: 'Saldo insuficiente para transferência.' };
        }

        const { data: destino } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', emailDestino)
            .maybeSingle();

        if (!destino) {
            return { success: false, message: 'Usuário destino não encontrado.' };
        }

        if (destino.id_usuario === this.currentUser.id) {
            return { success: false, message: 'Você não pode transferir moedas para si mesmo.' };
        }

        const { data: movSaida } = await supabase
            .from('moeda')
            .insert({
                id_usuario: this.currentUser.id,
                quantidade: valorNum,
                tipo_movimento: 'SAIDA'
            })
            .select()
            .single();

        if (!movSaida) return { success: false, message: 'Erro ao debitar moedas.' };

        const { data: movEntrada } = await supabase
            .from('moeda')
            .insert({
                id_usuario: destino.id_usuario,
                quantidade: valorNum,
                tipo_movimento: 'ENTRADA'
            })
            .select()
            .single();

        if (!movEntrada) {
            await supabase.from('moeda').delete().eq('id_moeda', movSaida.id_moeda);
            return { success: false, message: 'Erro ao creditar moedas.' };
        }

        await this.#atualizarSaldoUsuario();

        return { success: true, message: `💰 ${valorNum.toFixed(2)} moedas transferidas para ${emailDestino}!` };
    }

    async getHistoricoTransferencias() {
        if (!this.currentUser) return [];

        const { data: saidas } = await supabase
            .from('moeda')
            .select('id_moeda, quantidade, created_at')
            .eq('id_usuario', this.currentUser.id)
            .eq('tipo_movimento', 'SAIDA')
            .order('created_at', { ascending: false })
            .limit(20);

        return (saidas || []).map(m => ({
            id: m.id_moeda,
            valor: parseFloat(m.quantidade),
            data: m.created_at,
            tipo: 'enviado'
        }));
    }

    async getRelatorioResgates(periodo = 'total') {
        if (!this.currentUser) return [];
        let dateFilter = '';
        if (periodo && periodo !== 'total') {
            const d = new Date();
            if (periodo === 'today') d.setDate(d.getDate() - 1);
            else if (periodo === 'week') d.setDate(d.getDate() - 7);
            else if (periodo === 'month') d.setDate(d.getDate() - 30);
            else if (periodo === 'year') d.setFullYear(d.getFullYear() - 1);
            dateFilter = d.toISOString().split('T')[0];
        }

        let query = supabase
            .from('resgate')
            .select(`
                id_resgate, moedas_usadas, dt_resgate, status_resgate,
                beneficio (nome),
                voucher (codigo, status, dt_validade, dt_emissao)
            `)
            .eq('id_usuario', this.currentUser.id);

        if (dateFilter) {
            query = query.gte('dt_resgate', dateFilter);
        }

        const { data: rows } = await query.order('dt_resgate', { ascending: false }).limit(50);
        if (!rows) return [];

        return rows.map(r => ({
            id: r.id_resgate,
            beneficio: r.beneficio?.nome || '?',
            moedas: parseFloat(r.moedas_usadas || 0),
            data: r.dt_resgate,
            status: r.status_resgate,
            voucherCodigo: r.voucher?.[0]?.codigo || '',
            voucherStatus: r.voucher?.[0]?.status || '',
            validade: r.voucher?.[0]?.dt_validade || ''
        }));
    }

    async getEstatisticasPessoais(periodo = 'total') {
        if (!this.currentUser) return null;
        return this.#calcularMetricas(this.currentUser.id, periodo);
    }

    async getEstatisticasComunidade(periodo = 'total') {
        const metricas = await this.#calcularMetricas(null, periodo);

        const { count: totalUsuarios } = await supabase
            .from('usuario')
            .select('id_usuario', { count: 'exact', head: true })
            .neq('tipo_usuario', 'admin');

        const { data: moedaData } = await supabase
            .from('moeda')
            .select('quantidade')
            .eq('tipo_movimento', 'SAIDA');

        const totalMoedasDoadas = moedaData
            ? moedaData.reduce((sum, m) => sum + parseFloat(m.quantidade), 0)
            : 0;

        return {
            ...metricas,
            totalUsuarios: totalUsuarios || 0,
            totalMoedasDoadas
        };
    }

    async #calcularMetricas(userId, periodo) {
        let query = supabase
            .from('atividade')
            .select(`
                id_atividade,
                distancia,
                dt_registro,
                transport_type,
                emissao_co2 (quantidade_co2)
            `);

        if (userId) {
            query = query.eq('id_usuario', userId);
        }

        const { data: rows, error } = await query;

        if (error) {
            console.error('Supabase #calcularMetricas error:', error);
        }

        if (!rows) {
            return {
                totalCO2: 0,
                totalActivities: 0,
                co2ByTransport: { bicicleta: 0, caminhada: 0, transportePublico: 0, carroEletrico: 0 }
            };
        }

        const now = new Date();
        const startDate = new Date();

        if (periodo === 'today') startDate.setHours(0, 0, 0, 0);
        else if (periodo === 'week') startDate.setDate(now.getDate() - 7);
        else if (periodo === 'month') startDate.setMonth(now.getMonth() - 1);
        else if (periodo === 'year') startDate.setFullYear(now.getFullYear(), 0, 1);

        const filtered = rows.filter(a => {
            if (periodo === 'total') return true;
            const activityDate = new Date(a.dt_registro + 'T12:00:00');
            return activityDate >= startDate;
        });

        const co2ByTransport = { bicicleta: 0, caminhada: 0, transportePublico: 0, carroEletrico: 0 };
        let totalCO2 = 0;

        filtered.forEach(a => {
            const co2Data = a.emissao_co2;
            const co2 = parseFloat(
                Array.isArray(co2Data) ? co2Data[0]?.quantidade_co2 : co2Data?.quantidade_co2
            ) || 0;
            const dist = parseFloat(a.distancia);
            totalCO2 += co2;
            const transport = a.transport_type || this.#inferirTransporte(co2, dist);
            co2ByTransport[transport] += co2;
        });

        return { totalCO2, totalActivities: filtered.length, co2ByTransport };
    }

    async listarUsuarios() {
        if (!this.isAdmin()) return [];

        const { data: rows } = await supabase
            .from('usuario')
            .select('*')
            .order('nome');

        if (!rows) return [];

        return rows.map(u => ({
            id: u.id_usuario,
            name: u.nome,
            email: u.email,
            type: u.tipo_usuario,
            coins: parseFloat(u.qtd_moeda || 0),
            status: u.status,
            data_cadastro: u.data_cadastro
        }));
    }

    async adicionarUsuario(nome, email, senha, tipo) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (tipo === 'admin') return { success: false, message: 'Não é permitido criar administradores.' };

        const { data: { session: savedSession } } = await supabase.auth.getSession();

        const result = await this.cadastrar(nome, email, senha, tipo, false);

        if (savedSession) {
            await supabase.auth.setSession({
                access_token: savedSession.access_token,
                refresh_token: savedSession.refresh_token
            });
        }

        return result;
    }

    async editarUsuario(emailOriginal, dados) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };

        if (dados.type === 'admin') return { success: false, message: 'Não é permitido alterar tipo para administrador.' };

        const updates = {};
        if (dados.name !== undefined && dados.name !== null) updates.nome = dados.name;
        if (dados.email !== undefined && dados.email !== null) updates.email = dados.email;
        if (dados.type) updates.tipo_usuario = dados.type;
        if (dados.coins !== undefined) {
            if (typeof dados.coins !== 'number' || isNaN(dados.coins) || dados.coins < 0) {
                return { success: false, message: 'Valor de moedas inválido.' };
            }
            updates.qtd_moeda = dados.coins;
        }

        if (dados.email && dados.email !== emailOriginal) {
            await supabase.auth.updateUser({ email: dados.email });
        }

        const { error } = await supabase
            .from('usuario')
            .update(updates)
            .eq('email', emailOriginal);

        if (error) return { success: false, message: 'Erro ao atualizar usuário.' };
        return { success: true, message: 'Usuário atualizado.' };
    }

    async deletarUsuario(email) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };

        // Cascade: deletar filhos antes do pai
        const { data: user } = await supabase.from('usuario').select('id_usuario').eq('email', email).single();
        if (!user) return { success: false, message: 'Usuário não encontrado.' };

        const uid = user.id_usuario;

        const { data: resgates } = await supabase.from('resgate').select('id_resgate').eq('id_usuario', uid);
        const rids = (resgates || []).map(r => r.id_resgate);
        if (rids.length) {
            await supabase.from('voucher').delete().in('id_resgate', rids);
            await supabase.from('moeda').delete().in('id_resgate', rids);
        }
        await supabase.from('moeda').delete().eq('id_usuario', uid);
        await supabase.from('resgate').delete().eq('id_usuario', uid);

        const { data: atividades } = await supabase.from('atividade').select('id_atividade').eq('id_usuario', uid);
        const aids = (atividades || []).map(a => a.id_atividade);
        if (aids.length) {
            const { data: emissoes } = await supabase.from('emissao_co2').select('id_emissao').in('id_atividade', aids);
            const eids = (emissoes || []).map(e => e.id_emissao);
            if (eids.length) await supabase.from('conversao_moedas').delete().in('id_emissao', eids);
            await supabase.from('emissao_co2').delete().in('id_atividade', aids);
            await supabase.from('atividade').delete().eq('id_usuario', uid);
        }

        const { error } = await supabase.from('usuario').delete().eq('id_usuario', uid);
        if (error) return { success: false, message: 'Erro ao excluir usuário.' };
        return { success: true, message: 'Usuário excluído.' };
    }

    async listarParceiros() {
        if (!this.isAdmin()) return [];

        const { data: rows } = await supabase
            .from('parceiro')
            .select('*')
            .order('nome');

        return rows || [];
    }

    async adicionarParceiro(nome, cnpj) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (!cnpj?.trim()) return { success: false, message: 'CNPJ é obrigatório.' };

        const { data, error } = await supabase
            .from('parceiro')
            .insert({ nome, cnpj })
            .select()
            .single();

        if (error) return { success: false, message: 'Erro ao adicionar parceiro.' };
        return { success: true, message: `Parceiro ${nome} adicionado.` };
    }

    async deletarParceiro(id) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };

        await supabase.from('beneficio').delete().eq('id_parceiro', id);

        const { error } = await supabase
            .from('parceiro')
            .delete()
            .eq('id_parceiro', id);

        if (error) return { success: false, message: 'Erro ao excluir parceiro.' };
        return { success: true, message: 'Parceiro excluído.' };
    }

    async editarParceiro(id, nome, cnpj) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (!nome?.trim()) return { success: false, message: 'Nome é obrigatório.' };
        if (!cnpj?.trim()) return { success: false, message: 'CNPJ é obrigatório.' };

        const { error } = await supabase
            .from('parceiro')
            .update({ nome, cnpj })
            .eq('id_parceiro', id);

        if (error) return { success: false, message: 'Erro ao atualizar parceiro.' };
        return { success: true, message: `Parceiro "${nome}" atualizado.` };
    }

    async adicionarBeneficio(nome, custo, estoque, parceiroId, imagem, publicoAlvo) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (!nome || typeof custo !== 'number' || isNaN(custo) || custo <= 0) {
            return { success: false, message: 'Custo inválido.' };
        }
        if (typeof estoque !== 'number' || isNaN(estoque) || estoque < 0) {
            return { success: false, message: 'Estoque inválido.' };
        }

        let parceiro = parceiroId;
        if (!parceiro) {
            const { data: firstPartner } = await supabase.from('parceiro').select('id_parceiro').limit(1).maybeSingle();
            parceiro = firstPartner?.id_parceiro;
        }
        if (!parceiro) return { success: false, message: 'Nenhum parceiro cadastrado.' };

        const insertData = {
            id_parceiro: parceiro,
            nome,
            valor_moedas: custo,
            estoque,
            descricao: imagem || ''
        };
        if (Array.isArray(publicoAlvo) && publicoAlvo.length) {
            insertData.publico_alvo = publicoAlvo;
        }

        const { data, error } = await supabase
            .from('beneficio')
            .insert(insertData)
            .select()
            .single();

        if (error) return { success: false, message: 'Erro ao adicionar benefício.' };

        if (imagem) this.#benefitEmojis[nome] = imagem;

        return { success: true, message: `Benefício "${nome}" adicionado.` };
    }

    async atualizarEstoqueBeneficio(id, novoEstoque) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (typeof novoEstoque !== 'number' || isNaN(novoEstoque) || novoEstoque < 0) {
            return { success: false, message: 'Valor de estoque inválido.' };
        }

        const { error } = await supabase
            .from('beneficio')
            .update({ estoque: novoEstoque })
            .eq('id_beneficio', id);

        if (error) return { success: false, message: 'Erro ao atualizar estoque.' };
        return { success: true, message: 'Estoque atualizado.' };
    }

    async deletarBeneficio(id) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };

        const { data: resgates } = await supabase.from('resgate').select('id_resgate').eq('id_beneficio', id);
        const rids = (resgates || []).map(r => r.id_resgate);
        if (rids.length) {
            await supabase.from('voucher').delete().in('id_resgate', rids);
            await supabase.from('moeda').delete().in('id_resgate', rids);
            await supabase.from('resgate').delete().in('id_resgate', rids);
        }

        const { error } = await supabase
            .from('beneficio')
            .delete()
            .eq('id_beneficio', id);

        if (error) return { success: false, message: 'Erro ao excluir benefício.' };
        return { success: true, message: 'Benefício excluído.' };
    }

    async editarBeneficio(id, nome, custo, estoque, publicoAlvo) {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };
        if (!nome?.trim()) return { success: false, message: 'Nome é obrigatório.' };
        if (typeof custo !== 'number' || isNaN(custo) || custo <= 0) {
            return { success: false, message: 'Custo inválido.' };
        }
        if (typeof estoque !== 'number' || isNaN(estoque) || estoque < 0) {
            return { success: false, message: 'Estoque inválido.' };
        }

        const updates = { nome, valor_moedas: custo, estoque };
        if (Array.isArray(publicoAlvo)) updates.publico_alvo = publicoAlvo;

        const { error } = await supabase
            .from('beneficio')
            .update(updates)
            .eq('id_beneficio', id);

        if (error) return { success: false, message: 'Erro ao atualizar benefício.' };
        if (nome) this.#benefitEmojis[nome] = this.#benefitEmojis[nome] || '🎁';
        return { success: true, message: `Benefício "${nome}" atualizado.` };
    }

    async deletarTodosUsuarios() {
        if (!this.isAdmin()) return { success: false, message: 'Acesso negado.' };

        const { data: usuarios } = await supabase
            .from('usuario')
            .select('id_usuario')
            .neq('tipo_usuario', 'admin');

        const ids = (usuarios || []).map(u => u.id_usuario);
        if (!ids.length) return { success: true, message: 'Nenhum usuário para excluir.' };

        // Deletar em ordem de FK (filhos primeiro)
        const { data: resgates } = await supabase.from('resgate').select('id_resgate').in('id_usuario', ids);
        const resgateIds = (resgates || []).map(r => r.id_resgate);
        if (resgateIds.length) {
            await supabase.from('voucher').delete().in('id_resgate', resgateIds);
            await supabase.from('moeda').delete().in('id_resgate', resgateIds);
        }
        await supabase.from('moeda').delete().in('id_usuario', ids);
        await supabase.from('resgate').delete().in('id_usuario', ids);

        const { data: atividades } = await supabase.from('atividade').select('id_atividade').in('id_usuario', ids);
        const ativIds = (atividades || []).map(a => a.id_atividade);
        if (ativIds.length) {
            const { data: emissoes } = await supabase.from('emissao_co2').select('id_emissao').in('id_atividade', ativIds);
            const emissIds = (emissoes || []).map(e => e.id_emissao);
            if (emissIds.length) await supabase.from('conversao_moedas').delete().in('id_emissao', emissIds);
            await supabase.from('emissao_co2').delete().in('id_atividade', ativIds);
            await supabase.from('atividade').delete().in('id_usuario', ids);
        }

        const { error } = await supabase
            .from('usuario')
            .delete()
            .neq('tipo_usuario', 'admin');

        if (error) return { success: false, message: 'Erro ao excluir usuários.' };

        return { success: true, message: 'Todos os usuários foram excluídos.' };
    }

    // ─────── FASE 4 ───────

    async getRanking() {
        const { data } = await supabase
            .from('usuario')
            .select('id_usuario, nome, email, qtd_moeda, tipo_usuario')
            .neq('tipo_usuario', 'admin')
            .order('qtd_moeda', { ascending: false })
            .limit(20);
        return (data || []).map((u, i) => ({
            posicao: i + 1,
            nome: u.nome,
            email: u.email,
            tipo: u.tipo_usuario,
            moedas: parseFloat(u.qtd_moeda || 0),
        }));
    }

    async getMissoes() {
        if (!this.currentUser) return [];
        const uid = this.currentUser.id;
        const hoje = new Date().toISOString().split('T')[0];
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];

        const { data: atividades } = await supabase
            .from('atividade')
            .select('distancia, dt_registro, emissao_co2(quantidade_co2)')
            .eq('id_usuario', uid)
            .gte('dt_registro', inicioSemanaStr);

        const atividadesHoje = (atividades || []).filter(a => a.dt_registro === hoje);
        const kmHoje = atividadesHoje.reduce((s, a) => s + parseFloat(a.distancia || 0), 0);
        const kmSemana = (atividades || []).reduce((s, a) => s + parseFloat(a.distancia || 0), 0);
        const totalAtividades = atividades?.length || 0;
        const atividadesHojeCount = atividadesHoje.length;

        const missoes = [
            {
                id: 'daily_walk',
                titulo: '🚶 Caminhada do Dia',
                descricao: 'Registre pelo menos 2 km hoje',
                progresso: Math.min(kmHoje, 2),
                alvo: 2,
                recompensa: 2,
                tipo: 'diaria',
                concluida: kmHoje >= 2,
            },
            {
                id: 'daily_transport',
                titulo: '🌱 Transporte Sustentável',
                descricao: 'Registre 1 atividade hoje',
                progresso: Math.min(atividadesHojeCount, 1),
                alvo: 1,
                recompensa: 1,
                tipo: 'diaria',
                concluida: atividadesHojeCount >= 1,
            },
            {
                id: 'weekly_km',
                titulo: '📏 Desafio Semanal',
                descricao: 'Percorra 10 km esta semana',
                progresso: Math.min(kmSemana, 10),
                alvo: 10,
                recompensa: 5,
                tipo: 'semanal',
                concluida: kmSemana >= 10,
            },
            {
                id: 'weekly_eco',
                titulo: '♻️ Eco Semana',
                descricao: 'Registre 5 atividades esta semana',
                progresso: Math.min(totalAtividades, 5),
                alvo: 5,
                recompensa: 3,
                tipo: 'semanal',
                concluida: totalAtividades >= 5,
            },
        ];
        return missoes;
    }

    async getMedalhas() {
        if (!this.currentUser) return [];
        const uid = this.currentUser.id;

        const { data: atividades } = await supabase
            .from('atividade')
            .select('distancia, emissao_co2(quantidade_co2, conversao_moedas(quantidade_moeda))')
            .eq('id_usuario', uid);

        const totalKm = (atividades || []).reduce((s, a) => s + parseFloat(a.distancia || 0), 0);
        const totalCo2 = (atividades || []).reduce((s, a) => s + parseFloat(a.emissao_co2?.[0]?.quantidade_co2 || 0), 0);
        const totalMoedas = (atividades || []).reduce((s, a) => s + parseFloat(a.emissao_co2?.[0]?.conversao_moedas?.[0]?.quantidade_moeda || 0), 0);
        const totalAtividades = atividades?.length || 0;

        const { data: ranking } = await supabase
            .from('usuario')
            .select('id_usuario, qtd_moeda')
            .order('qtd_moeda', { ascending: false });
        const posicao = (ranking || []).findIndex(u => u.id_usuario === uid) + 1;

        const medalhas = [
            { id: 'first_km', nome: '🥇 Primeiro Passo', descricao: 'Percorra 1 km', icone: '🥇', desbloqueada: totalKm >= 1 },
            { id: 'ten_km', nome: '🏃 10 km', descricao: 'Percorra 10 km no total', icone: '🏃', desbloqueada: totalKm >= 10 },
            { id: 'fifty_km', nome: '🚀 50 km', descricao: 'Percorra 50 km no total', icone: '🚀', desbloqueada: totalKm >= 50 },
            { id: 'hundred_km', nome: '💯 100 km', descricao: 'Percorra 100 km no total', icone: '💯', desbloqueada: totalKm >= 100 },
            { id: 'first_activity', nome: '🌱 Primeira Atividade', descricao: 'Registre sua 1ª atividade', icone: '🌱', desbloqueada: totalAtividades >= 1 },
            { id: 'ten_activities', nome: '📋 10 Atividades', descricao: 'Registre 10 atividades', icone: '📋', desbloqueada: totalAtividades >= 10 },
            { id: 'fifty_activities', nome: '🔥 50 Atividades', descricao: 'Registre 50 atividades', icone: '🔥', desbloqueada: totalAtividades >= 50 },
            { id: 'top_ten', nome: '🏆 Top 10', descricao: 'Esteja entre os 10 com mais moedas', icone: '🏆', desbloqueada: posicao > 0 && posicao <= 10 },
            { id: 'top_three', nome: '🥉 Top 3', descricao: 'Esteja entre os 3 com mais moedas', icone: '🥉', desbloqueada: posicao > 0 && posicao <= 3 },
            { id: 'first_place', nome: '👑 Primeiro Lugar', descricao: 'Seja o nº 1 no ranking', icone: '👑', desbloqueada: posicao === 1 },
            { id: 'co2_ten', nome: '🌳 10 kg CO₂', descricao: 'Reduza 10 kg de CO₂', icone: '🌳', desbloqueada: totalCo2 >= 10 },
            { id: 'co2_fifty', nome: '🌲 50 kg CO₂', descricao: 'Reduza 50 kg de CO₂', icone: '🌲', desbloqueada: totalCo2 >= 50 },
        ];
        return medalhas;
    }

    async getNotificacoes() {
        if (!this.currentUser) return [];
        const { data } = await supabase
            .from('notificacao')
            .select('*')
            .eq('id_usuario', this.currentUser.id)
            .order('dt_criacao', { ascending: false })
            .limit(50);
        return (data || []).map(n => ({
            id: n.id_notificacao,
            mensagem: n.mensagem,
            tipo: n.tipo,
            lida: n.lida,
            data: n.dt_criacao,
        }));
    }

    async getNotificacoesNaoLidas() {
        if (!this.currentUser) return 0;
        const { data } = await supabase
            .from('notificacao')
            .select('id_notificacao', { count: 'exact' })
            .eq('id_usuario', this.currentUser.id)
            .eq('lida', false);
        return data?.length || 0;
    }

    async marcarNotificacaoLida(id) {
        if (!this.currentUser) return false;
        const { error } = await supabase
            .from('notificacao')
            .update({ lida: true })
            .eq('id_notificacao', id);
        return !error;
    }

    async #criarNotificacao(usuarioId, mensagem, tipo = 'info') {
        const { error } = await supabase
            .from('notificacao')
            .insert({ id_usuario: usuarioId, mensagem, tipo, lida: false, dt_criacao: new Date().toISOString() });
        return !error;
    }

    async verificarMoedasExpiradas() {
        if (!this.currentUser) return 0;
        const dozeMesesAtras = new Date();
        dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 12);
        const limite = dozeMesesAtras.toISOString().split('T')[0];

        const { data: moedas } = await supabase
            .from('moeda')
            .select('id_moeda, quantidade')
            .eq('id_usuario', this.currentUser.id)
            .eq('tipo_movimento', 'ENTRADA')
            .lt('dt_movimento', limite)
            .is('id_resgate', null);

        if (!moedas?.length) return 0;

        const total = moedas.reduce((s, m) => s + parseFloat(m.quantidade || 0), 0);
        const ids = moedas.map(m => m.id_moeda);

        await supabase.from('moeda').update({ tipo_movimento: 'EXPIRADO' }).in('id_moeda', ids);
        const saldoAtual = await this.getSaldoUsuario();
        const novoSaldo = Math.max(0, saldoAtual - total);

        await supabase
            .from('usuario')
            .update({ qtd_moeda: novoSaldo })
            .eq('id_usuario', this.currentUser.id);

        if (this.currentUser) this.currentUser.coins = novoSaldo;
        this.#criarNotificacao(this.currentUser.id, `💸 ${total.toFixed(2)} moedas expiraram por inatividade de 12 meses.`, 'alerta');

        return total;
    }

    async enviarMensagem(destinoEmail, assunto, conteudo) {
        if (!this.currentUser) return { success: false, message: 'Faça login primeiro.' };

        const { data: destino } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', destinoEmail)
            .maybeSingle();

        if (!destino) return { success: false, message: 'Usuário destino não encontrado.' };

        const { error } = await supabase
            .from('mensagem')
            .insert({
                id_remetente: this.currentUser.id,
                id_destinatario: destino.id_usuario,
                assunto,
                conteudo,
                lida: false,
                dt_envio: new Date().toISOString(),
            });

        if (error) return { success: false, message: 'Erro ao enviar mensagem.' };

        this.#criarNotificacao(destino.id_usuario, `✉️ Nova mensagem: "${assunto}" de ${this.currentUser.email}`, 'mensagem');
        return { success: true, message: 'Mensagem enviada.' };
    }

    async getMensagensRecebidas() {
        if (!this.currentUser) return [];
        const { data } = await supabase
            .from('mensagem')
            .select('*, remetente:usuario!id_remetente(email, nome)')
            .eq('id_destinatario', this.currentUser.id)
            .order('dt_envio', { ascending: false })
            .limit(50);

        return (data || []).map(m => ({
            id: m.id_mensagem,
            remetente: m.remetente?.nome || m.remetente?.email || 'Desconhecido',
            emailRemetente: m.remetente?.email || '',
            assunto: m.assunto,
            conteudo: m.conteudo,
            lida: m.lida,
            data: m.dt_envio,
        }));
    }

    async getMensagensEnviadas() {
        if (!this.currentUser) return [];
        const { data } = await supabase
            .from('mensagem')
            .select('*, destinatario:usuario!id_destinatario(email, nome)')
            .eq('id_remetente', this.currentUser.id)
            .order('dt_envio', { ascending: false })
            .limit(50);

        return (data || []).map(m => ({
            id: m.id_mensagem,
            destinatario: m.destinatario?.nome || m.destinatario?.email || 'Desconhecido',
            emailDestinatario: m.destinatario?.email || '',
            assunto: m.assunto,
            conteudo: m.conteudo,
            lida: m.lida,
            data: m.dt_envio,
        }));
    }

    async marcarMensagemLida(id) {
        if (!this.currentUser) return false;
        const { error } = await supabase
            .from('mensagem')
            .update({ lida: true })
            .eq('id_mensagem', id);
        return !error;
    }

    async getMensagensNaoLidas() {
        if (!this.currentUser) return 0;
        const { data } = await supabase
            .from('mensagem')
            .select('id_mensagem')
            .eq('id_destinatario', this.currentUser.id)
            .eq('lida', false);
        return data?.length || 0;
    }

    async getCreditosParceiro() {
        const { data: resgates } = await supabase
            .from('resgate')
            .select('id_parceiro, moedas_usadas, parceiro:parceiro!inner(nome)');

        const creditoMap = {};
        (resgates || []).forEach(r => {
            const pid = r.id_parceiro;
            if (!creditoMap[pid]) creditoMap[pid] = { nome: r.parceiro?.nome || `Parceiro #${pid}`, totalResgates: 0, totalMoedas: 0 };
            creditoMap[pid].totalResgates++;
            creditoMap[pid].totalMoedas += parseFloat(r.moedas_usadas || 0);
        });

        return Object.entries(creditoMap).map(([id, v]) => ({ id: parseInt(id), ...v }));
    }

    async getDesafios() {
        if (!this.currentUser) return [];
        const uid = this.currentUser.id;
        const hoje = new Date().toISOString().split('T')[0];
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const inicioMesStr = inicioMes.toISOString().split('T')[0];

        const { data: atividades } = await supabase
            .from('atividade')
            .select('distancia, transport_type, dt_registro, emissao_co2(quantidade_co2)')
            .eq('id_usuario', uid)
            .gte('dt_registro', inicioMesStr);

        const kmMes = (atividades || []).reduce((s, a) => s + parseFloat(a.distancia || 0), 0);
        const co2Mes = (atividades || []).reduce((s, a) => s + parseFloat(a.emissao_co2?.[0]?.quantidade_co2 || 0), 0);
        const countBike = (atividades || []).filter(a => a.transport_type === 'bicicleta').length;
        const countWalk = (atividades || []).filter(a => a.transport_type === 'caminhada').length;
        const countBus = (atividades || []).filter(a => a.transport_type === 'transportePublico').length;
        const countCar = (atividades || []).filter(a => a.transport_type === 'carroEletrico').length;

        const desafios = [
            {
                id: 'month_30km',
                titulo: '🏅 30 km no Mês',
                descricao: 'Percorra 30 km neste mês',
                progresso: Math.min(kmMes, 30),
                alvo: 30,
                recompensa: 10,
                concluido: kmMes >= 30,
            },
            {
                id: 'month_bike_10',
                titulo: '🚲 Ciclista Dedicado',
                descricao: 'Use bicicleta 10 vezes no mês',
                progresso: Math.min(countBike, 10),
                alvo: 10,
                recompensa: 8,
                concluido: countBike >= 10,
            },
            {
                id: 'month_walk_10',
                titulo: '🚶 Pedestre Fiel',
                descricao: 'Caminhe 10 vezes no mês',
                progresso: Math.min(countWalk, 10),
                alvo: 10,
                recompensa: 8,
                concluido: countWalk >= 10,
            },
            {
                id: 'month_bus_5',
                titulo: '🚌 Ônibus Amigo',
                descricao: 'Use transporte público 5 vezes no mês',
                progresso: Math.min(countBus, 5),
                alvo: 5,
                recompensa: 5,
                concluido: countBus >= 5,
            },
            {
                id: 'month_co2_20',
                titulo: '🌿 Redução de CO₂',
                descricao: 'Reduza 20 kg de CO₂ no mês',
                progresso: Math.min(co2Mes, 20),
                alvo: 20,
                recompensa: 10,
                concluido: co2Mes >= 20,
            },
        ];
        return desafios;
    }
}
