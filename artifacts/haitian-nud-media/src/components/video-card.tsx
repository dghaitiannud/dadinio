import { Link } from "wouter";
import type { Video } from "@/lib/supabase-db";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCardProps {
  video: Video;
  className?: string;
}

export function VideoCard({ video, className = "" }: VideoCardProps) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

  return (
    <Link href={`/watch/${video.id}`} className={`group block ${className}`}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3">
        <img
          src={video.thumbnailUrl || `${basePath}/logo.jpg`}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_rgba(30,94,255,0.6)]">
            <Play className="h-5 w-5 ml-1" fill="currentColor" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded">
          {Math.floor(video.durationSec / 60)}:{(video.durationSec % 60).toString().padStart(2, '0')}
        </div>

        {video.isVip && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-gradient-to-r from-primary to-blue-400 text-white border-0 shadow-lg font-bold gap-1">
              <Star className="h-3 w-3 fill-current" /> VIP
            </Badge>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
            <span className="truncate">{video.category}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
            <span>{video.views.toLocaleString()} vues</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
            <span className="whitespace-nowrap">
              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
