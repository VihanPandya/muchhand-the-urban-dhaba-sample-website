import { IconMapPin } from "@/components/icons";

/**
 * Google Maps embed. The admin can paste a full embed URL; otherwise we build a
 * keyless embed from the address or coordinates so the map always renders.
 */
export function MapEmbed({
  address,
  mapsUrl,
  embedUrl,
  latitude,
  longitude,
  className = "h-80",
}: {
  address: string;
  mapsUrl: string | null;
  embedUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  className?: string;
}) {
  const query = latitude && longitude ? `${latitude},${longitude}` : address;
  const src = embedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
  const directions = mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  return (
    <div className="card overflow-hidden">
      <div className={`relative w-full ${className}`}>
        <iframe
          src={src}
          title={`Map showing ${address}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
          allowFullScreen
        />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-ink-600">
          <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600" />
          {address}
        </p>
        <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm shrink-0">
          Get Directions
        </a>
      </div>
    </div>
  );
}
