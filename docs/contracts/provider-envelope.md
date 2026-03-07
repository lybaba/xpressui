# Provider Envelope

Canonical version:
- `provider-envelope-v2`

Primary runtime exports:
- `PROVIDER_RESPONSE_CONTRACT_VERSION`
- `validateProviderResponseEnvelopeV2(...)`
- `isProviderResponseEnvelopeV2(...)`
- `normalizeProviderResult(...)`
- `createNormalizedProviderResult(...)`
- `isNormalizedProviderResult(...)`

Envelope shape:

```json
{
  "status": "pending_approval",
  "transition": { "type": "workflow", "state": "pending_approval" },
  "messages": ["Manual review required"],
  "errors": [],
  "nextActions": [{ "type": "review", "label": "Open case" }],
  "data": {
    "approvalId": "apr_123"
  }
}
```

Normalized runtime guarantees:
- `status`: `string | null`
- `transition`: normalized transition or `null`
- `messages`: always an array
- `errors`: always an array
- `nextActions`: optional array when provided by the backend
- `data`: passthrough payload bucket

Contract modes:
- `compat`
- `warn-v2`
- `strict-v2`
