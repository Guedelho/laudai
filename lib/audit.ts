import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

export const AUDIT_ACTIONS = {
  create: "create",
  update: "update",
  delete: "delete",
} as const;

export const AUDIT_ENTITIES = {
  pet: "pet",
  clinic: "clinic",
  clinic_vet: "clinic_vet",
  report: "report",
  report_image: "report_image",
  profile: "profile",
  organization_member: "organization_member",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditEntity = (typeof AUDIT_ENTITIES)[keyof typeof AUDIT_ENTITIES];

interface LogAuditArgs {
  orgId: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  changes?: Record<string, unknown> | null;
}

export async function logAudit(admin: Admin, args: LogAuditArgs): Promise<void> {
  const { error } = await admin.from(TABLES.audit_log).insert({
    org_id: args.orgId,
    user_id: args.userId,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId,
    changes: args.changes ?? null,
  });

  if (error) logError("Audit log insert failed", error, { ...args, changes: undefined });
}
