"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profilim</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Firma Adı
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.companyName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Yetkili
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">
              Email
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.email}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Profil bilgilerinizi güncellemek için yönetici ile iletişime geçin.
        </p>
      </div>
    </div>
  );
}
