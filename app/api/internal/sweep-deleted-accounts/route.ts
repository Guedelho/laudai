import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

const USER_BUCKETS = [STORAGE_BUCKETS.reportImages, STORAGE_BUCKETS.reportPdfs, STORAGE_BUCKETS.profileLogos] as const;
const RETENTION_DAYS = 30;

async function clearUserBucket(admin: Admin, bucket: string, userId: string): Promise<void> {
  const paths: string[] = [];

  async function walk(prefix: string): Promise<void> {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        await walk(fullPath);
      } else {
        paths.push(fullPath);
      }
    }
  }

  await walk(userId);
  if (paths.length === 0) return;

  const { error } = await admin.storage.from(bucket).remove(paths);
  if (error) logError("Storage cleanup failed", error, { bucket, userId });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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

  for (const userId of ids) {
    await Promise.all(USER_BUCKETS.map((b) => clearUserBucket(admin, b, userId)));
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      logError("Auth deleteUser failed in sweep", deleteError, { userId });
      continue;
    }
    purged += 1;
  }

  return NextResponse.json({ scanned: ids.length, purged });
}
