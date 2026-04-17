import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Laudo } from "@/types";
import LaudoDetail from "./LaudoDetail";

const BUCKET = "laudo-images";

function getLaudoData(id: string, userId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdmin();
      const [{ data: laudo }, { data: rawImages }] = await Promise.all([
        admin.from("laudos").select("*").eq("id", id).eq("user_id", userId).is("deleted_at", null).single(),
        admin.from("laudo_images").select("*").eq("laudo_id", id).eq("user_id", userId).order("created_at", { ascending: true }),
      ]);

      const images = (
        await Promise.all(
          (rawImages ?? []).map(async (img) => {
            const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, 7200);
            if (!data) return null;
            return { id: img.id, file_name: img.file_name, url: data.signedUrl };
          })
        )
      ).filter((img): img is { id: string; file_name: string; url: string } => img !== null);

      return { laudo, images };
    },
    [`laudo-${id}-${userId}`],
    { tags: [`laudo-${id}`], revalidate: 7200 }
  )();
}

export default async function LaudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { laudo, images } = await getLaudoData(id, user.id);
  if (!laudo) notFound();

  return <LaudoDetail laudo={laudo as Laudo} images={images} />;
}
