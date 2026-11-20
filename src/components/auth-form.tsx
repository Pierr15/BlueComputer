"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode, next = "/akun" }: { mode: "login" | "register"; next?: string }) {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(undefined);
    setError(undefined);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    try {
      const supabase = createClient();
      if (isRegister) {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: String(data.get("fullName") || "").trim() } },
        });
        if (result.error) throw result.error;
        if (result.data.session) {
          setMessage("Akun dibuat. Mengarahkan Anda...");
          router.replace(next);
          router.refresh();
        } else {
          setMessage("Cek email Anda untuk mengonfirmasi akun, lalu masuk kembali.");
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        setMessage("Berhasil masuk. Mengarahkan Anda...");
        router.replace(next);
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak dapat memproses autentikasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth__form" onSubmit={submit}>
      {isRegister && (
        <label>
          Nama lengkap
          <input name="fullName" autoComplete="name" placeholder="Nama Anda" required minLength={2} />
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="Minimal 8 karakter"
          minLength={8}
          required
        />
      </label>
      <button className="button button--solid" disabled={loading} type="submit">
        {loading ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"} <ArrowRight size={17} />
      </button>
      {message && <p className="form-message form-message--success" role="status">{message}</p>}
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <p>
        {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link href={`${isRegister ? "/masuk" : "/daftar"}?next=${encodeURIComponent(next)}`}>
          {isRegister ? "Masuk" : "Buat akun"}
        </Link>
      </p>
    </form>
  );
}
