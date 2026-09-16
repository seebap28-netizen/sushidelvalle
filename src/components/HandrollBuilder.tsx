"use client";

import { useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

const WRAPS = [
  { id: "panko", name: "Panko", image: "/photos/panko-roll.png" },
  { id: "nori", name: "Nori", image: "/photos/hosomaki.png" },
];

export function HandrollBuilder({ handroll }: { handroll?: Product }) {
  const [wrapId, setWrapId] = useState("");
  const [open, setOpen] = useState(false);
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
          <a
            className="btn whatsapp"
            href={whatsappHref(
              [
                "Hola, quiero este handroll:",
                "",
                `• Handroll: ${handroll?.name}`,
                handroll?.description ? `• ${handroll.description}` : "",
                `• Envoltura: ${wrap?.name}`,
                `• Total: ${formatCLP(total)}`,
              ]
                .filter(Boolean)
                .join("\n")
            )}
            target="_blank"
            rel="noreferrer"
          >
            Pedir por WhatsApp
          </a>
        ) : (
          <span className="btn whatsapp disabled">Pedir por WhatsApp</span>
        )}
      </div>
    </div>
  );
}
