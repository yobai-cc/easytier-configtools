import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_STATE, DEFAULT_RELAY_LISTENERS } from "@/lib/defaults";
import { buildArtifacts } from "@/lib/generators";
import { getFieldPresentation, getSimpleLayoutConfig, summarizeAdvancedSettings } from "@/lib/layout-config";
import { validateFormState } from "@/lib/schema";
import { analyzeRisks, isLikelyPeerUrl, isUsernameOnlyConfigServer } from "@/lib/validators";

describe("validators", () => {
  it("detects username-only config_server values", () => {
    expect(isUsernameOnlyConfigServer("alice")).toBe(true);
    expect(isUsernameOnlyConfigServer("udp://controller.example.com:22020")).toBe(false);
  });

  it("accepts common EasyTier peer uri formats", () => {
    expect(isLikelyPeerUrl("tcp://114.215.254.66:11010")).toBe(true);
    expect(isLikelyPeerUrl("udp://relay.example.com:11010")).toBe(true);
    expect(isLikelyPeerUrl("wg://0.0.0.0:11011")).toBe(true);
    expect(isLikelyPeerUrl("wss://relay.example.com:443/easytier")).toBe(true);
    expect(isLikelyPeerUrl("quic://relay.example.com:11012")).toBe(true);
  });

  it("flags malformed peer uri input during form validation", () => {
    const result = validateFormState({
      ...DEFAULT_FORM_STATE,
      peers: ["relay.example.com:11010", "tcp://relay.example.com"]
    });

    expect(result.success).toBe(false);
    expect(result.issues.some((issue) => issue.path === "peers")).toBe(true);
  });

  it("raises private-network risks for public discovery and weak secrets", () => {
    const issues = analyzeRisks({
      ...DEFAULT_FORM_STATE,
      config_server: "operator01",
      external_node: "public.easytier.example",
      peers: ["tcp://public.easytier.example:11010"],
      private_mode: false,
      network_secret: "short",
      instance_id: "",
      dhcp: true,
      ipv4: "10.20.30.40/24"
    });

    expect(issues.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "config_server 仅填写用户名",
        "external_node 已启用",
        "peers 包含公共节点",
        "private_mode 已关闭",
        "network_secret 过短",
        "instance_id 为空",
        "同时启用了 DHCP 和静态 IPv4"
      ])
    );
  });
});

describe("artifact generation", () => {
  it("omits ipv4 when DHCP is enabled for a client", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      dhcp: true,
      keep_ipv4_when_dhcp: false,
      ipv4: "10.10.10.99/24"
    });

    expect(artifacts.toml).toContain('dhcp = true');
    expect(artifacts.toml).not.toContain('ipv4 = "10.10.10.99/24"');
  });

  it("keeps relay in pure forwarding mode by default", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      role: "relay",
      relay_mode: "pure",
      no_tun: true,
      ipv4: "10.10.10.2/24",
      listeners: DEFAULT_RELAY_LISTENERS
    });

    expect(artifacts.fileName).toBe("relay.toml");
    expect(artifacts.toml).toContain("no_tun = true");
    expect(artifacts.toml).not.toContain('ipv4 = "10.10.10.2/24"');
  });

  it("generates udp-only relay listeners when requested", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      role: "relay",
      relay_listener_profile: "udp_only",
      listeners: DEFAULT_RELAY_LISTENERS
    });

    expect(artifacts.toml).toContain('listeners = ["tcp://0.0.0.0:11010", "udp://0.0.0.0:11010"]');
    expect(artifacts.toml).not.toContain("ws://0.0.0.0:11011/");
    expect(artifacts.toml).not.toContain("wss://0.0.0.0:11012/");
  });

  it("emits official config sections for identity, peers and flags", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      mode: "advanced",
      instance_id: "02435bb3-bce4-42a2-8329-6a60ed58ee19",
      peers: ["tcp://114.215.254.66:11010"],
      proxy_networks: [{ cidr: "127.255.255.255" }],
      relay_network_whitelist: ["bv.yobai", "bvami.yobai"]
    });

    expect(artifacts.toml).toContain('instance_id = "02435bb3-bce4-42a2-8329-6a60ed58ee19"');
    expect(artifacts.toml).toContain("[network_identity]");
    expect(artifacts.toml).toContain('network_name = "corp-private-mesh"');
    expect(artifacts.toml).toContain('network_secret = "replace-with-a-strong-secret-32chars"');
    expect(artifacts.toml).toContain("[[peer]]");
    expect(artifacts.toml).toContain('uri = "tcp://114.215.254.66:11010"');
    expect(artifacts.toml).toContain("[[proxy_network]]");
    expect(artifacts.toml).toContain('cidr = "127.255.255.255"');
    expect(artifacts.toml).toContain("[flags]");
    expect(artifacts.toml).toContain('relay_network_whitelist = "bv.yobai bvami.yobai"');
  });

  it("emits official port_forward blocks for relay forwarding", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      role: "relay",
      relay_mode: "join",
      no_tun: false,
      ipv4: "10.18.0.254/24",
      listeners: ["tcp://0.0.0.0:11010", "udp://0.0.0.0:11010", "wg://0.0.0.0:11011"],
      port_forwards: [
        { proto: "tcp", bind_addr: "0.0.0.0:18080", dst_addr: "10.18.0.88:80" },
        { proto: "udp", bind_addr: "0.0.0.0:16680", dst_addr: "10.18.0.88:16680" }
      ]
    });

    expect(artifacts.toml).toContain("[[port_forward]]");
    expect(artifacts.toml).toContain('bind_addr = "0.0.0.0:18080"');
    expect(artifacts.toml).toContain('dst_addr = "10.18.0.88:80"');
    expect(artifacts.toml).toContain('proto = "tcp"');
    expect(artifacts.toml).toContain('bind_addr = "0.0.0.0:16680"');
    expect(artifacts.toml).toContain('dst_addr = "10.18.0.88:16680"');
    expect(artifacts.toml).toContain('proto = "udp"');
  });

  it("adds restart policy and file descriptor limits to relay service output", () => {
    const artifacts = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      role: "relay",
      listeners: DEFAULT_RELAY_LISTENERS
    });

    expect(artifacts.service).toContain("Restart=always");
    expect(artifacts.service).toContain("RestartSec=3");
    expect(artifacts.service).toContain("LimitNOFILE=1048576");
  });

  it("documents why strict private mode avoids official services", () => {
    const artifacts = buildArtifacts(DEFAULT_FORM_STATE);

    expect(artifacts.readme).toContain("为什么严格私有模式默认禁用官方服务");
    expect(artifacts.readme).toContain("仅用户名形式的 config_server 会使用官方服务器");
    expect(artifacts.readme).toContain("external_node 会使用公共共享节点");
    expect(artifacts.readme).toContain("22020");
    expect(artifacts.readme).toContain("wss://");
  });
});

describe("simple mode layout", () => {
  it("keeps common client deployment fields outside advanced settings", () => {
    const layout = getSimpleLayoutConfig("client");

    expect(layout.commonFields).toEqual(
      expect.arrayContaining([
        "hostname",
        "instance_name",
        "network_name",
        "network_secret",
        "instance_id",
        "config_server",
        "rpc_portal",
        "private_mode"
      ])
    );
    expect(layout.networkFields).toEqual(expect.arrayContaining(["dhcp", "ipv4", "ipv6", "peers"]));
  });

  it("keeps relay listeners visible in simple mode while grouping tuning options under advanced settings", () => {
    const layout = getSimpleLayoutConfig("relay");

    expect(layout.networkFields).toEqual(expect.arrayContaining(["relay_mode", "relay_listener_profile", "listeners", "mapped_listeners"]));
    expect(layout.advancedGroups.find((group) => group.id === "performance")?.fields).toEqual(
      expect.arrayContaining(["multi_thread", "compression", "disable_udp_hole_punching"])
    );
  });

  it("summarizes advanced customizations and related risks for the collapsed panel", () => {
    const form = {
      ...DEFAULT_FORM_STATE,
      external_node: "public.easytier.example",
      stun_servers: ["stun:stun.example.com:3478"],
      multi_thread: true
    };
    const risks = analyzeRisks(form);
    const summary = summarizeAdvancedSettings(form, risks);

    expect(summary.enabledFieldCount).toBeGreaterThanOrEqual(2);
    expect(summary.riskCount).toBeGreaterThanOrEqual(1);
  });

  it("marks relay ipv4 and dhcp as disabled in pure relay mode", () => {
    const relayForm = {
      ...DEFAULT_FORM_STATE,
      role: "relay" as const,
      relay_mode: "pure" as const
    };

    expect(getFieldPresentation("dhcp", relayForm)).toEqual({
      disabled: true,
      note: "纯 relay 模式下不会输出 DHCP。"
    });
    expect(getFieldPresentation("ipv4", relayForm)).toEqual({
      disabled: true,
      note: "纯 relay 模式下不会输出 ipv4。"
    });
  });

  it("marks strict private discovery fields as locked", () => {
    const strictForm = {
      ...DEFAULT_FORM_STATE,
      mode: "strict_private" as const
    };

    expect(getFieldPresentation("private_mode", strictForm)).toEqual({
      disabled: true,
      note: "严格私有模式会强制保持 private_mode = true。"
    });
    expect(getFieldPresentation("external_node", strictForm)).toEqual({
      disabled: true,
      note: "严格私有模式禁止使用公共共享节点。"
    });
  });
});
