import { PackageCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { formatRupiah } from "@/lib/products";
import {
  formatDate,
  ORDER_STATUS_OPTIONS,
  orderStatusLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "@/app/admin/actions";

type AdminOrder = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: string;
  total: number;
  created_at: string;
  order_items: { product_name_snapshot: string; quantity: number }[];
};

type CustomerProfile = { id: string; full_name: string | null; phone: string | null };

export default async function AdminOrdersPage() {
  await requireStaff("/admin/order");

  let orders: AdminOrder[] = [];
  let profiles = new Map<string, CustomerProfile>();
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total, created_at, order_items(product_name_snapshot, quantity)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    orders = (data ?? []) as AdminOrder[];

    const userIds = Array.from(new Set(orders.map((order) => order.user_id)));
    if (userIds.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

      profiles = new Map((profileRows ?? []).map((profile) => [profile.id, profile as CustomerProfile]));
    }
  } catch {
    dataError = "Pesanan belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.";
  }

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Operations / Pesanan</p>
          <h1>Order queue.</h1>
        </div>
      </header>

      <p className="admin__notice">
        Status pembayaran diperbarui oleh webhook Midtrans. Status operasional dapat diubah manual setelah pembayaran diverifikasi.
      </p>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      {orders.length ? (
        <div className="data-table-wrap admin__data">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Pelanggan</th>
                <th>Tanggal</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Status operasional</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const profile = profiles.get(order.user_id);
                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                      {order.order_items?.length ? (
                        <>
                          <br />
                          <small>{order.order_items.map((item) => `${item.quantity}× ${item.product_name_snapshot}`).join(", ")}</small>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {profile?.full_name || "Pelanggan"}
                      <br />
                      <small>{profile?.phone || order.user_id.slice(0, 8)}</small>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <span className={`status status--${paymentStatusTone(order.payment_status)}`}>{paymentStatusLabel(order.payment_status)}</span>
                    </td>
                    <td>{formatRupiah(order.total)}</td>
                    <td>
                      <form action={updateOrderStatus} className="table-actions">
                        <input type="hidden" name="orderId" value={order.id} />
                        <select name="status" defaultValue={order.status} aria-label={`Status ${order.order_number}`}>
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{orderStatusLabel(status)}</option>
                          ))}
                        </select>
                        <button className="button button--outline button--small" type="submit">Simpan</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin__table">
          <div className="admin__empty">
            <PackageCheck size={27} />
            <strong>Belum ada pesanan.</strong>
            <span>Order baru akan muncul setelah buyer menyelesaikan checkout.</span>
          </div>
        </div>
      )}
    </>
  );
}
