import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_STATE } from "@/lib/defaults";
import { buildArtifacts } from "@/lib/generators";
import { importTomlToForm } from "@/lib/import-mapper";
import type { FormState, TomlImportResult } from "@/lib/types";

it("returns structured import results", () => {
  const result: TomlImportResult = {
    ok: false,
    message: "invalid toml",
    warnings: []
  };

  expect(result.ok).toBe(false);
});

describe("toml import", () => {
  it("imports a basic client config", () => {
    const result = importTomlToForm(
      `
hostname = "client-hz-01"
instance_name = "private-client"
instance_id = "02435bb3-bce4-42a2-8329-6a60ed58ee19"
config_server = "udp://controller.example.com:22020"
ipv4 = "10.10.10.10/24"
dhcp = false

[network_identity]
network_name = "corp-private-mesh"
network_secret = "replace-with-a-strong-secret-32chars"

[[peer]]
uri = "tcp://relay.example.com:11010"

[flags]
private_mode = true
rpc_portal_whitelist = "127.0.0.1/32"
      `,
      DEFAULT_FORM_STATE
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.form.role).toBe("client");
    expect(result.form.mode).toBe("strict_private");
    expect(result.form.hostname).toBe("client-hz-01");
    expect(result.form.instance_id).toBe("02435bb3-bce4-42a2-8329-6a60ed58ee19");
    expect(result.form.peers).toEqual(["tcp://relay.example.com:11010"]);
    expect(result.form.rpc_portal_whitelist).toEqual(["127.0.0.1/32"]);
  });

  it("imports a relay config with port forwards", () => {
    const result = importTomlToForm(
      `
hostname = "relay-hz-01"
instance_name = "private-relay"
listeners = ["tcp://0.0.0.0:11010", "udp://0.0.0.0:11010"]
dhcp = false

[network_identity]
network_name = "corp-private-mesh"
network_secret = "replace-with-a-strong-secret-32chars"

[[port_forward]]
proto = "tcp"
bind_addr = "0.0.0.0:18080"
dst_addr = "10.18.0.88:80"

[flags]
no_tun = true
      `,
      DEFAULT_FORM_STATE
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.form.role).toBe("relay");
    expect(result.form.relay_mode).toBe("pure");
    expect(result.form.relay_listener_profile).toBe("udp_only");
    expect(result.form.port_forwards).toEqual([
      { proto: "tcp", bind_addr: "0.0.0.0:18080", dst_addr: "10.18.0.88:80" }
    ]);
  });

  it("imports numeric flags and warns on lossy compression values", () => {
    const result = importTomlToForm(
      `
hostname = "relay-hz-01"

[network_identity]
network_name = "corp-private-mesh"
network_secret = "replace-with-a-strong-secret-32chars"

[flags]
multi_thread_count = 8
mtu = 1400
compression = "lz4"
      `,
      DEFAULT_FORM_STATE
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.form.multi_thread_count).toBe("8");
    expect(result.form.mtu).toBe("1400");
    expect(result.form.compression).toBe(false);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ path: "flags.compression" })]));
  });

  it("records warnings for unmapped fields", () => {
    const result = importTomlToForm(
      `
hostname = "client-hz-01"
unknown_top_level = "x"

[network_identity]
network_name = "corp-private-mesh"
network_secret = "replace-with-a-strong-secret-32chars"
unknown_network_identity = "y"

[[peer]]
uri = "tcp://relay.example.com:11010"
cost = 10

[flags]
private_mode = true
unknown_flag = true
      `,
      DEFAULT_FORM_STATE
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.warnings.map((item: { path: string }) => item.path)).toEqual(
      expect.arrayContaining([
        "topLevel.unknown_top_level",
        "network_identity.unknown_network_identity",
        "peer[0].cost",
        "flags.unknown_flag"
      ])
    );
  });

  it("fails on invalid toml", () => {
    const currentForm: FormState = {
      ...DEFAULT_FORM_STATE,
      hostname: "preserve-me",
      peers: ["tcp://keep.example.com:11010"],
      port_forwards: [{ proto: "udp", bind_addr: "0.0.0.0:16680", dst_addr: "10.0.0.1:16680" }]
    };
    const snapshot = JSON.parse(JSON.stringify(currentForm));

    const result = importTomlToForm(
      `
hostname = "broken
[network_identity]
network_name = "corp-private-mesh"
      `,
      currentForm
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.message).toMatch(/toml/i);
    expect(currentForm).toEqual(snapshot);
  });

  it("fails when a required array-table field becomes blank after trimming", () => {
    const result = importTomlToForm(
      `
hostname = "relay-hz-01"

[network_identity]
network_name = "corp-private-mesh"
network_secret = "replace-with-a-strong-secret-32chars"

[[port_forward]]
proto = "udp"
bind_addr = "   "
dst_addr = "10.18.0.88:16680"
      `,
      DEFAULT_FORM_STATE
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.message).toContain("port_forward[0].bind_addr");
  });

  it("preserves supported fields through generator round-trip", () => {
    const toml = buildArtifacts({
      ...DEFAULT_FORM_STATE,
      mode: "advanced",
      role: "relay",
      relay_mode: "join",
      no_tun: false,
      ipv4: "10.18.0.254/24",
      listeners: ["tcp://0.0.0.0:11010", "udp://0.0.0.0:11010", "wg://0.0.0.0:11011"],
      port_forwards: [{ proto: "udp", bind_addr: "0.0.0.0:16680", dst_addr: "10.18.0.88:16680" }]
    }).toml;

    const result = importTomlToForm(toml, DEFAULT_FORM_STATE);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.form.role).toBe("relay");
    expect(result.form.port_forwards).toEqual([
      { proto: "udp", bind_addr: "0.0.0.0:16680", dst_addr: "10.18.0.88:16680" }
    ]);
    expect(result.form.listeners).toEqual([
      "tcp://0.0.0.0:11010",
      "udp://0.0.0.0:11010",
      "wg://0.0.0.0:11011"
    ]);
  });
});
