"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, Download, Search, X } from "lucide-react";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const url = filter ? `/api/orders?status=${filter}` : "/api/orders";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, [filter]);

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(s) ||
      order.items?.some((item: any) => item.title?.toLowerCase().includes(s))
    );
  });

  const totalAmount = filteredOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Siparişlerim</h1>
        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
          <FileText className="h-4 w-4 hidden sm:block" />
          <span>{filteredOrders.length} sipariş</span>
          <span className="text-gray-300">|</span>
          <span className="font-medium text-gray-700">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Arama */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sipariş no veya ürün adı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtreler - yatay scroll mobilde */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {["", "PENDING", "APPROVED", "SHIPPED", "DELIVERED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition whitespace-nowrap ${
              filter === status
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 active:bg-gray-50"
            }`}
          >
            {status === "" ? "Tümü" : statusLabels[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-32 mt-2" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Henüz sipariş bulunmuyor</p>
        </div>
      ) : (
        <>
          {/* Mobil kart görünümü */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition card-touch"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">{order.orderNumber}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{order.items?.length || 0} ürün</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(Number(order.totalAmount))}
                    </span>
                    <a
                      href={`/api/orders/${order.id}/proforma`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-blue-500 hover:text-blue-700 bg-blue-50 rounded-lg"
                      title="Proforma İndir"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop tablo görünümü */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Sipariş No
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Kalem
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Tutar
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Proforma
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items?.length || 0} ürün
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/api/orders/${order.id}/proforma`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        title="Proforma İndir"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
