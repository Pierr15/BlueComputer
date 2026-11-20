"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/products";
import { type CartLine, readCart } from "./add-to-cart-button";

const CART_EVENT = "bluecomputer-cart-change";

export function CartView() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { const refresh = () => setLines(readCart()); refresh(); window.addEventListener(CART_EVENT, refresh); return () => window.removeEventListener(CART_EVENT, refresh); }, []);
  function save(next: CartLine[]) { setLines(next); window.localStorage.setItem("bluecomputer-cart", JSON.stringify(next)); window.dispatchEvent(new Event(CART_EVENT)); }
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  if (!lines.length) return <section className="empty-state shell"><p className="eyebrow">Your cart</p><h1>Keranjang Anda<br /><em>masih kosong.</em></h1><p>Mulai dari satu komponen yang tepat. Setup yang baik selalu dimulai dari sana.</p><Link className="button button--solid" href="/katalog">Lihat katalog <ArrowRight size={17} /></Link></section>;
  return <section className="cart-page shell"><div><p className="eyebrow">Your cart / {lines.length} item</p><h1>Ready when<br /><em>you are.</em></h1><div className="cart-lines">{lines.map((line) => <article key={line.id} className="cart-line"><div className="cart-line__image"><Image src={line.image} alt={line.imageAlt} fill sizes="120px" /></div><div><p className="eyebrow">BlueComputer choice</p><h2>{line.name}</h2><strong>{formatRupiah(line.price)}</strong></div><div className="cart-line__controls"><div><button aria-label="Kurangi jumlah" onClick={() => save(line.quantity === 1 ? lines : lines.map((item) => item.id === line.id ? { ...item, quantity: item.quantity - 1 } : item))}><Minus size={14} /></button><span>{line.quantity}</span><button aria-label="Tambah jumlah" onClick={() => save(lines.map((item) => item.id === line.id ? { ...item, quantity: item.quantity + 1 } : item))}><Plus size={14} /></button></div><button className="remove" onClick={() => save(lines.filter((item) => item.id !== line.id))} aria-label={`Hapus ${line.name}`}><Trash2 size={16} /></button></div></article>)}</div></div><aside className="cart-summary"><p className="eyebrow">Summary</p><div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div><span>Estimasi pengiriman</span><span>Dihitung berikutnya</span></div><div className="cart-summary__total"><span>Total sementara</span><strong>{formatRupiah(subtotal)}</strong></div><Link className="button button--solid" href="/checkout">Lanjut checkout <ArrowRight size={17} /></Link><small>Harga dan ketersediaan dikonfirmasi kembali sebelum pembayaran.</small></aside></section>;
}
