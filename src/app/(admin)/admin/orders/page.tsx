"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};
const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700", SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-gray-100 text-gray-700", CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const url = filter ? `/api/orders?status=${filter}` : "/api/orders";
    fetch(url).then((r) => r.json()).then((data) => { setOrders(data); setLoading(false); });
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Siparişler</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "PENDING", "APPROVED", "REJECTED", "SHIPPED", "DELIVERED"].map((s) => (
          <button key={s} onClick={() => { setLoading(true); setFilter(s); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`}>
            {s === "" ? "Tümü" : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yükleniyor...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Sipariş bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sipariş No</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bayi</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kalem</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline font-medium">{order.orderNumber}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.dealer?.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]}`}>{statusLabels[order.status]}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {Number(order.totalAmount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a href={`/api/orders/${order.id}/proforma`} target="_blank" className="inline-flex items-center text-blue-600 hover:text-blue-800" title="Proforma İndir">
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
