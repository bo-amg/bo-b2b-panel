"use client";

import { useCart } from "@/components/cart/cart-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  Package,
  FileText,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } =
    useCart();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmitOrder() {
    if (items.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            shopifyProductId: i.shopifyProductId,
            shopifyVariantId: i.shopifyVariantId,
            quantity: i.quantity,
          })),
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sipariş oluşturulamadı");
      }

      const order = await res.json();
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // Toplam perakende tutar
  const totalRetail = items.reduce(
    (sum, i) => sum + i.retailPrice * i.quantity,
    0
  );
  const totalSavings = totalRetail - totalAmount;

  if (items.length === 0) {
    return (
      <div className="text-center py-16 md:py-20">
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-gray-300" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
          Sepetiniz Boş
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          Ürün kataloğundan sepete ürün ekleyerek başlayın
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm active:scale-[0.98]"
        >
          <Package className="h-4 w-4" /> Ürünlere Git
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sepetim</h1>
          <p className="text-xs md:text-sm text-gray-400">{items.length} ürün, {totalItems} adet</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" /> Sepeti Temizle
        </button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Sepet Ürünleri */}
        <div className="lg:col-span-2 space-y-2 md:space-y-3">
          {/* Başlık satırı - sadece desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-400 font-medium uppercase">
            <div className="col-span-5">Ürün</div>
            <div className="col-span-2 text-center">Fiyat</div>
            <div className="col-span-2 text-center">Adet</div>
            <div className="col-span-2 text-right">Toplam</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item) => {
            const savings = (item.retailPrice - item.wholesalePrice) * item.quantity;
            const discountPercent = item.retailPrice > 0
              ? Math.round((1 - item.wholesalePrice / item.retailPrice) * 100)
              : 0;

            return (
              <div
                key={item.shopifyVariantId}
                className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-200 md:grid md:grid-cols-12 md:gap-4 md:items-center"
              >
                {/* Mobil: kompakt kart görünümü */}
                <div className="md:hidden">
                  <div className="flex gap-3">
                    {/* Resim */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-5 w-5 text-gray-200" />
                        </div>
                      )}
                    </div>
                    {/* Başlık + fiyat */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.wholesalePrice)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                            %{discountPercent}
                          </span>
                        )}
                        {item.isPreorder && (
                          <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> Ön Sipariş
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Sil butonu */}
                    <button
                      onClick={() => removeItem(item.shopifyVariantId)}
                      className="p-1 text-gray-300 hover:text-red-500 transition self-start"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Alt satır: adet + toplam */}
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() =>
                          updateQuantity(item.shopifyVariantId, item.quantity - 1)
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.shopifyVariantId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        min={1}
                        className="w-10 text-center text-sm font-medium border-x border-gray-200 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(item.shopifyVariantId, item.quantity + 1)
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.wholesalePrice * item.quantity)}
                      </p>
                      {savings > 0 && (
                        <p className="text-[10px] text-green-600">
                          {formatCurrency(savings)} tasarruf
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop: grid satır görünümü */}
                <div className="hidden md:col-span-5 md:flex gap-3 items-center">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-6 w-6 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    {item.variantTitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variantTitle}</p>
                    )}
                    {item.sku && (
                      <p className="text-[10px] text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    )}
                  </div>
                </div>

                <div className="hidden md:block md:col-span-2 text-center">
                  <p className="text-[10px] text-gray-400">
                    {formatCurrency(item.retailPrice)}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.wholesalePrice)}
                  </p>
                  {discountPercent > 0 && (
                    <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                      %{discountPercent}
                    </span>
                  )}
                </div>

                <div className="hidden md:flex md:col-span-2 justify-center">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() =>
                        updateQuantity(item.shopifyVariantId, item.quantity - 1)
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.shopifyVariantId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      min={1}
                      className="w-10 text-center text-sm font-medium border-x border-gray-200 py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(item.shopifyVariantId, item.quantity + 1)
                      }
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="hidden md:block md:col-span-2 text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.wholesalePrice * item.quantity)}
                  </p>
                  {savings > 0 && (
                    <p className="text-[10px] text-green-600">
                      {formatCurrency(savings)} tasarruf
                    </p>
                  )}
                </div>

                <div className="hidden md:flex md:col-span-1 justify-end">
                  <button
                    onClick={() => removeItem(item.shopifyVariantId)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Alışverişe devam */}
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-2 transition"
          >
            <Package className="h-4 w-4" /> Alışverişe Devam Et
          </Link>
        </div>

        {/* Sipariş Özeti */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 md:sticky md:top-8 overflow-hidden">
            <div className="bg-gray-50 px-4 md:px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Sipariş Özeti
              </h2>
            </div>

            <div className="p-4 md:p-5 space-y-3">
              {/* Detaylar */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ürün Sayısı</span>
                  <span className="font-medium text-gray-700">{items.length} kalem</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Toplam Adet</span>
                  <span className="font-medium text-gray-700">{totalItems} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Perakende Toplam</span>
                  <span className="text-gray-400 line-through text-xs">{formatCurrency(totalRetail)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Bayi İskontosu</span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(totalSavings)}
                    </span>
                  </div>
                )}
              </div>

              {/* Toplam */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-gray-900">Genel Toplam</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">KDV dahil</p>
              </div>

              {/* Not alanı */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Sipariş Notu
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Teslimat, paketleme veya özel isteklerinizi yazın..."
                />
              </div>

              {/* Hata */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-600 text-xs px-3 py-2.5 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Sipariş butonu */}
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? (
                  "Sipariş gönderiliyor..."
                ) : (
                  <>
                    Sipariş Ver <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Siparişiniz onay sürecine alınacaktır. Onaylandıktan sonra proforma fatura oluşturulacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
