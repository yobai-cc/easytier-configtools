import type { FormState, RiskItem } from "@/lib/types";
import { normalizeList } from "@/lib/utils";

const FULL_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/.+/i;
const USERNAME_ONLY_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const PUBLIC_NODE_PATTERNS = [/public\.easytier/i, /shared[-._]?node/i, /official[-._]?relay/i];

export function isFullConfigServerUrl(value: string): boolean {
  return FULL_URL_PATTERN.test(value.trim());
}

export function isUsernameOnlyConfigServer(value: string): boolean {
  const trimmed = value.trim();
  return Boolean(trimmed) && USERNAME_ONLY_PATTERN.test(trimmed) && !trimmed.includes("://") && !trimmed.includes("/");
}

export function looksPublicPeer(value: string): boolean {
  return PUBLIC_NODE_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function configServerInfo(configServer: string): RiskItem[] {
  const trimmed = configServer.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("wss://") || trimmed.startsWith("ws://")) {
    return [
      {
        level: "info",
        title: "config_server 使用 Web Console 地址",
        detail: "当前 config_server 使用 ws:// 或 wss://，这通常表示通过 Web Console / WebSocket 下发配置。"
      }
    ];
  }

  if (trimmed.startsWith("udp://")) {
    return [
      {
        level: "info",
        title: "config_server 使用 UDP 下发",
        detail: "当前 config_server 使用 udp://，这通常是 EasyTier 配置下发的默认方式。"
      }
    ];
  }

  return [];
}

export function analyzeRisks(input: FormState): RiskItem[] {
  const issues: RiskItem[] = [];
  const peers = normalizeList(input.peers);
  const listeners = normalizeList(input.listeners);

  if (isUsernameOnlyConfigServer(input.config_server)) {
    issues.push({
      level: "error",
      title: "config_server 仅填写用户名",
      detail: "仅用户名会回落到官方服务器，不符合“逻辑上完全私有、自主可控”的部署目标。"
    });
  }

  if (input.mode === "strict_private" && !input.config_server.trim()) {
    issues.push({
      level: "error",
      title: "config_server 为空",
      detail: "严格私有模式要求填写完整 URL 形式的 config_server，例如 udp://controller.example.com:22020。"
    });
  }

  if (input.external_node.trim()) {
    issues.push({
      level: "error",
      title: "external_node 已启用",
      detail: "这会使用公共共享节点发现 peers，不适用于私有网络。"
    });
  }

  if (peers.some(looksPublicPeer)) {
    issues.push({
      level: "warning",
      title: "peers 包含公共节点",
      detail: "检测到类似 public.easytier 的公共节点地址，请确认你没有把私有网络接入共享基础设施。"
    });
  }

  if (!input.private_mode) {
    issues.push({
      level: "error",
      title: "private_mode 已关闭",
      detail: "关闭 private_mode 会扩大网络暴露面，和严格私有模式的目标冲突。"
    });
  }

  if (input.network_secret.trim().length > 0 && input.network_secret.trim().length < 16) {
    issues.push({
      level: "warning",
      title: "network_secret 过短",
      detail: "建议使用至少 16 位、最好 32 位以上的高强度密钥。"
    });
  }

  if (!input.instance_id.trim()) {
    issues.push({
      level: "warning",
      title: "instance_id 为空",
      detail: "建议显式填写 instance_id，避免跨主机复制配置时出现身份漂移。"
    });
  }

  if (input.role === "relay" && !input.no_listener && listeners.length === 0) {
    issues.push({
      level: "error",
      title: "relay 没有 listeners",
      detail: "中继节点至少需要一个 listener 才能提供转发能力。"
    });
  }

  if (input.role === "client" && peers.length === 0) {
    issues.push({
      level: "error",
      title: "client 没有 peers",
      detail: "严格私有模式下建议至少指定 1 个私有 relay / peer，避免依赖公共发现。"
    });
  }

  if (input.dhcp && input.ipv4.trim()) {
    issues.push({
      level: "warning",
      title: "同时启用了 DHCP 和静态 IPv4",
      detail: "默认生成逻辑会在 DHCP=true 时省略 ipv4；如果你明确需要保留静态地址，请打开“保留 ipv4”开关。"
    });
  }

  if (input.role === "relay" && input.relay_mode === "pure" && input.ipv4.trim()) {
    issues.push({
      level: "warning",
      title: "纯 relay 仍配置了 IPv4",
      detail: "纯 relay 节点默认不应创建 TUN 地址；当前填写的 ipv4 会在生成阶段被省略。"
    });
  }

  if (listeners.some((listener) => listener.startsWith("wss://"))) {
    issues.push({
      level: "info",
      title: "WSS listener 需要证书或反向代理",
      detail: "启用了 wss:// listener，请准备证书终止或在前置反向代理中完成 TLS。"
    });
  }

  if (input.mode === "strict_private") {
    issues.push({
      level: "info",
      title: "严格私有模式会强制关闭公共发现",
      detail: "生成时会保持 private_mode=true，并清空 external_node / stun_servers / stun_servers_v6。"
    });
  }

  return [...issues, ...configServerInfo(input.config_server)];
}
