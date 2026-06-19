import { useState, useEffect } from "react";
import { getVideos, type Video } from "@/lib/supabase-db";
import { VideoCard } from "@/components/video-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";

// Messages plus courts adaptés aux mobiles
const TICKER_MESSAGES = [
  "chache zen...",
  "rejwenn gwoup yo kounya!",
  "voye zen sou: 31 31 02 27",
  "oswa sou: 31 30 16 95"
];

export function Search() {
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
    <div className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-serif font-bold mb-6">Rechercher</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder={currentPlaceholder}
            className="pl-10 h-12 bg-card border-border text-lg rounded-full shadow-sm focus-visible:ring-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {debouncedQuery 
            ? `Résultats pour "${debouncedQuery}"` 
            : "Toutes les vidéos"}
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card border border-dashed border-border rounded-xl">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
            <p className="text-muted-foreground">Essayez d'autres mots-clés ou parcourez nos catégories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
