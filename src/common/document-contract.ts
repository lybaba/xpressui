export type TDocumentMrzResult = {
  format: "TD1" | "TD2" | "TD3";
  lines: string[];
  documentCode: string;
  issuingCountry: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  expiryDate?: string;
  sex?: string;
  surnames?: string[];
  givenNames?: string[];
  checksums?: {
    documentNumber?: boolean;
    birthDate?: boolean;
    expiryDate?: boolean;
    composite?: boolean;
  };
  valid?: boolean;
};

export type TDocumentNormalizedContractV2 = {
  contractVersion: "ocr-mrz-v2";
  status: "text_only" | "mrz_detected" | "mrz_invalid";
  quality: {
    textLength: number;
    estimatedConfidence: number;
  };
  mrz?: TDocumentMrzResult | null;
  fields?: Record<string, any> | null;
};

export type TDocumentScanInsight = {
  textBySlot: Array<string | null>;
  mrzBySlot: Array<TDocumentMrzResult | null>;
  normalizedBySlot: Array<TDocumentNormalizedContractV2 | null>;
};

export function createNormalizedDocumentContract(
  detectedText: string,
  mrz: TDocumentMrzResult | null,
  fields: Record<string, any> | null,
): TDocumentNormalizedContractV2 {
  const estimatedConfidence = Math.max(0, Math.min(1, Number((detectedText.length / 64).toFixed(2))));
  const status: TDocumentNormalizedContractV2["status"] = !mrz
    ? "text_only"
    : mrz.valid === false
      ? "mrz_invalid"
      : "mrz_detected";

  return {
    contractVersion: "ocr-mrz-v2",
    status,
    quality: {
      textLength: detectedText.length,
      estimatedConfidence,
    },
    mrz: mrz || null,
    fields: fields || null,
  };
}
