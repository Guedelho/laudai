import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { loadOlderMessages } from "@/lib/chat/history";

export const GET = withApiHandler(async ({ userId, admin, req }) => {
  const raw = new URL(req.url).searchParams.get("before");
  const parsed = raw === null ? null : Number.parseInt(raw, 10);
  const before = parsed !== null && Number.isFinite(parsed) ? parsed : null;
  const messages = await loadOlderMessages(admin, userId, before);
  return NextResponse.json({ messages });
});
