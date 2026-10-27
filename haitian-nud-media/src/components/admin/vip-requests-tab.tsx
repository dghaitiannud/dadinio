import { useState, useEffect } from "react";
import { Crown, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { adminListVipRequests, adminProcessVipRequest, type VipRequest } from "@/lib/supabase-db";import { useTranslation } from "react-i18next";

export function VipRequestsTab({ token }: {token: string;}) {const { t } = useTranslation();
  const [requests, setRequests] = useState<VipRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Record<string, string>>({});

  useEffect(() => {loadRequests();}, []);

  const loadRequests = async () => {
    try {const data = await adminListVipRequests();setRequests(data);}
    catch (err) {toast.error("Impossible de charger les reçus VIP");}
  };

  const handleAction = async (r: VipRequest, action: "approved" | "rejected") => {
    setProcessingId(r.id);
    const duration = parseInt(selectedDuration[r.id] || String(r.durationDays || 30), 10);
    try {
      await adminProcessVipRequest(r.id, r.userId, action, duration);
      toast.success(action === "approved" ? `VIP activé (${duration} jours) !` : "Demande rejetée");
      try {
        await fetch("https://api.haitiannud.com/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            title: action === "approved" ? "👑 Votre accès VIP est Actif !" : "❌ Reçu VIP non validé",
            body: action === "approved" ? `Félicitations ! Votre abonnement VIP (${duration} jours) a été validé.` : "Le reçu envoyé a été refusé.",
            url: "/vip", icon: "/logo.jpg", targetUserId: r.userId
          })
        });
      } catch (pushErr) {console.warn("Échec push:", pushErr);}
      await loadRequests();
    } catch (err: any) {toast.error(err?.message || "Erreur");} finally
    {setProcessingId(null);}
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle className="flex items-center gap-2 text-yellow-500"><Crown className="h-5 w-5 fill-yellow-500" /> {t("Validation VIP")}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead><TableHead>Offre</TableHead><TableHead>{t("Méthode")}</TableHead>
              <TableHead>Preuve</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead>
              <TableHead>{t("Durée")}</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) =>
            <TableRow key={r.id} className={r.status !== 'pending' ? "opacity-60" : ""}>
                <TableCell className="font-semibold">{r.userEmail}</TableCell>
                <TableCell className="font-bold text-yellow-500">{r.planName} ({r.amountUsd}$)</TableCell>
                <TableCell><span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-muted">{r.paymentMethod}</span></TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild><img src={r.proofUrl} alt={t("Reçu")} className="w-12 h-12 object-cover rounded border cursor-pointer" /></DialogTrigger>
                    <DialogContent className="max-w-xl"><img src={r.proofUrl} alt={t("Reçu")} className="w-full rounded" /></DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "dd MMM yyyy", { locale: fr })}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-[11px] uppercase ${r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500'}`}>{r.status}</span></TableCell>
                <TableCell>
                  {r.status === 'pending' ?
                <Select value={selectedDuration[r.id] || String(r.durationDays || 30)} onValueChange={(val) => setSelectedDuration({ ...selectedDuration, [r.id]: val })}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{[7, 10, 15, 30, 40, 105, 365].map((d) => <SelectItem key={d} value={String(d)}>{d} Jours</SelectItem>)}</SelectContent>
                    </Select> :
                "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === 'pending' ?
                <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-8 border-emerald-500 text-emerald-500" disabled={processingId === r.id} onClick={() => handleAction(r, 'approved')}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" className="h-8 border-destructive text-destructive" disabled={processingId === r.id} onClick={() => handleAction(r, 'rejected')}><X className="h-3 w-3" /></Button>
                    </div> :
                <span className="text-xs text-muted-foreground">{t("Traité")}</span>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>);

}