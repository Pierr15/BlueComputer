import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/types";

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
};

type StatusMapping = { orderStatus: OrderStatus; paymentStatus: string };

function mapStatus(transactionStatus: string, fraudStatus?: string): StatusMapping {
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return { orderStatus: "pending_payment", paymentStatus: "challenge" };
    if (fraudStatus === "deny") return { orderStatus: "payment_failed", paymentStatus: "denied" };
    return { orderStatus: "paid", paymentStatus: "paid" };
  }
  if (transactionStatus === "settlement") return { orderStatus: "paid", paymentStatus: "paid" };
  if (transactionStatus === "pending") return { orderStatus: "pending_payment", paymentStatus: "pending" };
  if (transactionStatus === "deny") return { orderStatus: "payment_failed", paymentStatus: "denied" };
  if (transactionStatus === "failure") return { orderStatus: "payment_failed", paymentStatus: "failed" };
  if (transactionStatus === "cancel") return { orderStatus: "cancelled", paymentStatus: "cancelled" };
  if (transactionStatus === "expire") return { orderStatus: "expired", paymentStatus: "expired" };
  if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    return { orderStatus: "cancelled", paymentStatus: "refunded" };
  }
  if (transactionStatus === "chargeback" || transactionStatus === "partial_chargeback") {
    return { orderStatus: "cancelled", paymentStatus: "chargeback" };
  }
  return { orderStatus: "pending_payment", paymentStatus: transactionStatus };
}

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ error: "Payment service belum dikonfigurasi." }, { status: 503 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Order service belum dikonfigurasi." }, { status: 503 });
  }

  const event = (await request.json().catch(() => null)) as MidtransNotification | null;
  if (
    !event?.order_id ||
    !event.status_code ||
    !event.gross_amount ||
    !event.signature_key ||
    !event.transaction_status
  ) {
    return NextResponse.json({ error: "Notifikasi tidak lengkap." }, { status: 400 });
  }

  const expectedSignature = createHash("sha512")
    .update(`${event.order_id}${event.status_code}${event.gross_amount}${serverKey}`)
    .digest();
  const providedSignature = Buffer.from(event.signature_key, "hex");
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return NextResponse.json({ error: "Signature pembayaran tidak valid." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status, payment_status, total")
      .eq("midtrans_order_id", event.order_id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });

    if (Number(event.gross_amount) !== order.total) {
      return NextResponse.json({ error: "Nominal notifikasi tidak cocok dengan pesanan." }, { status: 400 });
    }

    const providerEventId = `${event.transaction_id ?? event.order_id}:${event.transaction_status}:${event.status_code}`;
    const { signature_key: _signature, ...rawStatus } = event;

    const { data: inserted, error: eventError } = await admin
      .from("payment_events")
      .insert({
        order_id: order.id,
        provider: "midtrans",
        provider_event_id: providerEventId,
        transaction_status: event.transaction_status,
        raw_status: rawStatus,
      })
      .select("id")
      .maybeSingle();

    if (eventError) {
      if (eventError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw eventError;
    }
    if (!inserted) return NextResponse.json({ received: true });

    const mapping = mapStatus(event.transaction_status, event.fraud_status);
    const alreadyPaid = ["paid", "processing", "shipped", "completed"].includes(order.status);

    const regressiveNotification = ["pending", "expire", "deny", "cancel", "failure"].includes(
      event.transaction_status,
    );
    if (alreadyPaid && (regressiveNotification || mapping.orderStatus === "pending_payment")) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: mapping.orderStatus,
        payment_status: mapping.paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      // Remove the event so Midtrans can retry the notification cleanly.
      await admin.from("payment_events").delete().eq("id", inserted.id);
      throw updateError;
    }

    if (mapping.orderStatus === "paid" && !alreadyPaid) {
      await decrementStock(admin, order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("payments/midtrans", error);
    return NextResponse.json({ error: "Notifikasi belum dapat diproses." }, { status: 500 });
  }
}

async function decrementStock(admin: ReturnType<typeof createAdminClient>, orderId: string) {
  const { error } = await admin.rpc("decrement_order_stock", { p_order_id: orderId });
  if (!error) return;

  // Fallback for projects that have not applied the helper function yet.
  console.warn("payments/midtrans: decrement_order_stock unavailable, using row updates", error.message);
  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId)
    .not("product_id", "is", null);

  if (itemsError) {
    console.error("payments/midtrans: order items for stock update", itemsError.message);
    return;
  }

  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const { data: product, error: productError } = await admin
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .maybeSingle();

    if (productError || !product) {
      if (productError) console.error("payments/midtrans: read stock", productError.message);
      continue;
    }

    const { error: updateError } = await admin
      .from("products")
      .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
      .eq("id", item.product_id);

    if (updateError) console.error("payments/midtrans: write stock", updateError.message);
  }
}
