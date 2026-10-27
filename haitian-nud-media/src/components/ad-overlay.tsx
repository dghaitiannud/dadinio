import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { ExternalLink, SkipForward } from "lucide-react";import { useTranslation } from "react-i18next";

interface AdOverlayProps {
  adUrl: string;
  clickUrl?: string | null;
  skipAfter: number;
  onComplete: () => void;
}

export function AdOverlay({ adUrl, clickUrl, skipAfter, onComplete }: AdOverlayProps) {const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [canSkip, setCanSkip] = useState(skipAfter === 0);
  const [timeLeft, setTimeLeft] = useState(skipAfter);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (skipAfter === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [skipAfter]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !adUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(adUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = adUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [adUrl]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress(video.currentTime / video.duration * 100);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col rounded-xl overflow-hidden">
      <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded shadow-md">
        {t("PUBLICITÉ")}
      </div>

      <div className="absolute top-3 right-3 z-10">
        {canSkip ?
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-white/90 hover:bg-white text-black font-bold gap-2 shadow-lg">
            {t("Passer la pub")} 
          <SkipForward className="h-4 w-4" />
          </Button> :

        <div className="px-3 py-1.5 bg-black/80 text-white text-xs font-mono rounded border border-white/20">
            {t("Passer dans")} {timeLeft}s
          </div>
        }
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onEnded={onComplete} />
      

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-yellow-500 transition-all duration-300"
          style={{ width: `${progress}%` }} />
        
      </div>

      {clickUrl &&
      <a
        href={clickUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/90 text-black text-xs font-bold rounded flex items-center gap-1.5 hover:bg-white transition-all shadow-lg hover:scale-105">
          {t("En savoir plus")} 
        <ExternalLink className="h-3 w-3" />
        </a>
      }
    </div>);

}