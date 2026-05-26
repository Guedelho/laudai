import { NextResponse } from "next/server";
import { findOrCreateVet } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";
import { ClientVetRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";

export const POST = withApiHandler<{ id: string }>(async ({ userId, orgId, admin, audit, params, req }) => {
  const clientId = params.id;
  const { name }: ClientVetRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const { data: client } = await admin
    .from(TABLES.clients)
    .select("id")
    .eq("id", clientId)
    .eq("org_id", orgId)
    .single();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const vet = await findOrCreateVet(admin, clientId, userId, orgId, name.trim());
  await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.client_vet, entityId: vet.id, changes: vet });
  return NextResponse.json({ vet });
});
