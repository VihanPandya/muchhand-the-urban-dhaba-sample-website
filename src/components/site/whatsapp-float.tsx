"use client";

import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconWhatsapp } from "@/components/icons";

export function WhatsappFloat() {
  const { settings } = useSite();
  const href = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3.5 font-semibold text-[#06301a] shadow-[0_18px_36px_-16px_rgba(37,211,102,0.9)] transition hover:bg-[#1fbb59] lg:bottom-7 lg:right-7"
      aria-label="Order on WhatsApp"
    >
      <IconWhatsapp className="h-6 w-6" />
      <span className="hidden text-sm lg:inline">Order on WhatsApp</span>
    </a>
  );
}
