import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { ServiceCard } from "@/components/service-card";
import { supabase } from "@/integrations/supabase/external-client";
import { toServiceWithStats, type ServiceRow, type ServiceWithStats } from "@/lib/vi-types";

const CATEGORIAS = ["Reformas", "Aulas", "Culinária", "Beleza", "Pets", "Limpeza"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vizinho Indica — Serviços de confiança no seu bairro" },
      {
        name: "description",
        content:
          "Marketplace comunitário para encontrar prestadores de serviço avaliados por vizinhos do seu bairro.",
      },
      { property: "og:title", content: "Vizinho Indica" },
      {
        property: "og:description",
        content: "Encontre profissionais de confiança no seu bairro.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

async function fetchServicos(): Promise<ServiceWithStats[]> {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, user_id, title, description, category, image_url, created_at, profiles(name, avatar_url, neighborhood), reviews(rating)",
    )
    .order("created_at", { ascending: false })
    .limit(48);
  if (error) throw error;
  return ((data ?? []) as unknown as ServiceRow[]).map(toServiceWithStats);
}

function HomePage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const { data: servicos, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServicos,
  });

  const vistos = new Set<string>();
  const unicos = (servicos ?? []).filter((s) => {
    const chaveId = `id:${s.id}`;
    const chaveImg = s.image_url ? `img:${s.image_url}` : null;
    if (vistos.has(chaveId) || (chaveImg && vistos.has(chaveImg))) return false;
    vistos.add(chaveId);
    if (chaveImg) vistos.add(chaveImg);
    return true;
  });

  const filtrados = unicos.filter((s) => {
    const okBusca = busca
      ? s.title.toLowerCase().includes(busca.toLowerCase()) ||
        (s.category ?? "").toLowerCase().includes(busca.toLowerCase())
      : true;
    const okCat = categoria ? s.category === categoria : true;
    return okBusca && okCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white,transparent_50%)] opacity-15" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20 lg:py-24">
          <Badge className="mb-6 border-white/30 bg-white/15 text-white backdrop-blur">
            Comunidade verificada
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Encontre profissionais de confiança no seu bairro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-white/85 sm:text-lg">
            Serviços indicados e avaliados por vizinhos de verdade.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/10">
            <div className="flex flex-1 items-center gap-2 pl-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="O que você precisa? Ex: pintura, aula de inglês..."
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Buscar
            </Button>
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            <button
              onClick={() => setCategoria(null)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition ${
                categoria === null
                  ? "border-white bg-white text-primary"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(categoria === c ? null : c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition ${
                  categoria === c
                    ? "border-white bg-white text-primary"
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section id="servicos" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Destaques da vizinhança</h2>
            <p className="text-sm text-muted-foreground">
              Serviços publicados e avaliados pelos vizinhos
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível carregar os serviços. Tente novamente em instantes.
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Nenhum serviço encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((s) => (
              <ServiceCard key={s.id} servico={s} />
            ))}
          </div>
        )}
      </section>

      {/* FAB mobile */}
      <Link
        to="/dashboard/anuncios"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-gradient-hero px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-primary/40 transition hover:scale-105 md:hidden"
      >
        <PlusCircle className="h-5 w-5" />
        Anunciar
      </Link>
    </div>
  );
}
