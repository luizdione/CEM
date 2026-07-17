# REDDIT — plano de divulgação do CEM

Conta: **u/According-Author-953** (nova). Este guia assume uma conta **recém-criada** — o que muda
tudo, porque o Reddit é agressivo contra autopromoção de contas novas.

> ⚠️ **Antes de qualquer coisa, entenda o risco nº 1:** postar um link do seu projeto como
> **primeira atividade** de uma conta nova quase sempre resulta em **remoção automática pelo
> AutoModerator** (idade/karma mínimos) e pode levar a **shadowban** (você posta, ninguém vê, e o
> Reddit não te avisa). O jogo aqui é **paciência + participação genuína primeiro**.

---

## Fase 0 — Aquecer a conta (3 a 7 dias, obrigatório)

- Verifique o e-mail da conta; coloque avatar e uma bio curta (você já criou o perfil ✔).
- **Comente de verdade** em 5–10 threads/dia nos subreddits-alvo (responda dúvidas de Claude Code,
  compartilhe experiência). Meta: passar de ~**50–100 de comment karma** e **> 1 semana** de idade.
- **Regra 9:1** (diretriz de autopromoção do Reddit): para cada 1 post seu de divulgação, ~9
  contribuições que **não** são sobre o seu projeto. Não é literal, mas é a mentalidade que evita
  ser marcado como spammer.
- Não use encurtadores de link. Não poste o mesmo texto em vários subs. Um sub por dia, no máximo.

## Fase 1 — Escolher o subreddit certo (e LER as regras fixadas de cada um)

Ordem sugerida (do melhor encaixe para o mais amplo). **Leia as regras e o AutoMod de cada sub
antes** — muitos exigem karma/idade mínimos ou têm dia/flair específico para "I made this".

| Subreddit | Por que encaixa | Cuidado |
| --------- | --------------- | ------- |
| **r/ClaudeAI** | Público-alvo exato. | Regras de autopromoção; procure flair "Built with Claude"/showcase ou dia próprio. |
| **r/ClaudeCode** *(se existir/ativo)* | Ainda mais específico. | Comunidade menor; capriche na descrição técnica. |
| **r/selfhosted** | CEM é **local-first, sem nuvem, open source** → encaixe forte. | Exige ser realmente self-hostable e **incluir o código-fonte**. Sem SaaS. |
| **r/opensource** | Gostam de lançamentos FOSS. | Use "I made this"; foque em licença (MIT) e contribuição. |
| **r/coolgithubprojects** | Feito para divulgar repositórios. | Siga o formato exigido (linguagem, link do GitHub). |
| **r/SideProject** | Amigável a lançamentos. | Enquadre como projeto pessoal + pedido de feedback. |
| **r/commandline** | Ângulo da CLI `cem`. | Poste focando na CLI, não no app inteiro. |
| **r/electronjs** | Ângulo técnico (Electron + monorepo). | Poste sobre a construção, não como anúncio. |

**Evite** r/programming e subs enormes generalistas: autopromoção é removida na hora.

## Fase 2 — O post (formato que funciona no Reddit)

- **Título**: descreva o valor, sem clickbait. O Reddit premia "I built X que faz Y" e
  **pedidos de feedback**.
- **Corpo**: problema → o que é → features em bullets → **o ângulo compliance/open source**
  (preempta a objeção "isso fere o ToS / é seguro?") → mídia (GIF/vídeo) → link do GitHub →
  **peça feedback** de forma explícita.
- **Divulgue que você é o autor** ("I'm the dev"). Transparência evita punição.
- **Responda todos os comentários nas primeiras horas** — o algoritmo premia engajamento inicial.
- Cross-post depois, **nunca** simultâneo. Um sub por dia.

### Título — opções (EN)

1. `I built an open-source, local-first manager for your Claude Code environment (backups, token usage, diagnostics) — feedback welcome`
2. `[Open source] CEM: back up, restore and migrate your entire Claude Code setup from one local app`
3. `Made a compliance-first tool to back up & analyze your Claude Code environment — never touches Anthropic software`

### Corpo (EN) — pronto para colar

> **TL;DR:** CEM (Claude Environment Manager) is a free, open-source (MIT) desktop + CLI app that
> backs up, restores, manages and migrates your entire Claude Code environment — 100% locally.
> I'm the dev and I'd love feedback.
>
> **The problem.** Claude Code spreads your setup across a bunch of documented local files
> (`~/.claude/`, `~/.claude.json`, project `CLAUDE.md` / `.mcp.json`, skills, agents, MCP servers…).
> Moving machines — or just keeping it tidy — is tedious and error-prone.
>
> **What CEM does.**
> - 📊 Dashboard: health, counts, last backup, per-project token usage
> - 🔎 Read-only scanner for every Claude Code artifact
> - 📈 Token Usage over 24h/3d/7d/30d with concrete cleanup suggestions
> - 🩺 Diagnostics + one-click "Solve problems"
> - 💾 Encrypted (AES-256) `.cem` backups / selective restore with dry-run
> - 🔌 MCP manager (secrets masked)
>
> **Why you can trust it.** Compliance-first: CEM **never** modifies, patches or intercepts Claude
> Code or any Anthropic software. It only reads/writes your own documented local files. **Zero
> telemetry**, everything stays on your machine.
>
> MIT-licensed, Windows/macOS/Linux. Repo (with releases): **github.com/luizdione/CEM**
>
> What would you want it to back up or analyze that it doesn't yet?

### Corpo (PT) — para subs BR (ex.: r/brdev, se as regras permitirem)

> **TL;DR:** CEM (Claude Environment Manager) é um app open source (MIT), desktop + CLI, para
> **backup, restauração e migração** completa do seu ambiente do Claude Code — tudo local. Sou o
> dev e quero feedback.
>
> Claude Code espalha sua configuração por vários arquivos locais documentados (`~/.claude/`,
> `CLAUDE.md`, `.mcp.json`, skills, agents, MCPs…). O CEM acha tudo e empacota num arquivo `.cem`
> portátil, verificável e **criptografado (AES-256)**.
>
> Destaques: dashboard de saúde e uso de tokens, scanner read-only, análise temporal de tokens com
> sugestões de limpeza, diagnósticos com correção em um clique, restauração seletiva com dry-run,
> gerenciador de MCPs com segredos mascarados.
>
> **Compliance-first:** nunca modifica software da Anthropic, zero telemetria. Windows/macOS/Linux.
> → github.com/luizdione/CEM

## Fase 3 — Depois de postar

- Fique 1–2 h respondendo comentários. Agradeça críticas; anote pedidos de feature como issues.
- Se for bem recebido, **cross-post** para o próximo sub no dia seguinte (não no mesmo dia).
- Nunca peça upvote. Nunca vote com contas alternativas (ban na certa).

---

## Tutorial: como publicar o post (passo a passo)

Assets prontos: **CEM-demo-90s.gif** (2,8 MB), **CEM-demo-EN-90s.mp4** (90 s, 4,7 MB) e o texto
abaixo. Duas formas de postar — escolha uma:

### Opção A — Post de TEXTO com GIF (recomendada: mais contexto)

1. Aqueça a conta antes (Fase 0). Escolha o sub (comece por **r/ClaudeAI**) e leia as regras fixadas.
2. Em reddit.com, clique em **Create Post** → selecione a comunidade (r/ClaudeAI).
3. Aba **Text**. Cole um **Título** (opções abaixo).
4. No corpo, cole o texto do post (Fase 2). Com o editor rich-text aberto, **arraste o
   `CEM-demo-90s.gif` para dentro do corpo** — ele embeda e roda no feed.
5. Suba o **`CEM-demo-EN-90s.mp4`** no **YouTube (não listado)** e cole o link no corpo (o Reddit
   não embeda vídeo dentro de post de texto — só imagem/GIF).
6. Selecione a **flair** exigida (ex.: "Built with Claude"/"Project"), se houver.
7. **Post**. Fique 1–2 h respondendo comentários.

### Opção B — Post de VÍDEO (mais alcance visual, menos texto)

1. **Create Post** → comunidade → aba **Images & Video** → suba o **`CEM-demo-EN-90s.mp4`**
   (4,7 MB; o Reddit hospeda e dá autoplay no feed).
2. Título forte (o vídeo já mostra tudo). Como não há corpo, ponha o **link do GitHub no
   primeiro comentário** assim que publicar (e avise "source in the comments" no título/comentário).
3. Responda os comentários.

> **Título (EN) — escolha um:**
> - `I built an open-source, local-first manager for your Claude Code environment (backups, token usage, diagnostics) — feedback welcome`
> - `[Open source] CEM: back up, restore and migrate your entire Claude Code setup from one local app`
>
> **Corpo:** use o texto pronto da Fase 2 (EN) acima. Link: **github.com/luizdione/CEM**

---

## Checklist rápido

- [ ] Conta com e-mail verificado, avatar e bio
- [ ] 3–7 dias comentando de verdade nos subs-alvo (comment karma > ~50–100)
- [ ] Regras fixadas do sub-alvo lidas (karma/idade/flair/dia)
- [ ] GIF < 10 MB ou link do vídeo no YouTube pronto
- [ ] Post com título de valor + corpo + link do GitHub + pedido de feedback
- [ ] Disponível para responder comentários por 1–2 h após publicar
