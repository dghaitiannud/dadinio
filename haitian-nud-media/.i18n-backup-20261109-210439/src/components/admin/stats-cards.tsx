import { useEffect, useState } from "react";
import { Users, Video as VideoIcon, ImageIcon, DollarSign, Download, Ticket, Shield, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats, type AdminStats } from "@/lib/supabase-db";
import { useTranslation } from "react-i18next";

export function AdminStatsCards() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then((s) => setStats(s)).catch((err) => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} />
      <StatCard title={t("Membres VIP")} value={stats?.activeVip || 0} icon={DollarSign} color="text-yellow-500" />
      <StatCard title={t("Vidéos")} value={stats?.totalVideos || 0} icon={VideoIcon} />
      <StatCard title="Photos" value={stats?.totalPhotos || 0} icon={ImageIcon} color="text-emerald-500" />
      <StatCard title="Vues" value={stats?.totalViews || 0} icon={Shield} />
      <StatCard title={t('common.downloads')} value={stats?.totalDownloads || 0} icon={Download} />
      <StatCard title="Tickets" value={stats?.openTickets || 0} icon={Ticket} color="text-destructive" />
    </div>);

}

function StatCard({ title, value, icon: Icon, color = "text-primary" }: {title: string;value: number | string;icon: LucideIcon;color?: string;}) {const { t } = useTranslation();
  return (
    <Card className="bg-card">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Icon className={t("h-6 w-6 mb-2 {{color}}", { color: color })} />
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>);

}