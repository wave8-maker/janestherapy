"use client";

/**
 * Field primitives shared by every wizard step.
 *
 * Autocomplete is switched off across the board: the studio tablet is passed
 * from client to client, and the browser would otherwise offer the previous
 * client's name and phone number as suggestions.
 */

export const inputCls =
  "w-full rounded-xl border border-brand-light bg-cream/60 px-4 py-3.5 text-[17px] text-bark placeholder:text-bark-light/50 transition-colors focus:outline-none focus:border-sage focus:bg-white focus:ring-[3px] focus:ring-sage/20";
export const labelCls = "block text-sm font-semibold text-bark";

export function Req() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function TextField({
  label,
  required,
  span2,
  ...inputProps
}: {
  label: string;
  required?: boolean;
  span2?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className={`${labelCls} mb-1.5`}>
        {label}
        {required && <Req />}
      </span>
      <input {...inputProps} autoComplete="off" aria-required={required} className={inputCls} />
    </label>
  );
}

export function TextArea({
  label,
  rows = 3,
  ...props
}: { label: string; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className={`${labelCls} mb-1.5`}>{label}</span>
      <textarea {...props} rows={rows} autoComplete="off" className={inputCls} />
    </label>
  );
}

export function YesNo({
  label,
  value,
  onChange,
  detailsPlaceholder,
  details,
  onDetailsChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  detailsPlaceholder: string;
  details: string;
  onDetailsChange: (v: string) => void;
}) {
  return (
    <div>
      <p className={labelCls}>
        {label}
        <Req />
      </p>
      <div className="mt-2 grid max-w-[16rem] grid-cols-2 rounded-full border border-brand-light bg-cream/70 p-1">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-full py-3 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
              value === v ? "bg-sage text-white shadow-sm" : "text-bark-light hover:text-bark"
            }`}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {value === true && (
        <div className="mt-3 border-l-2 border-sage/50 pl-4">
          <textarea
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            placeholder={detailsPlaceholder}
            rows={3}
            autoComplete="off"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}

export function RadioCards({
  label,
  name,
  options,
  value,
  onChange,
  required = true,
}: {
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelCls}>
        {label}
        {required && <Req />}
      </legend>
      <div className="mt-2.5 space-y-2.5">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
                selected
                  ? "border-sage/60 bg-sage/[0.07]"
                  : "border-brand-light hover:border-brand/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selected ? "border-sage" : "border-brand-light"
                }`}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-sage" />}
              </span>
              <span className="text-[15px] leading-snug text-bark">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Pill-shaped multi-select, used wherever "select all that apply" reads better than a list. */
export function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`cursor-pointer rounded-full border px-4 py-3 text-[15px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
              on
                ? "border-sage bg-sage text-white"
                : "border-brand-light text-bark-light hover:border-brand/50 hover:text-bark"
            }`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(opt)}
              className="sr-only"
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export function CheckBox({
  checked,
  onChange,
  children,
  emphasis,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sage/40 ${
        checked
          ? "border-sage/60 bg-sage/[0.07]"
          : emphasis
            ? "border-brand/50 bg-brand-light/30"
            : "border-brand-light hover:border-brand/40"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.4rem] border-2 transition-colors ${
          checked ? "border-sage bg-sage" : "border-brand-light bg-white"
        }`}
      >
        <svg
          viewBox="0 0 12 10"
          className={`h-3 w-3 transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
        >
          <path
            d="M1 5.2 4.2 8.4 11 1.6"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[15px] leading-snug text-bark">{children}</span>
    </label>
  );
}

export function StepHeading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-display text-2xl text-bark sm:text-[1.6rem]">{title}</h2>
      {desc && <p className="mt-1.5 text-[15px] leading-relaxed text-bark-light">{desc}</p>}
    </div>
  );
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}
