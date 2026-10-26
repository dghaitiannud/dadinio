import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import {
  getVideo, getVideos, registerView, requestDownload,
  listComments, createComment, type Video, type Comment
} from "@/lib/supabase-db";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, Lock, Star, Download, Heart, Share2, Copy, Loader2, WifiOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { HybridVideoPlayer } from "@/components/player/hybrid-video-player";
import { CommentsSection } from "@/components/watch/comments-section";
import { RelatedVideos } from "@/components/watch/related-videos";
import { downloadAndSaveVideo, listOfflineVideos } from "@/lib/offline-store";

const API_BASE_URL = "https://api.haitiannud.com";

export function Watch() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isSignedIn, user, appUser, isLoading: authLoading } = useAuth();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [commentBody, setCommentBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentPending, setCommentPending] = useState(false);

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";

  // ... (useEffect pour charger la vidéo et les commentaires identique à l'ancien code)
  // ... (handlers handleComment, handleDownload, handleLike, etc. identiques)

  if (isLoadingVideo || authLoading) return <div>Chargement...</div>;
  if (videoError || !video) return <div>Erreur</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          
          {/* LECTEUR */}
          <div className="relative w-full aspect-video bg-black rounded-xl shadow-2xl mb-4 group">
            {!isSignedIn ? (
              // ... VipGate
              <div />
            ) : video.isVip && !isUserVip ? (
              // ... VipGate
              <div />
            ) : video.videoUrl ? (
              <HybridVideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl || '/logo.jpg'}
                videoId={video.id}
              />
            ) : (
               <div />
            )}
          </div>

          {/* DETAILS */}
          <div className="mb-6">
             {/* Titre, boutons (J'aime, Partager, DL) - code inchangé */}
          </div>

          {/* COMMENTAIRES (Composant séparé) */}
          <CommentsSection
            comments={comments}
            isLoadingComments={isLoadingComments}
            isSignedIn={isSignedIn}
            appUser={appUser}
            commentBody={commentBody}
            setCommentBody={setCommentBody}
            anonymous={anonymous}
            setAnonymous={setAnonymous}
            commentPending={commentPending}
            handleComment={(e) => {
              e.preventDefault();
              // Logique handleComment
            }}
            t={t}
          />
        </div>

        {/* SIDEBAR (Composant séparé) */}
        <RelatedVideos relatedVideos={relatedVideos} t={t} />
      </div>
    </div>
  );
}