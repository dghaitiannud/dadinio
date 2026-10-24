# CONTEXTE

Projet React + TypeScript avec un lecteur vidéo HLS (hls.js) qui fonctionne déjà.
Fichiers concernés :
- src/components/watch.tsx (ou équivalent — cherche "HybridVideoPlayer")
- scripts/transcode-media.sh (transcodage HLS multi-débit)
- scripts/transcode.js (fallback Windows)
- scripts/compress-video.js
- scripts/compress-video-solution-a.sh

Objectif : implémenter une sélection de qualité pilotée par le débit réseau avec
des SEUILS FIXES, et permettre à l'utilisateur de forcer manuellement une
résolution en pixels (avec persistance).

# ÉTAPE 1 — Modifier transcode-media.sh

Ajouter les variantes 144p et 720p aux renditions HLS existantes (240p, 360p, 480p).

Renditions finales à produire (HLS + MP4 faststart) :

| Qualité | Hauteur | Bitrate vidéo | Maxrate | Bufsize | CRF | Audio | Canaux |
|---------|---------|---------------|---------|---------|-----|-------|--------|
| 144p    | 144     | 100k          | 150k    | 250k    | 30  | 48k   | 1      |
| 240p    | 240     | 250k          | 350k    | 500k    | 28  | 64k   | 1      |
| 360p    | 360     | 400k          | 550k    | 800k    | 26  | 96k   | 2      |
| 480p    | 480     | 700k          | 900k    | 1400k   | 24  | 96k   | 2      |
| 720p    | 720     | 2000k         | 2500k   | 3500k   | 23  | 128k  | 2      |

Contraintes pour chaque rendition HLS :
- `-g 48 -keyint_min 48 -sc_threshold 0` (GOP aligné pour ABR)
- `-hls_time 4 -hls_playlist_type vod -hls_list_size 0`
- Profil : baseline/3.0 pour 144p & 240p, main/3.0 pour 360p, main/3.1 pour 480p & 720p
- MP4 par défaut (`video_optimized_144p.mp4`) : 144p + `-movflags +faststart`

Générer aussi `master.m3u8` avec les 5 entrées, ex :
#EXT-X-STREAM-INF:BANDWIDTH=160000,RESOLUTION=256x144,NAME="144p"
144p/index.m3u8
... (BANDWIDTH = bitrate audio + vidéo, arrondis au millier supérieur)

# ÉTAPE 2 — Mettre à jour transcode.js (fallback Windows)

Dans le bloc `else` (multi-plateformes, sans bash), reproduire les 5 renditions
avec un tableau JS `renditions = [{name, h, bv, max, buf, crf, ba, ac, profile, level}, ...]`
et générer le même master.m3u8. Pas de bash requis.

# ÉTAPE 3 — Modifier HybridVideoPlayer dans watch.tsx

Ajouter (au niveau module, en haut du fichier) :

```typescript
const QUALITY_THRESHOLDS = [
  { height: 144, maxMbps: 5 },
  { height: 240, maxMbps: 10 },
  { height: 360, maxMbps: 20 },
  { height: 480, maxMbps: 30 },
  { height: 720, maxMbps: Infinity },
] as const;

const QUALITY_OVERRIDE_KEY = "hls-quality-override";

function getTargetHeightForBandwidth(mbps: number): number { /* ... */ }
function readBandwidthMbps(): number | null { /* navigator.connection.downlink */ }
function findBestLevelIndex(levels: QualityLevel[], targetHeight: number): number { /* ... */ }
```

Dans le composant :

1. Au MANIFEST_PARSED :
   · Lire localStorage.getItem(QUALITY_OVERRIDE_KEY). Si valeur numérique → appliquer
     cette hauteur via findBestLevelIndex + hls.currentLevel = idx + set
     currentQualityIndex = idx.
   · Sinon → lire readBandwidthMbps(). Si disponible, appliquer le seuil via
     getTargetHeightForBandwidth + hls.currentLevel = idx + currentQualityIndex = -1.
   · Si l'API est absente → hls.currentLevel = -1 (laisser hls.js gérer).
2. Ajouter un useEffect qui écoute navigator.connection.change :
   · En mode Auto (pas de localStorage override) → ré-applique applyAutoQuality().
   · En mode manuel → NE PAS toucher au choix utilisateur.
3. changeQuality(levelIndex) :
   · Si -1 → retirer localStorage, hls.currentLevel = -1, set state à -1,
     toast "Qualité : Automatique (selon débit)".
   · Sinon → hls.currentLevel = levelIndex, persister String(levels[levelIndex].height)
     dans localStorage, set state, toast "Qualité : ${label}".
4. Menu UI (composant existant de paramètres) :
   · Trier les niveaux par height croissante (144p → 720p).
   · Option "Auto" en premier avec affichage de la cible calculée : Auto (360p)
     si readBandwidthMbps() renvoie une valeur, sinon Auto.
   · Case cochée ✓ sur l'option active (Auto ou pixel).

CONTRAINTES TECHNIQUES

· Ne pas casser le fallback HLS → MP4 existant.
· Ne pas casser la reprise réseau (online/offline).
· Ne pas casser la persistance du choix en mode manuel lors d'un connection.change.
· Le mode Auto doit réagir aux changements de débit (montée/descente).
· Sur Safari/iOS (HLS natif) : garder le comportement actuel (sélecteur inactif,
  le navigateur gère l'ABR). Pas de hls.js disponible → pas d'override.
· TypeScript strict : pas de any non justifié, typer les helpers.
· Conserver la compatibilité du composant avec les props existantes (src,
  poster, fallbackSrc).

CRITÈRES D'ACCEPTATION

1. Un visiteur à 3 Mbps voit 144p par défaut (dans le badge + le menu Auto).
2. Un visiteur à 12 Mbps voit 360p par défaut.
3. Passer de 12 → 25 Mbps déclenche le passage automatique à 480p.
4. L'utilisateur choisit manuellement 720p → résolution fixée, persiste après reload.
5. Retour en "Auto" → seuils repris, résolution recalculée.
6. Le master.m3u8 généré contient les 5 entrées (144p, 240p, 360p, 480p, 720p).
7. Le MP4 fallback (video_optimized_144p.mp4) est bien produit en 144p.
8. Aucune régression sur le buffering, les erreurs, et le fallback MP4.
