# Resume Contract

Canonical version:
- `resume-contract-v1`

Primary runtime exports:
- `REMOTE_RESUME_CONTRACT_VERSION`
- `isRemoteResumePolicy(...)`
- `getRemoteResumePolicy(...)`

Applies to:
- remote resume create
- remote resume lookup
- remote resume invalidate
- share-code create
- share-code claim

Blocked claim example:

```json
{
  "contractVersion": "resume-contract-v1",
  "operation": "claim-share-code",
  "policy": {
    "code": "rate_limited",
    "reason": "Too many claim attempts",
    "retryAfterSeconds": 60,
    "blockedUntil": 123516
  }
}
```

Supported `policy.code` values:
- `rate_limited`
- `blocked`
- `expired`
- `invalid_signature`
- `not_found`

Notes:
- the client still supports legacy resume responses for backward compatibility
- structured `policy` metadata is the preferred backend shape for blocked or throttled claim attempts
- `claimResumeShareCodeDetail(code)` normalizes claim outcomes into one lifecycle state surface:
  - `claimed`
  - `throttled`
  - `blocked`
  - `expired`
  - `invalid_signature`
  - `not_found`
  - `invalid_response`
  - `network_error`
- `restoreFromShareCodeDetailAsync(code)` turns claim + restore into one explicit result:
  - `restored`
  - `claim_failed`
- the browser runtime also emits `xpressui:resume-share-code-claim-state` for every normalized outcome
- the browser runtime emits `xpressui:resume-share-code-restore-state` for every restore attempt
- local tooling can inspect persisted resume state with `createLocalFormAdmin(formConfig)` and:
  - `getOperationalSummary()`
  - `getIncidentSummary()`
