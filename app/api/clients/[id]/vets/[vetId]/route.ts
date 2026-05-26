import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const DELETE = withApiHandler<{ id: string; vetId: string }>(async ({ userId, orgId, admin, audit, params }) => {
  const clientId = params.id;

  const { data: client } = await admin
    .from(TABLES.clients)
    .select("id")
    .eq("id", clientId)
    .eq("org_id", orgId)
    .single();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { data: before } = await admin
    .from(TABLES.client_vets)
    .select("*")
    .eq("id", params.vetId)
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Médico não encontrado." }, { status: 404 });

  const { error } = await admin.from(TABLES.client_vets).delete().eq("id", params.vetId).eq("user_id", userId);

  if (error) {
    logError("Client vet delete failed", error, { userId, clientId: params.id, vetId: params.vetId });
    return NextResponse.json({ error: "Erro ao remover médico." }, { status: 500 });
  }
  await audit({
    action: AUDIT_ACTIONS.delete,
    entityType: AUDIT_ENTITIES.client_vet,
    entityId: params.vetId,
    changes: before,
  });
  return NextResponse.json({ ok: true });
});
