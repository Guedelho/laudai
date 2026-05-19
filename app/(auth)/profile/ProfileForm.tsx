"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as profileApi from "@/lib/services/profile";
import { logout } from "@/app/actions/auth";

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
  initialSignature,
  initialCrmvState,
  initialEmail,
  hasSignatureImage,
}: {
  initialFullName: string;
  initialCrmv: string;
  initialCpf: string;
  hasLogo: boolean;
  initialSignatureFont: string;
  initialSignature: string;
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
  const [signature, setSignature] = useState(initialSignature);
  const [cpfError, setCpfError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [sigUploading, setSigUploading] = useState(false);
  const [sigError, setSigError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const fontAbortRef = useRef<AbortController | null>(null);

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await profileApi.deleteAccount();
      window.location.href = "/login";
    } catch {
      setDeleteError("Erro ao excluir conta. Tente novamente.");
      setDeleting(false);
    }
  }

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

      await profileApi.uploadLogo(file);
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
        { full_name: fullName, cpf, signature_font: next, signature, signature_image_url: null },
        controller.signal,
      );
      if (next !== "") {
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
      await profileApi.updateProfile({
        full_name: fullName,
        crmv,
        cpf,
        crmv_state: crmvState,
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
            <div className="h-48 w-full rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
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
        <p className="mt-1 text-xs text-gray-500">JPEG ou PNG · máx. 5 MB</p>
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
            <p className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">{cpf}</p>
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
              placeholder={fullName || "Seu Nome"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div style={{ fontFamily: f.css, fontSize: 26, lineHeight: 1.8 }}>{signature || fullName}</div>
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

        <p className="text-[11px] text-gray-500">
          CPF e CRMV são exigidos para emissão do laudo. Consulte nossa{" "}
          <Link href="/legal/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>{" "}
          para saber como tratamos esses dados.
        </p>
      </form>

      <div className="pt-6 border-t border-gray-200 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Privacidade</h2>
        <div className="flex flex-col gap-2">
          <a href={profileApi.exportDataUrl()} className="text-sm text-blue-600 hover:underline w-fit" download>
            Baixar meus dados (JSON)
          </a>
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-600 hover:underline w-fit"
            >
              Excluir minha conta
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
              <p className="text-xs text-red-900">
                Excluir a conta apaga permanentemente seu perfil, laudos, imagens e PDFs. Esta ação é irreversível.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Excluindo..." : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5"
                >
                  Cancelar
                </button>
              </div>
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-600">
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
