import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  listOfflineVideos,
  deleteOfflineVideo,
  getOfflineVideoUrl,
  revokeOfflineVideoUrl,
  formatBytes,
  type OfflineVideo } from
"@/lib/offline-store";
import { Play, Trash2, WifiOff, ArrowLeft } from "lucide-react";

export function DownloadsPage() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<OfflineVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listOfflineVideos();
      setVideos(list);
    } catch (err: any) {
      toast.error(err?.message || t("Erreur de chargement"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleDelete = async (id: string) => {
    try {
      await deleteOfflineVideo(id);
      if (playingId === id) {
        if (videoUrl) revokeOfflineVideoUrl(videoUrl);
        setPlayingId(null);
        setVideoUrl(null);
      }
      toast.success(t("Vidéo supprimée"));
      loadVideos();
    } catch (err: any) {
      toast.error(err?.message || t("Erreur de suppression"));
    }
  };

  const handlePlay = (video: OfflineVideo) => {
    if (videoUrl) revokeOfflineVideoUrl(videoUrl);
    const url = getOfflineVideoUrl(video);
    setVideoUrl(url);
    setPlayingId(video.id);
  };

  const handleClosePlayer = () => {
    if (videoUrl) revokeOfflineVideoUrl(videoUrl);
    setVideoUrl(null);
    setPlayingId(null);
  };

  const totalBytes = videos.reduce((sum, v) => sum + v.sizeBytes, 0);
  const playing = videos.find((v) => v.id === playingId);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-28 pt-10 md:pt-14">
      <Link
        href="/"
        className="mb-6 -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <ArrowLeft className="h-4 w-4" /> {t("watch.back_home")}
      </Link>

      <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("downloads.my_downloads")}</h1>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-2xl font-semibold">{t("downloads.no_downloads")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("Téléchargez des vidéos pour les regarder sans connexion internet. Maximum 5 vidéos.")}
          </p>
          <Link href="/">
            <Button className="mt-8 h-12 rounded-full bg-amber-400 px-8 text-base font-semibold text-black hover:bg-amber-300">
              {t("downloads.browse_videos")}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-3 text-muted-foreground">
            {t("{{used}}/5 vidéos — {{size}} utilisés", { used: videos.length, size: formatBytes(totalBytes) })}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <article key={video.id}>
                <button
                  type="button"
                  onClick={() => handlePlay(video)}
                  aria-label={video.title}
                  className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-black outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                      <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                    {Math.floor(video.durationSec / 60)}:{(video.durationSec % 60).toString().padStart(2, "0")}
                  </span>
                </button>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{video.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <WifiOff className="h-3.5 w-3.5" /> {t("Offline")} · {formatBytes(video.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("downloads.delete")}
                    title={t("downloads.delete")}
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Lecteur hors ligne */}
      {playingId && videoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playing?.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={handleClosePlayer}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="truncate font-semibold text-white">{playing?.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                autoFocus
                className="rounded-full text-white hover:bg-white/10 hover:text-white"
                onClick={handleClosePlayer}
              >
                {t("common.close")}
              </Button>
            </div>
            <video src={videoUrl} controls autoPlay className="w-full rounded-2xl" style={{ maxHeight: "70vh" }} />
          </div>
        </div>
      )}
    </div>
  );
}
