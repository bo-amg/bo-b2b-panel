"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Package,
  Search,
  Clock,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Save,
  AlertCircle,
  DollarSign,
  Globe,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

type FilterMode = "all" | "preorder" | "normal";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Toplu seçim
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Ön sipariş notu modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [preorderNote, setPreorderNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Görünürlük
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  // USD fiyat modal
  const [showUsdModal, setShowUsdModal] = useState(false);
  const [usdProduct, setUsdProduct] = useState<any>(null);
  const [usdPrices, setUsdPrices] = useState<Record<string, string>>({});
  const [usdLoading, setUsdLoading] = useState(false);
  const [usdSaving, setUsdSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/products/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message);
        await fetchProducts();
      } else {
        setSyncMessage("Hata: " + data.error);
      }
    } catch {
      setSyncMessage("Sync sırasında bir hata oluştu");
    }
    setSyncing(false);
  }

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.vendor || "").toLowerCase().includes(q) ||
          (p.productType || "").toLowerCase().includes(q)
      );
    }

    if (filterMode === "preorder") {
      result = result.filter((p) => p.isPreorder);
    } else if (filterMode === "normal") {
      result = result.filter((p) => !p.isPreorder);
    }

    return result;
  }, [products, search, filterMode]);

  // Toplu seçim
  function toggleSelectAll() {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  async function handleBulkPreorder(isPreorder: boolean) {
    if (selectedIds.size === 0) return;

    if (isPreorder) {
      setShowNoteModal(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/products/preorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          isPreorder: false,
          preorderNote: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`${data.updated} üründe ön sipariş kapatıldı`);
        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id)
              ? { ...p, isPreorder: false, preorderNote: null }
              : p
          )
        );
        setSelectedIds(new Set());
        setBulkMode(false);
      }
    } catch {
      setSyncMessage("Hata oluştu");
    }
    setSaving(false);
  }

  async function handleSavePreorder() {
    if (selectedIds.size === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/products/preorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          isPreorder: true,
          preorderNote: preorderNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`${data.updated} üründe ön sipariş açıldı`);
        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id)
              ? { ...p, isPreorder: true, preorderNote: preorderNote.trim() || null }
              : p
          )
        );
        setSelectedIds(new Set());
        setBulkMode(false);
        setShowNoteModal(false);
        setPreorderNote("");
      }
    } catch {
      setSyncMessage("Hata oluştu");
    }
    setSaving(false);
  }

  async function handleTogglePreorder(product: any) {
    const newStatus = !product.isPreorder;
    try {
      await fetch("/api/products/preorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [product.id],
          isPreorder: newStatus,
          preorderNote: newStatus ? product.preorderNote : null,
        }),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, isPreorder: newStatus, preorderNote: newStatus ? p.preorderNote : null }
            : p
        )
      );
    } catch {}
  }

  async function openUsdModal(product: any) {
    setUsdProduct(product);
    setShowUsdModal(true);
    setUsdLoading(true);
    setUsdPrices({});

    try {
      const res = await fetch(`/api/admin/usd-prices?productId=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        // data is expected to be { variantId: price, ... }
        const priceMap: Record<string, string> = {};
        for (const [variantId, price] of Object.entries(data)) {
          priceMap[variantId] = price != null ? String(price) : "";
        }
        setUsdPrices(priceMap);
      }
    } catch {
      // ignore - will show empty inputs
    }
    setUsdLoading(false);
  }

  async function handleSaveUsdPrices() {
    if (!usdProduct) return;
    setUsdSaving(true);

    const pricePayload: Record<string, number | null> = {};
    for (const [variantId, val] of Object.entries(usdPrices)) {
      const num = parseFloat(val);
      pricePayload[variantId] = isNaN(num) ? null : num;
    }

    try {
      const res = await fetch("/api/admin/usd-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: usdProduct.id,
          usdPrices: pricePayload,
        }),
      });
      if (res.ok) {
        setSyncMessage("USD fiyatları kaydedildi");
        setShowUsdModal(false);
        setUsdProduct(null);
      } else {
        const data = await res.json();
        setSyncMessage("Hata: " + (data.error || "USD fiyat kaydedilemedi"));
      }
    } catch {
      setSyncMessage("Hata: USD fiyat kaydedilemedi");
    }
    setUsdSaving(false);
  }

  async function handleVisibilityChange(productId: string, visibility: string) {
    try {
      const res = await fetch("/api/admin/products/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId], visibility }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, visibility } : p))
        );
      }
    } catch {}
  }

  async function handleBulkVisibility(visibility: string) {
    if (selectedIds.size === 0) return;
    setVisibilitySaving(true);
    try {
      const res = await fetch("/api/admin/products/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedIds), visibility }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`${data.updated} urun gorunurlugu "${visibility}" olarak guncellendi`);
        setProducts((prev) =>
          prev.map((p) => (selectedIds.has(p.id) ? { ...p, visibility } : p))
        );
        setSelectedIds(new Set());
        setBulkMode(false);
      }
    } catch {
      setSyncMessage("Hata olustu");
    }
    setVisibilitySaving(false);
  }

  const selectAllState =
    selectedIds.size === 0
      ? "none"
      : selectedIds.size === filteredProducts.length
        ? "all"
        : "partial";

  const preorderCount = products.filter((p) => p.isPreorder).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} ürün
            {preorderCount > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                • {preorderCount} ön sipariş
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedIds(new Set());
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              bulkMode
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            {bulkMode ? "Seçimi Kapat" : "Toplu Düzenle"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sync..." : "Shopify Sync"}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            syncMessage.startsWith("Hata")
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {syncMessage.startsWith("Hata") && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {syncMessage}
          <button onClick={() => setSyncMessage("")} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Arama + Filtre */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara... (isim, marka, kategori)"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              filterMode === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tümü ({products.length})
          </button>
          <button
            onClick={() => setFilterMode("preorder")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 ${
              filterMode === "preorder"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="h-3 w-3" />
            Ön Sipariş ({preorderCount})
          </button>
          <button
            onClick={() => setFilterMode("normal")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              filterMode === "normal"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Normal ({products.length - preorderCount})
          </button>
        </div>
      </div>

      {/* Toplu işlem çubuğu */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-orange-800 font-medium">
            {selectedIds.size} ürün seçildi
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkPreorder(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              <Clock className="h-3.5 w-3.5" />
              Ön Sipariş Aç
            </button>
            <button
              onClick={() => handleBulkPreorder(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-gray-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-600 transition disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              On Siparis Kapat
            </button>
            <span className="w-px h-6 bg-orange-200" />
            <button
              onClick={() => handleBulkVisibility("ALL")}
              disabled={visibilitySaving}
              className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-600 transition disabled:opacity-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Tumu
            </button>
            <button
              onClick={() => handleBulkVisibility("TR_ONLY")}
              disabled={visibilitySaving}
              className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              TR
            </button>
            <button
              onClick={() => handleBulkVisibility("GLOBAL_ONLY")}
              disabled={visibilitySaving}
              className="inline-flex items-center gap-1.5 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-600 transition disabled:opacity-50"
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yükleniyor...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {search
              ? "Arama sonucu bulunamadı"
              : filterMode === "preorder"
                ? "Henüz ön sipariş ürün yok"
                : "Henüz ürün senkronize edilmemiş"}
          </p>
          {!search && filterMode === "all" && (
            <button
              onClick={handleSync}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
            >
              İlk Sync&apos;i Başlat
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {bulkMode && (
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectAllState === "all" ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : selectAllState === "partial" ? (
                        <MinusSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Ürün
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Marka
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Fiyat
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Stok
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Gorunurluk
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  On Siparis
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  USD
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const firstVariant = product.variants[0];
                const totalStock = product.variants.reduce(
                  (sum: number, v: any) => sum + (v.inventoryQuantity || 0),
                  0
                );
                const isSelected = selectedIds.has(product.id);

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 transition ${
                      isSelected ? "bg-orange-50/50" : ""
                    } ${product.isPreorder ? "border-l-2 border-l-orange-400" : ""}`}
                  >
                    {bulkMode && (
                      <td className="w-10 px-4 py-4">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={product.images[0].url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </span>
                          {product.isPreorder && product.preorderNote && (
                            <p className="text-[10px] text-orange-600 mt-0.5 line-clamp-1">
                              {product.preorderNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.vendor || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {firstVariant && formatCurrency(firstVariant.retailPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-medium ${totalStock > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select
                        value={product.visibility || "ALL"}
                        onChange={(e) => handleVisibilityChange(product.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer transition ${
                          product.visibility === "TR_ONLY"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : product.visibility === "GLOBAL_ONLY"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <option value="ALL">Tumu</option>
                        <option value="TR_ONLY">Sadece TR</option>
                        <option value="GLOBAL_ONLY">Sadece Global</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleTogglePreorder(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          product.isPreorder
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {product.isPreorder ? "Acik" : "Kapali"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openUsdModal(product)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition text-sm font-bold"
                        title="USD Fiyat"
                      >
                        $
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* USD Fiyat Modal */}
      {showUsdModal && usdProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
              <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                USD Fiyat Ayarla
              </h3>
              <p className="text-sm text-green-700 mt-1 line-clamp-1">
                {usdProduct.title}
              </p>
            </div>
            <div className="p-6">
              {usdLoading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {usdProduct.variants.map((variant: any) => (
                    <div
                      key={variant.id}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {variant.title === "Default Title" ? "Varsayılan" : variant.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          TRY: {formatCurrency(variant.retailPrice)}
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={usdPrices[variant.id] ?? ""}
                            onChange={(e) =>
                              setUsdPrices((prev) => ({
                                ...prev,
                                [variant.id]: e.target.value,
                              }))
                            }
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUsdModal(false);
                    setUsdProduct(null);
                    setUsdPrices({});
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveUsdPrices}
                  disabled={usdSaving || usdLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {usdSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ön Sipariş Not Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
              <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ön Sipariş Ayarı
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                {selectedIds.size} ürün için ön sipariş açılacak
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ön Sipariş Notu (opsiyonel)
                </label>
                <textarea
                  value={preorderNote}
                  onChange={(e) => setPreorderNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  placeholder="Örn: Tahmini teslimat tarihi: Mart 2026 sonu"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Bu not bayilere ürün kartında gösterilecektir
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setPreorderNote("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleSavePreorder}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
