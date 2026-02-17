import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/components/ProductCard";
import { toast } from "sonner";
import {
  ChartLine, Package, Users, Star, Plus, Trash, PencilSimple,
  ClockCounterClockwise, Ticket, Eye, EyeSlash, ArrowsClockwise,
} from "@phosphor-icons/react";

type Tab = "dashboard" | "products" | "orders" | "coupons" | "users" | "logs";

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [weekSales, setWeekSales] = useState(0);
  const [monthSales, setMonthSales] = useState(0);
  const [loading, setLoading] = useState(true);

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [saving, setSaving] = useState(false);

  // Coupon form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [cCode, setCCode] = useState("");
  const [cPercent, setCPercent] = useState("");
  const [cCents, setCCents] = useState("");
  const [cMinOrder, setCMinOrder] = useState("");
  const [cMaxUses, setCMaxUses] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && !isAdmin) { navigate("/"); toast.error("Acesso negado"); }
  }, [user, isAdmin, authLoading, navigate]);

  const logAction = useCallback(async (action: string, targetType?: string, targetId?: string, details?: any) => {
    if (!user) return;
    await supabase.from("admin_logs").insert({
      admin_id: user.id, action, target_type: targetType, target_id: targetId, details: details ?? {},
    });
  }, [user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [prodRes, ordRes, profRes, coupRes, logRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id, username, full_name, avatar_url, is_verified, banned_at, created_at"),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setProducts(prodRes.data ?? []);
    const allOrders = ordRes.data ?? [];
    setOrders(allOrders);
    setProfiles(profRes.data ?? []);
    setCoupons(coupRes.data ?? []);
    setLogs(logRes.data ?? []);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    const paid = allOrders.filter((o: any) => o.status === "paid");
    setTodaySales(paid.filter((o: any) => o.created_at?.startsWith(today)).reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0));
    setWeekSales(paid.filter((o: any) => o.created_at >= weekAgo).reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0));
    setMonthSales(paid.filter((o: any) => o.created_at >= monthAgo).reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0));
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin, fetchAll]);

  // Product handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = pSlug || pName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("products").insert({
      name: pName, slug, description: pDesc,
      price_cents: Math.round(parseFloat(pPrice) * 100),
      stock: parseInt(pStock) || 0, active: true, featured: false,
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success("Produto criado!");
      await logAction("product_create", "product", slug);
      setShowForm(false); setPName(""); setPSlug(""); setPDesc(""); setPPrice(""); setPStock("");
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      setProducts(data ?? []);
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    await logAction(active ? "product_deactivate" : "product_activate", "product", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p));
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("products").update({ featured: !featured }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !featured } : p));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    await logAction("product_delete", "product", id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Produto excluído");
  };

  // Order status
  const handleOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    await logAction("order_status_update", "order", id, { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success(`Pedido atualizado → ${status}`);
  };

  // Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: cCode.toUpperCase().trim(),
      discount_percent: parseInt(cPercent) || 0,
      discount_cents: Math.round(parseFloat(cCents || "0") * 100),
      min_order_cents: Math.round(parseFloat(cMinOrder || "0") * 100),
      max_uses: cMaxUses ? parseInt(cMaxUses) : null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Cupom criado!");
      await logAction("coupon_create", "coupon", cCode.toUpperCase());
      setShowCouponForm(false); setCCode(""); setCPercent(""); setCCents(""); setCMinOrder(""); setCMaxUses("");
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      setCoupons(data ?? []);
    }
    setSaving(false);
  };

  const handleToggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
  };

  // User management
  const handleBanUser = async (id: string, banned: boolean) => {
    const val = banned ? null : new Date().toISOString();
    await supabase.from("profiles").update({ banned_at: val }).eq("id", id);
    await logAction(banned ? "user_unban" : "user_ban", "user", id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, banned_at: val } : p));
    toast.success(banned ? "Usuário desbanido" : "Usuário banido");
  };

  const handleVerifyUser = async (id: string, verified: boolean) => {
    await supabase.from("profiles").update({ is_verified: !verified }).eq("id", id);
    await logAction(verified ? "user_unverify" : "user_verify", "user", id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_verified: !verified } : p));
  };

  if (authLoading || !isAdmin) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: ChartLine },
    { id: "products", label: "Produtos", icon: Package },
    { id: "orders", label: "Pedidos", icon: Star },
    { id: "coupons", label: "Cupons", icon: Ticket },
    { id: "users", label: "Usuários", icon: Users },
    { id: "logs", label: "Logs", icon: ClockCounterClockwise },
  ];

  const lowStock = products.filter(p => p.stock <= 5 && p.active);
  const pendingOrders = orders.filter(o => o.status === "pending");

  const orderStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
  const statusColors: Record<string, string> = {
    pending: "bg-accent/20 text-accent-foreground",
    paid: "bg-primary/20 text-primary",
    processing: "bg-secondary/20 text-secondary-foreground",
    shipped: "bg-muted text-foreground",
    delivered: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <section className="py-8">
      <div className="container-bp">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
          <Button variant="ghost" size="sm" onClick={fetchAll} className="gap-2">
            <ArrowsClockwise size={16} /> Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border pb-px overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon size={18} /> {t.label}
              {t.id === "orders" && pendingOrders.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">{pendingOrders.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : (
          <>
            {/* DASHBOARD */}
            {tab === "dashboard" && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Vendas hoje", value: formatBRL(todaySales) },
                    { label: "Vendas 7 dias", value: formatBRL(weekSales) },
                    { label: "Vendas 30 dias", value: formatBRL(monthSales) },
                    { label: "Pedidos pendentes", value: pendingOrders.length.toString() },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl border border-border bg-card p-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className="text-2xl font-bold text-primary mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm font-semibold mb-3">Resumo</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Produtos ativos</span><span className="font-medium">{products.filter(p => p.active).length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Produtos inativos</span><span className="font-medium">{products.filter(p => !p.active).length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Estoque baixo (≤5)</span><span className="font-medium text-destructive">{lowStock.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Cupons ativos</span><span className="font-medium">{coupons.filter(c => c.active).length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Usuários</span><span className="font-medium">{profiles.length}</span></div>
                    </div>
                  </div>

                  {lowStock.length > 0 && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                      <p className="text-sm font-semibold text-destructive mb-3">⚠ Estoque baixo</p>
                      <div className="space-y-1">
                        {lowStock.slice(0, 8).map(p => (
                          <div key={p.id} className="flex justify-between text-sm">
                            <span className="truncate">{p.name}</span>
                            <span className="font-mono text-destructive">{p.stock} un</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{products.length} produtos</p>
                  <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus size={16} /> Novo produto</Button>
                </div>

                {showForm && (
                  <form onSubmit={handleCreateProduct} className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Nome</Label><Input value={pName} onChange={e => setPName(e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Slug</Label><Input value={pSlug} onChange={e => setPSlug(e.target.value)} placeholder="auto-gerado" /></div>
                      <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={pPrice} onChange={e => setPPrice(e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={pStock} onChange={e => setPStock(e.target.value)} required /></div>
                    </div>
                    <div className="space-y-2"><Label>Descrição</Label>
                      <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium">{formatBRL(p.price_cents)}</span>
                        <span className={`text-xs font-mono ${p.stock <= 5 ? "text-destructive" : "text-muted-foreground"}`}>×{p.stock}</span>
                        <Button variant={p.featured ? "default" : "outline"} size="sm" onClick={() => handleToggleFeatured(p.id, p.featured)} className="text-xs">★</Button>
                        <Button variant={p.active ? "secondary" : "outline"} size="sm" onClick={() => handleToggleActive(p.id, p.active)} className="text-xs">{p.active ? "Ativo" : "Off"}</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(p.id)}><Trash size={14} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ORDERS */}
            {tab === "orders" && (
              <div className="space-y-3">
                {orders.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum pedido.</p>}
                {orders.map(o => (
                  <div key={o.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-mono">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.payment_method ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[o.status] ?? "bg-muted"}`}>{o.status}</span>
                        <span className="font-semibold">{formatBRL(o.total_cents)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {orderStatuses.filter(s => s !== o.status).map(s => (
                        <Button key={s} variant="outline" size="sm" className="text-xs h-7" onClick={() => handleOrderStatus(o.id, s)}>{s}</Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COUPONS */}
            {tab === "coupons" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{coupons.length} cupons</p>
                  <Button onClick={() => setShowCouponForm(!showCouponForm)} className="gap-2"><Plus size={16} /> Novo cupom</Button>
                </div>

                {showCouponForm && (
                  <form onSubmit={handleCreateCoupon} className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Código</Label><Input value={cCode} onChange={e => setCCode(e.target.value)} placeholder="EX: BREK10" required /></div>
                      <div className="space-y-2"><Label>Desconto %</Label><Input type="number" min={0} max={100} value={cPercent} onChange={e => setCPercent(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Desconto fixo (R$)</Label><Input type="number" step="0.01" value={cCents} onChange={e => setCCents(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Pedido mínimo (R$)</Label><Input type="number" step="0.01" value={cMinOrder} onChange={e => setCMinOrder(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Máx. usos (vazio = ilimitado)</Label><Input type="number" value={cMaxUses} onChange={e => setCMaxUses(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar cupom"}</Button>
                      <Button type="button" variant="ghost" onClick={() => setShowCouponForm(false)}>Cancelar</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {coupons.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                      <div>
                        <p className="text-sm font-mono font-bold">{c.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.discount_percent > 0 && `${c.discount_percent}%`}
                          {c.discount_percent > 0 && c.discount_cents > 0 && " + "}
                          {c.discount_cents > 0 && formatBRL(c.discount_cents)}
                          {c.min_order_cents > 0 && ` · min ${formatBRL(c.min_order_cents)}`}
                          {c.max_uses && ` · ${c.used_count}/${c.max_uses} usos`}
                        </p>
                      </div>
                      <Button variant={c.active ? "secondary" : "outline"} size="sm" onClick={() => handleToggleCoupon(c.id, c.active)} className="text-xs gap-1">
                        {c.active ? <><Eye size={14} /> Ativo</> : <><EyeSlash size={14} /> Off</>}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div className="space-y-2">
                {profiles.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground flex-shrink-0">
                        {(p.username ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {p.username}
                          {p.is_verified && <span className="ml-1 text-primary text-xs">✓</span>}
                          {p.banned_at && <span className="ml-1 text-destructive text-xs">banido</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.full_name ?? "—"} · {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleVerifyUser(p.id, p.is_verified)}>
                        {p.is_verified ? "Remover ✓" : "Verificar"}
                      </Button>
                      <Button variant={p.banned_at ? "secondary" : "destructive"} size="sm" className="text-xs" onClick={() => handleBanUser(p.id, !!p.banned_at)}>
                        {p.banned_at ? "Desbanir" : "Banir"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LOGS */}
            {tab === "logs" && (
              <div className="space-y-2">
                {logs.length === 0 && <p className="py-8 text-center text-muted-foreground">Nenhum log registrado.</p>}
                {logs.map(l => (
                  <div key={l.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                    <ClockCounterClockwise size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-mono text-primary">{l.action}</span>
                        {l.target_type && <span className="text-muted-foreground"> · {l.target_type}</span>}
                        {l.target_id && <span className="text-muted-foreground font-mono text-xs"> #{l.target_id.slice(0, 8)}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
