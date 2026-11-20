export const SHIPPING_FLAT = 25_000;
export const FREE_SHIPPING_MIN = 5_000_000;

export function calculateShipping(subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
}

export type CheckoutLineInput = { id: string; quantity: number };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeCheckoutLines(value: unknown): CheckoutLineInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null;

  const merged = new Map<string, number>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const id = (entry as { id?: unknown }).id;
    const quantity = (entry as { quantity?: unknown }).quantity;
    if (typeof id !== "string" || !UUID_PATTERN.test(id)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
    const total = (merged.get(id) ?? 0) + quantity;
    if (total > 99) return null;
    merged.set(id, total);
  }

  return Array.from(merged, ([id, quantity]) => ({ id, quantity }));
}
