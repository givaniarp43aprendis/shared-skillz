import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ServiceCard } from "@/components/service-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ServicoDestaque } from "@/lib/vi-types";

export const Route = createFileRoute("/dashboard/favoritos")({
  component: FavoritosPage,
});

function FavoritosPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: favs, error } = await supabase
        .from("favoritos")
        .select("servico_id")
        .eq("user_id", user.id);
      if (error) throw error;
      const ids = (favs ?? []).map((f) => f.servico_id);
      if (!ids.length) return [];
      const { data: servicos } = await supabase
        .from("v_servicos_destaque")
        .select("*")
        .in("id", ids);
      return (servicos ?? []) as ServicoDestaque[];
    },
    enabled: !!user,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Favoritos</h1>
        <p className="text-sm text-muted-foreground">Serviços que você salvou</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Você ainda não favoritou nenhum serviço.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data!.map((s) => (
            <ServiceCard key={s.id} servico={s} />
          ))}
        </div>
      )}
    </div>
  );
}
