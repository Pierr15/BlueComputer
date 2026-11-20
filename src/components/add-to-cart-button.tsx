"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";

export type CartLine = Pick<Product, "id" | "name" | "price" | "image" | "imageAlt" | "slug"> & { quantity: number };
export const CART_EVENT = "bluecomputer-cart-change";

export function readCart(): CartLine[] {
  try { return JSON.parse(window.localStorage.getItem("bluecomputer-cart") || "[]") as CartLine[]; } catch { return []; }
}

export function AddToCartButton({ product, detail = false }: { product: Product; detail?: boolean }) {
  const [added, setAdded] = useState(false);
  function add() {
    const current = readCart();
    const existing = current.find((line) => line.id === product.id);
    const next = existing ? current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { id: product.id, name: product.name, price: product.price, image: product.image, imageAlt: product.imageAlt, slug: product.slug, quantity: 1 }];
    window.localStorage.setItem("bluecomputer-cart", JSON.stringify(next));
    window.dispatchEvent(new Event(CART_EVENT));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }
  if (detail) return <button className="button button--solid" onClick={add}><ShoppingBag size={17} /> {added ? "Ditambahkan" : "Tambah ke keranjang"}</button>;
  return <button className="add-button" onClick={add} aria-label={`Tambah ${product.name} ke keranjang`}><Plus size={18} /></button>;
}
