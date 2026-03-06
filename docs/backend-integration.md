# Backend Integration Guide

This guide defines practical request and response contracts for the built-in
providers shipped by `@lybaba/xpressui`.

The frontend component can submit directly to your backend and emit events based
on the response. These examples show the payloads your API should accept and the
responses your frontend can rely on.

## General Notes

- Default method is `POST`
- Default payload mode is JSON
- `submit.baseUrl` can prefix relative `endpoint` and `presignEndpoint` values
- `submit.providerRoutingPolicy` controls how provider transitions are applied:
  - `auto` (default)
  - `workflow-first`
  - `step-first`
  - `workflow-only`
  - `step-only`
- `type: "setting"` fields are excluded from outbound submit payloads by default
  and can be re-included using:
  - `field.includeInSubmit: true` (field-level)
  - `submit.settingFieldAllowlist: string[]` (submit-level whitelist)
  - `submit.includeSettingFields: true` (global include)
- The component emits `form-ui:submit-success` on successful HTTP responses
- The component emits `form-ui:submit-error` on non-2xx responses
- Provider-specific events are emitted in addition to the generic events

## Workflow-Aware Provider Additions

### `calendar-availability-hold`

Request payload:

```json
{
  "action": "calendar-availability-hold",
  "hold": {
    "slot_id": "slot_0900",
    "customer_email": "holder@example.com"
  }
}
```

Suggested response statuses:
- `hold_pending`
- `hold_confirmed`
- `hold_expired`

Provider events:
- success: `form-ui:calendar-availability-hold-success`
- error: `form-ui:calendar-availability-hold-error`

### `payment-capture`

Request payload:

```json
{
  "action": "payment-capture",
  "capture": {
    "payment_intent_id": "pi_123",
    "amount_to_capture": 42.5
  }
}
```

Suggested response statuses:
- success-like: `captured`, `succeeded`, `completed`
- failure-like: `failed`, `declined`, `rejected`

Provider events:
- success: `form-ui:payment-capture-success`
- error: `form-ui:payment-capture-error`

### `identity-review`

Request payload:

```json
{
  "action": "identity-review",
  "review": {
    "verification_id": "ver_123",
    "reviewer_note": "Manual review requested."
  }
}
```

Suggested response statuses:
- `pending_approval`
- `approved`
- `completed`
- `rejected`

Provider events:
- success: `form-ui:identity-review-success`
- error: `form-ui:identity-review-error`

## View And Hybrid Runtime Contract

`FormUI` can now run in three render modes:

- `mode="form"` (default): input-first behavior
- `mode="view"`: read-only output rendering, no submit interactions
- `mode="hybrid"`: input + output rendering side by side

### Value Sources In `view`/`hybrid`

Value resolution order is:

1. DOM field values
2. draft storage values (when enabled)
3. `view-values` / `data-view-values` JSON attribute
4. `setViewValues(...)` runtime override

Example:

```html
<form-ui
  name="invoice_view"
  mode="view"
  view-values='{"customer":"Alice","invoice_pdf":"https://cdn.example.test/invoice.pdf"}'
></form-ui>
```

### Output Renderers

Built-in renderer types:

- `text`
- `html`
- `image`
- `file`
- `video`
- `audio`
- `map`
- `link`

Default renderer inference uses field type + `accept` + `subType/refType` metadata.
You can override renderer selection per field using `data-view-renderer="..."`.

Runtime API:

```ts
formUI.setOutputRenderer("badge", ({ value }) => {
  const el = document.createElement("span");
  el.textContent = String(value || "").toUpperCase();
  return el;
});

formUI.setFieldOutputRenderer("status", "badge");
// or
formUI.setFieldOutputRenderer("status", ({ value }) => {
  const el = document.createElement("strong");
  el.textContent = `Status: ${value}`;
  return el;
});
```

### HTML Safety Policy

`html` output is sanitized by default (scripts/inline handlers/unsafe javascript URLs are removed).

Controls:

- global attribute: `allow-unsafe-html="true"` (or `data-allow-unsafe-html="true"`)
- field attribute: `data-view-html-unsafe="true"`
- runtime API:
  - `setAllowUnsafeHtml(boolean)`
  - `setHtmlSanitizer((html, context) => sanitizedHtml)`
  - `resetHtmlSanitizer()`

Use unsafe mode only for trusted backend-generated HTML.

### Secure View Templates

`html` view blocks can use field-driven templates with `data-view-template` /
`viewTemplate` and token placeholders like `{{field_name}}` or
`{{document.mrz.documentNumber}}`.

Default behavior is safe:
- placeholder values are HTML-escaped before interpolation
- final HTML output is still sanitized unless unsafe HTML mode is enabled

Trusted override:
- `data-view-template-unsafe="true"` / `viewTemplateUnsafe: true` allows raw
  placeholder HTML injection; only use with trusted values.

### Media / Resource Display Policies

Media renderers (`image` / `video` / `file`) support:

- `large`
- `thumbnail`
- `link`
- `gallery`

Per-field controls:

- markup attribute:
  - `data-view-media-display="thumbnail|large|link|gallery"`
  - `data-view-resource-display="thumbnail|large|link|gallery"` (alias)
- runtime API:
  - `setFieldMediaPolicy(fieldName, policy)`
  - `clearFieldMediaPolicy(fieldName)`

### Output Snapshot API And Events

UI API:

```ts
const snapshot = formUI.getOutputSnapshot();
```

Headless API:

```ts
const runtime = new FormRuntime(formConfig, { getValues: () => values });
const snapshot = runtime.getOutputSnapshot();
```

Snapshot shape:

```json
{
  "field_name": {
    "rendererType": "text|html|image|file|video|link|custom",
    "mediaDisplayPolicy": "thumbnail|large|link|gallery",
    "value": "..."
  }
}
```

`FormUI` emits `form-ui:output-snapshot` in `view` and `hybrid` modes when output rendering is refreshed.
The latest snapshot is also available in debug tools (`attachFormDebugObserver`, `createFormDebugPanel`).

### Submit Lifecycle Hooks

`submit.lifecycle` supports three runtime hooks:
- `preSubmit`: runs before request dispatch. Return:
  - `false` to cancel submission
  - a values object to replace the outbound payload
- `postSuccess`: runs after success events
- `postFailure`: runs after error events

If a lifecycle hook throws, `xpressui` emits `form-ui:submit-hook-error` with
`detail.result.stage` set to `preSubmit`, `postSuccess`, or `postFailure`.

## Provider Config Schemas

`provider.config` is now validated against provider-specific schemas when those
schemas are declared in the registry.

Example:

```json
{
  "type": "booking-availability",
  "endpoint": "/api/availability",
  "config": {
    "slotDurationMinutes": 15,
    "timezone": "Europe/Paris"
  }
}
```

Invalid config values fail fast when building submit requests, before network
calls are sent.

## Remote Save And Resume Endpoint

If `storage.resumeEndpoint` is configured, `xpressui` uses one endpoint for
remote save/resume lifecycle operations:

- `POST /resume` creates or updates a resumable snapshot and returns a token
- `GET /resume?token=...` looks up a token and returns the stored snapshot
- `DELETE /resume?token=...` invalidates the token

`POST` request body:

```json
{
  "operation": "create",
  "formName": "checkout-form",
  "snapshot": {
    "draft": {
      "email": "remote-resume@example.com"
    },
    "queue": [],
    "deadLetter": []
  }
}
```

Recommended `POST` response:

```json
{
  "operation": "create",
  "token": "remote_token_123",
  "savedAt": 123456
}
```

Recommended `GET` response:

```json
{
  "operation": "lookup",
  "token": "remote_token_123",
  "savedAt": 123456,
  "snapshot": {
    "draft": {
      "email": "remote-resume@example.com"
    },
    "queue": [],
    "deadLetter": []
  }
}
```

`GET` not-found response:

```json
{
  "operation": "lookup",
  "token": "missing_token",
  "found": false
}
```

Recommended `DELETE` response:

```json
{
  "operation": "invalidate",
  "token": "remote_token_123",
  "invalidated": true
}
```

`204` still works for backward compatibility.

## Standard Provider Response Envelope

`xpressui` can normalize older provider responses, but the recommended backend
contract is a shared envelope that keeps all providers consistent:

```json
{
  "status": "pending_approval",
  "transition": {
    "type": "workflow",
    "state": "pending_approval"
  },
  "messages": ["Waiting for manager approval"],
  "errors": [],
  "nextActions": [
    "check-approval-status"
  ],
  "data": {
    "approvalId": "apr_123"
  }
}
```

Normalized frontend event detail:
- `detail.result`: raw backend payload
- `detail.providerResult.status`: normalized provider status
- `detail.providerResult.transition`: normalized workflow or step transition
- `detail.providerResult.messages`: normalized message list
- `detail.providerResult.errors`: normalized error list
- `detail.providerResult.nextActions`: normalized next-action list when provided
- `detail.providerResult.data`: normalized provider data payload

Provider-aware error normalization:
- payment providers map `code`, `message`, and field-level `errors` to normalized `errors[]`
- approval providers map `reason` to a normalized approval error entry
- identity providers map `verificationErrors` / `documentErrors` to normalized entries
- when explicit `messages` are missing, `xpressui` derives `messages[]` from normalized errors

Legacy responses such as `{ "status": "approved", "approvalId": "apr_123" }`
still work. `xpressui` will normalize them into the same `providerResult`
shape for event consumers.

## Reservation Provider

Frontend config:

```ts
mountFormUI(container, {
  name: 'reservation-form',
  provider: {
    type: 'reservation',
    endpoint: '/api/reservations',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
    { name: 'partySize', label: 'Party Size', type: 'number', required: true },
  ],
});
```

Request body:

```json
{
  "action": "reservation",
  "reservation": {
    "email": "user@example.com",
    "date": "2026-03-03 20:00",
    "partySize": 4
  }
}
```

Suggested success response:

```json
{
  "status": "confirmed",
  "messages": ["Reservation created"],
  "data": {
    "reservationId": "res_123"
  }
}
```

Suggested validation failure response:

HTTP status: `422`

```json
{
  "code": "validation_error",
  "message": "Invalid reservation data",
  "errors": {
    "date": "slot_unavailable"
  }
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:reservation-success`

## Payment Provider

Frontend config:

```ts
mountFormUI(container, {
  name: 'payment-form',
  provider: {
    type: 'payment',
    endpoint: '/api/payments',
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});
```

Request body:

```json
{
  "action": "payment",
  "payment": {
    "amount": 42.5,
    "email": "buyer@example.com"
  }
}
```

Suggested success response:

```json
{
  "paymentId": "pay_123",
  "status": "authorized",
  "message": "Payment initialized"
}
```

Suggested failure response:

HTTP status: `402`

```json
{
  "code": "payment_failed",
  "message": "Card authorization failed",
  "errors": {
    "amount": "Amount is below minimum charge"
  }
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:payment-success`
- `form-ui:payment-error`

## Stripe Payment Provider

Use this provider when your backend creates a Stripe PaymentIntent.

Frontend config:

```ts
mountFormUI(container, {
  name: 'stripe-payment-form',
  provider: {
    type: 'payment-stripe',
    endpoint: '/api/stripe/create-intent',
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});
```

Request body:

```json
{
  "action": "payment-stripe",
  "payment": {
    "amount": 19.99,
    "email": "stripe@example.com"
  }
}
```

Recommended success response:

```json
{
  "clientSecret": "pi_secret_123",
  "paymentIntentId": "pi_123",
  "redirectUrl": "/checkout/complete"
}
```

Recommended failure response:

HTTP status: `400`

```json
{
  "code": "stripe_intent_error",
  "message": "Unable to create payment intent"
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`

## Identity Verification Webhook Provider

Use this provider when your backend forwards normalized identity data to an
internal webhook or a third-party KYC system.

Frontend config:

```ts
mountFormUI(container, {
  name: 'identity-webhook-form',
  provider: {
    type: 'identity-verification-webhook',
    endpoint: '/api/identity/webhook',
  },
  submit: {
    endpoint: '/api/identity/webhook',
    includeDocumentData: true,
    documentDataMode: 'summary',
    documentFieldPaths: ['mrz.documentNumber', 'mrz.valid', 'fields.firstName', 'fields.lastName'],
  },
  fields: [
    { name: 'document_number', label: 'Document Number', type: 'text', required: true },
    { name: 'last_name', label: 'Last Name', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "identity-verification-webhook",
  "identity": {
    "document_number": "L898902C3",
    "last_name": "ERIKSSON",
    "document": {
      "field": "passport",
      "mrz": {
        "documentNumber": "L898902C3",
        "nationality": "UTO",
        "valid": true
      },
      "fields": {
        "firstName": "ANNA MARIA",
        "lastName": "ERIKSSON"
      }
    }
  }
}
```

Suggested success response:

```json
{
  "accepted": true,
  "webhookId": "wh_123"
}
```

Frontend events:
- `form-ui:submit-success`
- `form-ui:identity-verification-webhook-success`
- `form-ui:identity-verification-webhook-error`

## CRM Provider

Use this provider when your backend creates or updates leads in a CRM system.

Frontend config:

```ts
mountFormUI(container, {
  name: 'crm-form',
  provider: {
    type: 'crm',
    endpoint: '/api/crm/leads',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "crm",
  "contact": {
    "email": "lead@example.com",
    "full_name": "Alice Prospect"
  }
}
```

Suggested success response:

```json
{
  "accepted": true,
  "leadId": "lead_123"
}
```

Frontend events:
- `form-ui:crm-success`
- `form-ui:crm-error`

## Calendar Booking Provider

Use this provider when your backend confirms a selected time slot and creates a
calendar booking.

Frontend config:

```ts
mountFormUI(container, {
  name: 'calendar-booking-form',
  provider: {
    type: 'calendar-booking',
    endpoint: '/api/bookings',
  },
  fields: [
    { name: 'service', label: 'Service', type: 'text', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'slot', label: 'Slot', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "calendar-booking",
  "booking": {
    "service": "massage",
    "date": "2026-03-12",
    "slot": "10:00"
  }
}
```

Suggested success response:

```json
{
  "confirmed": true,
  "bookingId": "bk_123",
  "transition": {
    "type": "step",
    "target": "confirmation_step"
  }
}
```

`transition` is optional. When present, `xpress-ui` will apply it directly after
the provider succeeds. Supported shapes:
- `{ "type": "step", "target": "step_name" }`
- `{ "type": "workflow", "state": "approved" }`

Frontend events:
- `form-ui:calendar-booking-success`
- `form-ui:calendar-booking-error`

## Calendar Cancel Provider

Use this provider when your backend cancels an existing booking.

Frontend config:

```ts
mountFormUI(container, {
  name: 'calendar-cancel-form',
  provider: {
    type: 'calendar-cancel',
    endpoint: '/api/bookings/cancel',
  },
  fields: [
    { name: 'booking_id', label: 'Booking ID', type: 'text', required: true },
    { name: 'reason', label: 'Reason', type: 'text' },
  ],
});
```

Request body:

```json
{
  "action": "calendar-cancel",
  "cancellation": {
    "booking_id": "bk_123",
    "reason": "User requested change"
  }
}
```

Suggested success response:

```json
{
  "cancelled": true,
  "bookingId": "bk_123"
}
```

Frontend events:
- `form-ui:calendar-cancel-success`
- `form-ui:calendar-cancel-error`

## Calendar Reschedule Provider

Use this provider when your backend changes an existing booking to a new slot.

Frontend config:

```ts
mountFormUI(container, {
  name: 'calendar-reschedule-form',
  provider: {
    type: 'calendar-reschedule',
    endpoint: '/api/bookings/reschedule',
  },
  fields: [
    { name: 'booking_id', label: 'Booking ID', type: 'text', required: true },
    { name: 'new_date', label: 'New Date', type: 'date', required: true },
    { name: 'new_slot', label: 'New Slot', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "calendar-reschedule",
  "reschedule": {
    "booking_id": "bk_123",
    "new_date": "2026-03-18",
    "new_slot": "14:00"
  }
}
```

Suggested success response:

```json
{
  "rescheduled": true,
  "bookingId": "bk_123"
}
```

Frontend events:
- `form-ui:calendar-reschedule-success`
- `form-ui:calendar-reschedule-error`

## Approval Request Provider

Use this provider when your backend creates an approval workflow request that
can remain pending before a final decision.

Frontend config:

```ts
mountFormUI(container, {
  name: 'approval-request-form',
  provider: {
    type: 'approval-request',
    endpoint: '/api/approvals',
  },
  fields: [
    { name: 'requester_email', label: 'Requester Email', type: 'email', required: true },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
  ],
});
```

Request body:

```json
{
  "action": "approval-request",
  "approval": {
    "requester_email": "approver@example.com",
    "amount": "250"
  }
}
```

Suggested pending response:

```json
{
  "status": "pending_approval",
  "approvalId": "apr_123",
  "transition": {
    "type": "workflow",
    "state": "pending_approval"
  }
}
```

Suggested completed response:

```json
{
  "status": "approved",
  "approvalId": "apr_123",
  "transition": {
    "type": "workflow",
    "state": "approved"
  }
}

Suggested failure response:

HTTP status: `409`

```json
{
  "reason": "Approver is unavailable"
}
```
```

For `approval-request` and `approval-decision`, the `transition` block is
optional. If omitted, the built-in provider still maps known statuses
(`pending_approval`, `approved`, `completed`, `rejected`) to the same standard
workflow transitions.

Frontend events:
- `form-ui:approval-request-success`
- `form-ui:approval-request-error`
- `form-ui:approval-requested`
- `form-ui:approval-complete`

## Approval Decision Provider

Use this provider when your backend records the final approver decision for an
existing approval request.

Frontend config:

```ts
mountFormUI(container, {
  name: 'approval-decision-form',
  provider: {
    type: 'approval-decision',
    endpoint: '/api/approvals/decision',
  },
  fields: [
    { name: 'approval_id', label: 'Approval ID', type: 'text', required: true },
    { name: 'decision', label: 'Decision', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "approval-decision",
  "decision": {
    "approval_id": "apr_123",
    "decision": "approved"
  }
}
```

Suggested success response:

```json
{
  "status": "completed",
  "approvalId": "apr_123"
}
```

Frontend events:
- `form-ui:approval-decision-success`
- `form-ui:approval-decision-error`
- `form-ui:approval-state`

## Approval Comment Provider

Use this provider when your backend stores approver comments or audit trail
messages linked to an approval request.

Frontend config:

```ts
mountFormUI(container, {
  name: 'approval-comment-form',
  provider: {
    type: 'approval-comment',
    endpoint: '/api/approvals/comment',
  },
  fields: [
    { name: 'approval_id', label: 'Approval ID', type: 'text', required: true },
    { name: 'comment', label: 'Comment', type: 'textarea', required: true },
  ],
});
```

Request body:

```json
{
  "action": "approval-comment",
  "comment": {
    "approval_id": "apr_123",
    "comment": "Approved with note"
  }
}
```

Suggested success response:

```json
{
  "saved": true,
  "commentId": "cmt_123"
}
```

## Identity Verification Provider

Suggested failure response:

HTTP status: `422`

```json
{
  "verificationErrors": [
    { "code": "mrz_invalid", "message": "MRZ checksum failed", "field": "document_number" },
    "Image quality is too low"
  ]
}
```

Frontend events:
- `form-ui:approval-comment-success`
- `form-ui:approval-comment-error`

## Dynamic Options Endpoint

For select fields using `optionsEndpoint`, the component performs a `GET` and
expects either:
- a top-level array
- an object with `items`
- an object with `options`

Example frontend config:

```ts
mountFormUI(container, {
  name: 'booking-form',
  fields: [
    {
      name: 'service',
      label: 'Service',
      type: 'select-one',
      choices: [
        { value: 'consulting', label: 'Consulting' },
        { value: 'support', label: 'Support' }
      ]
    },
    {
      name: 'slot',
      label: 'Slot',
      type: 'select-one',
      optionsEndpoint: '/api/slots',
      optionsDependsOn: 'service'
    }
  ]
});
```

Generated request:

```http
GET /api/slots?service=consulting
```

Accepted response shapes:

```json
[
  { "value": "morning", "label": "Morning" },
  { "value": "evening", "label": "Evening" }
]
```

```json
{
  "items": [
    { "value": "morning", "label": "Morning" },
    { "value": "evening", "label": "Evening" }
  ]
}
```

```json
{
  "options": [
    { "id": "morning", "name": "Morning" },
    { "id": "evening", "name": "Evening" }
  ]
}
```

If you use custom keys, set:
- `optionsValueKey`
- `optionsLabelKey`

## Multipart File Uploads

Use `submit.mode: 'form-data'` for file uploads. The frontend sends real
browser `File` blobs in a `multipart/form-data` request.

Frontend config:

```ts
mountFormUI(container, {
  name: 'upload-form',
  submit: {
    endpoint: '/api/uploads',
    method: 'POST',
    mode: 'form-data',
    formDataArrayMode: 'brackets',
  },
  fields: [
    {
      name: 'attachments',
      label: 'Attachments',
      type: 'file',
      accept: '.pdf,image/*',
      multiple: true,
    },
  ],
});
```

Generated multipart fields:
- `attachments[]` for each uploaded file

If your backend expects repeated keys without brackets, use:

```ts
submit: {
  endpoint: '/api/uploads',
  method: 'POST',
  mode: 'form-data',
  formDataArrayMode: 'repeat',
}
```

Then the frontend sends:
- `attachments`
- `attachments`

If one field needs a different backend name, set it directly on the field:

```ts
{
  name: 'attachments',
  label: 'Attachments',
  type: 'file',
  multiple: true,
  formDataFieldName: 'documents',
}
```

Then the frontend sends:
- `documents[]` in `brackets` mode
- `documents` in `repeat` mode

## Presigned Uploads

Use `uploadStrategy: 'presigned'` when your backend signs an upload URL first,
then the browser uploads the binary directly before sending the final form
submission.

Frontend config:

```ts
mountFormUI(container, {
  name: 'presigned-upload-form',
  submit: {
    endpoint: '/api/uploads/complete',
    method: 'POST',
    mode: 'form-data',
    uploadStrategy: 'presigned',
    presignEndpoint: '/api/uploads/presign',
  },
  fields: [
    {
      name: 'attachment',
      label: 'Attachment',
      type: 'file',
    },
  ],
});
```

Presign request body:

```json
{
  "fieldName": "attachment",
  "fileName": "report.pdf",
  "contentType": "application/pdf",
  "size": 123456
}
```

Expected presign response:

```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/...",
  "fileUrl": "https://cdn.example.com/report.pdf"
}
```

After the direct upload completes, the final form submission sends `fileUrl`
instead of the original `File` object.

Minimal Express example:

```ts
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/uploads', upload.array('attachments[]'), (req, res) => {
  const files = (req.files || []).map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storedAs: file.filename,
  }));

  res.json({
    uploaded: true,
    files,
  });
});
```

Suggested success response:

```json
{
  "uploaded": true,
  "files": [
    {
      "originalName": "report.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "storedAs": "9c0a0c2f..."
    }
  ]
}
```

Frontend event:
- `form-ui:options-loaded`

## Express Example

Minimal Node/Express example:

```ts
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/reservations', (req, res) => {
  const { reservation } = req.body;
  return res.json({
    reservationId: 'res_123',
    status: 'confirmed',
    reservation,
  });
});

app.post('/api/payments', (req, res) => {
  const { payment } = req.body;
  return res.json({
    paymentId: 'pay_123',
    status: 'authorized',
    payment,
  });
});

app.post('/api/stripe/create-intent', (req, res) => {
  return res.json({
    clientSecret: 'pi_secret_123',
    paymentIntentId: 'pi_123',
    redirectUrl: '/checkout/complete',
  });
});

app.get('/api/slots', (req, res) => {
  const { service } = req.query;
  if (service === 'consulting') {
    return res.json([
      { value: 'morning', label: 'Morning' },
      { value: 'evening', label: 'Evening' },
    ]);
  }

  return res.json([]);
});
```
