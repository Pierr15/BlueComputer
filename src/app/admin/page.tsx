import Link from "next/link";
import { ArrowUpRight, Boxes, CircleDollarSign, PackageCheck, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, roleLabel } from "@/lib/auth";
import { formatRupiah } from "@/lib/products";
import { formatDate, orderStatusLabel } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

type RecentOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

export default async function AdminPage() {
  const user = await requireStaff();

  let recentOrders: RecentOrder[] = [];
  let revenue = 0;
  let activeOrders = 0;
  let activeProducts = 0;
  let teamCount: number | null = null;
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const [ordersResult, productsResult, revenueResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("total, status").in("status", ["paid", "processing", "shipped", "completed"]),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (productsResult.error) throw productsResult.error;
    if (revenueResult.error) throw revenueResult.error;
    recentOrders = (ordersResult.data ?? []) as RecentOrder[];
    activeProducts = productsResult.count ?? 0;

    const revenueRows = revenueResult.data ?? [];
    revenue = revenueRows.reduce((total, row) => total + row.total, 0);
    activeOrders = revenueRows.length;

    if (user.role === "owner") {
      const { count } = await supabase
        .from("user_roles")
        .select("role", { count: "exact", head: true })
        .in("role", ["employee", "owner"]);
      teamCount = count ?? 0;
    }
  } catch {
    dataError = "Data operasional belum dapat dimuat. Periksa koneksi Supabase lalu muat ulang halaman.";
  }

  const cards = [
    { title: "Total penjualan", value: formatRupiah(revenue), icon: CircleDollarSign, note: "Order dibayar & selesai" },
    { title: "Pesanan aktif", value: String(activeOrders), icon: PackageCheck, note: "Dibayar, diproses, dikirim" },
    { title: "Produk aktif", value: String(activeProducts), icon: Boxes, note: "Terlihat di katalog" },
    { title: "Tim operasional", value: teamCount === null ? "—" : String(teamCount), icon: UsersRound, note: teamCount === null ? "Terlihat untuk owner" : "Employee & owner" },
  ];

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">{roleLabel(user.role)} workspace</p>
          <h1>Selamat datang, {user.profile.full_name?.split(" ")[0] || "tim"}.</h1>
        </div>
        <Link className="button button--solid" href="/admin/produk">Kelola produk <ArrowUpRight size={16} /></Link>
      </header>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      <div className="admin__metrics">
        {cards.map(({ title, value, icon: Icon, note }) => (
          <article key={title}>
            <Icon size={21} />
            <span>{title}</span>
            <strong>{value}</strong>
            <small className={dataError ? undefined : "is-live"}>{dataError ? "Menunggu data Supabase" : note}</small>
          </article>
        ))}
      </div>

      <section className="admin__table">
        <div className="admin__table-head">
          <div>
            <p className="eyebrow">Order queue</p>
            <h2>Pesanan terbaru.</h2>
          </div>
          <Link className="panel__link" href="/admin/order">Lihat semua</Link>
        </div>

        {recentOrders.length ? (
          <div className="data-table-wrap admin__data">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{formatDate(order.created_at)}</td>
                    <td><span className={`status status--${order.status}`}>{orderStatusLabel(order.status)}</span></td>
                    <td>{formatRupiah(order.total)}</td>
                    <td><Link className="panel__link" href="/admin/order">Kelola</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin__empty">
            <PackageCheck size={27} />
            <strong>Belum ada pesanan untuk diproses.</strong>
            <span>Order yang telah dibayar melalui Midtrans akan muncul di sini.</span>
          </div>
        )}
      </section>
    </>
  );
}
