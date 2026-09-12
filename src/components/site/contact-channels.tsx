"use client";

import { useSite } from "@/components/providers/site";
import { buildWhatsappLink, renderTemplate } from "@/lib/whatsapp";
import { IconFacebook, IconGoogle, IconInstagram, IconWhatsapp } from "@/components/icons";

export function ContactChannels() {
  const { settings } = useSite();
  const whatsappHref = buildWhatsappLink(
    settings.whatsappCountryCode,
    settings.whatsappNumber,
    renderTemplate(settings.whatsappDefaultMessage, { restaurant_name: settings.name }),
  );

  return (
    <div className="space-y-3 border-t border-ink-100 pt-4">
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
        <IconWhatsapp className="h-5 w-5" /> Chat on WhatsApp
      </a>
      <div className="flex flex-wrap gap-2">
        {settings.zomatoUrl ? (
          <a href={settings.zomatoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-zomato btn-sm flex-1">
            Zomato
          </a>
        ) : null}
        {settings.swiggyUrl ? (
          <a href={settings.swiggyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-swiggy btn-sm flex-1">
            Swiggy
          </a>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {settings.instagramUrl ? (
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition hover:bg-saffron-400 hover:text-ink-900"
            aria-label="Instagram"
          >
            <IconInstagram className="h-[18px] w-[18px]" />
          </a>
        ) : null}
        {settings.facebookUrl ? (
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition hover:bg-saffron-400 hover:text-ink-900"
            aria-label="Facebook"
          >
            <IconFacebook className="h-[18px] w-[18px]" />
          </a>
        ) : null}
        {settings.googleBusinessUrl ? (
          <a
            href={settings.googleBusinessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition hover:bg-saffron-400 hover:text-ink-900"
            aria-label="Google"
          >
            <IconGoogle className="h-[18px] w-[18px]" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
