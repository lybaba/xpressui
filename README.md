# xpress-ui

`@lybaba/xpressui` is a lightweight form engine built around a custom element:
`<form-ui>`.

It helps you:
- define forms from simple JavaScript objects
- validate input with AJV + `final-form`
- submit data to your backend with normalized payloads
- plug in common workflows such as reservation and payment
- build dynamic forms with conditional fields and API-driven select options

This repository currently ships a browser-focused Web Component library. It is
not the old React `PostUI` API shown in earlier versions of the README.

## Current Scope

The public API is centered on:
- `FormUI` (the custom element class)
- `FormRuntime` (the composed headless runtime)
- `FormUploadRuntime` (the dedicated upload runtime)
- `mountFormUI(...)`
- `createFormConfig(...)`
- `createFormPreset(...)`
- `fieldFactory`
- `createTemplateMarkup(...)`

The recommended path is `mountFormUI(...)`, which lets you mount a form from a
plain object without hand-writing a full HTML template.

`FormUI` also exposes `getActiveTemplateWarnings()` for direct inspection of
active template issues on the mounted component.
Use `clearActiveTemplateWarnings()` to reset that warning state.
It also exposes `getRecentAppliedRules()` to inspect the latest effective rule
applications.
Use `clearRecentAppliedRules()` to reset that in-memory rule state.

For storage/debug tooling outside the component instance, use
`createLocalFormAdmin(formConfig)`.

Public API you should treat as stable:
- `mountFormUI(...)`
- `createFormConfig(...)`
- `createFormPreset(...)`
- `fieldFactory`
- `createTemplateMarkup(...)`
- `FormUI`
- `FormRuntime`
- `FormUploadRuntime`
- `createLocalFormAdmin(...)`
- public schema helpers (`validatePublicFormConfig`, `migratePublicFormConfig`)

Advanced building blocks available but better treated as lower-level/internal:
- `FormEngineRuntime`
- `FormDynamicRuntime`
- `FormPersistenceRuntime`
- `provider-registry` helpers
- `form-submit` internals

If you work directly with `FormDynamicRuntime`, you can also inspect current
template issues through `getActiveTemplateWarnings()`.

For lightweight event inspection in the browser, you can also use
`attachFormDebugObserver(...)`.
If you want a quick local UI instead of wiring your own console output, use
`createFormDebugPanel(...)`.

The public form contract is now versioned.
Current public schema version:
- `1`

## Requirements

- Node.js `20.19.0` or newer

```bash
nvm install 20.19.0
nvm use 20.19.0
```

## Installation

The package is configured for GitHub Packages:

```bash
npm install @lybaba/xpressui
```

If you publish privately through GitHub Packages, make sure your npm registry
and auth are configured for the `@lybaba` scope.

## Quick Start

```ts
import { mountFormUI } from '@lybaba/xpressui';

const container = document.getElementById('app');

if (container) {
  const form = mountFormUI(container, {
    name: 'contact-form',
    title: 'Contact Us',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      {
        name: 'topics',
        label: 'Topics',
        type: 'select-multiple',
        choices: [
          { value: 'sales', label: 'Sales' },
          { value: 'support', label: 'Support' },
          { value: 'billing', label: 'Billing' },
        ],
      },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  });

  form?.addEventListener('form-ui:submit-success', (event) => {
    console.log('Submitted', (event as CustomEvent).detail.values);
  });
}
```

## Faster Form Creation

If you want less boilerplate, use the built-in field helpers and presets:

```ts
import { createFormPreset, fieldFactory, mountFormUI } from '@lybaba/xpressui';

const form = createFormPreset('identity-check', {
  name: 'onboarding-kyc',
  fields: [
    fieldFactory.cameraPhoto('selfie_capture', 'Selfie Capture'),
  ],
});

mountFormUI(container, form);
```

Available presets:
- `contact`
- `booking-request`
- `payment-request`
- `identity-check`

## Headless Runtime

If you do not want to mount `<form-ui>`, use `FormRuntime` directly. It
combines validation, normalization, local persistence, and optional dynamic
field behavior behind a single headless API.

```ts
import { createFormConfig, FormRuntime } from '@lybaba/xpressui';

const values = {
  amount: '42.50',
  email: 'buyer@example.com',
};

const formConfig = createFormConfig({
  name: 'headless-payment',
  title: 'Headless Payment',
  storage: {
    mode: 'draft',
    adapter: 'local-storage',
    key: 'xpressui:headless-payment',
    autoSaveMs: 0,
  },
  fields: [
    { name: 'amount', label: 'Amount', type: 'price', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const runtime = new FormRuntime(formConfig, {
  getValues: () => values,
});

for (const field of formConfig.sections.main || []) {
  runtime.setField(field.name, field);
}

const normalized = runtime.normalizeValues(values);
const errors = runtime.validateValues(values);

runtime.saveDraft();
const draft = runtime.loadDraftValues();
await runtime.hydrateStorage();
```

Main `FormRuntime` methods:
- `setFormConfig(...)`
- `setField(...)`
- `normalizeValues(...)`
- `validateValues(...)`
- `saveDraft()`
- `loadDraftValues()`
- `clearDraft()`
- `getQueueState()`
- `getStorageSnapshot()`
- `flushSubmissionQueue()`
- `getActiveTemplateWarnings()`
- `clearActiveTemplateWarnings()`
- `getRecentAppliedRules()`
- `clearRecentAppliedRules()`

If you pass DOM adapters through `dynamic`, the same runtime can also handle:
- `updateConditionalFields()`
- `refreshRemoteOptions()`
- `getActiveTemplateWarnings()`
- `clearActiveTemplateWarnings()`
- `getRecentAppliedRules()`
- `clearRecentAppliedRules()`

Public types exported for headless integrations:
- `TFormRuntimeOptions`
- `TFormRuntimePublicApi`
- `TFormRuntimeDynamicAdapters`
- `TFormRuntimeSubmitValues`
- `TFormRuntimeSubmitResult`

## Debug Observer

Use `attachFormDebugObserver(...)` to record `form-ui:*` runtime events without
instrumenting each event manually.

```ts
import { attachFormDebugObserver, mountFormUI } from '@lybaba/xpressui';

const form = mountFormUI(container, {
  name: 'debug-form',
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const observer = form
  ? attachFormDebugObserver(form, { maxEvents: 50 })
  : null;

console.log(observer?.getEvents());
console.log(observer?.getRuleHistory());
console.log(observer?.getRecentAppliedRules());
console.log(observer?.getLastRuleState());
console.log(observer?.getTemplateDiagnostics());
console.log(observer?.getActiveTemplateWarnings());
console.log(observer?.getLastTemplateWarningState());
console.log(observer?.getSnapshot());
```

The observer API:
- `getEvents()`
- `getRuleHistory()`
- `getRecentAppliedRules()`
- `getLastRuleState()`
- `getTemplateDiagnostics()`
- `getActiveTemplateWarnings()`
- `getLastTemplateWarningState()`
- `getSnapshot()`
- `clear()`
- `clearSnapshot()`
- `clearRuleHistory()`
- `clearRecentAppliedRules()`
- `clearLastRuleState()`
- `clearTemplateDiagnostics()`
- `clearActiveTemplateWarnings()`
- `clearLastTemplateWarningState()`
- `detach()`

`getRuleHistory()` returns only `form-ui:rule-applied` events. Use
`clearRuleHistory()` to reset that rule-specific buffer without clearing the
full event log.

`getRecentAppliedRules()` returns the latest rule-state snapshot seen by the
observer. Use `clearRecentAppliedRules()` to reset only that local cache.

`getLastRuleState()` returns the last full `form-ui:rule-state` event record,
including its timestamp.

`getTemplateDiagnostics()` returns only `form-ui:rule-template-missing-field`
and `form-ui:rule-template-warning-cleared` events.

Use `clearActiveTemplateWarnings()` to reset only the observer's local cached
warning state.

`getActiveTemplateWarnings()` returns the current active template warning state
without requiring you to keep the latest `form-ui:rule-template-warning-state`
event yourself.

`getLastTemplateWarningState()` returns the last full
`form-ui:rule-template-warning-state` event record, including its timestamp.

`getSnapshot()` returns the observer's current derived state in one read:
recent rules, last rule-state event, active template warnings, and the last
template warning-state event.

## Debug Panel

Use `createFormDebugPanel(...)` for a minimal in-browser panel backed by the
same debug observer. It renders counts, recent rules, and active template
warnings in separate sections, shows a `Last Updated` indicator, and includes
local `Clear Snapshot` and `Clear Events` buttons. It also shows whether the
panel is currently `listening` or `detached`.

```ts
import { createFormDebugPanel, mountFormUI } from '@lybaba/xpressui';

const form = mountFormUI(container, {
  name: 'debug-panel-form',
  fields: [
    { name: 'email', label: 'Email', type: 'email' },
  ],
});

const panel = form
  ? createFormDebugPanel(form, { title: 'Runtime Debug' })
  : null;

if (panel) {
  document.body.appendChild(panel.element);
}
```

`clearSnapshot()` resets only that derived state bundle. It does not clear the
raw event history or diagnostic history.

## Submission Modes

### 1. Manual handling through events

If you do not provide a submit endpoint, the component validates the form and
emits events. Your app decides what to do next.

Events:
- `form-ui:submit`
- `form-ui:submit-success`
- `form-ui:submit-error`

### 2. Direct API submission

Provide a `submit` block and the component will call your backend with `fetch`.

```ts
mountFormUI(container, {
  name: 'booking-form',
  title: 'Book a Table',
  submit: {
    endpoint: '/api/bookings',
    method: 'POST',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Supported submit options:
- `endpoint`
- `method`
- `headers`
- `mode` (`json` or `form-data`)
- `action`

## Built-in Providers

Providers are thin presets on top of `submit`. They normalize payloads so your
backend receives stable request shapes.

### Reservation

```ts
mountFormUI(container, {
  name: 'reservation-form',
  title: 'Reserve',
  provider: {
    type: 'reservation',
    endpoint: '/api/reservations',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'date', label: 'Date', type: 'datetime', required: true },
  ],
});
```

Request body:

```json
{
  "action": "reservation",
  "reservation": {
    "email": "user@example.com",
    "date": "2026-03-03 20:00"
  }
}
```

Extra event:
- `form-ui:reservation-success`

### Payment

```ts
mountFormUI(container, {
  name: 'payment-form',
  title: 'Pay Now',
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

Extra events:
- `form-ui:payment-success`
- `form-ui:payment-error`

### Stripe Payment

Use `payment-stripe` when your backend creates a Stripe PaymentIntent and
returns checkout metadata to the frontend.

```ts
mountFormUI(container, {
  name: 'stripe-payment-form',
  title: 'Pay with Stripe',
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

Expected backend response:

```json
{
  "clientSecret": "pi_secret_123",
  "paymentIntentId": "pi_123",
  "redirectUrl": "/checkout/complete"
}
```

Extra events:
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`

### Webhook

Use `webhook` for a generic outbound integration when you want to forward a
normalized payload to another backend endpoint without creating a custom
provider first.

```ts
mountFormUI(container, {
  name: 'webhook-form',
  title: 'Webhook Form',
  provider: {
    type: 'webhook',
    endpoint: '/api/hooks/inbound',
  },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'topic', label: 'Topic', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "webhook",
  "data": {
    "email": "hook@example.com",
    "topic": "lead.created"
  }
}
```

Extra events:
- `form-ui:webhook-success`
- `form-ui:webhook-error`

### Booking Availability

Use `booking-availability` when your backend returns available slots, pricing,
or scheduling metadata for a selected service/date combination.

```ts
mountFormUI(container, {
  name: 'availability-form',
  title: 'Availability',
  provider: {
    type: 'booking-availability',
    endpoint: '/api/availability',
  },
  fields: [
    { name: 'service', label: 'Service', type: 'text', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
  ],
});
```

Request body:

```json
{
  "action": "booking-availability",
  "availability": {
    "service": "massage",
    "date": "2026-03-10"
  }
}
```

Typical backend response:

```json
{
  "slots": [
    { "value": "09:00", "label": "09:00" },
    { "value": "10:00", "label": "10:00" }
  ]
}
```

Extra events:
- `form-ui:booking-availability-success`
- `form-ui:booking-availability-error`

### Calendar Booking

Use `calendar-booking` when your backend confirms a selected slot and creates a
real booking record.

```ts
mountFormUI(container, {
  name: 'calendar-booking-form',
  title: 'Calendar Booking',
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

Typical backend response:

```json
{
  "confirmed": true,
  "bookingId": "bk_123"
}
```

Extra events:
- `form-ui:calendar-booking-success`
- `form-ui:calendar-booking-error`

### Calendar Cancel

Use `calendar-cancel` when your backend cancels an existing booking.

```ts
mountFormUI(container, {
  name: 'calendar-cancel-form',
  title: 'Calendar Cancel',
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

Typical backend response:

```json
{
  "cancelled": true,
  "bookingId": "bk_123"
}
```

Extra events:
- `form-ui:calendar-cancel-success`
- `form-ui:calendar-cancel-error`

### Calendar Reschedule

Use `calendar-reschedule` when your backend changes an existing booking to a
new date or slot.

```ts
mountFormUI(container, {
  name: 'calendar-reschedule-form',
  title: 'Calendar Reschedule',
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

Typical backend response:

```json
{
  "rescheduled": true,
  "bookingId": "bk_123"
}
```

Extra events:
- `form-ui:calendar-reschedule-success`
- `form-ui:calendar-reschedule-error`

### Approval Request

Use `approval-request` when your backend creates a request that may stay in a
`pending_approval` state before final approval.

```ts
mountFormUI(container, {
  name: 'approval-request-form',
  title: 'Approval Request',
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

Typical backend responses:

```json
{
  "status": "pending_approval",
  "approvalId": "apr_123"
}
```

```json
{
  "status": "approved",
  "approvalId": "apr_123"
}
```

Extra events:
- `form-ui:approval-request-success`
- `form-ui:approval-request-error`
- `form-ui:approval-requested`
- `form-ui:approval-complete`

### Approval Decision

Use `approval-decision` when your backend records the final approver decision on
an existing approval request.

```ts
mountFormUI(container, {
  name: 'approval-decision-form',
  title: 'Approval Decision',
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

Typical backend response:

```json
{
  "status": "completed",
  "approvalId": "apr_123"
}
```

Extra events:
- `form-ui:approval-decision-success`
- `form-ui:approval-decision-error`
- `form-ui:approval-state`

### Approval Comment

Use `approval-comment` when your backend stores notes, approver comments, or
audit trail messages linked to an approval request.

```ts
mountFormUI(container, {
  name: 'approval-comment-form',
  title: 'Approval Comment',
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

Typical backend response:

```json
{
  "saved": true,
  "commentId": "cmt_123"
}
```

Extra events:
- `form-ui:approval-comment-success`
- `form-ui:approval-comment-error`

### Email

Use `email` when your backend exposes a messaging endpoint and you want a
normalized request contract for outbound email workflows.

```ts
mountFormUI(container, {
  name: 'email-form',
  title: 'Email Form',
  provider: {
    type: 'email',
    endpoint: '/api/email/send',
  },
  fields: [
    { name: 'to', label: 'To', type: 'email', required: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true },
  ],
});
```

Request body:

```json
{
  "action": "email",
  "email": {
    "to": "user@example.com",
    "subject": "Welcome"
  }
}
```

Typical backend response:

```json
{
  "delivered": true,
  "messageId": "msg_123"
}
```

Extra events:
- `form-ui:email-success`
- `form-ui:email-error`

### CRM

Use `crm` when your backend creates or updates leads in a CRM system with a
normalized contact payload.

```ts
mountFormUI(container, {
  name: 'crm-form',
  title: 'CRM Form',
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

Typical backend response:

```json
{
  "accepted": true,
  "leadId": "lead_123"
}
```

Extra events:
- `form-ui:crm-success`
- `form-ui:crm-error`

Use `identity-verification` when your backend verifies scanned identity data
and you want a normalized request contract for KYC / onboarding workflows.

Request shape:

```json
{
  "action": "identity-verification",
  "identity": {
    "document_number": "L898902C3",
    "last_name": "ERIKSSON"
  }
}
```

Extra events:
- `form-ui:identity-verification-success`
- `form-ui:identity-verification-error`
- `identity-verification-stripe` and `identity-verification-webhook` follow the
  same normalized `identity` payload shape with provider-specific actions

## Dynamic Forms

The component supports two dynamic patterns out of the box:
- conditional visibility
- remote options for select fields
- basic rules (`AND` / `OR`, `show`, `hide`, `clear-value`)

```ts
mountFormUI(container, {
  name: 'dynamic-booking',
  title: 'Dynamic Booking',
  fields: [
    {
      name: 'service',
      label: 'Service',
      type: 'select-one',
      choices: [
        { value: 'consulting', label: 'Consulting' },
        { value: 'support', label: 'Support' },
      ],
    },
    {
      name: 'slot',
      label: 'Slot',
      type: 'select-one',
      visibleWhenField: 'service',
      visibleWhenEquals: 'consulting',
      optionsEndpoint: '/api/slots',
      optionsDependsOn: 'service',
    },
  ],
});
```

`select-multiple` works with remote options as well:

```ts
mountFormUI(container, {
  name: 'dynamic-topics',
  title: 'Dynamic Topics',
  fields: [
    {
      name: 'category',
      label: 'Category',
      type: 'select-one',
      choices: [
        { value: 'sales', label: 'Sales' },
        { value: 'support', label: 'Support' },
      ],
    },
    {
      name: 'topics',
      label: 'Topics',
      type: 'select-multiple',
      optionsEndpoint: '/api/topics',
      optionsDependsOn: 'category',
      optionsLabelKey: 'name',
      optionsValueKey: 'id',
    },
  ],
});
```

Extra event:
- `form-ui:options-loaded`
- `form-ui:rule-applied`
- `form-ui:rule-state`
- `form-ui:rule-template-missing-field`
- `form-ui:rule-template-warning-cleared`
- `form-ui:rule-template-warning-state`

## File Uploads

Use `type: 'file'` with `submit.mode: 'form-data'` when your backend expects
multipart uploads.

```ts
mountFormUI(container, {
  name: 'upload-form',
  title: 'Upload',
  submit: {
    endpoint: '/api/uploads',
    method: 'POST',
    mode: 'form-data',
    formDataArrayMode: 'brackets',
    uploadStrategy: 'standard',
  },
  fields: [
    {
      name: 'attachments',
      label: 'Attachments',
      type: 'file',
      accept: '.pdf,image/*,video/*',
      multiple: true,
      fileDropMode: 'append',
      minFiles: 1,
      maxFiles: 3,
      maxFileSizeMb: 10,
      maxTotalFileSizeMb: 20,
      formDataFieldName: 'documents',
      fileTypeErrorMsg: 'Only PDF, image, or video files are allowed.',
      fileSizeErrorMsg: 'Each file must stay below 10 MB.',
    },
  ],
});
```

For common upload cases, prefer `accept` over creating many custom field types:
- documents: `.pdf,.doc,.docx,.xls,.xlsx`
- images: `image/*`
- videos: `video/*`

Frontend behavior:
- file inputs keep real `File` objects in memory until submit
- local draft storage only keeps file metadata, not blobs
- offline queue is disabled for forms that include file fields
- the default upload area accepts drag-and-drop
- `fileDropMode: 'append'` merges dropped files with the current selection
- selected files can be removed one by one in the default UI
- `accept: 'image/*'` shows a simple image preview before submit
- `capture: 'user' | 'environment'` can hint mobile browsers to open the camera
- `type: 'camera-photo'` is a shorthand for camera-first image capture
- `type: 'qr-scan'` captures or uploads an image, then decodes it through the
  native `BarcodeDetector` API when available
- `type: 'document-scan'` gives a simple front/back document capture flow with
  framed previews for ID cards and similar documents
- `minFiles` sets a minimum file count for multi-upload fields
- `maxFiles` limits how many files can be selected
- `maxTotalFileSizeMb` limits the total size across all selected files
- `fileTypeErrorMsg` and `fileSizeErrorMsg` let you override default validation messages
- `formDataFieldName` overrides the multipart field key for one file field
- `submit.formDataArrayMode: 'brackets' | 'repeat'` controls whether repeated
  file fields are sent as `attachments[]` or `attachments`
- `submit.uploadStrategy: 'presigned'` uploads files first, then submits the
  resulting URLs to your backend
- `qr-scan` can start a live camera session and scan directly from the video
  stream when `getUserMedia` and `BarcodeDetector` are available
- `document-scan` keeps a lightweight two-slot front/back workflow; its
  images are now center-cropped to an ID-card ratio before submit
- when `TextDetector` is available, `document-scan` can emit OCR text and a
  lightweight MRZ parse for machine-readable identity documents
- `documentTextTargetField` can mirror detected OCR text into another field
- `documentMrzTargetField` can mirror parsed MRZ data into another field
- `requireValidDocumentMrz: true` blocks validation if the parsed MRZ checksum
  fails
- `documentFirstNameTargetField`, `documentLastNameTargetField`,
  `documentNumberTargetField`, `documentNationalityTargetField`,
  `documentBirthDateTargetField`, `documentExpiryDateTargetField`,
  `documentSexTargetField` can autopopulate normalized identity fields
- `submit.includeDocumentData: true` injects the normalized `document` object
  directly into submitted values
- `submit.documentDataMode` controls redaction: `full`, `summary`,
  `fields-only`, `mrz-only`, `none`
- `submit.documentFieldPaths` can further whitelist exact paths such as
  `mrz.documentNumber`, `mrz.valid`, `fields.firstName`

Extra event:
- `form-ui:file-validation-error`
- `form-ui:queue-disabled-for-files`
- `form-ui:upload-start`
- `form-ui:upload-progress`
- `form-ui:upload-complete`
- `form-ui:upload-error`
- `form-ui:qr-scan-success`
- `form-ui:qr-scan-error`
- `form-ui:document-scan-cropped`
- `form-ui:document-scan-bounds-detected`
- `form-ui:document-text-detected`
- `form-ui:document-mrz-detected`
- `form-ui:document-data`
- `form-ui:document-fields-populated`

You can also define basic rules at the form level:

```ts
mountFormUI(container, {
  name: 'rules-form',
  title: 'Rules',
  rules: [
    {
      id: 'show-notes-for-priority-consulting',
      logic: 'AND',
      conditions: [
        { field: 'service', operator: 'equals', value: 'consulting' },
        { field: 'urgency', operator: 'equals', value: 'high' },
      ],
      actions: [
        { type: 'show', field: 'notes' },
      ],
    },
  ],
  fields: [
    { name: 'service', label: 'Service', type: 'text' },
    { name: 'urgency', label: 'Urgency', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Current rule scope:
- optional rule id: `id`
- condition logic: `AND`, `OR`
- condition operators: `equals`, `not_equals`, `contains`, `in`, `gt`, `lt`, `exists`, `empty`
- actions: `show`, `hide`, `enable`, `disable`, `clear-value`, `set-value`, `fetch-options`, `set-error`, `lock-submit`
- `set-value` can use a constant via `value`, copy another field via `sourceField`, or compose multiple fields via `template` (`{{firstName}} {{lastName}}`)
- `set-value` can also transform the written value with `transform`: `copy`, `trim`, `lowercase`, `uppercase`, `slugify`
- `set-error` shows a field-level error message through the normal form error UI
- `lock-submit` disables submit buttons and emits `form-ui:submit-locked` until the rule no longer matches

## Local Draft Storage

The runtime can persist draft values in the browser with `localStorage`.

```ts
mountFormUI(container, {
  name: 'inspection-form',
  title: 'Inspection',
  storage: {
    mode: 'draft',
    adapter: 'local-storage',
    key: 'xpressui:inspection-draft',
    autoSaveMs: 300,
  },
  fields: [
    { name: 'site', label: 'Site', type: 'text', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
});
```

Current storage support:
- `mode: 'draft'`
- `mode: 'queue'`
- `mode: 'draft-and-queue'`
- `adapter: 'local-storage'`
- `adapter: 'indexeddb'`
- `resumeEndpoint`
- `resumeTokenTtlDays`
- `encryptionKey`
- `retentionDays`
- `retentionDraftDays`
- `retentionQueueDays`
- `retentionDeadLetterDays`

`indexeddb` currently uses a compatibility-first local cache plus IndexedDB
write-through, so the runtime API stays synchronous while still persisting to a
browser database when available.

If you need the freshest async-backed snapshot, call:
- `runtime.hydrateStorage()`
- `admin.getSnapshotAsync()`
- `admin.exportSnapshotAsync()`

If `retentionDays` is set, expired drafts, queue entries, and dead-letter
entries are pruned automatically when storage is read.

You can override retention per storage type with:
- `retentionDraftDays`
- `retentionQueueDays`
- `retentionDeadLetterDays`

If `encryptionKey` is set, local storage payloads are stored with a synchronous
best-effort encrypted wrapper (`enc:v1:`). This keeps the API synchronous, but
it is still browser-side protection, not a replacement for server-side security.

For `file` fields, local draft storage keeps metadata only (`name`, `size`,
`mimeType`). The user must re-select files after a page reload. Use
`submit.mode: 'form-data'` to send real blobs/files to your backend.
If the form contains file fields, offline queue mode is disabled and uploads are
not retried automatically.

Draft events:
- `form-ui:draft-saved`
- `form-ui:draft-restored`
- `form-ui:draft-cleared`
- `form-ui:storage-migrated`
- `form-ui:resume-token-created`
- `form-ui:resume-token-restored`
- `form-ui:resume-token-deleted`
- `form-ui:resume-token-invalidated`
- `form-ui:resume-token-expired`

Queue events:
- `form-ui:queued`
- `form-ui:queue-state`
- `form-ui:queue-disabled-for-files`
- `form-ui:sync-success`
- `form-ui:sync-error`
- `form-ui:dead-lettered`
- `form-ui:dead-letter-cleared`
- `form-ui:dead-letter-requeued`
- `form-ui:dead-letter-replayed-success`
- `form-ui:dead-letter-replayed-error`

Runtime inspection helpers:
- `form.getQueueState()`
- `form.getStorageSnapshot()`
- `form.getStorageHealth()`
- `form.createResumeToken()`
- `form.createResumeTokenAsync()`
- `form.listResumeTokens()`
- `form.deleteResumeToken(token)`
- `form.invalidateResumeToken(token)`
- `form.lookupResumeToken(token)`
- `form.restoreFromResumeToken(token)`
- `form.restoreFromResumeTokenAsync(token)`
- `form.clearDeadLetterQueue()`
- `form.requeueDeadLetterEntry(entryId)`
- `form.replayDeadLetterEntry(entryId)`

`createResumeToken()` stores a local resume snapshot and returns a token scoped
to the current form name. `restoreFromResumeToken(token)` reloads that snapshot
back into the form draft state and restores field values in `FormUI`.
`listResumeTokens()` returns the local token inventory for the current form, and
`deleteResumeToken(token)` removes one.

If `resumeEndpoint` is configured:
- `createResumeTokenAsync()` sends the snapshot to your backend and returns the remote token
- remote tokens are cached locally so `listResumeTokens()` can still show them
- `lookupResumeToken(token)` fetches token metadata and snapshot details
- `restoreFromResumeTokenAsync(token)` restores from the backend snapshot
- `invalidateResumeToken(token)` sends a `DELETE` request for the token and removes the local token cache

If `resumeTokenTtlDays` is set, expired resume tokens are pruned on listing and
restoring. `resumeEndpoint` is stored as metadata on each token so the same
config can later evolve toward a backend-based cross-device resume flow.

Standalone local admin helper:
- `createLocalFormAdmin(formConfig)`
- `admin.getStorageHealth()`
- `admin.listResumeTokens()`
- `admin.deleteResumeToken(token)`
- `admin.invalidateResumeToken(token)`

It can inspect and manage local state without a mounted `FormUI` instance:
- `getSnapshot()`
- `exportSnapshot()`
- `importSnapshot(snapshot, mode?)`
- `listQueue(query?)`
- `listDeadLetter(query?)`
- `clearDraft()`
- `clearQueue()`
- `clearDeadLetter()`
- `purgeQueue(query?)`
- `purgeDeadLetter(query?)`
- `requeueDeadLetterEntry(entryId)`
- `requeueDeadLetterEntries(query?)`
- `replayDeadLetterEntry(entryId)`
- `replayDeadLetterEntries(query?)`

Import modes:
- `replace`
- `merge`

Query options:
- `minAttempts`
- `maxAttempts`
- `search`
- `minAgeMs`
- `maxAgeMs`
- `nextAttemptBefore`
- `nextAttemptAfter`
- `errorText`
- `sortBy` (`createdAt`, `updatedAt`, `attempts`, `nextAttemptAt`)
- `sortOrder` (`asc`, `desc`)
- `limit`

The local queue is now stored as a versioned object so it can evolve without
breaking existing drafts:

```json
{
  "version": 1,
  "items": []
}
```

If the same queued submission keeps failing, it is moved to a local
dead-letter queue after 3 failed sync attempts.

## Field Features

Useful field capabilities supported by the current builder:
- `required`
- `placeholder`
- `helpText`
- `choices` for select fields
- `visibleWhenField`
- `visibleWhenEquals`
- `optionsEndpoint`
- `optionsDependsOn`
- `optionsLabelKey`
- `optionsValueKey`
- `accept` for file fields
- `multiple` for file fields
- `fileDropMode` for file fields
- `minFiles` for file fields
- `maxFiles` for file fields
- `maxFileSizeMb` for file fields
- `maxTotalFileSizeMb` for file fields
- `formDataFieldName` for file fields
- `approval-state` read-only status fields

Common field types used today:
- `text`
- `textarea`
- `email`
- `tel`
- `number`
- `price`
- `datetime`
- `select-one`
- `select-multiple`
- `file`
- `camera-photo`
- `qr-scan`
- `document-scan`
- `approval-state`
- `checkbox`

## Multi-step Forms

If a form defines multiple sections, `FormUI` can now navigate them as a simple
wizard without changing your submit contract.

Helpers:
- `form.getStepNames()`
- `form.getCurrentStepIndex()`
- `form.getCurrentStepName()`
- `form.validateCurrentStep()`
- `form.goToStep(index)`
- `form.nextStep()`
- `form.previousStep()`

Behavior:
- `Back` / `Next` buttons are injected automatically when more than one step exists
- button labels can be configured with `stepLabels.previous` / `stepLabels.next`
- a built-in progress indicator shows `Step X of Y` with percentage
- a section can be marked optional with `data-step-skippable="true"` (or `stepSkippable: true`)
- a section can be marked `stepSummary: true` to show a simple review summary before submit
- a section can jump declaratively with `stepTransitions`, or use the older `nextStepWhen*` fields for compatibility
- `stepFactory.section(...)` and `stepFactory.transition(...)` are available to build wizard presets programmatically
- `nextStep()` validates the current step before advancing
- optional steps can advance without passing validation
- a section can restrict validation to specific workflow states with `stepValidateWhenWorkflowStates`
- submit buttons stay disabled until the last step
- submitting before the last step advances to the next valid step instead of final submit
- the current step is persisted in drafts and resume tokens
- `stepSections` is available as a clearer public alias for step metadata, while `sections.custom` remains supported for compatibility
- `FormStepRuntime` now holds the reusable step-navigation logic shared by `FormUI` and `FormRuntime`
- wizard presets are available through `createFormPreset('booking-wizard')` and `createFormPreset('identity-onboarding')`

Headless runtime:
- `runtime.getStepNames()`
- `runtime.getCurrentStepIndex()`
- `runtime.getCurrentStepName()`
- `runtime.getStepProgress()`
- `runtime.getWorkflowState()`
- `runtime.setWorkflowState(state)`
- `runtime.validateCurrentStep()`
- `runtime.goToStep(index)`
- `runtime.nextStep()`
- `runtime.previousStep()`

Event:
- `form-ui:step-change`
- `form-ui:step-blocked`
- `form-ui:step-skipped`
- `form-ui:step-jumped`
- `form-ui:workflow-step`
- `form-ui:provider-transition`

## Events

Core events emitted by `<form-ui>`:
- `form-ui:submit`
- `form-ui:submit-success`
- `form-ui:submit-error`
- `form-ui:options-loaded`
- `form-ui:rule-applied`
- `form-ui:rule-state`
- `form-ui:rule-template-missing-field`
- `form-ui:rule-template-warning-cleared`
- `form-ui:rule-template-warning-state`
- `form-ui:draft-saved`
- `form-ui:draft-restored`
- `form-ui:draft-cleared`
- `form-ui:queued`
- `form-ui:queue-state`
- `form-ui:sync-success`
- `form-ui:sync-error`
- `form-ui:dead-lettered`
- `form-ui:dead-letter-cleared`
- `form-ui:dead-letter-requeued`
- `form-ui:dead-letter-replayed-success`
- `form-ui:dead-letter-replayed-error`

Provider-specific events:
- `form-ui:reservation-success`
- `form-ui:payment-success`
- `form-ui:payment-error`
- `form-ui:payment-stripe-success`
- `form-ui:payment-stripe-error`
- `form-ui:webhook-success`
- `form-ui:webhook-error`
- `form-ui:booking-availability-success`
- `form-ui:booking-availability-error`
- `form-ui:calendar-booking-success`
- `form-ui:calendar-booking-error`
- `form-ui:calendar-cancel-success`
- `form-ui:calendar-cancel-error`
- `form-ui:calendar-reschedule-success`
- `form-ui:calendar-reschedule-error`
- `form-ui:approval-request-success`
- `form-ui:approval-request-error`
- `form-ui:approval-requested`
- `form-ui:approval-complete`
- `form-ui:approval-decision-success`
- `form-ui:approval-decision-error`
- `form-ui:approval-state`
- `form-ui:approval-comment-success`
- `form-ui:approval-comment-error`
- `form-ui:workflow-state`
- `form-ui:email-success`
- `form-ui:email-error`
- `form-ui:crm-success`
- `form-ui:crm-error`

Event detail includes:
- `values`
- `formConfig`
- `submit`
- `response` when an API call happened
- `result` when the backend returned data
- `error` on failures

Approval helpers:
- `form.getApprovalState()`
- `form.getWorkflowState()`

## Advanced Usage

If you need more control, you can generate the HTML template yourself:

```ts
import { createFormConfig, createTemplateMarkup } from '@lybaba/xpressui';

const formConfig = createFormConfig({
  name: 'custom-form',
  title: 'Custom Form',
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ],
});

const markup = createTemplateMarkup(formConfig);
document.getElementById('app')!.innerHTML = markup;
```

## Development

```bash
npm install
npm run test
npm run check
npm run build
npm run start
```

Project tooling:
- Vite 7
- TypeScript 5
- Tailwind CSS 4
- daisyUI 5
- Vitest

## Backend Contracts

For concrete request and response examples, see:

- [`docs/backend-integration.md`](./docs/backend-integration.md)

## Status

What is stable in the current codebase:
- Web Component rendering
- schema-based validation
- API submission hooks
- reservation, payment, Stripe, webhook, booking-availability, calendar booking, calendar cancel, calendar reschedule, approval-request, approval-decision, approval-comment, and email provider flows
- conditional fields and remote select loading
- local draft persistence in the browser
- local offline submission queue

What is not implemented as a full product yet:
- visual form builder UI
- persistent hosted backend
- prebuilt Stripe Elements integration
- auth/session management
- production-ready analytics, audit trail, and admin workflows

## License

MIT © [lybaba](https://github.com/lybaba)
