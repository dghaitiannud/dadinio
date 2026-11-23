import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { getVideos, getBannerVideo, getPhotos, registerPhotoView, type Video, type Photo } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Play, Star, Eye, Lock, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "Accueil" },
  { id: "video", label: "Vidéo" },
  { id: "photo", label: "Photo" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function extractViews(item: any): number {
  if (!item) return 0;
  const val = item.views ?? item.views_count ?? item.viewsCount ?? item.count ?? 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function timeOf(item: any): number {
  return new Date(item.created_at || item.createdAt || 0).getTime();
}

function SectionHeader({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      {href && more && (
        <Link href={href} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {more}
        </Link>
      )}
    </div>
  );
}

function VideoGridSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </>
  );
}

function PhotoCard({ photo, locked, onOpen }: { photo: Photo; locked: boolean; onOpen: (p: Photo) => void }) {
  const { t, i18n } = useTranslation();
  const views = extractViews(photo);

  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className="group block rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative mb-3 aspect-video overflow-hidden rounded-2xl bg-muted">
        <img
          src={photo.imageUrl || (photo as any).image_url}
          alt=""
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
            locked && "scale-110 select-none blur-xl",
          )}
        />
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4 text-center text-white">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("Contenu VIP Exclusif")}</span>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
              {t("Devenir VIP pour débloquer")}
            </span>
          </div>
        )}
        {photo.isVip && !locked && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
            <Star className="h-3 w-3 fill-current" /> VIP
          </span>
        )}
      </div>
      <h3 className="line-clamp-1 text-[15px] font-semibold">{photo.title}</h3>
      <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="truncate">{photo.category}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {t("{{views}} vues", { count: views, views: views.toLocaleString(i18n.language) })}
        </span>
      </p>
    </button>
  );
}

export function Home() {
  const { t, i18n } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [bannerVideoUrl, setBannerVideoUrl] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";

  useEffect(() => {
    setIsLoadingVideos(true);
    setIsLoadingPhotos(true);

    getBannerVideo()
      .then((url) => setBannerVideoUrl(url))
      .catch((err) => console.warn("Erreur bannière:", err));

    getVideos()
      .then((v) => setAllVideos(v))
      .catch((err) => {
        console.error("Erreur chargement vidéos:", err);
        setAllVideos([]);
      })
      .finally(() => setIsLoadingVideos(false));

    getPhotos()
      .then((p) => setPhotos(p))
      .catch((err) => {
        console.error("Erreur chargement photos:", err);
        setPhotos([]);
      })
      .finally(() => setIsLoadingPhotos(false));
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelectedPhoto(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPhoto]);

  const sortItems = <T,>(items: T[]): T[] =>
    [...items].sort((a, b) => (sortBy === "views" ? extractViews(b) - extractViews(a) : timeOf(b) - timeOf(a)));

  const sortedVideos = useMemo(() => sortItems(allVideos || []), [allVideos, sortBy]);
  const sortedPhotos = useMemo(() => sortItems(photos || []), [photos, sortBy]);
  const newestVideos = useMemo(() => [...(allVideos || [])].sort((a, b) => timeOf(b) - timeOf(a)), [allVideos]);
  const mostViewedVideos = useMemo(
    () => [...(allVideos || [])].sort((a, b) => extractViews(b) - extractViews(a)),
    [allVideos],
  );
  const recentPhotos = useMemo(() => [...(photos || [])].sort((a, b) => timeOf(b) - timeOf(a)), [photos]);

  const handlePhotoClick = async (photo: Photo) => {
    if (photo.isVip && !isUserVip) {
      setLocation("/plans");
      return;
    }

    const updatedPhoto = { ...photo, views: extractViews(photo) + 1 };
    setSelectedPhoto(updatedPhoto);
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updatedPhoto : p)));

    try {
      await registerPhotoView(photo.id);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la vue photo:", err);
    }
  };

  const emptyClass = "col-span-full rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground";
  const videoGrid = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4";
  const photoGrid = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="flex min-h-screen flex-col">
      {/* ================= HERO ================= */}
      <section className="relative isolate w-full overflow-hidden bg-black">
        {bannerVideoUrl && (
          <video
            src={bannerVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
          />
        )}
        {/* Voile de lisibilité : sombre en bas et à gauche, là où se trouve le texte */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="mx-auto flex min-h-[420px] w-full max-w-6xl flex-col justify-end px-5 pb-12 pt-24 animate-in fade-in duration-700 md:min-h-[520px] md:pb-16">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl">
            HAITIAN NUD
          </h1>
          <p className="mt-4 max-w-md text-base text-white/75 md:text-lg">
            {t("Découvrez les contenus les plus exclusifs et récents de la plateforme en haute définition.")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setLocation("/vip-catalog")}
              className="h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90"
            >
              <Play className="mr-2 h-4 w-4 fill-current" /> {t("Regarder maintenant")}
            </Button>
            {!isUserVip && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/plans")}
                className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              >
                {t("nav.become_vip")}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ================= ONGLETS & TRI ================= */}
      <div className="sticky top-14 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl md:top-16">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div role="tablist" className="inline-flex rounded-full bg-muted p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.id === activeTab}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  tab.id === activeTab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          {activeTab !== "all" && (
            <div className="flex items-center gap-4 text-sm">
              {(["recent", "views"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  aria-pressed={sortBy === s}
                  className={cn(
                    "font-medium transition-colors focus-visible:outline-none focus-visible:underline",
                    sortBy === s ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s === "recent" ? t("Récentes") : t("Plus vues")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTENU ================= */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 pb-28 pt-12">
        {activeTab === "all" && (
          <>
            <section>
              <SectionHeader title={t("Nouvelles vidéos")} href="/search" more={t("Voir tout")} />
              <div className={videoGrid}>
                {isLoadingVideos ? (
                  <VideoGridSkeleton count={4} />
                ) : newestVideos.length > 0 ? (
                  newestVideos.slice(0, 4).map((v) => <VideoCard key={v.id} video={v} />)
                ) : (
                  <div className={emptyClass}>{t("Aucune nouvelle vidéo pour le moment.")}</div>
                )}
              </div>
            </section>

            {!isUserVip && (
              <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-center md:justify-between md:p-10">
                <div>
                  <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">{t("home.exclusive_vip_pass")}</h2>
                  <p className="mt-2 max-w-lg text-muted-foreground">
                    {t("Accédez à tout le contenu premium, téléchargements illimités et sans publicités. Soutenez les créateurs haïtiens.")}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setLocation("/plans")}
                  className="h-12 shrink-0 rounded-full bg-amber-400 px-8 text-base font-semibold text-black hover:bg-amber-300"
                >
                  {t("Découvrir les offres")}
                </Button>
              </section>
            )}

            {(isLoadingVideos || mostViewedVideos.length > 4) && (
              <section>
                <SectionHeader title={t("Plus vues")} href="/search" more={t("Voir tout")} />
                <div className={videoGrid}>
                  {isLoadingVideos ? (
                    <VideoGridSkeleton count={4} />
                  ) : (
                    mostViewedVideos.slice(0, 8).map((v) => <VideoCard key={v.id} video={v} />)
                  )}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title={t("Photos")} />
              <div className={photoGrid}>
                {isLoadingPhotos ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-2xl" />)
                ) : recentPhotos.length > 0 ? (
                  recentPhotos.slice(0, 6).map((p) => (
                    <PhotoCard key={p.id} photo={p} locked={!!p.isVip && !isUserVip} onOpen={handlePhotoClick} />
                  ))
                ) : (
                  <div className={emptyClass}>{t("Aucune photo disponible pour l'instant.")}</div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "video" && (
          <section>
            <SectionHeader title={t("Galerie vidéo")} />
            <div className={videoGrid}>
              {isLoadingVideos ? (
                <VideoGridSkeleton count={8} />
              ) : sortedVideos.length > 0 ? (
                sortedVideos.map((v) => <VideoCard key={v.id} video={v} />)
              ) : (
                <div className={emptyClass}>{t("Aucune vidéo disponible.")}</div>
              )}
            </div>
          </section>
        )}

        {activeTab === "photo" && (
          <section>
            <SectionHeader title={t("Galerie photo")} />
            <div className={photoGrid}>
              {isLoadingPhotos ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video w-full rounded-2xl" />)
              ) : sortedPhotos.length > 0 ? (
                sortedPhotos.map((p) => (
                  <PhotoCard key={p.id} photo={p} locked={!!p.isVip && !isUserVip} onOpen={handlePhotoClick} />
                ))
              ) : (
                <div className={emptyClass}>{t("Aucune photo disponible pour l'instant.")}</div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ================= VISIONNEUSE PHOTO ================= */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative flex max-h-[90vh] max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              autoFocus
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-11 right-0 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <X className="h-5 w-5" /> {t("Fermer")}
            </button>
            <img
              src={selectedPhoto.imageUrl || (selectedPhoto as any).image_url}
              alt={selectedPhoto.title}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-semibold">{selectedPhoto.title}</h3>
              <p className="mt-1 flex items-center justify-center gap-3 text-sm text-white/70">
                <span>{selectedPhoto.category}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {t("{{views}} vues", {
                    count: extractViews(selectedPhoto),
                    views: extractViews(selectedPhoto).toLocaleString(i18n.language),
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
