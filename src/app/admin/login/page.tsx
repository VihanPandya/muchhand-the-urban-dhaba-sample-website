import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src={settings.logoUrl || "/logo.svg"} alt="" width={64} height={64} className="h-16 w-16 rounded-full" />
          <h1 className="mt-4 font-display text-2xl text-paper">{settings.name}</h1>
          <p className="mt-1 text-sm text-ink-400">Restaurant admin panel</p>
        </div>

        <div className="rounded-[var(--radius-card)] bg-paper p-6 shadow-[var(--shadow-lift)] md:p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          <Link href="/" className="transition hover:text-saffron-300">
            ← Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
