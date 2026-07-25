import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Mensagem } from "@/lib/vi-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/mensagens")({
  validateSearch: (s: Record<string, unknown>) => ({
    com: typeof s.com === "string" ? s.com : undefined,
    servico: typeof s.servico === "number" ? s.servico : undefined,
  }),
  component: MensagensPage,
});

function MensagensPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { com } = Route.useSearch();
  const [selecionado, setSelecionado] = useState<string | null>(com ?? null);
  const [texto, setTexto] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (com) setSelecionado(com);
  }, [com]);

  const { data: mensagens } = useQuery({
    queryKey: ["mensagens", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
    enabled: !!user,
  });

  const conversas = useMemo(() => {
    if (!user || !mensagens) return [];
    const map = new Map<string, { peer: string; ultima: Mensagem }>();
    for (const m of mensagens) {
      const peer = m.remetente_id === user.id ? m.destinatario_id : m.remetente_id;
      const prev = map.get(peer);
      if (!prev || new Date(m.created_at) > new Date(prev.ultima.created_at)) {
        map.set(peer, { peer, ultima: m });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.ultima.created_at).getTime() - new Date(a.ultima.created_at).getTime(),
    );
  }, [mensagens, user]);

  const conversaAtual = useMemo(() => {
    if (!user || !mensagens || !selecionado) return [];
    return mensagens.filter(
      (m) =>
        (m.remetente_id === user.id && m.destinatario_id === selecionado) ||
        (m.destinatario_id === user.id && m.remetente_id === selecionado),
    );
  }, [mensagens, selecionado, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversaAtual.length]);

  const enviar = useMutation({
    mutationFn: async () => {
      if (!user || !selecionado || !texto.trim()) return;
      const { error } = await supabase.from("mensagens").insert({
        remetente_id: user.id,
        destinatario_id: selecionado,
        conteudo: texto.trim(),
        lida: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["mensagens"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
        <p className="text-sm text-muted-foreground">Suas conversas com vizinhos</p>
      </div>

      <Card className="grid h-[600px] grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
        {/* Lista */}
        <div className="border-b border-border md:border-b-0 md:border-r">
          <div className="border-b px-4 py-3 text-sm font-semibold">Conversas</div>
          <div className="max-h-[540px] overflow-y-auto">
            {conversas.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Sem conversas ainda.
              </p>
            ) : (
              conversas.map(({ peer, ultima }) => (
                <button
                  key={peer}
                  onClick={() => setSelecionado(peer)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors",
                    selecionado === peer ? "bg-primary/10" : "hover:bg-accent",
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {peer.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">Vizinho</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {ultima.conteudo}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex flex-col">
          {selecionado ? (
            <>
              <div className="border-b px-4 py-3 text-sm font-semibold">Conversa</div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
                {conversaAtual.map((m) => {
                  const mine = m.remetente_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {m.conteudo}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar.mutate();
                }}
                className="flex gap-2 border-t p-3"
              >
                <Input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-hero text-white"
                  disabled={!texto.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
