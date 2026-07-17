# marketing/ — divulgação do CEM

Materiais para divulgar o Claude Environment Manager (vídeo demo, Discord, Reddit).

| Arquivo | O que é |
| ------- | ------- |
| [`ROTEIRO-VIDEO-CEM.md`](./ROTEIRO-VIDEO-CEM.md) | Roteiro de gravação (8 cenas) + texto das legendas EN |
| [`DISCORD-CEM.md`](./DISCORD-CEM.md) | Posts para Discord (EN longo/curto, PT) + dicas de mídia |
| [`REDDIT-CEM.md`](./REDDIT-CEM.md) | Plano de Reddit p/ conta nova: aquecer → subs → post pronto |
| [`scenes.conf`](./scenes.conf) | Tempos das 8 cenas na gravação + legendas (edite os tempos) |
| [`subtitles/CEM-demo-EN.srt`](./subtitles/CEM-demo-EN.srt) | Legendas EN (rascunho de tempos; texto aprovado) |
| [`edit-video.sh`](./edit-video.sh) | Monta o vídeo final (cartelas + legendas + GIF) via ffmpeg |

## Fluxo do vídeo (de ponta a ponta)

1. **Grave** seguindo `ROTEIRO-VIDEO-CEM.md` (uma tomada contínua serve).
2. **Anote os tempos** de cada cena em `scenes.conf` (só os tempos — o texto já está pronto).
3. **Monte** (em Linux/macOS/WSL/Git-Bash, com ffmpeg):
   ```bash
   ./edit-video.sh "Claude Environment Manager ....mp4" out
   ```
   Saídas em `out/`: `CEM-demo-EN.mp4` (com cartelas + legendas queimadas),
   `CEM-demo-EN.srt` (sidecar) e `CEM-demo.gif` (< 10 MB p/ Discord).
4. **Publique**: GIF direto no Discord; vídeo no YouTube (não listado) e link no Reddit.

> **Nota sobre o ambiente do Claude Code:** a montagem roda numa sessão Linux com ffmpeg. O
> container é efêmero — por isso o script fica versionado aqui: qualquer sessão futura reinstala
> o ffmpeg e reproduz o resultado de forma determinística. O que **não** é possível é o assistente
> acessar arquivos do seu PC (`C:\...`) — a gravação precisa ser **anexada ao chat** para ser
> editada.

### Ajustes úteis do GIF

```bash
GIF_START=21 GIF_DUR=12 GIF_W=560 GIF_FPS=12 ./edit-video.sh "gravacao.mp4" out
```
`GIF_START`/`GIF_DUR` escolhem o trecho (padrão: ~cena 3, Token Usage). Reduza `GIF_W`/`GIF_FPS`
se passar de 10 MB.

## Verificação de fatos (mantenha honesto)

- Licença **MIT**, versão **1.3.2**, repositório **github.com/luizdione/CEM**.
- **Compliance-first / zero telemetria** — nunca modifica software da Anthropic. É o principal
  argumento de confiança; use-o em todo post.
