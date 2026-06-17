import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { confirmAge } from "@/lib/supabase-db";

export function AgeGate() {
  const [open, setOpen] = useState(false);
  const { isSignedIn, user, appUser, refreshUser } = useAuth();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const isConfirmed = localStorage.getItem("haitian_nud_age_confirmed") === "true";
    if (!isConfirmed && !new URLSearchParams(window.location.search).has("skipAge")) {
      setOpen(true);
    } else {
      localStorage.setItem("haitian_nud_age_confirmed", "true");
    }
  }, []);

  const handleConfirm = async () => {
    localStorage.setItem("haitian_nud_age_confirmed", "true");
    setOpen(false);
    if (isSignedIn && user && !appUser?.ageConfirmed) {
      setConfirming(true);
      try {
        await confirmAge(user.id);
        await refreshUser();
      } catch {
        // silently ignore
      } finally {
        setConfirming(false);
      }
    }
  };

  const handleReject = () => {
    window.location.href = "https://google.com";
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-border bg-card text-card-foreground shadow-2xl [&>button]:hidden">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-2xl font-bold">18+</span>
          </div>
          <DialogTitle className="text-2xl font-serif text-center">Avertissement</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Réservé aux adultes (18+). Mineurs interdits.
            <br/><br/>
            Ce site peut contenir du contenu mature. Vous devez avoir 18 ans ou plus pour entrer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
          <Button variant="outline" className="w-full" onClick={handleReject}>
            Je suis mineur(e)
          </Button>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={handleConfirm} disabled={confirming}>
            {confirming ? "Validation..." : "J'ai 18 ans ou plus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
