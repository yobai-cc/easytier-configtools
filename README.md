# EasyTier 私有部署配置生成器

一个基于 Next.js 14、TypeScript、Tailwind CSS 和 Zod 的本地 Web 工具，用来生成 EasyTier 的私有部署配置。

它会在浏览器本地实时生成：

- `client.toml`
- `relay.toml`
- `easytier-client.service`
- `easytier-relay.service`
- `DEPLOYMENT.md`
- `.env.example`

所有生成逻辑都在本地完成，不调用外部 API，也不依赖数据库。

## 功能特性

- 严格私有模式与自定义高级模式双模式切换
- 终端节点 / 中继节点双角色生成
- 实时 TOML / service / Markdown / `.env.example` 预览
- 一键复制与逐文件下载
- 基于 Zod 的表单校验
- 自动风险提示
- 三组内置预设

## 为什么严格私有模式默认禁用官方服务

这个生成器的默认目标不是“能连上就行”，而是“逻辑上完全私有、自主可控”的 EasyTier 网络。因此严格私有模式会主动收紧几个关键入口：

- `config_server` 必须是完整 URL，不能只填用户名。
- `private_mode` 会被锁定为 `true`。
- `external_node` 默认禁用。
- `stun_servers` 与 `stun_servers_v6` 默认清空。
- relay 默认不输出 `ipv4`，保持“只转发、不创建 TUN”的纯 relay 角色。

这样做的核心原因是避免配置在不知情的情况下回退到公共发现、共享节点或官方服务。

## 关键安全说明

- 仅用户名形式的 `config_server` 会使用官方服务器，因此严格私有模式会直接报错。
- `external_node` 会使用公共共享节点，不适合私有网络。
- 自建 Web Console 默认配置下发端口为 `22020`，默认协议可为 `udp`，也可改为 `tcp` / `ws`。
- 若 `ws` 经反向代理为 TLS，则终端可使用 `wss://...` 接入。
- 真实终端节点配置里常见 `rpc_portal = "0.0.0.0:0"` 这类写法，表示让系统随机端口；网页生成器目前仍保持自己的表单抽象，不强制与导出格式一一对应。
- 真实终端节点常见 `listeners` 组合是 `tcp://0.0.0.0:11010`、`udp://0.0.0.0:11010`、`wg://0.0.0.0:11011`，可作为私有部署时的参考。

## 技术栈

- Node.js 20+
- TypeScript
- Next.js 14 App Router
- Tailwind CSS
- Zod
- Vitest

## 本地启动

```bash
npm install
npm run dev
```

默认访问地址：

- [http://localhost:3000](http://localhost:3000)

## 测试与构建

```bash
npm test
npm run build
```

## 内置预设

1. 私有 UDP 终端
2. 私有 WSS 终端
3. 私有 Relay

## 页面结构

- 模式选择
- 节点角色选择
- 表单区
- 实时预览区
- 风险提示区
- 一键复制按钮
- 下载按钮

## 支持的核心字段

- `hostname`
- `instance_name`
- `network_name`
- `network_secret`
- `instance_id`
- `config_server`
- `dhcp`
- `ipv4`
- `ipv6`
- `peers`
- `external_node`
- `listeners`
- `mapped_listeners`
- `no_listener`
- `private_mode`
- `relay_network_whitelist`
- `relay_all_peer_rpc`
- `proxy_networks`
- `rpc_portal`
- `rpc_portal_whitelist`
- `multi_thread`
- `multi_thread_count`
- `latency_first`
- `compression`
- `stun_servers`
- `stun_servers_v6`
- `no_tun`
- `disable_p2p`
- `p2p_only`
- `disable_tcp_hole_punching`
- `disable_udp_hole_punching`
- `disable_sym_hole_punching`
- `socks5`
- `mtu`
- `dev_name`
- `encryption_algorithm`
- `disable_encryption`

## 项目结构

```text
app/
components/
lib/
tests/
```

其中：

- `lib/schema.ts` 负责 Zod 校验
- `lib/validators.ts` 负责风险规则与安全提示
- `lib/generators.ts` 负责 TOML / service / Markdown / `.env.example` 生成
- `components/` 负责页面 UI 与交互

## 注意事项

- 生成器不会替你申请证书；如果启用 `wss://` listener，需要你自行准备证书或反向代理。
- relay 选择 `UDP-only relay` 时，输出会自动只保留 `tcp://` 和 `udp://` listeners。
- 当 `dhcp = true` 且未勾选“保留 ipv4（DHCP 时）”时，生成器会省略 `ipv4`。
