# ROTEIRO DE GRAVAÇÃO — Vídeo demo do CEM

**Objetivo:** um vídeo curto (~90 s) mostrando 8 funcionalidades do Claude Environment
Manager, com legendas em inglês queimadas no vídeo. Serve para Discord, Reddit, GitHub e YouTube.

> **Como gravar (Windows):** clique na janela do CEM, aperte **Win+Alt+R** para começar,
> **Win+Alt+R** de novo para parar. Os arquivos caem em `Videos\Captures`. Se o Game Bar
> reclamar ("recursos de jogos não disponíveis"), use a **Ferramenta de Captura** (Iniciar →
> "Ferramenta de Captura" → botão de vídeo → selecione a janela do CEM).
>
> Você pode gravar **tudo em uma tomada só** (as 8 cenas em sequência) — foi o que gerou o
> arquivo `Claude Environment Manager 2026-07-17 ...mp4`. Nesse caso, **anote o timestamp em
> que cada cena começa** (ver `scenes.conf`) para a montagem sincronizar as legendas.

## Cuidados antes de gravar (privacidade)

- Silencie notificações (Windows: **Assistência de foco / Não perturbe**).
- Feche abas/janelas com dados pessoais.
- No backup, use uma **senha fictícia** (`demo-2026`) — nunca uma real.
- Nada de tokens, e-mails ou caminhos sensíveis à mostra.

## Regras de ouro

1. **2 segundos parado** no início e no fim de cada cena.
2. Movimentos de mouse **lentos** — metade da velocidade que parece natural.
3. Entre uma ação e outra, conte "mil e um" mentalmente.
4. Se errar, **regrave a cena inteira** — nunca corrija no meio.

---

## Cena 1 — Dashboard (~8 s)

0–2 s parado na visão geral → leve o mouse até o card de integridade/contagens e pare 1 s
sobre ele → deslize até o card de **último backup** → desça ao gráfico de **uso por projeto** e
pare. **Não clique em nada.**

## Cena 2 — Scanner (~10 s)

0–2 s parado → clique em **Scanner** na barra lateral → clique em **Scan** → espere a lista
encher (fique parado) → role a lista devagar até o fim (2–3 toques de rodinha por segundo).

## Cena 3 — Token Usage (~15 s) — *cena "bonita"*

0–2 s parado na aba **Usage** → clique em **24h**, espere 1 s → clique em **7d**, espere 2 s (o
gráfico redesenha) → passe o mouse devagar sobre as barras/categorias (2 s) → role até as
**propostas** → marque **2 checkboxes** com pausa de 1 s entre elas → leve o mouse até **Send 2
to Claude Code** e pare em cima **sem clicar** (2 s).

## Cena 4 — Diagnostics (~15 s) — *cena "impressionante"*

0–2 s parado → clique em **Diagnostics** → rode o diagnóstico e fique parado enquanto carrega →
quando a lista aparecer, desça devagar mostrando 2–3 achados (3 s) → clique em **Select all**
(pausa 1 s) → clique em **Solve N selected** → fique parado mostrando os resultados verdes (3 s).

## Cena 5 — Backup (~12 s)

0–2 s parado na aba **Backup** → clique em **Encrypt** → clique no campo de senha e digite
`demo-2026` devagar (~2 letras/segundo — **senha fictícia!**) → clique em **criar backup** →
fique parado até aparecer a confirmação com o arquivo `.cem` (3 s).

## Cena 6 — Restore (~12 s)

0–2 s parado → aba **Restore** → abra o `.cem` que acabou de criar → quando a lista de arquivos
aparecer, **desmarque 2 checkboxes** devagar (mostra a restauração seletiva) → clique em
**dry-run** → parado 3 s no resultado.

## Cena 7 — MCP Manager (~8 s)

0–2 s parado → aba **MCP** → role devagar pela lista de servidores → pare o mouse 2 s sobre um
valor **mascarado** (`•••`) — é o destaque da cena.

## Cena 8 — Settings (~8 s)

0–2 s parado → aba **Settings** → leve o mouse até a seção de update mostrando a versão **1.3.2**
→ clique em **verificar atualização** → parado 2 s no resultado ("latest version").

---

## Legendas em inglês (aprovar este texto)

Uma legenda por cena. Curtas de propósito (2 linhas no máximo). O texto é o que vale — os
tempos exatos são sincronizados na montagem a partir do `scenes.conf`.

| # | Cena | Legenda (EN) |
| - | ---- | ------------ |
| — | **Cartela de abertura** | **Claude Environment Manager (CEM)** — Backup · restore · manage · migrate your Claude Code setup, locally. |
| 1 | Dashboard | Your entire Claude Code setup at a glance. |
| 2 | Scanner | Read-only scan of every Claude Code artifact on your machine. |
| 3 | Token Usage | Real token usage over time — with concrete cleanup suggestions. |
| 4 | Diagnostics | Find config problems, then fix them in one click. |
| 5 | Backup | Encrypted, local backups (AES-256). No cloud, no telemetry. |
| 6 | Restore | Selective restore with dry-run — pick what comes back. |
| 7 | MCP Manager | Manage MCP servers — secrets masked by default. |
| 8 | Settings | Built-in updater. Open source, MIT, compliance-first. |
| — | **Cartela de encerramento** | **Free & open source · MIT** — github.com/luizdione/CEM |

*(Legenda pronta em `subtitles/CEM-demo-EN.srt`. A montagem regenera os tempos a partir do
`scenes.conf`.)*
