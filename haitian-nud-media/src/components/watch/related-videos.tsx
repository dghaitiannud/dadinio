import { Link } from "wouter";
import { type Video } from "@/lib/supabase-db";
import { useTranslation } from "react-i18next";

interface RelatedVideosProps {
  relatedVideos: Video[];
}

export function RelatedVideos({ relatedVideos }: RelatedVideosProps) {
  const { t, i18n } = useTranslation();

  return (
    <aside className="min-w-0">
      <h2 className="mb-4 font-serif text-xl font-semibold tracking-tight">{t("watch.same_category")}</h2>
      <div className="flex flex-col gap-4">
        {relatedVideos.length > 0 ? (
          relatedVideos.map((vid) => (
            <Link
              key={vid.id}
              href={`/watch/${vid.id}`}
              className="group flex gap-3.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img
                  src={vid.thumbnailUrl || "/logo.jpg"}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1 text-[11px] font-medium tabular-nums text-white">
                  {Math.floor(vid.durationSec / 60)}:{(vid.durationSec % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{vid.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("{{views}} vues", { count: vid.views, views: vid.views.toLocaleString(i18n.language) })}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("watch.no_similar_videos")}</p>
        )}
      </div>
    </aside>
  );
}
