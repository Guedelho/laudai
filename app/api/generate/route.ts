import { NextRequest, NextResponse } from "next/server";
import { generateLaudo } from "@/lib/ai";
import { getUserId, getProfile } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { GenerateRequest } from "@/shared/interfaces";
import { findOrCreatePet } from "@/lib/db";
import { checkRateLimit, recordRateLimit } from "@/lib/rateLimit";

export const maxDuration = 180;

function sseStream(handler: (send: (data: object) => void) => Promise<void>): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        await handler(send);
      } finally {
        controller.close();
      }
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("generate", userId, 5))
    return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });

  const [profile, body] = await Promise.all([getProfile(userId), req.json() as Promise<GenerateRequest>]);

  if (!profile) return NextResponse.json({ error: "Perfil não encontrado. Complete seu cadastro." }, { status: 400 });

  const {
    specialty,
    rawInput,
    patientName,
    species,
    breed,
    age,
    sex,
    neutered,
    ownerName,
    clinicName,
    responsibleVet,
    examDate,
    petId,
    clinicId,
    vetId,
  } = body;

  const required: [string, string][] = [
    [patientName, "Nome do paciente"],
    [ownerName, "Nome do tutor"],
    [breed, "Raça"],
    [age, "Idade"],
    [clinicName, "Nome da clínica"],
    [responsibleVet, "Médico responsável"],
    [examDate, "Data do exame"],
    [rawInput, "Achados do exame"],
  ];
  for (const [value, label] of required) {
    if (!value.trim()) return NextResponse.json({ error: `${label} é obrigatório(a).` }, { status: 400 });
  }
  if (rawInput.length > 2_000)
    return NextResponse.json({ error: "Achados do exame muito longos. Máximo 2.000 caracteres." }, { status: 400 });

  const supabase = createAdmin();

  return sseStream(async (send) => {
    let generatedContent: string;
    let resolvedPetId: string | null = petId ?? null;
    try {
      const [content, pet] = await Promise.all([
        generateLaudo({
          rawInput,
          patientName,
          species,
          breed,
          age,
          sex,
          neutered,
          ownerName,
          onStatus: (status) => send({ status }),
          onChunk: (text) => send({ status: "chunk", text }),
        }),
        !petId
          ? findOrCreatePet(supabase, userId, patientName.trim(), ownerName.trim(), {
              species,
              breed,
              age,
              sex,
              neutered,
            })
          : Promise.resolve(null),
      ]);
      generatedContent = content;
      if (pet?.id) resolvedPetId = pet.id;
    } catch (err) {
      console.error("Gemini generation error:", err);
      send({ status: "error", message: "Erro ao gerar laudo. Tente novamente." });
      return;
    }

    send({ status: "saving" });

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
        edited_content: generatedContent,
        sex,
        neutered,
        clinic_name: clinicName,
        responsible_vet: responsibleVet,
        exam_date: examDate,
        pet_id: resolvedPetId,
        clinic_id: clinicId ?? null,
        vet_id: vetId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      send({ status: "error", message: "Erro ao salvar laudo." });
      return;
    }

    recordRateLimit("generate", userId);
    send({ status: "done", laudo: { id: laudo.id } });
  });
}
