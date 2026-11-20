import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser("/akun/profil");

  return (
    <>
      <section className="account-hero">
        <p className="eyebrow">Account / Profil</p>
        <h1>Profil <em>Anda.</em></h1>
        <p>Nama dan nomor telepon dipakai untuk mempercepat checkout dan membantu tim kami menghubungi Anda soal pesanan.</p>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Data akun</p>
            <h2>Informasi kontak.</h2>
          </div>
        </div>
        <ProfileForm profile={user.profile} email={user.email} />
      </section>
    </>
  );
}
