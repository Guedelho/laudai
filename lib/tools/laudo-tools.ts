import { tool } from "ai";
import { z } from "zod";
import { createAdmin } from "@/lib/supabase/admin";
import { createReport } from "@/lib/report/create";
import { findOrCreateClient, findOrCreateVet, resolveOwnedFks } from "@/lib/supabase/upserts";
import { REPORT_TYPES, REPORT_STATUSES, TABLES } from "@/shared/constants";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditFn } from "@/lib/audit";
import { brazilToday, parseReportContent } from "@/lib/utils";

type Admin = ReturnType<typeof createAdmin>;

export interface LaudoToolCtx {
  userId: string;
  orgId: string;
  admin: Admin;
  audit: AuditFn;
}

const SPECIALTY = REPORT_TYPES.ultrasound_abdominal;

export function createLaudoTools({ userId, orgId, admin, audit }: LaudoToolCtx) {
  return {
    searchClients: tool({
      description:
        "Busca clientes existentes da organização pelo nome. Sempre use antes de assumir que um cliente é novo.",
      inputSchema: z.object({
        query: z.string().describe("Trecho do nome do cliente a buscar"),
      }),
      execute: async ({ query }) => {
        const select = "id, name, client_vets(id, name)";
        const base = admin.from(TABLES.clients).select(select).eq("org_id", orgId).order("name");
        let { data } = await base.ilike("name", `%${query.trim()}%`).limit(10);
        let fellBack = false;
        if (!data || data.length === 0) {
          fellBack = true;
          ({ data } = await admin.from(TABLES.clients).select(select).eq("org_id", orgId).order("name").limit(50));
        }
        return {
          clients: (data ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            vets: (c.client_vets ?? []).map((v) => ({ id: v.id, name: v.name })),
          })),
          ...(fellBack && {
            note: "Nenhuma correspondência exata. Esta é a lista de clientes da organização — verifique se algum corresponde (considere erros de digitação/transposição) antes de oferecer cadastro de um novo.",
          }),
        };
      },
    }),

    createClient: tool({
      description:
        "Cria um novo cliente. Use apenas após confirmar com o usuário que o cliente não existe. Opcionalmente já cadastra o médico responsável.",
      inputSchema: z.object({
        name: z.string().describe("Nome do cliente/clínica"),
        vetName: z.string().optional().describe("Nome do médico responsável, se já souber"),
      }),
      execute: async ({ name, vetName }) => {
        const client = await findOrCreateClient(admin, userId, orgId, name.trim());
        await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.client, entityId: client.id });
        let vet: { id: string; name: string } | null = null;
        if (vetName?.trim()) {
          const created = await findOrCreateVet(admin, client.id, userId, orgId, vetName.trim());
          await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.client_vet, entityId: created.id });
          vet = { id: created.id, name: created.name };
        }
        return { clientId: client.id, clientName: client.name, vetId: vet?.id, vetName: vet?.name };
      },
    }),

    addVet: tool({
      description: "Adiciona um médico responsável a um cliente existente.",
      inputSchema: z.object({
        clientId: z.string().describe("ID do cliente retornado por searchClients/createClient"),
        name: z.string().describe("Nome do médico responsável"),
      }),
      execute: async ({ clientId, name }) => {
        const owned = await resolveOwnedFks(admin, orgId, { clientId });
        if (!owned.clientId) return { error: "Cliente não encontrado." };
        const vet = await findOrCreateVet(admin, owned.clientId, userId, orgId, name.trim());
        await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.client_vet, entityId: vet.id });
        return { vetId: vet.id, vetName: vet.name };
      },
    }),

    searchPets: tool({
      description:
        "Busca pacientes existentes da organização pelo nome. Sempre use antes de assumir que o paciente é novo. Se encontrar, mostre os dados ao usuário e reutilize o petId.",
      inputSchema: z.object({
        query: z.string().describe("Trecho do nome do paciente a buscar"),
      }),
      execute: async ({ query }) => {
        const select = "id, name, species, breed, age, sex, neutered, owner_name";
        let { data } = await admin
          .from(TABLES.pets)
          .select(select)
          .eq("org_id", orgId)
          .ilike("name", `%${query.trim()}%`)
          .order("name")
          .limit(10);
        let fellBack = false;
        if (!data || data.length === 0) {
          fellBack = true;
          ({ data } = await admin.from(TABLES.pets).select(select).eq("org_id", orgId).order("name").limit(50));
        }
        return {
          pets: (data ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            age: p.age,
            sex: p.sex,
            neutered: p.neutered,
            ownerName: p.owner_name,
          })),
          ...(fellBack && {
            note: "Nenhuma correspondência exata. Esta é a lista de pacientes da organização — verifique se algum corresponde (considere erros de digitação) antes de criar um novo.",
          }),
        };
      },
    }),

    listReports: tool({
      description:
        "Lista os laudos já gerados pela organização (mais recentes primeiro). Use quando o usuário perguntar sobre laudos existentes, anteriores ou o histórico.",
      inputSchema: z.object({
        query: z.string().optional().describe("Trecho do nome do paciente ou do cliente para filtrar"),
        limit: z.number().int().min(1).max(20).optional().describe("Quantos laudos retornar (padrão 10)"),
      }),
      execute: async ({ query, limit }) => {
        let q = admin
          .from(TABLES.reports)
          .select("id, patient_name, client_name, responsible_vet, specialty, status, exam_date, created_at")
          .eq("org_id", orgId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(limit ?? 10);
        const term = query
          ?.trim()
          .replace(/[%_,()*\\]/g, " ")
          .trim();
        if (term) {
          q = q.or(`patient_name.ilike.%${term}%,client_name.ilike.%${term}%`);
        }
        const { data } = await q;
        return {
          reports: (data ?? []).map((r) => ({
            id: r.id,
            patient: r.patient_name,
            client: r.client_name,
            vet: r.responsible_vet,
            type: r.specialty,
            status: r.status,
            examDate: r.exam_date,
            createdAt: r.created_at,
          })),
        };
      },
    }),

    getReport: tool({
      description:
        "Busca o conteúdo completo de um laudo da organização pelo id. Use quando o usuário quiser discutir, revisar ou tirar dúvidas sobre um laudo específico. Obtenha o id via listReports ou da mensagem do usuário.",
      inputSchema: z.object({
        reportId: z.string().describe("ID do laudo"),
      }),
      execute: async ({ reportId }) => {
        const { data } = await admin
          .from(TABLES.reports)
          .select(
            "id, patient_name, species, breed, age, sex, neutered, owner_name, client_name, responsible_vet, exam_date, status, edited_content",
          )
          .eq("org_id", orgId)
          .eq("id", reportId.trim())
          .is("deleted_at", null)
          .maybeSingle();
        if (!data) return { error: "Laudo não encontrado." };
        if (data.status !== REPORT_STATUSES.completed || !data.edited_content) {
          return { error: `Laudo ainda não está concluído (status: ${data.status}).` };
        }
        let content;
        try {
          content = parseReportContent(data.edited_content);
        } catch {
          return { error: "Conteúdo do laudo inválido." };
        }
        return {
          id: data.id,
          patient: data.patient_name,
          species: data.species,
          breed: data.breed,
          age: data.age,
          sex: data.sex,
          neutered: data.neutered,
          owner: data.owner_name,
          client: data.client_name,
          vet: data.responsible_vet,
          examDate: data.exam_date,
          content,
        };
      },
    }),

    createReportDraft: tool({
      description:
        "Cria o laudo e inicia a geração. Chame apenas quando tiver cliente, médico responsável, todos os dados do paciente e os achados do exame. Retorna o reportId para o upload das imagens.",
      inputSchema: z.object({
        rawInput: z
          .string()
          .describe(
            "Texto combinado dos achados: medidas e nomes de órgãos extraídos das imagens (apenas os legíveis ou confirmados pelo usuário) somados às alterações descritas pelo usuário. Nunca inclua medidas inventadas.",
          ),
        patientName: z.string(),
        species: z.enum(["Canina", "Felina"]),
        breed: z.string(),
        age: z.string().describe("ex: 3 anos"),
        sex: z.enum(["M", "F"]).describe("M para macho, F para fêmea"),
        neutered: z.boolean(),
        ownerName: z.string().describe("Nome do tutor do paciente"),
        clientName: z.string().describe("Nome do cliente/clínica"),
        responsibleVet: z.string().describe("Nome do médico responsável"),
        examDate: z.string().optional().describe("Data do exame (YYYY-MM-DD). Padrão: hoje."),
        petId: z.string().optional(),
        clientId: z.string().optional(),
        vetId: z.string().optional(),
      }),
      execute: async (input) => {
        const result = await createReport(
          admin,
          { userId, orgId, audit },
          { ...input, specialty: SPECIALTY, examDate: input.examDate?.trim() || brazilToday() },
        );
        if ("error" in result) return { error: result.error };
        return { reportId: result.reportId };
      },
    }),
  };
}
