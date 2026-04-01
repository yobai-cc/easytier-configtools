# EasyTier 私有部署配置生成器

一个基于 Next.js 14、TypeScript、Tailwind CSS 和 Zod 的本地 Web 工具，用来生成面向私有部署场景的 EasyTier 配置。

它可以在浏览器本地实时生成：

- `client.toml`
- `relay.toml`
- `easytier-client.service`
- `easytier-relay.service`
- 部署说明 Markdown
- `.env.example`

所有生成逻辑都在本地完成，不调用外部 API，也不依赖数据库。

## 项目目标

这个项目的默认目标不是“尽快连上公共网络”，而是帮助你生成一个逻辑上完全私有、自主可控的 EasyTier 部署配置。

页面内置两类模式：

- 严格私有模式
- 自定义高级模式

同时支持两类节点角色：

- 终端节点
- 中继节点

## 功能特性

- 简体中文 UI，字段名保持 EasyTier 原生命名
- 简单模式 / 高级模式双视图
- 严格私有模式 / 自定义高级模式双部署策略
- 终端节点 / Relay 节点双角色生成
- 实时预览 TOML、systemd、README、`.env.example`
- 风险提示、字段校验、一键复制、下载
- 3 组预设
- 结构化编辑 `proxy_networks` 与 `port_forwards`
- 输出 TOML 贴近官方结构：`[network_identity]`、`[[peer]]`、`[[proxy_network]]`、`[[port_forward]]`、`[flags]`

## 为什么严格私有模式默认禁用官方服务

严格私有模式的设计原则是：不要在用户不知情的情况下回退到官方公共基础设施。

因此默认策略包括：

- `config_server` 必须是完整 URL
- 仅用户名形式的 `config_server` 会被判定为不允许，因为这会使用官方服务器
- `external_node` 默认禁用，因为它会使用公共共享节点发现 peers
- `private_mode` 强制保持为 `true`
- `stun_servers` 和 `stun_servers_v6` 默认清空
- Relay 默认不输出 `ipv4`，保持“只转发、不创建 TUN”的纯 relay 角色

这套策略的目的，是避免配置在不经意间接入公共发现、共享节点或官方控制面。

## 关键说明

- 仅用户名形式的 `config_server` 会使用官方服务器
- `external_node` 会使用公共共享节点
- 自建 Web Console 默认配置下发端口为 `22020`
- 默认协议可为 `udp`，也可改为 `tcp` / `ws`
- 若 `ws` 经反向代理为 TLS，则终端可使用 `wss://...` 接入
- 当前生成器的网页表单是“便于编辑的抽象模型”，不要求逐项等同于 EasyTier Web 页导入导出格式
- 当前 TOML 生成结果已经对齐到更接近官方真实结构的形式

## 当前字段支持

已支持的核心字段包括：

- `hostname`
- `instance_name`
- `instance_id`
- `network_name`
- `network_secret`
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
- `port_forwards`
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

## 内置预设

1. 私有 UDP 终端
2. 私有 WSS 终端
3. 私有 Relay

## 页面结构

- 模式选择
- 角色选择
- 预设区
- 表单区
- 实时预览区
- 风险提示区
- 复制与下载操作

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

默认访问：

- [http://localhost:3000](http://localhost:3000)

## 测试与构建

```bash
npm test
npm run build
```

## 使用建议

### 终端节点

- 严格私有模式下建议至少保留 1 个私有 `peers`
- 若启用 `dhcp = true`，默认不会输出 `ipv4`
- `rpc_portal` 默认建议收敛到本地回环地址

### Relay 节点

- 默认按纯 relay 处理，不输出 `ipv4`
- 若选择“作为普通节点加入网络”，才建议为 relay 配置 `ipv4` / `dhcp`
- 若启用 `wss://` listener，需要准备证书或反向代理
- `port_forwards` 当前已支持结构化编辑并输出 `[[port_forward]]`

## 数据结构说明

当前生成器内部采用“表单层 + 生成层”分离的方式：

- UI 层优先保证简单模式易用
- 生成层优先保证 TOML 输出接近官方结构

当前实现中：

- `peers` 仍使用多行文本编辑
- `proxy_networks` 使用结构化列表编辑，生成 `[[proxy_network]]`
- `port_forwards` 使用结构化列表编辑，生成 `[[port_forward]]`

## 项目结构

```text
app/
components/
lib/
tests/
```

主要职责：

- `app/`：Next.js 页面入口
- `components/`：界面组件与交互
- `lib/schema.ts`：Zod 表单校验
- `lib/validators.ts`：风险规则与安全提示
- `lib/generators.ts`：TOML / service / Markdown / `.env.example` 生成
- `tests/`：生成逻辑与规则测试

## 已验证

当前项目已通过：

- `npm test`
- `npm run build`

## 后续可扩展方向

- 为 `peers` 增强格式校验与错误提示
- 增加更贴近官方 Web 配置页的数据映射
- 支持从真实 TOML 导入并回填表单
- 扩展更多 EasyTier 配置项
