import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightning, Package, ShieldCheck, CurrencyBtc } from "@phosphor-icons/react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/contexts/AdminContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  compare_price_cents: number | null;
  featured: boolean;
  product_images: { url: string; alt: string | null }[];
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Carregando produtos">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse bg-[#111] border border-[#1a1a1a]" />
      ))}
    </div>
  );
}

const TICKER_ITEMS = [
  "// zero logs",
  "// bitcoin accepted",
  "// pix automatizado",
  "// entrega discreta",
  "// encrypted connection",
  "// sem rastros",
  "// pagamento anônimo",
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, triggerPaymentModal } = useAdmin();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, price_cents, compare_price_cents, featured, product_images(url, alt)")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        setProducts((data as Product[]) ?? []);
      } catch (err: any) {
        setError("Erro ao carregar catálogo.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleProductClick = (e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault();
      triggerPaymentModal();
    }
  };

  const tickerFull = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center justify-center border-b border-[#141414]">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7BFA6B] opacity-[0.03] blur-[120px]" />
        </div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, #7BFA6B 2px, #7BFA6B 3px)" }}
        />

        <div className="container-bp relative z-10 flex flex-col items-center justify-center text-center gap-8 py-24">
          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 border border-[#7BFA6B]/20 bg-[#7BFA6B]/5 px-4 py-1.5 text-[10px] font-mono text-[#7BFA6B] tracking-[0.3em] uppercase"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BFA6B] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#7BFA6B]" />
            </span>
            sistema online · conexão encriptada
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-5xl md:text-7xl font-black font-mono tracking-tighter leading-none text-[#d0d0d0]"
          >
            catálogo
            <br />
            <span style={{ color: "#7BFA6B" }}>brekpuff</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-md text-sm font-mono text-[#444] leading-relaxed"
          >
            hardware · supply · tech<br />
            sem logs · sem rastreio · entrega 100% discreta
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex gap-3"
          >
            <Link to="/produtos">
              <button className="btn-cta px-6 py-3 text-xs gap-2 flex items-center">
                acessar estoque
                <ArrowRight size={14} />
              </button>
            </Link>
            <Link to="/sobre-nos">
              <button className="px-6 py-3 text-[10px] font-mono text-[#444] border border-[#1e1e1e] hover:border-[#7BFA6B]/30 hover:text-[#7BFA6B] transition-colors uppercase tracking-widest">
                como funciona
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="overflow-hidden bg-[#7BFA6B] py-1.5">
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {tickerFull.map((item, i) => (
            <span key={i} className="mx-5 text-[10px] font-mono font-bold text-black uppercase tracking-widest">
              {item}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker {
            from { transform: translateX(0); }
            to { transform: translateX(-33.333%); }
          }
        `}</style>
      </div>

      {/* ── Catalog Grid ── */}
      <section className="py-20" aria-labelledby="featured-heading">
        <div className="container-bp">
          <div className="mb-10 flex items-end justify-between border-b border-[#141414] pb-5">
            <div>
              <h2 id="featured-heading" className="text-lg font-mono font-bold text-[#c0c0c0] flex items-center gap-2">
                <Lightning weight="fill" size={16} style={{ color: "#7BFA6B" }} />
                estoque disponível
              </h2>
              <p className="mt-1 text-[10px] font-mono text-[#333] uppercase tracking-widest">
                atualizado em tempo real
              </p>
            </div>
            <Link
              to="/produtos"
              className="text-[10px] font-mono text-[#333] hover:text-[#7BFA6B] uppercase tracking-widest transition-colors"
            >
              ver tudo →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="border border-[#cc3333]/20 bg-[#cc3333]/5 py-16 text-center">
              <p className="text-[#cc3333] font-mono text-sm">{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    priceCents={p.price_cents}
                    comparePriceCents={p.compare_price_cents}
                    imageUrl={p.product_images?.[0]?.url}
                    onClick={isAdmin ? handleProductClick : undefined}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#1a1a1a] py-20 text-center">
              <Package size={32} className="mx-auto mb-3 text-[#2a2a2a]" />
              <p className="text-[#2a2a2a] font-mono text-sm">estoque sendo atualizado...</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 border-t border-[#141414]">
        <div className="container-bp grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: "zero rastros",
              desc: "Embalagem neutra, remetente genérico. Ninguém sabe o que tem dentro.",
            },
            {
              icon: CurrencyBtc,
              title: "pagamento anônimo",
              desc: "Pix, Bitcoin on-chain & Lightning. Sem KYC, sem cadastro bancário.",
            },
            {
              icon: Lightning,
              title: "entrega rápida",
              desc: "Estoque pronto para envio. Rastreio discreto via código.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="hex-panel neon-corners p-5 group"
            >
              <f.icon
                size={22}
                weight="duotone"
                className="mb-3 text-[#333] group-hover:text-[#7BFA6B] transition-colors"
              />
              <h3 className="text-xs font-mono font-bold text-[#888] mb-1 uppercase tracking-widest">
                {f.title}
              </h3>
              <p className="text-[11px] font-mono text-[#3a3a3a] leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
