import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL, LIVE_ADMIN_EMAIL } from "@/lib/supabase";
import { getLiveStatus, updateLiveStatus } from "@/lib/supabase-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Radio, Video, VideoOff, Send, Users, ShieldAlert, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

export function AdminLive() {
  const { isSignedIn, appUser, isAdmin } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🚀 ÉTATS AJOUTÉS POUR LE WEBRTC / CAMÉRA DU SMARTPHONE
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Sécurité d'accès stricte : Il faut être connecté ET posséder l'un des deux emails admins
  const hasAccess = isAdmin || (appUser?.email === LIVE_ADMIN_EMAIL || appUser?.email === ADMIN_EMAIL);

  useEffect(() => {
    if (!isSignedIn || !hasAccess) return;

    // Charger l'état actuel de la base
    getLiveStatus().then((status) => {
      setIsActive(status.isActive);
      setStreamUrl(status.streamUrl || "");
    });

    // Écouter les interactions des utilisateurs (commentaires et émojis)
    const liveChannel = supabase.channel("live_interactions", {
      config: { broadcast: { self: false } },
    });

    liveChannel
      .on("broadcast", { event: "comment" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload]);
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        toast(`Réaction reçue : ${payload.emoji}`, { duration: 1500 });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveChannel);
      // Nettoyer la caméra si l'admin quitte la page
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSignedIn, hasAccess]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isSignedIn) return <Redirect to="/login" />;
  if (!hasAccess) return <Redirect to="/" />;

  // 🚀 FONCTION MAGIQUE : Déclenche le pop-up Android d'autorisation Caméra/Micro
  const handleToggleCamera = async () => {
    if (localStream) {
      // Éteindre la caméra
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      toast.info("Caméra et micro désactivés.");
    } else {
      // Allumer la caméra
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user", // "user" = caméra avant, changez par "environment" pour la caméra arrière
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
        
        setLocalStream(stream);
        toast.success("Caméra et micro activés ! Pop-up accepté.");

        // Lier le flux vidéo à notre balise d'aperçu
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        }, 100);

      } catch (err: any) {
        console.error("Erreur d'accès aux médias :", err);
        toast.error("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
      }
    }
  };

  // Lancer le flux en direct
  const handleStartLive = async () => {
    if (!streamUrl.trim()) {
      toast.error("Veuillez saisir l'URL ou la clé HLS/M3U8 de votre flux.");
      return;
    }

    setLoading(true);
    try {
      await updateLiveStatus(true, streamUrl.trim());
      setIsActive(true);

      // Diffuser la mise à jour à tous les clients connectés immédiatement
      await supabase.channel("live_interactions").send({
        type: "broadcast",
        event: "status_changed",
        payload: { isActive: true, streamUrl: streamUrl.trim() },
      });

      toast.success("Votre flux en direct est maintenant en ligne !");
    } catch (err: any) {
      toast.error("Erreur d'activation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Arrêter le flux en direct
  const handleStopLive = async () => {
    setLoading(true);
    try {
      await updateLiveStatus(false, null);
      setIsActive(false);

      // Éteindre la caméra physique si elle tournait encore
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      // Diffuser l'arrêt immédiat aux clients
      await supabase.channel("live_interactions").send({
        type: "broadcast",
        event: "status_changed",
        payload: { isActive: false, streamUrl: null },
      });

      toast.info("Le direct a été coupé.");
    } catch (err: any) {
      toast.error("Erreur d'arrêt : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message système ou de réponse admin dans le chat
  const handleSendAdminMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const adminMessage: ChatMessage = {
      id: Date.now().toString(),
      user: "⭐ Modérateur/Admin",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, adminMessage]);
    supabase.channel("live_interactions").send({
      type: "broadcast",
      event: "comment",
      payload: adminMessage,
    });

    setInputText("");
  };

  return (
    <div className="container mx-auto px-2 py-4 max-w-5xl pb-24 md:pb-8 min-h-[90vh] flex flex-col gap-4">
      {/* En-tête du Studio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Radio className={`h-6 w-6 ${isActive ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
            Studio de Diffusion Live
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connecté en tant que : <span className="font-semibold text-foreground">{appUser?.email}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne Configuration & Statut */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 bg-muted/20 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" /> Configuration de la Source
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* 🚀 NOUVEAU : Bouton matériel pour activer les capteurs physiques du smartphone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Étape 1 : Activer le matériel</label>
                <Button
                  type="button"
                  variant={localStream ? "secondary" : "outline"}
                  onClick={handleToggleCamera}
                  disabled={isActive || loading}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  {localStream ? (
                    <>
                      <CameraOff className="h-4 w-4 text-amber-500" /> Éteindre la caméra du téléphone
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 text-blue-500" /> Demander l'accès Caméra & Micro (Pop-up)
                    </>
                  )}
                </Button>
              </div>

              {/* Retour vidéo en direct de la caméra de l'admin */}
              {localStream && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full border border-border shadow-inner">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                    Aperçu caméra locale
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Étape 2 : URL de streaming (.m3u8, .mp4, ou WebRTC)</label>
                <Input
                  placeholder="Ex: wss://haitiannud-9jux3tyw.livekit.cloud ou lien .m3u8"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  disabled={isActive || loading}
                  className="font-mono text-xs bg-background"
                />
              </div>

              <div className="pt-2">
                {isActive ? (
                  <Button
                    onClick={handleStopLive}
                    disabled={loading}
                    variant="destructive"
                    className="w-full flex items-center justify-center gap-2 font-bold"
                  >
                    <VideoOff className="h-4 w-4" /> Couper le flux en direct
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartLive}
                    disabled={loading || !streamUrl}
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-bold shadow-md shadow-red-600/10"
                  >
                    <Radio className="h-4 w-4" /> Lancer la diffusion publique
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mode d'emploi rapide */}
          <Card className="border-dashed border-border bg-muted/10">
            <CardContent className="p-4 flex gap-3 items-start text-xs text-muted-foreground">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">Rappel du protocole WebRTC</p>
                <p>Pour diffuser sans logiciel tiers, cliquez sur le bouton de caméra ci-dessus, puis collez votre URL de serveur dans le champ réseau avant d'activer le live public.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Contrôle Chat et Modération */}
        <div className="flex flex-col h-[50vh] lg:h-[65vh] bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="font-bold text-xs tracking-wide uppercase text-muted-foreground">Modération Chat</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Monitor
            </span>
          </div>

          {/* Flux de messages reçus */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                En attente d'activité de la part des spectateurs...
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-2 rounded bg-muted/40 border border-border/40 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary/90">{m.user}</span>
                  </div>
                  <p className="text-foreground/90 break-words">{m.text}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulaire d'envoi de messages système */}
          <form onSubmit={handleSendAdminMessage} className="p-3 border-t border-border bg-muted/10 flex gap-2">
            <Input
              placeholder="Répondre ou faire une annonce..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={150}
              className="bg-background text-xs"
            />
            <Button type="submit" size="icon" disabled={!inputText.trim()} className="shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
