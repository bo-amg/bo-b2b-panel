import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "DEALER";
      companyName: string;
      discountPercent: number | null;
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "DEALER";
    companyName: string;
    discountPercent: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "DEALER";
    companyName: string;
    discountPercent: number | null;
  }
}
