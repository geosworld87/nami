import { describe, it, expect } from "vitest";
import { SERVER_VERSION } from "../src/index.js";

describe("@nami/server", () => {
  it("exports version", () => {
    expect(SERVER_VERSION).toBe("0.1.0");
  });
});
