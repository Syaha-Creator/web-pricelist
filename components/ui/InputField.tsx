import { InputHTMLAttributes, type ReactNode } from "react";

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  prefixIcon?: ReactNode;
  suffixElement?: ReactNode;
  error?: boolean;
  ariaDescribedBy?: string;
}

export default function InputField({
  id,
  label,
  prefixIcon,
  suffixElement,
  error,
  ariaDescribedBy,
  ...inputProps
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        {prefixIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {prefixIcon}
          </div>
        )}
        <input
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error}
          className={`block w-full rounded-lg border border-slate-300 bg-white py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
            prefixIcon ? "pl-11" : "pl-4"
          } ${suffixElement ? "pr-12" : "pr-4"}`}
          {...inputProps}
        />
        {suffixElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
            {suffixElement}
          </div>
        )}
      </div>
    </div>
  );
}
