import { Header } from "./header";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { AgeGate } from "./age-gate";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <AgeGate />
      <Header />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
