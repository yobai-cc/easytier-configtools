"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArtifactBundle, ArtifactFile, ArtifactKey, NodeRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  role: NodeRole;
  artifacts: ArtifactBundle;
}

function buildFiles(role: NodeRole, artifacts: ArtifactBundle): ArtifactFile[] {
  const files: ArtifactFile[] = [
    {
      key: "toml",
      label: artifacts.fileName,
      fileName: artifacts.fileName,
      content: artifacts.toml
    }
  ];

  if (artifacts.service) {
    files.push({
      key: "service",
      label: role === "client" ? "easytier-client.service" : "easytier-relay.service",
      fileName: role === "client" ? "easytier-client.service" : "easytier-relay.service",
      content: artifacts.service
    });
  }

  if (artifacts.readme) {
    files.push({
      key: "readme",
      label: "DEPLOYMENT.md",
      fileName: "DEPLOYMENT.md",
      content: artifacts.readme
    });
  }

  if (artifacts.envExample) {
    files.push({
      key: "env",
      label: ".env.example",
      fileName: ".env.example",
      content: artifacts.envExample
    });
  }

  return files;
}

function downloadFile(file: ArtifactFile) {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PreviewPanel({ role, artifacts }: PreviewPanelProps) {
  const files = useMemo(() => buildFiles(role, artifacts), [artifacts, role]);
  const [activeKey, setActiveKey] = useState<ArtifactKey>("toml");
  const [copyState, setCopyState] = useState("复制当前");

  useEffect(() => {
    if (!files.some((file) => file.key === activeKey)) {
      setActiveKey("toml");
    }
  }, [activeKey, files]);

  const activeFile = files.find((file) => file.key === activeKey) ?? files[0];

  async function handleCopy() {
    if (!activeFile) {
      return;
    }

    await navigator.clipboard.writeText(activeFile.content);
    setCopyState("已复制");
    window.setTimeout(() => setCopyState("复制当前"), 1200);
  }

  return (
    <section className="rounded-[28px] border border-sky-100 bg-white/92 p-6 shadow-[0_18px_50px_rgba(125,166,210,0.18)] backdrop-blur">
      <div className="mb-4 flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">实时预览区</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">所有输出均在本地即时生成，不调用任何外部 API。</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <button
              key={file.key}
              type="button"
              onClick={() => setActiveKey(file.key)}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium transition",
                activeKey === file.key
                  ? "border-sky-300 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              {file.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-medium text-sky-900 transition hover:border-sky-400"
          >
            {copyState}
          </button>

          {files.map((file) => (
            <button
              key={`download-${file.key}`}
              type="button"
              onClick={() => downloadFile(file)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300"
            >
              下载 {file.fileName}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
        <div className="border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-400">{activeFile?.fileName}</div>
        <pre className="max-h-[760px] overflow-auto p-4 text-xs leading-6 text-slate-100">
          <code>{activeFile?.content}</code>
        </pre>
      </div>
    </section>
  );
}
