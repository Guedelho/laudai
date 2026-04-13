"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SIGNATURE_FONTS = [
  { key: "sacramento",     label: "Sacramento",     css: "'Sacramento', cursive" },
  { key: "pinyon-script",  label: "Pinyon Script",  css: "'Pinyon Script', cursive" },
  { key: "alex-brush",     label: "Alex Brush",     css: "'Alex Brush', cursive" },
  { key: "homemade-apple", label: "Homemade Apple", css: "'Homemade Apple', cursive" },
];

export default function ProfileForm({
  initialFullName,
  initialCrmv,
  initialCpf,
  hasLogo,
  initialSignatureFont,
  initialCrmvState,
  initialEmail,
}: {
  initialFullName: string;
  initialCrmv: string;
  initialCpf: string;
  hasLogo: boolean;
  initialSignatureFont: string;
  initialCrmvState: string;
  initialEmail: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [cpf, setCpf] = useState(initialCpf);
  const crmv = initialCrmv;
  const crmvState = initialCrmvState;
  const [logoVersion, setLogoVersion] = useState(() => hasLogo ? Date.now() : 0);
  const [signatureFont, setSignatureFont] = useState(initialSignatureFont);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    const id = "google-signature-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Sacramento&family=Pinyon+Script&family=Alex+Brush&family=Homemade+Apple&display=swap";
      document.head.appendChild(link);
    }
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/profile/logo", {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar logo");
      // Increment version to cache-bust the proxy URL
      setLogoVersion(Date.now());
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFontSelect(fontKey: string) {
    const next = signatureFont === fontKey ? "" : fontKey;
    setSignatureFont(next);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName, cpf, signature_font: next }),
      });
    } catch {
      // non-critical, silent fail
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName, crmv, cpf, crmv_state: crmvState, signature_font: signatureFont }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      setSaved(true);
      setSaveError("");
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch {
      setSaveError("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const logoSrc = logoVersion ? `/api/profile/logo?v=${logoVersion}` : null;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo do laudo</label>
        <div className="flex flex-col gap-3">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className="max-h-48 w-full object-contain rounded border border-gray-200 bg-gray-50 p-2" />
          ) : (
            <div className="h-48 w-full rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
              Sem logo
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={logoUploading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 text-left"
          >
            {logoUploading ? "Enviando..." : logoSrc ? "Alterar" : "Enviar logo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
        <p className="mt-1 text-xs text-gray-400">JPEG ou PNG · máx. 5 MB</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dra. Tatiana Brasil"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CRMV</label>
          <p className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
            {crmvState ? `CRMV-${crmvState} ${crmv}` : crmv || "—"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
            {initialEmail || "—"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura no laudo</label>
          <div className="flex flex-col gap-2">
            {SIGNATURE_FONTS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFontSelect(f.key)}
                className={`rounded-lg border px-3 py-4 text-left transition-colors ${
                  signatureFont === f.key
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                <div style={{ fontFamily: f.css, fontSize: 26, lineHeight: 1.8 }}>
                  {fullName || "Seu Nome"}
                </div>
              </button>
            ))}
          </div>
          {signatureFont && (
            <button
              type="button"
              onClick={() => handleFontSelect(signatureFont)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Remover assinatura
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {saved && <span className="text-sm text-green-600">Salvo com sucesso!</span>}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        </div>
      </form>
    </div>
  );
}
