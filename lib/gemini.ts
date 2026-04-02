import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { TEMPLATES, DEFAULTS } from "@/lib/templates";
import { Profile, Specialty } from "@/types";

export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user } } = await admin.auth.getUser(authHeader.slice(7));
    if (user?.id) return user.id;
  }
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data ?? null;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

interface GenerateParams {
  specialty: Specialty;
  rawInput: string;
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  ownerName: string;
  veterinarian: string;
  crmv: string;
}

export async function generateLaudo(params: GenerateParams): Promise<string> {
  const { specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv } = params;

  const today = new Date().toLocaleDateString("pt-BR");
  const systemPrompt = TEMPLATES[specialty]
    .replace(/{defaults}/g, DEFAULTS[specialty] ?? "")
    .replace(/{data}/g, today)
    .replace(/{paciente}/g, patientName)
    .replace(/{especie}/g, species)
    .replace(/{raca}/g, breed ?? "Não informada")
    .replace(/{idade}/g, age ?? "Não informada")
    .replace(/{tutor}/g, ownerName)
    .replace(/{veterinario}/g, veterinarian)
    .replace(/{crmv}/g, crmv);

  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", systemInstruction: systemPrompt });

  const userMessage = rawInput.trim()
    ? `Alterações encontradas no exame:\n\n${rawInput}\n\nGere o laudo completo. Mantenha o texto padrão para todas as seções não mencionadas. Para as seções mencionadas, aplique as alterações informadas. Se houver medidas específicas, substitua os valores de referência (x cm, 0,00) pelos valores reais informados.`
    : `Nenhuma alteração encontrada. Gere o laudo completo utilizando apenas os textos padrão para todas as seções.`;

  const draft = (await model.generateContent(userMessage)).response.text();

  if (!rawInput.trim()) return draft;

  const defaults = DEFAULTS[specialty] ?? "";

  // Verification agent: strip hallucinated findings not in the original input
  try {
    const verifier = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction:
        "Você é um veterinário ultrassonografista sênior revisando um laudo gerado por IA.\n\n" +
        "TEXTO PADRÃO DE REFERÊNCIA (achados normais para cada seção):\n" +
        defaults +
        "\n\nSUAS REGRAS:\n" +
        "1. Seções que correspondem ao texto padrão acima → copie-as EXATAMENTE como estão no laudo, sem nenhuma alteração.\n" +
        "2. Seções alteradas → para cada campo que difere do padrão, avalie como veterinário se a mudança é:\n" +
        "   a) Clinicamente decorrente do achado informado (ex: fígado aumentado de tamanho → margens abauladas é consequência clínica esperada; congestão hepática → vasos de calibre aumentados) → MANTENHA a mudança.\n" +
        "   b) Completamente não relacionada ao achado informado e não esperada clinicamente → RESTAURE o campo do texto padrão.\n" +
        "   Restaure o padrão SOMENTE quando tiver certeza clínica de que a mudança não tem relação com o achado relatado. Em caso de dúvida, mantenha o que foi gerado.\n" +
        "3. Mantenha intactos: impressão diagnóstica, recomendações, cabeçalho e assinatura.\n" +
        "Retorne APENAS o laudo corrigido, sem explicações ou comentários.",
    });
    return (
      await verifier.generateContent(
        `INPUT ORIGINAL DO VETERINÁRIO:\n${rawInput}\n\nLAUDO GERADO:\n${draft}\n\nRetorne o laudo corrigido.`
      )
    ).response.text();
  } catch {
    return draft;
  }
}
