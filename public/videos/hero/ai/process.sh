#!/usr/bin/env bash
# Usage: ./process.sh input.mp4 [outdir]
# Makes a seamless loop (crossfade end->start), strips audio, encodes web formats,
# a 3:4 mobile crop, posters and a preview GIF.
set -euo pipefail
IN="$1"; OUT="${2:-hero-ai}"; mkdir -p "$OUT"
D=0.6
L=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$IN")
E=$(python3 -c "print(round($L-$D,4))")
FILTER="[0:v]split=3[a][b][c];\
[a]trim=start=$D:end=$E,setpts=PTS-STARTPTS[body];\
[b]trim=start=$E:end=$L,setpts=PTS-STARTPTS[tail];\
[c]trim=start=0:end=$D,setpts=PTS-STARTPTS[head];\
[tail][head]xfade=transition=fade:duration=$D:offset=0[mix];\
[body][mix]concat=n=2:v=1:a=0,fps=24,format=yuv420p[v]"
ffmpeg -v error -y -i "$IN" -filter_complex "$FILTER" -map "[v]" -an -c:v libx264 -preset slow -crf 16 "$OUT/_master.mp4"
M="$OUT/_master.mp4"
ffmpeg -v error -y -i "$M" -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p "$OUT/hero-loop.webm"
ffmpeg -v error -y -i "$M" -an -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT/hero-loop.mp4"
CROP="crop=540:720:660:0"
ffmpeg -v error -y -i "$M" -an -vf "$CROP" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p "$OUT/hero-loop-mobile.webm"
ffmpeg -v error -y -i "$M" -an -vf "$CROP" -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT/hero-loop-mobile.mp4"
ffmpeg -v error -y -i "$M" -frames:v 1 -q:v 3 "$OUT/hero-poster.jpg"
ffmpeg -v error -y -i "$M" -frames:v 1 -vf "$CROP" -q:v 3 "$OUT/hero-poster-mobile.jpg"
ffmpeg -v error -y -i "$M" -vf "fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" "$OUT/hero-preview.gif"
rm -f "$M"
ls -la "$OUT"
