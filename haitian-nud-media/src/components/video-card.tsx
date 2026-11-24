import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import type { Video } from "@/lib/supabase-db";
import { formatDistanceToNow } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  className?: string;
}

export function VideoCard({ video, className = "" }: VideoCardProps) {
  const dateLocale = useDateLocale();
  const { t, i18n } = useTranslation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

  const minutes = Math.floor(video.durationSec / 60);
  const seconds = (video.durationSec % 60).toString().padStart(2, "0");

  return (
    <Link
      href={`/watch/${video.id}`}
      className={cn(
        "group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="relative mb-3 aspect-video overflow-hidden rounded-2xl bg-muted">
        <img
          src={video.thumbnailUrl || `${basePath}/logo.jpg`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
          {minutes}:{seconds}
        </span>

        {video.isVip && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
            <Star className="h-3 w-3 fill-current" />
            {t("common.vip")}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{video.title}</h3>
      <p className="mt-1 truncate text-sm text-muted-foreground">{video.category}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {t("{{views}} vues", { count: video.views, views: video.views.toLocaleString(i18n.language) })}
        {" · "}
        {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: dateLocale })}
      </p>
    </Link>
  );
}
