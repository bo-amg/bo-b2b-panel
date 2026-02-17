"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  X,
  ChevronDown,
  Tag,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Collection {
  id: string;
  title: string;
}

interface Product {
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  images: Array<{ url: string; altText: string | null }>;
  collections: Collection[];
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
}

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "discount-desc";

const sortLabels: Record<SortOption, string> = {
  "name-asc": "A-Z",
  "name-desc": "Z-A",
  "price-asc": "Fiyat ↑",
  "price-desc": "Fiyat ↓",
  "discount-desc": "İskonto ↓",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [stockOnly, setStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();
  const [addedVariant, setAddedVariant] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const collections = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      ((p.collections as any[]) || []).forEach((c: any) => {
        if (c.title && !c.title.toLowerCase().includes("yedek parça") && c.title !== "All") {
          map.set(c.id, c.title);
        }
      });
    });
    return [...map.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, "tr"));
  }, [products]);

  const vendors = useMemo(() => {
    return [...new Set(products.map((p) => p.vendor).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(s) ||
        p.vendor?.toLowerCase().includes(s) ||
        p.variants.some((v) => v.sku?.toLowerCase().includes(s));
      const matchCollection =
        !selectedCollection ||
        ((p.collections as any[]) || []).some((c: any) => c.id === selectedCollection);
      const matchVendor = !selectedVendor || p.vendor === selectedVendor;
      const matchStock = !stockOnly || p.variants.some((v) => v.inventoryQuantity > 0);
      return matchSearch && matchCollection && matchVendor && matchStock;
    });

    result.sort((a, b) => {
      // Önce stok durumuna göre: stokta olanlar üstte, tükenenler altta
      const aInStock = a.variants.some((v) => v.inventoryQuantity > 0) ? 0 : 1;
      const bInStock = b.variants.some((v) => v.inventoryQuantity > 0) ? 0 : 1;
      if (aInStock !== bInStock) return aInStock - bInStock;

      // Sonra seçilen sıralamaya göre
      switch (sortBy) {
        case "name-asc": return a.title.localeCompare(b.title, "tr");
        case "name-desc": return b.title.localeCompare(a.title, "tr");
        case "price-asc": return (a.variants[0]?.wholesalePrice || 0) - (b.variants[0]?.wholesalePrice || 0);
        case "price-desc": return (b.variants[0]?.wholesalePrice || 0) - (a.variants[0]?.wholesalePrice || 0);
        case "discount-desc": return b.discountPercent - a.discountPercent;
        default: return 0;
      }
    });
    return result;
  }, [products, search, selectedCollection, selectedVendor, stockOnly, sortBy]);

  // Arama önerileri
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    const s = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.vendor?.toLowerCase().includes(s) ||
          p.variants.some((v) => v.sku?.toLowerCase().includes(s))
      )
      .slice(0, 8);
  }, [products, search]);

  // Dışarı tıklanınca önerileri kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeFilterCount = [selectedCollection, selectedVendor, stockOnly].filter(Boolean).length;

  const getQuantity = useCallback((variantId: string) => quantities[variantId] || 1, [quantities]);

  function setQuantity(variantId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(1, qty) }));
  }

  function getActiveTier(product: Product, qty: number) {
    if (!product.discountTiers || product.discountTiers.length === 0) return null;
    return [...product.discountTiers].sort((a, b) => b.minQuantity - a.minQuantity).find((t) => qty >= t.minQuantity) || null;
  }

  function getNextTier(product: Product, qty: number) {
    if (!product.discountTiers || product.discountTiers.length === 0) return null;
    return [...product.discountTiers].sort((a, b) => a.minQuantity - b.minQuantity).find((t) => qty < t.minQuantity) || null;
  }

  function handleAddToCart(product: Product, variant: any) {
    const qty = getQuantity(variant.id);
    const activeTier = getActiveTier(product, qty);
    const effectiveDiscount = activeTier ? activeTier.discountPercent : product.discountPercent;
    const wholesalePrice = variant.retailPrice * (1 - effectiveDiscount / 100);
    addItem({
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: variant.id,
      title: product.title,
      variantTitle: variant.title !== "Default Title" ? variant.title : undefined,
      sku: variant.sku,
      imageUrl: product.images[0]?.url,
      retailPrice: variant.retailPrice,
      wholesalePrice: Math.round(wholesalePrice * 100) / 100,
      quantity: qty,
    });
    setAddedVariant(variant.id);
    setQuantities((prev) => ({ ...prev, [variant.id]: 1 }));
    setTimeout(() => setAddedVariant(null), 1200);
  }

  function clearFilters() {
    setSelectedCollection("");
    setSelectedVendor("");
    setStockOnly(false);
    setSearch("");
  }

  if (loading) {
    return (
      <div>
        <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-2 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sticky Filtre Barı */}
      <div className="sticky top-14 md:top-0 z-10 bg-gray-50 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 pt-1">
        {/* Üst satır: Arama + hızlı kontroller */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1" ref={searchRef}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Ürün, marka veya SKU ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => search.length >= 2 && setShowSuggestions(true)}
              className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(""); setShowSuggestions(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.handle}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition"
                  >
                    {p.images[0] ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.title}
                        width={36}
                        height={36}
                        className="rounded object-contain bg-gray-50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.vendor && `${p.vendor} · `}
                        {formatCurrency(p.variants[0]?.wholesalePrice || 0)}
                      </p>
                    </div>
                    {p.discountPercent > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                        %{p.discountPercent}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtre
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sıralama chip'leri */}
          <div className="hidden md:flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {Object.entries(sortLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key as SortOption)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition ${
                  sortBy === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-gray-400 whitespace-nowrap hidden sm:block">
            {filtered.length} ürün
          </span>
        </div>

        {/* Genişletilmiş Filtre Paneli */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-2 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[150px]">
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full appearance-none pl-2.5 pr-7 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white"
              >
                <option value="">Tüm Kategoriler</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[130px]">
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full appearance-none pl-2.5 pr-7 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white"
              >
                <option value="">Tüm Markalar</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>

            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(e) => setStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Stokta olanlar
            </label>

            {/* Mobil sıralama */}
            <div className="relative min-w-[100px] md:hidden">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none pl-2.5 pr-7 py-1.5 border border-gray-200 rounded-md outline-none text-xs bg-white"
              >
                {Object.entries(sortLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" /> Temizle
              </button>
            )}
          </div>
        )}

        {/* Aktif filtre chip'leri */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCollection && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                <Tag className="h-2.5 w-2.5" />
                {collections.find((c) => c.id === selectedCollection)?.title}
                <button onClick={() => setSelectedCollection("")}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {selectedVendor && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                {selectedVendor}
                <button onClick={() => setSelectedVendor("")}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
            {stockOnly && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                Stokta
                <button onClick={() => setStockOnly(false)}><X className="h-2.5 w-2.5" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ürün Grid - 6 sütun */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium">Ürün bulunamadı</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-2.5">
          {filtered.map((product) => {
            const variant = product.variants[0];
            if (!variant) return null;
            const qty = getQuantity(variant.id);
            const activeTier = getActiveTier(product, qty);
            const nextTier = getNextTier(product, qty);
            const effectiveDiscount = activeTier ? activeTier.discountPercent : product.discountPercent;
            const effectiveWholesale = variant.retailPrice * (1 - effectiveDiscount / 100);
            const hasMultipleVariants = product.variants.length > 1;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition group"
              >
                {/* Görsel - tıklanınca detaya git */}
                <Link href={`/products/${product.handle}`} className="block">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 33vw, 16vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-200" />
                      </div>
                    )}
                    {/* İskonto badge */}
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      %{effectiveDiscount}
                    </div>
                    {/* Stok yok overlay */}
                    {product.variants.every((v) => v.inventoryQuantity <= 0) && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-600 text-[10px] font-semibold px-2 py-1 rounded">
                          Tükendi
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Bilgi */}
                <div className="p-2">
                  {product.vendor && (
                    <p className="text-[9px] text-blue-600 font-semibold uppercase tracking-wider truncate">
                      {product.vendor}
                    </p>
                  )}
                  <Link href={`/products/${product.handle}`}>
                    <h3 className="text-[11px] font-medium text-gray-900 line-clamp-2 leading-tight mt-0.5 mb-1.5 min-h-[28px] hover:text-blue-600 transition">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Fiyatlar */}
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span className="text-[10px] text-gray-400">
                      {formatCurrency(variant.retailPrice)}
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      {formatCurrency(Math.round(effectiveWholesale * 100) / 100)}
                    </span>
                  </div>

                  {/* Tier bilgisi (varsa) */}
                  {product.discountTiers && product.discountTiers.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-0.5">
                      {product.discountTiers
                        .sort((a, b) => a.minQuantity - b.minQuantity)
                        .map((tier) => (
                          <span
                            key={tier.minQuantity}
                            className={`text-[8px] px-1 py-px rounded ${
                              activeTier?.minQuantity === tier.minQuantity
                                ? "bg-green-100 text-green-700 font-semibold"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {tier.minQuantity}+=%{tier.discountPercent}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Stok */}
                  <p className="text-[9px] text-gray-400 mb-1.5">
                    Stok: {variant.inventoryQuantity}
                    {hasMultipleVariants && ` · ${product.variants.length} varyant`}
                  </p>

                  {/* Adet + Sepete Ekle */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        onClick={() => setQuantity(variant.id, qty - 1)}
                        disabled={qty <= 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQuantity(variant.id, parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-7 text-center text-[10px] border-x border-gray-200 py-0.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantity(variant.id, qty + 1)}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product, variant)}
                      disabled={variant.inventoryQuantity <= 0}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium transition ${
                        addedVariant === variant.id
                          ? "bg-green-500 text-white"
                          : variant.inventoryQuantity <= 0
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                      }`}
                    >
                      {addedVariant === variant.id ? (
                        <><Check className="h-2.5 w-2.5" /> Eklendi</>
                      ) : (
                        <><ShoppingCart className="h-2.5 w-2.5" /> Ekle</>
                      )}
                    </button>
                  </div>

                  {/* Sonraki tier notu */}
                  {nextTier && (
                    <p className="text-[8px] text-orange-600 mt-1 bg-orange-50 px-1.5 py-0.5 rounded text-center">
                      {nextTier.minQuantity}+ adet = %{nextTier.discountPercent}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
