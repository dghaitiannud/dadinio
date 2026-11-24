import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { getVideos, type Video } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Search as SearchIcon, Loader2 } from "lucide-react";

// Messages plus courts adaptés aux mobiles
const TICKER_MESSAGES = [
  "chache zen...",
  "rejwenn gwoup yo kounya!",
  "voye zen Telegram : @dg_haitiannud"
];

export function Search() {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour l'effet machine à écrire (Typing effect)
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ✍️ Effet d'animation de machine à écrire configuré plus lentement
  useEffect(() => {
    const currentFullText = TICKER_MESSAGES[messageIndex];
    
    // Vitesse de frappe : 120ms par lettre (plus lent pour une lecture confortable)
    // Vitesse d'effacement : 40ms par lettre
    let typingSpeed = isDeleting ? 40 : 120;

    // 🕒 PAUSE : Si le texte est entièrement écrit, on le laisse figer pendant 6 secondes (6000ms)
    if (!isDeleting && currentPlaceholder === currentFullText) {
      typingSpeed = 6000; 
      setIsDeleting(true);
    } 
    // Si le texte est complètement effacé, on passe au message suivant
    else if (isDeleting && currentPlaceholder === "") {
      setIsDeleting(false);
      setMessageIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
      typingSpeed = 300;
    }

    const timeout = setTimeout(() => {
      setCurrentPlaceholder(
        isDeleting
          ? currentFullText.substring(0, currentPlaceholder.length - 1)
          : currentFullText.substring(0, currentPlaceholder.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentPlaceholder, isDeleting, messageIndex]);

  // Debounce logic pour la recherche Supabase
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      const newUrl = new URL(window.location.href);
      if (query) {
        newUrl.searchParams.set("q", query);
      } else {
        newUrl.searchParams.delete("q");
      }
      window.history.replaceState({}, "", newUrl.toString());
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setIsLoading(true);
    getVideos(debouncedQuery ? { q: debouncedQuery } : undefined)
      .then(v => {
        setVideos(v);
        setIsLoading(false);
      });
  }, [debouncedQuery]);

  return (
    <div className="mx-auto min-h-[80vh] w-full max-w-6xl px-5 pb-28 pt-10 md:pt-14">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("Rechercher")}</h1>
        <div className="relative mt-8">
          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label={t("Rechercher")}
            placeholder={currentPlaceholder}
            className="h-14 w-full rounded-full border border-border bg-card pr-6 text-lg outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
            style={{ paddingLeft: "3.25rem" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <section>
        <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">
          {debouncedQuery
            ? t("Résultats pour \"{{debouncedQuery}}\"", { debouncedQuery })
            : t("Toutes les vidéos")}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <SearchIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">{t("search.no_results")}</h3>
            <p className="mt-1 text-muted-foreground">{t("search.no_results_desc")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
