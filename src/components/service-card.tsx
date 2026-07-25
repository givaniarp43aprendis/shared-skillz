import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import type { ServicoDestaque } from "@/integrations/supabase/types";

interface ServiceCardProps {
  servico: ServicoDestaque;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ServiceCard({ servico }: ServiceCardProps) {
  const iniciais = (servico.prestador_nome ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/servico/$id"
      params={{ id: String(servico.id) }}
      className="group block focus:outline-none"
    >
      <Card className="overflow-hidden border-border/60 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {servico.foto ? (
            <img
              src={servico.foto}
              alt={servico.titulo}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Sem foto
            </div>
          )}
          {servico.categoria && (
            <Badge className="absolute left-3 top-3 bg-background/95 text-foreground hover:bg-background">
              {servico.categoria}
            </Badge>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
              {servico.titulo}
            </h3>
            <StarRating
              value={servico.nota_media}
              total={servico.total_avaliacoes}
              size="sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={servico.prestador_avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{iniciais}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {servico.prestador_nome ?? "Vizinho"}
              </span>
            </div>
            {servico.preco != null && (
              <span className="text-sm font-semibold text-primary">
                {brl.format(servico.preco)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
