import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

type RawMessage = { id?: string; role?: string; parts?: Array<{ type?: string; text?: unknown }> };

function toTextOnly(messages: RawMessage[]): StoredMessage[] {
  const out: StoredMessage[] = [];
  for (const m of messages) {
    if (!m.id || (m.role !== "user" && m.role !== "assistant")) continue;
    const parts = (m.parts ?? [])
      .filter((p) => p.type === "text" && typeof p.text === "string" && p.text.trim())
      .map((p) => ({ type: "text" as const, text: p.text as string }));
    if (parts.length) out.push({ id: m.id, role: m.role, parts });
  }
  return out;
}

export async function loadChatMessages(admin: Admin, userId: string): Promise<StoredMessage[]> {
  const { data, error } = await admin
    .from(TABLES.chat_messages)
    .select("id, role, parts")
    .eq("user_id", userId)
    .order("seq");
  if (error) {
    logError("loadChatMessages failed", error, { userId });
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id, role: r.role, parts: r.parts }) as StoredMessage);
}

export async function saveChatMessages(
  admin: Admin,
  userId: string,
  orgId: string,
  messages: RawMessage[],
): Promise<void> {
  try {
    const stored = toTextOnly(messages);
    if (!stored.length) return;
    const rows = stored.map((m) => ({ id: m.id, user_id: userId, org_id: orgId, role: m.role, parts: m.parts }));
    const { error } = await admin.from(TABLES.chat_messages).upsert(rows, { onConflict: "id" });
    if (error) logError("saveChatMessages upsert failed", error, { userId });
  } catch (err) {
    logError("saveChatMessages failed", err, { userId });
  }
}
