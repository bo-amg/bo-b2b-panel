"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Gamepad2,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl group">
      <div className="absolute inset-0 transition-all duration-700">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{banner.title}</h3>
        {banner.description && (
          <p className="text-sm text-white/80 drop-shadow">{banner.description}</p>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-6" : "bg-white/40 w-1.5 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated blob shapes */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 animate-blob"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-80 h-80 bg-indigo-500/8 animate-blob"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-72 h-72 bg-cyan-500/8 animate-blob"
        style={{ animationDelay: "4s" }}
      />

      {/* Small floating dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/5 animate-float"
          style={{
            width: `${8 + i * 4}px`,
            height: `${8 + i * 4}px`,
            left: `${15 + i * 15}%`,
            top: `${10 + i * 12}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${5 + i * 1.5}s`,
          }}
        />
      ))}

      {/* Gradient lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { t, lang, setLanguage } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => setBanners(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("login.error"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const hasBanners = banners.length > 0;

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative">
      <FloatingParticles />

      <div
        className={`w-full ${hasBanners ? "max-w-5xl" : "max-w-md"} relative z-10 ${
          mounted ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <div
          className={`glass-card rounded-3xl overflow-hidden shadow-2xl shadow-black/20 ${
            hasBanners ? "flex min-h-[600px]" : ""
          }`}
        >
          {/* Banner section - Desktop */}
          {hasBanners && (
            <div className="hidden md:block w-1/2 p-4 animate-fade-in">
              <BannerCarousel banners={banners} />
            </div>
          )}

          {/* Login form */}
          <div
            className={`${
              hasBanners ? "w-full md:w-1/2" : "w-full"
            } p-10 md:p-12 flex flex-col justify-center relative`}
          >
            {/* Banner - Mobile */}
            {hasBanners && (
              <div className="md:hidden mb-8 h-48 -mx-4 -mt-4 rounded-2xl overflow-hidden">
                <BannerCarousel banners={banners} />
              </div>
            )}

            {/* Language Toggle */}
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setLanguage(lang === "TR" ? "EN" : "TR")}
                className="text-white/50 hover:text-white/80 text-xs font-medium transition-colors duration-200"
              >
                {lang === "TR" ? "EN" : "TR"}
              </button>
            </div>

            {/* Logo / Brand */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-5 shadow-lg shadow-blue-500/25 animate-float-slow">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {t("login.title")}
              </h1>
              <p className="text-blue-200/60 mt-2 text-sm font-medium tracking-wider uppercase">
                {t("login.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-blue-200/70 uppercase tracking-wider"
                >
                  {t("login.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm outline-none"
                    placeholder="bayi@firma.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-blue-200/70 uppercase tracking-wider"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass-input w-full pl-11 pr-12 py-3.5 rounded-xl text-white text-sm outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl backdrop-blur-sm animate-slide-up flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn w-full text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {t("login.loading")}
                  </span>
                ) : (
                  t("login.submit")
                )}
              </button>
            </form>

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-2">
                    <Truck className="h-4 w-4 text-blue-300/60 group-hover:text-blue-300 transition" />
                  </div>
                  <p className="text-[10px] text-white/30 group-hover:text-white/50 transition font-medium">
                    {t("login.fastDelivery")}
                  </p>
                </div>
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300/60 group-hover:text-emerald-300 transition" />
                  </div>
                  <p className="text-[10px] text-white/30 group-hover:text-white/50 transition font-medium">
                    {t("login.secureShopping")}
                  </p>
                </div>
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-2">
                    <Gamepad2 className="h-4 w-4 text-purple-300/60 group-hover:text-purple-300 transition" />
                  </div>
                  <p className="text-[10px] text-white/30 group-hover:text-white/50 transition font-medium">
                    {t("login.productCount")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-6 font-medium">
          &copy; {new Date().getFullYear()} {t("login.title")}. {t("login.copyright")}
        </p>
      </div>
    </div>
  );
}
