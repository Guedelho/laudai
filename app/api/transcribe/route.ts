import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  // Try Authorization header first, then cookie-based auth
  let authorized = false;

  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user } } = await admin.auth.getUser(token);
    authorized = !!user;
  }

  if (!authorized) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    authorized = !!user;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ text: result.response.text() });
}
