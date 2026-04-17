import { NextRequest, NextResponse } from "next/server";
import { generateLaudo } from "@/lib/gemini";
import { getUserId, getProfile } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { GenerateRequest } from "@/types";
import { findOrCreatePet } from "@/lib/db";
import { checkRateLimit, recordRateLimit } from "@/lib/rateLimit";

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
      "Connection": "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado. Complete seu cadastro." }, { status: 400 });

  if (!checkRateLimit("generate", userId, 5)) return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });

  const supabase = createAdmin();
  const body: GenerateRequest = await req.json();
  const { specialty, rawInput, patientName, species, breed, age, sex, neutered, ownerName, clinicName, responsibleVet, petId, examDate } = body;

  if (!patientName.trim()) return NextResponse.json({ error: "Nome do paciente é obrigatório." }, { status: 400 });
  if (!ownerName.trim()) return NextResponse.json({ error: "Nome do tutor é obrigatório." }, { status: 400 });
  if (!rawInput.trim()) return NextResponse.json({ error: "Achados do exame são obrigatórios." }, { status: 400 });
  if (rawInput.length > 5_000) return NextResponse.json({ error: "Achados do exame muito longos. Máximo 5.000 caracteres." }, { status: 400 });

  return sseStream(async (send) => {
    // Find or create pet (deduped), run in parallel with Gemini
    const petPromise = !petId
      ? findOrCreatePet(supabase, userId, patientName.trim(), ownerName.trim(), {
          species,
          breed: breed || null,
          age: age || null,
          sex,
          neutered,
        })
      : null;

    let generatedContent: string;
    let resolvedPetId: string | null = petId ?? null;
    try {
      const [content, petResult] = await Promise.all([
        generateLaudo({
          specialty,
          rawInput,
          patientName,
          species,
          breed,
          age,
          sex,
          neutered,
          ownerName,
          veterinarian: profile.full_name,
          crmv: profile.crmv,
          onStatus: (status) => send({ status }),
        }),
        petPromise,
      ]);
      generatedContent = content;
      if (petResult?.id) resolvedPetId = petResult.id;
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
        sex,
        neutered,
        clinic_name: clinicName ?? null,
        responsible_vet: responsibleVet ?? null,
        exam_date: examDate ?? null,
        pet_id: resolvedPetId,
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      send({ status: "error", message: "Erro ao salvar laudo." });
      return;
    }

    recordRateLimit("generate", userId);
    send({ status: "done", laudo });
  });
}
