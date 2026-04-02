# Ubuntu PM2 Caddy Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a practical Ubuntu deployment guide for running this Next.js app with PM2 and Caddy, and make it discoverable from the README.

**Architecture:** This is a documentation-only change. The implementation adds one focused runbook under `docs/`, then updates `README.md` to point users at it. The guide stays aligned with the current project shape: a Node.js server started with `npm run start`, supervised by PM2, and exposed through Caddy.

**Tech Stack:** Markdown, Next.js 14 runtime assumptions, Ubuntu, PM2, Caddy

---

## File Map

- Create: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/deploy-doc/docs/deploy/ubuntu-pm2-caddy.md`
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/deploy-doc/README.md`

### Task 1: Add the Deployment Runbook

**Files:**
- Create: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/deploy-doc/docs/deploy/ubuntu-pm2-caddy.md`

- [ ] **Step 1: Inspect the current app runtime assumptions**

Run:

```powershell
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc\package.json'
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc\next.config.js'
```

Expected: confirm the deployment guide should target `npm run build` and `npm run start` with no special server adapter.

- [ ] **Step 2: Write the Ubuntu deploy guide**

Create a markdown guide with sections for:

```markdown
# Ubuntu 服务器部署指南（PM2 + Caddy）

## 1. 部署假设
## 2. 服务器准备
## 3. 安装 Node.js 20、PM2、Caddy
## 4. 拉取项目并安装依赖
## 5. 构建并用 PM2 启动
## 6. 配置 Caddy
## 7. 防火墙与域名
## 8. 更新部署
## 9. 常见排查
```

Expected: the guide is command-driven and concrete, not conceptual.

- [ ] **Step 3: Include exact example commands**

The guide must include concrete commands such as:

```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

And application startup commands such as:

```bash
npm install
npm run build
pm2 start npm --name easytier-configtools -- start
pm2 save
pm2 startup
```

Expected: a user can follow the guide without guessing missing commands.

- [ ] **Step 4: Include a full Caddyfile example**

The guide must include a complete example like:

```caddy
example.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000
}
```

And the placement/reload commands:

```bash
sudo nano /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Expected: the proxy section is ready to copy and adapt.

- [ ] **Step 5: Commit the deployment guide**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' add docs/deploy/ubuntu-pm2-caddy.md
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' commit -m "docs: add ubuntu pm2 caddy deployment guide"
```

Expected: the runbook lands in its own commit.

### Task 2: Link the Guide from README

**Files:**
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/deploy-doc/README.md`

- [ ] **Step 1: Add a deployment entry point to README**

Add a short section or bullet that points to:

```markdown
[Ubuntu 服务器部署指南（PM2 + Caddy）](./docs/deploy/ubuntu-pm2-caddy.md)
```

Expected: users can discover the deploy guide from the project homepage.

- [ ] **Step 2: Keep README scope honest**

Ensure the README still does not imply:

- Docker support
- Nginx support
- hosted deployment already exists

Expected: the new link expands deployment guidance without overpromising platform support.

- [ ] **Step 3: Commit the README link update**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' add README.md
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' commit -m "docs: link ubuntu deployment guide"
```

Expected: README discoverability change is isolated in its own commit.

### Task 3: Verify and Merge Documentation Changes

**Files:**
- Verify only: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/deploy-doc`

- [ ] **Step 1: Review the final markdown content**

Run:

```powershell
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc\docs\deploy\ubuntu-pm2-caddy.md'
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc\README.md'
```

Expected: the guide is readable, complete, and the README link is present.

- [ ] **Step 2: Confirm git state is clean except intended doc changes**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' status --short --branch
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\deploy-doc' log --oneline -5
```

Expected: only intended documentation commits are present.

- [ ] **Step 3: Merge back to main and verify repo cleanliness**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig' merge --no-ff codex/deploy-doc -m "merge: add ubuntu deployment guide"
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig' status --short --branch
```

Expected: main contains the docs and remains clean after merge.
