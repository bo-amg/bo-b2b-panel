"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Package } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function OrderDetailPage() {
  const { t, lang, currency } = useLanguage();
  const dateLocale = lang === "EN" ? "en-US" : "tr-TR";
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const statusLabels: Record<string, string> = {
    PENDING: t("status.PENDING"),
    APPROVED: t("status.APPROVED"),
    REJECTED: t("status.REJECTED"),
    SHIPPED: t("status.SHIPPED"),
    DELIVERED: t("status.DELIVERED"),
    CANCELLED: t("status.CANCELLED"),
  };

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500">{t("orderDetail.loading")}</div>;
  }

  if (!order) {
    return <div className="text-center py-16 text-gray-500">{t("orderDetail.notFound")}</div>;
  }

  return (
    <div>
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> {t("orderDetail.back")}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("orderDetail.order")} {order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {formatDate(order.createdAt, dateLocale)} {t("orderDetail.createdAt")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusStyles[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
          <a
            href={`/api/orders/${order.id}/proforma`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Download className="h-4 w-4" /> {t("orderDetail.downloadProforma")}
          </a>
        </div>
      </div>

      {order.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-red-700">{t("orderDetail.rejectionReason")}:</p>
          <p className="text-sm text-red-600">{order.rejectionReason}</p>
        </div>
      )}

      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-700">{t("orderDetail.shippingInfo")}:</p>
          <p className="text-sm text-blue-600">
            {order.shippingMethod && `${order.shippingMethod} - `}
            {t("orderDetail.trackingNo")}: {order.trackingNumber}
          </p>
        </div>
      )}

      {/* Sipariş Kalemleri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("orderDetail.product")}
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("orderDetail.sku")}
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("orderDetail.unitPrice")}
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("orderDetail.quantity")}
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                {t("orderDetail.total")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">
                          {item.variantTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.sku || "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div>
                    <span className="text-xs text-gray-400 line-through block">
                      {formatCurrency(Number(item.retailPrice), currency)}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(Number(item.wholesalePrice), currency)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  {formatCurrency(Number(item.lineTotal), currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-6 py-3 text-right font-bold">
                {t("orderDetail.grandTotal")}
              </td>
              <td className="px-6 py-3 text-right font-bold text-green-600">
                {formatCurrency(Number(order.totalAmount), currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t("orderDetail.orderNote")}
          </h3>
          <p className="text-sm text-gray-500">{order.notes}</p>
        </div>
      )}

      {order.dueDate && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t("orderDetail.dueDate")}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(order.dueDate, dateLocale)}</p>
        </div>
      )}
    </div>
  );
}
