#!/usr/bin/env bash
# Correctif i18n — HAITIAN NUD (fr / en / ht / es)
# Usage : depuis le dossier du projet (celui qui contient src/ et package.json) :  bash fix-i18n.sh
set -euo pipefail
[ -f src/i18n.ts ] && [ -d src/locales ] || { echo "Lance ce script depuis le dossier haitian-nud-media (src/i18n.ts introuvable)"; exit 1; }
command -v node >/dev/null || { echo "node est requis"; exit 1; }
command -v patch >/dev/null || { echo "patch est requis"; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
BK=".i18n-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BK" && cp -r src "$BK/src" && echo "Sauvegarde : $BK/"

cat > "$TMP/code.patch" <<'PATCH_EOF'
diff -ruN -x locales a/components/LanguageSwitcher.tsx b/components/LanguageSwitcher.tsx
--- a/components/LanguageSwitcher.tsx	2026-11-09 05:51:45.701546918 -0500
+++ b/components/LanguageSwitcher.tsx	2026-11-09 05:51:45.704183613 -0500
@@ -11,7 +11,7 @@
   return (
     <Select onValueChange={changeLanguage} defaultValue={i18n.language || "fr"}>
       <SelectTrigger className="w-[180px]">
-        <SelectValue placeholder="Langue" />
+        <SelectValue placeholder={t("Langue")} />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="fr">{t("Français")}</SelectItem>
diff -ruN -x locales a/components/ad-overlay.tsx b/components/ad-overlay.tsx
--- a/components/ad-overlay.tsx	2026-11-09 05:51:45.701557570 -0500
+++ b/components/ad-overlay.tsx	2026-11-09 05:51:45.704195305 -0500
@@ -76,7 +76,7 @@
           </Button> :
 
         <div className="px-3 py-1.5 bg-black/80 text-white text-xs font-mono rounded border border-white/20">
-            {t("Passer dans")} {timeLeft}s
+            {t("Passer dans {{seconds}}s", { seconds: timeLeft })}
           </div>
         }
       </div>
diff -ruN -x locales a/components/admin/ads-tab.tsx b/components/admin/ads-tab.tsx
--- a/components/admin/ads-tab.tsx	2026-11-09 05:51:45.701586388 -0500
+++ b/components/admin/ads-tab.tsx	2026-11-09 05:51:45.704226206 -0500
@@ -25,14 +25,14 @@
 
   const handleUpload = async () => {
     if (!file || !form.title) {
-    toast.error("Titre et fichier requis");
+    toast.error(t("Titre et fichier requis"));
     return;
   }
 
     const jobId = crypto.randomUUID();
     setStatus("uploading");
     setProgress(0);
-    setMessage("Connexion...");
+    setMessage(t("Connexion..."));
 
     const es = new EventSource(`https://api.haitiannud.com/api/upload-progress/${jobId}?token=${token}`);
 
@@ -58,7 +58,7 @@
         language: form.language
       });
 
-      toast.success("Pub ajoutée avec succès !");
+      toast.success(t("Pub ajoutée avec succès !"));
       setStatus("idle");
       setFile(null);
       setForm({ title: "", type: "pre-roll", trigger: 0, skip: 5, resolution: "720p", clickUrl: "", language: "fr" });
@@ -87,13 +87,13 @@
       if (ev.lengthComputable) {
         const pct = Math.round(ev.loaded / ev.total * 100);
         setProgress(Math.round(pct * 0.1));
-        setMessage(`Envoi... (${pct}%)`);
+        setMessage(t("Envoi... ({{pct}}%)", { pct }));
       }
     };
 
     xhr.onload = () => {
       if (xhr.status !== 200) {
-        toast.error("Erreur lors de l'envoi");
+        toast.error(t("Erreur lors de l'envoi"));
         setStatus("idle");
       }
     };
@@ -150,9 +150,9 @@
           <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
               <div>
                 <p className="font-bold text-sm">{ad.title} <span className="text-xs text-muted-foreground">({ad.language})</span></p>
-                <p className="text-xs text-muted-foreground">{ad.ad_type} - {ad.resolution} {t("- Skip:")} {ad.skip_after}s</p>
+                <p className="text-xs text-muted-foreground">{ad.ad_type} - {ad.resolution} - {t("Skip après {{seconds}}s", { seconds: ad.skip_after })}</p>
               </div>
-              <Button variant="destructive" size="sm" onClick={async () => {await supabase.from('video_ads').delete().eq('id', ad.id);loadAds();}}>Suppr</Button>
+              <Button variant="destructive" size="sm" onClick={async () => {await supabase.from('video_ads').delete().eq('id', ad.id);loadAds();}}>{t("Suppr")}</Button>
             </div>
           )}
         </div>
diff -ruN -x locales a/components/admin/alerts-tab.tsx b/components/admin/alerts-tab.tsx
--- a/components/admin/alerts-tab.tsx	2026-11-09 05:51:45.701601325 -0500
+++ b/components/admin/alerts-tab.tsx	2026-11-09 05:51:45.704235248 -0500
@@ -18,7 +18,7 @@
 
   const handleSend = async () => {
     if (!title || !body) {
-    toast.error("Titre et message requis");
+    toast.error(t("Titre et message requis"));
     return;
   }
     setSending(true);
@@ -30,10 +30,10 @@
         body: JSON.stringify({ title, body, url, icon: "/logo.jpg" })
       });
       const res = await response.json();
-      if (!response.ok) throw new Error(res.error || "Erreur serveur");
+      if (!response.ok) throw new Error(res.error || t("Erreur serveur"));
       setResult(res);
-      toast.success(`${res.sent}/${res.total} envoyées !`);
-    } catch (e: any) {toast.error(e?.message || "Erreur");} finally
+      toast.success(t("{{sent}}/{{total}} envoyées !", { sent: res.sent, total: res.total }));
+    } catch (e: any) {toast.error(e?.message || t("Erreur"));} finally
     {setSending(false);}
   };
 
@@ -44,15 +44,15 @@
         <CardContent className="space-y-4">
           <div className="space-y-2"><Label>{t('common.title')}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
           <div className="space-y-2"><Label>{t('common.message')}</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></div>
-          <div className="space-y-2"><Label>Lien</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" /></div>
+          <div className="space-y-2"><Label>{t("Lien")}</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" /></div>
           <Button onClick={handleSend} disabled={sending} className="w-full">{sending ? t("Envoi...") : t("Envoyer à tous")}</Button>
-          {result && <div className="p-3 rounded-lg bg-primary/10 text-sm text-center">✅ {result.sent} {t("envoyées ·")} {result.failed} {t("expirées ·")} {result.total} total</div>}
+          {result && <div className="p-3 rounded-lg bg-primary/10 text-sm text-center">✅ {t("{{sent}} envoyées · {{failed}} expirées · {{total}} au total", { sent: result.sent, failed: result.failed, total: result.total })}</div>}
         </CardContent>
       </Card>
       <Card className="bg-card">
-        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Infos</CardTitle></CardHeader>
+        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> {t("Infos")}</CardTitle></CardHeader>
         <CardContent className="text-sm text-muted-foreground space-y-3">
-          <p>Table <code>push_subscriptions</code> {t("requise.")}</p>
+          <p>{t("Table requise :")} <code>push_subscriptions</code></p>
         </CardContent>
       </Card>
     </div>);
diff -ruN -x locales a/components/admin/banner-tab.tsx b/components/admin/banner-tab.tsx
--- a/components/admin/banner-tab.tsx	2026-11-09 05:51:45.701608645 -0500
+++ b/components/admin/banner-tab.tsx	2026-11-09 05:51:45.704242537 -0500
@@ -15,16 +15,16 @@
 
   const handleSave = async () => {
     setPending(true);
-    try {await updateBannerVideo(url);toast.success("Mise à jour !");}
-    catch (e) {toast.error("Erreur");} finally
+    try {await updateBannerVideo(url);toast.success(t("Mise à jour !"));}
+    catch (e) {toast.error(t("Erreur"));} finally
     {setPending(false);}
   };
 
   const handleClear = async () => {
-    if (!confirm("Retirer la vidéo de fond ?")) return;
+    if (!confirm(t("Retirer la vidéo de fond ?"))) return;
     setPending(true);
-    try {await updateBannerVideo("");setUrl("");toast.success("Réinitialisé");}
-    catch (e) {toast.error("Erreur");} finally
+    try {await updateBannerVideo("");setUrl("");toast.success(t("Réinitialisé"));}
+    catch (e) {toast.error(t("Erreur"));} finally
     {setPending(false);}
   };
 
@@ -33,9 +33,9 @@
       <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-primary" /> {t("Vidéo de Fond (Accueil)")}</CardTitle></CardHeader>
       <CardContent className="space-y-6">
         <div className="flex gap-2">
-          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("URL .mp4")} className="flex-1" />
-          <Button onClick={handleSave} disabled={pending}>{pending ? "..." : "Enregistrer"}</Button>
-          {url && <Button variant="destructive" onClick={handleClear} disabled={pending}>Suppr</Button>}
+          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL .mp4" className="flex-1" />
+          <Button onClick={handleSave} disabled={pending}>{pending ? "..." : t("Enregistrer")}</Button>
+          {url && <Button variant="destructive" onClick={handleClear} disabled={pending}>{t("Suppr")}</Button>}
         </div>
         {url &&
         <div className="relative w-full aspect-video max-w-xl bg-black rounded-xl overflow-hidden border">
diff -ruN -x locales a/components/admin/photos-tab.tsx b/components/admin/photos-tab.tsx
--- a/components/admin/photos-tab.tsx	2026-11-09 05:51:45.701616371 -0500
+++ b/components/admin/photos-tab.tsx	2026-11-09 05:51:45.704250697 -0500
@@ -30,7 +30,7 @@
 
   const loadPhotos = async () => {
     try {const p = await adminListPhotos();setPhotos(p);}
-    catch (err) {toast.error("Erreur de chargement");}
+    catch (err) {toast.error(t("Erreur de chargement"));}
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
@@ -38,22 +38,22 @@
     setCreatePending(true);
     try {
       await adminCreatePhoto({ ...formData, category: buildCategory() });
-      toast.success("Photo ajoutée !");
+      toast.success(t("Photo ajoutée !"));
       setOpen(false);
       setFormData({ title: "", description: "", imageUrl: "", isVip: false, published: true });
       await loadPhotos();
-    } catch (err: any) {toast.error(err?.message || "Erreur");} finally
+    } catch (err: any) {toast.error(err?.message || t("Erreur"));} finally
     {setCreatePending(false);}
   };
 
   const handleDelete = async (id: string) => {
-    if (!confirm("Retirer cette photo ?")) return;
+    if (!confirm(t("Retirer cette photo ?"))) return;
     setDeletePending(id);
     try {
       await adminDeletePhoto(id);
       setPhotos((prev) => prev.filter((p) => p.id !== id));
-      toast.success("Photo archivée");
-    } catch (err: any) {toast.error(err?.message || "Erreur");} finally
+      toast.success(t("Photo archivée"));
+    } catch (err: any) {toast.error(err?.message || t("Erreur"));} finally
     {setDeletePending(null);}
   };
 
@@ -66,25 +66,25 @@
           <DialogContent className="max-w-2xl">
             <DialogHeader><DialogTitle>{t("Nouvelle Photo")}</DialogTitle></DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
-              <div className="space-y-2"><Label>Titre</Label><Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
+              <div className="space-y-2"><Label>{t("Titre")}</Label><Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>{t('common.category')}</Label><Input required value={contentType} onChange={(e) => setContentType(e.target.value)} /></div>
                 <div className="space-y-2"><Label>{t("Année")}</Label><Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
               </div>
-              <div className="space-y-2"><Label>Description</Label><Textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
+              <div className="space-y-2"><Label>{t("Description")}</Label><Textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
               <div className="space-y-2"><Label>{t("URL de la Photo")}</Label><Input required value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
               <div className="flex gap-6 mt-2">
                 <div className="flex items-center gap-2"><Switch checked={formData.isVip} onCheckedChange={(c) => setFormData({ ...formData, isVip: c })} /><Label>VIP</Label></div>
-                <div className="flex items-center gap-2"><Switch checked={formData.published} onCheckedChange={(c) => setFormData({ ...formData, published: c })} /><Label>Publier</Label></div>
+                <div className="flex items-center gap-2"><Switch checked={formData.published} onCheckedChange={(c) => setFormData({ ...formData, published: c })} /><Label>{t("Publier")}</Label></div>
               </div>
-              <Button type="submit" disabled={createPending} className="w-full mt-4">{createPending ? t("Envoi...") : "Ajouter"}</Button>
+              <Button type="submit" disabled={createPending} className="w-full mt-4">{createPending ? t("Envoi...") : t("Ajouter")}</Button>
             </form>
           </DialogContent>
         </Dialog>
       </CardHeader>
       <CardContent>
         <Table>
-          <TableHeader><TableRow><TableHead>{t("Aperçu")}</TableHead><TableHead>{t('common.title')}</TableHead><TableHead>{t('common.category')}</TableHead><TableHead>Vues</TableHead><TableHead>{t('common.vip')}</TableHead><TableHead></TableHead></TableRow></TableHeader>
+          <TableHeader><TableRow><TableHead>{t("Aperçu")}</TableHead><TableHead>{t('common.title')}</TableHead><TableHead>{t('common.category')}</TableHead><TableHead>{t("Vues")}</TableHead><TableHead>{t('common.vip')}</TableHead><TableHead></TableHead></TableRow></TableHeader>
           <TableBody>
             {photos.map((p) =>
             <TableRow key={p.id}>
@@ -92,7 +92,7 @@
                 <TableCell className="font-medium">{p.title}</TableCell>
                 <TableCell>{p.category}</TableCell>
                 <TableCell>{p.views || 0}</TableCell>
-                <TableCell>{p.isVip ? "Oui" : "Non"}</TableCell>
+                <TableCell>{p.isVip ? t("Oui") : t("Non")}</TableCell>
                 <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={deletePending === p.id} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
               </TableRow>
             )}
diff -ruN -x locales a/components/admin/stats-cards.tsx b/components/admin/stats-cards.tsx
--- a/components/admin/stats-cards.tsx	2026-11-09 05:51:45.701624934 -0500
+++ b/components/admin/stats-cards.tsx	2026-11-09 05:51:45.704260399 -0500
@@ -14,22 +14,22 @@
 
   return (
     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
-      <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} />
+      <StatCard title={t("Utilisateurs")} value={stats?.totalUsers || 0} icon={Users} />
       <StatCard title={t("Membres VIP")} value={stats?.activeVip || 0} icon={DollarSign} color="text-yellow-500" />
       <StatCard title={t("Vidéos")} value={stats?.totalVideos || 0} icon={VideoIcon} />
-      <StatCard title="Photos" value={stats?.totalPhotos || 0} icon={ImageIcon} color="text-emerald-500" />
-      <StatCard title="Vues" value={stats?.totalViews || 0} icon={Shield} />
+      <StatCard title={t("Photos")} value={stats?.totalPhotos || 0} icon={ImageIcon} color="text-emerald-500" />
+      <StatCard title={t("Vues")} value={stats?.totalViews || 0} icon={Shield} />
       <StatCard title={t('common.downloads')} value={stats?.totalDownloads || 0} icon={Download} />
       <StatCard title="Tickets" value={stats?.openTickets || 0} icon={Ticket} color="text-destructive" />
     </div>);
 
 }
 
-function StatCard({ title, value, icon: Icon, color = "text-primary" }: {title: string;value: number | string;icon: LucideIcon;color?: string;}) {const { t } = useTranslation();
+function StatCard({ title, value, icon: Icon, color = "text-primary" }: {title: string;value: number | string;icon: LucideIcon;color?: string;}) {
   return (
     <Card className="bg-card">
       <CardContent className="p-4 flex flex-col items-center text-center">
-        <Icon className={t("h-6 w-6 mb-2 {{color}}", { color: color })} />
+        <Icon className={`h-6 w-6 mb-2 ${color}`} />
         <div className="text-2xl font-bold font-mono">{value}</div>
         <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
       </CardContent>
diff -ruN -x locales a/components/admin/tickets-tab.tsx b/components/admin/tickets-tab.tsx
--- a/components/admin/tickets-tab.tsx	2026-11-09 05:51:45.701632399 -0500
+++ b/components/admin/tickets-tab.tsx	2026-11-09 05:51:45.704267481 -0500
@@ -15,8 +15,8 @@
   useEffect(() => {loadTickets();}, []);
 
   const loadTickets = async () => {
-    try {const t = await adminListTickets();setTickets(t);}
-    catch (err) {toast.error("Erreur");}
+    try {const list = await adminListTickets();setTickets(list);}
+    catch (err) {toast.error(t("Erreur"));}
   };
 
   const handleReply = async () => {
@@ -24,7 +24,7 @@
     setReplyPending(true);
     try {
       await adminReplyTicket(selectedTicket.id, replyText);
-      toast.success("Réponse envoyée");
+      toast.success(t("Réponse envoyée"));
       try {
         await fetch("https://api.haitiannud.com/api/push/send", {
           method: "POST",
@@ -39,7 +39,7 @@
       setSelectedTicket(null);
       setReplyText("");
       await loadTickets();
-    } catch (e: any) {toast.error(e?.message || "Erreur");} finally
+    } catch (e: any) {toast.error(e?.message || t("Erreur"));} finally
     {setReplyPending(false);}
   };
 
@@ -49,10 +49,10 @@
         <CardHeader><CardTitle>{t("Messages & tickets")}</CardTitle></CardHeader>
         <CardContent>
           <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
-            {tickets.map((t) =>
-            <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedTicket?.id === t.id ? 'border-primary' : 'border-border'}`}>
-                <div className="flex justify-between"><h4 className="font-semibold">{t.subject}</h4><span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>{t.status}</span></div>
-                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.message}</p>
+            {tickets.map((tk) =>
+            <div key={tk.id} onClick={() => setSelectedTicket(tk)} className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedTicket?.id === tk.id ? 'border-primary' : 'border-border'}`}>
+                <div className="flex justify-between"><h4 className="font-semibold">{tk.subject}</h4><span className={`text-xs px-2 py-1 rounded ${tk.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>{tk.status === 'open' ? t("Ouvert") : tk.status === 'answered' ? t("Répondu") : t("Fermé")}</span></div>
+                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{tk.message}</p>
               </div>
             )}
           </div>
@@ -63,9 +63,9 @@
         <CardContent>
           {selectedTicket ?
           <div className="space-y-4">
-              <div><Label className="text-muted-foreground">Original</Label><div className="p-3 bg-muted rounded mt-1 text-sm">{selectedTicket.message}</div></div>
+              <div><Label className="text-muted-foreground">{t("Original")}</Label><div className="p-3 bg-muted rounded mt-1 text-sm">{selectedTicket.message}</div></div>
               <div className="space-y-2"><Label>{t("Votre Réponse")}</Label><Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} /></div>
-              <Button onClick={handleReply} disabled={!replyText || replyPending} className="w-full">{replyPending ? t("Envoi...") : "Envoyer"}</Button>
+              <Button onClick={handleReply} disabled={!replyText || replyPending} className="w-full">{replyPending ? t("Envoi...") : t("Envoyer")}</Button>
             </div> :
           <div className="text-center py-12 text-muted-foreground">{t("Sélectionnez un ticket")}</div>}
         </CardContent>
diff -ruN -x locales a/components/admin/users-tab.tsx b/components/admin/users-tab.tsx
--- a/components/admin/users-tab.tsx	2026-11-09 05:51:45.701641587 -0500
+++ b/components/admin/users-tab.tsx	2026-11-09 05:51:45.704274372 -0500
@@ -18,7 +18,7 @@
 
   const loadUsers = async () => {
     try {const u = await adminListUsers();setUsers(u);}
-    catch (err) {toast.error("Erreur au chargement");}
+    catch (err) {toast.error(t("Erreur au chargement"));}
   };
 
   const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
@@ -26,26 +26,26 @@
     setBlockPending(id);
     try {
       await adminBlockUser(appUser.id, id, !currentBlocked);
-      toast.success(currentBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué");
+      toast.success(currentBlocked ? t("Utilisateur débloqué") : t("Utilisateur bloqué"));
       await loadUsers();
-    } catch (e: any) {toast.error(e?.message || "Erreur");} finally
+    } catch (e: any) {toast.error(e?.message || t("Erreur"));} finally
     {setBlockPending(null);}
   };
 
   return (
     <Card className="bg-card">
-      <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
+      <CardHeader><CardTitle>{t("Utilisateurs")}</CardTitle></CardHeader>
       <CardContent>
         <Table>
-          <TableHeader><TableRow><TableHead>{t('account.email')}</TableHead><TableHead>{t('account.plan')}</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
+          <TableHeader><TableRow><TableHead>{t('account.email')}</TableHead><TableHead>{t('account.plan')}</TableHead><TableHead>{t("Date")}</TableHead><TableHead>{t("Statut")}</TableHead><TableHead></TableHead></TableRow></TableHeader>
           <TableBody>
             {users.map((u) =>
             <TableRow key={u.id} className={u.blocked ? "opacity-50" : ""}>
                 <TableCell className="font-medium">{u.email}</TableCell>
                 <TableCell><span className={`px-2 py-1 rounded text-xs ${u.plan === 'vip' ? 'bg-primary text-white' : 'bg-muted'}`}>{u.plan.toUpperCase()}</span></TableCell>
                 <TableCell>{format(new Date(u.createdAt), "dd/MM/yyyy")}</TableCell>
-                <TableCell>{u.blocked ? <span className="text-destructive font-medium">{t("Bloqué")}</span> : "Actif"}</TableCell>
-                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleToggleBlock(u.id, u.blocked)} disabled={blockPending === u.id} className={u.blocked ? "text-green-500" : "text-destructive"}>{u.blocked ? t("Débloquer") : "Bloquer"}</Button></TableCell>
+                <TableCell>{u.blocked ? <span className="text-destructive font-medium">{t("Bloqué")}</span> : t("Actif")}</TableCell>
+                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleToggleBlock(u.id, u.blocked)} disabled={blockPending === u.id} className={u.blocked ? "text-green-500" : "text-destructive"}>{u.blocked ? t("Débloquer") : t("Bloquer")}</Button></TableCell>
               </TableRow>
             )}
           </TableBody>
diff -ruN -x locales a/components/admin/video-uploader.tsx b/components/admin/video-uploader.tsx
--- a/components/admin/video-uploader.tsx	2026-11-09 05:51:45.701651146 -0500
+++ b/components/admin/video-uploader.tsx	2026-11-09 05:51:45.704286134 -0500
@@ -20,7 +20,7 @@
     const jobId = crypto.randomUUID();
     setStatus("uploading");
     setProgress(0);
-    setMessage("Connexion au serveur...");
+    setMessage(t("Connexion au serveur..."));
 
     const es = new EventSource(`https://api.haitiannud.com/api/upload-progress/${jobId}?token=${token}`);
 
@@ -59,17 +59,17 @@
       if (e.lengthComputable) {
         const pct = Math.round(e.loaded / e.total * 100);
         setProgress(Math.round(pct * 0.1));
-        setMessage(`Envoi du fichier... (${pct}%)`);
+        setMessage(t("Envoi du fichier... ({{pct}}%)", { pct }));
       }
     };
 
     xhr.onload = () => {
       if (xhr.status === 200) {
         setStatus("processing");
-        setMessage("Fichier reçu, transcodage en cours...");
+        setMessage(t("Fichier reçu, transcodage en cours..."));
       } else {
         setStatus("error");
-        setMessage("Erreur d'upload (Session invalide)");
+        setMessage(t("Erreur d'upload (Session invalide)"));
       }
     };
     xhr.send(formData);
@@ -89,7 +89,7 @@
       <div className="text-center bg-muted/30 p-4 rounded-xl border border-border">
           <p className="text-sm mb-4">{t("Fichier :")} <span className="text-primary font-mono">{file.name}</span></p>
           <Button onClick={handleUpload} className="w-full">{t("Lancer la conversion HLS")}</Button>
-          <Button variant="ghost" onClick={() => setFile(null)} className="mt-2 text-xs w-full">Annuler</Button>
+          <Button variant="ghost" onClick={() => setFile(null)} className="mt-2 text-xs w-full">{t("Annuler")}</Button>
         </div>
       }
 
diff -ruN -x locales a/components/admin/videos-tab.tsx b/components/admin/videos-tab.tsx
--- a/components/admin/videos-tab.tsx	2026-11-09 05:51:45.701660518 -0500
+++ b/components/admin/videos-tab.tsx	2026-11-09 05:51:45.704294772 -0500
@@ -77,7 +77,7 @@
       const v = await adminListVideos();
       setVideos(v);
     } catch {
-      toast.error("Erreur de chargement des vidéos");
+      toast.error(t("Erreur de chargement des vidéos"));
     } finally {
       setIsLoading(false);
     }
@@ -96,7 +96,7 @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!contentType.trim()) {
-      toast.error("Veuillez renseigner une catégorie");
+      toast.error(t("Veuillez renseigner une catégorie"));
       return;
     }
     setCreatePending(true);
@@ -109,26 +109,26 @@
         videoUrl: formData.videoUrl.trim(),
         category: buildCategory(),
       });
-      toast.success("Vidéo ajoutée avec succès");
+      toast.success(t("Vidéo ajoutée avec succès"));
       setOpen(false);
       resetForm();
       await loadVideos();
     } catch (e: any) {
-      toast.error(e?.message || "Erreur lors de l'ajout");
+      toast.error(e?.message || t("Erreur lors de l'ajout"));
     } finally {
       setCreatePending(false);
     }
   };
 
   const handleDelete = async (id: string) => {
-    if (!confirm("Supprimer définitivement cette vidéo ?")) return;
+    if (!confirm(t("Supprimer définitivement cette vidéo ?"))) return;
     setDeletePending(id);
     try {
       await adminDeleteVideo(id);
       setVideos((prev) => prev.filter((v) => v.id !== id));
-      toast.success("Vidéo supprimée");
+      toast.success(t("Vidéo supprimée"));
     } catch (e: any) {
-      toast.error(e?.message || "Erreur de suppression");
+      toast.error(e?.message || t("Erreur de suppression"));
     } finally {
       setDeletePending(null);
     }
@@ -154,7 +154,7 @@
               {t("Gestion des Vidéos")}
             </CardTitle>
             <p className="text-xs text-muted-foreground mt-0.5">
-              {videos.length} vidéo{videos.length > 1 ? "s" : ""} au total
+              {t("{{count}} vidéos au total", { count: videos.length })}
             </p>
           </div>
         </div>
@@ -171,7 +171,7 @@
               <DialogHeader>
                 <DialogTitle>{t("Usine à Vidéo (MP4 → HLS)")}</DialogTitle>
                 <DialogDescription className="text-xs">
-                  Uploadez un fichier MP4, il sera automatiquement converti en HLS pour le streaming adaptatif.
+                  {t("Uploadez un fichier MP4, il sera automatiquement converti en HLS pour le streaming adaptatif.")}
                 </DialogDescription>
               </DialogHeader>
               <VideoUploader
@@ -180,7 +180,7 @@
                   setUploadOpen(false);
                   setFormData((prev) => ({ ...prev, videoUrl: url }));
                   setOpen(true);
-                  toast.success("URL HLS prête ! Complétez les informations.");
+                  toast.success(t("URL HLS prête ! Complétez les informations."));
                 }}
               />
             </DialogContent>
@@ -200,7 +200,7 @@
                   {t("Nouvelle Vidéo")}
                 </DialogTitle>
                 <DialogDescription className="text-xs">
-                  Les champs marqués d'un astérisque (*) sont obligatoires.
+                  {t("Les champs marqués d'un astérisque (*) sont obligatoires.")}
                 </DialogDescription>
               </DialogHeader>
 
@@ -213,7 +213,7 @@
                   <Input
                     id="video-title"
                     required
-                    placeholder="Ex: Kompa Lakay - Édition 2026"
+                    placeholder={t("Ex: Kompa Lakay - Édition 2026")}
                     value={formData.title}
                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   />
@@ -262,18 +262,18 @@
                 <div className="space-y-1.5">
                   <div className="flex items-center justify-between">
                     <Label htmlFor="video-description" className="text-sm font-medium">
-                      Description{" "}
+                      {t("Description")}{" "}
                       <span className="text-xs text-muted-foreground font-normal">
-                        (optionnelle)
+                        {t("(optionnelle)")}
                       </span>
                     </Label>
                     <span className="text-[11px] text-muted-foreground tabular-nums">
-                      {formData.description.length} caractères
+                      {t("{{count}} caractères", { count: formData.description.length })}
                     </span>
                   </div>
                   <Textarea
                     id="video-description"
-                    placeholder="Ajoutez une description, des tags, ou toute information utile..."
+                    placeholder={t("Ajoutez une description, des tags, ou toute information utile...")}
                     className="min-h-[100px] resize-y"
                     value={formData.description}
                     onChange={(e) =>
@@ -378,7 +378,7 @@
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
-              placeholder="Rechercher par titre ou catégorie..."
+              placeholder={t("Rechercher par titre ou catégorie...")}
               className="pl-9 pr-9"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
@@ -388,7 +388,7 @@
                 type="button"
                 onClick={() => setSearchQuery("")}
                 className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
-                aria-label="Effacer la recherche"
+                aria-label={t("Effacer la recherche")}
               >
                 <X className="h-3.5 w-3.5" />
               </button>
@@ -396,7 +396,7 @@
           </div>
           {searchQuery && (
             <span className="text-xs text-muted-foreground">
-              {filteredVideos.length} résultat{filteredVideos.length > 1 ? "s" : ""}
+              {t("{{count}} résultats", { count: filteredVideos.length })}
             </span>
           )}
         </div>
@@ -408,7 +408,7 @@
                 <TableRow>
                   <TableHead className="font-semibold">{t("common.title")}</TableHead>
                   <TableHead className="font-semibold">{t("common.category")}</TableHead>
-                  <TableHead className="font-semibold w-24">Vues</TableHead>
+                  <TableHead className="font-semibold w-24">{t("Vues")}</TableHead>
                   <TableHead className="font-semibold w-28">{t("common.vip")}</TableHead>
                   <TableHead className="w-16"></TableHead>
                 </TableRow>
@@ -428,8 +428,8 @@
                       <Film className="h-10 w-10 mx-auto mb-2 opacity-30" />
                       <p className="text-sm">
                         {searchQuery
-                          ? "Aucune vidéo ne correspond à votre recherche."
-                          : "Aucune vidéo pour le moment."}
+                          ? t("Aucune vidéo ne correspond à votre recherche.")
+                          : t("Aucune vidéo pour le moment.")}
                       </p>
                     </TableCell>
                   </TableRow>
@@ -456,7 +456,7 @@
                             VIP
                           </Badge>
                         ) : (
-                          <span className="text-xs text-muted-foreground">Gratuit</span>
+                          <span className="text-xs text-muted-foreground">{t("Gratuit")}</span>
                         )}
                       </TableCell>
                       <TableCell className="text-right">
@@ -466,7 +466,7 @@
                           onClick={() => handleDelete(v.id)}
                           disabled={deletePending === v.id}
                           className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
-                          aria-label="Supprimer la vidéo"
+                          aria-label={t("Supprimer la vidéo")}
                         >
                           {deletePending === v.id ? (
                             <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
diff -ruN -x locales a/components/admin/vip-requests-tab.tsx b/components/admin/vip-requests-tab.tsx
--- a/components/admin/vip-requests-tab.tsx	2026-11-09 05:51:45.701673750 -0500
+++ b/components/admin/vip-requests-tab.tsx	2026-11-09 05:51:45.704308596 -0500
@@ -7,10 +7,11 @@
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { toast } from "sonner";
 import { format } from "date-fns";
-import { fr } from "date-fns/locale";
+import { useDateLocale } from "@/lib/date-locale";
 import { adminListVipRequests, adminProcessVipRequest, type VipRequest } from "@/lib/supabase-db";import { useTranslation } from "react-i18next";
 
-export function VipRequestsTab({ token }: {token: string;}) {const { t } = useTranslation();
+export function VipRequestsTab({ token }: {token: string;}) {
+  const dateLocale = useDateLocale();const { t } = useTranslation();
   const [requests, setRequests] = useState<VipRequest[]>([]);
   const [processingId, setProcessingId] = useState<string | null>(null);
   const [selectedDuration, setSelectedDuration] = useState<Record<string, string>>({});
@@ -19,7 +20,7 @@
 
   const loadRequests = async () => {
     try {const data = await adminListVipRequests();setRequests(data);}
-    catch (err) {toast.error("Impossible de charger les reçus VIP");}
+    catch (err) {toast.error(t("Impossible de charger les reçus VIP"));}
   };
 
   const handleAction = async (r: VipRequest, action: "approved" | "rejected") => {
@@ -27,7 +28,7 @@
     const duration = parseInt(selectedDuration[r.id] || String(r.durationDays || 30), 10);
     try {
       await adminProcessVipRequest(r.id, r.userId, action, duration);
-      toast.success(action === "approved" ? `VIP activé (${duration} jours) !` : "Demande rejetée");
+      toast.success(action === "approved" ? t("VIP activé ({{days}} jours) !", { days: duration }) : t("Demande rejetée"));
       try {
         await fetch("https://api.haitiannud.com/api/push/send", {
           method: "POST",
@@ -40,7 +41,7 @@
         });
       } catch (pushErr) {console.warn("Échec push:", pushErr);}
       await loadRequests();
-    } catch (err: any) {toast.error(err?.message || "Erreur");} finally
+    } catch (err: any) {toast.error(err?.message || t("Erreur"));} finally
     {setProcessingId(null);}
   };
 
@@ -51,9 +52,9 @@
         <Table>
           <TableHeader>
             <TableRow>
-              <TableHead>Email</TableHead><TableHead>Offre</TableHead><TableHead>{t("Méthode")}</TableHead>
-              <TableHead>Preuve</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead>
-              <TableHead>{t("Durée")}</TableHead><TableHead className="text-right">Actions</TableHead>
+              <TableHead>{t("Email")}</TableHead><TableHead>{t("Offre")}</TableHead><TableHead>{t("Méthode")}</TableHead>
+              <TableHead>{t("Preuve")}</TableHead><TableHead>{t("Date")}</TableHead><TableHead>{t("Statut")}</TableHead>
+              <TableHead>{t("Durée")}</TableHead><TableHead className="text-right">{t("Actions")}</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
@@ -68,13 +69,13 @@
                     <DialogContent className="max-w-xl"><img src={r.proofUrl} alt={t("Reçu")} className="w-full rounded" /></DialogContent>
                   </Dialog>
                 </TableCell>
-                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "dd MMM yyyy", { locale: fr })}</TableCell>
-                <TableCell><span className={`px-2 py-1 rounded-full text-[11px] uppercase ${r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500'}`}>{r.status}</span></TableCell>
+                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), t("date.short"), { locale: dateLocale })}</TableCell>
+                <TableCell><span className={`px-2 py-1 rounded-full text-[11px] uppercase ${r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500'}`}>{r.status === 'approved' ? t("Approuvée") : r.status === 'rejected' ? t("Rejetée") : t("En attente")}</span></TableCell>
                 <TableCell>
                   {r.status === 'pending' ?
                 <Select value={selectedDuration[r.id] || String(r.durationDays || 30)} onValueChange={(val) => setSelectedDuration({ ...selectedDuration, [r.id]: val })}>
                       <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
-                      <SelectContent>{[7, 10, 15, 30, 40, 105, 365].map((d) => <SelectItem key={d} value={String(d)}>{d} Jours</SelectItem>)}</SelectContent>
+                      <SelectContent>{[7, 10, 15, 30, 40, 105, 365].map((d) => <SelectItem key={d} value={String(d)}>{t("{{days}} jours", { days: d })}</SelectItem>)}</SelectContent>
                     </Select> :
                 "—"}
                 </TableCell>
diff -ruN -x locales a/components/age-gate.tsx b/components/age-gate.tsx
--- a/components/age-gate.tsx	2026-11-09 05:51:45.701682879 -0500
+++ b/components/age-gate.tsx	2026-11-09 05:51:45.704317971 -0500
@@ -45,7 +45,7 @@
           <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
             <span className="text-primary text-2xl font-bold">18+</span>
           </div>
-          <DialogTitle className="text-2xl font-serif text-center">Avertissement</DialogTitle>
+          <DialogTitle className="text-2xl font-serif text-center">{t("Avertissement")}</DialogTitle>
           <DialogDescription className="text-center text-base mt-2">
             {t("Réservé aux adultes (18+). Mineurs interdits.")}
             <br /><br />
diff -ruN -x locales a/components/floating-support.tsx b/components/floating-support.tsx
--- a/components/floating-support.tsx	2026-11-09 05:51:45.701706337 -0500
+++ b/components/floating-support.tsx	2026-11-09 05:51:45.704345832 -0500
@@ -6,6 +6,7 @@
 import { toast } from "sonner";
 import { createTicket } from "@/lib/supabase-db";
 import { ADMIN_EMAIL } from "@/lib/supabase";
+import { useTranslation } from "react-i18next";
 
 // ⚠️ SÉCURITÉ : On utilise notre API Node, qui fera le relais vers N8N de manière sécurisée
 const API_CHAT_URL = "https://api.haitiannud.com/api/support/chat";
@@ -15,9 +16,8 @@
   content: string;
 }
 
-const t = (key: string, options?: any) => (window as any).t ? (window as any).t(key, options) : key;
-
 export function FloatingSupport({ currentUser }: {currentUser: any;}) {
+  const { t } = useTranslation();
   const [isOpen, setIsOpen] = useState(false);
   const [view, setView] = useState<'chat' | 'ticket'>('chat');
   const [input, setInput] = useState('');
@@ -29,7 +29,7 @@
   const [ticketSuccess, setTicketSuccess] = useState(false);
 
   const [messages, setMessages] = useState<ChatMsg[]>([
-  { role: 'bot', content: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' }]
+  { role: 'bot', content: t("Bonjour ! Comment puis-je vous aider aujourd'hui ?") }]
   );
 
   const scrollRef = useRef<HTMLDivElement>(null);
@@ -70,13 +70,13 @@
       if (!res.ok) throw new Error('Erreur réseau');
 
       const data = await res.json();
-      const reply = data.output ?? data.text ?? "Désolé, je n'ai pas pu traiter votre demande.";
+      const reply = data.output ?? data.text ?? t("Désolé, je n'ai pas pu traiter votre demande.");
 
       setMessages((prev) => [...prev, { role: 'bot', content: reply }]);
     } catch (err) {
       setMessages((prev) => [
       ...prev,
-      { role: 'bot', content: 'Erreur de connexion. Réessayez dans un instant ou contactez un humain.' }]
+      { role: 'bot', content: t("Erreur de connexion. Réessayez dans un instant ou contactez un humain.") }]
       );
     } finally {
       setIsTyping(false);
@@ -93,11 +93,11 @@
       setTicketSuccess(true);
       setSubject('');
       setTicketMessage('');
-      toast.success("Message envoyé au support");
+      toast.success(t("Message envoyé au support"));
       setTimeout(() => setTicketSuccess(false), 4000);
     } catch (err: any) {
       console.error(err);
-      toast.error(err?.message || "Erreur d'envoi");
+      toast.error(err?.message || t("Erreur d'envoi"));
     } finally {
       setTicketLoading(false);
     }
@@ -212,7 +212,7 @@
               
                   </div>
                   <Button type="submit" className="w-full flex gap-2" disabled={ticketLoading}>
-                    {ticketLoading ? 'Envoi...' :
+                    {ticketLoading ? t("Envoi...") :
               <>
                         {t("Envoyer la demande")} <Send className="h-4 w-4" />
                       </>
diff -ruN -x locales a/components/footer.tsx b/components/footer.tsx
--- a/components/footer.tsx	2026-11-09 05:51:45.701718930 -0500
+++ b/components/footer.tsx	2026-11-09 05:51:45.704358115 -0500
@@ -61,20 +61,20 @@
       <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
         <div className="md:col-span-2">
           <Link href="/" className="flex items-center gap-2 mb-4">
-            <img src={t("{{basePath}}/logo.jpg", { basePath: basePath })} alt={t("HAITIAN NUD")} className="h-10 w-10 rounded object-cover" />
+            <img src={`${basePath}/logo.jpg`} alt={t("HAITIAN NUD")} className="h-10 w-10 rounded object-cover" />
             <span className="font-serif font-bold text-2xl tracking-tight">{t("HAITIAN NUD")}</span>
           </Link>
 
           <div className="flex flex-col gap-2 mb-6">
             <a href="https://tiktok.com/@www.haitiannud.com" target="_blank" rel="noopener noreferrer">
               <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-primary/60 hover:bg-primary/5">
-                <TikTokIcon /> {t("@www.haitiannud.com")}
+                <TikTokIcon /> @www.haitiannud.com
               </Button>
             </a>
             
             <a href="https://www.instagram.com/dg_haitian_nud?igsh=azNndHRpaTAxdW54" target="_blank" rel="noopener noreferrer">
               <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start gap-2 border-border hover:border-pink-500/60 hover:bg-pink-500/5 hover:text-pink-400">
-                <InstagramIcon /> {t("@dg_haitian_nud")}
+                <InstagramIcon /> @dg_haitian_nud
               </Button>
             </a>
             
@@ -135,7 +135,7 @@
       </div>
 
       <div className="container mx-auto px-4 mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
-        <p>{t('footer.rights_reserved')}</p>
+        <p>{t('footer.rights_reserved', { year: new Date().getFullYear() })}</p>
       </div>
     </footer>);
 
diff -ruN -x locales a/components/header.tsx b/components/header.tsx
--- a/components/header.tsx	2026-11-09 05:51:45.701732335 -0500
+++ b/components/header.tsx	2026-11-09 05:51:45.704371158 -0500
@@ -76,7 +76,7 @@
             </SheetContent>
           </Sheet>
           <Link href="/" className="flex items-center gap-2">
-            <img src={t("{{basePath}}/logo.jpg", { basePath: basePath })} alt="Logo" className="h-8 w-8 rounded object-cover" />
+            <img src={`${basePath}/logo.jpg`} alt="Logo" className="h-8 w-8 rounded object-cover" />
             <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
               {t("HAITIAN NUD")}
             </span>
diff -ruN -x locales a/components/language-modal.tsx b/components/language-modal.tsx
--- a/components/language-modal.tsx	2026-11-09 05:51:45.701741576 -0500
+++ b/components/language-modal.tsx	2026-11-09 05:51:45.704380739 -0500
@@ -42,16 +42,16 @@
 
         <div className="grid grid-cols-2 gap-3 mt-6">
           <Button variant={i18n.language.startsWith("fr") ? "default" : "outline"} onClick={() => changeLanguage("fr")} className="h-12 text-base">
-            {t("🇫🇷 Français")}
+            🇫🇷 Français
           </Button>
           <Button variant={i18n.language.startsWith("ht") ? "default" : "outline"} onClick={() => changeLanguage("ht")} className="h-12 text-base">
-            {t("🇭🇹 Kreyòl")}
+            🇭🇹 Kreyòl
           </Button>
           <Button variant={i18n.language.startsWith("en") ? "default" : "outline"} onClick={() => changeLanguage("en")} className="h-12 text-base">
-            {t("🇺🇸 English")}
+            🇺🇸 English
           </Button>
           <Button variant={i18n.language.startsWith("es") ? "default" : "outline"} onClick={() => changeLanguage("es")} className="h-12 text-base">
-            {t("🇪🇸 Español")}
+            🇪🇸 Español
           </Button>
         </div>
       </DialogContent>
diff -ruN -x locales a/components/layout.tsx b/components/layout.tsx
--- a/components/layout.tsx	2026-11-09 05:51:45.701748701 -0500
+++ b/components/layout.tsx	2026-11-09 05:51:45.704387710 -0500
@@ -43,9 +43,9 @@
             const ok = await subscribeToPush(appUser?.id);
             if (ok) {
               setShowBanner(false);
-              toast.success("Notifications activées avec succès !");
+              toast.success(t("Notifications activées avec succès !"));
             } else {
-              toast.error("Veuillez accepter l'autorisation du navigateur.");
+              toast.error(t("Veuillez accepter l'autorisation du navigateur."));
             }
           } catch (err) {
             console.error("Erreur d'activation push banner:", err);
diff -ruN -x locales a/components/player/hybrid-video-player.tsx b/components/player/hybrid-video-player.tsx
--- a/components/player/hybrid-video-player.tsx	2026-11-09 05:51:45.701766165 -0500
+++ b/components/player/hybrid-video-player.tsx	2026-11-09 05:51:45.704404937 -0500
@@ -171,7 +171,7 @@
       setPlaybackError(null);
     } else {
       setPlaybackError({
-        message: !navigator.onLine ? "Vous semblez hors ligne. Vérifiez votre connexion." : reason,
+        message: !navigator.onLine ? t("Vous semblez hors ligne. Vérifiez votre connexion.") : reason,
         isNetwork: isNetwork || !navigator.onLine
       });
       cleanupHls();
diff -ruN -x locales a/components/player/player-settings.tsx b/components/player/player-settings.tsx
--- a/components/player/player-settings.tsx	2026-11-09 05:51:45.701780801 -0500
+++ b/components/player/player-settings.tsx	2026-11-09 05:51:45.704419377 -0500
@@ -42,7 +42,7 @@
             currentQualityIndex === -1 ? "text-primary font-bold" : "text-zinc-200"}`
             }>
             
-                <span>{autoTargetHeight ? `Auto (${autoTargetHeight}p)` : "Auto (Débit)"}</span>
+                <span>{autoTargetHeight ? t("Auto ({{autoTargetHeight}}p)", { autoTargetHeight }) : t("Auto (Débit)")}</span>
                 {currentQualityIndex === -1 && <Check className="h-3 w-3" />}
               </button>
               {[...levels].sort((a, b) => a.height - b.height).map((lvl) =>
@@ -63,7 +63,7 @@
         }
           <div>
             <div className="font-semibold text-zinc-400 uppercase text-[10px] px-2 py-1">
-              Vitesse
+              {t("Vitesse")}
             </div>
             {[0.75, 1, 1.25, 1.5, 2].map((s) =>
           <button
@@ -74,7 +74,7 @@
             playbackSpeed === s ? "text-primary font-bold" : "text-zinc-200"}`
             }>
             
-                <span>{s === 1 ? "Normal (1x)" : `${s}x`}</span>
+                <span>{s === 1 ? t("Normal (1x)") : `${s}x`}</span>
                 {playbackSpeed === s && <Check className="h-3 w-3" />}
               </button>
           )}
diff -ruN -x locales a/components/pwa-install.tsx b/components/pwa-install.tsx
--- a/components/pwa-install.tsx	2026-11-09 05:51:45.701829410 -0500
+++ b/components/pwa-install.tsx	2026-11-09 05:51:45.704443633 -0500
@@ -57,7 +57,7 @@
         </div>
         {deferred &&
         <Button size="sm" onClick={install} className="bg-primary text-primary-foreground shrink-0">
-            <Download className="h-4 w-4 mr-1" /> Installer
+            <Download className="h-4 w-4 mr-1" /> {t("Installer")}
           </Button>
         }
       </div>);
diff -ruN -x locales a/components/video-card.tsx b/components/video-card.tsx
--- a/components/video-card.tsx	2026-11-09 05:51:45.702308753 -0500
+++ b/components/video-card.tsx	2026-11-09 05:51:45.705009923 -0500
@@ -2,7 +2,7 @@
 import { Link } from "wouter";
 import type { Video } from "@/lib/supabase-db";
 import { formatDistanceToNow } from "date-fns";
-import { fr } from "date-fns/locale";
+import { useDateLocale } from "@/lib/date-locale";
 import { Play, Star } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 
@@ -12,11 +12,12 @@
 }
 
 export function VideoCard({ video, className = "" }: VideoCardProps) {
+  const dateLocale = useDateLocale();
   const { t } = useTranslation();
   const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");
 
   return (
-    <Link href={`/watch/${video.id}`} className={t("group block {{className}}", { className: className })}>
+    <Link href={`/watch/${video.id}`} className={`group block ${className}`}>
       <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3">
         <img
           src={video.thumbnailUrl || `${basePath}/logo.jpg`}
@@ -50,10 +51,10 @@
           <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
             <span className="truncate">{video.category}</span>
             <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
-            <span>{video.views.toLocaleString()} vues</span>
+            <span>{t("{{views}} vues", { count: video.views, views: video.views.toLocaleString() })}</span>
             <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
             <span className="whitespace-nowrap">
-              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: fr })}
+              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: dateLocale })}
             </span>
           </div>
         </div>
diff -ruN -x locales a/components/watch/comments-section.tsx b/components/watch/comments-section.tsx
--- a/components/watch/comments-section.tsx	2026-11-09 05:51:45.702326425 -0500
+++ b/components/watch/comments-section.tsx	2026-11-09 05:51:45.705031497 -0500
@@ -6,7 +6,7 @@
 import { Skeleton } from "@/components/ui/skeleton";
 import { MessageSquare } from "lucide-react";
 import { formatDistanceToNow } from "date-fns";
-import { fr } from "date-fns/locale";
+import { useDateLocale } from "@/lib/date-locale";
 import { type Comment } from "@/lib/supabase-db";
 import { Link } from "wouter";
 import { useTranslation } from "react-i18next";
@@ -29,6 +29,7 @@
   commentBody, setCommentBody, anonymous, setAnonymous,
   commentPending, handleComment
 }: CommentsSectionProps) {
+  const dateLocale = useDateLocale();
   const { t } = useTranslation();
 
   return (
@@ -99,7 +100,7 @@
                     {comment.anonymous ? t("watch.anonymous") : (comment.displayName || t("watch.user"))}
                   </span>
                   <span className="text-xs text-muted-foreground">
-                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
+                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale })}
                   </span>
                 </div>
                 <p className="text-sm text-foreground/90">{comment.body}</p>
diff -ruN -x locales a/components/watch/related-videos.tsx b/components/watch/related-videos.tsx
--- a/components/watch/related-videos.tsx	2026-11-09 05:51:45.702337601 -0500
+++ b/components/watch/related-videos.tsx	2026-11-09 05:51:45.705042383 -0500
@@ -31,7 +31,7 @@
                   {vid.title}
                 </h4>
                 <div className="text-xs text-muted-foreground mt-1">
-                  {vid.views.toLocaleString()} {t("watch.views")}
+                  {t("{{views}} vues", { count: vid.views, views: vid.views.toLocaleString() })}
                 </div>
               </div>
             </Link>
diff -ruN -x locales a/i18n.ts b/i18n.ts
--- a/i18n.ts	2026-11-09 05:51:45.702345819 -0500
+++ b/i18n.ts	2026-11-09 05:51:45.705050673 -0500
@@ -23,6 +23,11 @@
   .init({
     resources,
     fallbackLng: 'fr', // Langue par défaut si celle de l'utilisateur n'est pas dispo
+    // Les clés sont des phrases françaises (avec ":" et ".") ou des clés plates "common.title" :
+    // on désactive les séparateurs de namespace / d'objet pour qu'elles soient lues telles quelles.
+    keySeparator: false,
+    nsSeparator: false,
+    load: 'languageOnly',
     interpolation: {
       escapeValue: false // React protège déjà déjà contre les attaques XSS
     },
diff -ruN -x locales a/lib/date-locale.ts b/lib/date-locale.ts
--- a/lib/date-locale.ts	1969-12-31 19:00:00.000000000 -0500
+++ b/lib/date-locale.ts	2026-11-09 05:51:45.705155646 -0500
@@ -0,0 +1,43 @@
+import { useTranslation } from "react-i18next";
+import { fr, enUS, es } from "date-fns/locale";
+import type { Locale } from "date-fns";
+
+// date-fns n'a pas de locale créole haïtien : on garde les noms de mois français,
+// mais on remplace les durées relatives ("il y a 3 jours") par du créole.
+const htUnits: Record<string, (n: number) => string> = {
+  lessThanXSeconds: () => "kèk segonn",
+  xSeconds: (n) => `${n} segonn`,
+  halfAMinute: () => "30 segonn",
+  lessThanXMinutes: () => "mwens pase yon minit",
+  xMinutes: (n) => `${n} minit`,
+  aboutXHours: (n) => `anviwon ${n} è`,
+  xHours: (n) => `${n} è`,
+  xDays: (n) => `${n} jou`,
+  aboutXWeeks: (n) => `anviwon ${n} semèn`,
+  xWeeks: (n) => `${n} semèn`,
+  aboutXMonths: (n) => `anviwon ${n} mwa`,
+  xMonths: (n) => `${n} mwa`,
+  aboutXYears: (n) => `anviwon ${n} an`,
+  xYears: (n) => `${n} an`,
+  overXYears: (n) => `plis pase ${n} an`,
+  almostXYears: (n) => `prèske ${n} an`,
+};
+
+const ht: Locale = {
+  ...fr,
+  code: "ht",
+  formatDistance: (token, count, options) => {
+    const text = (htUnits[token] ?? (() => ""))(count);
+    if (options?.addSuffix) return options.comparison && options.comparison > 0 ? `nan ${text}` : `${text} de sa`;
+    return text;
+  },
+};
+
+const LOCALES: Record<string, Locale> = { fr, en: enUS, es, ht };
+
+/** Retourne la locale date-fns correspondant à la langue active de l'interface. */
+export function useDateLocale(): Locale {
+  const { i18n } = useTranslation();
+  const code = (i18n.resolvedLanguage || i18n.language || "fr").slice(0, 2);
+  return LOCALES[code] ?? fr;
+}
diff -ruN -x locales a/lib/offline-store.ts b/lib/offline-store.ts
--- a/lib/offline-store.ts	2026-11-09 05:51:45.702398987 -0500
+++ b/lib/offline-store.ts	2026-11-09 05:51:45.705103314 -0500
@@ -3,6 +3,7 @@
 // Limit: 5 videos max (100MB each = ~500MB limit)
 
 import { toast } from "sonner";
+import i18n from "@/i18n";
 
 const DB_NAME = "haitian-nud-offline";
 const DB_VERSION = 1;
@@ -48,7 +49,7 @@
     });
   } catch (err) {
     console.warn("Offline store not available:", err);
-    toast.error("Le stockage hors-ligne n'est pas disponible sur ce navigateur.");
+    toast.error(i18n.t("Le stockage hors-ligne n'est pas disponible sur ce navigateur."));
     return [];
   }
 }
@@ -102,9 +103,9 @@
   } catch (err: any) {
     // Gestion du quota dépassé (QuotaExceededError)
     if (err.name === "QuotaExceededError" || err.message?.toLowerCase().includes("quota")) {
-      toast.error("Stockage plein, impossible de sauvegarder la vidéo.");
+      toast.error(i18n.t("Stockage plein, impossible de sauvegarder la vidéo."));
     } else {
-      toast.error(err.message || "Erreur lors de la sauvegarde hors-ligne.");
+      toast.error(err.message || i18n.t("Erreur lors de la sauvegarde hors-ligne."));
     }
     throw err; // On relance l'erreur pour que le composant appelant puisse réagir
   }
diff -ruN -x locales a/lib/push-notifications.ts b/lib/push-notifications.ts
--- a/lib/push-notifications.ts	2026-11-09 05:51:45.702407771 -0500
+++ b/lib/push-notifications.ts	2026-11-09 05:51:45.705111956 -0500
@@ -1,4 +1,5 @@
-// Web Push Notifications — frontend helpers
+
+import i18n from "@/i18n";// Web Push Notifications — frontend helpers
 // VAPID public key (safe to expose in client)
 const VAPID_PUBLIC_KEY = "BAM-Ab_FHCm2P3q0n-DmuqdOyQOuwBOR6LAxbGjc4wbsqU6JN1rvsIAtmlbpCN0s62PjXgMlKUAyBxCO9UIE6FM";
 
@@ -115,7 +116,7 @@
     });
     if (!response.ok) {
       const err = await response.json().catch(() => ({}));
-      throw new Error((err as any).error || "Erreur serveur");
+      throw new Error((err as any).error || i18n.t("Erreur serveur"));
     }
     return await response.json();
   } catch (err) {
diff -ruN -x locales a/pages/account.tsx b/pages/account.tsx
--- a/pages/account.tsx	2026-11-09 05:51:45.702533405 -0500
+++ b/pages/account.tsx	2026-11-09 05:51:45.705268641 -0500
@@ -12,7 +12,7 @@
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { format } from "date-fns";
-import { fr } from "date-fns/locale";
+import { useDateLocale } from "@/lib/date-locale";
 import { Shield, Star, Download, LogOut, Ticket, History, Settings as SettingsIcon, Share2, Copy, Check, Bell, BellOff, BellRing, Trash2, Smartphone, Radio, Globe, User, Send } from "lucide-react";
 import { toast } from "sonner";
 import { getWatchHistory, clearWatchHistory, type WatchEntry } from "@/lib/local-store";
@@ -23,6 +23,7 @@
 import { LanguageSwitcher } from "@/components/LanguageSwitcher";
 
 export function Account() {
+  const dateLocale = useDateLocale();
   const { t } = useTranslation();
   const { isSignedIn, appUser, signOut, isAdmin, refreshUser } = useAuth();
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
@@ -65,11 +66,11 @@
       await createTicket(appUser.id, subject, message);
       setSubject("");
       setMessage("");
-      toast.success("Message envoyé au support");
+      toast.success(t("Message envoyé au support"));
       const updated = await listMyTickets(appUser.id);
       setTickets(updated);
     } catch (err: any) {
-      toast.error(err?.message || "Erreur d'envoi");
+      toast.error(err?.message || t("Erreur d'envoi"));
     } finally {
       setTicketPending(false);
     }
@@ -83,10 +84,10 @@
     try {
       await navigator.clipboard.writeText(referralLink);
       setCopied(true);
-      toast.success("Lien copié");
+      toast.success(t("Lien copié"));
       setTimeout(() => setCopied(false), 2000);
     } catch {
-      toast.error("Impossible de copier");
+      toast.error(t("Impossible de copier"));
     }
   };
 
@@ -115,9 +116,9 @@
       eq("id", appUser.id);
       if (error) throw error;
       await refreshUser();
-      toast.success("Nom mis à jour");
+      toast.success(t("Nom mis à jour"));
     } catch (err: any) {
-      toast.error(err?.message || "Erreur");
+      toast.error(err?.message || t("Erreur"));
     } finally {
       setSavingName(false);
     }
@@ -145,7 +146,7 @@
 
             <div className="space-y-1.5">
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
-                <h1 className="text-2xl md:text-3xl font-serif font-bold">{appUser?.displayName || "Utilisateur"}</h1>
+                <h1 className="text-2xl md:text-3xl font-serif font-bold">{appUser?.displayName || t("Utilisateur")}</h1>
                 {appUser?.plan === "vip" ?
                 <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white border-0 shadow-sm px-2.5 py-0.5 text-xs font-semibold">
                     <Star className="h-3 w-3 mr-1 fill-current" /> VIP
@@ -246,7 +247,7 @@
                     <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs flex justify-between items-center">
                       <span className="text-muted-foreground">{t('account.expires_at')}</span>
                       <span className="font-semibold">
-                        {appUser?.subscriptionEndsAt ? format(new Date(appUser.subscriptionEndsAt), "dd MMMM yyyy", { locale: fr }) : "À vie"}
+                        {appUser?.subscriptionEndsAt ? format(new Date(appUser.subscriptionEndsAt), t("date.long"), { locale: dateLocale }) : t("À vie")}
                       </span>
                     </div>
                   </div> :
@@ -320,7 +321,7 @@
               </CardTitle>
               {history.length > 0 &&
               <Button variant="ghost" size="sm" onClick={() => {clearWatchHistory();setHistory([]);}} className="text-destructive h-8 text-xs">
-                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Vider
+                  <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("Vider")}
                 </Button>
               }
             </CardHeader>
@@ -337,7 +338,7 @@
                       <div className="flex-1 min-w-0">
                         <div className="font-medium text-xs line-clamp-1">{h.title}</div>
                         <div className="text-[11px] text-muted-foreground mt-0.5">
-                          {format(new Date(h.watchedAt), "dd MMM yyyy à HH:mm", { locale: fr })}
+                          {format(new Date(h.watchedAt), t("date.datetime"), { locale: dateLocale })}
                         </div>
                       </div>
                     </Link>
@@ -356,7 +357,7 @@
             <Card className="border-border bg-card shadow-xs">
               <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2">
-                  <User className="h-4 w-4 text-primary" /> Profil
+                  <User className="h-4 w-4 text-primary" /> {t("Profil")}
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
@@ -434,7 +435,7 @@
                     <Textarea id="message" placeholder={t("Votre message...")} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="text-xs bg-muted/20 resize-none" />
                   </div>
                   <Button type="submit" disabled={ticketPending || !subject || !message} className="w-full h-9 text-xs font-semibold">
-                    {ticketPending ? t("Envoi...") : "Envoyer"}
+                    {ticketPending ? t("Envoi...") : t("Envoyer")}
                   </Button>
                 </form>
               </CardContent>
@@ -457,7 +458,7 @@
                         <div className="flex justify-between items-start gap-2">
                           <h4 className="font-semibold text-xs">{ticket.subject}</h4>
                           <Badge variant={ticket.status === 'open' ? 'secondary' : ticket.status === 'answered' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
-                            {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'answered' ? 'Répondu' : 'Fermé'}
+                            {ticket.status === 'open' ? t("Ouvert") : ticket.status === 'answered' ? t("Répondu") : t("Fermé")}
                           </Badge>
                         </div>
                         <p className="text-xs text-muted-foreground line-clamp-2">{ticket.message}</p>
@@ -468,7 +469,7 @@
                           </div>
                     }
                         <div className="text-[10px] text-muted-foreground">
-                          {format(new Date(ticket.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
+                          {format(new Date(ticket.createdAt), t("date.datetime"), { locale: dateLocale })}
                         </div>
                       </div>
                   ) :
@@ -510,20 +511,20 @@
         if (ok) {
           setSubscribed(false);
           setPermission(getPushPermission());
-          toast.success("Notifications désactivées");
+          toast.success(t("Notifications désactivées"));
         } else {
-          toast.error("Impossible de désactiver");
+          toast.error(t("Impossible de désactiver"));
         }
       } else {
         const ok = await subscribeToPush(userId);
         if (ok) {
           setSubscribed(true);
           setPermission("granted");
-          toast.success("Notifications activées !");
+          toast.success(t("Notifications activées !"));
         } else if (getPushPermission() === "denied") {
-          toast.error("Notifications bloquées dans votre navigateur");
+          toast.error(t("Notifications bloquées dans votre navigateur"));
         } else {
-          toast.error("Impossible d'activer les notifications");
+          toast.error(t("Impossible d'activer les notifications"));
         }
       }
     } finally {
diff -ruN -x locales a/pages/admin.tsx b/pages/admin.tsx
--- a/pages/admin.tsx	2026-11-09 05:51:45.702562738 -0500
+++ b/pages/admin.tsx	2026-11-09 05:51:45.705299526 -0500
@@ -49,16 +49,16 @@
         <div className="w-full overflow-x-auto pb-2 scrollbar-none">
           <TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-1 bg-muted p-1 rounded-xl">
             <TabsTrigger value="videos" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Vidéos")}</TabsTrigger>
-            <TabsTrigger value="photos" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Photos</TabsTrigger>
+            <TabsTrigger value="photos" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Photos")}</TabsTrigger>
             <TabsTrigger value="ads" className="px-3 py-1.5 text-xs sm:text-sm font-medium">
-              <Megaphone className="h-3.5 w-3.5 mr-1" /> Pubs
+              <Megaphone className="h-3.5 w-3.5 mr-1" /> {t("Pubs")}
             </TabsTrigger>
             <TabsTrigger value="vip" className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-yellow-500 gap-1.5">
               <Crown className="h-3.5 w-3.5 fill-yellow-500 shrink-0" /> {t("Demandes VIP")}
             </TabsTrigger>
-            <TabsTrigger value="users" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Utilisateurs</TabsTrigger>
-            <TabsTrigger value="tickets" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Messages</TabsTrigger>
-            <TabsTrigger value="alerts" className="px-3 py-1.5 text-xs sm:text-sm font-medium">Alertes</TabsTrigger>
+            <TabsTrigger value="users" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Utilisateurs")}</TabsTrigger>
+            <TabsTrigger value="tickets" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Messages")}</TabsTrigger>
+            <TabsTrigger value="alerts" className="px-3 py-1.5 text-xs sm:text-sm font-medium">{t("Alertes")}</TabsTrigger>
             <TabsTrigger value="banner" className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary">{t("Bannière")}</TabsTrigger>
           </TabsList>
         </div>
diff -ruN -x locales a/pages/downloads.tsx b/pages/downloads.tsx
--- a/pages/downloads.tsx	2026-11-09 05:51:45.702569788 -0500
+++ b/pages/downloads.tsx	2026-11-09 05:51:45.705310841 -0500
@@ -28,7 +28,7 @@
       const list = await listOfflineVideos();
       setVideos(list);
     } catch (err: any) {
-      toast.error(err?.message || "Erreur de chargement");
+      toast.error(err?.message || t("Erreur de chargement"));
     } finally {
       setLoading(false);
     }
@@ -46,10 +46,10 @@
         setPlayingId(null);
         setVideoUrl(null);
       }
-      toast.success("Vidéo supprimée");
+      toast.success(t("Vidéo supprimée"));
       loadVideos();
     } catch (err: any) {
-      toast.error(err?.message || "Erreur de suppression");
+      toast.error(err?.message || t("Erreur de suppression"));
     }
   };
 
@@ -99,7 +99,7 @@
 
       <>
           <p className="text-sm text-muted-foreground mb-4">
-            {videos.length}{t("/5 vidéos —")} {formatBytes(videos.reduce((s, v) => s + v.sizeBytes, 0))} {t("utilisés")}
+            {t("{{used}}/5 vidéos — {{size}} utilisés", { used: videos.length, size: formatBytes(videos.reduce((s, v) => s + v.sizeBytes, 0)) })}
           </p>
 
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
@@ -124,7 +124,7 @@
                     {formatBytes(video.sizeBytes)}
                   </div>
                   <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-xs rounded">
-                    <WifiOff className="h-3 w-3" /> Offline
+                    <WifiOff className="h-3 w-3" /> {t("Offline")}
                   </div>
                 </div>
                 <CardContent className="p-3">
diff -ruN -x locales a/pages/forgot-password.tsx b/pages/forgot-password.tsx
--- a/pages/forgot-password.tsx	2026-11-09 05:51:45.702578568 -0500
+++ b/pages/forgot-password.tsx	2026-11-09 05:51:45.705319859 -0500
@@ -33,7 +33,7 @@
       const checkResult = await response.json();
 
       if (!response.ok || !checkResult.exists) {
-        setError("Cet e-mail n'existe pas sur la plateforme.");
+        setError(t("Cet e-mail n'existe pas sur la plateforme."));
         setLoading(false);
         return;
       }
@@ -41,14 +41,14 @@
       // 2. Si l'e-mail existe, on procède à l'envoi du lien de réinitialisation via Supabase
       const { error: resetError } = await resetPassword(email);
       if (resetError) {
-        toast.error(resetError.message || "Erreur lors de l'envoi");
+        toast.error(resetError.message || t("Erreur lors de l'envoi"));
       } else {
         setSent(true);
-        toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
+        toast.success(t("Email envoyé ! Vérifiez votre boîte de réception."));
       }
     } catch (err: any) {
-      setError("Impossible de joindre le serveur de sécurité.");
-      toast.error("Erreur de connexion au serveur.");
+      setError(t("Impossible de joindre le serveur de sécurité."));
+      toast.error(t("Erreur de connexion au serveur."));
     } finally {
       setLoading(false);
     }
diff -ruN -x locales a/pages/home.tsx b/pages/home.tsx
--- a/pages/home.tsx	2026-11-09 05:51:45.702587662 -0500
+++ b/pages/home.tsx	2026-11-09 05:51:45.705331639 -0500
@@ -254,7 +254,7 @@
                   }>
                   
                   <Icon className="h-3.5 w-3.5" />
-                  {tab.label}
+                  {t(tab.label)}
                 </Button>);
 
             })}
@@ -417,7 +417,7 @@
                             {photo.category}
                           </span>
                           <span className="flex items-center gap-1 font-medium text-foreground/80">
-                            <Eye className="h-3.5 w-3.5 text-primary" /> {viewsCount.toLocaleString()} {viewsCount > 1 ? 'vues' : 'vue'}
+                            <Eye className="h-3.5 w-3.5 text-primary" /> {t("{{views}} vues", { count: viewsCount, views: viewsCount.toLocaleString() })}
                           </span>
                         </div>
                       </div>
@@ -475,7 +475,7 @@
 
               <div>
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
-                  <ImageIcon className="h-5 w-5 text-primary" /> Photos
+                  <ImageIcon className="h-5 w-5 text-primary" /> {t("Photos")}
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {isLoadingPhotos ?
@@ -527,7 +527,7 @@
             onClick={() => setSelectedPhoto(null)}
             className="absolute -top-10 right-0 text-white hover:text-primary transition-colors flex items-center gap-1 font-bold">
             
-              <X className="h-6 w-6" /> Fermer
+              <X className="h-6 w-6" /> {t("Fermer")}
             </button>
             <img
             src={selectedPhoto.imageUrl || (selectedPhoto as any).image_url}
@@ -540,7 +540,7 @@
                 <span>{selectedPhoto.category}</span>
                 <span>•</span>
                 <span className="flex items-center gap-1 text-white">
-                  <Eye className="h-3.5 w-3.5 text-primary" /> {extractViews(selectedPhoto).toLocaleString()} vues
+                  <Eye className="h-3.5 w-3.5 text-primary" /> {t("{{views}} vues", { count: extractViews(selectedPhoto), views: extractViews(selectedPhoto).toLocaleString() })}
                 </span>
               </p>
             </div>
diff -ruN -x locales a/pages/legal.tsx b/pages/legal.tsx
--- a/pages/legal.tsx	2026-11-09 05:51:45.702600736 -0500
+++ b/pages/legal.tsx	2026-11-09 05:51:45.705348724 -0500
@@ -1,4 +1,4 @@
-import { useTranslation } from "react-i18next";
+import { useTranslation, Trans } from "react-i18next";
 import { Link } from "wouter";
 import { ArrowLeft } from "lucide-react";
 
@@ -18,9 +18,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.warning_title')}</h2>
           <p>
-            {t("Haïtien Nud Média est un site web pour adultes. Il peut contenir des images, vidéos et\n            textes à caractère mature, sensuel ou explicite, destinés exclusivement à un public\n            majeur. L'accès est")} 
-
-            <strong>{t('legal.forbidden_minors')}</strong>.
+            <Trans i18nKey="legal.warning_text" components={{ b: <strong /> }} />
           </p>
           <p>
             {t("En entrant sur le site, vous déclarez sur l'honneur :")}
@@ -35,7 +33,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.age_confirmation')}</h2>
           <p>
-            {t("À chaque première visite, une fenêtre demande de confirmer votre majorité. En cliquant\n            sur \"J'ai 18 ans ou plus\", vous acceptez ces conditions et reconnaissez être seul\n            responsable de votre accès au site.")}
+            {t("À chaque première visite, une fenêtre demande de confirmer votre majorité. En cliquant sur \"J'ai 18 ans ou plus\", vous acceptez ces conditions et reconnaissez être seul responsable de votre accès au site.")}
           
 
           </p>
@@ -44,13 +42,13 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.content_property')}</h2>
           <p>
-            {t("Tous les contenus diffusés (vidéos, photos, textes, logos) sont protégés par le droit\n            d'auteur et appartiennent à leurs ayants droit respectifs. Toute reproduction,\n            redistribution ou diffusion publique en dehors des fonctionnalités prévues par le site\n            est interdite.")}
+            {t("Tous les contenus diffusés (vidéos, photos, textes, logos) sont protégés par le droit d'auteur et appartiennent à leurs ayants droit respectifs. Toute reproduction, redistribution ou diffusion publique en dehors des fonctionnalités prévues par le site est interdite.")}
           
 
 
           </p>
           <p>
-            {t("Tous les contenus mettant en scène des personnes sont publiés avec le consentement\n            écrit des intéressé·e·s, qui sont toutes majeures.")}
+            {t("Tous les contenus mettant en scène des personnes sont publiés avec le consentement écrit des intéressé·e·s, qui sont toutes majeures.")}
           
           </p>
         </section>
@@ -58,7 +56,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.vip_payments')}</h2>
           <p>
-            {t("Les abonnements VIP donnent accès à du contenu exclusif, à la lecture sans publicité et\n            aux téléchargements illimités. Les paiements sont effectués via un prestataire sécurisé\n            et sont non remboursables sauf cas prévus par la loi. Vous pouvez résilier à tout\n            moment depuis la page \"Mon Compte\".")}
+            {t("Les abonnements VIP donnent accès à du contenu exclusif, à la lecture sans publicité et aux téléchargements illimités. Les paiements sont effectués via un prestataire sécurisé et sont non remboursables sauf cas prévus par la loi. Vous pouvez résilier à tout moment depuis la page \"Mon Compte\".")}
           
 
 
@@ -68,7 +66,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.privacy_cookies')}</h2>
           <p>
-            {t("Vos données de connexion (email, identifiant) sont utilisées uniquement pour la gestion\n            de votre compte et de votre abonnement. Aucun contenu visionné n'est partagé avec des\n            tiers. Le site utilise des cookies techniques nécessaires au fonctionnement et à la\n            session.")}
+            {t("Vos données de connexion (email, identifiant) sont utilisées uniquement pour la gestion de votre compte et de votre abonnement. Aucun contenu visionné n'est partagé avec des tiers. Le site utilise des cookies techniques nécessaires au fonctionnement et à la session.")}
           
 
 
@@ -78,7 +76,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.comments_behavior')}</h2>
           <p>
-            {t("Les commentaires (anonymes ou non) doivent rester respectueux. Tout propos illégal,\n            haineux, discriminatoire ou menaçant sera supprimé et peut entraîner la suspension du\n            compte. Les comportements visant à mettre en cause la sécurité de mineurs sont\n            signalés aux autorités compétentes.")}
+            {t("Les commentaires (anonymes ou non) doivent rester respectueux. Tout propos illégal, haineux, discriminatoire ou menaçant sera supprimé et peut entraîner la suspension du compte. Les comportements visant à mettre en cause la sécurité de mineurs sont signalés aux autorités compétentes.")}
           
 
 
@@ -88,7 +86,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.report_contact')}</h2>
           <p>
-            {t("Toute personne identifiant un contenu litigieux (mineur, contenu non consenti,\n            atteinte aux droits) peut le signaler via la page \"Support\" depuis \"Mon Compte\". Les\n            signalements sont traités sous 72 h et donnent lieu, le cas échéant, au retrait\n            immédiat du contenu.")}
+            {t("Toute personne identifiant un contenu litigieux (mineur, contenu non consenti, atteinte aux droits) peut le signaler via la page \"Support\" depuis \"Mon Compte\". Les signalements sont traités sous 72 h et donnent lieu, le cas échéant, au retrait immédiat du contenu.")}
           
 
 
@@ -98,7 +96,7 @@
         <section className="space-y-4">
           <h2 className="text-2xl font-semibold text-foreground">{t('legal.if_minor')}</h2>
           <p>
-            {t("Quittez immédiatement ce site. Sur l'écran d'accueil, cliquez sur \"Je suis mineur(e)\".\n            Parlez‑en à un adulte de confiance et activez le contrôle parental sur votre appareil.")}
+            {t("Quittez immédiatement ce site. Sur l'écran d'accueil, cliquez sur \"Je suis mineur(e)\". Parlez‑en à un adulte de confiance et activez le contrôle parental sur votre appareil.")}
           
           </p>
         </section>
diff -ruN -x locales a/pages/live.tsx b/pages/live.tsx
--- a/pages/live.tsx	2026-11-09 05:51:45.702609452 -0500
+++ b/pages/live.tsx	2026-11-09 05:51:45.705358194 -0500
@@ -68,11 +68,11 @@
         if (newValue) {
           setPlaybackId(newValue);
           setIsActive(true);
-          toast.success("Le live commence !");
+          toast.success(t("Le live commence !"));
         } else {
           setIsActive(false);
           setPlaybackId(null);
-          toast.info("Le live s'est terminé.");
+          toast.info(t("Le live s'est terminé."));
         }
       }
     ).
@@ -113,7 +113,7 @@
 
   const sendReaction = (emoji: string) => {
     if (!isActive) {
-      toast.error("Le live doit être actif pour envoyer des réactions.");
+      toast.error(t("Le live doit être actif pour envoyer des réactions."));
       return;
     }
     triggerLocalReaction(emoji);
@@ -127,7 +127,7 @@
   const handleSendMessage = (e: React.FormEvent) => {
     e.preventDefault();
     if (!isActive) {
-      toast.error("Le chat est disponible uniquement lorsque le live est actif.");
+      toast.error(t("Le chat est disponible uniquement lorsque le live est actif."));
       return;
     }
     if (!inputText.trim()) return;
@@ -190,7 +190,7 @@
               {/* Overlay Badges */}
               <div className="absolute top-4 left-4 flex gap-2 items-center z-10">
                 <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-lg animate-pulse">
-                  <Radio className="h-3.5 w-3.5" /> Direct
+                  <Radio className="h-3.5 w-3.5" /> {t("Direct")}
                 </span>
                 <span className="bg-black/60 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                   <Users className="h-3.5 w-3.5 text-primary" /> {viewerCount}
diff -ruN -x locales a/pages/login.tsx b/pages/login.tsx
--- a/pages/login.tsx	2026-11-09 05:51:45.702620641 -0500
+++ b/pages/login.tsx	2026-11-09 05:51:45.705369724 -0500
@@ -43,10 +43,10 @@
         } else if (errorObj && typeof errorObj === 'string') {
           setFormError(errorObj);
         } else {
-          toast.success("Demande envoyée");
+          toast.success(t("Demande envoyée"));
           setTimeout(() => {
             if (!isSignedIn) {
-              setFormError("Identifiants incorrects ou adresse e-mail non confirmée.");
+              setFormError(t("Identifiants incorrects ou adresse e-mail non confirmée."));
             } else {
               setLocation("/");
             }
@@ -60,16 +60,16 @@
           setFormError(errorObj.message);
           toast.error(errorObj.message);
         } else if (result?.data?.user?.identities?.length === 0) {
-          setFormError("Cet e-mail est déjà utilisé par un autre compte.");
+          setFormError(t("Cet e-mail est déjà utilisé par un autre compte."));
           setMode("signin");
         } else {
           setSignupSuccess(true);
-          toast.success("Compte créé avec succès !");
+          toast.success(t("Compte créé avec succès !"));
         }
       }
     } catch (err: any) {
       console.error("Erreur interceptée :", err);
-      const msg = err?.message || err?.error_description || "Une erreur est survenue.";
+      const msg = err?.message || err?.error_description || t("Une erreur est survenue.");
       setFormError(msg);
       toast.error(msg);
     } finally {
@@ -94,10 +94,10 @@
           <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("HAITIAN NUD")}</h1>
           <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
             {signupSuccess ?
-            "Vérification de votre adresse e-mail" :
+            t("Vérification de votre adresse e-mail") :
             mode === "signin" ?
-            "Bienvenue ! Connectez-vous à votre compte" :
-            "Rejoignez la communauté en quelques clics"
+            t("Bienvenue ! Connectez-vous à votre compte") :
+            t("Rejoignez la communauté en quelques clics")
             }
           </p>
         </div>
@@ -176,7 +176,7 @@
               "text-muted-foreground hover:text-foreground"}`
               }>
               
-                <UserPlus className="h-3.5 w-3.5" /> Inscription
+                <UserPlus className="h-3.5 w-3.5" /> {t("Inscription")}
               </button>
             </div>
 
@@ -186,7 +186,7 @@
                 <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                 <div className="leading-tight">
                   <span className="font-bold">{t('common.error')} : </span>
-                  {formError === "User already registered" ? "Cet e-mail possède déjà un compte." : formError}
+                  {formError === "User already registered" ? t("Cet e-mail possède déjà un compte.") : formError}
                 </div>
               </div>
           }
@@ -270,9 +270,9 @@
                     <Loader2 className="h-4 w-4 animate-spin" /> {t("Patientez...")}
                   </span> :
               mode === "signin" ?
-              "Se connecter" :
+              t("Se connecter") :
 
-              "Créer mon compte"
+              t("Créer mon compte")
               }
               </Button>
             </form>
diff -ruN -x locales a/pages/plans.tsx b/pages/plans.tsx
--- a/pages/plans.tsx	2026-11-09 05:51:45.702632814 -0500
+++ b/pages/plans.tsx	2026-11-09 05:51:45.705382543 -0500
@@ -1,4 +1,4 @@
-import { useTranslation } from "react-i18next";
+import { useTranslation, Trans } from "react-i18next";
 import { useState, useEffect } from "react";
 import { useAuth } from "@/lib/auth-context";
 import { useLocation } from "wouter";
@@ -58,13 +58,13 @@
       const selectedFile = e.target.files[0];
       const maxSize = 5 * 1024 * 1024;
       if (selectedFile.size > maxSize) {
-        toast.error("Le fichier est trop lourd. Maximum 5 Mo autorisé.");
+        toast.error(t("Le fichier est trop lourd. Maximum 5 Mo autorisé."));
         e.target.value = "";
         return;
       }
       const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
       if (!allowedTypes.includes(selectedFile.type)) {
-        toast.error("Format non supporté. Veuillez envoyer une image (JPG, JPEG ou PNG).");
+        toast.error(t("Format non supporté. Veuillez envoyer une image (JPG, JPEG ou PNG)."));
         e.target.value = "";
         return;
       }
@@ -77,11 +77,11 @@
     try {
       const ok = await subscribeToPush((appUser as any)?.id);
       if (ok) {
-        toast.success("Notifications système activées !");
+        toast.success(t("Notifications système activées !"));
       } else if (getPushPermission() === "denied") {
-        toast.error("Veuillez autoriser les notifications dans les paramètres de votre navigateur.");
+        toast.error(t("Veuillez autoriser les notifications dans les paramètres de votre navigateur."));
       } else {
-        toast.error("Échec de la souscription aux notifications.");
+        toast.error(t("Échec de la souscription aux notifications."));
       }
     } finally {
       setPushPending(false);
@@ -91,17 +91,17 @@
   const handlePaymentSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!isSignedIn || !appUser) {
-      toast.error("Veuillez vous connecter pour soumettre votre paiement.");
+      toast.error(t("Veuillez vous connecter pour soumettre votre paiement."));
       return;
     }
 
     if (!file) {
-      toast.error("Veuillez téléverser votre reçu de paiement.");
+      toast.error(t("Veuillez téléverser votre reçu de paiement."));
       return;
     }
 
     if (supported && getPushPermission() !== "granted") {
-      toast.error("Action requise : Veuillez activer les notifications système avant d'envoyer.");
+      toast.error(t("Action requise : Veuillez activer les notifications système avant d'envoyer."));
       return;
     }
 
@@ -152,11 +152,11 @@
         console.error("Échec notification admin:", pushErr);
       }
 
-      toast.success("Preuve de paiement reçue avec succès !");
+      toast.success(t("Preuve de paiement reçue avec succès !"));
       setStep('success');
     } catch (err: any) {
       console.error(err);
-      toast.error(err?.message || "Une erreur est survenue lors de l'envoi.");
+      toast.error(err?.message || t("Une erreur est survenue lors de l'envoi."));
     } finally {
       setIsSubmitting(false);
     }
@@ -218,7 +218,7 @@
                       <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                         <div className="flex justify-between">
                           <span>{t("Durée :")}</span>
-                          <span className="font-bold text-foreground">{p.days} jours</span>
+                          <span className="font-bold text-foreground">{t("{{days}} jours", { days: p.days })}</span>
                         </div>
                         <div className="flex justify-between">
                           <span>{t("Prix par jour :")}</span>
@@ -233,7 +233,7 @@
               <div className="max-w-md mx-auto text-center pt-4">
                 {isSignedIn ?
             <Button onClick={() => setStep('payment')} className="w-full py-6 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl shadow-lg gap-2">
-                    {t("S'abonner avec la formule")} {selectedPlan.name} ({selectedPlan.priceUsd}$) <ArrowRight className="h-5 w-5" />
+                    {t("S'abonner avec la formule {{plan}} ({{price}}$)", { plan: selectedPlan.name, price: selectedPlan.priceUsd })} <ArrowRight className="h-5 w-5" />
                   </Button> :
 
             <Button onClick={() => setLocation("/login")} variant="outline" className="w-full py-6 text-base font-bold rounded-xl gap-2">
@@ -272,9 +272,9 @@
             <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 transition-all text-center">
                   <div className="mb-2">
                     <div className="font-semibold text-xs text-foreground">{link.label}</div>
-                    <div className="text-[11px] text-muted-foreground">{link.desc}</div>
+                    <div className="text-[11px] text-muted-foreground">{t(link.desc)}</div>
                   </div>
-                  <Button size="sm" className="w-full h-8 text-xs bg-primary text-white gap-1">Rejwenn</Button>
+                  <Button size="sm" className="w-full h-8 text-xs bg-primary text-white gap-1">{t("Rejoindre")}</Button>
                 </a>
             )}
             </div>
@@ -288,7 +288,7 @@
             <div className="border-b pb-4">
               <h2 className="text-2xl font-serif font-bold">{t('plans.how_to_pay')}</h2>
               <p className="text-sm text-muted-foreground mt-1">
-                {t("Formule choisie :")} <span className="font-bold text-yellow-500">{selectedPlan.name} ({selectedPlan.priceUsd}{t("$ USD / ~")}{selectedPlan.htg} {t("HTG /")} {selectedPlan.days} {t("jours)")}</span>
+                {t("Formule choisie :")} <span className="font-bold text-yellow-500">{t("{{plan}} ({{usd}} $ USD / ~{{htg}} HTG / {{days}} jours)", { plan: selectedPlan.name, usd: selectedPlan.priceUsd, htg: selectedPlan.htg, days: selectedPlan.days })}</span>
               </p>
             </div>
 
@@ -300,9 +300,9 @@
                   <Globe className="h-4 w-4" /> {t("1. Si vous résidez à l'Étranger (TapTap Send)")}
                 </h3>
                 <div className="space-y-2 text-xs text-muted-foreground pl-2">
-                  <p>{t("• Ouvrez l'application")} <strong>{t("TapTap Send")}</strong>.</p>
-                  <p>{t("• Sélectionnez")} <strong>{t("Haïti (+509)")}</strong> {t("comme destination.")}</p>
-                  <p>{t("• Saisissez le montant exact de la formule :")} <strong className="text-foreground">{selectedPlan.priceUsd} {t("$ USD")}</strong>.</p>
+                  <p><Trans i18nKey="• Ouvrez l'application <b>TapTap Send</b>." components={{ b: <strong /> }} /></p>
+                  <p><Trans i18nKey="• Sélectionnez <b>Haïti (+509)</b> comme destination." components={{ b: <strong /> }} /></p>
+                  <p><Trans i18nKey="• Saisissez le montant exact de la formule : <b>{{price}} $ USD</b>." values={{ price: selectedPlan.priceUsd }} components={{ b: <strong className="text-foreground" /> }} /></p>
                   <p>{t("• Envoyez sur le compte NatCash :")}</p>
                   <div className="p-3 bg-muted/40 border border-border/60 rounded-lg space-y-1 my-2">
                     <p className="text-xs">{t("Numéro NatCash :")} <span className="font-bold text-foreground font-mono">+509 32 49 24 65</span></p>
@@ -318,7 +318,7 @@
                   <MapPin className="h-4 w-4" /> {t("2. Si vous résidez en Haïti (Dépôt / Transfert)")}
                 </h3>
                 <div className="space-y-2 text-xs text-muted-foreground pl-2">
-                  <p>{t("• Effectuez simplement un")} <strong>{t("dépôt ou un transfert direct")}</strong> {t("d'un montant de")} <strong className="text-foreground">{selectedPlan.htg} HTG</strong>.</p>
+                  <p><Trans i18nKey="• Effectuez simplement un <b>dépôt ou un transfert direct</b> d'un montant de <c>{{htg}} HTG</c>." values={{ htg: selectedPlan.htg }} components={{ b: <strong />, c: <strong className="text-foreground" /> }} /></p>
                   <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1 my-2">
                     <p className="text-xs">{t("NatCash :")} <span className="font-bold text-emerald-500 font-mono">+509 32 49 24 65</span></p>
                     <p className="text-xs">{t("Nom du compte :")} <span className="font-bold text-foreground">{t("Dafca Saint Vill")}</span></p>
@@ -365,8 +365,8 @@
                 <form onSubmit={handlePaymentSubmit} className="space-y-6">
                   <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs space-y-1">
                     <p className="font-bold text-yellow-500">{t("Formule :")} {selectedPlan.name}</p>
-                    <p>{t("Montant :")} <strong>{selectedPlan.priceUsd}{t("$ USD")}</strong> (~{selectedPlan.htg} {t("HTG)")}</p>
-                    <p>{t("Accès :")} <strong>{selectedPlan.days} jours</strong> VIP</p>
+                    <p>{t("Montant :")} <strong>{selectedPlan.priceUsd} $ USD</strong> (~{selectedPlan.htg} HTG)</p>
+                    <p>{t("Accès :")} <strong>{t("{{days}} jours", { days: selectedPlan.days })}</strong> VIP</p>
                   </div>
 
                   <div className="space-y-2">
@@ -384,7 +384,7 @@
                     <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 bg-background hover:bg-muted/20 transition-all cursor-pointer group">
                       <input type="file" id="proof-file" required accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                       <FileImage className={`h-8 w-8 mb-2 ${file ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
-                      <p className="text-xs font-medium text-center text-foreground max-w-[200px] truncate">{file ? file.name : "Cliquez pour choisir un fichier"}</p>
+                      <p className="text-xs font-medium text-center text-foreground max-w-[200px] truncate">{file ? file.name : t("Cliquez pour choisir un fichier")}</p>
                       <p className="text-[10px] text-muted-foreground mt-1">{t('plans.file_limits')}</p>
                     </div>
                   </div>
@@ -406,7 +406,7 @@
                     </div> :
 
                 <Button type="submit" disabled={isSubmitting || !file} className="w-full py-5 text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl mt-4">
-                      {isSubmitting ? "Sécurisation & Envoi..." : `Envoyer ma preuve (${selectedPlan.priceUsd}$)`}
+                      {isSubmitting ? t("Sécurisation & Envoi...") : t("Envoyer ma preuve ({{priceUsd}}$)", { priceUsd: selectedPlan.priceUsd })}
                     </Button>
                 }
                 </form>
@@ -424,7 +424,7 @@
           <div className="space-y-2">
             <h2 className="text-3xl font-serif font-bold tracking-tight">{t('plans.thank_you')}</h2>
             <p className="text-sm text-muted-foreground px-4">
-              {t("Votre preuve de paiement pour la formule")} <span className="font-bold text-yellow-500">{selectedPlan.name} ({selectedPlan.days} {t("jours)")}</span> {t("a été transmise aux administrateurs.")}
+              <Trans i18nKey="Votre preuve de paiement pour la formule <b>{{plan}} ({{days}} jours)</b> a été transmise aux administrateurs." values={{ plan: selectedPlan.name, days: selectedPlan.days }} components={{ b: <span className="font-bold text-yellow-500" /> }} />
             </p>
           </div>
           <Button onClick={() => setLocation("/")} variant="outline" className="w-full py-5 rounded-xl text-xs font-semibold">
diff -ruN -x locales a/pages/reset-password.tsx b/pages/reset-password.tsx
--- a/pages/reset-password.tsx	2026-11-09 05:51:45.702646345 -0500
+++ b/pages/reset-password.tsx	2026-11-09 05:51:45.705395667 -0500
@@ -22,25 +22,25 @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (password !== confirmPassword) {
-      toast.error("Les mots de passe ne correspondent pas");
+      toast.error(t("Les mots de passe ne correspondent pas"));
       return;
     }
     if (password.length < 6) {
-      toast.error("Le mot de passe doit contenir au moins 6 caractères");
+      toast.error(t("Le mot de passe doit contenir au moins 6 caractères"));
       return;
     }
     setLoading(true);
     try {
       const { error } = await updatePassword(password);
       if (error) {
-        toast.error(error.message || "Erreur lors de la mise à jour");
+        toast.error(error.message || t("Erreur lors de la mise à jour"));
       } else {
         setDone(true);
-        toast.success("Mot de passe mis à jour !");
+        toast.success(t("Mot de passe mis à jour !"));
         setTimeout(() => setLocation("/login"), 3000);
       }
     } catch (err: any) {
-      toast.error(err?.message || "Erreur");
+      toast.error(err?.message || t("Erreur"));
     } finally {
       setLoading(false);
     }
diff -ruN -x locales a/pages/search.tsx b/pages/search.tsx
--- a/pages/search.tsx	2026-11-09 05:51:45.702655642 -0500
+++ b/pages/search.tsx	2026-11-09 05:51:45.705407131 -0500
@@ -85,7 +85,7 @@
   return (
     <div className="container mx-auto px-4 py-8 min-h-[80vh]">
       <div className="max-w-2xl mx-auto mb-10 text-center">
-        <h1 className="text-3xl font-serif font-bold mb-6">Rechercher</h1>
+        <h1 className="text-3xl font-serif font-bold mb-6">{t("Rechercher")}</h1>
         <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <SearchIcon className="h-5 w-5 text-muted-foreground" />
@@ -103,8 +103,8 @@
       <div className="mb-6">
         <h2 className="text-xl font-semibold mb-4">
           {debouncedQuery 
-            ? `Résultats pour "${debouncedQuery}"` 
-            : "Toutes les vidéos"}
+            ? t("Résultats pour \"{{debouncedQuery}}\"", { debouncedQuery }) 
+            : t("Toutes les vidéos")}
         </h2>
         
         {isLoading ? (
diff -ruN -x locales a/pages/vip-catalog.tsx b/pages/vip-catalog.tsx
--- a/pages/vip-catalog.tsx	2026-11-09 05:51:45.702665472 -0500
+++ b/pages/vip-catalog.tsx	2026-11-09 05:51:45.705416293 -0500
@@ -216,7 +216,7 @@
 function EmptyCatalogMessage({ type }: {type: string;}) {const { t } = useTranslation();
   return (
     <div className="w-full py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
-      {t("Aucun élément trouvé dans la catégorie des")} {type} {t("VIP pour le moment.")}
+      {t("Aucun élément trouvé dans la catégorie des {{type}} VIP pour le moment.", { type })}
     </div>);
 
 }
\ No newline at end of file
diff -ruN -x locales a/pages/watch.tsx b/pages/watch.tsx
--- a/pages/watch.tsx	2026-11-09 05:51:45.702679032 -0500
+++ b/pages/watch.tsx	2026-11-09 05:51:45.705426577 -0500
@@ -8,7 +8,7 @@
 "@/lib/supabase-db";
 import { Button } from "@/components/ui/button";
 import { formatDistanceToNow } from "date-fns";
-import { fr } from "date-fns/locale";
+import { useDateLocale } from "@/lib/date-locale";
 import { AlertCircle, Lock, Star, Download, Heart, Share2, Copy, Loader2, WifiOff, ArrowRight } from "lucide-react";
 import { toast } from "sonner";
 import { Badge } from "@/components/ui/badge";
@@ -53,6 +53,7 @@
 }
 
 export function Watch() {
+  const dateLocale = useDateLocale();
   const { id } = useParams<{id: string;}>();
   const { t } = useTranslation();
   const { isSignedIn, user, appUser, isLoading: authLoading } = useAuth();
@@ -136,15 +137,15 @@
   const copyLink = async () => {
     try {
       await navigator.clipboard.writeText(window.location.href);
-      toast.success("Lien copié");
+      toast.success(t("Lien copié"));
     } catch {
-      toast.error("Impossible de copier le lien");
+      toast.error(t("Impossible de copier le lien"));
     }
   };
 
   const handleLike = () => {
     if (!isSignedIn) {
-      toast.error("Ou bezwen konekte pouw ka renmen videyo sa a");
+      toast.error(t("Vous devez être connecté pour aimer cette vidéo"));
       return;
     }
     setIsAnimating(true);
@@ -156,13 +157,13 @@
     } else {
       setIsLiked(true);
       setLikesCount((prev) => prev + 1);
-      toast.success("Mèsi pou sipò w !");
+      toast.success(t("Merci pour votre soutien !"));
     }
   };
 
   const handleShare = async () => {
     if (!isSignedIn) {
-      toast.error("Ou bezwen konekte pouw ka pataje videyo sa a");
+      toast.error(t("Vous devez être connecté pour partager cette vidéo"));
       return;
     }
     const url = window.location.href;
@@ -178,16 +179,16 @@
   const handleDownload = async () => {
     if (!id || !appUser) return;
     if (!isSignedIn) {
-      toast.error("Fòk ou konekte pou kapab telechaje");
+      toast.error(t("Vous devez être connecté pour télécharger"));
       return;
     }
     if (video?.isVip && !isUserVip) {
-      toast.error("Vidéo VIP Abonnez-vous pour accéder au téléchargement.");
+      toast.error(t("Vidéo VIP Abonnez-vous pour accéder au téléchargement."));
       return;
     }
 
     setDownloadPending(true);
-    const toastId = toast.loading("Démarrage du téléchargement...");
+    const toastId = toast.loading(t("Démarrage du téléchargement..."));
 
     try {
       const res = await requestDownload(id, appUser.id, isUserVip ?? false, appUser.freeDownloadsUsed);
@@ -208,20 +209,20 @@
       document.body.removeChild(a);
 
       toast.success(
-        isUserVip ? "Téléchargement lancé dans le navigateur !" : `Téléchargement lancé. ${res.remaining} restant(s).`,
+        isUserVip ? t("Téléchargement lancé dans le navigateur !") : t("Téléchargement lancé. {{remaining}} restant(s).", { remaining: res.remaining }),
         { id: toastId }
       );
     } catch (e: any) {
       if (e.message === 'vip_required') {
-        toast.error("Abonnement VIP requis pour cette vidéo.", { id: toastId });
+        toast.error(t("Abonnement VIP requis pour cette vidéo."), { id: toastId });
       } else if (e.message === 'quota_exceeded') {
-        toast.error("Limite atteinte. Revenez demain ou passez VIP pour un accès illimité.", { id: toastId });
+        toast.error(t("Limite atteinte. Revenez demain ou passez VIP pour un accès illimité."), { id: toastId });
       } else {
         if (video?.videoUrl) {
           window.location.href = getProxyDownloadUrl(video.videoUrl, video?.title);
-          toast.success("Téléchargement démarré.", { id: toastId });
+          toast.success(t("Téléchargement démarré."), { id: toastId });
         } else {
-          toast.error(e?.message || "Erreur lors du lancement du téléchargement", { id: toastId });
+          toast.error(e?.message || t("Erreur lors du lancement du téléchargement"), { id: toastId });
         }
       }
     } finally {
@@ -232,11 +233,11 @@
   const handleOfflineDownload = async () => {
     if (!video || !video.videoUrl) return;
     if (!isSignedIn) {
-      toast.error("Fòk ou konekte pou gade offline");
+      toast.error(t("Vous devez être connecté pour regarder hors ligne"));
       return;
     }
     setOfflineDownloading(true);
-    const toastId = toast.loading("Démarrage de la sauvegarde offline...");
+    const toastId = toast.loading(t("Démarrage de la sauvegarde offline..."));
 
     try {
       const proxiedVideoUrl = getProxyVideoUrl(video.videoUrl);
@@ -251,15 +252,15 @@
         (loaded, total) => {
           const pct = total > 0 ? Math.round(loaded / total * 100) : 0;
           if (pct % 10 === 0) {
-            toast.loading(`Téléchargement offline : ${pct}%`, { id: toastId });
+            toast.loading(t("Téléchargement offline : {{pct}}%", { pct }), { id: toastId });
           }
         }
       );
-      toast.success("Vidéo disponible offline !", { id: toastId });
+      toast.success(t("Vidéo disponible offline !"), { id: toastId });
       setIsOfflineAvailable(true);
     } catch (e: any) {
       console.error("Erreur Offline :", e);
-      let msg = e?.message || "Erreur de téléchargement offline";
+      let msg = e?.message || t("Erreur de téléchargement offline");
       if (msg.includes("503") || msg.includes("Failed to fetch")) {
         msg = "Connexion lente ou interrompue. Réessayez dans quelques instants.";
       }
@@ -276,11 +277,11 @@
     try {
       await createComment(id, appUser.id, commentBody, anonymous, appUser.displayName || appUser.email);
       setCommentBody("");
-      toast.success("Commentaire ajouté");
+      toast.success(t("Commentaire ajouté"));
       const updated = await listComments(id);
       setComments(updated);
     } catch {
-      toast.error("Erreur lors de l'ajout du commentaire");
+      toast.error(t("Erreur lors de l'ajout du commentaire"));
     } finally {
       setCommentPending(false);
     }
@@ -314,7 +315,7 @@
       <div className="container mx-auto px-4 py-24 text-center">
         <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
         <h2 className="text-2xl font-serif font-bold mb-2">{t('common.error_loading')}</h2>
-        <p className="text-muted-foreground mb-6">{videoError || "Vidéo introuvable"}</p>
+        <p className="text-muted-foreground mb-6">{videoError || t("Vidéo introuvable")}</p>
         <Link href="/"><Button>{t('watch.back_home')}</Button></Link>
       </div>);
 
@@ -374,9 +375,9 @@
                 </div>
                 <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 leading-tight">{video.title}</h1>
                 <div className="flex items-center text-sm text-muted-foreground gap-2">
-                  <span>{video.views.toLocaleString()} vues</span>
+                  <span>{t("{{views}} vues", { count: video.views, views: video.views.toLocaleString() })}</span>
                   <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
-                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: fr })}</span>
+                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: dateLocale })}</span>
                 </div>
               </div>
 
@@ -394,11 +395,11 @@
                     isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`
                     } />
                   
-                  <span>{likesCount > 0 ? likesCount.toLocaleString() : "J'aime"}</span>
+                  <span>{likesCount > 0 ? likesCount.toLocaleString() : t("J'aime")}</span>
                 </Button>
 
                 <Button variant="secondary" onClick={handleShare} className="rounded-full bg-accent hover:bg-accent/80">
-                  <Share2 className="h-4 w-4 mr-2" /> Partager
+                  <Share2 className="h-4 w-4 mr-2" /> {t("Partager")}
                 </Button>
                 <Button variant="secondary" onClick={copyLink} className="rounded-full bg-accent hover:bg-accent/80">
                   <Copy className="h-4 w-4 mr-2" /> {t("Copier le lien")}
PATCH_EOF

cat > "$TMP/translations.cjs" <<'TR_EOF'
// N : clés en français naturel  -> [en, ht, es]   (fr = la clé elle-même)
// S : clés sémantiques (common.title…) -> [fr, en, ht, es]
// PL: pluriels i18next -> [fr_one, fr_other, en_one, en_other, ht_one, ht_other, es_one, es_other]
const N = {
"Langue": ["Language", "Lang", "Idioma"],
"Passer dans {{seconds}}s": ["Skip in {{seconds}}s", "Sote nan {{seconds}}s", "Omitir en {{seconds}}s"],
"Titre et fichier requis": ["Title and file required", "Tit ak fichye obligatwa", "Se requieren título y archivo"],
"Connexion...": ["Connecting...", "Ap konekte...", "Conectando..."],
"Pub ajoutée avec succès !": ["Ad added successfully!", "Piblisite a ajoute ak siksè!", "¡Anuncio agregado con éxito!"],
"Envoi... ({{pct}}%)": ["Uploading... ({{pct}}%)", "Ap voye... ({{pct}}%)", "Enviando... ({{pct}}%)"],
"Erreur lors de l'envoi": ["Error while sending", "Erè pandan voye a", "Error al enviar"],
"Promo VIP": ["VIP Promo", "Pwomosyon VIP", "Promo VIP"],
"Uploader la pub": ["Upload the ad", "Voye piblisite a", "Subir el anuncio"],
"Traitement...": ["Processing...", "Ap trete...", "Procesando..."],
"Skip après {{seconds}}s": ["Skip after {{seconds}}s", "Sote apre {{seconds}}s", "Omitir después de {{seconds}}s"],
"Suppr": ["Del", "Efase", "Elim."],
"Titre et message requis": ["Title and message required", "Tit ak mesaj obligatwa", "Se requieren título y mensaje"],
"Erreur serveur": ["Server error", "Erè sèvè", "Error del servidor"],
"{{sent}}/{{total}} envoyées !": ["{{sent}}/{{total}} sent!", "{{sent}}/{{total}} voye!", "¡{{sent}}/{{total}} enviadas!"],
"Erreur": ["Error", "Erè", "Error"],
"Lien": ["Link", "Lyen", "Enlace"],
"Envoi...": ["Sending...", "Ap voye...", "Enviando..."],
"Envoyer à tous": ["Send to everyone", "Voye bay tout moun", "Enviar a todos"],
"{{sent}} envoyées · {{failed}} expirées · {{total}} au total": ["{{sent}} sent · {{failed}} expired · {{total}} total", "{{sent}} voye · {{failed}} ekspire · {{total}} total", "{{sent}} enviadas · {{failed}} caducadas · {{total}} en total"],
"Infos": ["Info", "Enfòmasyon", "Información"],
"Table requise :": ["Required table:", "Tab ki obligatwa:", "Tabla requerida:"],
"Mise à jour !": ["Updated!", "Mizajou fèt!", "¡Actualizado!"],
"Retirer la vidéo de fond ?": ["Remove the background video?", "Retire videyo fon an?", "¿Quitar el video de fondo?"],
"Réinitialisé": ["Reset", "Re-inisyalize", "Restablecido"],
"Enregistrer": ["Save", "Anrejistre", "Guardar"],
"Erreur de chargement": ["Loading error", "Erè pandan chajman an", "Error de carga"],
"Photo ajoutée !": ["Photo added!", "Foto a ajoute!", "¡Foto agregada!"],
"Retirer cette photo ?": ["Remove this photo?", "Retire foto sa a?", "¿Quitar esta foto?"],
"Photo archivée": ["Photo archived", "Foto a achive", "Foto archivada"],
"Titre": ["Title", "Tit", "Título"],
"Description": ["Description", "Deskripsyon", "Descripción"],
"Publier": ["Publish", "Pibliye", "Publicar"],
"Ajouter": ["Add", "Ajoute", "Agregar"],
"Vues": ["Views", "Gade", "Vistas"],
"Oui": ["Yes", "Wi", "Sí"],
"Non": ["No", "Non", "No"],
"Utilisateurs": ["Users", "Itilizatè yo", "Usuarios"],
"Membres VIP": ["VIP Members", "Manm VIP yo", "Miembros VIP"],
"Photos": ["Photos", "Foto yo", "Fotos"],
"Réponse envoyée": ["Reply sent", "Repons lan voye", "Respuesta enviada"],
"Ouvert": ["Open", "Ouvè", "Abierto"],
"Répondu": ["Answered", "Reponn", "Respondido"],
"Fermé": ["Closed", "Fèmen", "Cerrado"],
"Original": ["Original", "Orijinal", "Original"],
"Envoyer": ["Send", "Voye", "Enviar"],
"Erreur au chargement": ["Error while loading", "Erè pandan chajman an", "Error al cargar"],
"Utilisateur débloqué": ["User unblocked", "Itilizatè a debloke", "Usuario desbloqueado"],
"Utilisateur bloqué": ["User blocked", "Itilizatè a bloke", "Usuario bloqueado"],
"Date": ["Date", "Dat", "Fecha"],
"Statut": ["Status", "Estati", "Estado"],
"Actif": ["Active", "Aktif", "Activo"],
"Débloquer": ["Unblock", "Debloke", "Desbloquear"],
"Bloquer": ["Block", "Bloke", "Bloquear"],
"Connexion au serveur...": ["Connecting to the server...", "Ap konekte ak sèvè a...", "Conectando con el servidor..."],
"Envoi du fichier... ({{pct}}%)": ["Uploading file... ({{pct}}%)", "Ap voye fichye a... ({{pct}}%)", "Subiendo archivo... ({{pct}}%)"],
"Fichier reçu, transcodage en cours...": ["File received, transcoding in progress...", "Fichye a resevwa, konvèsyon an ap fèt...", "Archivo recibido, transcodificación en curso..."],
"Erreur d'upload (Session invalide)": ["Upload error (Invalid session)", "Erè pandan voye a (Sesyon pa valid)", "Error de subida (Sesión no válida)"],
"Déposez le MP4 ici...": ["Drop the MP4 here...", "Depoze MP4 a isit la...", "Suelta el MP4 aquí..."],
"Glissez un MP4 ou cliquez": ["Drag an MP4 or click", "Glise yon MP4 oswa klike", "Arrastra un MP4 o haz clic"],
"Annuler": ["Cancel", "Anile", "Cancelar"],
"Réessayer": ["Try again", "Eseye ankò", "Reintentar"],
"Erreur de chargement des vidéos": ["Error loading videos", "Erè pandan chajman videyo yo", "Error al cargar los videos"],
"Veuillez renseigner une catégorie": ["Please enter a category", "Tanpri mete yon kategori", "Indica una categoría"],
"Vidéo ajoutée avec succès": ["Video added successfully", "Videyo a ajoute ak siksè", "Video agregado con éxito"],
"Erreur lors de l'ajout": ["Error while adding", "Erè pandan ajoute a", "Error al agregar"],
"Supprimer définitivement cette vidéo ?": ["Permanently delete this video?", "Efase videyo sa a pou tout tan?", "¿Eliminar este video definitivamente?"],
"Vidéo supprimée": ["Video deleted", "Videyo a efase", "Video eliminado"],
"Erreur de suppression": ["Deletion error", "Erè pandan efasman an", "Error al eliminar"],
"Uploadez un fichier MP4, il sera automatiquement converti en HLS pour le streaming adaptatif.": ["Upload an MP4 file; it will be automatically converted to HLS for adaptive streaming.", "Voye yon fichye MP4, l ap konvèti otomatikman an HLS pou streaming adaptatif.", "Sube un archivo MP4; se convertirá automáticamente a HLS para streaming adaptativo."],
"URL HLS prête ! Complétez les informations.": ["HLS URL ready! Fill in the details.", "URL HLS a pare! Ranpli enfòmasyon yo.", "¡URL HLS lista! Completa la información."],
"Les champs marqués d'un astérisque (*) sont obligatoires.": ["Fields marked with an asterisk (*) are required.", "Chan ki make ak yon zetwal (*) yo obligatwa.", "Los campos marcados con un asterisco (*) son obligatorios."],
"Ex: Kompa Lakay - Édition 2026": ["E.g. Kompa Lakay - 2026 Edition", "Egz: Kompa Lakay - Edisyon 2026", "Ej.: Kompa Lakay - Edición 2026"],
"ex: Kompa, Rasin...": ["e.g. Kompa, Rasin...", "egz: Kompa, Rasin...", "ej.: Kompa, Rasin..."],
"(optionnelle)": ["(optional)", "(opsyonèl)", "(opcional)"],
"Ajoutez une description, des tags, ou toute information utile...": ["Add a description, tags, or any useful information...", "Ajoute yon deskripsyon, tag, oswa nenpòt enfòmasyon itil...", "Añade una descripción, etiquetas o cualquier información útil..."],
"Enregistrement...": ["Saving...", "Ap anrejistre...", "Guardando..."],
"Enregistrer la vidéo": ["Save the video", "Anrejistre videyo a", "Guardar el video"],
"Rechercher par titre ou catégorie...": ["Search by title or category...", "Chèche pa tit oswa kategori...", "Buscar por título o categoría..."],
"Effacer la recherche": ["Clear search", "Efase rechèch la", "Borrar la búsqueda"],
"Aucune vidéo ne correspond à votre recherche.": ["No video matches your search.", "Okenn videyo pa koresponn ak rechèch ou a.", "Ningún video coincide con tu búsqueda."],
"Aucune vidéo pour le moment.": ["No videos for now.", "Pa gen videyo pou kounye a.", "No hay videos por ahora."],
"Gratuit": ["Free", "Gratis", "Gratis"],
"Supprimer la vidéo": ["Delete the video", "Efase videyo a", "Eliminar el video"],
"Impossible de charger les reçus VIP": ["Unable to load VIP receipts", "Pa kapab chaje resi VIP yo", "No se pudieron cargar los recibos VIP"],
"VIP activé ({{days}} jours) !": ["VIP activated ({{days}} days)!", "VIP aktive ({{days}} jou)!", "¡VIP activado ({{days}} días)!"],
"Demande rejetée": ["Request rejected", "Demann lan rejte", "Solicitud rechazada"],
"Email": ["Email", "Imèl", "Correo electrónico"],
"Offre": ["Plan", "Òf", "Oferta"],
"Preuve": ["Proof", "Prèv", "Comprobante"],
"Actions": ["Actions", "Aksyon", "Acciones"],
"Reçu": ["Receipt", "Resi", "Recibo"],
"Approuvée": ["Approved", "Apwouve", "Aprobada"],
"Rejetée": ["Rejected", "Rejte", "Rechazada"],
"En attente": ["Pending", "An tann", "Pendiente"],
"{{days}} jours": ["{{days}} days", "{{days}} jou", "{{days}} días"],
"Avertissement": ["Warning", "Avètisman", "Advertencia"],
"Validation...": ["Validating...", "Ap valide...", "Validando..."],
"J'ai 18 ans ou plus": ["I am 18 or older", "Mwen gen 18 an oswa plis", "Tengo 18 años o más"],
"Bonjour ! Comment puis-je vous aider aujourd'hui ?": ["Hello! How can I help you today?", "Bonjou! Kijan mwen ka ede w jodi a?", "¡Hola! ¿Cómo puedo ayudarte hoy?"],
"Désolé, je n'ai pas pu traiter votre demande.": ["Sorry, I couldn't process your request.", "Padon, mwen pa t kapab trete demann ou an.", "Lo siento, no pude procesar tu solicitud."],
"Erreur de connexion. Réessayez dans un instant ou contactez un humain.": ["Connection error. Try again in a moment or contact a human.", "Erè koneksyon. Eseye ankò talè oswa kontakte yon moun.", "Error de conexión. Inténtalo de nuevo en un momento o contacta con una persona."],
"Message envoyé au support": ["Message sent to support", "Mesaj la voye bay sipò a", "Mensaje enviado a soporte"],
"Erreur d'envoi": ["Sending error", "Erè pandan voye a", "Error de envío"],
"Assistant virtuel": ["Virtual assistant", "Asistan vityèl", "Asistente virtual"],
"Support en ligne": ["Online support", "Sipò anliy", "Soporte en línea"],
"Posez votre question": ["Ask your question", "Poze kesyon w lan", "Haz tu pregunta"],
"Une question ? Écrivez-nous.": ["A question? Write to us.", "Yon kesyon? Ekri nou.", "¿Una pregunta? Escríbenos."],
"Contacter un humain": ["Contact a human", "Kontakte yon moun", "Contactar con una persona"],
"Retour au chat": ["Back to chat", "Tounen nan chat la", "Volver al chat"],
"En train d'écrire...": ["Typing...", "Ap ekri...", "Escribiendo..."],
"L'équipe vous répondra sous peu.": ["The team will reply shortly.", "Ekip la ap reponn ou talè.", "El equipo te responderá en breve."],
"Ex: Problème d'abonnement": ["E.g. Subscription issue", "Egz: Pwoblèm abònman", "Ej.: Problema con la suscripción"],
"Décrivez votre problème en détail...": ["Describe your problem in detail...", "Dekri pwoblèm ou an an detay...", "Describe tu problema con detalle..."],
"Notifications activées avec succès !": ["Notifications enabled successfully!", "Notifikasyon yo aktive ak siksè!", "¡Notificaciones activadas con éxito!"],
"Veuillez accepter l'autorisation du navigateur.": ["Please accept the browser permission.", "Tanpri aksepte otorizasyon navigatè a.", "Acepta el permiso del navegador."],
"Activer maintenant": ["Enable now", "Aktive kounye a", "Activar ahora"],
"Connexion interrompue": ["Connection interrupted", "Koneksyon an entewonp", "Conexión interrumpida"],
"Problème de lecture": ["Playback problem", "Pwoblèm lekti", "Problema de reproducción"],
"Vous semblez hors ligne. Vérifiez votre connexion.": ["You seem to be offline. Check your connection.", "Sanble ou pa konekte. Tcheke koneksyon ou.", "Pareces estar sin conexión. Revisa tu conexión."],
"Auto ({{autoTargetHeight}}p)": ["Auto ({{autoTargetHeight}}p)", "Otomatik ({{autoTargetHeight}}p)", "Auto ({{autoTargetHeight}}p)"],
"Auto (Débit)": ["Auto (Bandwidth)", "Otomatik (Debi)", "Auto (Ancho de banda)"],
"Vitesse": ["Speed", "Vitès", "Velocidad"],
"Normal (1x)": ["Normal (1x)", "Nòmal (1x)", "Normal (1x)"],
"Ajoutez Haitian nud à votre écran d'accueil.": ["Add Haitian Nud to your home screen.", "Ajoute Haitian Nud sou ekran akèy ou a.", "Añade Haitian Nud a tu pantalla de inicio."],
"Sur iPhone : Partager → \"Sur l'écran d'accueil\". Sur Android : menu → \"Installer l'application\".": ["On iPhone: Share → \"Add to Home Screen\". On Android: menu → \"Install app\".", "Sou iPhone: Pataje → \"Sou ekran akèy\". Sou Android: meni → \"Enstale aplikasyon an\".", "En iPhone: Compartir → \"Añadir a pantalla de inicio\". En Android: menú → \"Instalar aplicación\"."],
"Installer": ["Install", "Enstale", "Instalar"],
"Le stockage hors-ligne n'est pas disponible sur ce navigateur.": ["Offline storage is not available in this browser.", "Estokaj offline pa disponib sou navigatè sa a.", "El almacenamiento sin conexión no está disponible en este navegador."],
"Stockage plein, impossible de sauvegarder la vidéo.": ["Storage full, unable to save the video.", "Estokaj la plen, pa kapab sove videyo a.", "Almacenamiento lleno, no se puede guardar el video."],
"Erreur lors de la sauvegarde hors-ligne.": ["Error while saving offline.", "Erè pandan sovgad offline la.", "Error al guardar sin conexión."],
"Lien copié": ["Link copied", "Lyen an kopye", "Enlace copiado"],
"Impossible de copier": ["Unable to copy", "Pa kapab kopye", "No se pudo copiar"],
"Nom mis à jour": ["Name updated", "Non an mete ajou", "Nombre actualizado"],
"Utilisateur": ["User", "Itilizatè", "Usuario"],
"À vie": ["Lifetime", "Pou lavi", "De por vida"],
"Vider": ["Clear", "Vide", "Vaciar"],
"Profil": ["Profile", "Pwofil", "Perfil"],
"Choisissez la langue de l'interface pour personnaliser votre navigation.": ["Choose the interface language to personalize your browsing.", "Chwazi lang entèfas la pou pèsonalize navigasyon w lan.", "Elige el idioma de la interfaz para personalizar tu navegación."],
"Sujet...": ["Subject...", "Sijè...", "Asunto..."],
"Votre message...": ["Your message...", "Mesaj ou...", "Tu mensaje..."],
"Notifications désactivées": ["Notifications disabled", "Notifikasyon yo dezaktive", "Notificaciones desactivadas"],
"Impossible de désactiver": ["Unable to disable", "Pa kapab dezaktive", "No se pudo desactivar"],
"Notifications activées !": ["Notifications enabled!", "Notifikasyon yo aktive!", "¡Notificaciones activadas!"],
"Notifications bloquées dans votre navigateur": ["Notifications blocked in your browser", "Notifikasyon yo bloke nan navigatè w la", "Notificaciones bloqueadas en tu navegador"],
"Impossible d'activer les notifications": ["Unable to enable notifications", "Pa kapab aktive notifikasyon yo", "No se pudieron activar las notificaciones"],
"Activées": ["Enabled", "Aktive", "Activadas"],
"Désactivées": ["Disabled", "Dezaktive", "Desactivadas"],
"Alertes nouveautés": ["New content alerts", "Alèt nouvote", "Alertas de novedades"],
"Activer pour recevoir les alertes": ["Enable to receive alerts", "Aktive pou resevwa alèt yo", "Activa para recibir alertas"],
"Configurez votre logiciel d'envoi et lancez le direct.": ["Set up your streaming software and start the live.", "Konfigire lojisyèl difizyon ou a epi lanse dirèk la.", "Configura tu software de transmisión e inicia el directo."],
"Pubs": ["Ads", "Piblisite", "Anuncios"],
"Messages": ["Messages", "Mesaj", "Mensajes"],
"Alertes": ["Alerts", "Alèt", "Alertas"],
"{{used}}/5 vidéos — {{size}} utilisés": ["{{used}}/5 videos — {{size}} used", "{{used}}/5 videyo — {{size}} itilize", "{{used}}/5 videos — {{size}} usados"],
"Offline": ["Offline", "Offline", "Sin conexión"],
"Cet e-mail n'existe pas sur la plateforme.": ["This email does not exist on the platform.", "Imèl sa a pa egziste sou platfòm nan.", "Este correo no existe en la plataforma."],
"Email envoyé ! Vérifiez votre boîte de réception.": ["Email sent! Check your inbox.", "Imèl la voye! Tcheke bwat resepsyon ou a.", "¡Correo enviado! Revisa tu bandeja de entrada."],
"Impossible de joindre le serveur de sécurité.": ["Unable to reach the security server.", "Pa kapab kontakte sèvè sekirite a.", "No se pudo contactar con el servidor de seguridad."],
"Erreur de connexion au serveur.": ["Server connection error.", "Erè koneksyon ak sèvè a.", "Error de conexión con el servidor."],
"Email envoyé !": ["Email sent!", "Imèl la voye!", "¡Correo enviado!"],
"Mot de passe oublié ?": ["Forgot your password?", "Ou bliye modpas ou?", "¿Olvidaste tu contraseña?"],
"Un lien de réinitialisation a été envoyé à votre adresse email.": ["A reset link has been sent to your email address.", "Yon lyen rekòmanse voye sou adrès imèl ou a.", "Se ha enviado un enlace de restablecimiento a tu correo electrónico."],
"Entrez votre email pour recevoir un lien de réinitialisation.": ["Enter your email to receive a reset link.", "Antre imèl ou pou resevwa yon lyen rekòmanse.", "Introduce tu correo para recibir un enlace de restablecimiento."],
"votre@email.com": ["your@email.com", "ou@imel.com", "tu@correo.com"],
"Vérification...": ["Verifying...", "Ap verifye...", "Verificando..."],
"Envoyer le lien de réinitialisation": ["Send reset link", "Voye lyen rekòmanse a", "Enviar enlace de restablecimiento"],
"Renvoyer l'email": ["Resend the email", "Revoye imèl la", "Reenviar el correo"],
"Récentes": ["Recent", "Resan", "Recientes"],
"Plus vues": ["Most viewed", "Pi gade yo", "Más vistas"],
"Découvrir les offres": ["Discover the offers", "Dekouvri òf yo", "Descubrir las ofertas"],
"Contenus récents & populaires": ["Recent & popular content", "Kontni resan & popilè", "Contenido reciente y popular"],
"Galerie vidéo": ["Video gallery", "Galri videyo", "Galería de videos"],
"Galerie photo": ["Photo gallery", "Galri foto", "Galería de fotos"],
"Aucune photo disponible pour l'instant.": ["No photos available at the moment.", "Pa gen foto disponib pou kounye a.", "No hay fotos disponibles por el momento."],
"Fermer": ["Close", "Fèmen", "Cerrar"],
"À chaque première visite, une fenêtre demande de confirmer votre majorité. En cliquant sur \"J'ai 18 ans ou plus\", vous acceptez ces conditions et reconnaissez être seul responsable de votre accès au site.": ["On your first visit, a window asks you to confirm you are of legal age. By clicking \"I am 18 or older\", you accept these conditions and acknowledge that you are solely responsible for your access to the site.", "Chak premye fwa w vizite, yon fenèt mande w konfime ou majè. Lè w klike sou \"Mwen gen 18 an oswa plis\", w aksepte kondisyon sa yo epi w rekonèt ou se sèl moun ki responsab aksè w nan sit la.", "En tu primera visita, una ventana te pedirá confirmar que eres mayor de edad. Al hacer clic en \"Tengo 18 años o más\", aceptas estas condiciones y reconoces ser el único responsable de tu acceso al sitio."],
"Tous les contenus diffusés (vidéos, photos, textes, logos) sont protégés par le droit d'auteur et appartiennent à leurs ayants droit respectifs. Toute reproduction, redistribution ou diffusion publique en dehors des fonctionnalités prévues par le site est interdite.": ["All published content (videos, photos, texts, logos) is protected by copyright and belongs to its respective rights holders. Any reproduction, redistribution or public broadcast outside the features provided by the site is prohibited.", "Tout kontni ki difize yo (videyo, foto, tèks, logo) pwoteje pa dwa dotè epi yo se pwopriyete moun ki gen dwa sou yo. Tout repwodiksyon, redistribisyon oswa difizyon piblik andeyò fonksyon sit la prevwa yo entèdi.", "Todo el contenido publicado (videos, fotos, textos, logotipos) está protegido por derechos de autor y pertenece a sus respectivos titulares. Queda prohibida cualquier reproducción, redistribución o difusión pública fuera de las funciones previstas por el sitio."],
"Tous les contenus mettant en scène des personnes sont publiés avec le consentement écrit des intéressé·e·s, qui sont toutes majeures.": ["All content featuring people is published with the written consent of those involved, all of whom are of legal age.", "Tout kontni ki montre moun yo pibliye ak konsantman alekri moun yo, ki tout majè.", "Todo el contenido en el que aparecen personas se publica con el consentimiento por escrito de los interesados, todos ellos mayores de edad."],
"Les abonnements VIP donnent accès à du contenu exclusif, à la lecture sans publicité et aux téléchargements illimités. Les paiements sont effectués via un prestataire sécurisé et sont non remboursables sauf cas prévus par la loi. Vous pouvez résilier à tout moment depuis la page \"Mon Compte\".": ["VIP subscriptions give access to exclusive content, ad-free playback and unlimited downloads. Payments are made through a secure provider and are non-refundable except where provided by law. You can cancel at any time from the \"My Account\" page.", "Abònman VIP yo bay aksè a kontni eksklizif, lekti san piblisite ak telechajman san limit. Peman yo fèt atravè yon founisè sekirize epi yo pa ranbousab sof nan ka lalwa prevwa. Ou ka anile nenpòt ki lè nan paj \"Kont Mwen\" lan.", "Las suscripciones VIP dan acceso a contenido exclusivo, reproducción sin publicidad y descargas ilimitadas. Los pagos se realizan a través de un proveedor seguro y no son reembolsables salvo en los casos previstos por la ley. Puedes cancelar en cualquier momento desde la página \"Mi Cuenta\"."],
"Vos données de connexion (email, identifiant) sont utilisées uniquement pour la gestion de votre compte et de votre abonnement. Aucun contenu visionné n'est partagé avec des tiers. Le site utilise des cookies techniques nécessaires au fonctionnement et à la session.": ["Your login data (email, username) is used only to manage your account and subscription. No viewed content is shared with third parties. The site uses technical cookies required for operation and for your session.", "Done koneksyon ou yo (imèl, idantifyan) sèvi sèlman pou jere kont ou ak abònman w. Pa gen okenn kontni ou gade ki pataje ak twazyèm pati. Sit la itilize bonbon teknik ki nesesè pou fonksyònman ak sesyon an.", "Tus datos de acceso (correo, nombre de usuario) se utilizan únicamente para gestionar tu cuenta y tu suscripción. Ningún contenido visto se comparte con terceros. El sitio utiliza cookies técnicas necesarias para el funcionamiento y la sesión."],
"Les commentaires (anonymes ou non) doivent rester respectueux. Tout propos illégal, haineux, discriminatoire ou menaçant sera supprimé et peut entraîner la suspension du compte. Les comportements visant à mettre en cause la sécurité de mineurs sont signalés aux autorités compétentes.": ["Comments (anonymous or not) must remain respectful. Any illegal, hateful, discriminatory or threatening remarks will be removed and may lead to account suspension. Behavior that endangers the safety of minors is reported to the competent authorities.", "Kòmantè yo (anonim oswa pa) dwe rete respektye. Nenpòt pawòl ilegal, ki gen rayisman, diskriminasyon oswa menas ap efase epi li ka lakòz yo sispann kont lan. Konpòtman ki mete sekirite timoun nan danje yo siyale bay otorite konpetan yo.", "Los comentarios (anónimos o no) deben ser respetuosos. Cualquier comentario ilegal, de odio, discriminatorio o amenazante será eliminado y puede conllevar la suspensión de la cuenta. Los comportamientos que pongan en riesgo la seguridad de menores se comunican a las autoridades competentes."],
"Toute personne identifiant un contenu litigieux (mineur, contenu non consenti, atteinte aux droits) peut le signaler via la page \"Support\" depuis \"Mon Compte\". Les signalements sont traités sous 72 h et donnent lieu, le cas échéant, au retrait immédiat du contenu.": ["Anyone who identifies disputed content (minor, non-consensual content, rights infringement) can report it via the \"Support\" page from \"My Account\". Reports are processed within 72 hours and, where appropriate, lead to immediate removal of the content.", "Nenpòt moun ki idantifye yon kontni ki pwoblèm (minè, kontni san konsantman, vyolasyon dwa) ka siyale l atravè paj \"Sipò\" lan nan \"Kont Mwen\". Siyalman yo trete nan 72 èdtan epi, si sa nesesè, kontni an retire touswit.", "Cualquier persona que identifique contenido controvertido (menor, contenido sin consentimiento, vulneración de derechos) puede denunciarlo desde la página \"Soporte\" en \"Mi Cuenta\". Las denuncias se tramitan en un plazo de 72 h y, en su caso, dan lugar a la retirada inmediata del contenido."],
"Quittez immédiatement ce site. Sur l'écran d'accueil, cliquez sur \"Je suis mineur(e)\". Parlez‑en à un adulte de confiance et activez le contrôle parental sur votre appareil.": ["Leave this site immediately. On the welcome screen, click \"I am a minor\". Talk to a trusted adult and enable parental controls on your device.", "Kite sit sa a touswit. Sou ekran akèy la, klike sou \"Mwen se yon mine\". Pale ak yon granmoun ou fè konfyans epi aktive kontwòl paran sou aparèy ou a.", "Abandona este sitio de inmediato. En la pantalla de inicio, haz clic en \"Soy menor de edad\". Habla con un adulto de confianza y activa el control parental en tu dispositivo."],
"Le live commence !": ["The live is starting!", "Dirèk la kòmanse!", "¡El directo está empezando!"],
"Le live s'est terminé.": ["The live has ended.", "Dirèk la fini.", "El directo ha terminado."],
"Le live doit être actif pour envoyer des réactions.": ["The live must be active to send reactions.", "Dirèk la dwe aktif pou voye reyaksyon.", "El directo debe estar activo para enviar reacciones."],
"Le chat est disponible uniquement lorsque le live est actif.": ["Chat is only available while the live is active.", "Chat la disponib sèlman lè dirèk la aktif.", "El chat solo está disponible mientras el directo está activo."],
"Direct": ["Live", "Dirèk", "Directo"],
"Les réactions et messages s'activeront automatiquement dès que le live commencera.": ["Reactions and messages will activate automatically as soon as the live starts.", "Reyaksyon ak mesaj yo ap aktive otomatikman le dirèk la kòmanse.", "Las reacciones y los mensajes se activarán automáticamente en cuanto comience el directo."],
"Envoyer un message...": ["Send a message...", "Voye yon mesaj...", "Enviar un mensaje..."],
"Live hors-ligne...": ["Live offline...", "Dirèk la offline...", "Directo sin conexión..."],
"Demande envoyée": ["Request sent", "Demann lan voye", "Solicitud enviada"],
"Identifiants incorrects ou adresse e-mail non confirmée.": ["Incorrect credentials or unconfirmed email address.", "Idantifyan yo pa kòrèk oswa adrès imèl la pa konfime.", "Credenciales incorrectas o correo electrónico no confirmado."],
"Cet e-mail est déjà utilisé par un autre compte.": ["This email is already used by another account.", "Imèl sa a deja itilize pa yon lòt kont.", "Este correo ya está en uso en otra cuenta."],
"Compte créé avec succès !": ["Account created successfully!", "Kont lan kreye ak siksè!", "¡Cuenta creada con éxito!"],
"Une erreur est survenue.": ["An error occurred.", "Yon erè fèt.", "Se ha producido un error."],
"Vérification de votre adresse e-mail": ["Verifying your email address", "Verifikasyon adrès imèl ou", "Verificación de tu correo electrónico"],
"Bienvenue ! Connectez-vous à votre compte": ["Welcome! Log in to your account", "Byenvini! Konekte nan kont ou", "¡Bienvenido! Inicia sesión en tu cuenta"],
"Rejoignez la communauté en quelques clics": ["Join the community in a few clicks", "Antre nan kominote a ak kèk klik", "Únete a la comunidad con unos pocos clics"],
"Inscription": ["Sign up", "Enskripsyon", "Registro"],
"Cet e-mail possède déjà un compte.": ["This email already has an account.", "Imèl sa a deja gen yon kont.", "Este correo ya tiene una cuenta."],
"Ton pseudo": ["Your username", "Psedonim ou", "Tu apodo"],
"Oublié ?": ["Forgot?", "Bliye?", "¿Olvidaste?"],
"Créer mon compte": ["Create my account", "Kreye kont mwen", "Crear mi cuenta"],
"Le fichier est trop lourd. Maximum 5 Mo autorisé.": ["The file is too large. Maximum 5 MB allowed.", "Fichye a two gwo. Maksimòm 5 Mo otorize.", "El archivo es demasiado grande. Máximo 5 MB permitidos."],
"Format non supporté. Veuillez envoyer une image (JPG, JPEG ou PNG).": ["Unsupported format. Please upload an image (JPG, JPEG or PNG).", "Fòma pa sipòte. Tanpri voye yon imaj (JPG, JPEG oswa PNG).", "Formato no compatible. Envía una imagen (JPG, JPEG o PNG)."],
"Notifications système activées !": ["System notifications enabled!", "Notifikasyon sistèm yo aktive!", "¡Notificaciones del sistema activadas!"],
"Veuillez autoriser les notifications dans les paramètres de votre navigateur.": ["Please allow notifications in your browser settings.", "Tanpri otorize notifikasyon yo nan paramèt navigatè w la.", "Permite las notificaciones en la configuración de tu navegador."],
"Échec de la souscription aux notifications.": ["Failed to subscribe to notifications.", "Echèk abònman nan notifikasyon yo.", "Error al suscribirse a las notificaciones."],
"Veuillez vous connecter pour soumettre votre paiement.": ["Please log in to submit your payment.", "Tanpri konekte pou soumèt peman w lan.", "Inicia sesión para enviar tu pago."],
"Veuillez téléverser votre reçu de paiement.": ["Please upload your payment receipt.", "Tanpri voye resi peman w lan.", "Sube tu recibo de pago."],
"Action requise : Veuillez activer les notifications système avant d'envoyer.": ["Action required: Please enable system notifications before sending.", "Aksyon obligatwa: Tanpri aktive notifikasyon sistèm yo anvan w voye.", "Acción requerida: activa las notificaciones del sistema antes de enviar."],
"Preuve de paiement reçue avec succès !": ["Proof of payment received successfully!", "Prèv peman an resevwa ak siksè!", "¡Comprobante de pago recibido con éxito!"],
"Une erreur est survenue lors de l'envoi.": ["An error occurred while sending.", "Yon erè fèt pandan voye a.", "Se ha producido un error al enviar."],
"Votre Abonnement VIP est Actif": ["Your VIP Subscription is Active", "Abònman VIP ou an aktif", "Tu suscripción VIP está activa"],
"Choisissez votre formule VIP": ["Choose your VIP plan", "Chwazi fòmil VIP ou a", "Elige tu plan VIP"],
"Merci pour votre confiance ! Vous disposez actuellement d'un accès illimité et sécurisé à l'ensemble de la plateforme.": ["Thank you for your trust! You currently have unlimited, secure access to the entire platform.", "Mèsi pou konfyans ou! Ou gen yon aksè san limit epi sekirize nan tout platfòm nan kounye a.", "¡Gracias por tu confianza! Actualmente tienes acceso ilimitado y seguro a toda la plataforma."],
"Profitez d'un accès illimité aux vidéos et photos HD selon la durée de votre choix.": ["Enjoy unlimited access to HD videos and photos for the duration of your choice.", "Jwi yon aksè san limit nan videyo ak foto HD pou dire ou chwazi a.", "Disfruta de acceso ilimitado a videos y fotos HD durante el tiempo que elijas."],
"S'abonner avec la formule {{plan}} ({{price}}$)": ["Subscribe with the {{plan}} plan ({{price}}$)", "Abòne ak fòmil {{plan}} lan ({{price}}$)", "Suscribirse con el plan {{plan}} ({{price}}$)"],
"Connectez-vous pour vous abonner": ["Log in to subscribe", "Konekte pou w abòne", "Inicia sesión para suscribirte"],
"Explorer le catalogue privé": ["Explore the private catalog", "Eksplore katalòg prive a", "Explorar el catálogo privado"],
"Rejoindre": ["Join", "Rejwenn", "Unirse"],
"{{plan}} ({{usd}} $ USD / ~{{htg}} HTG / {{days}} jours)": ["{{plan}} ({{usd}} $ USD / ~{{htg}} HTG / {{days}} days)", "{{plan}} ({{usd}} $ USD / ~{{htg}} HTG / {{days}} jou)", "{{plan}} ({{usd}} $ USD / ~{{htg}} HTG / {{days}} días)"],
"1. Si vous résidez à l'Étranger (TapTap Send)": ["1. If you live abroad (TapTap Send)", "1. Si w rete aletranje (TapTap Send)", "1. Si resides en el extranjero (TapTap Send)"],
"• Ouvrez l'application <b>TapTap Send</b>.": ["• Open the <b>TapTap Send</b> app.", "• Louvri aplikasyon <b>TapTap Send</b> lan.", "• Abre la aplicación <b>TapTap Send</b>."],
"• Sélectionnez <b>Haïti (+509)</b> comme destination.": ["• Select <b>Haiti (+509)</b> as the destination.", "• Chwazi <b>Ayiti (+509)</b> kòm destinasyon.", "• Selecciona <b>Haití (+509)</b> como destino."],
"• Saisissez le montant exact de la formule : <b>{{price}} $ USD</b>.": ["• Enter the exact plan amount: <b>{{price}} $ USD</b>.", "• Antre montan egzat fòmil lan: <b>{{price}} $ USD</b>.", "• Introduce el importe exacto del plan: <b>{{price}} $ USD</b>."],
"• Envoyez sur le compte NatCash :": ["• Send to the NatCash account:", "• Voye sou kont NatCash lan:", "• Envía a la cuenta NatCash:"],
"• Prenez une capture d'écran claire de votre reçu TapTap Send.": ["• Take a clear screenshot of your TapTap Send receipt.", "• Pran yon kapti ekran klè nan resi TapTap Send ou a.", "• Haz una captura de pantalla clara de tu recibo de TapTap Send."],
"2. Si vous résidez en Haïti (Dépôt / Transfert)": ["2. If you live in Haiti (Deposit / Transfer)", "2. Si w rete an Ayiti (Depo / Transfè)", "2. Si resides en Haití (Depósito / Transferencia)"],
"• Effectuez simplement un <b>dépôt ou un transfert direct</b> d'un montant de <c>{{htg}} HTG</c>.": ["• Simply make a <b>deposit or direct transfer</b> of <c>{{htg}} HTG</c>.", "• Fè tou senpleman yon <b>depo oswa yon transfè dirèk</b> ki gen yon montan <c>{{htg}} HTG</c>.", "• Realiza simplemente un <b>depósito o transferencia directa</b> por un importe de <c>{{htg}} HTG</c>."],
"• Prenez une capture d'écran ou une photo nette du reçu de confirmation de transfert/dépôt.": ["• Take a screenshot or a clear photo of the transfer/deposit confirmation receipt.", "• Pran yon kapti ekran oswa yon foto klè nan resi konfimasyon transfè/depo a.", "• Haz una captura de pantalla o una foto nítida del recibo de confirmación de la transferencia/depósito."],
"← Changer de formule": ["← Change plan", "← Chanje fòmil", "← Cambiar de plan"],
"Cliquez pour choisir un fichier": ["Click to choose a file", "Klike pou chwazi yon fichye", "Haz clic para elegir un archivo"],
"Autorisez les notifications système pour débloquer l'envoi.": ["Allow system notifications to unlock sending.", "Otorize notifikasyon sistèm yo pou debloke voye a.", "Permite las notificaciones del sistema para desbloquear el envío."],
"Activation...": ["Enabling...", "Ap aktive...", "Activando..."],
"Activer les notifications système": ["Enable system notifications", "Aktive notifikasyon sistèm yo", "Activar las notificaciones del sistema"],
"Sécurisation & Envoi...": ["Securing & Sending...", "Sekirizasyon & Voye...", "Protegiendo y enviando..."],
"Envoyer ma preuve ({{priceUsd}}$)": ["Send my proof ({{priceUsd}}$)", "Voye prèv mwen ({{priceUsd}}$)", "Enviar mi comprobante ({{priceUsd}}$)"],
"Votre preuve de paiement pour la formule <b>{{plan}} ({{days}} jours)</b> a été transmise aux administrateurs.": ["Your proof of payment for the <b>{{plan}} ({{days}} days)</b> plan has been sent to the administrators.", "Prèv peman w lan pou fòmil <b>{{plan}} ({{days}} jou)</b> lan voye bay administratè yo.", "Tu comprobante de pago del plan <b>{{plan}} ({{days}} días)</b> se ha enviado a los administradores."],
"Retourner au Catalogue Public": ["Back to the Public Catalog", "Retounen nan Katalòg Piblik la", "Volver al Catálogo Público"],
"Les mots de passe ne correspondent pas": ["Passwords do not match", "Modpas yo pa menm", "Las contraseñas no coinciden"],
"Le mot de passe doit contenir au moins 6 caractères": ["The password must contain at least 6 characters", "Modpas la dwe gen omwen 6 karaktè", "La contraseña debe tener al menos 6 caracteres"],
"Erreur lors de la mise à jour": ["Error while updating", "Erè pandan mizajou a", "Error al actualizar"],
"Mot de passe mis à jour !": ["Password updated!", "Modpas la mete ajou!", "¡Contraseña actualizada!"],
"Nouveau mot de passe": ["New password", "Nouvo modpas", "Nueva contraseña"],
"Vous allez être redirigé vers la page de connexion.": ["You will be redirected to the login page.", "Y ap redirije w nan paj koneksyon an.", "Serás redirigido a la página de inicio de sesión."],
"Choisissez un nouveau mot de passe sécurisé.": ["Choose a new secure password.", "Chwazi yon nouvo modpas ki sekirize.", "Elige una nueva contraseña segura."],
"Mise à jour...": ["Updating...", "Ap mete ajou...", "Actualizando..."],
"Réinitialiser le mot de passe": ["Reset password", "Rekòmanse modpas la", "Restablecer contraseña"],
"Aller à la connexion": ["Go to login", "Ale nan koneksyon an", "Ir al inicio de sesión"],
"Rechercher": ["Search", "Chèche", "Buscar"],
"Résultats pour \"{{debouncedQuery}}\"": ["Results for \"{{debouncedQuery}}\"", "Rezilta pou \"{{debouncedQuery}}\"", "Resultados para \"{{debouncedQuery}}\""],
"Toutes les vidéos": ["All videos", "Tout videyo yo", "Todos los videos"],
"Vous devez vous connecter à votre compte et détenir un pass VIP pour accéder à cet espace exclusif.": ["You must log in to your account and hold a VIP pass to access this exclusive area.", "Ou dwe konekte nan kont ou epi genyen yon pas VIP pou jwenn aksè nan espas eksklizif sa a.", "Debes iniciar sesión en tu cuenta y tener un pase VIP para acceder a este espacio exclusivo."],
"Cet espace regroupe l'intégralité de nos contenus exclusifs. Vous devez posséder un compte VIP actif pour y accéder.": ["This area brings together all of our exclusive content. You must have an active VIP account to access it.", "Espas sa a rasanble tout kontni eksklizif nou yo. Ou dwe gen yon kont VIP aktif pou jwenn aksè.", "Este espacio reúne todos nuestros contenidos exclusivos. Debes tener una cuenta VIP activa para acceder."],
"Tout le contenu": ["All content", "Tout kontni an", "Todo el contenido"],
"Aucun élément trouvé dans la catégorie des {{type}} VIP pour le moment.": ["No items found in the VIP {{type}} category at the moment.", "Pa jwenn okenn eleman nan kategori {{type}} VIP yo pou kounye a.", "No se encontraron elementos en la categoría de {{type}} VIP por el momento."],
"Impossible de copier le lien": ["Unable to copy the link", "Pa kapab kopye lyen an", "No se pudo copiar el enlace"],
"Vous devez être connecté pour aimer cette vidéo": ["You must be logged in to like this video", "Ou dwe konekte pou w renmen videyo sa a", "Debes iniciar sesión para dar me gusta a este video"],
"Merci pour votre soutien !": ["Thank you for your support!", "Mèsi pou sipò w!", "¡Gracias por tu apoyo!"],
"Vous devez être connecté pour partager cette vidéo": ["You must be logged in to share this video", "Ou dwe konekte pou w pataje videyo sa a", "Debes iniciar sesión para compartir este video"],
"Vous devez être connecté pour télécharger": ["You must be logged in to download", "Ou dwe konekte pou w telechaje", "Debes iniciar sesión para descargar"],
"Vidéo VIP Abonnez-vous pour accéder au téléchargement.": ["VIP video. Subscribe to access the download.", "Videyo VIP. Abòne w pou w jwenn aksè a telechajman an.", "Video VIP. Suscríbete para acceder a la descarga."],
"Démarrage du téléchargement...": ["Starting download...", "Telechajman an ap kòmanse...", "Iniciando la descarga..."],
"Téléchargement lancé dans le navigateur !": ["Download started in the browser!", "Telechajman an lanse nan navigatè a!", "¡Descarga iniciada en el navegador!"],
"Téléchargement lancé. {{remaining}} restant(s).": ["Download started. {{remaining}} remaining.", "Telechajman an lanse. Rete {{remaining}}.", "Descarga iniciada. Quedan {{remaining}}."],
"Abonnement VIP requis pour cette vidéo.": ["VIP subscription required for this video.", "Abònman VIP obligatwa pou videyo sa a.", "Se requiere suscripción VIP para este video."],
"Limite atteinte. Revenez demain ou passez VIP pour un accès illimité.": ["Limit reached. Come back tomorrow or go VIP for unlimited access.", "Limit la rive. Tounen demen oswa vin VIP pou aksè san limit.", "Límite alcanzado. Vuelve mañana o hazte VIP para acceso ilimitado."],
"Téléchargement démarré.": ["Download started.", "Telechajman an kòmanse.", "Descarga iniciada."],
"Erreur lors du lancement du téléchargement": ["Error while starting the download", "Erè pandan telechajman an t ap kòmanse", "Error al iniciar la descarga"],
"Vous devez être connecté pour regarder hors ligne": ["You must be logged in to watch offline", "Ou dwe konekte pou w gade offline", "Debes iniciar sesión para ver sin conexión"],
"Démarrage de la sauvegarde offline...": ["Starting offline save...", "Sovgad offline la ap kòmanse...", "Iniciando el guardado sin conexión..."],
"Téléchargement offline : {{pct}}%": ["Offline download: {{pct}}%", "Telechajman offline: {{pct}}%", "Descarga sin conexión: {{pct}}%"],
"Vidéo disponible offline !": ["Video available offline!", "Videyo a disponib offline!", "¡Video disponible sin conexión!"],
"Erreur de téléchargement offline": ["Offline download error", "Erè telechajman offline", "Error de descarga sin conexión"],
"Commentaire ajouté": ["Comment added", "Kòmantè a ajoute", "Comentario agregado"],
"Erreur lors de l'ajout du commentaire": ["Error while adding the comment", "Erè pandan ajoute kòmantè a", "Error al agregar el comentario"],
"Vidéo introuvable": ["Video not found", "Videyo a pa jwenn", "Video no encontrado"],
"J'aime": ["Like", "Renmen", "Me gusta"],
"Partager": ["Share", "Pataje", "Compartir"],
"Téléchargement...": ["Downloading...", "Ap telechaje...", "Descargando..."],
"Télécharger": ["Download", "Telechaje", "Descargar"],
// clés dynamiques (t(variable))
"Accueil": ["Home", "Akèy", "Inicio"],
"Vidéo": ["Video", "Videyo", "Video"],
"Photo": ["Photo", "Foto", "Foto"],
"Groupe WhatsApp VIP 1": ["VIP WhatsApp Group 1", "Gwoup WhatsApp VIP 1", "Grupo de WhatsApp VIP 1"],
"Groupe WhatsApp VIP 2": ["VIP WhatsApp Group 2", "Gwoup WhatsApp VIP 2", "Grupo de WhatsApp VIP 2"],
"Canal officiel Telegram": ["Official Telegram channel", "Kanal Telegram ofisyèl la", "Canal oficial de Telegram"],
};

const S = {
"404.title": ["Page introuvable", "Page not found", "Paj la pa jwenn", "Página no encontrada"],
"404.description": ["La page que vous cherchez n'existe pas. Retournez à l'accueil.", "The page you are looking for does not exist. Go back to the home page.", "Paj w ap chèche a pa egziste. Retounen nan paj akèy la.", "La página que buscas no existe. Vuelve al inicio."],
"404.back_home": ["Aller à l'accueil", "Go to home", "Ale nan paj akèy la", "Ir al inicio"],
"common.title": ["Titre", "Title", "Tit", "Título"],
"common.message": ["Message", "Message", "Mesaj", "Mensaje"],
"common.category": ["Catégorie", "Category", "Kategori", "Categoría"],
"common.vip": ["VIP", "VIP", "VIP", "VIP"],
"common.downloads": ["Téléchargements", "Downloads", "Telechajman", "Descargas"],
"common.home": ["Accueil", "Home", "Akèy", "Inicio"],
"common.account": ["Compte", "Account", "Kont", "Cuenta"],
"common.subject": ["Sujet", "Subject", "Sijè", "Asunto"],
"common.search": ["Recherche", "Search", "Rechèch", "Buscar"],
"common.live": ["En Direct", "Live", "An Dirèk", "En vivo"],
"common.save": ["Enregistrer", "Save", "Anrejistre", "Guardar"],
"common.loading": ["Chargement...", "Loading...", "Ap chaje...", "Cargando..."],
"common.close": ["Fermer", "Close", "Fèmen", "Cerrar"],
"common.error": ["Erreur", "Error", "Erè", "Error"],
"common.error_loading": ["Erreur de chargement", "Loading error", "Erè pandan chajman an", "Error de carga"],
"nav.live_stream": ["En direct", "Live", "An dirèk", "En vivo"],
"nav.become_vip": ["Devenir VIP", "Become VIP", "Vin VIP", "Hazte VIP"],
"nav.my_account": ["Mon Compte", "My Account", "Kont Mwen", "Mi Cuenta"],
"nav.menu": ["Menu", "Menu", "Meni", "Menú"],
"nav.logout": ["Déconnexion", "Log out", "Dekonekte", "Cerrar sesión"],
"nav.login": ["Connexion", "Log in", "Konekte", "Iniciar sesión"],
"footer.navigation": ["Navigation", "Navigation", "Navigasyon", "Navegación"],
"footer.distribution_channels": ["Canaux de distribution", "Distribution channels", "Kanal distribisyon", "Canales de distribución"],
"footer.join_group": ["Rejoindre le groupe", "Join the group", "Antre nan gwoup la", "Unirse al grupo"],
"footer.send_zen_whatsapp": ["Voye yon zen pa WhatsApp", "Send info via WhatsApp", "Voye yon zen pa WhatsApp", "Enviar info por WhatsApp"],
"footer.send_zen_telegram": ["Voye yon zen pa Telegram", "Send info via Telegram", "Voye yon zen pa Telegram", "Enviar info por Telegram"],
"legal.terms": ["Conditions d'utilisation", "Terms of Use", "Kondisyon itilizasyon", "Condiciones de uso"],
"footer.privacy_policy": ["Politique de confidentialité", "Privacy Policy", "Politik konfidansyalite", "Política de privacidad"],
"footer.legal_notice": ["Mentions légales", "Legal Notice", "Mansyon legal", "Aviso legal"],
"footer.adults_only": ["Réservé aux adultes (18+)", "Adults only (18+)", "Rezève pou moun ki gen laj (18+)", "Solo para adultos (18+)"],
"footer.rights_reserved": ["© {{year}} HAITIAN NUD. Tous droits réservés.", "© {{year}} HAITIAN NUD. All rights reserved.", "© {{year}} HAITIAN NUD. Tout dwa rezève.", "© {{year}} HAITIAN NUD. Todos los derechos reservados."],
"watch.comments": ["Commentaires", "Comments", "Kòmantè", "Comentarios"],
"watch.add_comment": ["Ajouter un commentaire...", "Add a comment...", "Ajoute yon kòmantè...", "Añade un comentario..."],
"watch.post_anonymous": ["Publier en anonyme", "Post anonymously", "Poste anonimman", "Publicar de forma anónima"],
"watch.comment_btn": ["Commenter", "Comment", "Kòmante", "Comentar"],
"watch.login_to_discuss": ["Connectez-vous pour participer à la discussion.", "Log in to join the discussion.", "Konekte pou patisipe nan diskisyon an.", "Inicia sesión para participar en la discusión."],
"watch.anonymous": ["Anonyme", "Anonymous", "Anonim", "Anónimo"],
"watch.user": ["Utilisateur", "User", "Itilizatè", "Usuario"],
"watch.first_comment": ["Soyez le premier à commenter.", "Be the first to comment.", "Se ou menm ki pou premye kòmante.", "Sé el primero en comentar."],
"watch.same_category": ["Dans la même catégorie", "In the same category", "Nan menm kategori a", "En la misma categoría"],
"watch.no_similar_videos": ["Aucune vidéo similaire.", "No similar videos.", "Pa gen videyo ki sanble.", "No hay videos similares."],
"watch.private_space": ["Espace Privé & Vidéos VIP", "Private Area & VIP Videos", "Espas Prive & Videyo VIP", "Área Privada y Videos VIP"],
"watch.invalid_id": ["ID de vidéo invalide", "Invalid video ID", "ID videyo a pa valid", "ID de video no válido"],
"watch.invalid_url": ["L'URL de cette vidéo n'est pas valide.", "This video's URL is not valid.", "URL videyo sa a pa valid.", "La URL de este video no es válida."],
"watch.restricted_content": ["Ce contenu est restreint.", "This content is restricted.", "Kontni sa a restrenn.", "Este contenido está restringido."],
"watch.no_video_link": ["Lien de la vidéo introuvable.", "Video link not found.", "Lyen videyo a pa jwenn.", "No se encontró el enlace del video."],
"watch.downloading": ["Téléchargement...", "Downloading...", "Ap telechaje...", "Descargando..."],
"watch.watch_offline": ["Regarder offline", "Watch offline", "Gade offline", "Ver sin conexión"],
"watch.back_home": ["Retour à l'accueil", "Back to home", "Retounen nan paj akèy la", "Volver al inicio"],
"account.email": ["Email", "Email", "Imèl", "Correo electrónico"],
"account.plan": ["Plan", "Plan", "Plan", "Plan"],
"account.free_member": ["Membre Gratuit", "Free Member", "Manm Gratis", "Miembro Gratuito"],
"account.subscription": ["Abonnement", "Subscription", "Abònman", "Suscripción"],
"account.history": ["Historique", "History", "Istorik", "Historial"],
"account.settings": ["Paramètres", "Settings", "Paramèt", "Ajustes"],
"account.support": ["Support", "Support", "Sipò", "Soporte"],
"account.active_sub": ["Abonnement Actif", "Active Subscription", "Abònman Aktif", "Suscripción Activa"],
"account.expires_at": ["Expire le", "Expires on", "Ekspire le", "Vence el"],
"account.free_plan_msg": ["Vous êtes sur le plan Gratuit", "You are on the Free plan", "Ou sou plan Gratis la", "Estás en el plan Gratuito"],
"account.become_vip_now": ["Devenir VIP maintenant", "Become VIP now", "Vin VIP kounye a", "Hazte VIP ahora"],
"account.quota_remaining": ["Quota restant", "Remaining quota", "Kota ki rete", "Cuota restante"],
"account.free_downloads_limit": ["3 téléchargements gratuits par compte", "3 free downloads per account", "3 telechajman gratis pou chak kont", "3 descargas gratuitas por cuenta"],
"account.display_name": ["Nom affiché", "Display name", "Non ki afiche a", "Nombre visible"],
"account.contact_support": ["Contacter le support", "Contact support", "Kontakte sipò a", "Contactar con soporte"],
"account.push_not_supported": ["Les notifications push ne sont pas supportées par votre navigateur.", "Push notifications are not supported by your browser.", "Navigatè w la pa sipòte notifikasyon push yo.", "Tu navegador no admite las notificaciones push."],
"downloads.my_downloads": ["Mes téléchargements", "My downloads", "Telechajman mwen yo", "Mis descargas"],
"downloads.no_downloads": ["Aucune vidéo téléchargée", "No downloaded videos", "Pa gen videyo telechaje", "No hay videos descargados"],
"downloads.browse_videos": ["Parcourir les vidéos", "Browse videos", "Gade videyo yo", "Explorar videos"],
"search.no_results": ["Aucun résultat", "No results", "Pa gen rezilta", "Sin resultados"],
"search.no_results_desc": ["Essayez d'autres mots-clés ou parcourez nos catégories.", "Try other keywords or browse our categories.", "Eseye lòt mo kle oswa gade kategori nou yo.", "Prueba con otras palabras clave o explora nuestras categorías."],
"auth.username": ["Nom d'utilisateur", "Username", "Non itilizatè", "Nombre de usuario"],
"auth.password": ["Mot de passe", "Password", "Modpas", "Contraseña"],
"auth.new_password": ["Nouveau mot de passe", "New password", "Nouvo modpas", "Nueva contraseña"],
"auth.confirm_password": ["Confirmer le mot de passe", "Confirm password", "Konfime modpas la", "Confirmar contraseña"],
"home.new_on_platform": ["Nouveau sur HAITIAN NUD", "New on HAITIAN NUD", "Nouvo sou HAITIAN NUD", "Novedad en HAITIAN NUD"],
"home.exclusive_vip_pass": ["Pass VIP Exclusif", "Exclusive VIP Pass", "Pas VIP Eksklizif", "Pase VIP Exclusivo"],
"plans.premium_active": ["Compte Premium Actif", "Premium Account Active", "Kont Premium Aktif", "Cuenta Premium Activa"],
"plans.welcome_vip": ["Bienvenue dans l'Espace VIP", "Welcome to the VIP Area", "Byenvini nan Espas VIP la", "Bienvenido al Espacio VIP"],
"plans.how_to_pay": ["Comment payer votre abonnement VIP ?", "How to pay for your VIP subscription?", "Kijan pou w peye abònman VIP ou an?", "¿Cómo pagar tu suscripción VIP?"],
"plans.payment_method_used": ["1. Mode de paiement utilisé", "1. Payment method used", "1. Metòd peman ou itilize a", "1. Método de pago utilizado"],
"plans.screenshot_proof": ["2. Capture d'écran ou reçu (Image)", "2. Screenshot or receipt (Image)", "2. Kapti ekran oswa resi (Imaj)", "2. Captura de pantalla o recibo (Imagen)"],
"plans.file_limits": ["PNG, JPG, JPEG jusqu'à 5 Mo", "PNG, JPG, JPEG up to 5 MB", "PNG, JPG, JPEG jiska 5 Mo", "PNG, JPG, JPEG hasta 5 MB"],
"plans.action_required": ["Action Requise :", "Action Required:", "Aksyon Obligatwa:", "Acción Requerida:"],
"plans.thank_you": ["Merci pour votre confiance !", "Thank you for your trust!", "Mèsi pou konfyans ou!", "¡Gracias por tu confianza!"],
"legal.warning_title": ["1. Avertissement — Site pour adultes", "1. Warning — Adult website", "1. Avètisman — Sit pou granmoun", "1. Advertencia — Sitio para adultos"],
"legal.warning_text": ["Haïtien Nud Média est un site web pour adultes. Il peut contenir des images, vidéos et textes à caractère mature, sensuel ou explicite, destinés exclusivement à un public majeur. L'accès est <b>strictement interdit aux mineurs</b>.", "Haitian Nud Média is an adult website. It may contain images, videos and texts of a mature, sensual or explicit nature, intended exclusively for an adult audience. Access is <b>strictly forbidden to minors</b>.", "Haitian Nud Média se yon sit entènèt pou granmoun. Li ka genyen imaj, videyo ak tèks ki gen kontni matirite, sansyèl oswa eksplisit, ki fèt sèlman pou yon piblik majè. Aksè a <b>entèdi nèt pou minè yo</b>.", "Haitian Nud Média es un sitio web para adultos. Puede contener imágenes, videos y textos de carácter maduro, sensual o explícito, destinados exclusivamente a un público adulto. El acceso está <b>estrictamente prohibido a menores</b>."],
"legal.condition_1": ["avoir au moins 18 ans (ou l'âge de la majorité dans votre pays) ;", "be at least 18 years old (or the age of majority in your country);", "gen omwen 18 an (oswa laj majorite nan peyi w la);", "tener al menos 18 años (o la mayoría de edad en tu país);"],
"legal.condition_2": ["visionner ces contenus de votre plein gré, à titre privé ;", "view this content of your own free will, in private;", "gade kontni sa yo ak tout volonte w, an prive;", "ver estos contenidos por voluntad propia y en privado;"],
"legal.condition_3": ["résider dans un pays où ce type de contenu est autorisé par la loi.", "live in a country where this type of content is permitted by law.", "rete nan yon peyi kote lalwa otorize kalite kontni sa a.", "residir en un país donde este tipo de contenido esté permitido por la ley."],
"legal.age_confirmation": ["2. Confirmation d'âge", "2. Age confirmation", "2. Konfimasyon laj", "2. Confirmación de edad"],
"legal.content_property": ["3. Contenus & propriété", "3. Content & ownership", "3. Kontni & pwopriyete", "3. Contenidos y propiedad"],
"legal.vip_payments": ["4. Abonnement VIP & paiements", "4. VIP subscription & payments", "4. Abònman VIP & peman", "4. Suscripción VIP y pagos"],
"legal.privacy_cookies": ["5. Vie privée & cookies", "5. Privacy & cookies", "5. Vi prive & bonbon (cookies)", "5. Privacidad y cookies"],
"legal.comments_behavior": ["6. Commentaires & comportement", "6. Comments & behavior", "6. Kòmantè & konpòtman", "6. Comentarios y comportamiento"],
"legal.report_contact": ["7. Signalement & contact", "7. Reporting & contact", "7. Siyalman & kontak", "7. Denuncias y contacto"],
"legal.if_minor": ["8. Si vous êtes mineur·e", "8. If you are a minor", "8. Si w se yon minè", "8. Si eres menor de edad"],
"date.long": ["dd MMMM yyyy", "MMMM dd, yyyy", "dd MMMM yyyy", "dd 'de' MMMM 'de' yyyy"],
"date.short": ["dd MMM yyyy", "MMM dd, yyyy", "dd MMM yyyy", "dd MMM yyyy"],
"date.datetime": ["dd MMM yyyy 'à' HH:mm", "MMM dd, yyyy 'at' HH:mm", "dd MMM yyyy 'a' HH:mm", "dd MMM yyyy, HH:mm"],
};

// [fr_one, fr_other, en_one, en_other, ht_one, ht_other, es_one, es_other]
const PL = {
"{{views}} vues": ["{{views}} vue", "{{views}} vues", "{{views}} view", "{{views}} views", "{{views}} gade", "{{views}} gade", "{{views}} vista", "{{views}} vistas"],
"{{count}} vidéos au total": ["{{count}} vidéo au total", "{{count}} vidéos au total", "{{count}} video in total", "{{count}} videos in total", "{{count}} videyo an total", "{{count}} videyo an total", "{{count}} video en total", "{{count}} videos en total"],
"{{count}} résultats": ["{{count}} résultat", "{{count}} résultats", "{{count}} result", "{{count}} results", "{{count}} rezilta", "{{count}} rezilta", "{{count}} resultado", "{{count}} resultados"],
"{{count}} caractères": ["{{count}} caractère", "{{count}} caractères", "{{count}} character", "{{count}} characters", "{{count}} karaktè", "{{count}} karaktè", "{{count}} carácter", "{{count}} caracteres"],
};

// corrections de valeurs existantes
const FIX = { ht: { "Passer la pub": "Sote piblisite a" } };
// clés devenues inutiles
const REMOVE = ["Votre preuve de paiement pour la formule"];

module.exports = { N, S, PL, FIX, REMOVE };

TR_EOF

cat > "$TMP/merge-json.cjs" <<'MG_EOF'
const fs=require('fs'),path=require('path');
const dir=path.resolve(process.argv[2]);const {N,S,PL,FIX,REMOVE}=require(require('path').resolve(process.argv[3]));
const L=['fr','en','ht','es'];const D={};
for(const l of L)D[l]=JSON.parse(fs.readFileSync(path.join(dir,l+'.json'),'utf8'));
const add=(l,k,v)=>{ if(!(k in D[l])) D[l][k]=v; };
for(const [k,[en,ht,es]] of Object.entries(N)){add('fr',k,k);add('en',k,en);add('ht',k,ht);add('es',k,es);}
for(const [k,[fr,en,ht,es]] of Object.entries(S)){add('fr',k,fr);add('en',k,en);add('ht',k,ht);add('es',k,es);}
for(const [k,v] of Object.entries(PL)){const idx={fr:0,en:2,ht:4,es:6};for(const l of L){const i=idx[l];add(l,k,v[i+1]);add(l,k+'_one',v[i]);add(l,k+'_other',v[i+1]);}}
for(const l of Object.keys(FIX))for(const [k,v] of Object.entries(FIX[l]))if(k in D[l])D[l][k]=v;
for(const l of L)for(const k of REMOVE)delete D[l][k];
for(const l of L){const o={};Object.keys(D[l]).sort((a,b)=>a.localeCompare(b,'fr')).forEach(k=>o[k]=D[l][k]);fs.writeFileSync(path.join(dir,l+'.json'),JSON.stringify(o,null,2)+'\n');}
console.log('merged',Object.keys(D.fr).length,'keys');

MG_EOF

echo "1/3 Test à blanc du patch…"
patch -p1 -d src --dry-run -s < "$TMP/code.patch" || { echo "Le patch ne s'applique pas (fichiers modifiés depuis l'archive ?). Rien n'a été changé."; exit 1; }
echo "2/3 Application du patch (code)…"
patch -p1 -d src -s < "$TMP/code.patch"
echo "3/3 Fusion des JSON (fr/en/ht/es)…"
node "$TMP/merge-json.cjs" src/locales "$TMP/translations.cjs"
echo "OK. Vérifie avec :  npx tsc --noEmit && npm run dev"
echo "Retour arrière :  rm -rf src && mv $BK/src src"
