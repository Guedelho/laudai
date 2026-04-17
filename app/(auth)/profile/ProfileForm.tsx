"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/supabase/client";

function validateCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(digits[10]);
}

const SIGNATURE_FONTS = [
  { key: "sacramento", label: "Sacramento", css: "'Sacramento', cursive" },
  { key: "pinyon-script", label: "Pinyon Script", css: "'Pinyon Script', cursive" },
  { key: "alex-brush", label: "Alex Brush", css: "'Alex Brush', cursive" },
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
  hasSignatureImage,
}: {
  initialFullName: string;
  initialCrmv: string;
  initialCpf: string;
  hasLogo: boolean;
  initialSignatureFont: string;
  initialCrmvState: string;
  initialEmail: string;
  hasSignatureImage: boolean;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [cpf, setCpf] = useState(initialCpf);
  const crmv = initialCrmv;
  const crmvState = initialCrmvState;
  const [logoVersion, setLogoVersion] = useState(() => (hasLogo ? Date.now() : 0));
  const [sigVersion, setSigVersion] = useState(() => (hasSignatureImage ? Date.now() : 0));
  const [signatureFont, setSignatureFont] = useState(initialSignatureFont);
  const [cpfError, setCpfError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [sigUploading, setSigUploading] = useState(false);
  const [sigError, setSigError] = useState("");
  const fontAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const id = "google-signature-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Sacramento&family=Pinyon+Script&family=Alex+Brush&family=Homemade+Apple&display=swap";
      document.head.appendChild(link);
    }
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoError("");
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/profile/logo", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar logo");
      setLogoVersion(Date.now());
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSignatureImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSigUploading(true);
    setSigError("");
    try {
      const formData = new FormData();
      formData.append("signature", file);

      const res = await fetch("/api/profile/signature", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar assinatura");
      setSigVersion(Date.now());
      setSignatureFont("");
    } catch (err) {
      setSigError(err instanceof Error ? err.message : "Erro ao enviar assinatura");
    } finally {
      setSigUploading(false);
      if (sigInputRef.current) sigInputRef.current.value = "";
    }
  }

  async function handleRemoveSignatureImage() {
    setSigError("");
    try {
      const res = await fetch("/api/profile/signature", {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setSigVersion(0);
    } catch {
      setSigError("Erro ao remover assinatura.");
    }
  }

  async function handleFontSelect(fontKey: string) {
    const next = signatureFont === fontKey ? "" : fontKey;
    setSignatureFont(next);
    setSigVersion(0);
    fontAbortRef.current?.abort();
    const controller = new AbortController();
    fontAbortRef.current = controller;
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ full_name: fullName, cpf, signature_font: next, signature_image_url: null }),
        signal: controller.signal,
      });
      if (res.ok && next !== "") {
        // Eagerly remove stored signature image path from DB — already done server-side,
        // but also delete the file preview locally
      }
    } catch {
      // non-critical, silent fail (includes aborted requests)
    }
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    const formatted = raw
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(formatted);
    if (cpfError) setCpfError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    if (!cpf.replace(/\D/g, "")) {
      setCpfError("CPF é obrigatório.");
      setSaving(false);
      return;
    }
    if (!validateCpf(cpf)) {
      setCpfError("CPF inválido.");
      setSaving(false);
      return;
    }
    setCpfError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
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
  const sigSrc = sigVersion ? `/api/profile/signature?v=${sigVersion}` : null;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo do laudo</label>
        <div className="flex flex-col gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Logo"
              className="max-h-48 w-full object-contain rounded border border-gray-200 bg-gray-50 p-2"
            />
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
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
          {initialCpf ? (
            <>
              <p className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50">
                {cpf}
              </p>
              <p className="mt-1 text-xs text-gray-400">Não é possível alterar o CPF após o primeiro cadastro.</p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
              />
              {cpfError && <p className="mt-1 text-xs text-red-600">{cpfError}</p>}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura no laudo</label>

          {/* Signature image upload */}
          <div className="mb-3 p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
            <p className="text-xs font-medium text-gray-600">Imagem da assinatura</p>
            {sigSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sigSrc}
                alt="Assinatura"
                className="max-h-20 object-contain rounded bg-white border border-gray-200 p-1"
              />
            ) : (
              <p className="text-xs text-gray-400 italic">Sem imagem</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => sigInputRef.current?.click()}
                disabled={sigUploading}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {sigUploading ? "Enviando..." : sigSrc ? "Alterar imagem" : "Enviar imagem"}
              </button>
              {sigSrc && (
                <button
                  type="button"
                  onClick={handleRemoveSignatureImage}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Remover
                </button>
              )}
            </div>
            <input
              ref={sigInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureImageChange}
            />
            {sigError && <p className="text-xs text-red-600">{sigError}</p>}
            <p className="text-xs text-gray-400">
              JPEG ou PNG · máx. 5 MB · selecionar imagem remove a fonte escolhida
            </p>
          </div>

          {/* Font selector */}
          <div className="flex flex-col gap-2">
            {SIGNATURE_FONTS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFontSelect(f.key)}
                className={`rounded-lg border px-3 py-4 text-left transition-colors ${
                  signatureFont === f.key && !sigSrc
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                <div style={{ fontFamily: f.css, fontSize: 26, lineHeight: 1.8 }}>{fullName || "Seu Nome"}</div>
              </button>
            ))}
          </div>
          {signatureFont && !sigSrc && (
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
