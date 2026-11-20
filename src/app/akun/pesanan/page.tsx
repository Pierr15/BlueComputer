import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/products";
import { formatDate, orderStatusLabel } from "@/lib/order-status";
import type { Order } from "@/lib/types";

export default async function OrdersPage() {
  const user = await requireUser("/akun/pesanan");

  let orders: Order[] = [];
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    orders = (data ?? []) as Order[];
  } catch {
    dataError = "Riwayat pesanan belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.";
  }

  return (
    <>
      <section className="account-hero">
        <p className="eyebrow">Account / Pesanan</p>
        <h1>Riwayat <em>pesanan.</em></h1>
        <p>Semua order yang dibuat dengan akun ini. Buka detail untuk melanjutkan pembayaran atau melihat status pengiriman.</p>
      </section>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      {orders.length ? (
        <div className="order-list">
          {orders.map((order) => (
            <Link key={order.id} href={`/akun/pesanan/${order.order_number}`} className="order-card">
              <div>
                <p className="eyebrow">{formatDate(order.created_at)}</p>
                <h2>{order.order_number}</h2>
                <span className={`status status--${order.status}`}>{orderStatusLabel(order.status)}</span>
              </div>
              <div className="order-card__end">
                <strong>{formatRupiah(order.total)}</strong>
                <span>Lihat detail <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <Package size={26} />
          <strong>Belum ada pesanan.</strong>
          <span>Pesanan akan muncul di sini setelah Anda menyelesaikan checkout.</span>
          <Link className="button button--solid button--small" href="/katalog">Mulai belanja <ArrowRight size={15} /></Link>
        </div>
      )}
    </>
  );
}
