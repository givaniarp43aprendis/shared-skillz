import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/external-client";
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

  const fileRef = useRef<HTMLInputElement>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const redimensionar = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Imagem inválida"));
        img.onload = () => {
          const max = 256;
          const escala = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas indisponível"));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const persistir = async (dados: {
    name: string | null;
    neighborhood: string | null;
    avatar_url: string | null;
  }) => {
    if (!user) throw new Error("Não autenticado");
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...dados } as never, { onConflict: "id" })
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error(
        "Não foi possível salvar o perfil (sem permissão para gravar). Saia e entre novamente.",
      );
    }
    const perfilSalvo = data as unknown as Profile;
    qc.setQueryData(["perfil", user.id], perfilSalvo);
    return perfilSalvo;
  };

  const trocarFoto = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    setEnviandoFoto(true);
    try {
      // 1) Redimensiona e converte para JPEG
      const dataUrl = await redimensionar(file);
      const blob = await (await fetch(dataUrl)).blob();

      // 2) Faz o upload real para o Storage (bucket "avatars")
      const caminho = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: erroUpload } = await supabase.storage
        .from("avatars")
        .upload(caminho, blob, { upsert: true, contentType: "image/jpeg" });
      if (erroUpload) {
        throw new Error(
          `Falha no upload da foto: ${erroUpload.message}. Verifique se o bucket público "avatars" existe no seu Supabase.`,
        );
      }

      // 3) Usa a URL pública real
      const url = supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
      if (!url || url.startsWith("data:")) {
        throw new Error("Não foi possível obter a URL pública da imagem.");
      }

      setForm((f) => ({ ...f, avatar_url: url }));

      // 4) Salva a URL na tabela profiles
      await persistir({
        name: form.name || null,
        neighborhood: form.neighborhood || null,
        avatar_url: url,
      });
      toast.success("Foto atualizada!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviandoFoto(false);
    }
  };

  const salvar = useMutation({
    mutationFn: async () =>
      persistir({
        name: form.name || null,
        neighborhood: form.neighborhood || null,
        avatar_url: form.avatar_url || null,
      }),
    onSuccess: () => {
      toast.success("Perfil salvo!");
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
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={enviandoFoto}
            aria-label="Alterar foto de perfil"
            title="Alterar foto de perfil"
            className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="h-16 w-16">
              <AvatarImage src={form.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {(form.name || user?.email || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 text-background opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
            {enviandoFoto && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/60 text-[10px] font-medium text-background">
                ...
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void trocarFoto(file);
            }}
          />
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
