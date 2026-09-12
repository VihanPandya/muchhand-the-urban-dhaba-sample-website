import type { ReactNode } from "react";
import { getBusinessHours, getOpenStatus, getSettings, toPublicSettings } from "@/lib/settings";
import { restaurantJsonLd, JsonLd } from "@/lib/seo";
import { CartProvider } from "@/components/providers/cart";
import { SiteProvider } from "@/components/providers/site";
import { ToastProvider } from "@/components/providers/toast";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { MobileActionBar } from "@/components/site/mobile-bar";
import { WhatsappFloat } from "@/components/site/whatsapp-float";
import { ClosedBanner } from "@/components/site/closed-banner";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, hours, status] = await Promise.all([getSettings(), getBusinessHours(), getOpenStatus()]);
  const publicSettings = toPublicSettings(settings);

  return (
    <SiteProvider
      settings={publicSettings}
      status={{
        isOpen: status.isOpen,
        message: status.message,
        todayLabel: status.todayLabel,
        nextOpenLabel: status.nextOpenLabel,
      }}
    >
      <ToastProvider>
        <CartProvider>
          <JsonLd data={restaurantJsonLd(settings, hours)} />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-paper"
          >
            Skip to content
          </a>
          <SiteHeader />
          <ClosedBanner />
          <main id="main" className="min-h-[60vh] pb-24 lg:pb-0">
            {children}
          </main>
          <SiteFooter
            settings={publicSettings}
            hours={hours.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              isOpen: h.isOpen,
              openTime: h.openTime,
              closeTime: h.closeTime,
            }))}
          />
          <WhatsappFloat />
          <MobileActionBar />
        </CartProvider>
      </ToastProvider>
    </SiteProvider>
  );
}
