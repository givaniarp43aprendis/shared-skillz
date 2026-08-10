import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import type { ServiceWithStats } from "@/lib/vi-types";

interface ServiceCardProps {
  servico: ServiceWithStats;
}

export function ServiceCard({ servico }: ServiceCardProps) {
  const iniciais = (servico.provider_name ?? "?")
    .split(" ")
    .map((s: string) => s[0])
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
          {servico.image_url ? (
            <img
              src={servico.image_url}
              alt={servico.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Sem foto
            </div>
          )}
          {servico.category && (
            <Badge className="absolute left-3 top-3 bg-background/95 text-foreground hover:bg-background">
              {servico.category}
            </Badge>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
              {servico.title}
            </h3>
            <StarRating value={servico.rating_avg} total={servico.rating_count} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={servico.provider_avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{iniciais}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {servico.provider_name ?? "Vizinho"}
              </span>
            </div>
            {servico.provider_neighborhood && (
              <span className="truncate text-xs text-muted-foreground">
                {servico.provider_neighborhood}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
