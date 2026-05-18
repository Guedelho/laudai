import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { withApiHandler } from "@/lib/api-handler";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

const USER_BUCKETS = ["report-images", "report-pdfs", "profile-logos"] as const;

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

export const DELETE = withApiHandler({}, async ({ userId }) => {
  const admin = createAdmin();

  await Promise.all(USER_BUCKETS.map((b) => clearUserBucket(admin, b, userId)));

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    logError("Auth deleteUser failed", error, { userId });
    return NextResponse.json({ error: "Erro ao excluir conta." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
});
