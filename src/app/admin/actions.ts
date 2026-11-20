"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isStaffRole } from "@/lib/auth";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import type { ActionState, AppRole, OrderStatus } from "@/lib/types";

const ROLES: AppRole[] = ["buyer", "employee", "owner"];
const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

export async function updateOrderStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return;

  const orderId = String(formData.get("orderId") || "").trim();
  const status = String(formData.get("status") || "") as OrderStatus;
  if (!orderId || !ORDER_STATUS_OPTIONS.includes(status)) return;

  try {
    const supabase = await createClient();
    await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    revalidatePath("/admin");
    revalidatePath("/admin/order");
  } catch {
    // The row keeps its previous status when the update fails.
  }
}

export async function updateProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return;

  const productId = String(formData.get("productId") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const status = String(formData.get("status") || "");

  if (!productId) return;
  if (!Number.isInteger(price) || price < 0) return;
  if (!Number.isInteger(stock) || stock < 0) return;
  if (!PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) return;

  try {
    const supabase = await createClient();
    await supabase
      .from("products")
      .update({
        price,
        stock_quantity: stock,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
    revalidatePath("/admin/produk");
    revalidatePath("/admin");
  } catch {
    // Leave the product untouched when the write cannot be completed.
  }
}

export async function updateUserRole(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk kembali." };
  if (user.role !== "owner") return { error: "Hanya owner yang dapat mengubah role." };

  const targetId = String(formData.get("userId") || "").trim();
  const role = String(formData.get("role") || "") as AppRole;

  if (!targetId) return { error: "Pengguna tidak valid." };
  if (!ROLES.includes(role)) return { error: "Role tidak dikenal." };
  if (targetId === user.id && role !== "owner") {
    return { error: "Anda tidak dapat menurunkan role owner milik sendiri." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: targetId, role }, { onConflict: "user_id" });

    if (error) throw error;
    revalidatePath("/admin/pengguna");
    return { success: `Role diubah menjadi ${role}.` };
  } catch {
    return { error: "Role belum dapat diubah. Periksa koneksi database lalu coba lagi." };
  }
}
