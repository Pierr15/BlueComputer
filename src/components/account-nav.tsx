"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Package, ShieldCheck, UserRound } from "lucide-react";

const links = [
  { href: "/akun", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/akun/profil", label: "Profil", icon: UserRound },
  { href: "/akun/alamat", label: "Alamat", icon: MapPin },
  { href: "/akun/pesanan", label: "Pesanan", icon: Package },
] as const;

export function AccountNav({ staff }: { staff: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="account-nav" aria-label="Navigasi akun">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/akun" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            <Icon size={15} /> {label}
          </Link>
        );
      })}
      {staff && (
        <Link href="/admin">
          <ShieldCheck size={15} /> Workspace
        </Link>
      )}
    </nav>
  );
}
