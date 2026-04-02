# Source Release Readiness Design

## Goal

Prepare the EasyTier config generator for a first source-code release candidate that is:

- usable by another developer directly from the repository
- cleanly documented
- versioned as a coherent milestone
- free of obvious local-only development residue

This design is intentionally release-oriented rather than feature-oriented. It does not add new generator capabilities.

## Scope

### In Scope

- cleaning obvious local-only files and directories from the repository root
- preventing those artifacts from reappearing when practical through `.gitignore`
- rewriting `README.md` into a readable, source-distribution-friendly project guide
- bumping the package version from `0.1.0` to `0.2.0`
- adding a lightweight release note document for the first usable source release
- verifying the repository with `npm test` and `npm run build`

### Out of Scope

- new EasyTier config fields
- `peers` editor redesign
- Docker packaging
- desktop packaging
- online deployment
- CI/CD automation
- release tagging or GitHub Release publishing

## User Outcome

After this work:

- a user can clone the repo, install dependencies, read the README, and run the app locally
- the repository looks intentional rather than like an active scratch workspace
- the current feature set and limitations are documented clearly enough for first external use
- the project has an explicit release milestone version instead of an early scaffolding placeholder

## Current Problems

The repository is close to usable, but several issues block a clean handoff:

- `README.md` currently has encoding/readability issues and is not safe as a public-facing guide
- the root contains obvious local tool artifacts such as `--yes`, `--package`, `@playwright`, `-s`, `snapshot`, and `github-pr`
- there is no concise release note describing what `0.2.0` means
- the current version number does not clearly communicate that the app now includes TOML import and a more complete generator flow

## Design Principles

- prefer a smaller but polished release over a broader but unstable one
- document current boundaries honestly instead of over-promising future capabilities
- remove accidental repository noise before adding new release-facing assets
- keep the release shape compatible with future deployment work, but do not block on it

## Deliverables

### Repository Cleanup

Remove local-only clutter from the repo root when it is not part of the product:

- `--yes`
- `--package`
- `@playwright`
- `-s`
- `snapshot`
- `github-pr`

If any of these patterns can reappear from tool usage, add narrow `.gitignore` protection so they do not show up as accidental untracked content again.

Cleanup should be conservative:

- do not remove actual project assets
- do not touch the ignored `EasyTier-upstream` analysis checkout
- do not remove standard build artifacts that are already intentionally ignored unless needed for release hygiene

### README Rewrite

Rewrite `README.md` as a source-distribution guide in clear Chinese with stable UTF-8 encoding.

The README should include:

- project purpose
- target use cases
- current feature highlights
- environment requirements
- quick start steps
- build and test commands
- current support boundaries
- known limitations
- project structure overview
- release version context for `0.2.0`

The README should describe the product as a local web-based generator and avoid implying that deployment, Docker, or desktop packages already exist.

### Versioning

Update `package.json` from `0.1.0` to `0.2.0`.

Reasoning:

- the app is past initial scaffold state
- it now includes TOML import and a more coherent release story
- the change is larger than a patch-level cleanup

No package publishing metadata is required in this step because the project remains a source-distributed private app.

### Release Notes

Add a short `CHANGELOG.md` at the repo root.

The first entry should document `0.2.0` with:

- what is now available
- what was improved recently
- what is intentionally not part of this release yet

This changelog is release communication, not a full development diary.

### Verification

Before completion:

- run `npm test`
- run `npm run build`
- confirm `git status` is clean except for the intended release-prep changes before commit
- confirm `git status` is clean after the final commit

## File-Level Responsibilities

### `README.md`

Primary user-facing project guide for source usage.

### `package.json`

Holds the release milestone version.

### `CHANGELOG.md`

Provides release-oriented notes for `0.2.0`.

### `.gitignore`

Prevents known local-only clutter from polluting the repository again.

## Risks

- cleanup rules could accidentally ignore legitimate future files if patterns are too broad
- README rewrites can become too marketing-heavy and hide important limitations
- version bump without release notes would make the milestone feel arbitrary

These risks are controlled by:

- keeping ignore patterns narrow and explicit
- writing limitations as first-class documentation
- tying `0.2.0` directly to the current product state

## Acceptance Criteria

This work is successful when:

- the repository no longer contains the identified accidental local-only root artifacts
- `README.md` is readable and sufficient for a new developer to run the app locally
- `package.json` reports version `0.2.0`
- `CHANGELOG.md` exists and documents the source release milestone
- `npm test` passes
- `npm run build` passes
- the repository is left in a clean, releasable state
