import { expect, it } from "vitest";
import type { TomlImportResult } from "@/lib/types";

it("returns structured import results", () => {
  const result: TomlImportResult = {
    ok: false,
    message: "invalid toml",
    warnings: []
  };

  expect(result.ok).toBe(false);
});
