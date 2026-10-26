import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { adminListUsers, adminBlockUser, type AdminUser } from "@/lib/supabase-db";
import { useAuth } from "@/lib/auth-context";

export function UsersTab() {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [blockPending, setBlockPending] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { const u = await adminListUsers(); setUsers(u); } 
    catch (err) { toast.error("Erreur au chargement"); }
  };

  const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
    if (!appUser) return;
    setBlockPending(id);
    try {
      await adminBlockUser(appUser.id, id, !currentBlocked);
      toast.success(currentBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué");
      await loadUsers();
    } catch (e: any) { toast.error(e?.message || "Erreur"); } 
    finally { setBlockPending(null); }
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>{t('account.email')}</TableHead><TableHead>{t('account.plan')}</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={u.blocked ? "opacity-50" : ""}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded text-xs ${u.plan === 'vip' ? 'bg-primary text-white' : 'bg-muted'}`}>{u.plan.toUpperCase()}</span></TableCell>
                <TableCell>{format(new Date(u.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell>{u.blocked ? <span className="text-destructive font-medium">Bloqué</span> : "Actif"}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleToggleBlock(u.id, u.blocked)} disabled={blockPending === u.id} className={u.blocked ? "text-green-500" : "text-destructive"}>{u.blocked ? "Débloquer" : "Bloquer"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}