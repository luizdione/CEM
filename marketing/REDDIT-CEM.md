# 🟠 Kit Reddit — CEM (u/According-Author-953)

## ⚠️ Leia primeiro: como não ser deletado pelo AutoModerator

Sua conta é **nova e sem karma** — e a maioria dos subreddits remove automaticamente
posts com link de contas assim. Plano de aquecimento (3–5 dias):

1. **Dias 1–3:** apenas **comente** de forma útil em threads de r/ClaudeAI (responda
   dúvidas sobre Claude Code que você sabe — você construiu uma ferramenta inteira, sabe muito).
   Meta: ~50–100 de karma de comentário. Nada de mencionar o CEM ainda.
2. **Dia 4–5:** primeiro post. Poste como **texto com vídeo embutido** (upload nativo do
   Reddit), não como link seco para o GitHub — link fica no corpo, no final.
3. **Regra de ouro do Reddit (9:1):** para cada post seu de divulgação, tenha ~9
   participações genuínas. Autopromoção pura = ban silencioso.
4. Sempre **declare que você é o autor** e que o projeto é open source e não oficial.
5. Responda **todos os comentários nas primeiras 2 horas** — o algoritmo recompensa isso.
6. Poste em horário de pico dos EUA: **terça a quinta, 9h–12h (horário de Brasília ≈ EST+1/2)**.

## Onde postar (nesta ordem, 1 subreddit por vez, com 2–3 dias de intervalo)

| Ordem | Subreddit | Por quê | Cuidado |
|-------|-----------|---------|---------|
| 1º | **r/ClaudeAI** | O público exato: usuários de Claude Code | Use flair de projeto/showcase se houver; leia as regras fixadas |
| 2º | **r/ClaudeCode** (se ativo) | Nicho perfeito | Comunidade menor, mesmo post adaptado |
| 3º | **r/SideProject** | Adora demos com vídeo | Foque na história ("construí com o próprio Claude Code") |
| 4º | **r/opensource** | Valoriza MIT + zero telemetria | Tom técnico, sem marketing |
| 5º | **r/coolgithubprojects** | Formato: título + link repo | Título deve conter a linguagem/stack |

---

## Post 1 — r/ClaudeAI (principal)

**Título (escolha um):**
- A) `I built CEM — an open-source app that backs up your entire Claude Code environment into one file (skills, agents, MCPs, CLAUDE.md) and restores it anywhere`
- B) `Tired of rebuilding my Claude Code setup on every machine, so I built an open-source backup/restore/migration manager for it`
- C) `CEM: back up, diagnose, and track token usage of your Claude Code environment — open source, 100% local`

**Corpo:**

> Moving my Claude Code setup between my desktop and laptop meant manually copying
> skills, subagents, MCP configs and CLAUDE.md files — and always forgetting something.
> So I built **CEM (Claude Environment Manager)**, and I'm releasing it as open source (MIT).
>
> **What it does:**
> - 🔍 Read-only scanner finds every artifact in the documented local files (`~/.claude`, `~/.claude.json`, project `CLAUDE.md` / `.mcp.json`…)
> - 📦 Packs everything into one portable `.cem` file — manifest, checksums, optional AES-256 encryption. Restore it on a new machine in a few clicks (all of it, or just the files you pick)
> - 🩺 Diagnostics that also **fix**: one click proposes the best fix per finding, you accept or ignore each one — with automatic backups and an audit log
> - 📊 Real token usage from your local transcripts (24h/3d/7d/30d, per session & project): context reading vs cache building vs output, git overhead, subagent share — plus improvement proposals you can export as a plan straight into Claude Code
> - 🔐 Zero telemetry. Everything stays on your machine. MCP secrets are masked in the UI
> - Windows / macOS / Linux installers + a full CLI
>
> **Compliance note, because it matters here:** CEM never modifies, intercepts or
> reverse-engineers Claude Code or any Anthropic software. It only reads/writes your own
> documented local files. Not affiliated with Anthropic. (Fun fact: it was built almost
> entirely *with* Claude Code.)
>
> Repo: https://github.com/luizdione/CEM_software
> Releases (installers): https://github.com/luizdione/CEM_software/releases
>
> Feedback and issues very welcome — first public release, be gentle 🙂

*(anexar o vídeo CEM-demo-EN.mp4 como mídia nativa do post)*

---

## Post 2 — r/SideProject

**Título:** `I used Claude Code to build a desktop app that manages Claude Code itself — backup, restore, diagnostics and token analytics. Open source.`

**Corpo:** versão do post 1 encurtada + 1 parágrafo de história pessoal:

> The meta part: I built ~95% of this with Claude Code itself — 12 TypeScript packages,
> an Electron app, a CLI, CI/CD for 3 OSes, and 106 tests. The tool now analyzes the very
> transcripts of the sessions that created it.

---

## Post 3 — r/opensource / r/coolgithubprojects

**Título r/coolgithubprojects:** `CEM – Backup/restore/migration manager for Claude Code environments [TypeScript/Electron]`

**Corpo:** 3 bullets técnicos + link. Sem emojis, sem tom de venda:

> - Monorepo pnpm: 12 framework-agnostic packages consumed by both the Electron app and the CLI
> - Own archive format (.cem): ZIP + manifest + SHA-256 checksums, optional AES-256-GCM with Argon2id KDF
> - Zero telemetry, local-only; MIT licensed; installers for Win/macOS/Linux built by GitHub Actions
> https://github.com/luizdione/CEM_software

---

## Perguntas que vão aparecer (respostas prontas)

- **"Is this safe? It touches my configs."** → It's read-only until you restore; restores are
  selective and never delete anything; destructive fixes go to a trash folder first + audit log.
  Code is MIT on GitHub — audit it yourself.
- **"Does it send my data anywhere?"** → No. Zero telemetry, no network calls except GitHub
  releases for updates (opt-in). Encryption is local AES-256-GCM.
- **"Is this allowed by Anthropic's ToS?"** → CEM only reads/writes the user's own documented
  local files. It never touches Anthropic binaries, auth, limits or private APIs.
- **"Why not just git my dotfiles?"** → You can! CEM adds discovery (finds what you forgot),
  integrity (checksums), encryption, selective restore, diagnostics and token analytics on top —
  and has optional explicit git sync built in.
- **"Token counts accurate?"** → Usage comes from Claude Code's own local transcripts
  (exact usage fields); file-size estimates are a heuristic, labeled as such.
