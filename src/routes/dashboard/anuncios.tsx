import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Servico } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/anuncios")({
  component: MeusAnuncios,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function MeusAnuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", categoria: "", preco: "" });

  const { data: anuncios, isLoading } = useQuery({
    queryKey: ["meus-servicos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Servico[];
    },
    enabled: !!user,
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("servicos").insert({
        user_id: user.id,
        titulo: form.titulo,
        descricao: form.descricao,
        categoria: form.categoria || null,
        preco: form.preco ? Number(form.preco) : null,
        ativo: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio criado!");
      setOpen(false);
      setForm({ titulo: "", descricao: "", categoria: "", preco: "" });
      qc.invalidateQueries({ queryKey: ["meus-servicos"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio excluído");
      qc.invalidateQueries({ queryKey: ["meus-servicos"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus anúncios</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os serviços que você oferece
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-hero text-white hover:opacity-90">
              <Plus className="mr-1.5 h-4 w-4" /> Novo anúncio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo anúncio</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                criar.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Reformas, Aulas..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={criar.isPending}
                  className="bg-gradient-hero text-white"
                >
                  {criar.isPending ? "Salvando..." : "Publicar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (anuncios ?? []).length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Você ainda não tem anúncios.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {anuncios!.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {a.fotos?.[0] && (
                    <img src={a.fotos[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/servico/$id"
                      params={{ id: String(a.id) }}
                      className="truncate font-semibold text-foreground hover:text-primary"
                    >
                      {a.titulo}
                    </Link>
                    {!a.ativo && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {a.categoria && <span>{a.categoria}</span>}
                    {a.preco != null && (
                      <span className="font-medium text-primary">{brl.format(a.preco)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Excluir este anúncio?")) excluir.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
