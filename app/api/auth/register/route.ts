import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { email, password, name, crmv, cpf, inviteCode } = await req.json();

  const registrationSecret = process.env.REGISTRATION_SECRET;
  if (registrationSecret && inviteCode !== registrationSecret) {
    return NextResponse.json({ error: "Código de convite inválido" }, { status: 403 });
  }

  if (!email || !password || !name || !crmv || !cpf) {
    return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name },
    email_confirm: true,
  });

  if (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erro ao criar conta. Verifique os dados." }, { status: 400 });
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: data.user.id, full_name: name, crmv, cpf });

  if (profileError) {
    // User was created but profile failed — still allow login, profile can be fixed later
    console.error("Profile insert error:", profileError.message);
  }

  return NextResponse.json({ user: data.user });
}
