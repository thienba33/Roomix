'use client';

type Option = { value: string; label: string; count: number };

export default function StatusFilter({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return <div className="rental-status-filter" role="group" aria-label={label}>
    {options.map((option) => <button
      key={option.value}
      type="button"
      aria-pressed={value === option.value}
      onClick={() => onChange(option.value)}
    >
      {option.label}<span>{option.count}</span>
    </button>)}
  </div>;
}
