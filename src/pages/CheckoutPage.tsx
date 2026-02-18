import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lightning, CurrencyBtc, Link as LinkIcon, Copy, ArrowSquareOut, CheckCircle } from "@phosphor-icons/react";

// ─── Timer hook ────────────────────────────────────────────────────────────────
function useCountdown(seconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setTimeLeft(seconds);
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return timeLeft;
}

function timerColor(t: number): string {
  if (t <= 60) return "#FF3B30";   // red at 01:00
  if (t <= 240) return "#FFD60A";  // yellow at 04:00
  return "#3AFF5C";                // green-lime default
}

function fmt(t: number) {
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = (t % 60).toString().padStart(2, "0");
  return `${m} : ${s}`;
}

// ─── QR Canvas ─────────────────────────────────────────────────────────────────
function QRCanvas({ base64 }: { base64: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, 260, 260);
    };
    img.src = `data:image/png;base64,${base64}`;
  }, [base64]);

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={260}
      className="mx-auto block bg-white"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─── Pix Payment Screen ─────────────────────────────────────────────────────────
interface PixScreenProps {
  preferenceId: string;
  qrBase64: string;
  initPoint: string;
  shortLink: string;
  totalCents: number;
  onCancel: () => void;
}

function PixScreen({ preferenceId, qrBase64, initPoint, shortLink, totalCents, onCancel }: PixScreenProps) {
  const [paid, setPaid] = useState(false);
  const navigate = useNavigate();

  // SSE listener
  useEffect(() => {
    const es = new EventSource(`/api/webhooks/pix/${preferenceId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === "approved") {
          setPaid(true);
          es.close();
          // Play gate sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } catch { /* AudioContext may be blocked */ }
        }
      } catch { /* ignore parse errors */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [preferenceId]);

  const handleExpire = useCallback(async () => {
    toast.error("QR Code expirado. Cancelando preferência...");
    try {
      await supabase.functions.invoke("cancel-pix", { body: { preference_id: preferenceId } });
    } catch { /* best-effort */ }
    onCancel();
  }, [preferenceId, onCancel]);

  const timeLeft = useCountdown(480, handleExpire);
  const color = timerColor(timeLeft);

  const handleOpenLink = () => {
    window.open(initPoint, "_blank");
    navigator.clipboard.writeText(initPoint).catch(() => { });
    toast.success("Link copiado automaticamente!");
  };

  // ─── Paid State ──────────────────────────────────────────────────────────────
  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, #000000 0%, #0a1f0a 50%, #0B0B0B 100%)" }}
      >
        {/* Butterfly slide-in card */}
        <motion.div
          initial={{ y: "100%", rotateX: 45, opacity: 0 }}
          animate={{ y: 0, rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center gap-6 p-12 border border-primary/30 bg-black/80 backdrop-blur-xl max-w-sm w-full mx-4"
          style={{ boxShadow: "0 0 60px rgba(58,255,92,0.2), inset 0 0 40px rgba(58,255,92,0.05)" }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary" />

          <motion.div
            animate={{ scale: [0.8, 1.15, 1] }}
            transition={{ duration: 0.4, ease: "backOut" }}
          >
            <CheckCircle size={72} weight="fill" className="text-primary" />
          </motion.div>

          <div className="text-center">
            <h1 className="text-4xl font-bold font-mono text-primary tracking-tighter">PAGO ✅</h1>
            <p className="mt-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">Pagamento confirmado</p>
          </div>

          <div className="w-full border-t border-dashed border-zinc-800 pt-4 flex flex-col gap-1 text-center">
            <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">Valor</p>
            <p className="text-xl font-bold text-white font-mono">{formatBRL(totalCents)}</p>
          </div>

          {/* Gate slide animation */}
          <div className="w-full overflow-hidden border border-zinc-800 bg-zinc-900/50 h-8 relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/20 flex items-center justify-center"
            >
              <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em]">GATE OPEN</span>
            </motion.div>
          </div>

          <Button
            onClick={() => navigate("/usuario/minha-conta")}
            className="w-full bg-primary text-black font-mono font-bold rounded-none hover:bg-primary/80"
          >
            VER PEDIDOS
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Payment Waiting State ────────────────────────────────────────────────────
  return (
    <section className="min-h-screen bg-[#0B0B0B] py-12 px-4">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Header */}
        <div className="border-b border-[#222] pb-4">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-1">BREKPUFF VENDA PRESENCIAL — Nº 123</p>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tighter">PAGAMENTO VIA PIX</h1>
        </div>

        {/* Product summary */}
        <div className="border border-[#222] bg-[#111] p-4 space-y-3">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">RESUMO DO PEDIDO</p>
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono text-zinc-300">Total</span>
            <span className="text-xl font-bold font-mono text-primary">{formatBRL(totalCents)}</span>
          </div>
        </div>

        {/* QR Code Canvas 260×260 */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-white" style={{ boxShadow: "0 0 30px rgba(58,255,92,0.15)" }}>
            <QRCanvas base64={qrBase64} />
          </div>
          <p className="text-xs font-mono text-zinc-600 text-center">Escaneie com o app do banco</p>
        </div>

        {/* Short link + open button */}
        <div className="border border-[#222] bg-[#111] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">LINK CURTO</p>
            <p className="text-sm font-mono text-primary">{shortLink}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(initPoint); toast.success("Link copiado!"); }}
              className="p-2 border border-[#333] text-zinc-500 hover:text-white hover:border-white transition-colors"
              title="Copiar link"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleOpenLink}
              className="p-2 border border-primary/50 text-primary hover:bg-primary hover:text-black transition-colors"
              title="Abrir link do pagamento"
            >
              <ArrowSquareOut size={16} />
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center gap-2 py-6 border border-[#222] bg-[#111]">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">EXPIRA EM</p>
          <div
            className="text-5xl font-bold font-mono tabular-nums tracking-tighter transition-colors duration-1000"
            style={{ color, textShadow: `0 0 20px ${color}66` }}
          >
            {fmt(timeLeft)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Aguardando confirmação bancária via SSE
            </span>
          </div>
        </div>

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-full py-3 border border-zinc-800 text-zinc-600 hover:text-white hover:border-white transition-all font-mono text-sm uppercase tracking-widest"
        >
          Cancelar e voltar
        </button>
      </div>
    </section>
  );
}

// ─── Main Checkout Page ─────────────────────────────────────────────────────────
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

  // Pix result state
  const [pixState, setPixState] = useState<{
    preferenceId: string;
    qrBase64: string;
    initPoint: string;
    shortLink: string;
  } | null>(null);

  // CEP auto-fill
  useEffect(() => {
    if (zip.length === 8) {
      fetch(`https://viacep.com.br/ws/${zip}/json/`)
        .then(r => r.json())
        .then(data => {
          if (!data.erro) {
            setStreet(data.logradouro || "");
            setCity(data.localidade || "");
            setState(data.uf || "");
          }
        })
        .catch(() => { });
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

      if (paymentMethod === "pix") {
        try {
          const { data: pixData, error: pixError } = await supabase.functions.invoke("create-pix", {
            body: { order_id: order.id },
          });

          if (!pixError && pixData) {
            // Extract from Mercado Pago preference response
            const qrBase64 =
              pixData.point_of_interaction?.transaction_data?.qr_code_base64 ??
              pixData.qr_code_base64 ??
              "";
            const initPoint = pixData.init_point ?? pixData.sandbox_init_point ?? "";
            const preferenceId = pixData.id ?? order.id;
            // Curated short link
            const shortLink = `brek.pf/${preferenceId.slice(0, 6)}`;

            setPixState({ preferenceId, qrBase64, initPoint, shortLink });
          } else {
            toast.error("Erro ao gerar QR Pix. Tente novamente.");
          }
        } catch {
          toast.error("Erro ao gerar QR Pix.");
        }
      } else {
        toast.success("Pedido criado com sucesso!");
        navigate("/usuario/minha-conta");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Guards ─────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <section className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold font-mono text-white">CHECKOUT</h1>
          <p className="text-zinc-500 font-mono text-sm">Faça login para finalizar.</p>
          <Link to="/auth">
            <Button className="bg-primary text-black font-mono rounded-none">ENTRAR</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0 && !pixState) {
    return (
      <section className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold font-mono text-white">CHECKOUT</h1>
          <p className="text-zinc-500 font-mono text-sm">Carrinho vazio.</p>
          <Link to="/produtos">
            <Button className="bg-primary text-black font-mono rounded-none">VER CATÁLOGO</Button>
          </Link>
        </div>
      </section>
    );
  }

  // ─── Pix Screen ──────────────────────────────────────────────────────────────
  if (pixState) {
    return (
      <AnimatePresence>
        <PixScreen
          key="pix-screen"
          preferenceId={pixState.preferenceId}
          qrBase64={pixState.qrBase64}
          initPoint={pixState.initPoint}
          shortLink={pixState.shortLink}
          totalCents={finalTotal}
          onCancel={() => setPixState(null)}
        />
      </AnimatePresence>
    );
  }

  const methods = [
    { id: "pix", label: "Pix", icon: Lightning, desc: "QR anônimo · 5% off" },
    { id: "link", label: "Link anônimo", icon: LinkIcon, desc: "UUID · 30 min" },
    { id: "btc", label: "Bitcoin", icon: CurrencyBtc, desc: "On-chain & LN" },
  ];

  // ─── Form ────────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen bg-[#0B0B0B] py-12">
      <div className="container-bp">
        <div className="mb-8 border-b border-[#222] pb-4">
          <h1 className="text-2xl font-bold font-mono text-white tracking-tighter">CHECKOUT</h1>
          <p className="text-xs font-mono text-zinc-600 mt-1 uppercase tracking-widest">Entrega 100% discreta · Pagamento anônimo</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="border border-[#222] bg-[#111] p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">ENDEREÇO DE ENTREGA</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">CEP</Label>
                  <Input
                    value={zip}
                    onChange={e => setZip(e.target.value.replace(/\D/g, ""))}
                    placeholder="00000000"
                    maxLength={8}
                    required
                    className="bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">RUA</Label>
                  <Input value={street} onChange={e => setStreet(e.target.value)} required className="bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">NÚMERO</Label>
                  <Input value={number} onChange={e => setNumber(e.target.value)} required className="bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">CIDADE</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} required className="bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">ESTADO</Label>
                  <Input value={state} onChange={e => setState(e.target.value)} maxLength={2} required className="bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border border-[#222] bg-[#111] p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">MÉTODO DE PAGAMENTO</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {methods.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-2 border-2 p-4 transition-all font-mono ${paymentMethod === m.id
                        ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(58,255,92,0.1)]"
                        : "border-[#333] hover:border-zinc-600"
                      }`}
                  >
                    <m.icon size={24} className={paymentMethod === m.id ? "text-primary" : "text-zinc-500"} />
                    <span className="text-sm font-bold text-white">{m.label}</span>
                    <span className="text-xs text-zinc-500">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="border border-[#222] bg-[#111] p-6 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">CUPOM DE DESCONTO</h3>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="CODIGO"
                  className="uppercase bg-[#0B0B0B] border-[#333] text-white font-mono rounded-none focus:border-primary"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="bg-transparent border border-[#333] text-zinc-400 hover:border-primary hover:text-primary rounded-none font-mono"
                >
                  {couponLoading ? "..." : "APLICAR"}
                </Button>
              </div>
              {couponDiscount > 0 && (
                <p className="text-sm text-primary font-mono">DESCONTO: -{formatBRL(couponDiscount)}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="border border-[#222] bg-[#111] p-6 h-fit space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">RESUMO</h3>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm font-mono">
                <span className="text-zinc-500 truncate">{item.product?.name} ×{item.qty}</span>
                <span className="text-white">{formatBRL((item.product?.price_cents ?? 0) * item.qty)}</span>
              </div>
            ))}
            <div className="border-t border-[#222] pt-3 flex justify-between text-sm font-mono">
              <span className="text-zinc-500">FRETE</span>
              <span className="text-white">{formatBRL(shippingCents)}</span>
            </div>
            {pixDiscount > 0 && (
              <div className="flex justify-between text-sm font-mono text-primary">
                <span>PIX -5%</span>
                <span>-{formatBRL(pixDiscount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm font-mono text-primary">
                <span>CUPOM</span>
                <span>-{formatBRL(couponDiscount)}</span>
              </div>
            )}
            <div className="border-t border-[#222] pt-3 flex justify-between font-mono">
              <span className="font-bold text-white">TOTAL</span>
              <span className="text-xl font-bold text-primary">{formatBRL(finalTotal)}</span>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-black font-bold font-mono rounded-none hover:bg-primary/80 shadow-[0_0_20px_rgba(58,255,92,0.2)]"
              size="lg"
              disabled={loading}
            >
              {loading ? "PROCESSANDO..." : "CONFIRMAR PEDIDO"}
            </Button>
            <p className="text-[10px] text-zinc-600 font-mono text-center uppercase tracking-widest">
              Zero logs · Entrega discreta
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
