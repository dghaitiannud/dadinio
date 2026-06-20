import { useState, useEffect } from "react";
import { getVideos, getTrendingVideos, getBannerVideo, type Video } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, TrendingUp, Star, ChevronRight, Home as HomeIcon, Video as VideoIcon, Image as ImageIcon, Flame, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { id: "all", label: "Accueil", icon: HomeIcon },
  { id: "video", label: "Vidéo", icon: VideoIcon },
  { id: "photo", label: "Photo", icon: ImageIcon },
  { id: "popular", label: "Populaire", icon: Flame },
  { id: "downloads", label: "Téléchargement", icon: Download },
] as const;

export function Home() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("all");
  const [trending, setTrending] = useState<Video[]>([]);
  const [latest, setLatest] = useState<Video[]>([]);
  const [bannerVideoUrl, setBannerVideoUrl] = useState<string>("");
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

  // ✍️ États pour le typing effect à l'atterrissage sur la page
  const FULL_TEXT = "HAITIAN NUD";
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    setIsLoadingTrending(true);
    setIsLoadingLatest(true);
    
    // Récupérer la vidéo de bannière
    getBannerVideo().then(url => setBannerVideoUrl(url));

    getTrendingVideos().then(v => {
      setTrending(v);
      setIsLoadingTrending(false);
    });
    getVideos().then(v => {
      setLatest(v);
      setIsLoadingLatest(false);
    });
  }, []);

  // 🔄 Effet de machine à écrire exécuté UNE SEULE FOIS jusqu'à complétion
  useEffect(() => {
    if (currentText.length < FULL_TEXT.length) {
      const timeout = setTimeout(() => {
        setCurrentText(FULL_TEXT.substring(0, currentText.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [currentText]);

  const visibleVideos = (() => {
    if (!latest) return latest;
    if (activeTab === "popular") return [...latest].sort((a, b) => b.views - a.views);
    if (activeTab === "downloads") return latest.filter((v) => !v.isVip);
    return latest;
  })();

  const isPhotoTab = activeTab === "photo";

  const haitianPart = currentText.substring(0, 8);
  const nudPart = currentText.substring(8);
  const isTyping = currentText.length < FULL_TEXT.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[21/9] max-h-[70vh] bg-black overflow-hidden border-b border-border">
        {bannerVideoUrl ? (
          // Vidéo de fond en arrière-plan sans contrôles, auto-play et loop infini
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
            {/* Voile dégradé sombre pour préserver la lisibilité parfaite du texte blanc */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          // Dégradé par défaut si aucune vidéo n'est enregistrée en administration
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,94,255,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-24 container mx-auto z-10">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-primary/30 backdrop-blur-sm">Nouveau sur HAITIAN NUD</Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-8 leading-tight min-h-[50px] md:min-h-[80px]">
              <span>{haitianPart}</span>
              <span className="text-primary">{nudPart}</span>
              {isTyping && <span className="animate-pulse ml-1 border-r-4 border-primary"></span>}
            </h1>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-[0_0_20px_rgba(30,94,255,0.4)]">
                <Play className="mr-2 h-5 w-5 fill-current" /> Regarder maintenant
              </Button>
              <Link href="/plans">
                <Button size="lg" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-sm">
                  <Star className="mr-2 h-5 w-5 text-yellow-400" /> Devenir VIP
                </Button>
              </Link>
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
        {/* Trending Rail */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              <TrendingUp className="text-primary h-6 w-6" /> Tendances
            </h2>
            <Link href="/search" className="text-sm text-primary hover:underline flex items-center">
              Voir tout <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoadingTrending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : trending && trending.length > 0 ? (
              trending.slice(0, 4).map((video, i) => (
                <div key={video.id} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                  <VideoCard video={video} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                Aucune tendance pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* VIP Promo Block */}
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
                <h3 className="text-xl md:text-2xl font-bold">Pass VIP Exclusif</h3>
              </div>
              <p className="text-muted-foreground max-w-md">
                Accédez à tout le contenu premium, téléchargements illimités et sans publicités. Soutenez les créateurs haïtiens.
              </p>
            </div>
            <Link href="/plans">
              <Button size="lg" className="bg-primary text-primary-foreground font-bold shrink-0">
                Découvrir les offres
              </Button>
            </Link>
          </div>
        </section>

        {/* Latest / filtered grid */}
        <section className="mb-8">
          <h2 className="text-2xl font-serif font-bold mb-6">
            {activeTab === "all" && "Nouveautés"}
            {activeTab === "video" && "Toutes les vidéos"}
            {activeTab === "photo" && "Galerie photo"}
            {activeTab === "popular" && "Le plus populaire"}
            {activeTab === "downloads" && "Disponibles en téléchargement"}
          </h2>

          {isPhotoTab ? (
            <div className="py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              Aucune photo disponible pour l'instant.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
              {isLoadingLatest ? (
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
    </div>
  );
}

function Badge({ children, className }: any) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}
