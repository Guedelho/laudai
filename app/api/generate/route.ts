import { NextResponse } from "next/server";
import { generateReport } from "@/lib/report/generate";
import { getProfile } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { GenerateRequest } from "@/shared/interfaces";
import { findOrCreatePet, resolveOwnedFks } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";

export const maxDuration = 180;

function sseStream(
  handler: (send: (data: object) => void, signal: AbortSignal) => Promise<void>,
  signal: AbortSignal,
): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (signal.aborted) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        await handler(send, signal);
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed by client abort */
        }
      }
    },
    cancel() {
      /* Client disconnected — handler watches `signal` and exits early. */
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

export const POST = withApiHandler({ rateLimit: { name: "generate", maxPerMinute: 5 } }, async ({ userId, req }) => {
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
  const ownedFks = await resolveOwnedFks(supabase, userId, { petId, clinicId, vetId });

  return sseStream(async (send, signal) => {
    let generatedContent: string;
    let resolvedPetId: string | null = ownedFks.petId;
    try {
      const [content, pet] = await Promise.all([
        generateReport({
          rawInput,
          patientName,
          species,
          breed,
          age,
          sex,
          neutered,
          ownerName,
          signal,
          onStatus: (status) => send({ status }),
          onChunk: (text) => send({ status: "chunk", text }),
        }),
        !resolvedPetId
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
      if (signal.aborted) return;
      console.error("Gemini generation error:", err);
      send({ status: "error", message: "Erro ao gerar laudo. Tente novamente." });
      return;
    }

    if (signal.aborted) return;
    send({ status: "saving" });

    const { data: report, error } = await supabase
      .from("reports")
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
        clinic_id: ownedFks.clinicId,
        vet_id: ownedFks.vetId,
      })
      .select()
      .single();

    if (signal.aborted) return;
    if (error) {
      console.error("DB insert error:", error);
      send({ status: "error", message: "Erro ao salvar laudo." });
      return;
    }

    send({ status: "done", report: { id: report.id } });
  }, req.signal);
});
