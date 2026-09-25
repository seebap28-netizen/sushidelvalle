"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/lib/types";

const FILLINGS =
  "Base de arroz, cebolla morada, zanahoria, lechuga, choclo y palta";

const SAUCES = [
  { id: "ajo", name: "Ajo" },
  { id: "merken", name: "Merkén" },
  { id: "cilantro", name: "Cilantro" },
];

const MAX_SAUCES = 2;

export function WrapBuilder({ protein }: { protein?: Product }) {
  const [sauceIds, setSauceIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const selected = SAUCES.filter((item) => sauceIds.includes(item.id));
  const total = useMemo(() => protein?.price || 0, [protein?.price]);
  const ready = Boolean(protein) && selected.length === MAX_SAUCES;

  function toggleSauce(id: string) {
    setSauceIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_SAUCES) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  return (
    <div className="builder card" id="arma-tu-wrap">
      <details className="builder-fold" open={open} style={{ marginBottom: 0 }}>
        <summary
          className="fold-head"
          onClick={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
        >
          <span>Salsas</span>
          <em>
            {selected.length
              ? selected.map((item) => item.name).join(", ")
              : `Elige ${MAX_SAUCES}`}
          </em>
        </summary>
        <div className="choice-grid">
          {SAUCES.map((item) => (
            <button
              key={item.id}
              className={`choice ${sauceIds.includes(item.id) ? "selected" : ""}`}
              onClick={() => toggleSauce(item.id)}
              type="button"
            >
              {item.name}
              <small>Incluida</small>
            </button>
          ))}
        </div>
      </details>
      <div className="builder-order">
        <p className="note">
          {protein
            ? `Proteína: ${protein.name}`
            : "Elige 1 proteína arriba y 2 salsas."}
        </p>
        {ready ? (
          <button
            className="btn whatsapp"
            type="button"
            onClick={() => {
              if (!protein) return;
              cart.add({
                key: `foodwrap-${protein.id}-${sauceIds.slice().sort().join("+")}`,
                name: `Wrap ${protein.name}`,
                detail: `${FILLINGS.toLowerCase()}; ${selected.map((item) => item.name).join(", ")}`,
                price: total,
              });
            }}
          >
            Agregar al pedido
          </button>
        ) : (
          <span className="btn whatsapp disabled">Agregar al pedido</span>
        )}
      </div>
    </div>
  );
}
