import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/auth";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return <ResetPasswordForm />;
}
