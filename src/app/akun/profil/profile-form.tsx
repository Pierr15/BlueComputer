"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfile } from "@/app/akun/actions";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <form action={action} className="form-grid">
      <div className="form-grid form-grid--two">
        <label className="field">
          Nama lengkap
          <input name="fullName" defaultValue={profile.full_name ?? ""} autoComplete="name" minLength={2} maxLength={120} required />
        </label>
        <label className="field">
          Nomor telepon
          <input name="phone" defaultValue={profile.phone ?? ""} autoComplete="tel" inputMode="tel" placeholder="+62 812 3456 7890" />
        </label>
      </div>
      <label className="field">
        Email
        <input value={email} readOnly disabled />
        <small>Email dipakai untuk login dan notifikasi pembayaran. Hubungi dukungan untuk mengubahnya.</small>
      </label>
      {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
      <div className="form-actions">
        <button className="button button--solid" type="submit" disabled={pending}>
          <Save size={16} /> {pending ? "Menyimpan..." : "Simpan profil"}
        </button>
      </div>
    </form>
  );
}
