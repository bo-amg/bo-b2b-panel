"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  ClipboardList,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
  ArrowRight,
  ShoppingCart,
  BadgePercent,
  CalendarDays,
  Banknote,
  BarChart3,
  Star,
  Eye,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number;
  createdAt: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    lineTotal: string | number;
  }>;
  dueDate?: string;
  trackingNumber?: string;
  shippingMethod?: string;
}

export default function DealerDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
    // Son görüntülenen ürünler
    try {
      const stored = JSON.parse(localStorage.getItem("b2b-recently-viewed") || "[]");
      setRecentlyViewed(stored.slice(0, 6));
    } catch {}
    // Yeni ürünler (stoğa son girenler)
    fetch("/api/products")
      .then((r) => r.json())
      .then((products: any[]) => {
        const withStock = products
          .filter((p) => p.variants?.some((v: any) => v.inventoryQuantity > 0))
          .sort((a, b) => new Date(b.syncedAt || 0).getTime() - new Date(a.syncedAt || 0).getTime())
          .slice(0, 6);
        setNewProducts(withStock);
      })
      .catch(() => {});
  }, []);

  // Metrik hesaplamaları
  const metrics = useMemo(() => {
    if (orders.length === 0) return null;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

    // Toplam harcama (iptal/red hariç)
    const validOrders = orders.filter((o) => !["CANCELLED", "REJECTED"].includes(o.status));
    const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Bu ay
    const thisMonthOrders = validOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const thisMonthTotal = thisMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Geçen ay
    const lastMonthOrders = validOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });
    const lastMonthTotal = lastMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Aylık değişim yüzdesi
    const monthlyChange =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : thisMonthTotal > 0
          ? 100
          : 0;

    // Durum sayıları
    const pendingCount = orders.filter((o) => o.status === "PENDING").length;
    const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
    const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
    const approvedCount = orders.filter((o) => o.status === "APPROVED").length;

    // Ortalama sipariş tutarı
    const avgOrderValue = validOrders.length > 0 ? totalSpent / validOrders.length : 0;

    // Toplam ürün adedi
    const totalItems = validOrders.reduce(
      (sum, o) => sum + (o.items?.reduce((is, item) => is + item.quantity, 0) || 0),
      0
    );

    // Ödenmesi gereken (APPROVED/SHIPPED durumundaki siparişler)
    const unpaidOrders = orders.filter((o) => ["PENDING", "APPROVED", "SHIPPED"].includes(o.status));
    const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Aylık sipariş grafiği (son 6 ay)
    const monthlyData: Array<{ month: string; total: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthOrders = validOrders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.getMonth() === m && od.getFullYear() === y;
      });
      monthlyData.push({
        month: d.toLocaleDateString("tr-TR", { month: "short" }),
        total: monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        count: monthOrders.length,
      });
    }

    // En çok sipariş edilen ürünler
    const productMap = new Map<string, { title: string; quantity: number; total: number }>();
    validOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const existing = productMap.get(item.title) || { title: item.title, quantity: 0, total: 0 };
        existing.quantity += item.quantity;
        existing.total += Number(item.lineTotal);
        productMap.set(item.title, existing);
      });
    });
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSpent,
      thisMonthTotal,
      monthlyChange,
      pendingCount,
      shippedCount,
      deliveredCount,
      approvedCount,
      avgOrderValue,
      totalItems,
      unpaidTotal,
      monthlyData,
      topProducts,
      totalOrders: validOrders.length,
    };
  }, [orders]);

  const maxMonthly = metrics ? Math.max(...metrics.monthlyData.map((m) => m.total), 1) : 1;

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-40 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 h-64 animate-pulse" />
          <div className="bg-white rounded-xl p-6 border border-gray-200 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Hoş geldiniz, {session?.user?.companyName}
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Ana Metrikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Toplam Harcama */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="h-4 w-4 text-blue-200" />
            <p className="text-xs text-blue-100 font-medium">Toplam Harcama</p>
          </div>
          <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(metrics?.totalSpent || 0)}</p>
          <p className="text-[11px] text-blue-200 mt-1">{metrics?.totalOrders || 0} sipariş</p>
        </div>

        {/* Bu Ay */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">Bu Ay</p>
          </div>
          <p className="text-lg md:text-xl font-bold text-gray-900 truncate">{formatCurrency(metrics?.thisMonthTotal || 0)}</p>
          {metrics && metrics.monthlyChange !== 0 && (
            <div className={`flex items-center gap-1 mt-1 ${metrics.monthlyChange > 0 ? "text-green-600" : "text-red-500"}`}>
              {metrics.monthlyChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-[11px] font-medium">
                %{Math.abs(Math.round(metrics.monthlyChange))} {metrics.monthlyChange > 0 ? "artış" : "düşüş"}
              </span>
            </div>
          )}
        </div>

        {/* Açık Bakiye */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <p className="text-xs text-gray-500 font-medium">Açık Siparişler</p>
          </div>
          <p className="text-lg md:text-xl font-bold text-amber-600 truncate">{formatCurrency(metrics?.unpaidTotal || 0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Ödeme bekleyen</p>
        </div>

        {/* Ort. Sipariş */}
        <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">Ort. Sipariş</p>
          </div>
          <p className="text-lg md:text-xl font-bold text-gray-900 truncate">{formatCurrency(metrics?.avgOrderValue || 0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{metrics?.totalItems || 0} adet ürün</p>
        </div>
      </div>

      {/* Durum Kartları */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6">
        <div className="bg-yellow-50 rounded-lg p-2 md:p-3 text-center border border-yellow-100">
          <p className="text-base md:text-lg font-bold text-yellow-700">{metrics?.pendingCount || 0}</p>
          <p className="text-[10px] md:text-[11px] text-yellow-600">Bekleyen</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center border border-green-100">
          <p className="text-base md:text-lg font-bold text-green-700">{metrics?.approvedCount || 0}</p>
          <p className="text-[10px] md:text-[11px] text-green-600">Onaylanan</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center border border-blue-100">
          <p className="text-base md:text-lg font-bold text-blue-700">{metrics?.shippedCount || 0}</p>
          <p className="text-[10px] md:text-[11px] text-blue-600">Kargoda</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
          <p className="text-base md:text-lg font-bold text-gray-700">{metrics?.deliveredCount || 0}</p>
          <p className="text-[10px] md:text-[11px] text-gray-500">Teslim</p>
        </div>
      </div>

      {/* Grafik + En çok sipariş edilen ürünler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Aylık Sipariş Grafiği */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Aylık Harcama (Son 6 Ay)
          </h2>
          {metrics && (
            <div className="flex items-end gap-2 h-40">
              {metrics.monthlyData.map((m, i) => {
                const height = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                const isCurrentMonth = i === metrics.monthlyData.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      {m.total > 0 ? formatCurrency(m.total).replace("₺", "").trim() : "-"}
                    </span>
                    <div className="w-full relative" style={{ height: "120px" }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                          isCurrentMonth
                            ? "bg-gradient-to-t from-blue-600 to-blue-400"
                            : "bg-gradient-to-t from-gray-300 to-gray-200"
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{m.month}</span>
                    <span className="text-[9px] text-gray-400">{m.count} sipariş</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* En Çok Sipariş Edilen Ürünler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            En Çok Sipariş Edilen Ürünler
          </h2>
          {metrics && metrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{product.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {product.quantity} adet &middot; {formatCurrency(product.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Henüz sipariş vermediniz
            </div>
          )}
        </div>
      </div>

      {/* Son Görüntülenen Ürünler */}
      {recentlyViewed.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-500" />
            Son Görüntülenen Ürünler
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {recentlyViewed.map((item, i) => (
              <Link key={i} href={`/products/${item.handle}`} className="group">
                <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 mb-1.5">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-6 w-6 text-gray-200" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-900 font-medium line-clamp-2 leading-tight group-hover:text-blue-600 transition">
                  {item.title}
                </p>
                <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                  {formatCurrency(item.wholesalePrice)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Yeni Eklenen Ürünler */}
      {newProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Yeni Eklenen Ürünler
            </h2>
            <Link href="/products" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {newProducts.map((product: any) => (
              <Link key={product.id} href={`/products/${product.handle}`} className="group">
                <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 mb-1.5">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-6 w-6 text-gray-200" />
                    </div>
                  )}
                  {product.discountPercent > 0 && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                      %{product.discountPercent}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-900 font-medium line-clamp-2 leading-tight group-hover:text-blue-600 transition">
                  {product.title}
                </p>
                {product.variants?.[0] && (
                  <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                    {formatCurrency(product.variants[0].wholesalePrice)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hızlı Erişim */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        <Link
          href="/products"
          className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition group flex items-center gap-3 md:gap-4 card-touch"
        >
          <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
              Ürün Kataloğu
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Ürünleri incele ve sipariş ver</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition" />
        </Link>

        <Link
          href="/orders"
          className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition group flex items-center gap-3 md:gap-4 card-touch"
        >
          <div className="bg-purple-50 p-3 rounded-xl group-hover:bg-purple-100 transition">
            <ClipboardList className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition">
              Siparişlerim
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Sipariş geçmişi ve takip</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 transition" />
        </Link>
      </div>

      {/* Son Siparişler */}
      {orders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Son Siparişler</h2>
            <Link href="/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Mobil kart view */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between px-4 py-3 active:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium text-blue-600">{order.orderNumber}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(order.totalAmount))}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {/* Desktop tablo */}
          <table className="w-full hidden md:table">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Sipariş
                </th>
                <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="text-right px-6 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  Tutar
                </th>
                <th className="text-center px-6 py-2.5 text-xs font-medium text-gray-500 uppercase">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyles[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <a
                      href={`/api/orders/${order.id}/proforma`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800"
                      title="Proforma İndir"
                    >
                      <FileText className="h-4 w-4 inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kargo takibi - aktif kargolar */}
      {orders.filter((o) => o.status === "SHIPPED").length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Kargodaki Siparişler
          </h2>
          <div className="space-y-2">
            {orders
              .filter((o) => o.status === "SHIPPED")
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <Link href={`/orders/${order.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {order.orderNumber}
                    </Link>
                    {order.shippingMethod && (
                      <span className="text-xs text-gray-500 ml-2">{order.shippingMethod}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {order.trackingNumber && (
                      <span className="text-xs text-gray-600 font-mono">{order.trackingNumber}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
