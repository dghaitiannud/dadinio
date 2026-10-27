import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { createTicket } from "@/lib/supabase-db";
import { ADMIN_EMAIL } from "@/lib/supabase";

// ⚠️ SÉCURITÉ : On utilise notre API Node, qui fera le relais vers N8N de manière sécurisée
const API_CHAT_URL = "https://api.haitiannud.com/api/support/chat";

interface ChatMsg {
  role: 'user' | 'bot';
  content: string;
}

const t = (key: string, options?: any) => (window as any).t ? (window as any).t(key, options) : key;

export function FloatingSupport({ currentUser }: {currentUser: any;}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'ticket'>('chat');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [subject, setSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([
  { role: 'bot', content: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' }]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionIdRef.current = crypto.randomUUID();
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!currentUser || currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') {
    return null;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: text,
          sessionId: sessionIdRef.current
        })
      });

      if (!res.ok) throw new Error('Erreur réseau');

      const data = await res.json();
      const reply = data.output ?? data.text ?? "Désolé, je n'ai pas pu traiter votre demande.";

      setMessages((prev) => [...prev, { role: 'bot', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
      ...prev,
      { role: 'bot', content: 'Erreur de connexion. Réessayez dans un instant ou contactez un humain.' }]
      );
    } finally {
      setIsTyping(false);
    }
  }

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !ticketMessage.trim() || !currentUser?.id) return;

    setTicketLoading(true);
    try {
      await createTicket(currentUser.id, subject.trim(), ticketMessage.trim());
      setTicketSuccess(true);
      setSubject('');
      setTicketMessage('');
      toast.success("Message envoyé au support");
      setTimeout(() => setTicketSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur d'envoi");
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 font-sans">
      {!isOpen &&
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center justify-center">
        
          <MessageSquare className="h-6 w-6" />
        </Button>
      }

      {isOpen &&
      <div className="w-80 md:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200" style={{ height: 480 }}>
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base font-serif">
                {view === 'chat' ? t("Assistant virtuel") : t("Support en ligne")}
              </h3>
              <p className="text-xs opacity-80">
                {view === 'chat' ? t("Posez votre question") : t("Une question ? Écrivez-nous.")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-black/10 rounded-full h-8 w-8"
              title={view === 'chat' ? t("Contacter un humain") : t("Retour au chat")}
              onClick={() => setView(view === 'chat' ? 'ticket' : 'chat')}>
              
                <Headset className="h-4 w-4" />
              </Button>
              <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-black/10 rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}>
              
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {view === 'chat' &&
        <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 bg-background">
                {messages.map((m, i) =>
            <div key={i} className={`my-1.5 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span
                className={`inline-block px-3 py-2 rounded-2xl text-sm max-w-[80%] ${
                m.role === 'user' ?
                'bg-primary text-primary-foreground' :
                'bg-muted text-foreground'}`
                }>
                
                      {m.content}
                    </span>
                  </div>
            )}
                {isTyping &&
            <p className="text-xs text-muted-foreground my-1.5">{t("En train d'écrire...")}</p>
            }
              </div>
              <div className="flex items-center gap-2 p-3 border-t border-border bg-card">
                <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t("Écrivez un message...")}
              className="bg-background" />
            
                <Button size="icon" onClick={handleSend} disabled={isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
        }

          {view === 'ticket' &&
        <div className="p-4 bg-background flex-1 overflow-y-auto">
              {ticketSuccess ?
          <div className="text-center py-8 text-emerald-500 font-medium text-sm">
                  {t("Votre message a bien été transmis !")} <br />
                  {t("L'équipe vous répondra sous peu.")}
                </div> :

          <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('common.subject')}</label>
                    <Input
                placeholder={t("Ex: Problème d'abonnement")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-background"
                required />
              
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('common.message')}</label>
                    <Textarea
                placeholder={t("Décrivez votre problème en détail...")}
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="bg-background resize-none"
                required />
              
                  </div>
                  <Button type="submit" className="w-full flex gap-2" disabled={ticketLoading}>
                    {ticketLoading ? 'Envoi...' :
              <>
                        {t("Envoyer la demande")} <Send className="h-4 w-4" />
                      </>
              }
                  </Button>
                </form>
          }
            </div>
        }
        </div>
      }
    </div>);

}