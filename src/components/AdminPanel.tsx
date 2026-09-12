"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "./Brand";
import { nextCategoryOrder } from "@/lib/categories";
import { formatCLP } from "@/lib/format";
import type { Category, CategoryKind, MenuData, Product } from "@/lib/types";

const ADMIN_KEY = "delvalle-admin";

const kinds: { value: CategoryKind; label: string }[] = [
  { value: "menu", label: "Carta" },
  { value: "wrap", label: "Envoltura" },
  { value: "wrap_premium", label: "Envoltura premium" },
  { value: "protein", label: "Proteína" },
  { value: "filling", label: "Relleno" },
  { value: "extra", label: "Extra" },
];

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  note: "",
  kind: "menu" as CategoryKind,
  order: 1,
};

const emptyProduct = {
  name: "",
  categoryId: "",
  description: "",
  price: 0,
  extraPrice: 0,
  details: "",
  available: true,
  featured: false,
  order: 1,
  image: "",
};

type CategoryForm = typeof emptyCategory;
type ProductForm = typeof emptyProduct;

export function AdminPanel({ initialMenu }: { initialMenu: MenuData }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [menu, setMenu] = useState(initialMenu);
  const [tab, setTab] = useState<"productos" | "categorias">("productos");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filteredProducts = useMemo(() => {
    return menu.products.filter((product) => {
      const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, menu.products, query]);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(ADMIN_KEY) === "1");
    setReady(true);
  }, []);

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setEditingCategory(null);
  }

  function closeProductModal() {
    setShowProductModal(false);
    setEditingProduct(null);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeCategoryModal();
      closeProductModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function categoryName(id: string) {
    return menu.categories.find((item) => item.id === id)?.name || "Sin categoría";
  }

  async function refresh() {
    const response = await fetch("/api/menu", { cache: "no-store" });
    if (!response.ok) return;
    setMenu(await response.json());
  }

  function upsertLocalCategory(saved: Category) {
    setMenu((current) => {
      const exists = current.categories.some((item) => item.id === saved.id);
      const categories = exists
        ? current.categories.map((item) => (item.id === saved.id ? saved : item))
        : [...current.categories, saved];
      return {
        ...current,
        categories: [...categories].sort((a, b) => a.order - b.order),
      };
    });
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = editingCategory
        ? { ...editingCategory, ...categoryForm }
        : categoryForm;
      const response = await fetch(
        editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories",
        {
          method: editingCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "No se pudo guardar la categoría.");
        return;
      }
      upsertLocalCategory(data);
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
      setMessage("Categoría guardada.");
      await refresh();
    } catch {
      setMessage("No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...(editingProduct || {}),
        ...productForm,
        details: productForm.details,
      };
      const response = await fetch(
        editingProduct ? `/api/products/${editingProduct.id}` : "/api/products",
        {
          method: editingProduct ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "No se pudo guardar el producto.");
        return;
      }
      setMenu((current) => {
        const exists = current.products.some((item) => item.id === data.id);
        const products = exists
          ? current.products.map((item) => (item.id === data.id ? data : item))
          : [...current.products, data];
        return {
          ...current,
          products: [...products].sort((a, b) => a.order - b.order),
        };
      });
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm(emptyProduct);
      setMessage("Producto guardado.");
      await refresh();
    } catch {
      setMessage("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría y sus productos?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setMessage("Categoría eliminada.");
    await refresh();
  }

  async function removeProduct(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setMessage("Producto eliminado.");
    await refresh();
  }

  async function toggleAvailable(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, available: !product.available }),
    });
    await refresh();
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "No se pudo subir la foto.");
        return;
      }
      setProductForm((current) => ({ ...current, image: payload.url }));
      setMessage("Foto subida.");
    } catch {
      setMessage("No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  if (!ready || !authed) {
    return (
      <div className="admin-shell">
        <div className="login-wrap">
          <form
            className="login-card"
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
              });
              if (response.ok) {
                sessionStorage.setItem(ADMIN_KEY, "1");
                setAuthed(true);
                setMessage("");
              } else {
                setMessage("Clave incorrecta.");
              }
            }}
          >
            <Brand compact />
            <h1 className="admin-title" style={{ fontSize: 42, margin: "18px 0 8px" }}>
              Admin
            </h1>
            <p className="lede">Ingresa la clave para editar la carta.</p>
            <div className="field" style={{ margin: "18px 0" }}>
              <label>Clave</label>
              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {message ? <p className="note">{message}</p> : null}
            <button className="btn primary" type="submit">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Brand compact />
        <div className="nav-links">
          <button
            className="btn"
            type="button"
            onClick={() => window.open("/imprimir?print=1", "_blank")}
          >
            Exportar PDF
          </button>
          <Link href="/">Ver carta</Link>
          <button
            className="btn ghost"
            onClick={() => {
              sessionStorage.removeItem(ADMIN_KEY);
              setAuthed(false);
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <h1 className="admin-title">Administrar carta</h1>
      <p className="lede">Crea, edita o elimina categorías y productos. Los cambios se ven al instante en la carta.</p>

      <div className="stats">
        <article className="stat card">
          <span>Categorías</span>
          <strong>{menu.categories.length}</strong>
        </article>
        <article className="stat card">
          <span>Productos</span>
          <strong>{menu.products.length}</strong>
        </article>
        <article className="stat card">
          <span>Disponibles</span>
          <strong>{menu.products.filter((item) => item.available).length}</strong>
        </article>
        <article className="stat card">
          <span>Destacados</span>
          <strong>{menu.products.filter((item) => item.featured).length}</strong>
        </article>
      </div>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        <button className={`chip ${tab === "productos" ? "active" : ""}`} onClick={() => setTab("productos")}>
          Productos
        </button>
        <button className={`chip ${tab === "categorias" ? "active" : ""}`} onClick={() => setTab("categorias")}>
          Categorías
        </button>
      </div>

      {message ? <p className="note" style={{ marginBottom: 14 }}>{message}</p> : null}

      {tab === "productos" ? (
        <>
          <div className="toolbar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto"
            />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Todas las categorías</option>
              {menu.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              className="btn primary"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  ...emptyProduct,
                  categoryId: categoryFilter !== "all" ? categoryFilter : "",
                  order: menu.products.length + 1,
                });
                setShowProductModal(true);
              }}
            >
              Nuevo producto
            </button>
          </div>

          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        {product.image ? <img className="thumb" src={product.image} alt="" /> : null}
                        <div>
                          <strong>{product.name}</strong>
                          <div className="details">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>{categoryName(product.categoryId)}</td>
                    <td>
                      {formatCLP(product.price)}
                      {product.extraPrice ? ` + ${formatCLP(product.extraPrice)}` : ""}
                    </td>
                    <td>{product.available ? "Disponible" : "Oculto"}</td>
                    <td>
                      <div className="actions">
                        <button className="btn" onClick={() => toggleAvailable(product)}>
                          {product.available ? "Ocultar" : "Mostrar"}
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name,
                              categoryId: product.categoryId,
                              description: product.description,
                              price: product.price,
                              extraPrice: product.extraPrice,
                              details: product.details.join("\n"),
                              available: product.available,
                              featured: product.featured,
                              order: product.order,
                              image: product.image || "",
                            });
                            setShowProductModal(true);
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn danger" onClick={() => removeProduct(product.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="toolbar">
            <button
              className="btn primary"
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  ...emptyCategory,
                  order: nextCategoryOrder(menu.categories, "menu"),
                });
                setShowCategoryModal(true);
              }}
            >
              Nueva categoría
            </button>
          </div>
          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Orden</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {menu.categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>
                        {category.parentId
                          ? `${categoryName(category.parentId)} / ${category.name}`
                          : category.name}
                      </strong>
                      <div className="details">{category.description}</div>
                    </td>
                    <td>{kinds.find((item) => item.value === category.kind)?.label}</td>
                    <td>{category.order}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryForm({
                              name: category.name,
                              slug: category.slug,
                              description: category.description,
                              note: category.note,
                              kind: category.kind,
                              order: category.order,
                            });
                            setShowCategoryModal(true);
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn danger" onClick={() => removeCategory(category.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCategoryModal ? (
        <div className="modal-backdrop" onClick={closeCategoryModal}>
          <form className="modal" onSubmit={saveCategory} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingCategory ? "Editar categoría" : "Nueva categoría"}</h2>
              <button className="btn close-btn" type="button" onClick={closeCategoryModal} aria-label="Cerrar">
                Cerrar
              </button>
            </div>
            <div className="fields">
              <div className="field">
                <label>Nombre</label>
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select
                  value={categoryForm.kind}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, kind: event.target.value as CategoryKind })
                  }
                >
                  {kinds.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Descripción</label>
                <input
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, description: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Nota</label>
                <input
                  value={categoryForm.note}
                  onChange={(event) => setCategoryForm({ ...categoryForm, note: event.target.value })}
                />
              </div>
              <div className="field">
                <label>Orden</label>
                <input
                  type="number"
                  value={categoryForm.order}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, order: Number(event.target.value) })
                  }
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn" type="button" onClick={closeCategoryModal}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showProductModal ? (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <form className="modal" onSubmit={saveProduct} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingProduct ? "Editar producto" : "Nuevo producto"}</h2>
              <button className="btn close-btn" type="button" onClick={closeProductModal} aria-label="Cerrar">
                Cerrar
              </button>
            </div>
            <div className="fields">
              <div className="field">
                <label>Nombre</label>
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Categoría</label>
                <select
                  value={productForm.categoryId}
                  onChange={(event) =>
                    setProductForm({ ...productForm, categoryId: event.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Elige categoría
                  </option>
                  {menu.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Precio</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm({ ...productForm, price: Number(event.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label>Recargo extra</label>
                <input
                  type="number"
                  value={productForm.extraPrice}
                  onChange={(event) =>
                    setProductForm({ ...productForm, extraPrice: Number(event.target.value) })
                  }
                />
              </div>
              <div className="field full">
                <label>Foto</label>
                {productForm.image ? (
                  <img className="photo-preview" src={productForm.image} alt="Vista previa" />
                ) : null}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
                {uploading ? <p className="note">Subiendo foto...</p> : null}
                <input
                  value={productForm.image}
                  onChange={(event) => setProductForm({ ...productForm, image: event.target.value })}
                  placeholder="/photos/promo-platter.png"
                />
              </div>
              <div className="field full">
                <label>Descripción</label>
                <input
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm({ ...productForm, description: event.target.value })
                  }
                />
              </div>
              <div className="field full">
                <label>Detalle (un ítem por línea, para promos)</label>
                <textarea
                  rows={5}
                  value={productForm.details}
                  onChange={(event) => setProductForm({ ...productForm, details: event.target.value })}
                />
              </div>
              <div className="field">
                <label>Orden</label>
                <input
                  type="number"
                  value={productForm.order}
                  onChange={(event) =>
                    setProductForm({ ...productForm, order: Number(event.target.value) })
                  }
                />
              </div>
              <div className="field checks">
                <label>
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={(event) =>
                      setProductForm({ ...productForm, available: event.target.checked })
                    }
                  />{" "}
                  Disponible
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(event) =>
                      setProductForm({ ...productForm, featured: event.target.checked })
                    }
                  />{" "}
                  Destacado
                </label>
              </div>
            </div>
            <div className="actions">
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn" type="button" onClick={closeProductModal}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
