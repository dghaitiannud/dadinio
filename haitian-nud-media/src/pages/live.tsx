import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import MuxPlayer from "@mux/mux-player-react"; // 1. IMPORT DU LECTEUR PRO MUX
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send, Radio, Users, Volume2, VolumeX } from "lucide-react";
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
  const [isActive, setIsActive] = useState(false); // Gestion directe de l'état
  const [playbackId, setPlaybackId] = useState<string | null>(null); // Stockage du Playback ID
  const [isMuted, setIsMuted] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [viewerCount, setViewerCount] = useState(1);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Redirection stricte si non connecté
  if (!isSignedIn) {
    return <Redirect to="/login" />;
  }

  useEffect(() => {
    // 2. RÉCUPÉRATION DIRECTE DEPUIS TA TABLE SUPABASE NETTOYÉE
    async function fetchLiveSettings() {
      const { data, error } = await supabase
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

    // 3. ÉCOUTE EN TEMPS RÉEL DU CHANGEMENT DE LA BASE DE DONNÉES (SUPABASE REALTIME)
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

    // Écoute des interactions (chat & réactions)
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

  // Scroll automatique du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Déclencher l'affichage visuel d'une réaction volante
  const triggerLocalReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.random() * 60 + 20;
    setReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  // Envoyer une réaction à tout le monde
  const sendReaction = (emoji: string) => {
    triggerLocalReaction(emoji);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji },
    });
  };

  // Envoyer un commentaire dans le chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="container mx-auto px-2 py-4 max-w-6xl pb-24 md:pb-8 min-h-[90vh] flex flex-col lg:flex-row gap-4">
      {/* Colonne Lecteur Vidéo */}
      <div className="flex-1 flex flex-col justify-between relative bg-black rounded-xl overflow-hidden aspect-video lg:aspect-auto lg:h-[75vh] border border-border">
        {isActive && playbackId ? (
          <div className="relative w-full h-full bg-black">
            {/* 4. REMPLACEMENT PAR LE LECTEUR HAUTE PERFORMANCE MUX */}
            <MuxPlayer
              playbackId={playbackId}
              streamType="live"
              autoPlay
              muted={isMuted}
              className="w-full h-full object-contain"
            />

            {/* Overlay d'informations sur le Live */}
            <div className="absolute top-4 left-4 flex gap-2 items-center z-10">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-wider animate-pulse">
                <Radio className="h-3 w-3" />{t('nav.live_stream')}</span>
              <span className="bg-black/60 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                <Users className="h-3 w-3" /> {viewerCount}
              </span>
            </div>

            {/* Bouton Mute Mobile */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 left-4 rounded-full bg-black/50 text-white backdrop-blur-sm border-0 hover:bg-black/70 z-10"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 bg-neutral-900 text-neutral-400 h-full w-full architecture-placeholder">
            <Radio className="h-12 w-12 text-neutral-600 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white">{t('live.no_live')}</h3>
            <p className="text-sm mt-2 max-w-sm">{t('live.no_live_desc')}</p>
          </div>
        )}

        {/* Zone des réactions volantes (Rendu par-dessus la vidéo) */}
        <div className="absolute bottom-20 right-4 w-24 h-64 pointer-events-none z-20 overflow-hidden">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-0 text-3xl animate-fade-up-float"
              style={{ left: `${r.left}%` }}
            >
              {r.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Colonne Chat et Interactions */}
      <div className="w-full lg:w-96 flex flex-col h-[45vh] lg:h-[75vh] bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* En-tête Chat */}
        <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="font-serif font-bold text-sm">{t('live.live_chat')}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-lg p-1 h-8 w-8" onClick={() => sendReaction("❤️")}>❤️</Button>
            <Button variant="ghost" size="sm" className="text-lg p-1 h-8 w-8" onClick={() => sendReaction("🔥")}>🔥</Button>
            <Button variant="ghost" size="sm" className="text-lg p-1 h-8 w-8" onClick={() => sendReaction("😂")}>😂</Button>
            <Button variant="ghost" size="sm" className="text-lg p-1 h-8 w-8" onClick={() => sendReaction("👑")}>👑</Button>
          </div>
        </div>

        {/* Zone des messages de discussion */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground italic">
              Bienvenue dans le chat ! Laissez un commentaire gentil.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded-lg">
                <Avatar className="h-6 w-6 border border-primary/10">
                  <AvatarFallback className="text-[10px] bg-accent font-bold">
                    {m.user.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs block text-primary/90">{m.user}</span>
                  <p className="text-foreground/95 break-words mt-0.5">{m.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Formulaire d'envoi du message */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-muted/10 flex gap-2">
          <Input
            placeholder="Envoyer un message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={150}
            className="bg-background"
          />
          <Button type="submit" size="icon" disabled={!inputText.trim() || !isActive}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}