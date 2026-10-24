#!/usr/bin/env bash
# ==============================================================================
# Script de conversion et compression FFmpeg - HLS Multi-débit
# Variantes : 144p, 240p, 360p, 480p, 720p
# Inclut FastStart pour les flux MP4 directs.
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <fichier_source_video> [dossier_sortie]"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_DIR="${2:-./output_$(date +%s)}"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Erreur: Le fichier source '$INPUT_FILE' n'existe pas."
  exit 1
fi

command -v ffmpeg >/dev/null 2>&1 || { echo "Erreur: ffmpeg n'est pas installé."; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "Erreur: ffprobe n'est pas installé."; exit 1; }

for q in 144p 240p 360p 480p 720p; do
  mkdir -p "$OUTPUT_DIR/hls/$q"
done

echo "=========================================================="
echo "🎬 Lancement du transcodage multi-débit : $INPUT_FILE"
echo "=========================================================="

# -------------------------------------------------------------------
# 1. MP4 optimisé web bas débit par défaut (144p) avec faststart
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -c:v libx264 -preset veryfast -profile:v baseline -level 3.0 \
  -b:v 100k -maxrate 150k -bufsize 250k -crf 30 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -vf "scale=-2:144" -pix_fmt yuv420p \
  -c:a aac -b:a 48k -ac 1 -ar 22050 \
  -movflags +faststart \
  "$OUTPUT_DIR/video_optimized_144p.mp4"

# -------------------------------------------------------------------
# 2. HLS 144p (~150 kbps)
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=-2:144" \
  -c:v libx264 -crf 30 -preset veryfast -profile:v baseline -level 3.0 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 100k -maxrate 150k -bufsize 250k \
  -c:a aac -b:a 48k -ac 1 -ar 22050 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/144p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/144p/index.m3u8"

# -------------------------------------------------------------------
# 3. HLS 240p (~320 kbps)
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=-2:240" \
  -c:v libx264 -crf 28 -preset veryfast -profile:v baseline -level 3.0 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 250k -maxrate 350k -bufsize 500k \
  -c:a aac -b:a 64k -ac 1 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/240p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/240p/index.m3u8"

# -------------------------------------------------------------------
# 4. HLS 360p (~500 kbps)
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=-2:360" \
  -c:v libx264 -crf 26 -preset veryfast -profile:v main -level 3.0 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 400k -maxrate 550k -bufsize 800k \
  -c:a aac -b:a 96k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/360p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/360p/index.m3u8"

# -------------------------------------------------------------------
# 5. HLS 480p (~800 kbps)
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=-2:480" \
  -c:v libx264 -crf 24 -preset veryfast -profile:v main -level 3.1 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 700k -maxrate 900k -bufsize 1400k \
  -c:a aac -b:a 96k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/480p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/480p/index.m3u8"

# -------------------------------------------------------------------
# 6. HLS 720p (~2.2 Mbps)
# -------------------------------------------------------------------
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=-2:720" \
  -c:v libx264 -crf 23 -preset veryfast -profile:v main -level 3.1 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 2000k -maxrate 2500k -bufsize 3500k \
  -c:a aac -b:a 128k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/720p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/720p/index.m3u8"

# -------------------------------------------------------------------
# 7. Master Playlist HLS
# -------------------------------------------------------------------
cat << 'EOF' > "$OUTPUT_DIR/hls/master.m3u8"
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=148000,RESOLUTION=256x144,NAME="144p"
144p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=314000,RESOLUTION=426x240,NAME="240p"
240p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=496000,RESOLUTION=640x360,NAME="360p"
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=796000,RESOLUTION=854x480,NAME="480p"
480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2128000,RESOLUTION=1280x720,NAME="720p"
720p/index.m3u8
EOF

# -------------------------------------------------------------------
# 8. Miniature poster
# -------------------------------------------------------------------
ffmpeg -y -ss 00:00:02 -i "$INPUT_FILE" -vframes 1 -q:v 3 "$OUTPUT_DIR/thumbnail.jpg"

echo "✅ Transcodage terminé avec succès dans : $OUTPUT_DIR"
