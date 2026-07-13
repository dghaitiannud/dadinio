import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { getVideos, getPhotos, type Video, type Photo } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Star, Video as VideoIcon, Image as ImageIcon, Eye, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type CatalogTab = "all-vip" | "video-vip" | "photo-vip";

export function VipCatalog() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<CatalogTab>("all-vip");
  const [vipVideos, setVipVideos] = useState<Video[]>([]);
  const [vipPhotos, setVipPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 PROTECTION DOUBLE : Connecté + Statut VIP requis
  const isAccessGranted = isSignedIn && appUser && (appUser as any).plan === "vip";

  useEffect(() => {
    if (!isAccessGranted) return;

    async function loadVipContent() {
      setIsLoading(true);
      try {
        const [allVideos, allPhotos] = await Promise.all([
          getVideos(),
          getPhotos()
        ]);
        
        setVipVideos(allVideos.filter(v => v.isVip));
        setVipPhotos(allPhotos.filter(p => p.isVip));
      } catch (error) {
        console.error("Erreur lors du chargement du catalogue VIP :", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVipContent();
  }, [isAccessGranted]);

  // 🔒 Écran d'accès refusé (non connecté ou non VIP)
  if (!isAccessGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 container mx-auto text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(30,94,255,0.2)]">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
          Espace Privé VIP
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {!isSignedIn 
            ? "Vous devez vous connecter à votre compte et détenir un pass VIP pour accéder à cet espace exclusif." 
            : "Cet espace regroupe l'intégralité de nos contenus exclusifs. Vous devez posséder un compte VIP actif pour y accéder."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {!isSignedIn ? (
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-[0_0_20px_rgba(30,94,255,0.4)] w-full">
                Se connecter
              </Button>
            </Link>
          ) : (
            <Link href="/plans">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-[0_0_20px_rgba(30,94,255,0.4)] w-full">
                <Star className="mr-2 h-5 w-5 fill-current text-yellow-400" /> Devenir Membre VIP
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full">{t('watch.back_home')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col gap-8">
      {/* Header du catalogue */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-background p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(30,94,255,0.1)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,94,255,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3 shadow-md">
            <Star className="h-3.5 w-3.5 fill-current text-yellow-400" /> CATALOGUE EXCLUSIF
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 tracking-tight">
            Votre Espace VIP
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Profitez d'un accès illimité et sans restriction à l'ensemble des productions premium de la plateforme.
          </p>
        </div>
        <div className="relative bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl px-6 py-4 flex gap-6 shrink-0 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{vipVideos.length}</div>
            <div className="text-xs text-muted-foreground">Vidéos VIP</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-2xl font-bold text-primary">{vipPhotos.length}</div>
            <div className="text-xs text-muted-foreground">Photos VIP</div>
          </div>
        </div>
      </div>

      {/* Barre d'onglets de filtrage */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
        <Button
          variant={activeTab === "all-vip" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all-vip")}
          className="rounded-full gap-2"
        >
          Tout le contenu
        </Button>
        <Button
          variant={activeTab === "video-vip" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("video-vip")}
          className="rounded-full gap-2"
        >
          <VideoIcon className="h-4 w-4" /> Vidéos Exclusives
        </Button>
        <Button
          variant={activeTab === "photo-vip" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("photo-vip")}
          className="rounded-full gap-2"
        >
          <ImageIcon className="h-4 w-4" /> Galerie Photo Privée
        </Button>
      </div>

      {/* Grille principale des contenus */}
      <section className="mb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {(activeTab === "all-vip" || activeTab === "video-vip") && (
              <div className="mb-8">
                {activeTab === "all-vip" && vipVideos.length > 0 && (
                  <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">Vidéo Premium</h2>
                )}
                {vipVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
                    {vipVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  activeTab === "video-vip" && (
                    <EmptyCatalogMessage type="vidéos" />
                  )
                )}
              </div>
            )}

            {(activeTab === "all-vip" || activeTab === "photo-vip") && (
              <div>
                {activeTab === "all-vip" && vipPhotos.length > 0 && (
                  <h2 className="text-xl font-bold mb-4 mt-8 text-white flex items-center gap-2">Photos Premium</h2>
                )}
                {vipPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {vipPhotos.map((photo, i) => (
                      <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border bg-card animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${(i % 4) * 100}ms`, animationFillMode: 'both' }}>
                        <div className="aspect-square w-full bg-muted relative overflow-hidden">
                          <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />{t('common.vip')}</div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{photo.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="bg-accent px-1.5 py-0.5 rounded text-[11px] font-medium">{photo.category}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {photo.views}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  activeTab === "photo-vip" && (
                    <EmptyCatalogMessage type="photos" />
                  )
                )}
              </div>
            )}

            {vipVideos.length === 0 && vipPhotos.length === 0 && activeTab === "all-vip" && (
              <EmptyCatalogMessage type="contenus" />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EmptyCatalogMessage({ type }: { type: string }) {
  return (
    <div className="w-full py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
      Aucun élément trouvé dans la catégorie des {type} VIP pour le moment.
    </div>
  );
}
