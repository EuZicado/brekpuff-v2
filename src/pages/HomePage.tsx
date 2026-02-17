import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.jpg";

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
        <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, price_cents, compare_price_cents, featured, product_images(url, alt)")
          .eq("active", true)
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        setProducts((data as Product[]) ?? []);
      } catch (err: any) {
        setError("Erro ao carregar produtos.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="brekpuff — estoque secreto +18" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-secondary/85" />
        </div>
        <div className="container-bp relative flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-display max-w-3xl text-secondary-foreground md:text-6xl"
          >
            Seu estoque secreto, suas <span className="text-gradient-lime">regras</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="mt-4 max-w-lg text-lg text-secondary-foreground/70"
          >
            Catálogo restrito +18. Pagamento indetectável via Pix ou Cripto. Entrega 100% discreta em embalagem neutra. Ninguém vai saber o que você comprou.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            className="mt-8"
          >
            <Link to="/produtos" aria-label="Acessar estoque secreto">
              <Button variant="default" size="lg" className="gap-2">
                Acessar estoque secreto
                <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Pix banner */}
      <section className="bg-yellow-soft" role="banner">
        <div className="container-bp flex items-center justify-center gap-3 py-3">
          <Lightning size={20} weight="fill" className="text-accent" />
          <p className="text-sm font-semibold text-accent-foreground">
            Pix anônimo: <span className="text-accent">5% OFF</span> em todo o catálogo restrito — sem rastros, sem burocracia.
          </p>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16" aria-labelledby="featured-heading">
        <div className="container-bp">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 id="featured-heading" className="text-heading">Seleção Reservada</h2>
              <p className="mt-1 text-muted-foreground">O que a galera +18 está levando agora.</p>
            </div>
            <Link to="/produtos" className="text-sm font-medium text-primary hover:underline">
              Ver todo o estoque →
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 py-16 text-center">
              <p className="text-destructive">{error}</p>
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
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">Reabastecendo o arsenal. Aguarde.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
