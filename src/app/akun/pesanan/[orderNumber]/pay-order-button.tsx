"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, LockKeyhole } from "lucide-react";

type SnapResult = {
  order_id?: string;
  transaction_status?: string;
};

export function PayOrderButton({ orderNumber }: { orderNumber: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const router = useRouter();

  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  async function pay() {
    setLoading(true);
    setMessage(undefined);

    try {
      const response = await fetch("/api/checkout/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !data.token) throw new Error(data.error || "Tidak dapat membuat sesi pembayaran.");

      if (!window.snap) {
        throw new Error("Midtrans Snap belum siap. Muat ulang halaman lalu coba lagi.");
      }

      window.snap.pay(data.token, {
        onSuccess: () => {
          router.push(`/akun/pesanan/${orderNumber}?status=success`);
          router.refresh();
        },
        onPending: () => {
          router.push(`/akun/pesanan/${orderNumber}?status=pending`);
          router.refresh();
        },
        onError: () => {
          setMessage("Pembayaran tidak berhasil. Silakan coba lagi.");
          setLoading(false);
        },
        onClose: () => {
          setMessage("Jendela pembayaran ditutup. Anda dapat melanjutkan pembayaran kapan saja.");
          setLoading(false);
        },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembayaran belum dapat dimulai.");
      setLoading(false);
    }
  }

  return (
    <div className="pay-order">
      {snapUrl && clientKey && (
        <Script src={snapUrl} data-client-key={clientKey} strategy="afterInteractive" />
      )}
      <button className="button button--solid" type="button" onClick={pay} disabled={loading || !snapUrl || !clientKey}>
        <CreditCard size={17} /> {loading ? "Menyiapkan pembayaran..." : "Lanjutkan pembayaran"}
      </button>
      <span className="checkout-note"><LockKeyhole size={14} /> Pembayaran diproses aman oleh Midtrans Snap.</span>
      {message && <p className="form-message form-message--error" role="status">{message}</p>}
    </div>
  );
}
