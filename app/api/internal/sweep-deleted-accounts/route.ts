import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { logError, logInfo } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

const USER_BUCKETS = [STORAGE_BUCKETS.reportImages, STORAGE_BUCKETS.reportPdfs, STORAGE_BUCKETS.profileLogos] as const;
const RETENTION_DAYS = 30;
const PAGE = 1000;

function bearerOk(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function clearUserBucket(admin: Admin, bucket: string, userId: string): Promise<boolean> {
  const paths: string[] = [];
  let ok = true;

  async function walk(prefix: string): Promise<void> {
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: PAGE, offset });
      if (error) {
        ok = false;
        return;
      }
      if (!data || data.length === 0) return;
      for (const entry of data) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.id === null) await walk(fullPath);
        else paths.push(fullPath);
      }
      if (data.length < PAGE) return;
    }
  }

  await walk(userId);
  if (paths.length === 0) return ok;

  const { error } = await admin.storage.from(bucket).remove(paths);
  if (error) {
    logError("Storage cleanup failed", error, { bucket, userId });
    return false;
  }
  return ok;
}

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdmin();

  const { data: dueProfiles, error } = await admin
    .from(TABLES.profiles)
    .select("id")
    .not("deletion_scheduled_at", "is", null)
    .lt("deletion_scheduled_at", cutoff);

  if (error) {
    logError("Sweep deleted accounts read failed", error);
    return NextResponse.json({ error: "Sweep failed." }, { status: 500 });
  }

  const ids = (dueProfiles ?? []).map((p) => p.id);
  let purged = 0;
  let storageFailures = 0;

  for (const userId of ids) {
    const cleared = await Promise.all(USER_BUCKETS.map((b) => clearUserBucket(admin, b, userId)));
    if (cleared.some((ok) => !ok)) {
      storageFailures += 1;
      logError("LGPD sweep: storage purge incomplete", null, { userId });
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      logError("Auth deleteUser failed in sweep", deleteError, { userId });
      continue;
    }
    // deleteUser cascades audit_log rows, so the LGPD deletion trail must live in
    // the log drain — it outlives the DB record.
    logInfo("LGPD sweep purged account", { userId, retentionDays: RETENTION_DAYS });
    purged += 1;
  }

  return NextResponse.json({ scanned: ids.length, purged, storageFailures });
}
