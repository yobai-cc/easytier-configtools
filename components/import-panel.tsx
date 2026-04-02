"use client";

import { useState } from "react";
import { TextAreaField } from "@/components/form-controls";
import { SectionCard } from "@/components/section-card";
import { importTomlToForm } from "@/lib/import-mapper";
import type { FormState, TomlImportResult } from "@/lib/types";

interface ImportPanelProps {
  currentForm: FormState;
  onImport: (form: FormState) => void;
}

function WarningList({ result }: { result: TomlImportResult }) {
  if (result.warnings.length === 0) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="text-sm font-semibold text-amber-900">发现 {result.warnings.length} 条导入提醒</div>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-amber-900/90">
        {result.warnings.map((warning, index) => (
          <li key={`${warning.path}-${index}`} className="rounded-2xl border border-amber-200/80 bg-white/70 px-3 py-2">
            <div className="font-medium">{warning.path}</div>
            <p className="mt-1 text-xs leading-5 text-amber-950/80">{warning.message}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ImportPanel({ currentForm, onImport }: ImportPanelProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TomlImportResult | null>(null);

  function handleImport() {
    const nextResult = importTomlToForm(input, currentForm);
    setResult(nextResult);

    if (nextResult.ok) {
      onImport(nextResult.form);
    }
  }

  return (
    <SectionCard title="导入 TOML" description="粘贴已有 EasyTier 配置，导入当前 UI 已支持的字段；输出偏好会沿用当前表单设置。">
      <div className="grid gap-4">
        <TextAreaField
          label="粘贴配置"
          description="支持直接粘贴 `client.toml` 或 `relay.toml` 内容。未知字段不会阻塞导入，但会在下方提示。"
          value={input}
          rows={12}
          placeholder={'hostname = "client-hz-01"\n\n[network_identity]\nnetwork_name = "corp-private-mesh"'}
          note="仅导入当前生成器支持的字段，其余配置会作为提醒展示。"
          onChange={(value) => {
            setInput(value);
            setResult(null);
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-500">导入成功后，左侧表单、右侧预览和风险提示会自动刷新。</p>
          <button
            type="button"
            disabled={input.trim().length === 0}
            onClick={handleImport}
            className="rounded-full border border-sky-300 bg-sky-50 px-5 py-2.5 text-sm font-medium text-sky-900 transition hover:border-sky-400 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            导入到表单
          </button>
        </div>

        {result ? (
          <div className="grid gap-3" aria-live="polite">
            {result.ok ? (
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
                <div className="font-semibold">导入成功</div>
                <p className="mt-1 leading-6">
                  已导入 {result.stats.importedFieldCount} 个字段，包含 {result.stats.peerCount} 个 peer、{result.stats.proxyNetworkCount} 个代理网段、{result.stats.portForwardCount}
                  条端口转发。
                </p>
              </article>
            ) : (
              <article className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                <div className="font-semibold">导入失败</div>
                <p className="mt-1 leading-6">{result.message}</p>
              </article>
            )}

            <WarningList result={result} />
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
