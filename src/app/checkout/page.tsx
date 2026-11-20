import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { StoreHeader } from "@/components/store-header";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main>
        <StoreHeader />
        <section className="checkout shell">
          <div>
            <Link href="/keranjang" className="back-link"><ArrowLeft size={16} /> Kembali ke keranjang</Link>
            <p className="eyebrow">Secure checkout</p>
            <h1>Almost there.</h1>
            <p>Masuk terlebih dahulu untuk memilih alamat pengiriman dan menyelesaikan pembayaran melalui Midtrans Snap.</p>
            <Link className="button button--solid" href="/masuk?next=%2Fcheckout">Masuk untuk checkout</Link>
          </div>
          <aside className="checkout__summary">
            <div><span>Order summary</span><strong>Menunggu keranjang</strong></div>
            <div><span>Subtotal</span><strong>Rp0</strong></div>
            <div className="checkout__total"><span>Total</span><strong>Rp0</strong></div>
            <p><LockKeyhole size={15} /> Pembayaran diproses dengan aman oleh Midtrans.</p>
          </aside>
        </section>
      </main>
    );
  }

  let addresses: Address[] = [];
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    addresses = (data ?? []) as Address[];
  } catch {
    dataError = "Alamat belum dapat dimuat. Anda masih dapat menambahkan alamat baru di bawah.";
  }

  return (
    <main>
      <StoreHeader />
      <CheckoutClient addresses={addresses} dataError={dataError} />
    </main>
  );
}
