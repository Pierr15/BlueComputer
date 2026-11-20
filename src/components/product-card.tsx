import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Product, formatRupiah } from "@/lib/products";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article className="product-card">
      <Link href={`/produk/${product.slug}`} className="product-card__image-wrap" aria-label={`Lihat ${product.name}`}>
        {product.label && <span className="product-label">{product.label}</span>}
        <Image src={product.image} alt={product.imageAlt} fill sizes="(max-width: 700px) 86vw, (max-width: 1100px) 42vw, 25vw" priority={priority} className="product-card__image" />
        <span className="view-product"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="product-card__body">
        <div><p className="eyebrow">{product.brand} / {product.category}</p><h3><Link href={`/produk/${product.slug}`}>{product.name}</Link></h3></div>
        <div className="product-card__bottom"><div><strong>{formatRupiah(product.price)}</strong>{product.oldPrice && <del>{formatRupiah(product.oldPrice)}</del>}</div><AddToCartButton product={product} /></div>
      </div>
    </article>
  );
}
