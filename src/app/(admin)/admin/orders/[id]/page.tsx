"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Check, X, Truck, Package, MessageSquare, Save } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};
const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700", SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-gray-100 text-gray-700", CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showShipForm, setShowShipForm] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setAdminNotes(data?.adminNotes || ""); setLoading(false); });
  }, [params.id]);

  async function updateStatus(status: string, extra?: any) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const updated = await res.json();
      setOrder(updated);
      setShowRejectForm(false);
      setShowShipForm(false);
    } catch {
      alert("İşlem başarısız");
    }
    setActionLoading(false);
  }

  async function saveAdminNotes() {
    setNotesSaving(true);
    try {
      await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      alert("Not kaydedilemedi");
    }
    setNotesSaving(false);
  }

  if (loading) return <div className="text-center py-16 text-gray-500">Yükleniyor...</div>;
  if (!order) return <div className="text-center py-16 text-gray-500">Sipariş bulunamadı</div>;

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Siparişlere Dön
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{order.dealer?.companyName} - {formatDate(order.createdAt)}</p>
        </div>
        <a href={`/api/orders/${order.id}/proforma`} target="_blank" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Download className="h-4 w-4" /> Proforma
        </a>
      </div>

      {/* Durum Aksiyonları */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Sipariş Durumu</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusStyles[order.status]}`}>
            {statusLabels[order.status]}
          </span>

          {order.status === "PENDING" && (
            <>
              <button onClick={() => updateStatus("APPROVED")} disabled={actionLoading}
                className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50">
                <Check className="h-4 w-4" /> Onayla
              </button>
              <button onClick={() => setShowRejectForm(true)} disabled={actionLoading}
                className="inline-flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50">
                <X className="h-4 w-4" /> Reddet
              </button>
            </>
          )}

          {order.status === "APPROVED" && (
            <button onClick={() => setShowShipForm(true)} disabled={actionLoading}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
              <Truck className="h-4 w-4" /> Kargoya Ver
            </button>
          )}

          {order.status === "SHIPPED" && (
            <button onClick={() => updateStatus("DELIVERED")} disabled={actionLoading}
              className="inline-flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50">
              <Check className="h-4 w-4" /> Teslim Edildi
            </button>
          )}
        </div>

        {showRejectForm && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Red sebebi yazın..." rows={2}
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm mb-2" />
            <div className="flex gap-2">
              <button onClick={() => updateStatus("REJECTED", { rejectionReason })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Reddet</button>
              <button onClick={() => setShowRejectForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        )}

        {showShipForm && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
            <input value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}
              placeholder="Kargo şirketi (örn: Aras, MNG)" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm" />
            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Takip numarası" className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm" />
            <div className="flex gap-2">
              <button onClick={() => updateStatus("SHIPPED", { trackingNumber, shippingMethod })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Kargoya Ver</button>
              <button onClick={() => setShowShipForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        )}
      </div>

      {/* Bayi Bilgileri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Bayi Bilgileri</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Firma:</span> <span className="text-gray-900 ml-2">{order.dealer?.companyName}</span></div>
          <div><span className="text-gray-500">Yetkili:</span> <span className="text-gray-900 ml-2">{order.dealer?.contactName}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="text-gray-900 ml-2">{order.dealer?.email}</span></div>
          <div><span className="text-gray-500">Telefon:</span> <span className="text-gray-900 ml-2">{order.dealer?.phone || "-"}</span></div>
          {order.dealer?.taxId && <div><span className="text-gray-500">Vergi No:</span> <span className="text-gray-900 ml-2">{order.dealer.taxId}</span></div>}
          {order.dealer?.city && <div><span className="text-gray-500">Şehir:</span> <span className="text-gray-900 ml-2">{order.dealer.city}</span></div>}
        </div>
      </div>

      {order.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-red-700 mb-1">Red Sebebi</h3>
          <p className="text-sm text-red-600">{order.rejectionReason}</p>
        </div>
      )}

      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Kargo Bilgisi</h3>
          <p className="text-sm text-blue-600">
            {order.shippingMethod && `${order.shippingMethod} - `}Takip No: {order.trackingNumber}
          </p>
        </div>
      )}

      {/* Sipariş Kalemleri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ürün</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Perakende</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Toptan</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">İsk.%</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Adet</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.variantTitle && <p className="text-xs text-gray-500">{item.variantTitle}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.sku || "-"}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-400">{formatCurrency(Number(item.retailPrice))}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-green-600">{formatCurrency(Number(item.wholesalePrice))}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">%{Number(item.discountPercent)}</td>
                <td className="px-6 py-4 text-right text-sm">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={6} className="px-6 py-3 text-right font-bold">Genel Toplam</td>
              <td className="px-6 py-3 text-right font-bold text-green-600">{formatCurrency(Number(order.totalAmount))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Bayi Notu</h3>
          <p className="text-sm text-gray-500">{order.notes}</p>
        </div>
      )}

      {/* Admin İç Not */}
      <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6">
        <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Admin Notu
          <span className="text-[10px] text-amber-500 font-normal">(Bayi göremez)</span>
        </h3>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Bu siparişe özel iç not ekleyin..."
          rows={3}
          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-amber-500">Bu not sadece admin panelinde görünür.</p>
          <button
            onClick={saveAdminNotes}
            disabled={notesSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              notesSaved
                ? "bg-green-500 text-white"
                : "bg-amber-600 text-white hover:bg-amber-700"
            } disabled:opacity-50`}
          >
            {notesSaved ? (
              <><Check className="h-3.5 w-3.5" /> Kaydedildi</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> Notu Kaydet</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
