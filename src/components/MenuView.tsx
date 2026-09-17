"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BowlBuilder } from "./BowlBuilder";
import { Brand } from "./Brand";
import { HandrollBuilder } from "./HandrollBuilder";
import { RollBuilder } from "./RollBuilder";
import { WrapBuilder } from "./WrapBuilder";
import { childCategories, sortPublicCategories, topLevelCategories } from "@/lib/categories";
import { formatCLP } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import type { Category, Product } from "@/lib/types";

const PUBLIC_KINDS = new Set(["menu", "extra"]);

const ADDRESS = "Manuel Antonio Matta 519, Coelemu, Ñuble";
const MAPS_QUERY = encodeURIComponent(`${ADDRESS}, Chile`);
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&z=17&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const WHATSAPP_LINK = whatsappHref("Hola, quiero hacer un pedido en Del Valle Sushi");
const INSTAGRAM_LINK = "https://www.instagram.com/delvalle_sushi/";

type Props = {
  categories: Category[];
  products: Product[];
};

type PhotoMode = "default" | "full" | "fill" | "contain";

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
  const [activeSlug, setActiveSlug] = useState("");
  const chipLock = useRef(false);
  const chipLockTimer = useRef(0);

  useEffect(() => {
    const slugs = topCategories.map((category) => category.slug);
    if (!slugs.length) return;

    let frame = 0;
    const update = () => {
      const header = document.querySelector(".carta-sticky");
      const offset = (header instanceof HTMLElement ? header.getBoundingClientRect().height : 130) + 8;
      let current = "";
      for (const slug of slugs) {
        const section = document.getElementById(slug);
        if (section && section.getBoundingClientRect().top - offset <= 0) current = slug;
      }
      setActiveSlug((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [topCategories]);

  useEffect(() => {
    if (!activeSlug || chipLock.current) return;
    const chip = document.querySelector(`.chip-row a[href="#${activeSlug}"]`);
    const row = chip?.parentElement;
    if (chip instanceof HTMLElement && row instanceof HTMLElement) {
      row.scrollTo({
        left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [activeSlug]);

  function holdChipScroll() {
    chipLock.current = true;
    window.clearTimeout(chipLockTimer.current);
    chipLockTimer.current = window.setTimeout(() => {
      chipLock.current = false;
    }, 1200);
  }

  return (
    <div className="page">
      <div className="carta-sticky">
        <header className="topbar">
          <Brand />
          <nav className="nav-links">
            <Link href="#ubicacion">Ubicación</Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </nav>
        </header>

        <div
          className="chip-row"
          onPointerDown={holdChipScroll}
          onTouchStart={holdChipScroll}
        >
          {topCategories.map((category) => (
            <a
              className={`chip${activeSlug === category.slug ? " active" : ""}`}
              key={category.id}
              href={`#${category.slug}`}
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>

      <RollBuilder categories={live.categories} products={live.products} />

      {topCategories.map((category) => {
        const children = childCategories(publicCategories, category.id);
        const items = live.products
          .filter((product) => product.categoryId === category.id)
          .sort((a, b) => a.order - b.order);
        const fullPhotoSlugs = ["handroll", "sushi-burger", "rolls-de-la-casa", "gohan", "relleno-extra-burger"];
        const fillPhotoSlugs = ["sushi-pizza"];
        const containPhotoSlugs = ["bebidas", "jugos"];
        const photoMode: PhotoMode = fillPhotoSlugs.includes(category.slug)
          ? "fill"
          : containPhotoSlugs.includes(category.slug)
            ? "contain"
            : fullPhotoSlugs.includes(category.slug)
              ? "full"
              : "default";

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
            {items.length ? (
              category.slug === "wraps" ? (
                <WrapOrder products={items} photoMode={photoMode} />
              ) : category.slug === "handroll" ? (
                <HandrollOrder products={items} photoMode={photoMode} />
              ) : (
                <ProductGrid products={items} photoMode={photoMode} />
              )
            ) : null}
            {children.map((child) => {
              const childItems = live.products
                .filter((product) => product.categoryId === child.id)
                .sort((a, b) => a.order - b.order);
              const childPhotoMode: PhotoMode = fillPhotoSlugs.includes(child.slug)
                ? "fill"
                : containPhotoSlugs.includes(child.slug)
                  ? "contain"
                  : fullPhotoSlugs.includes(child.slug)
                    ? "full"
                    : "default";
              return (
                <div className="subsection" id={child.slug} key={child.id}>
                  <div className="subsection-head">
                    <h3 className="subsection-title">{child.name}</h3>
                    {child.description ? <p>{child.description}</p> : null}
                    {child.note ? <p className="note">{child.note}</p> : null}
                  </div>
                  {child.slug === "bowl" ? (
                    <BowlOrder products={childItems} photoMode={childPhotoMode} />
                  ) : (
                    <ProductGrid products={childItems} photoMode={childPhotoMode} />
                  )}
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
              <a className="btn instagram" href={INSTAGRAM_LINK} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
                </svg>
                Instagram
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

function HandrollOrder({
  products,
  photoMode,
}: {
  products: Product[];
  photoMode: PhotoMode;
}) {
  const [handrollId, setHandrollId] = useState("");
  const handroll = products.find((item) => item.id === handrollId);

  return (
    <>
      <ProductGrid
        products={products}
        photoMode={photoMode}
        selectedId={handrollId}
        onSelect={(id) => setHandrollId((current) => (current === id ? "" : id))}
      />
      <HandrollBuilder handroll={handroll} />
    </>
  );
}

function WrapOrder({
  products,
  photoMode,
}: {
  products: Product[];
  photoMode: PhotoMode;
}) {
  const [proteinId, setProteinId] = useState("");
  const protein = products.find((item) => item.id === proteinId);

  return (
    <>
      <ProductGrid
        products={products}
        photoMode={photoMode}
        selectedId={proteinId}
        onSelect={(id) => setProteinId((current) => (current === id ? "" : id))}
      />
      <WrapBuilder protein={protein} />
    </>
  );
}

function BowlOrder({
  products,
  photoMode,
}: {
  products: Product[];
  photoMode: PhotoMode;
}) {
  const [proteinId, setProteinId] = useState("");
  const protein = products.find((item) => item.id === proteinId);

  return (
    <>
      <ProductGrid
        products={products}
        photoMode={photoMode}
        selectedId={proteinId}
        onSelect={(id) => setProteinId((current) => (current === id ? "" : id))}
      />
      <BowlBuilder protein={protein} />
    </>
  );
}

function ProductGrid({
  products,
  photoMode,
  selectedId,
  onSelect,
}: {
  products: Product[];
  photoMode: PhotoMode;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  if (!products.length) return null;
  const photoClass =
    photoMode === "full"
      ? " card-photo-full"
      : photoMode === "fill"
        ? " card-photo-fill"
        : photoMode === "contain"
          ? " card-photo-contain"
          : "";

  return (
    <div className={photoMode === "fill" ? "grid grid-pizza" : "grid"}>
      {products.map((product) => {
        const productPhotoClass =
          product.id === "pizza-promo-4" ? " card-photo-contain" : photoClass;
        return (
        <article
          className={`card ${product.available ? "" : "unavailable"}${onSelect ? " selectable" : ""}${selectedId === product.id ? " picked" : ""}`}
          key={product.id}
          onClick={product.available && onSelect ? () => onSelect(product.id) : undefined}
        >
          {product.image ? (
            <img
              className={`card-photo${productPhotoClass}`}
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
        );
      })}
    </div>
  );
}
