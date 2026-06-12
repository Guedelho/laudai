import { describe, expect, it } from "vitest";
import { loadRecentSession, saveChatMessages } from "./history";

type Row = { id: string; user_id: string };
type SavedRow = { id: string; user_id: string; org_id: string; role: string; parts: unknown };

function makeAdmin(existing: Row[] = []) {
  const upserts: SavedRow[][] = [];
  const admin = {
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: existing, error: null }),
      }),
      upsert: (rows: SavedRow[]) => {
        upserts.push(rows);
        return Promise.resolve({ error: null });
      },
    }),
  };
  return { admin: admin as unknown as Parameters<typeof saveChatMessages>[0], upserts };
}

function textMessage(id: string, role: "user" | "assistant", text: string) {
  return { id, role, parts: [{ type: "text", text }] };
}

describe("saveChatMessages", () => {
  it("saves user and assistant messages with ids", async () => {
    const { admin, upserts } = makeAdmin();
    await saveChatMessages(admin, "vet-1", "org-1", [
      textMessage("u1", "user", "oi"),
      textMessage("a1", "assistant", "olá"),
    ]);
    expect(upserts).toHaveLength(1);
    expect(upserts[0].map((r) => r.id)).toEqual(["u1", "a1"]);
    expect(upserts[0][1]).toMatchObject({ role: "assistant", user_id: "vet-1", org_id: "org-1" });
  });

  it("drops messages without an id", async () => {
    const { admin, upserts } = makeAdmin();
    await saveChatMessages(admin, "vet-1", "org-1", [
      textMessage("u1", "user", "oi"),
      textMessage("", "assistant", "olá"),
    ]);
    expect(upserts[0].map((r) => r.id)).toEqual(["u1"]);
  });

  it("keeps only non-empty text parts", async () => {
    const { admin, upserts } = makeAdmin();
    await saveChatMessages(admin, "vet-1", "org-1", [
      {
        id: "a1",
        role: "assistant",
        parts: [{ type: "tool-createReportDraft" }, { type: "text", text: "  " }, { type: "text", text: "resposta" }],
      },
      { id: "a2", role: "assistant", parts: [{ type: "tool-getReport" }] },
    ]);
    expect(upserts[0]).toHaveLength(1);
    expect(upserts[0][0].parts).toEqual([{ type: "text", text: "resposta" }]);
  });

  it("skips messages already saved for the same user", async () => {
    const { admin, upserts } = makeAdmin([{ id: "u1", user_id: "vet-1" }]);
    await saveChatMessages(admin, "vet-1", "org-1", [
      textMessage("u1", "user", "oi"),
      textMessage("a1", "assistant", "olá"),
    ]);
    expect(upserts[0].map((r) => r.id)).toEqual(["a1"]);
  });

  it("drops messages owned by another user", async () => {
    const { admin, upserts } = makeAdmin([{ id: "u1", user_id: "vet-2" }]);
    await saveChatMessages(admin, "vet-1", "org-1", [
      textMessage("u1", "user", "oi"),
      textMessage("a1", "assistant", "olá"),
    ]);
    expect(upserts[0].map((r) => r.id)).toEqual(["a1"]);
  });

  it("does not upsert when nothing new remains", async () => {
    const { admin, upserts } = makeAdmin([{ id: "u1", user_id: "vet-1" }]);
    await saveChatMessages(admin, "vet-1", "org-1", [textMessage("u1", "user", "oi")]);
    expect(upserts).toHaveLength(0);
  });
});

type SessionRow = { id: string; role: string; parts: unknown; seq: number; created_at: string };

function makeSessionAdmin(rows: SessionRow[]) {
  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  };
  return admin as unknown as Parameters<typeof loadRecentSession>[0];
}

function sessionRow(seq: number, minutesAgo: number): SessionRow {
  return {
    id: `m${seq}`,
    role: "user",
    parts: [{ type: "text", text: `msg ${seq}` }],
    seq,
    created_at: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

describe("loadRecentSession", () => {
  it("returns the empty session when there are no rows", async () => {
    const session = await loadRecentSession(makeSessionAdmin([]), "vet-1");
    expect(session).toEqual({ messages: [], cursor: null, latestSeq: null, hasHistory: false });
  });

  it("resumes only the trailing burst within the session gap", async () => {
    const rows = [sessionRow(4, 5), sessionRow(3, 10), sessionRow(2, 200), sessionRow(1, 205)];
    const session = await loadRecentSession(makeSessionAdmin(rows), "vet-1");
    expect(session.messages.map((m) => m.id)).toEqual(["m3", "m4"]);
    expect(session.cursor).toBe(3);
    expect(session.latestSeq).toBe(4);
    expect(session.hasHistory).toBe(true);
  });

  it("resumes nothing when the last message is older than the gap", async () => {
    const rows = [sessionRow(2, 90), sessionRow(1, 95)];
    const session = await loadRecentSession(makeSessionAdmin(rows), "vet-1");
    expect(session.messages).toEqual([]);
    expect(session.cursor).toBe(3);
    expect(session.hasHistory).toBe(true);
  });
});
