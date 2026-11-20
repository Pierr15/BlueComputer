import { StoreHeader } from "@/components/store-header";
import { AuthForm } from "@/components/auth-form";

function safeNext(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/akun";
  return value;
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);

  return (
    <main>
      <StoreHeader />
      <section className="auth shell">
        <div className="auth__intro">
          <p className="eyebrow">Start here</p>
          <h1>Make it<br /><em>yours.</em></h1>
          <p>Buat akun untuk checkout, menyimpan alamat, dan melihat status order. Metode pembayaran dapat dipilih nanti saat checkout.</p>
        </div>
        <AuthForm mode="register" next={target} />
      </section>
    </main>
  );
}
