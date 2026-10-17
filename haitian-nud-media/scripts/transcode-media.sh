#!/usr/bin/env bash
# ==============================================================================
# Script de conversion et compression FFmpeg - Stratégie hybride Web/Mobile
# 1. MP4 FastStart (H.264 / AAC, optimisé pour démarrage instantané)
# 2. HLS ABR Master Playlist (1080p, 720p, 480p, 360p avec segments .ts / .m3u8)
# 3. Vignette / Thumbnail JPG optimisée
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <fichier_source_video> [dossier_sortie]"
  echo "Exemple: $0 input.mov output_directory"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_DIR="${2:-./output_$(date +%s)}"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Erreur: Le fichier source '$INPUT_FILE' n'existe pas."
  exit 1
fi

command -v ffmpeg >/dev/null 2>&1 || { echo "Erreur: ffmpeg n'est pas installé sur la machine."; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "Erreur: ffprobe n'est pas installé sur la machine."; exit 1; }

mkdir -p "$OUTPUT_DIR/hls/1080p"
mkdir -p "$OUTPUT_DIR/hls/720p"
mkdir -p "$OUTPUT_DIR/hls/480p"
mkdir -p "$OUTPUT_DIR/hls/360p"

echo "=========================================================="
echo "🎬 Analyse du fichier : $INPUT_FILE"
echo "📂 Dossier de sortie  : $OUTPUT_DIR"
echo "=========================================================="

# Récupération de la hauteur de la vidéo source
SRC_HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0:s=x "$INPUT_FILE" || echo 1080)
echo "Résolution source détectée : ${SRC_HEIGHT}p"

# ------------------------------------------------------------------------------
# 1. GÉNÉRATION MP4 COMPRESSÉ FASTSTART (Démarrage progressif optimisé)
# ------------------------------------------------------------------------------
echo ""
echo "🚀 [1/3] Génération du MP4 compressé Web FastStart..."
ffmpeg -y -i "$INPUT_FILE" \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -profile:v high \
  -level 4.1 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -ac 2 \
  -ar 44100 \
  -movflags +faststart \
  "$OUTPUT_DIR/video_optimized.mp4"

# ------------------------------------------------------------------------------
# 2. GÉNÉRATION DES FLUX HLS MULTI-RÉSOLUTIONS (.m3u8 + .ts)
# ------------------------------------------------------------------------------
echo ""
echo "📡 [2/3] Génération des profils HLS adaptatifs..."

# Segment 360p (Très faible bande passante / Mobile Edge)
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=w=-2:h=360" \
  -c:v libx264 -crf 25 -preset veryfast -profile:v baseline -level 3.0 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 400k -maxrate 500k -bufsize 800k \
  -c:a aac -b:a 64k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/360p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/360p/index.m3u8"

# Segment 480p (SD standard)
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=w=-2:h=480" \
  -c:v libx264 -crf 24 -preset veryfast -profile:v main -level 3.1 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 800k -maxrate 1000k -bufsize 1600k \
  -c:a aac -b:a 96k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/480p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/480p/index.m3u8"

# Segment 720p (HD 720p)
ffmpeg -y -i "$INPUT_FILE" \
  -vf "scale=w=-2:h=720" \
  -c:v libx264 -crf 23 -preset veryfast -profile:v high -level 4.0 \
  -g 48 -keyint_min 48 -sc_threshold 0 \
  -b:v 1500k -maxrate 2000k -bufsize 3000k \
  -c:a aac -b:a 128k -ac 2 \
  -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
  -hls_segment_filename "$OUTPUT_DIR/hls/720p/seg_%03d.ts" \
  "$OUTPUT_DIR/hls/720p/index.m3u8"

# Segment 1080p (Full HD si source >= 1080)
if [ "$SRC_HEIGHT" -ge 1000 ]; then
  ffmpeg -y -i "$INPUT_FILE" \
    -vf "scale=w=-2:h=1080" \
    -c:v libx264 -crf 22 -preset veryfast -profile:v high -level 4.2 \
    -g 48 -keyint_min 48 -sc_threshold 0 \
    -b:v 3000k -maxrate 4000k -bufsize 6000k \
    -c:a aac -b:a 128k -ac 2 \
    -hls_time 4 -hls_playlist_type vod -hls_list_size 0 \
    -hls_segment_filename "$OUTPUT_DIR/hls/1080p/seg_%03d.ts" \
    "$OUTPUT_DIR/hls/1080p/index.m3u8"
fi

# ------------------------------------------------------------------------------
# Création du manifest HLS Master Playlist (master.m3u8)
# ------------------------------------------------------------------------------
cat << 'EOF' > "$OUTPUT_DIR/hls/master.m3u8"
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=464000,RESOLUTION=640x360,NAME="360p"
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=854x480,NAME="480p"
480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1628000,RESOLUTION=1280x720,NAME="720p"
720p/index.m3u8
EOF

if [ "$SRC_HEIGHT" -ge 1000 ]; then
  cat << 'EOF' >> "$OUTPUT_DIR/hls/master.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=3128000,RESOLUTION=1920x1080,NAME="1080p"
1080p/index.m3u8
EOF
fi

# ------------------------------------------------------------------------------
# 3. EXTRACTION D'UNE VIGNETTE POSTER (Thumbnail)
# ------------------------------------------------------------------------------
echo ""
echo "📸 [3/3] Extraction de la miniature (thumbnail)..."
ffmpeg -y -ss 00:00:02 -i "$INPUT_FILE" -vframes 1 -q:v 3 "$OUTPUT_DIR/thumbnail.jpg"

echo ""
echo "✅ Encodage terminé avec succès dans : $OUTPUT_DIR"
echo "Fichiers générés :"
echo " - $OUTPUT_DIR/video_optimized.mp4   (Format MP4 progressif pour hébergement standard)"
echo " - $OUTPUT_DIR/hls/master.m3u8        (Playlist Master ABR multi-renditions HLS)"
echo " - $OUTPUT_DIR/thumbnail.jpg         (Image de couverture de la vidéo)"
