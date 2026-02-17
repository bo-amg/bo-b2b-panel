"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Package } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/products/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message);
        // Ürünleri yeniden yükle
        const productsRes = await fetch("/api/products");
        const productsData = await productsRes.json();
        setProducts(productsData);
      } else {
        setSyncMessage("Hata: " + data.error);
      }
    } catch {
      setSyncMessage("Sync sırasında bir hata oluştu");
    }
    setSyncing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Shopify&apos;dan senkronize edilen ürünler ({products.length} ürün)
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Senkronize ediliyor..." : "Shopify Sync"}
        </button>
      </div>

      {syncMessage && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            syncMessage.startsWith("Hata")
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {syncMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yükleniyor...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            Henüz ürün senkronize edilmemiş
          </p>
          <button
            onClick={handleSync}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
          >
            İlk Sync&apos;i Başlat
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Ürün
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Marka
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Fiyat
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Stok
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  İsk. %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const firstVariant = product.variants[0];
                const totalStock = product.variants.reduce(
                  (sum: number, v: any) => sum + (v.inventoryQuantity || 0),
                  0
                );
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
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
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.vendor || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.productType || "-"}
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      %{product.discountPercent}
                      <span className="text-xs text-gray-400 ml-1">
                        ({product.discountSource})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
