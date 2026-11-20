import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { calculateShipping, normalizeCheckoutLines } from "@/lib/checkout";
import { resolveCheckoutProducts } from "@/lib/checkout-server";
import type { Address, OrderItem } from "@/lib/types";

type CheckoutBody = {
  items?: unknown;
  addressId?: unknown;
  orderNumber?: unknown;
};

function generateOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BC-${stamp}-${random}`;
}

function snapClient(serverKey: string) {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey,
  });
}

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json({ error: "Midtrans Sandbox belum dikonfigurasi." }, { status: 503 });
  }
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Layanan pesanan belum dikonfigurasi." }, { status: 503 });
  }

  let user;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "Masuk terlebih dahulu untuk checkout." }, { status: 401 });
    }
    user = data.user;
  } catch {
    return NextResponse.json({ error: "Sesi tidak dapat diperiksa. Coba lagi." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body) return NextResponse.json({ error: "Data checkout tidak valid." }, { status: 400 });

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");

  try {
    const admin = createAdminClient();

    if (typeof body.orderNumber === "string" && body.orderNumber.trim()) {
      return await resumePayment({
        admin,
        serverKey,
        origin,
        userId: user.id,
        email: user.email ?? "",
        orderNumber: body.orderNumber.trim(),
      });
    }

    const lines = normalizeCheckoutLines(body.items);
    if (!lines) return NextResponse.json({ error: "Keranjang tidak valid atau kosong." }, { status: 400 });
    if (typeof body.addressId !== "string" || !body.addressId) {
      return NextResponse.json({ error: "Pilih alamat pengiriman terlebih dahulu." }, { status: 400 });
    }

    const { data: address, error: addressError } = await admin
      .from("addresses")
      .select("*")
      .eq("id", body.addressId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (addressError) throw addressError;
    if (!address) return NextResponse.json({ error: "Alamat pengiriman tidak ditemukan." }, { status: 400 });

    const resolved = await resolveCheckoutProducts(admin, lines.map((line) => line.id));
    if (resolved.length !== lines.length) {
      return NextResponse.json({ error: "Salah satu produk tidak tersedia lagi. Perbarui keranjang Anda." }, { status: 409 });
    }

    const requested = new Map(lines.map((line) => [line.id, line.quantity]));
    for (const product of resolved) {
      const quantity = requested.get(product.id) ?? 0;
      if (quantity < 1 || quantity > product.stock) {
        return NextResponse.json(
          { error: `Stok ${product.name} hanya tersisa ${product.stock} unit.` },
          { status: 409 },
        );
      }
    }

    const priced = resolved.map((product) => ({ ...product, quantity: requested.get(product.id) ?? 0 }));
    const subtotal = priced.reduce((total, product) => total + product.price * product.quantity, 0);
    const shippingCost = calculateShipping(subtotal);
    const total = subtotal + shippingCost;
    if (!Number.isInteger(total) || total < 1) {
      return NextResponse.json({ error: "Total transaksi tidak valid." }, { status: 400 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const shippingSnapshot = {
      recipient_name: (address as Address).recipient_name,
      phone: (address as Address).phone,
      address_line: (address as Address).address_line,
      city: (address as Address).city,
      postal_code: (address as Address).postal_code,
    };

    let order: { id: string; order_number: string } | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const orderNumber = generateOrderNumber();
      const { data, error } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: "pending_payment",
          payment_status: "pending",
          subtotal,
          shipping_cost: shippingCost,
          total,
          shipping_snapshot: shippingSnapshot,
          midtrans_order_id: orderNumber,
        })
        .select("id, order_number")
        .single();

      if (!error && data) {
        order = data as { id: string; order_number: string };
        break;
      }
      lastError = error;
      if (error?.code !== "23505") break;
    }

    if (!order) throw lastError ?? new Error("Tidak dapat membuat pesanan.");

    const { error: itemError } = await admin.from("order_items").insert(
      priced.map((product) => ({
        order_id: order.id,
        product_id: product.source === "database" ? product.id : null,
        product_name_snapshot: product.name,
        unit_price: product.price,
        quantity: product.quantity,
        subtotal: product.price * product.quantity,
      })),
    );

    if (itemError) {
      await admin.from("orders").delete().eq("id", order.id);
      throw itemError;
    }

    const itemDetails = priced.map((product) => ({
      id: product.id,
      name: product.name.slice(0, 50),
      price: product.price,
      quantity: product.quantity,
    }));
    if (shippingCost > 0) {
      itemDetails.push({ id: "shipping", name: "Pengiriman", price: shippingCost, quantity: 1 });
    }

    const fullName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Pelanggan";
    const [firstName, ...rest] = fullName.split(/\s+/);

    try {
      const transaction = await snapClient(serverKey).createTransaction({
        transaction_details: { order_id: order.order_number, gross_amount: total },
        item_details: itemDetails,
        customer_details: {
          first_name: firstName,
          ...(rest.length ? { last_name: rest.join(" ") } : {}),
          email: user.email,
          phone: profile?.phone || (address as Address).phone,
          shipping_address: {
            first_name: (address as Address).recipient_name,
            phone: (address as Address).phone,
            address: (address as Address).address_line,
            city: (address as Address).city,
            postal_code: (address as Address).postal_code,
            country_code: "IDN",
          },
        },
        callbacks: { finish: `${origin}/akun/pesanan/${order.order_number}` },
        expiry: { unit: "hours", duration: 24 },
      });

      await admin
        .from("orders")
        .update({ midtrans_snap_token: transaction.token, updated_at: new Date().toISOString() })
        .eq("id", order.id);

      return NextResponse.json({
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderNumber: order.order_number,
      });
    } catch {
      return NextResponse.json(
        {
          error: "Pesanan dibuat, tetapi sesi pembayaran belum dapat dimulai. Buka halaman pesanan untuk mencoba lagi.",
          orderNumber: order.order_number,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("checkout/snap", error);
    return NextResponse.json({ error: "Checkout belum dapat diproses. Coba lagi beberapa saat lagi." }, { status: 500 });
  }
}

async function resumePayment({
  admin,
  serverKey,
  origin,
  userId,
  email,
  orderNumber,
}: {
  admin: ReturnType<typeof createAdminClient>;
  serverKey: string;
  origin: string;
  userId: string;
  email: string;
  orderNumber: string;
}) {
  const { data: order, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("midtrans_order_id", orderNumber)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  if (!["pending_payment", "draft"].includes(order.status)) {
    return NextResponse.json({ error: "Pesanan ini tidak menunggu pembayaran." }, { status: 409 });
  }

  if (order.midtrans_snap_token) {
    const tokenAgeHours = (Date.now() - new Date(order.updated_at || order.created_at).getTime()) / 3_600_000;
    if (tokenAgeHours < 23) {
      return NextResponse.json({ token: order.midtrans_snap_token, orderNumber: order.order_number });
    }
    return NextResponse.json(
      { error: "Sesi pembayaran sudah kedaluwarsa. Buat pesanan baru dari keranjang." },
      { status: 409 },
    );
  }

  const items = (order.order_items ?? []) as OrderItem[];
  if (!items.length) {
    return NextResponse.json({ error: "Pesanan tidak memiliki item." }, { status: 409 });
  }

  const itemDetails = items.map((item) => ({
    id: item.product_id ?? item.id,
    name: item.product_name_snapshot.slice(0, 50),
    price: item.unit_price,
    quantity: item.quantity,
  }));
  if (order.shipping_cost > 0) {
    itemDetails.push({ id: "shipping", name: "Pengiriman", price: order.shipping_cost, quantity: 1 });
  }

  const transaction = await snapClient(serverKey).createTransaction({
    transaction_details: { order_id: order.order_number, gross_amount: order.total },
    item_details: itemDetails,
    customer_details: { email },
    callbacks: { finish: `${origin}/akun/pesanan/${order.order_number}` },
    expiry: { unit: "hours", duration: 24 },
  });

  await admin
    .from("orders")
    .update({ midtrans_snap_token: transaction.token, updated_at: new Date().toISOString() })
    .eq("id", order.id);

  return NextResponse.json({
    token: transaction.token,
    redirectUrl: transaction.redirect_url,
    orderNumber: order.order_number,
  });
}
