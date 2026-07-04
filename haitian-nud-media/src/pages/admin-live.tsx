import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import MuxPlayer from '@mux/mux-player-react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Radio, VideoOff } from "lucide-react";

// ⚠️ REMPLACE CETTE VALEUR PAR TON EMAIL DE CONNEXION ADMIN LIVEADMIN
const ADMIN_EMAIL_BACKUP = "liveadmin@gmail.com";

export function AdminLive() {
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  const [isActive, setIsActive] = useState(false);
  const [playbackId, setPlaybackId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 1. Protection de la page et gestion du cycle de chargement
  useEffect(() => {
    const checkAccess = () => {
      // Log utile pour voir ce que l'application détecte réellement dans Acode/navigateur
      console.log("Vérification Admin - appUser:", appUser);

      if (isSignedIn) {
        const userRole = (appUser as any)?.role;
        const userEmail = (appUser as any)?.email;
        
        // Sécurité par rôle OU par email de secours pour forcer l'accès
        if (userRole === 'admin' || userEmail === ADMIN_EMAIL_BACKUP) {
          setIsChecking(false); // Accès accordé
        } else {
          console.warn("Accès refusé : rôle ou email incorrect", { userRole, userEmail });
          setLocation('/');
        }
      } else {
        setLocation('/');
      }
    };

    // Un léger timeout permet d'éviter les faux rebonds pendant l'initialisation du contexte Auth
    const timer = setTimeout(() => {
      checkAccess();
    }, 500);

    return () => clearTimeout(timer);
  }, [isSignedIn, appUser, setLocation]);

  // 2. Récupérer l'état du live depuis Supabase au chargement
  useEffect(() => {
    // Si l'accès est validé globalement, on peut charger le statut
    if (isSignedIn && !isChecking) {
      async function fetchLiveStatus() {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'live_playback_id')
          .single();

        if (error) {
          console.warn("Impossible de récupérer l'état du live :", error);
        }

        if (data && data.value) {
          setPlaybackId(data.value);
          setIsActive(true);
        }
      }
      fetchLiveStatus();
    }
  }, [isSignedIn, isChecking]);

  // Écran d'attente local pendant la vérification du profil
  if (isChecking) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-sm text-muted-foreground animate-pulse">
        Vérification des autorisations...
      </div>
    );
  }

  // Double sécurité : si pas connecté ou pas admin/email valide, on n'affiche rien
  const userRole = (appUser as any)?.role;
  const userEmail = (appUser as any)?.email;
  if (!isSignedIn || (userRole !== 'admin' && userEmail !== ADMIN_EMAIL_BACKUP)) {
    return null;
  }

  // 3. Fonction pour lancer le live sur le site
  const handleStartLive = async () => {
    setActionLoading(true);
    const currentPlaybackId = "hOHyJBsghEMe9mVy6lX7hecK1lBitndcOtMO9uttXtw"; 

    const { error } = await supabase
      .from('app_settings')
      .update({ value: currentPlaybackId })
      .eq('id', 'live_playback_id');

    if (!error) {
      setPlaybackId(currentPlaybackId);
      setIsActive(true);
    } else {
      console.error("Erreur lors de l'activation du flux :", error);
    }
    setActionLoading(false);
  };

  // 4. Fonction pour couper le live sur le site
  const handleStopLive = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: null })
      .eq('id', 'live_playback_id');

    if (!error) {
      setPlaybackId('');
      setIsActive(false);
    } else {
      console.error("Erreur lors de l'arrêt du flux :", error);
    }
    setActionLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h1 className="text-xl font-bold tracking-tight">Console de Streaming Pro</h1>
        {isActive && (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse">
            <Radio className="w-3.5 h-3.5" /> En Direct
          </span>
        )}
      </div>

      {/* Zone d'affichage du Lecteur Haute Qualité Mux */}
      <div className="aspect-[9/16] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-800">
        {isActive && playbackId ? (
          <MuxPlayer
            playbackId={playbackId}
            streamType="live"
            autoPlay
            muted
            preferCmcd="low-latency"
            maxLiveSyncPlaybackRate={2}
            placeholder=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center gap-2">
            <VideoOff className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-medium">Le flux est actuellement hors ligne</p>
            <p className="text-xs text-zinc-600">Configurez votre logiciel d'envoi et lancez le direct.</p>
          </div>
        )}
      </div>

      {/* Bouton d'action Admin */}
      <Button 
        onClick={isActive ? handleStopLive : handleStartLive} 
        disabled={actionLoading}
        variant={isActive ? "destructive" : "default"}
        className="w-full py-6 text-base font-semibold rounded-xl shadow-md transition-all"
      >
        {isActive ? (
          <><VideoOff className="mr-2 h-5 w-5"/> Interrompre la diffusion</>
        ) : (
          <><Radio className="mr-2 h-5 w-5"/> Activer le flux sur le site</>
        )}
      </Button>
    </div>
  );
}
