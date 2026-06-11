import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import { CHAT_HISTORY_PAGE_SIZE, TABLES } from "@/shared/constants";
import type { ChatHistoryMessage } from "@/shared/models";
import { logError, logWarn } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

type StoredMessage = Pick<ChatHistoryMessage, "id" | "role" | "parts">;

const SESSION_GAP_MS = 60 * 60 * 1000;
const RESUME_FETCH_LIMIT = 50;

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

interface RecentSession {
  messages: StoredMessage[];
  cursor: number | null;
  latestSeq: number | null;
  hasHistory: boolean;
}

const EMPTY_SESSION: RecentSession = { messages: [], cursor: null, latestSeq: null, hasHistory: false };

export async function loadRecentSession(admin: Admin, userId: string): Promise<RecentSession> {
  const { data, error } = await admin
    .from(TABLES.chat_messages)
    .select("id, role, parts, seq, created_at")
    .eq("user_id", userId)
    .order("seq", { ascending: false })
    .limit(RESUME_FETCH_LIMIT);
  if (error) {
    logError("loadRecentSession failed", error, { userId });
    return EMPTY_SESSION;
  }
  const rows = (data ?? []) as ChatHistoryMessage[];
  if (!rows.length) return EMPTY_SESSION;

  const tail: ChatHistoryMessage[] = [];
  let prev = Date.now();
  for (const row of rows) {
    const ts = new Date(row.created_at).getTime();
    if (prev - ts > SESSION_GAP_MS) break;
    tail.push(row);
    prev = ts;
  }
  tail.reverse();
  return {
    messages: tail.map((r) => ({ id: r.id, role: r.role, parts: r.parts })),
    cursor: tail.length ? tail[0].seq : rows[0].seq + 1,
    latestSeq: rows[0].seq,
    hasHistory: rows.length > tail.length || rows.length === RESUME_FETCH_LIMIT,
  };
}

export async function loadOlderMessages(
  admin: Admin,
  userId: string,
  before: number | null,
): Promise<ChatHistoryMessage[]> {
  let query = admin
    .from(TABLES.chat_messages)
    .select("id, role, parts, seq, created_at")
    .eq("user_id", userId)
    .order("seq", { ascending: false })
    .limit(CHAT_HISTORY_PAGE_SIZE);
  if (before !== null) query = query.lt("seq", before);
  const { data, error } = await query;
  if (error) {
    logError("loadOlderMessages failed", error, { userId });
    return [];
  }
  return ((data ?? []) as ChatHistoryMessage[]).reverse();
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
    const { data: foreign } = await admin
      .from(TABLES.chat_messages)
      .select("id")
      .in(
        "id",
        stored.map((m) => m.id),
      )
      .neq("user_id", userId);
    const foreignIds = new Set((foreign ?? []).map((r) => r.id));
    if (foreignIds.size) logWarn("saveChatMessages: dropped messages owned by another user", { userId });
    const rows = stored
      .filter((m) => !foreignIds.has(m.id))
      .map((m) => ({ id: m.id, user_id: userId, org_id: orgId, role: m.role, parts: m.parts }));
    if (!rows.length) return;
    const { error } = await admin.from(TABLES.chat_messages).upsert(rows, { onConflict: "id" });
    if (error) logError("saveChatMessages upsert failed", error, { userId });
  } catch (err) {
    logError("saveChatMessages failed", err, { userId });
  }
}
