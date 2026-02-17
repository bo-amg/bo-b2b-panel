"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  FileText,
  ShoppingCart,
  User,
  Package,
  ArrowLeft,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Dealer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  city: string;
  discountPercent: number | null;
  isActive: boolean;
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: string;
  retailPrice: number;
  wholesalePrice: number;
  inventoryQuantity: number;
}

interface Product {
  id: string;
  shopifyProductId: string;
  title: string;
  vendor: string;
  images: Array<{ url: string; altText: string | null }>;
  variants: ProductVariant[];
  discountPercent: number;
}

interface OrderLine {
  id: string; // unique line id
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  imageUrl: string | null;
  retailPrice: number;
  wholesalePrice: number;
  customPrice: number | null;
  quantity: number;
  inventoryQuantity: number;
}

export default function NewManualOrderPage() {
  const router = useRouter();

  // State
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [dealerSearch, setDealerSearch] = useState("");
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [notes, setNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState("APPROVED");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderId: string; orderNumber: string } | null>(null);

  const dealerRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  // Veri yükle
  useEffect(() => {
    Promise.all([
      fetch("/api/dealers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([d, p]) => {
      setDealers(d.filter((dealer: Dealer) => dealer.isActive));
      setProducts(p);
      setLoading(false);
    });
  }, []);

  // Bayi dropdown dışı tıklama
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dealerRef.current && !dealerRef.current.contains(e.target as Node)) {
        setShowDealerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filtrelenmiş bayiler
  const filteredDealers = useMemo(() => {
    if (!dealerSearch) return dealers;
    const s = dealerSearch.toLowerCase();
    return dealers.filter(
      (d) =>
        d.companyName?.toLowerCase().includes(s) ||
        d.contactName?.toLowerCase().includes(s) ||
        d.email?.toLowerCase().includes(s)
    );
  }, [dealers, dealerSearch]);

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    if (!productSearch || productSearch.length < 2) return [];
    const s = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.vendor?.toLowerCase().includes(s) ||
          p.variants.some((v) => v.sku?.toLowerCase().includes(s))
      )
      .slice(0, 20);
  }, [products, productSearch]);

  // Ürün ekle
  function addProduct(product: Product, variant: ProductVariant) {
    const existingIndex = orderLines.findIndex(
      (l) => l.shopifyVariantId === variant.id
    );

    if (existingIndex >= 0) {
      // Mevcut satırın adetini artır
      setOrderLines((prev) =>
        prev.map((l, i) =>
          i === existingIndex ? { ...l, quantity: l.quantity + 1 } : l
        )
      );
    } else {
      const newLine: OrderLine = {
        id: `${variant.id}-${Date.now()}`,
        shopifyProductId: product.shopifyProductId,
        shopifyVariantId: variant.id,
        title: product.title,
        variantTitle: variant.title !== "Default Title" ? variant.title : null,
        sku: variant.sku || null,
        imageUrl: product.images[0]?.url || null,
        retailPrice: variant.retailPrice,
        wholesalePrice: variant.wholesalePrice,
        customPrice: null,
        quantity: 1,
        inventoryQuantity: variant.inventoryQuantity,
      };
      setOrderLines((prev) => [...prev, newLine]);
    }
    setProductSearch("");
  }

  // Satır sil
  function removeLine(id: string) {
    setOrderLines((prev) => prev.filter((l) => l.id !== id));
  }

  // Adet güncelle
  function updateQuantity(id: string, qty: number) {
    if (qty < 1) return;
    setOrderLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l))
    );
  }

  // Özel fiyat güncelle
  function updateCustomPrice(id: string, price: string) {
    const val = price === "" ? null : parseFloat(price);
    setOrderLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, customPrice: val } : l))
    );
  }

  // Toplam hesapla
  const subtotal = orderLines.reduce((sum, l) => {
    const price = l.customPrice ?? l.wholesalePrice;
    return sum + price * l.quantity;
  }, 0);

  const totalItems = orderLines.reduce((sum, l) => sum + l.quantity, 0);

  // Sipariş oluştur
  async function handleSubmit() {
    if (!selectedDealer) {
      setError("Lütfen bir bayi seçin");
      return;
    }
    if (orderLines.length === 0) {
      setError("Lütfen en az bir ürün ekleyin");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: selectedDealer.id,
          status: orderStatus,
          notes,
          items: orderLines.map((l) => ({
            shopifyProductId: l.shopifyProductId,
            shopifyVariantId: l.shopifyVariantId,
            quantity: l.quantity,
            customPrice: l.customPrice,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Sipariş oluşturulamadı");
        setSubmitting(false);
        return;
      }

      setSuccess({ orderId: data.id, orderNumber: data.orderNumber });
      setSubmitting(false);
    } catch (err) {
      setError("Bir hata oluştu");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Başarılı sipariş sonrası
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sipariş Oluşturuldu!</h2>
          <p className="text-gray-500 mb-1">Sipariş No: <strong>{success.orderNumber}</strong></p>
          <p className="text-sm text-gray-400 mb-6">
            {selectedDealer?.companyName} adına sipariş başarıyla kaydedildi.
          </p>

          <div className="flex gap-3 justify-center">
            <a
              href={`/api/orders/${success.orderId}/proforma`}
              target="_blank"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FileText className="h-4 w-4" />
              Proforma Görüntüle
            </a>
            <Link
              href={`/admin/orders/${success.orderId}`}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Sipariş Detay
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setOrderLines([]);
                setNotes("");
                setSelectedDealer(null);
                setDealerSearch("");
              }}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              <Plus className="h-4 w-4" />
              Yeni Sipariş
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manuel Sipariş Oluştur</h1>
          <p className="text-sm text-gray-500">Bayi adına sipariş oluştur ve proforma kes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf: Bayi + Ürün Arama */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bayi Seçimi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Bayi Seçimi
            </h2>

            {selectedDealer ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{selectedDealer.companyName}</p>
                  <p className="text-xs text-gray-500">
                    {selectedDealer.contactName} &middot; {selectedDealer.email}
                    {selectedDealer.city && ` &middot; ${selectedDealer.city}`}
                    {selectedDealer.discountPercent && (
                      <span className="ml-1 text-blue-600">(%{Number(selectedDealer.discountPercent)} genel iskonto)</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDealer(null);
                    setDealerSearch("");
                    setOrderLines([]);
                  }}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div ref={dealerRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Bayi ara (firma adı, yetkili, email)..."
                  value={dealerSearch}
                  onChange={(e) => {
                    setDealerSearch(e.target.value);
                    setShowDealerDropdown(true);
                  }}
                  onFocus={() => setShowDealerDropdown(true)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                {showDealerDropdown && filteredDealers.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredDealers.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedDealer(d);
                          setShowDealerDropdown(false);
                          setDealerSearch("");
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{d.companyName}</p>
                        <p className="text-xs text-gray-500">
                          {d.contactName} &middot; {d.email}
                          {d.discountPercent && ` &middot; %${Number(d.discountPercent)} iskonto`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ürün Ekleme */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              Ürün Ekle
            </h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün adı, marka veya SKU ile ara (en az 2 karakter)..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />

              {filteredProducts.length > 0 && (
                <div
                  ref={productListRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                >
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="border-b border-gray-50 last:border-0">
                      {p.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => addProduct(p, v)}
                          className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition flex items-center gap-3"
                        >
                          {p.images[0] ? (
                            <Image
                              src={p.images[0].url}
                              alt={p.title}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {p.title}
                              {v.title !== "Default Title" && (
                                <span className="text-gray-500"> - {v.title}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.vendor}
                              {v.sku && ` | ${v.sku}`}
                              {` | Stok: ${v.inventoryQuantity}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">PSF: {formatCurrency(v.retailPrice)}</p>
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(v.wholesalePrice)}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sipariş Satırları */}
          {orderLines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  Sipariş Kalemleri ({orderLines.length} kalem, {totalItems} adet)
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {orderLines.map((line) => {
                  const effectivePrice = line.customPrice ?? line.wholesalePrice;
                  const lineTotal = effectivePrice * line.quantity;

                  return (
                    <div key={line.id} className="px-5 py-3 flex items-center gap-3">
                      {/* Görsel */}
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={line.title}
                          width={48}
                          height={48}
                          className="rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}

                      {/* Ürün bilgisi */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {line.title}
                          {line.variantTitle && (
                            <span className="text-gray-500"> - {line.variantTitle}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          PSF: {formatCurrency(line.retailPrice)}
                          {line.sku && ` | ${line.sku}`}
                          {` | Stok: ${line.inventoryQuantity}`}
                        </p>
                      </div>

                      {/* Özel Fiyat */}
                      <div className="w-28">
                        <label className="text-[10px] text-gray-400 block mb-0.5">Birim Fiyat</label>
                        <input
                          type="number"
                          value={line.customPrice ?? line.wholesalePrice}
                          onChange={(e) => updateCustomPrice(line.id, e.target.value)}
                          step="0.01"
                          min="0"
                          className={`w-full text-sm text-right px-2 py-1 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            line.customPrice != null
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200"
                          }`}
                        />
                      </div>

                      {/* Adet */}
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          className="p-1.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            updateQuantity(line.id, parseInt(e.target.value) || 1)
                          }
                          min={1}
                          className="w-12 text-center text-sm border-x border-gray-200 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          className="p-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Satır toplamı */}
                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>

                      {/* Sil */}
                      <button
                        onClick={() => removeLine(line.id)}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Taraf: Özet + Gönder */}
        <div className="space-y-4">
          {/* Sipariş Özeti */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Sipariş Özeti</h2>

            {/* Bayi bilgisi */}
            {selectedDealer && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500">Bayi</p>
                <p className="text-sm font-medium text-gray-900">{selectedDealer.companyName}</p>
              </div>
            )}

            {/* Kalem sayısı */}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Kalem</span>
              <span className="text-gray-900">{orderLines.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Toplam Adet</span>
              <span className="text-gray-900">{totalItems}</span>
            </div>
            <div className="border-t border-gray-200 my-3" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-700">Toplam</span>
              <span className="text-blue-600">{formatCurrency(subtotal)}</span>
            </div>

            {/* Sipariş Durumu */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Sipariş Durumu</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">Bekliyor</option>
                <option value="APPROVED">Onaylandı</option>
              </select>
            </div>

            {/* Not */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Sipariş Notu</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsiyonel not..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Hata */}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Gönder */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedDealer || orderLines.length === 0}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Sipariş Oluştur
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-2">
              Sipariş oluşturulduktan sonra proforma PDF görüntülenebilir
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
