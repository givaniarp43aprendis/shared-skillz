import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Service } from "@/lib/vi-types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/anuncios")({
  component: MeusAnuncios,
});

const VAZIO = {
  title: "",
  description: "",
  category: "",
  phone: "",
  image_url: "",
};

function MeusAnuncios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(VAZIO);

  const { data: anuncios, isLoading } = useQuery({
    queryKey: ["meus-servicos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Service[];
    },
    enabled: !!user,
  });

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(VAZIO);
    setOpen(true);
  };

  const abrirEdicao = (s: Service) => {
    setEditandoId(s.id);
    setForm({
      title: s.title,
      description: s.description ?? "",
      category: s.category ?? "",
      phone: s.phone ?? "",
      image_url: s.image_url ?? "",
    });
    setOpen(true);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const payload = {
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        phone: form.phone || null,
        image_url: form.image_url || null,
      };
      if (editandoId) {
        const { error } = await supabase
          .from("services")
          .update(payload as never)
          .eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert({ ...payload, user_id: user.id } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editandoId ? "Anúncio atualizado!" : "Anúncio criado!");
      setOpen(false);
      setEditandoId(null);
      setForm(VAZIO);
      qc.invalidateQueries({ queryKey: ["meus-servicos"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio excluído");
      qc.invalidateQueries({ queryKey: ["meus-servicos"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
        <Button onClick={abrirNovo} className="bg-gradient-hero text-white hover:opacity-90">
          <Plus className="mr-1.5 h-4 w-4" /> Novo anúncio
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editandoId ? "Editar anúncio" : "Criar novo anúncio"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                salvar.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Reformas, Aulas..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 90000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL da imagem</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={salvar.isPending}
                  className="bg-gradient-hero text-white"
                >
                  {salvar.isPending ? "Salvando..." : editandoId ? "Salvar" : "Publicar"}
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
                  {a.image_url && (
                    <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/servico/$id"
                      params={{ id: String(a.id) }}
                      className="truncate font-semibold text-foreground hover:text-primary"
                    >
                      {a.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {a.category && <span>{a.category}</span>}
                    {a.phone && <span>{a.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => abrirEdicao(a)}>
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
