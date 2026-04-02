# TOML Import Design

## Goal

Add a first-version TOML import flow for the EasyTier config generator that:

- accepts pasted TOML text
- imports only fields already supported by the current generator UI
- warns about unmapped fields instead of blocking import
- reuses the existing `FormState -> validation -> risk analysis -> artifact generation` pipeline

This design intentionally does not try to provide full official EasyTier TOML compatibility or lossless round-tripping.

## Scope

### In Scope

- a paste-based TOML import panel in the existing page
- parsing TOML into a structured intermediate representation
- mapping supported top-level fields, `[network_identity]`, `[[peer]]`, `[[proxy_network]]`, `[[port_forward]]`, and supported `[flags]` keys into `FormState`
- inferring UI-only fields such as `mode`, `role`, `relay_mode`, `relay_listener_profile`, and `keep_ipv4_when_dhcp`
- showing warnings for unmapped fields and partially supported values
- tests for parsing, mapping, warnings, and failure behavior

### Out of Scope

- file upload import
- preserving unknown TOML fields for later re-export
- full compatibility with every official EasyTier TOML variant
- byte-for-byte or field-for-field round-trip guarantees
- importing generated service, README, or `.env.example` content

## User Experience

Add a new `导入 TOML` card on the left side of the page, near the existing form controls rather than the preview area.

The card will contain:

- a multiline text area for pasted TOML
- an `导入到表单` button
- a result area for success, warnings, or failure messages

The interaction flow will be:

1. The user pastes TOML text.
2. The user clicks `导入到表单`.
3. The app parses the TOML text.
4. The app maps supported fields into a new `FormState`.
5. If import succeeds, the app replaces the current form state in one update.
6. Existing validation, risk analysis, and preview output refresh automatically from the imported form state.

## Architecture

The import flow will be added as a reverse path parallel to the existing generator path:

`TOML text -> parsed TOML object -> normalized import model -> FormState -> existing validation/risk/preview flow`

### New Modules

#### `lib/toml-import.ts`

Responsibilities:

- parse pasted TOML text using a TOML parser dependency
- validate the basic shape of parsed data
- normalize parsed data into an import-friendly structure
- collect parse-level and shape-level warnings

This module should not know anything about React components.

#### `lib/import-mapper.ts`

Responsibilities:

- convert the normalized import structure into `FormState`
- map only fields currently supported by the UI and generator
- infer UI-only fields
- preserve current values for non-TOML UI toggles
- collect unmapped-field warnings and import statistics

This module is the compatibility boundary between EasyTier TOML and the app's current form abstraction.

#### `components/import-panel.tsx`

Responsibilities:

- render the paste UI
- trigger import on user action
- display success, warnings, and failure messages
- call the parent callback with a completed import result

This component should stay presentation-focused and delegate parsing/mapping work to `lib/`.

## Data Model

The import pipeline will use an intermediate result shape so UI code does not need to understand TOML details directly.

Recommended result shape:

```ts
interface TomlImportWarning {
  path: string;
  message: string;
}

interface TomlImportStats {
  importedFieldCount: number;
  peerCount: number;
  proxyNetworkCount: number;
  portForwardCount: number;
}

interface TomlImportSuccess {
  ok: true;
  form: FormState;
  warnings: TomlImportWarning[];
  stats: TomlImportStats;
}

interface TomlImportFailure {
  ok: false;
  message: string;
  warnings: TomlImportWarning[];
}

type TomlImportResult = TomlImportSuccess | TomlImportFailure;
```

## Field Mapping Rules

### Direct Mapping

Import the following fields directly when present:

- top-level: `hostname`, `instance_name`, `instance_id`, `config_server`, `ipv4`, `ipv6`, `dhcp`, `listeners`, `mapped_listeners`, `no_listener`, `rpc_portal`
- `[network_identity]`: `network_name`, `network_secret`
- `[[peer]]`: `uri`
- `[[proxy_network]]`: `cidr`
- `[[port_forward]]`: `proto`, `bind_addr`, `dst_addr`
- `[flags]`: `private_mode`, `relay_network_whitelist`, `relay_all_peer_rpc`, `multi_thread`, `multi_thread_count`, `latency_first`, `stun_servers`, `stun_servers_v6`, `no_tun`, `disable_p2p`, `p2p_only`, `disable_tcp_hole_punching`, `disable_udp_hole_punching`, `disable_sym_hole_punching`, `socks5`, `mtu`, `dev_name`, `encryption_algorithm`, `disable_encryption`, `rpc_portal_whitelist`, `external_node`

### Conversion Mapping

- `relay_network_whitelist`
  Export currently joins values with spaces. Import should split by whitespace and normalize to `string[]`.
- `rpc_portal_whitelist`
  Export currently joins values with commas. Import should split by commas and normalize to `string[]`.
- `compression`
  The current generator writes `"zstd"` when enabled and `"none"` when disabled. Import should map:
  - `"zstd"` -> `compression = true`
  - `"none"` -> `compression = false`
  - any other compression value -> `compression = false` plus a warning that the original value cannot be fully represented by the current UI

### Inferred UI Fields

These fields are not read directly from TOML and must be inferred:

- `mode`
  Infer `strict_private` when all of the following hold:
  - `private_mode = true`
  - `external_node` is empty
  - `stun_servers` is empty
  - `stun_servers_v6` is empty
  - if inferred role is `client`, at least one peer exists
  Otherwise infer `advanced`.

- `role`
  Infer `relay` when there are relay-like signals, prioritized as:
  - at least one `[[port_forward]]`
  - `listeners` present together with `no_tun = true`
  - listener profile clearly looks like a relay deployment
  Otherwise default to `client`.

- `relay_mode`
  Infer `pure` when:
  - role is `relay`
  - `no_tun = true`
  - `ipv4` is empty
  - `dhcp = false`
  Otherwise infer `join`.

- `relay_listener_profile`
  Infer `udp_only` when every imported listener starts with `tcp://` or `udp://`.
  Otherwise infer `full`.

- `keep_ipv4_when_dhcp`
  Infer `true` when `dhcp = true` and `ipv4` is non-empty.
  Otherwise infer `false`.

### Non-TOML Fields That Stay As-Is

Preserve the current form values for:

- `include_systemd`
- `include_readme`
- `include_env_example`

These are output preferences, not TOML fields.

## Warning Rules

Warnings should be emitted, but import should still succeed, when:

- top-level unknown fields are encountered
- `[network_identity]` contains unsupported keys
- `[flags]` contains unsupported keys
- a `[[peer]]` item contains keys other than `uri`
- a `[[proxy_network]]` item contains keys other than `cidr`
- a `[[port_forward]]` item contains keys other than `proto`, `bind_addr`, or `dst_addr`
- a supported field uses a value shape the current UI cannot fully represent

Warnings should include a stable path such as:

- `topLevel.foo`
- `network_identity.bar`
- `flags.baz`
- `peer[1].qux`

## Failure Rules

Import should fail and leave the current form unchanged when:

- the pasted text is not valid TOML
- required structural sections are present but have the wrong type, such as `[network_identity]` parsing to a non-table value
- supported array-table sections are malformed in a way that prevents safe mapping

Import should not fail for unknown fields alone.

## UI Messaging

On success, the result area should show:

- a short success summary such as imported field counts
- a warning summary when warnings exist
- a flat list of warning details

On failure, the result area should show:

- a short error summary
- parse or mapping details when available

Failure should not mutate the form state.

## Dependency Decision

Use a lightweight TOML parser dependency instead of writing a custom parser.

Reasons:

- this is a real-format import feature, so parser correctness matters more than avoiding one dependency
- the current app already has a clear `lib/` boundary for non-UI logic
- a handwritten parser would increase bug risk and slow down iteration on supported-field mapping

## Testing Strategy

Add tests for the import pipeline, focused on behavior rather than parser internals.

Minimum coverage:

- imports a basic client TOML into supported `FormState` fields
- imports a relay TOML with listeners, `no_tun`, and `[[port_forward]]`
- imports `[flags]` values including booleans, numbers, split strings, and compression mapping
- records warnings for unknown top-level fields, unknown flags, and extra keys in array tables
- fails cleanly on invalid TOML and does not produce a form update
- verifies a generator-to-import semantic round-trip for supported fields

## Rollout Plan

Implementation should proceed in this order:

1. add tests for import parsing and mapping behavior
2. add the TOML parser dependency
3. implement `lib/toml-import.ts`
4. implement `lib/import-mapper.ts`
5. add `components/import-panel.tsx`
6. integrate the import panel into `components/generator-app.tsx`
7. run tests and build

## Risks

- inferred `role` and `mode` may not match every hand-written TOML file, so warnings and conservative defaults matter
- the current form abstraction does not represent every official EasyTier option, so unsupported fields must be surfaced clearly
- compression currently uses a boolean in the UI but a string in TOML, so lossy import needs explicit warning behavior

## Acceptance Criteria

The first version is successful when:

- a user can paste a TOML config produced by EasyTier or by this app and import it into the form
- supported fields are populated in the current UI
- unknown or unsupported fields are surfaced as warnings
- invalid TOML does not overwrite the current form
- existing validation, risk analysis, preview generation, tests, and build remain healthy
