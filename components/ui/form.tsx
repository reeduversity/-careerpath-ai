import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <label className="space-y-2 block text-sm text-slate-300" htmlFor={htmlFor}>
      <span className="font-medium text-slate-100">{label}</span>
      {children}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20",
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-3 text-sm text-slate-300">
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500",
          className
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-300 transition hover:border-sky-400">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="h-4 w-4 rounded-full border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
