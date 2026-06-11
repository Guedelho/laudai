"use client";

import { useState, useRef, useEffect, useId } from "react";

interface TypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  ariaLabel?: string;
  id?: string;
}

export default function Typeahead({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  className,
  required,
  ariaLabel,
  id,
}: TypeaheadProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const base = id ?? reactId;
  const listboxId = `${base}-listbox`;
  const optionId = (i: number) => `${base}-opt-${i}`;

  const filtered = value
    ? suggestions.filter(
        (s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase(),
      )
    : suggestions;
  const visible = filtered.slice(0, 8);
  const showDropdown = open && focused && visible.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (active >= 0) document.getElementById(`${base}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, base]);

  function choose(s: string) {
    onChange(s);
    onSelect?.(s);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown) setOpen(true);
      else setActive((a) => Math.min(a + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      if (!showDropdown) return;
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (showDropdown && active >= 0 && active < visible.length) {
        e.preventDefault();
        choose(visible[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={showDropdown && active >= 0 && active < visible.length ? optionId(active) : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setOpen(true);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        aria-label={ariaLabel}
      />
      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {visible.map((s, i) => (
            <li key={s} id={optionId(i)} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`w-full text-left px-3 py-1.5 text-sm text-gray-700 ${
                  i === active ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
