# 🎬 Roteiro de gravação — vídeo demo do CEM (v1.3.2)

**Como funciona:** você grava **um clipe curto por cena** (8 clipes), me envia aqui no chat,
e eu monto o vídeo final: cartelas de abertura/encerramento, cortes, e **legendas em inglês
queimadas no vídeo**. Duração final: ~1min50s.

## Preparação (5 minutos, uma vez só)

1. Abra o CEM **instalado** (ícone da área de trabalho) — versão 1.3.2.
2. **Privacidade:** feche outros apps e notificações (Win+A → ativar *Não perturbe*).
   O CEM mascara segredos de MCP automaticamente, mas evite passar o mouse em
   caminhos/arquivos pessoais que não queira mostrar.
3. Maximize a janela do CEM.
4. Gravador do Windows (já vem instalado): pressione **Win+Alt+R** para **iniciar** a
   gravação da janela ativa e **Win+Alt+R** de novo para **parar**.
   Os vídeos ficam em `C:\Users\luizd\Videos\Captures`.
5. Em cada clipe: fique **2 segundos parado no início e no fim** (margem para o corte).
   Movimentos de mouse lentos e deliberados. Errou? Grave o clipe de novo, sem estresse.

## As 8 cenas

| # | Arquivo | Duração alvo | O que fazer na tela |
|---|---------|--------------|---------------------|
| 1 | `cena1.mp4` | ~8s | **Dashboard** aberto. Mouse parado 2s, depois passeie devagar pelos cards (integridade, contagens, último backup). |
| 2 | `cena2.mp4` | ~10s | Aba **Scanner**: clique em *Scan*, espere a lista de artefatos aparecer, role devagar até o fim. |
| 3 | `cena3.mp4` | ~15s | Aba **Token Usage**: clique em **24h**, depois **7d** (o gráfico muda). Role até as propostas, **marque 2 caixas** e pare o mouse sobre o botão *Send N to Claude Code* (não precisa clicar). |
| 4 | `cena4.mp4` | ~15s | Aba **Diagnostics**: rode o diagnóstico, clique em **Select all**, depois em **Solve N selected**; mostre o resultado (verde). |
| 5 | `cena5.mp4` | ~12s | Aba **Backup**: marque *Encrypt*, digite uma senha **fictícia** (ex.: `demo-2026`), crie o backup e mostre o `.cem` gerado (toast/lista). |
| 6 | `cena6.mp4` | ~12s | Aba **Restore**: abra o `.cem` recém-criado, mostre a **seleção por arquivo** (checkboxes) e rode um **dry-run**. |
| 7 | `cena7.mp4` | ~8s | Aba **MCP Manager**: mostre a lista de servidores — repare que os **segredos aparecem mascarados** (★ ponto forte). |
| 8 | `cena8.mp4` | ~8s | Aba **Settings**: mostre a seção de update com a versão **1.3.2** e o botão de verificação. |

## Me enviando os clipes

Anexe aqui no chat os 8 arquivos (`cena1.mp4` … `cena8.mp4`). Se ficarem grandes demais
para anexar de uma vez, mande em 2–3 mensagens. Eu devolvo:

- `CEM-demo-EN.mp4` — vídeo final com cartelas + legendas em inglês queimadas
- `CEM-demo.srt` — legenda separada (para YouTube/Discord aceitarem CC opcional)

## Texto das legendas (o que vou queimar em cada cena — revise se quiser mudar)

1. *Claude Environment Manager — back up, restore and migrate your Claude Code setup.*
2. *The read-only scanner finds every artifact: skills, agents, MCPs, CLAUDE.md files.*
3. *Real token usage over 24h–30d — with improvement proposals you can send straight to Claude Code.*
4. *Diagnostics finds problems — and one click proposes fixes you accept or ignore.*
5. *One portable .cem file — checksums, and optional AES-256 encryption.*
6. *Restore everything on a new machine — or pick exactly which files.*
7. *MCP servers listed with secrets masked. Nothing leaves your machine.*
8. *Open source (MIT), zero telemetry, auto-updates. Never modifies Anthropic software.*
