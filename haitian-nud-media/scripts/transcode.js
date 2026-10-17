#!/usr/bin/env node

/**
 * Script d'encodage et compression automatisé pour le streaming hybride
 * Exécute FFmpeg pour produire :
 *  1. video_optimized.mp4 (H.264 FastStart)
 *  2. Dossier HLS avec master.m3u8 et renditions (360p, 480p, 720p, 1080p)
 *  3. thumbnail.jpg
 *
 * Utilisation :
 *   npm run transcode <chemin_vers_video> [dossier_sortie]
 *   node scripts/transcode.js <chemin_vers_video> [dossier_sortie]
 */

import { spawnSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vérification de la présence de ffmpeg
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch {
  console.error("❌ Erreur : ffmpeg n'est pas détecté dans votre environnement système (PATH).");
  console.error("Veuillez installer ffmpeg : https://ffmpeg.org/download.html");
  process.exit(1);
}

const inputArg = process.argv[2];
if (!inputArg) {
  console.log("Usage: npm run transcode <chemin_vers_video> [dossier_sortie]");
  console.log("Exemple: npm run transcode ./mon_film.mp4 ./output/mon_film");
  process.exit(0);
}

const inputFile = path.resolve(process.cwd(), inputArg);
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier introuvable : ${inputFile}`);
  process.exit(1);
}

const baseName = path.basename(inputFile, path.extname(inputFile));
const outputDir = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.resolve(process.cwd(), "transcoded_output", baseName);

console.log("==================================================");
console.log("🚀 Lancement du pipeline d'encodage hybride HLS/MP4");
console.log(`📹 Source : ${inputFile}`);
console.log(`📁 Sortie : ${outputDir}`);
console.log("==================================================");

fs.mkdirSync(outputDir, { recursive: true });

const scriptBash = path.join(__dirname, "transcode-media.sh");

if (process.platform !== "win32" && fs.existsSync(scriptBash)) {
  fs.chmodSync(scriptBash, 0o755);
  const result = spawnSync("bash", [scriptBash, inputFile, outputDir], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
} else {
  // Exécution multi-plateformes Node/FFmpeg pour Windows et environnements sans bash
  console.log("▶ [1/3] Compression MP4 Web FastStart...");
  const mp4Out = path.join(outputDir, "video_optimized.mp4");
  execSync(
    `ffmpeg -y -i "${inputFile}" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${mp4Out}"`,
    { stdio: "inherit" }
  );

  console.log("▶ [2/3] Génération HLS Master Playlist & Variantes (360p, 720p)...");
  const hlsDir = path.join(outputDir, "hls");
  const p720Dir = path.join(hlsDir, "720p");
  const p360Dir = path.join(hlsDir, "360p");
  fs.mkdirSync(p720Dir, { recursive: true });
  fs.mkdirSync(p360Dir, { recursive: true });

  // 360p
  execSync(
    `ffmpeg -y -i "${inputFile}" -vf "scale=w=-2:h=360" -c:v libx264 -crf 25 -preset veryfast -b:v 400k -maxrate 500k -bufsize 800k -c:a aac -b:a 64k -hls_time 4 -hls_playlist_type vod -hls_list_size 0 -hls_segment_filename "${path.join(p360Dir, "seg_%03d.ts")}" "${path.join(p360Dir, "index.m3u8")}"`,
    { stdio: "inherit" }
  );

  // 720p
  execSync(
    `ffmpeg -y -i "${inputFile}" -vf "scale=w=-2:h=720" -c:v libx264 -crf 23 -preset veryfast -b:v 1500k -maxrate 2000k -bufsize 3000k -c:a aac -b:a 128k -hls_time 4 -hls_playlist_type vod -hls_list_size 0 -hls_segment_filename "${path.join(p720Dir, "seg_%03d.ts")}" "${path.join(p720Dir, "index.m3u8")}"`,
    { stdio: "inherit" }
  );

  // Master Playlist
  const masterContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=464000,RESOLUTION=640x360,NAME="360p"\n360p/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1628000,RESOLUTION=1280x720,NAME="720p"\n720p/index.m3u8\n`;
  fs.writeFileSync(path.join(hlsDir, "master.m3u8"), masterContent);

  console.log("▶ [3/3] Création de la miniature poster...");
  const thumbOut = path.join(outputDir, "thumbnail.jpg");
  execSync(`ffmpeg -y -ss 00:00:02 -i "${inputFile}" -vframes 1 -q:v 3 "${thumbOut}"`, {
    stdio: "inherit",
  });
}

console.log("\n✨ Conversion terminée avec succès !");
console.log(`Dossier prêt pour diffusion ou téléversement vers Supabase / S3 : ${outputDir}`);
