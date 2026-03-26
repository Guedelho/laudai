import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates";
import { GenerateRequest } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: GenerateRequest = await req.json();
  const { specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv } = body;

  const template = TEMPLATES[specialty];
  const today = new Date().toLocaleDateString("pt-BR");

  const systemPrompt = template
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

  const result = await model.generateContent(
    `Achados do exame:\n\n${rawInput}\n\nGere o laudo completo e formal com base nesses achados. Use linguagem técnica veterinária adequada. Preencha todas as seções — se um órgão não foi mencionado, escreva "Sem alterações detectadas" ou equivalente clínico adequado.`
  );

  const generatedContent = result.response.text();

  // Save to database
  const { data: laudo, error } = await supabase
    .from("laudos")
    .insert({
      user_id: user.id,
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
    return NextResponse.json({ error: "Failed to save laudo" }, { status: 500 });
  }

  return NextResponse.json({ laudo });
}
