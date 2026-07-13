import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  listOfflineVideos,
  deleteOfflineVideo,
  getOfflineVideoUrl,
  revokeOfflineVideoUrl,
  formatBytes,
  type OfflineVideo,
} from "@/lib/offline-store";
import { Play, Trash2, WifiOff, Film, ArrowLeft } from "lucide-react";

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
      toast.error(err?.message || "Erreur de chargement");
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
      toast.success("Vidéo supprimée");
      loadVideos();
    } catch (err: any) {
      toast.error(err?.message || "Erreur de suppression");
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold">{t('downloads.my_downloads')}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-video rounded-xl" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('downloads.no_downloads')}</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Téléchargez des vidéos pour les regarder sans connexion internet. Maximum 5 vidéos.
          </p>
          <Link href="/">
            <Button className="bg-primary text-white">{t('downloads.browse_videos')}</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {videos.length}/5 vidéos — {formatBytes(videos.reduce((s, v) => s + v.sizeBytes, 0))} utilisés
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden border-border bg-card">
                <div className="relative aspect-video bg-black">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="icon"
                      className="w-14 h-14 rounded-full bg-primary/90 text-white hover:bg-primary hover:scale-110 transition-all"
                      onClick={() => handlePlay(video)}
                    >
                      <Play className="h-6 w-6 ml-1" fill="currentColor" />
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                    {formatBytes(video.sizeBytes)}
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-xs rounded">
                    <WifiOff className="h-3 w-3" /> Offline
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold line-clamp-2 text-sm mb-1">{video.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(video.durationSec / 60)}:{(video.durationSec % 60).toString().padStart(2, "0")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Offline Video Player Modal */}
      {playingId && videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold truncate">
                {videos.find((v) => v.id === playingId)?.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={handleClosePlayer}
              >{t('common.close')}</Button>
            </div>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
