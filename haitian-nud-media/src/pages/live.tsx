
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Radio, Users, Volume2, VolumeX, ExternalLink, MessageSquareLock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    async function fetchLiveSettings() {
      const { data } = await supabase.
      from("app_settings").
      select("value").
      eq("id", "live_playback_id").
      single();

      if (data && data.value) {
        setPlaybackId(data.value);
        setIsActive(true);
      } else {
        setIsActive(false);
        setPlaybackId(null);
      }
    }

    fetchLiveSettings();

    const settingsSubscription = supabase.
    channel("public:app_settings").
    on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "app_settings", filter: "id=eq.live_playback_id" },
      (payload) => {
        const newValue = payload.new.value;
        if (newValue) {
          setPlaybackId(newValue);
          setIsActive(true);
          toast.success(t("Le live commence !"));
        } else {
          setIsActive(false);
          setPlaybackId(null);
          toast.info(t("Le live s'est terminé."));
        }
      }
    ).
    subscribe();

    const liveChannel = supabase.channel("live_interactions", {
      config: { broadcast: { self: false } }
    });

    liveChannel.
    on("broadcast", { event: "reaction" }, ({ payload }) => {
      triggerLocalReaction(payload.emoji);
    }).
    on("broadcast", { event: "comment" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload]);
    }).
    subscribe();

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
      toast.error(t("Le live doit être actif pour envoyer des réactions."));
      return;
    }
    triggerLocalReaction(emoji);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) {
      toast.error(t("Le chat est disponible uniquement lorsque le live est actif."));
      return;
    }
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: appUser?.displayName || "Anonyme",
      text: inputText.trim()
    };

    setMessages((prev) => [...prev, newMessage]);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "comment",
      payload: newMessage
    });

    setInputText("");
  };

  if (!isSignedIn) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="mx-auto flex min-h-[90vh] w-full max-w-7xl flex-col gap-6 px-5 pb-28 pt-8 md:pb-10 md:pt-10">
      {/* Recrutement */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">{t("Envie de faire des streams & monétiser ton contenu ?")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("Rejoins l'équipe et deviens créatrice ou actrice de live sur HAITIAN NUD.")}
          </p>
        </div>
        <a href="https://T.me/dg_haitiannud" target="_blank" rel="noopener noreferrer" className="w-full shrink-0 sm:w-auto">
          <Button className="h-11 w-full rounded-full bg-amber-400 px-6 font-semibold text-black hover:bg-amber-300 sm:w-auto">
            {t("Devenir créatrice ou actrice de live")} <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Lecteur */}
        <div className="relative aspect-video flex-1 overflow-hidden rounded-2xl bg-black lg:aspect-auto lg:h-[72vh]">
          {isActive && playbackId ? (
            <div className="relative h-full w-full bg-black">
              <MuxPlayer playbackId={playbackId} streamType="live" autoPlay muted={isMuted} className="h-full w-full object-contain" />

              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                  <Radio className="h-3.5 w-3.5" /> {t("Direct")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-md">
                  <Users className="h-3.5 w-3.5" /> {viewerCount}
                </span>
              </div>

              <Button
                variant="secondary"
                size="icon"
                aria-label={isMuted ? t("live.unmute") : t("live.mute")}
                className="absolute bottom-4 left-4 z-10 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-8 text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{t("Aucun direct en cours")}</h3>
              <p className="mt-2 max-w-sm text-sm text-white/60">
                {t("Restez à l'affût, une notification sera envoyée dès le démarrage du prochain live !")}
              </p>
            </div>
          )}

          {/* Réactions volantes */}
          <div className="pointer-events-none absolute bottom-16 right-4 z-20 h-64 w-24 overflow-hidden">
            {reactions.map((r) => (
              <div key={r.id} className="animate-fade-up-float absolute bottom-0 text-3xl drop-shadow-md" style={{ left: `${r.left}%` }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-[50vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card lg:h-[72vh] lg:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground/50")} aria-hidden />
              {t("Chat en direct")}
            </span>

            <div className={cn("flex gap-0.5", !isActive && "pointer-events-none opacity-40")}>
              {["❤️", "🔥", "😂", "👑"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={!isActive}
                  onClick={() => sendReaction(emoji)}
                  aria-label={emoji}
                  className="h-9 w-9 rounded-full text-lg transition-transform hover:scale-110 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {!isActive ? (
              <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-muted-foreground">
                <MessageSquareLock className="h-7 w-7 text-muted-foreground/60" />
                <p className="text-sm font-medium">{t("Le chat en direct est verrouillé.")}</p>
                <p className="max-w-[240px] text-xs">
                  {t("Les réactions et messages s'activeront automatiquement dès que le live commencera.")}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("Soyez le premier à envoyer un message !")}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-muted text-xs font-semibold">{m.user.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted-foreground">{m.user}</span>
                    <p className="mt-0.5 break-words text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border p-3">
            <Input
              placeholder={isActive ? t("Envoyer un message...") : t("Live hors-ligne...")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isActive}
              maxLength={150}
              className="h-10 rounded-full bg-background px-4"
            />
            <Button
              type="submit"
              size="icon"
              aria-label={t("Envoyer")}
              disabled={!inputText.trim() || !isActive}
              className="h-10 w-10 shrink-0 rounded-full bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
                }
