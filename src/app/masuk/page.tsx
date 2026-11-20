import { StoreHeader } from "@/components/store-header";
import { AuthForm } from "@/components/auth-form";

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/akun";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);

  return (
    <main>
      <StoreHeader />
      <section className="auth shell">
        <div className="auth__intro">
          <p className="eyebrow">Welcome back</p>
          <h1>Your setup,<br /><em>in one place.</em></h1>
          <p>Masuk untuk menyimpan alamat, melihat riwayat order, dan melanjutkan checkout Anda.</p>
        </div>
        <AuthForm mode="login" next={target} />
      </section>
    </main>
  );
}
