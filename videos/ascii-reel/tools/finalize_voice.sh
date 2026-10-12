#!/bin/bash
# usage: finalize_voice.sh <edit_proc.f32> <out.wav> <tempo>
set -e
IN=$1; OUT=$2; TEMPO=${3:-1.07}
TMP=$(dirname "$OUT")/pre_ln.wav
CH="highpass=f=85:poles=2,acompressor=threshold=-24dB:ratio=3:attack=4:release=90:knee=4:makeup=3,acompressor=threshold=-12dB:ratio=6:attack=1:release=40:knee=2,atempo=$TEMPO"
ffmpeg -hide_banner -loglevel error -y -f f32le -ar 48000 -ac 1 -i "$IN" -af "$CH" -c:a pcm_f32le "$TMP"
J=$(ffmpeg -hide_banner -i "$TMP" -af loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read II ITP ILRA ITH OFF <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP" -af "loudnorm=I=-14:TP=-1.5:LRA=9:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFF:linear=true,alimiter=limit=0.84:attack=2:release=40:level=disabled" -ar 48000 -c:a pcm_s24le "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2
