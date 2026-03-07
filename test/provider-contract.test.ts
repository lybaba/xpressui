import { describe, expect, it } from "vitest";
import {
  createNormalizedProviderResult,
  isNormalizedProviderResult,
  isProviderResponseEnvelopeV2,
  normalizeProviderResult,
  PROVIDER_RESPONSE_CONTRACT_VERSION,
  validateProviderResponseEnvelopeV2,
} from "../src/index";

describe("Provider Contract", () => {
  it("normalizes provider-specific error payloads into consistent errors and messages", () => {
    const paymentErrorResult = normalizeProviderResult(
      "payment",
      {
        code: "payment_failed",
        message: "Card authorization failed",
        errors: {
          amount: "Amount is below minimum charge",
        },
      },
      {
        endpoint: "https://api.example.test/payments",
        action: "payment",
      },
    );
    expect(paymentErrorResult.messages).toEqual([
      "Card authorization failed",
      "Amount is below minimum charge",
    ]);
    expect(paymentErrorResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "payment",
          code: "field_error",
          field: "amount",
          message: "Amount is below minimum charge",
        }),
        expect.objectContaining({
          source: "payment",
          code: "payment_failed",
          message: "Card authorization failed",
        }),
      ]),
    );

    const approvalErrorResult = normalizeProviderResult(
      "approval-request",
      {
        reason: "Approver is unavailable",
      },
      {
        endpoint: "https://api.example.test/approvals",
        action: "approval-request",
      },
    );
    expect(approvalErrorResult.messages).toEqual(["Approver is unavailable"]);
    expect(approvalErrorResult.errors).toEqual([
      expect.objectContaining({
        source: "approval-request",
        code: "approval_error",
        message: "Approver is unavailable",
      }),
    ]);

    const identityErrorResult = normalizeProviderResult(
      "identity-verification",
      {
        verificationErrors: [
          { code: "mrz_invalid", message: "MRZ checksum failed", field: "document_number" },
          "Image quality is too low",
        ],
      },
      {
        endpoint: "https://api.example.test/identity/verify",
        action: "identity-verification",
      },
    );
    expect(identityErrorResult.messages).toEqual([
      "MRZ checksum failed",
      "Image quality is too low",
    ]);
    expect(identityErrorResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "identity-verification",
          code: "mrz_invalid",
          field: "document_number",
          message: "MRZ checksum failed",
        }),
        expect.objectContaining({
          source: "identity-verification",
          code: "verification_error",
          message: "Image quality is too low",
        }),
      ]),
    );
  });

  it("validates provider response envelope v2 shape", () => {
    expect(isProviderResponseEnvelopeV2({
      status: "pending_approval",
      transition: { type: "workflow", state: "pending_approval" },
      messages: [],
      errors: [],
      nextActions: [],
      data: {},
    })).toBe(true);

    expect(validateProviderResponseEnvelopeV2({
      status: 42,
      messages: "invalid",
      transition: { type: "workflow" },
    })).toEqual(
      expect.arrayContaining([
        "status must be a string",
        "messages must be an array",
        "transition must match {type:'step'|'workflow'} contract",
      ]),
    );
  });

  it("creates and validates a normalized provider result with stable array fields", () => {
    const result = createNormalizedProviderResult({
      status: "pending_approval",
      data: { approvalId: "apr_123" },
    });

    expect(result).toEqual({
      status: "pending_approval",
      transition: null,
      messages: [],
      errors: [],
      data: { approvalId: "apr_123" },
    });
    expect(isNormalizedProviderResult(result)).toBe(true);
    expect(isNormalizedProviderResult({ status: "ok", messages: [] })).toBe(false);
    expect(PROVIDER_RESPONSE_CONTRACT_VERSION).toBe("provider-envelope-v2");
  });
});
