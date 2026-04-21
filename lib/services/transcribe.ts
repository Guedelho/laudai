import { TranscribeResponse } from "@/shared/interfaces";
import { fetchJson, formBody } from "@/lib/fetch";

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");
  const data = await fetchJson<TranscribeResponse>("/api/transcribe", { method: "POST", ...formBody(formData) });
  return data.text;
}
