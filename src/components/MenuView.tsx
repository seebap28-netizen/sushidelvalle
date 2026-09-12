"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "./Brand";
import { RollBuilder } from "./RollBuilder";
import { childCategories, sortPublicCategories, topLevelCategories } from "@/lib/categories";
import { formatCLP } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const PUBLIC_KINDS = new Set(["menu", "extra"]);

const ADDRESS = "Manuel Antonio Matta 519, Coelemu, Ñuble";
const MAPS_QUERY = encodeURIComponent(`${ADDRESS}, Chile`);
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=17&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const WHATSAPP_LINK =
  "https://wa.me/56955119982?text=" +
  encodeURIComponent("Hola, quiero hacer un pedido en Del Valle Sushi");

type Props = {
  categories: Category[];
  products: Product[];
};

export function MenuView({ categories, products }: Props) {
  const [live, setLive] = useState({ categories, products });

  useEffect(() => {
    setLive({ categories, products });
  }, [categories, products]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/menu", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((menu) => {
        if (!cancelled && menu?.categories && menu?.products) {
          setLive({ categories: menu.categories, products: menu.products });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const publicCategories = useMemo(
    () =>
      sortPublicCategories(
        live.categories.filter((category) => PUBLIC_KINDS.has(category.kind))
      ),
    [live.categories]
  );
  const topCategories = useMemo(() => topLevelCategories(publicCategories), [publicCategories]);

  return (
    <div className="page">
      <header className="topbar">
        <Brand />
        <nav className="nav-links">
          <Link href="#arma-tu-roll">Arma tu roll</Link>
          <Link href="#ubicacion">Ubicación</Link>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </nav>
      </header>

      <section className="hero">
        <p>
          Rolls a tu elección, promos, poke bowls y snacks.
          Los rolls incluyen palitos, soya y agridulce.
        </p>
      </section>

      <div className="chip-row">
        <a className="chip chip-top" href="#arma-tu-roll">
          Arma tu roll
        </a>
        <a className="chip chip-top" href="#ubicacion">
          Ubicación
        </a>
        {topCategories.map((category) => (
          <a className="chip" key={category.id} href={`#${category.slug}`}>
            {category.name}
          </a>
        ))}
      </div>

      <RollBuilder categories={live.categories} products={live.products} />

      {topCategories.map((category) => {
        const children = childCategories(publicCategories, category.id);
        const items = live.products
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => a.order - b.order);
        const showFullPhoto = ["handroll", "sushi-pizza", "sushi-burger", "rolls-de-la-casa", "especiales-de-la-casa"].includes(category.slug);

        return (
          <section className="section" id={category.slug} key={category.id}>
            <div className="section-head">
              <div>
                <h2 className="section-title">{category.name}</h2>
                {category.description ? <p>{category.description}</p> : null}
                {category.note ? <p className="note">{category.note}</p> : null}
                {!items.length && !children.length ? (
                  <p className="note">Aún no hay productos en esta categoría.</p>
                ) : null}
              </div>
            </div>
            {items.length ? <ProductGrid products={items} showFullPhoto={showFullPhoto} /> : null}
            {children.map((child) => {
              const childItems = live.products
                .filter((product) => product.categoryId === child.id)
                .sort((a, b) => a.order - b.order);
              return (
                <div className="subsection" id={child.slug} key={child.id}>
                  <div className="subsection-head">
                    <h3 className="subsection-title">{child.name}</h3>
                    {child.description ? <p>{child.description}</p> : null}
                    {child.note ? <p className="note">{child.note}</p> : null}
                  </div>
                  <ProductGrid products={childItems} showFullPhoto={false} />
                </div>
              );
            })}
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
            <p className="details">+56 9 5511 9982</p>
            <div className="actions">
              <a className="btn primary" href={MAPS_LINK} target="_blank" rel="noreferrer">
                Abrir en Google Maps
              </a>
              <a className="btn whatsapp" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                Pedir por WhatsApp
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
        <a
          className="instagram-link"
          href="https://www.instagram.com/delvalle_sushi/"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
          </svg>
          Instagram
        </a>
      </footer>

      <a
        className="whatsapp-float"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        WhatsApp
      </a>
    </div>
  );
}

function ProductGrid({
  products,
  showFullPhoto,
}: {
  products: Product[];
  showFullPhoto: boolean;
}) {
  if (!products.length) return null;

  return (
    <div className="grid">
      {products.map((product) => (
        <article className={`card ${product.available ? "" : "unavailable"}`} key={product.id}>
          {product.image ? (
            <img
              className={`card-photo${showFullPhoto ? " card-photo-full" : ""}`}
              src={product.image}
              alt={product.name}
              onError={(event) => {
                const img = event.currentTarget;
                if (!img.src.includes("/photos/") || img.src.includes("raw.githubusercontent.com")) return;
                const file = img.src.split("/photos/")[1];
                if (file) {
                  img.src = `https://raw.githubusercontent.com/seebap28-netizen/sushidelvalle/main/public/photos/${file}`;
                }
              }}
            />
          ) : null}
          <div className="card-body">
            <div className="card-top">
              <h3>{product.name}</h3>
              <span className="price">{product.price ? formatCLP(product.price) : "Incluido"}</span>
            </div>
            {product.featured ? <span className="badge">Destacado</span> : null}
            {product.description ? <p className="details">{product.description}</p> : null}
            {product.extraPrice ? <p className="details">Recargo {formatCLP(product.extraPrice)}</p> : null}
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
  );
}
