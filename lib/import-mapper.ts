import type { FormState, NodeRole, RelayListenerProfile, RelayMode, TomlImportResult, TomlImportStats } from "@/lib/types";
import type { NormalizedTomlImport } from "@/lib/toml-import";
import { normalizeList, normalizePortForwards, normalizeProxyNetworks } from "@/lib/utils";
import { parseTomlImport } from "@/lib/toml-import";

function createImportBaseForm(currentForm: FormState): FormState {
  return {
    mode: "advanced",
    role: "client",
    relay_mode: "join",
    relay_listener_profile: "full",
    hostname: "",
    instance_name: "",
    instance_id: "",
    network_name: "",
    network_secret: "",
    config_server: "",
    dhcp: false,
    keep_ipv4_when_dhcp: false,
    ipv4: "",
    ipv6: "",
    peers: [],
    external_node: "",
    listeners: [],
    mapped_listeners: [],
    no_listener: false,
    private_mode: false,
    relay_network_whitelist: [],
    relay_all_peer_rpc: false,
    proxy_networks: [],
    port_forwards: [],
    rpc_portal: "",
    rpc_portal_whitelist: [],
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
    dev_name: "",
    encryption_algorithm: "",
    disable_encryption: false,
    include_systemd: currentForm.include_systemd,
    include_readme: currentForm.include_readme,
    include_env_example: currentForm.include_env_example
  };
}

function looksLikeRelayListenerProfile(listeners: string[]): boolean {
  return listeners.some(
    (listener) =>
      listener.startsWith("ws://") ||
      listener.startsWith("wss://") ||
      listener.startsWith("wg://") ||
      /:\/\/(?:0\.0\.0\.0|\[::\]|::)/.test(listener)
  );
}

function isRelayListenerEndpoint(listener: string): boolean {
  return (
    listener.startsWith("tcp://") ||
    listener.startsWith("udp://") ||
    listener.startsWith("ws://") ||
    listener.startsWith("wss://") ||
    listener.startsWith("wg://")
  );
}

function hasRelayLikeListenerSignals(form: FormState): boolean {
  if (form.listeners.length === 0) {
    return false;
  }

  const listenerEndpoints = form.listeners.every(isRelayListenerEndpoint);
  if (!listenerEndpoints) {
    return false;
  }

  if (form.no_tun || form.no_listener) {
    return true;
  }

  if (form.mapped_listeners.length > 0 || form.relay_network_whitelist.length > 0) {
    return true;
  }

  if (looksLikeRelayListenerProfile(form.listeners)) {
    return true;
  }

  return form.listeners.length > 1 && form.peers.length === 0;
}

function inferRole(form: FormState): NodeRole {
  if (form.port_forwards.length > 0) {
    return "relay";
  }

  if (form.no_listener && (form.no_tun || form.relay_network_whitelist.length > 0 || form.mapped_listeners.length > 0)) {
    return "relay";
  }

  if (hasRelayLikeListenerSignals(form)) {
    return "relay";
  }

  return "client";
}

function inferRelayMode(form: FormState, role: NodeRole): RelayMode {
  if (role === "relay" && form.no_tun && form.ipv4.trim() === "" && form.dhcp === false) {
    return "pure";
  }

  return "join";
}

function inferRelayListenerProfile(listeners: string[]): RelayListenerProfile {
  if (listeners.length > 0 && listeners.every((listener) => listener.startsWith("tcp://") || listener.startsWith("udp://"))) {
    return "udp_only";
  }

  return "full";
}

function inferMode(form: FormState, role: NodeRole): FormState["mode"] {
  if (
    form.private_mode &&
    form.config_server.trim() !== "" &&
    form.external_node.trim() === "" &&
    form.stun_servers.length === 0 &&
    form.stun_servers_v6.length === 0 &&
    (role !== "client" || form.peers.length > 0)
  ) {
    return "strict_private";
  }

  return "advanced";
}

function buildStats(data: NormalizedTomlImport): TomlImportStats {
  return {
    importedFieldCount:
      Object.keys(data.topLevel).length +
      Object.keys(data.networkIdentity).length +
      Object.keys(data.flags).length +
      (data.peers.length > 0 ? 1 : 0) +
      (data.proxyNetworks.length > 0 ? 1 : 0) +
      (data.portForwards.length > 0 ? 1 : 0),
    peerCount: data.peers.length,
    proxyNetworkCount: data.proxyNetworks.length,
    portForwardCount: data.portForwards.length
  };
}

export function importTomlToForm(toml: string, currentForm: FormState): TomlImportResult {
  const parsed = parseTomlImport(toml);

  if (!parsed.ok) {
    return {
      ok: false,
      message: parsed.message,
      warnings: parsed.warnings
    };
  }

  const next = createImportBaseForm(currentForm);
  const { topLevel, networkIdentity, peers, proxyNetworks, portForwards, flags } = parsed.data;

  if (topLevel.hostname !== undefined) {
    next.hostname = topLevel.hostname;
  }
  if (topLevel.instance_name !== undefined) {
    next.instance_name = topLevel.instance_name;
  }
  if (topLevel.instance_id !== undefined) {
    next.instance_id = topLevel.instance_id;
  }
  if (topLevel.config_server !== undefined) {
    next.config_server = topLevel.config_server;
  }
  if (topLevel.ipv4 !== undefined) {
    next.ipv4 = topLevel.ipv4;
  }
  if (topLevel.ipv6 !== undefined) {
    next.ipv6 = topLevel.ipv6;
  }
  if (topLevel.dhcp !== undefined) {
    next.dhcp = topLevel.dhcp;
  }
  if (topLevel.listeners !== undefined) {
    next.listeners = normalizeList(topLevel.listeners);
  }
  if (topLevel.mapped_listeners !== undefined) {
    next.mapped_listeners = normalizeList(topLevel.mapped_listeners);
  }
  if (topLevel.no_listener !== undefined) {
    next.no_listener = topLevel.no_listener;
  }
  if (topLevel.rpc_portal !== undefined) {
    next.rpc_portal = topLevel.rpc_portal;
  }

  if (networkIdentity.network_name !== undefined) {
    next.network_name = networkIdentity.network_name;
  }
  if (networkIdentity.network_secret !== undefined) {
    next.network_secret = networkIdentity.network_secret;
  }

  next.peers = normalizeList(peers.map((peer) => peer.uri));
  next.proxy_networks = normalizeProxyNetworks(proxyNetworks);
  next.port_forwards = normalizePortForwards(portForwards);

  if (flags.private_mode !== undefined) {
    next.private_mode = flags.private_mode;
  }
  if (flags.relay_network_whitelist !== undefined) {
    next.relay_network_whitelist = normalizeList(flags.relay_network_whitelist);
  }
  if (flags.relay_all_peer_rpc !== undefined) {
    next.relay_all_peer_rpc = flags.relay_all_peer_rpc;
  }
  if (flags.multi_thread !== undefined) {
    next.multi_thread = flags.multi_thread;
  }
  if (flags.multi_thread_count !== undefined) {
    next.multi_thread_count = flags.multi_thread_count;
  }
  if (flags.latency_first !== undefined) {
    next.latency_first = flags.latency_first;
  }
  if (flags.compression !== undefined) {
    next.compression = flags.compression;
  }
  if (flags.stun_servers !== undefined) {
    next.stun_servers = normalizeList(flags.stun_servers);
  }
  if (flags.stun_servers_v6 !== undefined) {
    next.stun_servers_v6 = normalizeList(flags.stun_servers_v6);
  }
  if (flags.no_tun !== undefined) {
    next.no_tun = flags.no_tun;
  }
  if (flags.disable_p2p !== undefined) {
    next.disable_p2p = flags.disable_p2p;
  }
  if (flags.p2p_only !== undefined) {
    next.p2p_only = flags.p2p_only;
  }
  if (flags.disable_tcp_hole_punching !== undefined) {
    next.disable_tcp_hole_punching = flags.disable_tcp_hole_punching;
  }
  if (flags.disable_udp_hole_punching !== undefined) {
    next.disable_udp_hole_punching = flags.disable_udp_hole_punching;
  }
  if (flags.disable_sym_hole_punching !== undefined) {
    next.disable_sym_hole_punching = flags.disable_sym_hole_punching;
  }
  if (flags.socks5 !== undefined) {
    next.socks5 = flags.socks5;
  }
  if (flags.mtu !== undefined) {
    next.mtu = flags.mtu;
  }
  if (flags.dev_name !== undefined) {
    next.dev_name = flags.dev_name;
  }
  if (flags.encryption_algorithm !== undefined) {
    next.encryption_algorithm = flags.encryption_algorithm;
  }
  if (flags.disable_encryption !== undefined) {
    next.disable_encryption = flags.disable_encryption;
  }
  if (flags.rpc_portal_whitelist !== undefined) {
    next.rpc_portal_whitelist = normalizeList(flags.rpc_portal_whitelist);
  }
  if (flags.external_node !== undefined) {
    next.external_node = flags.external_node;
  }

  next.keep_ipv4_when_dhcp = next.dhcp && next.ipv4.trim() !== "";

  const role = inferRole(next);
  next.role = role;
  next.relay_mode = inferRelayMode(next, role);
  next.relay_listener_profile = inferRelayListenerProfile(next.listeners);
  next.mode = inferMode(next, role);

  return {
    ok: true,
    form: next,
    warnings: parsed.warnings,
    stats: buildStats(parsed.data)
  };
}
