import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  compare_price_cents: number | null;
  product_images: { url: string; alt: string | null }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega categorias
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");

      if (error) {
        console.error("Erro ao carregar categorias:", error);
      } else {
        setCategories((data as Category[]) ?? []);
      }
    };
    fetchCategories();
  }, []);

  // Carrega produtos (com ou sem filtro)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("products")
        .select("id, name, slug, price_cents, compare_price_cents, product_images(url, alt)")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (selectedCat) {
        query = query.eq("category_id", selectedCat);
      }

      const { data, error } = await query;

      if (error) {
        setError("Erro ao carregar produtos.");
        console.error(error);
      } else {
        setProducts((data as Product[]) ?? []);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [selectedCat]);

  return (
    <section className="py-12">
      <div className="container-bp">
        <h1 className="text-heading mb-8">Estoque Restrito</h1>

        {/* Filtro por categoria */}
        {categories.length > 0 && (
          <div
            className="mb-8 flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por categoria"
          >
            <button
              onClick={() => setSelectedCat(null)}
              aria-pressed={!selectedCat}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${!selectedCat
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                aria-pressed={selectedCat === cat.id}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCat === cat.id
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Estado de loading */}
        {loading && <SkeletonGrid />}

        {/* Estado de erro */}
        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 py-16 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Produtos encontrados */}
        {!loading && !error && products.length > 0 && (
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
              />
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">Nenhum item disponível neste setor.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Componente reutilizável: Skeleton de grid
function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Carregando produtos">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
