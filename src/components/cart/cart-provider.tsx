"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export interface CartItem {
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  variantTitle?: string;
  sku?: string;
  imageUrl?: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  isPreorder?: boolean;
  currency?: "TRY" | "USD";
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // localStorage'dan yükle
  useEffect(() => {
    const saved = localStorage.getItem("b2b-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
    setLoaded(true);
  }, []);

  // localStorage'a kaydet
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("b2b-cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.shopifyVariantId === newItem.shopifyVariantId
      );
      if (existing) {
        return prev.map((i) =>
          i.shopifyVariantId === newItem.shopifyVariantId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.shopifyVariantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.shopifyVariantId !== variantId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.shopifyVariantId === variantId ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce(
    (sum, i) => sum + i.wholesalePrice * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
