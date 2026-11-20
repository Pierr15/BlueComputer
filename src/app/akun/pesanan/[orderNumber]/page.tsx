import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/products";
import { formatDate, orderStatusLabel, paymentStatusLabel } from "@/lib/order-status";
import type { OrderWithItems } from "@/lib/types";
import { PayOrderButton } from "./pay-order-button";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orderNumber } = await params;
  const { status } = await searchParams;
  const user = await requireUser(`/akun/pesanan/${orderNumber}`);

  let order: OrderWithItems | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    order = (data as OrderWithItems | null) ?? null;
  } catch {
    order = null;
  }

  if (!order) notFound();

  const items = order.order_items ?? [];
  const isPending = order.status === "pending_payment" || order.status === "draft";
  const shipping = order.shipping_snapshot ?? {};

  return (
    <div className="order-detail">
      <Link className="back-link" href="/akun/pesanan"><ArrowLeft size={16} /> Kembali ke pesanan</Link>

      {status === "success" && (
        <p className="form-message form-message--success" role="status">
          Pembayaran diterima. Status pesanan akan diperbarui setelah notifikasi Midtrans diverifikasi.
        </p>
      )}
      {status === "pending" && (
        <p className="form-message" role="status">
          Pembayaran masih menunggu penyelesaian. Selesaikan sesuai instruksi Midtrans sebelum kedaluwarsa.
        </p>
      )}

      <header className="order-detail__head">
        <div>
          <p className="eyebrow">Order / {formatDate(order.created_at)}</p>
          <h1>{order.order_number}</h1>
          <p className="order-detail__meta">Total {formatRupiah(order.total)} · Pembayaran {paymentStatusLabel(order.payment_status)}</p>
        </div>
        <div className="order-detail__status">
          <span className={`status status--${order.status}`}>{orderStatusLabel(order.status)}</span>
        </div>
      </header>

      {isPending && (
        <section className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Payment</p>
              <h2>Selesaikan pembayaran.</h2>
            </div>
          </div>
          <p className="order-detail__meta">Order ini belum dibayar. Lanjutkan melalui Midtrans Snap; jangan tutup halaman sampai pembayaran selesai.</p>
          <PayOrderButton orderNumber={order.order_number} />
        </section>
      )}

      <div className="order-detail__grid">
        <section className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Items</p>
              <h2>Isi pesanan.</h2>
            </div>
            <ReceiptText size={20} />
          </div>
          <div className="order-lines">
            {items.map((item) => (
              <div className="order-line" key={item.id}>
                <div>
                  <h3>{item.product_name_snapshot}</h3>
                  <p>{formatRupiah(item.unit_price)} × {item.quantity}</p>
                </div>
                <strong>{formatRupiah(item.subtotal)}</strong>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div><span>Subtotal</span><strong>{formatRupiah(order.subtotal)}</strong></div>
            <div><span>Pengiriman</span><strong>{order.shipping_cost ? formatRupiah(order.shipping_cost) : "Gratis"}</strong></div>
            <div className="order-totals__total"><span>Total</span><strong>{formatRupiah(order.total)}</strong></div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Shipping</p>
              <h2>Alamat kirim.</h2>
            </div>
            <MapPin size={20} />
          </div>
          <div className="order-address">
            <strong>{shipping.recipient_name || user.profile.full_name || "Pelanggan"}</strong>
            <span>{shipping.phone || user.profile.phone || "—"}</span>
            <p>{shipping.address_line || "Alamat tidak tersedia"}</p>
            <p>{[shipping.city, shipping.postal_code].filter(Boolean).join(" ") || ""}</p>
          </div>
          <p className="order-detail__meta">Butuh perubahan alamat? Hubungi tim kami sebelum pesanan diproses.</p>
        </aside>
      </div>
    </div>
  );
}
