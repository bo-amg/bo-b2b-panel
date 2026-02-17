import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    if ((session.user as any).role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/dashboard");
  } catch (error: any) {
    // redirect() throws a special NEXT_REDIRECT error - let it propagate
    if (error?.digest) {
      throw error;
    }
    // Real errors - redirect to login
    redirect("/login");
  }
}
