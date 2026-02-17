import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ShareNetwork, Copy, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { formatBRL } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  compare_price_cents: number | null;
  stock: number;
  metadata: any;
  product_images: { id: string; url: string; alt: string | null; sort: number }[];
}

interface Relato {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, description, price_cents, compare_price_cents, stock, metadata, product_images(id, url, alt, sort)")
        .eq("slug", slug)
        .eq("active", true)
        .single();
      if (error || !data) { setError("Item indisponível."); setLoading(false); return; }
      setProduct(data as ProductDetail);
      const { data: rels } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles(username, avatar_url)")
        .eq("product_id", data.id)
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (rels) setRelatos(rels as unknown as Relato[]);
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const avgRating = relatos.length
    ? Math.round(relatos.reduce((s, r) => s + r.rating, 0) / relatos.length)
    : 0;

  const handleAdd = async () => {
    if (!user) { toast.error("Faça login para garantir"); return; }
    if (!product) return;
    await addItem(product.id, qty);
    toast.success(`${qty}x ${product.name} adicionado ao seu pacote`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url: window.location.href });
      } catch { }
    }
  };

  if (loading) return <SkeletonBPKF />;

  if (error || !product) {
    return (
      <div className="container-bp py-20 text-center">
        <h1 className="text-heading mb-4">Item indisponível</h1>
        <Link to="/produtos" className="text-primary hover:underline">
          ← Voltar ao estoque
        </Link>
      </div>
    );
  }

  const images = product.product_images?.sort((a, b) => a.sort - b.sort) ?? [];
  const variants = product.metadata?.variants as string[] | undefined;

  return (
    <section className="py-12">
      <div className="container-bp">
        <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Início</Link>
          {" / "}
          <Link to="/produtos" className="hover:text-primary">Estoque</Link>
          {" / "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">Sem imagem</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-border"
                      }`}
                  >
                    <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-heading">{product.name}</h1>
              {avgRating > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={avgRating} size={16} />
                  <span className="text-sm text-muted-foreground">
                    ({relatos.length} avaliaç{relatos.length > 1 ? "ões" : "ão"})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatBRL(product.price_cents)}</span>
              {product.compare_price_cents && product.compare_price_cents > product.price_cents && (
                <span className="text-lg text-muted-foreground line-through">{formatBRL(product.compare_price_cents)}</span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.description ?? "Descrição confidencial."}
            </p>

            {variants && variants.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Variante</h4>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      aria-pressed={selectedVariant === v}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${selectedVariant === v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-sm font-semibold">Quantidade</h4>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center">{qty}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className="flex-1 gap-2"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? "Adicionar ao pacote" : "Sem estoque"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyLink} aria-label="Copiar link">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} aria-label="Compartilhar">
                <ShareNetwork size={18} />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {product.stock > 0
                ? `${product.stock} unidades prontas para envio discreto`
                : "Fora de estoque"}

            </p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-subheading mb-6">Avaliações verificadas</h2>
          {relatos.length > 0 ? (
            <div className="space-y-4">
              {relatos.map((rel) => (
                <div key={rel.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                      {(rel.profiles?.username ?? "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{rel.profiles?.username ?? "Anônimo"}</span>
                    <StarRating rating={rel.rating} size={14} />
                  </div>
                  {rel.comment && <p className="text-sm text-muted-foreground">{rel.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SkeletonBPKF() {
  return (
    <div className="container-bp py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
