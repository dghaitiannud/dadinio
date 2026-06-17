import { Button } from "@/components/ui/button";
import { Send, Star, MessageCircle, Lock } from "lucide-react";

const TELEGRAM_LINKS = [
  { label: "Groupe 1", url: "https://t.me/dg_haitiannud", desc: "Groupe principal" },
  { label: "Groupe 2", url: "https://t.me/+UXtFEcF2Dw8zNGYx", desc: "Groupe secondaire" },
  { label: "Canal 1", url: "https://t.me/hatiannud_canal", desc: "Canal officiel" },
  { label: "Canal 2", url: "https://t.me/haiti_annud", desc: "Canal communauté" },
];

export function Plans() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 min-h-screen">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold border border-primary/20">
          <Lock className="h-4 w-4" /> VIP — Bientôt disponible
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
          Accès VIP
          <span className="block text-primary mt-2">En construction</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Le système de paiement VIP est en cours de développement. En attendant, rejoignez nos groupes Telegram pour accéder au contenu exclusif.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="p-6 bg-card border border-border rounded-2xl mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Rejoindre la communauté VIP
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Pour accéder aux vidéos VIP et au contenu exclusif, rejoignez l'un de nos groupes ou canaux Telegram. Les admins vous ajouteront et partageront le contenu directement.
          </p>

          <div className="space-y-3">
            {TELEGRAM_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/60 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                </div>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/90 shrink-0 gap-1.5">
                  <Send className="h-3.5 w-3.5" /> klike la pouw voye zen
                </Button>
              </a>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Comment ça fonctionne ?
          </h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Choisissez un groupe ou canal Telegram ci-dessus et rejoignez-le.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Les admins publient régulièrement des vidéos, photos et contenu exclusif VIP.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Commentez, réagissez et participez à la communauté haïtienne.</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Le système de paiement sera bientôt disponible. Merci de votre patience.</p>
      </div>
    </div>
  );
}
