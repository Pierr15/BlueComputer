"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

function revalidateAccount() {
  revalidatePath("/akun");
  revalidatePath("/akun/profil");
  revalidatePath("/akun/alamat");
  revalidatePath("/checkout");
}

export async function updateProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk kembali." };

  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (fullName.length < 2) return { error: "Nama lengkap minimal 2 karakter." };
  if (fullName.length > 120) return { error: "Nama lengkap terlalu panjang." };
  if (phone && !PHONE_PATTERN.test(phone)) return { error: "Nomor telepon tidak valid." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) throw error;
    revalidateAccount();
    return { success: "Profil berhasil disimpan." };
  } catch {
    return { error: "Profil belum dapat disimpan. Periksa koneksi database lalu coba lagi." };
  }
}

type AddressInput = {
  id?: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

function readAddress(formData: FormData): AddressInput | { error: string } {
  const id = String(formData.get("id") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const addressLine = String(formData.get("addressLine") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const postalCode = String(formData.get("postalCode") || "").trim();
  const isDefault = formData.get("isDefault") === "on";

  if (recipientName.length < 2) return { error: "Nama penerima minimal 2 karakter." };
  if (!PHONE_PATTERN.test(phone)) return { error: "Nomor telepon penerima tidak valid." };
  if (addressLine.length < 8) return { error: "Alamat minimal 8 karakter." };
  if (city.length < 2) return { error: "Kota/kabupaten wajib diisi." };
  if (!/^[0-9]{5}$/.test(postalCode)) return { error: "Kode pos harus 5 angka." };

  return { id: id || undefined, recipientName, phone, addressLine, city, postalCode, isDefault };
}

export async function saveAddress(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk kembali." };

  const parsed = readAddress(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const supabase = await createClient();

    if (parsed.isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    if (parsed.id) {
      const { error } = await supabase
        .from("addresses")
        .update({
          recipient_name: parsed.recipientName,
          phone: parsed.phone,
          address_line: parsed.addressLine,
          city: parsed.city,
          postal_code: parsed.postalCode,
          is_default: parsed.isDefault,
        })
        .eq("id", parsed.id)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      const { count } = await supabase
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        recipient_name: parsed.recipientName,
        phone: parsed.phone,
        address_line: parsed.addressLine,
        city: parsed.city,
        postal_code: parsed.postalCode,
        is_default: parsed.isDefault || (count ?? 0) === 0,
      });

      if (error) throw error;
    }

    revalidateAccount();
    return { success: "Alamat berhasil disimpan." };
  } catch {
    return { error: "Alamat belum dapat disimpan. Periksa koneksi database lalu coba lagi." };
  }
}

export async function deleteAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  try {
    const supabase = await createClient();
    const { data: deleted } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("is_default")
      .maybeSingle();

    if (deleted?.is_default) {
      const { data: remaining } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (remaining?.id) {
        await supabase.from("addresses").update({ is_default: true }).eq("id", remaining.id).eq("user_id", user.id);
      }
    }

    revalidateAccount();
  } catch {
    // The list re-renders from the database; a failed delete is visible as an unchanged row.
  }
}

export async function setDefaultAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  try {
    const supabase = await createClient();
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
    revalidateAccount();
  } catch {
    // Keep the current default when the write cannot be completed.
  }
}
