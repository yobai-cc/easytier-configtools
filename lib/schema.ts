import { z } from "zod";
import type { FormState, ValidationResult } from "@/lib/types";
import { isFullConfigServerUrl, isLikelyPeerUrl, isUsernameOnlyConfigServer } from "@/lib/validators";
import { normalizeList } from "@/lib/utils";

const numericString = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "请输入数字。");

export const formSchema = z
  .object({
    mode: z.enum(["strict_private", "advanced"]),
    role: z.enum(["client", "relay"]),
    relay_mode: z.enum(["pure", "join"]),
    relay_listener_profile: z.enum(["full", "udp_only"]),
    hostname: z.string().trim().min(1, "hostname 不能为空。"),
    instance_name: z.string().trim().min(1, "instance_name 不能为空。"),
    instance_id: z.string().trim(),
    network_name: z.string().trim().min(1, "network_name 不能为空。"),
    network_secret: z.string().trim().min(1, "network_secret 不能为空。"),
    config_server: z.string().trim(),
    dhcp: z.boolean(),
    keep_ipv4_when_dhcp: z.boolean(),
    ipv4: z.string().trim(),
    ipv6: z.string().trim(),
    peers: z.array(z.string()),
    external_node: z.string().trim(),
    listeners: z.array(z.string()),
    mapped_listeners: z.array(z.string()),
    no_listener: z.boolean(),
    private_mode: z.boolean(),
    relay_network_whitelist: z.array(z.string()),
    relay_all_peer_rpc: z.boolean(),
    proxy_networks: z.array(
      z.object({
        cidr: z.string().trim()
      })
    ),
    port_forwards: z.array(
      z.object({
        proto: z.enum(["tcp", "udp"]),
        bind_addr: z.string().trim(),
        dst_addr: z.string().trim()
      })
    ),
    rpc_portal: z.string().trim(),
    rpc_portal_whitelist: z.array(z.string()),
    multi_thread: z.boolean(),
    multi_thread_count: numericString,
    latency_first: z.boolean(),
    compression: z.boolean(),
    stun_servers: z.array(z.string()),
    stun_servers_v6: z.array(z.string()),
    no_tun: z.boolean(),
    disable_p2p: z.boolean(),
    p2p_only: z.boolean(),
    disable_tcp_hole_punching: z.boolean(),
    disable_udp_hole_punching: z.boolean(),
    disable_sym_hole_punching: z.boolean(),
    socks5: z.string().trim(),
    mtu: numericString,
    dev_name: z.string().trim(),
    encryption_algorithm: z.string().trim().min(1, "encryption_algorithm 不能为空。"),
    disable_encryption: z.boolean(),
    include_systemd: z.boolean(),
    include_readme: z.boolean(),
    include_env_example: z.boolean()
  })
  .superRefine((input, ctx) => {
    if (input.mode === "strict_private") {
      if (!input.config_server) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config_server"],
          message: "严格私有模式要求填写完整 URL 形式的 config_server。"
        });
      } else if (isUsernameOnlyConfigServer(input.config_server)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config_server"],
          message: "仅用户名会使用官方服务器，不允许。"
        });
      } else if (!isFullConfigServerUrl(input.config_server)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["config_server"],
          message: "请填写完整 URL，例如 udp://controller.example.com:22020。"
        });
      }

      if (input.role === "client" && normalizeList(input.peers).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["peers"],
          message: "严格私有模式下的终端节点至少需要 1 个 peers。"
        });
      }
    }

    if (input.role === "relay" && !input.no_listener && normalizeList(input.listeners).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["listeners"],
        message: "中继节点至少需要一个 listener。"
      });
    }

    const invalidPeers = normalizeList(input.peers).filter((peer) => !isLikelyPeerUrl(peer));
    if (invalidPeers.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["peers"],
        message: "peers 中存在格式错误的地址，请使用完整的 proto://host:port 形式。"
      });
    }

    if (input.multi_thread && input.multi_thread_count && Number.parseInt(input.multi_thread_count, 10) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["multi_thread_count"],
        message: "multi_thread_count 至少为 1。"
      });
    }

    if (input.mtu && Number.parseInt(input.mtu, 10) < 576) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mtu"],
        message: "MTU 通常不应低于 576。"
      });
    }
  });

export function parseFormState(input: FormState): FormState {
  return formSchema.parse(input);
}

export function validateFormState(input: FormState): ValidationResult {
  const parsed = formSchema.safeParse(input);

  if (parsed.success) {
    return {
      success: true,
      issues: []
    };
  }

  return {
    success: false,
    issues: parsed.error.issues.map((issue) => ({
      path: String(issue.path[0] ?? "form"),
      message: issue.message
    }))
  };
}
