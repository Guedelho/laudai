import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ClinicsManager from "./ClinicsManager";
import { Clinic } from "@/types";

export default async function ClinicsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdmin();
  const { data: clinics } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader current="/clinics" />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <ClinicsManager initialClinics={(clinics ?? []) as Clinic[]} />
      </main>
    </div>
  );
}
