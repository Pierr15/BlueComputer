import Link from "next/link";
import { ArrowRight, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser, isStaffRole, roleLabel } from "@/lib/auth";
import { formatRupiah } from "@/lib/products";
import { formatDate, orderStatusLabel } from "@/lib/order-status";
import type { Order } from "@/lib/types";

export default async function AccountPage() {
  const user = await requireUser("/akun");

  let orders: Order[] = [];
  let orderCount = 0;
  let activeOrders = 0;
  let addressCount = 0;
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const [ordersResult, activeResult, addressesResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending_payment", "paid", "processing", "shipped"]),
      supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (activeResult.error) throw activeResult.error;
    orders = (ordersResult.data ?? []) as Order[];
    orderCount = ordersResult.count ?? orders.length;
    activeOrders = activeResult.count ?? 0;
    addressCount = addressesResult.count ?? 0;
  } catch {
    dataError = "Data akun belum dapat dimuat. Periksa koneksi Supabase lalu muat ulang halaman.";
  }

  const firstName = user.profile.full_name?.split(" ")[0] || "there";

  return (
    <>
      <section className="account-hero">
        <p className="eyebrow">Account overview / {roleLabel(user.role)}</p>
        <h1>Halo, <em>{firstName}.</em></h1>
        <p>Kelola profil, alamat pengiriman, dan pesanan Anda dari satu tempat. Status pembayaran diperbarui otomatis dari Midtrans.</p>
      </section>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      <div className="account-stats">
        <article>
          <span>Total pesanan</span>
          <strong>{orderCount}</strong>
          <small>{orders.length ? "Termasuk pembayaran tertunda" : "Belum ada pesanan"}</small>
        </article>
        <article>
          <span>Pesanan aktif</span>
          <strong>{activeOrders}</strong>
          <small>Menunggu bayar, diproses, atau dikirim</small>
        </article>
        <article>
          <span>Alamat tersimpan</span>
          <strong>{addressCount}</strong>
          <small>Dipakai untuk checkout berikutnya</small>
        </article>
      </div>

      {isStaffRole(user.role) && (
        <section className="account-callout">
          <ShieldCheck size={22} />
          <div>
            <strong>Anda punya akses {roleLabel(user.role)}.</strong>
            <span>Kelola pesanan, stok, dan pengguna dari workspace operasional.</span>
          </div>
          <Link className="button button--solid button--small" href="/admin">Buka workspace <ArrowRight size={15} /></Link>
        </section>
      )}

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Order history</p>
            <h2>Pesanan terbaru.</h2>
          </div>
          <Link href="/akun/pesanan" className="panel__link">Lihat semua</Link>
        </div>

        {orders.length ? (
          <div className="data-table-wrap">
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
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{formatDate(order.created_at)}</td>
                    <td><span className={`status status--${order.status}`}>{orderStatusLabel(order.status)}</span></td>
                    <td>{formatRupiah(order.total)}</td>
                    <td><Link className="panel__link" href={`/akun/pesanan/${order.order_number}`}>Detail</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-panel">
            <Package size={24} />
            <strong>Belum ada pesanan.</strong>
            <span>Mulai dari satu komponen yang tepat, lalu checkout dengan aman melalui Midtrans.</span>
            <Link className="button button--solid button--small" href="/katalog">Lihat katalog <ArrowRight size={15} /></Link>
          </div>
        )}
      </section>

      <div className="account-quick">
        <Link href="/akun/profil" className="account-quick__item">
          <UserRound size={20} />
          <strong>Profil</strong>
          <span>Perbarui nama dan nomor telepon.</span>
        </Link>
        <Link href="/akun/alamat" className="account-quick__item">
          <MapPin size={20} />
          <strong>Alamat</strong>
          <span>Simpan alamat pengiriman utama.</span>
        </Link>
        <Link href="/akun/pesanan" className="account-quick__item">
          <Package size={20} />
          <strong>Pesanan</strong>
          <span>Pantau pembayaran dan pengiriman.</span>
        </Link>
      </div>
    </>
  );
}
