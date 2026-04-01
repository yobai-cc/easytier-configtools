import { DEFAULT_RELAY_LISTENERS } from "@/lib/defaults";
import type { ArtifactBundle, FormState, PortForwardEntry, ProxyNetworkEntry } from "@/lib/types";
import { normalizeList, normalizePortForwards, normalizeProxyNetworks, toOptionalNumber } from "@/lib/utils";

type PrimitiveTomlValue = string | number | boolean;
type TomlFieldValue = PrimitiveTomlValue | PrimitiveTomlValue[];
type TableRow = Record<string, TomlFieldValue>;

interface OfficialConfigShape {
  topLevel: Array<[string, TomlFieldValue | undefined]>;
  networkIdentity: TableRow;
  peers: TableRow[];
  proxyNetworks: TableRow[];
  portForwards: TableRow[];
  flags: TableRow;
}

function quoteTomlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function serializeTomlPrimitive(value: PrimitiveTomlValue): string {
  if (typeof value === "string") {
    return quoteTomlString(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function serializeTomlArray(values: PrimitiveTomlValue[]): string {
  return `[${values.map((value) => serializeTomlPrimitive(value)).join(", ")}]`;
}

function serializeTomlPair(key: string, value: TomlFieldValue): string {
  return `${key} = ${Array.isArray(value) ? serializeTomlArray(value) : serializeTomlPrimitive(value)}`;
}

function serializeTomlTable(name: string, values: TableRow): string {
  const lines = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => serializeTomlPair(key, value));

  if (lines.length === 0) {
    return `[${name}]`;
  }

  return [`[${name}]`, ...lines].join("\n");
}

function serializeTomlArrayTable(name: string, rows: TableRow[]): string {
  return rows
    .map((row) =>
      [[`[[${name}]]`], ...Object.entries(row).map(([key, value]) => serializeTomlPair(key, value))]
        .flat()
        .join("\n")
    )
    .join("\n\n");
}

function buildPortForwardRow(value: PortForwardEntry): TableRow {
  return {
    bind_addr: value.bind_addr,
    dst_addr: value.dst_addr,
    proto: value.proto
  };
}

function sanitizeForGeneration(input: FormState): FormState {
  const next: FormState = {
    ...input,
    instance_id: input.instance_id.trim(),
    peers: normalizeList(input.peers),
    listeners: normalizeList(input.listeners),
    mapped_listeners: normalizeList(input.mapped_listeners),
    relay_network_whitelist: normalizeList(input.relay_network_whitelist),
    proxy_networks: normalizeProxyNetworks(input.proxy_networks),
    port_forwards: normalizePortForwards(input.port_forwards),
    rpc_portal_whitelist: normalizeList(input.rpc_portal_whitelist),
    stun_servers: normalizeList(input.stun_servers),
    stun_servers_v6: normalizeList(input.stun_servers_v6)
  };

  if (next.mode === "strict_private") {
    next.private_mode = true;
    next.external_node = "";
    next.stun_servers = [];
    next.stun_servers_v6 = [];

    if (next.role === "client") {
      next.proxy_networks = [];
      next.rpc_portal = next.rpc_portal.trim() || "127.0.0.1:15888";
      next.rpc_portal_whitelist = next.rpc_portal_whitelist.length > 0 ? next.rpc_portal_whitelist : ["127.0.0.1/32"];
    }

    if (next.role === "relay") {
      next.relay_mode = "pure";
      next.no_tun = true;
      next.dhcp = false;
      next.ipv4 = "";
    }
  }

  if (next.role === "relay" && next.listeners.length === 0 && !next.no_listener) {
    next.listeners = [...DEFAULT_RELAY_LISTENERS];
  }

  if (next.role === "relay" && next.relay_listener_profile === "udp_only") {
    next.listeners = next.listeners.filter((listener) => listener.startsWith("tcp://") || listener.startsWith("udp://"));
  }

  if (next.no_listener) {
    next.listeners = [];
  }

  if (next.role === "relay" && next.relay_mode === "pure") {
    next.no_tun = true;
    next.dhcp = false;
    next.ipv4 = "";
  }

  if (next.dhcp && !next.keep_ipv4_when_dhcp) {
    next.ipv4 = "";
  }

  return next;
}

function toOfficialConfigShape(input: FormState): OfficialConfigShape {
  const state = sanitizeForGeneration(input);

  const flags: TableRow = {};

  const assignFlag = (key: string, value: TomlFieldValue | undefined) => {
    if (value === undefined) {
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      return;
    }

    flags[key] = value;
  };

  assignFlag("private_mode", state.private_mode);
  assignFlag(
    "relay_network_whitelist",
    state.relay_network_whitelist.length > 0 ? state.relay_network_whitelist.join(" ") : undefined
  );
  assignFlag("relay_all_peer_rpc", state.relay_all_peer_rpc);
  assignFlag("multi_thread", state.multi_thread);
  assignFlag("multi_thread_count", toOptionalNumber(state.multi_thread_count));
  assignFlag("latency_first", state.latency_first);
  assignFlag("compression", state.compression ? "zstd" : "none");
  assignFlag("stun_servers", state.stun_servers.length > 0 ? state.stun_servers : undefined);
  assignFlag("stun_servers_v6", state.stun_servers_v6.length > 0 ? state.stun_servers_v6 : undefined);
  assignFlag("no_tun", state.no_tun);
  assignFlag("disable_p2p", state.disable_p2p);
  assignFlag("p2p_only", state.p2p_only);
  assignFlag("disable_tcp_hole_punching", state.disable_tcp_hole_punching);
  assignFlag("disable_udp_hole_punching", state.disable_udp_hole_punching);
  assignFlag("disable_sym_hole_punching", state.disable_sym_hole_punching);
  assignFlag("socks5", state.socks5.trim() || undefined);
  assignFlag("mtu", toOptionalNumber(state.mtu));
  assignFlag("dev_name", state.dev_name.trim() || undefined);
  assignFlag("encryption_algorithm", state.encryption_algorithm.trim() || undefined);
  assignFlag("disable_encryption", state.disable_encryption);
  assignFlag("rpc_portal_whitelist", state.rpc_portal_whitelist.length > 0 ? state.rpc_portal_whitelist.join(",") : undefined);
  assignFlag("external_node", state.external_node.trim() || undefined);

  return {
    topLevel: [
      ["hostname", state.hostname.trim()],
      ["instance_name", state.instance_name.trim()],
      ["instance_id", state.instance_id || undefined],
      ["config_server", state.config_server.trim() || undefined],
      ["ipv4", state.ipv4.trim() || undefined],
      ["ipv6", state.ipv6.trim() || undefined],
      ["dhcp", state.dhcp],
      ["listeners", state.listeners.length > 0 ? state.listeners : undefined],
      ["mapped_listeners", state.mapped_listeners.length > 0 ? state.mapped_listeners : undefined],
      ["no_listener", state.no_listener || undefined],
      ["rpc_portal", state.rpc_portal.trim() || undefined]
    ],
    networkIdentity: {
      network_name: state.network_name.trim(),
      network_secret: state.network_secret.trim()
    },
    peers: state.peers.map((uri) => ({ uri })),
    proxyNetworks: state.proxy_networks.map((item: ProxyNetworkEntry) => ({ cidr: item.cidr })),
    portForwards: state.port_forwards.map((item) => buildPortForwardRow(item)),
    flags
  };
}

function buildToml(input: FormState): string {
  const config = toOfficialConfigShape(input);
  const sections: string[] = [];

  const topLevelLines = config.topLevel
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => serializeTomlPair(key, value as TomlFieldValue));

  if (topLevelLines.length > 0) {
    sections.push(topLevelLines.join("\n"));
  }

  sections.push(serializeTomlTable("network_identity", config.networkIdentity));

  if (config.peers.length > 0) {
    sections.push(serializeTomlArrayTable("peer", config.peers));
  }

  if (config.proxyNetworks.length > 0) {
    sections.push(serializeTomlArrayTable("proxy_network", config.proxyNetworks));
  }

  if (config.portForwards.length > 0) {
    sections.push(serializeTomlArrayTable("port_forward", config.portForwards));
  }

  sections.push(serializeTomlTable("flags", config.flags));

  return sections.filter(Boolean).join("\n\n");
}

function buildService(input: FormState): string {
  const roleLabel = input.role === "client" ? "Client" : "Relay";
  const configFile = input.role === "client" ? "client.toml" : "relay.toml";
  const limitBlock = input.role === "relay" ? "LimitNOFILE=1048576\n" : "";

  return `[Unit]
Description=EasyTier ${roleLabel}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/etc/easytier
EnvironmentFile=-/etc/easytier/easytier.env
ExecStart=/usr/local/bin/easytier-core -c /etc/easytier/${configFile}
Restart=always
RestartSec=3
${limitBlock}StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`;
}

function buildEnvExample(input: FormState): string {
  const state = sanitizeForGeneration(input);

  return `# Local deployment overrides
NEXT_PUBLIC_APP_TITLE=EasyTier 私有部署配置生成器
EASYTIER_BINARY_PATH=/usr/local/bin/easytier-core
EASYTIER_CONFIG_DIR=/etc/easytier
SYSTEMD_SERVICE_USER=root
EASYTIER_NETWORK_NAME=${state.network_name}
EASYTIER_CONFIG_SERVER=${state.config_server}
EASYTIER_INSTANCE_NAME=${state.instance_name}
EASYTIER_INSTANCE_ID=${state.instance_id}
EASYTIER_CLIENT_CONFIG=client.toml
EASYTIER_RELAY_CONFIG=relay.toml`;
}

function buildReadme(input: FormState): string {
  const state = sanitizeForGeneration(input);
  const configFile = state.role === "client" ? "client.toml" : "relay.toml";
  const serviceFile = state.role === "client" ? "easytier-client.service" : "easytier-relay.service";
  const listenerSummary = state.no_listener ? "未输出 listeners（no_listener=true）" : state.listeners.join(", ") || "未配置";
  const peerSummary = state.peers.length > 0 ? state.peers.join(", ") : "未填写";
  const portForwardSummary =
    state.port_forwards.length > 0
      ? state.port_forwards.map((item) => `${item.proto}://${item.bind_addr}/${item.dst_addr}`).join(", ")
      : "未配置";
  const roleTitle = state.role === "client" ? "终端节点" : "中继节点";
  const extraWssNote = state.listeners.some((listener) => listener.startsWith("wss://"))
    ? "\n## WSS listener 说明\n\n- 你启用了 `wss://` listener，请准备证书终止或由前置反向代理承担 TLS。\n- 如果终端走反向代理接入，可让外部入口暴露为 `wss://relay.example.com/...`，内部再转发到 EasyTier 的 `ws://` 或 `wss://` listener。\n"
    : "";

  return `# EasyTier ${roleTitle}部署说明

## 生成结果

- 配置文件：\`${configFile}\`
- systemd：\`${serviceFile}\`
- 可选环境变量：\`.env.example\`

## 参数摘要

- 模式：${state.mode === "strict_private" ? "严格私有模式" : "自定义高级模式"}
- 角色：${roleTitle}
- hostname：\`${state.hostname}\`
- instance_name：\`${state.instance_name}\`
- instance_id：\`${state.instance_id || "未填写"}\`
- network_name：\`${state.network_name}\`
- config_server：\`${state.config_server || "未填写"}\`
- peers：${peerSummary}
- listeners：${listenerSummary}
- port_forwards：${portForwardSummary}

## 为什么严格私有模式默认禁用官方服务

- 仅用户名形式的 config_server 会使用官方服务器，因此严格私有模式要求必须填写完整 URL。
- external_node 会使用公共共享节点，不适合“逻辑上完全私有、自主可控”的 EasyTier 网络。
- 严格私有模式会默认清空 stun_servers / stun_servers_v6，并强制 private_mode=true，避免公共服务介入节点发现与 NAT 探测。

## Web Console / 配置下发说明

- 自建 Web Console 默认配置下发端口为 22020。
- 默认协议可为 udp，也可改为 tcp / ws。
- 若 ws 经反向代理为 TLS，则终端可使用 wss://... 接入。
- 当 config_server 以 \`udp://\` 开头时，通常表示默认配置下发方式；以 \`ws://\` / \`wss://\` 开头时，通常表示 Web Console / WebSocket 下发地址。

## 部署步骤

1. 将 EasyTier 二进制安装到 \`/usr/local/bin/easytier-core\`，或改成你自己的二进制路径。
2. 创建目录：\`sudo mkdir -p /etc/easytier\`
3. 将生成的 \`${configFile}\` 写入 \`/etc/easytier/${configFile}\`。
4. 如果需要 systemd，把 \`${serviceFile}\` 写入 \`/etc/systemd/system/${serviceFile}\`。
5. 执行 \`sudo systemctl daemon-reload\`
6. 执行 \`sudo systemctl enable --now ${serviceFile}\`
7. 用 \`journalctl -u ${serviceFile} -f\` 观察启动日志。

## 私有部署建议

- 终端节点在严格私有模式下至少保留 1 个私有 peers，避免掉入公共发现。
- relay 默认不输出 ipv4，让它保持“只转发、不创建 TUN”的纯 relay 角色；如果你确实想让 relay 作为普通节点加入网络，请切换到“作为普通节点加入网络”。
- 如果你启用了 \`rpc_portal\`，建议继续把 \`rpc_portal_whitelist\` 限定在回环地址或运维网段。
${extraWssNote}`;
}

export function buildArtifacts(input: FormState): ArtifactBundle {
  return {
    fileName: input.role === "client" ? "client.toml" : "relay.toml",
    toml: buildToml(input),
    service: input.include_systemd ? buildService(input) : "",
    readme: input.include_readme ? buildReadme(input) : "",
    envExample: input.include_env_example ? buildEnvExample(input) : ""
  };
}
