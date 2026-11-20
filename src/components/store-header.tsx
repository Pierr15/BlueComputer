"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { CART_EVENT, readCart } from "./add-to-cart-button";

const links = [
  ["Katalog", "/katalog"],
  ["Hardware", "/katalog?category=Hardware"],
  ["Accessories", "/katalog?category=Accessories"],
  ["PC Builder", "/pc-builder"],
] as const;

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setCartCount(readCart().reduce((total, line) => total + line.quantity, 0));
    };
    refresh();
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <Link href="/" className="brand" aria-label="BlueComputer home"><span>Blue</span>Computer<span className="brand-dot">.</span></Link>
        <nav className="desktop-nav" aria-label="Navigasi utama">{links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</nav>
        <div className="header-actions">
          <button className="icon-button desktop-only" aria-label="Cari produk"><Search size={19} /></button>
          <ThemeToggle />
          <Link className="icon-button" href="/akun" aria-label="Buka akun"><UserRound size={19} /></Link>
          <Link className="icon-button" href="/keranjang" aria-label="Buka keranjang">
            <ShoppingBag size={19} />
            {cartCount > 0 && <span className="cart-count">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
          <button className="icon-button mobile-only" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Buka menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav shell" aria-label="Navigasi mobile">
          {links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={label} href={href}>{label}</Link>)}
          <Link onClick={() => setOpen(false)} href="/akun">Akun</Link>
          <Link onClick={() => setOpen(false)} href="/masuk">Masuk</Link>
        </nav>
      )}
    </header>
  );
}
