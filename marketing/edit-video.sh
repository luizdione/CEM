#!/usr/bin/env bash
#
# edit-video.sh — monta o vídeo demo do CEM a partir de UMA gravação contínua.
#
# O que faz:
#   1) cartela de abertura (marca CEM)  +  2) a gravação (aparada)  +  3) cartela de fim
#   4) legendas EN queimadas (a partir de scenes.conf)  →  CEM-demo-EN.mp4
#   5) sidecar CEM-demo-EN.srt  +  6) CEM-demo.gif (< 10 MB p/ Discord)
#
# Uso:
#   ./edit-video.sh "/caminho/para/gravacao.mp4" [pasta_de_saida]
#
# Rode em Linux/macOS/WSL/Git-Bash (não no PowerShell nativo). Requer ffmpeg + ffprobe.
# Ajuste os tempos das cenas em scenes.conf ANTES de rodar (só o texto já está pronto).
set -euo pipefail

# ----- entradas -----
IN="${1:-}"
OUTDIR="${2:-out}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENES="${SCENES:-$HERE/scenes.conf}"

if [[ -z "$IN" || ! -f "$IN" ]]; then
  echo "ERRO: passe o vídeo de entrada.  Uso: ./edit-video.sh gravacao.mp4 [saida]" >&2
  exit 1
fi
[[ -f "$SCENES" ]] || { echo "ERRO: scenes.conf não encontrado em $SCENES" >&2; exit 1; }

# ----- ffmpeg (instala se faltar, best-effort) -----
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg não encontrado — tentando instalar..." >&2
  (sudo apt-get update -qq && sudo apt-get install -y ffmpeg) 2>/dev/null \
    || apt-get install -y ffmpeg 2>/dev/null \
    || { echo "Instale ffmpeg manualmente e rode de novo." >&2; exit 1; }
fi

# ----- ajustes visuais -----
TITLE_SEC="${TITLE_SEC:-3}"
END_SEC="${END_SEC:-4}"
BG="0x0B1020"                    # azul-escuro de fundo das cartelas
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
[[ -f "$FONT" ]] || FONT="$(fc-match -f '%{file}' sans 2>/dev/null || echo "$FONT")"
[[ -f "$FONT_BOLD" ]] || FONT_BOLD="$FONT"

TITLE_L1="Claude Environment Manager"
TITLE_L2="Backup · restore · manage · migrate — locally"
END_L1="Free & open source · MIT"
END_L2="github.com/luizdione/CEM"

mkdir -p "$OUTDIR"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ----- helpers de tempo -----
to_seconds() { local t="$1" s=0 p IFS=:; read -ra P <<< "$t"; for p in "${P[@]}"; do s=$(( s*60 + 10#${p%%.*} )); done; echo "$s"; }
to_srt_ts()  { printf "%02d:%02d:%02d,000" $(($1/3600)) $((($1%3600)/60)) $(($1%60)); }

# ----- limites do corpo: padrão = vídeo inteiro; override com BODY_START/BODY_END -----
# (as janelas de legenda no scenes.conf são INDEPENDENTES do corte do corpo)
DUR_RAW=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN"); DUR_INT="${DUR_RAW%.*}"
BODY_START_S=$(to_seconds "${BODY_START:-0}")
BODY_END_S=$(to_seconds "${BODY_END:-$DUR_INT}")
(( BODY_END_S > BODY_START_S )) || { echo "ERRO: BODY_END <= BODY_START" >&2; exit 1; }
BODY_DUR=$(( BODY_END_S - BODY_START_S ))

# ----- geometria da gravação -----
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$IN")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$IN")
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN"); FPS="${FPS:-30}"
# cartelas usam pixels reais (drawtext); a legenda usa o espaço PlayResY=288 do libass
# → Fontsize 13 ≈ H/22 final e MarginV 14 fica logo acima da barra de status, em qualquer resolução
FS_TITLE=$(( H / 14 )); FS_SUB=$(( H / 30 )); SUB_FS="${SUB_FS:-13}"; MARGINV="${MARGINV:-14}"
echo "Entrada: ${W}x${H} @ ${FPS}fps | corpo ${BODY_START_S}s→${BODY_END_S}s (${BODY_DUR}s)"

# ----- cartelas (textfile evita dor de escape) -----
printf '%s' "$TITLE_L1" > "$WORK/t1.txt"; printf '%s' "$TITLE_L2" > "$WORK/t2.txt"
printf '%s' "$END_L1"   > "$WORK/e1.txt"; printf '%s' "$END_L2"   > "$WORK/e2.txt"
make_card() { # out dur l1file l2file
  ffmpeg -y -v error -f lavfi -i "color=c=${BG}:s=${W}x${H}:r=${FPS}:d=${2}" \
    -vf "drawtext=fontfile=${FONT_BOLD}:textfile=${3}:fontcolor=white:fontsize=${FS_TITLE}:x=(w-tw)/2:y=(h/2)-th-10,drawtext=fontfile=${FONT}:textfile=${4}:fontcolor=0xA8B8D8:fontsize=${FS_SUB}:x=(w-tw)/2:y=(h/2)+12" \
    -c:v libx264 -pix_fmt yuv420p -r "${FPS}" "$1"
}
echo "→ cartelas de abertura e fim..."
make_card "$WORK/title.mp4" "$TITLE_SEC" "$WORK/t1.txt" "$WORK/t2.txt"
make_card "$WORK/end.mp4"   "$END_SEC"   "$WORK/e1.txt" "$WORK/e2.txt"

# ----- corpo (aparado, sem áudio) -----
echo "→ aparando a gravação..."
ffmpeg -y -v error -ss "$BODY_START_S" -i "$IN" -t "$BODY_DUR" \
  -an -c:v libx264 -pix_fmt yuv420p -r "${FPS}" "$WORK/body.mp4"

# ----- concat (normalizando SAR/fps/tamanho) -----
echo "→ juntando cartelas + corpo..."
ffmpeg -y -v error -i "$WORK/title.mp4" -i "$WORK/body.mp4" -i "$WORK/end.mp4" \
  -filter_complex "[0:v]setsar=1,fps=${FPS},scale=${W}:${H}[a];[1:v]setsar=1,fps=${FPS},scale=${W}:${H}[b];[2:v]setsar=1,fps=${FPS},scale=${W}:${H}[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$WORK/concat.mp4"

# ----- SRT final (tempos = TITLE_SEC + (cena - inicio_do_corpo)) -----
echo "→ gerando legendas sincronizadas..."
SRT="$WORK/final.srt"; : > "$SRT"; idx=0
while IFS='|' read -r start end cap; do
  [[ "$start" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${start// }" ]] && continue
  s=$(to_seconds "$start"); e=$(to_seconds "$end")
  (( e <= BODY_START_S || s >= BODY_END_S )) && continue   # legenda fora do corpo aparado
  (( s < BODY_START_S )) && s=$BODY_START_S; (( e > BODY_END_S )) && e=$BODY_END_S
  idx=$((idx+1))
  fs=$(( TITLE_SEC + s - BODY_START_S )); fe=$(( TITLE_SEC + e - BODY_START_S ))
  { echo "$idx"; echo "$(to_srt_ts "$fs") --> $(to_srt_ts "$fe")"; echo "$cap"; echo; } >> "$SRT"
done < "$SCENES"
cp "$SRT" "$OUTDIR/CEM-demo-EN.srt"

# ----- queima das legendas → MP4 final -----
echo "→ queimando legendas..."
OUT_MP4="$OUTDIR/CEM-demo-EN.mp4"
ffmpeg -y -v error -i "$WORK/concat.mp4" \
  -vf "subtitles=${SRT}:force_style='FontName=DejaVu Sans,Fontsize=${SUB_FS},PrimaryColour=&H00FFFFFF&,OutlineColour=&H00101010&,BorderStyle=1,Outline=1,Shadow=0,MarginV=${MARGINV}'" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -movflags +faststart "$OUT_MP4"

# ----- GIF p/ Discord (< 10 MB) -----
echo "→ GIF para o Discord..."
GIF_START="${GIF_START:-$(( TITLE_SEC + 48 - BODY_START_S ))}"   # ~cena Token Usage por padrão
GIF_DUR="${GIF_DUR:-14}"; GIF_W="${GIF_W:-640}"; GIF_FPS="${GIF_FPS:-14}"
OUT_GIF="$OUTDIR/CEM-demo.gif"
ffmpeg -y -v error -ss "$GIF_START" -t "$GIF_DUR" -i "$OUT_MP4" \
  -vf "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos,palettegen=stats_mode=diff" "$WORK/pal.png"
ffmpeg -y -v error -ss "$GIF_START" -t "$GIF_DUR" -i "$OUT_MP4" -i "$WORK/pal.png" \
  -lavfi "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "$OUT_GIF"

# ----- relatório -----
gif_bytes=$(wc -c < "$OUT_GIF")
echo
echo "PRONTO:"
echo "  $OUT_MP4"
echo "  $OUTDIR/CEM-demo-EN.srt"
printf "  %s (%.1f MB)\n" "$OUT_GIF" "$(echo "scale=2; $gif_bytes/1048576" | bc 2>/dev/null || echo "?")"
if (( gif_bytes > 10*1024*1024 )); then
  echo "  ⚠ GIF > 10 MB. Reduza:  GIF_W=520 GIF_FPS=12 GIF_DUR=10 ./edit-video.sh ..." >&2
fi
