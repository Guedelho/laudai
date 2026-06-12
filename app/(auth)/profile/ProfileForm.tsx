"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sacramento, Pinyon_Script, Alex_Brush, Homemade_Apple } from "next/font/google";
import * as profileApi from "@/lib/services/profile";
import { btnPrimary, inputCls } from "@/lib/ui";
import { formatCpf } from "@/lib/cpf";

const sacramento = Sacramento({ weight: "400", subsets: ["latin"] });
const pinyonScript = Pinyon_Script({ weight: "400", subsets: ["latin"] });
const alexBrush = Alex_Brush({ weight: "400", subsets: ["latin"] });
const homemadeApple = Homemade_Apple({ weight: "400", subsets: ["latin"] });

const SIGNATURE_FONTS = [
  { key: "sacramento", label: "Sacramento", className: sacramento.className },
  { key: "pinyon-script", label: "Pinyon Script", className: pinyonScript.className },
  { key: "alex-brush", label: "Alex Brush", className: alexBrush.className },
  { key: "homemade-apple", label: "Homemade Apple", className: homemadeApple.className },
];

export default function ProfileForm({
  initialFullName,
  initialCrmv,
  initialCpf,
  initialSignatureFont,
  initialSignature,
  initialCrmvState,
  initialEmail,
  hasSignatureImage,
}: {
  initialFullName: string;
  initialCrmv: string;
  initialCpf: string;
  initialSignatureFont: string;
  initialSignature: string;
  initialCrmvState: string;
  initialEmail: string;
  hasSignatureImage: boolean;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const cpf = formatCpf(initialCpf);
  const crmv = initialCrmv;
  const crmvState = initialCrmvState;
  const [sigVersion, setSigVersion] = useState(() => (hasSignatureImage ? Date.now() : 0));
  const [signatureFont, setSignatureFont] = useState(initialSignatureFont);
  const [signature, setSignature] = useState(initialSignature);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [sigUploading, setSigUploading] = useState(false);
  const [sigError, setSigError] = useState("");
  const fontAbortRef = useRef<AbortController | null>(null);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSignatureImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSigUploading(true);
    setSigError("");
    try {
      await profileApi.uploadSignature(file);
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
      await profileApi.removeSignature();
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
      await profileApi.updateProfile(
        { full_name: fullName, signature_font: next, signature, signature_image_url: null },
        controller.signal,
      );
    } catch {
      // non-critical, silent fail (includes aborted requests)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await profileApi.updateProfile({
        full_name: fullName,
        signature_font: signatureFont,
        signature,
      });
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

  const sigSrc = sigVersion ? `/api/profile/image/signature?v=${sigVersion}` : null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder="Tatiana Brasil"
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
          <p className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">{cpf}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura no laudo</label>
          <p className="text-xs text-gray-500 mb-3">
            Escolha uma fonte manuscrita ou envie uma imagem da sua assinatura.
          </p>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Texto da assinatura</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder={fullName || "Seu nome"}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-2">
            {/* Font options */}
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
                <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                <div className={f.className} style={{ fontSize: 26, lineHeight: 1.8 }}>
                  {signature || fullName}
                </div>
              </button>
            ))}

            {/* Uploaded image option */}
            <button
              type="button"
              onClick={() => sigInputRef.current?.click()}
              disabled={sigUploading}
              className={`rounded-lg border px-3 py-4 text-left transition-colors ${
                sigSrc ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">Imagem personalizada</p>
              {sigSrc ? (
                <div className="flex items-center justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sigSrc} alt="Assinatura" className="max-h-16 object-contain" />
                  <span className="text-xs text-gray-500">Alterar</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {sigUploading ? "Enviando..." : "Enviar foto ou scan da assinatura"}
                </p>
              )}
            </button>
            <input
              ref={sigInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureImageChange}
            />
            {sigError && <p className="text-xs text-red-600">{sigError}</p>}
          </div>
          {(signatureFont || sigSrc) && (
            <button
              type="button"
              onClick={() => {
                if (sigSrc) handleRemoveSignatureImage();
                else handleFontSelect(signatureFont);
              }}
              className="mt-2 text-xs text-gray-500 hover:text-gray-600"
            >
              Remover assinatura
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {saved && <span className="text-sm text-green-600">Salvo com sucesso!</span>}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        </div>

        <p className="text-xs text-gray-500">
          CPF e CRMV são exigidos para emissão do laudo. Consulte nossa{" "}
          <Link href="/legal/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>{" "}
          para saber como tratamos esses dados.
        </p>
      </form>
    </div>
  );
}
