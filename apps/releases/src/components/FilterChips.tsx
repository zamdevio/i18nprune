import React from "react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "breaking", label: "Breaking" },
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "patch", label: "Patch" },
];

type FilterChipsProps = {
  activeFilter: string;
  onFilterChange: (id: string) => void;
};

export default function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onFilterChange(id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeFilter === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
