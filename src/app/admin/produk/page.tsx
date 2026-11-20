import { Boxes } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { updateProduct } from "@/app/admin/actions";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  stock_quantity: number;
  status: "draft" | "active" | "archived";
  updated_at: string;
};

const STATUS_OPTIONS = ["draft", "active", "archived"] as const;

export default async function AdminProductsPage() {
  await requireStaff("/admin/produk");

  let products: AdminProduct[] = [];
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, brand, price, stock_quantity, status, updated_at")
      .order("name", { ascending: true });

    if (error) throw error;
    products = (data ?? []) as AdminProduct[];
  } catch {
    dataError = "Produk belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.";
  }

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Operations / Produk</p>
          <h1>Produk & stok.</h1>
        </div>
      </header>

      <p className="admin__notice">
        Katalog storefront saat ini masih memakai data fixture, tetapi checkout membaca tabel <strong>products</strong>{" "}
        Supabase lebih dulu. Perubahan harga, stok, dan status di sini langsung memengaruhi checkout untuk produk yang
        sudah tersedia di database.
      </p>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      {products.length ? (
        <div className="data-table-wrap admin__data">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga (Rp)</th>
                <th>Stok</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <small>{product.brand} / {product.slug}</small>
                  </td>
                  <td colSpan={4}>
                    <form action={updateProduct} className="table-actions product-form">
                      <input type="hidden" name="productId" value={product.id} />
                      <label>
                        <span className="sr-only">Harga {product.name}</span>
                        <input name="price" type="number" min={0} step={1000} defaultValue={product.price} required />
                      </label>
                      <label>
                        <span className="sr-only">Stok {product.name}</span>
                        <input name="stock" type="number" min={0} step={1} defaultValue={product.stock_quantity} required />
                      </label>
                      <select name="status" defaultValue={product.status} aria-label={`Status ${product.name}`}>
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button className="button button--outline button--small" type="submit">Simpan</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin__table">
          <div className="admin__empty">
            <Boxes size={27} />
            <strong>Belum ada produk di database.</strong>
            <span>Terapkan migration dan seed katalog, lalu produk akan muncul di sini.</span>
          </div>
        </div>
      )}
    </>
  );
}
