import { NextResponse } from "next/server";
import { withApiHandler, loadOwned } from "@/lib/api-handler";
import { ClientRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

const NOT_FOUND = NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

export const PATCH = withApiHandler<{ id: string }>(async ({ userId, admin, audit, params, req }) => {
  const { name }: ClientRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });

  const before = await loadOwned(admin, TABLES.clients, params.id, userId);
  if (!before) return NOT_FOUND;

  const { data: client, error } = await admin
    .from(TABLES.clients)
    .update({ name: name.trim() })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    logError("Client update failed", error, { userId, clientId: params.id });
    return NextResponse.json({ error: "Erro ao atualizar cliente." }, { status: 500 });
  }

  await audit({
    action: AUDIT_ACTIONS.update,
    entityType: AUDIT_ENTITIES.client,
    entityId: client.id,
    changes: { before, after: client },
  });
  return NextResponse.json({ client });
});

export const DELETE = withApiHandler<{ id: string }>(async ({ userId, admin, audit, params }) => {
  const before = await loadOwned(admin, TABLES.clients, params.id, userId);
  if (!before) return NOT_FOUND;

  const { error } = await admin.from(TABLES.clients).delete().eq("id", params.id).eq("user_id", userId);

  if (error) {
    logError("Client delete failed", error, { userId, clientId: params.id });
    return NextResponse.json({ error: "Erro ao excluir cliente." }, { status: 500 });
  }
  await audit({
    action: AUDIT_ACTIONS.delete,
    entityType: AUDIT_ENTITIES.client,
    entityId: params.id,
    changes: before,
  });
  return NextResponse.json({ ok: true });
});
