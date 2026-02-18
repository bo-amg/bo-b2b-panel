"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

type SettingsTab = "tr" | "global";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("tr");

  useEffect(() => {
    fetchSettings(activeTab);
  }, [activeTab]);

  async function fetchSettings(tab: SettingsTab) {
    setLoading(true);
    setSuccess("");
    setError("");
    const type = tab === "global" ? "global_dealer" : "global";
    const res = await fetch(`/api/settings?type=${type}`);
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: any = {};
    formData.forEach((value, key) => {
      if (key === "discountPercent" || key === "defaultDueDays") {
        data[key] = Number(value);
      } else {
        data[key] = value;
      }
    });

    data.settingsType = activeTab === "global" ? "global_dealer" : "global";

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Kayit basarisiz");

      const updated = await res.json();
      setSettings(updated);
      setSuccess("Ayarlar kaydedildi");
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ayarlar</h1>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("tr")}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "tr"
              ? "bg-white text-orange-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          TR Bayi Ayarlari
        </button>
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition ${
            activeTab === "global"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Globe className="h-4 w-4" />
          Global Bayi Ayarlari
        </button>
      </div>

      {activeTab === "global" && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-indigo-700">
            Bu ayarlar yalnizca <strong>Global Bayi</strong> (yabanci) tipi bayilerin proforma faturalarina yansir.
            Farkli banka hesabi, kargo kosullari vb. belirleyebilirsiniz.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Yukleniyor...</div>
      ) : (
        <form key={activeTab} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Iskonto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Varsayilan Iskonto
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Global Iskonto %
                </label>
                <input
                  name="discountPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={Number(settings.discountPercent)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Urun/kategori/bayi iskontosu tanimli degilse bu oran uygulanir
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Varsayilan Vade (Gun)
                </label>
                <input
                  name="defaultDueDays"
                  type="number"
                  min="0"
                  defaultValue={settings.defaultDueDays}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Firma Bilgileri */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Firma Bilgileri
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma Adi
                  </label>
                  <input
                    name="companyName"
                    defaultValue={settings.companyName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="companyEmail"
                    type="email"
                    defaultValue={settings.companyEmail || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    name="companyPhone"
                    defaultValue={settings.companyPhone || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi No
                  </label>
                  <input
                    name="companyTaxId"
                    defaultValue={settings.companyTaxId || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi Dairesi
                  </label>
                  <input
                    name="companyTaxOffice"
                    defaultValue={settings.companyTaxOffice || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    name="companyLogo"
                    defaultValue={settings.companyLogo || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <textarea
                  name="companyAddress"
                  rows={2}
                  defaultValue={settings.companyAddress || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Banka Bilgileri */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Banka Bilgileri
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banka Adi
                  </label>
                  <input
                    name="bankName"
                    defaultValue={settings.bankName || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hesap Sahibi
                  </label>
                  <input
                    name="bankAccountHolder"
                    defaultValue={settings.bankAccountHolder || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    name="bankIban"
                    defaultValue={settings.bankIban || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="TR..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SWIFT Kodu
                  </label>
                  <input
                    name="bankSwift"
                    defaultValue={settings.bankSwift || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odeme Kosullari
                </label>
                <textarea
                  name="paymentTerms"
                  rows={2}
                  defaultValue={settings.paymentTerms || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Orn: Fatura tarihinden itibaren 30 gun vadeli"
                />
              </div>
            </div>
          </div>

          {/* Kargo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Kargo / Teslimat
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Varsayilan Kargo Bilgisi
              </label>
              <textarea
                name="cargoInfo"
                rows={2}
                defaultValue={settings.cargoInfo || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Proforma faturada gorunecek kargo/teslimat bilgisi"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Ayarlari Kaydet"}
          </button>
        </form>
      )}
    </div>
  );
}
