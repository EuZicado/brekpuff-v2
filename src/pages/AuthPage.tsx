import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeClosed, Lightning } from "@phosphor-icons/react";
import logo from "@/assets/brek.svg";

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/usuario/minha-conta", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Acesso liberado.");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username: email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Confira seu e-mail (inclusive spam).");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <section className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6 py-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="brekpuff"
            className="mx-auto h-20 w-20 mb-4 animate-pulse drop-shadow-[0_0_8px_theme(colors.primary)]"
          />
          <h1 className="text-3xl font-black uppercase tracking-widest text-primary">
            {isLogin ? "ENTRAR" : "CADASTRAR"}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {isLogin ? "acessa tua conta." : "cria tua conta."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">NOME DE USUÁRIO</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Como quer ser chamado"
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">E-MAIL</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">SENHA</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <Lightning className="animate-pulse" size={20} />
            ) : isLogin ? (
              "ENTRAR"
            ) : (
              "CRIAR CONTA"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin((s) => !s)}
            className="font-bold text-primary hover:underline"
          >
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>

        <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
          Embalagem neutra · Pagamento anônimo · Sem rastros
        </p>
      </div>
    </section>
  );
}
