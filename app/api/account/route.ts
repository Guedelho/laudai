import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const DELETE = withApiHandler(async ({ userId, admin }) => {
  const { error } = await admin
    .from(TABLES.profiles)
    .update({ deletion_scheduled_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    logError("Schedule account deletion failed", error, { userId });
    return NextResponse.json({ error: "Erro ao agendar exclusão da conta." }, { status: 500 });
  }

  return new NextResponse(null, { status: 202 });
});

export const POST = withApiHandler(async ({ userId, admin }) => {
  const { error } = await admin.from(TABLES.profiles).update({ deletion_scheduled_at: null }).eq("id", userId);

  if (error) {
    logError("Cancel account deletion failed", error, { userId });
    return NextResponse.json({ error: "Erro ao cancelar exclusão." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});
