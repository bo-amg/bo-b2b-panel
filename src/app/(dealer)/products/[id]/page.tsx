"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  Heart,
  Tag,
  Truck,
  Info,
  Clock,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

interface Product {
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  images: Array<{ url: string; altText: string | null }>;
  collections: Array<{ id: string; title: string }>;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    price: string;
    retailPrice: number;
    wholesalePrice: number;
    inventoryQuantity: number;
  }>;
  discountPercent: number;
  discountSource: string;
  discountTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  tags: string[];
  isPreorder?: boolean;
  preorderNote?: string | null;
}

export default function ProductDetailPage() {
  const { t, lang, currency } = useLanguage();
  const dateLocale = lang === "EN" ? "en-US" : "tr-TR";
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.handle === params.id);
        setProduct(found || null);
        setLoading(false);
      });
  }, [params.id]);

  // Son görüntülenen ürünlere ekle
  useEffect(() => {
    if (!product) return;
    try {
      const key = "b2b-recently-viewed";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = stored.filter((item: any) => item.handle !== product.handle);
      filtered.unshift({
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        imageUrl: product.images[0]?.url || null,
        wholesalePrice: product.variants[0]?.wholesalePrice || 0,
        viewedAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 20)));
    } catch {}
  }, [product]);

  // Favori durumu kontrol
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((favs: any[]) => {
        if (product) {
          setIsFavorite(favs.some((f) => f.productCacheId === product.id));
        }
      })
      .catch(() => {});
  }, [product]);

  const variant = product?.variants[0];

  function getActiveTier(qty: number) {
    if (!product?.discountTiers || product.discountTiers.length === 0) return null;
    return [...product.discountTiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((t) => qty >= t.minQuantity) || null;
  }

  function getNextTier(qty: number) {
    if (!product?.discountTiers || product.discountTiers.length === 0) return null;
    return [...product.discountTiers]
      .sort((a, b) => a.minQuantity - b.minQuantity)
      .find((t) => qty < t.minQuantity) || null;
  }

  const activeTier = getActiveTier(quantity);
  const nextTier = getNextTier(quantity);
  const effectiveDiscount = activeTier ? activeTier.discountPercent : (product?.discountPercent || 0);
  const effectiveWholesale = variant ? variant.retailPrice * (1 - effectiveDiscount / 100) : 0;

  function handleAddToCart() {
    if (!product || !variant) return;
    addItem({
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: variant.id,
      title: product.title,
      variantTitle: variant.title !== "Default Title" ? variant.title : undefined,
      sku: variant.sku,
      imageUrl: product.images[0]?.url,
      retailPrice: variant.retailPrice,
      wholesalePrice: Math.round(effectiveWholesale * 100) / 100,
      quantity,
      isPreorder: product.isPreorder || false,
    });
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  }

  async function toggleFavorite() {
    if (!product) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productCacheId=${product.id}`, { method: "DELETE" });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productCacheId: product.id }),
        });
        setIsFavorite(true);
      }
    } catch {}
    setFavLoading(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">{t("productDetail.notFound")}</h2>
        <Link href="/products" className="text-blue-600 hover:underline text-sm">
          {t("productDetail.backToCatalog")}
        </Link>
      </div>
    );
  }

  const totalStock = product.variants.reduce((s, v) => s + v.inventoryQuantity, 0);
  const isOutOfStock = !variant || (variant.inventoryQuantity <= 0 && !product.isPreorder);

  return (
    <div>
      {/* Geri butonu */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> {t("productDetail.back")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol: Görseller */}
        <div>
          {/* Ana görsel */}
          <div className="relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.title}
                fill
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-20 w-20 text-gray-200" />
              </div>
            )}
            {/* İskonto badge */}
            <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg shadow">
              %{effectiveDiscount}
            </div>
            {/* Favori butonu */}
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`absolute top-3 right-3 p-2 rounded-full shadow transition ${
                isFavorite
                  ? "bg-red-50 text-red-500"
                  : "bg-white/80 text-gray-400 hover:text-red-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            {/* Ön sipariş badge */}
            {product.isPreorder && (
              <div className="absolute top-3 left-3 mt-10 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {t("productDetail.preorderProduct")}
              </div>
            )}
            {/* Stok yok overlay - ön sipariş değilse */}
            {totalStock <= 0 && !product.isPreorder && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg">
                  {t("products.outOfStock")}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail'ler */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg border-2 overflow-hidden transition ${
                    selectedImage === i
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.title} - ${i + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sag: Bilgiler */}
        <div>
          {/* Marka */}
          {product.vendor && (
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">
              {product.vendor}
            </p>
          )}

          {/* Baslik */}
          <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {product.title}
          </h1>

          {/* Ön sipariş bilgi banner */}
          {product.isPreorder && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">{t("productDetail.preorderProduct")}</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {product.preorderNote || t("productDetail.preorderDefault")}
                </p>
              </div>
            </div>
          )}

          {/* Kategoriler */}
          {product.collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.collections
                .filter((c) => c.title !== "All" && !c.title.toLowerCase().includes("yedek parça"))
                .map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    <Tag className="h-2.5 w-2.5" />
                    {c.title}
                  </span>
                ))}
            </div>
          )}

          {/* Fiyatlar */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-end gap-3 mb-1">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t("productDetail.retailPrice")}</p>
                <p className="text-lg text-gray-400">
                  {variant ? formatCurrency(variant.retailPrice, currency) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-600 mb-0.5 font-medium">{t("productDetail.dealerPrice")}</p>
                <p className="text-2xl font-bold text-green-600">
                  {variant ? formatCurrency(Math.round(effectiveWholesale * 100) / 100, currency) : "-"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              %{effectiveDiscount} {t("productDetail.discountApplied")} · {t("productDetail.source")}: {product.discountSource}
            </p>
          </div>

          {/* Kademe iskontolar */}
          {product.discountTiers && product.discountTiers.length > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> {t("productDetail.tierDiscounts")}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.discountTiers
                  .sort((a, b) => a.minQuantity - b.minQuantity)
                  .map((tier) => (
                    <div
                      key={tier.minQuantity}
                      className={`text-xs px-3 py-1.5 rounded-lg border ${
                        activeTier?.minQuantity === tier.minQuantity
                          ? "bg-green-100 border-green-300 text-green-700 font-semibold"
                          : "bg-white border-orange-200 text-orange-600"
                      }`}
                    >
                      {tier.minQuantity}+ {t("productDetail.tierUnit")} → %{tier.discountPercent}
                    </div>
                  ))}
              </div>
              {nextTier && (
                <p className="text-[11px] text-orange-600 mt-2">
                  {nextTier.minQuantity} {t("productDetail.tierBuy")} %{nextTier.discountPercent} {t("productDetail.tierEarn")}
                </p>
              )}
            </div>
          )}

          {/* Stok bilgisi */}
          {variant && (
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5">
                {product.isPreorder && variant.inventoryQuantity <= 0 ? (
                  <>
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">{t("productDetail.preorderAvailable")}</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className={variant.inventoryQuantity > 0 ? "text-green-600 font-medium" : "text-red-500"}>
                      {variant.inventoryQuantity > 0
                        ? `${variant.inventoryQuantity} ${t("productDetail.inStock")}`
                        : t("productDetail.outOfStock")}
                    </span>
                  </>
                )}
              </div>
              {variant.sku && (
                <span className="text-gray-400">SKU: {variant.sku}</span>
              )}
            </div>
          )}

          {/* Adet + Sepete Ekle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="p-2.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-14 text-center text-sm font-medium border-x border-gray-300 py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 text-gray-500 hover:text-gray-700 transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition ${
                added
                  ? "bg-green-500 text-white"
                  : isOutOfStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : product.isPreorder && variant && variant.inventoryQuantity <= 0
                  ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {added ? (
                <><Check className="h-4 w-4" /> {t("productDetail.addedToCart")}</>
              ) : isOutOfStock ? (
                t("productDetail.outOfStock")
              ) : product.isPreorder && variant && variant.inventoryQuantity <= 0 ? (
                <><Clock className="h-4 w-4" /> {t("productDetail.placePreorder")}</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> {t("productDetail.addToCart")}</>
              )}
            </button>
          </div>

          {/* Toplam satır bilgisi */}
          {variant && (!isOutOfStock || product.isPreorder) && (
            <div className="bg-blue-50 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-gray-600">{quantity} {t("productDetail.tierUnit")} × {formatCurrency(Math.round(effectiveWholesale * 100) / 100, currency)} = </span>
              <span className="font-bold text-blue-700">
                {formatCurrency(Math.round(effectiveWholesale * quantity * 100) / 100, currency)}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
