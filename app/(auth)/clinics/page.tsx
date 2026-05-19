import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES } from "@/shared/constants";
import ClinicsManager from "./ClinicsManager";
import { Clinic } from "@/shared/models";

export default async function ClinicsPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const admin = createAdmin();
  const { data: clinics } = await admin
    .from(TABLES.clinics)
    .select("*, clinic_vets(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <ClinicsManager initialClinics={(clinics ?? []) as Clinic[]} />
    </main>
  );
}
