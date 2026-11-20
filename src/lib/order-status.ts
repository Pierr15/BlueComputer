import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draf",
  pending_payment: "Menunggu pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  payment_failed: "Pembayaran gagal",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Dibayar",
  challenge: "Ditinjau Midtrans",
  denied: "Ditolak",
  failed: "Pembayaran gagal",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  refunded: "Dikembalikan",
  chargeback: "Chargeback",
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "expired",
  "payment_failed",
];

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function paymentStatusLabel(status: string) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function paymentStatusTone(status: string) {
  if (status === "paid") return "paid";
  if (status === "pending" || status === "challenge") return "pending_payment";
  if (["denied", "cancelled", "expired", "refunded", "chargeback"].includes(status)) return "cancelled";
  return status;
}

export function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
