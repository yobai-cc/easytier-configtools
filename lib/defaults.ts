import type { FormState, GeneratorMode, NodeRole } from "@/lib/types";
import { cloneFormState, normalizeList } from "@/lib/utils";

export const DEFAULT_RELAY_LISTENERS = [
  "tcp://0.0.0.0:11010",
  "udp://0.0.0.0:11010",
  "ws://0.0.0.0:11011/",
  "wss://0.0.0.0:11012/",
  "wg://0.0.0.0:11013"
];

export const DEFAULT_FORM_STATE: FormState = {
  mode: "strict_private",
  role: "client",
  relay_mode: "pure",
  relay_listener_profile: "full",
  hostname: "client-hz-01",
  instance_name: "private-client",
  instance_id: "",
  network_name: "corp-private-mesh",
  network_secret: "replace-with-a-strong-secret-32chars",
  config_server: "udp://controller.example.com:22020",
  dhcp: false,
  keep_ipv4_when_dhcp: false,
  ipv4: "10.10.10.10/24",
  ipv6: "",
  peers: ["tcp://relay.example.com:11010"],
  external_node: "",
  listeners: [],
  mapped_listeners: [],
  no_listener: false,
  private_mode: true,
  relay_network_whitelist: [],
  relay_all_peer_rpc: true,
  proxy_networks: [],
  port_forwards: [],
  rpc_portal: "127.0.0.1:15888",
  rpc_portal_whitelist: ["127.0.0.1/32"],
  multi_thread: false,
  multi_thread_count: "",
  latency_first: false,
  compression: false,
  stun_servers: [],
  stun_servers_v6: [],
  no_tun: false,
  disable_p2p: false,
  p2p_only: false,
  disable_tcp_hole_punching: false,
  disable_udp_hole_punching: false,
  disable_sym_hole_punching: false,
  socks5: "",
  mtu: "",
  dev_name: "et0",
  encryption_algorithm: "auto",
  disable_encryption: false,
  include_systemd: true,
  include_readme: true,
  include_env_example: true
};

export function createDefaultFormState(): FormState {
  return cloneFormState(DEFAULT_FORM_STATE);
}

export function applyRoleDefaults(input: FormState, role: NodeRole): FormState {
  const next = cloneFormState(input);
  next.role = role;

  if (role === "relay") {
    if (normalizeList(next.listeners).length === 0) {
      next.listeners = [...DEFAULT_RELAY_LISTENERS];
    }

    if (!next.relay_mode) {
      next.relay_mode = "pure";
    }
  } else {
    next.relay_mode = "pure";
    next.relay_listener_profile = "full";
    next.listeners = [];
    next.relay_network_whitelist = [];
    next.relay_all_peer_rpc = true;
    next.no_tun = false;
  }

  return applyModeDefaults(next, next.mode);
}

export function applyModeDefaults(input: FormState, mode: GeneratorMode): FormState {
  const next = cloneFormState(input);
  next.mode = mode;

  if (mode === "strict_private") {
    next.private_mode = true;
    next.external_node = "";
    next.stun_servers = [];
    next.stun_servers_v6 = [];

    if (next.role === "client") {
      next.proxy_networks = [];
      next.rpc_portal = next.rpc_portal.trim() || "127.0.0.1:15888";
      next.rpc_portal_whitelist =
        normalizeList(next.rpc_portal_whitelist).length > 0 ? normalizeList(next.rpc_portal_whitelist) : ["127.0.0.1/32"];
    }

    if (next.role === "relay") {
      next.relay_mode = "pure";
      next.no_tun = true;
      next.dhcp = false;
      next.ipv4 = "";

      if (normalizeList(next.listeners).length === 0) {
        next.listeners = [...DEFAULT_RELAY_LISTENERS];
      }
    }
  }

  return next;
}
