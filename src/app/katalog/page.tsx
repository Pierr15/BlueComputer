import { StoreHeader } from "@/components/store-header";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";
import { Search, SlidersHorizontal } from "lucide-react";

export default function CatalogPage() {
  return <main><StoreHeader /><section className="catalog shell"><div className="catalog__heading"><p className="eyebrow">BlueComputer / Catalog</p><h1>Find the right<br /><em>piece.</em></h1><p>Hardware dan accessories terkurasi untuk setup yang tumbuh bersama pekerjaan Anda.</p></div><div className="catalog__tools"><label className="search-field"><Search size={18} /><input placeholder="Cari hardware atau brand" aria-label="Cari produk" /></label><button className="filter-button"><SlidersHorizontal size={18} /> Filter</button></div><div className="catalog__body"><aside className="catalog__filters"><span className="eyebrow">Explore by</span><button className="filter-active">Semua produk <b>04</b></button><button>Hardware <b>02</b></button><button>Peripherals <b>01</b></button><button>Accessories <b>01</b></button><hr /><span className="eyebrow">Availability</span><label><input type="checkbox" /> Tersedia sekarang</label><label><input type="checkbox" /> Pre-order</label></aside><div><div className="catalog__result"><span>Menampilkan 4 pilihan</span><span>Urutkan: <button>Featured</button></span></div><div className="product-grid catalog-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}</div></div></div></section></main>;
}
