import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { AddressManager } from "./address-manager";
import type { Address } from "@/lib/types";

export default async function AddressPage() {
  const user = await requireUser("/akun/alamat");

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
    dataError = "Alamat belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.";
  }

  return (
    <>
      <section className="account-hero">
        <p className="eyebrow">Account / Alamat</p>
        <h1>Alamat <em>pengiriman.</em></h1>
        <p>Simpan satu atau beberapa alamat. Alamat utama akan dipilih otomatis saat checkout.</p>
      </section>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}
      <AddressManager addresses={addresses} />
    </>
  );
}
