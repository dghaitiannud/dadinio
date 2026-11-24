import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import {
  getVideo, getVideos, registerView, requestDownload,
  listComments, createComment, type Video, type Comment } from
"@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import { AlertCircle, Lock, Star, Download, Heart, Share2, Copy, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

function PlayerGate({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
        <Lock className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">{text}</p>
      <Link href={href}>
        <Button className="mt-6 h-11 rounded-full bg-amber-400 px-7 font-semibold text-black hover:bg-amber-300">{cta}</Button>
      </Link>
    </div>
  );
}

export function Watch() {
  const dateLocale = useDateLocale();
  const { id } = useParams<{id: string;}>();
  const { t, i18n } = useTranslation();
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
          getVideos({ category: v.category }).
          then((vids) => setRelatedVideos(vids.filter((vid) => vid.id !== id))).
          catch((err) => console.warn('Failed to load related videos:', err));
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        setVideoError(t('watch.load_error'));
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
      toast.success(t("Lien copié"));
    } catch {
      toast.error(t("Impossible de copier le lien"));
    }
  };

  const handleLike = () => {
    if (!isSignedIn) {
      toast.error(t("Vous devez être connecté pour aimer cette vidéo"));
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
      toast.success(t("Merci pour votre soutien !"));
    }
  };

  const handleShare = async () => {
    if (!isSignedIn) {
      toast.error(t("Vous devez être connecté pour partager cette vidéo"));
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
      toast.error(t("Vous devez être connecté pour télécharger"));
      return;
    }
    if (video?.isVip && !isUserVip) {
      toast.error(t("Vidéo VIP Abonnez-vous pour accéder au téléchargement."));
      return;
    }

    setDownloadPending(true);
    const toastId = toast.loading(t("Démarrage du téléchargement..."));

    try {
      const res = await requestDownload(id, appUser.id, isUserVip ?? false, appUser.freeDownloadsUsed);
      const rawDownloadUrl = res.url || video?.videoUrl;

      if (!rawDownloadUrl) {
        throw new Error(t("watch.link_not_found"));
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
        isUserVip ? t("Téléchargement lancé dans le navigateur !") : t("Téléchargement lancé. {{remaining}} restant(s).", { remaining: res.remaining }),
        { id: toastId }
      );
    } catch (e: any) {
      if (e.message === 'vip_required') {
        toast.error(t("Abonnement VIP requis pour cette vidéo."), { id: toastId });
      } else if (e.message === 'quota_exceeded') {
        toast.error(t("Limite atteinte. Revenez demain ou passez VIP pour un accès illimité."), { id: toastId });
      } else {
        if (video?.videoUrl) {
          window.location.href = getProxyDownloadUrl(video.videoUrl, video?.title);
          toast.success(t("Téléchargement démarré."), { id: toastId });
        } else {
          toast.error(e?.message || t("Erreur lors du lancement du téléchargement"), { id: toastId });
        }
      }
    } finally {
      setDownloadPending(false);
    }
  };

  const handleOfflineDownload = async () => {
    if (!video || !video.videoUrl) return;
    if (!isSignedIn) {
      toast.error(t("Vous devez être connecté pour regarder hors ligne"));
      return;
    }
    setOfflineDownloading(true);
    const toastId = toast.loading(t("Démarrage de la sauvegarde offline..."));

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
          const pct = total > 0 ? Math.round(loaded / total * 100) : 0;
          if (pct % 10 === 0) {
            toast.loading(t("Téléchargement offline : {{pct}}%", { pct }), { id: toastId });
          }
        }
      );
      toast.success(t("Vidéo disponible offline !"), { id: toastId });
      setIsOfflineAvailable(true);
    } catch (e: any) {
      console.error("Erreur Offline :", e);
      let msg = e?.message || t("Erreur de téléchargement offline");
      if (msg.includes("503") || msg.includes("Failed to fetch")) {
        msg = t("watch.slow_connection");
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
      toast.success(t("Commentaire ajouté"));
      const updated = await listComments(id);
      setComments(updated);
    } catch {
      toast.error(t("Erreur lors de l'ajout du commentaire"));
    } finally {
      setCommentPending(false);
    }
  };

  const centered = "mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-24 text-center";

  if (!id) {
    return (
      <div className={centered}>
        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-semibold">{t("watch.invalid_id")}</h2>
        <p className="mt-2 text-muted-foreground">{t("watch.invalid_url")}</p>
        <Link href="/"><Button variant="outline" className="mt-6 h-11 rounded-full px-8">{t("watch.back_home")}</Button></Link>
      </div>
    );
  }

  if (isLoadingVideo || authLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (videoError || !video) {
    return (
      <div className={centered}>
        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="font-serif text-2xl font-semibold">{t("common.error_loading")}</h2>
        <p className="mt-2 text-muted-foreground">{videoError || t("Vidéo introuvable")}</p>
        <Link href="/"><Button variant="outline" className="mt-6 h-11 rounded-full px-8">{t("watch.back_home")}</Button></Link>
      </div>
    );
  }

  const hasDescription = Boolean(video.description?.trim());
  const canDownload = isSignedIn && (!video.isVip || isUserVip);
  const pill = "h-10 rounded-full bg-muted px-4 text-sm font-medium text-foreground hover:bg-muted/70";

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-28 pt-6 md:pt-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {/* LECTEUR */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
            {!isSignedIn ? (
              <PlayerGate
                title={t("watch.restricted_content")}
                text={t("Konekte oswa kreye yon kont pou w ka gade videyo sa a.")}
                href="/login"
                cta={t("Se connecter")}
              />
            ) : video.isVip && !isUserVip ? (
              <PlayerGate
                title={t("watch.private_space")}
                text={t("Cette vidéo exclusive est réservée aux membres VIP. Devenez Premium pour débloquer tout le catalogue instantanément.")}
                href="/plans"
                cta={t("Devenir Membre VIP")}
              />
            ) : video.videoUrl ? (
              <HybridVideoPlayer src={video.videoUrl} poster={video.thumbnailUrl || "/logo.jpg"} videoId={video.id} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white/60">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p className="text-sm">{t("watch.no_video_link")}</p>
              </div>
            )}
          </div>

          {/* TITRE & MÉTA */}
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">{video.category}</span>
              {video.isVip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
                  <Star className="h-3 w-3 fill-current" /> {t("common.vip")}
                </span>
              )}
            </div>
            <h1 className="mt-1.5 font-serif text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{video.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("{{views}} vues", { count: video.views, views: video.views.toLocaleString(i18n.language) })}
              {" · "}
              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: dateLocale })}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {canDownload && (
              <Button
                onClick={handleDownload}
                disabled={downloadPending}
                className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                {downloadPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {downloadPending ? t("Téléchargement...") : t("Télécharger")}
              </Button>
            )}

            <Button variant="ghost" onClick={handleLike} aria-pressed={isLiked} className={cn(pill, isLiked && "text-red-500")}>
              <Heart
                className={cn(
                  "mr-2 h-4 w-4 transition-transform duration-200",
                  isAnimating && "scale-125",
                  isLiked && "fill-red-500 text-red-500",
                )}
              />
              {likesCount > 0 ? likesCount.toLocaleString(i18n.language) : t("J'aime")}
            </Button>

            <Button variant="ghost" onClick={handleShare} className={pill}>
              <Share2 className="mr-2 h-4 w-4" /> {t("Partager")}
            </Button>

            <Button variant="ghost" onClick={copyLink} aria-label={t("Copier le lien")} title={t("Copier le lien")} className="h-10 w-10 rounded-full bg-muted p-0 hover:bg-muted/70">
              <Copy className="h-4 w-4" />
            </Button>

            {canDownload &&
              (isOfflineAvailable ? (
                <span className="inline-flex h-10 items-center rounded-full bg-emerald-500/10 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <WifiOff className="mr-2 h-4 w-4" /> {t("Disponible offline")}
                </span>
              ) : (
                <Button variant="ghost" onClick={handleOfflineDownload} disabled={offlineDownloading} className={pill}>
                  {offlineDownloading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("watch.downloading")}</>
                  ) : (
                    <><WifiOff className="mr-2 h-4 w-4" />{t("watch.watch_offline")}</>
                  )}
                </Button>
              ))}
          </div>

          {hasDescription && (
            <div className="mt-6 rounded-2xl bg-muted/50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{video.description}</p>
            </div>
          )}

          {/* COMMENTAIRES */}
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
          />
        </div>

        {/* VIDÉOS SIMILAIRES */}
        <RelatedVideos relatedVideos={relatedVideos} />
      </div>
    </div>
  );
}
