"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state (yeni ekle)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Düzenleme state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
  }>({ title: "", description: "", imageUrl: "", linkUrl: "" });

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    const res = await fetch("/api/banners");
    const data = await res.json();
    setBanners(data);
    setLoading(false);
  }

  async function addBanner() {
    if (!title || !imageUrl) return;
    setSaving(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          imageUrl,
          linkUrl: linkUrl || null,
          sortOrder: banners.length,
        }),
      });
      const data = await res.json();
      setBanners((prev) => [...prev, data]);
      setTitle("");
      setDescription("");
      setImageUrl("");
      setLinkUrl("");
    } catch {}
    setSaving(false);
  }

  async function deleteBanner(id: string) {
    if (!confirm("Bu banner silinecek. Emin misiniz?")) return;
    await fetch(`/api/banners?id=${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleActive(banner: Banner) {
    const res = await fetch("/api/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
    });
    const updated = await res.json();
    setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function startEdit(banner: Banner) {
    setEditingId(banner.id);
    setEditForm({
      title: banner.title,
      description: banner.description || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
    });
  }

  async function saveEdit() {
    if (!editingId || !editForm.title || !editForm.imageUrl) return;
    const res = await fetch("/api/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        title: editForm.title,
        description: editForm.description || null,
        imageUrl: editForm.imageUrl,
        linkUrl: editForm.linkUrl || null,
      }),
    });
    const updated = await res.json();
    setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingId(null);
  }

  async function moveBanner(id: string, direction: "up" | "down") {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === banners.length - 1) return;

    const newBanners = [...banners];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newBanners[idx], newBanners[swapIdx]] = [newBanners[swapIdx], newBanners[idx]];

    // Sıra güncelle
    setBanners(newBanners);
    await Promise.all(
      newBanners.map((b, i) =>
        fetch("/api/banners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: b.id, sortOrder: i }),
        })
      )
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-72" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Banner Yönetimi</h1>
      <p className="text-sm text-gray-500 mb-6">
        Giriş sayfasında gösterilecek bannerları yönetin. Sıralamayı ok tuşlarıyla değiştirebilirsiniz.
      </p>

      {/* Mevcut bannerlar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Bannerlar ({banners.length})
        </h2>

        {banners.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            Henüz banner eklenmemiş. Aşağıdan yeni banner ekleyin.
          </p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <div key={banner.id}>
                {editingId === banner.id ? (
                  /* Düzenleme modu */
                  <div className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50/30 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Görsel URL *</label>
                        <input
                          type="url"
                          value={editForm.imageUrl}
                          onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                        <input
                          type="url"
                          value={editForm.linkUrl}
                          onChange={(e) => setEditForm({ ...editForm, linkUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    {editForm.imageUrl && (
                      <div className="w-48 h-24 bg-gray-100 rounded overflow-hidden">
                        <img src={editForm.imageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={!editForm.title || !editForm.imageUrl}
                        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        <Check className="h-3.5 w-3.5" /> Kaydet
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                      >
                        <X className="h-3.5 w-3.5" /> İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal görünüm */
                  <div
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      banner.isActive
                        ? "border-gray-200 bg-white"
                        : "border-gray-100 bg-gray-50 opacity-60"
                    }`}
                  >
                    {/* Sıralama okları */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveBanner(banner.id, "up")}
                        disabled={idx === 0}
                        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:text-gray-200 transition"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveBanner(banner.id, "down")}
                        disabled={idx === banners.length - 1}
                        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:text-gray-200 transition"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-24 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {banner.title}
                      </p>
                      {banner.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {banner.description}
                        </p>
                      )}
                      {banner.linkUrl && (
                        <p className="text-xs text-blue-500 truncate">
                          {banner.linkUrl}
                        </p>
                      )}
                    </div>

                    {/* Durum badge */}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {banner.isActive ? "Aktif" : "Pasif"}
                    </span>

                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(banner)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(banner)}
                        className={`p-2 rounded-lg transition ${
                          banner.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={banner.isActive ? "Pasif yap" : "Aktif yap"}
                      >
                        {banner.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni banner ekle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Yeni Banner Ekle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Banner başlığı"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa açıklama (opsiyonel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Görsel URL *
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://cdn.shopify.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://... (opsiyonel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Görsel önizleme */}
        {imageUrl && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Önizleme:</p>
            <div className="w-full max-w-lg h-40 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Önizleme"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={addBanner}
          disabled={saving || !title || !imageUrl}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Banner Ekle
        </button>
      </div>
    </div>
  );
}
