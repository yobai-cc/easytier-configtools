# EasyTier Config Tools

一个面向 EasyTier 私有部署场景的本地 Web 配置生成器。项目基于 Next.js 14、TypeScript、Tailwind CSS 和 Zod，重点是帮助你更快整理出可用、可读、便于复制的 EasyTier 配置，而不是去复刻官方控制台的全部能力。

所有生成逻辑都在本地完成，不依赖外部 API，也不需要数据库。

## 当前能力

- 终端节点 / Relay 节点双角色生成
- 简单模式 / 高级模式双视图
- 严格私有模式 / 自定义高级模式双部署策略
- TOML 实时预览
- `systemd` 服务文件生成
- 部署说明 Markdown 生成
- `.env.example` 生成
- `proxy_networks` 结构化编辑
- `port_forwards` 结构化编辑
- 粘贴式 TOML 导入并回填当前已支持字段

当前生成的 TOML 结构已贴近 EasyTier 官方常见配置形态，包括：

- `[network_identity]`
- `[[peer]]`
- `[[proxy_network]]`
- `[[port_forward]]`
- `[flags]`

## 适用场景

- 想快速整理一套 EasyTier 私有网络配置
- 想减少手写 TOML、`systemd` 和部署说明的重复工作
- 想在“严格私有”前提下审阅关键字段和风险提示
- 想把现有 TOML 粘贴回工具里继续编辑当前已支持的字段

## 环境要求

- Node.js 20+
- npm 10+（推荐随 Node.js 20 一起使用）

## 快速开始

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

这两个命令都应在发布前通过。

## 当前支持范围

当前版本已经覆盖一批常用字段和导出产物，重点包括：

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
- `listeners`
- `mapped_listeners`
- `no_listener`
- `private_mode`
- `external_node`
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

导入能力方面，当前支持把已映射的 TOML 字段回填到表单，并对未映射字段给出提示；不会承诺完整保留所有未知字段，也不保证与任意手写 TOML 完整双向等价。

## 已知限制

- 这不是 EasyTier 官方 Web 控制台的完整替代品
- 当前 UI 还没有覆盖全部 EasyTier 配置字段
- `peers` 仍然是多行文本编辑，不是结构化列表
- TOML 导入只回填当前已支持字段，未知字段会提示但不会保留重导出
- 当前仓库只提供源码交付，不包含线上部署、Docker 包或桌面安装包

## 项目结构

```text
app/
components/
lib/
tests/
```

主要职责：

- `app/`：Next.js 页面入口
- `components/`：界面组件与交互逻辑
- `lib/`：表单 schema、默认值、生成器、导入映射、风险分析
- `tests/`：生成逻辑与 TOML 导入相关测试

## 版本说明

当前源码交付版本为 `0.2.0`。

这一版的重点不是继续扩字段，而是把现有能力整理到一个更适合交付和继续迭代的状态，包括：

- 更完整的 TOML 生成结构
- 初版 TOML 导入
- 更清晰的项目文档
- 更干净的仓库边界

## 后续方向

后续可以继续往这些方向推进：

- 增强 `peers` 编辑体验
- 扩展更多 EasyTier 字段覆盖
- 提供线上部署版本
- 补 Docker 或其他可移植交付方式
