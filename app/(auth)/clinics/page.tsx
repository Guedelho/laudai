import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import ClinicsManager from "./ClinicsManager";
import { Clinic } from "@/shared/models";

export default async function ClinicsPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: clinics } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <ClinicsManager initialClinics={(clinics ?? []) as Clinic[]} />
    </main>
  );
}
