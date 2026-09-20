"use client";

interface SingleProps {
  label: string;
  emoji: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

export function SingleChips({ label, emoji, options, value, onChange }: SingleProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{emoji} {label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt
                ? "border-pink-500 bg-pink-500 text-white"
                : "border-line bg-surface text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Group { group: string; emoji: string; tags: readonly string[] }
interface MultiProps {
  groups: Group[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

export function InterestChips({ groups, value, onChange, max = 12 }: MultiProps) {
  function toggle(tag: string) {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else if (value.length < max) onChange([...value, tag]);
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.group}>
          <p className="mb-2 text-sm font-semibold text-ink">{g.emoji} {g.group}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  value.includes(tag)
                    ? "border-pink-500 bg-pink-500 text-white"
                    : "border-line bg-surface text-ink"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">{value.length}/{max} selected</p>
    </div>
  );
}