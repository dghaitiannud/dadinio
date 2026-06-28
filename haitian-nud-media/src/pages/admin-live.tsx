import { useState, useEffect } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { supabase } from '@/lib/supabase'; // Ajuste le chemin selon ton projet
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, VideoOff, ShieldAlert } from "lucide-react";

export function AdminLive() {
  const [isActive, setIsActive] = useState(false);
  const [playbackId, setPlaybackId] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Récupérer l'état du live depuis Supabase au chargement
  useEffect(() => {
    async function fetchLiveStatus() {
      const { data, error } = await supabase
        .from('app_settings') // Assure-toi que le nom de la table correspond
        .select('value')
        .eq('key', 'live_playback_id')
        .single();

      if (data && data.value) {
        setPlaybackId(data.value);
        setIsActive(true);
      }
    }
    fetchLiveStatus();
  }, []);

  // 2. Fonction pour lancer le live sur le site
  const handleStartLive = async () => {
    setLoading(true);
    // REMPLACE PAR TON ID DE LECTURE (PLAYBACK ID) GÉNÉRÉ PAR MUX
    const currentPlaybackId = "TON_PLAYBACK_ID_PRO_MUX"; 

    const { error } = await supabase
      .from('app_settings')
      .update({ value: currentPlaybackId })
      .eq('key', 'live_playback_id');

    if (!error) {
      setPlaybackId(currentPlaybackId);
      setIsActive(true);
    }
    setLoading(false);
  };

  // 3. Fonction pour couper le live sur le site
  const handleStopLive = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ value: null })
      .eq('key', 'live_playback_id');

    if (!error) {
      setPlaybackId('');
      setIsActive(false);
    }
    setLoading(false);
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
        disabled={loading}
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