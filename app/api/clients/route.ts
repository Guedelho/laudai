import { NextResponse } from "next/server";
import { findOrCreateClient, findOrCreateVet } from "@/lib/supabase/upserts";
import { withApiHandler } from "@/lib/api-handler";
import { ClientRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const GET = withApiHandler(async ({ userId, orgId, admin }) => {
  const { data: clients, error } = await admin
    .from(TABLES.clients)
    .select("*, client_vets(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    logError("Clients fetch failed", error, { userId, orgId });
    return NextResponse.json({ error: "Erro ao buscar clientes." }, { status: 500 });
  }
  return NextResponse.json({ clients });
});

export const POST = withApiHandler(async ({ userId, orgId, admin, audit, req }) => {
  const { name, vetName }: ClientRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });

  const client = await findOrCreateClient(admin, userId, orgId, name.trim());
  await audit({
    action: AUDIT_ACTIONS.create,
    entityType: AUDIT_ENTITIES.client,
    entityId: client.id,
    changes: client,
  });

  let vet = null;
  if (vetName?.trim()) {
    vet = await findOrCreateVet(admin, client.id, userId, orgId, vetName.trim());
    await audit({
      action: AUDIT_ACTIONS.create,
      entityType: AUDIT_ENTITIES.client_vet,
      entityId: vet.id,
      changes: vet,
    });
  }

  return NextResponse.json({ client: { ...client, client_vets: vet ? [vet] : client.client_vets } });
});
