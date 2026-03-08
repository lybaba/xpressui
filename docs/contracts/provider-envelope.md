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
- `messages`: always an array of non-empty strings
- `errors`: always an array of normalized provider error objects
- `nextActions`: optional array of normalized action objects with at least `type`
- `data`: passthrough payload bucket

Normalized provider error shape:

```json
{
  "source": "approval-request",
  "code": "approval_pending",
  "field": "manager_id",
  "message": "Waiting for manager approval"
}
```

Normalized next-action shape:

```json
{
  "type": "open_url",
  "label": "Open case",
  "href": "https://example.test/cases/apr_123"
}
```

Transition precedence rules:
- explicit backend `transition` wins first
- provider-specific resolver logic runs second when no explicit `transition` is present
- status-derived workflow transition is a fallback only when no stronger transition is available

Compatibility note:
- legacy `nextActions: ["check-status"]` payloads are normalized to
  `{ "type": "check-status" }` in compat mode
- `strict-v2` still treats string next-action entries as contract drift

Contract modes:
- `compat`
- `warn-v2`
- `strict-v2`
