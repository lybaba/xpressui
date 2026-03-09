# Document Contract

Canonical version:
- `ocr-mrz-v2`

Primary runtime exports:
- `DOCUMENT_NORMALIZED_CONTRACT_VERSION`
- `createNormalizedDocumentContract(...)`
- `isDocumentNormalizedContractV2(...)`
- `summarizeNormalizedDocumentContract(...)`

Normalized shape:

```json
{
  "contractVersion": "ocr-mrz-v2",
  "status": "mrz_detected",
  "quality": {
    "textLength": 88,
    "estimatedConfidence": 1,
    "hasMrz": true,
    "hasFields": true,
    "mrzChecksumValid": true
  },
  "review": {
    "recommendedAction": "allow",
    "reasons": []
  },
  "mrz": {
    "format": "TD3",
    "documentCode": "P",
    "issuingCountry": "UTO",
    "documentNumber": "L898902C3",
    "nationality": "UTO",
    "birthDate": "740812",
    "expiryDate": "120415",
    "sex": "F",
    "valid": true
  },
  "fields": {
    "firstName": "ANNA MARIA",
    "lastName": "ERIKSSON",
    "documentNumber": "L898902C3"
  }
}
```

Required keys:
- `contractVersion`
- `status`
- `quality`
- `review`

Status values:
- `text_only`
- `mrz_detected`
- `mrz_invalid`

Notes:
- `mrz` is `null` when no MRZ was detected
- `fields` contains normalized extraction keys when available
- `review` exposes a workflow-friendly recommendation with stable reasons
- summary payloads may intentionally keep only `contractVersion`, `status`, `quality`, and `review`
- runtime consumers can read privacy-aware views via
  `getDocumentDataView(...)` / `getAllDocumentDataView(...)` using the same
  masking and exclusion semantics as submit payload building
