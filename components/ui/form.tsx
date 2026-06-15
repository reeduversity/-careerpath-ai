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
        props.type === 'number' ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" : undefined,
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

interface TypeaheadInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}

export function TypeaheadInput({ id, value, onChange, options, placeholder, error, onBlur }: TypeaheadInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filteredOptions, setFilteredOptions] = React.useState<string[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Normalize helper
  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  React.useEffect(() => {
    if (!value) {
      setFilteredOptions(options);
      return;
    }
    const normalizedValue = normalize(value);
    
    // Exact or starts-with match
    const exactMatches = options.filter(opt => normalize(opt).startsWith(normalizedValue));
    
    // Fuzzy matching (includes)
    const fuzzyMatches = options.filter(opt => 
      normalize(opt).includes(normalizedValue) && !exactMatches.includes(opt)
    );
    
    setFilteredOptions([...exactMatches, ...fuzzyMatches]);
  }, [value, options]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        id={id}
        type="text"
        className={cn(
          "w-full rounded-2xl border bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition",
          error ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
        )}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-lg p-1">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {isOpen && value && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
          No matches found.
        </div>
      )}
    </div>
  );
}
