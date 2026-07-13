import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export function Legal() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl min-h-[70vh]">
      <Link href="/" className="inline-flex items-center text-primary hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />{t('watch.back_home')}</Link>

      <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{t('legal.terms')}</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Site réservé à un public adulte (18 ans et plus).
      </p>

      <div className="space-y-8 text-muted-foreground">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.warning_title')}</h2>
          <p>
            Haïtien Nud Média est un site web pour adultes. Il peut contenir des images, vidéos et
            textes à caractère mature, sensuel ou explicite, destinés exclusivement à un public
            majeur. L'accès est <strong>{t('legal.forbidden_minors')}</strong>.
          </p>
          <p>
            En entrant sur le site, vous déclarez sur l'honneur :
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('legal.condition_1')}</li>
            <li>{t('legal.condition_2')}</li>
            <li>{t('legal.condition_3')}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.age_confirmation')}</h2>
          <p>
            À chaque première visite, une fenêtre demande de confirmer votre majorité. En cliquant
            sur "J'ai 18 ans ou plus", vous acceptez ces conditions et reconnaissez être seul
            responsable de votre accès au site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.content_property')}</h2>
          <p>
            Tous les contenus diffusés (vidéos, photos, textes, logos) sont protégés par le droit
            d'auteur et appartiennent à leurs ayants droit respectifs. Toute reproduction,
            redistribution ou diffusion publique en dehors des fonctionnalités prévues par le site
            est interdite.
          </p>
          <p>
            Tous les contenus mettant en scène des personnes sont publiés avec le consentement
            écrit des intéressé·e·s, qui sont toutes majeures.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.vip_payments')}</h2>
          <p>
            Les abonnements VIP donnent accès à du contenu exclusif, à la lecture sans publicité et
            aux téléchargements illimités. Les paiements sont effectués via un prestataire sécurisé
            et sont non remboursables sauf cas prévus par la loi. Vous pouvez résilier à tout
            moment depuis la page "Mon Compte".
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.privacy_cookies')}</h2>
          <p>
            Vos données de connexion (email, identifiant) sont utilisées uniquement pour la gestion
            de votre compte et de votre abonnement. Aucun contenu visionné n'est partagé avec des
            tiers. Le site utilise des cookies techniques nécessaires au fonctionnement et à la
            session.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.comments_behavior')}</h2>
          <p>
            Les commentaires (anonymes ou non) doivent rester respectueux. Tout propos illégal,
            haineux, discriminatoire ou menaçant sera supprimé et peut entraîner la suspension du
            compte. Les comportements visant à mettre en cause la sécurité de mineurs sont
            signalés aux autorités compétentes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.report_contact')}</h2>
          <p>
            Toute personne identifiant un contenu litigieux (mineur, contenu non consenti,
            atteinte aux droits) peut le signaler via la page "Support" depuis "Mon Compte". Les
            signalements sont traités sous 72 h et donnent lieu, le cas échéant, au retrait
            immédiat du contenu.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('legal.if_minor')}</h2>
          <p>
            Quittez immédiatement ce site. Sur l'écran d'accueil, cliquez sur "Je suis mineur(e)".
            Parlez‑en à un adulte de confiance et activez le contrôle parental sur votre appareil.
          </p>
        </section>
      </div>
    </div>
  );
}
