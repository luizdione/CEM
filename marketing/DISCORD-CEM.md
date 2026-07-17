# 📣 Material para Discord — CEM (Claude Environment Manager)

> **Antes de postar — etiqueta que evita problemas:**
> 1. No Discord da Anthropic, procure o canal certo para projetos da comunidade
>    (normalmente algo como **#built-with-claude**, **#community-projects** ou **#showcase**)
>    e **leia as regras fixadas** do canal antes.
> 2. Poste **uma vez, no canal certo** — nada de repetir em vários canais nem mandar DM.
> 3. Deixe claro que é **seu projeto open source, não oficial** — o texto abaixo já faz isso.
> 4. Anexe o vídeo (ou um GIF de 10–20s) direto no post: mídia embutida rende muito mais
>    que link seco.

---

## Post principal (EN — para #built-with-claude / community showcase)

**CEM — Claude Environment Manager** 🧰
Open-source desktop app + CLI to **back up, restore, manage and migrate your entire Claude
Code environment** — skills, subagents, MCP servers, CLAUDE.md files, profiles and settings.

Moving to a new machine used to mean rebuilding everything by hand. With CEM it's:
install Claude Code → install CEM → import one `.cem` file → done. ✅

**What it does**
- 🔍 Read-only scanner discovers every artifact in the documented local files
- 📦 One portable `.cem` archive — checksums, manifest, optional AES-256-GCM encryption
- 🩺 Diagnostics that don't just find problems: one click proposes fixes, you accept or ignore each (with automatic backups)
- 📊 Real token usage over 24h/3d/7d/30d per session & project — context reading vs cache building vs output, git activity, agent shares — with improvement proposals you can send straight into Claude Code as an action plan
- 🔐 Zero telemetry. Everything stays local. Secrets are masked in the UI
- 🖥️ Windows / macOS / Linux installers + a full CLI (`cem backup / restore / doctor / fix / usage / …`)

**Compliance first:** CEM never modifies, intercepts or reverse-engineers Claude Code or any
Anthropic software. It only reads/writes your own documented local files, and fully respects
Anthropic's Terms of Use. Not affiliated with Anthropic — just built with ❤️ (and with Claude
Code itself) for the community.

📥 Releases: <https://github.com/luizdione/CEM/releases>
⭐ Repo (MIT): <https://github.com/luizdione/CEM>

Feedback, issues and PRs very welcome!

*(anexar aqui o vídeo CEM-demo-EN.mp4 ou o GIF)*

---

## Versão curta (EN — para responder threads ou canais mais restritos)

Built **CEM** — an open-source desktop app + CLI that backs up your whole Claude Code
environment (skills, agents, MCPs, CLAUDE.md) into one portable, optionally-encrypted `.cem`
file, restores it on any machine, finds & fixes config problems, and shows your real token
usage over time with improvement proposals. 100% local, zero telemetry, never touches
Anthropic software. MIT. <https://github.com/luizdione/CEM>

---

## Versão em português (para comunidades BR)

**CEM — Claude Environment Manager** 🧰
App desktop + CLI open source para **backup, restauração e migração completa do seu ambiente
do Claude Code** — skills, agentes, MCPs, arquivos CLAUDE.md, perfis e configurações.

Trocar de máquina virou: instalar Claude Code → instalar CEM → importar um arquivo `.cem`. ✅
Diagnóstico com correção assistida (você aceita ou ignora cada fix), análise real de consumo
de tokens (24h/3d/7d/30d) com propostas de melhoria que vão direto para o Claude Code,
criptografia AES-256 opcional, zero telemetria, tudo local.

Nunca modifica software da Anthropic — só lê/escreve seus próprios arquivos documentados.
Instaladores para Windows/macOS/Linux: <https://github.com/luizdione/CEM/releases> (MIT)

---

## Dicas de mídia para o post

- O Discord mostra vídeo MP4 embutido até **~10 MB** (sem Nitro) — se o demo passar disso,
  eu gero também um **GIF de 15s** (cena 3 + cena 4, as mais impressionantes) dentro do limite.
- Primeira imagem/frame importa: o vídeo vai abrir com a cartela "Claude Environment Manager".
- Se o canal pedir só imagem: eu extraio 2–3 screenshots bonitos dos seus clipes.
