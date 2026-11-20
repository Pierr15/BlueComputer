"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, LayoutDashboard, PackageCheck, UsersRound } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/order", label: "Pesanan", icon: PackageCheck },
  { href: "/admin/produk", label: "Produk & stok", icon: Boxes },
  { href: "/admin/pengguna", label: "Pengguna", icon: UsersRound, owner: true },
] as const;

export function AdminNav({ owner }: { owner: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi operasional">
      {links
        .filter((link) => !("owner" in link) || !link.owner || owner)
        .map(({ href, label, icon: Icon, ...rest }) => {
          const active = "exact" in rest && rest.exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
              <Icon size={15} /> {label}
            </Link>
          );
        })}
    </nav>
  );
}
