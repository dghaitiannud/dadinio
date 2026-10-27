import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Hls from "hls.js";
import { useAuth } from "@/lib/auth-context";
import { WifiOff, RotateCcw, AlertTriangle, Loader2 } from "lucide-react"; // Settings et Check retirés
import { getVideoAds, type VideoAd } from "@/lib/supabase-db";
import { AdOverlay } from "@/components/ad-overlay";
import { PlayerSettings } from "./player-settings";
import { QualityLevel } from "./types";
import { useTranslation } from "react-i18next";

const QUALITY_THRESHOLDS = [
{ height: 144, maxMbps: 5 }, { height: 240, maxMbps: 10 },
{ height: 360, maxMbps: 20 }, { height: 480, maxMbps: 30 },
{ height: 720, maxMbps: Infinity }] as
const;

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

function deriveMp4Fallback(hlsUrl: string): string | null {
  if (!hlsUrl) return null;
  if (hlsUrl.includes(".m3u8")) {
    return hlsUrl.replace(/\.m3u8(\?.*)?$/i, ".mp4$1");
  }
  return null;
}

function VideoErrorOverlay({ message, isNetworkError, onRetry }: {message: string;isNetworkError: boolean;onRetry: () => void;}) {const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6 text-center animate-in fade-in duration-300 rounded-xl">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
          {isNetworkError ? <WifiOff className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1.5">
        {isNetworkError ? t("Connexion interrompue") : t("Problème de lecture")}
      </h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl px-5 py-2.5 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 flex items-center">
        
        <RotateCcw className="h-4 w-4" /> {t("Réessayer la lecture")}
      </button>
    </div>);

}

function BufferingLoader({ progressPct }: {progressPct: number | null;}) {const { t } = useTranslation();
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 rounded-xl">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="h-14 w-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
      <div className="mt-3.5 flex flex-col items-center">
        <span className="text-xs font-medium tracking-wide text-white/90 drop-shadow">{t("Chargement du flux...")}</span>
        {progressPct !== null && progressPct > 0 && progressPct <= 100 &&
        <div className="mt-1 flex items-center gap-1.5">
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-zinc-300">{progressPct}%</span>
          </div>
        }
      </div>
    </div>);

}

export function HybridVideoPlayer({ src, poster, videoId, fallbackSrc }: {src: string;poster?: string;videoId: string;fallbackSrc?: string;}) {
  const { t } = useTranslation();
  // 🛠️ CORRECTION 1 : On récupère i18n
  const { i18n } = useTranslation();
  const { appUser } = useAuth();
  const isVip = appUser?.plan === "vip";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPlaybackPosition = useRef<number>(0);
  const mediaRecoveryAttempts = useRef<number>(0);
  const networkRecoveryAttempts = useRef<number>(0);

  const [activeSrc, setActiveSrc] = useState<string>(src);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<{message: string;isNetwork: boolean;} | null>(null);
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

  const streamType = useMemo(() => activeSrc.includes(".m3u8") ? "hls" : "mp4", [activeSrc]);

  useEffect(() => {
    setActiveSrc(src);
    setIsFallbackActive(false);
    setCurrentQualityIndex(-1);
    setLevels([]);
  }, [src]);

  // Chargement des pubs (sauf si VIP)
  useEffect(() => {
    if (!videoId || isVip) return;

    // 🛠️ CORRECTION 1 (suite) : Utilisation de i18n.language au lieu de t('common.lang_code')
    const langCode = i18n.language.split('-')[0] || "fr";

    getVideoAds(videoId, langCode).then((list) => {
      setAds(list);
      const preRolls = list.filter((a) => a.adType === 'pre-roll');
      if (preRolls.length > 0) {
        const randomPreRoll = preRolls[Math.floor(Math.random() * preRolls.length)];
        setCurrentAd(randomPreRoll);
        setPlayedAds(new Set([randomPreRoll.id]));
      }
    });
  }, [videoId, isVip, i18n.language]);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.detachMedia();
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const triggerMp4Fallback = useCallback((reason: string, isNetwork = false) => {
    const video = videoRef.current;
    if (video) lastPlaybackPosition.current = video.currentTime || 0;

    const targetMp4 = fallbackSrc || deriveMp4Fallback(src);
    if (targetMp4 && targetMp4 !== activeSrc) {
      cleanupHls();
      setIsFallbackActive(true);
      setActiveSrc(targetMp4);
      setPlaybackError(null);
    } else {
      setPlaybackError({
        message: !navigator.onLine ? "Vous semblez hors ligne. Vérifiez votre connexion." : reason,
        isNetwork: isNetwork || !navigator.onLine
      });
      cleanupHls();
    }
  }, [fallbackSrc, src, activeSrc, cleanupHls]);

  const updateProgressFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;
    const current = video.currentTime;
    const buffered = video.buffered;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= current && current <= buffered.end(i)) {
        const pct = Math.min(100, Math.round(buffered.end(i) / video.duration * 100));
        setBufferProgress(pct);
        return;
      }
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    setPlaybackError(null);
    setIsBuffering(true);
    setBufferProgress(null);
    setCurrentLevelResolution(null);
    mediaRecoveryAttempts.current = 0;
    networkRecoveryAttempts.current = 0;

    cleanupHls();

    if (streamType === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxBufferLength: 30
        });
        hlsRef.current = hls;

        hls.loadSource(activeSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          setIsBuffering(false);
          if (data.levels && data.levels.length > 0) {
            const parsedLevels: QualityLevel[] = data.levels.map((lvl, index) => ({
              id: index,
              label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
              height: lvl.height || 0,
              bitrate: lvl.bitrate
            }));
            setLevels(parsedLevels);

            const mbps = readBandwidthMbps();
            if (mbps !== null) {
              const targetHeight = getTargetHeightForBandwidth(mbps);
              const idx = findBestLevelIndex(parsedLevels, targetHeight);
              hls.currentLevel = idx;
              setAutoTargetHeight(targetHeight);
            }

            const first = data.levels[0];
            if (first.height) setCurrentLevelResolution(`${first.height}p`);
          }
          if (lastPlaybackPosition.current > 0) {
            video.currentTime = lastPlaybackPosition.current;
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          const currentLevel = hls.levels[data.level];
          if (currentLevel?.height) setCurrentLevelResolution(`${currentLevel.height}p`);
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => updateProgressFromVideo());

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            networkRecoveryAttempts.current += 1;
            if (networkRecoveryAttempts.current <= 3 && navigator.onLine) {
              setTimeout(() => hls.startLoad(), 1000 * networkRecoveryAttempts.current);
            } else {
              triggerMp4Fallback("Impossible de joindre le flux HLS. Basculement MP4.", true);
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            mediaRecoveryAttempts.current += 1;
            if (mediaRecoveryAttempts.current <= 2) {
              hls.recoverMediaError();
            } else {
              triggerMp4Fallback("Erreur de décodage du flux. Basculement MP4.", false);
            }
          } else {
            triggerMp4Fallback("Lecture du flux HLS interrompue.", false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = activeSrc;
        video.load();
      } else {
        triggerMp4Fallback("Format HLS non supporté sur ce navigateur.", false);
      }
    } else {
      video.removeAttribute("src");
      video.load();
      video.src = activeSrc;
      video.load();
      if (lastPlaybackPosition.current > 0) {
        video.currentTime = lastPlaybackPosition.current;
        video.play().catch(() => {});
      }
    }

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setPlaybackError(null);
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handleProgress = () => updateProgressFromVideo();
    const handleError = () => {
      triggerMp4Fallback("Erreur lors du chargement de la vidéo.", !navigator.onLine);
      setIsBuffering(false);
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("error", handleError);
      cleanupHls();
    };
  }, [activeSrc, streamType, retryKey, cleanupHls, triggerMp4Fallback, updateProgressFromVideo]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || currentAd || isVip) return;

    const currentTime = video.currentTime;
    const videoDuration = video.duration;
    const midRollTrigger = videoDuration > 120 ? videoDuration / 2 : 120;

    const pendingMidRolls = ads.filter((a) => a.adType === 'mid-roll' && !playedAds.has(a.id));
    if (pendingMidRolls.length > 0) {
      const targetAd = pendingMidRolls[0];
      const triggerTime = targetAd.triggerSeconds > 0 ? targetAd.triggerSeconds : midRollTrigger;

      if (currentTime >= triggerTime && currentTime <= triggerTime + 2) {
        video.pause();
        setCurrentAd(targetAd);
        setPlayedAds((prev) => new Set(prev).add(targetAd.id));
      }
    }
  };

  const handleRetry = () => {
    setActiveSrc(src);
    setIsFallbackActive(false);
    setPlaybackError(null);
    setIsBuffering(true);
    setRetryKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center select-none rounded-xl">
      {currentAd &&
      <AdOverlay
        adUrl={currentAd.adVideoUrl}
        clickUrl={currentAd.clickUrl}
        skipAfter={currentAd.skipAfter}
        onComplete={() => {
          setCurrentAd(null);
          videoRef.current?.play().catch(() => {});
        }} />

      }

      <video
        ref={videoRef}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        onTimeUpdate={handleVideoTimeUpdate}
        className="w-full h-full object-contain rounded-xl">
        
        {streamType === "mp4" && <source src={activeSrc} type="video/mp4" />}
      </video>

      {(isFallbackActive || streamType === "hls" && currentLevelResolution) &&
      <div className="absolute top-3 left-3 z-20 pointer-events-none opacity-80 flex items-center gap-1.5">
          {isFallbackActive &&
        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-zinc-300 border border-white/10">
              {t("MP4 (Secours)")}
            </span>
        }
          {streamType === "hls" && currentLevelResolution &&
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-white">
              {currentLevelResolution}
            </span>
        }
        </div>
      }

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
          } else {
            hlsRef.current.currentLevel = idx;
            setCurrentQualityIndex(idx);

            // 🛠️ CORRECTION 2 : Sauvegarde de la qualité manuelle
            const selected = levels[idx];
            if (selected?.height) {
              localStorage.setItem(QUALITY_OVERRIDE_KEY, String(selected.height));
            }
          }
        }}
        playbackSpeed={playbackSpeed}
        changeSpeed={(speed) => {
          setPlaybackSpeed(speed);
          if (videoRef.current) videoRef.current.playbackRate = speed;
          setShowSettingsMenu(false);
        }} />
      

      {isBuffering && !playbackError && <BufferingLoader progressPct={bufferProgress} />}
      {playbackError && <VideoErrorOverlay message={playbackError.message} isNetworkError={playbackError.isNetwork} onRetry={handleRetry} />}
    </div>);

}