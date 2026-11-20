import Link from "next/link";
import { StoreHeader } from "@/components/store-header";
import { AccountNav } from "@/components/account-nav";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentUser, isStaffRole, roleLabel } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main>
      <StoreHeader />
      {user ? (
        <div className="account-shell shell">
          <aside className="account-side">
            <div className="account-side__user">
              <p className="eyebrow">Akun</p>
              <strong>{user.profile.full_name || user.email || "Pelanggan"}</strong>
              <span>{user.email}</span>
              <span className="role-pill">{roleLabel(user.role)}</span>
            </div>
            <AccountNav staff={isStaffRole(user.role)} />
            <Link href="/katalog" className="account-side__store">Lanjut belanja</Link>
            <form action={signOutAction}>
              <button className="account-side__logout" type="submit">Keluar</button>
            </form>
          </aside>
          <div className="account-main">{children}</div>
        </div>
      ) : (
        children
      )}
    </main>
  );
}
