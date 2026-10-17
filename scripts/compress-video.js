#!/usr/bin/env node
/**
 * Script de conversion et compression vidéo Node.js / FFmpeg (Solution A)
 * Bitrate cible : entre 400 kbps et 700 kbps
 *
 * Utilisation :
 *   node scripts/compress-video.js <input.mp4> [output.mp4]
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage:
  node scripts/compress-video.js <source_file> [output_file]

Paramètres appliqués (Solution A):
  - Codec vidéo       : libx264 (H.264, profil main / 3.1)
  - Bitrate moyen     : 500 kbps (cible entre 400 kbps et 700 kbps)
  - Bitrate max       : 700 kbps (plafond maxrate)
  - Buffer VBV        : 1000 kbps
  - Qualité CRF       : 26
  - Résolution        : Max 720p (scale='min(1280,iw)':-2)
  - Codec audio       : AAC stéréo à 96 kbps
  - Optimisation web  : -movflags +faststart (chargement instantané)
  `);
  process.exit(args.length === 0 ? 1 : 0);
}

const inputPath = path.resolve(args[0]);

if (!fs.existsSync(inputPath)) {
  console.error(`[Erreur] Le fichier d'entrée n'existe pas : ${inputPath}`);
  process.exit(1);
}

const parsedInput = path.parse(inputPath);
const outputPath = args[1]
  ? path.resolve(args[1])
  : path.join(parsedInput.dir, `${parsedInput.name}_compressed.mp4`);

console.log("========================================================");
console.log(" Conversion & Compression FFmpeg (Solution A)");
console.log(` Entrée   : ${inputPath}`);
console.log(` Sortie   : ${outputPath}`);
console.log(` Bitrate  : Cible ~500 kbps (min 400k - max 700k)`);
console.log(` Audio    : AAC 96 kbps 44.1kHz stéréo`);
console.log(` Options  : +faststart pour streaming web immédiat`);
console.log("========================================================\n");

const ffmpegArgs = [
  "-y",
  "-i", inputPath,
  "-c:v", "libx264",
  "-preset", "medium",
  "-profile:v", "main",
  "-level", "3.1",
  "-b:v", "500k",
  "-maxrate", "700k",
  "-bufsize", "1000k",
  "-crf", "26",
  "-vf", "scale='min(1280,iw)':-2",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "96k",
  "-ac", "2",
  "-ar", "44100",
  "-movflags", "+faststart",
  outputPath,
];

const proc = spawn("ffmpeg", ffmpegArgs, { stdio: "inherit" });

proc.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("\n[Erreur] 'ffmpeg' n'a pas été trouvé. Assurez-vous qu'il est installé sur votre système.");
  } else {
    console.error("\n[Erreur lors de l'exécution de ffmpeg]", err);
  }
  process.exit(1);
});

proc.on("close", (code) => {
  if (code === 0) {
    const inputSize = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2);
    const outputSize = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    const ratio = (100 - (outputSize / inputSize) * 100).toFixed(1);

    console.log("\n========================================================");
    console.log(" Compression réussie !");
    console.log(` Poids initial : ${inputSize} Mo`);
    console.log(` Poids final   : ${outputSize} Mo (-${ratio}%)`);
    console.log(` Fichier prêt au streaming : ${outputPath}`);
    console.log("========================================================");
  } else {
    console.error(`\n[Échec] Le processus FFmpeg s'est arrêté avec le code : ${code}`);
    process.exit(code || 1);
  }
});
