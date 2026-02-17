"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default function DealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dealers")
      .then((r) => r.json())
      .then((data) => { setDealers(data); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bayiler</h1>
        <Link href="/admin/dealers/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus className="h-4 w-4" /> Yeni Bayi
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yükleniyor...</div>
      ) : dealers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Henüz bayi eklenmemiş</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Firma</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Yetkili</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Şehir</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İskonto</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sipariş</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{dealer.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{dealer.contactName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dealer.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dealer.city || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dealer.discountPercent ? `%${Number(dealer.discountPercent)}` : "Global"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dealer._count?.orders || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${dealer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {dealer.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/dealers/${dealer.id}`} className="text-blue-600 hover:underline text-sm">Düzenle</Link>
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
