import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import {
  getVideo, getVideos, registerView, requestDownload,
  listComments, createComment, type Video, type Comment
} from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Lock, Star, Download, Heart, Share2, Copy, Loader2, WifiOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { HybridVideoPlayer } from "@/components/player/hybrid-video-player";
import { CommentsSection } from "@/components/watch/comments-section";
import { RelatedVideos } from "@/components/watch/related-videos";
import { downloadAndSaveVideo, listOfflineVideos } from "@/lib/offline-store";

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

function VipGate() {
  const { t } = useTranslation();
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

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isSignedIn, user, appUser, isLoading: authLoading } = useAuth();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [commentBody, setCommentBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
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
      } catch {}
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
      toast.error("Vidéo VIP Abonnez-vous pour accéder au téléchargement.");
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
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
            <div className="w-full aspect-video rounded-xl bg-zinc-900 animate-pulse" />
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
          
          {/* LECTEUR */}
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

          {/* DETAILS DE LA VIDEO */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground border-border">{video.category}</Badge>
                  {video.isVip && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-400 text-white border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />{t('common.vip')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 leading-tight">{video.title}</h1>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <span>{video.views.toLocaleString()} vues</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: fr })}</span>
                </div>
              </div>

              {/* BOUTONS D'ACTION */}
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleLike} 
                  className={`rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 ${
                    isLiked ? "text-red-500 bg-red-500/10 border-red-500/30" : ""
                  }`}
                >
                  <Heart 
                    className={`h-4 w-4 mr-2 transition-all duration-300 ${isAnimating ? "scale-125" : "scale-100"} ${
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
          </div>

          {/* COMMENTAIRES (via le composant modulaire) */}
          <CommentsSection
            comments={comments}
            isLoadingComments={isLoadingComments}
            isSignedIn={isSignedIn}
            appUser={appUser}
            commentBody={commentBody}
            setCommentBody={setCommentBody}
            anonymous={anonymous}
            setAnonymous={setAnonymous}
            commentPending={commentPending}
            handleComment={handleCommentSubmit}
            t={t}
          />
        </div>

        {/* SIDEBAR (VIDEOS SIMILAIRES) */}
        <RelatedVideos relatedVideos={relatedVideos} t={t} />
      </div>
    </div>
  );
}
