"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  Tags,
  Package,
  ChevronRight,
  X,
} from "lucide-react";

interface Tier {
  id: string;
  discountType: string;
  referenceId: string;
  minQuantity: number;
  discountPercent: number;
}

type Tab = "category" | "product";

export default function DiscountsPage() {
  const [tab, setTab] = useState<Tab>("category");
  const [categoryDiscounts, setCategoryDiscounts] = useState<any[]>([]);
  const [productDiscounts, setProductDiscounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Seçili öğe detayı
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Yeni iskonto formları
  const [newId, setNewId] = useState("");
  const [newPercent, setNewPercent] = useState("");

  // Yeni tier formu
  const [newTierQty, setNewTierQty] = useState("");
  const [newTierPercent, setNewTierPercent] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/discounts/category").then((r) => r.json()),
      fetch("/api/discounts/product").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/discounts/tiers").then((r) => r.json()),
    ]).then(([cats, prods, allProducts, allTiers]) => {
      setCategoryDiscounts(cats);
      setProductDiscounts(prods);
      setProducts(allProducts);
      setTiers(allTiers.filter((t: Tier) => t.discountType !== "global"));
      setLoading(false);
    });
  }, []);

  // Koleksiyonları ürünlerden çıkar
  const collections = new Map<string, string>();
  products.forEach((p: any) => {
    ((p.collections as any[]) || []).forEach((c: any) => {
      if (!collections.has(c.id)) collections.set(c.id, c.title);
    });
  });

  function getTiersFor(type: string, refId: string) {
    return tiers
      .filter((t) => t.discountType === type && t.referenceId === refId)
      .sort((a, b) => a.minQuantity - b.minQuantity);
  }

  // Filtrelenmiş listeler
  const filteredCategories = categoryDiscounts.filter((d) =>
    d.collectionTitle.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProducts = productDiscounts.filter((d) =>
    d.productTitle.toLowerCase().includes(search.toLowerCase())
  );

  // Henüz iskonto eklenmemiş seçenekler
  const availableCollections = [...collections.entries()].filter(
    ([id]) => !categoryDiscounts.some((d) => d.shopifyCollectionId === id)
  );
  const availableProducts = products.filter(
    (p: any) =>
      !productDiscounts.some((d) => d.shopifyProductId === p.shopifyProductId)
  );

  // === CRUD İşlemleri ===

  async function addDiscount() {
    if (!newId || !newPercent) return;
    setSaving(true);
    try {
      if (tab === "category") {
        const title = collections.get(newId) || newId;
        const res = await fetch("/api/discounts/category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopifyCollectionId: newId,
            collectionTitle: title,
            discountPercent: Number(newPercent),
          }),
        });
        const data = await res.json();
        setCategoryDiscounts((prev) => {
          const i = prev.findIndex((d) => d.shopifyCollectionId === newId);
          if (i >= 0) { const u = [...prev]; u[i] = data; return u; }
          return [...prev, data];
        });
      } else {
        const product = products.find((p: any) => p.shopifyProductId === newId);
        const res = await fetch("/api/discounts/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopifyProductId: newId,
            productTitle: product?.title || newId,
            discountPercent: Number(newPercent),
          }),
        });
        const data = await res.json();
        setProductDiscounts((prev) => {
          const i = prev.findIndex((d) => d.shopifyProductId === newId);
          if (i >= 0) { const u = [...prev]; u[i] = data; return u; }
          return [...prev, data];
        });
      }
      setNewId("");
      setNewPercent("");
    } catch {}
    setSaving(false);
  }

  async function deleteDiscount(id: string) {
    const endpoint = tab === "category" ? "category" : "product";
    await fetch(`/api/discounts/${endpoint}?id=${id}`, { method: "DELETE" });
    if (tab === "category") {
      setCategoryDiscounts((prev) => prev.filter((d) => d.id !== id));
    } else {
      setProductDiscounts((prev) => prev.filter((d) => d.id !== id));
    }
    if (selectedItem?.id === id) setSelectedItem(null);
  }

  async function addTier(discountType: string, referenceId: string) {
    if (!newTierQty || !newTierPercent) return;
    setSaving(true);
    try {
      const res = await fetch("/api/discounts/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType,
          referenceId,
          minQuantity: Number(newTierQty),
          discountPercent: Number(newTierPercent),
        }),
      });
      const data = await res.json();
      setTiers((prev) => {
        const filtered = prev.filter(
          (t) =>
            !(t.discountType === discountType &&
              t.referenceId === referenceId &&
              t.minQuantity === data.minQuantity)
        );
        return [...filtered, data];
      });
      setNewTierQty("");
      setNewTierPercent("");
    } catch {}
    setSaving(false);
  }

  async function deleteTier(id: string) {
    await fetch(`/api/discounts/tiers?id=${id}`, { method: "DELETE" });
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }

  function selectItem(item: any) {
    setSelectedItem(item);
    setNewTierQty("");
    setNewTierPercent("");
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Yükleniyor...</div>;
  }

  const currentList = tab === "category" ? filteredCategories : filteredProducts;
  const refIdKey = tab === "category" ? "shopifyCollectionId" : "shopifyProductId";
  const titleKey = tab === "category" ? "collectionTitle" : "productTitle";

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Sol Panel - Liste */}
      <div className="w-[420px] flex-shrink-0 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          İskonto Yönetimi
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          Bayi &gt; Ürün &gt; Kategori &gt; Global
        </p>

        {/* Tab seçici */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => { setTab("category"); setSelectedItem(null); setSearch(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
              tab === "category"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Tags className="h-4 w-4" />
            Kategori ({categoryDiscounts.length})
          </button>
          <button
            onClick={() => { setTab("product"); setSelectedItem(null); setSearch(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
              tab === "product"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="h-4 w-4" />
            Ürün ({productDiscounts.length})
          </button>
        </div>

        {/* Arama */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İskonto ara..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Yeni ekle */}
        <div className="flex gap-2 mb-4">
          <select
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-0"
          >
            <option value="">
              {tab === "category" ? "Koleksiyon seçin..." : "Ürün seçin..."}
            </option>
            {tab === "category"
              ? availableCollections.map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))
              : availableProducts.map((p: any) => (
                  <option key={p.shopifyProductId} value={p.shopifyProductId}>
                    {p.title}
                  </option>
                ))}
          </select>
          <div className="flex items-center border border-gray-200 rounded-lg bg-white">
            <input
              type="number"
              value={newPercent}
              onChange={(e) => setNewPercent(e.target.value)}
              placeholder="20"
              step="0.5"
              min="0"
              max="100"
              className="w-16 px-2 py-2 text-sm text-center outline-none rounded-l-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-400 text-sm pr-2">%</span>
          </div>
          <button
            onClick={addDiscount}
            disabled={saving || !newId || !newPercent}
            className={`px-3 py-2 rounded-lg text-white transition disabled:opacity-50 ${
              tab === "category"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {currentList.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {search ? "Sonuç bulunamadı" : "Henüz iskonto eklenmemiş"}
            </div>
          )}
          {currentList.map((d) => {
            const tierCount = getTiersFor(tab, d[refIdKey]).length;
            const isSelected = selectedItem?.id === d.id;

            return (
              <button
                key={d.id}
                onClick={() => selectItem(d)}
                className={`w-full text-left p-3 rounded-lg border transition group ${
                  isSelected
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {d[titleKey]}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-bold ${
                        tab === "category" ? "text-blue-600" : "text-green-600"
                      }`}>
                        %{Number(d.discountPercent)} sabit
                      </span>
                      {tierCount > 0 && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          +{tierCount} kademe
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 transition ${
                    isSelected ? "text-blue-500" : "text-gray-300 group-hover:text-gray-400"
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sağ Panel - Detay */}
      <div className="flex-1 min-w-0">
        {!selectedItem ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="text-center text-gray-400">
              <Tags className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Sol listeden bir iskonto seçin</p>
              <p className="text-xs mt-1">veya yeni iskonto ekleyin</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {tab === "category" ? "Kategori" : "Ürün"} İskontosu
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedItem[titleKey]}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${
                    tab === "category" ? "text-blue-600" : "text-green-600"
                  }`}>
                    %{Number(selectedItem.discountPercent)}
                  </div>
                  <button
                    onClick={() => deleteDiscount(selectedItem.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 text-gray-300 hover:text-gray-500 rounded-lg transition md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Kademeli İskonto Bölümü */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Kademeli İskonto Kuralları
                </h3>
                <p className="text-xs text-gray-500">
                  Minimum sipariş adedine göre farklı iskonto oranları tanımlayın.
                  Bayi belirlediğiniz adete ulaştığında otomatik olarak yüksek iskonto uygulanır.
                </p>
              </div>

              {/* Tier visual */}
              {(() => {
                const itemTiers = getTiersFor(tab, selectedItem[refIdKey]);
                const basePercent = Number(selectedItem.discountPercent);
                const allSteps = [
                  { minQuantity: 1, discountPercent: basePercent, isBase: true },
                  ...itemTiers.map((t) => ({ ...t, isBase: false })),
                ];

                return (
                  <div className="mb-6">
                    {/* Görsel bar */}
                    <div className="flex items-end gap-1 mb-4 h-32">
                      {allSteps.map((step, i) => {
                        const maxPercent = Math.max(...allSteps.map((s) => s.discountPercent), 50);
                        const height = Math.max(20, (step.discountPercent / maxPercent) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-gray-700">
                              %{step.discountPercent}
                            </span>
                            <div
                              className={`w-full rounded-t-md transition-all ${
                                step.isBase
                                  ? tab === "category" ? "bg-blue-400" : "bg-green-400"
                                  : "bg-purple-400"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-[10px] text-gray-500">
                              {step.isBase ? "Sabit" : `${step.minQuantity}+ ad.`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tier listesi */}
                    <div className="space-y-2">
                      {/* Sabit oran */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-8 rounded ${
                          tab === "category" ? "bg-blue-400" : "bg-green-400"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Sabit İskonto</p>
                          <p className="text-xs text-gray-400">Tüm adetlerde geçerli</p>
                        </div>
                        <span className={`text-lg font-bold ${
                          tab === "category" ? "text-blue-600" : "text-green-600"
                        }`}>
                          %{basePercent}
                        </span>
                      </div>

                      {/* Kademeli oranlar */}
                      {itemTiers.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg group"
                        >
                          <div className="w-2 h-8 rounded bg-purple-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              {t.minQuantity}+ adet
                            </p>
                            <p className="text-xs text-gray-400">
                              Minimum {t.minQuantity} adet siparişte
                            </p>
                          </div>
                          <span className="text-lg font-bold text-purple-600">
                            %{Number(t.discountPercent)}
                          </span>
                          <button
                            onClick={() => deleteTier(t.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Yeni kademe ekle */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Yeni Kademe Ekle
                </h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Minimum Adet
                    </label>
                    <input
                      type="number"
                      value={newTierQty}
                      onChange={(e) => setNewTierQty(e.target.value)}
                      placeholder="ör: 50"
                      min="2"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      İskonto Oranı
                    </label>
                    <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-500">
                      <input
                        type="number"
                        value={newTierPercent}
                        onChange={(e) => setNewTierPercent(e.target.value)}
                        placeholder="ör: 25"
                        step="0.5"
                        min="0"
                        max="100"
                        className="flex-1 px-3 py-2 text-sm outline-none rounded-l-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-gray-400 text-sm pr-3">%</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => addTier(tab, selectedItem[refIdKey])}
                      disabled={saving || !newTierQty || !newTierPercent}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Sabit orandan yüksek bir yüzde girin. Bayi bu adete ulaştığında otomatik uygulanır.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
