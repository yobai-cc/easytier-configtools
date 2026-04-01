import type { RiskItem, ValidationIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RiskPanelProps {
  validationIssues: ValidationIssue[];
  risks: RiskItem[];
}

function levelStyles(level: RiskItem["level"]): string {
  if (level === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  if (level === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function RiskPanel({ validationIssues, risks }: RiskPanelProps) {
  return (
    <section className="rounded-[28px] border border-sky-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(125,166,210,0.18)] backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">风险提示区</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">自动识别私有部署常见误用，包括公共服务回退、relay 暴露不足与地址冲突。</p>
      </div>

      {validationIssues.length === 0 && risks.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
          当前输入没有触发已知高风险项，仍建议上线前自行核对 peers、config_server 与证书配置。
        </div>
      ) : null}

      <div className="grid gap-3">
        {validationIssues.map((issue, index) => (
          <article key={`${issue.path}-${index}`} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
            <div className="text-sm font-semibold text-rose-900">表单校验：{issue.path}</div>
            <p className="mt-1 text-sm leading-6 text-rose-800">{issue.message}</p>
          </article>
        ))}

        {risks.map((risk, index) => (
          <article key={`${risk.title}-${index}`} className={cn("rounded-2xl border px-4 py-4", levelStyles(risk.level))}>
            <div className="text-sm font-semibold">{risk.title}</div>
            <p className="mt-1 text-sm leading-6 opacity-90">{risk.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
