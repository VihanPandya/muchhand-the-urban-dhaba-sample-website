import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#14110f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: settings.seoTitle || `${settings.name} | ${settings.tagline}`,
      template: `%s · ${settings.name}`,
    },
    description:
      settings.seoDescription ||
      "Authentic Punjabi and Amritsari food. Order online, on WhatsApp, Zomato or Swiggy, or book a table.",
    applicationName: settings.name,
    keywords: [...settings.cuisines, "restaurant", "order online", "dhaba", "Ahmedabad"],
    icons: {
      icon: [
        { url: "/favicon.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: true, address: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
