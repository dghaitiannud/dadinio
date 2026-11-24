import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { getVideos, getPhotos, type Video, type Photo } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Star, Eye, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CatalogTab = "all-vip" | "video-vip" | "photo-vip";

const TABS: { id: CatalogTab; label: string }[] = [
  { id: "all-vip", label: "Tout le contenu" },
  { id: "video-vip", label: "Vidéos Exclusives" },
  { id: "photo-vip", label: "Galerie Photo Privée" },
];

export function VipCatalog() {
  const { t, i18n } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<CatalogTab>("all-vip");
  const [vipVideos, setVipVideos] = useState<Video[]>([]);
  const [vipPhotos, setVipPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Protection double : connecté + statut VIP requis
  const isAccessGranted = isSignedIn && appUser && (appUser as any).plan === "vip";

  useEffect(() => {
    if (!isAccessGranted) return;

    async function loadVipContent() {
      setIsLoading(true);
      try {
        const [allVideos, allPhotos] = await Promise.all([getVideos(), getPhotos()]);
        setVipVideos(allVideos.filter((v) => v.isVip));
        setVipPhotos(allPhotos.filter((p) => p.isVip));
      } catch (error) {
        console.error("Erreur lors du chargement du catalogue VIP :", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVipContent();
  }, [isAccessGranted]);

  // Accès refusé (non connecté ou non VIP)
  if (!isAccessGranted) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-black">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{t("Espace Privé VIP")}</h1>
        <p className="mt-3 text-muted-foreground">
          {!isSignedIn
            ? t("Vous devez vous connecter à votre compte et détenir un pass VIP pour accéder à cet espace exclusif.")
            : t("Cet espace regroupe l'intégralité de nos contenus exclusifs. Vous devez posséder un compte VIP actif pour y accéder.")}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={!isSignedIn ? "/login" : "/plans"}>
            <Button className="h-12 w-full rounded-full bg-amber-400 px-8 text-base font-semibold text-black hover:bg-amber-300">
              {!isSignedIn ? t("Se connecter") : t("Devenir Membre VIP")}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="h-12 w-full rounded-full px-8 text-base">
              {t("watch.back_home")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const showVideos = activeTab === "all-vip" || activeTab === "video-vip";
  const showPhotos = activeTab === "all-vip" || activeTab === "photo-vip";
  const videoGrid = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4";
  const photoGrid = "grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-28 pt-10 md:pt-14">
      {/* En-tête */}
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("Votre Espace VIP")}</h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            {t("Profitez d'un accès illimité et sans restriction à l'ensemble des productions premium de la plateforme.")}
          </p>
        </div>
        <dl className="flex gap-10">
          <div>
            <dd className="font-serif text-4xl font-semibold tabular-nums">{vipVideos.length}</dd>
            <dt className="mt-1 text-sm text-muted-foreground">{t("Vidéos VIP")}</dt>
          </div>
          <div>
            <dd className="font-serif text-4xl font-semibold tabular-nums">{vipPhotos.length}</dd>
            <dt className="mt-1 text-sm text-muted-foreground">{t("Photos VIP")}</dt>
          </div>
        </dl>
      </header>

      {/* Onglets */}
      <div className="-mx-5 mt-10 overflow-x-auto px-5 no-scrollbar">
        <div role="tablist" className="inline-flex w-max rounded-full bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                tab.id === activeTab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="mt-10 flex flex-col gap-16">
        {isLoading ? (
          <div className={videoGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {showVideos && (vipVideos.length > 0 || activeTab === "video-vip") && (
              <section>
                {activeTab === "all-vip" && (
                  <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">{t("Vidéo Premium")}</h2>
                )}
                {vipVideos.length > 0 ? (
                  <div className={videoGrid}>
                    {vipVideos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <EmptyCatalogMessage text={t("catalog.empty_videos")} />
                )}
              </section>
            )}

            {showPhotos && (vipPhotos.length > 0 || activeTab === "photo-vip") && (
              <section>
                {activeTab === "all-vip" && (
                  <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">{t("Photos Premium")}</h2>
                )}
                {vipPhotos.length > 0 ? (
                  <div className={photoGrid}>
                    {vipPhotos.map((photo) => (
                      <div key={photo.id}>
                        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted">
                          <img
                            src={photo.imageUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
                          />
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
                            <Star className="h-3 w-3 fill-current" /> {t("common.vip")}
                          </span>
                        </div>
                        <h3 className="line-clamp-1 text-[15px] font-semibold">{photo.title}</h3>
                        <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="truncate">{photo.category}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {Number(photo.views || 0).toLocaleString(i18n.language)}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCatalogMessage text={t("catalog.empty_photos")} />
                )}
              </section>
            )}

            {vipVideos.length === 0 && vipPhotos.length === 0 && activeTab === "all-vip" && (
              <EmptyCatalogMessage text={t("catalog.empty_all")} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCatalogMessage({ text }: { text: string }) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
