import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Laudai</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Laudos
          </Link>
          <Link href="/pets" className="text-sm text-gray-600 hover:text-gray-900">
            Pacientes
          </Link>
          <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
            Perfil
          </Link>
          <LogoutButton />
          <Link
            href="/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Novo Laudo
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <ClinicsManager initialClinics={(clinics ?? []) as Clinic[]} />
      </main>
    </div>
  );
}
