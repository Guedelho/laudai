import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewLaudoForm from "./NewLaudoForm";

export default async function NewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <NewLaudoForm />;
}
