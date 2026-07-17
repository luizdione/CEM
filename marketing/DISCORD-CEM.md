# DISCORD — material de divulgação do CEM

**Onde postar:** canais de "showcase"/"built-with-claude"/"projects" de comunidades ligadas ao
Claude Code (ex.: o Discord da comunidade Claude, servidores de dev de IA). **Leia as regras
fixadas do canal antes** e poste **uma única vez** no canal certo.

**Etiqueta que importa:**

- Poste **uma vez**, no canal de projetos/showcase — nunca em vários canais ao mesmo tempo.
- Deixe explícito: **open source, não oficial, compliance-first** (nunca modifica software da
  Anthropic). Esse é o maior argumento de confiança nesse público.
- Nada de @everyone/@here. Responda quem comentar.
- Anexe o GIF (< 10 MB, embeda sem Nitro) ou link do vídeo/YouTube.

---

## Post principal (EN, longo)

> **🧰 CEM — Claude Environment Manager (open source, local-first)**
>
> I built a small desktop + CLI app to **back up, restore, manage and migrate your Claude Code
> environment** — all locally.
>
> Claude Code spreads your setup across a handful of documented local files (`~/.claude/`,
> `~/.claude.json`, project `CLAUDE.md` / `.mcp.json`, skills, agents, MCP servers…). Moving to a
> new machine, or just keeping that tidy, is a pain. CEM discovers all of it and packs it into a
> single portable, verifiable, optionally **AES-256-encrypted** `.cem` file.
>
> **What it does**
> • 📊 Dashboard — health, counts, last backup, per-project token usage
> • 🔎 Read-only scanner for every Claude Code artifact
> • 📈 Token Usage over 24h/3d/7d/30d with concrete cleanup suggestions
> • 🩺 Diagnostics + one-click "Solve problems"
> • 💾 Encrypted backup / selective restore (dry-run)
> • 🔌 MCP manager (secrets masked)
>
> **Compliance-first:** CEM never modifies, patches or intercepts Claude Code or any Anthropic
> software — it only reads/writes your own documented local files. Zero telemetry.
>
> MIT-licensed, Windows/macOS/Linux. Feedback very welcome 🙏
> 👉 github.com/luizdione/CEM

## Post curto (EN)

> **CEM — Claude Environment Manager** (open source, MIT). Back up, restore & migrate your whole
> Claude Code setup from one local app: encrypted `.cem` backups, token-usage analytics,
> diagnostics with one-click fixes, MCP manager. Compliance-first — never touches Anthropic
> software, zero telemetry. Windows/macOS/Linux → github.com/luizdione/CEM

## Versão em português

> **CEM — Claude Environment Manager** (open source, MIT). Um app desktop + CLI para **backup,
> restauração e migração** completa do seu ambiente do Claude Code: backups `.cem` criptografados
> (AES-256), análise de uso de tokens (24h/3d/7d/30d), diagnósticos com correção em um clique e
> gerenciador de MCPs. **Compliance-first:** nunca modifica software da Anthropic, zero telemetria.
> Windows/macOS/Linux → github.com/luizdione/CEM

---

## Dicas de mídia

- **GIF** (`CEM-demo.gif`): ideal para embedar direto no Discord. Mantenha **< 10 MB** (limite de
  embed sem Nitro). Use as cenas mais fortes (Token Usage + Diagnostics).
- **Vídeo completo** (`CEM-demo-EN.mp4`, ~90 s): melhor subir no **YouTube (não listado)** e colar
  o link — evita o limite de upload de 8/25 MB do Discord.
- Primeira imagem = Dashboard (contexto imediato). Segunda = o gráfico do Token Usage (a mais
  bonita).
