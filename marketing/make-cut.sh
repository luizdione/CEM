#!/usr/bin/env bash
#
# make-cut.sh — versão ENXUTA do demo (~90 s) a partir da gravação contínua.
#
# Diferença para edit-video.sh: em vez de usar o vídeo inteiro, corta os trechos
# escolhidos em cut.conf (um por cena), junta, e legenda na nova timeline.
# Cartela de abertura + segmentos + cartela de fim; legendas EN queimadas; MP4 + SRT + GIF.
#
# Uso:  ./make-cut.sh "gravacao.mp4" [pasta_saida]     (roda em Linux/macOS/WSL/Git-Bash)
set -euo pipefail

IN="${1:-}"; OUTDIR="${2:-out-cut}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CUT="${CUT:-$HERE/cut.conf}"
[[ -n "$IN" && -f "$IN" ]] || { echo "ERRO: uso: ./make-cut.sh gravacao.mp4 [saida]" >&2; exit 1; }
[[ -f "$CUT" ]] || { echo "ERRO: cut.conf não encontrado em $CUT" >&2; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "ERRO: instale ffmpeg." >&2; exit 1; }

# ----- ajustes -----
TITLE_SEC="${TITLE_SEC:-3}"; END_SEC="${END_SEC:-4}"; BG="0x0B1020"
SUB_FS="${SUB_FS:-13}"; MARGINV="${MARGINV:-14}"; CAP_MAX="${CAP_MAX:-8}"   # legenda: espaço PlayResY=288; some após CAP_MAX s
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
[[ -f "$FONT" ]] || FONT="$(fc-match -f '%{file}' sans 2>/dev/null || echo "$FONT")"
[[ -f "$FONT_BOLD" ]] || FONT_BOLD="$FONT"
TITLE_L1="Claude Environment Manager"; TITLE_L2="Backup · restore · manage · migrate — locally"
END_L1="Free & open source · MIT";     END_L2="github.com/luizdione/CEM"

mkdir -p "$OUTDIR"; WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
to_seconds() { local t="$1" s=0 p IFS=:; read -ra P <<< "$t"; for p in "${P[@]}"; do s=$(( s*60 + 10#${p%%.*} )); done; echo "$s"; }
to_srt_ts()  { printf "%02d:%02d:%02d,000" $(($1/3600)) $((($1%3600)/60)) $(($1%60)); }

# ----- geometria -----
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$IN")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$IN")
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN"); FPS="${FPS:-30}"
FS_TITLE=$(( H / 14 )); FS_SUB=$(( H / 30 ))
echo "Entrada: ${W}x${H} @ ${FPS}fps"

# ----- cartelas -----
printf '%s' "$TITLE_L1" > "$WORK/t1.txt"; printf '%s' "$TITLE_L2" > "$WORK/t2.txt"
printf '%s' "$END_L1"   > "$WORK/e1.txt"; printf '%s' "$END_L2"   > "$WORK/e2.txt"
make_card() { ffmpeg -y -v error -f lavfi -i "color=c=${BG}:s=${W}x${H}:r=${FPS}:d=${2}" \
  -vf "drawtext=fontfile=${FONT_BOLD}:textfile=${3}:fontcolor=white:fontsize=${FS_TITLE}:x=(w-tw)/2:y=(h/2)-th-10,drawtext=fontfile=${FONT}:textfile=${4}:fontcolor=0xA8B8D8:fontsize=${FS_SUB}:x=(w-tw)/2:y=(h/2)+12" \
  -c:v libx264 -pix_fmt yuv420p -r "${FPS}" "$1"; }
echo "→ cartelas..."; make_card "$WORK/title.mp4" "$TITLE_SEC" "$WORK/t1.txt" "$WORK/t2.txt"
make_card "$WORK/end.mp4" "$END_SEC" "$WORK/e1.txt" "$WORK/e2.txt"

# ----- extrai cada segmento (seek rápido + preciso) e monta SRT da nova timeline -----
SRT="$WORK/cut.srt"; : > "$SRT"; segs=(); idx=0; tight=$TITLE_SEC
while IFS='|' read -r start end cap; do
  [[ "$start" =~ ^[[:space:]]*# ]] && continue; [[ -z "${start// }" ]] && continue
  s=$(to_seconds "$start"); e=$(to_seconds "$end"); dur=$(( e - s ))
  (( dur > 0 )) || { echo "ERRO: segmento com duração <= 0 ($start-$end)" >&2; exit 1; }
  pre=$(( s > 3 ? s - 3 : 0 )); fine=$(( s - pre )); out="$WORK/seg_$idx.mp4"
  echo "→ segmento $((idx+1)): ${start}–${end} (${dur}s)"
  # -nostdin: ffmpeg NÃO pode consumir o stdin do laço (senão engole linhas do cut.conf)
  ffmpeg -nostdin -y -v error -ss "$pre" -i "$IN" -ss "$fine" -t "$dur" -an -c:v libx264 -pix_fmt yuv420p -r "${FPS}" -vsync cfr "$out"
  segs+=("$out")
  # legenda: aparece 0.3s após o corte, some após CAP_MAX s (ou fim do segmento)
  cs=$(( tight )); ce=$(( tight + (dur-1 < CAP_MAX ? dur-1 : CAP_MAX) ))
  n=$(( idx+1 )); { echo "$n"; echo "$(to_srt_ts "$cs") --> $(to_srt_ts "$ce")"; echo "$cap"; echo; } >> "$SRT"
  tight=$(( tight + dur )); idx=$(( idx+1 ))
done < "$CUT"
(( idx > 0 )) || { echo "ERRO: cut.conf sem segmentos" >&2; exit 1; }

# ----- concat: cartela + segmentos + cartela (normalizando sar/fps/tamanho) -----
echo "→ juntando ${idx} segmentos + cartelas..."
inputs=(-i "$WORK/title.mp4"); fc="[0:v]setsar=1,fps=${FPS},scale=${W}:${H}[v0];"; labels="[v0]"; j=1
for seg in "${segs[@]}"; do inputs+=(-i "$seg"); fc+="[${j}:v]setsar=1,fps=${FPS},scale=${W}:${H}[v${j}];"; labels+="[v${j}]"; j=$(( j+1 )); done
inputs+=(-i "$WORK/end.mp4"); fc+="[${j}:v]setsar=1,fps=${FPS},scale=${W}:${H}[v${j}];"; labels+="[v${j}]"; n=$(( j+1 ))
fc+="${labels}concat=n=${n}:v=1:a=0[v]"
ffmpeg -y -v error "${inputs[@]}" -filter_complex "$fc" -map "[v]" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$WORK/concat.mp4"

# ----- queima legendas → MP4 -----
echo "→ queimando legendas..."; OUT_MP4="$OUTDIR/CEM-demo-EN-90s.mp4"; cp "$SRT" "$OUTDIR/CEM-demo-EN-90s.srt"
ffmpeg -y -v error -i "$WORK/concat.mp4" \
  -vf "subtitles=${SRT}:force_style='FontName=DejaVu Sans,Fontsize=${SUB_FS},PrimaryColour=&H00FFFFFF&,OutlineColour=&H00101010&,BorderStyle=1,Outline=1,Shadow=0,MarginV=${MARGINV}'" \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -movflags +faststart "$OUT_MP4"

# ----- GIF (Token Usage por padrão) -----
echo "→ GIF..."; GIF_START="${GIF_START:-$(( TITLE_SEC + 19 ))}"; GIF_DUR="${GIF_DUR:-12}"; GIF_W="${GIF_W:-640}"; GIF_FPS="${GIF_FPS:-14}"
OUT_GIF="$OUTDIR/CEM-demo-90s.gif"
ffmpeg -y -v error -ss "$GIF_START" -t "$GIF_DUR" -i "$OUT_MP4" -vf "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos,palettegen=stats_mode=diff" "$WORK/pal.png"
ffmpeg -y -v error -ss "$GIF_START" -t "$GIF_DUR" -i "$OUT_MP4" -i "$WORK/pal.png" -lavfi "fps=${GIF_FPS},scale=${GIF_W}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "$OUT_GIF"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT_MP4"); gb=$(wc -c < "$OUT_GIF")
echo; echo "PRONTO (${dur%.*}s):"; echo "  $OUT_MP4"; echo "  $OUTDIR/CEM-demo-EN-90s.srt"; printf "  %s (%.1f MB)\n" "$OUT_GIF" "$(echo "scale=2;$gb/1048576"|bc 2>/dev/null||echo '?')"