# Source Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repository for a clean `0.2.0` source release by removing local-only clutter, rewriting release-facing docs, bumping the version, and verifying the build remains healthy.

**Architecture:** This work is intentionally non-functional. It treats the repository as a distributable product surface: clean the workspace boundary first, then update release-facing docs and metadata, then run the same verification commands a downstream user would rely on. Changes stay focused on repo hygiene, package metadata, and documentation.

**Tech Stack:** Git worktrees, PowerShell, Next.js 14, TypeScript, npm, Markdown

---

## File Map

- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/.gitignore`
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/package.json`
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/README.md`
- Create: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/CHANGELOG.md`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/--yes`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/--package`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/@playwright`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/-s`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/snapshot`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/github-pr`

### Task 1: Clean Repository Boundary

**Files:**
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/.gitignore`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/--yes`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/--package`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/@playwright`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/-s`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/snapshot`
- Remove if present: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/github-pr`

- [ ] **Step 1: Inspect root-level accidental artifacts and current ignore rules**

Run:

```powershell
Get-ChildItem 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' -Force | Select-Object Name, Mode
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\.gitignore'
```

Expected: root listing shows whether the accidental directories exist in this worktree, and `.gitignore` reveals current ignore coverage.

- [ ] **Step 2: Remove accidental root directories if they exist**

Run:

```powershell
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\--yes' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\--package' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\@playwright' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\-s' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\snapshot' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\github-pr' -Recurse -Force -ErrorAction SilentlyContinue
```

Expected: only accidental tool-generated directories are removed; project directories remain untouched.

- [ ] **Step 3: Add narrow ignore entries for known accidental root artifacts**

Update `.gitignore` to include explicit root-level entries such as:

```gitignore
/--yes/
/--package/
/@playwright/
/-s/
/snapshot/
/github-pr/
```

Expected: future accidental root clutter no longer pollutes `git status`, without hiding legitimate nested project files.

- [ ] **Step 4: Verify cleanup result**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' status --short
Get-ChildItem 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' -Force | Select-Object Name
```

Expected: only intended tracked edits remain; accidental directories are gone.

- [ ] **Step 5: Commit cleanup boundary changes**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' add .gitignore
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' commit -m "chore: clean release workspace artifacts"
```

Expected: a focused cleanup commit exists before documentation changes start.

### Task 2: Rewrite Release-Facing Documentation

**Files:**
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/README.md`
- Create: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/CHANGELOG.md`

- [ ] **Step 1: Capture the current product surface**

Run:

```powershell
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\package.json'
Get-ChildItem 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\components' | Select-Object Name
Get-ChildItem 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\lib' | Select-Object Name
```

Expected: enough context to describe current features honestly without over-claiming.

- [ ] **Step 2: Rewrite `README.md` in clean UTF-8 Chinese**

Replace the README with sections covering:

```markdown
# EasyTier Config Tools

## 项目简介
## 当前能力
## 适用场景
## 环境要求
## 快速开始
## 测试与构建
## 当前支持范围
## 已知限制
## 项目结构
## 版本说明
```

Include the actual commands:

```bash
npm install
npm run dev
npm test
npm run build
```

Expected: a new user can understand what the project is and run it locally without guessing.

- [ ] **Step 3: Add `CHANGELOG.md` with the `0.2.0` release note**

Create a short changelog like:

```markdown
# Changelog

## 0.2.0 - 2026-04-02

### Added
- ...

### Improved
- ...

### Not Included Yet
- ...
```

Expected: the milestone is documented as a product-facing release note, not an internal commit list.

- [ ] **Step 4: Review docs for release honesty**

Check that the docs do not imply support for:

- Docker
- desktop packaging
- hosted deployment
- complete EasyTier option coverage

Expected: documentation matches the current product reality.

- [ ] **Step 5: Commit documentation changes**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' add README.md CHANGELOG.md
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' commit -m "docs: prepare source release documentation"
```

Expected: documentation is captured in a dedicated commit.

### Task 3: Bump Version Metadata

**Files:**
- Modify: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness/package.json`

- [ ] **Step 1: Change version to `0.2.0`**

Update:

```json
"version": "0.2.0"
```

Expected: package metadata reflects the first source-release milestone.

- [ ] **Step 2: Verify version appears correctly**

Run:

```powershell
Get-Content 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness\package.json'
```

Expected: the version field reads `0.2.0` and no unrelated metadata changed.

- [ ] **Step 3: Commit the version bump**

Run:

```powershell
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' add package.json
git -C 'C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness' commit -m "chore: bump version to 0.2.0"
```

Expected: release metadata is isolated in a clear commit.

### Task 4: Verify Release Candidate State

**Files:**
- Verify only: `C:/Users/ITAdministrator/Documents/HBuilderProjects/etconfig/.worktrees/release-readiness`

- [ ] **Step 1: Run test suite after all release-prep changes**

Run:

```powershell
& 'C:/Program Files/nodejs/npm.cmd' test
```

From:

```text
C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness
```

Expected: 30 tests pass, 0 failures.

- [ ] **Step 2: Run production build after all release-prep changes**

Run:

```powershell
& 'C:/Program Files/nodejs/npm.cmd' run build
```

From:

```text
C:\Users\ITAdministrator\Documents\HBuilderProjects\etconfig\.worktrees\release-readiness
```

Expected: Next.js build completes successfully.

- [ ] **Step 3: Confirm git state is ready for merge**

Run:

```powershell
git status --short --branch
git log --oneline -5
```

Expected: the branch contains only intended release-readiness commits and has no stray untracked files.

- [ ] **Step 4: Commit any final touch-ups only if verification exposed a real issue**

Run only if needed:

```powershell
git add <fixed-files>
git commit -m "fix: address release readiness verification issue"
```

Expected: no speculative edits; only real verification-driven fixes.
