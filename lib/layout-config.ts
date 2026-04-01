import type { FormState, RiskItem } from "@/lib/types";

export type FormFieldKey =
  | "hostname"
  | "instance_name"
  | "instance_id"
  | "network_name"
  | "network_secret"
  | "config_server"
  | "dhcp"
  | "keep_ipv4_when_dhcp"
  | "ipv4"
  | "ipv6"
  | "peers"
  | "external_node"
  | "listeners"
  | "mapped_listeners"
  | "no_listener"
  | "private_mode"
  | "relay_network_whitelist"
  | "relay_all_peer_rpc"
  | "proxy_networks"
  | "port_forwards"
  | "rpc_portal"
  | "rpc_portal_whitelist"
  | "multi_thread"
  | "multi_thread_count"
  | "latency_first"
  | "compression"
  | "stun_servers"
  | "stun_servers_v6"
  | "no_tun"
  | "disable_p2p"
  | "p2p_only"
  | "disable_tcp_hole_punching"
  | "disable_udp_hole_punching"
  | "disable_sym_hole_punching"
  | "socks5"
  | "mtu"
  | "dev_name"
  | "encryption_algorithm"
  | "disable_encryption"
  | "include_systemd"
  | "include_readme"
  | "include_env_example"
  | "relay_mode"
  | "relay_listener_profile";

export interface AdvancedGroupConfig {
  id: "network" | "relay" | "performance" | "security" | "output";
  title: string;
  description: string;
  fields: FormFieldKey[];
}

export interface SimpleLayoutConfig {
  commonFields: FormFieldKey[];
  networkFields: FormFieldKey[];
  advancedGroups: AdvancedGroupConfig[];
}

export interface FieldPresentation {
  disabled: boolean;
  note?: string;
}

const SIMPLE_CLIENT_COMMON_FIELDS: FormFieldKey[] = [
  "hostname",
  "instance_name",
  "instance_id",
  "network_name",
  "network_secret",
  "config_server",
  "rpc_portal",
  "private_mode"
];

const SIMPLE_CLIENT_NETWORK_FIELDS: FormFieldKey[] = ["dhcp", "keep_ipv4_when_dhcp", "ipv4", "ipv6", "peers"];

const SIMPLE_RELAY_COMMON_FIELDS: FormFieldKey[] = [
  "hostname",
  "instance_name",
  "instance_id",
  "network_name",
  "network_secret",
  "config_server",
  "rpc_portal",
  "private_mode"
];

const SIMPLE_RELAY_NETWORK_FIELDS: FormFieldKey[] = [
  "relay_mode",
  "relay_listener_profile",
  "listeners",
  "mapped_listeners",
  "dhcp",
  "ipv4",
  "ipv6"
];

const ADVANCED_GROUPS: AdvancedGroupConfig[] = [
  {
    id: "network",
    title: "网络与发现",
    description: "公共发现、STUN、代理网络与 listener 开关。",
    fields: ["external_node", "stun_servers", "stun_servers_v6", "proxy_networks", "no_listener"]
  },
  {
    id: "relay",
    title: "Relay 与转发",
    description: "relay 转发范围、映射地址、端口转发与 RPC 白名单。",
    fields: ["mapped_listeners", "relay_network_whitelist", "relay_all_peer_rpc", "port_forwards", "rpc_portal_whitelist"]
  },
  {
    id: "performance",
    title: "性能与 NAT",
    description: "线程、压缩、P2P 与打洞相关设置。",
    fields: [
      "multi_thread",
      "multi_thread_count",
      "latency_first",
      "compression",
      "disable_p2p",
      "p2p_only",
      "disable_tcp_hole_punching",
      "disable_udp_hole_punching",
      "disable_sym_hole_punching",
      "socks5",
      "mtu"
    ]
  },
  {
    id: "security",
    title: "安全与设备",
    description: "TUN、设备名与链路加密相关选项。",
    fields: ["no_tun", "dev_name", "encryption_algorithm", "disable_encryption"]
  },
  {
    id: "output",
    title: "输出选项",
    description: "控制 systemd、部署说明与环境变量样例输出。",
    fields: ["include_systemd", "include_readme", "include_env_example"]
  }
];

export function getSimpleLayoutConfig(role: FormState["role"]): SimpleLayoutConfig {
  if (role === "relay") {
    return {
      commonFields: SIMPLE_RELAY_COMMON_FIELDS,
      networkFields: SIMPLE_RELAY_NETWORK_FIELDS,
      advancedGroups: ADVANCED_GROUPS
    };
  }

  return {
    commonFields: SIMPLE_CLIENT_COMMON_FIELDS,
    networkFields: SIMPLE_CLIENT_NETWORK_FIELDS,
    advancedGroups: ADVANCED_GROUPS
  };
}

function fieldHasValue(field: FormFieldKey, form: FormState): boolean {
  const value = form[field as keyof FormState];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === "string") {
        return item.trim().length > 0;
      }

      if (item && typeof item === "object") {
        return Object.values(item).some((nestedValue) => String(nestedValue).trim().length > 0);
      }

      return false;
    });
  }

  return false;
}

function riskMatchesAdvancedField(risk: RiskItem, fields: FormFieldKey[]): boolean {
  const haystack = `${risk.title} ${risk.detail}`.toLowerCase();
  return fields.some((field) => haystack.includes(field.toLowerCase()));
}

export function summarizeAdvancedSettings(form: FormState, risks: RiskItem[]) {
  const advancedFields = ADVANCED_GROUPS.flatMap((group) => group.fields);
  const enabledFieldCount = advancedFields.filter((field) => fieldHasValue(field, form)).length;
  const riskCount = risks.filter((risk) => riskMatchesAdvancedField(risk, advancedFields)).length;

  return {
    enabledFieldCount,
    riskCount
  };
}

export function getFieldPresentation(field: FormFieldKey, form: FormState): FieldPresentation {
  if (form.role === "relay" && form.relay_mode === "pure") {
    if (field === "dhcp") {
      return {
        disabled: true,
        note: "纯 relay 模式下不会输出 DHCP。"
      };
    }

    if (field === "ipv4") {
      return {
        disabled: true,
        note: "纯 relay 模式下不会输出 ipv4。"
      };
    }
  }

  if (form.mode === "strict_private") {
    if (field === "private_mode") {
      return {
        disabled: true,
        note: "严格私有模式会强制保持 private_mode = true。"
      };
    }

    if (field === "external_node") {
      return {
        disabled: true,
        note: "严格私有模式禁止使用公共共享节点。"
      };
    }

    if (field === "stun_servers" || field === "stun_servers_v6") {
      return {
        disabled: true,
        note: "严格私有模式会禁用 STUN。"
      };
    }
  }

  return {
    disabled: false
  };
}
