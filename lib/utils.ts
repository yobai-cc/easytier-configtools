import type { FormState, PortForwardEntry, ProxyNetworkEntry } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function normalizeList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function normalizeProxyNetworks(values: ProxyNetworkEntry[]): ProxyNetworkEntry[] {
  return values
    .map((value) => ({ cidr: value.cidr.trim() }))
    .filter((value) => value.cidr.length > 0);
}

export function normalizePortForwards(values: PortForwardEntry[]): PortForwardEntry[] {
  return values
    .map((value) => ({
      proto: value.proto,
      bind_addr: value.bind_addr.trim(),
      dst_addr: value.dst_addr.trim()
    }))
    .filter((value) => value.bind_addr.length > 0 && value.dst_addr.length > 0);
}

export function parseLineSeparated(value: string): string[] {
  return normalizeList(value.split(/\r?\n/g));
}

export function cloneFormState(input: FormState): FormState {
  return {
    ...input,
    peers: [...input.peers],
    listeners: [...input.listeners],
    mapped_listeners: [...input.mapped_listeners],
    relay_network_whitelist: [...input.relay_network_whitelist],
    proxy_networks: input.proxy_networks.map((item) => ({ ...item })),
    port_forwards: input.port_forwards.map((item) => ({ ...item })),
    rpc_portal_whitelist: [...input.rpc_portal_whitelist],
    stun_servers: [...input.stun_servers],
    stun_servers_v6: [...input.stun_servers_v6]
  };
}

export function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
