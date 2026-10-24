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
  console.log("▶ [1/3] Compression MP4 Web FastStart (144p)...");
  const mp4Out = path.join(outputDir, "video_optimized_144p.mp4");
  execSync(
    `ffmpeg -y -i "${inputFile}" -c:v libx264 -preset veryfast -profile:v baseline -level 3.0 -b:v 100k -maxrate 150k -bufsize 250k -crf 30 -g 48 -keyint_min 48 -sc_threshold 0 -vf "scale=-2:144" -pix_fmt yuv420p -c:a aac -b:a 48k -ac 1 -ar 22050 -movflags +faststart "${mp4Out}"`,
    { stdio: "inherit" }
  );

  console.log("▶ [2/3] Génération HLS Master Playlist & Variantes (144p, 240p, 360p, 480p, 720p)...");
  const hlsDir = path.join(outputDir, "hls");

  const renditions = [
    { name: "144p", h: 144, bv: "100k",  max: "150k",  buf: "250k",  crf: 30, ba: "48k",  ac: 1, profile: "baseline", level: "3.0", width: 256,  bandwidth: 148000 },
    { name: "240p", h: 240, bv: "250k",  max: "350k",  buf: "500k",  crf: 28, ba: "64k",  ac: 1, profile: "baseline", level: "3.0", width: 426,  bandwidth: 314000 },
    { name: "360p", h: 360, bv: "400k",  max: "550k",  buf: "800k",  crf: 26, ba: "96k",  ac: 2, profile: "main",     level: "3.0", width: 640,  bandwidth: 496000 },
    { name: "480p", h: 480, bv: "700k",  max: "900k",  buf: "1400k", crf: 24, ba: "96k",  ac: 2, profile: "main",     level: "3.1", width: 854,  bandwidth: 796000 },
    { name: "720p", h: 720, bv: "2000k", max: "2500k", buf: "3500k", crf: 23, ba: "128k", ac: 2, profile: "main",     level: "3.1", width: 1280, bandwidth: 2128000 },
  ];

  for (const r of renditions) {
    const dir = path.join(hlsDir, r.name);
    fs.mkdirSync(dir, { recursive: true });
    execSync(
      `ffmpeg -y -i "${inputFile}" -vf "scale=-2:${r.h}" -c:v libx264 -crf ${r.crf} -preset veryfast -profile:v ${r.profile} -level ${r.level} -g 48 -keyint_min 48 -sc_threshold 0 -b:v ${r.bv} -maxrate ${r.max} -bufsize ${r.buf} -c:a aac -b:a ${r.ba} -ac ${r.ac} -hls_time 4 -hls_playlist_type vod -hls_list_size 0 -hls_segment_filename "${path.join(dir, "seg_%03d.ts")}" "${path.join(dir, "index.m3u8")}"`,
      { stdio: "inherit" }
    );
  }

  // Master Playlist
  const masterLines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of renditions) {
    masterLines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.width}x${r.h},NAME="${r.name}"`,
      `${r.name}/index.m3u8`
    );
  }
  fs.writeFileSync(path.join(hlsDir, "master.m3u8"), masterLines.join("\n") + "\n");

  console.log("▶ [3/3] Création de la miniature poster...");
  const thumbOut = path.join(outputDir, "thumbnail.jpg");
  execSync(`ffmpeg -y -ss 00:00:02 -i "${inputFile}" -vframes 1 -q:v 3 "${thumbOut}"`, {
    stdio: "inherit",
  });
}

console.log("\n✨ Conversion terminée avec succès !");
console.log(`Dossier prêt pour diffusion ou téléversement vers Supabase / S3 : ${outputDir}`);
