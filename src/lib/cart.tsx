"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { formatCLP } from "./format";

export type CartLine = {
  key: string;
  name: string;
  detail?: string;
  price: number;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  qtyOf: (key: string) => number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  orderText: () => string;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

    return {
      lines,
      count,
      total,
      qtyOf: (key) => lines.find((line) => line.key === key)?.qty || 0,
      add: (line, qty = 1) => {
        setLines((current) => {
          const found = current.find((item) => item.key === line.key);
          if (found) {
            return current.map((item) =>
              item.key === line.key ? { ...item, qty: item.qty + qty } : item
            );
          }
          return [...current, { ...line, qty }];
        });
      },
      setQty: (key, qty) => {
        setLines((current) =>
          qty <= 0
            ? current.filter((item) => item.key !== key)
            : current.map((item) => (item.key === key ? { ...item, qty } : item))
        );
      },
      clear: () => setLines([]),
      orderText: () => {
        const items = lines.map((line) => {
          const price = formatCLP(line.price * line.qty);
          const extra = line.detail ? ` (${line.detail})` : "";
          return `• ${line.name}${extra} x${line.qty} — ${price}`;
        });
        return [
          "Hola, quiero hacer un pedido en Del Valle Sushi:",
          "",
          ...items,
          "",
          `Total: ${formatCLP(total)}`,
        ].join("\n");
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart debe usarse dentro de CartProvider");
  return cart;
}
