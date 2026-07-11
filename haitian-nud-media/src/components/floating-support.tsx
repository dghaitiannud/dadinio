import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Ajuste le chemin selon ton projet
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FloatingSupport({ currentUser }: { currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sécurité : Si l'utilisateur est l'admin, on n'affiche PAS le bouton de chat
  if (!currentUser || currentUser.id === 'admin' || currentUser.email === 'ton-email-admin@test.com') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    try {
      // 1. Sauvegarde du ticket dans Supabase
      const { error } = await supabase.from('tickets').insert([
        {
          user_id: currentUser.id,
          subject,
          message,
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // 2. ENVOI DE LA NOTIFICATION À L'ADMIN
      await fetch('https://api-6rzs.onrender.com/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: 'admin', // L'admin reçoit la notification
          title: `💬 Nouveau ticket : ${subject}`,
          body: `${currentUser.email || 'Un utilisateur'} a envoyé un message au support.`,
        }),
      }).catch(err => console.error("Erreur envoi notif admin:", err));

      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Bouton Rond Flottant */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Fenêtre de Chat de Support */}
      {isOpen && (
        <div className="w-80 md:w-96 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          {/* Entête */}
          <div className="bg-primary p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Support en ligne</h3>
              <p className="text-xs text-primary-foreground/80">Une question ? Écrivez-nous.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-foreground/20 rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Formulaire / Corps */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {success ? (
              <div className="text-center py-8 text-green-600 font-medium">
                ✨ Votre message a bien été envoyé ! L'équipe vous répondra dans les plus brefs délais.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Sujet</label>
                  <Input
                    placeholder="Ex: Problème d'abonnement"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Message</label>
                  <Textarea
                    placeholder="Décrivez votre problème en détail..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full flex gap-2" disabled={loading}>
                  {loading ? 'Envoi...' : (
                    <>
                      Envoyer le message <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
