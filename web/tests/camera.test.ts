import { describe, expect, it } from "vitest";
import { cameraErrorMessage } from "@/features/color/image";

describe("cameraErrorMessage", () => {
  it.each([
    ["NotAllowedError", "permission was denied"],
    ["NotFoundError", "No usable camera"],
    ["NotReadableError", "already in use"],
    ["UnknownError", "could not be started"],
  ])("maps %s to useful camera guidance", (name, expected) => {
    expect(cameraErrorMessage({ name })).toContain(expected);
  });
});
