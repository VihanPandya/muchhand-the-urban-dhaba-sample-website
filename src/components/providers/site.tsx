"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicSettings } from "@/lib/settings";

export type SiteStatus = {
  isOpen: boolean;
  message: string;
  todayLabel: string;
  nextOpenLabel: string | null;
};

type SiteContextValue = { settings: PublicSettings; status: SiteStatus };

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  settings,
  status,
  children,
}: SiteContextValue & { children: ReactNode }) {
  return <SiteContext.Provider value={{ settings, status }}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}
