# Ubuntu PM2 Caddy Deploy Design

## Goal

Add a practical deployment guide for running EasyTier Config Tools on an Ubuntu server with:

- Node.js 20+
- PM2 for process management
- Caddy for reverse proxy and HTTPS

The guide should help a user go from a fresh Ubuntu host to a working public web app without needing Docker or a hosted platform.

## Scope

### In Scope

- documenting server prerequisites for Ubuntu
- documenting Node.js, PM2, and Caddy installation
- documenting project checkout, dependency install, build, and startup
- documenting a PM2 startup command for `next start`
- documenting a Caddy reverse proxy configuration to `127.0.0.1:3000`
- documenting a basic update/redeploy workflow
- documenting a short troubleshooting section
- linking the deployment guide from the main README if needed

### Out of Scope

- Docker deployment
- systemd-only deployment
- Nginx deployment
- CI/CD automation
- infrastructure-as-code
- multi-node or load-balanced deployment
- database, object storage, or external service setup

## User Outcome

After reading the guide, a user should be able to:

- prepare an Ubuntu server
- clone the repository
- build and run the app with PM2
- expose it through Caddy with automatic HTTPS
- update the deployment after future code changes

## Recommended Deployment Shape

Use a single-host layout:

- app source at a dedicated directory such as `/opt/easytier-configtools`
- Next.js server listening on `127.0.0.1:3000`
- PM2 keeping the Node process alive
- Caddy serving the domain and proxying to the local Node port

This is the simplest deploy path that matches the current repository shape.

## Documentation Structure

The deployment document should be written as an operator runbook rather than a conceptual overview.

Recommended sections:

1. deployment assumptions
2. server preparation
3. installing Node.js 20, PM2, and Caddy
4. cloning the repository and installing dependencies
5. building and starting the app with PM2
6. configuring Caddy
7. firewall and domain notes
8. update workflow
9. troubleshooting

## Command Style

Commands should be copy-friendly and concrete.

Use:

- `apt` commands for Ubuntu
- explicit `pm2` commands
- a full example `Caddyfile`
- a minimal deploy/update sequence

Avoid:

- abstract pseudo-commands
- multiple alternative package managers
- distro-agnostic wording that weakens the instructions

## Caddy Configuration

The guide should assume a domain is available and provide a simple example:

```caddy
example.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000
}
```

The guide should also mention:

- replacing `example.com` with the real domain
- making sure DNS already points to the server
- allowing ports `80` and `443`

## PM2 Process Model

The deployment guide should use PM2 as the default process manager.

Recommended process shape:

- run `npm run build`
- start with `pm2 start npm --name easytier-configtools -- start`
- persist with `pm2 save`
- enable startup with `pm2 startup`

This keeps the deploy path close to the current `package.json` scripts.

## Risks

- users may copy commands before DNS is ready, causing Caddy certificate failures
- Node version drift can cause confusing build/runtime errors
- users may start the app on a public interface instead of behind Caddy

The guide should reduce those risks by:

- explicitly requiring Node.js 20+
- explicitly using `127.0.0.1:3000`
- calling out DNS and firewall prerequisites near the Caddy section

## Acceptance Criteria

This work is successful when:

- the repository contains a dedicated Ubuntu deployment guide for PM2 + Caddy
- the guide is concrete enough to follow command-by-command
- the README links to the guide so users can find it
- the guide does not promise Docker, Nginx, or hosted deployment support
