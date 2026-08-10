import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { StarRating } from "@/components/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile, Review, ReviewWithAuthor, Service } from "@/lib/vi-types";
import { toast } from "sonner";

export const Route = createFileRoute("/servico/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do serviço — Vizinho Indica" },
      {
        name: "description",
        content: "Veja detalhes, avaliações e contato do serviço oferecido por um vizinho.",
      },
      { property: "og:title", content: "Detalhes do serviço — Vizinho Indica" },
      {
        property: "og:description",
        content: "Veja detalhes, avaliações e contato do serviço oferecido por um vizinho.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { id: servicoId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["service", servicoId],
    queryFn: async () => {
      const { data: servico, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", servicoId)
        .maybeSingle();
      if (error) throw error;
      if (!servico) return null;

      const [{ data: prestador }, { data: avaliacoes }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", (servico as Service).user_id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("*, profiles(name, avatar_url)")
          .eq("service_id", servicoId)
          .order("created_at", { ascending: false }),
      ]);

      const reviews = (avaliacoes ?? []) as unknown as ReviewWithAuthor[];
      const notas = reviews.map((a) => a.rating);
      const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      return {
        servico: servico as unknown as Service,
        prestador: (prestador ?? null) as Profile | null,
        avaliacoes: reviews,
        media,
        total: notas.length,
      };
    },
  });

  const avaliar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("reviews").insert({
        service_id: servicoId,
        user_id: user.id,
        rating: nota,
        comment: comentario || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação enviada!");
      setComentario("");
      setNota(5);
      qc.invalidateQueries({ queryKey: ["service", servicoId] });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "Você já avaliou este serviço."
          : "Não foi possível enviar sua avaliação.",
      ),
  });

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
  const iniciais = (prestador?.name ?? "?")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const jaAvaliou = !!user && avaliacoes.some((a: Review) => a.user_id === user.id);

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
                {servico.image_url ? (
                  <img
                    src={servico.image_url}
                    alt={servico.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Sem foto
                  </div>
                )}
              </div>
            </div>

            <div>
              {servico.category && (
                <Badge variant="secondary" className="mb-3">
                  {servico.category}
                </Badge>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {servico.title}
              </h1>
              <div className="mt-3 flex items-center gap-4">
                <StarRating value={media} total={total} size="lg" />
              </div>
              <Separator className="my-6" />
              <div className="prose prose-slate max-w-none">
                <h2 className="mb-2 text-lg font-semibold">Descrição</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {servico.description ?? "Sem descrição."}
                </p>
              </div>
            </div>

            {/* Avaliações */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Avaliações {total > 0 && <span className="text-muted-foreground">({total})</span>}
              </h2>

              {user && !jaAvaliou && servico.user_id !== user.id && (
                <Card className="mb-4 p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      avaliar.mutate();
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNota(n)}
                          aria-label={`${n} estrelas`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              n <= nota
                                ? "fill-[var(--star)] text-[var(--star)]"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={3}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Conte como foi sua experiência com este vizinho..."
                    />
                    <Button
                      type="submit"
                      disabled={avaliar.isPending}
                      className="bg-gradient-hero text-white hover:opacity-90"
                    >
                      {avaliar.isPending ? "Enviando..." : "Enviar avaliação"}
                    </Button>
                  </form>
                </Card>
              )}

              {!user && (
                <Card className="mb-4 flex items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted-foreground">
                    Entre na sua conta para avaliar este serviço.
                  </p>
                  <Button variant="outline" onClick={() => navigate({ to: "/auth" })}>
                    Entrar
                  </Button>
                </Card>
              )}

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
                            <AvatarImage src={av.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {(av.profiles?.name ?? "V").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {av.profiles?.name ?? "Vizinho"}
                          </span>
                        </div>
                        <StarRating value={av.rating} showNumber={false} size="sm" />
                      </div>
                      {av.comment && (
                        <p className="text-sm text-muted-foreground">{av.comment}</p>
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
                    {prestador?.name ?? "Vizinho"}
                  </div>
                  {prestador?.neighborhood && (
                    <div className="truncate text-xs text-muted-foreground">
                      {prestador.neighborhood}
                    </div>
                  )}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                {servico.phone ? (
                  <Button
                    asChild
                    className="w-full bg-gradient-hero text-white hover:opacity-90"
                    size="lg"
                  >
                    <a href={`tel:${servico.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {servico.phone}
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este vizinho não informou telefone de contato.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
