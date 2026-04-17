import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex items-start justify-center px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg">
        <h1 className="text-lg font-bold text-gray-900 mb-6">Meu Perfil</h1>
        <ProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialCrmv={profile?.crmv ?? ""}
          initialCpf={profile?.cpf ?? ""}
          hasLogo={!!profile?.logo_url}
          initialSignatureFont={profile?.signature_font ?? ""}
          initialCrmvState={profile?.crmv_state ?? ""}
          initialEmail={user.email ?? ""}
          hasSignatureImage={!!profile?.signature_image_url}
        />
      </div>
    </main>
  );
}
