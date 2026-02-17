import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/components/ProductCard";
import { toast } from "sonner";
import { SignOut, User, MapPin, Package, Plus, Trash, ShieldCheck } from "@phosphor-icons/react";

interface Address {
  id: string;
  label: string;
  street: string;
  number: string | null;
  city: string;
  state: string;
  zip: string;
  is_default: boolean | null;
}

interface Order {
  id: string;
  status: string;
  total_cents: number;
  payment_method: string | null;
  created_at: string;
  pix_qr_code: string | null;
}

type Tab = "profile" | "orders" | "addresses" | "security";

export default function AccountPage() {
  const { user, profile, isAdmin, signOut, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [saving, setSaving] = useState(false);

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [aLabel, setALabel] = useState("Casa");
  const [aZip, setAZip] = useState("");
  const [aStreet, setAStreet] = useState("");
  const [aNumber, setANumber] = useState("");
  const [aCity, setACity] = useState("");
  const [aState, setAState] = useState("");

  // Password
  const [newPass, setNewPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setEditName(profile?.full_name ?? "");
    setEditUsername(profile?.username ?? "");
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("id, status, total_cents, payment_method, created_at, pix_qr_code").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
    ]).then(([ordRes, addrRes]) => {
      setOrders((ordRes.data as Order[]) ?? []);
      setAddresses((addrRes.data as Address[]) ?? []);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: editName, username: editUsername }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado"); await refreshProfile(); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) toast.error(error.message);
    else { toast.success("Senha alterada"); setNewPass(""); }
    setPassLoading(false);
  };

  // Address CEP auto-fill
  useEffect(() => {
    if (aZip.length === 8) {
      fetch(`https://viacep.com.br/ws/${aZip}/json/`)
        .then(r => r.json())
        .then(data => { if (!data.erro) { setAStreet(data.logradouro || ""); setACity(data.localidade || ""); setAState(data.uf || ""); } })
        .catch(() => {});
    }
  }, [aZip]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id, label: aLabel, zip: aZip, street: aStreet, number: aNumber, city: aCity, state: aState,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Endereço salvo");
      setShowAddrForm(false); setALabel("Casa"); setAZip(""); setAStreet(""); setANumber(""); setACity(""); setAState("");
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id);
      setAddresses((data as Address[]) ?? []);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast.success("Endereço removido");
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  if (authLoading || !user) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "orders", label: "Pedidos", icon: Package },
    { id: "addresses", label: "Endereços", icon: MapPin },
    { id: "security", label: "Segurança", icon: ShieldCheck },
  ];

  const statusLabels: Record<string, string> = {
    pending: "Pendente", paid: "Pago", processing: "Preparando", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };
  const statusColors: Record<string, string> = {
    pending: "bg-accent/20 text-accent-foreground", paid: "bg-primary/20 text-primary",
    shipped: "bg-secondary/20 text-secondary-foreground", delivered: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <section className="py-12">
      <div className="container-bp">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
          <Button variant="ghost" onClick={handleLogout} className="gap-2 text-destructive"><SignOut size={18} /> Sair</Button>
        </div>

        <div className="flex gap-1 mb-8 border-b border-border pb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {tab === "profile" && profile && (
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground">
                {(profile.username ?? "U")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{profile.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-1 mt-1">
                  {profile.is_verified && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Verificado</span>}
                  {isAdmin && <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">Admin</span>}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Username</Label><Input value={editUsername} onChange={e => setEditUsername(e.target.value)} /></div>
              <div className="space-y-2"><Label>Nome completo</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar perfil"}</Button>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">Nenhum pedido encontrado.</p>
            ) : orders.map(order => (
              <div key={order.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-mono">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                    <span className="text-sm text-muted-foreground">{order.payment_method ?? "—"}</span>
                    <span className="font-semibold">{formatBRL(order.total_cents)}</span>
                  </div>
                </div>
                {order.status === "pending" && order.pix_qr_code && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Pix copia e cola:</p>
                    <p className="text-xs font-mono break-all select-all">{order.pix_qr_code}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ADDRESSES */}
        {tab === "addresses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{addresses.length} endereço(s)</p>
              <Button onClick={() => setShowAddrForm(!showAddrForm)} className="gap-2"><Plus size={16} /> Novo endereço</Button>
            </div>

            {showAddrForm && (
              <form onSubmit={handleAddAddress} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Rótulo</Label><Input value={aLabel} onChange={e => setALabel(e.target.value)} placeholder="Casa, Trabalho..." /></div>
                  <div className="space-y-2"><Label>CEP</Label><Input value={aZip} onChange={e => setAZip(e.target.value.replace(/\D/g, ""))} placeholder="00000000" maxLength={8} required /></div>
                  <div className="space-y-2"><Label>Rua</Label><Input value={aStreet} onChange={e => setAStreet(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Número</Label><Input value={aNumber} onChange={e => setANumber(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Cidade</Label><Input value={aCity} onChange={e => setACity(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Estado</Label><Input value={aState} onChange={e => setAState(e.target.value)} maxLength={2} required /></div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowAddrForm(false)}>Cancelar</Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {addresses.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold">{a.label} {a.is_default && <span className="text-xs text-primary">· padrão</span>}</p>
                    <p className="text-xs text-muted-foreground">{a.street}{a.number ? `, ${a.number}` : ""} · {a.city}/{a.state} · {a.zip}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAddress(a.id)}><Trash size={14} /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div className="max-w-md space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold">Alterar senha</h3>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <Button onClick={handleChangePassword} disabled={passLoading}>{passLoading ? "Alterando..." : "Alterar senha"}</Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <h3 className="text-sm font-semibold">Dados da conta</h3>
              <p className="text-xs text-muted-foreground">Email: {user.email}</p>
              <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 12)}...</p>
              <p className="text-xs text-muted-foreground">Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
