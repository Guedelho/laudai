import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { TEMPLATES, DEFAULTS } from "@/lib/templates";
import { GenerateRequest } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  // Try Authorization header first (explicit token), then fall back to cookie-based auth
  let userId: string | null = null;

  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user } } = await admin.auth.getUser(token);
    userId = user?.id ?? null;
  }

  if (!userId) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role client for DB so it bypasses RLS (we already verified the user above)
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body: GenerateRequest = await req.json();
  const { specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv } = body;

  const template = TEMPLATES[specialty];
  const today = new Date().toLocaleDateString("pt-BR");

  const systemPrompt = template
    .replace(/{defaults}/g, DEFAULTS[specialty] || "")
    .replace(/{data}/g, today)
    .replace(/{paciente}/g, patientName)
    .replace(/{especie}/g, species)
    .replace(/{raca}/g, breed || "Não informada")
    .replace(/{idade}/g, age || "Não informada")
    .replace(/{tutor}/g, ownerName)
    .replace(/{veterinario}/g, veterinarian)
    .replace(/{crmv}/g, crmv);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  let result;
  try {
    const userMessage = rawInput.trim()
      ? `Alterações encontradas no exame:\n\n${rawInput}\n\nGere o laudo completo. Mantenha o texto padrão para todas as seções não mencionadas. Para as seções mencionadas, aplique as alterações informadas. Se houver medidas específicas, substitua os valores de referência (x cm, 0,00) pelos valores reais informados.`
      : `Nenhuma alteração encontrada. Gere o laudo completo utilizando apenas os textos padrão para todas as seções.`;

    result = await model.generateContent(userMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${message}` }, { status: 500 });
  }

  const generatedContent = result.response.text();

  // Save to database
  const { data: laudo, error } = await supabase
    .from("laudos")
    .insert({
      user_id: userId,
      specialty,
      patient_name: patientName,
      species,
      breed,
      age,
      owner_name: ownerName,
      raw_input: rawInput,
      generated_content: generatedContent,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ laudo });
}
