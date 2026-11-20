"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Cpu, Layers3, MousePointer2, Sparkles } from "lucide-react";
import { StoreHeader } from "@/components/store-header";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };

export default function Home() {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] as const };
  return (
    <main>
      <StoreHeader />
      <section className="hero shell">
        <div className="hero__copy">
          <motion.p initial="hidden" animate="visible" variants={reveal} transition={{ ...transition, delay: 0.08 }} className="eyebrow hero__eyebrow"><span className="pulse" /> Curated computer goods / 2026</motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={reveal} transition={{ ...transition, delay: 0.16 }}>Built for the<br /><em>way you work.</em></motion.h1>
          <motion.p initial="hidden" animate="visible" variants={reveal} transition={{ ...transition, delay: 0.26 }} className="hero__lede">Perangkat yang tepat membuat setiap ide terasa lebih dekat. Temukan hardware dan desk essentials yang kami pilih dengan alasan yang jelas.</motion.p>
          <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ ...transition, delay: 0.34 }} className="hero__actions"><Link className="button button--solid" href="/katalog">Eksplor koleksi <ArrowUpRight size={17} /></Link><Link className="text-link" href="#featured">Pilihan minggu ini <ArrowDownRight size={17} /></Link></motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.94, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ ...transition, delay: 0.18 }} className="hero__visual">
          <div className="hero__image-frame"><Image src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1600&q=90" alt="Desktop computer workstation with blue lighting" fill priority sizes="(max-width: 900px) 100vw, 50vw" className="hero__image" /></div>
          <div className="hero__orbit hero__orbit--one" aria-hidden="true" /><div className="hero__orbit hero__orbit--two" aria-hidden="true" />
          <div className="hero__spec-card"><span className="eyebrow">Current focus</span><strong>Creator<br />performance</strong><span>01 — 04</span></div>
        </motion.div>
        <div className="hero__foot"><span>Scroll to discover</span><div /><span>Jakarta, Indonesia</span></div>
      </section>

      <section className="category-strip"><div className="shell category-strip__inner"><span className="eyebrow">Choose your lane</span>{[[Cpu, "Hardware", "Core components"], [Layers3, "Peripherals", "See it sharper"], [MousePointer2, "Accessories", "Feel every input"]].map(([Icon, name, line]) => { const I = Icon as typeof Cpu; return <Link className="category-link" href={`/katalog?category=${name}`} key={name as string}><I size={22} /><span><strong>{name as string}</strong><small>{line as string}</small></span><ChevronRight size={18} /></Link>; })}</div></section>

      <section className="featured shell" id="featured"><div className="section-heading"><div><p className="eyebrow">Selected for right now</p><h2>Good systems start<br />with good choices.</h2></div><Link className="text-link" href="/katalog">Lihat semua produk <ArrowUpRight size={17} /></Link></div><div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}</div></section>

      <section className="manifesto shell"><div className="manifesto__canvas" aria-hidden="true"><div className="grid-disc" /><span>BC</span></div><div className="manifesto__copy"><p className="eyebrow">The Blue standard</p><h2>Less noise.<br /><em>More signal.</em></h2><p>Kami tidak mengisi katalog dengan ratusan pilihan yang membingungkan. Setiap barang punya tempat, alasan, dan peran di setup Anda.</p><ul><li><Check size={17} /> Kurasi yang dapat dijelaskan</li><li><Check size={17} /> Dukungan manusia saat dibutuhkan</li><li><Check size={17} /> Garansi dan status stok yang transparan</li></ul><Link href="/katalog" className="button button--outline">Cara kami memilih <ArrowUpRight size={17} /></Link></div></section>

      <section className="journal"><div className="shell journal__inner"><div><p className="eyebrow">Blue notes / Journal</p><h2>Make space<br />for better work.</h2></div><Link href="/katalog" className="journal-card"><span className="journal-card__index">01</span><span><small>Guides / 5 min read</small><strong>Memilih monitor pertama untuk workflow hybrid.</strong></span><ArrowUpRight size={24} /></Link></div></section>

      <footer className="footer shell"><Link href="/" className="brand"><span>Blue</span>Computer<span className="brand-dot">.</span></Link><p>Hardware dan essentials yang dibuat untuk hidup di meja Anda.</p><div><Link href="/katalog">Katalog</Link><Link href="/masuk">Akun</Link><Link href="/admin">Admin</Link></div><small>© 2026 BlueComputer. Built with intention.</small></footer>
    </main>
  );
}
