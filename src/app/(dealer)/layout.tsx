import { DealerNav } from "@/components/layout/dealer-nav";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartBadge } from "@/components/cart/cart-badge";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen">
        <DealerNav />
        <main className="flex-1 pt-18 pb-20 px-4 md:pt-0 md:pb-0 md:p-8 page-enter">
          {children}
        </main>
        <CartBadge />
      </div>
    </CartProvider>
  );
}
