import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
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

  return NextResponse.json({ text: result.response.text() });
}
