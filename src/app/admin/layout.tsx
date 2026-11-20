import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentUser, roleLabel } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?next=/admin");
  if (user.role === "buyer") redirect("/akun");

  return (
    <div className="admin">
      <aside className="admin__side">
        <Link className="brand" href="/"><span>Blue</span>Computer<span className="brand-dot">.</span></Link>
        <p className="eyebrow">Operations / {roleLabel(user.role)}</p>
        <AdminNav owner={user.role === "owner"} />
        <div className="admin__user">
          <strong>{user.profile.full_name || user.email}</strong>
          <span>{user.email}</span>
        </div>
        <form action={signOutAction}>
          <button className="admin__logout" type="submit">Keluar</button>
        </form>
        <Link href="/" className="admin__back">← Kembali ke store</Link>
      </aside>
      <section className="admin__main">{children}</section>
    </div>
  );
}
