import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  return {
    name: settings.name,
    short_name: "Muchhad",
    description: settings.seoDescription || settings.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#14110f",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
