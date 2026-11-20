"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Save } from "lucide-react";
import { saveAddress } from "@/app/akun/actions";

export function CheckoutAddressForm() {
  const [state, action, pending] = useActionState(saveAddress, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={action} className="form-grid">
      <div className="form-grid form-grid--two">
        <label className="field">
          Nama penerima
          <input name="recipientName" autoComplete="name" minLength={2} required />
        </label>
        <label className="field">
          Nomor telepon
          <input name="phone" autoComplete="tel" inputMode="tel" required />
        </label>
      </div>
      <label className="field">
        Alamat lengkap
        <textarea name="addressLine" autoComplete="street-address" minLength={8} required />
      </label>
      <div className="form-grid form-grid--two">
        <label className="field">
          Kota / kabupaten
          <input name="city" autoComplete="address-level2" minLength={2} required />
        </label>
        <label className="field">
          Kode pos
          <input name="postalCode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} required />
        </label>
      </div>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
      <div className="form-actions">
        <button className="button button--solid button--small" type="submit" disabled={pending}>
          {pending ? <Save size={15} /> : <MapPin size={15} />} {pending ? "Menyimpan..." : "Simpan alamat"}
        </button>
      </div>
    </form>
  );
}
