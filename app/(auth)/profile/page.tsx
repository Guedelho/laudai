import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { isOrgOwner } from "@/lib/supabase/org";
import { TABLES } from "@/shared/constants";
import ProfileForm from "./ProfileForm";
import OrgLogo from "./OrgLogo";

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) return null;

  const admin = createAdmin();
  const orgId = await getCurrentOrgId(user.id);
  const [{ data: profile }, { data: org }, owner] = await Promise.all([
    admin.from(TABLES.profiles).select("*").eq("id", user.id).single(),
    admin.from(TABLES.organizations).select("logo_url").eq("id", orgId).single(),
    isOrgOwner(admin, user.id, orgId),
  ]);

  return (
    <main className="flex flex-col items-center px-4 py-10">
      {owner && <OrgLogo hasLogo={!!org?.logo_url} />}
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg">
        <h1 className="text-lg font-bold text-gray-900 mb-6">Meu Perfil</h1>
        <ProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialCrmv={profile?.crmv ?? ""}
          initialCpf={profile?.cpf ?? ""}
          initialSignatureFont={profile?.signature_font ?? ""}
          initialSignature={profile?.signature ?? ""}
          initialCrmvState={profile?.crmv_state ?? ""}
          initialEmail={user.email ?? ""}
          hasSignatureImage={!!profile?.signature_image_url}
        />
      </div>
    </main>
  );
}
