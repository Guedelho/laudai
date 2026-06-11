import { ChatHistoryMessage } from "@/shared/models";
import { ChatHistoryResponse } from "@/shared/interfaces";
import { fetchJson } from "@/lib/fetch";

export async function fetchChatHistory(before: number | null): Promise<ChatHistoryMessage[]> {
  const params = new URLSearchParams();
  if (before !== null) params.set("before", String(before));
  const data = await fetchJson<ChatHistoryResponse>(`/api/chat/messages?${params.toString()}`);
  return data.messages ?? [];
}
