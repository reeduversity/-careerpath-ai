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
    <label className="space-y-2.5 block text-sm text-slate-300 relative group" htmlFor={htmlFor}>
      <span className="font-semibold tracking-wide text-slate-200 group-focus-within:text-sky-400 transition-colors">{label}</span>
      {children}
      {error ? <p className="text-xs font-medium text-rose-400 absolute -bottom-5 left-0">{error}</p> : null}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-md px-4 py-3.5 text-sm text-slate-100 outline-none transition-all duration-300 hover:border-slate-500/60 hover:bg-slate-900/60 focus:border-sky-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-sky-500/10 shadow-inner placeholder:text-slate-500",
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
        "w-full rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-md px-4 py-3.5 text-sm text-slate-100 outline-none transition-all duration-300 hover:border-slate-500/60 hover:bg-slate-900/60 focus:border-sky-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-sky-500/10 shadow-inner appearance-none",
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
    <label className="inline-flex items-center gap-3 text-sm text-slate-300 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-600 bg-slate-900/50 transition-all checked:border-sky-500 checked:bg-sky-500 hover:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20",
            className
          )}
          {...props}
        />
        <span className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.667 3.5L5.25 9.917l-2.917-2.917"/></svg>
        </span>
      </div>
      <span className="group-hover:text-slate-100 transition-colors">{label}</span>
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

export function RadioGroup({ name, options, value, onChange, ...props }: RadioGroupProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label key={option.value} className={cn("inline-flex items-center gap-4 rounded-2xl border bg-slate-900/40 backdrop-blur-sm px-5 py-4 text-sm transition-all duration-300 cursor-pointer hover:bg-slate-800/60 shadow-sm", value === option.value ? "border-sky-500 bg-sky-950/20 text-sky-100" : "border-slate-700/60 text-slate-300 hover:border-slate-500")}>
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-slate-600 bg-slate-900 transition-all checked:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/20"
              {...(props as any)}
            />
            <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-sky-500 opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
          <span className="font-medium">{option.label}</span>
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

  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  React.useEffect(() => {
    if (!value) {
      setFilteredOptions(options);
      return;
    }
    const normalizedValue = normalize(value);
    
    const exactMatches = options.filter(opt => normalize(opt).startsWith(normalizedValue));
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
          "w-full rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-md px-4 py-3.5 text-sm text-slate-100 outline-none transition-all duration-300 hover:border-slate-500/60 hover:bg-slate-900/60 focus:bg-slate-900/80 shadow-inner placeholder:text-slate-500",
          error ? "border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" : "focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
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
        <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 custom-scrollbar">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="cursor-pointer rounded-xl px-4 py-2.5 text-sm text-slate-300 font-medium hover:bg-sky-500/20 hover:text-sky-300 transition-colors"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {isOpen && value && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl p-4 text-sm text-slate-400 shadow-2xl text-center">
          No matches found.
        </div>
      )}
    </div>
  );
}
