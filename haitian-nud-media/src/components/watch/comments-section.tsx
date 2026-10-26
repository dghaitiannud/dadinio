import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { type Comment } from "@/lib/supabase-db";

interface CommentsSectionProps {
  comments: Comment[];
  isLoadingComments: boolean;
  isSignedIn: boolean;
  appUser: any;
  commentBody: string;
  setCommentBody: (val: string) => void;
  anonymous: boolean;
  setAnonymous: (val: boolean) => void;
  commentPending: boolean;
  handleComment: (e: React.FormEvent) => void;
  t: any;
}

export function CommentsSection({
  comments, isLoadingComments, isSignedIn, appUser,
  commentBody, setCommentBody, anonymous, setAnonymous,
  commentPending, handleComment, t
}: CommentsSectionProps) {
  return (
    <div className="mt-8 pt-8 border-t border-border">
      <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        Commentaires ({comments.length || 0})
      </h3>

      {isSignedIn ? (
        <form onSubmit={handleComment} className="mb-8 bg-card p-4 rounded-xl border border-border">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Ajouter un commentaire..."
                className="min-h-[80px] bg-background border-border resize-none focus-visible:ring-primary mb-3"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                  <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                    {t('watch.post_anonymous')}
                  </Label>
                </div>
                <Button type="submit" disabled={!commentBody.trim() || commentPending}>
                  {t('watch.comment_btn')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-card border border-border rounded-xl text-center">
          <p className="text-muted-foreground mb-4">{t('watch.login_to_discuss')}</p>
          <Button variant="outline">{t('nav.login')}</Button>
        </div>
      )}

      <div className="space-y-6">
        {isLoadingComments ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(comment.displayName || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {comment.anonymous ? "Anonyme" : (comment.displayName || "Utilisateur")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{comment.body}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">{t('watch.first_comment')}</p>
        )}
      </div>
    </div>
  );
}