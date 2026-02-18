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
import {
  Lightning, CurrencyBtc, Link as LinkIcon, Copy,
  ArrowSquareOut, CheckCircle, ToggleRight, ToggleLeft,
  Storefront, QrCode,
} from "@phosphor-icons/react";

// ─── Timer hook ─────────────────────────────────────────────────────────────
function useCountdown(active: boolean, seconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;

  useEffect(() => {
    if (!active) return;
    setTimeLeft(seconds);
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); cbRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, seconds]);

  return timeLeft;
}

function timerColor(t: number) {
  if (t <= 60) return "text-red-500";
  if (t <= 240) return "text-yellow-400";
  return "text-primary";
}

function fmt(t: number) {
  const m = String(Math.floor(t / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${m} : ${s}`;
}

// ─── QR Canvas 260×260 ───────────────────────────────────────────────────────
function QRCanvas({ base64 }: { base64: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ctx = ref.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, 260, 260);
    };
    img.src = `data:image/png;base64,${base64}`;
  }, [base64]);
  return (
    <canvas
      ref={ref}
      width={260}
      height={260}
      className="mx-auto block rounded-lg bg-white p-2 shadow-lg"
    />
  );
}

// ─── Admin: Venda Física Panel ───────────────────────────────────────────────
interface VendaFisicaProps {
  totalCents: number;
}

function VendaFisicaPanel({ totalCents }: VendaFisicaProps) {
  const [generating, setGenerating] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pixData, setPixData] = useState<{
    preferenceId: string;
    qrBase64: string;
    initPoint: string;
  } | null>(null);

  // SSE listener
  useEffect(() => {
    if (!pixData) return;
    const es = new EventSource(`/api/webhooks/pix/${pixData.preferenceId}`);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.status === "approved") {
          setPaid(true);
          es.close();
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
          } catch { /* blocked */ }
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [pixData]);

  const handleExpire = useCallback(async () => {
    toast.error("QR expirado.");
    if (pixData) {
      try { await supabase.functions.invoke("cancel-pix", { body: { preference_id: pixData.preferenceId } }); }
      catch { /* best-effort */ }
    }
    setPixData(null);
  }, [pixData]);

  const timeLeft = useCountdown(!!pixData && !paid, 480, handleExpire);

  const handleGenerate = async () => {
    setGenerating(true);
    setPaid(false);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ status: "pending", total_cents: totalCents, payment_method: "pix", shipping_address: { type: "presencial" } })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const { data, error } = await supabase.functions.invoke("create-pix", { body: { order_id: order.id } });
      if (error || !data) throw new Error("Falha ao gerar Pix");

      const qrBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64 ?? data.qr_code_base64 ?? "";
      const initPoint = data.init_point ?? data.sandbox_init_point ?? "";
      const preferenceId = data.id ?? order.id;
      setPixData({ preferenceId, qrBase64, initPoint });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao gerar QR Pix");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => { setPixData(null); setPaid(false); };

  // ── Timer color: bright green → dim yellow → dim red ──
  const timerHex = timeLeft > 240 ? "#7BFA6B" : timeLeft > 60 ? "#c8a800" : "#cc3333";
  const timerOpacity = timeLeft > 240 ? 1 : timeLeft > 60 ? 0.75 : 0.65;

  // ── PAID fullscreen ──
  if (paid) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ background: "#050f05" }}
      >
        {/* Floating vertices */}
        <div className="float-tl absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#7BFA6B] opacity-60" />
        <div className="float-br absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#7BFA6B] opacity-60" />
        <div className="float-br absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-[#7BFA6B] opacity-30" />
        <div className="float-tl absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-[#7BFA6B] opacity-30" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "backOut" }}
          className="flex flex-col items-center gap-6 text-center px-8"
        >
          <motion.div animate={{ scale: [0.85, 1.1, 1] }} transition={{ duration: 0.4, ease: "backOut" }}>
            <CheckCircle size={80} weight="fill" style={{ color: "#7BFA6B" }} />
          </motion.div>
          <div>
            <p className="text-4xl font-bold font-mono" style={{ color: "#7BFA6B" }}>pago ✓</p>
            <p className="mt-2 text-sm font-mono text-[#444]">{formatBRL(totalCents)}</p>
          </div>
          {/* Gate slide */}
          <div className="w-64 overflow-hidden border border-[#1a2a1a] bg-[#0a0f0a] h-7 relative">
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: "0%" }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(123,250,107,0.12)" }}
            >
              <span className="text-[10px] font-mono text-[#7BFA6B] uppercase tracking-[0.35em]">portão liberado</span>
            </motion.div>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 text-[10px] font-mono text-[#333] hover:text-[#555] uppercase tracking-widest transition-colors"
          >
            nova venda
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── QR FULLSCREEN MODAL ──
  if (pixData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0a0f0a" }}
      >
        {/* Hex matrix bg */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Ctext x='0' y='14' font-family='monospace' font-size='9' fill='%237BFA6B'%3E0x1A 0xFF 0x3B%3C/text%3E%3Ctext x='0' y='28' font-family='monospace' font-size='9' fill='%237BFA6B'%3E0x7F 0x00 0xC4%3C/text%3E%3Ctext x='0' y='42' font-family='monospace' font-size='9' fill='%237BFA6B'%3E0xDE 0xAD 0xBE%3C/text%3E%3Ctext x='0' y='56' font-family='monospace' font-size='9' fill='%237BFA6B'%3E0xEF 0x12 0x9A%3C/text%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />

        {/* Floating vertices — 4 corners */}
        <div className="float-tl absolute top-5 left-5 w-10 h-10 border-t-2 border-l-2 border-[#7BFA6B] opacity-70" />
        <div className="float-br absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-[#7BFA6B] opacity-70" />
        <div className="float-br absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-[#7BFA6B] opacity-35" />
        <div className="float-tl absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-[#7BFA6B] opacity-35" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6">

          {/* Timer — above QR, floating, glow pulses with minutes */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-mono text-[#2a3a2a] uppercase tracking-[0.4em]">expira em</p>
            <span
              className="text-5xl font-bold font-mono tabular-nums timer-glow"
              style={{ color: timerHex, opacity: timerOpacity }}
            >
              {fmt(timeLeft)}
            </span>
          </div>

          {/* QR — green pulsing, smoky black bg */}
          <div
            className="neon-pulse p-3 flex items-center justify-center"
            style={{
              background: "#060c06",
              border: "1px solid rgba(123,250,107,0.25)",
            }}
          >
            <QRCanvas base64={pixData.qrBase64} />
          </div>

          {/* Instruction text — monospace lowercase full-width */}
          <div className="w-full text-center space-y-1">
            <p className="text-[11px] font-mono text-[#7BFA6B] tracking-wide">
              show this screen to buyer
            </p>
            <p className="text-[11px] font-mono text-[#3a4a3a] tracking-wide">
              / show your phone to seller
            </p>
            <p className="mt-2 text-[10px] font-mono text-[#2a2a2a]">
              {formatBRL(totalCents)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => { navigator.clipboard.writeText(pixData.initPoint); toast.success("copiado"); }}
              className="flex-1 py-2 text-[10px] font-mono text-[#3a4a3a] border border-[#1a2a1a] hover:border-[#7BFA6B] hover:text-[#7BFA6B] transition-colors uppercase tracking-widest"
            >
              copiar link
            </button>
            <button
              onClick={() => { window.open(pixData.initPoint, "_blank"); navigator.clipboard.writeText(pixData.initPoint).catch(() => { }); toast.success("link copiado"); }}
              className="flex-1 py-2 text-[10px] font-mono text-[#3a4a3a] border border-[#1a2a1a] hover:border-[#7BFA6B] hover:text-[#7BFA6B] transition-colors uppercase tracking-widest"
            >
              abrir link
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-[9px] font-mono text-[#222] hover:text-[#444] uppercase tracking-widest transition-colors"
          >
            cancelar
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Generate button ──
  return (
    <div className="space-y-4">
      <div className="border border-[#1a2a1a] bg-[#0a0f0a] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <QrCode size={20} style={{ color: "#7BFA6B" }} />
          <div>
            <p className="text-xs font-mono text-[#aaa]">gerar qr pix presencial</p>
            <p className="text-[10px] font-mono text-[#444]">
              valor: <span style={{ color: "#7BFA6B" }}>{formatBRL(totalCents)}</span>
            </p>
          </div>
        </div>
        <p className="text-[10px] font-mono text-[#333] leading-relaxed">
          gera um qr pix único com o valor exato. mostre ao cliente na tela — ele escaneia com o app do banco.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="btn-cta w-full py-3 text-xs"
      >
        {generating ? "gerando..." : "gerar qr pix agora"}
      </button>
    </div>
  );
}

// ─── Main Checkout Page ──────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { user, isAdmin } = useAuth();
  const { items, totalCents } = useCart();
  const navigate = useNavigate();

  // Admin: venda física toggle
  const [vendaFisica, setVendaFisica] = useState(false);

  // Form state
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

  // Pix result (normal flow)
  const [pixState, setPixState] = useState<{
    preferenceId: string;
    qrBase64: string;
    initPoint: string;
  } | null>(null);
  const [pixPaid, setPixPaid] = useState(false);

  // CEP auto-fill
  useEffect(() => {
    if (zip.length === 8) {
      fetch(`https://viacep.com.br/ws/${zip}/json/`)
        .then(r => r.json())
        .then(d => {
          if (!d.erro) { setStreet(d.logradouro || ""); setCity(d.localidade || ""); setState(d.uf || ""); }
        })
        .catch(() => { });
    }
  }, [zip]);

  // SSE for normal pix flow
  useEffect(() => {
    if (!pixState || pixPaid) return;
    const es = new EventSource(`/api/webhooks/pix/${pixState.preferenceId}`);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.status === "approved") { setPixPaid(true); es.close(); }
      } catch { /* ignore */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [pixState, pixPaid]);

  const handleExpireNormal = useCallback(async () => {
    toast.error("QR Code expirado.");
    if (pixState) {
      try { await supabase.functions.invoke("cancel-pix", { body: { preference_id: pixState.preferenceId } }); }
      catch { /* best-effort */ }
    }
    setPixState(null);
  }, [pixState]);

  const normalTimeLeft = useCountdown(!!pixState && !pixPaid, 480, handleExpireNormal);

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
      toast.error("Cupom inválido"); setCouponDiscount(0); setCouponId(null);
    } else {
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("Cupom esgotado");
      } else if (data.min_order_cents > 0 && totalCents < data.min_order_cents) {
        toast.error(`Pedido mínimo: ${formatBRL(data.min_order_cents)}`);
      } else {
        let disc = 0;
        if (data.discount_percent > 0) disc += Math.round(totalCents * data.discount_percent / 100);
        if (data.discount_cents > 0) disc += data.discount_cents;
        setCouponDiscount(disc); setCouponId(data.id);
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
        const { data: pd, error: pe } = await supabase.functions.invoke("create-pix", {
          body: { order_id: order.id },
        });
        if (!pe && pd) {
          const qrBase64 = pd.point_of_interaction?.transaction_data?.qr_code_base64 ?? pd.qr_code_base64 ?? "";
          const initPoint = pd.init_point ?? pd.sandbox_init_point ?? "";
          const preferenceId = pd.id ?? order.id;
          setPixState({ preferenceId, qrBase64, initPoint });
          toast.success("Pedido criado! Escaneie o QR abaixo.");
        } else {
          toast.error("Erro ao gerar QR Pix. Pedido criado, entre em contato.");
          navigate("/usuario/minha-conta");
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

  // ── Guards ──
  if (!user) {
    return (
      <section className="py-20">
        <div className="container-bp text-center space-y-4">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Faça login para finalizar.</p>
          <Link to="/auth"><Button variant="secondary">Entrar</Button></Link>
        </div>
      </section>
    );
  }

  if (items.length === 0 && !pixState) {
    return (
      <section className="py-20">
        <div className="container-bp text-center space-y-4">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Carrinho vazio.</p>
          <Link to="/produtos"><Button variant="secondary">Ver catálogo</Button></Link>
        </div>
      </section>
    );
  }

  // ── Normal Pix QR Screen ──
  if (pixState) {
    return (
      <section className="py-12">
        <div className="container-bp max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Pague com Pix</h1>
            <p className="text-muted-foreground text-sm">Escaneie o QR code com o app do banco</p>
          </div>

          <AnimatePresence mode="wait">
            {pixPaid ? (
              <motion.div
                key="paid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 rounded-2xl border border-primary/30 bg-primary/5 p-10 text-center"
              >
                <motion.div animate={{ scale: [0.7, 1.15, 1] }} transition={{ duration: 0.4, ease: "backOut" }}>
                  <CheckCircle size={80} weight="fill" className="text-primary" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold text-primary">PAGO ✅</h2>
                  <p className="mt-1 text-muted-foreground">Pagamento confirmado</p>
                  <p className="mt-2 text-xl font-bold">{formatBRL(finalTotal)}</p>
                </div>
                <div className="w-full overflow-hidden rounded-lg border border-border bg-muted h-8 relative">
                  <motion.div
                    initial={{ x: "-100%" }} animate={{ x: "0%" }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                  >
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">Pedido confirmado</span>
                  </motion.div>
                </div>
                <Button onClick={() => navigate("/usuario/minha-conta")} className="w-full">
                  Ver meus pedidos
                </Button>
              </motion.div>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* QR */}
                <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-4">
                  <QRCanvas base64={pixState.qrBase64} />
                  <p className="text-xs text-muted-foreground">Válido por 8 minutos</p>
                </div>

                {/* Value + Timer */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Valor</p>
                    <p className="text-lg font-bold text-primary">{formatBRL(finalTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Expira em</p>
                    <p className={`text-2xl font-bold font-mono tabular-nums ${timerColor(normalTimeLeft)}`}>
                      {fmt(normalTimeLeft)}
                    </p>
                  </div>
                </div>

                {/* Link */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { navigator.clipboard.writeText(pixState.initPoint); toast.success("Copiado!"); }}>
                    <Copy size={16} /> Copiar link
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { window.open(pixState.initPoint, "_blank"); navigator.clipboard.writeText(pixState.initPoint).catch(() => { }); toast.success("Link copiado!"); }}>
                    <ArrowSquareOut size={16} /> Abrir link
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Aguardando confirmação bancária...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    );
  }

  const methods = [
    { id: "pix", label: "Pix", icon: Lightning, desc: "QR anônimo · 5% off" },
    { id: "link", label: "Link anônimo", icon: LinkIcon, desc: "UUID · 30 min" },
    { id: "btc", label: "Bitcoin", icon: CurrencyBtc, desc: "On-chain & LN" },
  ];

  // ── Main Form ──
  return (
    <section className="py-12">
      <div className="container-bp">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>

          {/* Admin: Venda Física toggle */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setVendaFisica(v => !v)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all border ${vendaFisica
                ? "bg-primary text-black border-primary shadow-[0_0_16px_rgba(58,255,92,0.3)]"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                }`}
            >
              <Storefront size={16} />
              Venda Física
              {vendaFisica
                ? <ToggleRight size={16} weight="fill" />
                : <ToggleLeft size={16} />
              }
            </button>
          )}
        </div>

        {/* ── Admin: Venda Física Mode ── */}
        <AnimatePresence mode="wait">
          {vendaFisica && isAdmin ? (
            <motion.div
              key="venda-fisica"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="max-w-md mx-auto"
            >
              {/* Header card */}
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <Storefront size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Modo Venda Física Ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Gera QR Pix instantâneo com o valor do carrinho. Mostre ao cliente na tela.
                  </p>
                </div>
              </div>

              {/* Cart summary */}
              <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Itens no carrinho</p>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product?.name} ×{item.qty}</span>
                    <span className="font-medium">{formatBRL((item.product?.price_cents ?? 0) * item.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatBRL(totalCents)}</span>
                </div>
              </div>

              <VendaFisicaPanel totalCents={totalCents} />
            </motion.div>
          ) : (
            /* ── Normal Checkout Form ── */
            <motion.form
              key="normal-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="grid gap-8 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-6">
                {/* Address */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Entrega discreta
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, ""))} placeholder="00000000" maxLength={8} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Rua</Label>
                      <Input value={street} onChange={e => setStreet(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input value={number} onChange={e => setNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input value={city} onChange={e => setCity(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Input value={state} onChange={e => setState(e.target.value)} maxLength={2} required />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Pagamento anônimo
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {methods.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${paymentMethod === m.id
                          ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(58,255,92,0.1)]"
                          : "border-border hover:border-muted-foreground/30"
                          }`}
                      >
                        <m.icon size={24} className={paymentMethod === m.id ? "text-primary" : "text-muted-foreground"} />
                        <span className="text-sm font-semibold">{m.label}</span>
                        <span className="text-xs text-muted-foreground">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Cupom de desconto
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="CODIGO"
                      className="uppercase"
                    />
                    <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                      {couponLoading ? "..." : "Aplicar"}
                    </Button>
                  </div>
                  {couponDiscount > 0 && (
                    <p className="text-sm text-primary">Desconto: -{formatBRL(couponDiscount)}</p>
                  )}
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
                <p className="text-xs text-muted-foreground text-center">
                  Zero logs · Entrega 100% discreta
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
