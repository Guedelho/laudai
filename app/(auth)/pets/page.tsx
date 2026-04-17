import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import PetsManager from "./PetsManager";
import { Pet } from "@/shared/models";

export default async function PetsPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: pets } = await admin.from("pets").select("*").eq("user_id", user.id).order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <PetsManager initialPets={(pets ?? []) as Pet[]} />
    </main>
  );
}
