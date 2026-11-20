import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { StoreHeader } from "@/components/store-header";
import { ProductCard } from "@/components/product-card";
import { formatRupiah, products } from "@/lib/products";
import { AddToCartButton } from "@/components/add-to-cart-button";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  return <main><StoreHeader /><section className="product-detail shell"><Link className="back-link" href="/katalog"><ArrowLeft size={16} /> Kembali ke katalog</Link><div className="product-detail__grid"><div className="product-detail__image"><Image src={product.image} alt={product.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div><div className="product-detail__info"><p className="eyebrow">{product.brand} / {product.category}</p><h1>{product.name}</h1><p className="product-detail__price">{formatRupiah(product.price)}</p><p className="product-detail__description">{product.description}</p><div className="spec-list">{product.specs.map((spec) => <span key={spec}><Check size={15} /> {spec}</span>)}</div><p className="stock-state"><span /> {product.stock} unit tersedia</p><div className="product-detail__actions"><AddToCartButton product={product} detail /><button className="quantity" aria-label="Jumlah produk">01</button></div><div className="product-detail__note"><strong>Blue standard</strong><span>Informasi stok dan harga diperbarui sebelum checkout.</span></div></div></div></section><section className="related shell"><div className="section-heading"><div><p className="eyebrow">Keep exploring</p><h2>Goes well with.</h2></div></div><div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 3).map((item) => <ProductCard product={item} key={item.id} />)}</div></section></main>;
}
