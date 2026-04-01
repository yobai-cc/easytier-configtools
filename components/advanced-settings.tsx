"use client";

import type { ReactNode } from "react";
import type { AdvancedGroupConfig } from "@/lib/layout-config";
import { cn } from "@/lib/utils";

interface AdvancedSettingsProps {
  summary: {
    enabledFieldCount: number;
    riskCount: number;
  };
  open: boolean;
  setOpen: (open: boolean) => void;
  groups: AdvancedGroupConfig[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (groupId: AdvancedGroupConfig["id"]) => void;
  renderGroup: (group: AdvancedGroupConfig) => ReactNode;
  forceExpanded?: boolean;
}

export function AdvancedSettings({
  summary,
  open,
  setOpen,
  groups,
  expandedGroups,
  onToggleGroup,
  renderGroup,
  forceExpanded = false
}: AdvancedSettingsProps) {
  return (
    <section className="rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(125,166,210,0.18)] backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-950">高级设置</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">把可省略项、边界场景和调优开关收拢到一起。简单模式默认折叠，高级模式默认展开。</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900">
            已启用高级项 {summary.enabledFieldCount}
          </div>
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              summary.riskCount > 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
            )}
          >
            {summary.riskCount > 0 ? `相关风险 ${summary.riskCount}` : "未检测到高级风险"}
          </div>
        </div>
      </button>

      {(open || forceExpanded) && (
        <div className="mt-5 grid gap-4">
          {groups.map((group) => {
            const expanded = forceExpanded || expandedGroups[group.id];

            return (
              <div key={group.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => onToggleGroup(group.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{group.title}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
                  </div>
                  <div className="text-xs font-medium text-slate-500">{expanded ? "收起" : "展开"}</div>
                </button>
                {expanded ? <div className="border-t border-slate-200 px-5 py-5">{renderGroup(group)}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
