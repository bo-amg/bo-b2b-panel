"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Tag, Package, FolderOpen, Eye, X, Check, Save } from "lucide-react";

interface DealerDiscount {
  id: string;
  discountPercent: number;
  collectionTitle?: string;
  shopifyCollectionId?: string;
  productTitle?: string;
  shopifyProductId?: string;
}

interface CollectionOption {
  id: string;
  title: string;
}

interface ProductOption {
  shopifyProductId: string;
  title: string;
}

export default function EditDealerPage() {
  const params = useParams();
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bayiye özel iskontolar
  const [catDiscounts, setCatDiscounts] = useState<DealerDiscount[]>([]);
  const [prodDiscounts, setProdDiscounts] = useState<DealerDiscount[]>([]);
  const [discountTab, setDiscountTab] = useState<"category" | "product">("category");
  const [discountLoading, setDiscountLoading] = useState(false);

  // Dropdown seçenekleri
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);

  // Yeni iskonto ekleme
  const [newId, setNewId] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const [addingDiscount, setAddingDiscount] = useState(false);

  // Arama
  const [searchTerm, setSearchTerm] = useState("");

  // Görünürlük yönetimi
  const [allowedCollections, setAllowedCollections] = useState<string[]>([]);
  const [allowedVendors, setAllowedVendors] = useState<string[]>([]);
  const [allVendors, setAllVendors] = useState<string[]>([]);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilitySuccess, setVisibilitySuccess] = useState("");

  useEffect(() => {
    fetch(`/api/dealers/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setDealer(data);
        setAllowedCollections((data.allowedCollections as string[]) || []);
        setAllowedVendors((data.allowedVendors as string[]) || []);
        setLoading(false);
      });
  }, [params.id]);

  // Bayi özel iskontolarını ve ürün/koleksiyon listesini çek
  useEffect(() => {
    if (!params.id) return;

    // Bayi iskontolarını çek
    fetch(`/api/dealers/${params.id}/discounts`)
      .then((r) => r.json())
      .then((data) => {
        setCatDiscounts(
          (data.categoryDiscounts || []).map((d: any) => ({
            ...d,
            discountPercent: Number(d.discountPercent),
          }))
        );
        setProdDiscounts(
          (data.productDiscounts || []).map((d: any) => ({
            ...d,
            discountPercent: Number(d.discountPercent),
          }))
        );
      });

    // Ürünleri çek (koleksiyon ve ürün listeleri için)
    fetch("/api/products")
      .then((r) => r.json())
      .then((products: any[]) => {
        // Ürün listesi
        setAllProducts(
          products.map((p) => ({
            shopifyProductId: p.shopifyProductId,
            title: p.title,
          }))
        );

        // Koleksiyonları çıkar (unique)
        const collMap = new Map<string, string>();
        products.forEach((p) => {
          ((p.collections as any[]) || []).forEach((c: any) => {
            if (c.id && c.title) collMap.set(c.id, c.title);
          });
        });
        setCollections(
          Array.from(collMap.entries())
            .map(([id, title]) => ({ id, title }))
            .sort((a, b) => a.title.localeCompare(b.title, "tr"))
        );

        // Marka listesi
        const vendorSet = new Set<string>();
        products.forEach((p: any) => {
          if (p.vendor) vendorSet.add(p.vendor);
        });
        setAllVendors([...vendorSet].sort((a, b) => a.localeCompare(b, "tr")));
      });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    if (!data.password) delete data.password;
    if (data.discountPercent === "") data.discountPercent = null;

    try {
      const res = await fetch(`/api/dealers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Güncelleme başarısız");
      }

      setSuccess("Bayi bilgileri güncellendi");
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function toggleActive() {
    try {
      await fetch(`/api/dealers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !dealer.isActive }),
      });
      setDealer({ ...dealer, isActive: !dealer.isActive });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addDiscount() {
    if (!newId || !newPercent) return;
    setAddingDiscount(true);

    const isCategory = discountTab === "category";
    const title = isCategory
      ? collections.find((c) => c.id === newId)?.title || ""
      : allProducts.find((p) => p.shopifyProductId === newId)?.title || "";

    try {
      const res = await fetch(`/api/dealers/${params.id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: discountTab,
          shopifyId: newId,
          title,
          discountPercent: parseFloat(newPercent),
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Ekleme başarısız");
      }

      const result = await res.json();
      const item = { ...result, discountPercent: Number(result.discountPercent) };

      if (isCategory) {
        setCatDiscounts((prev) => {
          const filtered = prev.filter(
            (d) => d.shopifyCollectionId !== item.shopifyCollectionId
          );
          return [...filtered, item].sort((a, b) =>
            (a.collectionTitle || "").localeCompare(b.collectionTitle || "", "tr")
          );
        });
      } else {
        setProdDiscounts((prev) => {
          const filtered = prev.filter(
            (d) => d.shopifyProductId !== item.shopifyProductId
          );
          return [...filtered, item].sort((a, b) =>
            (a.productTitle || "").localeCompare(b.productTitle || "", "tr")
          );
        });
      }

      setNewId("");
      setNewPercent("");
    } catch (err: any) {
      setError(err.message);
    }
    setAddingDiscount(false);
  }

  async function deleteDiscount(discountId: string, type: "category" | "product") {
    if (!confirm("Bu iskontyu silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(
        `/api/dealers/${params.id}/discounts?discountId=${discountId}&type=${type}`,
        { method: "DELETE" }
      );

      if (type === "category") {
        setCatDiscounts((prev) => prev.filter((d) => d.id !== discountId));
      } else {
        setProdDiscounts((prev) => prev.filter((d) => d.id !== discountId));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Görünürlük kaydet
  async function saveVisibility() {
    setVisibilitySaving(true);
    setVisibilitySuccess("");
    try {
      const res = await fetch(`/api/dealers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedCollections,
          allowedVendors,
        }),
      });
      if (!res.ok) throw new Error("Kaydetme başarısız");
      setVisibilitySuccess("Görünürlük ayarları kaydedildi");
      setTimeout(() => setVisibilitySuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setVisibilitySaving(false);
  }

  function toggleCollection(colId: string) {
    setAllowedCollections((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }

  function toggleVendor(vendor: string) {
    setAllowedVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  }

  // Filtrelenmiş dropdown seçenekleri (zaten eklenmiş olanları çıkar)
  const availableCollections = collections.filter(
    (c) => !catDiscounts.some((d) => d.shopifyCollectionId === c.id)
  );
  const availableProducts = allProducts.filter(
    (p) => !prodDiscounts.some((d) => d.shopifyProductId === p.shopifyProductId)
  );

  // Arama filtresi
  const filteredCatDiscounts = catDiscounts.filter((d) =>
    (d.collectionTitle || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredProdDiscounts = prodDiscounts.filter((d) =>
    (d.productTitle || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="text-center py-16 text-gray-500">Yükleniyor...</div>
    );
  if (!dealer)
    return (
      <div className="text-center py-16 text-gray-500">Bayi bulunamadı</div>
    );

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/dealers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Bayilere Dön
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {dealer.companyName}
        </h1>
        <button
          onClick={toggleActive}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            dealer.isActive
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          {dealer.isActive ? "Pasife Al" : "Aktive Et"}
        </button>
      </div>

      {/* ====== Bayi Bilgileri Formu ====== */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-500" />
          Bayi Bilgileri
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firma Adı
            </label>
            <input
              name="companyName"
              defaultValue={dealer.companyName}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yetkili Adı
            </label>
            <input
              name="contactName"
              defaultValue={dealer.contactName}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              name="phone"
              defaultValue={dealer.phone || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şehir
            </label>
            <input
              name="city"
              defaultValue={dealer.city || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vergi No
            </label>
            <input
              name="taxId"
              defaultValue={dealer.taxId || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vergi Dairesi
            </label>
            <input
              name="taxOffice"
              defaultValue={dealer.taxOffice || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adres
          </label>
          <textarea
            name="address"
            defaultValue={dealer.address || ""}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genel Bayi İskontosu %
          </label>
          <input
            name="discountPercent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={
              dealer.discountPercent ? Number(dealer.discountPercent) : ""
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Boş = Global iskonto (aşağıdaki özel iskontolar hariç tüm ürünlere uygulanır)"
          />
          <p className="text-xs text-gray-400 mt-1">
            Aşağıda kategori/ürün bazlı özel iskonto tanımlanmamış ürünlere bu oran uygulanır.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)
          </label>
          <input
            name="password"
            type="password"
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bayi Tipi
          </label>
          <select
            name="dealerType"
            defaultValue={dealer.dealerType || "TR_BAYI"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="TR_BAYI">TR Bayi (Turkce / TRY)</option>
            <option value="GLOBAL_BAYI">Global Bayi (English / USD)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Bayi tipi degistiginde dil ve para birimi otomatik guncellenir.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      {/* ====== Bayiye Özel İskontolar ====== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-purple-500" />
          Bayiye Özel İskontolar
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Bu bayiye kategori veya ürün bazında özel iskonto tanımlayın.
          Tanımlanan iskontolar genel bayi iskontosunu ve global iskontları
          geçersiz kılar.
        </p>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 w-fit">
          <button
            onClick={() => {
              setDiscountTab("category");
              setNewId("");
              setNewPercent("");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              discountTab === "category"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Kategori ({catDiscounts.length})
          </button>
          <button
            onClick={() => {
              setDiscountTab("product");
              setNewId("");
              setNewPercent("");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              discountTab === "product"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="h-4 w-4" />
            Ürün ({prodDiscounts.length})
          </button>
        </div>

        {/* Yeni İskonto Ekleme */}
        <div className="flex gap-3 items-end mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {discountTab === "category" ? "Kategori" : "Ürün"}
            </label>
            <select
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">
                {discountTab === "category" ? "Kategori seçin..." : "Ürün seçin..."}
              </option>
              {discountTab === "category"
                ? availableCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                : availableProducts.map((p) => (
                    <option key={p.shopifyProductId} value={p.shopifyProductId}>
                      {p.title}
                    </option>
                  ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              İskonto %
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newPercent}
                onChange={(e) => setNewPercent(e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>
          <button
            onClick={addDiscount}
            disabled={!newId || !newPercent || addingDiscount}
            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {addingDiscount ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>

        {/* Arama */}
        {((discountTab === "category" && catDiscounts.length > 3) ||
          (discountTab === "product" && prodDiscounts.length > 3)) && (
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-purple-500 outline-none"
          />
        )}

        {/* İskonto Listesi */}
        <div className="space-y-2">
          {discountTab === "category" ? (
            filteredCatDiscounts.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Bu bayiye henüz kategori iskontosu tanımlanmamış.
              </p>
            ) : (
              filteredCatDiscounts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-4 py-3 bg-purple-50 rounded-lg border border-purple-100 group"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-800">
                      {d.collectionTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                      %{d.discountPercent}
                    </span>
                    <button
                      onClick={() => deleteDiscount(d.id, "category")}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredProdDiscounts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Bu bayiye henüz ürün iskontosu tanımlanmamış.
            </p>
          ) : (
            filteredProdDiscounts.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg border border-blue-100 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {d.productTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                    %{d.discountPercent}
                  </span>
                  <button
                    onClick={() => deleteDiscount(d.id, "product")}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hiyerarşi Bilgi Notu */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-700 font-medium mb-1">
            İskonto Öncelik Sırası
          </p>
          <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
            <li>
              <strong>Bayi-Ürün</strong> — Bu bayiye tanımlı ürün iskontosu
            </li>
            <li>
              <strong>Bayi-Kategori</strong> — Bu bayiye tanımlı kategori
              iskontosu
            </li>
            <li>
              <strong>Bayi Genel</strong> — Yukarıdaki genel bayi iskontosu
            </li>
            <li>
              <strong>Global Ürün</strong> — İskonto Yönetimi'ndeki ürün
              iskontosu
            </li>
            <li>
              <strong>Global Kategori</strong> — İskonto Yönetimi'ndeki kategori
              iskontosu
            </li>
            <li>
              <strong>Global Varsayılan</strong> — Genel varsayılan iskonto (%20)
            </li>
          </ol>
        </div>
      </div>

      {/* ====== Ürün Görünürlüğü ====== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-500" />
            Ürün Görünürlüğü
          </h2>
          <button
            onClick={saveVisibility}
            disabled={visibilitySaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {visibilitySaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Bu bayinin hangi kategorileri ve markaları görebileceğini belirleyin.
          Hiçbir şey seçilmezse bayi tüm ürünleri görür.
        </p>

        {visibilitySuccess && (
          <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
            <Check className="h-4 w-4" />
            {visibilitySuccess}
          </div>
        )}

        {/* Kategoriler */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-gray-400" />
              Görünür Kategoriler
              {allowedCollections.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {allowedCollections.length} seçili
                </span>
              )}
            </h3>
            {allowedCollections.length > 0 && (
              <button
                onClick={() => setAllowedCollections([])}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Tümünü Kaldır
              </button>
            )}
          </div>
          {allowedCollections.length === 0 && (
            <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg mb-2 inline-block">
              Tüm kategoriler görünür (kısıtlama yok)
            </p>
          )}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {collections.map((col) => {
              const isSelected = allowedCollections.includes(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {col.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Markalar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              Görünür Markalar
              {allowedVendors.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {allowedVendors.length} seçili
                </span>
              )}
            </h3>
            {allowedVendors.length > 0 && (
              <button
                onClick={() => setAllowedVendors([])}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Tümünü Kaldır
              </button>
            )}
          </div>
          {allowedVendors.length === 0 && (
            <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg mb-2 inline-block">
              Tüm markalar görünür (kısıtlama yok)
            </p>
          )}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {allVendors.map((vendor) => {
              const isSelected = allowedVendors.includes(vendor);
              return (
                <button
                  key={vendor}
                  onClick={() => toggleVendor(vendor)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {vendor}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bilgi notu */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Not:</strong> Kategori ve marka filtreleri birlikte çalışır.
            Hem kategori hem marka seçiliyse, ürünün her iki koşulu da sağlaması gerekir.
            Hiçbir şey seçilmezse bayi tüm ürünleri görebilir.
          </p>
        </div>
      </div>
    </div>
  );
}
