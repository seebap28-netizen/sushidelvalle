"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { whatsappHref } from "@/lib/whatsapp";

export function CartBar() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  if (!cart.count) return null;

  return (
    <>
      {open ? (
        <div className="cart-sheet" role="dialog" aria-label="Tu pedido">
          <div className="cart-sheet-head">
            <h3>Tu pedido</h3>
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
          <ul className="cart-lines">
            {cart.lines.map((line) => (
              <li key={line.key}>
                <div>
                  <strong>{line.name}</strong>
                  {line.detail ? <p className="details">{line.detail}</p> : null}
                  <p className="details">{formatCLP(line.price * line.qty)}</p>
                </div>
                <div className="card-qty">
                  <button type="button" onClick={() => cart.setQty(line.key, line.qty - 1)}>
                    −
                  </button>
                  <span>{line.qty}</span>
                  <button type="button" onClick={() => cart.setQty(line.key, line.qty + 1)}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-sheet-foot">
            <strong>{formatCLP(cart.total)}</strong>
            <a
              className="btn whatsapp"
              href={whatsappHref(cart.orderText())}
              target="_blank"
              rel="noreferrer"
            >
              Enviar pedido
            </a>
          </div>
        </div>
      ) : null}

      <div className="cart-bar">
        <button className="cart-bar-info" type="button" onClick={() => setOpen((current) => !current)}>
          <span>
            {cart.count} {cart.count === 1 ? "producto" : "productos"}
          </span>
          <strong>{formatCLP(cart.total)}</strong>
        </button>
        <a
          className="btn whatsapp"
          href={whatsappHref(cart.orderText())}
          target="_blank"
          rel="noreferrer"
        >
          Enviar pedido
        </a>
      </div>
    </>
  );
}
