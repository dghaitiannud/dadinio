import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  getVideo, getVideos, registerView, requestDownload,
  listComments, createComment, type Video, type Comment
} from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, ThumbsUp, Share2, Star, MessageSquare, AlertCircle, Lock, Copy, Wifi, WifiOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { downloadAndSaveVideo, listOfflineVideos } from "@/lib/offline-store";

function VipGate() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95 rounded-xl px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20 shadow-inner">
        <Lock className="h-6 w-6 text-yellow-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Espace Privé & Vidéos VIP</h3>
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
      <span className="text-white/60">En ligne</span>
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
          // 🔥 Une vue est comptée immédiatement pour TOUT LE MONDE (style YouTube)
          registerView(id);

          // L'historique local se met à jour uniquement si l'utilisateur possède un compte
          if (user?.id) {
            import("@/lib/local-store").then(({ pushWatchHistory }) =>
              pushWatchHistory({ id, title: v.title, thumbnailUrl: v.thumbnailUrl })
            );
          }

          // Chargement des vidéos associées
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
    toast.success("Mèsi pou sipò w !");
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
    try {
      const res = await requestDownload(id, appUser.id, isUserVip, appUser.freeDownloadsUsed);
      toast.success(isUserVip ? "Téléchargement VIP lancé !" : `Téléchargement lancé. ${res.remaining} restants.`);
      window.open(res.url, "_blank");
    } catch (e: any) {
      if (e.message === 'vip_required') {
        toast.error("Abonnement VIP requis pour cette vidéo.");
      } else if (e.message === 'quota_exceeded') {
        toast.error("Limite atteinte. Revenez demain ou passez VIP pour un accès illimité.");
      } else {
        toast.error(e?.message || "Erreur de téléchargement");
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
    try {
      await downloadAndSaveVideo(
        video.id,
        video.videoUrl,
        video.title,
        video.description,
        video.thumbnailUrl,
        video.durationSec,
        video.category,
        (loaded, total) => {
          const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
          if (pct % 10 === 0) {
            toast.loading(`Téléchargement offline : ${pct}%`, { id: "offline-download" });
          }
        }
      );
      toast.success("Vidéo disponible offline !", { id: "offline-download" });
      setIsOfflineAvailable(true);
    } catch (e: any) {
      toast.error(e?.message || "Erreur de téléchargement offline", { id: "offline-download" });
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
        <h2 className="text-2xl font-bold mb-2">ID vidéo invalide</h2>
        <p className="text-muted-foreground mb-6">L'URL de cette vidéo n'est pas valide.</p>
        <Link href="/"><Button>Retour à l'accueil</Button></Link>
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
        <h2 className="text-2xl font-serif font-bold mb-2">Erreur de chargement</h2>
        <p className="text-muted-foreground mb-6">{videoError || "Vidéo introuvable"}</p>
        <Link href="/"><Button>Retour à l'accueil</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          
          {isSignedIn && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">Lecture en continu</span>
              <NetworkStatusIcon />
            </div>
          )}

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-4 group">
            {!isSignedIn ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Kontni sa a restrien</h3>
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
              <video
                src={video.videoUrl}
                poster={video.thumbnailUrl || '/logo.jpg'}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Lien de la vidéo introuvable.</p>
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
                      <Star className="h-3 w-3 mr-1 fill-current" /> VIP
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

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={handleLike} className="rounded-full bg-accent hover:bg-accent/80">
                  <ThumbsUp className="h-4 w-4 mr-2" /> J'aime
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
                      <Download className="h-4 w-4 mr-2" />
                      {downloadPending ? "..." : "Télécharger"}
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
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Téléchargement...</>
                        ) : (
                          <><WifiOff className="h-4 w-4 mr-2" /> Regarder offline</>
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
                        <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">Poster en anonyme</Label>
                      </div>
                      <Button type="submit" disabled={!commentBody.trim() || commentPending}>Commenter</Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-6 bg-card border border-border rounded-xl text-center">
                <p className="text-muted-foreground mb-4">Connectez-vous pour participer à la discussion.</p>
                <Link href="/login">
                  <Button variant="outline">Connexion</Button>
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
                <p className="text-muted-foreground text-center py-8">Soyez le premier à commenter.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="font-serif font-bold text-lg mb-4">Dans la même catégorie</h3>
          <div className="flex flex-col gap-4">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((vid) => (
                <Link key={vid.id} href={`/watch/${vid.id}`} className="flex gap-3 group">
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img src={vid.thumbnailUrl || '/logo.jpg'} alt={vid.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {vid.isVip && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">VIP</span>
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
              <p className="text-sm text-muted-foreground">Aucune vidéo similaire.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
