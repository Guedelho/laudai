import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createElement } from "react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require("@react-pdf/renderer");
import { getUserId } from "@/lib/gemini";
import { LaudoPDF } from "@/lib/laudoPdf";

const BUCKET = "laudo-images";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: laudo } = await admin
    .from("laudos")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!laudo) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const { data: rawImages } = await admin
    .from("laudo_images")
    .select("*")
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const images = (rawImages ?? []).map((img) => ({
    url: admin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
    file_name: img.file_name,
  }));

  const element = createElement(LaudoPDF, { content: laudo.generated_content, images });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(element as any);

  const filename = `laudo-${laudo.patient_name.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
