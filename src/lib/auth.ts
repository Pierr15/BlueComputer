import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, CurrentUser, Profile } from "@/lib/types";

export function isStaffRole(role: AppRole) {
  return role === "employee" || role === "owner";
}

export function roleLabel(role: AppRole) {
  if (role === "owner") return "Owner";
  if (role === "employee") return "Employee";
  return "Buyer";
}

function emptyProfile(id: string): Profile {
  return { id, full_name: null, phone: null, avatar_url: null, created_at: "", updated_at: "" };
}

/**
 * Reads the authenticated user and their database-backed role. React's cache
 * deduplicates the lookup inside a single render pass.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;
    if (authError || !user) return null;

    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    return {
      id: user.id,
      email: user.email ?? "",
      role: (roleRow?.role as AppRole | undefined) ?? "buyer",
      profile: (profile as Profile | null) ?? emptyProfile(user.id),
    };
  } catch {
    return null;
  }
});

export async function requireUser(nextPath = "/akun") {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireStaff(nextPath = "/admin") {
  const user = await requireUser(nextPath);
  if (!isStaffRole(user.role)) redirect("/akun");
  return user;
}

export async function requireOwner(nextPath = "/admin/pengguna") {
  const user = await requireUser(nextPath);
  if (user.role !== "owner") redirect("/admin");
  return user;
}
