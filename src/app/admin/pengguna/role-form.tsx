"use client";

import { useActionState } from "react";
import { updateUserRole } from "@/app/admin/actions";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["buyer", "employee", "owner"];

export function RoleForm({ userId, role, isSelf }: { userId: string; role: AppRole; isSelf: boolean }) {
  const [state, action, pending] = useActionState(updateUserRole, {});

  return (
    <form action={action} className="table-actions role-form">
      <input type="hidden" name="userId" value={userId} />
      <select name="role" defaultValue={role} aria-label="Role pengguna" disabled={isSelf}>
        {ROLES.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <button className="button button--outline button--small" type="submit" disabled={pending || isSelf}>
        {pending ? "..." : "Simpan"}
      </button>
      {state.error && <small className="form-inline-error" role="alert">{state.error}</small>}
      {state.success && <small className="form-inline-success" role="status">{state.success}</small>}
    </form>
  );
}
