import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>}
      <input
        className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-zinc-900 disabled:text-zinc-600 ${
          error ? 'border-red-500/60 focus:border-red-500' : 'border-zinc-700 focus:border-blue-500/60 hover:border-zinc-600'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</span>}
      <select
        className={`w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-100 transition-all duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:border-zinc-600 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
