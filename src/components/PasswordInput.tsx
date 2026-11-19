"use client";

import { useState } from "react";

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required
        minLength={8}
        autoComplete={autoComplete}
        className="input pr-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 min-w-11 px-3 text-sm font-medium text-brand-navy"
      >
        {visible ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}
