"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  Settings,
  Percent,
  Image as ImageIcon,
  LogOut,
  FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/admin/orders/new", label: "Manuel Sipariş", icon: FilePlus },
  { href: "/admin/dealers", label: "Bayiler", icon: Users },
  { href: "/admin/products", label: "Ürünler", icon: Package },
  { href: "/admin/discounts", label: "İskontolar", icon: Percent },
  { href: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold">Büyüklere Oyuncaklar</h1>
        <p className="text-xs text-gray-400 mt-1">Admin Paneli</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-sm font-medium mb-1">
          {session?.user?.name}
        </div>
        <div className="text-xs text-gray-400 mb-3">{session?.user?.email}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
