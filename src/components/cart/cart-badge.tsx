"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function CartBadge() {
  const { totalItems, totalAmount } = useCart();
  const [animate, setAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(totalItems);

  useEffect(() => {
    if (totalItems > prevCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(totalItems);
  }, [totalItems, prevCount]);

  if (totalItems === 0) return null;

  return (
    <Link
      href="/cart"
      className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-2 md:gap-3 bg-blue-600 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 ${
        animate ? "scale-110" : ""
      }`}
    >
      <div className="relative">
        <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
        <span className="absolute -top-2 -right-2 md:-top-2.5 md:-right-2.5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      </div>
      <span className="text-xs md:text-sm font-medium">{formatCurrency(totalAmount)}</span>
    </Link>
  );
}
