import { Link } from "wouter";
import { type Video } from "@/lib/supabase-db";

interface RelatedVideosProps {
  relatedVideos: Video[];
  t: any;
}

export function RelatedVideos({ relatedVideos, t }: RelatedVideosProps) {
  return (
    <div className="lg:col-span-1">
      <h3 className="font-serif font-bold text-lg mb-4">{t('watch.same_category')}</h3>
      <div className="flex flex-col gap-4">
        {relatedVideos.length > 0 ? (
          relatedVideos.map((vid) => (
            <Link key={vid.id} href={`/watch/${vid.id}`} className="flex gap-3 group">
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                <img src={vid.thumbnailUrl || '/logo.jpg'} alt={vid.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                {vid.isVip && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">{t('common.vip')}</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 px-1 bg-black/80 text-[10px] text-white rounded">
                  {Math.floor(vid.durationSec / 60)}:{(vid.durationSec % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h4 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{vid.title}</h4>
                <div className="text-xs text-muted-foreground mt-1">{vid.views.toLocaleString()} vues</div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t('watch.no_similar_videos')}</p>
        )}
      </div>
    </div>
  );
}