import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "./ProfileForm";
import LogoutButton from "@/components/LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          ← Dashboard
        </Link>
        <LogoutButton />
      </header>
      <div className="flex items-start justify-center px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg">
        <h1 className="text-lg font-bold text-gray-900 mb-6">Meu Perfil</h1>
        <ProfileForm
          initialFullName={profile?.full_name ?? ""}
          initialCrmv={profile?.crmv ?? ""}
          initialCpf={profile?.cpf ?? ""}
          initialLogoUrl={profile?.logo_url ?? ""}
          initialSignatureFont={profile?.signature_font ?? ""}
          initialCrmvState={profile?.crmv_state ?? ""}
          initialEmail={user.email ?? ""}
        />
      </div>
      </div>
    </div>
  );
}
