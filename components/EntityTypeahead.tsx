"use client";

import Typeahead from "./Typeahead";

interface EntityTypeaheadProps<T> {
  value: string;
  onChange: (value: string) => void;
  items: T[];
  getLabel: (item: T) => string;
  onPick: (item: T | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  ariaLabel?: string;
  id?: string;
}

export default function EntityTypeahead<T>({
  value,
  onChange,
  items,
  getLabel,
  onPick,
  placeholder,
  className,
  required,
  ariaLabel,
  id,
}: EntityTypeaheadProps<T>) {
  function findByLabel(label: string): T | null {
    const target = label.trim().toLowerCase();
    if (!target) return null;
    return items.find((i) => getLabel(i).toLowerCase() === target) ?? null;
  }

  return (
    <Typeahead
      value={value}
      onChange={(v) => {
        onChange(v);
        onPick(findByLabel(v));
      }}
      onSelect={(label) => onPick(findByLabel(label))}
      suggestions={items.map(getLabel)}
      placeholder={placeholder}
      className={className}
      required={required}
      ariaLabel={ariaLabel}
      id={id}
    />
  );
}
