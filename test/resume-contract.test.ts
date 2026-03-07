import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRemoteResumePolicy,
  isRemoteResumePolicy,
  mountFormUI,
  REMOTE_RESUME_CONTRACT_VERSION,
  TFormUISubmitDetail,
} from "../src/index";
import { resetDomAndStorage } from "./test-utils";

describe("Resume Contract", () => {
  beforeEach(() => {
    resetDomAndStorage();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("extracts structured backend resume policy metadata", () => {
    const payload = {
      contractVersion: REMOTE_RESUME_CONTRACT_VERSION,
      operation: "claim-share-code",
      policy: {
        code: "rate_limited",
        reason: "Too many attempts",
        retryAfterSeconds: 60,
      },
    };

    expect(isRemoteResumePolicy(payload.policy)).toBe(true);
    expect(getRemoteResumePolicy(payload)).toEqual({
      code: "rate_limited",
      reason: "Too many attempts",
      retryAfterSeconds: 60,
    });
  });

  it("emits a blocked event when the backend returns a structured share-code policy block", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        contractVersion: REMOTE_RESUME_CONTRACT_VERSION,
        operation: "claim-share-code",
        policy: {
          code: "rate_limited",
          reason: "Too many attempts",
          retryAfterSeconds: 60,
          blockedUntil: 123516,
        },
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "resume-contract-form",
      title: "Resume Contract Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-resume-contract",
        resumeEndpoint: "https://api.example.test/resume",
        shareCodeEndpoint: "https://api.example.test/resume",
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    });
    const onClaimBlocked = vi.fn();

    element.addEventListener("form-ui:resume-share-code-claim-blocked", (event) => {
      onClaimBlocked((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await expect(element.claimResumeShareCode("SHARE-42")).resolves.toBeNull();

    expect(onClaimBlocked).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          code: "SHARE-42",
          reason: "rate_limited",
          backend: true,
          retryAfterSeconds: 60,
          blockedUntil: 123516,
        }),
      }),
    );
  });
});
