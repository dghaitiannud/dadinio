import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { getVideos, getBannerVideo, getPhotos, type Video, type Photo } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Play, Sparkles, Star, ChevronRight, Home as HomeIcon, Video as VideoIcon, Image as ImageIcon, Flame, Download, Eye, Lock, ArrowUpDown, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

const TABS = [
  { id: "all", label: "Accueil", icon: HomeIcon },
  { id: "video", label: "Vidéo", icon: VideoIcon },
  { id: "photo", label: "Photo", icon: ImageIcon },
  { id: "popular", label: "Populaire", icon: Flame },
  { id: "downloads", label: "Téléchargement", icon: Download },
] as const;

export function Home() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("all");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [bannerVideoUrl, setBannerVideoUrl] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  // Filtre de tri pour la section principale ("recent" par défaut)
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent");

  // State pour la modal d'affichage plein écran des photos
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const FULL_TEXT = "HAITIAN NUD";
  const [currentText, setCurrentText] = useState("");

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";

  useEffect(() => {
    setIsLoadingVideos(true);
    setIsLoadingPhotos(true);
    
    getBannerVideo().then(url => setBannerVideoUrl(url));

    getVideos().then(v => {
      setAllVideos(v);
      setIsLoadingVideos(false);
    });

    getPhotos().then(p => {
      setPhotos(p);
      setIsLoadingPhotos(false);
    });
  }, []);

  useEffect(() => {
    if (currentText.length < FULL_TEXT.length) {
      const timeout = setTimeout(() => {
        setCurrentText(FULL_TEXT.substring(0, currentText.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [currentText]);

  // 1. Les plus récentes vidéos (pour le rail du haut "Nouvelles vidéos")
  const newestVideos = useMemo(() => {
    if (!allVideos) return [];
    return [...allVideos].sort((a, b) => {
      const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [allVideos]);

  // 2. Tri dynamique pour le catalogue principal du bas
  const visibleVideos = useMemo(() => {
    if (!allVideos) return [];
    
    let list = [...allVideos];

    if (activeTab === "popular" || sortBy === "views") {
      return list.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    // Tri par date / nouveautés par défaut
    return list.sort((a, b) => {
      const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [allVideos, activeTab, sortBy]);

  // 3. Galerie photo
  const sortedPhotos = useMemo(() => {
    if (!photos) return [];
    return [...photos].sort((a, b) => {
      const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [photos]);

  const isPhotoTab = activeTab === "photo";

  const handlePhotoClick = (photo: Photo) => {
    if (photo.isVip && !isUserVip) {
      setLocation("/plans");
      return;
    }
    setSelectedPhoto(photo);
  };

  const haitianPart = currentText.substring(0, 8);
  const nudPart = currentText.substring(8);
  const isTyping = currentText.length < FULL_TEXT.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[21/9] max-h-[70vh] bg-black overflow-hidden border-b border-border">
        {bannerVideoUrl ? (
          <div className="absolute inset-0 z-0">
            <video
              src={bannerVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,94,255,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-24 container mx-auto z-10">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-primary/30 backdrop-blur-sm">{t('home.new_on_platform')}</Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-8 leading-tight min-h-[50px] md:min-h-[80px]">
              <span>{haitianPart}</span>
              <span className="text-primary">{nudPart}</span>
              {isTyping && <span className="animate-pulse ml-1 border-r-4 border-primary"></span>}
            </h1>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => setLocation("/vip-catalog")}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-[0_0_20px_rgba(30,94,255,0.4)] w-full sm:w-auto"
              >
                <Play className="mr-2 h-5 w-5 fill-current" /> Regarder maintenant
              </Button>
              
              {!isUserVip && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setLocation("/plans")}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto"
                >
                  <Star className="mr-2 h-5 w-5 text-yellow-400" />{t('nav.become_vip')}</Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Primary tabs */}
      <section className="border-b border-border bg-background/50 backdrop-blur-md sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar snap-x">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full whitespace-nowrap snap-start gap-2 ${active ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-accent hover:bg-accent/80"}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 flex flex-col gap-12">
        {/* Rail supérieur : Nouvelles Vidéos (remplace Tendances) */}
        {!isPhotoTab && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                <Sparkles className="text-primary h-6 w-6" /> Nouvelles vidéos
              </h2>
              <Link href="/search" className="text-sm text-primary hover:underline flex items-center">
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoadingVideos ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-video w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : newestVideos && newestVideos.length > 0 ? (
                newestVideos.slice(0, 4).map((video, i) => (
                  <div key={video.id} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                    <VideoCard video={video} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  Aucune nouvelle vidéo pour le moment.
                </div>
              )}
            </div>
          </section>
        )}

        {!isUserVip && (
          <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background to-background" />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 md:w-1/2">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(30,94,255,0.35),transparent_70%)]" />
               <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
            </div>
            <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <h3 className="text-xl md:text-2xl font-bold">{t('home.exclusive_vip_pass')}</h3>
                </div>
                <p className="text-muted-foreground max-w-md">
                  Accédez à tout le contenu premium, téléchargements illimités et sans publicités. Soutenez les créateurs haïtiens.
                </p>
              </div>
              <Button size="lg" onClick={() => setLocation("/plans")} className="bg-primary text-primary-foreground font-bold shrink-0">
                Découvrir les offres
              </Button>
            </div>
          </section>
        )}

        {/* Section Principale : Vidéos ou Galerie Photos */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-serif font-bold">
              {activeTab === "all" && "Toutes les vidéos"}
              {activeTab === "video" && "Toutes les vidéos"}
              {activeTab === "photo" && "Galerie photo (Nouveautés)"}
              {activeTab === "popular" && "Le plus populaire"}
              {activeTab === "downloads" && "Disponibles en téléchargement"}
            </h2>

            {/* Boutons de Filtre pour les Vidéos */}
            {!isPhotoTab && (
              <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border self-start sm:self-auto">
                <span className="text-xs text-muted-foreground px-2 flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" /> Trier:
                </span>
                <Button
                  size="sm"
                  variant={sortBy === "recent" ? "default" : "ghost"}
                  onClick={() => setSortBy("recent")}
                  className="text-xs h-7 px-2.5 rounded-md"
                >
                  Plus récentes
                </Button>
                <Button
                  size="sm"
                  variant={sortBy === "views" ? "default" : "ghost"}
                  onClick={() => setSortBy("views")}
                  className="text-xs h-7 px-2.5 rounded-md"
                >
                  Plus de vues
                </Button>
              </div>
            )}
          </div>

          {/* RENDU ONGLET PHOTO (3 photos par ligne, 16:9, flou VIP) */}
          {isPhotoTab ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isLoadingPhotos ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={`photo-sk-${i}`} className="flex flex-col gap-2">
                    <Skeleton className="aspect-video w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))
              ) : sortedPhotos && sortedPhotos.length > 0 ? (
                sortedPhotos.map((photo, i) => {
                  const isLocked = photo.isVip && !isUserVip;

                  return (
                    <div
                      key={photo.id}
                      onClick={() => handlePhotoClick(photo)}
                      className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer animate-in fade-in zoom-in-95 duration-500"
                      style={{ animationDelay: `${(i % 3) * 100}ms`, animationFillMode: 'both' }}
                    >
                      {/* Format 16:9 strict */}
                      <div className="aspect-video w-full bg-muted relative overflow-hidden">
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isLocked ? "blur-md scale-110 select-none" : ""
                          }`}
                        />

                        {/* Overlay cadenas pour VIP Gratuit */}
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center z-10 transition-opacity group-hover:bg-black/70">
                            <Lock className="h-6 w-6 text-yellow-400 mb-1 animate-bounce" />
                            <span className="text-xs font-bold text-yellow-400 mb-2">Contenu VIP Exclusif</span>
                            <span className="text-[10px] bg-primary text-white px-2 py-1 rounded-full font-semibold shadow">
                              Devenir VIP pour débloquer
                            </span>
                          </div>
                        )}

                        {photo.isVip && !isLocked && (
                          <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md z-10">
                            <Star className="h-3 w-3 fill-current text-yellow-400" /> VIP
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {photo.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="bg-accent px-1.5 py-0.5 rounded text-[11px] font-medium">
                            {photo.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {photo.views}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  Aucune photo disponible pour l'instant.
                </div>
              )}
            </div>
          ) : (
            /* RENDU CATALOGUE VIDÉOS */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
              {isLoadingVideos ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={`latest-${i}`} className="flex flex-col gap-3">
                    <Skeleton className="aspect-video w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : visibleVideos && visibleVideos.length > 0 ? (
                visibleVideos.map((video, i) => (
                  <div key={video.id} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${(i % 4) * 100}ms`, animationFillMode: 'both' }}>
                    <VideoCard video={video} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  Aucune vidéo disponible.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal d'affichage de photo grand écran */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-primary transition-colors flex items-center gap-1 font-bold"
            >
              <X className="h-6 w-6" /> Fermer
            </button>
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-border shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-bold">{selectedPhoto.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedPhoto.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: any) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}
