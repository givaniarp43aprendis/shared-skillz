import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { StarRating } from "@/components/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/servico/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Serviço #${params.id} — Vizinho Indica` },
      { name: "description", content: "Detalhes do serviço no Vizinho Indica." },
    ],
  }),
  component: ServiceDetailPage,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ServiceDetailPage() {
  const { id } = Route.useParams();
  const servicoId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fotoAtiva, setFotoAtiva] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["servico", servicoId],
    queryFn: async () => {
      const { data: servico, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", servicoId)
        .maybeSingle();
      if (error) throw error;
      if (!servico) return null;

      const [{ data: prestador }, { data: avaliacoes }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", servico.user_id).maybeSingle(),
        supabase
          .from("avaliacoes")
          .select("*")
          .eq("servico_id", servicoId)
          .order("created_at", { ascending: false }),
      ]);

      const notas = (avaliacoes ?? []).map((a) => a.nota);
      const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      return { servico, prestador, avaliacoes: avaliacoes ?? [], media, total: notas.length };
    },
  });

  const handleChat = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!data?.servico) return;
    navigate({
      to: "/dashboard/mensagens",
      search: { com: data.servico.user_id, servico: servicoId } as never,
    });
  };

  const handleFavoritar = async () => {
    if (!user) return navigate({ to: "/auth" });
    const { error } = await supabase
      .from("favoritos")
      .insert({ user_id: user.id, servico_id: servicoId });
    if (error) toast.error("Não foi possível favoritar");
    else toast.success("Adicionado aos favoritos");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data?.servico) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Serviço não encontrado</h1>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { servico, prestador, avaliacoes, media, total } = data;
  const fotos = servico.fotos ?? [];
  const iniciais = (prestador?.nome ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Esquerda */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-card shadow-card">
              <div className="relative aspect-video bg-muted">
                {fotos[fotoAtiva] ? (
                  <img
                    src={fotos[fotoAtiva]}
                    alt={servico.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Sem foto
                  </div>
                )}
              </div>
              {fotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {fotos.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setFotoAtiva(i)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                        fotoAtiva === i ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={f} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {servico.categoria && (
                <Badge variant="secondary" className="mb-3">
                  {servico.categoria}
                </Badge>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {servico.titulo}
              </h1>
              <div className="mt-3 flex items-center gap-4">
                <StarRating value={media} total={total} size="lg" />
                {servico.preco != null && (
                  <span className="text-xl font-bold text-primary">
                    {brl.format(servico.preco)}
                  </span>
                )}
              </div>
              <Separator className="my-6" />
              <div className="prose prose-slate max-w-none">
                <h2 className="mb-2 text-lg font-semibold">Descrição</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {servico.descricao ?? "Sem descrição."}
                </p>
              </div>
            </div>

            {/* Avaliações */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Avaliações {total > 0 && <span className="text-muted-foreground">({total})</span>}
              </h2>
              {avaliacoes.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  Ainda não há avaliações.
                </Card>
              ) : (
                <div className="space-y-3">
                  {avaliacoes.map((av) => (
                    <Card key={av.id} className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">V</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">Vizinho</span>
                        </div>
                        <StarRating value={av.nota} showNumber={false} size="sm" />
                      </div>
                      {av.comentario && (
                        <p className="text-sm text-muted-foreground">{av.comentario}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Direita (sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={prestador?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">
                    {prestador?.nome ?? "Vizinho"}
                  </div>
                  {prestador?.condominio && (
                    <div className="truncate text-xs text-muted-foreground">
                      {prestador.condominio}
                    </div>
                  )}
                </div>
              </div>
              {prestador?.bio && (
                <p className="mt-3 text-sm text-muted-foreground">{prestador.bio}</p>
              )}
              <Separator className="my-4" />
              <div className="space-y-2">
                <Button
                  onClick={handleChat}
                  className="w-full bg-gradient-hero text-white hover:opacity-90"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chamar no Chat
                </Button>
                <Button
                  onClick={handleFavoritar}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Favoritar
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
