import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CartItem {
  id: string;
  product_id: string;
  qty: number;
  product?: {
    name: string;
    slug: string;
    price_cents: number;
    image_url?: string;
  };
}

interface CartCtx {
  items: CartItem[];
  count: number;
  totalCents: number;
  loading: boolean;
  addItem: (productId: string, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartCtx>({
  items: [],
  count: 0,
  totalCents: 0,
  loading: false,
  addItem: async () => {},
  updateQty: async () => {},
  removeItem: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, qty, products(name, slug, price_cents)")
      .eq("user_id", user.id);

    if (data) {
      setItems(
        data.map((ci: any) => ({
          id: ci.id,
          product_id: ci.product_id,
          qty: ci.qty,
          product: ci.products
            ? {
                name: ci.products.name,
                slug: ci.products.slug,
                price_cents: ci.products.price_cents,
              }
            : undefined,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId: string, qty = 1) => {
    if (!user) return;
    await supabase.from("cart_items").upsert(
      { user_id: user.id, product_id: productId, qty },
      { onConflict: "user_id,product_id" }
    );
    await refresh();
  };

  const updateQty = async (productId: string, qty: number) => {
    if (!user) return;
    if (qty <= 0) return removeItem(productId);
    await supabase
      .from("cart_items")
      .update({ qty })
      .eq("user_id", user.id)
      .eq("product_id", productId);
    await refresh();
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    await refresh();
  };

  const count = items.reduce((s, i) => s + i.qty, 0);
  const totalCents = items.reduce(
    (s, i) => s + i.qty * (i.product?.price_cents ?? 0),
    0
  );

  return (
    <CartContext.Provider
      value={{ items, count, totalCents, loading, addItem, updateQty, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
