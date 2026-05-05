import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";

async function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<header className="bg-white border-b border-gray-200 h-16" />}>
        <AppHeader />
      </Suspense>
      <Suspense fallback={null}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}
