import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
