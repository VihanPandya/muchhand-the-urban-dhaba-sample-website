"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

export type CartAddOn = { id: string; name: string; price: number };

export type CartLine = {
  key: string;
  dishId: string;
  slug: string;
  name: string;
  imageUrl: string;
  isVeg: boolean;
  variantId: string | null;
  variantName: string | null;
  addOns: CartAddOn[];
  unitPrice: number;
  quantity: number;
  notes: string | null;
};

export type NewCartLine = Omit<CartLine, "key">;

const STORAGE_KEY = "mud_cart_v1";

function lineKey(line: NewCartLine): string {
  return [line.dishId, line.variantId ?? "-", line.addOns.map((a) => a.id).sort().join("+") || "-", line.notes ?? "-"].join(
    "|",
  );
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: NewCartLine }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const key = lineKey(action.line);
      const existing = state.find((l) => l.key === key);
      if (existing) {
        return state.map((l) =>
          l.key === key ? { ...l, quantity: Math.min(l.quantity + action.line.quantity, 50) } : l,
        );
      }
      return [...state, { ...action.line, key }];
    }
    case "setQuantity":
      return state
        .map((l) => (l.key === action.key ? { ...l, quantity: Math.max(0, Math.min(action.quantity, 50)) } : l))
        .filter((l) => l.quantity > 0);
    case "remove":
      return state.filter((l) => l.key !== action.key);
    case "clear":
      return [];
    default:
      return state;
  }
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addLine: (line: NewCartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }
    } catch {
      // A corrupt or unavailable store should never break the page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full or blocked — the cart still works for this session */
    }
  }, [lines, hydrated]);

  const addLine = useCallback((line: NewCartLine) => dispatch({ type: "add", line }), []);
  const setQuantity = useCallback((key: string, quantity: number) => dispatch({ type: "setQuantity", key, quantity }), []);
  const removeLine = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal =
      Math.round(
        lines.reduce(
          (sum, l) => sum + (l.unitPrice + l.addOns.reduce((a, x) => a + x.price, 0)) * l.quantity,
          0,
        ) * 100,
      ) / 100;
    return { lines, count, subtotal, hydrated, addLine, setQuantity, removeLine, clear };
  }, [lines, hydrated, addLine, setQuantity, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function cartLineTotal(line: CartLine): number {
  return Math.round((line.unitPrice + line.addOns.reduce((a, x) => a + x.price, 0)) * line.quantity * 100) / 100;
}
