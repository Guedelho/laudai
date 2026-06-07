"use client";

import { useId } from "react";
import { formatCpf } from "@/lib/cpf";
import { CRMV_STATE_OPTIONS } from "@/shared/constants";
import { inputCls } from "@/lib/ui";
import type { FieldErrors } from "@/lib/account";

export default function CpfCrmvFields({
  cpf,
  setCpf,
  crmvState,
  setCrmvState,
  crmv,
  setCrmv,
  errors,
}: {
  cpf: string;
  setCpf: (v: string) => void;
  crmvState: string;
  setCrmvState: (v: string) => void;
  crmv: string;
  setCrmv: (v: string) => void;
  errors: FieldErrors;
}) {
  const cpfId = useId();
  const crmvStateId = useId();
  const crmvId = useId();

  return (
    <>
      <div>
        <label htmlFor={cpfId} className="block text-sm font-medium text-gray-700 mb-1">
          CPF
        </label>
        <input
          id={cpfId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          className={inputCls}
          placeholder="000.000.000-00"
          aria-invalid={!!errors.cpf}
          aria-describedby={errors.cpf ? `${cpfId}-error` : undefined}
          required
        />
        {errors.cpf && (
          <p id={`${cpfId}-error`} role="alert" className="mt-1 text-xs text-red-600">
            {errors.cpf}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="w-28">
          <label htmlFor={crmvStateId} className="block text-sm font-medium text-gray-700 mb-1">
            UF
          </label>
          <select
            id={crmvStateId}
            value={crmvState}
            onChange={(e) => setCrmvState(e.target.value)}
            className={inputCls}
            aria-invalid={!!errors.crmv_state}
            aria-describedby={errors.crmv_state ? `${crmvStateId}-error` : undefined}
            required
          >
            <option value="">—</option>
            {CRMV_STATE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.value}
              </option>
            ))}
          </select>
          {errors.crmv_state && (
            <p id={`${crmvStateId}-error`} role="alert" className="mt-1 text-xs text-red-600">
              {errors.crmv_state}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor={crmvId} className="block text-sm font-medium text-gray-700 mb-1">
            CRMV
          </label>
          <input
            id={crmvId}
            type="text"
            inputMode="numeric"
            value={crmv}
            onChange={(e) => setCrmv(e.target.value)}
            className={inputCls}
            placeholder="00000"
            aria-invalid={!!errors.crmv}
            aria-describedby={errors.crmv ? `${crmvId}-error` : undefined}
            required
          />
          {errors.crmv && (
            <p id={`${crmvId}-error`} role="alert" className="mt-1 text-xs text-red-600">
              {errors.crmv}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
