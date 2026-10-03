# 🌱 ECOFUTURO ESUDA

## Sobre o Projeto

O **ECOFUTURO ESUDA** é uma aplicação web de sustentabilidade que incentiva o uso de transportes ecológicos, recompensando os usuários com **moedas virtuais** que podem ser trocadas por benefícios reais oferecidos por parceiros da Faculdade ESUDA.

A proposta é transformar práticas sustentáveis do dia a dia — como andar de bicicleta, caminhar ou usar transporte público — em recompensas tangíveis, criando um ciclo de engajamento ambiental positivo.

---

## Arquitetura e Padrões de Projeto

A aplicação utiliza **4 padrões de projeto** (GoF) na sua estrutura:

### 🔹 Singleton — `SistemaEcofuturo`

O **Singleton** garante que exista apenas **uma única instância** da classe `SistemaEcofuturo` durante toda a execução da aplicação. Toda a lógica de negócio, estado dos usuários e regras de pontuação são gerenciados por essa instância única.

- Conecta-se ao **Supabase** (PostgreSQL) para persistência de dados
- Contém métodos para autenticação, registro de atividades, gerenciamento de vouchers, transferências, missões, ranking, medalhas, notificações e administração
- Utiliza consultas assíncronas (`async/await`) com o cliente Supabase JS

### 🔹 Facade — `EcofuturoFacade`

A **Facade** fornece uma interface simplificada entre a camada de UI (`app.js`) e o Singleton (`SistemaEcofuturo`). A camada de apresentação **nunca** acessa o Singleton diretamente — sempre passa pela Facade.

- Todos os métodos são `static`, facilitando o uso direto sem instanciação
- Delega cada chamada ao Singleton via `SistemaEcofuturo.getInstance()`
- Centraliza o ponto de acesso, tornando a manutenção mais simples

### 🔹 Strategy — `strategies/`

O **Strategy** encapsula diferentes algoritmos de cálculo de moedas e CO₂ em classes separadas, eliminando `switch`/`if` na lógica de negócio:

| Classe | Moedas/km | kg CO₂/km |
|---|---|---|
| `BicicletaStrategy` | 0.5 | 0.20 |
| `CaminhadaStrategy` | 0.4 | 0.15 |
| `TransportePublicoStrategy` | 0.3 | 0.10 |
| `CarroEletricoStrategy` | 0.2 | 0.05 |

### 🔹 Observer — `observers/`

O **Observer** desacopla as notificações visuais da lógica de negócio. Quando moedas são ganhas, resgates feitos ou vouchers expiram, o sistema dispara eventos para todos os observers registrados:

- `ToastObserver` — Exibe notificações toast no canto inferior direito
- `CoinAnimationObserver` — Mostra animação flutuante de moedas ganhas

### Fluxo de Dados

```
┌──────────┐      ┌──────────────────┐      ┌────────────────────┐      ┌──────────┐
│  app.js  │ ───▶ │ EcofuturoFacade  │ ───▶ │ SistemaEcofuturo   │ ───▶ │ Supabase │
│   (UI)   │      │   (Interface)    │      │   (Singleton)      │      │   (DB)   │
└──────────┘      └──────────────────┘      └────────────────────┘      └──────────┘
                                                       │
                                               ┌───────┴───────┐
                                               ▼               ▼
                                         strategies/      observers/
                                         (Strategy)       (Observer)
```

---

## Estrutura de Arquivos

```
ecofuturo/
├── index.html                  → SPA base (auth modal, headers, containers)
├── styles.css                  → Estilos globais (~370 linhas)
├── SistemaEcofuturo.js         → Singleton — lógica de negócio + queries Supabase (~1500 linhas)
├── EcofuturoFacade.js          → Facade — interface simplificada para a UI
├── app.js                      → Camada de UI — SPA com loadPage(), event delegation (~920 linhas)
├── server.js                   → Servidor HTTP local (porta 8080, ES modules)
├── supabase-config.js          → Configuração do cliente Supabase
├── package.json                → Dependências (Vitest, jsdom)
├── vitest.config.js            → Configuração do Vitest
├── strategies/                 → Strategy Pattern (cálculo de moedas/CO₂)
│   ├── TransportStrategy.js    → Classe base abstrata
│   ├── BicicletaStrategy.js
│   ├── CaminhadaStrategy.js
│   ├── TransportePublicoStrategy.js
│   └── CarroEletricoStrategy.js
├── observers/                  → Observer Pattern (notificações visuais)
│   ├── Observer.js             → Interface base
│   ├── ToastObserver.js        → Notificações toast
│   └── CoinAnimationObserver.js → Animação de moedas
├── pages/                      → Páginas carregadas dinamicamente via fetch()
│   ├── landing.html            → Página inicial (público)
│   ├── dashboard.html          → Dashboard do usuário
│   ├── catalog.html            → Catálogo de benefícios
│   ├── resgate.html            → Meus resgates / vouchers / transferências
│   ├── reports.html            → Relatórios pessoais e da comunidade
│   ├── ranking.html            → Ranking de usuários
│   ├── missoes.html            → Missões, medalhas e desafios
│   ├── notificacoes.html       → Notificações e mensagens
│   ├── admin-users.html        → Gerenciar usuários (admin)
│   └── admin-partners.html     → Gerenciar parceiros e benefícios (admin)
├── tests/                      → Testes unitários (Vitest + jsdom)
│   ├── setup.js                → Mock do Supabase com fila de respostas
│   ├── strategies.test.js      → 24 testes (4 estratégias × 6 cenários)
│   ├── observers.test.js       → 14 testes (Toast + CoinAnimation)
│   ├── SistemaEcofuturo.test.js→ 119 testes (Singleton, login, CRUD, Fase 3, Fase 4)
│   ├── EcofuturoFacade.test.js → 10 testes (delegação da Facade)
│   └── smoke.test.js           → 6 testes (importação de módulos)
├── EcoFuturoEsuda.html         → Backup do monolítico original (não usado)
└── README.md                   → Este arquivo
```

---

## Tecnologias Utilizadas

- **HTML5** — Estrutura da página (SPA com páginas carregadas via fetch)
- **TailwindCSS (CDN)** — Estilização utilitária
- **CSS customizado (styles.css)** — Animações, glassmorphism e estilos complementares
- **JavaScript (ES Modules)** — Singleton + Facade + Strategy + Observer + SPA com event delegation
- **Supabase** — Banco de dados PostgreSQL + Autenticação (email/senha, confirmação desativada)
- **Chart.js** — Gráficos de relatórios
- **Google Fonts (Inter)** — Tipografia
- **Vitest + jsdom** — Testes unitários

---

## Funcionalidades

### 👤 Para Usuários Comuns

| Funcionalidade | Descrição |
|---|---|
| **Cadastro e Login** | Criação de conta com nome, e-mail, senha e tipo (aluno, professor, funcionário, comunidade externa) |
| **Registro de Atividades** | Registro de deslocamentos sustentáveis com tipo de transporte, distância, duração e data |
| **Ganho de Moedas** | Moedas calculadas automaticamente com base no transporte e distância |
| **Catálogo de Benefícios** | Visualização e reserva de recompensas (EcoBag, café, ingressos, descontos, etc.) |
| **Vouchers** | Ciclo completo: reservar → usar → cancelar, com geração de QR Code |
| **Relatórios Pessoais** | CO₂ reduzido e total de atividades, com filtro por período |
| **Relatórios da Comunidade** | Impacto coletivo com gráficos (Chart.js) |
| **Transferir Moedas** | Envio de moedas entre usuários |
| **Ranking** | Ranqueamento de usuários por moedas acumuladas |
| **Missões Diárias e Semanais** | Missões com barra de progresso e recompensas em moedas |
| **Medalhas** | 12 achievements por marcos (km, atividades, CO₂, posição no ranking) |
| **Desafios Mensais** | 5 desafios por tipo de transporte |
| **Notificações** | Central de notificações do sistema |
| **Mensagens** | Caixa de entrada com mensagens de outros usuários |

### 🛡️ Para Administradores

| Funcionalidade | Descrição |
|---|---|
| **Gerenciar Usuários** | Adicionar, editar, excluir usuários |
| **Gerenciar Parceiros** | Adicionar e remover empresas parceiras |
| **Gerenciar Benefícios** | Adicionar, excluir benefícios e atualizar estoques |
| **Relatório de Resgates** | Visão geral de todos os resgates realizados |

### ⏰ Expiração de Moedas

Moedas não utilizadas por **12 meses consecutivos** são automaticamente expiradas durante o login, com notificação ao usuário.

---

## Sistema de Moedas

As moedas são ganhas por quilômetro percorrido usando transportes sustentáveis:

| Transporte | Moedas/km |
|---|---|
| 🚲 Bicicleta | 0.5 |
| 🚶 Caminhada | 0.4 |
| 🚌 Transporte Público | 0.3 |
| ⚡ Carro Elétrico | 0.2 |

## Cálculo de CO₂ Reduzido

O impacto ambiental é calculado com base nos seguintes fatores de redução por km:

| Transporte | kg CO₂/km |
|---|---|
| 🚲 Bicicleta | 0.20 |
| 🚶 Caminhada | 0.15 |
| 🚌 Transporte Público | 0.10 |
| ⚡ Carro Elétrico | 0.05 |

---

## Credenciais de Acesso

### Administrador
- **E-mail:** `admin@ecofuturo.com`
- **Senha:** `admin123`

### Usuários comuns
Novos usuários podem ser criados pela tela de cadastro ou pelo painel administrativo.

---

## 🌐 Deploy

Acesse a aplicação online: [**ecofuturoesuda.netlify.app**](https://ecofuturoesuda.netlify.app/)

---

## Como Executar (Local)

**Importante:** O sistema usa `type="module"` no JavaScript, que **não funciona** abrindo o arquivo diretamente (`file://`). É necessário um servidor HTTP.

1. **Com Node.js (recomendado):**
   ```bash
   node server.js
   ```
   O servidor escuta na porta `8080` e serve `index.html` como padrão, com proteção contra path traversal.

2. **Com npx:**
   ```bash
   npx http-server -p 8080
   ```

3. **Com VS Code:** Instalar a extensão "Live Server" e clicar "Go Live"

4. **Com Python:**
   ```bash
   python -m http.server 8080
   ```

5. Abrir no navegador: `http://localhost:8080`

---

## Executar Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage
```

---

## Banco de Dados (Supabase)

O projeto utiliza **Supabase** como backend:
- **Autenticação:** Supabase Auth (email/senha, confirmação de email desativada)
- **Banco:** PostgreSQL com tabelas: `usuario`, `parceiro`, `beneficio`, `atividade`, `emissao_co2`, `conversao_moedas`, `moeda`, `resgate`, `voucher`, `notificacao`, `mensagem`
- **RLS:** Liberado para todas as operações (anon key)
- **Trigger:** `on_resgate_insert` cria voucher + movimentação SAIDA na tabela `moeda`

A conexão é feita via `supabase-config.js` usando a anon key do projeto.

---

## Padrões Implementados (GoF)

| Padrão | Localização | Propósito |
|---|---|---|
| **Singleton** | `SistemaEcofuturo.js` | Instância única de lógica de negócio |
| **Facade** | `EcofuturoFacade.js` | Interface simplificada entre UI e lógica |
| **Strategy** | `strategies/` (5 classes) | Cálculo variável de moedas/CO₂ por transporte |
| **Observer** | `observers/` (3 classes) | Notificações visuais desacopladas |

## Testes

**173 testes unitários** distribuídos em 5 suites:

| Suite | Testes | O que cobre |
|---|---|---|
| `strategies.test.js` | 24 | 4 estratégias × 6 cenários (valores, zeros, negativos, etc.) |
| `observers.test.js` | 14 | ToastObserver, CoinAnimationObserver, interface Observer |
| `SistemaEcofuturo.test.js` | 119 | Singleton, login, cadastro, observer, atividades, benefícios, parceiros, vouchers, transferências, ranking, missões, medalhas, notificações, mensagens, expiração, CRUD |
| `EcofuturoFacade.test.js` | 10 | Delegação correta de todos os métodos da Facade |
| `smoke.test.js` | 6 | Importação sem erro de todos os módulos |

---

## Autores

**Igor Philipo / João Vinícius / Kamylle / Roseli** — Faculdade ESUDA
