import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNormalizedDocumentContract,
  FormUI,
  mountFormUI,
} from "../src/index";
import { resetDomAndStorage } from "./test-utils";

describe("Document Contract", () => {
  beforeEach(() => {
    resetDomAndStorage();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("creates a normalized OCR/MRZ contract with stable versioning", () => {
    expect(
      createNormalizedDocumentContract(
        "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
        {
          format: "TD3",
          lines: [],
          documentCode: "P",
          issuingCountry: "UTO",
          documentNumber: "L898902C3",
          valid: true,
        },
        { firstName: "ANNA MARIA" },
      ),
    ).toEqual(
      expect.objectContaining({
        contractVersion: "ocr-mrz-v2",
        status: "mrz_detected",
        quality: expect.objectContaining({
          textLength: expect.any(Number),
          estimatedConfidence: expect.any(Number),
        }),
        mrz: expect.objectContaining({
          documentNumber: "L898902C3",
          valid: true,
        }),
        fields: {
          firstName: "ANNA MARIA",
        },
      }),
    );
  });

  it("can include normalized document data in submitted FormUI payloads", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const container = document.createElement("div");
    const element = mountFormUI(container, {
      name: "document-submit-form",
      title: "Document Submit Form",
      submit: {
        endpoint: "https://api.example.test/document-submit",
        method: "POST",
        includeDocumentData: true,
        documentDataMode: "summary",
      },
      fields: [
        {
          name: "email",
          label: "Email",
          type: "email",
        },
      ],
    }) as FormUI;

    element.engine.setDocumentData("passport", {
      text: "P<UTOERIKSSON",
      mrz: { documentNumber: "L898902C3", valid: true, nationality: "UTO" },
      fields: { firstName: "ANNA MARIA" },
    });

    await element.onSubmit({ email: "doc@example.com" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.example.test/document-submit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "doc@example.com",
          document: {
            field: "passport",
            mrz: {
              format: undefined,
              documentCode: undefined,
              issuingCountry: undefined,
              documentNumber: "L898902C3",
              nationality: "UTO",
              birthDate: undefined,
              expiryDate: undefined,
              sex: undefined,
              valid: true,
            },
            fields: { firstName: "ANNA MARIA" },
          },
        }),
      }),
    );
  });
});
