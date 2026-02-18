import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightning, Cpu, WifiHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Carregando produtos">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-sm bg-[#111] border border-[#222]" />
      ))}
    </div>
  );
}

const TECH_CATALOG = [
  {
    id: "tech-ssd",
    name: "SSD NVMe 4TB Gen5 Heatsink",
    slug: "ssd-nvme-4tb",
    price_cents: 240000,
    compare_price_cents: 310000,
    featured: true,
    product_images: [{ url: "https://images.unsplash.com/photo-1628557672231-1e43c16428c4?q=80&w=500&auto=format&fit=crop", alt: "SSD" }],
  },
  {
    id: "tech-capture",
    name: "Capture Card 4K60 HDR Pass-through",
    slug: "capture-card-4k",
    price_cents: 120000,
    compare_price_cents: 150000,
    featured: true,
    product_images: [{ url: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=500&auto=format&fit=crop", alt: "Capture Card" }],
  },
  {
    id: "tech-kb",
    name: "Mechanical Keyboard 60% Silent Red",
    slug: "mech-kb-60",
    price_cents: 65000,
    compare_price_cents: null,
    featured: true,
    product_images: [{ url: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=500&auto=format&fit=crop", alt: "Keyboard" }],
  },
  {
    id: "tech-drone",
    name: "Mini Drone 249g 4K Camera",
    slug: "mini-drone",
    price_cents: 480000,
    compare_price_cents: 520000,
    featured: true,
    product_images: [{ url: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=500&auto=format&fit=crop", alt: "Drone" }],
  }
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
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(4); // Limit 4 real products to mix with tech

        if (error) throw error;

        let realProducts = (data as Product[]) ?? [];
        // Interleave tech catalog
        const mixed = [...realProducts, ...TECH_CATALOG].sort(() => Math.random() - 0.5);

        setProducts(mixed);
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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center justify-center border-b border-[#222]">
        <div className="absolute inset-0 bg-[#0B0B0B]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/40 via-[#0B0B0B] to-[#0B0B0B]"></div>
          {/* Scanlines Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 1px, #111 1px, #111 2px)" }}></div>
        </div>

        <div className="container-bp relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SYSTEM.STATUS: ONLINE // ENCRYPTED
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-display max-w-4xl text-[#E0E0E0] md:text-7xl tracking-tighter font-mono"
          >
            CATÁLOGO <span className="text-primary text-shadow-neon">DUAL</span>
            <br className="hidden md:block" />
            <span className="text-4xl md:text-6xl text-zinc-600">HARDWARE & SUPPLY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="mt-6 max-w-lg text-lg text-zinc-500 font-mono tracking-wide"
          >
            Vapes THC. SSDs NVMe. Drones.
            <br />
            Sem logs. Sem rastreio. Entrega 100% discreta.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            className="mt-10 flex gap-4"
          >
            <Link to="/produtos" aria-label="Acessar estoque">
              <Button
                size="lg"
                className="gap-2 bg-primary text-black hover:bg-primary/80 font-mono border border-primary/50 shadow-[0_0_20px_rgba(58,255,92,0.2)] rounded-none"
              >
                ACESSAR TERMINAL
                <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ticker Tape */}
      <section className="bg-primary text-black font-mono text-xs overflow-hidden py-1">
        <div className="whitespace-nowrap flex animate-[slide-in-right_20s_linear_infinite]">
          <span className="mx-4"> // ZERO LOGS // </span>
          <span className="mx-4"> // BITCOIN ACCEPTED // </span>
          <span className="mx-4"> // PIX AUTOMATED // </span>
          <span className="mx-4"> // SECURE DROP // </span>
          <span className="mx-4"> // ENCRYPTED CONNECTION // </span>
          <span className="mx-4"> // ZERO LOGS // </span>
          <span className="mx-4"> // BITCOIN ACCEPTED // </span>
          <span className="mx-4"> // PIX AUTOMATED // </span>
          <span className="mx-4"> // SECURE DROP // </span>
          <span className="mx-4"> // ENCRYPTED CONNECTION // </span>
          <span className="mx-4"> // ZERO LOGS // </span>
          <span className="mx-4"> // BITCOIN ACCEPTED // </span>
          <span className="mx-4"> // PIX AUTOMATED // </span>
          <span className="mx-4"> // SECURE DROP // </span>
          <span className="mx-4"> // ENCRYPTED CONNECTION // </span>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="py-20 bg-[#0B0B0B]" aria-labelledby="featured-heading">
        <div className="container-bp">
          <div className="mb-12 flex items-end justify-between border-b border-[#222] pb-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-mono font-bold text-white flex items-center gap-2">
                <Lightning weight="fill" className="text-primary" />
                ESTOQUE MISTO
              </h2>
              <p className="mt-1 text-sm text-zinc-500 font-mono">THC / TECH / HARDWARE</p>
            </div>
            <Link to="/produtos" className="text-xs font-mono text-primary hover:underline uppercase tracking-widest">
              Ver Full Database →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="border border-destructive/30 bg-destructive/10 py-16 text-center">
              <p className="text-destructive font-mono">{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  priceCents={p.price_cents}
                  comparePriceCents={p.compare_price_cents}
                  imageUrl={p.product_images?.[0]?.url}
                  isNew
                  onClick={isAdmin ? handleProductClick : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 py-16 text-center">
              <p className="text-zinc-600 font-mono">SYSTEM_UPDATE_IN_PROGRESS...</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t border-[#222]">
        <div className="container-bp grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="p-4 border border-[#222] bg-[#111] hover:border-primary/50 transition-colors group">
            <WifiHigh size={32} className="text-zinc-600 group-hover:text-primary mb-4" />
            <h3 className="font-mono text-sm font-bold text-white mb-2">CONN_SECURE</h3>
            <p className="text-xs text-zinc-500">256-bit automated encryption.</p>
          </div>
          <div className="p-4 border border-[#222] bg-[#111] hover:border-primary/50 transition-colors group">
            <Cpu size={32} className="text-zinc-600 group-hover:text-primary mb-4" />
            <h3 className="font-mono text-sm font-bold text-white mb-2">DUAL_CORE</h3>
            <p className="text-xs text-zinc-500">Hardware & Chemistry.</p>
          </div>
        </div>
      </section>
    </>
  );
}
