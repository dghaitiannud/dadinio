import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send, Radio, Users, Volume2, VolumeX, ExternalLink, Sparkles, MessageSquareLock } from "lucide-react";
import { toast } from "sonner";

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

export function Live() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [viewerCount, setViewerCount] = useState(1);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!isSignedIn) {
    return <Redirect to="/login" />;
  }

  useEffect(() => {
    async function fetchLiveSettings() {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("id", "live_playback_id")
        .single();

      if (data && data.value) {
        setPlaybackId(data.value);
        setIsActive(true);
      } else {
        setIsActive(false);
        setPlaybackId(null);
      }
    }

    fetchLiveSettings();

    const settingsSubscription = supabase
      .channel("public:app_settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings", filter: "id=eq.live_playback_id" },
        (payload) => {
          const newValue = payload.new.value;
          if (newValue) {
            setPlaybackId(newValue);
            setIsActive(true);
            toast.success("Le live commence !");
          } else {
            setIsActive(false);
            setPlaybackId(null);
            toast.info("Le live s'est terminé.");
          }
        }
      )
      .subscribe();

    const liveChannel = supabase.channel("live_interactions", {
      config: { broadcast: { self: false } },
    });

    liveChannel
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        triggerLocalReaction(payload.emoji);
      })
      .on("broadcast", { event: "comment" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSubscription);
      supabase.removeChannel(liveChannel);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const triggerLocalReaction = (emoji: string) => {
    if (!isActive) return;
    const id = Date.now() + Math.random();
    const left = Math.random() * 60 + 20;
    setReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const sendReaction = (emoji: string) => {
    if (!isActive) {
      toast.error("Le live doit être actif pour envoyer des réactions.");
      return;
    }
    triggerLocalReaction(emoji);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji },
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) {
      toast.error("Le chat est disponible uniquement lorsque le live est actif.");
      return;
    }
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: appUser?.displayName || "Anonyme",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "comment",
      payload: newMessage,
    });

    setInputText("");
  };

  return (
    <div className="container mx-auto px-3 py-6 max-w-7xl pb-24 md:pb-8 min-h-[90vh] flex flex-col gap-6">
      
      {/* Banner Recrutement / Telegram */}
      <div className="w-full bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-primary/20 border border-primary/30 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 bg-primary/20 rounded-xl text-primary shrink-0 hidden sm:block">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Envie de faire des streams & monétiser ton contenu ?</h3>
            <p className="text-xs text-muted-foreground">Rejoins l'équipe et deviens créatrice ou actrice de live sur HAITIAN NUD.</p>
          </div>
        </div>
        <a 
          href="https://T.me/dg_haitiannud" 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 w-full sm:w-auto"
        >
          <Button className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-primary hover:opacity-90 text-white font-bold h-11 rounded-xl px-6 shadow-md transition-all">
            Devenir créatrice ou actrice de live <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne Lecteur Vidéo */}
        <div className="flex-1 flex flex-col justify-between relative bg-black rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:h-[72vh] border border-border shadow-2xl">
          {isActive && playbackId ? (
            <div className="relative w-full h-full bg-black">
              <MuxPlayer
                playbackId={playbackId}
                streamType="live"
                autoPlay
                muted={isMuted}
                className="w-full h-full object-contain"
              />

              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 flex gap-2 items-center z-10">
                <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-lg animate-pulse">
                  <Radio className="h-3.5 w-3.5" /> Direct
                </span>
                <span className="bg-black/60 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                  <Users className="h-3.5 w-3.5 text-primary" /> {viewerCount}
                </span>
              </div>

              {/* Bouton Mute */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-4 left-4 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 z-10"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8 bg-neutral-950 text-neutral-400 h-full w-full">
              <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800 mb-4">
                <Radio className="h-10 w-10 text-neutral-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Aucun direct en cours</h3>
              <p className="text-xs sm:text-sm mt-1 max-w-sm text-neutral-400">
                Restez à l'affût, une notification sera envoyée dès le démarrage du prochain live !
              </p>
            </div>
          )}

          {/* Zone des réactions volantes */}
          <div className="absolute bottom-16 right-4 w-24 h-64 pointer-events-none z-20 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-0 text-3xl animate-fade-up-float drop-shadow-md"
                style={{ left: `${r.left}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne Chat et Interactions */}
        <div className="w-full lg:w-96 flex flex-col h-[50vh] lg:h-[72vh] bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden">
          
          {/* En-tête Chat */}
          <div className="p-3.5 border-b border-border/80 bg-muted/40 flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-muted-foreground'}`} />
              Chat en direct
            </span>
            
            {/* Émojis réactifs (Désactivés si live inactif) */}
            <div className={`flex gap-1 transition-opacity ${!isActive ? 'opacity-40 pointer-events-none' : ''}`}>
              {["❤️", "🔥", "😂", "👑"].map((emoji) => (
                <Button 
                  key={emoji} 
                  variant="ghost" 
                  size="sm" 
                  disabled={!isActive}
                  className="text-base p-1 h-8 w-8 hover:bg-primary/20 hover:scale-110 transition-transform rounded-lg" 
                  onClick={() => sendReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {!isActive ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
                <MessageSquareLock className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-xs font-medium">Le chat en direct est verrouillé.</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Les réactions et messages s'activeront automatiquement dès que le live commencera.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground italic">
                Soyez le premier à envoyer un message !
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-2.5 items-start bg-muted/30 p-2.5 rounded-xl border border-border/40">
                  <Avatar className="h-6 w-6 border border-primary/20">
                    <AvatarFallback className="text-[10px] bg-primary/20 font-bold text-primary">
                      {m.user.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block text-primary">{m.user}</span>
                    <p className="text-foreground/90 break-words mt-0.5 text-xs leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulaire d'envoi (Désactivé si live inactif) */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border/80 bg-muted/20 flex gap-2">
            <Input
              placeholder={isActive ? "Envoyer un message..." : "Live hors-ligne..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isActive}
              maxLength={150}
              className="bg-background rounded-xl text-xs h-10 border-border/80 focus:border-primary"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputText.trim() || !isActive}
              className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
