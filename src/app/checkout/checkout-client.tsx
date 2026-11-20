"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CreditCard, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import { CART_EVENT, readCart, type CartLine } from "@/components/add-to-cart-button";
import { calculateShipping, FREE_SHIPPING_MIN, SHIPPING_FLAT } from "@/lib/checkout";
import { formatRupiah } from "@/lib/products";
import type { Address } from "@/lib/types";
import { CheckoutAddressForm } from "./checkout-address-form";

export function CheckoutClient({
  addresses,
  dataError,
}: {
  addresses: Address[];
  dataError: string | null;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [createdOrder, setCreatedOrder] = useState<string>();
  const router = useRouter();

  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  useEffect(() => {
    const refresh = () => {
      setLines(readCart());
      setMounted(true);
    };
    refresh();
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const fallbackAddressId = addresses.find((address) => address.is_default)?.id ?? addresses[0]?.id ?? "";
  const addressId = addresses.some((address) => address.id === selectedAddressId)
    ? (selectedAddressId as string)
    : fallbackAddressId;

  const subtotal = useMemo(() => lines.reduce((total, line) => total + line.price * line.quantity, 0), [lines]);
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  async function startPayment() {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/checkout/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ id: line.id, quantity: line.quantity })),
          addressId,
        }),
      });
      const data = (await response.json()) as { token?: string; orderNumber?: string; error?: string };
      if (!response.ok || !data.token || !data.orderNumber) {
        if (data.orderNumber) {
          // The order exists even when Snap could not be reached. Keep the
          // buyer on the order page instead of letting them create a duplicate.
          setCreatedOrder(data.orderNumber);
          window.localStorage.removeItem("bluecomputer-cart");
          window.dispatchEvent(new Event(CART_EVENT));
        }
        throw new Error(data.error || "Tidak dapat membuat pesanan.");
      }

      setCreatedOrder(data.orderNumber);
      window.localStorage.removeItem("bluecomputer-cart");
      window.dispatchEvent(new Event(CART_EVENT));

      if (!window.snap) throw new Error("Midtrans Snap belum siap. Muat ulang halaman lalu coba lagi.");

      window.snap.pay(data.token, {
        onSuccess: () => {
          router.push(`/akun/pesanan/${data.orderNumber}?status=success`);
          router.refresh();
        },
        onPending: () => {
          router.push(`/akun/pesanan/${data.orderNumber}?status=pending`);
          router.refresh();
        },
        onError: () => {
          setError("Pembayaran tidak berhasil. Pesanan tetap tersimpan; lanjutkan pembayaran dari halaman pesanan.");
          setLoading(false);
        },
        onClose: () => {
          setError("Jendela pembayaran ditutup. Pesanan tetap tersimpan; lanjutkan pembayaran dari halaman pesanan.");
          setLoading(false);
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout belum dapat diproses.");
      setLoading(false);
    }
  }

  if (!mounted) {
    return <section className="checkout-flow shell"><div className="panel"><p className="eyebrow">Checkout</p><h1>Menyiapkan keranjang...</h1></div></section>;
  }

  if (!lines.length) {
    if (createdOrder) {
      return (
        <section className="checkout-flow shell">
          <div className="panel">
            <p className="eyebrow">Order dibuat</p>
            <h1>Pesanan <em>tersimpan.</em></h1>
            <p>Keranjang sudah dikosongkan karena pesanan berhasil dibuat. Lanjutkan pembayaran dari halaman pesanan.</p>
            {error && <p className="form-message form-message--error" role="alert">{error}</p>}
            <Link className="button button--solid" href={`/akun/pesanan/${createdOrder}`}>
              Buka pesanan {createdOrder} <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      );
    }

    return (
      <section className="empty-state shell">
        <p className="eyebrow">Secure checkout</p>
        <h1>Keranjang Anda<br /><em>masih kosong.</em></h1>
        <p>Tambahkan produk ke keranjang sebelum checkout. Pembayaran akan diproses melalui Midtrans Snap.</p>
        <Link className="button button--solid" href="/katalog">Lihat katalog <ArrowRight size={17} /></Link>
      </section>
    );
  }

  return (
    <>
      {snapUrl && clientKey && <Script src={snapUrl} data-client-key={clientKey} strategy="afterInteractive" />}
      <section className="checkout-flow shell">
        <div>
          <Link className="back-link" href="/keranjang"><ArrowLeft size={16} /> Kembali ke keranjang</Link>
          <p className="eyebrow">Secure checkout</p>
          <h1>Satu langkah<br /><em>lagi.</em></h1>

          {dataError && <p className="admin__notice" role="status">{dataError}</p>}
          {!snapUrl || !clientKey ? (
            <p className="admin__notice" role="status">Midtrans belum dikonfigurasi. Isi `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dan `NEXT_PUBLIC_MIDTRANS_SNAP_URL` untuk mengaktifkan pembayaran.</p>
          ) : null}

          <div className="checkout-steps">
            <section className="checkout-card">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">01 / Pengiriman</p>
                  <h2>Alamat tujuan.</h2>
                </div>
                <MapPin size={20} />
              </div>

              {addresses.length ? (
                <>
                  <div className="address-options">
                    {addresses.map((address) => (
                      <label key={address.id} className="address-option">
                        <input
                          type="radio"
                          name="addressId"
                          value={address.id}
                          checked={addressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <span>
                          <strong>{address.recipient_name} · {address.phone}</strong>
                          <span>{address.address_line}, {address.city} {address.postal_code}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <Link href="/akun/alamat" className="panel__link">Kelola alamat</Link>
                </>
              ) : (
                <CheckoutAddressForm />
              )}
            </section>

            <section className="checkout-card">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">02 / Pembayaran</p>
                  <h2>Midtrans Snap.</h2>
                </div>
                <ShieldCheck size={20} />
              </div>
              <p className="checkout-note"><LockKeyhole size={15} /> Nomor kartu dan detail pembayaran dimasukkan di Midtrans. BlueComputer tidak menyimpan data kartu Anda.</p>
              <p className="checkout-note"><CreditCard size={15} /> Pilih metode pembayaran yang tersedia di jendela Snap: kartu, virtual account, e-wallet, atau gerai retail.</p>
            </section>
          </div>
        </div>

        <aside className="checkout-summary">
          <p className="eyebrow">Order summary</p>
          <div className="checkout-lines">
            {lines.map((line) => (
              <div className="checkout-line" key={line.id}>
                <div className="checkout-line__image">
                  <Image src={line.image} alt={line.imageAlt} fill sizes="64px" />
                </div>
                <div>
                  <h3>{line.name}</h3>
                  <p>{line.quantity} × {formatRupiah(line.price)}</p>
                </div>
                <strong>{formatRupiah(line.price * line.quantity)}</strong>
              </div>
            ))}
          </div>
          <div><span>Subtotal · {itemCount} item</span><strong>{formatRupiah(subtotal)}</strong></div>
          <div><span>Pengiriman</span><strong>{shipping ? formatRupiah(shipping) : "Gratis"}</strong></div>
          <small>{shipping ? `Pengiriman flat ${formatRupiah(SHIPPING_FLAT)} untuk pesanan di bawah ${formatRupiah(FREE_SHIPPING_MIN)}.` : `Gratis pengiriman untuk pesanan mulai ${formatRupiah(FREE_SHIPPING_MIN)}.`}</small>
          <div className="checkout-summary__total"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
          <button className="button button--solid" type="button" onClick={startPayment} disabled={loading || !addressId || !snapUrl || !clientKey}>
            <LockKeyhole size={16} /> {loading ? "Menyiapkan..." : "Bayar dengan Midtrans"}
          </button>
          {error && <p className="form-message form-message--error" role="alert">{error}</p>}
          {createdOrder && (
            <Link className="panel__link" href={`/akun/pesanan/${createdOrder}`}>Buka pesanan {createdOrder}</Link>
          )}
          <small>Harga dan stok dihitung ulang oleh server sebelum transaksi dibuat.</small>
        </aside>
      </section>
    </>
  );
}
