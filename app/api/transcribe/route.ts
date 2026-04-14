import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserId } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const audio = formData.get("audio") as File;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  const ALLOWED_AUDIO = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp3"];
  if (!ALLOWED_AUDIO.includes(audio.type)) {
    return NextResponse.json({ error: "Formato de áudio não suportado." }, { status: 400 });
  }

  const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
  if (audio.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: "Arquivo de áudio muito grande. Máximo 25 MB." }, { status: 400 });
  }

  const audioBuffer = await audio.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString("base64");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: audio.type || "audio/webm",
        data: audioBase64,
      },
    },
    "Transcreva o áudio a seguir. Retorne apenas o texto transcrito, sem comentários adicionais. O áudio é em português brasileiro e contém achados de exames veterinários.",
  ]);

  try {
    return NextResponse.json({ text: result.response.text() });
  } catch (err) {
    console.error("Transcription response error:", err);
    return NextResponse.json({ error: "Erro ao transcrever áudio." }, { status: 500 });
  }
}
