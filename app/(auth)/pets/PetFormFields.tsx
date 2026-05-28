"use client";

import { SPECIES_OPTIONS, SEX_OPTIONS } from "@/shared/constants";
import Typeahead from "@/components/Typeahead";
import { inputCls } from "@/lib/ui";

export type PetFormValues = {
  name: string;
  owner_name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
};

export default function PetFormFields({
  values,
  onChange,
  breedSuggestions,
}: {
  values: PetFormValues;
  onChange: <K extends keyof PetFormValues>(field: K, value: PetFormValues[K]) => void;
  breedSuggestions: string[];
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome do animal</label>
          <input value={values.name} onChange={(e) => onChange("name", e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Responsável</label>
          <input
            value={values.owner_name}
            onChange={(e) => onChange("owner_name", e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Espécie</label>
          <select
            value={values.species}
            onChange={(e) => onChange("species", e.target.value)}
            aria-label="Espécie"
            className={inputCls}
          >
            {SPECIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sexo</label>
          <select
            value={values.sex}
            onChange={(e) => onChange("sex", e.target.value)}
            aria-label="Sexo"
            className={inputCls}
          >
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Raça</label>
          <Typeahead
            value={values.breed}
            onChange={(v) => onChange("breed", v)}
            suggestions={breedSuggestions}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Idade</label>
          <input
            value={values.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="ex: 3 anos"
            className={inputCls}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.neutered}
          onChange={(e) => onChange("neutered", e.target.checked)}
          className="rounded border-gray-300"
        />
        Castrado(a)
      </label>
    </>
  );
}
