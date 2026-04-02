"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { AdvancedSettings } from "@/components/advanced-settings";
import { ListTextAreaField, PortForwardListField, ProxyNetworkListField, SelectField, TextField, ToggleField } from "@/components/form-controls";
import { ImportPanel } from "@/components/import-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { PresetBar } from "@/components/preset-bar";
import { RiskPanel } from "@/components/risk-panel";
import { SectionCard } from "@/components/section-card";
import { applyModeDefaults, applyRoleDefaults, createDefaultFormState } from "@/lib/defaults";
import { FIELD_META } from "@/lib/field-meta";
import { buildArtifacts } from "@/lib/generators";
import { type AdvancedGroupConfig, getFieldPresentation, getSimpleLayoutConfig, summarizeAdvancedSettings, type FormFieldKey } from "@/lib/layout-config";
import { PRESETS } from "@/lib/presets";
import { validateFormState } from "@/lib/schema";
import type { FormState, GeneratorMode, NodeRole, PresetDefinition, PresetId, ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { analyzeRisks } from "@/lib/validators";

const viewModeOptions = [
  { label: "简单模式", value: "simple" },
  { label: "高级模式", value: "advanced" }
] as const;

const modeOptions = [
  { label: "严格私有模式", value: "strict_private" },
  { label: "自定义高级模式", value: "advanced" }
] as const;

const roleOptions = [
  { label: "终端节点", value: "client" },
  { label: "中继节点", value: "relay" }
] as const;

const relayModeOptions = [
  { label: "纯 relay（默认）", value: "pure" },
  { label: "作为普通节点加入网络", value: "join" }
] as const;

const relayListenerProfileOptions = [
  { label: "全协议 relay", value: "full" },
  { label: "UDP-only relay", value: "udp_only" }
] as const;

type ExpandedGroups = Record<AdvancedGroupConfig["id"], boolean>;

function createExpandedGroups(value: boolean): ExpandedGroups {
  return {
    network: value,
    relay: value,
    performance: value,
    security: value,
    output: value
  };
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="inline-flex flex-wrap gap-2 rounded-full border border-white/60 bg-white/80 p-1 shadow-[0_10px_30px_rgba(148,163,184,0.15)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              value === option.value ? "bg-sky-500 text-white shadow-[0_10px_20px_rgba(14,165,233,0.28)]" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GeneratorApp() {
  const [form, setForm] = useState<FormState>(() => createDefaultFormState());
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>(() => createExpandedGroups(false));
  const [activePresetId, setActivePresetId] = useState<PresetId | null>("private_udp_client");
  const deferredForm = useDeferredValue(form);

  const validation = useMemo(() => validateFormState(form), [form]);
  const validationErrors = useMemo(() => {
    const entries = new Map<string, string>();
    for (const issue of validation.issues) {
      if (!entries.has(issue.path)) {
        entries.set(issue.path, issue.message);
      }
    }
    return entries;
  }, [validation.issues]);

  const risks = useMemo(() => analyzeRisks(form), [form]);
  const artifacts = useMemo(() => buildArtifacts(deferredForm), [deferredForm]);
  const simpleLayout = useMemo(() => getSimpleLayoutConfig(form.role), [form.role]);
  const advancedSummary = useMemo(() => summarizeAdvancedSettings(form, risks), [form, risks]);

  const forceAdvancedExpanded = viewMode === "advanced";
  const isStrict = form.mode === "strict_private";
  const isRelay = form.role === "relay";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
    setActivePresetId(null);
  }

  function handleViewModeChange(nextMode: ViewMode) {
    startTransition(() => {
      setViewMode(nextMode);
      setAdvancedOpen(nextMode === "advanced");
      setExpandedGroups(createExpandedGroups(nextMode === "advanced"));
    });
  }

  function handleModeChange(mode: GeneratorMode) {
    startTransition(() => {
      setForm((current) => applyModeDefaults(current, mode));
      setActivePresetId(null);
    });
  }

  function handleRoleChange(role: NodeRole) {
    startTransition(() => {
      setForm((current) => applyRoleDefaults(current, role));
      setActivePresetId(null);
    });
  }

  function handleToggleGroup(groupId: AdvancedGroupConfig["id"]) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId]
    }));
  }

  function applyPreset(preset: PresetDefinition) {
    startTransition(() => {
      setForm(preset.form);
      setActivePresetId(preset.id);
    });
  }

  function handleImportedForm(nextForm: FormState) {
    startTransition(() => {
      setForm(nextForm);
      setActivePresetId(null);
    });
  }

  function getFieldNote(field: FormFieldKey, fallback?: string) {
    const presentation = getFieldPresentation(field, form);
    return presentation.note ?? fallback;
  }

  function isFieldDisabled(field: FormFieldKey, fallback = false) {
    const presentation = getFieldPresentation(field, form);
    return presentation.disabled || fallback;
  }

  function renderField(field: FormFieldKey) {
    switch (field) {
      case "hostname":
        return <TextField key={field} {...FIELD_META.hostname} value={form.hostname} error={validationErrors.get(field)} onChange={(value) => updateField("hostname", value)} />;
      case "instance_name":
        return (
          <TextField
            key={field}
            {...FIELD_META.instance_name}
            value={form.instance_name}
            error={validationErrors.get(field)}
            onChange={(value) => updateField("instance_name", value)}
          />
        );
      case "network_name":
        return <TextField key={field} {...FIELD_META.network_name} value={form.network_name} error={validationErrors.get(field)} onChange={(value) => updateField("network_name", value)} />;
      case "network_secret":
        return (
          <TextField
            key={field}
            {...FIELD_META.network_secret}
            type="password"
            value={form.network_secret}
            error={validationErrors.get(field)}
            onChange={(value) => updateField("network_secret", value)}
          />
        );
      case "instance_id":
        return <TextField key={field} {...FIELD_META.instance_id} value={form.instance_id} error={validationErrors.get(field)} onChange={(value) => updateField("instance_id", value)} />;
      case "config_server":
        return (
          <TextField
            key={field}
            {...FIELD_META.config_server}
            value={form.config_server}
            error={validationErrors.get(field)}
            onChange={(value) => updateField("config_server", value)}
          />
        );
      case "dhcp":
        return (
          <ToggleField
            key={field}
            label="dhcp"
            description="启用后从配置中心自动分配地址。"
            checked={form.dhcp}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("dhcp", value)}
          />
        );
      case "keep_ipv4_when_dhcp":
        return (
          <ToggleField
            key={field}
            label="保留 ipv4（DHCP 时）"
            description="需要同时输出静态 IPv4 时再启用。"
            checked={form.keep_ipv4_when_dhcp}
            disabled={!form.dhcp}
            note={!form.dhcp ? "仅在 dhcp 开启时可用。" : undefined}
            onChange={(value) => updateField("keep_ipv4_when_dhcp", value)}
          />
        );
      case "ipv4":
        return (
          <TextField
            key={field}
            {...FIELD_META.ipv4}
            value={form.ipv4}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("ipv4", value)}
          />
        );
      case "ipv6":
        return <TextField key={field} {...FIELD_META.ipv6} value={form.ipv6} onChange={(value) => updateField("ipv6", value)} />;
      case "peers":
        return (
          <ListTextAreaField
            key={field}
            {...FIELD_META.peers}
            value={form.peers}
            rows={5}
            error={validationErrors.get(field)}
            onChange={(value) => updateField("peers", value)}
          />
        );
      case "external_node":
        return (
          <TextField
            key={field}
            {...FIELD_META.external_node}
            value={form.external_node}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("external_node", value)}
          />
        );
      case "listeners":
        return (
          <ListTextAreaField
            key={field}
            {...FIELD_META.listeners}
            value={form.listeners}
            rows={6}
            error={validationErrors.get(field)}
            disabled={form.no_listener}
            note={form.no_listener ? "当前 no_listener = true，生成时会省略 listeners。" : undefined}
            onChange={(value) => updateField("listeners", value)}
          />
        );
      case "mapped_listeners":
        return <ListTextAreaField key={field} {...FIELD_META.mapped_listeners} value={form.mapped_listeners} rows={4} onChange={(value) => updateField("mapped_listeners", value)} />;
      case "no_listener":
        return <ToggleField key={field} label="no_listener" description="启用后直接省略 listeners。" checked={form.no_listener} onChange={(value) => updateField("no_listener", value)} />;
      case "private_mode":
        return (
          <ToggleField
            key={field}
            label="private_mode"
            description="建议保持开启，避免引入公共发现。"
            checked={form.private_mode}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("private_mode", value)}
          />
        );
      case "relay_network_whitelist":
        return (
          <ListTextAreaField key={field} {...FIELD_META.relay_network_whitelist} value={form.relay_network_whitelist} rows={4} onChange={(value) => updateField("relay_network_whitelist", value)} />
        );
      case "relay_all_peer_rpc":
        return (
          <ToggleField
            key={field}
            label="relay_all_peer_rpc"
            description="允许 relay 对所有 peer 透传 RPC。"
            checked={form.relay_all_peer_rpc}
            onChange={(value) => updateField("relay_all_peer_rpc", value)}
          />
        );
      case "proxy_networks":
        return <ProxyNetworkListField key={field} {...FIELD_META.proxy_networks} value={form.proxy_networks} onChange={(value) => updateField("proxy_networks", value)} />;
      case "port_forwards":
        return <PortForwardListField key={field} {...FIELD_META.port_forwards} value={form.port_forwards} onChange={(value) => updateField("port_forwards", value)} />;
      case "rpc_portal":
        return <TextField key={field} {...FIELD_META.rpc_portal} value={form.rpc_portal} onChange={(value) => updateField("rpc_portal", value)} />;
      case "rpc_portal_whitelist":
        return (
          <ListTextAreaField key={field} {...FIELD_META.rpc_portal_whitelist} value={form.rpc_portal_whitelist} rows={4} onChange={(value) => updateField("rpc_portal_whitelist", value)} />
        );
      case "multi_thread":
        return <ToggleField key={field} label="multi_thread" description="启用多线程收发。" checked={form.multi_thread} onChange={(value) => updateField("multi_thread", value)} />;
      case "multi_thread_count":
        return (
          <TextField
            key={field}
            label="multi_thread_count"
            description="多线程工作数，可留空。"
            placeholder="4"
            value={form.multi_thread_count}
            error={validationErrors.get(field)}
            onChange={(value) => updateField("multi_thread_count", value)}
          />
        );
      case "latency_first":
        return <ToggleField key={field} label="latency_first" description="优先时延而非吞吐。" checked={form.latency_first} onChange={(value) => updateField("latency_first", value)} />;
      case "compression":
        return <ToggleField key={field} label="compression" description="启用链路压缩。" checked={form.compression} onChange={(value) => updateField("compression", value)} />;
      case "stun_servers":
        return (
          <ListTextAreaField
            key={field}
            {...FIELD_META.stun_servers}
            value={form.stun_servers}
            rows={4}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("stun_servers", value)}
          />
        );
      case "stun_servers_v6":
        return (
          <ListTextAreaField
            key={field}
            {...FIELD_META.stun_servers_v6}
            value={form.stun_servers_v6}
            rows={4}
            disabled={isFieldDisabled(field)}
            note={getFieldNote(field)}
            onChange={(value) => updateField("stun_servers_v6", value)}
          />
        );
      case "no_tun":
        return <ToggleField key={field} label="no_tun" description="关闭 TUN 设备创建。" checked={form.no_tun} onChange={(value) => updateField("no_tun", value)} />;
      case "disable_p2p":
        return <ToggleField key={field} label="disable_p2p" description="禁用 P2P。" checked={form.disable_p2p} onChange={(value) => updateField("disable_p2p", value)} />;
      case "p2p_only":
        return <ToggleField key={field} label="p2p_only" description="只允许 P2P。" checked={form.p2p_only} onChange={(value) => updateField("p2p_only", value)} />;
      case "disable_tcp_hole_punching":
        return (
          <ToggleField key={field} label="disable_tcp_hole_punching" description="禁用 TCP 打洞。" checked={form.disable_tcp_hole_punching} onChange={(value) => updateField("disable_tcp_hole_punching", value)} />
        );
      case "disable_udp_hole_punching":
        return (
          <ToggleField key={field} label="disable_udp_hole_punching" description="禁用 UDP 打洞。" checked={form.disable_udp_hole_punching} onChange={(value) => updateField("disable_udp_hole_punching", value)} />
        );
      case "disable_sym_hole_punching":
        return (
          <ToggleField key={field} label="disable_sym_hole_punching" description="禁用对称 NAT 打洞。" checked={form.disable_sym_hole_punching} onChange={(value) => updateField("disable_sym_hole_punching", value)} />
        );
      case "socks5":
        return <TextField key={field} {...FIELD_META.socks5} value={form.socks5} onChange={(value) => updateField("socks5", value)} />;
      case "mtu":
        return <TextField key={field} {...FIELD_META.mtu} value={form.mtu} error={validationErrors.get(field)} onChange={(value) => updateField("mtu", value)} />;
      case "dev_name":
        return <TextField key={field} {...FIELD_META.dev_name} value={form.dev_name} onChange={(value) => updateField("dev_name", value)} />;
      case "encryption_algorithm":
        return <TextField key={field} {...FIELD_META.encryption_algorithm} value={form.encryption_algorithm} onChange={(value) => updateField("encryption_algorithm", value)} />;
      case "disable_encryption":
        return (
          <ToggleField key={field} label="disable_encryption" description="关闭链路加密。" checked={form.disable_encryption} onChange={(value) => updateField("disable_encryption", value)} />
        );
      case "include_systemd":
        return (
          <ToggleField
            key={field}
            label="生成 systemd"
            description="client 生成 easytier-client.service，relay 生成 easytier-relay.service。"
            checked={form.include_systemd}
            onChange={(value) => updateField("include_systemd", value)}
          />
        );
      case "include_readme":
        return (
          <ToggleField
            key={field}
            label="生成部署说明"
            description="输出部署步骤与私有模式说明。"
            checked={form.include_readme}
            onChange={(value) => updateField("include_readme", value)}
          />
        );
      case "include_env_example":
        return (
          <ToggleField
            key={field}
            label="生成 .env.example"
            description="输出环境变量样例。"
            checked={form.include_env_example}
            onChange={(value) => updateField("include_env_example", value)}
          />
        );
      case "relay_mode":
        return (
          <SelectField
            key={field}
            label="relay 角色模式"
            description="控制 relay 是否作为普通节点加入网络。"
            value={form.relay_mode}
            options={relayModeOptions}
            disabled={isStrict}
            note={isStrict ? "严格私有模式会让 relay 保持纯转发。" : undefined}
            onChange={(value) => updateField("relay_mode", value)}
          />
        );
      case "relay_listener_profile":
        return (
          <SelectField
            key={field}
            label="relay 监听方案"
            description="全协议 relay 或只保留 tcp/udp。"
            value={form.relay_listener_profile}
            options={relayListenerProfileOptions}
            onChange={(value) => updateField("relay_listener_profile", value)}
          />
        );
    }
  }

  function renderFieldGrid(fields: FormFieldKey[]) {
    return <div className="grid gap-4 md:grid-cols-2">{fields.map((field) => renderField(field))}</div>;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#eef6fc_42%,#f8fbff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[40px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(34,197,246,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,248,255,0.95))] p-8 shadow-[0_30px_80px_rgba(125,166,210,0.22)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_320px]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-700">EasyTier Private Deployment Generator</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                为 EasyTier 生成更轻量、更私有、更好维护的部署配置
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                简单模式优先展示推荐常用项和网络地址项，高级设置集中折叠。右侧仍然实时生成 <code>client.toml</code>、
                <code>relay.toml</code>、systemd 与部署说明。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900">浅色科技型界面</div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">本地生成，无外部 API</div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">简单模式与高级模式切换</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-sky-200 bg-white/85 p-5 shadow-[0_18px_50px_rgba(125,166,210,0.16)]">
              <div className="text-sm font-semibold text-slate-950">严格私有策略</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>config_server 必须是完整 URL</li>
                <li>private_mode 默认锁定为 true</li>
                <li>external_node / STUN 默认禁用</li>
                <li>relay 默认纯转发，不创建 TUN</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="grid gap-6">
            <ImportPanel currentForm={form} onImport={handleImportedForm} />
            <SectionCard title="模式与预设" description="UI 复杂度和部署策略分开控制。简单模式收起可省略项，高级模式则展开全部高级组。">
              <div className="grid gap-5">
                <div className="flex flex-col gap-4">
                  <SegmentedControl label="视图模式" value={viewMode} options={viewModeOptions} onChange={handleViewModeChange} />
                  <SegmentedControl label="部署模式" value={form.mode} options={modeOptions} onChange={handleModeChange} />
                  <SegmentedControl label="节点角色" value={form.role} options={roleOptions} onChange={handleRoleChange} />
                </div>
                <PresetBar presets={PRESETS} activePresetId={activePresetId} onApply={applyPreset} />
              </div>
            </SectionCard>

            <SectionCard title="常用配置" description="保留最常用的部署字段，优先帮助首次部署和日常运维快速生成可用配置。">
              {renderFieldGrid(simpleLayout.commonFields)}
            </SectionCard>

            <SectionCard title="网络地址" description="把地址、peer 和 relay 入网行为单独集中，降低简单模式下的阅读负担。">
              {renderFieldGrid(simpleLayout.networkFields)}
            </SectionCard>

            <AdvancedSettings
              summary={advancedSummary}
              open={advancedOpen}
              setOpen={setAdvancedOpen}
              groups={simpleLayout.advancedGroups}
              expandedGroups={expandedGroups}
              onToggleGroup={handleToggleGroup}
              forceExpanded={forceAdvancedExpanded}
              renderGroup={(group) => renderFieldGrid(group.fields)}
            />
          </div>

          <div className="grid gap-6 lg:sticky lg:top-6 lg:self-start">
            <PreviewPanel role={form.role} artifacts={artifacts} />
            <RiskPanel validationIssues={validation.issues} risks={risks} />
          </div>
        </div>
      </div>
    </main>
  );
}
