import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { requireOwner, roleLabel } from "@/lib/auth";
import { formatDate } from "@/lib/order-status";
import type { AppRole } from "@/lib/types";
import { RoleForm } from "./role-form";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: AppRole;
  createdAt: string;
};

export default async function AdminUsersPage() {
  const currentUser = await requireOwner("/admin/pengguna");

  let rows: UserRow[] = [];
  let dataError: string | null = null;

  try {
    const supabase = await createClient();
    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (rolesResult.error) throw rolesResult.error;

    const roles = new Map<string, AppRole>(
      (rolesResult.data ?? []).map((row) => [row.user_id, row.role as AppRole]),
    );
    const emails = new Map<string, string>();

    if (hasAdminCredentials()) {
      try {
        const admin = createAdminClient();
        const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        for (const authUser of data.users) {
          if (authUser.email) emails.set(authUser.id, authUser.email);
        }
      } catch {
        // Profiles still render without email when the Auth admin API is unavailable.
      }
    }

    rows = (profilesResult.data ?? []).map((profile) => ({
      id: profile.id,
      email: emails.get(profile.id) ?? "—",
      fullName: profile.full_name,
      phone: profile.phone,
      role: roles.get(profile.id) ?? "buyer",
      createdAt: profile.created_at,
    }));

    rows.sort((a, b) => {
      const rank: Record<AppRole, number> = { owner: 0, employee: 1, buyer: 2 };
      return rank[a.role] - rank[b.role] || a.email.localeCompare(b.email);
    });
  } catch {
    dataError = "Daftar pengguna belum dapat dimuat. Periksa koneksi Supabase lalu coba lagi.";
  }

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">Owner / Pengguna</p>
          <h1>Tim & akses.</h1>
        </div>
      </header>

      <p className="admin__notice">
        User baru selalu menjadi <strong>buyer</strong>. Owner dapat menaikkan role menjadi employee atau owner.
        Owner pertama harus ditetapkan lewat SQL atau dashboard Supabase yang terkendali.
      </p>

      {dataError && <p className="admin__notice" role="status">{dataError}</p>}

      {rows.length ? (
        <div className="data-table-wrap admin__data">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Kontak</th>
                <th>Bergabung</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.fullName || "Tanpa nama"}</strong>
                    <br />
                    <small>{row.email}</small>
                  </td>
                  <td>{row.phone || "—"}</td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <RoleForm userId={row.id} role={row.role} isSelf={row.id === currentUser.id} />
                    <small>{roleLabel(row.role)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin__table">
          <div className="admin__empty">
            <UsersRound size={27} />
            <strong>Belum ada pengguna.</strong>
            <span>Pengguna yang mendaftar akan muncul di sini dengan role buyer.</span>
          </div>
        </div>
      )}
    </>
  );
}
