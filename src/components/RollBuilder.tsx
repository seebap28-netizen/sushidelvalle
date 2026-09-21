"use client";

import { useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import type { Category, Product } from "@/lib/types";

type Props = {
  categories: Category[];
  products: Product[];
};

export function RollBuilder({ categories, products }: Props) {
  const wraps = products.filter((item) => {
    const kind = categories.find((category) => category.id === item.categoryId)?.kind;
    return (kind === "wrap" || kind === "wrap_premium") && item.available;
  });
  const proteins = products
    .filter((item) => {
      const kind = categories.find((category) => category.id === item.categoryId)?.kind;
      return kind === "protein" && item.available;
    })
    .sort((a, b) => a.order - b.order);
  const fillings = products.filter((item) => {
    const kind = categories.find((category) => category.id === item.categoryId)?.kind;
    return kind === "filling" && item.available;
  });

  const [wrapId, setWrapId] = useState("");
  const [proteinId, setProteinId] = useState("");
  const [fillingIds, setFillingIds] = useState<string[]>([]);
  const [sauceId, setSauceId] = useState("");
  const [openFold, setOpenFold] = useState<"wrap" | "protein" | "filling" | "sauce" | null>(null);

  const maxFillings = 2;
  const sauces = [
    { id: "soya", name: "Soya" },
    { id: "agridulce", name: "Agridulce" },
  ];
  const wrap = wraps.find((item) => item.id === wrapId);
  const protein = proteins.find((item) => item.id === proteinId);
  const selectedFillings = fillings.filter((item) => fillingIds.includes(item.id));
  const sauce = sauces.find((item) => item.id === sauceId);

  const extra = selectedFillings.reduce((sum, item) => sum + item.extraPrice, 0);
  const total = useMemo(() => (wrap?.price || 0) + extra, [extra, wrap?.price]);

  function toggleWrap(id: string) {
    setWrapId((current) => {
      const next = current === id ? "" : id;
      if (next) setOpenFold(null);
      return next;
    });
  }

  function toggleProtein(id: string) {
    setProteinId((current) => {
      const next = current === id ? "" : id;
      if (next) setOpenFold(null);
      return next;
    });
  }

  function toggleFilling(id: string) {
    setFillingIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      const next = current.length >= maxFillings ? [...current.slice(1), id] : [...current, id];
      if (next.length >= maxFillings) setOpenFold(null);
      return next;
    });
  }

  function toggleSauce(id: string) {
    setSauceId((current) => {
      const next = current === id ? "" : id;
      if (next) setOpenFold(null);
      return next;
    });
  }

  function toggleFold(fold: "wrap" | "protein" | "filling" | "sauce") {
    setOpenFold((current) => (current === fold ? null : fold));
  }

  return (
    <section className="section" id="arma-tu-roll">
      <div className="section-head">
        <div>
          <h2 className="section-title">Rolls a tu elección</h2>
          <p>1 envoltura + 1 proteína + {maxFillings} rellenos. Elige soya o agridulce. Incluye palitos.</p>
        </div>
      </div>

      <div className="builder card">
        <div className="builder-grid">
          <div className="builder-folds">
            <details className="builder-fold" open={openFold === "wrap"}>
              <summary className="fold-head" onClick={(event) => {
                event.preventDefault();
                toggleFold("wrap");
              }}>
                <span>Envoltura</span>
                <em>{wrap?.name || "Elige 1"}</em>
              </summary>
              <div className="choice-grid">
                {wraps.map((item) => (
                  <button
                    key={item.id}
                    className={`choice ${wrapId === item.id ? "selected" : ""}`}
                    onClick={() => toggleWrap(item.id)}
                    type="button"
                  >
                    {item.image ? <img className="choice-photo" src={item.image} alt="" /> : null}
                    {item.name}
                    <small>{formatCLP(item.price)}</small>
                  </button>
                ))}
              </div>
            </details>

            <details className="builder-fold" open={openFold === "protein"}>
              <summary className="fold-head" onClick={(event) => {
                event.preventDefault();
                toggleFold("protein");
              }}>
                <span>Proteína</span>
                <em>{protein?.name || "Elige 1"}</em>
              </summary>
              <div className="choice-grid">
                {proteins.map((item) => (
                  <button
                    key={item.id}
                    className={`choice ${proteinId === item.id ? "selected" : ""}`}
                    onClick={() => toggleProtein(item.id)}
                    type="button"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </details>

            <details className="builder-fold" open={openFold === "filling"}>
              <summary className="fold-head" onClick={(event) => {
                event.preventDefault();
                toggleFold("filling");
              }}>
                <span>Rellenos</span>
                <em>
                  {selectedFillings.length
                    ? selectedFillings.map((item) => item.name).join(", ")
                    : `Elige ${maxFillings}`}
                </em>
              </summary>
              <div className="choice-grid">
                {fillings.map((item) => (
                  <button
                    key={item.id}
                    className={`choice ${fillingIds.includes(item.id) ? "selected" : ""}`}
                    onClick={() => toggleFilling(item.id)}
                    type="button"
                  >
                    {item.name}
                    <small>{item.extraPrice ? `+ ${formatCLP(item.extraPrice)}` : "Incluido"}</small>
                  </button>
                ))}
              </div>
            </details>

            <details className="builder-fold" open={openFold === "sauce"}>
              <summary className="fold-head" onClick={(event) => {
                event.preventDefault();
                toggleFold("sauce");
              }}>
                <span>Salsa</span>
                <em>{sauce?.name || "Elige 1"}</em>
              </summary>
              <div className="choice-grid">
                {sauces.map((item) => (
                  <button
                    key={item.id}
                    className={`choice ${sauceId === item.id ? "selected" : ""}`}
                    onClick={() => toggleSauce(item.id)}
                    type="button"
                  >
                    {item.name}
                    <small>Incluida</small>
                  </button>
                ))}
              </div>
            </details>
          </div>

          <aside className="summary">
            {wrap?.image ? <img className="summary-photo" src={wrap.image} alt={wrap.name} /> : null}
            <h3>Tu roll</h3>
            <ul>
              <li>{wrap?.name || "Elige envoltura"}</li>
              <li>{protein?.name || "Elige proteína"}</li>
              {selectedFillings.length
                ? selectedFillings.map((item) => <li key={item.id}>{item.name}</li>)
                : <li>Elige {maxFillings} rellenos</li>}
              <li>{sauce?.name || "Elige salsa"}</li>
            </ul>
            <div className="total">{total ? formatCLP(total) : "$0"}</div>
            {wrap && protein && selectedFillings.length === maxFillings && sauce ? (
              <a
                className="btn whatsapp"
                href={whatsappHref(
                  [
                    "Hola, quiero este roll a elección:",
                    "",
                    `• Envoltura: ${wrap.name}`,
                    `• Proteína: ${protein.name}`,
                    `• Rellenos: ${selectedFillings.map((item) => item.name).join(", ")}`,
                    `• Salsa: ${sauce.name}`,
                    `• Total: ${formatCLP(total)}`,
                  ].join("\n")
                )}
                target="_blank"
                rel="noreferrer"
              >
                Pedir por WhatsApp
              </a>
            ) : (
              <span className="btn whatsapp disabled">Pedir por WhatsApp</span>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
