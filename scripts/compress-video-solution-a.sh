#!/usr/bin/env bash
# ==============================================================================
# Script de conversion et compression FFmpeg (Solution A)
# Bitrate cible : entre 400 kbps et 700 kbps
# Optimisé pour le streaming MP4 progressif ultra-léger et rapide
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <fichier_source> [fichier_sortie]"
  echo "Exemple: $0 input.mov output_compressed.mp4"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}_compressed.mp4}"

if [ ! -f "$INPUT" ]; then
  echo "Erreur: Le fichier d'entrée '$INPUT' n'existe pas."
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Erreur: 'ffmpeg' n'est pas installé ou n'est pas dans le PATH."
  exit 1
fi

echo "========================================================"
echo " Démarrage de la compression vidéo (Solution A)"
echo " Entrée  : $INPUT"
echo " Sortie  : $OUTPUT"
echo " Bitrate : Cible 500k | Max 700k | Min ~400k (VBV 1000k)"
echo " Audio   : AAC 96 kbps - Stéréo"
echo " Web Opt : +faststart (moov atom en début de fichier)"
echo "========================================================"

ffmpeg -y -i "$INPUT" \
  -c:v libx264 \
  -preset medium \
  -profile:v main \
  -level 3.1 \
  -b:v 500k \
  -maxrate 700k \
  -bufsize 1000k \
  -crf 26 \
  -vf "scale='min(1280,iw)':-2" \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 96k \
  -ac 2 \
  -ar 44100 \
  -movflags +faststart \
  "$OUTPUT"

echo "========================================================"
echo " Compression terminée avec succès !"
echo " Taille finale :"
ls -lh "$OUTPUT"
echo "========================================================"
