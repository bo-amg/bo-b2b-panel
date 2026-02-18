"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Globe } from "lucide-react";

type DealerFilter = "ALL" | "TR_BAYI" | "GLOBAL_BAYI";

export default function DealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DealerFilter>("ALL");

  useEffect(() => {
    fetch("/api/dealers")
      .then((r) => r.json())
      .then((data) => { setDealers(data); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? dealers : dealers.filter((d) => d.dealerType === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bayiler</h1>
        <Link href="/admin/dealers/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus className="h-4 w-4" /> Yeni Bayi
        </Link>
      </div>

      {/* Tip Filtresi */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 w-fit">
        {([
          { key: "ALL", label: "Tumunu" },
          { key: "TR_BAYI", label: "TR Bayi" },
          { key: "GLOBAL_BAYI", label: "Global Bayi" },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              filter === item.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
            {item.key !== "ALL" && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({dealers.filter((d) => d.dealerType === item.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yukleniyor...</div>
      ) : dealers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Henuz bayi eklenmemis</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Firma</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tip</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Yetkili</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sehir</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Iskonto</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Siparis</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Islem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{dealer.companyName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      dealer.dealerType === "GLOBAL_BAYI"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {dealer.dealerType === "GLOBAL_BAYI" ? (
                        <><Globe className="h-3 w-3" /> Global</>
                      ) : (
                        "TR"
                      )}
                    </span>
                  </td>
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
                    <Link href={`/admin/dealers/${dealer.id}`} className="text-blue-600 hover:underline text-sm">Duzenle</Link>
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
