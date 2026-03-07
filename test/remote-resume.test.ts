import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormUI, mountFormUI, TFormUISubmitDetail } from "../src/index";
import { flushAsyncWork, resetDomAndStorage } from "./test-utils";

describe("Remote Resume", () => {
  beforeEach(() => {
    resetDomAndStorage();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("supports remote save and resume flows through resumeEndpoint", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume" && init?.method === "POST") {
        return new Response(JSON.stringify({
          operation: "create",
          token: "remote_token_123",
          savedAt: 123456,
          issuedAt: 123456,
          expiresAt: 223456,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "https://api.example.test/resume?token=remote_token_123" && init?.method === "GET") {
        return new Response(JSON.stringify({
          operation: "lookup",
          token: "remote_token_123",
          savedAt: 123456,
          issuedAt: 123456,
          expiresAt: 223456,
          snapshot: {
            draft: { email: "remote-resume@example.com" },
            queue: [],
            deadLetter: [],
          },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-resume-form",
      title: "Remote Resume Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-resume",
        resumeEndpoint: "https://api.example.test/resume",
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;
    const input = element.querySelector("#email") as HTMLInputElement;

    input.value = "remote-resume@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flushAsyncWork();

    await expect(element.createResumeTokenAsync()).resolves.toBe("remote_token_123");
    await expect(element.restoreFromResumeTokenAsync("remote_token_123")).resolves.toEqual({
      email: "remote-resume@example.com",
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("supports the formal remote resume contract for lookup and invalidate responses", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume?token=missing_token" && init?.method === "GET") {
        return new Response(JSON.stringify({
          operation: "lookup",
          token: "missing_token",
          found: false,
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "https://api.example.test/resume?token=remote_token_contract" && init?.method === "DELETE") {
        return new Response(JSON.stringify({
          operation: "invalidate",
          token: "remote_token_contract",
          invalidated: true,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-resume-contract-form",
      title: "Remote Resume Contract Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-resume-contract",
        resumeEndpoint: "https://api.example.test/resume",
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;

    await expect(element.lookupResumeToken("missing_token")).resolves.toBeNull();
    await expect(element.invalidateResumeToken("remote_token_contract")).resolves.toBe(true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/resume?token=missing_token",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/resume?token=remote_token_contract",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("supports signed remote resume token contracts with signature metadata", async () => {
    const sign = (payload: Record<string, any>) =>
      `${payload.token}:${payload.savedAt}:${payload.issuedAt}:${payload.expiresAt}:${payload.snapshot?.draft?.email || ""}`;
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume" && init?.method === "POST") {
        const body = JSON.parse(String(init?.body || "{}")) as Record<string, any>;
        const token = "remote_token_signed";
        const savedAt = 2222;
        const issuedAt = 2222;
        const expiresAt = 3333;
        const signature = sign({ token, savedAt, issuedAt, expiresAt, snapshot: body.snapshot });
        return new Response(JSON.stringify({
          operation: "create",
          token,
          savedAt,
          issuedAt,
          expiresAt,
          signature,
          signatureVersion: "v2",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (url === "https://api.example.test/resume?token=remote_token_signed" && init?.method === "GET") {
        const snapshot = { draft: { email: "signed-remote@example.com" }, queue: [], deadLetter: [] };
        const token = "remote_token_signed";
        const savedAt = 2222;
        const issuedAt = 2222;
        const expiresAt = 3333;
        const signature = sign({ token, savedAt, issuedAt, expiresAt, snapshot });
        return new Response(JSON.stringify({
          operation: "lookup",
          token,
          savedAt,
          issuedAt,
          expiresAt,
          signature,
          signatureVersion: "v2",
          snapshot,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (url === "https://api.example.test/resume?token=remote_token_signed" && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-resume-signed-contract-form",
      title: "Remote Resume Signed Contract Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-resume-signed-contract",
        resumeEndpoint: "https://api.example.test/resume",
        resumeTokenSignatureVersion: "v2",
        verifyResumeToken: (payload) => sign(payload) === payload.signature,
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;

    const input = element.querySelector("#email") as HTMLInputElement;
    input.value = "signed-remote@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flushAsyncWork();

    await expect(element.createResumeTokenAsync()).resolves.toBe("remote_token_signed");
    const createCall = fetchSpy.mock.calls.find(
      ([url, init]) => String(url) === "https://api.example.test/resume" && init?.method === "POST",
    );
    const createBody = JSON.parse(String(createCall?.[1]?.body || "{}"));
    expect(createBody.signatureVersion).toBe("v2");

    const lookup = await element.lookupResumeToken("remote_token_signed");
    expect(lookup).toEqual(expect.objectContaining({
      token: "remote_token_signed",
      signatureVersion: "v2",
      signatureValid: true,
      issuedAt: 2222,
      expiresAt: 3333,
    }));

    await expect(element.invalidateResumeToken("remote_token_signed")).resolves.toBe(true);
  });

  it("rejects remote resume token creation when signed contract verification fails", async () => {
    const sign = (payload: Record<string, any>) =>
      `${payload.token}:${payload.savedAt}:${payload.issuedAt}:${payload.expiresAt}:${payload.snapshot?.draft?.email || ""}`;
    vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume" && init?.method === "POST") {
        return new Response(JSON.stringify({
          operation: "create",
          token: "remote_token_signed_invalid",
          savedAt: 4444,
          issuedAt: 4444,
          expiresAt: 5555,
          signature: "bad-signature",
          signatureVersion: "v2",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-resume-signed-invalid-form",
      title: "Remote Resume Signed Invalid Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-resume-signed-invalid",
        resumeEndpoint: "https://api.example.test/resume",
        resumeTokenSignatureVersion: "v2",
        verifyResumeToken: (payload) => sign(payload) === payload.signature,
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;
    const onInvalidSignature = vi.fn();
    element.addEventListener("form-ui:resume-token-invalid-signature", (event) => {
      onInvalidSignature((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await expect(element.createResumeTokenAsync()).resolves.toBeNull();
    expect(onInvalidSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          token: "remote_token_signed_invalid",
          signatureVersion: "v2",
        }),
      }),
    );
    expect(element.listResumeTokens()).toEqual([]);
  });

  it("supports remote share-code exchange for cross-device resume", async () => {
    const sign = (payload: Record<string, any>) =>
      `${payload.token}:${payload.savedAt}:${payload.issuedAt}:${payload.expiresAt}:${payload.snapshot?.draft?.email || ""}`;
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume" && init?.method === "POST") {
        const body = JSON.parse(String(init?.body || "{}")) as Record<string, any>;
        if (body.operation === "create-share-code") {
          return new Response(JSON.stringify({
            operation: "create-share-code",
            code: "SHARE-42",
            token: body.token,
            expiresAt: 7777,
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (body.operation === "claim-share-code") {
          const snapshot = { draft: { email: "cross-device@example.com" }, queue: [], deadLetter: [] };
          const token = "remote_token_claimed";
          const savedAt = 6000;
          const issuedAt = 6000;
          const expiresAt = 9000;
          return new Response(JSON.stringify({
            operation: "claim-share-code",
            code: body.code,
            token,
            savedAt,
            issuedAt,
            expiresAt,
            signatureVersion: "v2",
            signature: sign({ token, savedAt, issuedAt, expiresAt, snapshot }),
            snapshot,
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-share-code-form",
      title: "Remote Share Code Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-share-code",
        resumeEndpoint: "https://api.example.test/resume",
        shareCodeEndpoint: "https://api.example.test/resume",
        resumeTokenSignatureVersion: "v2",
        verifyResumeToken: (payload) => sign(payload) === payload.signature,
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;

    const detail = await element.createResumeShareCodeDetail("remote_token_123");
    expect(detail).toEqual({
      code: "SHARE-42",
      token: "remote_token_123",
      expiresAt: 7777,
      endpoint: "https://api.example.test/resume",
    });

    const code = await element.createResumeShareCode("remote_token_123");
    expect(code).toBe("SHARE-42");

    const claim = await element.claimResumeShareCode("SHARE-42");
    expect(claim).toEqual(expect.objectContaining({
      token: "remote_token_claimed",
      signatureVersion: "v2",
      signatureValid: true,
    }));

    const restored = await element.restoreFromShareCodeAsync("SHARE-42");
    expect(restored).toEqual({ email: "cross-device@example.com" });
    expect((element.querySelector("#email") as HTMLInputElement).value).toBe("cross-device@example.com");

    const createShareCall = fetchSpy.mock.calls.find(([url, init]) => {
      const body = JSON.parse(String(init?.body || "{}")) as Record<string, any>;
      return String(url) === "https://api.example.test/resume"
        && init?.method === "POST"
        && body.operation === "create-share-code";
    });
    expect(createShareCall).toBeDefined();
  });

  it("rejects share-code claim when signature verification fails", async () => {
    vi.spyOn(window, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "https://api.example.test/resume" && init?.method === "POST") {
        const body = JSON.parse(String(init?.body || "{}")) as Record<string, any>;
        if (body.operation === "claim-share-code") {
          return new Response(JSON.stringify({
            operation: "claim-share-code",
            code: body.code,
            token: "remote_token_claim_invalid",
            savedAt: 8000,
            issuedAt: 8000,
            expiresAt: 9000,
            signatureVersion: "v2",
            signature: "bad-signature",
            snapshot: {
              draft: { email: "tampered@example.com" },
              queue: [],
              deadLetter: [],
            },
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-share-code-invalid-form",
      title: "Remote Share Code Invalid Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-share-code-invalid",
        resumeEndpoint: "https://api.example.test/resume",
        shareCodeEndpoint: "https://api.example.test/resume",
        resumeTokenSignatureVersion: "v2",
        verifyResumeToken: () => false,
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;
    const onInvalidSignature = vi.fn();
    element.addEventListener("form-ui:resume-token-invalid-signature", (event) => {
      onInvalidSignature((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await expect(element.claimResumeShareCode("SHARE-FAIL")).resolves.toBeNull();
    expect(onInvalidSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          token: "remote_token_claim_invalid",
          signatureVersion: "v2",
        }),
      }),
    );
  });

  it("applies local share-code claim throttling and max-attempt guards", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "temporary" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "remote-share-code-throttle-form",
      title: "Remote Share Code Throttle Form",
      storage: {
        mode: "draft",
        adapter: "local-storage",
        key: "xpressui:test-remote-share-code-throttle",
        resumeEndpoint: "https://api.example.test/resume",
        shareCodeEndpoint: "https://api.example.test/resume",
        shareCodeClaimThrottleMs: 10_000,
        shareCodeClaimMaxAttempts: 1,
        shareCodeClaimBlockMs: 60_000,
      },
      fields: [{ name: "email", label: "Email", type: "email" }],
    }) as FormUI;
    const onClaimBlocked = vi.fn();
    element.addEventListener("form-ui:resume-share-code-claim-blocked", (event) => {
      onClaimBlocked((event as CustomEvent<TFormUISubmitDetail>).detail);
    });

    await expect(element.claimResumeShareCode("SHARE-LOCK")).resolves.toBeNull();
    await expect(element.claimResumeShareCode("SHARE-LOCK")).resolves.toBeNull();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(onClaimBlocked).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          code: "SHARE-LOCK",
          reason: "throttled",
        }),
      }),
    );
  });
});
