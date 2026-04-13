import { NextRequest, NextResponse } from "next/server";
import { generateLaudo, getUserId, getProfile } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";
import { GenerateRequest } from "@/types";

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado. Complete seu cadastro." }, { status: 400 });

  const supabase = createAdmin();

  const body: GenerateRequest = await req.json();
  const { specialty, rawInput, patientName, species, breed, age, sex, neutered, ownerName, clinicName, responsibleVet, petId } = body;

  if (!patientName?.trim()) return NextResponse.json({ error: "Nome do paciente é obrigatório." }, { status: 400 });
  if (!ownerName?.trim()) return NextResponse.json({ error: "Nome do tutor é obrigatório." }, { status: 400 });
  if (!rawInput?.trim()) return NextResponse.json({ error: "Achados do exame são obrigatórios." }, { status: 400 });

  // Create pet if not linking to an existing one
  let resolvedPetId = petId ?? null;
  if (!petId) {
    const { data: newPet } = await supabase
      .from("pets")
      .insert({ user_id: userId, name: patientName.trim(), species, breed: breed || null, age: age || null, sex: sex || null, neutered: neutered ?? null, owner_name: ownerName.trim() })
      .select()
      .single();
    if (newPet) resolvedPetId = newPet.id;
  }

  let generatedContent: string;
  try {
    generatedContent = await generateLaudo({
      specialty,
      rawInput,
      patientName,
      species,
      breed,
      age,
      ownerName,
      veterinarian: profile.full_name,
      crmv: profile.crmv,
    });
  } catch (err) {
    console.error("Gemini generation error:", err);
    return NextResponse.json({ error: "Erro ao gerar laudo. Tente novamente." }, { status: 500 });
  }

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
      sex: sex ?? null,
      neutered: neutered ?? null,
      clinic_name: clinicName ?? null,
      responsible_vet: responsibleVet ?? null,
      pet_id: resolvedPetId,
    })
    .select()
    .single();

  if (error) {
    console.error("DB insert error:", error);
    return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
  }

  return NextResponse.json({ laudo });
}
