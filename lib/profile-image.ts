import "server-only";

import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { SIGNED_URL_TTL, STORAGE_BUCKETS } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

/**
 * Stream a private profile-logos object through the API route instead of
 * redirecting to a short-lived signed URL — browsers cache redirects and the
 * cached target expires after SIGNED_URL_TTL.serverFetch seconds.
 */
export async function serveProfileImage(admin: Admin, storagePath: string | null): Promise<NextResponse> {
  if (!storagePath) return new NextResponse(null, { status: 404 });

  const { data: signed, error } = await admin.storage
    .from(STORAGE_BUCKETS.profileLogos)
    .createSignedUrl(storagePath, SIGNED_URL_TTL.serverFetch);
  if (error || !signed?.signedUrl) return new NextResponse(null, { status: 404 });

  const upstream = await fetch(signed.signedUrl);
  if (!upstream.ok) return new NextResponse(null, { status: 404 });

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600, must-revalidate",
    },
  });
}
