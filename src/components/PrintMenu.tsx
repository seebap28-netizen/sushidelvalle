"use client";

import { useEffect } from "react";
import { sortPublicCategories } from "@/lib/categories";
import { formatCLP } from "@/lib/format";
import type { MenuData } from "@/lib/types";

const ADDRESS = "Manuel Antonio Matta 519, Coelemu, Ñuble";

export function PrintMenu({ menu, autoPrint }: { menu: MenuData; autoPrint?: boolean }) {
  const categories = sortPublicCategories(menu.categories);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div className="print-sheet">
      <div className="print-actions">
        <button className="btn primary" type="button" onClick={() => window.print()}>
          Guardar PDF
        </button>
        <a className="btn" href="/admin">
          Volver al admin
        </a>
      </div>

      <header className="print-head">
        <img src="/logo.png" alt="Del Valle Sushi" />
        <div>
          <h1>Carta Del Valle Sushi</h1>
          <p>{ADDRESS}</p>
          <p>Los rolls incluyen palitos, soya y agridulce.</p>
        </div>
      </header>

      {categories.map((category) => {
        const items = menu.products
          .filter((product) => product.categoryId === category.id && product.available)
          .sort((a, b) => a.order - b.order);
        if (!items.length) return null;

        return (
          <section className="print-section" key={category.id}>
            <h2>{category.name}</h2>
            {category.description ? <p className="print-note">{category.description}</p> : null}
            {category.note ? <p className="print-note">{category.note}</p> : null}
            <ul>
              {items.map((product) => (
                <li key={product.id}>
                  <div className="print-row">
                    <span>{product.name}</span>
                    <span className="print-dots" />
                    <strong>
                      {product.price
                        ? formatCLP(product.price)
                        : product.extraPrice
                          ? `+ ${formatCLP(product.extraPrice)}`
                          : "Incluido"}
                    </strong>
                  </div>
                  {product.description ? <p>{product.description}</p> : null}
                  {product.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <footer className="print-foot">
        Del Valle Sushi · {ADDRESS} · +56 9 5511 9982
      </footer>
    </div>
  );
}
