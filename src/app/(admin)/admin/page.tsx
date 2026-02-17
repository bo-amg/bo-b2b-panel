"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  Package,
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
  ShoppingCart,
} from "lucide-react";

interface DashboardData {
  // Genel istatistikler
  pendingOrders: number;
  approvedOrders: number;
  shippedOrders: number;
  totalOrders: number;
  activeDealers: number;
  totalProducts: number;
  // Finansal
  totalRevenue: number;
  pendingRevenue: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  // Sipariş ortalamaları
  avgOrderValue: number;
  totalItems: number;
  // Son siparişler
  recentOrders: any[];
  // En çok satan ürünler
  topProducts: Array<{
    title: string;
    imageUrl: string;
    totalQty: number;
    totalRevenue: number;
  }>;
  // En çok sipariş veren bayiler
  topDealers: Array<{
    companyName: string;
    contactName: string;
    orderCount: number;
    totalSpent: number;
  }>;
  // Aylık sipariş dağılımı (son 6 ay)
  monthlyChart: Array<{
    month: string;
    total: number;
    count: number;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/dealers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([orders, dealers, products]) => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Bu ay
      const thisMonthOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });

      // Geçen ay
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      const lastMonthOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      });

      // Gelir hesaplama (onaylanmış + kargoda + teslim edilmiş)
      const completedStatuses = ["APPROVED", "SHIPPED", "DELIVERED"];
      const completedOrders = orders.filter((o: any) =>
        completedStatuses.includes(o.status)
      );

      const totalRevenue = completedOrders.reduce(
        (sum: number, o: any) => sum + Number(o.totalAmount),
        0
      );

      const pendingRevenue = orders
        .filter((o: any) => o.status === "PENDING")
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

      const monthlyRevenue = thisMonthOrders.reduce(
        (sum: number, o: any) => sum + Number(o.totalAmount),
        0
      );

      const lastMonthRevenue = lastMonthOrders.reduce(
        (sum: number, o: any) => sum + Number(o.totalAmount),
        0
      );

      const totalItems = orders.reduce(
        (sum: number, o: any) => sum + (o.items?.length || 0),
        0
      );

      const avgOrderValue =
        orders.length > 0
          ? orders.reduce(
              (sum: number, o: any) => sum + Number(o.totalAmount),
              0
            ) / orders.length
          : 0;

      // En çok satan ürünler
      const productStats = new Map<
        string,
        { title: string; imageUrl: string; totalQty: number; totalRevenue: number }
      >();
      orders.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const key = item.shopifyProductId;
          const existing = productStats.get(key) || {
            title: item.title || "Bilinmiyor",
            imageUrl: item.imageUrl || "",
            totalQty: 0,
            totalRevenue: 0,
          };
          existing.totalQty += item.quantity;
          existing.totalRevenue += Number(item.lineTotal || 0);
          productStats.set(key, existing);
        });
      });
      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 5);

      // En çok sipariş veren bayiler
      const dealerStats = new Map<
        string,
        { companyName: string; contactName: string; orderCount: number; totalSpent: number }
      >();

      orders.forEach((o: any) => {
        const key = o.dealerId;
        const existing = dealerStats.get(key) || {
          companyName: o.dealer?.companyName || "Bilinmiyor",
          contactName: o.dealer?.contactName || "",
          orderCount: 0,
          totalSpent: 0,
        };
        existing.orderCount++;
        existing.totalSpent += Number(o.totalAmount);
        dealerStats.set(key, existing);
      });

      const topDealers = Array.from(dealerStats.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Son 6 ay sipariş dağılımı
      const monthNames = [
        "Oca", "Şub", "Mar", "Nis", "May", "Haz",
        "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
      ];

      const monthlyChart: DashboardData["monthlyChart"] = [];
      for (let i = 5; i >= 0; i--) {
        let m = thisMonth - i;
        let y = thisYear;
        if (m < 0) {
          m += 12;
          y--;
        }
        const monthOrders = orders.filter((o: any) => {
          const d = new Date(o.createdAt);
          return d.getMonth() === m && d.getFullYear() === y;
        });
        monthlyChart.push({
          month: monthNames[m],
          total: monthOrders.reduce(
            (sum: number, o: any) => sum + Number(o.totalAmount),
            0
          ),
          count: monthOrders.length,
        });
      }

      setData({
        pendingOrders: orders.filter((o: any) => o.status === "PENDING").length,
        approvedOrders: orders.filter((o: any) => o.status === "APPROVED").length,
        shippedOrders: orders.filter((o: any) => o.status === "SHIPPED").length,
        totalOrders: orders.length,
        activeDealers: dealers.filter((d: any) => d.isActive).length,
        totalProducts: products.length,
        totalRevenue,
        pendingRevenue,
        monthlyRevenue,
        lastMonthRevenue,
        avgOrderValue,
        totalItems,
        recentOrders: orders.slice(0, 8),
        topProducts,
        topDealers,
        monthlyChart,
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const revenueChange =
    data.lastMonthRevenue > 0
      ? ((data.monthlyRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
      : data.monthlyRevenue > 0
      ? 100
      : 0;

  const maxChartValue = Math.max(...data.monthlyChart.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ===== Ana Metrik Kartları ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Toplam Gelir */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Onaylanan
            </span>
          </div>
          <p className="text-sm text-blue-100">Toplam Gelir</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(data.totalRevenue)}
          </p>
        </div>

        {/* Bu Ay */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            {revenueChange !== 0 && (
              <span
                className={`text-xs font-medium flex items-center gap-0.5 px-2 py-1 rounded-full ${
                  revenueChange > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {revenueChange > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                %{Math.abs(revenueChange).toFixed(0)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Bu Ay Ciro</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(data.monthlyRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Geçen ay: {formatCurrency(data.lastMonthRevenue)}
          </p>
        </div>

        {/* Bekleyen Gelir */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-blue-500 hover:underline"
            >
              Görüntüle
            </Link>
          </div>
          <p className="text-sm text-gray-500">Bekleyen Faturalar</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(data.pendingRevenue)}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {data.pendingOrders} sipariş onay bekliyor
          </p>
        </div>

        {/* Ortalama Sipariş */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Ort. Sipariş Tutarı</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(data.avgOrderValue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data.totalItems} ürün / {data.totalOrders} sipariş
          </p>
        </div>
      </div>

      {/* ===== İkinci Satır: Mini Kartlar ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/orders"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Bekleyen</p>
            <p className="text-lg font-bold text-gray-900">
              {data.pendingOrders}
            </p>
          </div>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-green-50 rounded-lg">
            <ClipboardList className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Onaylanan</p>
            <p className="text-lg font-bold text-gray-900">
              {data.approvedOrders}
            </p>
          </div>
        </Link>
        <Link
          href="/admin/dealers"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aktif Bayi</p>
            <p className="text-lg font-bold text-gray-900">
              {data.activeDealers}
            </p>
          </div>
        </Link>
        <Link
          href="/admin/products"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="p-2 bg-purple-50 rounded-lg">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ürün</p>
            <p className="text-lg font-bold text-gray-900">
              {data.totalProducts}
            </p>
          </div>
        </Link>
      </div>

      {/* ===== Grafik + Top Bayiler ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aylık Sipariş Grafiği */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">
                Aylık Ciro (Son 6 Ay)
              </h2>
            </div>
          </div>

          <div className="flex items-end gap-3 h-48">
            {data.monthlyChart.map((m, i) => {
              const heightPercent =
                maxChartValue > 0 ? (m.total / maxChartValue) * 100 : 0;
              const isCurrentMonth = i === data.monthlyChart.length - 1;

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  {/* Değer */}
                  <span className="text-[10px] text-gray-400 font-medium">
                    {m.total > 0 ? formatCurrency(m.total) : "-"}
                  </span>
                  {/* Bar */}
                  <div className="w-full relative" style={{ height: "140px" }}>
                    <div
                      className={`absolute bottom-0 left-1 right-1 rounded-t-lg transition-all duration-700 ${
                        isCurrentMonth
                          ? "bg-gradient-to-t from-blue-600 to-blue-400"
                          : "bg-gradient-to-t from-gray-200 to-gray-100"
                      }`}
                      style={{
                        height: `${Math.max(heightPercent, 2)}%`,
                      }}
                    />
                  </div>
                  {/* Ay label */}
                  <span
                    className={`text-xs font-medium ${
                      isCurrentMonth ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    {m.month}
                  </span>
                  {/* Sipariş sayısı */}
                  <span className="text-[10px] text-gray-300">
                    {m.count} sip.
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* En Çok Sipariş Veren Bayiler */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              En Çok Sipariş Veren Bayiler
            </h2>
          </div>

          {data.topDealers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Henüz sipariş yok
            </p>
          ) : (
            <div className="space-y-4">
              {data.topDealers.map((dealer, i) => {
                const maxSpent = data.topDealers[0]?.totalSpent || 1;
                const barWidth = (dealer.totalSpent / maxSpent) * 100;

                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
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
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                            {dealer.companyName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-700">
                          {formatCurrency(dealer.totalSpent)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {dealer.orderCount} sipariş
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          i === 0
                            ? "bg-amber-400"
                            : i === 1
                            ? "bg-gray-400"
                            : i === 2
                            ? "bg-orange-400"
                            : "bg-gray-300"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== En Çok Satan Ürünler ===== */}
      {data.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package className="h-5 w-5 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              En Çok Satan Ürünler
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data.topProducts.map((product, i) => {
              const maxQty = data.topProducts[0]?.totalQty || 1;
              return (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                        ? "bg-gray-200 text-gray-600"
                        : i === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-14 h-14 object-contain rounded mb-2"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5">
                    {product.title}
                  </p>
                  <p className="text-sm font-bold text-blue-600">{product.totalQty} adet</p>
                  <p className="text-[10px] text-gray-400">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                  {/* Bar */}
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(product.totalQty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Son Siparişler Tablosu ===== */}
      {data.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              Son Siparişler
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              Tümünü Gör <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Sipariş
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Bayi
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tutar
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-700">
                    {order.dealer?.companyName}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-medium">
                    {formatCurrencyFull(Number(order.totalAmount))}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <a
                      href={`/api/orders/${order.id}/proforma`}
                      target="_blank"
                      className="inline-flex items-center text-blue-500 hover:text-blue-700 transition"
                      title="Proforma İndir"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    PENDING: "Bekliyor",
    APPROVED: "Onaylandı",
    REJECTED: "Reddedildi",
    SHIPPED: "Kargoda",
    DELIVERED: "Teslim Edildi",
    CANCELLED: "İptal",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
