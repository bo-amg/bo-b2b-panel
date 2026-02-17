"use client";

import { useEffect, useState } from "react";
import { Heart, Package, ShoppingCart, Plus, Minus, Check, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface FavoriteItem {
  id: string;
  productCacheId: string;
  createdAt: string;
  product: {
    id: string;
    shopifyProductId: string;
    title: string;
    handle: string;
    vendor: string;
    variants: any;
    images: any;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const { addItem } = useCart();
  const [addedVariant, setAddedVariant] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/favorites").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([favs, prods]) => {
      setFavorites(favs);
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  async function removeFavorite(productCacheId: string) {
    await fetch(`/api/favorites?productCacheId=${productCacheId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.productCacheId !== productCacheId));
  }

  function getProductData(productCacheId: string) {
    return products.find((p: any) => p.id === productCacheId);
  }

  function handleAddToCart(product: any) {
    const variant = product.variants[0];
    if (!variant) return;
    const qty = quantities[variant.id] || 1;
    addItem({
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: variant.id,
      title: product.title,
      variantTitle: variant.title !== "Default Title" ? variant.title : undefined,
      sku: variant.sku,
      imageUrl: product.images[0]?.url,
      retailPrice: variant.retailPrice,
      wholesalePrice: variant.wholesalePrice,
      quantity: qty,
    });
    setAddedVariant(variant.id);
    setQuantities((prev) => ({ ...prev, [variant.id]: 1 }));
    setTimeout(() => setAddedVariant(null), 1200);
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-red-500 fill-current" />
        <h1 className="text-xl font-bold text-gray-900">Favorilerim</h1>
        <span className="text-sm text-gray-400">({favorites.length} ürün)</span>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-200" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Henüz favori ürününüz yok
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Ürün kataloğundan beğendiğiniz ürünleri favorilere ekleyin
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Package className="h-4 w-4" /> Ürünlere Git
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {favorites.map((fav) => {
            const product = getProductData(fav.productCacheId);
            if (!product) return null;
            const variant = product.variants[0];
            if (!variant) return null;
            const qty = quantities[variant.id] || 1;
            const images = product.images || [];

            return (
              <div
                key={fav.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition group"
              >
                {/* Görsel */}
                <Link href={`/products/${product.handle}`} className="block">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {images[0] ? (
                      <Image
                        src={images[0].url}
                        alt={product.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-200" />
                      </div>
                    )}
                    {/* İskonto badge */}
                    {product.discountPercent > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        %{product.discountPercent}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Favori kaldır butonu */}
                <div className="relative">
                  <button
                    onClick={() => removeFavorite(fav.productCacheId)}
                    className="absolute -top-4 right-2 p-1.5 bg-white rounded-full shadow-md text-red-400 hover:text-red-600 transition z-10"
                    title="Favorilerden kaldır"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Bilgi */}
                <div className="p-2.5">
                  {product.vendor && (
                    <p className="text-[9px] text-blue-600 font-semibold uppercase tracking-wider truncate">
                      {product.vendor}
                    </p>
                  )}
                  <Link href={`/products/${product.handle}`}>
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight mt-0.5 mb-2 hover:text-blue-600 transition">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Fiyat */}
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[10px] text-gray-400">
                      {formatCurrency(variant.retailPrice)}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(variant.wholesalePrice)}
                    </span>
                  </div>

                  {/* Adet + Sepete Ekle */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        onClick={() => setQuantities((prev) => ({ ...prev, [variant.id]: Math.max(1, (prev[variant.id] || 1) - 1) }))}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="w-6 text-center text-[10px]">{qty}</span>
                      <button
                        onClick={() => setQuantities((prev) => ({ ...prev, [variant.id]: (prev[variant.id] || 1) + 1 }))}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={variant.inventoryQuantity <= 0}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition ${
                        addedVariant === variant.id
                          ? "bg-green-500 text-white"
                          : variant.inventoryQuantity <= 0
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {addedVariant === variant.id ? (
                        <><Check className="h-2.5 w-2.5" /> Eklendi</>
                      ) : (
                        <><ShoppingCart className="h-2.5 w-2.5" /> Ekle</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
