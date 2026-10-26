import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Hls from "hls.js";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Settings, Check, WifiOff, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { getVideoAds, type VideoAd } from "@/lib/supabase-db";
import { AdOverlay } from "@/components/ad-overlay";
import { PlayerSettings } from "./player-settings";
import { QualityLevel } from "./types";
import { useTranslation } from "react-i18next";

// ... (Fonctions helper: detectStreamType, deriveMp4Fallback, getConnection, etc. restent identiques)
// ... (COMPOSANTS: VideoErrorOverlay, BufferingLoader restent identiques)

const QUALITY_THRESHOLDS = [
  { height: 144, maxMbps: 5 }, { height: 240, maxMbps: 10 },
  { height: 360, maxMbps: 20 }, { height: 480, maxMbps: 30 },
  { height: 720, maxMbps: Infinity },
] as const;

const QUALITY_OVERRIDE_KEY = "hls-quality-override";

function getTargetHeightForBandwidth(mbps: number): number {
  for (const threshold of QUALITY_THRESHOLDS) {
    if (mbps <= threshold.maxMbps) return threshold.height;
  }
  return QUALITY_THRESHOLDS[QUALITY_THRESHOLDS.length - 1].height;
}

function readBandwidthMbps(): number | null {
  const conn = (navigator as any).connection;
  return conn && typeof conn.downlink === "number" && conn.downlink > 0 ? conn.downlink : null;
}

function findBestLevelIndex(levels: QualityLevel[], targetHeight: number): number {
  if (levels.length === 0) return -1;
  const sortedDesc = [...levels].sort((a, b) => b.height - a.height);
  for (const lvl of sortedDesc) {
    if ((lvl.height || 0) <= targetHeight) return lvl.id;
  }
  return [...levels].sort((a, b) => a.height - b.height)[0].id;
}

export function HybridVideoPlayer({ src, poster, videoId }: { src: string; poster?: string; videoId: string }) {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const isVip = appUser?.plan === "vip"; // VIP = Pas de pubs
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPlaybackPosition = useRef<number>(0);
  const mediaRecoveryAttempts = useRef<number>(0);
  const networkRecoveryAttempts = useRef<number>(0);

  const [activeSrc, setActiveSrc] = useState<string>(src);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<{ message: string; isNetwork: boolean } | null>(null);
  const [currentLevelResolution, setCurrentLevelResolution] = useState<string | null>(null);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [autoTargetHeight, setAutoTargetHeight] = useState<number | null>(null);

  // === PUBLICITÉS ===
  const [ads, setAds] = useState<VideoAd[]>([]);
  const [currentAd, setCurrentAd] = useState<VideoAd | null>(null);
  const [playedAds, setPlayedAds] = useState<Set<string>>(new Set());

  const streamType = useMemo(() => (activeSrc.includes(".m3u8") ? "hls" : "mp4"), [activeSrc]);

  // Chargement des pubs (avec langue) - Sauf si VIP
  useEffect(() => {
    if (!videoId || isVip) return;
    
    getVideoAds(videoId, t('common.lang_code') || "fr").then((list) => {
      setAds(list);
      // 1. Choix aléatoire d'une pre-roll
      const preRolls = list.filter(a => a.adType === 'pre-roll');
      if (preRolls.length > 0) {
        const randomPreRoll = preRolls[Math.floor(Math.random() * preRolls.length)];
        setCurrentAd(randomPreRoll);
        setPlayedAds(new Set([randomPreRoll.id]));
      }
    });
  }, [videoId, isVip, t]);

  // ... (Les fonctions HLS setup, cleanup, applyAutoQuality, triggerMp4Fallback restent identiques)

  // Détection Mid-roll (ajustée pour les vidéos de 3-4 mins)
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || currentAd || isVip) return;

    const currentTime = video.currentTime;
    const videoDuration = video.duration;

    // Si la vidéo dure environ 3-4 mins (180s), on déclenche une pub à la moitié
    const midRollTrigger = videoDuration > 120 ? videoDuration / 2 : 120;

    const pendingMidRolls = ads.filter(
      a => a.adType === 'mid-roll' && !playedAds.has(a.id)
    );

    if (pendingMidRolls.length > 0) {
      const randomMidRoll = pendingMidRolls[0]; // On prend la première dispo
      // Si l'user a spécifié une trigger_seconds, on l'utilise, sinon on utilise la moitié
      const triggerTime = randomMidRoll.triggerSeconds > 0 ? randomMidRoll.triggerSeconds : midRollTrigger;

      if (currentTime >= triggerTime && currentTime <= triggerTime + 2) {
        video.pause();
        setCurrentAd(randomMidRoll);
        setPlayedAds(prev => new Set(prev).add(randomMidRoll.id));
      }
    }
  };

  // ... (useEffect principal HLS setup)

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center select-none rounded-xl">
      {currentAd && (
        <AdOverlay
          adUrl={currentAd.adVideoUrl}
          clickUrl={currentAd.clickUrl}
          skipAfter={currentAd.skipAfter}
          onComplete={() => {
            setCurrentAd(null);
            videoRef.current?.play().catch(() => {});
          }}
        />
      )}

      <video
        ref={videoRef}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        onTimeUpdate={handleVideoTimeUpdate}
        className="w-full h-full object-contain rounded-xl"
      >
        {streamType === "mp4" && <source src={activeSrc} type="video/mp4" />}
      </video>

      {/* Badges et Loaders... */}

      <PlayerSettings
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        streamType={streamType}
        levels={levels}
        currentQualityIndex={currentQualityIndex}
        autoTargetHeight={autoTargetHeight}
        changeQuality={(idx) => {
          setShowSettingsMenu(false);
          if (!hlsRef.current) return;
          if (idx === -1) {
            localStorage.removeItem(QUALITY_OVERRIDE_KEY);
            hlsRef.current.currentLevel = -1;
            setCurrentQualityIndex(-1);
            // applyAutoQuality();
          } else {
            hlsRef.current.currentLevel = idx;
            setCurrentQualityIndex(idx);
            const selected = levels[idx];
            if (selected?.height) localStorage.setItem(QUALITY_OVERRIDE_KEY, String(selected.height));
          }
        }}
        playbackSpeed={playbackSpeed}
        changeSpeed={(speed) => {
          setPlaybackSpeed(speed);
          if (videoRef.current) videoRef.current.playbackRate = speed;
          setShowSettingsMenu(false);
        }}
      />
    </div>
  );
}