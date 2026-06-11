import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { isOrgOwner } from "@/lib/supabase/org";
import { getBillingOverview } from "@/lib/stripe/subscription";
import { TABLES } from "@/shared/constants";
import ProfileForm from "./ProfileForm";
import OrgLogo from "./OrgLogo";
import BillingSection from "./BillingSection";
import AccountActions from "./AccountActions";

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

  const billing = owner ? await getBillingOverview(admin, orgId).catch(() => null) : null;

  return (
    <main className="flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="w-full max-w-lg text-xl font-semibold text-gray-900">Configurações</h1>
      {owner && <OrgLogo hasLogo={!!org?.logo_url} />}
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Perfil</h2>
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
      {billing && <BillingSection plan={billing.plan} invoices={billing.invoices} />}
      <AccountActions deletionScheduledAt={profile?.deletion_scheduled_at ?? null} />
    </main>
  );
}
