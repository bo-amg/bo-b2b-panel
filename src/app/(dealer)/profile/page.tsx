"use client";

import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/language-provider";
import { Globe } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { t, lang, setLanguage } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("profile.title")}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">
              {t("profile.companyName")}
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.companyName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">
              {t("profile.contactPerson")}
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">
              {t("profile.email")}
            </label>
            <p className="text-gray-900 mt-1">{session?.user?.email}</p>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              {t("profile.language")}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("TR")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  lang === "TR"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Globe className="h-4 w-4" />
                T&uuml;rk&ccedil;e
              </button>
              <button
                onClick={() => setLanguage("EN")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  lang === "EN"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Globe className="h-4 w-4" />
                English
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          {t("profile.contactAdmin")}
        </p>
      </div>
    </div>
  );
}
