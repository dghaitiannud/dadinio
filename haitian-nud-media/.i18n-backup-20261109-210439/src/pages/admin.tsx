import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Shield, Video as VideoIcon, ImageIcon, Crown, Users, Ticket, Bell, LayoutTemplate, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import des sous-composants
import { AdminStatsCards } from "@/components/admin/stats-cards";
import { VideosTab } from "@/components/admin/videos-tab";
import { AdsTab } from "@/components/admin/ads-tab";
import { PhotosTab } from "@/components/admin/photos-tab";
import { VipRequestsTab } from "@/components/admin/vip-requests-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { TicketsTab } from "@/components/admin/tickets-tab";
import { AlertsTab } from "@/components/admin/alerts-tab";
import { BannerTab } from "@/components/admin/banner-tab";

export function Admin() {
  const { t } = useTranslation();
  const { isAdmin, isLoading, session } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-3xl font-bold">{t("Accès Refusé")}</h1>
        <p className="text-muted-foreground mt-2">{t("Vous n'avez pas les droits d'administration.")}</p>
        <Button className="mt-6" onClick={() => setLocation("/")}>{t('watch.back_home')}</Button>
      </div>);

  }

  const token = session?.access_token || "";

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        {t("Panneau d'Administration")}
      </h1>
      
      <AdminStatsCards />

      <Tabs defaultValue="videos" className="w-full mt-8">
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger value="videos" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Vidéos")}</TabsTrigger>
            <TabsTrigger value="photos" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Photos</TabsTrigger>
            <TabsTrigger value="ads" className="px-3 py-1.5 text-xs sm:text-sm font-medium">
              <Megaphone className="h-3.5 w-3.5 mr-1" /> Pubs
            </TabsTrigger>
            <TabsTrigger value="vip" className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-yellow-500 gap-1.5">
              <Crown className="h-3.5 w-3.5 fill-yellow-500 shrink-0" /> {t("Demandes VIP")}
            </TabsTrigger>
            <TabsTrigger value="users" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Utilisateurs</TabsTrigger>
            <TabsTrigger value="tickets" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Messages</TabsTrigger>
            <TabsTrigger value="alerts" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Alertes</TabsTrigger>
            <TabsTrigger value="banner" className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary">{t("Bannière")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="videos"><VideosTab token={token} /></TabsContent>
        <TabsContent value="photos"><PhotosTab /></TabsContent>
        <TabsContent value="ads"><AdsTab token={token} /></TabsContent>
        <TabsContent value="vip"><VipRequestsTab token={token} /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="tickets"><TicketsTab token={token} /></TabsContent>
        <TabsContent value="alerts"><AlertsTab token={token} /></TabsContent>
        <TabsContent value="banner"><BannerTab /></TabsContent>
      </Tabs>
    </div>);

}