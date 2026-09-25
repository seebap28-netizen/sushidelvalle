"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/lib/types";

const VEGETABLES = [
  { id: "palta", name: "Palta", extraPrice: 0 },
  { id: "pepino", name: "Pepino", extraPrice: 0 },
  { id: "zanahoria", name: "Zanahoria", extraPrice: 0 },
  { id: "tomate", name: "Tomate", extraPrice: 0 },
  { id: "cebollin", name: "Cebollín", extraPrice: 0 },
  { id: "lechuga", name: "Lechuga", extraPrice: 0 },
  { id: "palmito", name: "Palmito", extraPrice: 0 },
  { id: "champi", name: "Champiñón", extraPrice: 1200 },
];

const SAUCES = [
  { id: "ajo", name: "Ajo" },
  { id: "merken", name: "Merkén" },
  { id: "cilantro", name: "Cilantro" },
];

const MAX_VEGGIES = 4;
const MAX_SAUCES = 2;

export function BowlBuilder({ protein }: { protein?: Product }) {
  const [veggieIds, setVeggieIds] = useState<string[]>([]);
  const [sauceIds, setSauceIds] = useState<string[]>([]);
  const [openFold, setOpenFold] = useState<"veggie" | "sauce" | null>(null);
  const selected = VEGETABLES.filter((item) => veggieIds.includes(item.id));
  const sauces = SAUCES.filter((item) => sauceIds.includes(item.id));
  const cart = useCart();
  const extra = selected.reduce((sum, item) => sum + item.extraPrice, 0);
  const total = useMemo(() => (protein?.price || 0) + extra, [extra, protein?.price]);
  const ready = Boolean(protein) && selected.length === MAX_VEGGIES && sauces.length === MAX_SAUCES;

  function toggleVeggie(id: string) {
    setVeggieIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_VEGGIES) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  function toggleSauce(id: string) {
    setSauceIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      const next = current.length >= MAX_SAUCES ? [...current.slice(1), id] : [...current, id];
      if (next.length >= MAX_SAUCES) setOpenFold(null);
      return next;
    });
  }

  function toggleFold(fold: "veggie" | "sauce") {
    setOpenFold((current) => (current === fold ? null : fold));
  }

  return (
    <div className="builder card" id="arma-tu-bowl">
      <details className="builder-fold" open={openFold === "veggie"}>
        <summary
          className="fold-head"
          onClick={(event) => {
            event.preventDefault();
            toggleFold("veggie");
          }}
        >
          <span>Vegetales</span>
          <em>
            {selected.length
              ? selected.map((item) => item.name).join(", ")
              : `Elige ${MAX_VEGGIES}`}
          </em>
        </summary>
        <div className="choice-grid">
          {VEGETABLES.map((item) => (
            <button
              key={item.id}
              className={`choice ${veggieIds.includes(item.id) ? "selected" : ""}`}
              onClick={() => toggleVeggie(item.id)}
              type="button"
            >
              {item.name}
              <small>{item.extraPrice ? `+ ${formatCLP(item.extraPrice)}` : "Incluido"}</small>
            </button>
          ))}
        </div>
      </details>

      <details className="builder-fold" open={openFold === "sauce"} style={{ marginBottom: 0 }}>
        <summary
          className="fold-head"
          onClick={(event) => {
            event.preventDefault();
            toggleFold("sauce");
          }}
        >
          <span>Salsas</span>
          <em>
            {sauces.length
              ? sauces.map((item) => item.name).join(", ")
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
            : "Elige 1 proteína arriba, 4 vegetales y 2 salsas."}
        </p>
        {ready ? (
          <button
            className="btn whatsapp"
            type="button"
            onClick={() => {
              if (!protein) return;
              cart.add({
                key: `bowl-${protein.id}-${veggieIds.slice().sort().join("+")}-${sauceIds.slice().sort().join("+")}`,
                name: `Bowl ${protein.name}`,
                detail: `${selected.map((item) => item.name).join(", ")}; ${sauces.map((item) => item.name).join(", ")}`,
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
