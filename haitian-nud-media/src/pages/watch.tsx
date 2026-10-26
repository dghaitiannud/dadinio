import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "wouter";
import Hls from "hls.js";
import { useAuth } from "@/lib/auth-context";
import {
  getVideo, getVideos, registerView, requestDownload,
  listComments, createComment, getVideoAds, type Video, type Comment, type VideoAd
} from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Download, Heart, Share2, Star, MessageSquare, AlertCircle,
  Lock, Copy, Wifi, WifiOff, Loader2, ArrowRight, RotateCcw,
  AlertTriangle, Settings, Check
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { downloadAndSaveVideo, listOfflineVideos } from "@/lib/offline-store";
import { AdOverlay } from "@/components/ad-overlay";

const API_BASE_URL = "https://api.haitiannud.com";

const getProxyDownloadUrl = (rawUrl: string | undefined | null, title?: string): string => {
  if (!rawUrl) return "";
  const safeFilename = (title || "video").replace(/[^a-zA-Z0-9_\-]/g, "_") + ".mp4";
  return `${API_BASE_URL}/api/proxy/video?url=${encodeURIComponent(rawUrl)}&download=true&filename=${encodeURIComponent(safeFilename)}`;
};

const getProxyVideoUrl = (rawUrl: string | undefined | null): string => {
  if (!rawUrl) return "";
  return `${API_BASE_URL}/api/proxy/video?url=${encodeURIComponent(rawUrl)}&download=true`;
};

const t = (key: string, options?: any) => (window as any).t ? (window as any).t(key, options) : key;

function VipGate() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 rounded-xl px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20 shadow-inner">
        <Lock className="h-6 w-6 text-yellow-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{t('watch.private_space')}</h3>
      <p className="text-zinc-400 text-sm text-center mb-6 max-w-xs leading-relaxed">
        Cette vidéo exclusive est réservée aux membres VIP. Devenez Premium pour débloquer tout le catalogue instantanément.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
        <Link href="/plans" className="w-full sm:flex-1">
          <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-2 py-5 rounded-xl shadow-lg">
            Devenir Membre VIP <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function NetworkStatusIcon() {
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  useEffect(() => {
    const updateStatus = () => {
      // @ts-ignore
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && conn.downlink !== undefined) {
        const speed = conn.downlink; 
        if (speed >= 5) setNetworkQuality('excellent');      
        else if (speed >= 1.5) setNetworkQuality('good');   
        else setNetworkQuality('poor');                     
      } else {
        setNetworkQuality('unknown');                        
      }
    };

    updateStatus();

    // @ts-ignore
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateStatus);
    }
    return () => {
      if (conn) conn.removeEventListener('change', updateStatus);
    };
  }, []);

  const getColorClass = () => {
    switch (networkQuality) {
      case 'excellent': return 'text-green-500 fill-green-500/20';
      case 'good': return 'text-yellow-500 fill-yellow-500/20';
      case 'poor': return 'text-red-500 fill-red-500/20';
      default: return 'text-white/70 fill-transparent';
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-medium text-white transition-all">
      <span className="text-white/60">{t('watch.online')}</span>
      <div className="relative flex items-center">
        <Wifi className={`h-4 w-4 transition-colors duration-300 ${getColorClass()}`} />
        {networkQuality !== 'unknown' && (
          <span className={`absolute top-0 right-0 h-1.5 w-1.5 rounded-full animate-ping ${
            networkQuality === 'excellent' ? 'bg-green-500' :
            networkQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        )}
      </div>
    </div>
  );
}

type StreamType = "mp4" | "hls";

function detectStreamType(url: string): StreamType {
  if (!url) return "mp4";
  const cleanUrl = url.split("?")[0].toLowerCase();
  const searchParams = url.toLowerCase();

  if (
    cleanUrl.endsWith(".m3u8") ||
    cleanUrl.includes(".m3u8") ||
    searchParams.includes("format=m3u8") ||
    searchParams.includes("manifest=m3u8") ||
    searchParams.includes("type=hls")
  ) {
    return "hls";
  }
  return "mp4";
}

function deriveMp4Fallback(hlsUrl: string): string | null {
  if (!hlsUrl) return null;
  if (hlsUrl.includes(".m3u8")) {
    return hlsUrl.replace(/\.m3u8(\?.*)?$/i, ".mp4$1");
  }
  return null;
}

interface VideoErrorOverlayProps {
  message: string;
  isNetworkError: boolean;
  onRetry: () => void;
}

function VideoErrorOverlay({ message, isNetworkError, onRetry }: VideoErrorOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6 text-center animate-in fade-in duration-300 rounded-xl">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
          {isNetworkError ? <WifiOff className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1.5">
        {isNetworkError ? "Connexion interrompue" : "Problème de lecture"}
      </h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl px-5 py-2.5 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          <RotateCcw className="h-4 w-4" /> Réessayer la lecture
        </Button>
      </div>
    </div>
  );
}

interface BufferingLoaderProps {
  progressPct: number | null;
}

function BufferingLoader({ progressPct }: BufferingLoaderProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 rounded-xl">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="h-14 w-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
      <div className="mt-3.5 flex flex-col items-center">
        <span className="text-xs font-medium tracking-wide text-white/90 drop-shadow">
          Chargement du flux...
        </span>
        {progressPct !== null && progressPct > 0 && progressPct <= 100 && (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-300">{progressPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export interface QualityLevel {
  id: number;
  label: string;
  height: number;
  bitrate?: number;
}

const QUALITY_THRESHOLDS = [
  { height: 144, maxMbps: 5 },
  { height: 240, maxMbps: 10 },
  { height: 360, maxMbps: 20 },
  { height: 480, maxMbps: 30 },
  { height: 720, maxMbps: Infinity },
] as const;

const QUALITY_OVERRIDE_KEY = "hls-quality-override";

interface NetworkInformationLike extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
}

function getConnection(): NetworkInformationLike | null {
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

function getTargetHeightForBandwidth(mbps: number): number {
  for (const threshold of QUALITY_THRESHOLDS) {
    if (mbps <= threshold.maxMbps) {
      return threshold.height;
    }
  }
  return QUALITY_THRESHOLDS[QUALITY_THRESHOLDS.length - 1].height;
}

function readBandwidthMbps(): number | null {
  const conn = getConnection();
  if (!conn || typeof conn.downlink !== "number" || !Number.isFinite(conn.downlink) || conn.downlink <= 0) {
    return null;
  }
  return conn.downlink;
}

function findBestLevelIndex(levels: QualityLevel[], targetHeight: number): number {
  if (levels.length === 0) return -1;

  const sortedDesc = [...levels].sort((a, b) => b.height - a.height);
  for (const lvl of sortedDesc) {
    if ((lvl.height || 0) <= targetHeight) return lvl.id;
  }
  const sortedAsc = [...levels].sort((a, b) => a.height - b.height);
  return sortedAsc[0].id;
}

function readQualityOverride(): number | null {
  try {
    const raw = localStorage.getItem(QUALITY_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeQualityOverride(height: number | null): void {
  try {
    if (height === null) {
      localStorage.removeItem(QUALITY_OVERRIDE_KEY);
    } else {
      localStorage.setItem(QUALITY_OVERRIDE_KEY, String(height));
    }
  } catch { /* localStorage indisponible */ }
}

interface HybridVideoPlayerProps {
  src: string;
  poster?: string;
  fallbackSrc?: string;
  videoId: string;
}

function HybridVideoPlayer({ src, poster, fallbackSrc, videoId }: HybridVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mediaRecoveryAttempts = useRef<number>(0);
  const networkRecoveryAttempts = useRef<number>(0);
  const lastPlaybackPosition = useRef<number>(0);

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

  useEffect(() => {
    setActiveSrc(src);
    setIsFallbackActive(false);
    setCurrentQualityIndex(-1);
    setLevels([]);
  }, [src]);

  // Chargement des pubs au démarrage
  useEffect(() => {
    if (!videoId) return;
    getVideoAds(videoId).then((list) => {
      setAds(list);
      const preRoll = list.find(a => a.adType === 'pre-roll');
      if (preRoll) setCurrentAd(preRoll);
    });
  }, [videoId]);

  const streamType = useMemo(() => detectStreamType(activeSrc), [activeSrc]);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.detachMedia();
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const applyAutoQuality = useCallback(() => {
    const hls = hlsRef.current;
    if (!hls || hls.levels.length === 0) return;

    const mbps = readBandwidthMbps();
    if (mbps === null) {
      hls.currentLevel = -1;
      setCurrentQualityIndex(-1);
      setAutoTargetHeight(null);
      return;
    }

    const targetHeight = getTargetHeightForBandwidth(mbps);
    const parsedLevels: QualityLevel[] = hls.levels.map((lvl, index) => ({
      id: index,
      label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
      height: lvl.height || 0,
      bitrate: lvl.bitrate,
    }));
    const idx = findBestLevelIndex(parsedLevels, targetHeight);
    hls.currentLevel = idx;
    setCurrentQualityIndex(-1);
    setAutoTargetHeight(targetHeight);
  }, []);

  const triggerMp4Fallback = useCallback((reason: string, isNetwork = false) => {
    const video = videoRef.current;
    if (video) {
      lastPlaybackPosition.current = video.currentTime || 0;
    }

    const targetMp4 = fallbackSrc || deriveMp4Fallback(src);
    if (targetMp4 && targetMp4 !== activeSrc) {
      console.warn(`[Video Player] Fallback HLS -> MP4 déclenché (${reason}):`, targetMp4);
      cleanupHls();
      setIsFallbackActive(true);
      setActiveSrc(targetMp4);
      setPlaybackError(null);
    } else {
      setPlaybackError({
        message: !navigator.onLine
          ? "Vous semblez hors ligne. Vérifiez votre connexion internet."
          : reason,
        isNetwork: isNetwork || !navigator.onLine,
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
        const bufferedEnd = buffered.end(i);
        const pct = Math.min(100, Math.round((bufferedEnd / video.duration) * 100));
        setBufferProgress(pct);
        return;
      }
    }
  }, []);

  // Détection Mid-roll
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || currentAd) return;

    const pending = ads.find(
      a => a.adType === 'mid-roll' &&
           !playedAds.has(a.id) &&
           video.currentTime >= a.triggerSeconds &&
           video.currentTime <= a.triggerSeconds + 2
    );

    if (pending) {
      video.pause();
      setCurrentAd(pending);
      setPlayedAds(prev => new Set(prev).add(pending.id));
    }
  };

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
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          abrEwmaDefaultEstimate: 2500000,
          abrBandWidthFactor: 0.9,
          abrBandWidthUpFactor: 0.7,
          manifestLoadingTimeOut: 12000,
          manifestLoadingMaxRetry: 3,
          levelLoadingTimeOut: 12000,
          levelLoadingMaxRetry: 3,
          fragLoadingTimeOut: 18000,
          fragLoadingMaxRetry: 4,
          startLevel: -1,
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

            const overrideHeight = readQualityOverride();
            if (overrideHeight !== null) {
              const idx = findBestLevelIndex(parsedLevels, overrideHeight);
              hls.currentLevel = idx;
              setCurrentQualityIndex(idx);
              setAutoTargetHeight(null);
            } else {
              const mbps = readBandwidthMbps();
              if (mbps !== null) {
                const targetHeight = getTargetHeightForBandwidth(mbps);
                const idx = findBestLevelIndex(parsedLevels, targetHeight);
                hls.currentLevel = idx;
                setCurrentQualityIndex(-1);
                setAutoTargetHeight(targetHeight);
              } else {
                hls.currentLevel = -1;
                setCurrentQualityIndex(-1);
                setAutoTargetHeight(null);
              }
            }

            const first = data.levels[0];
            if (first.height) {
              setCurrentLevelResolution(`${first.height}p`);
            }
          }
          if (lastPlaybackPosition.current > 0) {
            video.currentTime = lastPlaybackPosition.current;
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          const currentLevel = hls.levels[data.level];
          if (currentLevel?.height) {
            setCurrentLevelResolution(`${currentLevel.height}p`);
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          updateProgressFromVideo();
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRecoveryAttempts.current += 1;
              console.warn(`[HLS] Erreur réseau (${networkRecoveryAttempts.current}/3)...`);
              if (networkRecoveryAttempts.current <= 3 && navigator.onLine) {
                setTimeout(() => {
                  hls.startLoad();
                }, 1000 * networkRecoveryAttempts.current);
              } else {
                triggerMp4Fallback("Impossible de joindre le flux streaming HLS. Basculement MP4.", true);
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              mediaRecoveryAttempts.current += 1;
              console.warn(`[HLS] Erreur média (${mediaRecoveryAttempts.current}/2)...`);
              if (mediaRecoveryAttempts.current <= 2) {
                hls.recoverMediaError();
              } else {
                triggerMp4Fallback("Erreur de décodage du flux streaming. Basculement MP4.", false);
              }
              break;

            default:
              console.error("[HLS] Erreur fatale non récupérable:", data);
              triggerMp4Fallback("Lecture du flux HLS interrompue.", false);
              break;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = activeSrc;
        video.load();
        if (lastPlaybackPosition.current > 0) {
          video.currentTime = lastPlaybackPosition.current;
        }
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
    const handleStalled = () => {
      if (video.paused) return;
      setIsBuffering(true);
    };
    const handlePlaying = () => {
      setIsBuffering(false);
      setPlaybackError(null);
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handleProgress = () => updateProgressFromVideo();
    const handleError = () => {
      const isOffline = !navigator.onLine;
      if (streamType === "hls") {
        triggerMp4Fallback("Erreur lors du chargement de la vidéo.", isOffline);
      } else {
        setPlaybackError({
          message: isOffline
            ? "Vous êtes actuellement hors ligne. Reconnectez-vous à Internet."
            : "Impossible de lire ce fichier vidéo. Veuillez réessayer.",
          isNetwork: isOffline,
        });
      }
      setIsBuffering(false);
    };

    const handleOnline = () => {
      if (playbackError?.isNetwork) {
        toast.info("Connexion rétablie, reprise de la lecture...");
        setRetryKey((prev) => prev + 1);
      }
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("error", handleError);
    window.addEventListener("online", handleOnline);

    return () => {
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("error", handleError);
      window.removeEventListener("online", handleOnline);
      cleanupHls();
    };
  }, [activeSrc, streamType, retryKey, cleanupHls, triggerMp4Fallback, updateProgressFromVideo]);

  useEffect(() => {
    if (streamType !== "hls") return;
    const conn = getConnection();
    if (!conn) return;

    const handleConnectionChange = () => {
      if (readQualityOverride() !== null) return;
      applyAutoQuality();
    };

    conn.addEventListener("change", handleConnectionChange);
    return () => {
      conn.removeEventListener("change", handleConnectionChange);
    };
  }, [streamType, applyAutoQuality]);

  const handleRetry = () => {
    setActiveSrc(src);
    setIsFallbackActive(false);
    setPlaybackError(null);
    setIsBuffering(true);
    setRetryKey((prev) => prev + 1);
  };

  const changeQuality = (levelIndex: number) => {
    setShowSettingsMenu(false);
    if (!hlsRef.current) return;

    if (levelIndex === -1) {
      writeQualityOverride(null);
      hlsRef.current.currentLevel = -1;
      setCurrentQualityIndex(-1);
      applyAutoQuality();
      toast.info("Qualité : Automatique (selon débit)");
      return;
    }

    const selected = levels[levelIndex];
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQualityIndex(levelIndex);
    setAutoTargetHeight(null);
    if (selected?.height) {
      writeQualityOverride(selected.height);
    }
    toast.info(`Qualité : ${selected?.label || "Manuel"}`);
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
    toast.info(`Vitesse : ${speed}x`);
  };

  console.log("PUB TEST - Ads chargées :", ads, "| Pub en cours :", currentAd);

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

      {(isFallbackActive || (streamType === "hls" && currentLevelResolution)) && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          {isFallbackActive && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-zinc-300 border border-white/10">
              MP4 (Secours)
            </span>
          )}
          {streamType === "hls" && currentLevelResolution && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-white">
              {currentLevelResolution}
            </span>
          )}
        </div>
      )}

      <div className="absolute top-3 right-3 z-50">
        <button
          type="button"
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          aria-label="Paramètres de lecture"
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white/80 hover:text-white border border-white/10 transition-all shadow-md"
        >
          <Settings className="h-4 w-4" />
        </button>

        {showSettingsMenu && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-white/15 p-2 shadow-2xl z-50 text-xs text-white max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
            {streamType === "hls" && levels.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold text-zinc-400 uppercase text-[10px] px-2 py-1">
                  Résolution (Pixels)
                </div>
                <button
                  type="button"
                  onClick={() => changeQuality(-1)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
                    currentQualityIndex === -1 ? "text-primary font-bold" : "text-zinc-200"
                  }`}
                >
                  <span>{autoTargetHeight ? `Auto (${autoTargetHeight}p)` : "Auto (Débit)"}</span>
                  {currentQualityIndex === -1 && <Check className="h-3 w-3" />}
                </button>
                {[...levels]
                  .sort((a, b) => a.height - b.height)
                  .map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => changeQuality(lvl.id)}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
                        currentQualityIndex === lvl.id ? "text-primary font-bold" : "text-zinc-200"
                      }`}
                    >
                      <span>{lvl.label}</span>
                      {currentQualityIndex === lvl.id && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                <div className="my-1 border-t border-white/10" />
              </div>
            )}

            <div>
              <div className="font-semibold text-zinc-400 uppercase text-[10px] px-2 py-1">
                Vitesse
              </div>
              {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeSpeed(s)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
                    playbackSpeed === s ? "text-primary font-bold" : "text-zinc-200"
                  }`}
                >
                  <span>{s === 1 ? "Normal (1x)" : `${s}x`}</span>
                  {playbackSpeed === s && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isBuffering && !playbackError && (
        <BufferingLoader progressPct={bufferProgress} />
      )}

      {playbackError && (
        <VideoErrorOverlay
          message={playbackError.message}
          isNetworkError={playbackError.isNetwork}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn, user, appUser, isLoading: authLoading } = useAuth(); 
  const [commentBody, setCommentBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [downloadPending, setDownloadPending] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [offlineDownloading, setOfflineDownloading] = useState(false);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";

  useEffect(() => {
    if (!id) return;

    const loadVideo = async () => {
      setIsLoadingVideo(true);
      setVideoError(null);
      try {
        const v = await getVideo(id);
        setVideo(v);

        if (v) {
          setLikesCount((v as any).likes_count || Math.floor(v.views * 0.12) || 0);
          registerView(id);
          if (user?.id) {
            import("@/lib/local-store").then(({ pushWatchHistory }) =>
              pushWatchHistory({ id, title: v.title, thumbnailUrl: v.thumbnailUrl })
            );
          }
          getVideos({ category: v.category })
            .then(vids => setRelatedVideos(vids.filter(vid => vid.id !== id)))
            .catch(err => console.warn('Failed to load related videos:', err));
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        setVideoError('Impossible de charger la vidéo. Vérifiez votre connexion.');
      } finally {
        setIsLoadingVideo(false);
      }
    };

    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const c = await listComments(id);
        setComments(c);
      } catch (err) {
        console.warn('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    };

    const checkOffline = async () => {
      try {
        const list = await listOfflineVideos();
        setIsOfflineAvailable(list.some((v) => v.id === id));
      } catch {
        setIsOfflineAvailable(false);
      }
    };

    loadVideo();
    loadComments();
    checkOffline();
  }, [id, user?.id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleLike = () => {
    if (!isSignedIn) {
      toast.error("Ou bezwen konekte pouw ka renmen videyo sa a");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      toast.success("Mèsi pou sipò w !");
    }
  };

  const handleShare = async () => {
    if (!isSignedIn) {
      toast.error("Ou bezwen konekte pouw ka pataje videyo sa a");
      return;
    }
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: video?.title || "HAITIAN NUD", url });
      } catch { }
    } else {
      await copyLink();
    }
  };

  const handleDownload = async () => {
    if (!id || !appUser) return;
    if (!isSignedIn) {
      toast.error("Fòk ou konekte pou kapab telechaje");
      return;
    }
    if (video?.isVip && !isUserVip) {
      toast.error("Vidéo VIP — Abonnez-vous pour accéder au téléchargement.");
      return;
    }

    setDownloadPending(true);
    const toastId = toast.loading("Démarrage du téléchargement...");

    try {
      const res = await requestDownload(id, appUser.id, isUserVip, appUser.freeDownloadsUsed);
      const rawDownloadUrl = res.url || video?.videoUrl;

      if (!rawDownloadUrl) {
        throw new Error("Lien de téléchargement introuvable.");
      }

      const downloadTargetUrl = getProxyDownloadUrl(rawDownloadUrl, video?.title);

      const a = document.createElement("a");
      a.href = downloadTargetUrl;
      const filename = `${(video?.title || "video").replace(/[^a-zA-Z0-9_\-]/g, "_")}.mp4`;
      a.setAttribute("download", filename);

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(
        isUserVip ? "Téléchargement lancé dans le navigateur !" : `Téléchargement lancé. ${res.remaining} restant(s).`,
        { id: toastId }
      );
    } catch (e: any) {
      if (e.message === 'vip_required') {
        toast.error("Abonnement VIP requis pour cette vidéo.", { id: toastId });
      } else if (e.message === 'quota_exceeded') {
        toast.error("Limite atteinte. Revenez demain ou passez VIP pour un accès illimité.", { id: toastId });
      } else {
        if (video?.videoUrl) {
          window.location.href = getProxyDownloadUrl(video.videoUrl, video?.title);
          toast.success("Téléchargement démarré.", { id: toastId });
        } else {
          toast.error(e?.message || "Erreur lors du lancement du téléchargement", { id: toastId });
        }
      }
    } finally {
      setDownloadPending(false);
    }
  };

  const handleOfflineDownload = async () => {
    if (!video || !video.videoUrl) return;
    if (!isSignedIn) {
      toast.error("Fòk ou konekte pou gade offline");
      return;
    }
    setOfflineDownloading(true);
    const toastId = toast.loading("Démarrage de la sauvegarde offline...");

    try {
      const proxiedVideoUrl = getProxyVideoUrl(video.videoUrl);

      await downloadAndSaveVideo(
        video.id,
        proxiedVideoUrl,
        video.title,
        video.description,
        video.thumbnailUrl,
        video.durationSec,
        video.category,
        (loaded, total) => {
          const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
          if (pct % 10 === 0) {
            toast.loading(`Téléchargement offline : ${pct}%`, { id: toastId });
          }
        }
      );
      toast.success("Vidéo disponible offline !", { id: toastId });
      setIsOfflineAvailable(true);
    } catch (e: any) {
      console.error("Erreur Offline :", e);
      let msg = e?.message || "Erreur de téléchargement offline";
      if (msg.includes("503") || msg.includes("Failed to fetch")) {
        msg = "Connexion lente ou interrompue. Réessayez dans quelques instants.";
      }
      toast.error(msg, { id: toastId });
    } finally {
      setOfflineDownloading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim() || !isSignedIn || !appUser) return;
    setCommentPending(true);
    try {
      await createComment(id, appUser.id, commentBody, anonymous, appUser.displayName || appUser.email);
      setCommentBody("");
      toast.success("Commentaire ajouté");
      const updated = await listComments(id);
      setComments(updated);
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setCommentPending(false);
    }
  };

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('watch.invalid_id')}</h2>
        <p className="text-muted-foreground mb-6">{t('watch.invalid_url')}</p>
        <Link href="/"><Button>{t('watch.back_home')}</Button></Link>
      </div>
    );
  }

  if (isLoadingVideo || authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/2 h-4" />
          </div>
          <div className="hidden lg:block space-y-4">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full aspect-video rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (videoError || !video) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">{t('common.error_loading')}</h2>
        <p className="text-muted-foreground mb-6">{videoError || "Vidéo introuvable"}</p>
        <Link href="/"><Button>{t('watch.back_home')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {isSignedIn && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">{t('watch.streaming')}</span>
              <NetworkStatusIcon />
            </div>
          )}

          <div className="relative w-full aspect-video bg-black rounded-xl shadow-2xl mb-4 group">
            {!isSignedIn ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center rounded-xl">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t('watch.restricted_content')}</h3>
                <p className="text-zinc-400 text-sm text-center mb-6 max-w-xs">
                  Konekte oswa kreye yon kont pou w ka gade videyo sa a.
                </p>
                <div className="flex gap-3">
                  <Link href="/login">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5">
                      Se connecter
                    </Button>
                  </Link>
                </div>
              </div>
            ) : video.isVip && !isUserVip ? (
              <VipGate />
            ) : video.videoUrl ? (
              <HybridVideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl || '/logo.jpg'}
                videoId={video.id}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 rounded-xl">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('watch.no_video_link')}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground border-border">{video.category}</Badge>
                  {video.isVip && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-400 text-white border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />{t('common.vip')}</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 leading-tight">{video.title}</h1>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <span>{video.views.toLocaleString()} vues</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: fr })}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleLike} 
                  className={`rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 ${
                    isLiked ? "text-red-500 bg-red-500/10 border-red-500/30" : ""
                  }`}
                >
                  <Heart 
                    className={`h-4 w-4 mr-2 transition-all duration-300 ${
                      isAnimating ? "scale-125" : "scale-100"
                    } ${
                      isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                    }`} 
                  />
                  <span>{likesCount > 0 ? likesCount.toLocaleString() : "J'aime"}</span>
                </Button>

                <Button variant="secondary" onClick={handleShare} className="rounded-full bg-accent hover:bg-accent/80">
                  <Share2 className="h-4 w-4 mr-2" /> Partager
                </Button>
                <Button variant="secondary" onClick={copyLink} className="rounded-full bg-accent hover:bg-accent/80">
                  <Copy className="h-4 w-4 mr-2" /> Copier le lien
                </Button>

                {isSignedIn && (!video.isVip || isUserVip) && (
                  <>
                    <Button onClick={handleDownload} disabled={downloadPending} className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(30,94,255,0.3)]">
                      {downloadPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      {downloadPending ? "Téléchargement..." : "Télécharger"}
                    </Button>
                    {isOfflineAvailable ? (
                      <Button variant="secondary" className="rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30 border-green-500/30">
                        <WifiOff className="h-4 w-4 mr-2" /> Disponible offline
                      </Button>
                    ) : (
                      <Button
                        onClick={handleOfflineDownload}
                        disabled={offlineDownloading}
                        variant="secondary"
                        className="rounded-full bg-accent hover:bg-accent/80"
                      >
                        {offlineDownloading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('watch.downloading')}</>
                        ) : (
                          <><WifiOff className="h-4 w-4 mr-2" />{t('watch.watch_offline')}</>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl">
              <p className="text-sm whitespace-pre-wrap">{video.description}</p>
            </div>

            {isSignedIn && video.isVip && !isUserVip && (
              <div className="mt-4 p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                <h3 className="font-bold mb-1 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Débloquez l'accès Premium VIP
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cette vidéo ainsi que toutes les publications exclusives de la plateforme sont réservées à nos membres abonnés.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/plans">
                    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-1.5 px-4 py-2 rounded-xl shadow-md">
                      Voir les offres d'abonnement
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Commentaires ({comments.length || 0})
            </h3>

            {isSignedIn ? (
              <form onSubmit={handleComment} className="mb-8 bg-card p-4 rounded-xl border border-border">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">{(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      className="min-h-[80px] bg-background border-border resize-none focus-visible:ring-primary mb-3"
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                        <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">{t('watch.post_anonymous')}</Label>
                      </div>
                      <Button type="submit" disabled={!commentBody.trim() || commentPending}>{t('watch.comment_btn')}</Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-6 bg-card border border-border rounded-xl text-center">
                <p className="text-muted-foreground mb-4">{t('watch.login_to_discuss')}</p>
                <Link href="/login">
                  <Button variant="outline">{t('nav.login')}</Button>
                </Link>
              </div>
            )}

            <div className="space-y-6">
              {isLoadingComments ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-full h-4" />
                    </div>
                  </div>
                ))
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">{(comment.displayName || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.anonymous ? "Anonyme" : (comment.displayName || "Utilisateur")}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}</span>
                      </div>
                      <p className="text-sm text-foreground/90">{comment.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('watch.first_comment')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="font-serif font-bold text-lg mb-4">{t('watch.same_category')}</h3>
          <div className="flex flex-col gap-4">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((vid) => (
                <Link key={vid.id} href={`/watch/${vid.id}`} className="flex gap-3 group">
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={vid.thumbnailUrl || '/logo.jpg'} alt={vid.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {vid.isVip && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">{t('common.vip')}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1 bg-black/80 text-[10px] text-white rounded">
                      {Math.floor(vid.durationSec / 60)}:{(vid.durationSec % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{vid.title}</h4>
                    <div className="text-xs text-muted-foreground mt-1">{vid.views.toLocaleString()} vues</div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t('watch.no_similar_videos')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
