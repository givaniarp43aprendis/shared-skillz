import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Vizinho Indica" },
      { name: "description", content: "Acesse sua conta no Vizinho Indica." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard/anuncios" });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/dashboard/anuncios" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Verifique seu e-mail.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-white shadow-sm">
            <Home className="h-4 w-4" />
          </div>
          Vizinho Indica
        </Link>

        <Card className="p-6 shadow-card">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-hero text-white hover:opacity-90"
                  size="lg"
                >
                  {busy ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-s">Nome</Label>
                  <Input
                    id="nome-s"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como seus vizinhos vão te chamar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-s">E-mail</Label>
                  <Input
                    id="email-s"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-s">Senha</Label>
                  <Input
                    id="senha-s"
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-hero text-white hover:opacity-90"
                  size="lg"
                >
                  {busy ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
