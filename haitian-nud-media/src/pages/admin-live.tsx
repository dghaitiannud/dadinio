import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import MuxPlayer from '@mux/mux-player-react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Radio, VideoOff } from "lucide-react";

// ⚠️ LISTE DES EMAILS AUTORISÉS À ACCÉDER À LA CONSOLE
const ADMIN_EMAILS = ["liveadmin@gmail.com", "dghaitiannud@gmail.com"];

export function AdminLive() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  const [isActive, setIsActive] = useState(false);
  const [playbackId, setPlaybackId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 1. Protection de la page et gestion du cycle de chargement
  useEffect(() => {
    const checkAccess = () => {
      console.log("Vérification Admin - appUser:", appUser);

      if (isSignedIn) {
        const userRole = (appUser as any)?.role;
        const userEmail = (appUser as any)?.email;
        
        // Sécurité par rôle OU par liste d'emails autorisés
        if (userRole === 'admin' || (userEmail && ADMIN_EMAILS.includes(userEmail))) {
          setIsChecking(false); // Accès accordé
        } else {
          console.warn("Accès refusé : rôle ou email non autorisé", { userRole, userEmail });
          setLocation('/');
        }
      } else {
        setLocation('/');
      }
    };

    const timer = setTimeout(() => {
      checkAccess();
    }, 500);

    return () => clearTimeout(timer);
  }, [isSignedIn, appUser, setLocation]);

  // 2. Récupérer l'état du live depuis Supabase au chargement
  useEffect(() => {
    if (isSignedIn && !isChecking) {
      async function fetchLiveStatus() {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'live_playback_id')
          .single();

        if (!error && data && data.value) {
          setPlaybackId(data.value);
          setIsActive(true);
        }
      }
      fetchLiveStatus();
    }
  }, [isSignedIn, isChecking]);

  // Écran d'attente local pendant la vérification
  if (isChecking) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-sm text-muted-foreground animate-pulse">
        Vérification des autorisations...
      </div>
    );
  }

  // Double sécurité : si pas connecté ou pas autorisé
  const userRole = (appUser as any)?.role;
  const userEmail = (appUser as any)?.email;
  if (!isSignedIn || (userRole !== 'admin' && !(userEmail && ADMIN_EMAILS.includes(userEmail)))) {
    return null;
  }

  // 3. Fonction pour lancer le live
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
    }
    setActionLoading(false);
  };

  // 4. Fonction pour couper le live
  const handleStopLive = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: null })
      .eq('id', 'live_playback_id');

    if (!error) {
      setPlaybackId('');
      setIsActive(false);
    }
    setActionLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h1 className="text-xl font-bold tracking-tight">Console de Streaming Pro</h1>
        {isActive && (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse">
            <Radio className="w-3.5 h-3.5" />{t('common.live')}</span>
        )}
      </div>

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
