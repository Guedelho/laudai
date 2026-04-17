import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import PetsManager from "./PetsManager";
import { Pet } from "@/types";

export default async function PetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdmin();
  const { data: pets } = await admin
    .from("pets")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <PetsManager initialPets={(pets ?? []) as Pet[]} />
    </main>
  );
}
