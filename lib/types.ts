export type GeneratorMode = "strict_private" | "advanced";
export type NodeRole = "client" | "relay";
export type RelayMode = "pure" | "join";
export type RelayListenerProfile = "full" | "udp_only";
export type ViewMode = "simple" | "advanced";
export type ArtifactKey = "toml" | "service" | "readme" | "env";
export type PresetId = "private_udp_client" | "private_wss_client" | "private_relay";
export type RiskLevel = "error" | "warning" | "info";

export interface ProxyNetworkEntry {
  cidr: string;
}

export interface PortForwardEntry {
  proto: "tcp" | "udp";
  bind_addr: string;
  dst_addr: string;
}

export interface FormState {
  mode: GeneratorMode;
  role: NodeRole;
  relay_mode: RelayMode;
  relay_listener_profile: RelayListenerProfile;
  hostname: string;
  instance_name: string;
  instance_id: string;
  network_name: string;
  network_secret: string;
  config_server: string;
  dhcp: boolean;
  keep_ipv4_when_dhcp: boolean;
  ipv4: string;
  ipv6: string;
  peers: string[];
  external_node: string;
  listeners: string[];
  mapped_listeners: string[];
  no_listener: boolean;
  private_mode: boolean;
  relay_network_whitelist: string[];
  relay_all_peer_rpc: boolean;
  proxy_networks: ProxyNetworkEntry[];
  port_forwards: PortForwardEntry[];
  rpc_portal: string;
  rpc_portal_whitelist: string[];
  multi_thread: boolean;
  multi_thread_count: string;
  latency_first: boolean;
  compression: boolean;
  stun_servers: string[];
  stun_servers_v6: string[];
  no_tun: boolean;
  disable_p2p: boolean;
  p2p_only: boolean;
  disable_tcp_hole_punching: boolean;
  disable_udp_hole_punching: boolean;
  disable_sym_hole_punching: boolean;
  socks5: string;
  mtu: string;
  dev_name: string;
  encryption_algorithm: string;
  disable_encryption: boolean;
  include_systemd: boolean;
  include_readme: boolean;
  include_env_example: boolean;
}

export interface RiskItem {
  level: RiskLevel;
  title: string;
  detail: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  issues: ValidationIssue[];
}

export type TomlImportWarning = ValidationIssue;

export interface TomlImportStats {
  importedFieldCount: number;
  peerCount: number;
  proxyNetworkCount: number;
  portForwardCount: number;
}

export interface TomlImportSuccess {
  ok: true;
  form: FormState;
  warnings: TomlImportWarning[];
  stats: TomlImportStats;
}

export interface TomlImportFailure {
  ok: false;
  message: string;
  warnings: TomlImportWarning[];
}

export type TomlImportResult = TomlImportSuccess | TomlImportFailure;

export interface ArtifactBundle {
  fileName: string;
  toml: string;
  service: string;
  readme: string;
  envExample: string;
}

export interface ArtifactFile {
  key: ArtifactKey;
  label: string;
  fileName: string;
  content: string;
}

export interface PresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  form: FormState;
}
