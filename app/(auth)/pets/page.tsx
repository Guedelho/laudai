import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES } from "@/shared/constants";
import PetsManager from "./PetsManager";
import { Pet } from "@/shared/models";

export default async function PetsPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const admin = createAdmin();
  const { data: pets } = await admin
    .from(TABLES.pets)
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <PetsManager initialPets={(pets ?? []) as Pet[]} />
    </main>
  );
}
