"use client";

import type { ReactNode } from "react";
import type { PortForwardEntry, ProxyNetworkEntry } from "@/lib/types";
import { cn, parseLineSeparated } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  description: string;
  error?: string;
  disabled?: boolean;
  note?: string;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  placeholder: string;
  type?: "text" | "number" | "password";
  onChange: (value: string) => void;
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (value: string) => void;
}

interface ListTextAreaFieldProps extends BaseFieldProps {
  value: string[];
  placeholder: string;
  rows?: number;
  onChange: (value: string[]) => void;
}

interface ProxyNetworkListFieldProps extends BaseFieldProps {
  value: ProxyNetworkEntry[];
  onChange: (value: ProxyNetworkEntry[]) => void;
}

interface PortForwardListFieldProps extends BaseFieldProps {
  value: PortForwardEntry[];
  onChange: (value: PortForwardEntry[]) => void;
}

interface ToggleFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SelectFieldProps<T extends string> extends BaseFieldProps {
  value: T;
  options: ReadonlyArray<{ label: string; value: T }>;
  onChange: (value: T) => void;
}

function FieldShell({ label, description, error, note, children }: BaseFieldProps & { children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <div className="space-y-1">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      {!error && note ? <p className="text-xs text-sky-700">{note}</p> : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400";

export function TextField({ label, description, value, placeholder, error, note, onChange, disabled, type = "text" }: TextFieldProps) {
  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <input
        className={cn(inputClassName, error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, description, value, placeholder, error, note, onChange, disabled, rows = 4 }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <textarea
        className={cn(inputClassName, "min-h-[120px] resize-y", error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function ListTextAreaField({ label, description, value, placeholder, error, note, onChange, disabled, rows = 4 }: ListTextAreaFieldProps) {
  return (
    <TextAreaField
      label={label}
      description={description}
      error={error}
      note={note}
      disabled={disabled}
      rows={rows}
      value={value.join("\n")}
      placeholder={placeholder}
      onChange={(nextValue) => onChange(parseLineSeparated(nextValue))}
    />
  );
}

function InlineHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

export function ProxyNetworkListField({ label, description, value, error, note, onChange, disabled }: ProxyNetworkListFieldProps) {
  const items = value.length > 0 ? value : [{ cidr: "" }];

  function updateAt(index: number, cidr: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { cidr } : item)));
  }

  function appendItem() {
    onChange([...items, { cidr: "" }]);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">CIDR</div>
                <input
                  className={inputClassName}
                  value={item.cidr}
                  disabled={disabled}
                  placeholder="127.255.255.255"
                  onChange={(event) => updateAt(index, event.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={disabled || items.length === 1}
                onClick={() => removeAt(index)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3">
          <InlineHint>每条记录会生成一个 `[[proxy_network]]` 段。</InlineHint>
          <button
            type="button"
            disabled={disabled}
            onClick={appendItem}
            className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            添加网段
          </button>
        </div>
      </div>
    </FieldShell>
  );
}

export function PortForwardListField({ label, description, value, error, note, onChange, disabled }: PortForwardListFieldProps) {
  const items: PortForwardEntry[] = value.length > 0 ? value : [{ proto: "tcp", bind_addr: "", dst_addr: "" }];

  function updateAt<K extends keyof PortForwardEntry>(index: number, key: K, nextValue: PortForwardEntry[K]) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? ({ ...item, [key]: nextValue } as PortForwardEntry) : item)));
  }

  function appendItem() {
    onChange([...items, { proto: "tcp", bind_addr: "", dst_addr: "" }]);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
            <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">协议</div>
                <select className={inputClassName} value={item.proto} disabled={disabled} onChange={(event) => updateAt(index, "proto", event.target.value as PortForwardEntry["proto"])}>
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </div>
              <div className="grid gap-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">bind_addr</div>
                <input
                  className={inputClassName}
                  value={item.bind_addr}
                  disabled={disabled}
                  placeholder="0.0.0.0:18080"
                  onChange={(event) => updateAt(index, "bind_addr", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">dst_addr</div>
                <input
                  className={inputClassName}
                  value={item.dst_addr}
                  disabled={disabled}
                  placeholder="10.18.0.88:80"
                  onChange={(event) => updateAt(index, "dst_addr", event.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={disabled || items.length === 1}
                onClick={() => removeAt(index)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3">
          <InlineHint>每条记录会生成一个 `[[port_forward]]` 段。</InlineHint>
          <button
            type="button"
            disabled={disabled}
            onClick={appendItem}
            className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            添加转发
          </button>
        </div>
      </div>
    </FieldShell>
  );
}

export function ToggleField({ label, description, checked, error, note, onChange, disabled }: ToggleFieldProps) {
  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-12 items-center justify-between rounded-2xl border px-4 text-left transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
          checked ? "border-sky-300 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-700"
        )}
      >
        <span className="text-sm">{checked ? "已启用" : "未启用"}</span>
        <span className={cn("h-6 w-11 rounded-full border p-0.5 transition", checked ? "border-sky-300 bg-sky-200/80" : "border-slate-200 bg-slate-100")}>
          <span className={cn("block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition", checked ? "translate-x-5" : "translate-x-0")} />
        </span>
      </button>
    </FieldShell>
  );
}

export function SelectField<T extends string>({ label, description, value, options, error, note, onChange, disabled }: SelectFieldProps<T>) {
  return (
    <FieldShell label={label} description={description} error={error} note={note} disabled={disabled}>
      <select
        className={cn(inputClassName, error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
