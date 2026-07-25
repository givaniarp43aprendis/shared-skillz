import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, MessageCircle, PackageOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard/anuncios", label: "Meus anúncios", icon: PackageOpen },
  { to: "/dashboard/favoritos", label: "Favoritos", icon: Heart },
  { to: "/dashboard/mensagens", label: "Mensagens", icon: MessageCircle },
] as const;

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
