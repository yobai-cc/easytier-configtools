"use client";

import type { PresetDefinition, PresetId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PresetBarProps {
  presets: PresetDefinition[];
  activePresetId: PresetId | null;
  onApply: (preset: PresetDefinition) => void;
}

export function PresetBar({ presets, activePresetId, onApply }: PresetBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApply(preset)}
          className={cn(
            "rounded-[24px] border px-4 py-4 text-left transition",
            activePresetId === preset.id
              ? "border-sky-300 bg-sky-50 shadow-[0_14px_30px_rgba(56,189,248,0.18)]"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <div className="text-sm font-semibold text-slate-950">{preset.name}</div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{preset.description}</p>
        </button>
      ))}
    </div>
  );
}
