# Ubuntu 服务器部署指南（PM2 + Caddy）

这份文档面向想把 EasyTier Config Tools 部署到 Ubuntu 服务器上的用户。它采用一条尽量简单、可直接执行的路径：

- Ubuntu
- Node.js 20+
- PM2 负责守护 Next.js 进程
- Caddy 负责反向代理和 HTTPS

这不是 Docker 方案，也不是 Nginx 方案。

## 1. 部署假设

默认你已经具备这些条件：

- 一台 Ubuntu 服务器
- 一个已经解析到该服务器公网 IP 的域名
- 一个可以执行 `sudo` 的普通用户
- 服务器可以访问 GitHub 和 npm

本文示例假设：

- 项目目录：`/opt/easytier-configtools`
- 运行端口：`127.0.0.1:3000`
- 域名：`et.example.com`

请把示例里的域名替换成你的真实域名。

## 2. 服务器准备

先更新系统并安装基础工具：

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git
```

如果服务器启用了防火墙，后面需要确保 `80` 和 `443` 端口放行。

## 3. 安装 Node.js 20、PM2 和 Caddy

### 安装 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

验证版本：

```bash
node -v
npm -v
```

建议看到 Node.js 20.x。

### 安装 PM2

```bash
sudo npm install -g pm2
```

验证：

```bash
pm2 -v
```

### 安装 Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

验证：

```bash
caddy version
```

## 4. 拉取项目并安装依赖

创建部署目录并拉取仓库：

```bash
sudo mkdir -p /opt/easytier-configtools
sudo chown -R "$USER":"$USER" /opt/easytier-configtools
git clone https://github.com/yobai-cc/easytier-configtools.git /opt/easytier-configtools
cd /opt/easytier-configtools
```

安装依赖：

```bash
npm install
```

如果你是更新现有部署，而不是第一次拉仓库，可以用：

```bash
cd /opt/easytier-configtools
git pull
npm install
```

## 5. 构建并用 PM2 启动

先构建项目：

```bash
npm run build
```

如果构建成功，再启动：

```bash
pm2 start npm --name easytier-configtools -- start
```

查看运行状态：

```bash
pm2 status
pm2 logs easytier-configtools
```

如果你想让 PM2 在服务器重启后自动恢复：

```bash
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条带 `sudo` 的命令，按提示再执行一次即可。

## 6. 配置 Caddy

编辑 Caddy 配置：

```bash
sudo nano /etc/caddy/Caddyfile
```

写入类似下面的内容：

```caddy
et.example.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000
}
```

保存后先校验配置：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

如果没有报错，再重载：

```bash
sudo systemctl reload caddy
```

检查 Caddy 状态：

```bash
sudo systemctl status caddy
```

如果域名解析已经正确指向服务器，Caddy 会自动申请和续期 HTTPS 证书。

## 7. 防火墙与域名

### 域名

请先确认你的域名 A 记录已经指向服务器公网 IP，否则 Caddy 无法正常签发证书。

### 防火墙

如果你使用 `ufw`，可以这样放行：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

应用进程本身只监听在：

```text
127.0.0.1:3000
```

不要直接把 Next.js 服务暴露到公网，统一交给 Caddy 转发。

## 8. 更新部署

后续更新代码时，推荐流程：

```bash
cd /opt/easytier-configtools
git pull
npm install
npm run build
pm2 restart easytier-configtools
```

如果这次只是前端/文档更新，通常不需要改 Caddy。

## 9. 常见排查

### 1. 页面打不开

先检查 PM2 和 Caddy：

```bash
pm2 status
pm2 logs easytier-configtools
sudo systemctl status caddy
```

### 2. Caddy 没签出证书

优先检查：

- 域名是否已经正确解析
- `80` 和 `443` 是否放行
- Caddyfile 里的域名是否写对

### 3. `npm run build` 失败

优先检查：

- Node.js 版本是否为 20+
- 依赖是否完整安装
- 是否在项目根目录执行命令

### 4. PM2 启动后立刻退出

查看日志：

```bash
pm2 logs easytier-configtools
```

常见原因：

- 没有先执行 `npm run build`
- 当前目录不对
- 依赖安装不完整

## 10. 建议

如果你只是想先快速上线一份可访问版本，这条 `PM2 + Caddy` 路径已经足够。

如果后续你准备做：

- 多环境部署
- 自动化发布
- 容器化
- 回滚策略

再往 Docker、CI/CD 或更完整的运维方案演进会更合适。
