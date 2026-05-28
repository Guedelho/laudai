import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES } from "@/shared/constants";
import ClientsManager from "./ClientsManager";
import { Client } from "@/shared/models";

export default async function ClientsPage() {
  const user = await getServerUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const admin = createAdmin();
  const { data: clients } = await admin
    .from(TABLES.clients)
    .select("*, client_vets(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <ClientsManager initialClients={(clients ?? []) as Client[]} />
    </main>
  );
}
