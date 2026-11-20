"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/akun/actions";
import type { ActionState, Address } from "@/lib/types";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await saveAddress(previous, formData);
      if (result.success) {
        setEditing(null);
        setFormVersion((version) => version + 1);
        router.refresh();
      }
      return result;
    },
    {},
  );

  return (
    <div className="address-layout">
      <div className="address-grid">
        {addresses.length ? (
          addresses.map((address) => (
            <article key={address.id} className={`address-card${address.is_default ? " address-card--default" : ""}`}>
              <div className="address-card__head">
                <strong>{address.recipient_name}</strong>
                {address.is_default && <span className="role-pill">Utama</span>}
              </div>
              <p>{address.phone}</p>
              <p>{address.address_line}, {address.city} {address.postal_code}</p>
              <div className="address-card__actions">
                <button type="button" onClick={() => setEditing(address)}><Pencil size={13} /> Ubah</button>
                {!address.is_default && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit"><Star size={13} /> Jadikan utama</button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className="danger"><Trash2 size={13} /> Hapus</button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-panel">
            <MapPin size={24} />
            <strong>Belum ada alamat tersimpan.</strong>
            <span>Tambahkan alamat pengiriman pertama Anda untuk mempercepat checkout.</span>
          </div>
        )}
      </div>

      <section className="panel address-form-panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">{editing ? "Ubah alamat" : "Alamat baru"}</p>
            <h2>{editing ? "Perbarui detail." : "Kirim ke mana?"}</h2>
          </div>
          {editing && (
            <button type="button" className="panel__link" onClick={() => setEditing(null)}>
              <X size={14} /> Batal
            </button>
          )}
        </div>

        <form key={editing?.id ?? `new-${formVersion}`} action={action} className="form-grid">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="form-grid form-grid--two">
            <label className="field">
              Nama penerima
              <input name="recipientName" defaultValue={editing?.recipient_name ?? ""} autoComplete="name" minLength={2} required />
            </label>
            <label className="field">
              Nomor telepon
              <input name="phone" defaultValue={editing?.phone ?? ""} autoComplete="tel" inputMode="tel" required />
            </label>
          </div>
          <label className="field">
            Alamat lengkap
            <textarea name="addressLine" defaultValue={editing?.address_line ?? ""} autoComplete="street-address" minLength={8} required />
          </label>
          <div className="form-grid form-grid--two">
            <label className="field">
              Kota / kabupaten
              <input name="city" defaultValue={editing?.city ?? ""} autoComplete="address-level2" minLength={2} required />
            </label>
            <label className="field">
              Kode pos
              <input name="postalCode" defaultValue={editing?.postal_code ?? ""} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required />
            </label>
          </div>
          <label className="checkbox-field">
            <input type="checkbox" name="isDefault" defaultChecked={editing?.is_default ?? addresses.length === 0} />
            Jadikan alamat utama
          </label>
          {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
          {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
          <div className="form-actions">
            <button className="button button--solid" type="submit" disabled={pending}>
              {editing ? <Save size={16} /> : <Plus size={16} />} {pending ? "Menyimpan..." : editing ? "Simpan perubahan" : "Tambah alamat"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
