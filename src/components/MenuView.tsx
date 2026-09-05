"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Brand } from "./Brand";
import { RollBuilder } from "./RollBuilder";
import { formatCLP } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const PUBLIC_KINDS = new Set(["menu", "extra"]);

const ADDRESS = "Manuel Antonio Matta 519, Coelemu, Ñuble";
const MAPS_QUERY = encodeURIComponent(`${ADDRESS}, Chile`);
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=17&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

type Props = {
  categories: Category[];
  products: Product[];
};

export function MenuView({ categories, products }: Props) {
  const publicCategories = useMemo(
    () =>
      categories
        .filter((category) => PUBLIC_KINDS.has(category.kind))
        .sort((a, b) => a.order - b.order),
    [categories]
  );

  return (
    <div className="page">
      <header className="topbar">
        <Brand />
        <nav className="nav-links">
          <Link href="#arma-tu-roll">Arma tu roll</Link>
          <Link href="#ubicacion">Ubicación</Link>
          <Link href="/admin">Administrar</Link>
        </nav>
      </header>

      <section className="hero">
        <h1>Carta Del Valle</h1>
        <p>
          Rolls a tu elección, promos, poke bowls y snacks.
          Los rolls incluyen palitos, soya y agridulce.
        </p>
      </section>

      <div className="chip-row">
        <a className="chip" href="#arma-tu-roll">
          Arma tu roll
        </a>
        <a className="chip" href="#ubicacion">
          Ubicación
        </a>
        {publicCategories.map((category) => (
          <a className="chip" key={category.id} href={`#${category.slug}`}>
            {category.name}
          </a>
        ))}
      </div>

      <RollBuilder categories={categories} products={products} />

      {publicCategories.map((category) => {
        const items = products
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => a.order - b.order);
        if (!items.length) return null;

        return (
          <section className="section" id={category.slug} key={category.id}>
            <div className="section-head">
              <div>
                <h2 className="section-title">{category.name}</h2>
                {category.description ? <p>{category.description}</p> : null}
                {category.note ? <p className="note">{category.note}</p> : null}
              </div>
            </div>
            <div className="grid">
              {items.map((product) => (
                <article
                  className={`card ${product.available ? "" : "unavailable"}`}
                  key={product.id}
                >
                  {product.image ? (
                    <img className="card-photo" src={product.image} alt={product.name} />
                  ) : null}
                  <div className="card-body">
                    <div className="card-top">
                      <h3>{product.name}</h3>
                      <span className="price">
                        {product.price ? formatCLP(product.price) : "Incluido"}
                      </span>
                    </div>
                    {product.featured ? <span className="badge">Destacado</span> : null}
                    {product.description ? <p className="details">{product.description}</p> : null}
                    {product.extraPrice ? (
                      <p className="details">Recargo {formatCLP(product.extraPrice)}</p>
                    ) : null}
                    {product.details.length ? (
                      <ul className="details">
                        {product.details.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {!product.available ? <p className="details">No disponible</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="section" id="ubicacion">
        <div className="section-head">
          <div>
            <h2 className="section-title">Ubicación</h2>
            <p>Ven a buscarnos o pide retiro en local.</p>
          </div>
        </div>
        <div className="location-card">
          <div className="location-copy">
            <span className="badge">Local</span>
            <h3>Del Valle Sushi</h3>
            <p className="details">{ADDRESS}</p>
            <div className="actions">
              <a className="btn primary" href={MAPS_LINK} target="_blank" rel="noreferrer">
                Abrir en Google Maps
              </a>
            </div>
          </div>
          <iframe
            className="location-map"
            title="Mapa de Del Valle Sushi"
            src={MAPS_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>

      <footer className="footer">
        <span>Del Valle Sushi · {ADDRESS}</span>
        <Link href="/admin">Editar carta</Link>
      </footer>
    </div>
  );
}
