import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/lib/vi-types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/perfil")({
  component: MeuPerfil,
});

function MeuPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", neighborhood: "", avatar_url: "" });

  const { data: perfil } = useQuery({
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Profile | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (perfil) {
      setForm({
        name: perfil.name ?? "",
        neighborhood: perfil.neighborhood ?? "",
        avatar_url: perfil.avatar_url ?? "",
      });
    }
  }, [perfil]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: form.name || null,
        neighborhood: form.neighborhood || null,
        avatar_url: form.avatar_url || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil salvo!");
      qc.invalidateQueries({ queryKey: ["perfil"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Como seus vizinhos vão te ver na plataforma
        </p>
      </div>

      <Card className="max-w-xl p-6 shadow-card">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={form.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(form.name || user?.email || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">
              {form.name || "Sem nome"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Como seus vizinhos vão te chamar"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              placeholder="Ex: Vila Madalena"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">URL da foto</Label>
            <Input
              id="avatar"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <Button
            type="submit"
            disabled={salvar.isPending}
            className="bg-gradient-hero text-white hover:opacity-90"
          >
            {salvar.isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
