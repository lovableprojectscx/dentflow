import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
