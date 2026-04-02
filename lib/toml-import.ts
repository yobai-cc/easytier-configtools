import { parse, type TomlTableWithoutBigInt, type TomlValueWithoutBigInt } from "smol-toml";
import type { PortForwardEntry, TomlImportWarning } from "@/lib/types";

type TomlTable = TomlTableWithoutBigInt;
type TomlValue = TomlValueWithoutBigInt;

type TopLevelKey =
  | "hostname"
  | "instance_name"
  | "instance_id"
  | "config_server"
  | "ipv4"
  | "ipv6"
  | "dhcp"
  | "listeners"
  | "mapped_listeners"
  | "no_listener"
  | "rpc_portal";

type NetworkIdentityKey = "network_name" | "network_secret";

type FlagKey =
  | "private_mode"
  | "relay_network_whitelist"
  | "relay_all_peer_rpc"
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
  | "rpc_portal_whitelist"
  | "external_node";

export interface NormalizedTopLevel {
  hostname?: string;
  instance_name?: string;
  instance_id?: string;
  config_server?: string;
  ipv4?: string;
  ipv6?: string;
  dhcp?: boolean;
  listeners?: string[];
  mapped_listeners?: string[];
  no_listener?: boolean;
  rpc_portal?: string;
}

export interface NormalizedNetworkIdentity {
  network_name?: string;
  network_secret?: string;
}

export interface NormalizedFlags {
  private_mode?: boolean;
  relay_network_whitelist?: string[];
  relay_all_peer_rpc?: boolean;
  multi_thread?: boolean;
  multi_thread_count?: string;
  latency_first?: boolean;
  compression?: boolean;
  stun_servers?: string[];
  stun_servers_v6?: string[];
  no_tun?: boolean;
  disable_p2p?: boolean;
  p2p_only?: boolean;
  disable_tcp_hole_punching?: boolean;
  disable_udp_hole_punching?: boolean;
  disable_sym_hole_punching?: boolean;
  socks5?: string;
  mtu?: string;
  dev_name?: string;
  encryption_algorithm?: string;
  disable_encryption?: boolean;
  rpc_portal_whitelist?: string[];
  external_node?: string;
}

export interface NormalizedTomlImport {
  topLevel: NormalizedTopLevel;
  networkIdentity: NormalizedNetworkIdentity;
  peers: Array<{ uri: string }>;
  proxyNetworks: Array<{ cidr: string }>;
  portForwards: PortForwardEntry[];
  flags: NormalizedFlags;
}

export interface ParseTomlImportSuccess {
  ok: true;
  data: NormalizedTomlImport;
  warnings: TomlImportWarning[];
}

export interface ParseTomlImportFailure {
  ok: false;
  message: string;
  warnings: TomlImportWarning[];
}

export type ParseTomlImportResult = ParseTomlImportSuccess | ParseTomlImportFailure;

const TOP_LEVEL_KEYS = new Set<TopLevelKey>([
  "hostname",
  "instance_name",
  "instance_id",
  "config_server",
  "ipv4",
  "ipv6",
  "dhcp",
  "listeners",
  "mapped_listeners",
  "no_listener",
  "rpc_portal"
]);

const NETWORK_IDENTITY_KEYS = new Set<NetworkIdentityKey>(["network_name", "network_secret"]);

const FLAG_KEYS = new Set<FlagKey>([
  "private_mode",
  "relay_network_whitelist",
  "relay_all_peer_rpc",
  "multi_thread",
  "multi_thread_count",
  "latency_first",
  "compression",
  "stun_servers",
  "stun_servers_v6",
  "no_tun",
  "disable_p2p",
  "p2p_only",
  "disable_tcp_hole_punching",
  "disable_udp_hole_punching",
  "disable_sym_hole_punching",
  "socks5",
  "mtu",
  "dev_name",
  "encryption_algorithm",
  "disable_encryption",
  "rpc_portal_whitelist",
  "external_node"
]);

function failure(message: string, warnings: TomlImportWarning[] = []): ParseTomlImportFailure {
  return {
    ok: false,
    message,
    warnings
  };
}

function isTomlTable(value: TomlValue | undefined): value is TomlTable {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: TomlValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function expectString(value: TomlValue | undefined, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`Unsupported TOML structure at ${path}: expected a string.`);
  }

  return value.trim();
}

function expectNonBlankString(value: TomlValue | undefined, path: string): string {
  const trimmed = expectString(value, path);

  if (trimmed === "") {
    throw new Error(`Unsupported TOML structure at ${path}: value cannot be blank after trimming.`);
  }

  return trimmed;
}

function expectBoolean(value: TomlValue | undefined, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Unsupported TOML structure at ${path}: expected a boolean.`);
  }

  return value;
}

function expectNumber(value: TomlValue | undefined, path: string): number {
  if (typeof value !== "number") {
    throw new Error(`Unsupported TOML structure at ${path}: expected a number.`);
  }

  return value;
}

function expectStringArray(value: TomlValue | undefined, path: string): string[] {
  if (!isStringArray(value)) {
    throw new Error(`Unsupported TOML structure at ${path}: expected a string array.`);
  }

  return value.map((item, index) => expectNonBlankString(item, `${path}[${index}]`));
}

function expectTable(value: TomlValue | undefined, path: string): TomlTable {
  if (!isTomlTable(value)) {
    throw new Error(`Unsupported TOML structure at ${path}: expected a table.`);
  }

  return value;
}

function expectArrayOfTables(value: TomlValue | undefined, path: string): TomlTable[] {
  if (!Array.isArray(value) || value.some((item) => !isTomlTable(item))) {
    throw new Error(`Unsupported TOML structure at ${path}: expected an array of tables.`);
  }

  return value as TomlTable[];
}

function parseWhitespaceList(value: string, path: string): string[] {
  if (value.trim() === "") {
    throw new Error(`Unsupported TOML structure at ${path}: value cannot be blank after trimming.`);
  }

  return value.trim().split(/\s+/g);
}

function parseCommaList(value: string, path: string): string[] {
  return value.split(",").map((item, index) => expectNonBlankString(item, `${path}[${index}]`));
}

function parseTopLevel(table: TomlTable, warnings: TomlImportWarning[]): NormalizedTopLevel {
  const topLevel: NormalizedTopLevel = {};

  for (const [rawKey, value] of Object.entries(table)) {
    if (rawKey === "network_identity" || rawKey === "flags" || rawKey === "peer" || rawKey === "proxy_network" || rawKey === "port_forward") {
      continue;
    }

    if (!TOP_LEVEL_KEYS.has(rawKey as TopLevelKey)) {
      warnings.push({
        path: `topLevel.${rawKey}`,
        message: `Unsupported top-level key "${rawKey}" was ignored during import.`
      });
      continue;
    }

    const key = rawKey as TopLevelKey;

    switch (key) {
      case "hostname":
      case "instance_name":
        topLevel[key] = expectNonBlankString(value, `topLevel.${key}`);
        break;
      case "instance_id":
      case "config_server":
      case "ipv4":
      case "ipv6":
      case "rpc_portal":
        topLevel[key] = expectString(value, `topLevel.${key}`);
        break;
      case "dhcp":
      case "no_listener":
        topLevel[key] = expectBoolean(value, `topLevel.${key}`);
        break;
      case "listeners":
      case "mapped_listeners":
        topLevel[key] = expectStringArray(value, `topLevel.${key}`);
        break;
    }
  }

  return topLevel;
}

function parseNetworkIdentity(value: TomlValue | undefined, warnings: TomlImportWarning[]): NormalizedNetworkIdentity {
  if (value === undefined) {
    return {};
  }

  const table = expectTable(value, "network_identity");
  const networkIdentity: NormalizedNetworkIdentity = {};

  for (const [rawKey, entry] of Object.entries(table)) {
    if (!NETWORK_IDENTITY_KEYS.has(rawKey as NetworkIdentityKey)) {
      warnings.push({
        path: `network_identity.${rawKey}`,
        message: `Unsupported network_identity key "${rawKey}" was ignored during import.`
      });
      continue;
    }

    const key = rawKey as NetworkIdentityKey;
    networkIdentity[key] = expectNonBlankString(entry, `network_identity.${key}`);
  }

  return networkIdentity;
}

function parsePeers(value: TomlValue | undefined, warnings: TomlImportWarning[]): Array<{ uri: string }> {
  if (value === undefined) {
    return [];
  }

  const rows = expectArrayOfTables(value, "peer");

  return rows.map((row, index) => {
    for (const key of Object.keys(row)) {
      if (key !== "uri") {
        warnings.push({
          path: `peer[${index}].${key}`,
          message: `Unsupported peer field "${key}" was ignored during import.`
        });
      }
    }

    return {
      uri: expectNonBlankString(row.uri, `peer[${index}].uri`)
    };
  });
}

function parseProxyNetworks(value: TomlValue | undefined, warnings: TomlImportWarning[]): Array<{ cidr: string }> {
  if (value === undefined) {
    return [];
  }

  const rows = expectArrayOfTables(value, "proxy_network");

  return rows.map((row, index) => {
    for (const key of Object.keys(row)) {
      if (key !== "cidr") {
        warnings.push({
          path: `proxy_network[${index}].${key}`,
          message: `Unsupported proxy_network field "${key}" was ignored during import.`
        });
      }
    }

    return {
      cidr: expectNonBlankString(row.cidr, `proxy_network[${index}].cidr`)
    };
  });
}

function parsePortForwards(value: TomlValue | undefined, warnings: TomlImportWarning[]): PortForwardEntry[] {
  if (value === undefined) {
    return [];
  }

  const rows = expectArrayOfTables(value, "port_forward");

  return rows.map((row, index) => {
    for (const key of Object.keys(row)) {
      if (key !== "proto" && key !== "bind_addr" && key !== "dst_addr") {
        warnings.push({
          path: `port_forward[${index}].${key}`,
          message: `Unsupported port_forward field "${key}" was ignored during import.`
        });
      }
    }

    const proto = expectNonBlankString(row.proto, `port_forward[${index}].proto`);
    if (proto !== "tcp" && proto !== "udp") {
      throw new Error(`Unsupported TOML structure at port_forward[${index}].proto: expected "tcp" or "udp".`);
    }

    return {
      proto,
      bind_addr: expectNonBlankString(row.bind_addr, `port_forward[${index}].bind_addr`),
      dst_addr: expectNonBlankString(row.dst_addr, `port_forward[${index}].dst_addr`)
    };
  });
}

function parseFlags(value: TomlValue | undefined, warnings: TomlImportWarning[]): NormalizedFlags {
  if (value === undefined) {
    return {};
  }

  const table = expectTable(value, "flags");
  const flags: NormalizedFlags = {};

  for (const [rawKey, entry] of Object.entries(table)) {
    if (!FLAG_KEYS.has(rawKey as FlagKey)) {
      warnings.push({
        path: `flags.${rawKey}`,
        message: `Unsupported flags key "${rawKey}" was ignored during import.`
      });
      continue;
    }

    const key = rawKey as FlagKey;

    switch (key) {
      case "private_mode":
      case "relay_all_peer_rpc":
      case "multi_thread":
      case "latency_first":
      case "no_tun":
      case "disable_p2p":
      case "p2p_only":
      case "disable_tcp_hole_punching":
      case "disable_udp_hole_punching":
      case "disable_sym_hole_punching":
      case "disable_encryption":
        flags[key] = expectBoolean(entry, `flags.${key}`);
        break;
      case "multi_thread_count":
      case "mtu":
        flags[key] = String(expectNumber(entry, `flags.${key}`));
        break;
      case "stun_servers":
      case "stun_servers_v6":
        flags[key] = expectStringArray(entry, `flags.${key}`);
        break;
      case "relay_network_whitelist":
        flags.relay_network_whitelist = parseWhitespaceList(expectString(entry, "flags.relay_network_whitelist"), "flags.relay_network_whitelist");
        break;
      case "rpc_portal_whitelist":
        flags.rpc_portal_whitelist = parseCommaList(expectString(entry, "flags.rpc_portal_whitelist"), "flags.rpc_portal_whitelist");
        break;
      case "compression": {
        const compression = expectString(entry, "flags.compression");

        if (compression === "zstd") {
          flags.compression = true;
        } else if (compression === "none") {
          flags.compression = false;
        } else {
          flags.compression = false;
          warnings.push({
            path: "flags.compression",
            message: `Compression value "${compression}" cannot be fully represented by the current UI and was imported as disabled.`
          });
        }
        break;
      }
      case "socks5":
      case "dev_name":
      case "encryption_algorithm":
      case "external_node":
        flags[key] = expectString(entry, `flags.${key}`);
        break;
    }
  }

  return flags;
}

export function parseTomlImport(toml: string): ParseTomlImportResult {
  let parsed: TomlTableWithoutBigInt;

  try {
    parsed = parse(toml) as TomlTableWithoutBigInt;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown TOML parse error.";
    return failure(`Failed to parse TOML: ${message}`);
  }

  const warnings: TomlImportWarning[] = [];

  try {
    return {
      ok: true,
      data: {
        topLevel: parseTopLevel(parsed, warnings),
        networkIdentity: parseNetworkIdentity(parsed.network_identity, warnings),
        peers: parsePeers(parsed.peer, warnings),
        proxyNetworks: parseProxyNetworks(parsed.proxy_network, warnings),
        portForwards: parsePortForwards(parsed.port_forward, warnings),
        flags: parseFlags(parsed.flags, warnings)
      },
      warnings
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown TOML import normalization error.";
    return failure(message, warnings);
  }
}
