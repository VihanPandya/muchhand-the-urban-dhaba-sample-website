"use client";

import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconWhatsapp } from "@/components/icons";

/** Compact Zomato / Swiggy / WhatsApp row used on menu and dish pages. */
export function OrderChannelsInline({ className = "" }: { className?: string }) {
  const { settings } = useSite();
  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
        <IconWhatsapp className="h-4 w-4" /> WhatsApp
      </a>
      {settings.zomatoUrl ? (
        <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-zomato btn-sm">
          Order on Zomato
        </a>
      ) : null}
      {settings.swiggyUrl ? (
        <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-swiggy btn-sm">
          Order on Swiggy
        </a>
      ) : null}
    </div>
  );
}
