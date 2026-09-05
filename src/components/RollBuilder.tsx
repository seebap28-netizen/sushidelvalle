"use client";

import { useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";
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
  const proteins = products.filter((item) => {
    const kind = categories.find((category) => category.id === item.categoryId)?.kind;
    return kind === "protein" && item.available;
  });
  const fillings = products.filter((item) => {
    const kind = categories.find((category) => category.id === item.categoryId)?.kind;
    return kind === "filling" && item.available;
  });
  const riceFree = products.find((item) => item.id === "sin-arroz" && item.available);

  const [wrapId, setWrapId] = useState("");
  const [proteinId, setProteinId] = useState("");
  const [fillingIds, setFillingIds] = useState<string[]>([]);
  const [sinArroz, setSinArroz] = useState(false);

  const maxFillings = sinArroz ? 3 : 2;
  const wrap = wraps.find((item) => item.id === wrapId);
  const protein = proteins.find((item) => item.id === proteinId);
  const selectedFillings = fillings.filter((item) => fillingIds.includes(item.id));

  const extra = selectedFillings.reduce((sum, item) => sum + item.extraPrice, 0);
  const total = useMemo(() => {
    if (sinArroz) return (riceFree?.price || 7500) + extra;
    return (wrap?.price || 0) + extra;
  }, [extra, riceFree?.price, sinArroz, wrap?.price]);

  function toggleWrap(id: string) {
    setWrapId((current) => (current === id ? "" : id));
  }

  function toggleProtein(id: string) {
    setProteinId((current) => (current === id ? "" : id));
  }

  function toggleFilling(id: string) {
    setFillingIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= maxFillings) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  return (
    <section className="section" id="arma-tu-roll">
      <div className="section-head">
        <div>
          <h2 className="section-title">Rolls a tu elección</h2>
          <p>1 envoltura + 1 proteína + {maxFillings} rellenos. Incluye palitos, soya y agridulce.</p>
        </div>
      </div>

      <div className="builder card">
        <div className="checks" style={{ marginBottom: 18 }}>
          <label className="checks">
            <input
              type="checkbox"
              checked={sinArroz}
              onChange={(event) => {
                setSinArroz(event.target.checked);
                setFillingIds((current) => current.slice(0, event.target.checked ? 3 : 2));
              }}
            />
            Roll sin arroz {riceFree ? `(${formatCLP(riceFree.price)})` : ""}
          </label>
        </div>

        <div className="builder-grid">
          <div>
            <h3 style={{ marginBottom: 10 }}>Envoltura</h3>
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

            <h3 style={{ margin: "22px 0 10px" }}>Proteína</h3>
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

            <h3 style={{ margin: "22px 0 10px" }}>Rellenos</h3>
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
          </div>

          <aside className="summary">
            {wrap?.image ? <img className="summary-photo" src={wrap.image} alt={wrap.name} /> : null}
            <h3>Tu roll</h3>
            <ul>
              <li>{sinArroz ? "Sin arroz" : wrap?.name || "Elige envoltura"}</li>
              <li>{protein?.name || "Elige proteína"}</li>
              {selectedFillings.length
                ? selectedFillings.map((item) => <li key={item.id}>{item.name}</li>)
                : <li>Elige {maxFillings} rellenos</li>}
            </ul>
            <div className="total">{total ? formatCLP(total) : "$0"}</div>
          </aside>
        </div>
      </div>
    </section>
  );
}
