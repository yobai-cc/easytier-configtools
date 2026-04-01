import { applyModeDefaults, applyRoleDefaults, createDefaultFormState, DEFAULT_RELAY_LISTENERS } from "@/lib/defaults";
import type { PresetDefinition } from "@/lib/types";
import { cloneFormState } from "@/lib/utils";

function createPrivateUdpClientPreset(): PresetDefinition {
  const base = applyModeDefaults(createDefaultFormState(), "strict_private");

  return {
    id: "private_udp_client",
    name: "私有 UDP 终端",
    description: "使用自建 UDP 配置下发和私有 relay peers 的常规终端节点。",
    form: {
      ...cloneFormState(base),
      role: "client",
      hostname: "client-hz-udp-01",
      instance_name: "private-udp-client",
      instance_id: "11111111-1111-4111-8111-111111111111",
      config_server: "udp://controller.example.com:22020",
      peers: ["tcp://relay.example.com:11010"],
      ipv4: "10.20.0.11/24",
      dhcp: false
    }
  };
}

function createPrivateWssClientPreset(): PresetDefinition {
  const base = applyModeDefaults(createDefaultFormState(), "strict_private");

  return {
    id: "private_wss_client",
    name: "私有 WSS 终端",
    description: "适合穿过反代 / TLS 入口，通过 wss:// 获取配置的私有终端节点。",
    form: {
      ...cloneFormState(base),
      role: "client",
      hostname: "client-sh-wss-01",
      instance_name: "private-wss-client",
      instance_id: "22222222-2222-4222-8222-222222222222",
      config_server: "wss://console.example.com/easytier",
      peers: ["wss://relay.example.com:11012/"],
      ipv4: "10.20.1.12/24"
    }
  };
}

function createPrivateRelayPreset(): PresetDefinition {
  const base = applyRoleDefaults(applyModeDefaults(createDefaultFormState(), "strict_private"), "relay");

  return {
    id: "private_relay",
    name: "私有 Relay",
    description: "严格私有模式下的纯转发 relay，不分配 TUN 地址，只暴露必要 listener。",
    form: {
      ...cloneFormState(base),
      role: "relay",
      hostname: "relay-bj-01",
      instance_name: "private-relay",
      instance_id: "33333333-3333-4333-8333-333333333333",
      config_server: "udp://controller.example.com:22020",
      listeners: [...DEFAULT_RELAY_LISTENERS],
      peers: [],
      no_tun: true,
      dhcp: false,
      ipv4: ""
    }
  };
}

export const PRESETS: PresetDefinition[] = [
  createPrivateUdpClientPreset(),
  createPrivateWssClientPreset(),
  createPrivateRelayPreset()
];
