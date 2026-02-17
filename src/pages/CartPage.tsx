import { Link } from "react-router-dom";
import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/components/ProductCard";

export default function CartPage() {
  const { items, totalCents, loading, updateQty, removeItem } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="py-20">
        <div className="container-bp text-center">
          <h1 className="text-heading mb-4">Seus Itens</h1>
          <p className="text-muted-foreground mb-6">Faça login para ver seu estoque.</p>
          <Link to="/auth">
            <Button variant="secondary">Entrar</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-bp">
        <h1 className="text-heading mb-8">Seus Itens</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground mb-4">Seu estoque secreto está vazio</p>
            <Link to="/produtos">
              <Button variant="secondary">Acessar estoque</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/produto/${item.product?.slug}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product?.name ?? "Item selecionado"}
                    </Link>
                    <p className="text-sm text-primary font-bold mt-1">
                      {formatBRL(item.product?.price_cents ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.product_id, item.qty - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.product_id, item.qty + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card p-6 h-fit space-y-4">
              <h3 className="text-subheading">Resumo</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatBRL(totalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">{formatBRL(1500)}</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">{formatBRL(totalCents + 1500)}</span>
              </div>
              <Link to="/checkout" className="block">
                <Button className="w-full" size="lg">Garantir meu estoque agora</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
