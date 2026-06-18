import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PwaInstallButton } from "@/components/pwa-install";

function TikTokIcon() {
  return <span className="text-sm font-black">T</span>;
}

function FacebookIcon() {
  return <span className="text-sm font-black">f</span>;
}

function InstagramIcon() {
  return <span className="text-sm font-black">IG</span>;
}

function WhatsAppIcon() {
  return <span className="text-sm font-black">WA</span>;
}

export function Footer() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground py-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src={`${basePath}/logo.jpg`} alt="HAITIAN NUD" className="h-10 w-10 rounded object-cover" />
            <span className="font-serif font-bold text-2xl tracking-tight">HAITIAN NUD</span>
          </Link>

          <div className="flex flex-col gap-2 mb-6">
            <a href="https://www.tiktok.com/@haitiannud_ceo" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-primary/60 hover:bg-primary/5">
                <TikTokIcon /> @haitiannud_ceo
              </Button>
            </a>
            <a href="https://www.instagram.com/dg_haitian_nud?igsh=azNndHRpaTAxdW54" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-pink-500/60 hover:bg-pink-500/5 hover:text-pink-400">
                <InstagramIcon /> @dg_haitian_nud
              </Button>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61589379306203" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-blue-500/60 hover:bg-blue-500/5 hover:text-blue-400">
                <FacebookIcon /> HAITIAN NUD
              </Button>
            </a>
            <a href="https://whatsapp.com/channel/0029VbC9iNq8KMqeDjBmOW0Y" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-green-500/60 hover:bg-green-500/5 hover:text-green-400">
                <WhatsAppIcon /> Chaîne WhatsApp
              </Button>
            </a>
          </div>

          <PwaInstallButton />
        </div>

        <div>
          <h4 className="font-semibold mb-4">Navigation</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Accueil</Link></li>
            <li><Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">Recherche</Link></li>
            <li><Link href="/plans" className="text-muted-foreground hover:text-primary transition-colors">Devenir VIP</Link></li>
            <li><Link href="/account" className="text-muted-foreground hover:text-primary transition-colors">Mon Compte</Link></li>
          </ul>

          <h4 className="font-semibold mt-6 mb-4">Communauté Telegram</h4>
          <ul className="space-y-2">
            <li><a href="https://t.me/dg_haitiannud" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Rejoindre le groupe</a></li>
            <li><a href="https://t.me/hatiannud_canal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Voye yon zen</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Légal</h4>
          <ul className="space-y-2">
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Mentions légales</Link></li>
            <li><span className="text-muted-foreground text-sm mt-4 block">Réservé aux adultes (18+)</span></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© 2026 HAITIAN NUD. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
