import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CreditCard, ShieldCheck } from "lucide-react";

const PLANS = [
  { id: "decouverte", name: "Découverte", amount: 750, days: 7 },
  { id: "starter", name: "Starter", amount: 1000, days: 10 },
  { id: "standard", name: "Standard", amount: 1375, days: 15 },
  { id: "avantage", name: "Avantage", amount: 2500, days: 30 },
  { id: "prolonje", name: "Prolongé", amount: 3000, days: 40 },
  { id: "confort", name: "Confort", amount: 7500, days: 105 },
  { id: "vip_privilege", name: "VIP Privilège", amount: 25000, days: 365 },
];

export function TranzakCheckout() {
  const { session, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [planId, setPlanId] = useState(new URLSearchParams(window.location.search).get("planId") || "avantage");
  const [method, setMethod] = useState<"moncash" | "natcash">("moncash");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const plan = useMemo(() => PLANS.find(p => p.id === planId) || PLANS[3], [planId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn || !session?.access_token) {
      toast.error("Connectez-vous pour effectuer un paiement.");
      setLocation("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://api.haitiannud.com/api/payments/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ planId, paymentMethod: method, customerName: name.trim(), customerEmail: email.trim(), customerPhone: phone.trim() })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || result?.success !== true || !result?.data?.paymentUrl) throw new Error(result?.message || "Initialisation du paiement impossible.");
      window.location.assign(result.data.paymentUrl);
    } catch (err: any) {
      toast.error(err?.message || "Erreur. Réessayez.");
      setLoading(false);
    }
  }

  return <div className="container mx-auto max-w-2xl min-h-screen px-4 py-8 md:py-14">
    <Button variant="ghost" onClick={() => setLocation("/plans")} className="mb-5 gap-2"><ArrowLeft className="h-4 w-4" /> Retour aux formules</Button>
    <Card><CardContent className="p-5 md:p-8 space-y-6">
      <div className="text-center space-y-2"><CreditCard className="mx-auto h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">Paiement sécurisé</h1><p className="text-sm text-muted-foreground">MonCash ou NatCash via Tranzak</p></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label>Formule VIP</Label><select value={planId} onChange={e => setPlanId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">{PLANS.map(p => <option key={p.id} value={p.id}>{p.name} · {p.amount.toLocaleString()} HTG · {p.days} jours</option>)}</select></div>
        <div className="rounded-xl border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Montant</p><p className="text-2xl font-bold">{plan.amount.toLocaleString()} HTG</p><p className="text-xs text-muted-foreground">{plan.days} jours VIP</p></div>
        <div className="space-y-2"><Label>Méthode</Label><div className="grid grid-cols-2 gap-3">{(["moncash","natcash"] as const).map(m => <button type="button" key={m} onClick={() => setMethod(m)} className={`rounded-lg border p-3 font-semibold ${method===m?"border-primary bg-primary/10":"border-border"}`}>{m==="moncash"?"MonCash":"NatCash"}</button>)}</div></div>
        <div className="space-y-2"><Label>Nom complet</Label><input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <div className="space-y-2"><Label>Email</Label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <div className="space-y-2"><Label>Téléphone</Label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+509XXXXXXXX" required className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <Button type="submit" disabled={loading} className="w-full py-5">{loading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Initialisation...</>:"Continuer vers le paiement"}</Button>
      </form>
      <p className="flex justify-center gap-2 text-center text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4"/>Activation VIP après confirmation du paiement.</p>
    </CardContent></Card>
  </div>;
}
