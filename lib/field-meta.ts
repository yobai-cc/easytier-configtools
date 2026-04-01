export const FIELD_META = {
  hostname: {
    label: "hostname",
    description: "节点主机名，会显示在 EasyTier 网络视图里。",
    placeholder: "LocalAMI"
  },
  instance_name: {
    label: "instance_name",
    description: "实例名称，适合区分同主机上的多个 EasyTier 进程。",
    placeholder: "bv.yobai"
  },
  instance_id: {
    label: "instance_id",
    description: "对应官方配置里的实例 UUID，建议显式填写以保持配置稳定。",
    placeholder: "02435bb3-bce4-42a2-8329-6a60ed58ee19"
  },
  network_name: {
    label: "network_name",
    description: "私有网络名称，终端与 relay 需要保持一致。",
    placeholder: "corp-private-mesh"
  },
  network_secret: {
    label: "network_secret",
    description: "网络共享密钥，建议至少 16 位，越长越稳妥。",
    placeholder: "replace-with-a-strong-secret-32chars"
  },
  config_server: {
    label: "config_server",
    description: "完整 URL 形式的配置下发地址；严格私有模式不接受仅用户名。",
    placeholder: "udp://controller.example.com:22020"
  },
  ipv4: {
    label: "ipv4",
    description: "静态虚拟 IPv4，实际使用里常见形态如 10.18.0.88/24。",
    placeholder: "10.18.0.88/24"
  },
  ipv6: {
    label: "ipv6",
    description: "可选的虚拟 IPv6 地址。",
    placeholder: "fd00:20::11/64"
  },
  peers: {
    label: "peers",
    description: "每行一个 peer 地址，生成时会映射为 [[peer]]。",
    placeholder: "tcp://114.215.254.66:11010\nudp://relay.example.com:11010"
  },
  external_node: {
    label: "external_node",
    description: "公共共享节点发现入口，严格私有模式默认禁用。",
    placeholder: "留空"
  },
  listeners: {
    label: "listeners",
    description: "每行一个监听地址。真实部署里常见组合是 tcp / udp / wg，也可扩展 ws / wss。",
    placeholder: "tcp://0.0.0.0:11010\nudp://0.0.0.0:11010\nwg://0.0.0.0:11011"
  },
  mapped_listeners: {
    label: "mapped_listeners",
    description: "对外映射的监听地址，用于 NAT、SLB 或反向代理场景。",
    placeholder: "wss://relay.example.com:443/easytier"
  },
  relay_network_whitelist: {
    label: "relay_network_whitelist",
    description: "relay 允许转发的 network_name 白名单，每行一个，生成时会按空格拼接。",
    placeholder: "bv.yobai\nbvami.yobai"
  },
  proxy_networks: {
    label: "proxy_networks",
    description: "需要通过当前节点代理的网段，每行一个，生成时会映射为 [[proxy_network]]。",
    placeholder: "127.255.255.255"
  },
  port_forwards: {
    label: "port_forwards",
    description: "每行一条端口转发规则，格式为 proto://bind/dst，生成时会映射为 [[port_forward]]。",
    placeholder: "tcp://0.0.0.0:18080/10.18.0.88:80\nudp://0.0.0.0:16680/10.18.0.88:16680"
  },
  rpc_portal: {
    label: "rpc_portal",
    description: "RPC 门户监听地址。常见私有默认值是 127.0.0.1:15888，真实导出里也可能使用 0.0.0.0:0。",
    placeholder: "0.0.0.0:0"
  },
  rpc_portal_whitelist: {
    label: "rpc_portal_whitelist",
    description: "RPC 门户允许访问的 CIDR，每行一个。",
    placeholder: "127.0.0.1/32"
  },
  stun_servers: {
    label: "stun_servers",
    description: "IPv4 STUN 服务器，每行一个；严格私有模式默认清空。",
    placeholder: "stun:stun.example.com:3478"
  },
  stun_servers_v6: {
    label: "stun_servers_v6",
    description: "IPv6 STUN 服务器，每行一个；严格私有模式默认清空。",
    placeholder: "stun:[2001:db8::1]:3478"
  },
  socks5: {
    label: "socks5",
    description: "可选的 SOCKS5 出口代理。",
    placeholder: "127.0.0.1:1080"
  },
  mtu: {
    label: "mtu",
    description: "TUN 接口 MTU，可留空使用默认值。",
    placeholder: "1380"
  },
  dev_name: {
    label: "dev_name",
    description: "TUN 设备名称。",
    placeholder: "et0"
  },
  encryption_algorithm: {
    label: "encryption_algorithm",
    description: "加密算法名称，默认 auto。",
    placeholder: "auto"
  }
} as const;
