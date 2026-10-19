#!/usr/bin/env node
/**
 * Script de conversion et compression vidéo Node.js / FFmpeg (Solution A - 240p Ultra Bas Débit)
 * Bitrate cible : ~250 kbps (parfait pour les connexions très lentes)
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

Paramètres appliqués (Ultra Bas Débit 240p):
  - Codec vidéo       : libx264 (H.264, profil baseline / 3.0)
  - Bitrate moyen     : 250 kbps
  - Bitrate max       : 350 kbps (plafond maxrate)
  - Buffer VBV        : 500 kbps
  - Qualité CRF       : 28
  - Résolution        : Max 240p (scale=-2:240)
  - Codec audio       : AAC mono/stéréo à 64 kbps
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
  : path.join(parsedInput.dir, `${parsedInput.name}_240p.mp4`);

console.log("========================================================");
console.log(" Conversion & Compression FFmpeg (240p Ultra Bas Débit)");
console.log(` Entrée   : ${inputPath}`);
console.log(` Sortie   : ${outputPath}`);
console.log(` Bitrate  : Cible ~250 kbps (max 350k)`);
console.log(` Audio    : AAC 64 kbps`);
console.log(` Options  : +faststart pour streaming web immédiat`);
console.log("========================================================\n");

const ffmpegArgs = [
  "-y",
  "-i", inputPath,
  "-c:v", "libx264",
  "-preset", "veryfast",
  "-profile:v", "baseline",
  "-level", "3.0",
  "-b:v", "250k",
  "-maxrate", "350k",
  "-bufsize", "500k",
  "-crf", "28",
  "-vf", "scale=-2:240",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "64k",
  "-ac", "1",
  "-ar", "22050",
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
    console.log(" Compression 240p réussie !");
    console.log(` Poids initial : ${inputSize} Mo`);
    console.log(` Poids final   : ${outputSize} Mo (-${ratio}%)`);
    console.log(` Fichier prêt au streaming : ${outputPath}`);
    console.log("========================================================");
  } else {
    console.error(`\n[Échec] Le processus FFmpeg s'est arrêté avec le code : ${code}`);
    process.exit(code || 1);
  }
});
