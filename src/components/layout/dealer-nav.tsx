"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";

export function DealerNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, lang, setLanguage } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/products", label: t("nav.products"), icon: Package },
    { href: "/favorites", label: t("nav.favorites"), icon: Heart },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart },
    { href: "/orders", label: t("nav.orders"), icon: ClipboardList },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  // Mobilde bottom bar'da gösterilecek ana 5 item
  const mobileNavItems = [
    { href: "/dashboard", label: t("nav.home"), icon: LayoutDashboard },
    { href: "/products", label: t("nav.products"), icon: Package },
    { href: "/favorites", label: t("nav.favorites"), icon: Heart },
    { href: "/orders", label: t("nav.orders"), icon: ClipboardList },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Menü açıkken scroll'u kitle
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* === DESKTOP SIDEBAR === */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">
            {t("nav.brand")}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{t("nav.portal")}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-blue-600")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium mb-1 truncate">
            {session?.user?.companyName}
          </div>
          <div className="text-xs text-gray-500 mb-3 truncate">{session?.user?.email}</div>
          <button
            onClick={() => setLanguage(lang === "TR" ? "EN" : "TR")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition mb-3 w-full"
          >
            <Globe className="h-4 w-4" />
            <span className="flex items-center gap-1">
              <span className={cn("transition", lang === "TR" ? "font-bold text-gray-900" : "text-gray-400")}>TR</span>
              <span className="text-gray-300">|</span>
              <span className={cn("transition", lang === "EN" ? "font-bold text-gray-900" : "text-gray-400")}>EN</span>
            </span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* === MOBILE TOP HEADER === */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{t("nav.brand")}</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{t("nav.b2b")}</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-blue-600 transition"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 transition"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* === MOBILE SLIDE-DOWN MENU === */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            style={{ top: "3.5rem" }}
          />
          <div
            className="md:hidden fixed left-0 right-0 z-50 bg-white rounded-b-2xl shadow-xl border-b border-gray-200 overflow-hidden page-enter"
            style={{ top: "3.5rem" }}
          >
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{session?.user?.companyName}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <div className="p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 active:bg-gray-50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-100 space-y-1">
              <button
                onClick={() => setLanguage(lang === "TR" ? "EN" : "TR")}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-medium w-full rounded-xl active:bg-gray-50 transition"
              >
                <Globe className="h-5 w-5 text-gray-400" />
                <span className="flex items-center gap-1.5">
                  <span className={cn("transition", lang === "TR" ? "font-bold text-gray-900" : "text-gray-400")}>TR</span>
                  <span className="text-gray-300">|</span>
                  <span className={cn("transition", lang === "EN" ? "font-bold text-gray-900" : "text-gray-400")}>EN</span>
                </span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-medium w-full rounded-xl active:bg-red-50 transition"
              >
                <LogOut className="h-5 w-5" />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* === MOBILE BOTTOM TAB BAR === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 bottom-nav-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              >
                <div className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-blue-50"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "text-blue-600")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
