import { tool } from "ai";
import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdmin } from "@/lib/supabase/admin";
import { runGeneration } from "@/lib/report/worker";
import {
  canWriteReport,
  findOrCreateClient,
  findOrCreateVet,
  findOrCreatePet,
  hasReportTypeAccess,
  resolveOwnedFks,
} from "@/lib/supabase/db";
import { REPORT_TYPES, TABLES } from "@/shared/constants";
import { REPORT_STATUSES } from "@/shared/models";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditAction, type AuditEntity } from "@/lib/audit";

type Admin = ReturnType<typeof createAdmin>;

export interface LaudoToolCtx {
  userId: string;
  orgId: string;
  admin: Admin;
  audit: (args: {
    action: AuditAction;
    entityType: AuditEntity;
    entityId: string;
    changes?: Record<string, unknown> | null;
  }) => Promise<void>;
}

const SPECIALTY = REPORT_TYPES.ultrasound_abdominal;
const today = () => new Date().toISOString().slice(0, 10);

export function createLaudoTools({ userId, orgId, admin, audit }: LaudoToolCtx) {
  return {
    searchClients: tool({
      description:
        "Busca clientes existentes da organização pelo nome. Sempre use antes de assumir que um cliente é novo.",
      inputSchema: z.object({
        query: z.string().describe("Trecho do nome do cliente a buscar"),
      }),
      execute: async ({ query }) => {
        const { data } = await admin
          .from(TABLES.clients)
          .select("id, name, client_vets(id, name)")
          .eq("org_id", orgId)
          .ilike("name", `%${query.trim()}%`)
          .order("name")
          .limit(10);
        return {
          clients: (data ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            vets: (c.client_vets ?? []).map((v) => ({ id: v.id, name: v.name })),
          })),
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
        const { data } = await admin
          .from(TABLES.pets)
          .select("id, name, species, breed, age, sex, neutered, owner_name")
          .eq("org_id", orgId)
          .ilike("name", `%${query.trim()}%`)
          .order("name")
          .limit(10);
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
        };
      },
    }),

    createReportDraft: tool({
      description:
        "Cria o laudo e inicia a geração. Chame apenas quando tiver cliente, médico responsável, todos os dados do paciente e os achados do exame. Retorna o reportId para o upload das imagens.",
      inputSchema: z.object({
        rawInput: z.string().describe("Achados do exame (até 2000 caracteres). Pode ser vazio para laudo normal."),
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
        const examDate = input.examDate?.trim() || today();
        const required: [string, string][] = [
          [input.patientName, "Nome do paciente"],
          [input.ownerName, "Nome do tutor"],
          [input.breed, "Raça"],
          [input.age, "Idade"],
          [input.clientName, "Nome do cliente"],
          [input.responsibleVet, "Médico responsável"],
        ];
        for (const [value, label] of required) {
          if (!value?.trim()) return { error: `${label} é obrigatório(a).` };
        }
        if (input.rawInput.length > 2_000) {
          return { error: "Achados do exame muito longos. Máximo 2.000 caracteres." };
        }
        if (!(await hasReportTypeAccess(admin, orgId, SPECIALTY))) {
          return { error: "Sua organização não tem acesso a este tipo de laudo." };
        }
        if (!(await canWriteReport(admin, orgId, userId, SPECIALTY))) {
          return { error: "Você não tem permissão para gerar este tipo de laudo." };
        }

        const ownedFks = await resolveOwnedFks(admin, orgId, {
          petId: input.petId,
          clientId: input.clientId,
          vetId: input.vetId,
        });

        let resolvedPetId: string | null = ownedFks.petId;
        if (!resolvedPetId) {
          const pet = await findOrCreatePet(admin, userId, orgId, input.patientName.trim(), input.ownerName.trim(), {
            species: input.species,
            breed: input.breed,
            age: input.age,
            sex: input.sex,
            neutered: input.neutered,
          });
          resolvedPetId = pet?.id ?? null;
        }

        const { data: report, error } = await admin
          .from(TABLES.reports)
          .insert({
            user_id: userId,
            org_id: orgId,
            status: REPORT_STATUSES.pending,
            specialty: SPECIALTY,
            patient_name: input.patientName,
            species: input.species,
            breed: input.breed,
            age: input.age,
            owner_name: input.ownerName,
            raw_input: input.rawInput,
            sex: input.sex,
            neutered: input.neutered,
            client_name: input.clientName,
            responsible_vet: input.responsibleVet,
            exam_date: examDate,
            pet_id: resolvedPetId,
            client_id: ownedFks.clientId,
            vet_id: ownedFks.vetId,
          })
          .select("id")
          .single();

        if (error) return { error: "Erro ao salvar laudo." };

        revalidatePath("/dashboard");
        await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.report, entityId: report.id });

        after(() =>
          runGeneration(admin, report.id, userId, {
            rawInput: input.rawInput,
            patientName: input.patientName,
            species: input.species,
            breed: input.breed,
            age: input.age,
            sex: input.sex,
            neutered: input.neutered,
            ownerName: input.ownerName,
          }),
        );

        return { reportId: report.id };
      },
    }),
  };
}
