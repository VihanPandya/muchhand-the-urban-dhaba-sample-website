/**
 * WhatsApp ordering. The number and the message templates are stored in the
 * database and edited from Admin → Integrations, never hard-coded here.
 */

export type TemplateVars = Record<string, string | number | null | undefined>;

/** Replaces {{placeholders}}; unknown ones collapse to an empty string. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function normalisePhone(countryCode: string, number: string): string {
  const digits = `${countryCode}${number}`.replace(/\D/g, "");
  return digits;
}

export function buildWhatsappLink(
  countryCode: string,
  number: string,
  message: string,
): string {
  const phone = normalisePhone(countryCode, number);
  const text = encodeURIComponent(message.trim());
  if (!phone) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * A link that messages a *customer* (order updates, reservation
 * confirmations) rather than the restaurant. The number is the customer's own,
 * so the restaurant's country code is used to normalise it.
 */
export function buildCustomerWhatsappLink(countryCode: string, customerPhone: string, message: string): string {
  return buildWhatsappLink(countryCode, customerPhone, message);
}

export type WhatsappOrderItem = {
  name: string;
  quantity: number;
  variantName?: string | null;
  addOns?: { name: string }[];
  notes?: string | null;
};

export function formatItemsForWhatsapp(items: WhatsappOrderItem[]): string {
  return items
    .map((item) => {
      const extras: string[] = [];
      if (item.variantName) extras.push(item.variantName);
      if (item.addOns?.length) extras.push(...item.addOns.map((a) => a.name));
      if (item.notes) extras.push(item.notes);
      const suffix = extras.length ? ` (${extras.join(", ")})` : "";
      return `${item.quantity} × ${item.name}${suffix}`;
    })
    .join("\n");
}

export const DEFAULT_ORDER_TEMPLATE = `Hello {{restaurant_name}}, I would like to place an order.

Name: {{customer_name}}
Items:
{{items}}

Order Type: {{order_type}}
Address: {{address}}
Total: {{total}}`;

export const DEFAULT_RESERVATION_TEMPLATE = `Hello {{restaurant_name}}, I would like to book a table.

Name: {{customer_name}}
Date: {{date}}
Time: {{time}}
Guests: {{guests}}
Phone: {{phone}}
Note: {{special_request}}`;

export const TEMPLATE_VARIABLES = {
  order: [
    "restaurant_name",
    "customer_name",
    "items",
    "total",
    "order_type",
    "address",
    "phone",
    "order_number",
  ],
  reservation: ["restaurant_name", "customer_name", "date", "time", "guests", "phone", "special_request"],
} as const;
