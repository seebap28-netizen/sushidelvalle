"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/lib/types";

const WRAPS = [
  { id: "panko", name: "Panko", image: "/photos/panko-roll.png" },
  { id: "nori", name: "Nori", image: "/photos/hosomaki.png" },
];

export function HandrollBuilder({ handroll }: { handroll?: Product }) {
  const [wrapId, setWrapId] = useState("");
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const wrap = WRAPS.find((item) => item.id === wrapId);
  const total = useMemo(() => handroll?.price || 0, [handroll?.price]);
  const ready = Boolean(handroll) && Boolean(wrap);

  function toggleWrap(id: string) {
    setWrapId((current) => {
      const next = current === id ? "" : id;
      if (next) setOpen(false);
      return next;
    });
  }

  return (
    <div className="builder card" id="arma-tu-handroll">
      <details className="builder-fold" open={open} style={{ marginBottom: 0 }}>
        <summary
          className="fold-head"
          onClick={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
        >
          <span>Envoltura</span>
          <em>{wrap?.name || "Elige 1"}</em>
        </summary>
        <div className="choice-grid">
          {WRAPS.map((item) => (
            <button
              key={item.id}
              className={`choice ${wrapId === item.id ? "selected" : ""}`}
              onClick={() => toggleWrap(item.id)}
              type="button"
            >
              <img className="choice-photo" src={item.image} alt="" />
              {item.name}
              <small>Incluida</small>
            </button>
          ))}
        </div>
      </details>
      <div className="builder-order">
        <p className="note">
          {handroll
            ? `Handroll: ${handroll.name}`
            : "Elige 1 handroll arriba y envoltura panko o nori."}
        </p>
        {ready ? (
          <button
            className="btn whatsapp"
            type="button"
            onClick={() => {
              if (!handroll || !wrap) return;
              cart.add({
                key: `hand-${handroll.id}-${wrap.id}`,
                name: `Handroll ${handroll.name}`,
                detail: `Envoltura ${wrap.name}`,
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
