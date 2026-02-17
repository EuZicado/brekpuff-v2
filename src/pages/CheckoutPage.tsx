import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lightning, CurrencyBtc, CreditCard, Link as LinkIcon } from "@phosphor-icons/react";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalCents } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [zip, setZip] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Pix result
  const [pixQr, setPixQr] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);

  useEffect(() => {
    if (zip.length === 8) {
      fetch(`https://viacep.com.br/ws/${zip}/json/`)
        .then(r => r.json())
        .then(data => { if (!data.erro) { setStreet(data.logradouro || ""); setCity(data.localidade || ""); setState(data.uf || ""); } })
        .catch(() => {});
    }
  }, [zip]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase().trim())
      .eq("active", true)
      .single();

    if (error || !data) {
      toast.error("Cupom inválido");
      setCouponDiscount(0);
      setCouponId(null);
    } else {
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("Cupom esgotado");
      } else if (data.min_order_cents > 0 && totalCents < data.min_order_cents) {
        toast.error(`Pedido mínimo: ${formatBRL(data.min_order_cents)}`);
      } else {
        let disc = 0;
        if (data.discount_percent > 0) disc += Math.round(totalCents * data.discount_percent / 100);
        if (data.discount_cents > 0) disc += data.discount_cents;
        setCouponDiscount(disc);
        setCouponId(data.id);
        toast.success(`Cupom ${data.code} aplicado!`);
      }
    }
    setCouponLoading(false);
  };

  const shippingCents = 1500;
  const pixDiscount = paymentMethod === "pix" ? Math.round(totalCents * 0.05) : 0;
  const finalTotal = Math.max(0, totalCents - pixDiscount - couponDiscount) + shippingCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setLoading(true);

    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_cents: finalTotal,
          payment_method: paymentMethod,
          shipping_address: { zip, street, number, city, state, country: "BR" },
          coupon_id: couponId,
        })
        .select("id")
        .single();

      if (error) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        qty: item.qty,
        price_cents: item.product?.price_cents ?? 0,
      }));
      await supabase.from("order_items").insert(orderItems);
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      // If Pix, generate QR
      if (paymentMethod === "pix") {
        try {
          const { data: pixData, error: pixError } = await supabase.functions.invoke("create-pix", {
            body: { order_id: order.id },
          });
          if (!pixError && pixData) {
            setPixQr(pixData.qr_code);
            setPixQrBase64(pixData.qr_code_base64);
          }
        } catch {
          // Pix generation failed but order is created
        }
      }

      if (paymentMethod !== "pix") {
        toast.success("Pedido criado com sucesso!");
        navigate("/usuario/minha-conta");
      } else {
        toast.success("Pedido criado! Escaneie o QR code abaixo.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <section className="py-20"><div className="container-bp text-center">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-muted-foreground mb-6">Faça login para finalizar.</p>
        <Link to="/auth"><Button variant="secondary">Entrar</Button></Link>
      </div></section>
    );
  }

  if (items.length === 0 && !pixQr) {
    return (
      <section className="py-20"><div className="container-bp text-center">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-muted-foreground mb-6">Carrinho vazio.</p>
        <Link to="/produtos"><Button variant="secondary">Ver catálogo</Button></Link>
      </div></section>
    );
  }

  // Show Pix QR result
  if (pixQr) {
    return (
      <section className="py-12"><div className="container-bp max-w-lg mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold">Pague com Pix</h1>
        <p className="text-muted-foreground">Escaneie o QR code ou copie o código abaixo. Válido por 30 minutos.</p>
        {pixQrBase64 && (
          <div className="mx-auto w-64 h-64 rounded-xl overflow-hidden bg-white p-4">
            <img src={`data:image/png;base64,${pixQrBase64}`} alt="QR Code Pix" className="w-full h-full" />
          </div>
        )}
        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-1">Pix copia e cola:</p>
          <p className="text-xs font-mono break-all select-all cursor-pointer" onClick={() => { navigator.clipboard.writeText(pixQr); toast.success("Copiado!"); }}>{pixQr}</p>
        </div>
        <p className="text-lg font-bold text-primary">{formatBRL(finalTotal)}</p>
        <Button variant="secondary" onClick={() => navigate("/usuario/minha-conta")}>Ir para Minha Conta</Button>
      </div></section>
    );
  }

  const methods = [
    { id: "pix", label: "Pix", icon: Lightning, desc: "QR anônimo · 5% off" },
    { id: "link", label: "Link anônimo", icon: LinkIcon, desc: "UUID · 30 min" },
    { id: "btc", label: "Bitcoin", icon: CurrencyBtc, desc: "On-chain & LN" },
  ];

  return (
    <section className="py-12">
      <div className="container-bp">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Address */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Entrega discreta</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>CEP</Label><Input value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, ""))} placeholder="00000000" maxLength={8} required /></div>
                <div className="space-y-2"><Label>Rua</Label><Input value={street} onChange={e => setStreet(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Número</Label><Input value={number} onChange={e => setNumber(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Cidade</Label><Input value={city} onChange={e => setCity(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Estado</Label><Input value={state} onChange={e => setState(e.target.value)} maxLength={2} required /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pagamento anônimo</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {methods.map(m => (
                  <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                      paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}>
                    <m.icon size={24} className={paymentMethod === m.id ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cupom de desconto</h3>
              <div className="flex gap-2">
                <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="CODIGO" className="uppercase" />
                <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                  {couponLoading ? "..." : "Aplicar"}
                </Button>
              </div>
              {couponDiscount > 0 && <p className="text-sm text-primary">Desconto: -{formatBRL(couponDiscount)}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-6 h-fit space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.product?.name} × {item.qty}</span>
                <span>{formatBRL((item.product?.price_cents ?? 0) * item.qty)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatBRL(shippingCents)}</span>
            </div>
            {pixDiscount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Desconto Pix (5%)</span>
                <span>-{formatBRL(pixDiscount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Cupom</span>
                <span>-{formatBRL(couponDiscount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{formatBRL(finalTotal)}</span>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : "Confirmar pedido"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
