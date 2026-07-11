import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { createTicket } from "@/lib/supabase-db";
import { ADMIN_EMAIL } from "@/lib/supabase";

export function FloatingSupport({ currentUser }: { currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Sécurité stricte : On masque le chat si pas connecté, ou si c'est l'admin
  if (!currentUser || currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !currentUser?.id) return;

    setLoading(true);
    try {
      // 2. Utilisation de TA fonction native pour insérer dans la bonne table Supabase
      await createTicket(currentUser.id, subject.trim(), message.trim());

      // 3. Envoi de la notification push à l'admin avec tes paramètres exacts
      await fetch('https://api-6rzs.onrender.com/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Support: ${subject.trim()}`,
          body: `Message de ${currentUser.email}`,
          url: "/admin", // Redirige l'admin sur son panneau
          icon: "/logo.jpg",
          targetUserId: 'admin', // Cible l'administration
          adminSecret: "Pourquoi2020??" // Ton secret requis par l'API
        }),
      }).catch(err => console.warn("Échec notif push admin:", err));

      setSuccess(true);
      setSubject('');
      setMessage('');
      toast.success("Message envoyé au support");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur d'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    // On le décale un peu vers le haut (bottom-20) pour ne pas qu'il chevauche ta barre de navigation mobile <BottomNav />
    <div className="fixed bottom-20 right-6 z-50 font-sans">
      {/* Bouton Rond Flottant */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Fenêtre de Chat de Support */}
      {isOpen && (
        <div className="w-80 md:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          {/* Entête */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base font-serif">Support en ligne</h3>
              <p className="text-xs opacity-80">Une question ? Écrivez-nous.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-black/10 rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Formulaire / Corps */}
          <div className="p-4 bg-background">
            {success ? (
              <div className="text-center py-8 text-emerald-500 font-medium text-sm">
                 Votre message a bien été transmis ! <br/>
                L'équipe vous répondra sous peu.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Sujet</label>
                  <Input
                    placeholder="Ex: Problème d'abonnement"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-background"
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
                    className="bg-background resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full flex gap-2" disabled={loading}>
                  {loading ? 'Envoi...' : (
                    <>
                      Envoyer la demande <Send className="h-4 w-4" />
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
